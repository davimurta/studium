import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function TopicNotFound() {
  return (
    <EmptyState
      title="Tópico não encontrado"
      description="Ele pode ter sido excluído ou o link está incorreto."
      action={
        <Button asChild variant="secondary" size="sm">
          <Link href="/topicos">Ver tópicos</Link>
        </Button>
      }
    />
  );
}
