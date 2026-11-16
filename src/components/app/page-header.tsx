import type { ReactNode } from "react";

type Props = { eyebrow: ReactNode; title: string; actions?: ReactNode };

export function PageHeader({ eyebrow, title, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[13px] text-fg-muted">{eyebrow}</div>
        <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.02em]">{title}</h1>
      </div>
      {actions}
    </header>
  );
}
