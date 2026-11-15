"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { GripVerticalIcon } from "@/components/icons/grip-vertical";
import { useAnimatedIcon } from "@/components/icons/use-animated-icon";
import { StatusDot } from "@/components/status-dot";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { RoadmapItemRow, RoadmapStep } from "@/lib/data/roadmaps";
import { STATUS_LABEL } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useRoadmapEditor } from "./roadmap-editor";
import { StepMenuContent } from "./step-menu";

const GRID =
  "grid grid-cols-[16px_40px_16px_minmax(0,1fr)_220px_110px_28px] items-center gap-3.5";

// Ordem local otimista por grupo de irmaos ("root" = etapas principais).
type Orders = Record<string, string[]>;

function ordersFrom(steps: RoadmapStep[]): Orders {
  const orders: Orders = { root: steps.map((s) => s.id) };
  for (const s of steps) orders[s.id] = s.children.map((c) => c.id);
  return orders;
}

export function RoadmapList() {
  const editor = useRoadmapEditor();
  const { steps } = editor;
  const [orders, setOrders] = useState(() => ordersFrom(steps));
  const [synced, setSynced] = useState(steps);

  // Lista nova do servidor passa a valer.
  if (steps !== synced) {
    setSynced(steps);
    setOrders(ordersFrom(steps));
  }

  const byId = useMemo(() => {
    const map = new Map<string, RoadmapItemRow & { children?: RoadmapItemRow[] }>();
    for (const s of steps) {
      map.set(s.id, s);
      for (const c of s.children) map.set(c.id, c);
    }
    return map;
  }, [steps]);

  const groupOf = (id: string) => {
    const item = byId.get(id);
    return item?.parentId ?? "root";
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const group = groupOf(String(active.id));
    if (group !== groupOf(String(over.id))) return; // so reordena entre irmaos
    const current = orders[group];
    const next = arrayMove(current, current.indexOf(String(active.id)), current.indexOf(String(over.id)));
    setOrders((o) => ({ ...o, [group]: next }));
    const ok = await editor.reorder(group === "root" ? null : group, next);
    if (!ok) setOrders((o) => ({ ...o, [group]: current }));
  }

  const titleOf = (id: string | number) => byId.get(String(id))?.title ?? "etapa";
  const posOf = (id: string | number) => (orders[groupOf(String(id))] ?? []).indexOf(String(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Etapa "${titleOf(active.id)}" selecionada, posição ${posOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `Etapa "${titleOf(active.id)}" sobre a posição ${posOf(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `Etapa "${titleOf(active.id)}" movida para a posição ${posOf(over.id)}.` : undefined,
    onDragCancel: ({ active }) => `Movimento cancelado. Etapa "${titleOf(active.id)}" voltou ao lugar.`,
  };

  const mainSteps = orders.root.map((id) => byId.get(id)).filter(Boolean) as RoadmapStep[];

  return (
    <section className="overflow-x-auto rounded-lg border border-line">
      <div className="min-w-[820px]">
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
                "Para mover a etapa, pressione espaço. Use as setas para cima e para baixo e pressione espaço de novo para soltar, ou Esc para cancelar. Subetapas se movem dentro da etapa principal.",
            },
          }}
        >
          <SortableContext items={orders.root} strategy={verticalListSortingStrategy}>
            <ol aria-label="Etapas do roadmap">
              {mainSteps.map((step, index) => {
                const childIds = orders[step.id] ?? [];
                const children = childIds.map((id) => byId.get(id)).filter(Boolean) as RoadmapItemRow[];
                return (
                  <SortableRow key={step.id} item={step} label={String(index + 1).padStart(2, "0")} childCount={children.length}>
                    {children.length > 0 && (
                      <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
                        <ol aria-label={`Subetapas de ${step.title}`}>
                          {children.map((child, ci) => (
                            <SortableRow
                              key={child.id}
                              item={child}
                              label={`${String(index + 1).padStart(2, "0")}.${ci + 1}`}
                              nested
                            />
                          ))}
                        </ol>
                      </SortableContext>
                    )}
                  </SortableRow>
                );
              })}
            </ol>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}

type RowProps = {
  item: RoadmapItemRow;
  label: string;
  nested?: boolean;
  childCount?: number;
  children?: React.ReactNode;
};

function SortableRow({ item, label, nested = false, childCount = 0, children }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const { ref: gripRef, triggerProps: gripTrigger } = useAnimatedIcon();
  const status = item.effectiveStatus;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative bg-black", isDragging && "z-10 outline outline-1 outline-line-hover")}
    >
      <div className={cn(GRID, "border-t border-line px-4 py-[13px] hover:bg-surface", isDragging && "bg-active")}>
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
            "flex min-w-0 items-center gap-2 font-medium",
            status === "NOT_STARTED" ? "text-fg-muted" : "text-fg",
            nested && "pl-5 font-normal",
          )}
        >
          {nested && <span aria-hidden="true" className="absolute ml-[-20px] h-px w-3 bg-[#404040]" />}
          <span className="truncate">{item.title}</span>
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
      {children}
    </li>
  );
}
