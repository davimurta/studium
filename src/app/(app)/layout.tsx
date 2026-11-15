import { signOut } from "@/auth";
import { Sidebar } from "@/components/app/sidebar";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

async function logout() {
  "use server";
  await signOut({ redirectTo: "/entrar" });
}

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  const [topicCount, roadmapCount, recentRoadmaps] = await Promise.all([
    db.topic.count({ where: { userId: user.id, archivedAt: null } }),
    db.roadmap.count({ where: { userId: user.id } }),
    db.roadmap.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        topicCount={topicCount}
        roadmapCount={roadmapCount}
        recentRoadmaps={recentRoadmaps}
        logoutAction={logout}
      />
      <main className="flex min-w-0 flex-1 flex-col gap-7 px-4 py-6 sm:px-10 sm:py-8">
        {children}
      </main>
    </div>
  );
}
