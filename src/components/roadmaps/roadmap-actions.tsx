"use client";

import { useState, useTransition } from "react";
import { EllipsisIcon } from "lucide-react";
import { deleteRoadmap } from "@/app/(app)/roadmaps/actions";
import { PlusIcon } from "@/components/icons/plus";
import { SquarePenIcon } from "@/components/icons/square-pen";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRoadmapEditor } from "./roadmap-editor";
import { RoadmapFormDialog } from "./roadmap-form-dialog";

type Props = {
  roadmap: { id: string; title: string; description: string | null };
};

export function RoadmapActions({ roadmap }: Props) {
  const editor = useRoadmapEditor();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <RoadmapFormDialog
        roadmap={roadmap}
        trigger={
          <AnimatedButton icon={SquarePenIcon} iconSize={14} variant="secondary">
            Editar
          </AnimatedButton>
        }
      />
      <AnimatedButton icon={PlusIcon} iconSize={14} onClick={() => editor.openAdd(null)}>
        Adicionar etapa
      </AnimatedButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="h-auto self-stretch" aria-label="Mais ações">
            <EllipsisIcon className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setConfirmOpen(true)}>Excluir roadmap</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir roadmap?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{roadmap.title}&quot; e todas as etapas dele serão excluídos. Os tópicos ligados
              continuam existindo. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancelar</Button>
            </AlertDialogCancel>
            <Button disabled={pending} onClick={() => startTransition(() => deleteRoadmap(roadmap.id))}>
              {pending ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
