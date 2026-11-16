"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { createLanguage, updateLanguage, type FormState } from "@/app/(app)/linguas/actions";
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
import type { LanguageStatus } from "@/generated/prisma/enums";
import { LANGUAGE_STATUS_LABEL } from "@/lib/routine";

export type LanguageFormValues = {
  id: string;
  name: string;
  level: string;
  goal: string;
  status: LanguageStatus;
  targetHours: number | null;
};

export function LanguageFormDialog({ trigger, language }: { trigger: ReactNode; language?: LanguageFormValues }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language ? "Editar língua" : "Nova língua"}</DialogTitle>
          <DialogDescription>
            {language
              ? "Nível, meta e fase da língua."
              : "Cria a língua e um tópico com o mesmo nome para notas, recursos e sessões."}
          </DialogDescription>
        </DialogHeader>
        <LanguageForm language={language} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

const labelClass = "text-[13px] text-fg-muted";

function LanguageForm({ language, onDone }: { language?: LanguageFormValues; onDone: () => void }) {
  const action = language ? updateLanguage.bind(null, language.id) : createLanguage;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="language-name" className={labelClass}>
          Nome
        </label>
        <Input id="language-name" name="name" required maxLength={40} defaultValue={language?.name} placeholder="Italiano" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="language-level" className={labelClass}>
            Nível atual
          </label>
          <Input id="language-level" name="level" maxLength={60} defaultValue={language?.level} placeholder="A1" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="language-status" className={labelClass}>
            Fase
          </label>
          <Select id="language-status" name="status" defaultValue={language?.status ?? "ACTIVE"}>
            {(Object.keys(LANGUAGE_STATUS_LABEL) as LanguageStatus[]).map((s) => (
              <option key={s} value={s}>
                {LANGUAGE_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="language-goal" className={labelClass}>
          Meta
        </label>
        <Input id="language-goal" name="goal" maxLength={200} defaultValue={language?.goal} placeholder="B1 no início de 2028" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="language-hours" className={labelClass}>
          Horas estimadas até a meta
        </label>
        <Input
          id="language-hours"
          name="targetHours"
          type="number"
          inputMode="numeric"
          min={1}
          max={10000}
          defaultValue={language?.targetHours ?? ""}
          aria-describedby="language-hours-hint"
        />
        <p id="language-hours-hint" className="text-xs text-fg-muted">
          Opcional. Mostra quantas horas você já estudou em relação a esse total.
        </p>
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
          {pending ? "Salvando..." : language ? "Salvar" : "Adicionar língua"}
        </Button>
      </DialogFooter>
    </form>
  );
}
