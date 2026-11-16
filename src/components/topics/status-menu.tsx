"use client";

import { useOptimistic, useTransition } from "react";
import type { Status } from "@/generated/prisma/enums";
import { setTopicStatus } from "@/app/(app)/topicos/actions";
import { StatusDot } from "@/components/status-dot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_LABEL } from "@/lib/status";

export function StatusMenu({ id, status }: { id: string; status: Status }) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Status: ${STATUS_LABEL[optimistic]}. Alterar status`}
        className="flex cursor-pointer items-center rounded-full border border-line bg-transparent px-3 py-1 font-sans text-[13px] text-fg hover:bg-active"
      >
        <StatusDot status={optimistic} showLabel />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={optimistic}
          onValueChange={(value) =>
            startTransition(async () => {
              setOptimistic(value as Status);
              await setTopicStatus(id, value);
            })
          }
        >
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              <StatusDot status={s} showLabel />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
