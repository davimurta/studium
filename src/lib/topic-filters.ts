import type { Status } from "@/generated/prisma/enums";

// Valores aceitos nos search params de /topicos.
export const STATUS_FILTERS = [
  { value: "todos", label: "Todos", status: null },
  { value: "estudando", label: "Estudando", status: "STUDYING" },
  { value: "nao-iniciado", label: "Não iniciado", status: "NOT_STARTED" },
  { value: "concluido", label: "Concluído", status: "DONE" },
] as const satisfies readonly { value: string; label: string; status: Status | null }[];

export const SORT_OPTIONS = [
  { value: "atualizados", label: "Atualizados recentemente" },
  { value: "criados", label: "Criados recentemente" },
  { value: "titulo", label: "Título (A a Z)" },
  { value: "tempo", label: "Mais tempo de estudo" },
] as const;

export type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export type TopicListParams = {
  q: string;
  status: StatusFilter;
  sort: SortOption;
  archived: boolean;
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseTopicListParams(
  sp: Record<string, string | string[] | undefined>,
): TopicListParams {
  const status = first(sp.status);
  const sort = first(sp.ordem);
  return {
    q: first(sp.q).trim().slice(0, 100),
    status: STATUS_FILTERS.some((f) => f.value === status) ? (status as StatusFilter) : "todos",
    sort: SORT_OPTIONS.some((s) => s.value === sort) ? (sort as SortOption) : "atualizados",
    archived: first(sp.arquivados) === "1",
  };
}

// Monta a URL de /topicos mantendo os parametros atuais e omitindo os padroes.
export function topicListHref(params: TopicListParams, patch: Partial<TopicListParams> = {}) {
  const next = { ...params, ...patch };
  const sp = new URLSearchParams();
  if (next.q) sp.set("q", next.q);
  if (next.status !== "todos") sp.set("status", next.status);
  if (next.sort !== "atualizados") sp.set("ordem", next.sort);
  if (next.archived) sp.set("arquivados", "1");
  const qs = sp.toString();
  return qs ? `/topicos?${qs}` : "/topicos";
}
