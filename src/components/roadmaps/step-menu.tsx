"use client";

import Link from "next/link";
import type { Status } from "@/generated/prisma/enums";
import { StatusDot } from "@/components/status-dot";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { RoadmapItemRow } from "@/lib/data/roadmaps";
import { STATUS_LABEL } from "@/lib/status";
import { useRoadmapEditor } from "./roadmap-editor";

type Props = { item: RoadmapItemRow; childCount?: number; align?: "start" | "center" | "end" };

// Conteudo do menu de uma etapa: status, editar, subetapa, tópico, mover e remover.
export function StepMenuContent({ item, childCount = 0, align = "center" }: Props) {
  const editor = useRoadmapEditor();
  const siblings = editor.siblingsOf(item);
  const index = siblings.findIndex((s) => s.id === item.id);
  const isMain = item.parentId === null;

  return (
    <DropdownMenuContent align={align} className="min-w-[220px]">
      <p className="truncate px-2.5 pt-1.5 pb-1 text-xs font-medium text-fg">{item.title}</p>
      {item.topic && (
        <p className="px-2.5 pb-1.5 text-xs text-dim">O status também muda no tópico ligado.</p>
      )}
      <DropdownMenuRadioGroup
        value={item.effectiveStatus}
        onValueChange={(v) => editor.setStatus(item, v as Status)}
      >
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
          <DropdownMenuRadioItem key={s} value={s}>
            <StatusDot status={s} showLabel />
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => editor.openEdit(item)}>Editar etapa</DropdownMenuItem>
      {isMain && (
        <DropdownMenuItem onSelect={() => editor.openAdd(item.id)}>Adicionar subetapa</DropdownMenuItem>
      )}
      {item.topic && (
        <DropdownMenuItem asChild>
          <Link href={`/topicos/${item.topic.id}`}>Abrir tópico</Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={index <= 0} onSelect={() => editor.move(item, -1)}>
        {isMain ? "Mover para cima" : "Subir"}
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={index === -1 || index >= siblings.length - 1}
        onSelect={() => editor.move(item, 1)}
      >
        {isMain ? "Mover para baixo" : "Descer"}
      </DropdownMenuItem>
      {isMain ? (
        <DropdownMenuItem disabled={!editor.canIndent(item)} onSelect={() => editor.indent(item)}>
          Recuar para a etapa acima
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onSelect={() => editor.outdent(item)}>Tornar etapa principal</DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => editor.remove(item)}>
        {childCount > 0 ? `Remover com ${childCount} ${childCount === 1 ? "subetapa" : "subetapas"}` : "Remover"}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
