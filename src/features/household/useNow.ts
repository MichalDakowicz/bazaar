import { useEffect, useState } from 'react';

/**
 * The time, refreshed on an interval. "10 min" on a live row and "Just now" on a
 * feed row are only true for a moment; a screen left open should not go on
 * saying them.
 */
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);

  return now;
}
