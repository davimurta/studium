import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

type Props = ComponentProps<"input"> & { label: string };

export function Field({ label, id, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] text-fg-muted">
        {label}
      </label>
      <Input id={id} {...props} />
    </div>
  );
}
