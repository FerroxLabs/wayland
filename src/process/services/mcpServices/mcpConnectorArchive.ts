/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { IMcpServer } from '@/common/config/storage';
import { mcpServerCollisionKey } from '@/common/mcp';

const ARCHIVE_KIND = 'wayland-mcp-connector-archive' as const;
const ARCHIVE_VERSION = 1 as const;
const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024;
const ARCHIVE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface McpConnectorArchiveRecord {
  kind: typeof ARCHIVE_KIND;
  version: typeof ARCHIVE_VERSION;
  archiveId: string;
  archivedAt: number;
  serverDigest: `sha256:${string}`;
  server: IMcpServer;
}

export interface ArchivedMcpConnectorSummary {
  archiveId: string;
  archivedAt: number;
  serverId: string;
  name: string;
  description?: string;
  transportType: IMcpServer['transport']['type'];
  source?: IMcpServer['source'];
}

export interface McpLifecycleAgent {
  backend: string;
  name: string;
  cliPath?: string;
}

export interface McpLifecycleMutationResult {
  success: boolean;
  results: Array<{ agent: string; success: boolean; error?: string }>;
}

export interface McpConnectorLifecycleDependencies {
  getActiveServers(): Promise<IMcpServer[]>;
  compareAndSetActiveServers(expected: IMcpServer[], servers: IMcpServer[]): Promise<boolean>;
  removeFromAgents(serverName: string, agents: McpLifecycleAgent[]): Promise<McpLifecycleMutationResult>;
  syncToAgents(servers: IMcpServer[], agents: McpLifecycleAgent[]): Promise<McpLifecycleMutationResult>;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .toSorted(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function digestMcpServer(server: IMcpServer): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(canonicalJson(server)).digest('hex')}`;
}

function assertSafeArchiveId(archiveId: string): void {
  if (!ARCHIVE_ID_PATTERN.test(archiveId)) throw new Error('Invalid MCP connector archive id');
}

function assertPlainRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${label}`);
}

function assertExactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).toSorted();
  const wanted = expected.toSorted();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`Invalid ${label} fields`);
  }
}

function assertMcpServer(server: unknown): asserts server is IMcpServer {
  assertPlainRecord(server, 'MCP connector');
  if (
    typeof server.id !== 'string' ||
    server.id.length === 0 ||
    server.id.length > 512 ||
    typeof server.name !== 'string' ||
    server.name.length === 0 ||
    server.name.length > 512 ||
    typeof server.enabled !== 'boolean' ||
    typeof server.createdAt !== 'number' ||
    !Number.isFinite(server.createdAt) ||
    typeof server.updatedAt !== 'number' ||
    !Number.isFinite(server.updatedAt) ||
    typeof server.originalJson !== 'string'
  ) {
    throw new Error('Invalid MCP connector definition');
  }
  assertPlainRecord(server.transport, 'MCP connector transport');
  const type = server.transport.type;
  if (!['stdio', 'sse', 'http', 'streamable_http'].includes(String(type))) {
    throw new Error('Invalid MCP connector transport type');
  }
  if (type === 'stdio' && (typeof server.transport.command !== 'string' || server.transport.command.length === 0)) {
    throw new Error('Invalid MCP stdio command');
  }
  if (type !== 'stdio' && (typeof server.transport.url !== 'string' || server.transport.url.length === 0)) {
    throw new Error('Invalid MCP connector URL');
  }
}

function parseArchiveRecord(raw: string): McpConnectorArchiveRecord {
  if (Buffer.byteLength(raw, 'utf8') > MAX_ARCHIVE_BYTES) throw new Error('MCP connector archive is too large');
  const parsed: unknown = JSON.parse(raw);
  assertPlainRecord(parsed, 'MCP connector archive');
  assertExactKeys(
    parsed,
    ['kind', 'version', 'archiveId', 'archivedAt', 'serverDigest', 'server'],
    'MCP connector archive'
  );
  if (
    parsed.kind !== ARCHIVE_KIND ||
    parsed.version !== ARCHIVE_VERSION ||
    typeof parsed.archiveId !== 'string' ||
    typeof parsed.archivedAt !== 'number' ||
    !Number.isFinite(parsed.archivedAt) ||
    typeof parsed.serverDigest !== 'string' ||
    !/^sha256:[0-9a-f]{64}$/.test(parsed.serverDigest)
  ) {
    throw new Error('Invalid MCP connector archive metadata');
  }
  assertSafeArchiveId(parsed.archiveId);
  assertMcpServer(parsed.server);
  if (digestMcpServer(parsed.server) !== parsed.serverDigest) {
    throw new Error('MCP connector archive digest mismatch');
  }
  return parsed as unknown as McpConnectorArchiveRecord;
}

