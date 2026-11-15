"use client";

import { useRef, useState, useTransition } from "react";
import { renameTopic } from "@/app/(app)/topicos/actions";

const H1 = "text-[28px] font-semibold tracking-[-0.02em] sm:text-[34px]";

// Titulo editavel no lugar: clique (ou Enter) para editar, Enter salva, Esc cancela.
export function TopicTitle({ id, title }: { id: string; title: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const cancelled = useRef(false);

  function save() {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const next = value.trim();
    if (next === title) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await renameTopic(id, next);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <h1 className={`m-0 min-w-0 break-words ${H1}`}>
        <button
          type="button"
          onClick={() => {
            setValue(title);
            setEditing(true);
          }}
          className="cursor-text rounded-md text-left hover:bg-surface"
          aria-label={`${title}. Editar título`}
        >
          {title}
        </button>
      </h1>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor="topic-title-inline" className="sr-only">
        Título do tópico
      </label>
      <input
        id="topic-title-inline"
        autoFocus
        value={value}
        maxLength={120}
        disabled={pending}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "topic-title-error" : undefined}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            cancelled.current = true;
            setValue(title);
            setError(null);
            setEditing(false);
          }
        }}
        className={`w-full min-w-0 rounded-md border border-line bg-black px-2 ${H1}`}
      />
      {error && (
        <p id="topic-title-error" role="alert" className="text-[13px] text-fg-muted">
          {error}
        </p>
      )}
    </div>
  );
}
