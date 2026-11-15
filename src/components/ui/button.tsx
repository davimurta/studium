import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border font-sans text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border-white bg-white font-medium text-black hover:bg-fg-soft",
        secondary: "border-line bg-transparent font-medium text-fg hover:bg-active",
        muted: "border-line bg-transparent text-fg-muted hover:bg-active",
        ghost: "border-transparent bg-transparent text-fg-muted hover:bg-active hover:text-fg",
      },
      size: {
        default: "px-4 py-[9px]",
        sm: "px-3 py-1.5",
        xs: "px-2.5 py-0.5 text-xs",
        icon: "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
