"use client";

import { useEffect, useRef, useState } from "react";
import { saveNote } from "@/app/(app)/topicos/actions";
import { formatEditedAt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";

type Props = { topicId: string; initialContent: string; initialUpdatedAt: string | null };

type SaveState = "idle" | "dirty" | "saving" | "error";

const DEBOUNCE_MS = 800;

export function TopicNotes({ topicId, initialContent, initialUpdatedAt }: Props) {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<"editar" | "visualizar">(initialContent.trim() ? "visualizar" : "editar");
  const [state, setState] = useState<SaveState>("idle");
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initialContent); // ultimo texto digitado
  const saved = useRef(initialContent); // ultimo texto confirmado pelo servidor
  const seq = useRef(0);

  async function flush() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const text = latest.current;
    if (text === saved.current) {
      setState("idle");
      return;
    }
    const id = ++seq.current;
    setState("saving");
    const result = await saveNote(topicId, text);
    if (id !== seq.current) return; // resposta antiga, outra gravacao ja comecou
    if (result.error) {
      setError(result.error);
      setState("error");
      return;
    }
    saved.current = text;
    setError(null);
    setUpdatedAt(result.updatedAt ?? null);
    setState(latest.current === text ? "idle" : "dirty");
  }

  function onChange(text: string) {
    setContent(text);
    latest.current = text;
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
  }

  // Navegacao dentro do app: grava o que ficou pendente ao sair da pagina.
  useEffect(() => {
    const latestRef = latest;
    const savedRef = saved;
    return () => {
      if (latestRef.current !== savedRef.current) void saveNote(topicId, latestRef.current);
    };
  }, [topicId]);

  // Avisa antes de fechar a aba com alteracao ainda nao salva.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (latest.current !== saved.current) e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const statusText =
    state === "saving"
      ? "Salvando..."
      : state === "dirty"
        ? "Alterações não salvas"
        : state === "error"
          ? "Não foi possível salvar"
          : updatedAt
            ? `Editado ${formatEditedAt(new Date(updatedAt))}`
            : "Sem notas ainda";

  return (
    <section className="min-w-0 flex-[3_1_480px] overflow-hidden rounded-lg border border-line">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="font-medium">Notas</h2>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="text-[13px] text-fg-muted">
            {statusText}
          </span>
          <div role="group" aria-label="Modo das notas" className="flex gap-1 rounded-md border border-line p-0.5">
            {(
              [
                ["editar", "Editar"],
                ["visualizar", "Visualizar"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  if (value === "visualizar") void flush();
                  setMode(value);
                }}
                className={cn(
                  "cursor-pointer rounded-[4px] px-2.5 py-0.5 font-sans text-xs transition-colors",
                  mode === value ? "bg-active text-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="border-b border-line px-5 py-2 text-[13px] text-fg-muted">
          {error}{" "}
          <button type="button" onClick={() => void flush()} className="cursor-pointer text-fg underline underline-offset-4">
            Tentar de novo
          </button>
        </p>
      )}

      {mode === "editar" ? (
        <div className="p-5">
          <label htmlFor="topic-note" className="sr-only">
            Notas do tópico em markdown
          </label>
          <textarea
            id="topic-note"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => void flush()}
            placeholder={"## Resumo\n\nEscreva em markdown: títulos, listas, `código` e blocos com ```"}
            spellCheck
            className="block min-h-[420px] w-full resize-y rounded-md border border-line bg-black px-4 py-3 font-sans text-sm leading-[1.7] text-fg placeholder:text-fg-muted"
          />
          <p className="mt-2 text-xs text-fg-muted">Markdown com GFM. Salva sozinho enquanto você escreve.</p>
        </div>
      ) : content.trim() ? (
        <div className="max-w-[720px] px-7 pt-6 pb-8">
          <Markdown content={content} />
        </div>
      ) : (
        <div className="px-7 py-10 text-center">
          <p className="text-fg-muted">Nenhuma nota ainda.</p>
          <button
            type="button"
            onClick={() => setMode("editar")}
            className="mt-2 cursor-pointer text-[13px] text-fg underline underline-offset-4"
          >
            Começar a escrever
          </button>
        </div>
      )}
    </section>
  );
}
