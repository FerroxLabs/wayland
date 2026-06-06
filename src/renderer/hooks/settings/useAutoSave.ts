import { useCallback, useEffect, useRef, useState } from 'react';
import type { SaveState } from '@renderer/components/settings/shared/feedback/SavedIndicator';

const DEBOUNCE_MS = 400;
const SAVED_LINGER_MS = 1500;

/**
 * Debounced auto-save hook.
 *
 * @param value   The value to watch.
 * @param persist Called with the current value after the 400ms debounce.
 *                Must return a Promise - resolves on success, rejects on failure.
 * @returns       Current save state for <SavedIndicator>.
 *
 * Skip the initial call: the hook only fires after the first real change.
 */
export function useAutoSave<T>(value: T, persist: (value: T) => Promise<void>): SaveState {
  const [state, setState] = useState<SaveState>('idle');
  const mountedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lingerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistRef = useRef(persist);
  persistRef.current = persist;

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    if (lingerRef.current !== null) clearTimeout(lingerRef.current);
  }, []);

  useEffect(() => {
    // Skip the mount call - only trigger on subsequent changes.
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    clearTimers();
    setState('saving');

    timerRef.current = setTimeout(() => {
      persistRef
        .current(value)
        .then(() => {
          setState('saved');
          lingerRef.current = setTimeout(() => setState('idle'), SAVED_LINGER_MS);
        })
        .catch(() => {
          setState('error');
        });
    }, DEBOUNCE_MS);

    return clearTimers;
  }, [value, clearTimers]);

  return state;
}
