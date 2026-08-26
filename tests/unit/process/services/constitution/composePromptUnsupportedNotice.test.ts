/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1040 part 1 - `composePrompt` computed `constitutionSupported` and then threw
 * it away. Verified dead by search: 5 call sites of `composePrompt` exist in
 * `src/`, and NONE of them (nor anything else in `src/`) reads the field.
 *
 * A Windows user therefore got a materially different agent - no Constitution,
 * no specialist overlay - with nothing in the session saying so. That is the
 * shape of defect that produces unfalsifiable bug reports, so the flag now
 * drives a one-time, per-conversation notice on exactly the seam every backend
 * already resolves the Constitution through.
 *
 * Deliberately NOT a modal and NOT a blocker: the turn is proceeding either way.
 * There is nothing for the user to do, only something they are owed knowing -
 * the same call the sibling reclaim notice makes.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockBridge, mockCapability, mockAddMessage, mockEmit } = vi.hoisted(() => ({
  mockBridge: vi.fn(),
  mockCapability: vi.fn(),
  mockAddMessage: vi.fn(),
  mockEmit: vi.fn(),
}));

vi.mock('@process/services/constitution/constitutionFsService', () => ({
  getConstitutionFsService: () => ({
    capability: mockCapability,
    consumeRevisionAuthorityReclaim: () => null,
    readWithOverlay: (assistantId?: string) => {
      const value = mockBridge(assistantId) as { constitution: string; overlay: string | null };
      return {
        constitution: value.constitution
          ? { status: 'present', content: value.constitution, revision: 'rev:mock' }
          : { status: 'absent', revision: 'rev:mock-absent' },
        overlay: value.overlay === null ? null : { status: 'present', content: value.overlay, revision: 'rev:mock' },
      };
    },
  }),
}));
vi.mock('@process/utils/message', () => ({ addMessage: mockAddMessage }));
vi.mock('@/common', () => ({
  ipcBridge: { conversation: { responseStream: { emit: mockEmit } } },
}));

import { composePrompt } from '@process/services/constitution/composePrompt';
import { resetConstitutionUnsupportedNotices } from '@process/services/constitution/constitutionUnsupportedNotice';

const UNSUPPORTED = {
  supported: false as const,
  code: 'CONSTITUTION_FS_UNSAFE_PLATFORM' as const,
  reason: 'No packaged authority for win32-x64.',
};

describe('composePrompt discloses an unsupported Constitution platform (#1040)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    resetConstitutionUnsupportedNotices();
    mockBridge.mockReturnValue({ constitution: 'C', overlay: null });
  });

  it('posts a notice into the conversation naming what is missing', () => {
    mockCapability.mockReturnValue(UNSUPPORTED);

    const composed = composePrompt({ basePrompt: 'BASE', conversationId: 'conv-1' });

    expect(composed.constitutionSupported).toBe(false);
    expect(mockAddMessage).toHaveBeenCalledTimes(1);
    const [conversationId, message] = mockAddMessage.mock.calls[0] as [string, Record<string, unknown>];
    expect(conversationId).toBe('conv-1');
    const content = (message.content as { content: string }).content;
    expect(content).toContain('Constitution');
    expect(content).toContain('specialist');
    expect(content).toContain('Windows');
    // Persisting makes it survive; emitting is what makes it ARRIVE in the
    // chat that is running right now.
    expect(mockEmit).toHaveBeenCalledTimes(1);
  });

  it('says it once per conversation, not once per turn', () => {
    mockCapability.mockReturnValue(UNSUPPORTED);

    composePrompt({ conversationId: 'conv-1' });
    composePrompt({ conversationId: 'conv-1' });
    composePrompt({ conversationId: 'conv-1' });

    expect(mockAddMessage).toHaveBeenCalledTimes(1);
  });

  it('notices each conversation separately', () => {
    mockCapability.mockReturnValue(UNSUPPORTED);

    composePrompt({ conversationId: 'conv-1' });
    composePrompt({ conversationId: 'conv-2' });

    expect(mockAddMessage).toHaveBeenCalledTimes(2);
  });

  it('says nothing at all on a supported platform', () => {
    mockCapability.mockReturnValue({ supported: true });

    const composed = composePrompt({ conversationId: 'conv-1' });

    expect(composed.constitutionSupported).toBe(true);
    expect(mockAddMessage).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('holds the notice back when there is no conversation to put it in', () => {
    mockCapability.mockReturnValue(UNSUPPORTED);

    // A Team role prompt built ahead of its chat, or a Settings-side token
    // estimate. Nothing to post into, and the next turn that HAS somewhere to
    // put it must still get it.
    composePrompt({ basePrompt: 'BASE' });
    expect(mockAddMessage).not.toHaveBeenCalled();

    composePrompt({ basePrompt: 'BASE', conversationId: 'conv-9' });
    expect(mockAddMessage).toHaveBeenCalledTimes(1);
  });
});
