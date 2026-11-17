import { useCallback, useEffect, useRef, useState } from "react";
import { fetchServiceStatus, type ServiceStatus } from "../lib/soulomApi";
import type { QuotaStatus } from "../types/chat";

/** What the warning banner should say, or null when everything is fine (the banner stays hidden). */
export type ServiceProblem = "offline" | "degraded" | "down" | null;

const RECHECK_WHILE_PROBLEM_MS = 60_000;
const RETRY_UNREACHABLE_MS = 5_000;

function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/**
 * Checks /api/status on open, when the app returns to the foreground, when the network changes,
 * and after a failed message. It polls only while a problem is showing, so a healthy app makes no extra calls.
 */
export function useServiceStatus(includeQuota: boolean) {
  const [online, setOnline] = useState(isOnline);
  const [status, setStatus] = useState<ServiceStatus>("ok");
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const inFlight = useRef(false);
  const includeQuotaRef = useRef(includeQuota);
  includeQuotaRef.current = includeQuota;

  const check = useCallback(async () => {
    if (inFlight.current) return;
    if (!isOnline()) {
      setOnline(false);
      return;
    }
    inFlight.current = true;
    try {
      let report = await fetchServiceStatus(includeQuotaRef.current);
      if (!report && isOnline()) {
        // One quick retry so a single dropped request doesn't flash a warning.
        await new Promise((resolve) => setTimeout(resolve, RETRY_UNREACHABLE_MS));
        report = await fetchServiceStatus(includeQuotaRef.current);
      }
      setOnline(isOnline());
      if (!report) {
        if (isOnline()) setStatus("degraded");
        return;
      }
      setStatus(report.status);
      setQuota(includeQuotaRef.current ? report.quota : null);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void check();
    const handleOnline = () => {
      setOnline(true);
      void check();
    };
    const handleOffline = () => setOnline(false);
    const handleVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisible);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [check]);

  const problem: ServiceProblem = !online ? "offline" : status === "ok" ? null : status;

  useEffect(() => {
    if (!problem || problem === "offline") return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, RECHECK_WHILE_PROBLEM_MS);
    return () => clearInterval(timer);
  }, [problem, check]);

  /** A message just worked, so whatever was wrong has cleared. */
  const reportSuccess = useCallback(() => {
    setOnline(true);
    setStatus("ok");
  }, []);

  return { problem, quota, check, reportSuccess };
}
