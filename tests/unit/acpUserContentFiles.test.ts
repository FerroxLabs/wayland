/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ACP is the only backend with no optimistic user bubble: the live message is
 * built entirely from the `user_content` stream event. When attachments moved
 * off the `[[AION_FILES]]` marker and onto `content.files`, that event kept
 * sending bare text, so a user's own attachment vanished from the live bubble
 * and only reappeared when the conversation was reopened from the database.
 *
 * The security half matters as much as the rendering half: `transformMessage`
 * builds assistant messages from the SAME branch, and the renderer draws
 * `files` without checking position. So a `files` field must be honoured for
 * `user_content` and ignored for `content`.
 */

import { describe, expect, it } from 'vitest';
import { transformMessage } from '@/common/chat/chatLib';

describe('user_content attachments (ACP live bubble)', () => {
  it('renders attachments the user picked on the live bubble', () => {
    const msg = transformMessage({
      type: 'user_content',
      conversation_id: 'c1',
      msg_id: 'm1',
      data: { content: 'have a look', files: ['/ws/a.png', '/ws/b.pdf'] },
    } as any);

    expect(msg.position).toBe('right');
    expect((msg.content as any).files).toEqual(['/ws/a.png', '/ws/b.pdf']);
    expect((msg.content as any).content).toBe('have a look');
  });

  it('still handles a plain string payload with no attachments', () => {
    const msg = transformMessage({
      type: 'user_content',
      conversation_id: 'c1',
      msg_id: 'm2',
      data: 'just text',
    } as any);

    expect((msg.content as any).files).toBeUndefined();
    expect((msg.content as any).content).toBe('just text');
  });

  it('preserves cronMeta alongside attachments', () => {
    const msg = transformMessage({
      type: 'user_content',
      conversation_id: 'c1',
      msg_id: 'm3',
      data: { content: 'nightly', cronMeta: { id: 'cron-1' }, files: ['/ws/a.png'] },
    } as any);

    expect((msg.content as any).files).toEqual(['/ws/a.png']);
    expect((msg.content as any).cronMeta).toEqual({ id: 'cron-1' });
  });

  it('IGNORES a files field on an assistant message', () => {
    const msg = transformMessage({
      type: 'content',
      conversation_id: 'c1',
      msg_id: 'm4',
      data: { content: 'sure, here you go', files: ['/Users/victim/Documents/passport.png'] },
    } as any);

    expect(msg.position).toBe('left');
    expect((msg.content as any).files).toBeUndefined();
  });
});
