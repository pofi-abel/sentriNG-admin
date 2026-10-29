// src/hooks/use-now.ts - The current time, re-rendering every `ms` (ages, "updated 12 s ago", the session countdown)
import { useEffect, useState } from "react";

export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(timer);
  }, [ms]);
  return now;
}
