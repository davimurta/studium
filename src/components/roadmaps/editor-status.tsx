"use client";

import { useRoadmapEditor } from "./roadmap-editor";

// Mensagem de erro das acoes de etapa (mover, remover, status).
export function EditorStatus() {
  const { error } = useRoadmapEditor();
  if (!error) return null;
  return (
    <p role="alert" className="rounded-md border border-line px-3 py-2 text-[13px]">
      {error}
    </p>
  );
}
