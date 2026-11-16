import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { ProgressBar } from "@/components/app/progress-bar";
import { LanguageFormDialog } from "@/components/languages/language-form-dialog";
import { LanguagesNav, LanguageStatusMark } from "@/components/languages/languages-nav";
import { ReviewRow, RoutineCell, RoutineRow } from "@/components/languages/routine-check";
import { Button } from "@/components/ui/button";
import { CONSISTENCY_DAYS, getLanguagesOverview } from "@/lib/data/languages";
import { formatLongDate } from "@/lib/dates";
import { formatMinutes } from "@/lib/format";
import { WEEKDAYS, weekdayOf } from "@/lib/routine";
import { requireUserId } from "@/lib/session";
import { addDays } from "@/lib/study-days";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Línguas" };

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const shortDay = (key: string) => `${key.slice(8, 10)} ${MONTHS[Number(key.slice(5, 7)) - 1]}`;
const dayName = (key: string) => WEEKDAYS.find((d) => d.value === weekdayOf(key))!;

export default async function LanguagesPage({ searchParams }: PageProps<"/linguas">) {
  const userId = await requireUserId();
  const { semana } = await searchParams;
  const data = await getLanguagesOverview(userId, typeof semana === "string" ? semana : undefined);

  const header = (
    <>
      <PageHeader
        eyebrow={formatLongDate()}
        title="Línguas"
        actions={
          <Button asChild variant="secondary">
            <Link href="/linguas/rotina">Editar rotina</Link>
          </Button>
        }
      />
      <LanguagesNav current="hoje" />
    </>
  );

  if (data.languages.length === 0 && !data.hasItems) {
    return (
      <div className="flex flex-col gap-7">
        {header}
        <EmptyState
          title="Monte sua rotina de línguas"
          description="Adicione as línguas que você estuda e depois a rotina da semana. Todo dia você só marca o que fez: os minutos entram nas sessões de estudo."
          action={<LanguageFormDialog trigger={<Button size="sm">Adicionar língua</Button>} />}
        />
      </div>
    );
  }

  const { metrics } = data;
  const isCurrentWeek = data.weekStart === data.currentWeek;
  const weeklyReviews = data.reviews.filter((r) => r.frequency === "WEEKLY");
  const monthlyReviews = data.reviews.filter((r) => r.frequency === "MONTHLY");

  const cards = [
    {
      label: "Hoje",
      value: metrics.todayTotal === 0 ? "Folga" : `${metrics.todayDone} de ${metrics.todayTotal}`,
      hint: metrics.todayTotal === 0 ? "Nada na rotina de hoje" : "itens da rotina",
    },
    {
      label: "Esta semana",
      value: formatMinutes(metrics.doneWeek),
      hint: `de ${formatMinutes(metrics.plannedWeek)} planejados`,
    },
    {
      label: "Consistência",
      value: metrics.consistency.scheduled === 0 ? "Sem dados" : `${metrics.consistency.pct}%`,
      hint:
        metrics.consistency.scheduled === 0
          ? `nos últimos ${CONSISTENCY_DAYS} dias`
          : `${metrics.consistency.done} de ${metrics.consistency.scheduled} nos últimos ${CONSISTENCY_DAYS} dias`,
    },
  ];

  return (
    <div className="flex flex-col gap-7">
      {header}

      <section
        aria-label="Resumo"
        className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-px overflow-hidden rounded-lg border border-line bg-line"
      >
        {cards.map((m) => (
          <div key={m.label} className="bg-black px-5 py-[18px]">
            <div className="text-[13px] text-fg-muted">{m.label}</div>
            <div className="mt-1 text-[28px] font-semibold tracking-[-0.02em]">{m.value}</div>
            <div className="text-xs text-fg-muted">{m.hint}</div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[3_1_480px] flex-col gap-6">
          {/* Rotina de hoje: o fluxo de todo dia, um toque por item. */}
          <section aria-labelledby="today-title" className="overflow-hidden rounded-lg border border-line">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <h2 id="today-title" className="font-medium">
                Rotina de {dayName(data.today).long}
              </h2>
              {metrics.todayTotal > 0 && (
                <span className="text-[13px] text-fg-muted">
                  {metrics.todayDone === metrics.todayTotal ? "Tudo feito" : `${metrics.todayTotal - metrics.todayDone} faltando`}
                </span>
              )}
            </div>
            {metrics.todayTotal > 0 && (
              <div className="px-4 pb-3">
                <ProgressBar
                  pct={(metrics.todayDone / metrics.todayTotal) * 100}
                  label="Progresso da rotina de hoje"
                />
              </div>
            )}
            {data.todayItems.length === 0 ? (
              <p className="border-t border-line px-4 py-6 text-[13px] text-fg-muted">
                Nada na rotina de hoje.{" "}
                <Link href="/linguas/rotina" className="text-fg underline underline-offset-4">
                  Editar rotina
                </Link>
              </p>
            ) : (
              <ul className="border-t border-line">
                {data.todayItems.map((item) => (
                  <RoutineRow
                    key={item.id}
                    itemId={item.id}
                    dayKey={data.today}
                    done={item.done}
                    title={item.title}
                    details={item.details}
                    minutes={item.minutes}
                    language={item.language?.name}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Grade da semana: ver o padrao e marcar dias que ficaram para tras. */}
          {data.grid.length > 0 && (
            <section aria-labelledby="week-title" className="overflow-hidden rounded-lg border border-line">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                <h2 id="week-title" className="font-medium">
                  Semana de {shortDay(data.weekStart)} a {shortDay(addDays(data.weekStart, 6))}
                </h2>
                <div className="flex items-center gap-1">
                  <Button asChild variant="ghost" size="xs">
                    <Link href={`/linguas?semana=${addDays(data.weekStart, -7)}`}>Semana anterior</Link>
                  </Button>
                  {!isCurrentWeek && (
                    <Button asChild variant="ghost" size="xs">
                      <Link href={`/linguas?semana=${addDays(data.weekStart, 7)}`}>Próxima</Link>
                    </Button>
                  )}
                  {!isCurrentWeek && (
                    <Button asChild variant="ghost" size="xs">
                      <Link href="/linguas">Esta semana</Link>
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto border-t border-line">
                <table className="w-full min-w-[560px] border-collapse text-[13px]">
                  <caption className="sr-only">
                    Itens da rotina por dia. Dias passados e hoje podem ser marcados.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left font-normal text-fg-muted">
                        Item
                      </th>
                      {data.days.map((key) => (
                        <th
                          key={key}
                          scope="col"
                          className={cn("w-10 px-0.5 py-2 text-center font-normal", key === data.today ? "text-fg" : "text-fg-muted")}
                        >
                          <span className="block">{dayName(key).short}</span>
                          <span className="block text-[11px]">{key.slice(8, 10)}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.grid.map((row) => (
                      <tr key={row.id} className="border-t border-line">
                        <th scope="row" className="max-w-[220px] px-4 py-1.5 text-left font-normal">
                          <span className="block truncate">{row.title}</span>
                          {row.language && <span className="block text-xs text-fg-muted">{row.language.name}</span>}
                        </th>
                        {row.cells.map((cell) => (
                          <td key={cell.key} className="px-0.5 py-1 text-center">
                            {!cell.scheduled ? (
                              <span className="text-dim" aria-label="Fora da rotina">
                                <span aria-hidden="true">·</span>
                              </span>
                            ) : cell.future ? (
                              <span
                                className="mx-auto block size-[18px] rounded-[4px] border border-dashed border-line"
                                role="img"
                                aria-label={`${row.title}, ${dayName(cell.key).long}: ainda não chegou`}
                              />
                            ) : (
                              <span className="flex justify-center">
                                <RoutineCell
                                  itemId={row.id}
                                  dayKey={cell.key}
                                  done={cell.done}
                                  label={`${row.title}, ${dayName(cell.key).long} ${shortDay(cell.key)}`}
                                />
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-6">
          {data.languages.length > 0 && (
            <section aria-labelledby="langs-title" className="overflow-hidden rounded-lg border border-line">
              <div className="flex items-center justify-between px-4 py-3.5">
                <h2 id="langs-title" className="font-medium">
                  Línguas
                </h2>
                <Link href="/linguas/rotina" className="text-[13px] text-fg-muted hover:text-fg">
                  Gerenciar
                </Link>
              </div>
              <ul>
                {data.languages.map((l) => {
                  const body = (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{l.name}</span>
                        <LanguageStatusMark status={l.status} />
                      </div>
                      {(l.level || l.goal) && (
                        <p className="mt-1 text-[13px] text-fg-muted">
                          {l.level}
                          {l.level && l.goal ? " → " : ""}
                          {l.goal}
                        </p>
                      )}
                      {l.status !== "NATIVE" && (
                        <div className="mt-2.5 flex flex-col gap-1.5">
                          {l.targetHours ? (
                            <ProgressBar
                              pct={(l.totalMinutes / (l.targetHours * 60)) * 100}
                              label={`Horas de ${l.name} em relação à estimativa`}
                            />
                          ) : null}
                          <div className="flex justify-between text-xs text-fg-muted">
                            <span>
                              {l.targetHours ? `${formatMinutes(l.totalMinutes)} de ~${l.targetHours}h` : `${formatMinutes(l.totalMinutes)} no total`}
                            </span>
                            <span>{formatMinutes(l.weekMinutes)} nesta semana</span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                  return (
                    <li key={l.id}>
                      {l.topicId ? (
                        <Link href={`/topicos/${l.topicId}`} className="block border-t border-line px-4 py-3.5 hover:bg-surface">
                          {body}
                        </Link>
                      ) : (
                        <div className="border-t border-line px-4 py-3.5">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {(weeklyReviews.length > 0 || monthlyReviews.length > 0) && (
            <section aria-labelledby="reviews-title" className="rounded-lg border border-line p-4">
              <h2 id="reviews-title" className="font-medium">
                Revisões
              </h2>
              {weeklyReviews.length > 0 && (
                <div className="mt-3">
                  <h3 className="px-2 text-xs text-fg-muted">
                    Esta semana · {weeklyReviews.filter((r) => r.done).length} de {weeklyReviews.length}
                  </h3>
                  <ul className="mt-1">
                    {weeklyReviews.map((r) => (
                      <ReviewRow key={r.id} itemId={r.id} dayKey={data.today} done={r.done} title={r.title} details={r.details} />
                    ))}
                  </ul>
                </div>
              )}
              {monthlyReviews.length > 0 && (
                <div className="mt-4">
                  <h3 className="px-2 text-xs text-fg-muted">
                    Este mês · {monthlyReviews.filter((r) => r.done).length} de {monthlyReviews.length}
                  </h3>
                  <ul className="mt-1">
                    {monthlyReviews.map((r) => (
                      <ReviewRow key={r.id} itemId={r.id} dayKey={data.today} done={r.done} title={r.title} details={r.details} />
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <Link
            href="/linguas/plano"
            className="rounded-lg border border-line px-4 py-3.5 hover:border-line-hover hover:bg-surface"
          >
            <span className="block font-medium">Plano de estudos</span>
            <span className="mt-0.5 block text-[13px] text-fg-muted">
              {data.hasPlan ? "Fases, princípios, recursos e checkpoints." : "Escreva aqui o seu plano de línguas."}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
