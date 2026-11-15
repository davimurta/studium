import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { SortMenu } from "@/components/topics/sort-menu";
import { TopicFormDialog } from "@/components/topics/topic-form-dialog";
import { TopicSearch } from "@/components/topics/topic-search";
import { TopicTable } from "@/components/topics/topic-table";
import { Button } from "@/components/ui/button";
import { countTopics, listTopics } from "@/lib/data/topics";
import { plural } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import {
  SORT_OPTIONS,
  STATUS_FILTERS,
  parseTopicListParams,
  topicListHref,
} from "@/lib/topic-filters";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tópicos" };

export default async function TopicosPage({ searchParams }: PageProps<"/topicos">) {
  const userId = await requireUserId();
  const params = parseTopicListParams(await searchParams);
  const [rows, counts] = await Promise.all([listTopics(userId, params), countTopics(userId)]);

  const newTopicButton = <Button>Novo tópico</Button>;
  const isFiltered = params.q !== "" || params.status !== "todos";
  const total = params.archived ? counts.archived : counts.active;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={
          params.archived
            ? plural(total, "tópico arquivado", "tópicos arquivados")
            : plural(total, "tópico", "tópicos")
        }
        title={params.archived ? "Tópicos arquivados" : "Tópicos"}
        actions={<TopicFormDialog trigger={newTopicButton} />}
      />

      {total === 0 && !isFiltered ? (
        params.archived ? (
          <EmptyState
            title="Nenhum tópico arquivado"
            description="Tópicos arquivados saem das listas, mas continuam guardados aqui."
            action={
              <Button asChild variant="secondary" size="sm">
                <Link href="/topicos">Voltar para tópicos</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Nenhum tópico ainda"
            description="Crie seu primeiro tópico para acompanhar status, tempo de estudo e notas."
            action={<TopicFormDialog trigger={newTopicButton} />}
          />
        )
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <TopicSearch />
            <nav aria-label="Filtrar por status" className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => {
                const active = params.status === f.value;
                return (
                  <Link
                    key={f.value}
                    href={topicListHref(params, { status: f.value })}
                    aria-current={active ? "true" : undefined}
                    scroll={false}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-[13px]",
                      active
                        ? "border-line-hover bg-active text-fg"
                        : "border-line text-fg-muted hover:bg-active",
                    )}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </nav>
            <SortMenu
              current={params.sort}
              options={SORT_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
                href: topicListHref(params, { sort: o.value }),
              }))}
            />
          </div>

          {rows.length > 0 ? (
            <TopicTable rows={rows} />
          ) : (
            <EmptyState
              title="Nenhum tópico encontrado"
              description={
                params.q
                  ? `Nada corresponde a "${params.q}" com os filtros atuais.`
                  : "Nenhum tópico com esse status."
              }
              action={
                <Button asChild variant="secondary" size="sm">
                  <Link href={topicListHref(params, { q: "", status: "todos" })}>Limpar filtros</Link>
                </Button>
              }
            />
          )}
        </>
      )}

      {params.archived ? (
        counts.archived > 0 && (
          <Link href="/topicos" className="self-start text-[13px] text-fg-muted hover:text-fg">
            Voltar para tópicos ativos
          </Link>
        )
      ) : (
        counts.archived > 0 && (
          <Link
            href="/topicos?arquivados=1"
            className="self-start text-[13px] text-fg-muted hover:text-fg"
          >
            Ver arquivados ({counts.archived})
          </Link>
        )
      )}
    </div>
  );
}
