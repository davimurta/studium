"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EllipsisIcon } from "lucide-react";
import type { Status } from "@/generated/prisma/enums";
import { removeItem, reorderItems, setItemStatus } from "@/app/(app)/roadmaps/actions";
import { GripVerticalIcon } from "@/components/icons/grip-vertical";
import { useAnimatedIcon } from "@/components/icons/use-animated-icon";
import { StatusDot } from "@/components/status-dot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RoadmapItemRow, TopicOption } from "@/lib/data/roadmaps";
import { STATUS_LABEL } from "@/lib/status";
import { cn } from "@/lib/utils";
import { ItemDialog } from "./item-dialog";

const GRID =
  "grid grid-cols-[16px_32px_16px_minmax(0,1fr)_220px_110px_28px] items-center gap-3.5";

type Props = { roadmapId: string; items: RoadmapItemRow[]; topics: TopicOption[] };

export function RoadmapSteps({ roadmapId, items, topics }: Props) {
  const serverOrder = useMemo(() => items.map((i) => i.id), [items]);
  const [order, setOrder] = useState(serverOrder);
  const [syncedOrder, setSyncedOrder] = useState(serverOrder);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<RoadmapItemRow | null>(null);

  // Quando o servidor manda uma lista nova, ela passa a valer.
  if (serverOrder !== syncedOrder) {
    setSyncedOrder(serverOrder);
    setOrder(serverOrder);
  }

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const rows = order.map((id) => byId.get(id)).filter((i): i is RoadmapItemRow => Boolean(i));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function persist(next: string[]) {
    const previous = order;
    setOrder(next);
    setError(null);
    startTransition(async () => {
      const result = await reorderItems(roadmapId, next);
      if (result.error) {
        setOrder(previous);
        setError(result.error);
      }
    });
  }

  function move(id: string, delta: -1 | 1) {
    const from = order.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= order.length) return;
    persist(arrayMove(order, from, to));
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    persist(arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id))));
  }

  const titleOf = (id: string | number) => byId.get(String(id))?.title ?? "etapa";
  const positionOf = (id: string | number) => order.indexOf(String(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Etapa "${titleOf(active.id)}" selecionada, posição ${positionOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `Etapa "${titleOf(active.id)}" sobre a posição ${positionOf(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `Etapa "${titleOf(active.id)}" movida para a posição ${positionOf(over.id)}.` : undefined,
    onDragCancel: ({ active }) => `Movimento cancelado. Etapa "${titleOf(active.id)}" voltou ao lugar.`,
  };

  return (
    <>
      {error && (
        <p role="alert" className="rounded-md border border-line px-3 py-2 text-[13px]">
          {error}
        </p>
      )}
      <section className="overflow-x-auto rounded-lg border border-line">
        <div className="min-w-[800px]">
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
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={onDragEnd}
            accessibility={{
              announcements,
              screenReaderInstructions: {
                draggable:
                  "Para mover a etapa, pressione espaço. Use as setas para cima e para baixo e pressione espaço de novo para soltar, ou Esc para cancelar.",
              },
            }}
          >
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              <ol aria-label="Etapas do roadmap">
                {rows.map((item, index) => (
                  <StepRow
                    key={item.id}
                    item={item}
                    index={index}
                    total={rows.length}
                    onEdit={() => setEditing(item)}
                    onMove={(delta) => move(item.id, delta)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        </div>
      </section>

      <ItemDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        roadmapId={roadmapId}
        topics={topics}
        item={editing ?? undefined}
        key={editing?.id ?? "none"}
      />
    </>
  );
}

type RowProps = {
  item: RoadmapItemRow;
  index: number;
  total: number;
  onEdit: () => void;
  onMove: (delta: -1 | 1) => void;
};

function StepRow({ item, index, total, onEdit, onMove }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const { ref: gripRef, triggerProps: gripTrigger } = useAnimatedIcon();
  const [, startTransition] = useTransition();
  const number = String(index + 1).padStart(2, "0");
  const status = item.effectiveStatus;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        GRID,
        "relative border-t border-line bg-black px-4 py-[13px] hover:bg-surface",
        isDragging && "z-10 bg-active outline outline-1 outline-line-hover",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Mover etapa ${number}: ${item.title}`}
        className="flex h-6 w-4 cursor-grab touch-none items-center justify-center rounded-sm text-line-hover hover:text-fg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
        {...gripTrigger}
      >
        <GripVerticalIcon ref={gripRef} size={14} />
      </button>
      <span className="text-[13px] text-fg-muted tabular-nums">{number}</span>
      <StatusDot status={status} />
      <span className={cn("truncate font-medium", status === "NOT_STARTED" ? "text-fg-muted" : "text-fg")}>
        {item.title}
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
      <ItemStatusMenu
        itemId={item.id}
        status={status}
        linked={item.topic !== null}
        onChange={(next) => startTransition(async () => void (await setItemStatus(item.id, next)))}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Ações da etapa ${number}`}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md text-fg-muted hover:bg-active hover:text-fg"
        >
          <EllipsisIcon className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>Editar</DropdownMenuItem>
          <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(-1)}>
            Mover para cima
          </DropdownMenuItem>
          <DropdownMenuItem disabled={index === total - 1} onSelect={() => onMove(1)}>
            Mover para baixo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => startTransition(async () => void (await removeItem(item.id)))}>
            Remover
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function ItemStatusMenu({
  status,
  linked,
  onChange,
}: {
  itemId: string;
  status: Status;
  linked: boolean;
  onChange: (status: Status) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Status: ${STATUS_LABEL[status]}. Alterar status`}
        className="cursor-pointer justify-self-end rounded-md px-1.5 py-0.5 text-right font-sans text-[13px] text-fg-muted hover:bg-active hover:text-fg"
      >
        {STATUS_LABEL[status]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {linked && (
          <p className="px-2.5 pt-1 pb-1.5 text-xs text-dim">Altera também o status do tópico.</p>
        )}
        <DropdownMenuRadioGroup value={status} onValueChange={(v) => onChange(v as Status)}>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              <StatusDot status={s} showLabel />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
