/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Orchestrates "Migrate from another tool" (#migrate): build the read-only scan
 * plan, and apply a user-selected subset. Provider keys land via the same
 * `connectModelRegistryProvider` path the Models page uses (so they validate +
 * build a catalog); MCP servers land in `mcp.config` and are synced to agents.
 *
 * SECURITY: a scan returns a secret-free `MigrationPlan` to the renderer. The
 * apply step re-reads the source from disk to recover the actual key values, so
 * secrets are never serialized across the IPC boundary - the renderer only ever
 * sends back the selected item ids.
 */

import { getDatabase } from '@process/services/database';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import { connectModelRegistryProvider } from '@process/providers/ipc/modelRegistryIpc';
import { ProcessConfig } from '@process/utils/initStorage';
import type { IMcpServer, IMcpServerTransport } from '@/common/config/storage';
import type { MigrationPlan, MigrationResult, MigrationToolId } from '@/common/types/migration';
import type { ExistingState, RawMcpServer, RawProviderKey } from './migrationShared';
import { collectHermesRaw } from './hermesSource';
import { collectOpenClawRaw, scanOpenClaw } from './openclawSource';
import { scanHermes } from './hermesSource';

/** Read what Wayland already has, so the scan can mark items new vs exists. */
async function getExistingState(): Promise<ExistingState> {
  const connectedProviderIds = new Set<string>();
  try {
    const db = await getDatabase();
    const repo = new ProviderRepository(db.getDriver());
    for (const p of repo.listRegistryProviders()) {
      if (p.state === 'connected') connectedProviderIds.add(p.providerId);
    }
  } catch {
    /* empty registry -> everything is new */
  }

  const mcpServerNames = new Set<string>();
  try {
    const servers = (await ProcessConfig.get('mcp.config')) as IMcpServer[] | undefined;
    for (const s of servers ?? []) if (s?.name) mcpServerNames.add(s.name.toLowerCase());
  } catch {
    /* no mcp config yet */
  }

  return { connectedProviderIds, mcpServerNames, hasDefaultModel: false };
}

/** Build the read-only migration plan for a tool. */
export async function scanTool(toolId: MigrationToolId): Promise<MigrationPlan> {
  const existing = await getExistingState();
  return toolId === 'hermes' ? scanHermes(existing) : scanOpenClaw(existing);
}

/** Translate a source-tool MCP config object into a Wayland transport. */
function toTransport(config: Record<string, unknown>): IMcpServerTransport | null {
  const command = config.command;
  if (typeof command === 'string' && command) {
    const args = Array.isArray(config.args) ? config.args.filter((a): a is string => typeof a === 'string') : [];
    const env: Record<string, string> = {};
    if (config.env && typeof config.env === 'object') {
      for (const [k, v] of Object.entries(config.env as Record<string, unknown>)) {
        if (typeof v === 'string') env[k] = v;
        else if (typeof v === 'number' || typeof v === 'boolean') env[k] = String(v);
      }
    }
    return { type: 'stdio', command, args, env };
  }
  const url = config.url;
  if (typeof url === 'string' && url) {
    const headers: Record<string, string> = {};
    if (config.headers && typeof config.headers === 'object') {
      for (const [k, v] of Object.entries(config.headers as Record<string, unknown>)) {
        if (typeof v === 'string') headers[k] = v;
      }
    }
    const t = (config.transport as string) || (config.type as string);
    if (t === 'sse' || url.includes('/sse')) return { type: 'sse', url, headers };
    if (t === 'streamable-http' || t === 'streamable_http') return { type: 'streamable_http', url, headers };
    return { type: 'http', url, headers };
  }
  return null;
}

/** Per-key validation cap so an unreachable provider can't stall the import. */
const KEY_CONNECT_TIMEOUT_MS = 20_000;

/** Resolve a promise or the sentinel `'timeout'` after `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | 'timeout'> {
  return Promise.race([promise, new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), ms))]);
}

/** Apply selected provider keys. Returns per-key outcomes. */
async function applyKeys(keys: RawProviderKey[], selected: Set<string>, result: MigrationResult): Promise<void> {
  const seen = new Set<string>();
  for (const key of keys) {
    const id = `provider-key:${key.providerId}`;
    if (!selected.has(id) || seen.has(key.providerId)) continue;
    seen.add(key.providerId);
    try {
      // Sequential on purpose: each connect probes the provider + writes the
      // registry db, so parallel connects would race the db and rate-limit.
      // Bounded so one unreachable/invalid key can't hang the whole import - it
      // is reported as an error and the batch moves on.
      // oxlint-disable-next-line no-await-in-loop
      const res = await withTimeout(
        connectModelRegistryProvider(key.providerId, { key: key.value }),
        KEY_CONNECT_TIMEOUT_MS
      );
      if (res === 'timeout') result.errors.push({ label: key.providerId, reason: 'validation timed out' });
      else if (res.ok) result.applied += 1;
      else result.errors.push({ label: key.providerId, reason: res.error ?? 'connect failed' });
    } catch (err) {
      result.errors.push({ label: key.providerId, reason: String(err) });
    }
  }
}

/** Apply selected MCP servers (skip-existing), then sync to agents once. */
async function applyMcp(servers: RawMcpServer[], selected: Set<string>, result: MigrationResult): Promise<void> {
  const existing = ((await ProcessConfig.get('mcp.config')) as IMcpServer[] | undefined) ?? [];
  const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));
  const now = Date.now();
  const additions: IMcpServer[] = [];

  for (const server of servers) {
    if (!selected.has(`mcp-server:${server.name}`)) continue;
    if (existingNames.has(server.name.toLowerCase())) {
      result.skipped += 1;
      continue;
    }
    const transport = toTransport(server.config);
    if (!transport) {
      result.errors.push({ label: server.name, reason: 'unsupported MCP transport' });
      continue;
    }
    additions.push({
      id: `mcp-${now}-${additions.length}`,
      name: server.name,
      enabled: false,
      transport,
      createdAt: now,
      updatedAt: now,
      originalJson: JSON.stringify({ [server.name]: server.config }, null, 2),
      source: 'custom',
    });
  }

  if (additions.length === 0) return;
  const merged = [...existing, ...additions];
  await ProcessConfig.set('mcp.config', merged);
  result.applied += additions.length;
  // Imported servers land DISABLED (enabled: false), so no agent sync is needed
  // here - the user toggles one on in the MCP Library and the normal enable flow
  // syncs it. (Calling the renderer-facing syncMcpToAgents.invoke() from the main
  // process would never resolve.)
}

/**
 * Apply a selected subset of a tool's migration plan. Re-reads the source from
 * disk to recover secret values (never sent from the renderer).
 */
export async function applyMigration(toolId: MigrationToolId, selectedIds: string[]): Promise<MigrationResult> {
  const result: MigrationResult = { toolId, applied: 0, skipped: 0, errors: [] };
  const selected = new Set(selectedIds);
  if (selected.size === 0) return result;

  const raw = toolId === 'hermes' ? collectHermesRaw() : collectOpenClawRaw();
  if (!raw.detected) {
    result.errors.push({ label: toolId, reason: 'source config no longer found' });
    return result;
  }

  // MCP servers first: they need no network validation, so they always land
  // promptly even if a provider key probe is slow.
  await applyMcp(raw.mcp, selected, result);
  await applyKeys(raw.keys, selected, result);
  return result;
}
