"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// Respeita "reduzir movimento" do sistema nas animacoes dos icones.
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
