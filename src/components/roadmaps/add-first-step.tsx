"use client";

import { PlusIcon } from "@/components/icons/plus";
import { AnimatedButton } from "@/components/ui/animated-button";
import { useRoadmapEditor } from "./roadmap-editor";

export function AddFirstStep() {
  const editor = useRoadmapEditor();
  return (
    <AnimatedButton icon={PlusIcon} iconSize={14} size="sm" onClick={() => editor.openAdd(null)}>
      Adicionar a primeira etapa
    </AnimatedButton>
  );
}
