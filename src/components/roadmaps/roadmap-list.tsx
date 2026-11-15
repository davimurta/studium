"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EllipsisIcon } from "lucide-react";
import { GripVerticalIcon } from "@/components/icons/grip-vertical";
import { useAnimatedIcon } from "@/components/icons/use-animated-icon";
import { StatusDot } from "@/components/status-dot";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  applyMove,
  childIdsOf,
  flatten,
  labels as buildLabels,
  projectDepth,
  type FlatItem,
} from "@/lib/roadmap-tree";
import { STATUS_LABEL } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useRoadmapEditor } from "./roadmap-editor";
import { StepMenuContent } from "./step-menu";

// Quantos px para o lado equivalem a um nivel de recuo (arrastar para a direita = subetapa).
const INDENT = 32;

const GRID = "grid grid-cols-[16px_44px_16px_minmax(0,1fr)_220px_110px_28px] items-center gap-3.5";

export function RoadmapList() {
  const editor = useRoadmapEditor();
  const { steps } = editor;
  // Id estavel evita divergencia de hidratacao nos atributos aria do dnd-kit.
  const dndId = useId();

  const [flat, setFlat] = useState<FlatItem[]>(() => flatten(steps));
  const [synced, setSynced] = useState(steps);
  if (steps !== synced) {
    // Lista nova do servidor passa a valer.
    setSynced(steps);
    setFlat(flatten(steps));
  }

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [offsetX, setOffsetX] = useState(0);

  const activeChildren = useMemo(() => (activeId ? childIdsOf(flat, activeId) : []), [flat, activeId]);
  // Durante o arraste, as subetapas do item ativo "vao junto" e saem da lista visivel.
  const visible = useMemo(
    () => (activeChildren.length ? flat.filter((f) => !activeChildren.includes(f.id)) : flat),
    [flat, activeChildren],
  );
  const projected =
    activeId && overId ? projectDepth(visible, activeId, overId, offsetX, INDENT, activeChildren.length > 0) : null;
  const rowLabels = useMemo(() => buildLabels(flat), [flat]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function reset() {
    setActiveId(null);
    setOverId(null);
    setOffsetX(0);
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    const id = String(active.id);
    const target = over ? String(over.id) : null;
    const depth = projected;
    reset();
    if (!target || depth === null) return;

    const next = applyMove(flat, id, target, depth);
    const unchanged = next.every((f, i) => f.id === flat[i].id && f.depth === flat[i].depth);
    if (unchanged) return;

    const previous = flat;
    setFlat(next);
    const ok = await editor.save(next);
    if (!ok) setFlat(previous);
  }

  const titleOf = (id: string | number) => flat.find((f) => f.id === String(id))?.item.title ?? "etapa";
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Etapa "${titleOf(active.id)}" selecionada.`,
    onDragOver: ({ active, over }) =>
      over ? `Etapa "${titleOf(active.id)}" sobre "${titleOf(over.id)}".` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `Etapa "${titleOf(active.id)}" solta perto de "${titleOf(over.id)}".` : undefined,
    onDragCancel: ({ active }) => `Movimento cancelado. Etapa "${titleOf(active.id)}" voltou ao lugar.`,
  };

  return (
    <section className="overflow-x-auto rounded-lg border border-line">
      <div className="min-w-[840px]">
        <div aria-hidden="true" className={`${GRID} px-4 py-2.5 text-xs text-fg-muted`}>
          <span />
          <span>Etapa</span>
          <span />
          <span>Título</span>
          <span>Tópico</span>
          <span className="text-right">Status</span>
          <span />
        </div>
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }: DragStartEvent) => {
            setActiveId(String(active.id));
            setOverId(String(active.id));
          }}
          onDragMove={({ delta }: DragMoveEvent) => setOffsetX(delta.x)}
          onDragOver={({ over }: DragOverEvent) => setOverId(over ? String(over.id) : null)}
          onDragEnd={onDragEnd}
          onDragCancel={reset}
          accessibility={{
            announcements,
            screenReaderInstructions: {
              draggable:
                "Para mover a etapa, pressione espaço, use as setas para cima e para baixo e pressione espaço de novo para soltar. Para transformar em subetapa, use o menu de ações da etapa.",
            },
          }}
        >
          <SortableContext items={visible.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <ol aria-label="Etapas do roadmap">
              {visible.map((f) => {
                const isActive = f.id === activeId;
                const depth = isActive && projected !== null ? projected : f.depth;
                return (
                  <TreeRow
                    key={f.id}
                    flatItem={f}
                    depth={depth}
                    label={rowLabels.get(f.id) ?? ""}
                    childCount={f.depth === 0 ? childIdsOf(flat, f.id).length : 0}
                    hiddenChildren={isActive ? activeChildren.length : 0}
                  />
                );
              })}
            </ol>
          </SortableContext>
        </DndContext>
      </div>
      <p className="border-t border-line px-4 py-2.5 text-xs text-fg-muted">
        Arraste para cima e para baixo para reordenar. Arraste um pouco para a direita para transformar em
        subetapa da etapa de cima, e para a esquerda para voltar a ser etapa principal.
      </p>
    </section>
  );
}

type RowProps = {
  flatItem: FlatItem;
  depth: 0 | 1;
  label: string;
  childCount: number;
  hiddenChildren: number;
};

function TreeRow({ flatItem, depth, label, childCount, hiddenChildren }: RowProps) {
  const { item } = flatItem;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const { ref: gripRef, triggerProps: gripTrigger } = useAnimatedIcon();
  const status = item.effectiveStatus;
  const nested = depth === 1;

  return (
    <li
      ref={setNodeRef}
      // So deslocamento vertical; o recuo horizontal vem da profundidade projetada.
      style={{ transform: CSS.Translate.toString(transform ? { ...transform, x: 0 } : null), transition }}
      className={cn("relative border-t border-line bg-black", isDragging && "z-10")}
    >
      {nested && (
        // Guia vertical ligando a subetapa a etapa principal
        <span aria-hidden="true" className="absolute top-0 bottom-0 left-[28px] w-px bg-[#404040]" />
      )}
      <div
        className={cn(
          GRID,
          "py-[13px] pr-4 transition-[padding] duration-150 hover:bg-surface",
          isDragging && "bg-active outline outline-1 outline-line-hover",
        )}
        style={{ paddingLeft: 16 + depth * INDENT }}
      >
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Mover etapa ${label}: ${item.title}`}
          className="flex h-6 w-4 cursor-grab touch-none items-center justify-center rounded-sm text-line-hover hover:text-fg-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
          {...gripTrigger}
        >
          <GripVerticalIcon ref={gripRef} size={14} />
        </button>
        <span className="text-[13px] text-fg-muted tabular-nums">{label}</span>
        <StatusDot status={status} />
        <span
          className={cn(
            "flex min-w-0 items-center gap-2",
            nested ? "font-normal" : "font-medium",
            status === "NOT_STARTED" ? "text-fg-muted" : "text-fg",
          )}
        >
          <span className="truncate">{item.title}</span>
          {hiddenChildren > 0 && (
            <span className="shrink-0 rounded-full border border-line px-2 text-xs text-fg-muted">
              +{hiddenChildren}
            </span>
          )}
        </span>
        <span className="min-w-0">
          {item.topic ? (
            <Link
              href={`/topicos/${item.topic.id}`}
              className="inline-block max-w-full truncate rounded-full border border-line px-2.5 py-0.5 align-middle text-[13px] transition-colors hover:border-line-hover"
            >
              {item.topic.title}
            </Link>
          ) : (
            <span className="text-[13px] text-dim">Sem tópico</span>
          )}
        </span>
        <span className="text-right text-[13px] text-fg-muted">{STATUS_LABEL[status]}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Ações da etapa ${label}`}
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-fg-muted hover:bg-active hover:text-fg"
          >
            <EllipsisIcon className="size-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <StepMenuContent item={item} childCount={childCount} align="end" />
        </DropdownMenu>
      </div>
    </li>
  );
}
