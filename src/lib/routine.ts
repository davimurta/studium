import type { LanguageStatus, RoutineFrequency } from "@/generated/prisma/enums";
import { addDays, keyToDate, weekStartKey } from "@/lib/study-days";

/*
  Rotina de linguas. Itens DAILY repetem nos dias da semana escolhidos,
  WEEKLY uma vez por semana (segunda a domingo) e MONTHLY uma vez por mes.
  Cada marcacao fica num "periodo": o dia, a segunda-feira da semana ou o dia 1 do mes.
*/

// Ordem de exibicao: segunda primeiro. Valores seguem getUTCDay (0 = domingo).
export const WEEKDAYS = [
  { value: 1, short: "Seg", long: "segunda" },
  { value: 2, short: "Ter", long: "terça" },
  { value: 3, short: "Qua", long: "quarta" },
  { value: 4, short: "Qui", long: "quinta" },
  { value: 5, short: "Sex", long: "sexta" },
  { value: 6, short: "Sáb", long: "sábado" },
  { value: 0, short: "Dom", long: "domingo" },
] as const;

export const FREQUENCY_LABEL: Record<RoutineFrequency, string> = {
  DAILY: "Rotina diária",
  WEEKLY: "Revisão semanal",
  MONTHLY: "Revisão mensal",
};

export const LANGUAGE_STATUS_LABEL: Record<LanguageStatus, string> = {
  ACTIVE: "Ativa",
  MAINTENANCE: "Manutenção",
  PLANNED: "Planejada",
  NATIVE: "Nativa",
};

export function weekdayOf(key: string): number {
  return keyToDate(key).getUTCDay();
}

export function monthStartKey(key: string): string {
  return `${key.slice(0, 7)}-01`;
}

// Os 7 dias (segunda a domingo) da semana que comeca em weekStart.
export function weekKeys(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function periodFor(frequency: RoutineFrequency, key: string): string {
  if (frequency === "WEEKLY") return weekStartKey(key);
  if (frequency === "MONTHLY") return monthStartKey(key);
  return key;
}

// Item diario agendado para o dia? Lista vazia de dias = todos os dias.
export function isScheduled(item: { frequency: RoutineFrequency; weekdays: number[] }, key: string): boolean {
  if (item.frequency !== "DAILY") return false;
  return item.weekdays.length === 0 || item.weekdays.includes(weekdayOf(key));
}

// "Todos os dias", "Seg, Qua e Sex", "Dias úteis", "Fim de semana"
export function describeWeekdays(weekdays: number[]): string {
  const set = new Set(weekdays);
  if (set.size === 0 || set.size === 7) return "Todos os dias";
  const ordered = WEEKDAYS.filter((d) => set.has(d.value));
  const values = ordered.map((d) => d.value).join(",");
  if (values === "1,2,3,4,5") return "Dias úteis";
  if (values === "6,0") return "Fim de semana";
  const names = ordered.map((d) => d.short);
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
}

/*
  Consistencia: dias agendados que foram feitos, dentro de uma janela.
  Conta so a partir do dia em que o item foi criado, para nao punir itens novos.
*/
export function consistency(
  items: { id: string; frequency: RoutineFrequency; weekdays: number[]; createdKey: string }[],
  doneKeys: Set<string>, // "itemId|YYYY-MM-DD"
  from: string,
  to: string,
): { done: number; scheduled: number; pct: number } {
  let scheduled = 0;
  let done = 0;
  for (let key = from; key <= to; key = addDays(key, 1)) {
    for (const item of items) {
      if (key < item.createdKey || !isScheduled(item, key)) continue;
      scheduled++;
      if (doneKeys.has(`${item.id}|${key}`)) done++;
    }
  }
  return { done, scheduled, pct: scheduled === 0 ? 0 : Math.round((done / scheduled) * 100) };
}
