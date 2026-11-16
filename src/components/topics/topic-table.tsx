import Link from "next/link";
import { StatusDot } from "@/components/status-dot";
import type { TopicRow } from "@/lib/data/topics";
import { formatMinutes, formatRelative } from "@/lib/format";

const GRID = "grid grid-cols-[16px_minmax(0,1fr)_180px_200px_100px_110px] items-center gap-4";

export function TopicTable({ rows }: { rows: TopicRow[] }) {
  const now = new Date();
  return (
    <section className="overflow-x-auto rounded-lg border border-line">
      <div className="min-w-[860px]">
        <div aria-hidden="true" className={`${GRID} px-4 py-2.5 text-xs text-fg-muted`}>
          <span />
          <span>Tópico</span>
          <span>Tags</span>
          <span>Roadmap</span>
          <span>Tempo</span>
          <span className="text-right">
            Atualizado
          </span>
        </div>
        {rows.map((t) => (
          <Link
            key={t.id}
            href={`/topicos/${t.id}`}
            className={`${GRID} border-t border-line px-4 py-3.5 hover:bg-surface`}
          >
            <span>
              <StatusDot status={t.status} />
            </span>
            <span className="truncate font-medium">
              {t.title}
            </span>
            <span className="truncate text-[13px] text-fg-muted">
              {t.tags.join(", ")}
            </span>
            <span className="truncate text-[13px] text-fg-muted">
              {t.roadmap?.title ?? "Sem roadmap"}
            </span>
            <span className="text-[13px] text-fg-muted">
              {formatMinutes(t.minutes)}
            </span>
            <span className="text-right text-[13px] text-fg-muted">
              {formatRelative(t.updatedAt, now)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
