/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useComposerSkills } from '@renderer/pages/conversation/components/composerMenu/useComposerSkills';

const addToConversation = vi.fn().mockResolvedValue({ ok: true });

vi.mock('@/common', () => ({
  ipcBridge: {
    skills: {
      addToConversation: { invoke: (...a: unknown[]) => addToConversation(...a) },
    },
  },
}));

beforeEach(() => {
  addToConversation.mockClear();
  addToConversation.mockResolvedValue({ ok: true });
});

describe('useComposerSkills', () => {
  it('staged mode holds picks locally without IPC', async () => {
    const { result } = renderHook(() => useComposerSkills({ mode: 'staged' }));
    await act(async () => {
      await result.current.addSkill('pptx');
    });
    expect(result.current.stagedSkills).toContain('pptx');
    expect(addToConversation).not.toHaveBeenCalled();
  });

  it('staged mode does not duplicate the same pick', async () => {
    const { result } = renderHook(() => useComposerSkills({ mode: 'staged' }));
    await act(async () => {
      await result.current.addSkill('pptx');
      await result.current.addSkill('pptx');
    });
    expect(result.current.stagedSkills).toEqual(['pptx']);
  });

  it('staged removeSkill drops the pick', async () => {
    const { result } = renderHook(() => useComposerSkills({ mode: 'staged' }));
    await act(async () => {
      await result.current.addSkill('pptx');
      await result.current.removeSkill('pptx');
    });
    expect(result.current.stagedSkills).toEqual([]);
  });

  it('live mode writes through addToConversation', async () => {
    const { result } = renderHook(() => useComposerSkills({ mode: 'live', conversationId: 'c1' }));
    await act(async () => {
      await result.current.addSkill('pptx');
    });
    expect(addToConversation).toHaveBeenCalledWith({ conversationId: 'c1', name: 'pptx' });
    expect(result.current.stagedSkills).toContain('pptx');
  });

  it('live addSkill is a no-op without a conversationId', async () => {
    const { result } = renderHook(() => useComposerSkills({ mode: 'live' }));
    await act(async () => {
      await result.current.addSkill('pptx');
    });
    expect(addToConversation).not.toHaveBeenCalled();
  });

  it('onChatList merges builtins (enabled) with added skills', async () => {
    const { result } = renderHook(() =>
      useComposerSkills({
        mode: 'staged',
        builtinAutoSkills: [
          { name: 'cron', description: 'schedule' },
          { name: 'officecli', description: 'office' },
        ],
        disabledBuiltinSkills: ['officecli'],
      })
    );
    await act(async () => {
      await result.current.addSkill('pptx');
    });
    const names = result.current.onChatList.map((s) => s.name);
    expect(names).toContain('pptx');
    expect(names).toContain('cron');
    expect(names).toContain('officecli');
    const cron = result.current.onChatList.find((s) => s.name === 'cron');
    const office = result.current.onChatList.find((s) => s.name === 'officecli');
    const pptx = result.current.onChatList.find((s) => s.name === 'pptx');
    expect(cron).toMatchObject({ kind: 'builtin', enabled: true });
    expect(office).toMatchObject({ kind: 'builtin', enabled: false });
    expect(pptx).toMatchObject({ kind: 'added', enabled: true });
  });

  it('toggleSkill on a builtin calls onToggleBuiltinSkill', async () => {
    const onToggleBuiltinSkill = vi.fn();
    const { result } = renderHook(() =>
      useComposerSkills({
        mode: 'staged',
        builtinAutoSkills: [{ name: 'cron', description: 'schedule' }],
        disabledBuiltinSkills: [],
        onToggleBuiltinSkill,
      })
    );
    await act(async () => {
      await result.current.toggleSkill('cron');
    });
    expect(onToggleBuiltinSkill).toHaveBeenCalledWith('cron');
  });

  it('toggleSkill on an added skill removes it (staged)', async () => {
    const { result } = renderHook(() => useComposerSkills({ mode: 'staged' }));
    await act(async () => {
      await result.current.addSkill('pptx');
      await result.current.toggleSkill('pptx');
    });
    expect(result.current.stagedSkills).toEqual([]);
  });
});
