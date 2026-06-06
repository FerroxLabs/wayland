/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WebhookVerifier } from '../types';
import { agentMailVerifier } from './agentmail';
import { discordVerifier } from './discord';
import { genericVerifier } from './generic';
import { googleChatVerifier } from './google-chat';
import { lineVerifier } from './line';
import { msTeamsVerifier } from './ms-teams';
import { slackVerifier } from './slack';
import { synologyChatVerifier } from './synology-chat';
import { twilioVerifier } from './twilio';
import { whatsappVerifier } from './whatsapp';

/**
 * Registry of platform → verifier. Lookup is keyed by the URL parameter
 * `:platform` on the inbound webhook route, so values here must match
 * whatever the channel plugin uses when minting connection tokens.
 */
export const VERIFIER_REGISTRY: Record<string, WebhookVerifier> = {
  'sms-twilio': twilioVerifier,
  'email-agentmail': agentMailVerifier,
  'google-chat': googleChatVerifier,
  'ms-teams': msTeamsVerifier,
  'synology-chat': synologyChatVerifier,
  discord: discordVerifier,
  line: lineVerifier,
  slack: slackVerifier,
  whatsapp: whatsappVerifier,
  generic: genericVerifier,
  // Alias: WebhookPlugin uses type='webhook' and the ConfigForm mints
  // `/webhooks/webhook/<token>` URLs. Without this alias inbound 404s with
  // 'unknown-platform'. Both keys resolve to the same verifier.
  webhook: genericVerifier,
};
