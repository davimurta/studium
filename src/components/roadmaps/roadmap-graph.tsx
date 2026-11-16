"use client";

import { Link2Icon } from "lucide-react";
import { StatusDot } from "@/components/status-dot";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { RoadmapItemRow, RoadmapStep } from "@/lib/data/roadmaps";
import { STATUS_LABEL } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useRoadmapEditor } from "./roadmap-editor";
import { StepMenuContent } from "./step-menu";

/*
  Mapa visual inspirado no roadmap.sh, em preto e branco.
  Desktop: espinha vertical no centro, etapas principais sobre ela e subetapas
  ramificando para a esquerda e a direita, alternando a cada etapa.
  Mobile: uma coluna, subetapas abaixo da etapa principal.
*/

const LINE = "bg-[#404040]";

export function RoadmapGraph() {
  const { steps } = useRoadmapEditor();

  // Alterna o lado so entre etapas que tem subetapas: direita, esquerda, direita...
  let branching = 0;
  const sides = steps.map((step) =>
    step.children.length > 0 ? (branching++ % 2 === 0 ? "right" : "left") : "right",
  ) as ("left" | "right")[];

  return (
    <section aria-label="Mapa do roadmap" className="relative rounded-lg border border-line px-4 py-10 sm:px-8">
      {/* Espinha */}
      <div aria-hidden="true" className={cn("absolute top-10 bottom-10 left-1/2 hidden w-px -translate-x-1/2 md:block", LINE)} />
      <div aria-hidden="true" className="absolute top-10 left-1/2 hidden size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white md:block" />

      <ol className="relative flex flex-col gap-6 md:gap-8">
        {steps.map((step, index) => (
          <StepRow key={step.id} step={step} index={index} side={sides[index]} />
        ))}
      </ol>
    </section>
  );
}

function StepRow({ step, index, side }: { step: RoadmapStep; index: number; side: "left" | "right" }) {
  const hasChildren = step.children.length > 0;
  const branch = hasChildren ? <Branch items={step.children} side={side} /> : null;

  return (
    <li className="grid grid-cols-1 items-center gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)_minmax(0,1fr)] md:gap-0">
      <div className="order-2 min-w-0 md:order-none">{side === "left" && branch}</div>
      <div className="relative z-10 order-1 md:order-none">
        <MainNode step={step} number={index + 1} />
      </div>
      <div className="order-3 min-w-0 md:order-none">{side === "right" && branch}</div>
    </li>
  );
}

function MainNode({ step, number }: { step: RoadmapStep; number: number }) {
  const notStarted = step.effectiveStatus === "NOT_STARTED";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Etapa ${number}: ${step.title}. ${STATUS_LABEL[step.effectiveStatus]}${
          step.children.length ? `. ${step.children.length} subetapas` : ""
        }. Abrir ações`}
        className={cn(
          "group flex w-full cursor-pointer items-center gap-3 rounded-md border-[1.5px] bg-black px-4 py-3 text-left font-sans transition-colors hover:bg-surface data-[state=open]:bg-active",
          notStarted ? "border-dim" : "border-white",
        )}
      >
        <span className="text-xs text-fg-muted tabular-nums">{String(number).padStart(2, "0")}</span>
        <span
          className={cn(
            "min-w-0 flex-1 text-[15px] font-semibold tracking-[-0.01em] break-words",
            notStarted && "text-fg-muted",
          )}
        >
          {step.title}
        </span>
        {step.topic && <Link2Icon aria-hidden="true" className="size-3.5 shrink-0 text-fg-muted" />}
        <StatusDot status={step.effectiveStatus} />
      </DropdownMenuTrigger>
      <StepMenuContent item={step} childCount={step.children.length} />
    </DropdownMenu>
  );
}

/*
  Ramo de subetapas. Conectores desenhados com elementos de 1px:
  - linha horizontal da etapa principal ate o "colchete";
  - colchete vertical ligando o centro da primeira ao centro da ultima subetapa;
  - toco horizontal ate cada subetapa.
  No mobile o ramo fica sempre a direita (indentado abaixo da etapa).
*/
function Branch({ items, side }: { items: RoadmapItemRow[]; side: "left" | "right" }) {
  const left = side === "left";
  return (
    <div className={cn("relative pl-12", left && "md:pr-12 md:pl-0")}>
      {/* Ligacao com a etapa principal (desktop) */}
      <span
        aria-hidden="true"
        className={cn("absolute top-1/2 hidden h-px w-6", LINE, left ? "md:right-0 md:block" : "md:left-0 md:block")}
      />
      {/* Ligacao vertical no mobile, vindo da etapa principal acima */}
      <span aria-hidden="true" className={cn("absolute -top-3 left-6 h-3 w-px md:hidden", LINE)} />
      <ul className={cn("flex flex-col", left && "md:items-end")}>
        {items.map((item, i) => (
          <SubNode
            key={item.id}
            item={item}
            side={side}
            position={items.length === 1 ? "only" : i === 0 ? "first" : i === items.length - 1 ? "last" : "middle"}
          />
        ))}
      </ul>
    </div>
  );
}

type Position = "only" | "first" | "middle" | "last";

function SubNode({ item, side, position }: { item: RoadmapItemRow; side: "left" | "right"; position: Position }) {
  const left = side === "left";
  const notStarted = item.effectiveStatus === "NOT_STARTED";

  // Trecho do colchete que cada subetapa desenha.
  const bracket = {
    only: "hidden",
    first: "top-1/2 bottom-0",
    middle: "top-0 bottom-0",
    last: "top-0 bottom-1/2",
  }[position];

  return (
    <li className="relative w-full max-w-[280px] py-1">
      {/* Colchete: no mobile fica a esquerda; no desktop, do lado da espinha */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute w-px",
          LINE,
          bracket,
          position === "only" ? "" : "-left-6",
          left && position !== "only" && "md:right-[-24px] md:left-auto",
          position === "only" && "md:hidden",
        )}
      />
      {/* Toco horizontal ate o card */}
      <span
        aria-hidden="true"
        className={cn("absolute top-1/2 h-px w-6 -left-6", LINE, left && "md:right-[-24px] md:left-auto")}
      />
      {/* No mobile, o colchete continua ate o topo para encontrar a ligacao da etapa principal */}
      {(position === "first" || position === "only") && (
        <span aria-hidden="true" className={cn("absolute top-0 -left-6 h-1/2 w-px md:hidden", LINE)} />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Subetapa: ${item.title}. ${STATUS_LABEL[item.effectiveStatus]}. Abrir ações`}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border border-line bg-black px-3 py-2 text-left font-sans text-[13px] transition-colors hover:border-line-hover hover:bg-surface data-[state=open]:border-line-hover data-[state=open]:bg-active"
        >
          <StatusDot status={item.effectiveStatus} />
          <span className={cn("min-w-0 flex-1 break-words", notStarted ? "text-fg-muted" : "text-fg")}>
            {item.title}
          </span>
          {item.topic && <Link2Icon aria-hidden="true" className="size-3 shrink-0 text-fg-muted" />}
        </DropdownMenuTrigger>
        <StepMenuContent item={item} align={side === "left" ? "end" : "start"} />
      </DropdownMenu>
    </li>
  );
}
