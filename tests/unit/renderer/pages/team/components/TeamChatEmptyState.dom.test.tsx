/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

// Live-smoke fix #4a (2026-05-19) - TeamChatEmptyState avatar polish.
// Asserts the fallback avatar (no preset, no backend logo) is pinned
// to the same 48px box as the other branches AND uses the muted
// background + tertiary text token instead of the prior fill-3 /
// t-secondary combo that read as a "huge dark blob" in smoke.
//
// 2026-05-25 - the avatar is now wrapped in AssistantIconTile so the
// per-role palette tints the frame. The 48px size pin lives on a
// className override; the muted bg-fill-2 has been replaced by an inline
// palette background (set by AssistantIconTile from resolveSpecialistPalette).

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

const mockUseSWR = vi.fn();
vi.mock('swr', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return { ...actual, default: (...args: unknown[]) => mockUseSWR(...args) };
});

vi.mock('@/common', () => ({
  ipcBridge: { conversation: { get: { invoke: vi.fn() } } },
}));

// Pretend there's no preset info so the fallback / backend branches own
// avatar rendering. usePresetAssistantInfo isn't relevant to the bug.
vi.mock('@renderer/hooks/agent/usePresetAssistantInfo', () => ({
  usePresetAssistantInfo: () => ({ info: null }),
}));

// Force the backendLogo lookup to miss so the fallback branch renders.
vi.mock('@renderer/utils/model/agentLogo', () => ({
  getAgentLogo: () => '',
}));

// All getSendBoxDraftHook factories return a noop mutate hook so the
// component can mount in jsdom without the real draft store.
vi.mock('@renderer/hooks/chat/useSendBoxDraft', () => ({
  getSendBoxDraftHook: (_kind: string, _seed: unknown) => (_id: string) => ({
    mutate: vi.fn(),
  }),
}));

import TeamChatEmptyState from '@/renderer/pages/team/components/TeamChatEmptyState';

describe('TeamChatEmptyState fallback avatar', () => {
  it('renders the 48px fallback tile with a per-role palette when no preset + no backend logo are available', () => {
    mockUseSWR.mockReturnValue({
      data: {
        id: 'conv-fallback',
        type: 'gemini',
        name: 'Renewal Push - Lead',
        extra: { teamId: 'team-1', agentName: 'Lead', backend: 'gemini' },
      },
    });
    render(<TeamChatEmptyState conversationId='conv-fallback' />);

    const avatar = screen.getByTestId('team-chat-empty-state-avatar');
    expect(avatar.getAttribute('data-variant')).toBe('fallback');
    // Tile keeps the 48px size pin via className override so the avatar
    // doesn't visually shift from the prior layout.
    const className = avatar.className ?? '';
    expect(className).toContain('!w-48px');
    expect(className).toContain('!h-48px');
    // The deprecated bg-fill-3 + text-t-secondary combo from the
    // pre-tile fix must NOT be reintroduced.
    expect(className).not.toContain('bg-fill-3');
    expect(className).not.toContain('text-t-secondary');
    // AssistantIconTile applies the palette as an inline background style.
    // 'Lead' is the agent name fallback - no role keyword hits, so the
    // resolver returns the universal 'cowork' palette (orange tint).
    const bg = (avatar as HTMLElement).style.backgroundColor;
    expect(bg).toBeTruthy();
    expect(bg).not.toBe('');
  });
});
