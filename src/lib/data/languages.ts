import "server-only";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/format";
import { consistency, isScheduled, monthStartKey, weekKeys } from "@/lib/routine";
import { addDays, dateToKey, keyToDate, todayKey, weekStartKey } from "@/lib/study-days";

export const CONSISTENCY_DAYS = 28;

const itemSelect = {
  id: true,
  title: true,
  details: true,
  frequency: true,
  weekdays: true,
  minutes: true,
  position: true,
  createdAt: true,
  languageId: true,
  language: { select: { id: true, name: true } },
} as const;

export async function listLanguages(userId: string) {
  return db.language.findMany({
    where: { userId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      level: true,
      goal: true,
      status: true,
      targetHours: true,
      topicId: true,
    },
  });
}

export type LanguageRow = Awaited<ReturnType<typeof listLanguages>>[number];

export async function listRoutineItems(userId: string) {
  return db.routineItem.findMany({
    where: { userId, archivedAt: null },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: itemSelect,
  });
}

export type RoutineItemRow = Awaited<ReturnType<typeof listRoutineItems>>[number];

/*
  Tela "Linguas": rotina de hoje, grade da semana escolhida, revisoes da semana e do mes,
  cartoes das linguas com horas totais e minutos da semana.
*/
export async function getLanguagesOverview(userId: string, weekParam?: string) {
  const today = todayKey();
  const currentWeek = weekStartKey(today);
  const requested = weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam) ? weekStartKey(weekParam) : currentWeek;
  // Semanas futuras nao fazem sentido: nada pode ser marcado.
  const weekStart = requested > currentWeek ? currentWeek : requested;
  const days = weekKeys(weekStart);
  // Consistencia olha os 28 dias anteriores a hoje: o dia de hoje ainda esta em andamento.
  const consistencyFrom = addDays(today, -CONSISTENCY_DAYS);
  const rangeFrom = consistencyFrom < weekStart ? consistencyFrom : weekStart;
  const monthStart = monthStartKey(today);
  const rangeFromWithMonth = monthStart < rangeFrom ? monthStart : rangeFrom;

  const [languages, items, checks, plan] = await Promise.all([
    listLanguages(userId),
    listRoutineItems(userId),
    db.routineCheck.findMany({
      where: {
        userId,
        period: { gte: keyToDate(rangeFromWithMonth), lte: keyToDate(days[6] > today ? days[6] : today) },
      },
      select: { itemId: true, period: true, minutes: true },
    }),
    db.languagePlan.findUnique({ where: { userId }, select: { updatedAt: true } }),
  ]);

  const topicIds = languages.map((l) => l.topicId).filter((id): id is string => !!id);
  const [totals, weekTotals] = await Promise.all([
    db.studyLog.groupBy({
      by: ["topicId"],
      where: { userId, topicId: { in: topicIds } },
      _sum: { minutes: true },
    }),
    db.studyLog.groupBy({
      by: ["topicId"],
      where: { userId, topicId: { in: topicIds }, date: { gte: keyToDate(currentWeek), lte: keyToDate(today) } },
      _sum: { minutes: true },
    }),
  ]);
  const totalBy = new Map(totals.map((t) => [t.topicId, t._sum.minutes ?? 0]));
  const weekBy = new Map(weekTotals.map((t) => [t.topicId, t._sum.minutes ?? 0]));

  const done = new Set(checks.map((c) => `${c.itemId}|${dateToKey(c.period)}`));
  const daily = items.filter((i) => i.frequency === "DAILY");
  const withCreated = daily.map((i) => ({ ...i, createdKey: dayKey(i.createdAt) }));

  const todayItems = daily
    .filter((i) => isScheduled(i, today))
    .map((i) => ({ ...i, done: done.has(`${i.id}|${today}`) }));

  // Minutos planejados x feitos na semana atual.
  let plannedWeek = 0;
  for (const key of weekKeys(currentWeek)) {
    for (const i of daily) if (isScheduled(i, key)) plannedWeek += i.minutes;
  }
  let doneWeek = 0;
  for (const c of checks) {
    const key = dateToKey(c.period);
    if (key >= currentWeek && key <= today && daily.some((i) => i.id === c.itemId)) doneWeek += c.minutes;
  }

  const grid = daily.map((i) => ({
    ...i,
    cells: days.map((key) => ({
      key,
      scheduled: isScheduled(i, key),
      done: done.has(`${i.id}|${key}`),
      future: key > today,
    })),
  }));

  const reviews = items
    .filter((i) => i.frequency !== "DAILY")
    .map((i) => {
      const period = i.frequency === "WEEKLY" ? currentWeek : monthStart;
      return { ...i, period, done: done.has(`${i.id}|${period}`) };
    });

  return {
    today,
    currentWeek,
    weekStart,
    days,
    hasPlan: !!plan,
    languages: languages.map((l) => ({
      ...l,
      totalMinutes: l.topicId ? (totalBy.get(l.topicId) ?? 0) : 0,
      weekMinutes: l.topicId ? (weekBy.get(l.topicId) ?? 0) : 0,
    })),
    todayItems,
    grid,
    reviews,
    metrics: {
      todayDone: todayItems.filter((i) => i.done).length,
      todayTotal: todayItems.length,
      doneWeek,
      plannedWeek,
      consistency: consistency(withCreated, done, consistencyFrom, addDays(today, -1)),
    },
    hasItems: items.length > 0,
  };
}
