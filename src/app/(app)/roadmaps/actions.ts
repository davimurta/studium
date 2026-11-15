"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import {
  editItemSchema,
  newItemSchema,
  reorderSchema,
  roadmapFormSchema,
} from "@/lib/validation/roadmap";
import { statusSchema } from "@/lib/validation/topic";

export type FormState =
  | { ok: true; at: number }
  | { ok: false; error: string; at: number }
  | undefined;

const fail = (error: string): FormState => ({ ok: false, error, at: Date.now() });
const done = (): FormState => ({ ok: true, at: Date.now() });

function refresh() {
  // Sidebar (contadores e Recentes), listas e paginas de detalhe.
  revalidatePath("/", "layout");
}

async function touchRoadmap(id: string) {
  await db.roadmap.update({ where: { id }, data: { updatedAt: new Date() } });
}

// Etapa so pode ser alterada se o roadmap dela for do usuario.
async function findOwnedItem(userId: string, itemId: string) {
  return db.roadmapItem.findFirst({
    where: { id: itemId, roadmap: { userId } },
    select: { id: true, roadmapId: true, topicId: true, status: true, topic: { select: { status: true } } },
  });
}

async function ownsTopic(userId: string, topicId: string) {
  const topic = await db.topic.findFirst({ where: { id: topicId, userId }, select: { id: true, title: true } });
  return topic;
}

/* Roadmap */

export async function createRoadmap(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = roadmapFormSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const roadmap = await db.roadmap.create({ data: { ...parsed.data, userId }, select: { id: true } });
  refresh();
  redirect(`/roadmaps/${roadmap.id}`);
}

export async function updateRoadmap(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = roadmapFormSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { count } = await db.roadmap.updateMany({ where: { id, userId }, data: parsed.data });
  if (count === 0) return fail("Roadmap não encontrado.");
  refresh();
  return done();
}

export async function deleteRoadmap(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.roadmap.deleteMany({ where: { id, userId } });
  refresh();
  redirect("/roadmaps");
}

/* Etapas */

export async function addItem(roadmapId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const roadmap = await db.roadmap.findFirst({ where: { id: roadmapId, userId }, select: { id: true } });
  if (!roadmap) return fail("Roadmap não encontrado.");

  const parsed = newItemSchema.safeParse({
    mode: formData.get("mode"),
    title: formData.get("title") ?? "",
    status: formData.get("status") ?? "NOT_STARTED",
    topicId: formData.get("topicId") ?? "",
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const last = await db.roadmapItem.aggregate({ where: { roadmapId }, _max: { position: true } });
  const position = (last._max.position ?? -1) + 1;

  if (parsed.data.mode === "topico") {
    const topic = await ownsTopic(userId, parsed.data.topicId);
    if (!topic) return fail("Tópico não encontrado.");
    await db.roadmapItem.create({
      data: { roadmapId, topicId: topic.id, title: topic.title, position },
    });
  } else {
    await db.roadmapItem.create({
      data: { roadmapId, title: parsed.data.title, status: parsed.data.status, position },
    });
  }

  await touchRoadmap(roadmapId);
  refresh();
  return done();
}

export async function updateItem(itemId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const item = await findOwnedItem(userId, itemId);
  if (!item) return fail("Etapa não encontrada.");

  const parsed = editItemSchema.safeParse({
    title: formData.get("title") ?? "",
    topicId: formData.get("topicId") ?? "",
    status: formData.get("status") ?? item.status,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { title, topicId } = parsed.data;
  if (topicId && !(await ownsTopic(userId, topicId))) return fail("Tópico não encontrado.");

  // Com topico, o status vem dele e o da etapa nao muda. Sem topico, vale o escolhido no form
  // (o form ja sugere o status do topico ao desvincular).
  const status = topicId ? item.status : parsed.data.status;

  await db.roadmapItem.update({ where: { id: itemId }, data: { title, topicId, status } });
  await touchRoadmap(item.roadmapId);
  refresh();
  return done();
}

export async function removeItem(itemId: string): Promise<{ error?: string }> {
  const userId = await requireUserId();
  const item = await findOwnedItem(userId, itemId);
  if (!item) return { error: "Etapa não encontrada." };

  await db.$transaction(async (tx) => {
    await tx.roadmapItem.delete({ where: { id: itemId } });
    const rest = await tx.roadmapItem.findMany({
      where: { roadmapId: item.roadmapId },
      orderBy: { position: "asc" },
      select: { id: true, position: true },
    });
    for (const [index, r] of rest.entries()) {
      if (r.position !== index) await tx.roadmapItem.update({ where: { id: r.id }, data: { position: index } });
    }
    await tx.roadmap.update({ where: { id: item.roadmapId }, data: { updatedAt: new Date() } });
  });
  refresh();
  return {};
}

// Etapa ligada: muda o status do topico (e todas as etapas ligadas a ele refletem).
export async function setItemStatus(itemId: string, status: string): Promise<{ error?: string }> {
  const userId = await requireUserId();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: "Status inválido." };
  const item = await findOwnedItem(userId, itemId);
  if (!item) return { error: "Etapa não encontrada." };

  if (item.topicId) {
    await db.topic.updateMany({ where: { id: item.topicId, userId }, data: { status: parsed.data } });
  } else {
    await db.roadmapItem.update({ where: { id: itemId }, data: { status: parsed.data } });
  }
  await touchRoadmap(item.roadmapId);
  refresh();
  return {};
}

// Recebe a nova ordem completa e grava as posicoes alteradas em uma transacao.
export async function reorderItems(roadmapId: string, orderedIds: string[]): Promise<{ error?: string }> {
  const userId = await requireUserId();
  const parsed = reorderSchema.safeParse(orderedIds);
  if (!parsed.success) return { error: "Ordem inválida." };

  const roadmap = await db.roadmap.findFirst({
    where: { id: roadmapId, userId },
    select: { items: { select: { id: true, position: true } } },
  });
  if (!roadmap) return { error: "Roadmap não encontrado." };

  const current = new Map(roadmap.items.map((i) => [i.id, i.position]));
  const ids = parsed.data;
  if (ids.length !== current.size || new Set(ids).size !== ids.length || ids.some((id) => !current.has(id))) {
    return { error: "A lista de etapas mudou. Recarregue a página." };
  }

  const changed = ids
    .map((id, position) => ({ id, position }))
    .filter(({ id, position }) => current.get(id) !== position);

  await db.$transaction([
    ...changed.map(({ id, position }) =>
      db.roadmapItem.update({ where: { id }, data: { position } }),
    ),
    db.roadmap.update({ where: { id: roadmapId }, data: { updatedAt: new Date() } }),
  ]);
  refresh();
  return {};
}
