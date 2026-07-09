/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression for #682: the Knowledge Wizard must render a DISTINCT, actionable
 * message per draft-failure class instead of one generic "failed" copy:
 *  - desktop IPC rejection (bridge transport down) → bridgeUnreachable + cause
 *  - headless auth/CSRF rejection                  → authFailed + cause
 *  - client-side deadline                          → timedOut
 *  - provider/backend failure                      → failed + cause (#221)
 * Every failure class except no-model offers a retry.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { detail?: string }) => (opts?.detail ? `${key}:${opts.detail}` : key),
  }),
}));

vi.mock('@arco-design/web-react', () => {
  // `icon` is destructured out so it never reaches the DOM element.
  const Button = ({ children, icon: _icon, ...props }: React.ComponentProps<'button'> & { icon?: React.ReactNode }) => (
    <button {...props}>{children}</button>
  );
  const TextArea = (props: { value?: string; onChange?: (v: string) => void; placeholder?: string }) => (
    <textarea value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange?.(e.target.value)} />
  );
  const Input = { TextArea };
  const Modal = ({ visible, children }: { visible: boolean; children?: React.ReactNode }) =>
    visible ? <div data-testid='modal'>{children}</div> : null;
  const Spin = () => <span data-testid='spin' />;
  const Tag = ({ children, onCheck }: { children?: React.ReactNode; onCheck?: () => void }) => (
    <span onClick={onCheck}>{children}</span>
  );
  const Message = { error: vi.fn(), success: vi.fn() };
  return { Button, Input, Modal, Spin, Tag, Message };
});

vi.mock('lucide-react', () => {
  const Icon = () => <span />;
  return { FileText: Icon, RefreshCw: Icon, Sparkles: Icon, Upload: Icon, X: Icon };
});

vi.mock('@/renderer/components/Markdown', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div data-testid='markdown'>{children}</div>,
}));

const mockInvoke = vi.fn();
vi.mock('@/common', () => ({
  ipcBridge: {
    project: { generateKnowledgeDraft: { invoke: (...args: unknown[]) => mockInvoke(...args) } },
    dialog: { showOpen: { invoke: vi.fn(async () => []) } },
  },
}));

const mockIsDesktop = vi.fn(() => true);
vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => mockIsDesktop(),
}));

const mockHttpDraft = vi.fn();
vi.mock('@/renderer/services/ProjectDraftService', () => ({
  generateKnowledgeDraftHttp: (...args: unknown[]) => mockHttpDraft(...args),
}));

import KnowledgeWizard from '@/renderer/pages/projects/components/KnowledgeWizard';

/** Open the wizard and click through to the draft step, which auto-generates. */
async function renderToDraftStep() {
  render(<KnowledgeWizard visible kind='context' onClose={vi.fn()} onAccept={vi.fn()} />);
  fireEvent.click(screen.getByText('projects.wizard.continue')); // step 0 → 1
  fireEvent.click(screen.getByText('projects.wizard.generate')); // step 1 → 2 (auto-generate)
  await waitFor(() => expect(screen.queryByTestId('spin')).toBeNull());
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsDesktop.mockReturnValue(true);
});

describe('KnowledgeWizard draft failure classes (#682)', () => {
  it('shows the bridge-unreachable message with the cause when the desktop IPC rejects', async () => {
    mockInvoke.mockRejectedValue(new Error('IPC channel closed'));

    await renderToDraftStep();

    expect(screen.getByText('projects.wizard.draft.bridgeUnreachable')).toBeTruthy();
    expect(screen.getByText('projects.wizard.draft.failedReason:IPC channel closed')).toBeTruthy();
    expect(screen.getByText('projects.wizard.draft.retry')).toBeTruthy();
  });

  it('shows the auth message with the server cause on a headless auth/CSRF rejection', async () => {
    mockIsDesktop.mockReturnValue(false);
    mockHttpDraft.mockResolvedValue({ draft: '', error: 'auth', detail: 'Invalid or missing CSRF token' });

    await renderToDraftStep();

    expect(screen.getByText('projects.wizard.draft.authFailed')).toBeTruthy();
    expect(screen.getByText('projects.wizard.draft.failedReason:Invalid or missing CSRF token')).toBeTruthy();
    expect(screen.getByText('projects.wizard.draft.retry')).toBeTruthy();
  });

  it('shows the timeout message instead of spinning forever when the request times out', async () => {
    mockIsDesktop.mockReturnValue(false);
    mockHttpDraft.mockResolvedValue({ draft: '', error: 'timeout' });

    await renderToDraftStep();

    expect(screen.getByText('projects.wizard.draft.timedOut')).toBeTruthy();
    expect(screen.getByText('projects.wizard.draft.retry')).toBeTruthy();
  });

  it('shows the provider-failure message with detail (#221 parity)', async () => {
    mockInvoke.mockResolvedValue({ draft: '', error: 'failed', detail: '401: invalid api key' });

    await renderToDraftStep();

    expect(screen.getByText('projects.wizard.draft.failed')).toBeTruthy();
    expect(screen.getByText('projects.wizard.draft.failedReason:401: invalid api key')).toBeTruthy();
    expect(screen.getByText('projects.wizard.draft.retry')).toBeTruthy();
  });

  it('shows no retry or detail for no-model (connect a provider instead)', async () => {
    mockInvoke.mockResolvedValue({ draft: '', error: 'no-model' });

    await renderToDraftStep();

    expect(screen.getByText('projects.wizard.draft.noModel')).toBeTruthy();
    expect(screen.queryByText('projects.wizard.draft.retry')).toBeNull();
  });

  it('renders the draft when generation succeeds', async () => {
    mockInvoke.mockResolvedValue({ draft: '# Hello' });

    await renderToDraftStep();

    expect(screen.getByTestId('markdown').textContent).toBe('# Hello');
  });
});
