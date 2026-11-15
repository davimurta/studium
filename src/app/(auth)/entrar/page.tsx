import type { Metadata } from "next";
import { isSignupAllowed } from "@/lib/signup";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { callbackUrl } = await searchParams;
  return (
    <AuthForm
      mode="login"
      callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined}
      showSignupLink={isSignupAllowed()}
    />
  );
}
