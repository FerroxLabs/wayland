/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wave 5 — `MCPVerbCard` is the rendering counterpart to `useIjfwBrain`. It
 * accepts the hook's three-state value and renders one of:
 *   - Spinner (loading)
 *   - Localized error message (ok:false; key `memory:error.<reason>` with
 *     `error.unknown` fallback)
 *   - `empty` slot when ok:true and `isDataEmpty(data)` returns true
 *   - `render(data)` otherwise
 *
 * Every Wave 5 tab composes this card so the loading / error / empty UX is
 * identical across the panel.
 */

import React, { type ReactNode } from 'react';
import { Spin } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { VerbState } from '../hooks/useIjfwBrain';
import styles from './MCPVerbCard.module.css';

type MCPVerbCardProps<T> = {
  state: VerbState<T>;
  /** Optional element shown when the verb succeeded with empty data. */
  empty?: ReactNode;
  /** Render the success data. */
  render: (data: T) => ReactNode;
};

const isDataEmpty = (data: unknown): boolean => {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'string') return data.length === 0;
  if (typeof data === 'object') {
    return Object.keys(data as Record<string, unknown>).length === 0;
  }
  return false;
};

export function MCPVerbCard<T>({ state, empty, render }: MCPVerbCardProps<T>): React.ReactElement {
  const { t } = useTranslation();

  if (state.loading === true) {
    return (
      <div className={styles.loading} data-testid='mcp-verb-card-loading'>
        <Spin />
      </div>
    );
  }

  if (state.ok === false) {
    const fallback = t('memory.error.unknown');
    return (
      <div className={styles.error} data-testid='mcp-verb-card-error'>
        {t(`memory.error.${state.errorReason}`, { defaultValue: fallback })}
      </div>
    );
  }

  if (empty !== undefined && isDataEmpty(state.data)) {
    return <>{empty}</>;
  }

  return <>{render(state.data)}</>;
}

export default MCPVerbCard;
