import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { ProgressBar } from "@/components/app/progress-bar";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { StatusDot } from "@/components/status-dot";
import { LogStudyDialog } from "@/components/study/log-study-dialog";
import { TopicFormDialog } from "@/components/topics/topic-form-dialog";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/data/dashboard";
import { listTopicOptions } from "@/lib/data/roadmaps";
import { formatLongDate } from "@/lib/dates";
import { formatMinutes, formatRelative, formatRelativeKey, plural } from "@/lib/format";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [data, topics] = await Promise.all([getDashboard(userId), listTopicOptions(userId)]);

  const logButton = (
    <LogStudyDialog trigger={<Button>Registrar estudo</Button>} topics={topics} today={data.today} />
  );

  if (data.topicCount === 0 && data.roadmaps.length === 0) {
    return (
      <div className="flex flex-col gap-7">
        <PageHeader eyebrow={formatLongDate()} title="Hoje" />
        <EmptyState
          title="Bem-vindo ao Estudos"
          description="Comece criando um tópico que você quer estudar. Depois registre suas sessões para acompanhar sequência, tempo da semana e atividade."
          action={<TopicFormDialog trigger={<Button size="sm">Criar primeiro tópico</Button>} />}
        />
      </div>
    );
  }

  const metrics = [
    { label: "Sequência", value: plural(data.streak, "dia", "dias") },
    { label: "Esta semana", value: formatMinutes(data.weekMinutes) },
    { label: "Em andamento", value: plural(data.studyingCount, "tópico", "tópicos") },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader eyebrow={formatLongDate()} title="Hoje" actions={logButton} />

      <section
        aria-label="Resumo"
        className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-px overflow-hidden rounded-lg border border-line bg-line"
      >
        {metrics.map((m) => (
          <div key={m.label} className="bg-black px-5 py-[18px]">
            <div className="text-[13px] text-fg-muted">{m.label}</div>
            <div className="mt-1 text-[28px] font-semibold tracking-[-0.02em]">{m.value}</div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <section className="min-w-0 flex-[3_1_480px] overflow-hidden rounded-lg border border-line">
          <div className="flex items-center justify-between px-4 py-3.5">
            <h2 className="font-medium">Em andamento</h2>
            <Link href="/topicos?status=estudando" className="text-[13px] text-fg-muted hover:text-fg">
              Ver todos
            </Link>
          </div>
          {data.inProgress.length === 0 ? (
            <p className="border-t border-line px-4 py-6 text-[13px] text-fg-muted">
              Nenhum tópico com status Estudando. Mude o status de um tópico para acompanhá-lo aqui.
            </p>
          ) : (
            <ul>
              {data.inProgress.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/topicos/${t.id}`}
                    className="flex items-center gap-3 border-t border-line px-4 py-[13px] hover:bg-surface"
                  >
                    <StatusDot status={t.status} />
                    <span className="min-w-0 flex-1 truncate font-medium">{t.title}</span>
                    {t.tag && <span className="hidden text-[13px] text-fg-muted sm:inline">{t.tag}</span>}
                    <span className="w-[88px] shrink-0 text-right text-[13px] text-fg-muted">
                      {t.lastStudiedKey
                        ? formatRelativeKey(t.lastStudiedKey, data.today)
                        : formatRelative(t.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-6">
          <section className="overflow-hidden rounded-lg border border-line">
            <div className="flex items-center justify-between px-4 py-3.5">
              <h2 className="font-medium">Roadmaps</h2>
              <Link href="/roadmaps" className="text-[13px] text-fg-muted hover:text-fg">
                Ver todos
              </Link>
            </div>
            {data.roadmaps.length === 0 ? (
              <p className="border-t border-line px-4 py-6 text-[13px] text-fg-muted">
                Nenhum roadmap ainda.{" "}
                <Link href="/roadmaps" className="text-fg underline underline-offset-4">
                  Criar um roadmap
                </Link>
              </p>
            ) : (
              <ul>
                {data.roadmaps.map((r) => (
                  <li key={r.id}>
                    <Link href={`/roadmaps/${r.id}`} className="block border-t border-line px-4 py-3.5 hover:bg-surface">
                      <div className="flex justify-between gap-3">
                        <span className="truncate font-medium">{r.title}</span>
                        <span className="shrink-0 text-[13px] text-fg-muted">
                          {r.done} de {plural(r.total, "etapa", "etapas")}
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <ProgressBar pct={r.pct} label={`Progresso de ${r.title}`} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ActivityHeatmap
            cells={data.heatmap.cells}
            totalMinutes={data.heatmap.totalMinutes}
            activeDays={data.heatmap.activeDays}
          />
        </div>
      </div>
    </div>
  );
}
