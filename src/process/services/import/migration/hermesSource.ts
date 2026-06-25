/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Scan a Hermes Agent install for migratable config. Hermes stores provider
 * keys as plaintext `KEY=value` lines in `~/.hermes/.env`, and MCP servers +
 * the default model in `~/.hermes/config.yaml`. `HERMES_HOME` overrides the
 * home dir; native Windows uses `%LOCALAPPDATA%\hermes`.
 *
 * The pure `parse*`/`buildHermesPlan` helpers carry all the logic (unit-tested);
 * `scanHermes` is the thin disk/IO + existing-state wrapper. Secret values stay
 * in `RawCredential.value` and are NEVER placed on a `MigrationItem`.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import yaml from 'js-yaml';
import type { MigrationItem, MigrationPlan } from '@/common/types/migration';
import { providerFromHermesEnv, redactKey } from './providerKeyMap';
import { parseEnvText, type RawProviderKey, type RawMcpServer, mcpDetail } from './migrationShared';
import type { ExistingState } from './migrationShared';

/** Resolve the Hermes home directory, honoring `HERMES_HOME`. */
export function hermesHome(env: NodeJS.ProcessEnv = process.env): string {
  if (env.HERMES_HOME && env.HERMES_HOME.trim()) return env.HERMES_HOME.trim();
  if (process.platform === 'win32' && env.LOCALAPPDATA) return path.join(env.LOCALAPPDATA, 'hermes');
  return path.join(os.homedir(), '.hermes');
}

/** Extract provider keys from a parsed Hermes `.env` map. */
export function hermesProviderKeys(envMap: Record<string, string>): RawProviderKey[] {
  const out: RawProviderKey[] = [];
  for (const [name, value] of Object.entries(envMap)) {
    const providerId = providerFromHermesEnv(name);
    if (providerId && value.trim()) out.push({ providerId, value: value.trim(), sourceLabel: name });
  }
  return out;
}

/** Extract MCP servers + default model from a parsed Hermes `config.yaml` object. */
export function hermesConfigItems(config: unknown): { mcp: RawMcpServer[]; defaultModel: string | null } {
  const mcp: RawMcpServer[] = [];
  let defaultModel: string | null = null;
  if (config && typeof config === 'object') {
    const c = config as Record<string, unknown>;
    const servers = c.mcp_servers;
    if (servers && typeof servers === 'object') {
      for (const [name, raw] of Object.entries(servers as Record<string, unknown>)) {
        if (raw && typeof raw === 'object') mcp.push({ name, config: raw as Record<string, unknown> });
      }
    }
    const model = c.model;
    if (model && typeof model === 'object') {
      const m = model as Record<string, unknown>;
      const def = m.default ?? m.model;
      if (typeof def === 'string' && def.trim()) defaultModel = def.trim();
    }
  }
  return { mcp, defaultModel };
}

/**
 * Build the migration plan (items + status) from parsed Hermes data and the
 * current Wayland state. Pure - all IO done by the caller. Secret values are
 * read here only to redact them for `detail`; they never leave on the item.
 */
export function buildHermesPlan(
  parsed: { keys: RawProviderKey[]; mcp: RawMcpServer[]; defaultModel: string | null },
  existing: ExistingState,
  sourcePath: string,
  warnings: string[]
): MigrationPlan {
  const items: MigrationItem[] = [];

  for (const key of parsed.keys) {
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

  // Default-model migration is intentionally out of scope for v1: an external
  // model string does not map reliably onto Wayland's catalog model ids, and
  // setting a bad one would break the chat default. `parsed.defaultModel` is
  // carried for a future best-effort mapping.

  return { toolId: 'hermes', sourcePath, detected: true, items, warnings };
}

/**
 * Raw bundle read from disk - INCLUDING secret key values. Main-process only;
 * never serialized to the renderer. Both `scanHermes` (which strips secrets into
 * a plan) and the apply step (which re-reads to get the values) build on this.
 */
export type HermesRaw = {
  detected: boolean;
  sourcePath: string | null;
  keys: RawProviderKey[];
  mcp: RawMcpServer[];
  defaultModel: string | null;
  warnings: string[];
};

/** Read the Hermes install on disk into a raw bundle. Read-only; never throws. */
export function collectHermesRaw(env: NodeJS.ProcessEnv = process.env): HermesRaw {
  const home = hermesHome(env);
  const warnings: string[] = [];
  const envPath = path.join(home, '.env');
  const configPath = path.join(home, 'config.yaml');

  if (!fs.existsSync(home) || (!fs.existsSync(envPath) && !fs.existsSync(configPath))) {
    return { detected: false, sourcePath: null, keys: [], mcp: [], defaultModel: null, warnings };
  }

  let keys: RawProviderKey[] = [];
  try {
    if (fs.existsSync(envPath)) keys = hermesProviderKeys(parseEnvText(fs.readFileSync(envPath, 'utf-8')));
  } catch (err) {
    warnings.push(`Could not read .env: ${String(err)}`);
  }

  let mcp: RawMcpServer[] = [];
  let defaultModel: string | null = null;
  try {
    if (fs.existsSync(configPath)) {
      const config = yaml.load(fs.readFileSync(configPath, 'utf-8'));
      const got = hermesConfigItems(config);
      mcp = got.mcp;
      defaultModel = got.defaultModel;
    }
  } catch (err) {
    warnings.push(`Could not read config.yaml: ${String(err)}`);
  }

  return { detected: true, sourcePath: home, keys, mcp, defaultModel, warnings };
}

/** Scan the Hermes install into a (secret-free) migration plan. */
export function scanHermes(existing: ExistingState, env: NodeJS.ProcessEnv = process.env): MigrationPlan {
  const raw = collectHermesRaw(env);
  if (!raw.detected) return { toolId: 'hermes', sourcePath: null, detected: false, items: [], warnings: raw.warnings };
  return buildHermesPlan(
    { keys: raw.keys, mcp: raw.mcp, defaultModel: raw.defaultModel },
    existing,
    raw.sourcePath ?? '',
    raw.warnings
  );
}
