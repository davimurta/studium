import Link from "next/link";
import type { LanguageStatus } from "@/generated/prisma/enums";
import { LANGUAGE_STATUS_LABEL } from "@/lib/routine";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/linguas", label: "Hoje", key: "hoje" },
  { href: "/linguas/rotina", label: "Rotina", key: "rotina" },
  { href: "/linguas/plano", label: "Plano", key: "plano" },
] as const;

export function LanguagesNav({ current }: { current: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="Seções de línguas" className="flex gap-1 border-b border-line">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={current === tab.key ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-[13px]",
            current === tab.key ? "border-white font-medium text-fg" : "border-transparent text-fg-muted hover:text-fg",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

const MARK_STYLE: Record<LanguageStatus, string> = {
  ACTIVE: "border-white bg-white",
  MAINTENANCE: "border-white bg-[linear-gradient(90deg,#fff_50%,transparent_50%)]",
  PLANNED: "border-dim",
  NATIVE: "border-line-hover bg-line-hover",
};

// Fase da lingua por simbolo + texto, nunca so por cor.
export function LanguageStatusMark({ status, showLabel = true }: { status: LanguageStatus; showLabel?: boolean }) {
  const label = LANGUAGE_STATUS_LABEL[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted">
      <span aria-hidden="true" className={cn("box-border block size-2.5 rounded-full border-[1.5px]", MARK_STYLE[status])} />
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  );
}
