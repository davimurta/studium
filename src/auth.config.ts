import type { NextAuthConfig } from "next-auth";

const AUTH_PAGES = ["/entrar", "/cadastro"];

// Configuracao sem dependencias de Node (banco, hash), usada tambem pelo proxy.
export const authConfig = {
  pages: { signIn: "/entrar" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isAuthPage = AUTH_PAGES.some((p) => nextUrl.pathname.startsWith(p));
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
