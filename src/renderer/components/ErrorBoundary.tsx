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
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    log.error('[ErrorBoundary]', error, info.componentStack);
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
