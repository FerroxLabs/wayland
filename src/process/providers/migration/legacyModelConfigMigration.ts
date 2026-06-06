/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One-time migration of the legacy `model.config` `ProcessConfig` store into
 * the new `model_registry_*` tables (Packet 3B).
 *
 * Wave 3A left two stores coexisting: the legacy `model.config` (an `IProvider[]`
 * blob in `ProcessConfig`, written by the now-deleted `ModelModalContent` flow)
 * and the new `model_registry_*` SQLite tables owned by `modelRegistry`. The
 * transitional bridge (`legacyModelConfigBridge`) mirrored every registry
 * connect/rekey/disconnect into `model.config` so chat-start kept working.
 * This migration flips the relationship: the registry is the source of truth.
 *
 * What it does, in one boot:
 *  1. Reads the legacy `model.config` from the injected `LegacyConfigStore`.
 *  2. GROUPS legacy rows by computed `ProviderId` - multiple legacy rows can
 *     legitimately resolve to the same provider (e.g. two OpenAI rows for two
 *     teams). UNIONing them avoids the cross-audit-1 defect where the second
 *     row's models + creds were silently dropped.
 *  3. For each group, picks a canonical "primary" (most-recent by `updatedAt`,
 *     else last in the array) and writes one registry row. Union the model
 *     arrays, `modelEnabled` maps, and `modelProtocols` maps across all rows
 *     in the group. Disabled-in-any source → disabled override.
 *  4. Provider row + catalog write happen inside one SQLite transaction so a
 *     crash between them cannot strand a provider with an empty catalog.
 *  5. If a provider row already exists but its catalog is empty, the catalog
 *     is re-imported (a prior partial run is repaired on the next boot).
 *  6. `modelEnabled:false` user preferences become explicit overrides in
 *     `model_registry_overrides`.
 *  7. `modelProtocols` is persisted alongside creds so multi-protocol gateways
 *     keep their per-model protocol overrides.
 *  8. Bedrock profile-auth is migrated (`creds.fields.awsProfile` +
 *     `creds.fields.region`); Google-auth Gemini is migrated
 *     (`creds.useGoogleAuth: true`). Both were previously dropped as
 *     "incomplete" by the cross-audit-1 plan's narrow `CLOUD_REQUIRED_FIELDS`.
 *  9. On any first run the completion flag is set ONLY when at least one row
 *     succeeded AND no rows failed recoverably (or zero rows were attempted).
 *     A total-failure outcome leaves the flag unset so the next boot retries.
 * 10. If any cloud row was skipped as "incomplete," a one-shot notification
 *     flag is written to the config store so the renderer can prompt the user
 *     to re-enter their cloud creds in the new Models page.
 *
 * What it does NOT do:
 *  - It does NOT call `ConnectionTester` or fetch from models.dev. The legacy
 *    row already represents a connection the user established once; we trust
 *    it and let the next `refresh` action re-enrich the catalog naturally.
 *  - It does NOT delete the legacy `model.config`. Other UI surfaces (Gemini
 *    /WCore selectors, `AcpModelSelector`, edit modals) still read it.
 */

import type { IProvider } from '@/common/config/storage';
import type { CatalogModel, ConnectError, ProviderConnState, ProviderId } from '../types';

/** Tag stamped on a `model.config` row by the deleted 3A bridge mirror. */
const BRIDGE_TAG_KEY = '__waylandModelRegistryBridge';
/**
 * Recognized bridge tag values.
 *  - `v1` - original (deleted) 3A bridge mirror.
 *  - `v2` - the slimmed-down resurrection's original flat tag (legacy).
 *  - `v2:<providerId>` - the per-provider tag added by ship-gate Fix C4 so
 *    sibling `openai-compatible` providers don't collide. Detected by a
 *    `v2:` prefix here; the providerId suffix is opaque to the migration.
 */
const BRIDGE_TAG_VALUES = new Set(['v1', 'v2']);
function isBridgeTagValue(tag: string): boolean {
  return BRIDGE_TAG_VALUES.has(tag) || tag.startsWith('v2:');
}

/** Idempotency marker stored in `ProcessConfig` after a successful run. */
export const MIGRATION_FLAG_KEY = 'migration.legacyModelConfigToRegistry';

