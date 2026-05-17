import { useEffect } from 'react';

/**
 * Registers a global keydown listener for a single key combination.
 * Automatically unregisters on unmount or when deps change.
 *
 * @param key - The key to listen for (e.g. 'k', '?')
 * @param handler - Callback fired when the combination matches
 * @param opts.meta - Require Cmd (macOS) / Ctrl (Win/Linux)
 * @param opts.skipInputs - Skip when focus is inside an input/textarea (default true)
 */
export const useGlobalKeybind = (
  key: string,
  handler: () => void,
  opts: { meta?: boolean; skipInputs?: boolean } = {}
) => {
  const { meta = false, skipInputs = true } = opts;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (skipInputs) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
          return;
        }
      }

      const metaMatch = meta ? e.metaKey || e.ctrlKey : true;
      if (metaMatch && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        handler();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [key, handler, meta, skipInputs]);
};
