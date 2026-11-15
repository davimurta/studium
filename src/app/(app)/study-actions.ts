"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { keyToDate, todayKey } from "@/lib/study-days";
import { studyLogSchema } from "@/lib/validation/topic";

export type StudyLogState =
  | { ok: true; at: number }
  | { ok: false; error: string; at: number; values?: Record<string, string> }
  | undefined;

// Registra uma sessao de estudo. Pode haver varias no mesmo dia.
export async function logStudy(_prev: StudyLogState, formData: FormData): Promise<StudyLogState> {
  const userId = await requireUserId();
  const values = {
    topicId: String(formData.get("topicId") ?? ""),
    minutes: String(formData.get("minutes") ?? ""),
    date: String(formData.get("date") ?? ""),
  };
  const fail = (error: string): StudyLogState => ({ ok: false, error, at: Date.now(), values });

  const parsed = studyLogSchema.safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { topicId, minutes, date } = parsed.data;
  const day = keyToDate(date);
  if (Number.isNaN(day.getTime()) || date < "2000-01-01") return fail("Informe uma data válida.");
  if (date > todayKey()) return fail("A data não pode estar no futuro.");

  const topic = await db.topic.findFirst({ where: { id: topicId, userId }, select: { id: true } });
  if (!topic) return fail("Tópico não encontrado.");

  await db.$transaction([
    db.studyLog.create({ data: { userId, topicId, minutes, date: day } }),
    // Estudar conta como atividade no tópico (lista "Atualizado" e "Em andamento").
    db.topic.update({ where: { id: topicId }, data: { updatedAt: new Date() } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true, at: Date.now() };
}
