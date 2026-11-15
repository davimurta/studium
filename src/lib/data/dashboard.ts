import "server-only";
import { db } from "@/lib/db";
import { progress } from "@/lib/roadmap";
import {
  activityLevel,
  addDays,
  computeStreak,
  dateToKey,
  keyToDate,
  todayKey,
  weekStartKey,
} from "@/lib/study-days";

export const HEATMAP_WEEKS = 16;

export type HeatCell = { key: string; minutes: number; level: 0 | 1 | 2 | 3 | 4; future: boolean };

export async function getDashboard(userId: string) {
  const today = todayKey();
  const weekStart = weekStartKey(today);
  // Primeira segunda-feira exibida no mapa (16 colunas, a ultima e a semana atual).
  const heatStart = addDays(weekStart, -(HEATMAP_WEEKS - 1) * 7);

  const [byDay, studyingCount, studyingTopics, roadmaps, topicCount] = await Promise.all([
    // Minutos por dia desde o inicio do mapa (cobre semana atual e sequencia recente).
    db.studyLog.groupBy({
      by: ["date"],
      where: { userId, date: { gte: keyToDate(addDays(heatStart, -400)) } },
      _sum: { minutes: true },
    }),
    db.topic.count({ where: { userId, archivedAt: null, status: "STUDYING" } }),
    db.topic.findMany({
      where: { userId, archivedAt: null, status: "STUDYING" },
      select: {
        id: true,
        title: true,
        status: true,
        tags: true,
        updatedAt: true,
        studyLogs: {
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: { date: true, createdAt: true },
        },
      },
    }),
    db.roadmap.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        items: { select: { status: true, topic: { select: { status: true } } } },
      },
    }),
    db.topic.count({ where: { userId, archivedAt: null } }),
  ]);

  const minutesByDay = new Map(byDay.map((d) => [dateToKey(d.date), d._sum.minutes ?? 0]));

  const streak = computeStreak(minutesByDay.keys(), today);

  let weekMinutes = 0;
  for (let k = weekStart; k <= today; k = addDays(k, 1)) weekMinutes += minutesByDay.get(k) ?? 0;

  // Colunas = semanas, linhas = segunda a domingo.
  const cells: HeatCell[] = [];
  for (let i = 0; i < HEATMAP_WEEKS * 7; i++) {
    const key = addDays(heatStart, i);
    const minutes = minutesByDay.get(key) ?? 0;
    cells.push({ key, minutes, level: activityLevel(minutes), future: key > today });
  }
  const heatTotal = cells.reduce((sum, c) => sum + c.minutes, 0);
  const heatDays = cells.filter((c) => c.minutes > 0).length;

  // Em andamento: ultimos estudados primeiro (sem sessao vao para o fim, por atualizacao).
  const inProgress = studyingTopics
    .map((t) => {
      const last = t.studyLogs[0];
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        tag: t.tags[0] ?? null,
        lastStudiedKey: last ? dateToKey(last.date) : null,
        sortKey: last ? `${dateToKey(last.date)}|${last.createdAt.toISOString()}` : "",
        updatedAt: t.updatedAt,
      };
    })
    .sort(
      (a, b) =>
        b.sortKey.localeCompare(a.sortKey) || b.updatedAt.getTime() - a.updatedAt.getTime(),
    )
    .slice(0, 5);

  return {
    today,
    streak,
    weekMinutes,
    studyingCount,
    topicCount,
    inProgress,
    roadmaps: roadmaps.map(({ items, ...r }) => ({ ...r, ...progress(items) })),
    heatmap: { cells, start: heatStart, totalMinutes: heatTotal, activeDays: heatDays },
  };
}
