import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { isSignupAllowed } from "@/lib/signup";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastroPage() {
  // ALLOW_SIGNUP e lido em tempo de requisicao, nao no build.
  await connection();
  if (!isSignupAllowed()) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold tracking-[-0.01em]">Cadastro desativado</h1>
        <p className="text-[13px] text-fg-muted">
          Este app é de uso pessoal e não aceita novas contas no momento.
        </p>
        <Link href="/entrar" className="text-[13px] underline underline-offset-4">
          Voltar para entrar
        </Link>
      </div>
    );
  }
  return <AuthForm mode="signup" />;
}
