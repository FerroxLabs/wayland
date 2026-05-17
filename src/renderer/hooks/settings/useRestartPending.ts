import { useCallback, useState } from 'react';
import { ipcBridge } from '@/common';

type RestartPendingState = {
  isPending: boolean;
  /**
   * Call this when a restart-required setting changes.
   * Pass the revert callback that will be invoked on "Discard change".
   */
  markPending: (revert: () => void) => void;
  restartNow: () => void;
  discardChange: () => void;
};

/**
 * Tracks whether any restart-required setting has changed.
 *
 * Usage:
 *   const { isPending, markPending } = useRestartPending();
 *   // when a restart-required value changes:
 *   markPending(() => setLanguage(previousValue));
 */
export function useRestartPending(): RestartPendingState {
  const [isPending, setIsPending] = useState(false);
  const [revertFn, setRevertFn] = useState<(() => void) | null>(null);

  const markPending = useCallback((revert: () => void) => {
    setIsPending(true);
    setRevertFn(() => revert);
  }, []);

  const restartNow = useCallback(() => {
    ipcBridge.application.restart.invoke().catch((err) => {
      console.error('[useRestartPending] restart failed:', err);
    });
  }, []);

  const discardChange = useCallback(() => {
    revertFn?.();
    setIsPending(false);
    setRevertFn(null);
  }, [revertFn]);

  return { isPending, markPending, restartNow, discardChange };
}
