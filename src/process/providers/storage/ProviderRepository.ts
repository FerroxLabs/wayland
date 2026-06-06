import type { ISqliteDriver } from '@process/services/database/drivers/ISqliteDriver';
import { decryptString, encryptString } from '@process/secrets/safeStorage';
import type { ProviderId, CatalogModel, ProviderConnState, ConnectError } from '../types';

// ─── Model registry (Models & Providers redesign - Wave 1) ─────────────────────

/**
 * A connected provider in the model registry - keyed by `ProviderId` (one row
 * per provider) and holds the encrypted credentials plus live connection state.
 */
export type RegistryProvider = {
  providerId: ProviderId;
  /** Short human label for how the provider was connected, e.g. `'api-key'`. */
  connectedVia: string;
  state: ProviderConnState;
  error?: ConnectError;
  /** Encrypted JSON of the credentials - never returned to the renderer. */
  credsEncrypted: string;
};

/** A per-provider per-model enable/disable override the user set explicitly. */
export type RegistryOverride = { modelId: string; enabled: boolean };

/**
 * The result of reading a provider's stored credentials. Discriminates the
 * three outcomes a caller must tell apart:
 *
 *  - `'ok'`           - creds decrypted; `creds` holds the plaintext record.
 *  - `'not-found'`    - no provider row exists (the provider is not connected).
 *  - `'undecryptable'`- a provider row exists but its `creds_encrypted` column
 *                       could not be decrypted (corrupt ciphertext, an OS
 *                       keychain key rotation, `safeStorage` unavailable on the
 *                       host, or a non-object payload). The provider looks
 *                       connected but every operation that needs the key will
 *                       fail - the caller should surface a "re-enter your
 *                       credentials" path rather than a generic error.
 *
 * Follow-up (Wave 2/3): `'undecryptable'` should drive a distinct UI state
 * (e.g. "Action needed - re-key") instead of being collapsed into "not
 * connected". For now callers treat it the same as `'not-found'` - both mean
 * "cannot proceed" - but the shape is available so that handling can be added
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
 * - unlike the removed legacy hardcoded-key path it is not recoverable from the
 * SQLite file alone. Throws when `safeStorage` is unavailable on the host (the
 * wrapper refuses to fall back to plaintext).
 */
function encryptRegistryCreds(creds: Record<string, unknown>): string {
  return encryptString(JSON.stringify(creds));
}

/**
 * Decrypt a `creds_encrypted` value produced by {@link encryptRegistryCreds}.
 * Returns the parsed record on success, or `null` when the payload cannot be
 * decrypted or is not a plain object - the caller maps `null` onto the
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

  /**
   * Run `fn` inside a SQLite transaction. Exposed so the legacy-config
   * migration can write the provider row + its catalog atomically - without
   * this a crash between the two writes leaves a `connected` provider with an
   * empty catalog and the migration flag already set on next boot.
   */
  transaction(fn: () => void): void {
    const tx = this.db.transaction(fn);
    tx();
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
   * Insert or replace a connected provider. `creds` is a plain object - it is
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
   * Update only a provider's `connected_via` label - used after a rekey so the
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
   * but the stored ciphertext is unreadable" (`'undecryptable'`) - a row whose
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
   * leaves no orphans - no manual child deletes and no transaction needed.
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

  /** The persisted `CatalogModel[]` for a provider - empty when none stored. */
  getRegistryCatalog(providerId: ProviderId): CatalogModel[] {
    const rows = this.db
      .prepare(`SELECT model_json FROM model_registry_catalog WHERE provider_id = ? ORDER BY model_id ASC`)
      .all(providerId) as Array<Record<string, unknown>>;
    const models: CatalogModel[] = [];
    for (const r of rows) {
      try {
        const parsed = JSON.parse(r.model_json as string) as CatalogModel;
        // Catalog rows written before the `tags` field existed have no `tags`
        // property. Default to `[]` so renderer/curator code can treat `tags`
        // as always-present. The post-upgrade refresh (catalog.dataVersion)
        // backfills real tags on the next refresh cycle.
        if (!Array.isArray(parsed.tags)) parsed.tags = [];
        models.push(parsed);
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
