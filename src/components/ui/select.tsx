import * as React from "react";
import { cn } from "@/lib/utils";

// Select nativo, acessivel e com o estilo dos inputs.
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "w-full cursor-pointer appearance-none rounded-md border border-line bg-black bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22><path d=%22M1 1l4 4 4-4%22 stroke=%22%23a3a3a3%22 fill=%22none%22/></svg>')] bg-[right_12px_center] bg-no-repeat px-3 py-2 pr-8 font-sans text-[13px] text-fg disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
