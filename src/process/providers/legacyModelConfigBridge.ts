/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Slim write-through bridge from the new `modelRegistry` to the legacy
 * `model.config` `ProcessConfig` blob (Wave 3 cross-audit, Fix 13).
 *
 * The Wave 3A bridge was deleted in Wave 3B on the theory that the new
 * registry would be the single source of truth. The cross-audit found that
 * five legacy UI surfaces still read `getMergedModelProviders()` directly:
 *
 *   - `AcpModelSelector` (CLI-agent header in the conversation page)
 *   - `WCoreModelSelector` (Wayland-Core agent header)
 *   - `GeminiModelSelector` (Gemini agent header)
 *   - `EditModeModal` (per-conversation override)
 *   - `AddPlatformModal` (the "add a custom provider" UX in some flows)
 *
 * Until those surfaces are refactored to read from `modelRegistry.list()` +
 * `modelRegistry.getCatalog()` (Wave 4 polish), they will silently fail to
 * see a freshly-connected provider. This module restores write-through
 * mirroring — but only for non-cloud, non-CLI providers that
 * `getMergedModelProviders()` is allowed to expose to those surfaces.
 *
 * ### Safety
 *
 *  - **Serial writes via a Promise mutex.** Two concurrent connects could
 *    interleave reads + writes of the same `model.config` blob and lose data.
 *    Every mirror operation is queued behind the previous one (3A's lesson).
 *  - **Tagged rows.** Each row written by this bridge carries
 *    `__waylandModelRegistryBridge: 'v2'` so the migration can detect and
 *    skip them on next boot, and so a future cleanup can remove only the
 *    rows this bridge owns.
 *  - **Excluded providers.** Cloud providers (Bedrock / Vertex / Azure) and
 *    CLI-only providers carry credentials that don't fit the legacy
 *    `IProvider` shape; mirroring them would produce broken legacy rows.
 */

import type { IProvider } from '@/common/config/storage';
import { uuid } from '@/common/utils';
import { ProcessConfig } from '@process/utils/initStorage';
import type { ProviderId } from './types';
import type { ProviderRepository } from './storage/ProviderRepository';

const BRIDGE_TAG_KEY = '__waylandModelRegistryBridge';
const BRIDGE_TAG_VALUE = 'v2';

/** Providers that must NOT be mirrored — their creds don't fit `IProvider`. */
const EXCLUDED_PROVIDERS: ReadonlySet<ProviderId> = new Set<ProviderId>([
  'aws-bedrock',
  'vertex',
  'azure',
]);

/** Map a `ProviderId` to the legacy `platform` string `IProvider` expects. */
function platformFor(providerId: ProviderId): string {
  switch (providerId) {
    case 'anthropic':
      return 'anthropic';
    case 'openai':
      return 'openai';
    case 'google-gemini':
      return 'gemini';
    default:
      return 'openai-compatible';
  }
}

/** Map a `ProviderId` to a human display name. */
function displayNameFor(providerId: ProviderId): string {
  // Title-case the providerId, replacing dashes with spaces.
  return providerId
    .split('-')
    .map((p) => (p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ');
}

/** A `IProvider` row produced by this bridge. */
type BridgeRow = IProvider & { [BRIDGE_TAG_KEY]: typeof BRIDGE_TAG_VALUE };

/** True when an arbitrary `IProvider`-shaped row was written by this v2 bridge. */
function isV2BridgeRow(row: IProvider): boolean {
  return (row as unknown as Record<string, unknown>)[BRIDGE_TAG_KEY] === BRIDGE_TAG_VALUE;
}

// ─── Promise mutex ────────────────────────────────────────────────────────────

let mutex: Promise<void> = Promise.resolve();
function runSerial<T>(fn: () => Promise<T>): Promise<T> {
  const next = mutex.then(fn, fn);
  // Swallow rejections in the chain so one failure doesn't stall future writes.
  mutex = next.then(
    (): void => undefined,
    (): void => undefined
  );
  return next;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Mirror a successful connect/rekey for `providerId` into `model.config`.
 * Skips cloud + CLI-only providers (their creds don't fit `IProvider`).
 * Replaces any existing bridge-tagged row for the same providerId so a rekey
 * doesn't accumulate duplicate rows.
 *
 * Reads the catalog from the repo to populate the legacy `model[]` array so
 * the legacy selectors immediately see model choices.
 */
export function mirrorConnectOrRekey(repo: ProviderRepository, providerId: ProviderId): Promise<void> {
  if (EXCLUDED_PROVIDERS.has(providerId)) return Promise.resolve();

  return runSerial(async () => {
    const provider = repo.getRegistryProvider(providerId);
    if (!provider) return; // Disconnected between connect-success and the mirror — drop.

    const stored = repo.getRegistryProviderCreds(providerId);
    if (stored.status !== 'ok') return;

    // Google-auth Gemini doesn't carry a key — skip; the legacy
    // `gemini-with-google-auth` flow has its own auth state outside `IProvider`.
    if (stored.creds.useGoogleAuth === true) return;

    const apiKey = typeof stored.creds.key === 'string' ? stored.creds.key : '';
    if (!apiKey) return; // Nothing useful to mirror.

    const baseUrl = typeof stored.creds.baseUrl === 'string' ? stored.creds.baseUrl : '';
    const catalog = repo.getRegistryCatalog(providerId);
    const modelIds = catalog.map((m) => m.id);
    const modelProtocols =
      stored.creds.protocols && typeof stored.creds.protocols === 'object'
        ? (stored.creds.protocols as Record<string, string>)
        : undefined;

    const row: BridgeRow = {
      id: uuid(),
      name: displayNameFor(providerId),
      platform: platformFor(providerId),
      baseUrl,
      apiKey,
      model: modelIds,
      ...(modelProtocols ? { modelProtocols } : {}),
      [BRIDGE_TAG_KEY]: BRIDGE_TAG_VALUE,
    };

    const raw = await ProcessConfig.get('model.config');
    const current: IProvider[] = Array.isArray(raw) ? (raw as IProvider[]) : [];
    // Drop any prior v2 row for this provider; leave non-bridge rows alone.
    const filtered = current.filter((p) => !(isV2BridgeRow(p) && p.platform === row.platform));
    filtered.push(row);
    await ProcessConfig.set('model.config', filtered);
  }).catch((error) => {
    console.warn(`[legacyModelConfigBridge] mirror connect/rekey failed for ${providerId}:`, error);
  });
}

/**
 * Mirror a disconnect: remove the v2 bridge row for `providerId`. Leaves
 * non-bridge rows alone — they were written by older paths (or by the user).
 */
export function mirrorDisconnect(providerId: ProviderId): Promise<void> {
  if (EXCLUDED_PROVIDERS.has(providerId)) return Promise.resolve();
  return runSerial(async () => {
    const platform = platformFor(providerId);
    const raw = await ProcessConfig.get('model.config');
    const current: IProvider[] = Array.isArray(raw) ? (raw as IProvider[]) : [];
    const filtered = current.filter((p) => !(isV2BridgeRow(p) && p.platform === platform));
    if (filtered.length !== current.length) {
      await ProcessConfig.set('model.config', filtered);
    }
  }).catch((error) => {
    console.warn(`[legacyModelConfigBridge] mirror disconnect failed for ${providerId}:`, error);
  });
}
