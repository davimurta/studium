import "server-only";

// Cadastro so fica aberto quando ALLOW_SIGNUP="true".
export function isSignupAllowed(): boolean {
  return process.env.ALLOW_SIGNUP === "true";
}
