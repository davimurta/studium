"use client";

import { useState, useTransition } from "react";
import { EllipsisIcon } from "lucide-react";
import {
  archiveRoutineItem,
  deleteLanguage,
  moveRoutineItem,
} from "@/app/(app)/linguas/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageFormDialog, type LanguageFormValues } from "./language-form-dialog";
import { RoutineItemDialog, type RoutineItemValues } from "./routine-item-dialog";

type ItemMenuProps = {
  item: RoutineItemValues;
  languages: { id: string; name: string }[];
  isFirst: boolean;
  isLast: boolean;
};

export function RoutineItemMenu({ item, languages, isFirst, isLast }: ItemMenuProps) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await fn();
      setError(result.error ?? null);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <RoutineItemDialog
        item={item}
        languages={languages}
        trigger={
          <Button variant="ghost" size="xs">
            Editar
          </Button>
        }
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Mais ações: ${item.title}`}>
            <EllipsisIcon className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={pending || isFirst} onSelect={() => run(() => moveRoutineItem(item.id, "up"))}>
            Mover para cima
          </DropdownMenuItem>
          <DropdownMenuItem disabled={pending || isLast} onSelect={() => run(() => moveRoutineItem(item.id, "down"))}>
            Mover para baixo
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirmOpen(true)}>Remover da rotina</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <span role="alert" className="text-xs text-fg-muted">
          {error}
        </span>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da rotina?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{item.title}&quot; sai da rotina. As marcações e sessões de estudo já registradas continuam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancelar</Button>
            </AlertDialogCancel>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await archiveRoutineItem(item.id);
                  setError(result.error ?? null);
                  setConfirmOpen(false);
                })
              }
            >
              {pending ? "Removendo..." : "Remover"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function LanguageMenu({ language }: { language: LanguageFormValues }) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <LanguageFormDialog
        language={language}
        trigger={
          <Button variant="ghost" size="xs">
            Editar
          </Button>
        }
      />
      <Button variant="ghost" size="xs" onClick={() => setConfirmOpen(true)}>
        Excluir
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {language.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              A língua sai da tela de línguas. O tópico com notas, recursos e sessões continua em Tópicos, e os
              itens da rotina ficam como Geral. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancelar</Button>
            </AlertDialogCancel>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteLanguage(language.id);
                  setConfirmOpen(false);
                })
              }
            >
              {pending ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
