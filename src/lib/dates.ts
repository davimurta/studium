export const TIME_ZONE = "America/Sao_Paulo";

// Ex.: "Sábado, 14 de novembro"
export function formatLongDate(date: Date = new Date()): string {
  const text = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
