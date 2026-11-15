import { TIME_ZONE } from "@/lib/dates";

// 260 -> "4h 20min", 45 -> "45 min", 0 -> "0 min"
export function formatMinutes(total: number): string {
  if (total <= 0) return "0 min";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

// Dia de calendario (YYYY-MM-DD) no fuso de Sao Paulo.
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

function daysBetween(from: Date, to: Date): number {
  const a = Date.parse(`${dayKey(from)}T00:00:00Z`);
  const b = Date.parse(`${dayKey(to)}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

// "hoje", "ontem", "há 2 dias", "há 1 semana", "há 3 meses"
export function formatRelative(date: Date, now: Date = new Date()): string {
  const days = Math.max(0, daysBetween(date, now));
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return w === 1 ? "há 1 semana" : `há ${w} semanas`;
  }
  if (days < 365) {
    const m = Math.floor(days / 30);
    return m === 1 ? "há 1 mês" : `há ${m} meses`;
  }
  const y = Math.floor(days / 365);
  return y === 1 ? "há 1 ano" : `há ${y} anos`;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
