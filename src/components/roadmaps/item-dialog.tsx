"use client";

import { useActionState, useEffect, useState } from "react";
import type { Status } from "@/generated/prisma/enums";
import { addItem, updateItem, type FormState } from "@/app/(app)/roadmaps/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { RoadmapItemRow, TopicOption } from "@/lib/data/roadmaps";
import { STATUS_LABEL } from "@/lib/status";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roadmapId: string;
  topics: TopicOption[];
  /** Sem item: adicionar etapa. Com item: editar. */
  item?: RoadmapItemRow;
};

export function ItemDialog({ open, onOpenChange, roadmapId, topics, item }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Editar etapa" : "Adicionar etapa"}</DialogTitle>
          <DialogDescription>
            {item
              ? "Etapas ligadas a um tópico usam o status do tópico."
              : "Escreva uma etapa livre ou ligue um tópico que você já tem."}
          </DialogDescription>
        </DialogHeader>
        {item ? (
          <EditItemForm item={item} topics={topics} onDone={() => onOpenChange(false)} />
        ) : (
          <AddItemForm roadmapId={roadmapId} topics={topics} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

const labelClass = "text-[13px] text-fg-muted";

function StatusOptions() {
  return (Object.keys(STATUS_LABEL) as Status[]).map((s) => (
    <option key={s} value={s}>
      {STATUS_LABEL[s]}
    </option>
  ));
}

function FormError({ state }: { state: FormState }) {
  if (!state || state.ok) return null;
  return (
    <p role="alert" className="rounded-md border border-line px-3 py-2 text-[13px]">
      {state.error}
    </p>
  );
}

function useCloseOnSuccess(state: FormState, onDone: () => void) {
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
}

function AddItemForm({
  roadmapId,
  topics,
  onDone,
}: {
  roadmapId: string;
  topics: TopicOption[];
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"livre" | "topico">("livre");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    addItem.bind(null, roadmapId),
    undefined,
  );
  useCloseOnSuccess(state, onDone);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="mode" value={mode} />
      <div role="group" aria-label="Tipo de etapa" className="grid grid-cols-2 gap-1 rounded-md border border-line p-1">
        {(
          [
            ["livre", "Título livre"],
            ["topico", "Tópico existente"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "cursor-pointer rounded-[4px] px-3 py-1.5 font-sans text-[13px] transition-colors",
              mode === value ? "bg-active text-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "livre" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="item-title" className={labelClass}>
              Título da etapa
            </label>
            <Input id="item-title" name="title" required maxLength={160} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="item-status" className={labelClass}>
              Status
            </label>
            <Select id="item-status" name="status" defaultValue="NOT_STARTED">
              <StatusOptions />
            </Select>
          </div>
        </>
      ) : topics.length === 0 ? (
        <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-[13px] text-fg-muted">
          Você ainda não tem tópicos. Crie um em Tópicos ou use um título livre.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="item-topic" className={labelClass}>
            Tópico
          </label>
          <Select id="item-topic" name="topicId" required defaultValue="">
            <option value="" disabled>
              Escolha um tópico
            </option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({STATUS_LABEL[t.status]})
              </option>
            ))}
          </Select>
          <p className="text-xs text-fg-muted">A etapa usa o título e o status do tópico.</p>
        </div>
      )}

      <FormError state={state} />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || (mode === "topico" && topics.length === 0)}>
          {pending ? "Adicionando..." : "Adicionar etapa"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditItemForm({
  item,
  topics,
  onDone,
}: {
  item: RoadmapItemRow;
  topics: TopicOption[];
  onDone: () => void;
}) {
  const [topicId, setTopicId] = useState(item.topic?.id ?? "");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateItem.bind(null, item.id),
    undefined,
  );
  useCloseOnSuccess(state, onDone);

  // Garante que o topico atual aparece mesmo se estiver arquivado.
  const options =
    item.topic && !topics.some((t) => t.id === item.topic!.id)
      ? [{ id: item.topic.id, title: item.topic.title, status: item.topic.status }, ...topics]
      : topics;
  const linked = topicId !== "";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-item-title" className={labelClass}>
          Título da etapa
        </label>
        <Input id="edit-item-title" name="title" required maxLength={160} defaultValue={item.title} autoFocus />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-item-topic" className={labelClass}>
          Tópico
        </label>
        <Select id="edit-item-topic" name="topicId" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
          <option value="">Sem tópico</option>
          {options.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-item-status" className={labelClass}>
          Status
        </label>
        <Select
          id="edit-item-status"
          name="status"
          disabled={linked}
          defaultValue={item.effectiveStatus}
          aria-describedby={linked ? "edit-item-status-hint" : undefined}
        >
          <StatusOptions />
        </Select>
        {linked && (
          <p id="edit-item-status-hint" className="text-xs text-fg-muted">
            O status vem do tópico ligado.
          </p>
        )}
      </div>

      <FormError state={state} />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
