// src/hooks/use-idle-lock.ts - Sign out a machine left alone: this console issues credentials
import { useEffect, useRef } from "react";

const ACTIVITY = ["keydown", "pointerdown", "pointermove", "wheel"] as const;

/** Calls `onIdle` once no input has arrived for `ms`. Compares timestamps, so a laptop waking from sleep locks too */
export function useIdleLock(onIdle: () => void, ms: number) {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    let last = Date.now();
    const touch = () => (last = Date.now());
    ACTIVITY.forEach((type) => window.addEventListener(type, touch, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - last >= ms) onIdleRef.current();
    }, 15_000);
    return () => {
      ACTIVITY.forEach((type) => window.removeEventListener(type, touch));
      window.clearInterval(timer);
    };
  }, [ms]);
}
