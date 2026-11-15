import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { effectiveStatus, progress } from "@/lib/roadmap";

const itemStatusSelect = {
  status: true,
  topic: { select: { status: true } },
} as const;

export async function listRoadmaps(userId: string) {
  const roadmaps = await db.roadmap.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      updatedAt: true,
      items: { select: itemStatusSelect },
    },
  });
  return roadmaps.map(({ items, ...r }) => ({ ...r, ...progress(items) }));
}

export const getRoadmap = cache(async (userId: string, id: string) => {
  const roadmap = await db.roadmap.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      description: true,
      items: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          status: true,
          topic: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });
  if (!roadmap) return null;
  const items = roadmap.items.map((item) => ({ ...item, effectiveStatus: effectiveStatus(item) }));
  return { ...roadmap, items, ...progress(roadmap.items) };
});

export type RoadmapDetail = NonNullable<Awaited<ReturnType<typeof getRoadmap>>>;
export type RoadmapItemRow = RoadmapDetail["items"][number];

// Topicos disponiveis para vincular a etapas.
export async function listTopicOptions(userId: string) {
  return db.topic.findMany({
    where: { userId, archivedAt: null },
    orderBy: { title: "asc" },
    select: { id: true, title: true, status: true },
  });
}

export type TopicOption = Awaited<ReturnType<typeof listTopicOptions>>[number];
