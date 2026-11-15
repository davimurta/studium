import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { SlashMenu, filterSlashItems, type SlashItem, type SlashMenuHandle } from "./slash-menu";

// Digitar "/" abre o menu de blocos, como no Notion.
export const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: "/",
        allowSpaces: false,
        startOfLine: false,
        // Nao abre dentro de blocos de codigo.
        allow: ({ editor }) => !editor.isActive("codeBlock"),
        items: ({ query }) => filterSlashItems(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let renderer: ReactRenderer<SlashMenuHandle> | null = null;
          let popup: HTMLDivElement | null = null;

          const place = (rect: DOMRect | null | undefined) => {
            if (!popup || !rect) return;
            const below = rect.bottom + 6;
            const fitsBelow = below + 300 < window.innerHeight;
            popup.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 256))}px`;
            // Sem espaco abaixo: abre para cima, encostado na linha do cursor.
            popup.style.top = fitsBelow ? `${below}px` : "auto";
            popup.style.bottom = fitsBelow ? "auto" : `${window.innerHeight - rect.top + 6}px`;
          };

          return {
            onStart: (props) => {
              renderer = new ReactRenderer(SlashMenu, { props, editor: props.editor });
              popup = document.createElement("div");
              popup.style.position = "fixed";
              popup.style.zIndex = "60";
              popup.appendChild(renderer.element);
              document.body.appendChild(popup);
              place(props.clientRect?.());
            },
            onUpdate: (props) => {
              renderer?.updateProps(props);
              place(props.clientRect?.());
            },
            onKeyDown: ({ event }) => {
              if (event.key === "Escape") {
                popup?.remove();
                return true;
              }
              return renderer?.ref?.onKeyDown(event) ?? false;
            },
            onExit: () => {
              popup?.remove();
              renderer?.destroy();
              popup = null;
              renderer = null;
            },
          };
        },
      }),
    ];
  },
});