/**
 * One-shot notification flag - set when the migration skipped one or more cloud
 * rows as "incomplete" so the renderer can prompt the user on first boot of
 * the new Models page.
 *
 * Wave-4 ship-gate Fix C2: the flag is no longer written by the migration. No
 * renderer surface consumes it today - wiring a one-shot Models-page banner +
 * the IPC plumbing to read+clear it would touch the IPC contract, preload
 * bridge, types, and the page. Out of scope for the ship-gate. The constant
 * is retained as a marker so a future Models-page redesign can opt into the
 * notification without rediscovering the key name.
 */
export const MIGRATION_INCOMPLETE_CLOUD_FLAG_KEY = 'migration.legacyModelConfigIncompleteCloud';

/**
 * The slice of `ProcessConfig` the migration needs. Declared structurally so
 * unit tests inject an in-memory fake - no `ProcessConfig`, no Electron runtime.
 */
export type LegacyConfigStore = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
};

/**
 * The slice of `ProviderRepository` the migration writes through. Declared
 * structurally for the same reason. Extended in Wave 3 to expose
 * `countRegistryCatalog`, `setRegistryOverride`, and `transaction` so the
 * migration can repair partial prior runs and write atomically.
 */
export type MigrationRepo = {
  getRegistryProvider: (providerId: ProviderId) => unknown | null;
  upsertRegistryProvider: (params: {
    providerId: ProviderId;
    connectedVia: string;
    state: ProviderConnState;
    error?: ConnectError;
    creds: Record<string, unknown>;
  }) => void;
  replaceRegistryCatalog: (providerId: ProviderId, models: CatalogModel[]) => void;
  /** Count catalog rows already persisted - used to detect partial prior runs. */
  countRegistryCatalog?: (providerId: ProviderId) => number;
  /** Write a per-model enable/disable override (Fix 4). */
  setRegistryOverride?: (providerId: ProviderId, modelId: string, enabled: boolean) => void;
  /**
   * Run a function in a SQLite transaction. Optional so in-memory test repos
   * can omit it; the migration treats `undefined` as "no transactional support,
   * write sequentially" - production always wires the real DB transaction.
   */
  transaction?: (fn: () => void) => void;
};

export type MigrationResult = {
  /** True when the migration ran (first boot); false when the flag already set. */
  ran: boolean;
  /** Count of legacy provider groups successfully translated into registry rows. */
  migrated: number;
  /** Count of bridge-mirrored rows skipped (already in the registry). */
  skippedBridge: number;
  /** Count of groups skipped because the registry already had that provider. */
  skippedExisting: number;
  /** Count of groups skipped because the platform couldn't be translated. */
  skippedUnsupported: number;
  /** Count of groups skipped because cloud creds were incomplete. */
  skippedIncompleteCloud: number;
  /**
   * Count of secondary rows whose api-key was discarded because the group's
   * primary won. UI surfaces this so the user knows a non-primary key is lost.
   */
  secondaryKeysLost: number;
  /** Count of groups that failed recoverably (e.g. transient safeStorage). */
  failedRecoverable: number;
};

// ─── Legacy `platform` → new `ProviderId` translation ─────────────────────────

const DIRECT_PLATFORM_MAP: Record<string, ProviderId> = {
  anthropic: 'anthropic',
  openai: 'openai',
  gemini: 'google-gemini',
  'gemini-with-google-auth': 'google-gemini',
  'gemini-vertex-ai': 'vertex',
  bedrock: 'aws-bedrock',
};

