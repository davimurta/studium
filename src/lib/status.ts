import type { Status } from "@/generated/prisma/enums";

export const STATUS_LABEL: Record<Status, string> = {
  NOT_STARTED: "Não iniciado",
  STUDYING: "Estudando",
  DONE: "Concluído",
};
