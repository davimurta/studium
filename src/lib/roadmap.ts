import type { Status } from "@/generated/prisma/enums";

type ItemLike = { status: Status; topic: { status: Status } | null };

// Etapa ligada a um topico herda o status dele. Etapa solta tem status proprio.
export function effectiveStatus(item: ItemLike): Status {
  return item.topic ? item.topic.status : item.status;
}

export function progress(items: ItemLike[]) {
  const total = items.length;
  const done = items.filter((i) => effectiveStatus(i) === "DONE").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}
