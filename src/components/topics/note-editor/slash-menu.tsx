"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { Editor, Range } from "@tiptap/core";
import { cn } from "@/lib/utils";

export type SlashItem = {
  title: string;
  hint: string;
  keywords: string[];
  run: (editor: Editor, range: Range) => void;
};

// Blocos disponiveis no menu "/".
export const SLASH_ITEMS: SlashItem[] = [
  {
    title: "Texto",
    hint: "Parágrafo simples",
    keywords: ["texto", "paragrafo", "p"],
    run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run(),
  },
  {
    title: "Título 1",
    hint: "#",
    keywords: ["titulo", "h1", "heading"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run(),
  },
  {
    title: "Título 2",
    hint: "##",
    keywords: ["titulo", "h2", "subtitulo"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run(),
  },
  {
    title: "Título 3",
    hint: "###",
    keywords: ["titulo", "h3"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run(),
  },
  {
    title: "Lista",
    hint: "-",
    keywords: ["lista", "bullet", "marcadores"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run(),
  },
  {
    title: "Lista numerada",
    hint: "1.",
    keywords: ["lista", "numerada", "ordenada"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run(),
  },
  {
    title: "Lista de tarefas",
    hint: "[ ]",
    keywords: ["tarefa", "todo", "checklist", "check"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run(),
  },
  {
    title: "Citação",
    hint: ">",
    keywords: ["citacao", "quote"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run(),
  },
  {
    title: "Bloco de código",
    hint: "```",
    keywords: ["codigo", "code"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run(),
  },
  {
    title: "Tabela",
    hint: "3 × 3",
    keywords: ["tabela", "table"],
    run: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: "Divisor",
    hint: "---",
    keywords: ["divisor", "linha", "hr"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
  },
];

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filterSlashItems(query: string): SlashItem[] {
  const q = normalize(query.trim());
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter(
    (item) => normalize(item.title).includes(q) || item.keywords.some((k) => k.startsWith(q)),
  );
}

export type SlashMenuHandle = { onKeyDown: (event: KeyboardEvent) => boolean };

type Props = { items: SlashItem[]; command: (item: SlashItem) => void };

export const SlashMenu = forwardRef<SlashMenuHandle, Props>(function SlashMenu({ items, command }, ref) {
  const [selected, setSelected] = useState(0);
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setSelected(0);
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (items.length === 0) return false;
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelected((s) => (s - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  useEffect(() => {
    document.getElementById(`slash-item-${selected}`)?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <div
      role="listbox"
      aria-label="Inserir bloco"
      className="max-h-[300px] w-[240px] overflow-y-auto rounded-lg border border-line bg-black p-1 text-fg"
    >
      {items.length === 0 ? (
        <p className="px-2.5 py-1.5 text-[13px] text-fg-muted">Nenhum bloco encontrado</p>
      ) : (
        items.map((item, index) => (
          <button
            key={item.title}
            id={`slash-item-${index}`}
            type="button"
            role="option"
            aria-selected={index === selected}
            onMouseEnter={() => setSelected(index)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => command(item)}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left font-sans text-[13px]",
              index === selected ? "bg-active text-fg" : "text-fg-muted",
            )}
          >
            <span>{item.title}</span>
            <span className="font-mono text-[11px] text-dim">{item.hint}</span>
          </button>
        ))
      )}
    </div>
  );
});