const BASEURL_FINGERPRINTS: Array<{ host: string; providerId: ProviderId }> = [
  { host: 'openrouter.ai', providerId: 'openrouter' },
  { host: 'api.groq.com', providerId: 'groq' },
  { host: 'api.x.ai', providerId: 'xai' },
  { host: 'api.mistral.ai', providerId: 'mistral' },
  { host: 'api.cohere.com', providerId: 'cohere' },
  { host: 'api.perplexity.ai', providerId: 'perplexity' },
  { host: 'api.together.xyz', providerId: 'together' },
  { host: 'api.fireworks.ai', providerId: 'fireworks' },
  { host: 'api.cerebras.ai', providerId: 'cerebras' },
  { host: 'api.replicate.com', providerId: 'replicate' },
  { host: 'huggingface.co', providerId: 'huggingface' },
  { host: 'integrate.api.nvidia.com', providerId: 'nvidia' },
  { host: 'api.endpoints.anyscale.com', providerId: 'anyscale' },
  { host: 'api.deepseek.com', providerId: 'deepseek' },
  { host: 'api.moonshot.cn', providerId: 'moonshot' },
  { host: 'dashscope.aliyuncs.com', providerId: 'qwen' },
  { host: 'api.baichuan-ai.com', providerId: 'baichuan' },
  { host: 'api.lingyiwanwu.com', providerId: 'lingyiwanwu' },
  { host: 'open.bigmodel.cn', providerId: 'zhipu-glm' },
  { host: 'api.minimax.chat', providerId: 'minimax' },
  { host: 'api.stability.ai', providerId: 'stability' },
  { host: 'api.deepgram.com', providerId: 'deepgram' },
  { host: 'api.assemblyai.com', providerId: 'assemblyai' },
  { host: 'api.elevenlabs.io', providerId: 'elevenlabs' },
  { host: 'api.anthropic.com', providerId: 'anthropic' },
  { host: 'api.openai.com', providerId: 'openai' },
  { host: 'generativelanguage.googleapis.com', providerId: 'google-gemini' },
];

function mapPlatformToProvider(provider: IProvider): ProviderId | null {
  const direct = DIRECT_PLATFORM_MAP[provider.platform];
  if (direct) return direct;

  if (provider.platform === 'openai-compatible' || provider.platform === 'custom' || provider.platform === 'new-api') {
    const baseUrl = (provider.baseUrl ?? '').toLowerCase();
    if (baseUrl) {
      for (const { host, providerId } of BASEURL_FINGERPRINTS) {
        if (baseUrl.includes(host)) return providerId;
      }
    }
    return 'openai-compatible';
  }

  return null;
}

// ─── Bridge tag detection ─────────────────────────────────────────────────────

function isBridgeTagged(provider: IProvider): boolean {
  const tag = (provider as unknown as Record<string, unknown>)[BRIDGE_TAG_KEY];
  return typeof tag === 'string' && isBridgeTagValue(tag);
}

// ─── Cloud creds ──────────────────────────────────────────────────────────────

/**
 * Required field names per cloud provider, for the access-key shape.
 * Profile-auth Bedrock uses a different shape (see {@link extractCloudFields}).
 */
const CLOUD_REQUIRED_FIELDS: Record<string, readonly string[]> = {
  'aws-bedrock': ['accessKeyId', 'secretAccessKey', 'region'],
  vertex: ['projectId', 'region', 'serviceAccountJson'],
  azure: ['endpoint', 'apiKey'],
};

const CLOUD_PROVIDER_IDS: ReadonlySet<ProviderId> = new Set<ProviderId>(['aws-bedrock', 'vertex', 'azure']);

/**
 * Translate a legacy `IProvider`'s cloud-specific block into the registry's
 * `{ fields }` shape, returning `null` when required fields are missing.
 *
 * Bedrock now honors `authMethod: 'profile'` as a valid alternate shape
 * (`{ awsProfile, region, bedrockAuth: 'profile' }`). The envBuilder reads
 * `awsProfile` and sets `AWS_PROFILE` on the dispatched env.
 */
