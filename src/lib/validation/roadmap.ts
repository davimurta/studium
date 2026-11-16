import { z } from "zod";
import { statusSchema } from "@/lib/validation/topic";

export const roadmapFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe um título.")
    .max(120, "O título pode ter até 120 caracteres."),
  description: z
    .string()
    .trim()
    .max(500, "A descrição pode ter até 500 caracteres.")
    .transform((v) => (v === "" ? null : v)),
});

const itemTitle = z
  .string()
  .trim()
  .max(160, "O título pode ter até 160 caracteres.");

// Etapa nova: titulo livre ou um topico existente.
export const newItemSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("livre"),
    title: itemTitle.min(1, "Informe o título da etapa."),
    status: statusSchema,
  }),
  z.object({
    mode: z.literal("topico"),
    topicId: z.string().min(1, "Escolha um tópico."),
  }),
]);

export const editItemSchema = z.object({
  title: itemTitle.min(1, "Informe o título da etapa."),
  topicId: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  status: statusSchema,
});

export const reorderSchema = z.array(z.string().min(1)).max(500);

export const structureSchema = z
  .array(z.object({ id: z.string().min(1), depth: z.union([z.literal(0), z.literal(1)]) }))
  .max(500);
