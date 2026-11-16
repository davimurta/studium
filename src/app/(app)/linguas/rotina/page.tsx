import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { LanguageFormDialog } from "@/components/languages/language-form-dialog";
import { LanguagesNav, LanguageStatusMark } from "@/components/languages/languages-nav";
import { LanguageMenu, RoutineItemMenu } from "@/components/languages/manage-menus";
import { RoutineItemDialog } from "@/components/languages/routine-item-dialog";
import { Button } from "@/components/ui/button";
import type { RoutineFrequency } from "@/generated/prisma/enums";
import { listLanguages, listRoutineItems, type RoutineItemRow } from "@/lib/data/languages";
import { formatMinutes } from "@/lib/format";
import { describeWeekdays, WEEKDAYS } from "@/lib/routine";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Rotina de línguas" };

const SECTIONS: { frequency: RoutineFrequency; title: string; empty: string }[] = [
  { frequency: "DAILY", title: "Rotina diária", empty: "Nenhum item na rotina diária." },
  { frequency: "WEEKLY", title: "Revisão semanal", empty: "Nenhum item de revisão semanal." },
  { frequency: "MONTHLY", title: "Revisão mensal", empty: "Nenhum item de revisão mensal." },
];

export default async function RoutinePage() {
  const userId = await requireUserId();
  const [languages, items] = await Promise.all([listLanguages(userId), listRoutineItems(userId)]);
  const options = languages.map((l) => ({ id: l.id, name: l.name }));
  const daily = items.filter((i) => i.frequency === "DAILY");

  // Visao da semana: o que cai em cada dia e quanto tempo soma.
  const week = WEEKDAYS.map((d) => {
    const dayItems = daily.filter((i) => i.weekdays.length === 0 || i.weekdays.includes(d.value));
    return { ...d, items: dayItems, minutes: dayItems.reduce((sum, i) => sum + i.minutes, 0) };
  });
  const weekTotal = week.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Línguas"
        title="Rotina"
        actions={
          <RoutineItemDialog languages={options} trigger={<Button>Novo item</Button>} />
        }
      />
      <LanguagesNav current="rotina" />

      {daily.length > 0 && (
        <section aria-labelledby="week-plan-title" className="overflow-hidden rounded-lg border border-line">
          <div className="flex items-center justify-between px-4 py-3.5">
            <h2 id="week-plan-title" className="font-medium">
              Semana tipo
            </h2>
            <span className="text-[13px] text-fg-muted">{formatMinutes(weekTotal)} por semana</span>
          </div>
          <div className="grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-7">
            {week.map((d) => (
              <div key={d.value} className="flex flex-col gap-2 bg-black p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-medium">{d.short}</span>
                  <span className="text-xs text-fg-muted">{formatMinutes(d.minutes)}</span>
                </div>
                {d.items.length === 0 ? (
                  <span className="text-xs text-fg-muted">Folga</span>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {d.items.map((i) => (
                      <li key={i.id} className="text-xs leading-snug">
                        <span className="text-fg-soft">{i.title}</span>
                        {i.language && <span className="block text-fg-muted">{i.language.name}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {SECTIONS.map((section) => (
        <ItemsSection
          key={section.frequency}
          title={section.title}
          empty={section.empty}
          frequency={section.frequency}
          items={items.filter((i) => i.frequency === section.frequency)}
          languages={options}
        />
      ))}

      <section aria-labelledby="languages-title" className="overflow-hidden rounded-lg border border-line">
        <div className="flex items-center justify-between px-4 py-3.5">
          <h2 id="languages-title" className="font-medium">
            Línguas
          </h2>
          <LanguageFormDialog trigger={<Button variant="secondary" size="sm">Adicionar língua</Button>} />
        </div>
        {languages.length === 0 ? (
          <p className="border-t border-line px-4 py-6 text-[13px] text-fg-muted">Nenhuma língua ainda.</p>
        ) : (
          <ul>
            {languages.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{l.name}</span>
                    <LanguageStatusMark status={l.status} />
                  </div>
                  <p className="text-[13px] text-fg-muted">
                    {[l.level, l.goal && `Meta: ${l.goal}`, l.targetHours && `~${l.targetHours}h estimadas`]
                      .filter(Boolean)
                      .join(" · ") || "Sem nível ou meta"}
                  </p>
                </div>
                <LanguageMenu language={l} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ItemsSection({
  title,
  empty,
  frequency,
  items,
  languages,
}: {
  title: string;
  empty: string;
  frequency: RoutineFrequency;
  items: RoutineItemRow[];
  languages: { id: string; name: string }[];
}) {
  return (
    <section aria-label={title} className="overflow-hidden rounded-lg border border-line">
      <div className="flex items-center justify-between px-4 py-3.5">
        <h2 className="font-medium">{title}</h2>
        <RoutineItemDialog
          languages={languages}
          defaultFrequency={frequency}
          trigger={
            <Button variant="ghost" size="sm">
              Adicionar
            </Button>
          }
        />
      </div>
      {items.length === 0 ? (
        <p className="border-t border-line px-4 py-6 text-[13px] text-fg-muted">{empty}</p>
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
              <div className="min-w-0 flex-1">
                <span className="block font-medium">{item.title}</span>
                {item.details && <span className="block text-[13px] text-fg-muted">{item.details}</span>}
                <span className="mt-0.5 block text-xs text-fg-muted">
                  {[
                    item.language?.name ?? "Geral",
                    frequency === "DAILY" ? describeWeekdays(item.weekdays) : null,
                    item.minutes > 0 ? formatMinutes(item.minutes) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <RoutineItemMenu
                item={item}
                languages={languages}
                isFirst={index === 0}
                isLast={index === items.length - 1}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
