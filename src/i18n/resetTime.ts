import { useEffect, useState } from "react";
import type { Strings } from "./strings";

/** Clock time of the reset in the viewer's own timezone, plus a countdown like "3 ชม. 12 นาที". */
export function describeReset(resetAt: number, now: number, t: Strings): { time: string; countdown: string } {
  const time = new Intl.DateTimeFormat(t.locale, { hour: "2-digit", minute: "2-digit" }).format(resetAt);
  const minutesLeft = Math.max(1, Math.ceil((resetAt - now) / 60_000));
  return { time, countdown: t.reset.hours(Math.floor(minutesLeft / 60), minutesLeft % 60) };
}

/** Re-renders once a minute while `enabled`, so countdowns stay current without a busy timer. */
export function useMinuteClock(enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [enabled]);
  return now;
}
