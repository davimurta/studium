"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/app/field";
import { login, signup, type AuthFormState } from "./actions";

type Props =
  | { mode: "login"; callbackUrl?: string; showSignupLink: boolean }
  | { mode: "signup" };

export function AuthForm(props: Props) {
  const isLogin = props.mode === "login";
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    isLogin ? login : signup,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.01em]">
          {isLogin ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-1 text-[13px] text-fg-muted">
          {isLogin ? "Acesse seus tópicos e roadmaps." : "Comece a organizar seus estudos."}
        </p>
      </div>

      {!isLogin && <Field id="name" name="name" label="Nome" autoComplete="name" maxLength={80} defaultValue={state?.name} key={`n-${state?.name}`} />}
      <Field
        id="email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        required
        defaultValue={state?.email}
        key={`e-${state?.email}`}
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="Senha"
        autoComplete={isLogin ? "current-password" : "new-password"}
        minLength={isLogin ? undefined : 8}
        required
      />
      {isLogin && <input type="hidden" name="callbackUrl" value={props.callbackUrl ?? "/"} />}

      {state?.error && (
        <p role="alert" className="rounded-md border border-line px-3 py-2 text-[13px]">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
      </Button>

      {isLogin ? (
        props.showSignupLink && (
          <p className="text-center text-[13px] text-fg-muted">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="text-fg underline underline-offset-4">
              Criar conta
            </Link>
          </p>
        )
      ) : (
        <p className="text-center text-[13px] text-fg-muted">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-fg underline underline-offset-4">
            Entrar
          </Link>
        </p>
      )}
    </form>
  );
}
