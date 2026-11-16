"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleRoutineCheck } from "@/app/(app)/linguas/actions";
import { formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

// Caixa de marcacao: estado por simbolo (vazia ou cheia com check), nunca so por cor.
export function CheckBox({ done, muted = false }: { done: boolean; muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors",
        done ? "border-white bg-white text-black" : muted ? "border-line" : "border-line-hover",
      )}
    >
      {done && (
        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2.5 6.5l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function useToggle(itemId: string, dayKey: string, done: boolean) {
  const [optimistic, setOptimistic] = useOptimistic(done);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    if (pending) return;
    startTransition(async () => {
      setOptimistic(!optimistic);
      const result = await toggleRoutineCheck(itemId, dayKey);
      setError(result.error ?? null);
    });
  }
  return { done: optimistic, pending, error, toggle };
}

type RowProps = {
  itemId: string;
  dayKey: string;
  done: boolean;
  title: string;
  details?: string | null;
  minutes: number;
  language?: string | null;
};

// Linha da rotina de hoje: um toque marca o item e registra os minutos na lingua.
export function RoutineRow({ itemId, dayKey, done: initial, title, details, minutes, language }: RowProps) {
  const { done, pending, error, toggle } = useToggle(itemId, dayKey, initial);
  return (
    <li className="border-t border-line first:border-t-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-busy={pending}
        onClick={toggle}
        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left font-sans hover:bg-surface"
      >
        <span className="mt-0.5">
          <CheckBox done={done} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block font-medium", done && "text-fg-muted line-through decoration-line-hover")}>
            {title}
          </span>
          {details && <span className="mt-0.5 block text-[13px] text-fg-muted">{details}</span>}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-[13px] text-fg-muted">
          {minutes > 0 && <span>{formatMinutes(minutes)}</span>}
          {language && <span className="text-xs">{language}</span>}
        </span>
      </button>
      {error && (
        <p role="alert" className="px-4 pb-3 pl-[46px] text-[13px] text-fg-muted">
          {error}
        </p>
      )}
    </li>
  );
}

type CellProps = {
  itemId: string;
  dayKey: string;
  done: boolean;
  label: string;
};

// Celula da grade semanal (dias passados e hoje podem ser marcados depois).
export function RoutineCell({ itemId, dayKey, done: initial, label }: CellProps) {
  const { done, pending, error, toggle } = useToggle(itemId, dayKey, initial);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-busy={pending}
      aria-label={label}
      title={error ?? undefined}
      onClick={toggle}
      className="flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-active"
    >
      <CheckBox done={done} />
    </button>
  );
}

// Item de revisao (semanal ou mensal).
export function ReviewRow({ itemId, dayKey, done: initial, title, details }: Omit<RowProps, "minutes" | "language">) {
  const { done, pending, error, toggle } = useToggle(itemId, dayKey, initial);
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-busy={pending}
        onClick={toggle}
        className="flex w-full cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-left font-sans hover:bg-surface"
      >
        <span className="mt-0.5">
          <CheckBox done={done} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block text-[13px]", done ? "text-fg-muted line-through" : "text-fg")}>{title}</span>
          {details && <span className="block text-xs text-fg-muted">{details}</span>}
        </span>
      </button>
      {error && (
        <p role="alert" className="px-2 pb-2 text-xs text-fg-muted">
          {error}
        </p>
      )}
    </li>
  );
}
