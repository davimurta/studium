"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { isScheduled, periodFor } from "@/lib/routine";
import { keyToDate, todayKey } from "@/lib/study-days";
import { noteSchema } from "@/lib/validation/topic";
import { languageFormSchema, periodKeySchema, routineItemSchema } from "@/lib/validation/language";

export type FormState = { ok: true; at: number } | { ok: false; error: string; at: number } | undefined;

const fail = (error: string): FormState => ({ ok: false, error, at: Date.now() });

function refresh() {
  // Marcar a rotina cria sessoes de estudo: dashboard, topicos e sidebar mudam junto.
  revalidatePath("/", "layout");
}

/* Linguas */

function readLanguage(formData: FormData) {
  return languageFormSchema.safeParse({
    name: formData.get("name") ?? "",
    level: formData.get("level") ?? "",
    goal: formData.get("goal") ?? "",
    status: formData.get("status") ?? "PLANNED",
    targetHours: formData.get("targetHours") ?? "",
  });
}

const TOPIC_STATUS = { ACTIVE: "STUDYING", MAINTENANCE: "STUDYING", PLANNED: "NOT_STARTED", NATIVE: "DONE" } as const;

export async function createLanguage(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = readLanguage(formData);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const data = parsed.data;

  await db.$transaction(async (tx) => {
    const last = await tx.language.findFirst({
      where: { userId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    // Cada lingua ganha um topico: notas, recursos e sessoes ficam la e entram no dashboard.
    const topic =
      data.status === "NATIVE"
        ? null
        : await tx.topic.create({
            data: {
              userId,
              title: data.name,
              description:
                [data.level && `Nível: ${data.level}`, data.goal && `Meta: ${data.goal}`].filter(Boolean).join(". ") ||
                null,
              tags: ["línguas"],
              status: TOPIC_STATUS[data.status],
            },
            select: { id: true },
          });
    await tx.language.create({
      data: { ...data, userId, position: (last?.position ?? -1) + 1, topicId: topic?.id ?? null },
    });
  });
  refresh();
  return { ok: true, at: Date.now() };
}

export async function updateLanguage(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = readLanguage(formData);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { count } = await db.language.updateMany({ where: { id, userId }, data: parsed.data });
  if (count === 0) return fail("Língua não encontrada.");
  refresh();
  return { ok: true, at: Date.now() };
}

// Exclui a lingua. O topico (notas e sessoes) continua; itens da rotina ficam como "Geral".
export async function deleteLanguage(id: string): Promise<{ error?: string }> {
  const userId = await requireUserId();
  const { count } = await db.language.deleteMany({ where: { id, userId } });
  if (count === 0) return { error: "Língua não encontrada." };
  refresh();
  return {};
}

/* Itens da rotina */

type ItemResult = { ok: true; data: ReturnType<typeof routineItemSchema.parse> } | { ok: false; error: string };

async function readItem(userId: string, formData: FormData): Promise<ItemResult> {
  const raw = {
    title: formData.get("title") ?? "",
    details: formData.get("details") ?? "",
    languageId: formData.get("languageId") ?? "",
    frequency: formData.get("frequency") ?? "DAILY",
    weekdays: formData.getAll("weekdays"),
    minutes: formData.get("minutes") || "0",
  };
  if (raw.frequency === "DAILY" && raw.weekdays.length === 0) {
    return { ok: false, error: "Escolha pelo menos um dia da semana." };
  }
  const parsed = routineItemSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (parsed.data.languageId) {
    const language = await db.language.findFirst({
      where: { id: parsed.data.languageId, userId },
      select: { id: true },
    });
    if (!language) return { ok: false, error: "Língua não encontrada." };
  }
  return { ok: true, data: parsed.data };
}

export async function createRoutineItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const result = await readItem(userId, formData);
  if (!result.ok) return fail(result.error);

  const last = await db.routineItem.findFirst({
    where: { userId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await db.routineItem.create({ data: { ...result.data, userId, position: (last?.position ?? -1) + 1 } });
  refresh();
  return { ok: true, at: Date.now() };
}

export async function updateRoutineItem(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const result = await readItem(userId, formData);
  if (!result.ok) return fail(result.error);
  const { count } = await db.routineItem.updateMany({
    where: { id, userId, archivedAt: null },
    data: result.data,
  });
  if (count === 0) return fail("Item não encontrado.");
  refresh();
  return { ok: true, at: Date.now() };
}

// Tira o item da rotina sem apagar o historico (marcacoes e sessoes ficam).
export async function archiveRoutineItem(id: string): Promise<{ error?: string }> {
  const userId = await requireUserId();
  const { count } = await db.routineItem.updateMany({
    where: { id, userId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (count === 0) return { error: "Item não encontrado." };
  refresh();
  return {};
}

// Sobe ou desce o item entre os da mesma frequencia.
export async function moveRoutineItem(id: string, direction: "up" | "down"): Promise<{ error?: string }> {
  const userId = await requireUserId();
  const item = await db.routineItem.findFirst({
    where: { id, userId, archivedAt: null },
    select: { frequency: true },
  });
  if (!item) return { error: "Item não encontrado." };
  const siblings = await db.routineItem.findMany({
    where: { userId, archivedAt: null, frequency: item.frequency },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const ids = siblings.map((s) => s.id);
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= ids.length) return {};
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await db.$transaction(
    ids.map((itemId, position) => db.routineItem.update({ where: { id: itemId }, data: { position } })),
  );
  refresh();
  return {};
}

/* Marcar e desmarcar */

/*
  Marca ou desmarca um item num periodo. No item diario com minutos e lingua,
  marcar cria a sessao de estudo no topico da lingua; desmarcar apaga essa sessao.
*/
export async function toggleRoutineCheck(itemId: string, key: string): Promise<{ error?: string }> {
  const userId = await requireUserId();
  if (!periodKeySchema.safeParse(key).success) return { error: "Data inválida." };
  if (key > todayKey()) return { error: "Não dá para marcar um dia que ainda não chegou." };

  const item = await db.routineItem.findFirst({
    where: { id: itemId, userId },
    select: {
      id: true,
      frequency: true,
      weekdays: true,
      minutes: true,
      title: true,
      language: { select: { topicId: true } },
    },
  });
  if (!item) return { error: "Item não encontrado." };
  if (item.frequency === "DAILY" && !isScheduled(item, key)) {
    return { error: "Esse item não está na rotina desse dia." };
  }
  const period = keyToDate(periodFor(item.frequency, key));

  const existing = await db.routineCheck.findUnique({
    where: { itemId_period: { itemId, period } },
    select: { id: true, studyLogId: true },
  });

  if (existing) {
    await db.$transaction(async (tx) => {
      await tx.routineCheck.delete({ where: { id: existing.id } });
      if (existing.studyLogId) await tx.studyLog.deleteMany({ where: { id: existing.studyLogId, userId } });
    });
  } else {
    const topicId = item.frequency === "DAILY" && item.minutes > 0 ? item.language?.topicId : null;
    try {
      await db.$transaction(async (tx) => {
        const log = topicId
          ? await tx.studyLog.create({
              data: { userId, topicId, minutes: item.minutes, date: period },
              select: { id: true },
            })
          : null;
        if (topicId) await tx.topic.update({ where: { id: topicId }, data: { updatedAt: new Date() } });
        await tx.routineCheck.create({
          data: { itemId, userId, period, minutes: item.minutes, studyLogId: log?.id ?? null },
        });
      });
    } catch (e) {
      // Dois cliques ao mesmo tempo: a outra requisicao ja marcou (indice unico). Nada a fazer.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
  }
  refresh();
  return {};
}

/* Plano */

export async function savePlan(content: string): Promise<{ updatedAt?: string; error?: string }> {
  const userId = await requireUserId();
  const parsed = noteSchema.safeParse(content);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const plan = await db.languagePlan.upsert({
    where: { userId },
    create: { userId, content: parsed.data },
    update: { content: parsed.data },
    select: { updatedAt: true },
  });
  return { updatedAt: plan.updatedAt.toISOString() };
}
