"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addResource, removeResource, type ResourceFormState } from "@/app/(app)/topicos/actions";
import { PlusIcon } from "@/components/icons/plus";
import { useAnimatedIcon } from "@/components/icons/use-animated-icon";
import { XIcon } from "@/components/icons/x";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { displayUrl } from "@/lib/format";

type Resource = { id: string; title: string; url: string };

export function TopicResources({ topicId, resources }: { topicId: string; resources: Resource[] }) {
  const [adding, setAdding] = useState(false);
  const { ref: plusRef, triggerProps } = useAnimatedIcon();

  return (
    <section className="overflow-hidden rounded-lg border border-line">
      <div className="flex items-center justify-between px-4 py-3.5">
        <h2 className="font-medium">Recursos</h2>
        {!adding && (
          <Button variant="muted" size="xs" onClick={() => setAdding(true)} {...triggerProps}>
            <PlusIcon ref={plusRef} size={12} />
            Adicionar
          </Button>
        )}
      </div>

      {adding && <AddResourceForm topicId={topicId} onClose={() => setAdding(false)} />}

      {resources.length === 0 && !adding ? (
        <p className="border-t border-line px-4 py-3 text-[13px] text-fg-muted">
          Links de documentação, cursos e artigos que ajudam neste tópico.
        </p>
      ) : (
        <ul>
          {resources.map((r) => (
            <ResourceRow key={r.id} resource={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ResourceRow({ resource }: { resource: Resource }) {
  const [pending, startTransition] = useTransition();
  const { ref, triggerProps } = useAnimatedIcon();
  return (
    <li className="group relative flex items-center border-t border-line hover:bg-surface">
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 px-4 py-[11px]"
      >
        <div className="truncate font-medium">{resource.title}</div>
        <div className="truncate text-xs text-fg-muted">{displayUrl(resource.url)}</div>
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
      <button
        type="button"
        disabled={pending}
        aria-label={`Remover recurso ${resource.title}`}
        onClick={() => startTransition(async () => void (await removeResource(resource.id)))}
        {...triggerProps}
        className="mr-2 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-muted opacity-60 transition-opacity group-hover:opacity-100 hover:bg-active hover:text-fg focus-visible:opacity-100 disabled:opacity-30"
      >
        <XIcon ref={ref} size={14} />
      </button>
    </li>
  );
}

function AddResourceForm({ topicId, onClose }: { topicId: string; onClose: () => void }) {
  const [state, action, pending] = useActionState<ResourceFormState, FormData>(
    addResource.bind(null, topicId),
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form
      ref={formRef}
      action={action}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      className="flex flex-col gap-2.5 border-t border-line px-4 py-3.5"
    >
      <label className="flex flex-col gap-1 text-xs text-fg-muted">
        Título
        <Input
          key={`t-${state?.at}`}
          name="title"
          required
          maxLength={120}
          autoFocus
          placeholder="Documentação oficial"
          defaultValue={state?.values?.title}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-fg-muted">
        URL
        <Input
          key={`u-${state?.at}`}
          name="url"
          type="text"
          inputMode="url"
          autoComplete="url"
          required
          maxLength={2000}
          placeholder="https://"
          defaultValue={state?.values?.url}
          aria-invalid={state && !state.ok ? true : undefined}
        />
      </label>
      {state && !state.ok && (
        <p role="alert" className="text-xs text-fg">
          {state.error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
