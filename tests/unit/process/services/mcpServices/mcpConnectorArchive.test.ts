/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import {
  McpConnectorArchiveStore,
  McpConnectorLifecycleService,
  type McpConnectorLifecycleDependencies,
} from '@process/services/mcpServices/mcpConnectorArchive';

const server = (overrides: Partial<IMcpServer> = {}): IMcpServer => ({
  id: 'mcp_customer',
  name: 'customer-tools',
  description: 'Customer-authored connector',
  enabled: true,
  transport: {
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@customer/mcp'],
    env: { CUSTOMER_API_KEY: 'secret-value', PATH: '/customer/bin' },
  },
  createdAt: 10,
  updatedAt: 20,
  originalJson: '{"mcpServers":{"customer-tools":{"command":"npx"}}}',
  source: 'custom',
  byoOAuth: { clientId: 'customer-client', clientSecret: 'customer-secret' },
  allowedTools: ['search', 'extract'],
  ...overrides,
});

describe('McpConnectorArchiveStore and lifecycle', () => {
  let root: string;
  let active: IMcpServer[];
  type LifecycleResult = {
    success: boolean;
    results: Array<{ agent: string; success: boolean; error?: string; unsupported?: boolean }>;
  };
  let removeResult: LifecycleResult;
  let syncResult: LifecycleResult;
  let removeFromAgents: ReturnType<typeof vi.fn>;
  let syncToAgents: ReturnType<typeof vi.fn>;
  let deps: McpConnectorLifecycleDependencies;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-mcp-archive-'));
    active = [server()];
    removeResult = { success: true, results: [{ agent: 'wcore:Wayland Core', success: true }] };
    syncResult = { success: true, results: [{ agent: 'wcore:Wayland Core', success: true }] };
    removeFromAgents = vi.fn(async () => removeResult);
    syncToAgents = vi.fn(async () => syncResult);
    deps = {
      getActiveServers: vi.fn(async () => structuredClone(active)),
      compareAndSetActiveServers: vi.fn(async (expected: IMcpServer[], next: IMcpServer[]) => {
        if (JSON.stringify(active) !== JSON.stringify(expected)) return false;
        active = structuredClone(next);
        return true;
      }),
      removeFromAgents,
      syncToAgents,
    };
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  /**
   * Delete/archive is a THIRD copy of "did this operation succeed" -- after the
   * publish and rollback paths. The non-target exclusion was applied to the
   * other two first, and this one kept throwing on any machine with a detected
   * backend that has no MCP implementation (grok, goose, kimi, cursor, ...),
   * so deleting a connector failed and its compensation failed with it.
   *
   * These exercise the lifecycle service directly. The renderer-level suites
   * mock at the IPC boundary and cannot reach this code at all.
   */
  it('archives successfully when the only unsuccessful agents are non-targets', async () => {
    removeResult = {
      success: false, // McpService reports the aggregate; the lifecycle must judge the results itself
      results: [
        { agent: 'wcore:Wayland Core', success: true },
        { agent: 'grok:Grok Build', success: false, unsupported: true, error: 'not supported for backend "grok"' },
        { agent: 'goose:Goose', success: false, unsupported: true, error: 'not supported for backend "goose"' },
      ],
    };

    const lifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);
    const archived = await lifecycle.archiveConfiguredServer('mcp_customer', [
      { backend: 'wcore', name: 'Wayland Core' },
    ]);

    expect(archived.serverId).toBe('mcp_customer');
    expect(active, 'the connector must actually be gone').toEqual([]);
  });

  it('still refuses to archive when a real agent fails alongside non-targets', async () => {
    // Negative control: excluding non-targets must not swallow a genuine
    // removal failure, which would delete the row while leaving the server
    // live in that agent's CLI config.
    removeResult = {
      success: false,
      results: [
        { agent: 'wcore:Wayland Core', success: false, error: 'config locked' },
        { agent: 'grok:Grok Build', success: false, unsupported: true, error: 'not supported for backend "grok"' },
      ],
    };

    const lifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);
    await expect(
      lifecycle.archiveConfiguredServer('mcp_customer', [{ backend: 'wcore', name: 'Wayland Core' }])
    ).rejects.toThrow('config locked');
    expect(active, 'a failed removal must leave the connector in place').toHaveLength(1);
  });

  it('archives the complete definition before removal and restores it disabled without losing secrets or setup', async () => {
    const lifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);
    const archived = await lifecycle.archiveConfiguredServer('mcp_customer', [
      { backend: 'wcore', name: 'Wayland Core' },
    ]);

    expect(active).toEqual([]);
    expect(removeFromAgents).toHaveBeenCalledWith('customer-tools', [{ backend: 'wcore', name: 'Wayland Core' }]);
    expect(archived).not.toHaveProperty('server');
    expect(JSON.stringify(archived)).not.toContain('secret-value');
    expect(await lifecycle.listArchivedServers()).toEqual([archived]);

    const archivePath = path.join(root, 'archives', 'mcp-connectors', 'active', `${archived.archiveId}.json`);
    const record = JSON.parse(await fs.readFile(archivePath, 'utf8')) as { server: IMcpServer; serverDigest: string };
    expect(record.server).toEqual(server());
    expect(record.serverDigest).toMatch(/^sha256:[0-9a-f]{64}$/);

    await lifecycle.restoreArchivedServer(archived.archiveId);
    expect(active).toEqual([
      expect.objectContaining({
        id: 'mcp_customer',
        name: 'customer-tools',
        enabled: false,
        status: 'disconnected',
        transport: server().transport,
        byoOAuth: server().byoOAuth,
        originalJson: server().originalJson,
        allowedTools: ['search', 'extract'],
      }),
    ]);
    expect(await lifecycle.listArchivedServers()).toEqual([]);
    await expect(
      fs.stat(path.join(root, 'archives', 'mcp-connectors', 'restored', `${archived.archiveId}.json`))
    ).resolves.toBeDefined();
  });

  it('retains the active definition and an aborted recovery copy when any adapter removal fails', async () => {
    removeResult = {
      success: false,
      results: [{ agent: 'codex:Codex', success: false, error: 'config locked' }],
    };
    const lifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);

    await expect(
      lifecycle.archiveConfiguredServer('mcp_customer', [{ backend: 'codex', name: 'Codex' }])
    ).rejects.toThrow('config locked');
    expect(active).toEqual([server()]);
    expect(deps.compareAndSetActiveServers).not.toHaveBeenCalled();
    expect(syncToAgents).toHaveBeenCalledWith([server()], [{ backend: 'codex', name: 'Codex' }]);
    expect(await lifecycle.listArchivedServers()).toEqual([]);
    const aborted = await fs.readdir(path.join(root, 'archives', 'mcp-connectors', 'aborted'));
    expect(aborted).toHaveLength(1);
  });

  it('surfaces incomplete publication rollback after an adapter-removal failure', async () => {
    removeResult = {
      success: false,
      results: [{ agent: 'codex:Codex', success: false, error: 'config locked' }],
    };
    syncResult = {
      success: false,
      results: [{ agent: 'wcore:Wayland Core', success: false, error: 'restore refused' }],
    };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const lifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);

    try {
      await expect(
        lifecycle.archiveConfiguredServer('mcp_customer', [{ backend: 'codex', name: 'Codex' }])
      ).rejects.toThrow('rollback publication failed');
      expect(active).toEqual([server()]);
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('does not erase a connector edited while adapter removal is in flight and republishes the newer definition', async () => {
    removeFromAgents.mockImplementationOnce(async () => {
      active = [{ ...server(), description: 'newer user edit', updatedAt: 30 }];
      return removeResult;
    });
    const lifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);

    await expect(
      lifecycle.archiveConfiguredServer('mcp_customer', [{ backend: 'wcore', name: 'Wayland Core' }])
    ).rejects.toThrow('changed while it was being archived');
    expect(active[0].description).toBe('newer user edit');
    expect(syncToAgents).toHaveBeenCalledWith(
      [expect.objectContaining({ description: 'newer user edit', updatedAt: 30 })],
      [{ backend: 'wcore', name: 'Wayland Core' }]
    );
  });

  it('republishes the winning definition when a concurrent edit lands at the active-row CAS', async () => {
    deps.compareAndSetActiveServers = vi.fn(async () => {
      active = [{ ...server(), description: 'CAS winner', updatedAt: 40 }];
      return false;
    });
    const lifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);

    await expect(
      lifecycle.archiveConfiguredServer('mcp_customer', [{ backend: 'wcore', name: 'Wayland Core' }])
    ).rejects.toThrow('changed while it was being archived');
    expect(active[0].description).toBe('CAS winner');
    expect(syncToAgents).toHaveBeenCalledWith(
      [expect.objectContaining({ description: 'CAS winner', updatedAt: 40 })],
      [{ backend: 'wcore', name: 'Wayland Core' }]
    );
  });

  it('republishes the connector and restores active state when config persistence fails after agent removal', async () => {
    let writes = 0;
    deps.compareAndSetActiveServers = vi.fn(async (_expected: IMcpServer[], next: IMcpServer[]) => {
      writes += 1;
      if (writes === 1) throw new Error('disk full');
      active = structuredClone(next);
      return true;
    });
    const lifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);

    await expect(
      lifecycle.archiveConfiguredServer('mcp_customer', [{ backend: 'wcore', name: 'Wayland Core' }])
    ).rejects.toThrow('disk full');
    expect(active).toEqual([server()]);
    expect(syncToAgents).toHaveBeenCalledWith([server()], [{ backend: 'wcore', name: 'Wayland Core' }]);
  });

  it('fails closed when archive content is tampered and leaves the active set unchanged', async () => {
    const lifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);
    const archived = await lifecycle.archiveConfiguredServer('mcp_customer', []);
    const archivePath = path.join(root, 'archives', 'mcp-connectors', 'active', `${archived.archiveId}.json`);
    const record = JSON.parse(await fs.readFile(archivePath, 'utf8')) as { server: IMcpServer };
    record.server.name = 'tampered';
    await fs.writeFile(archivePath, JSON.stringify(record), { mode: 0o600 });

    await expect(lifecycle.restoreArchivedServer(archived.archiveId)).rejects.toThrow('digest mismatch');
    await expect(lifecycle.listArchivedServers()).rejects.toThrow('digest mismatch');
    expect(active).toEqual([]);
  });

  it('keeps a published archive visible when another actor already removed the same active row', async () => {
    removeFromAgents.mockImplementationOnce(async () => {
      active = [];
      return removeResult;
    });
    const lifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);
    const archived = await lifecycle.archiveConfiguredServer('mcp_customer', []);

    expect(await lifecycle.listArchivedServers()).toEqual([archived]);
    expect(syncToAgents).not.toHaveBeenCalled();
  });

  it('rejects an archive-directory symlink without creating files outside the config root', async () => {
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-mcp-outside-'));
    try {
      await fs.symlink(outside, path.join(root, 'archives'));
      const store = new McpConnectorArchiveStore(root);
      await expect(store.publish(server())).rejects.toThrow('Unsafe MCP archive directory');
      expect(await fs.readdir(outside)).toEqual([]);
    } finally {
      await fs.rm(outside, { recursive: true, force: true });
    }
  });

  it('accepts the trusted top-level config symlink used by the macOS CLI-safe path', async () => {
    if (process.platform === 'win32') return;
    const aliasParent = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-mcp-config-alias-'));
    const alias = path.join(aliasParent, 'config');
    try {
      await fs.symlink(root, alias);
      const store = new McpConnectorArchiveStore(alias);
      const archived = await store.publish(server());

      await expect(
        fs.stat(path.join(root, 'archives', 'mcp-connectors', 'active', `${archived.archiveId}.json`))
      ).resolves.toBeDefined();
    } finally {
      await fs.rm(aliasParent, { recursive: true, force: true });
    }
  });

  it('refuses built-in connector archival and restore collisions', async () => {
    active = [server({ builtin: true })];
    const lifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);
    await expect(lifecycle.archiveConfiguredServer('mcp_customer', [])).rejects.toThrow('Built-in');

    active = [server()];
    const separate = new McpConnectorLifecycleService(new McpConnectorArchiveStore(root), deps);
    const archived = await separate.archiveConfiguredServer('mcp_customer', []);
    active = [server({ id: 'other', enabled: false })];
    await expect(separate.restoreArchivedServer(archived.archiveId)).rejects.toThrow('already uses');
  });
});
