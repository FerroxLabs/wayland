import crypto from 'node:crypto';
import type { ISqliteDriver } from '@process/services/database/drivers/ISqliteDriver';
import type { ProviderId, ProviderModel, Capability, ModelTier } from '../types';

// ─── Encryption helpers ───────────────────────────────────────────────────────

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
    const rows = this.db
      .prepare(`SELECT scope, catalog_id, model_id FROM default_models`)
      .all() as Array<Record<string, unknown>>;
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
}
