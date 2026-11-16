import { signOut } from "@/auth";

// Usado quando a sessao aponta para um usuario que nao existe mais.
export async function GET() {
  await signOut({ redirectTo: "/entrar" });
}
