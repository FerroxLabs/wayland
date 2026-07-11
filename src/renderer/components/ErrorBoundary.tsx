/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import log from 'electron-log/renderer';

type State = { error: Error | null };

type Props = {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /**
   * When the boundary is showing a fallback and any value in this array changes
   * (shallow compare), the error state is cleared and the children are
   * re-rendered. Lets a caller auto-recover on a relevant change (e.g. the user
   * selecting a different item) without remounting the children on every render.
   */
  resetKeys?: ReadonlyArray<unknown>;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    log.error('[ErrorBoundary]', error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    // Only relevant while a fallback is showing: if the caller's reset keys
    // changed, clear the error so the (now hopefully healthy) children render.
    if (!this.state.error) return;
    const prev = prevProps.resetKeys;
    const next = this.props.resetKeys;
    if (next && (!prev || prev.length !== next.length || next.some((k, i) => !Object.is(k, prev[i])))) {
      this.reset();
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui' }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {process.env.NODE_ENV === 'development' ? this.state.error.message : 'An unexpected error occurred.'}
          </pre>
          <button onClick={this.reset}>Reload this view</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
