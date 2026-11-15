import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusMenu } from "@/components/topics/status-menu";
import { TopicActions } from "@/components/topics/topic-actions";
import { TopicNotes } from "@/components/topics/topic-notes";
import { TopicResources } from "@/components/topics/topic-resources";
import { TopicTitle } from "@/components/topics/topic-title";
import { getTopic, getTopicExtras } from "@/lib/data/topics";
import { formatMinutes, formatSessionDay, formatShortDate } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/status";
import { requireUserId } from "@/lib/session";
import { unarchiveTopic } from "../actions";

export async function generateMetadata({ params }: PageProps<"/topicos/[id]">): Promise<Metadata> {
  const userId = await requireUserId();
  const topic = await getTopic(userId, (await params).id);
  return { title: topic ? `Tópico: ${topic.title}` : "Tópico" };
}

export default async function TopicPage({ params }: PageProps<"/topicos/[id]">) {
  const userId = await requireUserId();
  const { id } = await params;
  const [topic, extras] = await Promise.all([getTopic(userId, id), getTopicExtras(userId, id)]);
  if (!topic) notFound();

  const roadmaps = [
    ...new Map(topic.roadmapItems.map((i) => [i.roadmap.id, i.roadmap])).values(),
  ];
  const archived = topic.archivedAt !== null;

  return (
    <div className="flex flex-col gap-7">
      {archived && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 text-[13px]">
          <span className="text-fg-muted">Este tópico está arquivado e não aparece nas listas.</span>
          <form action={unarchiveTopic.bind(null, topic.id)}>
            <button type="submit" className="cursor-pointer underline underline-offset-4">
              Desarquivar
            </button>
          </form>
        </div>
      )}

      <header className="flex flex-col gap-3.5">
        <nav aria-label="Trilha" className="text-[13px] text-fg-muted">
          <Link href={archived ? "/topicos?arquivados=1" : "/topicos"} className="hover:text-fg">
            Tópicos
          </Link>{" "}
          / <span aria-current="page">{topic.title}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <TopicTitle key={topic.title} id={topic.id} title={topic.title} />
          <TopicActions
            archived={archived}
            topic={{
              id: topic.id,
              title: topic.title,
              description: topic.description,
              tags: topic.tags,
              status: topic.status,
            }}
          />
        </div>

        {topic.description && (
          <p className="max-w-[620px] text-fg-muted">{topic.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <StatusMenu key={topic.status} id={topic.id} status={topic.status} />
          {topic.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line px-3 py-1 text-[13px] text-fg-muted"
            >
              {tag}
            </span>
          ))}
          {roadmaps.map((r) => (
            <Link
              key={r.id}
              href={`/roadmaps/${r.id}`}
              className="rounded-full border border-line px-3 py-1 text-[13px] text-fg hover:bg-active"
            >
              Roadmap: {r.title}
            </Link>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-6">
        <TopicNotes
          key={topic.id}
          topicId={topic.id}
          initialContent={extras.note?.content ?? ""}
          initialUpdatedAt={extras.note?.updatedAt.toISOString() ?? null}
        />

        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-6">
          <section className="overflow-hidden rounded-lg border border-line">
            <h2 className="px-4 py-3.5 font-medium">Detalhes</h2>
            <dl>
              {(
                [
                  ["Status", STATUS_LABEL[topic.status]],
                  ["Criado em", formatShortDate(topic.createdAt)],
                  ["Tempo total", formatMinutes(extras.totalMinutes)],
                  ["Sessões", String(extras.sessionCount)],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-t border-line px-4 py-[11px]">
                  <dt className="text-fg-muted">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <TopicResources topicId={topic.id} resources={extras.resources} />

          <section className="overflow-hidden rounded-lg border border-line">
            <h2 className="px-4 py-3.5 font-medium">Sessões recentes</h2>
            {extras.recentSessions.length === 0 ? (
              <p className="border-t border-line px-4 py-3 text-[13px] text-fg-muted">
                Nenhuma sessão registrada ainda.
              </p>
            ) : (
              <ul>
                {extras.recentSessions.map((s) => (
                  <li key={s.id} className="flex justify-between gap-4 border-t border-line px-4 py-[11px]">
                    <span>{formatSessionDay(s.date)}</span>
                    <span className="text-fg-muted">{formatMinutes(s.minutes)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
