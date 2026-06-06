import type React from 'react';
import { useCallback, useRef } from 'react';

/**
 * Throttle hook
 * @param callback The function to throttle
 * @param delay Throttle interval in milliseconds
 * @returns The throttled function
 */
function useThrottle<T extends (...args: any[]) => any>(callback: T, delay: number, deps: React.DependencyList): T {
  const lastExecTime = useRef<number>(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const throttledFunction = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastExec = now - lastExecTime.current;

      // Execute immediately if enough time has elapsed since last execution
      if (timeSinceLastExec >= delay) {
        callback(...args);
        lastExecTime.current = now;
      } else {
        // Otherwise clear previous timer and schedule a new one
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }

        timeoutId.current = setTimeout(() => {
          callback(...args);
          lastExecTime.current = Date.now();
          timeoutId.current = null;
        }, delay - timeSinceLastExec);
      }
    },
    [delay, ...deps]
  );

  return throttledFunction as T;
}

export default useThrottle;
