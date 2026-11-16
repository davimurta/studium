import type { HeatCell } from "@/lib/data/dashboard";
import { formatMinutes } from "@/lib/format";

// 5 tons de cinza, do sem estudo ao dia mais intenso.
export const HEAT_SHADES = ["#171717", "#383838", "#666666", "#a3a3a3", "#ffffff"] as const;

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function cellLabel(c: HeatCell) {
  const [, m, d] = c.key.split("-");
  const day = `${d} ${MONTHS[Number(m) - 1]}`;
  return c.minutes > 0 ? `${day}: ${formatMinutes(c.minutes)}` : `${day}: sem estudo`;
}

type Props = { cells: HeatCell[]; totalMinutes: number; activeDays: number };

export function ActivityHeatmap({ cells, totalMinutes, activeDays }: Props) {
  const summary =
    activeDays === 0
      ? "Nenhuma sessão nas últimas 16 semanas."
      : `${activeDays} ${activeDays === 1 ? "dia" : "dias"} com estudo nas últimas 16 semanas, total de ${formatMinutes(totalMinutes)}.`;

  return (
    <section className="rounded-lg border border-line px-4 pt-3.5 pb-4">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-medium">Atividade</h2>
        <span className="text-[13px] text-fg-muted">Últimas 16 semanas</span>
      </div>
      <div role="img" aria-label={summary} className="grid grid-flow-col grid-rows-7 gap-1 [grid-auto-columns:1fr]">
        {cells.map((c) => (
          <div
            key={c.key}
            title={c.future ? undefined : cellLabel(c)}
            className="aspect-square rounded-[2px]"
            style={{ background: c.future ? "transparent" : HEAT_SHADES[c.level] }}
          />
        ))}
      </div>
      <div aria-hidden="true" className="mt-3 flex items-center justify-end gap-1.5 text-xs text-fg-muted">
        <span>Menos</span>
        {HEAT_SHADES.map((shade) => (
          <span key={shade} className="size-2.5 rounded-[2px]" style={{ background: shade }} />
        ))}
        <span>Mais</span>
      </div>
    </section>
  );
}
