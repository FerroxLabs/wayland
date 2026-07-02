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
 * mirroring - but only for non-cloud, non-CLI providers that
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
import { isImageModelName } from '@/common/config/imageModels';
import { uuid } from '@/common/utils';
import { ProcessConfig } from '@process/utils/initStorage';
import { Curator } from './catalog/Curator';
import type { CatalogModel, ProviderId } from './types';
import type { ProviderRepository, RegistryOverride } from './storage/ProviderRepository';

const BRIDGE_TAG_KEY = '__waylandModelRegistryBridge';
/**
 * Per-provider tag value: `v2:<providerId>`. Wave-4 ship-gate Fix C4 - the
 * original `'v2'` constant caused the dedup to key on legacy `platform`, which
 * collapsed every `openai-compatible` provider into one row (only the
 * last-written remained visible to legacy selectors). Including the
 * `providerId` in the tag lets multiple bridge rows that share a legacy
 * platform coexist with stable identity, and the migration's
 * `BRIDGE_TAG_VALUES` accepts any `v2*` value.
 */
function bridgeTagValue(providerId: ProviderId): string {
  return `v2:${providerId}`;
}
/** Legacy v2 tag, accepted on read for backward compatibility. */
const LEGACY_V2_TAG_VALUE = 'v2';

/** Providers that must NOT be mirrored - their creds don't fit `IProvider`. */
const EXCLUDED_PROVIDERS: ReadonlySet<ProviderId> = new Set<ProviderId>(['aws-bedrock', 'vertex', 'azure']);

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
type BridgeRow = IProvider & { [BRIDGE_TAG_KEY]: string };

/**
 * True when `row` is a v2 bridge row owned by the given `providerId`. Used to
 * find the existing tagged row to replace on rekey. Backward compat: a row
 * carrying the original `'v2'` (no providerId) tag is matched only by its
 * legacy platform - that branch trips at most once per provider since the
 * next mirror replaces it with the providerId-stamped tag value.
 */
