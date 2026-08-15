/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { WAYLAND_FILES_MARKER } from '@/common/config/constants';
import type { TMessage } from '@/common/chat/chatLib';
import type { ConversationSource } from '@/common/config/storage';

/**
 * The only conversation source whose stored `position: 'right'` text is known to
 * have been composed locally by the user.
 *
 * Every wired channel writes `source = <platform>` on its conversations, so an
 * allowlist of one is the whole local set. This is deliberately NOT a denylist
 * of channel names: `ChannelManager` starts 24 built-in channels and
 * `PluginType` is open (`string & {}`), so any denylist is a list that must be
 * manually widened every time a channel is added - and the failure mode of
 * forgetting is a silently reachable injection, not a broken build.
 */
const LOCAL_CONVERSATION_SOURCE = 'wayland';

/**
 * True when this conversation's messages may be treated as locally composed.
 *
 * `null` / `undefined` counts as local ONLY because rows written before the
 * `source` column existed are exactly the legacy rows this shim serves. A
 * caller that cannot determine the source (missing row, failed read) must NOT
 * pass nullish - it must pass {@link UNKNOWN_CONVERSATION_SOURCE} so the
 * upgrade is skipped.
 */
export function isLocalConversationSource(source: ConversationSource | null | undefined): boolean {
  return source == null || source === LOCAL_CONVERSATION_SOURCE;
}

/** Sentinel for "the source could not be determined" - never treated as local. */
export const UNKNOWN_CONVERSATION_SOURCE = '__wayland_unknown_source__';

/**
 * Read-time upgrade for user messages stored before attachments moved to the
 * structured `content.files` list.
 *
 * Legacy rows encode attachments only as a `[[AION_FILES]]` marker inside the
 * message text. The renderer no longer parses that marker (it is
 * attacker-reachable), so without this shim every restored attachment bubble
 * would lose both its previews and - because the marker tail is stripped from
 * displayed text - the paths themselves.
 *
 * This runs on read and writes nothing. There is no pre-migration backup of the
 * chat database anywhere in the app (the only user-reachable backup explicitly
 * excludes `desktop.database`), so a one-way in-place rewrite of message
 * content has no undo. A read-time shim is reversible by shipping a patch.
 *
 * The source check is the security-relevant half: an inbound
 * WhatsApp/Discord/Matrix message is persisted as `position: 'right'` with the
 * third party's raw text, so upgrading those rows would launder an injected
 * marker into a trusted file list. Only conversations positively identified as
 * local are upgraded; a message the user composed locally *inside* a channel
 * conversation loses its legacy previews, which is the bounded, accepted
 * residual.
 */
export function upgradeLegacyMarkerAttachments(
  messages: TMessage[],
  conversationSource: ConversationSource | null | undefined
): TMessage[] {
  if (!isLocalConversationSource(conversationSource)) return messages;

  return messages.map((message) => {
    if (message.type !== 'text' || message.position !== 'right') return message;
    const content = message.content;
    if (content.files !== undefined || typeof content.content !== 'string') return message;

    const markerIndex = content.content.indexOf(WAYLAND_FILES_MARKER);
    if (markerIndex === -1) return message;

    const files = content.content
      .slice(markerIndex + WAYLAND_FILES_MARKER.length)
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (files.length === 0) return message;

    // `content.content` is left byte-identical; only the derived list is added.
    return { ...message, content: { ...content, files } };
  });
}
