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
  return formatRelativeDays(daysBetween(date, now));
}

// Igual a formatRelative, para chaves de dia "YYYY-MM-DD" (datas de sessao).
export function formatRelativeKey(key: string, today: string): string {
  const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${key}T00:00:00Z`)) / 86_400_000);
  return formatRelativeDays(days);
}

function formatRelativeDays(input: number): string {
  const days = Math.max(0, input);
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

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { y: get("year"), m: Number(get("month")), d: get("day"), hh: get("hour"), mm: get("minute") };
}

// "02 nov 2026"
export function formatShortDate(date: Date): string {
  const { y, m, d } = partsInZone(date, TIME_ZONE);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// "hoje às 18:20", "ontem às 09:05", "12 nov às 14:00"
export function formatEditedAt(date: Date, now: Date = new Date()): string {
  const { m, d, hh, mm } = partsInZone(date, TIME_ZONE);
  const time = `${hh}:${mm}`;
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const key = dayKey(date);
  if (key === today) return `hoje às ${time}`;
  if (key === yesterday) return `ontem às ${time}`;
  return `${d} ${MONTHS[m - 1]} às ${time}`;
}

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Para datas de sessao (coluna @db.Date, gravada como meia-noite UTC do dia em Sao Paulo).
// "Hoje", "Ontem", "Quinta" (ate 6 dias atras) ou "02 nov".
export function formatSessionDay(date: Date, now: Date = new Date()): string {
  const key = date.toISOString().slice(0, 10);
  const today = dayKey(now);
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${key}T00:00:00Z`)) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff > 1 && diff < 7) return WEEKDAYS[date.getUTCDay()];
  const [, mo, da] = key.split("-");
  return `${da} ${MONTHS[Number(mo) - 1]}`;
}

// "nextjs.org/docs" a partir de "https://www.nextjs.org/docs/"
export function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = (u.pathname + u.search).replace(/\/$/, "");
    return u.host.replace(/^www\./, "") + path;
  } catch {
    return url;
  }
}
