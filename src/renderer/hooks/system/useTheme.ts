// hooks/useTheme.ts
import { ConfigStorage } from '@/common/config/storage';
import { useCallback, useEffect, useState } from 'react';

/**
 * The user's stored theme preference.
 * 'system' resolves dynamically via `prefers-color-scheme`.
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * The actual theme applied to the DOM. Always concrete.
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Legacy alias kept so existing callers that compare `theme === 'dark'`
 * for visual styling continue to work - they're reading the resolved value.
 */
export type Theme = ResolvedTheme;

// Wayland defaults to DARK (the brand surface - onboarding and the welcome flow
// pin a dark palette, so 'system' would flip a light-mode OS to light the moment
// onboarding ends, breaking visual consistency). Users can still choose
// 'light' / 'system' in Settings; this only sets the first-run default.
const DEFAULT_PREFERENCE: ThemePreference = 'dark';
const THEME_PREFERENCE_CACHE_KEY = '__wayland_theme_preference';
const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

const detectSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    // SSR/test fallback: Wayland defaults to dark when system can't be queried.
    return 'dark';
  }
  return window.matchMedia(PREFERS_DARK_QUERY).matches ? 'dark' : 'light';
};

const resolveTheme = (pref: ThemePreference): ResolvedTheme =>
  pref === 'system' ? detectSystemTheme() : pref;

const applyTheme = (resolved: ResolvedTheme): void => {
  document.documentElement.setAttribute('data-theme', resolved);
  document.body.setAttribute('arco-theme', resolved);
};

/**
 * Initialize theme preference immediately on module load to avoid a flash
 * of wrong theme before React mounts. Reads from ConfigStorage (async) or
 * falls back to localStorage cache (sync) or DEFAULT_PREFERENCE.
 */
const initTheme = async (): Promise<{ preference: ThemePreference; resolved: ResolvedTheme }> => {
  try {
    // Try sync localStorage first for instant paint, then reconcile with ConfigStorage.
    let preference: ThemePreference = DEFAULT_PREFERENCE;
    try {
      const cached = localStorage.getItem(THEME_PREFERENCE_CACHE_KEY);
      if (isPreference(cached)) preference = cached;
    } catch (_e) {
      /* noop */
    }
    applyTheme(resolveTheme(preference));

    // Reconcile with persistent storage (may upgrade legacy 'theme' key).
    const stored = await ConfigStorage.get('theme');
    if (isPreference(stored)) {
      preference = stored;
    }
    const resolved = resolveTheme(preference);
    applyTheme(resolved);
    try {
      localStorage.setItem(THEME_PREFERENCE_CACHE_KEY, preference);
    } catch (_e) {
      /* noop */
    }
    return { preference, resolved };
  } catch (error) {
    console.error('Failed to load initial theme:', error);
    const resolved = resolveTheme(DEFAULT_PREFERENCE);
    applyTheme(resolved);
    return { preference: DEFAULT_PREFERENCE, resolved };
  }
};

// Kick off initialization at module load (browser only).
let initialThemePromise: Promise<{ preference: ThemePreference; resolved: ResolvedTheme }> | null = null;
if (typeof window !== 'undefined') {
  initialThemePromise = initTheme();
}

/**
 * Theme management hook.
 *
 * Returns a tuple of:
 *  - resolvedTheme: the concrete theme currently applied to the DOM ('light' | 'dark')
 *  - setPreference: setter that accepts the user's preference ('light' | 'dark' | 'system')
 *  - preference: the stored preference (so the UI can highlight the right button)
 *
 * The hook subscribes to `prefers-color-scheme` changes when preference is 'system',
 * so the theme updates automatically as the user toggles dark mode at the OS level.
 */
const useTheme = (): [ResolvedTheme, (preference: ThemePreference) => Promise<void>, ThemePreference] => {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [resolvedTheme, setResolvedThemeState] = useState<ResolvedTheme>('dark');

  const setPreference = useCallback(
    async (newPreference: ThemePreference) => {
      const previousPreference = preference;
      const previousResolved = resolvedTheme;
      try {
        const newResolved = resolveTheme(newPreference);
        setPreferenceState(newPreference);
        setResolvedThemeState(newResolved);
        applyTheme(newResolved);
        try {
          localStorage.setItem(THEME_PREFERENCE_CACHE_KEY, newPreference);
        } catch (_e) {
          /* noop */
        }
        await ConfigStorage.set('theme', newPreference);
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        setPreferenceState(previousPreference);
        setResolvedThemeState(previousResolved);
        applyTheme(previousResolved);
      }
    },
    [preference, resolvedTheme]
  );

  // Sync React state with the module-level initialization on mount.
  useEffect(() => {
    if (initialThemePromise) {
      initialThemePromise
        .then(({ preference: initialPref, resolved }) => {
          setPreferenceState(initialPref);
          setResolvedThemeState(resolved);
        })
        .catch((error) => {
          console.error('Failed to initialize theme:', error);
        });
    }
  }, []);

  // While preference is 'system', live-update on OS theme change.
  useEffect(() => {
    if (preference !== 'system') return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(PREFERS_DARK_QUERY);
    const onChange = () => {
      const next: ResolvedTheme = mq.matches ? 'dark' : 'light';
      setResolvedThemeState(next);
      applyTheme(next);
    };
    // Safari < 14 uses addListener; modern browsers use addEventListener.
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    } else if (typeof (mq as MediaQueryList & { addListener?: (cb: () => void) => void }).addListener === 'function') {
      (mq as MediaQueryList & { addListener: (cb: () => void) => void }).addListener(onChange);
      return () => {
        (mq as MediaQueryList & { removeListener: (cb: () => void) => void }).removeListener(onChange);
      };
    }
  }, [preference]);

  return [resolvedTheme, setPreference, preference];
};

export default useTheme;