function extractCloudFields(
  providerId: ProviderId,
  provider: IProvider
): { fields: Record<string, string>; bedrockAuth?: 'access-key' | 'profile' } | null {
  if (providerId === 'aws-bedrock') {
    const bc = provider.bedrockConfig;
    if (!bc) return null;

    if (bc.authMethod === 'profile') {
      // Profile auth - only `awsProfile` + `region` are required.
      if (!bc.profile || !bc.region) return null;
      return {
        fields: { awsProfile: bc.profile, region: bc.region },
        bedrockAuth: 'profile',
      };
    }

    if (bc.authMethod === 'accessKey') {
      if (!bc.accessKeyId || !bc.secretAccessKey || !bc.region) return null;
      return {
        fields: { accessKeyId: bc.accessKeyId, secretAccessKey: bc.secretAccessKey, region: bc.region },
        bedrockAuth: 'access-key',
      };
    }

    return null;
  }

  if (providerId === 'vertex' || providerId === 'azure') {
    // Legacy rows historically carried no usable creds for these. Skip them so
    // the user re-enters in the new Models page; surfaced via the notification.
    return null;
  }

  const required = CLOUD_REQUIRED_FIELDS[providerId];
  if (!required) return null;
  // Read each required field from the LEGACY `IProvider` row, not from the
  // freshly-declared empty output map. (Wave-4 ship-gate Fix C1 - the prior
  // implementation read from `fields[name]` after `const fields = {}`, which
  // always returned `null` for this branch. The branch is unreachable in
  // production because the cloud providers we handle today are caught by the
  // explicit `aws-bedrock` / `vertex` / `azure` branches above, but the latent
  // bug would silently strand any future cloud provider that landed here.)
  const source = provider as unknown as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const name of required) {
    const value = source[name];
    if (typeof value !== 'string' || value.trim().length === 0) return null;
    out[name] = value;
  }
  return { fields: out };
}

// ─── Catalog assembly (unenriched) ────────────────────────────────────────────

function deriveFamily(modelId: string): string {
  let id = modelId.replace(/^(anthropic\.|meta\.|models\/)/, '');
  const slash = id.lastIndexOf('/');
  if (slash !== -1) id = id.slice(slash + 1);

  const tokens = id.split('-');
  const VARIANT_WORDS = new Set(['preview', 'exp', 'experimental', 'latest', 'thinking', 'beta', 'alpha', 'rc']);
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1].toLowerCase();
    if (/^\d{4,}$/.test(last) || VARIANT_WORDS.has(last)) {
      tokens.pop();
      continue;
    }
    break;
  }
  const family = tokens.join('-');
  return family.length > 0 ? family : id;
}

