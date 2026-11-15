"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

type Props = {
  topicCount: number;
  roadmapCount: number;
  recentRoadmaps: { id: string; title: string }[];
  logoutAction: () => Promise<void>;
};

const NAV = [
  { href: "/", label: "Dashboard", match: (p: string) => p === "/" },
  { href: "/topicos", label: "Tópicos", match: (p: string) => p.startsWith("/topicos") },
  { href: "/roadmaps", label: "Roadmaps", match: (p: string) => p.startsWith("/roadmaps") },
] as const;

export function Sidebar({ topicCount, roadmapCount, recentRoadmaps, logoutAction }: Props) {
  const pathname = usePathname();
  const counts: Record<string, number | undefined> = {
    "/topicos": topicCount,
    "/roadmaps": roadmapCount,
  };

  return (
    <aside className="flex w-full flex-col gap-6 border-b border-line px-3 py-5 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:overflow-y-auto md:border-r md:border-b-0">
      <Logo />

      <button
        type="button"
        aria-disabled="true"
        aria-keyshortcuts="Control+K Meta+K"
        className="flex cursor-pointer items-center justify-between rounded-md border border-line bg-transparent px-2.5 py-2 text-left font-sans text-[13px] text-fg-muted hover:bg-active"
      >
        <span>Buscar</span>
        <span className="rounded-[4px] border border-line px-1.5 text-[11px]">Ctrl K</span>
      </button>

      <nav aria-label="Principal" className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = item.match(pathname);
          const count = counts[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex justify-between rounded-md px-2.5 py-2",
                active ? "bg-active font-medium text-fg" : "text-fg-muted hover:bg-nav-hover",
              )}
            >
              <span>{item.label}</span>
              {count !== undefined && <span className="text-xs text-fg-muted">{count}</span>}
            </Link>
          );
        })}
      </nav>

      {recentRoadmaps.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <div className="px-2.5 pb-1.5 text-xs text-fg-muted">Recentes</div>
          {recentRoadmaps.map((r) => {
            const href = `/roadmaps/${r.id}`;
            const active = pathname === href;
            return (
              <Link
                key={r.id}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "truncate rounded-md px-2.5 py-1.5 text-[13px] hover:bg-nav-hover",
                  active ? "bg-nav-hover text-fg" : "text-fg-muted",
                )}
              >
                {r.title}
              </Link>
            );
          })}
        </div>
      )}

      <form action={logoutAction} className="md:mt-auto">
        <button
          type="submit"
          className="w-full cursor-pointer rounded-md px-2.5 py-2 text-left font-sans text-[13px] text-fg-muted hover:bg-nav-hover hover:text-fg"
        >
          Sair
        </button>
      </form>
    </aside>
  );
}
