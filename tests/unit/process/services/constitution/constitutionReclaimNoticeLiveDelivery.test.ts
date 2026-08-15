/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A key-ring reclaim notice that is only WRITTEN is a notice the user never
 * reads. Seen live: the row was persisted with exactly the right wording, the
 * chat showed nothing, and the same notice rendered perfectly after the app was
 * restarted. Persisting is what makes it survive; emitting is what makes it
 * arrive. It has to do both, in that order, in the same call.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAddMessage, mockEmit } = vi.hoisted(() => ({ mockAddMessage: vi.fn(), mockEmit: vi.fn() }));

vi.mock('@process/utils/message', () => ({
  addMessage: mockAddMessage,
  addOrUpdateMessage: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: mockEmit },
    },
  },
}));

import { emitConstitutionReclaimNotice } from '@process/services/constitution/constitutionReclaimNotice';
import type { ConstitutionFsService } from '@process/services/constitution/constitutionFsService';

const ARCHIVED = '/tmp/profile/constitution/revision-authority.enc.locked-20260811T175902Z';

/** Only the one method the notice seam consumes. */
const serviceWithReclaim = (reclaim: { archivedPath: string } | undefined) =>
  ({ consumeRevisionAuthorityReclaim: () => reclaim }) as unknown as ConstitutionFsService;

describe('the Constitution reclaim notice is delivered live, not only persisted', () => {
  beforeEach(() => {
    mockAddMessage.mockClear();
    mockEmit.mockClear();
  });

  it('emits the notice on the conversation stream as well as persisting it', () => {
    emitConstitutionReclaimNotice(serviceWithReclaim({ archivedPath: ARCHIVED }), 'conv-live');

    expect(mockAddMessage).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenCalledTimes(1);

    const [conversationId, persisted] = mockAddMessage.mock.calls[0] as [
      string,
      { msg_id?: string; type: string; content: { type: string; content: string } },
    ];
    const [emitted] = mockEmit.mock.calls[0] as [
      { type: string; conversation_id: string; msg_id: string; data: { type: string; content: string } },
    ];

    expect(conversationId).toBe('conv-live');
    expect(emitted.conversation_id).toBe('conv-live');
    expect(emitted.type).toBe('tips');
    expect(emitted.data.type).toBe('warning');
    // Same prose on the wire as in the row - the live reader and the reader who
    // reloads must not see two different notices.
    expect(emitted.data.content).toBe(persisted.content.content);
    expect(emitted.data.content).toContain('could not unlock the Constitution key ring');

    // Keyed identically so the reload-time merge recognises the two as one
    // message instead of stacking a duplicate notice above the persisted one.
    expect(persisted.msg_id).toBeTruthy();
    expect(emitted.msg_id).toBe(persisted.msg_id);
  });

  it('stays silent when there is nothing to report', () => {
    emitConstitutionReclaimNotice(serviceWithReclaim(undefined), 'conv-healthy');

    expect(mockAddMessage).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('does not emit when there is no conversation to post into', () => {
    emitConstitutionReclaimNotice(serviceWithReclaim({ archivedPath: ARCHIVED }), undefined);

    expect(mockAddMessage).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
  });
});
