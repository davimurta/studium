"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { createRoutineItem, updateRoutineItem, type FormState } from "@/app/(app)/linguas/actions";
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
import type { RoutineFrequency } from "@/generated/prisma/enums";
import { FREQUENCY_LABEL, WEEKDAYS } from "@/lib/routine";
import { cn } from "@/lib/utils";

export type RoutineItemValues = {
  id: string;
  title: string;
  details: string | null;
  languageId: string | null;
  frequency: RoutineFrequency;
  weekdays: number[];
  minutes: number;
};

type Props = {
  trigger: ReactNode;
  languages: { id: string; name: string }[];
  item?: RoutineItemValues;
  defaultFrequency?: RoutineFrequency;
};

export function RoutineItemDialog({ trigger, languages, item, defaultFrequency = "DAILY" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Editar item" : "Novo item da rotina"}</DialogTitle>
          <DialogDescription>
            Itens diários com língua e minutos registram a sessão de estudo quando você marca.
          </DialogDescription>
        </DialogHeader>
        <RoutineItemForm
          languages={languages}
          item={item}
          defaultFrequency={defaultFrequency}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

const labelClass = "text-[13px] text-fg-muted";

function RoutineItemForm({
  languages,
  item,
  defaultFrequency,
  onDone,
}: Omit<Props, "trigger"> & { onDone: () => void }) {
  const action = item ? updateRoutineItem.bind(null, item.id) : createRoutineItem;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);
  const [frequency, setFrequency] = useState<RoutineFrequency>(item?.frequency ?? defaultFrequency ?? "DAILY");
  // Lista vazia no banco = todos os dias.
  const [days, setDays] = useState<number[]>(
    item && item.weekdays.length > 0 ? item.weekdays : WEEKDAYS.map((d) => d.value),
  );

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  function toggleDay(value: number) {
    setDays((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="routine-title" className={labelClass}>
          O que fazer
        </label>
        <Input
          id="routine-title"
          name="title"
          required
          maxLength={120}
          defaultValue={item?.title}
          placeholder="Language Transfer + 10 min de Anki"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="routine-details" className={labelClass}>
          Detalhes
        </label>
        <Textarea id="routine-details" name="details" rows={2} maxLength={500} defaultValue={item?.details ?? ""} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="routine-language" className={labelClass}>
            Língua
          </label>
          <Select id="routine-language" name="languageId" defaultValue={item?.languageId ?? ""}>
            <option value="">Geral (sem língua)</option>
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="routine-frequency" className={labelClass}>
            Frequência
          </label>
          <Select
            id="routine-frequency"
            name="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as RoutineFrequency)}
          >
            {(Object.keys(FREQUENCY_LABEL) as RoutineFrequency[]).map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABEL[f]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {frequency === "DAILY" && (
        <fieldset className="flex flex-col gap-1.5">
          <legend className={cn(labelClass, "mb-1.5")}>Dias da semana</legend>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d) => {
              const checked = days.includes(d.value);
              return (
                <label
                  key={d.value}
                  className={cn(
                    "cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white",
                    checked ? "border-white bg-white text-black" : "border-line text-fg-muted hover:bg-active",
                  )}
                >
                  <input
                    type="checkbox"
                    name="weekdays"
                    value={d.value}
                    checked={checked}
                    onChange={() => toggleDay(d.value)}
                    className="sr-only"
                  />
                  {d.short}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="routine-minutes" className={labelClass}>
          Minutos
        </label>
        <Input
          id="routine-minutes"
          name="minutes"
          type="number"
          inputMode="numeric"
          min={0}
          max={600}
          defaultValue={item?.minutes ?? (defaultFrequency === "DAILY" ? 30 : 0)}
          aria-describedby="routine-minutes-hint"
        />
        <p id="routine-minutes-hint" className="text-xs text-fg-muted">
          Tempo planejado. Use 0 para itens que não contam como estudo.
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
          {pending ? "Salvando..." : item ? "Salvar" : "Adicionar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
