/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Transient fast-ack lifecycle event (#30). The send box owns the message-list
 * state and renders/removes the transient ack bubble; the stream hook does not
 * touch the list, so it signals "the main response started (or errored) - drop
 * the ack" via this window CustomEvent. Mirrors CHAT_RETRY_EVENT /
 * EDIT_AND_RERUN_EVENT (cross-component, conversation-scoped).
 */

export const ACK_CLEAR_EVENT = 'wl:ack-clear';

export type AckClearDetail = { conversationId: string; msgId: string };

/** The synthetic, non-persisted id of a turn's transient ack bubble. */
export const ackMsgId = (msgId: string): string => `ack:${msgId}`;

/** Signal that the transient ack for this turn should be removed. */
export function dispatchAckClear(detail: AckClearDetail): void {
  window.dispatchEvent(new CustomEvent<AckClearDetail>(ACK_CLEAR_EVENT, { detail }));
}
