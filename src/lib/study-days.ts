import { dayKey } from "@/lib/format";

/*
  Dias de estudo. StudyLog.date e uma coluna DATE gravada como meia-noite UTC
  do dia no fuso America/Sao_Paulo. Aqui tudo trabalha com a chave "YYYY-MM-DD".
*/

const DAY_MS = 86_400_000;

export function keyToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function dateToKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(key: string, days: number): string {
  return dateToKey(new Date(keyToDate(key).getTime() + days * DAY_MS));
}

export function todayKey(now: Date = new Date()): string {
  return dayKey(now);
}

// Segunda-feira da semana do dia informado (semana de segunda a domingo).
export function weekStartKey(key: string): string {
  const dow = keyToDate(key).getUTCDay(); // 0 = domingo
  return addDays(key, -((dow + 6) % 7));
}

/*
  Sequencia: dias consecutivos com pelo menos uma sessao, terminando hoje ou ontem.
  Recebe as chaves dos dias com estudo (qualquer ordem).
*/
export function computeStreak(studiedKeys: Iterable<string>, today: string = todayKey()): number {
  const days = new Set(studiedKeys);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// Nivel 0 a 4 do mapa de atividade a partir dos minutos do dia.
export function activityLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}
