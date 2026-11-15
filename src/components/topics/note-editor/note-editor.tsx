"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Placeholder } from "@tiptap/extensions";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { cn } from "@/lib/utils";
import { SlashCommand } from "./slash-command";

type Props = {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  onBlur: () => void;
};

/*
  Editor visual estilo Notion: o markdown aparece renderizado e e editado no lugar.
  Atalhos de markdown funcionam enquanto digita (## titulo, - lista, [ ] tarefa,
  ``` codigo, > citacao) e "/" abre o menu de blocos. O conteudo continua salvo
  como markdown.
*/
export function NoteEditor({ initialMarkdown, onChange, onBlur }: Props) {
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  useEffect(() => {
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        dropcursor: { color: "#525252", width: 2 },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https"],
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        a11y: {
          checkboxLabel: (node, checked) =>
            `${checked ? "Desmarcar" : "Marcar"} tarefa: ${node.textContent || "tarefa vazia"}`,
        },
      }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading" ? "Título" : "Escreva, ou digite / para inserir um bloco",
      }),
      Markdown,
      SlashCommand,
    ],
    content: initialMarkdown,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: "note-content min-h-[360px] outline-none",
        "aria-label": "Notas do tópico",
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current(editor.getMarkdown()),
    onBlur: () => onBlurRef.current(),
  });

  if (!editor) {
    return <div className="note-content min-h-[360px]" aria-busy="true" />;
  }

  return (
    <>
      <FormatBubble editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
}

// Menu que aparece ao selecionar texto: negrito, italico, riscado, codigo e link.
function FormatBubble({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState("");
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      linkHref: (e.getAttributes("link").href as string | undefined) ?? "",
    }),
  });

  function applyLink() {
    const value = href.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!value) chain.unsetLink().run();
    else chain.setLink({ href: /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}` }).run();
    setLinkOpen(false);
  }

  const buttons = [
    { key: "bold", label: "Negrito", text: "B", className: "font-semibold", run: () => editor.chain().focus().toggleBold().run() },
    { key: "italic", label: "Itálico", text: "I", className: "italic", run: () => editor.chain().focus().toggleItalic().run() },
    { key: "strike", label: "Riscado", text: "S", className: "line-through", run: () => editor.chain().focus().toggleStrike().run() },
    { key: "code", label: "Código", text: "</>", className: "font-mono text-[11px]", run: () => editor.chain().focus().toggleCode().run() },
  ] as const;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e, from, to }) => from !== to && !e.isActive("codeBlock")}
      options={{ placement: "top", offset: 8, onHide: () => setLinkOpen(false) }}
      className="z-50"
    >
      <div className="flex items-center gap-0.5 rounded-lg border border-line bg-black p-1">
        {linkOpen ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyLink();
            }}
            className="flex items-center gap-1"
          >
            <label className="sr-only" htmlFor="note-link-input">
              Endereço do link
            </label>
            <input
              id="note-link-input"
              autoFocus
              value={href}
              onChange={(e) => setHref(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setLinkOpen(false)}
              placeholder="https://"
              className="w-56 rounded-md border border-line bg-black px-2 py-1 font-sans text-xs text-fg placeholder:text-fg-muted"
            />
            <button type="submit" className="cursor-pointer rounded-md px-2 py-1 text-xs text-fg hover:bg-active">
              Aplicar
            </button>
          </form>
        ) : (
          <>
            {buttons.map((b) => (
              <button
                key={b.key}
                type="button"
                aria-label={b.label}
                aria-pressed={state[b.key]}
                onClick={b.run}
                className={cn(
                  "flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-md px-1.5 font-sans text-[13px]",
                  b.className,
                  state[b.key] ? "bg-active text-fg" : "text-fg-muted hover:bg-active hover:text-fg",
                )}
              >
                {b.text}
              </button>
            ))}
            <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-line" />
            <button
              type="button"
              aria-pressed={state.link}
              onClick={() => {
                setHref(state.linkHref);
                setLinkOpen(true);
              }}
              className={cn(
                "flex h-7 cursor-pointer items-center rounded-md px-2 font-sans text-xs",
                state.link ? "bg-active text-fg" : "text-fg-muted hover:bg-active hover:text-fg",
              )}
            >
              Link
            </button>
            {state.link && state.linkHref && (
              <a
                href={state.linkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 items-center rounded-md px-2 text-xs text-fg-muted hover:bg-active hover:text-fg"
              >
                Abrir
              </a>
            )}
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
