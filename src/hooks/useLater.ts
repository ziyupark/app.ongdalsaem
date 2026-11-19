import { useCallback, useEffect, useRef } from 'react';

/** `later(fn, ms)` — a setTimeout that is cancelled when the component unmounts (and when called again). */
export function useLater() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return useCallback((fn: () => void, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; fn(); }, ms);
  }, []);
}
