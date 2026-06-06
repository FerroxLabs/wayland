/**
 * Proactively clear the current focus to prevent mobile from staying in input mode and repeatedly raising the soft keyboard after a route change.
 */
export const blurActiveElement = (): void => {
  if (typeof document === 'undefined') return;
  const active = document.activeElement as HTMLElement | null;
  if (!active) return;
  if (typeof active.blur === 'function') {
    active.blur();
  }
};

let mobileFocusBlockedUntil = 0;

export const blockMobileInputFocus = (durationMs = 700): void => {
  mobileFocusBlockedUntil = Date.now() + Math.max(0, durationMs);
};

export const shouldBlockMobileInputFocus = (): boolean => Date.now() < mobileFocusBlockedUntil;
