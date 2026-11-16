"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import type { Status } from "@/generated/prisma/enums";
import {
  createTopic,
  updateTopic,
  type TopicFormState,
} from "@/app/(app)/topicos/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABEL } from "@/lib/status";

export type TopicFormValues = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  status: Status;
};

type Props = {
  trigger: ReactNode;
  topic?: TopicFormValues;
};

export function TopicFormDialog({ trigger, topic }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{topic ? "Editar tópico" : "Novo tópico"}</DialogTitle>
          <DialogDescription>
            {topic ? "Atualize as informações do tópico." : "Adicione algo que você quer estudar."}
          </DialogDescription>
        </DialogHeader>
        <TopicForm topic={topic} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

const labelClass = "text-[13px] text-fg-muted";

function TopicForm({ topic, onDone }: { topic?: TopicFormValues; onDone: () => void }) {
  const action = topic ? updateTopic.bind(null, topic.id) : createTopic;
  const [state, formAction, pending] = useActionState<TopicFormState, FormData>(action, undefined);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="topic-title" className={labelClass}>
          Título
        </label>
        <Input
          id="topic-title"
          name="title"
          required
          maxLength={120}
          defaultValue={topic?.title}
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="topic-description" className={labelClass}>
          Descrição
        </label>
        <Textarea
          id="topic-description"
          name="description"
          maxLength={1000}
          rows={3}
          defaultValue={topic?.description ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="topic-tags" className={labelClass}>
          Tags
        </label>
        <Input
          id="topic-tags"
          name="tags"
          placeholder="react, nextjs"
          aria-describedby="topic-tags-hint"
          defaultValue={topic?.tags.join(", ")}
        />
        <p id="topic-tags-hint" className="text-xs text-fg-muted">
          Separe as tags por vírgula.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="topic-status" className={labelClass}>
          Status
        </label>
        <Select id="topic-status" name="status" defaultValue={topic?.status ?? "NOT_STARTED"}>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
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
          {pending ? "Salvando..." : topic ? "Salvar" : "Criar tópico"}
        </Button>
      </DialogFooter>
    </form>
  );
}
