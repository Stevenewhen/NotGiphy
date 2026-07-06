import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'giphy_request_log';
const WINDOW_MS = 60 * 60 * 1000;

function readLog(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const cutoff = Date.now() - WINDOW_MS;
    return (JSON.parse(raw) as number[]).filter((t) => t > cutoff);
  } catch {
    return [];
  }
}

function writeLog(log: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // Storage unavailable (private browsing, quota) — tracking just resets each load.
  }
}

// Giphy doesn't expose remaining-quota headers, so this is a local estimate
// of calls made from this browser in the last hour, not Giphy's real counter.
export function useRequestBudget(limit: number) {
  const [used, setUsed] = useState(() => readLog().length);

  const recordRequest = useCallback(() => {
    const log = readLog();
    log.push(Date.now());
    writeLog(log);
    setUsed(log.length);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setUsed(readLog().length), 60_000);
    return () => clearInterval(id);
  }, []);

  return { used, remaining: Math.max(limit - used, 0), limit, recordRequest };
}
