import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { ProgressBar } from "@/components/app/progress-bar";
import { NewRoadmapButton } from "@/components/roadmaps/new-roadmap-button";
import { NewRoadmapCard } from "@/components/roadmaps/new-roadmap-card";
import { listRoadmaps } from "@/lib/data/roadmaps";
import { formatRelative, plural } from "@/lib/format";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Roadmaps" };

export default async function RoadmapsPage() {
  const userId = await requireUserId();
  const roadmaps = await listRoadmaps(userId);
  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={plural(roadmaps.length, "roadmap", "roadmaps")}
        title="Roadmaps"
        actions={<NewRoadmapButton />}
      />

      {roadmaps.length === 0 && (
        <p className="max-w-lg text-fg-muted">
          Nenhum roadmap ainda. Monte um caminho de estudo em etapas, ligando tópicos que você já
          tem ou criando etapas soltas.
        </p>
      )}

      <section
        aria-label="Seus roadmaps"
        className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4"
      >
        {roadmaps.map((r) => (
          <Link
            key={r.id}
            href={`/roadmaps/${r.id}`}
            className="flex min-h-[200px] flex-col gap-4 rounded-lg border border-line p-5 transition-colors hover:border-line-hover"
          >
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{r.title}</h2>
              {r.description && <p className="mt-1.5 line-clamp-3 text-fg-muted">{r.description}</p>}
            </div>
            <div className="mt-auto">
              <div className="mb-2 flex justify-between text-[13px] text-fg-muted">
                <span>
                  {r.done} de {plural(r.total, "etapa", "etapas")}
                </span>
                <span>{r.pct}%</span>
              </div>
              <ProgressBar pct={r.pct} label={`Progresso de ${r.title}`} />
              <div className="mt-3.5 text-xs text-fg-muted">Atualizado {formatRelative(r.updatedAt, now)}</div>
            </div>
          </Link>
        ))}
        <NewRoadmapCard />
      </section>
    </div>
  );
}
