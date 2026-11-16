import { z } from "zod";
import { LanguageStatus, RoutineFrequency } from "@/generated/prisma/enums";

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message);

export const languageFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da língua.").max(40, "O nome pode ter até 40 caracteres."),
  level: optionalText(60, "O nível pode ter até 60 caracteres."),
  goal: optionalText(200, "A meta pode ter até 200 caracteres."),
  status: z.enum([
    LanguageStatus.ACTIVE,
    LanguageStatus.MAINTENANCE,
    LanguageStatus.PLANNED,
    LanguageStatus.NATIVE,
  ]),
  targetHours: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 10_000) {
        ctx.addIssue({ code: "custom", message: "Horas estimadas: use um número inteiro entre 1 e 10000." });
        return z.NEVER;
      }
      return n;
    }),
});

export const routineItemSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o que fazer.").max(120, "O título pode ter até 120 caracteres."),
    details: optionalText(500, "Os detalhes podem ter até 500 caracteres.").transform((v) => (v === "" ? null : v)),
    languageId: z.string().transform((v) => (v === "" ? null : v)),
    frequency: z.enum([RoutineFrequency.DAILY, RoutineFrequency.WEEKLY, RoutineFrequency.MONTHLY]),
    weekdays: z.array(z.coerce.number().int().min(0).max(6)),
    minutes: z.coerce
      .number({ message: "Informe os minutos." })
      .int("Use minutos inteiros.")
      .min(0, "Os minutos não podem ser negativos.")
      .max(600, "Um item pode ter até 600 minutos."),
  })
  .transform((v) => ({
    ...v,
    // Dias so valem para a rotina diaria; todos marcados = todos os dias (lista vazia).
    weekdays: v.frequency === "DAILY" && new Set(v.weekdays).size < 7 ? [...new Set(v.weekdays)].sort() : [],
  }));

export const periodKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
