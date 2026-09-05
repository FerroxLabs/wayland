/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import AgentModeSelector from '@/renderer/components/agent/AgentModeSelector';

const { getMode, setMode, warning, success, listeners, translate } = vi.hoisted(() => ({
  getMode: vi.fn(),
  setMode: vi.fn(),
  warning: vi.fn(),
  success: vi.fn(),
  listeners: new Set<(event: IResponseMessage) => void>(),
  translate: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
}));
vi.mock('@/common', () => ({
  ipcBridge: {
    acpConversation: { getMode: { invoke: getMode }, setMode: { invoke: setMode } },
    conversation: {
      responseStream: {
        on: (listener: (event: IResponseMessage) => void) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      },
    },
  },
}));
vi.mock('@/common/config/storage', () => ({ ConfigStorage: { get: async () => ({}) } }));
vi.mock('@/renderer/hooks/context/LayoutContext', () => ({ useLayoutContext: () => ({ isMobile: false }) }));
vi.mock('@/renderer/components/agent/AgentBadge', () => ({ AgentLogoIcon: () => null }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: translate }) }));
vi.mock('@arco-design/web-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@arco-design/web-react')>()),
  Message: { warning, success, error: vi.fn() },
}));
const confirmed = (mode: string) => ({ success: true, data: { initialized: true, mode } });
const emit = (type: string, data: unknown, conversation_id = 'one') =>
  act(() => {
    listeners.forEach((listener) => listener({ type, data, conversation_id, msg_id: '' }));
  });
async function chooseAutopilot() {
  fireEvent.click(screen.getByRole('button', { name: 'Default' }));
  fireEvent.click(await screen.findByText('Autopilot'));
}

describe('Core mode confirmation in the permission selector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    getMode.mockResolvedValue(confirmed('default'));
  });
  it('keeps the confirmed mode while pending and explains a typed refusal without claiming tools are disabled', async () => {
    let resolve!: (value: unknown) => void;
    setMode.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    render(<AgentModeSelector backend='wcore' conversationId='one' compact />);
    await chooseAutopilot();
    expect(screen.getByTestId('mode-selector')).toHaveAttribute('data-current-mode', 'default');
    expect(success).not.toHaveBeenCalled();
    emit('set_mode_refused', { requested: 'force', effective: 'default', reason: 'local_opt_in_required' });
    await act(async () => resolve({ success: false, data: { mode: 'default', refusalCode: 'local_opt_in_required' } }));
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning.mock.calls[0][0]).toContain('this refusal does not disable tools');
    expect(success).not.toHaveBeenCalled();
    expect(screen.getByTestId('mode-selector')).toHaveAttribute('data-current-mode', 'default');
  });
  it('shows an accepted mode and success feedback after confirmation', async () => {
    setMode.mockResolvedValue(confirmed('yolo'));
    render(<AgentModeSelector backend='wcore' conversationId='one' compact />);
    await chooseAutopilot();
    await waitFor(() => expect(screen.getByTestId('mode-selector')).toHaveAttribute('data-current-mode', 'yolo'));
    expect(success).toHaveBeenCalledTimes(1);
    expect(warning).not.toHaveBeenCalled();
  });
  it('refreshes unsolicited receipts from main and ignores another conversation', async () => {
    render(<AgentModeSelector backend='wcore' conversationId='one' compact />);
    await waitFor(() => expect(getMode).toHaveBeenCalledTimes(1));
    emit('set_mode_refused', { effective: 'force' }, 'two');
    expect(getMode).toHaveBeenCalledTimes(1);
    expect(warning).not.toHaveBeenCalled();
    emit('set_mode_refused', { effective: 'force', reason: 'local_opt_in_required' });
    await waitFor(() => expect(getMode).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('mode-selector')).toHaveAttribute('data-current-mode', 'default');
    getMode.mockResolvedValue(confirmed('auto_edit'));
    emit('execution_policy', {});
    await waitFor(() => expect(screen.getByTestId('mode-selector')).toHaveAttribute('data-current-mode', 'auto_edit'));
  });
  it('does not apply an old conversation mode result after switching tabs', async () => {
    let resolve!: (value: unknown) => void;
    setMode.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    const view = render(<AgentModeSelector backend='wcore' conversationId='one' compact />);
    await chooseAutopilot();
    getMode.mockResolvedValue(confirmed('auto_edit'));
    view.rerender(<AgentModeSelector backend='wcore' conversationId='two' compact initialMode='auto_edit' />);
    await waitFor(() => expect(screen.getByTestId('mode-selector')).toHaveAttribute('data-current-mode', 'auto_edit'));
    await act(async () => resolve(confirmed('yolo')));
    expect(screen.getByTestId('mode-selector')).toHaveAttribute('data-current-mode', 'auto_edit');
    expect(success).not.toHaveBeenCalled();
    view.unmount();
    expect(listeners.size).toBe(0);
  });
  it('keeps a confirmed mode when capability labels refresh around an old stored preference', async () => {
    const view = render(<AgentModeSelector backend='wcore' conversationId='one' compact initialMode='yolo' />);
    await waitFor(() => expect(screen.getByTestId('mode-selector')).toHaveAttribute('data-current-mode', 'default'));
    view.rerender(
      <AgentModeSelector
        backend='wcore'
        conversationId='one'
        compact
        initialMode='yolo'
        dynamicModes={[
          { value: 'default', label: 'Default' },
          { value: 'yolo', label: 'Autopilot' },
        ]}
      />
    );
    expect(screen.getByTestId('mode-selector')).toHaveAttribute('data-current-mode', 'default');
  });
});
