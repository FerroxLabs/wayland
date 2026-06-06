/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'> & { type?: string; loading?: boolean }) => (
    <button {...(props as React.ComponentProps<'button'>)}>{children}</button>
  ),
}));

vi.mock('lucide-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('lucide-react')>()),
  X: (props: { size?: number }) => (
    <span data-testid='x-icon' {...props}>
      ×
    </span>
  ),
}));

import KickoffCard from '@/renderer/pages/guid/components/newChatStarter/KickoffCard';

describe('<KickoffCard>', () => {
  const baseProps = {
    text: 'Want me to surface the decision you have been carrying?',
    onAccept: vi.fn(),
    onRedirect: vi.fn(),
    onDismiss: vi.fn(),
  };

  it('renders body text + accept + redirect + dismiss controls', () => {
    render(<KickoffCard {...baseProps} />);
    expect(screen.getByText(baseProps.text)).toBeTruthy();
    expect(screen.getByTestId('new-chat-kickoff-accept')).toBeTruthy();
    expect(screen.getByTestId('new-chat-kickoff-redirect')).toBeTruthy();
    expect(screen.getByTestId('new-chat-kickoff-dismiss')).toBeTruthy();
  });

  it('clicking the primary accept button invokes onAccept', () => {
    const onAccept = vi.fn();
    render(<KickoffCard {...baseProps} onAccept={onAccept} />);
    fireEvent.click(screen.getByTestId('new-chat-kickoff-accept'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('clicking "Something else" invokes onRedirect', () => {
    const onRedirect = vi.fn();
    render(<KickoffCard {...baseProps} onRedirect={onRedirect} />);
    fireEvent.click(screen.getByTestId('new-chat-kickoff-redirect'));
    expect(onRedirect).toHaveBeenCalledTimes(1);
  });

  it('clicking the × button invokes onDismiss', () => {
    const onDismiss = vi.fn();
    render(<KickoffCard {...baseProps} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('new-chat-kickoff-dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // v0.4.7.1 (E-L-8) - renamed from "preserves multi-line body text via white-space: pre-line"
  // because vitest does not load CSS modules, so this test only verifies that
  // the interior lines reach the DOM without being dropped. The actual
  // pre-line styling is enforced by KickoffCard.module.css at runtime.
  it('renders multi-line body text without dropping interior lines', () => {
    const text = 'line 1\nline 2\nline 3';
    render(<KickoffCard {...baseProps} text={text} />);
    const node = screen.getByTestId('new-chat-kickoff-card');
    expect(node.textContent?.includes('line 1')).toBe(true);
    expect(node.textContent?.includes('line 2')).toBe(true);
    expect(node.textContent?.includes('line 3')).toBe(true);
  });

  // v0.4.7.1 (D-M-4) - document-level Escape listener.
  it('pressing Escape on the document invokes onDismiss', () => {
    const onDismiss = vi.fn();
    render(<KickoffCard {...baseProps} onDismiss={onDismiss} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('Escape listener detaches on unmount (no leak)', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(<KickoffCard {...baseProps} onDismiss={onDismiss} />);
    unmount();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('non-Escape keys do not invoke onDismiss', () => {
    const onDismiss = vi.fn();
    render(<KickoffCard {...baseProps} onDismiss={onDismiss} />);
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'a' });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  // v0.4.7.1 (D-M-4) - accessibility wiring on the card region.
  it('exposes role=region, aria-live=polite, and an aria-label', () => {
    render(<KickoffCard {...baseProps} />);
    const node = screen.getByTestId('new-chat-kickoff-card');
    expect(node.getAttribute('role')).toBe('region');
    expect(node.getAttribute('aria-live')).toBe('polite');
    expect(node.getAttribute('aria-label')).toBeTruthy();
  });
});

// v0.4.7.1 (E-L-4) - Verify the 4 kickoff i18n keys exist in en-US/guid.json
// so we don't rely on the `defaultValue` fallback in production. Reads the
// JSON directly via fs.readFileSync to avoid pulling in the renderer's i18n
// init pipeline (which requires DOM + ReactDOM setup).
describe('kickoff i18n keys (E-L-4)', () => {
  it('en-US guid.json contains all 4 kickoff keys (accept, redirect, dismissAria, regionAria)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path') as typeof import('node:path');
    const guidPath = path.resolve(__dirname, '../../../src/renderer/services/i18n/locales/en-US/guid.json');
    const raw = fs.readFileSync(guidPath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, any>;
    const kickoff = parsed?.newChat?.kickoff ?? parsed?.guid?.newChat?.kickoff;
    expect(kickoff).toBeDefined();
    expect(typeof kickoff.accept).toBe('string');
    expect(typeof kickoff.redirect).toBe('string');
    expect(typeof kickoff.dismissAria).toBe('string');
    expect(typeof kickoff.regionAria).toBe('string');
  });
});
