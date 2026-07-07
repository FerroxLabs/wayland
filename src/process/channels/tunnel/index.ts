/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Webhook tunnel manager - public surface.
 *
 * SECURITY: starting a tunnel opens a public ingress. Consumers gate it behind
 * an explicit opt-in flag (default OFF) and keep enforcing their webhook
 * signature regardless. See module headers for detail.
 */

export { startTunnel, stopAllTunnels } from './TunnelManager';
export { ensureCloudflaredBinary, findCloudflaredOnPath } from './cloudflaredBinary';
export { parseCloudflaredUrl, parseNgrokJsonLine } from './parseTunnelUrl';
export {
  assertPublicWebhookUrl,
  isLocalOnlyWebhookHost,
  isProviderUnreachableWebhookUrl,
  providerRequiresPublicWebhook,
} from './webhookExposureGuard';
export {
  buildWebhookUrl,
  resolveExposure,
  stopExposure,
  type ExposureStatus,
  type ResolveExposureInput,
} from './WebhookExposureService';
export { DEFAULT_TUNNEL_PROVIDER, type StartTunnelOptions, type TunnelHandle, type TunnelProvider } from './types';
