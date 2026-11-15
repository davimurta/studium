import type { Metadata } from "next";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Tópicos" };

export default async function TopicosPage() {
  const userId = await requireUserId();
  const count = await db.topic.count({ where: { userId, archivedAt: null } });
  return (
    <>
      <PageHeader eyebrow={`${count} ${count === 1 ? "tópico" : "tópicos"}`} title="Tópicos" />
      {count === 0 && (
        <EmptyState title="Nenhum tópico ainda" description="Os tópicos que você criar vão aparecer aqui." />
      )}
    </>
  );
}
