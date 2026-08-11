/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import type { TMessage } from '@/common/chat/chatLib';
import { uuid } from '@/common/utils';
import { addMessage } from '@process/utils/message';
import type { ConstitutionFsService } from './constitutionFsService';

/**
 * Tell the user, once and in the thread, that their Constitution key ring was
 * regenerated.
 *
 * This lives on the composer seam rather than in one backend's manager because
 * the reclaim is reached from every backend: wayland-core, native ACP (Claude
 * Code / Codex), Gemini, non-native ACP, and Team role prompts all resolve the
 * Constitution through `composePrompt`. Emitting it from a single manager meant
 * a Claude Code user had their revision lineage rotated and their ring moved
 * with no notice at all.
 *
 * Being on that seam also keys the notice correctly. The pending fact is held
 * once per service (process-global), but it is consumed in the same synchronous
 * call that performed the read, so it lands in the conversation whose turn
 * actually triggered the reclaim instead of whichever chat happens to send
 * next.
 *
 * Deliberately not a modal, not a blocking card, and not a retry button: the
 * ring is already regenerated and the turn is already proceeding. There is
 * nothing for the user to do, only something they are owed knowing.
 */
export function emitConstitutionReclaimNotice(service: ConstitutionFsService, conversationId?: string): void {
  // Nothing to post into. The pending fact is deliberately left un-consumed so
  // a composition with no conversation (a Team role prompt built ahead of its
  // chat, a Settings-side token estimate) defers the notice to the next turn
  // that has somewhere to put it, rather than swallowing it.
  if (!conversationId) return;
  const reclaim = service.consumeRevisionAuthorityReclaim();
  if (!reclaim) return;
  addMessage(conversationId, {
    id: uuid(),
    conversation_id: conversationId,
    type: 'tips',
    position: 'center',
    createdAt: Date.now(),
    content: {
      type: 'warning',
      content: constitutionReclaimNoticeText(reclaim.archivedPath),
    },
  } as TMessage);
}

/**
 * The tips surface collapses to about two lines by default, so the outcome and
 * the cause go first and the file name goes last. The full path is left out on
 * purpose: it is the longest and least useful part of the sentence, and putting
 * it up front buried everything that matters underneath the fold.
 */
export function constitutionReclaimNoticeText(archivedPath: string): string {
  return (
    'Wayland could not unlock the Constitution key ring saved on this machine, because it was encrypted by a different installation of this app. A new key ring was created so this chat could continue, and your Constitution text is unchanged. The file that could not be read was kept next to it as ' +
    `${path.basename(archivedPath)}.`
  );
}
