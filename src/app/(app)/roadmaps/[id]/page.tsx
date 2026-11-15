import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/app/empty-state";
import { ProgressBar } from "@/components/app/progress-bar";
import { StatusDot } from "@/components/status-dot";
import { AddFirstStep } from "@/components/roadmaps/add-first-step";
import { EditorStatus } from "@/components/roadmaps/editor-status";
import { RoadmapActions } from "@/components/roadmaps/roadmap-actions";
import { RoadmapEditorProvider } from "@/components/roadmaps/roadmap-editor";
import { RoadmapGraph } from "@/components/roadmaps/roadmap-graph";
import { RoadmapList } from "@/components/roadmaps/roadmap-list";
import { getRoadmap, listTopicOptions } from "@/lib/data/roadmaps";
import { requireUserId } from "@/lib/session";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/roadmaps/[id]">): Promise<Metadata> {
  const userId = await requireUserId();
  const roadmap = await getRoadmap(userId, (await params).id);
  return { title: roadmap ? `Roadmap: ${roadmap.title}` : "Roadmap" };
}

export default async function RoadmapPage({ params, searchParams }: PageProps<"/roadmaps/[id]">) {
  const userId = await requireUserId();
  const { id } = await params;
  const { modo } = await searchParams;
  const view = modo === "lista" ? "lista" : "mapa";
  const [roadmap, topics] = await Promise.all([getRoadmap(userId, id), listTopicOptions(userId)]);
  if (!roadmap) notFound();

  const subCount = roadmap.steps.reduce((n, s) => n + s.children.length, 0);

  return (
    <RoadmapEditorProvider roadmapId={roadmap.id} steps={roadmap.steps} topics={topics}>
      <div className="flex flex-col gap-7">
        <header className="flex flex-col gap-3.5">
          <nav aria-label="Trilha" className="text-[13px] text-fg-muted">
            <Link href="/roadmaps" className="hover:text-fg">
              Roadmaps
            </Link>{" "}
            / <span aria-current="page">{roadmap.title}</span>
          </nav>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-[620px] min-w-0">
              <h1 className="text-[28px] font-semibold tracking-[-0.02em] break-words sm:text-[34px]">
                {roadmap.title}
              </h1>
              {roadmap.description && <p className="mt-2 text-fg-muted">{roadmap.description}</p>}
            </div>
            <RoadmapActions
              roadmap={{ id: roadmap.id, title: roadmap.title, description: roadmap.description }}
            />
          </div>
          <div className="max-w-[520px]">
            <div className="mb-2 flex justify-between text-[13px] text-fg-muted">
              <span>
                {roadmap.done} de {roadmap.total} {roadmap.total === 1 ? "etapa concluída" : "etapas concluídas"}
              </span>
              <span>{roadmap.pct}%</span>
            </div>
            <ProgressBar pct={roadmap.pct} label="Progresso do roadmap" />
          </div>
        </header>

        {roadmap.steps.length === 0 ? (
          <EmptyState
            title="Nenhuma etapa ainda"
            description="Adicione etapas principais e depois subetapas dentro delas. Cada uma pode ter título livre ou ligar um tópico."
            action={<AddFirstStep />}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav aria-label="Modo de visualização" className="flex gap-1 rounded-md border border-line p-1">
                {(
                  [
                    ["mapa", "Mapa"],
                    ["lista", "Lista"],
                  ] as const
                ).map(([value, label]) => (
                  <Link
                    key={value}
                    href={value === "mapa" ? `/roadmaps/${roadmap.id}` : `/roadmaps/${roadmap.id}?modo=lista`}
                    aria-current={view === value ? "page" : undefined}
                    scroll={false}
                    className={cn(
                      "rounded-[4px] px-3 py-1 text-[13px] transition-colors",
                      view === value ? "bg-active text-fg" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
                <span>
                  {roadmap.steps.length} {roadmap.steps.length === 1 ? "etapa" : "etapas"}
                  {subCount > 0 && ` e ${subCount} ${subCount === 1 ? "subetapa" : "subetapas"}`}
                </span>
                <span aria-hidden="true" className="hidden h-3 w-px bg-line sm:block" />
                <StatusDot status="DONE" showLabel />
                <StatusDot status="STUDYING" showLabel />
                <StatusDot status="NOT_STARTED" showLabel />
              </div>
            </div>
            <EditorStatus />
            {view === "mapa" ? (
              <>
                <RoadmapGraph />
                <p className="text-xs text-fg-muted">
                  Clique em uma etapa para mudar o status, editar, adicionar subetapas ou reordenar. Para
                  arrastar, use o modo Lista.
                </p>
              </>
            ) : (
              <RoadmapList />
            )}
          </div>
        )}
      </div>
    </RoadmapEditorProvider>
  );
}
