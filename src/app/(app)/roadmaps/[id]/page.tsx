import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/app/empty-state";
import { ProgressBar } from "@/components/app/progress-bar";
import { AddFirstStep } from "@/components/roadmaps/add-first-step";
import { RoadmapActions } from "@/components/roadmaps/roadmap-actions";
import { RoadmapSteps } from "@/components/roadmaps/roadmap-steps";
import { getRoadmap, listTopicOptions } from "@/lib/data/roadmaps";
import { requireUserId } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/roadmaps/[id]">): Promise<Metadata> {
  const userId = await requireUserId();
  const roadmap = await getRoadmap(userId, (await params).id);
  return { title: roadmap ? `Roadmap: ${roadmap.title}` : "Roadmap" };
}

export default async function RoadmapPage({ params }: PageProps<"/roadmaps/[id]">) {
  const userId = await requireUserId();
  const [roadmap, topics] = await Promise.all([
    getRoadmap(userId, (await params).id),
    listTopicOptions(userId),
  ]);
  if (!roadmap) notFound();

  return (
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
            topics={topics}
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

      {roadmap.items.length === 0 ? (
        <EmptyState
          title="Nenhuma etapa ainda"
          description="Adicione etapas com título livre ou ligue tópicos que você já está estudando."
          action={<AddFirstStep roadmapId={roadmap.id} topics={topics} />}
        />
      ) : (
        <RoadmapSteps roadmapId={roadmap.id} items={roadmap.items} topics={topics} />
      )}
    </div>
  );
}
