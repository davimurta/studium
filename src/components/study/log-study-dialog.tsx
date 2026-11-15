"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { logStudy, type StudyLogState } from "@/app/(app)/study-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Status } from "@/generated/prisma/enums";
import { STATUS_LABEL } from "@/lib/status";

export type StudyTopicOption = { id: string; title: string; status: Status };

type Props = {
  trigger: ReactNode;
  topics: StudyTopicOption[];
  /** Topico ja selecionado (pagina do topico). */
  defaultTopicId?: string;
  /** Data de hoje (YYYY-MM-DD, fuso de Sao Paulo), calculada no servidor. */
  today: string;
};

export function LogStudyDialog({ trigger, topics, defaultTopicId, today }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar estudo</DialogTitle>
          <DialogDescription>Quanto tempo você estudou e quando. Pode registrar várias sessões no mesmo dia.</DialogDescription>
        </DialogHeader>
        {topics.length === 0 ? (
          <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-[13px] text-fg-muted">
            Crie um tópico antes de registrar uma sessão de estudo.
          </p>
        ) : (
          <LogStudyForm
            topics={topics}
            defaultTopicId={defaultTopicId}
            today={today}
            onDone={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

const QUICK_MINUTES = [15, 30, 45, 60, 90];

function LogStudyForm({
  topics,
  defaultTopicId,
  today,
  onDone,
}: {
  topics: StudyTopicOption[];
  defaultTopicId?: string;
  today: string;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<StudyLogState, FormData>(logStudy, undefined);
  const values = state && !state.ok ? state.values : undefined;
  const [minutes, setMinutes] = useState(values?.minutes ?? "");

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  // Topicos em andamento primeiro, depois os demais.
  const sorted = [...topics].sort(
    (a, b) => Number(b.status === "STUDYING") - Number(a.status === "STUDYING") || a.title.localeCompare(b.title, "pt-BR"),
  );
  const initialTopic = values?.topicId ?? defaultTopicId ?? sorted[0]?.id ?? "";

  return (
    <form action={action} className="flex flex-col gap-4" key={state?.at}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="study-topic" className="text-[13px] text-fg-muted">
          Tópico
        </label>
        <Select id="study-topic" name="topicId" required defaultValue={initialTopic}>
          {sorted.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
              {t.status === "STUDYING" ? "" : ` (${STATUS_LABEL[t.status]})`}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="study-minutes" className="text-[13px] text-fg-muted">
            Minutos
          </label>
          <Input
            id="study-minutes"
            name="minutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            step={1}
            required
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="45"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="study-date" className="text-[13px] text-fg-muted">
            Data
          </label>
          <Input
            id="study-date"
            name="date"
            type="date"
            required
            max={today}
            defaultValue={values?.date ?? today}
            className="[color-scheme:dark]"
          />
        </div>
      </div>

      <div role="group" aria-label="Minutos rápidos" className="flex flex-wrap gap-1.5">
        {QUICK_MINUTES.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={minutes === String(m)}
            onClick={() => setMinutes(String(m))}
            className={
              "cursor-pointer rounded-full border px-2.5 py-0.5 font-sans text-xs transition-colors " +
              (minutes === String(m)
                ? "border-line-hover bg-active text-fg"
                : "border-line text-fg-muted hover:bg-active hover:text-fg")
            }
          >
            {m < 60 ? `${m} min` : m === 60 ? "1h" : `${Math.floor(m / 60)}h ${m % 60}min`}
          </button>
        ))}
      </div>

      {state && !state.ok && (
        <p role="alert" className="rounded-md border border-line px-3 py-2 text-[13px]">
          {state.error}
        </p>
      )}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando..." : "Registrar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
