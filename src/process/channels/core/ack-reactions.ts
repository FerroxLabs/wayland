/*
 * Portions adapted from OpenClaw <https://github.com/openclaw/openclaw>@aee2681a
 * Source: src/channels/ack-reactions.ts
 * MIT License - Copyright (c) 2025 Peter Steinberger
 * Used per MIT permission grant; Wayland additions remain under Apache-2.0.
 */
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Channel-agnostic acknowledgement reaction gating.
 *
 * Determines whether a plugin should react to an incoming message with an
 * acknowledgement emoji (eyes/thumbs/etc.) based on chat type, scope policy,
 * and mention detection.
 */

export type AckReactionScope = 'all' | 'direct' | 'group-all' | 'group-mentions' | 'off' | 'none';

export type WhatsAppAckReactionMode = 'always' | 'mentions' | 'never';

export type AckReactionGateParams = {
  scope: AckReactionScope | undefined;
  isDirect: boolean;
  isGroup: boolean;
  isMentionableGroup: boolean;
  requireMention: boolean;
  canDetectMention: boolean;
  effectiveWasMentioned: boolean;
  shouldBypassMention?: boolean;
};

export function shouldAckReaction(params: AckReactionGateParams): boolean {
  const scope = params.scope ?? 'group-mentions';
  if (scope === 'off' || scope === 'none') {
    return false;
  }
  if (scope === 'all') {
    return true;
  }
  if (scope === 'direct') {
    return params.isDirect;
  }
  if (scope === 'group-all') {
    return params.isGroup;
  }
  if (scope === 'group-mentions') {
    if (!params.isMentionableGroup) {
      return false;
    }
    if (!params.requireMention) {
      return false;
    }
    if (!params.canDetectMention) {
      return false;
    }
    return params.effectiveWasMentioned || params.shouldBypassMention === true;
  }
  return false;
}

export function shouldAckReactionForWhatsApp(params: {
  emoji: string;
  isDirect: boolean;
  isGroup: boolean;
  directEnabled: boolean;
  groupMode: WhatsAppAckReactionMode;
  wasMentioned: boolean;
  groupActivated: boolean;
}): boolean {
  if (!params.emoji) {
    return false;
  }
  if (params.isDirect) {
    return params.directEnabled;
  }
  if (!params.isGroup) {
    return false;
  }
  if (params.groupMode === 'never') {
    return false;
  }
  if (params.groupMode === 'always') {
    return true;
  }
  return shouldAckReaction({
    scope: 'group-mentions',
    isDirect: false,
    isGroup: true,
    isMentionableGroup: true,
    requireMention: true,
    canDetectMention: true,
    effectiveWasMentioned: params.wasMentioned,
    shouldBypassMention: params.groupActivated,
  });
}

export function removeAckReactionAfterReply(params: {
  removeAfterReply: boolean;
  ackReactionPromise: Promise<boolean> | null;
  ackReactionValue: string | null;
  remove: () => Promise<void>;
  onError?: (err: unknown) => void;
}) {
  if (!params.removeAfterReply) {
    return;
  }
  if (!params.ackReactionPromise) {
    return;
  }
  if (!params.ackReactionValue) {
    return;
  }
  void params.ackReactionPromise.then((didAck) => {
    if (!didAck) {
      return;
    }
    params.remove().catch((err) => params.onError?.(err));
  });
}
