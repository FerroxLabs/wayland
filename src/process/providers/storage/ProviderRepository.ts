import crypto from 'node:crypto';
import type { ISqliteDriver } from '@process/services/database/drivers/ISqliteDriver';
import { decryptString, encryptString } from '@process/secrets/safeStorage';
import type {
  ProviderId,
  ProviderModel,
  Capability,
  ModelTier,
  CatalogModel,
  ProviderConnState,
  ConnectError,
} from '../types';

// ─── Legacy encryption helpers ────────────────────────────────────────────────

/**
 * AES-256-GCM with a key derived from an app-bundled constant. The key is
 * identical on every install and ships in the binary, so anyone with the
 * SQLite file can decrypt the ciphertext — it is NOT secure.
 *
 * Retained only for the legacy `provider_catalogs.api_key_encrypted` column,
 * still consumed by `ModelRefreshScheduler` and `providersIpc`. The model
 * registry (`model_registry_providers.creds_encrypted`) uses OS-keychain
 * `safeStorage` instead — see `encryptRegistryCreds` / `decryptRegistryCreds`.
 * Do NOT use these for new code.
 */
const ALGORITHM = 'aes-256-gcm';
const KEY_MATERIAL = 'wayland-provider-key-v1'; // deterministic per-app salt

function deriveKey(): Buffer {
  return crypto.scryptSync(KEY_MATERIAL, 'wayland-salt', 32);
}

