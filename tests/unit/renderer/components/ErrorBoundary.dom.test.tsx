/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron-log/renderer', () => ({
  default: {
    error: vi.fn(),
  },
}));

import { ErrorBoundary } from '@/renderer/components/ErrorBoundary';

const Boom: React.FC<{ message?: string }> = ({ message = 'kaboom' }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  // Silence the React-emitted error log noise from intentional throws
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div>child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders the default fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom message='render failed' />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    // The default fallback hides the raw error message outside development to
    // avoid leaking internals; it renders a generic line instead.
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload this view' })).toBeInTheDocument();
  });

  it('uses a custom fallback render prop when supplied', () => {
    render(
      <ErrorBoundary fallback={(error) => <div data-testid='custom-fallback'>{error.message}</div>}>
        <Boom message='custom boom' />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toHaveTextContent('custom boom');
  });

  it('clears the error and re-renders children after reset', () => {
    let shouldThrow = true;
    const Conditional: React.FC = () => {
      if (shouldThrow) {
        throw new Error('first render fails');
      }
      return <div>recovered content</div>;
    };

    render(
      <ErrorBoundary>
        <Conditional />
      </ErrorBoundary>
    );

    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();

    // Fix the underlying cause and then trigger reset
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Reload this view' }));

    expect(screen.getByText('recovered content')).toBeInTheDocument();
  });

  // #792: resetKeys lets a host auto-recover the boundary when a relevant value
  // changes (e.g. selecting a different memory entry), without remounting the
  // children on every render.
  it('auto-resets when a resetKeys value changes', () => {
    let shouldThrow = true;
    const Conditional: React.FC = () => {
      if (shouldThrow) throw new Error('entry A crashes');
      return <div>healthy entry</div>;
    };

    const { rerender } = render(
      <ErrorBoundary resetKeys={['A']}>
        <Conditional />
      </ErrorBoundary>
    );
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();

    // The relevant selection changed AND the new render is healthy → recover.
    shouldThrow = false;
    rerender(
      <ErrorBoundary resetKeys={['B']}>
        <Conditional />
      </ErrorBoundary>
    );
    expect(screen.getByText('healthy entry')).toBeInTheDocument();
  });

  it('does NOT reset while resetKeys are unchanged (a re-render is not a reset)', () => {
    let shouldThrow = true;
    const Conditional: React.FC = () => {
      if (shouldThrow) throw new Error('still crashing');
      return <div>should not appear yet</div>;
    };

    const { rerender } = render(
      <ErrorBoundary resetKeys={['A']}>
        <Conditional />
      </ErrorBoundary>
    );
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();

    // Same reset key on a re-render must not clear the fallback, even if the
    // child would now render cleanly - the caller hasn't signalled a change.
    shouldThrow = false;
    rerender(
      <ErrorBoundary resetKeys={['A']}>
        <Conditional />
      </ErrorBoundary>
    );
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    expect(screen.queryByText('should not appear yet')).toBeNull();
  });
});
