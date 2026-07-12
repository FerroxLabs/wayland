/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #579 follow-up — the foreground-conversation reporter derives which chat is on
 * screen from the route, so the completion notifier can stay quiet only about the
 * chat actually in view. This guards the derivation (a runtime regex — not a
 * type-level concern, so it is tested at runtime).
 */
import { describe, expect, it } from 'vitest';
import { foregroundConversationIdFromPath } from '@renderer/hooks/system/useForegroundConversationReporter';

describe('foregroundConversationIdFromPath', () => {
  it('extracts the id from a conversation route', () => {
    expect(foregroundConversationIdFromPath('/conversation/abc-123')).toBe('abc-123');
  });

  it('ignores trailing segments (e.g. a sub-route) but keeps the id', () => {
    expect(foregroundConversationIdFromPath('/conversation/abc-123/details')).toBe('abc-123');
  });

  it('returns null for any non-conversation route — so a completion there still notifies', () => {
    expect(foregroundConversationIdFromPath('/conversations')).toBeNull(); // the LIST, not a chat
    expect(foregroundConversationIdFromPath('/settings/notifications')).toBeNull();
    expect(foregroundConversationIdFromPath('/')).toBeNull();
    expect(foregroundConversationIdFromPath('')).toBeNull();
  });
});
