"use client";

import { PlusIcon } from "@/components/icons/plus";
import { AnimatedButton } from "@/components/ui/animated-button";
import { RoadmapFormDialog } from "./roadmap-form-dialog";

export function NewRoadmapButton() {
  return (
    <RoadmapFormDialog
      trigger={
        <AnimatedButton icon={PlusIcon} iconSize={14}>
          Novo roadmap
        </AnimatedButton>
      }
    />
  );
}
