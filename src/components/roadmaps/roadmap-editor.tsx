"use client";

import { createContext, use, useCallback, useMemo, useState, useTransition, type ReactNode } from "react";
import type { Status } from "@/generated/prisma/enums";
import { removeItem, reorderItems, saveStructure, setItemStatus } from "@/app/(app)/roadmaps/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { RoadmapItemRow, RoadmapStep, TopicOption } from "@/lib/data/roadmaps";
import { flatten, indent, outdent, type FlatItem } from "@/lib/roadmap-tree";
import { ItemDialog } from "./item-dialog";

type DialogState =
  | { kind: "closed" }
  | { kind: "add"; parentId: string | null }
  | { kind: "edit"; item: RoadmapItemRow };

type Editor = {
  roadmapId: string;
  steps: RoadmapStep[];
  topics: TopicOption[];
  pending: boolean;
  error: string | null;
  openAdd: (parentId: string | null) => void;
  openEdit: (item: RoadmapItemRow) => void;
  setStatus: (item: RoadmapItemRow, status: Status) => void;
  remove: (item: RoadmapItemRow) => void;
  move: (item: RoadmapItemRow, delta: -1 | 1) => void;
  reorder: (parentId: string | null, ids: string[]) => Promise<boolean>;
  save: (flat: FlatItem[]) => Promise<boolean>;
  canIndent: (item: RoadmapItemRow) => boolean;
  indent: (item: RoadmapItemRow) => void;
  outdent: (item: RoadmapItemRow) => void;
  siblingsOf: (item: RoadmapItemRow) => RoadmapItemRow[];
};

const EditorContext = createContext<Editor | null>(null);

export function useRoadmapEditor() {
  const editor = use(EditorContext);
  if (!editor) throw new Error("useRoadmapEditor precisa de RoadmapEditorProvider");
  return editor;
}

type Props = {
  roadmapId: string;
  steps: RoadmapStep[];
  topics: TopicOption[];
  children: ReactNode;
};

// Estado e acoes compartilhados entre o mapa e a lista: dialogs, status, mover e remover.
export function RoadmapEditorProvider({ roadmapId, steps, topics, children }: Props) {
  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<RoadmapStep | null>(null);

  const siblingsOf = useCallback(
    (item: RoadmapItemRow): RoadmapItemRow[] =>
      item.parentId === null ? steps : (steps.find((s) => s.id === item.parentId)?.children ?? []),
    [steps],
  );

  const run = useCallback((task: () => Promise<{ error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (result.error) setError(result.error);
    });
  }, []);

  const reorder = useCallback(
    async (parentId: string | null, ids: string[]) => {
      setError(null);
      const result = await reorderItems(roadmapId, parentId, ids);
      if (result.error) setError(result.error);
      return !result.error;
    },
    [roadmapId],
  );

  const save = useCallback(
    async (flat: FlatItem[]) => {
      setError(null);
      const result = await saveStructure(
        roadmapId,
        flat.map((f) => ({ id: f.id, depth: f.depth })),
      );
      if (result.error) setError(result.error);
      return !result.error;
    },
    [roadmapId],
  );

  const editor = useMemo<Editor>(
    () => ({
      roadmapId,
      steps,
      topics,
      pending,
      error,
      siblingsOf,
      reorder,
      save,
      canIndent: (item) => indent(flatten(steps), item.id) !== null,
      indent: (item) => {
        const next = indent(flatten(steps), item.id);
        if (next) run(async () => ({ error: (await save(next)) ? undefined : "Não foi possível mover." }));
      },
      outdent: (item) => {
        const next = outdent(flatten(steps), item.id);
        if (next) run(async () => ({ error: (await save(next)) ? undefined : "Não foi possível mover." }));
      },
      openAdd: (parentId) => setDialog({ kind: "add", parentId }),
      openEdit: (item) => setDialog({ kind: "edit", item }),
      setStatus: (item, status) => run(() => setItemStatus(item.id, status)),
      // Etapa principal com subetapas pede confirmacao (as subetapas saem junto).
      remove: (item) => {
        const step = steps.find((s) => s.id === item.id);
        if (step && step.children.length > 0) setConfirmRemove(step);
        else run(() => removeItem(item.id));
      },
      move: (item, delta) => {
        const ids = siblingsOf(item).map((s) => s.id);
        const from = ids.indexOf(item.id);
        const to = from + delta;
        if (from < 0 || to < 0 || to >= ids.length) return;
        ids.splice(to, 0, ids.splice(from, 1)[0]);
        run(async () => {
          const result = await reorderItems(roadmapId, item.parentId, ids);
          return result;
        });
      },
    }),
    [roadmapId, steps, topics, pending, error, siblingsOf, reorder, save, run],
  );

  const editing = dialog.kind === "edit" ? dialog.item : undefined;
  const editingHasChildren = editing ? (steps.find((s) => s.id === editing.id)?.children.length ?? 0) > 0 : false;

  return (
    <EditorContext value={editor}>
      {children}
      <ItemDialog
        key={dialog.kind === "closed" ? "closed" : dialog.kind === "add" ? `add-${dialog.parentId}` : `edit-${dialog.item.id}`}
        open={dialog.kind !== "closed"}
        onOpenChange={(open) => !open && setDialog({ kind: "closed" })}
        roadmapId={roadmapId}
        topics={topics}
        steps={steps}
        item={editing}
        itemHasChildren={editingHasChildren}
        parentId={dialog.kind === "add" ? dialog.parentId : null}
      />
      <AlertDialog open={confirmRemove !== null} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{confirmRemove?.title}&quot; e as {confirmRemove?.children.length} subetapas dela saem do
              roadmap. Os tópicos ligados continuam existindo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancelar</Button>
            </AlertDialogCancel>
            <Button
              onClick={() => {
                const target = confirmRemove;
                setConfirmRemove(null);
                if (target) run(() => removeItem(target.id));
              }}
            >
              Remover
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EditorContext>
  );
}
