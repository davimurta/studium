"use client";

import { useCallback, useMemo, useRef } from "react";

export type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

// Anima o icone quando o elemento pai (botao, link) recebe hover ou foco.
export function useAnimatedIcon() {
  const ref = useRef<AnimatedIconHandle>(null);
  const start = useCallback(() => ref.current?.startAnimation(), []);
  const stop = useCallback(() => ref.current?.stopAnimation(), []);
  const triggerProps = useMemo(
    () => ({ onMouseEnter: start, onMouseLeave: stop, onFocus: start, onBlur: stop }),
    [start, stop],
  );
  return { ref, triggerProps };
}
