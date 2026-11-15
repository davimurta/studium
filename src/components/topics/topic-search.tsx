"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";

// Busca por texto sincronizada com ?q= (debounce de 300ms).
export function TopicSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQ);
  const [syncedQ, setSyncedQ] = useState(urlQ);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Se ?q= mudar por fora (ex.: "Limpar filtros"), atualiza o campo.
  if (urlQ !== syncedQ) {
    setSyncedQ(urlQ);
    if (urlQ !== value.trim()) setValue(urlQ);
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const sp = new URLSearchParams(searchParams.toString());
      if (next.trim()) sp.set("q", next.trim());
      else sp.delete("q");
      const qs = sp.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    }, 300);
  }

  return (
    <label className="flex-[1_1_260px] sm:max-w-[360px]">
      <span className="sr-only">Buscar tópicos</span>
      <Input
        type="search"
        placeholder="Buscar tópicos"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