function humanizeId(modelId: string): string {
  return modelId
    .split(/[-_]/)
    .map((token) => {
      if (token.length === 0) return token;
      if (/^[A-Z]{2,}$/.test(token)) return token;
      if (/\d/.test(token)) return token;
      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join(' ');
}

function buildUnenrichedCatalogModel(modelId: string, providerId: ProviderId): CatalogModel {
  return {
    id: modelId,
    providerId,
    displayName: humanizeId(modelId),
    family: deriveFamily(modelId),
    kind: 'text',
    enriched: false,
    tags: [],
  };
}

// ─── Grouping ────────────────────────────────────────────────────────────────

/** A group of legacy rows that all resolve to the same `ProviderId`. */
type ProviderGroup = {
  providerId: ProviderId;
  rows: IProvider[];
  /** The "primary" row whose creds win - most-recent by `updatedAt`, else last. */
  primary: IProvider;
};

/**
 * Group untranslatable rows are reported as one bucket per resolution outcome:
 *   - resolved → `ProviderGroup`
 *   - unsupported (platform unknown, etc.) → `'unsupported'`
 */
type GroupOrSkip = ProviderGroup | { kind: 'unsupported'; row: IProvider };

function groupRows(rows: IProvider[]): GroupOrSkip[] {
  const buckets = new Map<ProviderId, IProvider[]>();
  const out: GroupOrSkip[] = [];

  for (const row of rows) {
    const providerId = mapPlatformToProvider(row);
    if (!providerId) {
      out.push({ kind: 'unsupported', row });
      continue;
    }
    const arr = buckets.get(providerId) ?? [];
    arr.push(row);
    buckets.set(providerId, arr);
  }

  for (const [providerId, rs] of buckets) {
    // Primary: most-recent by `updatedAt` if any row has one, else last in array.
    let primary = rs[rs.length - 1];
    let primaryUpdatedAt: number | undefined;
    for (const r of rs) {
      const updatedAt = (r as unknown as Record<string, unknown>).updatedAt;
      const num = typeof updatedAt === 'number' ? updatedAt : undefined;
      if (num !== undefined && (primaryUpdatedAt === undefined || num > primaryUpdatedAt)) {
        primaryUpdatedAt = num;
        primary = r;
      }
    }
    out.push({ providerId, rows: rs, primary });
  }

  return out;
}

// ─── Migration entry point ────────────────────────────────────────────────────

/**
 * Run the one-time migration. Idempotent via `MIGRATION_FLAG_KEY` in the config
 * store: a successful run sets the flag; subsequent boots short-circuit.
 *
 * Never throws. Per-group failures are caught and logged so one bad group
 * cannot stop the rest. The completion flag is set ONLY when no recoverable
 * failures occurred - a transient `safeStorage` failure leaves the flag unset
 * so the next boot retries (Fix 2).
 */
export async function runLegacyModelConfigMigration(args: {
  store: LegacyConfigStore;
  repo: MigrationRepo;
  logger?: (level: 'info' | 'warn', message: string) => void;
}): Promise<MigrationResult> {
  const { store, repo, logger } = args;
  const log = logger ?? defaultLogger;

  const empty: MigrationResult = {
    ran: false,
    migrated: 0,
    skippedBridge: 0,
    skippedExisting: 0,
    skippedUnsupported: 0,
    skippedIncompleteCloud: 0,
    secondaryKeysLost: 0,
    failedRecoverable: 0,
  };

  // ── Idempotency gate ───────────────────────────────────────────────────────
  let flagAlreadySet = false;
  try {
    flagAlreadySet = (await store.get(MIGRATION_FLAG_KEY)) === true;
  } catch (error) {
    log('warn', `[legacyModelConfigMigration] Failed to read migration flag: ${describe(error)}`);
    return empty;
  }
  if (flagAlreadySet) return empty;

  // ── Read source ────────────────────────────────────────────────────────────
  let legacyRows: IProvider[] = [];
  let readFailed = false;
  try {
    const raw = await store.get('model.config');
    legacyRows = Array.isArray(raw) ? (raw as IProvider[]) : [];
  } catch (error) {
    log('warn', `[legacyModelConfigMigration] Failed to read model.config: ${describe(error)}`);
    readFailed = true;
  }
  if (readFailed) {
    // Nothing to migrate; safe to mark done so the next boot skips.
    await safeSetFlag(store, log);
    return { ...empty, ran: true };
  }

  // ── Separate bridge-tagged rows BEFORE grouping ────────────────────────────
  const result: MigrationResult = { ...empty, ran: true };
  const userRows: IProvider[] = [];
  for (const row of legacyRows) {
    if (isBridgeTagged(row)) {
      result.skippedBridge++;
      continue;
    }
    userRows.push(row);
  }

  // ── Group + per-group translation ──────────────────────────────────────────
  const groups = groupRows(userRows);

  let attemptedGroups = 0;
  for (const groupOrSkip of groups) {
    if ('kind' in groupOrSkip && groupOrSkip.kind === 'unsupported') {
      log('warn', `[legacyModelConfigMigration] Skipping unsupported platform '${groupOrSkip.row.platform}'`);
      result.skippedUnsupported++;
      continue;
    }
    const group = groupOrSkip as ProviderGroup;
    attemptedGroups++;

    try {
      const outcome = migrateGroup(group, repo, log);
      switch (outcome.kind) {
        case 'migrated':
          result.migrated++;
          result.secondaryKeysLost += outcome.secondaryKeysLost;
          break;
        case 'existing':
          result.skippedExisting++;
          break;
        case 'incomplete-cloud':
          result.skippedIncompleteCloud++;
          break;
        case 'unsupported':
          result.skippedUnsupported++;
          break;
        case 'failed':
          result.failedRecoverable++;
          break;
      }
    } catch (error) {
      log('warn', `[legacyModelConfigMigration] Failed to migrate group '${group.providerId}': ${describe(error)}`);
      result.failedRecoverable++;
    }
  }

  // ── Completion flag (Fix 2): only set when safe ────────────────────────────
  const allFailed = attemptedGroups > 0 && result.failedRecoverable === attemptedGroups && result.migrated === 0;
  if (!allFailed) {
    await safeSetFlag(store, log);
  } else {
    log(
      'warn',
      `[legacyModelConfigMigration] All ${attemptedGroups} group(s) failed recoverably - leaving migration flag UNSET for retry on next boot.`
    );
  }

  // ── Notification flag (Fix 7) ──────────────────────────────────────────────
  // Wave-4 ship-gate Fix C2: the flag was previously written but no renderer
  // consumed it, so the user was never notified about cloud rows the migration
  // skipped. Rather than wire a one-shot banner across the IPC contract for a
  // medium-priority post-ship affordance, the write is removed. The
  // `skippedIncompleteCloud` counter remains in the result for the migration's
  // own log + future diagnostics.

  log(
    'info',
    `[legacyModelConfigMigration] Done - migrated:${result.migrated} bridge:${result.skippedBridge} existing:${result.skippedExisting} unsupported:${result.skippedUnsupported} incompleteCloud:${result.skippedIncompleteCloud} secondaryKeysLost:${result.secondaryKeysLost} failedRecoverable:${result.failedRecoverable}`
  );

  return result;
}

// ─── Per-group migration ──────────────────────────────────────────────────────

type GroupOutcome =
  | { kind: 'migrated'; secondaryKeysLost: number }
  | { kind: 'existing' }
  | { kind: 'incomplete-cloud' }
  | { kind: 'unsupported' }
  | { kind: 'failed' };

/**
 * Migrate one provider group atomically. Provider + catalog writes happen
 * inside one transaction so a crash between them cannot leave the row with
 * an empty catalog (Fix 3). Override writes (Fix 4) are best-effort outside
 * the transaction - they enhance behavior without being load-bearing for the
 * primary connect path.
 */
function migrateGroup(
  group: ProviderGroup,
  repo: MigrationRepo,
  log: (level: 'info' | 'warn', m: string) => void
): GroupOutcome {
  const { providerId, rows, primary } = group;
  const isCloud = CLOUD_PROVIDER_IDS.has(providerId);

  // ── Existing-row repair (Fix 3) ─────────────────────────────────────────
  const existing = repo.getRegistryProvider(providerId);
  if (existing) {
    // Existing row from the user's new flow wins - but if a previous partial
    // migration run wrote the provider with an EMPTY catalog (crash before
    // replaceRegistryCatalog), repair it by re-importing the legacy models.
    const catalogCount = repo.countRegistryCatalog?.(providerId) ?? -1;
    if (catalogCount === 0) {
      const modelIds = collectUnionedModelIds(rows);
      const catalog = modelIds.map((id) => buildUnenrichedCatalogModel(id, providerId));
      try {
        repo.replaceRegistryCatalog(providerId, catalog);
        // Migrated visibility overrides + disabled overrides on top of the
        // existing provider + repaired catalog.
        applyOverrides(providerId, rows, modelIds, repo);
        return { kind: 'migrated', secondaryKeysLost: Math.max(0, rows.length - 1) };
      } catch (error) {
        log('warn', `[legacyModelConfigMigration] Failed to repair catalog for '${providerId}': ${describe(error)}`);
        return { kind: 'failed' };
      }
    }
    return { kind: 'existing' };
  }

  // ── Build creds from the primary row ───────────────────────────────────
  let credsRecord: Record<string, unknown>;
  let connectedVia: string;

  // Google-auth Gemini (Fix 6)
  const isGoogleAuthGemini =
    providerId === 'google-gemini' &&
    (primary.platform === 'gemini-with-google-auth' ||
      (primary.platform === 'gemini' && (!primary.apiKey || primary.apiKey.trim().length === 0)));

  if (isGoogleAuthGemini) {
    credsRecord = { useGoogleAuth: true };
    connectedVia = 'google-auth';
  } else if (isCloud) {
    const result = extractCloudFields(providerId, primary);
    if (!result) {
      log('warn', `[legacyModelConfigMigration] Skipping cloud provider '${providerId}' - required fields missing`);
      return { kind: 'incomplete-cloud' };
    }
    credsRecord = { fields: result.fields };
    if (result.bedrockAuth) credsRecord.bedrockAuth = result.bedrockAuth;
    connectedVia = 'cloud-credentials';
  } else {
    if (!primary.apiKey || primary.apiKey.trim().length === 0) {
      log('warn', `[legacyModelConfigMigration] Skipping '${providerId}' - empty apiKey`);
      return { kind: 'unsupported' };
    }
    credsRecord = { key: primary.apiKey };
    if (primary.baseUrl && primary.baseUrl.trim().length > 0) {
      credsRecord.baseUrl = primary.baseUrl;
    }
    connectedVia = 'api-key';
  }

  // Union `modelProtocols` across all rows (Fix 5) - disabled-in-any wins for
  // overrides (Fix 4), but for protocols a per-model mapping just needs to be
  // present from any source row.
  const unionedProtocols = unionModelProtocols(rows);
  if (Object.keys(unionedProtocols).length > 0) {
    credsRecord.protocols = unionedProtocols;
  }

  // Union the model id set across all rows in the group (Fix 1).
  const unionedModelIds = collectUnionedModelIds(rows);
  const catalog = unionedModelIds.map((id) => buildUnenrichedCatalogModel(id, providerId));

  // ── Atomic write: provider row + catalog in one transaction (Fix 3) ────
  const writeBoth = () => {
    repo.upsertRegistryProvider({
      providerId,
      connectedVia,
      state: 'connected',
      creds: credsRecord,
    });
    repo.replaceRegistryCatalog(providerId, catalog);
  };

  try {
    if (repo.transaction) {
      repo.transaction(writeBoth);
    } else {
      writeBoth();
    }
  } catch (error) {
    log(
      'warn',
      `[legacyModelConfigMigration] Failed to persist provider '${providerId}' (transactional write): ${describe(error)}`
    );
    return { kind: 'failed' };
  }

  // ── Overrides (Fix 4 + Fix 14) outside the transaction ────────────────
  applyOverrides(providerId, rows, unionedModelIds, repo);

  return { kind: 'migrated', secondaryKeysLost: Math.max(0, rows.length - 1) };
}

/**
 * Walk every row's `modelEnabled` map: a `false` entry on any source row writes
 * a `false` override (Fix 4). For migrated unenriched rows, also write `true`
 * overrides for every model the user had (Fix 14) so the Curator's "latest +
 * one-back per family" rule doesn't hide variants 3+ until enrichment lands.
 */
function applyOverrides(
  providerId: ProviderId,
  rows: IProvider[],
  unionedModelIds: string[],
  repo: MigrationRepo
): void {
  if (!repo.setRegistryOverride) return;

  // Pass 1: collect every (modelId → enabled) from any source row.
  const disabled = new Set<string>();
  for (const row of rows) {
    if (!row.modelEnabled) continue;
    for (const [modelId, enabled] of Object.entries(row.modelEnabled)) {
      if (enabled === false) disabled.add(modelId);
    }
  }

  // Pass 2 (Fix 14): write enabled=true for every model so variants 3+ stay
  // visible until enrichment finishes. EXCEPT for ids the user explicitly
  // disabled - those keep their `false` override below.
  for (const modelId of unionedModelIds) {
    if (disabled.has(modelId)) continue;
    try {
      repo.setRegistryOverride(providerId, modelId, true);
    } catch {
      // Best-effort - failing to set a visibility override doesn't break the
      // migration's primary outcome.
    }
  }

  // Pass 3: write the explicit false overrides.
  for (const modelId of disabled) {
    try {
      repo.setRegistryOverride(providerId, modelId, false);
    } catch {
      // Best-effort, same rationale.
    }
  }
}

function collectUnionedModelIds(rows: IProvider[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    if (!Array.isArray(row.model)) continue;
    for (const id of row.model) {
      if (typeof id !== 'string' || id.length === 0) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

function unionModelProtocols(rows: IProvider[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    if (!row.modelProtocols) continue;
    for (const [modelId, protocol] of Object.entries(row.modelProtocols)) {
      // Last-writer-wins is fine here - there's no canonical "correct" choice
      // between two non-equal protocol strings for the same model id; the user
      // will adjust in the new Models page if needed.
      if (typeof protocol === 'string' && protocol.length > 0) out[modelId] = protocol;
    }
  }
  return out;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function safeSetFlag(store: LegacyConfigStore, log: (level: 'info' | 'warn', m: string) => void): Promise<void> {
  try {
    await store.set(MIGRATION_FLAG_KEY, true);
  } catch (error) {
    log('warn', `[legacyModelConfigMigration] Failed to set migration flag: ${describe(error)}`);
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function defaultLogger(level: 'info' | 'warn', message: string): void {
  if (level === 'warn') console.warn(message);
  else console.log(message);
}
