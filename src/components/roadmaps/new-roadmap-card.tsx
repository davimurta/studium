"use client";

import { PlusIcon } from "@/components/icons/plus";
import { useAnimatedIcon } from "@/components/icons/use-animated-icon";
import { RoadmapFormDialog } from "./roadmap-form-dialog";

// Card tracejado "Criar novo roadmap".
export function NewRoadmapCard() {
  const { ref, triggerProps } = useAnimatedIcon();
  return (
    <RoadmapFormDialog
      trigger={
        <button
          type="button"
          {...triggerProps}
          className="group flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#404040] bg-transparent p-5 font-sans text-sm text-fg-muted transition-colors hover:border-line-hover hover:text-fg"
        >
          <span className="flex size-9 items-center justify-center rounded-full border border-line transition-colors group-hover:border-line-hover">
            <PlusIcon ref={ref} size={16} />
          </span>
          Criar novo roadmap
        </button>
      }
    />
  );
}
