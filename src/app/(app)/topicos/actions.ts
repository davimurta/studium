"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import {
  noteSchema,
  resourceSchema,
  statusSchema,
  titleSchema,
  topicFormSchema,
} from "@/lib/validation/topic";

export type TopicFormState =
  | { ok: true; id: string; at: number }
  | { ok: false; error: string; at: number }
  | undefined;

function readTopicForm(formData: FormData) {
  return topicFormSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    tags: formData.get("tags") ?? "",
    status: formData.get("status") ?? "NOT_STARTED",
  });
}

function refresh(topicId?: string) {
  // Layout inteiro: a sidebar mostra contadores.
  revalidatePath("/", "layout");
  if (topicId) revalidatePath(`/topicos/${topicId}`);
}

export async function createTopic(_prev: TopicFormState, formData: FormData): Promise<TopicFormState> {
  const userId = await requireUserId();
  const parsed = readTopicForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message, at: Date.now() };

  const topic = await db.topic.create({
    data: { ...parsed.data, userId },
    select: { id: true },
  });
  refresh();
  return { ok: true, id: topic.id, at: Date.now() };
}

export async function updateTopic(
  id: string,
  _prev: TopicFormState,
  formData: FormData,
): Promise<TopicFormState> {
  const userId = await requireUserId();
  const parsed = readTopicForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message, at: Date.now() };

  const { count } = await db.topic.updateMany({ where: { id, userId }, data: parsed.data });
  if (count === 0) return { ok: false, error: "Tópico não encontrado.", at: Date.now() };
  refresh(id);
  return { ok: true, id, at: Date.now() };
}

export async function renameTopic(id: string, title: string): Promise<{ error?: string }> {
  const userId = await requireUserId();
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { count } = await db.topic.updateMany({ where: { id, userId }, data: { title: parsed.data } });
  if (count === 0) return { error: "Tópico não encontrado." };
  refresh(id);
  return {};
}

export async function setTopicStatus(id: string, status: string): Promise<{ error?: string }> {
  const userId = await requireUserId();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: "Status inválido." };

  const { count } = await db.topic.updateMany({ where: { id, userId }, data: { status: parsed.data } });
  if (count === 0) return { error: "Tópico não encontrado." };
  refresh(id);
  return {};
}

export async function archiveTopic(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.topic.updateMany({ where: { id, userId, archivedAt: null }, data: { archivedAt: new Date() } });
  refresh(id);
  redirect("/topicos");
}

export async function unarchiveTopic(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.topic.updateMany({ where: { id, userId }, data: { archivedAt: null } });
  refresh(id);
}

export async function deleteTopic(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.topic.deleteMany({ where: { id, userId } });
  refresh();
  redirect("/topicos");
}

/* Notas */

export async function saveNote(
  topicId: string,
  content: string,
): Promise<{ updatedAt?: string; error?: string }> {
  const userId = await requireUserId();
  const parsed = noteSchema.safeParse(content);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const topic = await db.topic.findFirst({ where: { id: topicId, userId }, select: { id: true } });
  if (!topic) return { error: "Tópico não encontrado." };

  const note = await db.note.upsert({
    where: { topicId },
    create: { topicId, content: parsed.data },
    update: { content: parsed.data },
    select: { updatedAt: true },
  });
  // Sem revalidatePath: o editor ja mostra o conteudo e evita re-render a cada tecla salva.
  return { updatedAt: note.updatedAt.toISOString() };
}

/* Recursos */

export type ResourceFormState =
  | { ok: boolean; error?: string; at: number; values?: { title: string; url: string } }
  | undefined;

export async function addResource(
  topicId: string,
  _prev: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const userId = await requireUserId();
  const topic = await db.topic.findFirst({ where: { id: topicId, userId }, select: { id: true } });
  if (!topic) return { ok: false, error: "Tópico não encontrado.", at: Date.now() };

  const values = { title: String(formData.get("title") ?? ""), url: String(formData.get("url") ?? "") };
  const parsed = resourceSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message, at: Date.now(), values };

  await db.resource.create({ data: { topicId, ...parsed.data } });
  revalidatePath(`/topicos/${topicId}`);
  return { ok: true, at: Date.now() };
}

export async function removeResource(resourceId: string): Promise<{ error?: string }> {
  const userId = await requireUserId();
  const resource = await db.resource.findFirst({
    where: { id: resourceId, topic: { userId } },
    select: { topicId: true },
  });
  if (!resource) return { error: "Recurso não encontrado." };
  await db.resource.delete({ where: { id: resourceId } });
  revalidatePath(`/topicos/${resource.topicId}`);
  return {};
}
