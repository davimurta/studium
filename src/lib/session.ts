import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Retorna o id do usuario logado. Toda query e mutation parte daqui.
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/entrar");
  return id;
}

// Garante que o usuario da sessao ainda existe no banco.
export async function requireUser() {
  const id = await requireUserId();
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
  if (!user) redirect("/sair");
  return user;
}
