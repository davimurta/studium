import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "w-full rounded-md border border-line bg-black px-3 py-2 font-sans text-[13px] text-fg placeholder:text-fg-muted aria-invalid:border-line-hover disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