function isV2BridgeRowForProvider(row: IProvider, providerId: ProviderId, platform: string): boolean {
  const tag = (row as unknown as Record<string, unknown>)[BRIDGE_TAG_KEY];
  if (typeof tag !== 'string') return false;
  if (tag === bridgeTagValue(providerId)) return true;
  // Legacy untagged-providerId rows: only safe to match by platform IF this
  // platform has at most one mirror row - which is true for the providers
  // whose platform-string is unique (anthropic, openai, gemini). For
  // `openai-compatible` the migration upgrades the tag, so this branch only
  // fires once per provider on the first rekey after upgrade.
  if (tag === LEGACY_V2_TAG_VALUE && row.platform === platform) return true;
  return false;
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

/**
 * The model ids to mirror into the legacy `model.config` for the in-chat
 * pickers: the CURATED (recommended/enabled) set with the user's per-model
 * overrides applied - NOT the full raw catalog.
 *
 * A broad provider exposes hundreds of models (OpenRouter ships ~300), and
 * dumping every id buried the chosen handful under an alphabetical wall so the
 * in-chat dropdown showed models the user never picked (issue #13). This mirrors
 * exactly what Settings shows: the Curator's enabled set, plus any model the
 * user explicitly toggled on/off. Non-text models (image/audio/embedding) are
 * dropped by the Curator, which is correct for a chat model picker.
 */
export function selectMirrorModelIds(catalog: CatalogModel[], overrides: RegistryOverride[]): string[] {
  const curated = new Curator().curate(catalog);
  const overrideEnabled = new Map(overrides.map((o) => [o.modelId, o.enabled]));
  const enabled = curated.filter((m) => overrideEnabled.get(m.id) ?? m.enabled);
  // Never hand the picker an empty list WHEN the emptiness isn't the user's doing:
  // a provider with no eligible flagship family (Curator enables none, no user
  // overrides) falls back to the full curated text set rather than blanking the
  // dropdown. But if the user EXPLICITLY disabled models (a disabling override is
  // present), an empty result is intentional - "disable all of provider X" must
  // actually empty X's picker/default candidacy, not silently re-populate it
  // (#538: disabling every OpenAI model still left gpt-5.5 as the new-chat
  // default because this fallback re-added the whole set).
  // "Disabled some" means the user explicitly turned off a model that is IN the
  // curated set - the only overrides that can empty `enabled`. Scoping to curated
  // avoids a stale override for a non-curated / dropped model spuriously
  // suppressing the never-blank fallback.
  const userDisabledCurated = curated.some((m) => overrideEnabled.get(m.id) === false);
  const selected = enabled.length > 0 ? enabled : userDisabledCurated ? [] : curated;
  // Drop image-named models: a brand-new image model (e.g. `gpt-image-2`) that
  // models.dev hasn't enriched yet defaults to `kind: 'text'` and would slip
  // through the Curator into the chat pickers. It belongs only in the image
  // picker (see selectImageModelIds), never the chat dropdown.
  return selected.filter((m) => !isImageModelName(m.id)).map((m) => m.id);
}

/**
 * The image-generation model ids to mirror into the legacy `model.config` row's
 * `imageModels` field for the image-tool picker.
 *
 * This is the inverse of {@link selectMirrorModelIds}: the `Curator` keeps only
 * `kind: 'text'` (chat pickers), so image models were silently dropped from the
 * mirror and never reached the image picker. Here we take the catalog's image
 * models directly, newest-first by `releaseDate` so the best current model leads
 * the dropdown.
 *
 * We match on `kind: 'image'` OR an image-looking id. The id check is essential:
 * a model too new for models.dev (e.g. `gpt-image-2`) lands UNENRICHED with the
 * default `kind: 'text'` and no `image` tag - exactly the latest model the user
 * most wants. Enrichment is not a prerequisite for showing it. The catalog
 * auto-refreshes, so new image models appear on the next refresh, enriched or
 * not, with no code change.
 */
export function selectImageModelIds(catalog: CatalogModel[]): string[] {
  return catalog
    .filter((m) => m.kind === 'image' || isImageModelName(m.id))
    .toSorted((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''))
    .map((m) => m.id);
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
    if (!provider) return; // Disconnected between connect-success and the mirror - drop.

    const stored = repo.getRegistryProviderCreds(providerId);
    if (stored.status !== 'ok') return;

    // Google-auth Gemini doesn't carry a key - skip; the legacy
    // `gemini-with-google-auth` flow has its own auth state outside `IProvider`.
    if (stored.creds.useGoogleAuth === true) return;

    const apiKey = typeof stored.creds.key === 'string' ? stored.creds.key : '';
    // `ollama-local` is keyless by design (a local Ollama daemon needs no key),
    // so its mirror row legitimately carries an empty `apiKey`. Every other
    // provider with no key has nothing useful to mirror and is skipped.
    if (!apiKey && providerId !== 'ollama-local') return;

    const baseUrl = typeof stored.creds.baseUrl === 'string' ? stored.creds.baseUrl : '';
    const catalog = repo.getRegistryCatalog(providerId);
    const modelIds = selectMirrorModelIds(catalog, repo.listRegistryOverrides(providerId));
    const imageModelIds = selectImageModelIds(catalog);
    const modelProtocols =
      stored.creds.protocols && typeof stored.creds.protocols === 'object'
        ? (stored.creds.protocols as Record<string, string>)
        : undefined;

    const platform = platformFor(providerId);

    const raw = await ProcessConfig.get('model.config');
    const current: IProvider[] = Array.isArray(raw) ? (raw as IProvider[]) : [];

    // Carry the user's prior enable/disable intent across a re-mirror (Finding
    // 4). A refresh (or any reconnect) re-runs this mirror; without preserving
    // the prior row's `enabled` / `modelEnabled`, a provider the user DISABLED
    // in the legacy pickers would silently reappear (a fresh row defaults to
    // enabled). The new registry has no `disabled` state, so the legacy
    // `enabled:false` flag is the only disable signal for these surfaces and
    // must survive the rewrite.
    const prior = current.find((p) => isV2BridgeRowForProvider(p, providerId, platform));
    const priorEnabled = prior?.enabled;
    const priorModelEnabled = prior?.modelEnabled;

    const row: BridgeRow = {
      id: prior?.id ?? uuid(),
      name: displayNameFor(providerId),
      platform,
      baseUrl,
      apiKey,
      model: modelIds,
      ...(imageModelIds.length > 0 ? { imageModels: imageModelIds } : {}),
      ...(modelProtocols ? { modelProtocols } : {}),
      ...(priorEnabled !== undefined ? { enabled: priorEnabled } : {}),
      ...(priorModelEnabled !== undefined ? { modelEnabled: priorModelEnabled } : {}),
      // Ship-gate Fix C4: include the providerId in the tag so multiple
      // providers that share a legacy `platform` (every `openai-compatible`
      // family member) coexist as distinct bridge rows. The previous flat
      // `'v2'` tag matched on platform alone and silently replaced a sibling.
      [BRIDGE_TAG_KEY]: bridgeTagValue(providerId),
    };

    // Drop any prior bridge row owned by THIS providerId; leave sibling
    // bridge rows (different providerId, same platform) and non-bridge rows
    // alone.
    const filtered = current.filter((p) => !isV2BridgeRowForProvider(p, providerId, platform));
    filtered.push(row);
    await ProcessConfig.set('model.config', filtered);
  }).catch((error) => {
    console.warn(`[legacyModelConfigBridge] mirror connect/rekey failed for ${providerId}:`, error);
  });
}

/**
 * Mirror a disconnect: remove the v2 bridge row for `providerId`. Leaves
 * non-bridge rows alone - they were written by older paths (or by the user).
 */
export function mirrorDisconnect(providerId: ProviderId): Promise<void> {
  if (EXCLUDED_PROVIDERS.has(providerId)) return Promise.resolve();
  return runSerial(async () => {
    const platform = platformFor(providerId);
    const raw = await ProcessConfig.get('model.config');
    const current: IProvider[] = Array.isArray(raw) ? (raw as IProvider[]) : [];
    // Ship-gate Fix C4: only drop the bridge row owned by THIS providerId so
    // disconnecting one `openai-compatible` provider doesn't drop its siblings.
    const filtered = current.filter((p) => !isV2BridgeRowForProvider(p, providerId, platform));
    if (filtered.length !== current.length) {
      await ProcessConfig.set('model.config', filtered);
    }
  }).catch((error) => {
    console.warn(`[legacyModelConfigBridge] mirror disconnect failed for ${providerId}:`, error);
  });
}
