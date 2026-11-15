import { z } from "zod";
import { Status } from "@/generated/prisma/enums";

export const statusSchema = z.enum([Status.NOT_STARTED, Status.STUDYING, Status.DONE]);

// "react, Next.js , react" -> ["react", "Next.js"]
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(",")) {
    const tag = part.trim().slice(0, 30);
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }
  return tags.slice(0, 10);
}

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Informe um título.")
  .max(120, "O título pode ter até 120 caracteres.");

export const topicFormSchema = z.object({
  title: titleSchema,
  description: z
    .string()
    .trim()
    .max(1000, "A descrição pode ter até 1000 caracteres.")
    .transform((v) => (v === "" ? null : v)),
  tags: z.string().transform(parseTags),
  status: statusSchema,
});

export type TopicFormInput = z.input<typeof topicFormSchema>;

export const noteSchema = z.string().max(100_000, "A nota pode ter até 100 mil caracteres.");

export const resourceSchema = z.object({
  title: z.string().trim().min(1, "Informe um título.").max(120, "O título pode ter até 120 caracteres."),
  url: z
    .string()
    .trim()
    .max(2000, "URL muito longa.")
    .transform((v) => (/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`))
    .pipe(
      z.url({ protocol: /^https?$/, message: "Informe uma URL válida, começando com http ou https." }),
    ),
});

export const studyLogSchema = z.object({
  topicId: z.string().min(1, "Escolha um tópico."),
  minutes: z.coerce
    .number({ message: "Informe os minutos." })
    .int("Use minutos inteiros.")
    .min(1, "Registre pelo menos 1 minuto.")
    .max(1440, "Uma sessão pode ter até 1440 minutos (24 horas)."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
});
