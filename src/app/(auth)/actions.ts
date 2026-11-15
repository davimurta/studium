"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { isSignupAllowed } from "@/lib/signup";

export type AuthFormState = { error?: string; email?: string; name?: string } | undefined;

// Aceita apenas caminhos internos. URLs absolutas viram caminho relativo.
function safeCallback(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  try {
    const url = new URL(raw, "http://local");
    const path = url.pathname + url.search;
    return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/entrar") ? path : "/";
  } catch {
    return "/";
  }
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email };

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "E-mail ou senha incorretos.", email };
    throw error;
  }
}

const signupSchema = z.object({
  name: z.string().trim().max(80, "Nome muito longo.").optional(),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(128),
});

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSignupAllowed()) return { error: "O cadastro está desativado." };

  const parsed = signupSchema.safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const keep = {
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
  };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, ...keep };

  const { name, email, password } = parsed.data;
  const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return { error: "Já existe uma conta com esse e-mail.", ...keep };

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({ data: { email, name: name || null, passwordHash } });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Conta criada, mas não foi possível entrar." };
    throw error;
  }
}
