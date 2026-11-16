"use client";

import type { ComponentProps, ForwardRefExoticComponent, RefAttributes } from "react";
import { Button } from "@/components/ui/button";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/components/icons/use-animated-icon";

export type AnimatedIconComponent = ForwardRefExoticComponent<
  { size?: number; className?: string } & RefAttributes<AnimatedIconHandle>
>;

type Props = ComponentProps<typeof Button> & {
  icon: AnimatedIconComponent;
  iconSize?: number;
};

// Botao com icone animado do lucide-animated. A animacao roda no hover e no foco do botao.
export function AnimatedButton({ icon: Icon, iconSize = 16, children, ...props }: Props) {
  const { ref, triggerProps } = useAnimatedIcon();
  return (
    <Button
      {...props}
      onMouseEnter={(e) => {
        triggerProps.onMouseEnter();
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        triggerProps.onMouseLeave();
        props.onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        triggerProps.onFocus();
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        triggerProps.onBlur();
        props.onBlur?.(e);
      }}
    >
      <Icon ref={ref} size={iconSize} />
      {children}
    </Button>
  );
}
