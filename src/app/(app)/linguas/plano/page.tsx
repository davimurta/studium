import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { LanguagesNav } from "@/components/languages/languages-nav";
import { TopicNotes } from "@/components/topics/topic-notes";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { savePlan } from "../actions";

export const metadata: Metadata = { title: "Plano de línguas" };

export default async function LanguagePlanPage() {
  const userId = await requireUserId();
  const plan = await db.languagePlan.findUnique({
    where: { userId },
    select: { content: true, updatedAt: true },
  });

  return (
    <div className="flex flex-col gap-7">
      <PageHeader eyebrow="Línguas" title="Plano" />
      <LanguagesNav current="plano" />
      <TopicNotes
        save={savePlan}
        title="Plano de estudos"
        editorLabel="Plano de estudos de línguas"
        initialContent={plan?.content ?? ""}
        initialUpdatedAt={plan?.updatedAt.toISOString() ?? null}
      />
    </div>
  );
}
