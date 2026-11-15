import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { STATUS_FILTERS, type TopicListParams } from "@/lib/topic-filters";

export type TopicRow = Awaited<ReturnType<typeof listTopics>>[number];

export async function listTopics(userId: string, params: TopicListParams) {
  const status = STATUS_FILTERS.find((f) => f.value === params.status)?.status ?? null;

  const where: Prisma.TopicWhereInput = {
    userId,
    archivedAt: params.archived ? { not: null } : null,
    ...(status ? { status } : {}),
    ...(params.q
      ? {
          OR: [
            { title: { contains: params.q, mode: "insensitive" } },
            { description: { contains: params.q, mode: "insensitive" } },
            { tags: { has: params.q } },
            { tags: { has: params.q.toLowerCase() } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.TopicOrderByWithRelationInput =
    params.sort === "criados"
      ? { createdAt: "desc" }
      : params.sort === "titulo"
        ? { title: "asc" }
        : { updatedAt: "desc" };

  const topics = await db.topic.findMany({
    where,
    orderBy,
    select: {
      id: true,
      title: true,
      status: true,
      tags: true,
      updatedAt: true,
      roadmapItems: {
        where: { roadmap: { userId } },
        select: { roadmap: { select: { id: true, title: true } } },
        orderBy: { roadmap: { updatedAt: "desc" } },
        take: 1,
      },
    },
  });

  const totals = await minutesByTopic(
    userId,
    topics.map((t) => t.id),
  );

  const rows = topics.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    tags: t.tags,
    updatedAt: t.updatedAt,
    roadmap: t.roadmapItems[0]?.roadmap ?? null,
    minutes: totals.get(t.id) ?? 0,
  }));

  if (params.sort === "tempo") rows.sort((a, b) => b.minutes - a.minutes);
  if (params.sort === "titulo") rows.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  return rows;
}

export async function minutesByTopic(userId: string, topicIds: string[]) {
  if (topicIds.length === 0) return new Map<string, number>();
  const groups = await db.studyLog.groupBy({
    by: ["topicId"],
    where: { userId, topicId: { in: topicIds } },
    _sum: { minutes: true },
  });
  return new Map(groups.map((g) => [g.topicId, g._sum.minutes ?? 0]));
}

export async function countTopics(userId: string) {
  const [active, archived] = await Promise.all([
    db.topic.count({ where: { userId, archivedAt: null } }),
    db.topic.count({ where: { userId, archivedAt: { not: null } } }),
  ]);
  return { active, archived };
}

// cache: generateMetadata e a pagina compartilham a mesma consulta.
export const getTopic = cache(async (userId: string, id: string) => {
  return db.topic.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      tags: true,
      archivedAt: true,
      createdAt: true,
      roadmapItems: {
        where: { roadmap: { userId } },
        select: { roadmap: { select: { id: true, title: true } } },
        orderBy: { roadmap: { updatedAt: "desc" } },
      },
    },
  });
});

// Notas, recursos, tempo total e sessoes recentes da pagina do topico.
export async function getTopicExtras(userId: string, topicId: string) {
  const [note, resources, totals, recentSessions] = await Promise.all([
    db.note.findFirst({
      where: { topicId, topic: { userId } },
      select: { content: true, updatedAt: true },
    }),
    db.resource.findMany({
      where: { topicId, topic: { userId } },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, url: true },
    }),
    db.studyLog.aggregate({
      where: { userId, topicId },
      _sum: { minutes: true },
      _count: { _all: true },
    }),
    db.studyLog.findMany({
      where: { userId, topicId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, date: true, minutes: true },
    }),
  ]);
  return {
    note,
    resources,
    totalMinutes: totals._sum.minutes ?? 0,
    sessionCount: totals._count._all,
    recentSessions,
  };
}
