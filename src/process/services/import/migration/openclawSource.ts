/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Scan an OpenClaw install for migratable config. OpenClaw keeps provider keys
 * in two places: inline in `~/.openclaw/openclaw.json` (`models.providers.*.apiKey`,
 * which can be a literal, a `${ENV}` template, or a structured SecretRef) and -
 * the primary store - in the per-agent SQLite db `auth_profile_store` table as a
 * plaintext JSON blob of `{ version, profiles }`. MCP servers + the default
 * model live in `openclaw.json`. Legacy dirs: `.clawdbot` / `.moltbot`.
 *
 * Pure parsers carry the logic (unit-tested); `scanOpenClaw` does the IO. Secret
 * values stay in `RawProviderKey.value` and never reach a `MigrationItem`.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSON5 from 'json5';
import BetterSqlite3 from 'better-sqlite3';
import type { MigrationItem, MigrationPlan } from '@/common/types/migration';
import { providerFromOpenClawName, providerFromKeyShape, redactKey } from './providerKeyMap';
import { parseEnvText, mcpDetail, type RawProviderKey, type RawMcpServer, type ExistingState } from './migrationShared';

const STATE_DIRNAMES = ['.openclaw', '.clawdbot', '.moltbot', '.moldbot'];

/** Resolve the OpenClaw state directory, honoring overrides + legacy names. */
export function openclawHome(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.OPENCLAW_STATE_DIR && env.OPENCLAW_STATE_DIR.trim()) return env.OPENCLAW_STATE_DIR.trim();
  const base = env.OPENCLAW_HOME && env.OPENCLAW_HOME.trim() ? env.OPENCLAW_HOME.trim() : os.homedir();
  for (const name of STATE_DIRNAMES) {
    const dir = path.join(base, name);
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

/** Parse openclaw.json (JSONC-tolerant). Returns null on unrecoverable parse error. */
export function parseOpenClawConfig(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON5.parse(text);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Resolve a `${VAR}` template (or literal) against an env map; null for unresolved/SecretRef. */
function resolveSecretInput(input: unknown, envMap: Record<string, string>): string | null {
  if (typeof input !== 'string') return null; // structured SecretRef objects are not migrated
  const trimmed = input.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/);
  if (m) return envMap[m[1]] ?? null;
  if (trimmed.startsWith('$')) return null; // other template forms unresolved
  return trimmed;
}

/** Provider keys inline in openclaw.json `models.providers.<name>.apiKey`. */
export function openclawKeysFromConfig(
  config: Record<string, unknown>,
  envMap: Record<string, string>
): RawProviderKey[] {
  const out: RawProviderKey[] = [];
  const models = config.models;
  const providers = models && typeof models === 'object' ? (models as Record<string, unknown>).providers : undefined;
  if (!providers || typeof providers !== 'object') return out;
  for (const [name, raw] of Object.entries(providers as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const providerId = providerFromOpenClawName(name);
    if (!providerId) continue;
    const key = resolveSecretInput((raw as Record<string, unknown>).apiKey, envMap);
    if (key) out.push({ providerId, value: key, sourceLabel: `models.providers.${name}` });
  }
  return out;
}

/** Provider keys from the SQLite `auth_profile_store` JSON blob (api_key profiles). */
export function openclawKeysFromProfiles(storeJson: string): RawProviderKey[] {
  const out: RawProviderKey[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(storeJson);
  } catch {
    return out;
  }
  const profiles = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>).profiles : undefined;
  if (!profiles || typeof profiles !== 'object') return out;
  for (const [profileId, raw] of Object.entries(profiles as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const cred = raw as Record<string, unknown>;
    if (cred.type !== 'api_key' || typeof cred.key !== 'string' || !cred.key.trim()) continue;
    const providerName = typeof cred.provider === 'string' ? cred.provider : profileId.split(':')[0];
    const providerId = providerFromOpenClawName(providerName) ?? providerFromKeyShape(cred.key);
    if (providerId) out.push({ providerId, value: cred.key.trim(), sourceLabel: `auth-profile ${profileId}` });
  }
  return out;
}

/** MCP servers + default model from openclaw.json. */
export function openclawConfigItems(config: Record<string, unknown>): {
  mcp: RawMcpServer[];
  defaultModel: string | null;
} {
  const mcp: RawMcpServer[] = [];
  let defaultModel: string | null = null;

  const mcpCfg = config.mcp;
  const servers = mcpCfg && typeof mcpCfg === 'object' ? (mcpCfg as Record<string, unknown>).servers : undefined;
  if (servers && typeof servers === 'object') {
    for (const [name, raw] of Object.entries(servers as Record<string, unknown>)) {
      if (raw && typeof raw === 'object') mcp.push({ name, config: raw as Record<string, unknown> });
    }
  }

  const agents = config.agents;
  const defaults = agents && typeof agents === 'object' ? (agents as Record<string, unknown>).defaults : undefined;
  const model = defaults && typeof defaults === 'object' ? (defaults as Record<string, unknown>).model : undefined;
  if (typeof model === 'string' && model.trim()) defaultModel = model.trim();
  else if (model && typeof model === 'object') {
    const primary = (model as Record<string, unknown>).primary;
    if (typeof primary === 'string' && primary.trim()) defaultModel = primary.trim();
  }

  return { mcp, defaultModel };
}

/** Dedupe provider keys by provider id, preferring the first (config before profiles). */
function dedupeKeys(keys: RawProviderKey[]): RawProviderKey[] {
  const seen = new Set<string>();
  const out: RawProviderKey[] = [];
  for (const k of keys) {
    if (seen.has(k.providerId)) continue;
    seen.add(k.providerId);
    out.push(k);
  }
  return out;
}

/** Build the plan (items + status) from parsed OpenClaw data + current Wayland state. Pure. */
export function buildOpenClawPlan(
  parsed: { keys: RawProviderKey[]; mcp: RawMcpServer[]; defaultModel: string | null },
  existing: ExistingState,
  sourcePath: string,
  warnings: string[]
): MigrationPlan {
  const items: MigrationItem[] = [];

  for (const key of dedupeKeys(parsed.keys)) {
    items.push({
      id: `provider-key:${key.providerId}`,
      kind: 'provider-key',
      label: key.providerId,
      detail: redactKey(key.value),
      status: existing.connectedProviderIds.has(key.providerId) ? 'exists' : 'new',
      sensitive: true,
      providerId: key.providerId,
    });
  }

  for (const server of parsed.mcp) {
    items.push({
      id: `mcp-server:${server.name}`,
      kind: 'mcp-server',
      label: `${server.name} (MCP)`,
      detail: mcpDetail(server.config),
      status: existing.mcpServerNames.has(server.name.toLowerCase()) ? 'exists' : 'new',
      sensitive: false,
    });
  }

  // Default-model migration is intentionally out of scope for v1 (see hermesSource).

  return { toolId: 'openclaw', sourcePath, detected: true, items, warnings };
}

/** Read provider keys out of the per-agent SQLite auth_profile_store(s). Best-effort. */
function readOpenClawSqliteKeys(home: string, warnings: string[]): RawProviderKey[] {
  const agentsDir = path.join(home, 'agents');
  if (!fs.existsSync(agentsDir)) return [];
  const out: RawProviderKey[] = [];
  let agentDirs: string[] = [];
  try {
    agentDirs = fs.readdirSync(agentsDir);
  } catch {
    return [];
  }
  for (const agent of agentDirs) {
    const dbPath = path.join(agentsDir, agent, 'agent', 'openclaw-agent.sqlite');
    if (!fs.existsSync(dbPath)) continue;
    let db: BetterSqlite3.Database | null = null;
    try {
      db = new BetterSqlite3(dbPath, { readonly: true, fileMustExist: true });
      const rows = db.prepare('SELECT store_json FROM auth_profile_store').all() as Array<{ store_json: string }>;
      for (const row of rows) out.push(...openclawKeysFromProfiles(row.store_json));
    } catch (err) {
      warnings.push(`Could not read keys for agent "${agent}": ${String(err)}`);
    } finally {
      try {
        db?.close();
      } catch {
        /* ignore */
      }
    }
  }
  return out;
}

/**
 * Raw bundle read from disk - INCLUDING secret key values. Main-process only;
 * never serialized to the renderer.
 */
export type OpenClawRaw = {
  detected: boolean;
  sourcePath: string | null;
  keys: RawProviderKey[];
  mcp: RawMcpServer[];
  defaultModel: string | null;
  warnings: string[];
};

/** Read the OpenClaw install on disk into a raw bundle. Read-only; never throws. */
export function collectOpenClawRaw(env: NodeJS.ProcessEnv = process.env): OpenClawRaw {
  const home = openclawHome(env);
  const warnings: string[] = [];
  if (!home) return { detected: false, sourcePath: null, keys: [], mcp: [], defaultModel: null, warnings };

  let envMap: Record<string, string> = {};
  const envPath = path.join(home, '.env');
  try {
    if (fs.existsSync(envPath)) envMap = parseEnvText(fs.readFileSync(envPath, 'utf-8'));
  } catch {
    /* env is optional */
  }
  // Process env can also resolve ${VAR} templates the user relied on at runtime.
  envMap = {
    ...Object.fromEntries(Object.entries(env).filter(([, v]) => typeof v === 'string') as [string, string][]),
    ...envMap,
  };

  let config: Record<string, unknown> | null = null;
  const configPath = ['openclaw.json', 'clawdbot.json', 'moltbot.json', 'moldbot.json']
    .map((f) => path.join(home, f))
    .find((p) => fs.existsSync(p));
  if (configPath) {
    try {
      config = parseOpenClawConfig(fs.readFileSync(configPath, 'utf-8'));
      if (!config) warnings.push('Could not parse openclaw.json');
    } catch (err) {
      warnings.push(`Could not read openclaw.json: ${String(err)}`);
    }
  }

  const configKeys = config ? openclawKeysFromConfig(config, envMap) : [];
  const sqliteKeys = readOpenClawSqliteKeys(home, warnings);
  const { mcp, defaultModel } = config ? openclawConfigItems(config) : { mcp: [], defaultModel: null };

  return { detected: true, sourcePath: home, keys: [...configKeys, ...sqliteKeys], mcp, defaultModel, warnings };
}

/** Scan the OpenClaw install into a (secret-free) migration plan. */
export function scanOpenClaw(existing: ExistingState, env: NodeJS.ProcessEnv = process.env): MigrationPlan {
  const raw = collectOpenClawRaw(env);
  if (!raw.detected)
    return { toolId: 'openclaw', sourcePath: null, detected: false, items: [], warnings: raw.warnings };
  return buildOpenClawPlan(
    { keys: raw.keys, mcp: raw.mcp, defaultModel: raw.defaultModel },
    existing,
    raw.sourcePath ?? '',
    raw.warnings
  );
}
