"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { createRoadmap, updateRoadmap, type FormState } from "@/app/(app)/roadmaps/actions";
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
import { Textarea } from "@/components/ui/textarea";

type RoadmapValues = { id: string; title: string; description: string | null };

export function RoadmapFormDialog({ trigger, roadmap }: { trigger: ReactNode; roadmap?: RoadmapValues }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{roadmap ? "Editar roadmap" : "Novo roadmap"}</DialogTitle>
          <DialogDescription>
            {roadmap
              ? "Atualize o título e a descrição."
              : "Um caminho de estudo em etapas. Você adiciona as etapas em seguida."}
          </DialogDescription>
        </DialogHeader>
        <RoadmapForm roadmap={roadmap} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function RoadmapForm({ roadmap, onDone }: { roadmap?: RoadmapValues; onDone: () => void }) {
  const action = roadmap ? updateRoadmap.bind(null, roadmap.id) : createRoadmap;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="roadmap-title" className="text-[13px] text-fg-muted">
          Título
        </label>
        <Input id="roadmap-title" name="title" required maxLength={120} defaultValue={roadmap?.title} autoFocus />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="roadmap-description" className="text-[13px] text-fg-muted">
          Descrição
        </label>
        <Textarea
          id="roadmap-description"
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={roadmap?.description ?? ""}
        />
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
          {pending ? "Salvando..." : roadmap ? "Salvar" : "Criar roadmap"}
        </Button>
      </DialogFooter>
    </form>
  );
}
