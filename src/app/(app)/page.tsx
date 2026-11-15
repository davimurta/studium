import type { Metadata } from "next";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { formatLongDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader eyebrow={formatLongDate()} title="Hoje" />
      <EmptyState
        title="Nada por aqui ainda"
        description="Suas métricas, tópicos em andamento e atividade vão aparecer aqui."
      />
    </div>
  );
}
