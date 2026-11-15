"use client";

import { useState, useTransition } from "react";
import { EllipsisIcon } from "lucide-react";
import { archiveTopic, deleteTopic, unarchiveTopic } from "@/app/(app)/topicos/actions";
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
import { TopicFormDialog, type TopicFormValues } from "./topic-form-dialog";

type Props = { topic: TopicFormValues; archived: boolean };

export function TopicActions({ topic, archived }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <TopicFormDialog topic={topic} trigger={<Button variant="secondary">Editar</Button>} />
      <Button disabled>
        Registrar estudo
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="h-auto self-stretch" aria-label="Mais ações">
            <EllipsisIcon className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={pending}
            onSelect={() =>
              startTransition(() => (archived ? unarchiveTopic(topic.id) : archiveTopic(topic.id)))
            }
          >
            {archived ? "Desarquivar" : "Arquivar"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirmOpen(true)}>Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tópico?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{topic.title}&quot; será excluído junto com notas, recursos e sessões de estudo.
              Etapas de roadmap ligadas a ele ficam sem tópico. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancelar</Button>
            </AlertDialogCancel>
            <Button
              disabled={pending}
              onClick={() => startTransition(() => deleteTopic(topic.id))}
            >
              {pending ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
