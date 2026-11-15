import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-20 w-full resize-y rounded-md border border-line bg-black px-3 py-2 font-sans text-[13px] text-fg placeholder:text-fg-muted disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
