"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/icons/plus";
import { AnimatedButton } from "@/components/ui/animated-button";
import type { TopicOption } from "@/lib/data/roadmaps";
import { ItemDialog } from "./item-dialog";

export function AddFirstStep({ roadmapId, topics }: { roadmapId: string; topics: TopicOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AnimatedButton icon={PlusIcon} iconSize={14} size="sm" onClick={() => setOpen(true)}>
        Adicionar a primeira etapa
      </AnimatedButton>
      <ItemDialog key={open ? "open" : "closed"} open={open} onOpenChange={setOpen} roadmapId={roadmapId} topics={topics} />
    </>
  );
}
