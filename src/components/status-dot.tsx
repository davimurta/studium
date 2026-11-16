import type { CSSProperties } from "react";
import type { Status } from "@/generated/prisma/enums";
import { STATUS_LABEL } from "@/lib/status";
import { cn } from "@/lib/utils";

const DOT_STYLE: Record<Status, CSSProperties> = {
  NOT_STARTED: { border: "1.5px solid #8c8c8c" },
  STUDYING: {
    border: "1.5px solid #fff",
    background: "linear-gradient(90deg,#fff 50%,transparent 50%)",
  },
  DONE: { border: "1.5px solid #fff", background: "#fff" },
};

type Props = {
  status: Status;
  /** Mostra o rotulo em texto ao lado do simbolo (contextos de detalhe). */
  showLabel?: boolean;
  className?: string;
};

// Status sempre por simbolo, nunca por cor. Sem rotulo visivel, o texto fica para leitores de tela.
export function StatusDot({ status, showLabel = false, className }: Props) {
  const label = STATUS_LABEL[status];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="box-border block size-2.5 shrink-0 rounded-full"
        style={DOT_STYLE[status]}
      />
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  );
}
