/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wave 5 — `useIjfwBrain` is the shared data-fetch hook every Memory tab
 * uses to call an IJFW MCP verb via `ipcBridge.ijfw.brainInvoke`. Tabs pass
 * a verb name, optional args, and an explicit deps array; the hook returns a
 * three-state value (loading / ok / error) that `MCPVerbCard` knows how to
 * render. Unmount cancels pending in-flight resolves.
 */

import { useEffect, useState } from 'react';
import { ipcBridge } from '@/common';
import type { IjfwErrorReason } from '@/common/types/ijfw';
import type { IjfwVerb } from '../types/brain';

export type { IjfwVerb } from '../types/brain';

export type VerbState<T> =
  | { loading: true }
  | { loading: false; ok: true; data: T }
  | { loading: false; ok: false; errorReason: IjfwErrorReason | 'unknown' };

export function useIjfwBrain<T = unknown>(
  verb: IjfwVerb,
  args: Record<string, unknown> = {},
  deps: unknown[] = []
): VerbState<T> {
  const [state, setState] = useState<VerbState<T>>({ loading: true });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true });

    ipcBridge.ijfw.brainInvoke
      .invoke({ verb, args })
      .then((result) => {
        if (cancelled) return;
        if (result.ok === true) {
          setState({ loading: false, ok: true, data: result.data as T });
        } else {
          setState({
            loading: false,
            ok: false,
            errorReason: (result.errorReason ?? 'unknown') as IjfwErrorReason | 'unknown',
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setState({ loading: false, ok: false, errorReason: 'unknown' });
      });

    return () => {
      cancelled = true;
    };
    // Caller controls invalidation via the explicit `deps` array — verb and
    // args are intentionally not in the dep list so callers can avoid
    // re-fetching on every render when args is a fresh object literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
