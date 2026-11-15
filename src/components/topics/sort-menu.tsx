"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  current: string;
  options: { value: string; label: string; href: string }[];
};

export function SortMenu({ current, options }: Props) {
  const router = useRouter();
  const active = options.find((o) => o.value === current) ?? options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="muted" size="sm" className="sm:ml-auto" aria-label={`Ordenar: ${active.label}`}>
          {active.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => {
            const option = options.find((o) => o.value === value);
            if (option) router.push(option.href, { scroll: false });
          }}
        >
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
