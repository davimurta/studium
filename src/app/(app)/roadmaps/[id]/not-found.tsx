import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function RoadmapNotFound() {
  return (
    <EmptyState
      title="Roadmap não encontrado"
      description="Ele pode ter sido excluído ou o link está incorreto."
      action={
        <Button asChild variant="secondary" size="sm">
          <Link href="/roadmaps">Ver roadmaps</Link>
        </Button>
      }
    />
  );
}
