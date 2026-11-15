import type { Metadata } from "next";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Roadmaps" };

export default async function RoadmapsPage() {
  const userId = await requireUserId();
  const count = await db.roadmap.count({ where: { userId } });
  return (
    <>
      <PageHeader eyebrow={`${count} ${count === 1 ? "roadmap" : "roadmaps"}`} title="Roadmaps" />
      {count === 0 && (
        <EmptyState title="Nenhum roadmap ainda" description="Os roadmaps que você criar vão aparecer aqui." />
      )}
    </>
  );
}
