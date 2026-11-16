import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Protege todas as rotas do app. Quem nao tem sessao vai para /entrar.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$).*)"],
};
