/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { TMessage } from '@/common/chat/chatLib';
import { uuid } from '@/common/utils';
import { addMessage } from '@process/utils/message';

/**
 * Tell the user, once per chat, that this platform runs without the
 * Constitution and the specialist overlay.
 *
 * #1040: `composePrompt` computed a `constitutionSupported` flag and discarded
 * it - zero call sites read it. So on win32 both the Constitution and the
 * per-specialist overlay were dropped from every system prompt, and a user got a
 * materially different agent (including a different identity) with nothing
 * anywhere saying so. The reporter's session self-identified as an Anthropic
 * model, which is exactly what a dropped identity prefix looks like from the
 * outside. That defect shape generates bug reports nobody can reproduce.
 *
 * This lives on the composer seam for the same reason the sibling reclaim notice
 * does: wayland-core, native ACP, Gemini, non-native ACP and Team role prompts
 * all resolve the Constitution through `composePrompt`, so one emitter covers
 * every backend.
 *
 * Deliberately not a modal, not a blocker, and not a retry: nothing is broken
 * and there is nothing for the user to do. Once per conversation, because the
 * flag is true on every turn and a card per turn would be noise rather than
 * disclosure. Doctor's `config.constitution` check is the durable copy.
 */
const noticedConversations = new Set<string>();

/** Test seam: forget which conversations have already been told. */
export function resetConstitutionUnsupportedNotices(): void {
  noticedConversations.clear();
}

export function emitConstitutionUnsupportedNotice(
  conversationId?: string,
  platform: NodeJS.Platform = process.platform
): void {
  // Nothing to post into (a Team role prompt built ahead of its chat, a
  // Settings-side token estimate). Deliberately NOT marked as told, so the next
  // turn that has somewhere to put it still gets it.
  if (!conversationId) return;
  if (noticedConversations.has(conversationId)) return;
  noticedConversations.add(conversationId);

  const id = uuid();
  const content = constitutionUnsupportedNoticeText(platform);
  addMessage(conversationId, {
    id,
    // Keyed so the reload-time merge in `useMessageLstCache` recognises the
    // stored row and the streamed copy below as ONE message.
    msg_id: id,
    conversation_id: conversationId,
    type: 'tips',
    position: 'center',
    createdAt: Date.now(),
    content: {
      type: 'warning',
      content,
    },
  } as TMessage);
  // Persisting makes the notice survive; emitting is what makes it ARRIVE.
  ipcBridge.conversation.responseStream.emit({
    type: 'tips',
    conversation_id: conversationId,
    msg_id: id,
    data: { type: 'warning', content },
  });
}

/**
 * What a user calls their operating system. Deliberately a local copy rather
 * than a shared import: the Doctor check that says the same thing is kept free
 * of this module (which pulls the IPC bridge and the message store in), and
 * three branches are not worth a new shared module.
 */
function platformName(platform: NodeJS.Platform): string {
  if (platform === 'win32') return 'Windows';
  if (platform === 'darwin') return 'macOS';
  if (platform === 'linux') return 'Linux';
  return platform;
}

/**
 * The tips surface collapses to about two lines by default, so the consequence
 * goes first and the reassurance last. It never names a file, a code or a
 * platform check: what the user needs is "your agent is missing its rules on
 * this operating system, and that is us, not you".
 */
export function constitutionUnsupportedNoticeText(platform: NodeJS.Platform = process.platform): string {
  return (
    `On ${platformName(platform)}, Wayland runs without its Constitution and without the specialist overlay, so ` +
    'this agent does not have the identity and behaviour rules it has on macOS and Linux, and a specialist gets no ' +
    'per-specialist instructions. Everything else works normally. This is a limitation of this platform, not a ' +
    'setting you got wrong — mention it if you report how an agent behaved here.'
  );
}
