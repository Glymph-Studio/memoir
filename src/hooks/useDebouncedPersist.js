import { useRef, useCallback, useEffect } from 'react';

export function useDebouncedPersist(saveFn, delay = 600) {
  const timeoutRef = useRef(null);
  const pendingRef = useRef(null);
  const saveFnRef = useRef(saveFn);

  useEffect(() => { saveFnRef.current = saveFn; }, [saveFn]);

  const schedule = useCallback((data) => {
    pendingRef.current = data;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (pendingRef.current) {
        saveFnRef.current(pendingRef.current);
        pendingRef.current = null;
      }
    }, delay);
  }, [delay]);

  const flush = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (pendingRef.current) {
      saveFnRef.current(pendingRef.current);
      pendingRef.current = null;
    }
  }, []);

  const immediate = useCallback((data) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pendingRef.current = null;
    saveFnRef.current(data);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // try to save on unmount
      if (pendingRef.current) {
        try { saveFnRef.current(pendingRef.current); } catch {}
      }
    };
  }, []);

  return { schedule, flush, immediate };
}
