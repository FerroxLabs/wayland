/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1018 - concierge-diag loses three sqlite-backed sections under bundled Bun.
 *
 * In a packaged build the diag stdio server is spawned through the resolved JS
 * runtime (`builtinMcpRuntime` rewrites the stored `node` command to the bundled
 * Bun binary). Under Bun, `require('better-sqlite3')` RESOLVES but opening a
 * database throws a catchable `ERR_DLOPEN_FAILED: "better-sqlite3" is not yet
 * supported in Bun`. `openReadonlyDb` caught it and degraded, so the three
 * sqlite-backed readers - scheduledTasks, providers and workspace - all reported
 * "db unavailable" while the tool call still returned a plausible report.
 *
 * This suite reproduces that runtime WITHOUT needing Bun:
 *   - `better-sqlite3` is mocked so its constructor throws the exact Bun error.
 *   - `process.versions.bun` is present.
 *   - A `bun:sqlite`-shaped `Database` constructor is injected the way the real
 *     one is resolved at runtime (`require('bun:sqlite')` inside the server).
 *
 * The FIRST test is the control: with no Bun driver reachable the sections are
 * unavailable, which is exactly the shipped defect and proves the mock really
 * does break better-sqlite3. The rest assert the Bun path restores all three.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** The message Bun actually produces when better-sqlite3's binding is dlopen'd. */
const BUN_DLOPEN_MESSAGE = 'ERR_DLOPEN_FAILED: "better-sqlite3" is not yet supported in Bun';

vi.mock('better-sqlite3', () => ({
  default: class BunHostileBetterSqlite3 {
    constructor() {
      const error = new Error(BUN_DLOPEN_MESSAGE) as Error & { code?: string };
      error.code = 'ERR_DLOPEN_FAILED';
      throw error;
    }
  },
}));

import { createConciergeDiagServer } from '@process/resources/builtinMcp/conciergeDiagServer';

// ---------------------------------------------------------------------------
// A `bun:sqlite`-shaped stand-in. Only the surface the diag readers touch:
//   new Database(path, { readonly: true, create: false })
//   db.query(sql).all()
//   db.close()
// Rows are canned per statement so the assertions below are about the WIRING,
// not about sqlite. The real bun:sqlite path is proven by executing the server
// under Bun (see the issue's acceptance).
// ---------------------------------------------------------------------------

const CRON_ROWS = [
  { name: 'daily-digest', enabled: 1, next_run_at: null, last_run_at: 1_700_000_000_000, last_error: 'boom' },
  {
    name: 'weekly-report',
    enabled: 1,
    next_run_at: 2_000_000_000_000,
    last_run_at: 1_700_000_000_000,
    last_error: null,
  },
];
const PROVIDER_ROWS = [
  { provider_id: 'anthropic', state: 'error', error: '401 unauthorized' },
  { provider_id: 'openai', state: 'connected', error: null },
];
const PROJECT_ROWS = [{ name: 'Sales deck', workspace: '/Users/someone/work/sales' }];
const CONVERSATION_ROWS = [
  { name: 'Throwaway chat', extra: JSON.stringify({ workspace: null, customWorkspace: false }) },
];

/** Every `new Database(...)` this suite saw, so open options can be asserted. */
let opened: Array<{ dbPath: string; options: unknown }> = [];

class FakeBunDatabase {
  constructor(
    readonly dbPath: string,
    readonly options?: unknown
  ) {
    opened.push({ dbPath, options });
  }

  query(sql: string) {
    return {
      all: (): Array<Record<string, unknown>> => {
        if (sql.includes('FROM cron_jobs')) return CRON_ROWS;
        if (sql.includes('FROM model_registry_providers')) return PROVIDER_ROWS;
        if (sql.includes('FROM projects')) return PROJECT_ROWS;
        if (sql.includes('FROM conversations')) return CONVERSATION_ROWS;
        throw new Error(`unexpected statement: ${sql}`);
      },
    };
  }

  close(): void {
    /* no-op */
  }
}

let tmpDir: string;
let dbPath: string;
let originalBunVersion: string | undefined;

beforeEach(() => {
  opened = [];
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'concierge-diag-bun-'));
  // openReadonlyDb refuses a path that does not exist, so the file must be
  // present even though nothing ever parses it here.
  dbPath = path.join(tmpDir, 'wayland.db');
  fs.writeFileSync(dbPath, '');
  originalBunVersion = process.versions.bun;
  Object.defineProperty(process.versions, 'bun', { value: '1.3.14', configurable: true, writable: true });
});

afterEach(() => {
  if (originalBunVersion === undefined) {
    delete (process.versions as Record<string, unknown>).bun;
  } else {
    Object.defineProperty(process.versions, 'bun', { value: originalBunVersion, configurable: true, writable: true });
  }
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

function serverWithBun() {
  return createConciergeDiagServer({
    cronDbPath: dbPath,
    providerDbPath: dbPath,
    workspaceDbPath: dbPath,
    bunSqliteDatabase: FakeBunDatabase as never,
  });
}

describe('concierge-diag under bundled Bun (#1018)', () => {
  it('CONTROL: with no Bun driver reachable, better-sqlite3 really is broken here', () => {
    // No `bunSqliteDatabase` injected and `bun:sqlite` is unresolvable under
    // vitest/Node, so this is the shipped behaviour the issue reports.
    const server = createConciergeDiagServer({
      cronDbPath: dbPath,
      providerDbPath: dbPath,
      workspaceDbPath: dbPath,
    });
    expect(server.scheduledTasks().available).toBe(false);
    expect(server.providers().available).toBe(false);
    expect(server.workspace().available).toBe(false);
  });

  it('reads scheduled tasks through the Bun driver', () => {
    const result = serverWithBun().scheduledTasks();
    expect(result.available).toBe(true);
    expect(result.source).toBe('cron_jobs');
    expect(result.items.map((i) => i.name)).toEqual(['daily-digest', 'weekly-report']);
    expect(result.items.find((i) => i.name === 'daily-digest')?.whyNotRunning).toContain('stuck');
  });

  it('reads providers through the Bun driver, state only', () => {
    const result = serverWithBun().providers();
    expect(result.available).toBe(true);
    expect(result.source).toBe('model_registry_providers');
    expect(result.items.map((i) => i.id)).toEqual(['anthropic', 'openai']);
    expect(result.items.find((i) => i.id === 'anthropic')?.flag).toContain('error');
    expect(result.items.find((i) => i.id === 'openai')?.flag).toBeNull();
  });

  it('reads workspace health through the Bun driver', () => {
    const result = serverWithBun().workspace();
    expect(result.available).toBe(true);
    expect(result.source).toBe('projects + conversations');
    // The conversation carries the app's own customWorkspace=false flag, so it
    // is reported as temporary; the project has a real folder and is not.
    const conversation = result.items.find((i) => i.kind === 'conversation');
    expect(conversation?.isTemporary).toBe(true);
    expect(result.items.find((i) => i.kind === 'project')?.isTemporary).toBe(false);
  });

  it('opens every database read-only and never creates one', () => {
    serverWithBun().overview();
    expect(opened.length).toBeGreaterThan(0);
    for (const open of opened) {
      expect(open.dbPath).toBe(dbPath);
      expect(open.options).toEqual({ readonly: true, create: false });
    }
  });

  it('overview reports all three sqlite sections as available', () => {
    const overview = serverWithBun().overview();
    expect(overview.scheduledTasks.available).toBe(true);
    expect(overview.providers.available).toBe(true);
    expect(overview.workspace.available).toBe(true);
  });
});