export function encryptKey(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptKey(ciphertext: string): string {
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, deriveKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc).toString('utf8') + decipher.final('utf8');
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnectedProvider = {
  id: string;
  providerId: ProviderId;
  displayName: string | null;
  apiKeyEncrypted: string;
  additionalFields: Record<string, string>;
  status: 'connected' | 'error' | 'refreshing';
  lastRefreshedAt: number | null;
  createdAt: number;
  updatedAt: number;
  models: ProviderModel[];
};

export type DefaultModel = {
  scope: 'chat' | 'coding' | 'vision' | 'image' | 'audio';
  catalogId: string;
  modelId: string;
};

// ─── Model registry (Models & Providers redesign — Wave 1) ─────────────────────

/**
 * A connected provider in the new model registry. Distinct from the legacy
 * `ConnectedProvider` — keyed by `ProviderId` (one row per provider) and holds
 * the encrypted credentials plus live connection state.
 */
export type RegistryProvider = {
  providerId: ProviderId;
  /** Short human label for how the provider was connected, e.g. `'api-key'`. */
  connectedVia: string;
  state: ProviderConnState;
  error?: ConnectError;
  /** Encrypted JSON of the credentials — never returned to the renderer. */
  credsEncrypted: string;
};

/** A per-provider per-model enable/disable override the user set explicitly. */
export type RegistryOverride = { modelId: string; enabled: boolean };

/**
 * The result of reading a provider's stored credentials. Discriminates the
 * three outcomes a caller must tell apart:
 *
 *  - `'ok'`           — creds decrypted; `creds` holds the plaintext record.
 *  - `'not-found'`    — no provider row exists (the provider is not connected).
 *  - `'undecryptable'`— a provider row exists but its `creds_encrypted` column
 *                       could not be decrypted (corrupt ciphertext, an OS
 *                       keychain key rotation, `safeStorage` unavailable on the
 *                       host, or a non-object payload). The provider looks
 *                       connected but every operation that needs the key will
 *                       fail — the caller should surface a "re-enter your
 *                       credentials" path rather than a generic error.
 *
 * Follow-up (Wave 2/3): `'undecryptable'` should drive a distinct UI state
 * (e.g. "Action needed — re-key") instead of being collapsed into "not
 * connected". For now callers treat it the same as `'not-found'` — both mean
 * "cannot proceed" — but the shape is available so that handling can be added
 * without another repository change.
 */
export type RegistryCredsResult =
  | { status: 'ok'; creds: Record<string, unknown> }
  | { status: 'not-found' }
  | { status: 'undecryptable' };

// ─── Model-registry credential encryption ─────────────────────────────────────

/**
 * Encrypt a credentials record for the `model_registry_providers.creds_encrypted`
 * column using OS-keychain-backed `safeStorage` (macOS Keychain / Windows DPAPI
 * / Linux libsecret). The encryption key is owned by the OS and unique per user
 * — unlike the legacy `encryptKey` path it is not recoverable from the SQLite
 * file alone. Throws when `safeStorage` is unavailable on the host (the wrapper
 * refuses to fall back to plaintext).
 */
function encryptRegistryCreds(creds: Record<string, unknown>): string {
  return encryptString(JSON.stringify(creds));
}

/**
 * Decrypt a `creds_encrypted` value produced by {@link encryptRegistryCreds}.
 * Returns the parsed record on success, or `null` when the payload cannot be
 * decrypted or is not a plain object — the caller maps `null` onto the
 * `'undecryptable'` result.
 */
function decryptRegistryCreds(ciphertext: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(decryptString(ciphertext));
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class ProviderRepository {
  constructor(private readonly db: ISqliteDriver) {}

  // ── Catalog ──────────────────────────────────────────────────────────────

  listCatalogs(): ConnectedProvider[] {
    const rows = this.db
      .prepare(
        `SELECT id, provider_id, display_name, api_key_encrypted, additional_fields,
                status, last_refreshed_at, created_at, updated_at
         FROM provider_catalogs ORDER BY created_at ASC`
      )
      .all() as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: r.id as string,
      providerId: r.provider_id as ProviderId,
      displayName: (r.display_name as string | null) ?? null,
      apiKeyEncrypted: r.api_key_encrypted as string,
      additionalFields: JSON.parse((r.additional_fields as string) || '{}') as Record<string, string>,
      status: (r.status as ConnectedProvider['status']) ?? 'connected',
      lastRefreshedAt: (r.last_refreshed_at as number | null) ?? null,
      createdAt: r.created_at as number,
      updatedAt: r.updated_at as number,
      models: this.listModels(r.id as string),
    }));
  }

  getCatalog(id: string): ConnectedProvider | null {
    const r = this.db
      .prepare(
        `SELECT id, provider_id, display_name, api_key_encrypted, additional_fields,
                status, last_refreshed_at, created_at, updated_at
         FROM provider_catalogs WHERE id = ?`
      )
      .get(id) as Record<string, unknown> | undefined;
    if (!r) return null;
    return {
      id: r.id as string,
      providerId: r.provider_id as ProviderId,
      displayName: (r.display_name as string | null) ?? null,
      apiKeyEncrypted: r.api_key_encrypted as string,
      additionalFields: JSON.parse((r.additional_fields as string) || '{}') as Record<string, string>,
      status: (r.status as ConnectedProvider['status']) ?? 'connected',
      lastRefreshedAt: (r.last_refreshed_at as number | null) ?? null,
      createdAt: r.created_at as number,
      updatedAt: r.updated_at as number,
      models: this.listModels(r.id as string),
    };
  }

  insertCatalog(params: {
    id: string;
    providerId: ProviderId;
    displayName: string | null;
    apiKey: string;
    additionalFields: Record<string, string>;
  }): void {
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO provider_catalogs
         (id, provider_id, display_name, api_key_encrypted, additional_fields, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'connected', ?, ?)`
      )
      .run(
        params.id,
        params.providerId,
        params.displayName,
        encryptKey(params.apiKey),
        JSON.stringify(params.additionalFields),
        now,
        now
      );
  }

  updateCatalogStatus(id: string, status: ConnectedProvider['status'], lastRefreshedAt?: number): void {
    this.db
      .prepare(`UPDATE provider_catalogs SET status = ?, last_refreshed_at = ?, updated_at = ? WHERE id = ?`)
      .run(status, lastRefreshedAt ?? null, Date.now(), id);
  }

  updateCatalogDisplayName(id: string, displayName: string): void {
    this.db
      .prepare(`UPDATE provider_catalogs SET display_name = ?, updated_at = ? WHERE id = ?`)
      .run(displayName, Date.now(), id);
  }

  deleteCatalog(id: string): void {
    this.db.prepare(`DELETE FROM provider_catalogs WHERE id = ?`).run(id);
  }

  // ── Models ───────────────────────────────────────────────────────────────

  listModels(catalogId: string): ProviderModel[] {
    const rows = this.db
      .prepare(
        `SELECT model_id, display_name, tier, capabilities, enabled, deprecated,
                deprecated_at, context_window, pricing
         FROM provider_models WHERE catalog_id = ? ORDER BY tier ASC, model_id ASC`
      )
      .all(catalogId) as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: r.model_id as string,
      displayName: r.display_name as string,
      tier: r.tier as ModelTier,
      capabilities: JSON.parse((r.capabilities as string) || '[]') as Capability[],
      enabled: (r.enabled as number) === 1,
      deprecated: (r.deprecated as number) === 1,
      deprecatedAt: (r.deprecated_at as number | null) ?? undefined,
      contextWindow: (r.context_window as number | null) ?? undefined,
      pricing: r.pricing ? (JSON.parse(r.pricing as string) as ProviderModel['pricing']) : undefined,
    }));
  }

  upsertModels(catalogId: string, models: ProviderModel[]): void {
    const now = Date.now();
    const stmt = this.db.prepare(`INSERT INTO provider_models
      (id, catalog_id, model_id, display_name, tier, capabilities, enabled, deprecated,
       deprecated_at, context_window, pricing, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(catalog_id, model_id) DO UPDATE SET
        display_name = excluded.display_name,
        tier = excluded.tier,
        capabilities = excluded.capabilities,
        context_window = excluded.context_window,
        pricing = excluded.pricing,
        updated_at = excluded.updated_at`);

    for (const m of models) {
      const rowId = `${catalogId}:${m.id}`;
      stmt.run(
        rowId,
        catalogId,
        m.id,
        m.displayName,
        m.tier,
        JSON.stringify(m.capabilities),
        m.enabled ? 1 : 0,
        m.deprecated ? 1 : 0,
        m.deprecatedAt ?? null,
        m.contextWindow ?? null,
        m.pricing ? JSON.stringify(m.pricing) : null,
        now,
        now
      );
    }
  }

  toggleModel(catalogId: string, modelId: string, enabled: boolean): void {
    this.db
      .prepare(`UPDATE provider_models SET enabled = ?, updated_at = ? WHERE catalog_id = ? AND model_id = ?`)
      .run(enabled ? 1 : 0, Date.now(), catalogId, modelId);
  }

  markDeprecated(catalogId: string, modelId: string): void {
    const now = Date.now();
    this.db
      .prepare(
        `UPDATE provider_models SET deprecated = 1, deprecated_at = ?, updated_at = ?
         WHERE catalog_id = ? AND model_id = ? AND deprecated = 0`
      )
      .run(now, now, catalogId, modelId);
  }

  // ── Defaults ─────────────────────────────────────────────────────────────

  listDefaults(): DefaultModel[] {
    const rows = this.db.prepare(`SELECT scope, catalog_id, model_id FROM default_models`).all() as Array<
      Record<string, unknown>
    >;
    return rows.map((r) => ({
      scope: r.scope as DefaultModel['scope'],
      catalogId: r.catalog_id as string,
      modelId: r.model_id as string,
    }));
  }

  setDefault(scope: DefaultModel['scope'], catalogId: string, modelId: string): void {
    this.db
      .prepare(
        `INSERT INTO default_models (scope, catalog_id, model_id, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(scope) DO UPDATE SET catalog_id = excluded.catalog_id, model_id = excluded.model_id, updated_at = excluded.updated_at`
      )
      .run(scope, catalogId, modelId, Date.now());
  }

  clearDefault(scope: DefaultModel['scope']): void {
    this.db.prepare(`DELETE FROM default_models WHERE scope = ?`).run(scope);
  }

  // ── Model registry: providers ────────────────────────────────────────────

  /** Every connected provider in the model registry. */
  listRegistryProviders(): RegistryProvider[] {
    const rows = this.db
      .prepare(
        `SELECT provider_id, connected_via, state, error, creds_encrypted
         FROM model_registry_providers ORDER BY created_at ASC`
      )
      .all() as Array<Record<string, unknown>>;
    return rows.map((r) => toRegistryProvider(r));
  }

  /** A single connected provider, or `null` when not connected. */
  getRegistryProvider(providerId: ProviderId): RegistryProvider | null {
    const r = this.db
      .prepare(
        `SELECT provider_id, connected_via, state, error, creds_encrypted
         FROM model_registry_providers WHERE provider_id = ?`
      )
      .get(providerId) as Record<string, unknown> | undefined;
    return r ? toRegistryProvider(r) : null;
  }

  /**
   * Insert or replace a connected provider. `creds` is a plain object — it is
   * serialized and encrypted here so callers never handle ciphertext.
   */
  upsertRegistryProvider(params: {
    providerId: ProviderId;
    connectedVia: string;
    state: ProviderConnState;
    error?: ConnectError;
    creds: Record<string, unknown>;
  }): void {
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO model_registry_providers
         (provider_id, connected_via, state, error, creds_encrypted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(provider_id) DO UPDATE SET
           connected_via = excluded.connected_via,
           state = excluded.state,
           error = excluded.error,
           creds_encrypted = excluded.creds_encrypted,
           updated_at = excluded.updated_at`
      )
      .run(
        params.providerId,
        params.connectedVia,
        params.state,
        params.error ?? null,
        encryptRegistryCreds(params.creds),
        now,
        now
      );
  }

  /** Update only a provider's live connection state + error. */
  updateRegistryProviderState(providerId: ProviderId, state: ProviderConnState, error?: ConnectError): void {
    this.db
      .prepare(`UPDATE model_registry_providers SET state = ?, error = ?, updated_at = ? WHERE provider_id = ?`)
      .run(state, error ?? null, Date.now(), providerId);
  }

  /** Replace a connected provider's encrypted credentials. */
  updateRegistryProviderCreds(providerId: ProviderId, creds: Record<string, unknown>): void {
    this.db
      .prepare(`UPDATE model_registry_providers SET creds_encrypted = ?, updated_at = ? WHERE provider_id = ?`)
      .run(encryptRegistryCreds(creds), Date.now(), providerId);
  }

  /**
   * Update only a provider's `connected_via` label — used after a rekey so the
   * label reflects how the provider is NOW connected (e.g. a provider first
   * connected via auto-discovery then rekeyed with an explicit key).
   */
  updateRegistryProviderConnectedVia(providerId: ProviderId, connectedVia: string): void {
    this.db
      .prepare(`UPDATE model_registry_providers SET connected_via = ?, updated_at = ? WHERE provider_id = ?`)
      .run(connectedVia, Date.now(), providerId);
  }

  /**
   * Decrypt and return a provider's stored credentials.
   *
   * The result discriminates "not connected" (`'not-found'`) from "connected
   * but the stored ciphertext is unreadable" (`'undecryptable'`) — a row whose
   * creds cannot be decrypted would otherwise look connected while silently
   * failing every operation. See {@link RegistryCredsResult}.
   */
  getRegistryProviderCreds(providerId: ProviderId): RegistryCredsResult {
    const provider = this.getRegistryProvider(providerId);
    if (!provider) return { status: 'not-found' };
    const creds = decryptRegistryCreds(provider.credsEncrypted);
    return creds ? { status: 'ok', creds } : { status: 'undecryptable' };
  }

  /**
   * Remove a connected provider. The `model_registry_catalog` and
   * `model_registry_overrides` child rows are removed automatically by the
   * `ON DELETE CASCADE` foreign keys (migration v39), so a single statement
   * leaves no orphans — no manual child deletes and no transaction needed.
   */
  deleteRegistryProvider(providerId: ProviderId): void {
    this.db.prepare(`DELETE FROM model_registry_providers WHERE provider_id = ?`).run(providerId);
  }

  // ── Model registry: catalog ──────────────────────────────────────────────

  /** Replace a provider's persisted catalog with `models` (full overwrite). */
  replaceRegistryCatalog(providerId: ProviderId, models: CatalogModel[]): void {
    const now = Date.now();
    const tx = this.db.transaction(() => {
      this.db.prepare(`DELETE FROM model_registry_catalog WHERE provider_id = ?`).run(providerId);
      const stmt = this.db.prepare(
        `INSERT INTO model_registry_catalog (provider_id, model_id, model_json, updated_at)
         VALUES (?, ?, ?, ?)`
      );
      for (const model of models) {
        stmt.run(providerId, model.id, JSON.stringify(model), now);
      }
    });
    tx();
  }

  /**
   * Count the persisted catalog models for a provider. A `COUNT(*)` so the
   * `list()` view can show `modelCount` without SELECTing and `JSON.parse`-ing
   * every stored `model_json` blob.
   */
  countRegistryCatalog(providerId: ProviderId): number {
    const row = this.db
      .prepare(`SELECT COUNT(*) AS n FROM model_registry_catalog WHERE provider_id = ?`)
      .get(providerId) as { n: number } | undefined;
    return row?.n ?? 0;
  }

  /** The persisted `CatalogModel[]` for a provider — empty when none stored. */
  getRegistryCatalog(providerId: ProviderId): CatalogModel[] {
    const rows = this.db
      .prepare(`SELECT model_json FROM model_registry_catalog WHERE provider_id = ? ORDER BY model_id ASC`)
      .all(providerId) as Array<Record<string, unknown>>;
    const models: CatalogModel[] = [];
    for (const r of rows) {
      try {
        models.push(JSON.parse(r.model_json as string) as CatalogModel);
      } catch {
        // A corrupt row is skipped rather than failing the whole read.
      }
    }
    return models;
  }

  // ── Model registry: overrides ────────────────────────────────────────────

  /** Persist (insert or update) a single per-model enable/disable override. */
  setRegistryOverride(providerId: ProviderId, modelId: string, enabled: boolean): void {
    this.db
      .prepare(
        `INSERT INTO model_registry_overrides (provider_id, model_id, enabled, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(provider_id, model_id) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at`
      )
      .run(providerId, modelId, enabled ? 1 : 0, Date.now());
  }

  /** Every explicit override for a provider. */
  listRegistryOverrides(providerId: ProviderId): RegistryOverride[] {
    const rows = this.db
      .prepare(`SELECT model_id, enabled FROM model_registry_overrides WHERE provider_id = ?`)
      .all(providerId) as Array<Record<string, unknown>>;
    return rows.map((r) => ({ modelId: r.model_id as string, enabled: (r.enabled as number) === 1 }));
  }
}

/** Map a `model_registry_providers` row onto a `RegistryProvider`. */
function toRegistryProvider(r: Record<string, unknown>): RegistryProvider {
  const provider: RegistryProvider = {
    providerId: r.provider_id as ProviderId,
    connectedVia: r.connected_via as string,
    state: r.state as ProviderConnState,
    credsEncrypted: r.creds_encrypted as string,
  };
  const error = r.error as string | null;
  if (error) provider.error = error as ConnectError;
  return provider;
}
