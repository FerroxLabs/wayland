/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import WorkspacePolicyButton from '@/renderer/components/agent/WorkspacePolicyButton';

const { getMode, listeners } = vi.hoisted(() => ({
  getMode: vi.fn(),
  listeners: new Set<(message: IResponseMessage) => void>(),
}));
vi.mock('@/common', () => ({
  ipcBridge: {
    acpConversation: { getMode: { invoke: getMode } },
    conversation: {
      responseStream: {
        on: (listener: (message: IResponseMessage) => void) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      },
    },
  },
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const policy = {
  readable_roots: ['/workspace'],
  writable_roots: ['/workspace/output'],
  capabilities: [{ name: 'cargo', executable: '/usr/bin/cargo', read_only_roots: ['/rustlib'] }],
};
const result = (value: unknown) => ({
  success: true,
  data: { mode: 'default', initialized: true, workspacePolicy: value },
});
const open = () => fireEvent.click(screen.getByRole('button', { name: 'conversation.workspacePolicy.title' }));

describe('Core workspace access control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    getMode.mockResolvedValue(result(policy));
  });

  it('shows exact live roots and executable capabilities beside permission controls', async () => {
    render(<WorkspacePolicyButton conversationId='one' />);
    open();
    expect(await screen.findByText('/workspace/output')).toBeTruthy();
    expect(screen.getByText('/workspace')).toBeTruthy();
    expect(screen.getByText('cargo: /usr/bin/cargo')).toBeTruthy();
    expect(screen.getByText('/rustlib')).toBeTruthy();
    expect(getMode).toHaveBeenCalledWith({ conversationId: 'one' });
  });

  it('invalidates on a receipt but never trusts the raw stream payload', async () => {
    render(<WorkspacePolicyButton conversationId='one' />);
    open();
    await screen.findByText('/workspace/output');
    getMode.mockResolvedValue(result({ ...policy, writable_roots: ['/new-root'] }));
    act(() =>
      listeners.forEach((listener) =>
        listener({
          type: 'workspace_policy',
          conversation_id: 'one',
          msg_id: '',
          data: { writable_roots: ['/forged-root'] },
        })
      )
    );
    expect(await screen.findByText('/new-root')).toBeTruthy();
    expect(screen.queryByText('/forged-root')).toBeNull();
    expect(screen.queryByText('/workspace/output')).toBeNull();
  });

  it('clears historical access when main reports a dead transport or the read fails', async () => {
    render(<WorkspacePolicyButton conversationId='one' />);
    open();
    await screen.findByText('/workspace/output');
    getMode.mockResolvedValue(result(null));
    act(() =>
      listeners.forEach((listener) => listener({ type: 'finish', conversation_id: 'one', msg_id: '', data: '' }))
    );
    await screen.findByText('conversation.workspacePolicy.unknown');
    expect(screen.queryByText('/workspace/output')).toBeNull();
    getMode.mockRejectedValue(new Error('offline'));
    act(() =>
      listeners.forEach((listener) =>
        listener({ type: 'workspace_policy', conversation_id: 'one', msg_id: '', data: policy })
      )
    );
    await waitFor(() => expect(screen.queryByText('/workspace/output')).toBeNull());
  });

  it('discards a delayed result from the previous conversation and removes its listener', async () => {
    let resolveOld!: (value: unknown) => void;
    getMode.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        })
    );
    const view = render(<WorkspacePolicyButton conversationId='one' />);
    getMode.mockResolvedValue(result(null));
    view.rerender(<WorkspacePolicyButton conversationId='two' />);
    open();
    await act(async () => {
      resolveOld(result(policy));
    });
    await screen.findByText('conversation.workspacePolicy.unknown');
    expect(screen.queryByText('/workspace/output')).toBeNull();
    expect(listeners.size).toBe(1);
    view.unmount();
    expect(listeners.size).toBe(0);
  });
});
