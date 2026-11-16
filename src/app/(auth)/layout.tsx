import { Logo } from "@/components/app/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <Logo />
      <div className="w-full max-w-[360px] rounded-lg border border-line p-6">{children}</div>
    </main>
  );
}
