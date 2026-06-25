/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { checkMcpServers } from '@process/doctor/checks/mcpChecks';
import type { IMcpServer } from '@/common/config/storage';

const mcpServer = (over: Partial<IMcpServer>): IMcpServer =>
  ({
    id: over.id ?? 'id',
    name: over.name ?? 'srv',
    enabled: over.enabled ?? true,
    transport: { type: 'stdio', command: 'x', args: [] } as IMcpServer['transport'],
    createdAt: 0,
    updatedAt: 0,
    originalJson: '{}',
    ...over,
  }) as IMcpServer;

describe('checkMcpServers concurrency (#273)', () => {
  it('probes servers concurrently so many hung servers do not sum their timeouts', async () => {
    const servers = Array.from({ length: 6 }, (_, i) => mcpServer({ name: `srv${i}`, id: `srv${i}` }));
    const perServerTimeoutMs = 50;
    const started = Date.now();
    const result = await checkMcpServers({
      listServers: async () => servers,
      // Every server hangs forever — only the per-server timeout resolves them.
      testConnection: async () => new Promise<never>(() => {}),
      perServerTimeoutMs,
    });
    const elapsed = Date.now() - started;
    expect(result.status).toBe('fail');
    expect(result.detail).toContain('6 of 6');
    // Concurrent: total ≈ one per-server timeout. A sequential run would be
    // ~6×50ms=300ms; staying well under that proves the probes overlap, which is
    // what keeps the whole check under the runner's 30s budget for the
    // dozen-plus-server case this fix targets.
    expect(elapsed).toBeLessThan(perServerTimeoutMs * 3);
  });
});