function toSummary(record: McpConnectorArchiveRecord): ArchivedMcpConnectorSummary {
  return {
    archiveId: record.archiveId,
    archivedAt: record.archivedAt,
    serverId: record.server.id,
    name: record.server.name,
    description: record.server.description,
    transportType: record.server.transport.type,
    source: record.server.source,
  };
}

async function assertDirectoryNotSymlink(directory: string): Promise<void> {
  const stat = await fs.lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Unsafe MCP archive directory: ${directory}`);
}

async function ensurePrivateChildDirectory(parent: string, child: string): Promise<string> {
  await assertDirectoryNotSymlink(parent);
  const target = path.join(parent, child);
  try {
    await fs.mkdir(target, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  await assertDirectoryNotSymlink(target);
  return target;
}

async function syncDirectory(directory: string): Promise<void> {
  if (process.platform === 'win32') return;
  const handle = await fs.open(directory, fsConstants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export class McpConnectorArchiveStore {
  constructor(private readonly configRoot: string) {}

  private async ensureRoot(): Promise<{ active: string; restored: string; aborted: string }> {
    // Desktop deliberately exposes its config directory through a CLI-safe
    // top-level symlink on macOS. Resolve that trusted root alias once, then
    // reject every symlink below it so an `archives`/connector child cannot
    // redirect secret-bearing records outside the real config directory.
    const configRoot = await fs.realpath(this.configRoot);
    await assertDirectoryNotSymlink(configRoot);
    const archives = await ensurePrivateChildDirectory(configRoot, 'archives');
    const mcp = await ensurePrivateChildDirectory(archives, 'mcp-connectors');
    return {
      active: await ensurePrivateChildDirectory(mcp, 'active'),
      restored: await ensurePrivateChildDirectory(mcp, 'restored'),
      aborted: await ensurePrivateChildDirectory(mcp, 'aborted'),
    };
  }

  async publish(server: IMcpServer): Promise<McpConnectorArchiveRecord> {
    assertMcpServer(server);
    const { active } = await this.ensureRoot();
    const archiveId = randomUUID();
    const record: McpConnectorArchiveRecord = {
      kind: ARCHIVE_KIND,
      version: ARCHIVE_VERSION,
      archiveId,
      archivedAt: Date.now(),
      serverDigest: digestMcpServer(server),
      server: structuredClone(server),
    };
    const target = path.join(active, `${archiveId}.json`);
    const temporary = path.join(active, `.${archiveId}.tmp`);
    const handle = await fs.open(temporary, 'wx', 0o600);
    let published = false;
    try {
      await handle.writeFile(`${JSON.stringify(record, null, 2)}\n`, 'utf8');
      await handle.sync();
      await handle.close();
      const verified = parseArchiveRecord(await fs.readFile(temporary, 'utf8'));
      if (verified.serverDigest !== record.serverDigest) throw new Error('MCP connector archive verification failed');
      await fs.rename(temporary, target);
      await syncDirectory(active);
      published = true;
      return record;
    } finally {
      await handle.close().catch(() => {});
      if (!published) await fs.rm(temporary, { force: true }).catch(() => {});
    }
  }

  async read(archiveId: string): Promise<McpConnectorArchiveRecord> {
    assertSafeArchiveId(archiveId);
    const { active } = await this.ensureRoot();
    const filePath = path.join(active, `${archiveId}.json`);
    const stat = await fs.lstat(filePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_ARCHIVE_BYTES) {
      throw new Error('Unsafe MCP connector archive file');
    }
    const record = parseArchiveRecord(await fs.readFile(filePath, 'utf8'));
    if (record.archiveId !== archiveId) throw new Error('MCP connector archive identity mismatch');
    return record;
  }

  async list(): Promise<McpConnectorArchiveRecord[]> {
    const { active } = await this.ensureRoot();
    const entries = await fs.readdir(active, { withFileTypes: true });
    // Inventory is an evidence surface. One corrupt/tampered record must not
    // be silently omitted and translated into a deceptive "no archives"
    // state; fail the whole list if any selected record fails validation.
    const records = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && !entry.isSymbolicLink() && entry.name.endsWith('.json'))
        .map((entry) => this.read(entry.name.slice(0, -'.json'.length)))
    );
    return records.toSorted((left, right) => right.archivedAt - left.archivedAt);
  }

  async retire(archiveId: string, destination: 'restored' | 'aborted'): Promise<void> {
    assertSafeArchiveId(archiveId);
    const roots = await this.ensureRoot();
    const source = path.join(roots.active, `${archiveId}.json`);
    const target = path.join(roots[destination], `${archiveId}.json`);
    try {
      await fs.rename(source, target);
      await syncDirectory(roots.active);
      await syncDirectory(roots[destination]);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const targetStat = await fs.lstat(target).catch((_error: unknown): null => null);
      if (!targetStat?.isFile() || targetStat.isSymbolicLink()) throw error;
    }
  }
}

export class McpConnectorLifecycleService {
  private mutationTail: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly archives: McpConnectorArchiveStore,
    private readonly deps: McpConnectorLifecycleDependencies
  ) {}

  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const queued = this.mutationTail.then(operation, operation);
    this.mutationTail = queued.catch(() => {});
    return queued;
  }

  private async rollbackPublication(server: IMcpServer, agents: McpLifecycleAgent[]): Promise<void> {
    if (!server.enabled) return;
    const result = await this.deps.syncToAgents([server], agents);
    if (!result.success || result.results.some((entry) => !entry.success)) {
      throw new Error('MCP connector rollback publication failed');
    }
  }

  archiveConfiguredServer(serverId: string, agents: McpLifecycleAgent[]): Promise<ArchivedMcpConnectorSummary> {
    return this.serialize(async () => {
      const before = await this.deps.getActiveServers();
      const server = before.find((candidate) => candidate.id === serverId);
      if (!server) throw new Error('MCP connector not found');
      if (server.builtin) throw new Error('Built-in MCP connectors cannot be archived');

      const archive = await this.archives.publish(server);
      try {
        const removal = await this.deps.removeFromAgents(server.name, agents);
        if (!removal.success || removal.results.some((entry) => !entry.success)) {
          await this.rollbackPublication(server, agents).catch((rollbackError) => {
            console.error('[McpConnectorArchive] Failed to compensate partial removal:', rollbackError);
          });
          throw new Error(
            removal.results
              .filter((entry) => !entry.success)
              .map((entry) => `${entry.agent}: ${entry.error || 'removal failed'}`)
              .join('; ') || 'MCP connector removal failed'
          );
        }

        const current = await this.deps.getActiveServers();
        const currentServer = current.find((candidate) => candidate.id === serverId);
        // Another actor may have completed the active-row removal while this
        // transaction was revoking adapters. The durable archive is already
        // published, so that is a successful idempotent outcome: keep it in the
        // visible active archive rather than misclassifying it as aborted.
        if (!currentServer) return toSummary(archive);
        if (digestMcpServer(currentServer) !== archive.serverDigest) {
          // Preserve the newer user intent. Republishing the stale archived
          // definition here would overwrite a concurrent edit in agent configs.
          await this.rollbackPublication(currentServer, agents);
          throw new Error('MCP connector changed while it was being archived');
        }

        let committed: boolean;
        try {
          committed = await this.deps.compareAndSetActiveServers(
            current,
            current.filter((candidate) => candidate.id !== serverId)
          );
        } catch (error) {
          await this.rollbackPublication(server, agents).catch((rollbackError) => {
            console.error('[McpConnectorArchive] Failed to restore agent publication:', rollbackError);
          });
          throw error;
        }
        if (!committed) {
          // The CAS loser must never republish the stale pre-archive snapshot.
          // Restore only the latest durable definition, if it still exists.
          const latest = await this.deps.getActiveServers();
          const latestServer = latest.find((candidate) => candidate.id === serverId);
          if (latestServer) await this.rollbackPublication(latestServer, agents);
          throw new Error('MCP connector changed while it was being archived');
        }
        return toSummary(archive);
      } catch (error) {
        await this.archives.retire(archive.archiveId, 'aborted').catch((retireError) => {
          console.error('[McpConnectorArchive] Failed to retain aborted archive:', retireError);
        });
        throw error;
      }
    });
  }

  listArchivedServers(): Promise<ArchivedMcpConnectorSummary[]> {
    return this.serialize(async () => {
      const [records, active] = await Promise.all([this.archives.list(), this.deps.getActiveServers()]);
      const activeIds = new Set(active.map((server) => server.id));
      const activeNames = new Set(active.map((server) => mcpServerCollisionKey(server.name)));
      return records
        .filter(
          (record) => !activeIds.has(record.server.id) && !activeNames.has(mcpServerCollisionKey(record.server.name))
        )
        .map(toSummary);
    });
  }

  restoreArchivedServer(archiveId: string): Promise<ArchivedMcpConnectorSummary> {
    return this.serialize(async () => {
      const record = await this.archives.read(archiveId);
      const active = await this.deps.getActiveServers();
      const collision = active.some(
        (server) =>
          server.id === record.server.id ||
          mcpServerCollisionKey(server.name) === mcpServerCollisionKey(record.server.name)
      );
      if (collision) throw new Error('An active MCP connector already uses this identity or name');

      const restored: IMcpServer = {
        ...structuredClone(record.server),
        enabled: false,
        status: 'disconnected',
        updatedAt: Date.now(),
      };
      const committed = await this.deps.compareAndSetActiveServers(active, [...active, restored]);
      if (!committed) throw new Error('MCP connector inventory changed while restore was in progress');
      await this.archives.retire(archiveId, 'restored').catch((error) => {
        console.error('[McpConnectorArchive] Restored connector but could not retire archive:', error);
      });
      return toSummary(record);
    });
  }
}
