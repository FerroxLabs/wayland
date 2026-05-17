/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WebhookVerifier } from '../types';
import { discordVerifier } from './discord';
import { genericVerifier } from './generic';
import { slackVerifier } from './slack';
import { twilioVerifier } from './twilio';
import { whatsappVerifier } from './whatsapp';

/**
 * Registry of platform → verifier. Lookup is keyed by the URL parameter
 * `:platform` on the inbound webhook route, so values here must match
 * whatever the channel plugin uses when minting connection tokens.
 */
export const VERIFIER_REGISTRY: Record<string, WebhookVerifier> = {
  'sms-twilio': twilioVerifier,
  discord: discordVerifier,
  slack: slackVerifier,
  whatsapp: whatsappVerifier,
  generic: genericVerifier,
};
