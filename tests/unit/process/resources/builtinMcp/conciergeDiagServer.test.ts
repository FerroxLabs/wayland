/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import BetterSqlite3 from 'better-sqlite3';
import { createConciergeDiagServer, redact } from '@process/resources/builtinMcp/conciergeDiagServer';
import { describeNativeSqlite } from '../../../helpers/nativeSqlite';

// A realistic-looking secret used to prove redaction across every surface.
const FAKE_SECRET = 'sk-ant-api03-ABCDEF0123456789abcdef0123456789DEADBEEF1234';

/** Encode a config object the way initStorage's JsonFileBuilder writes it. */
function encodeConfig(data: unknown): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

let tmpDir: string;

function tmp(name: string): string {
  return path.join(tmpDir, name);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'concierge-diag-'));
});

afterEach(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

// ---------------------------------------------------------------------------
// redact() — pure helper, no fixtures needed
// ---------------------------------------------------------------------------

describe('redact', () => {
  it('masks an sk- style key to its last 4 chars', () => {
    const out = redact(`key is ${FAKE_SECRET} ok`);
    expect(out).not.toContain(FAKE_SECRET);
    expect(out).toContain('••••1234');
  });

  it('masks long base64/opaque blobs', () => {
    const blob = 'QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVowMTIzNDU2Nzg5YWJj';
    const out = redact(`token=${blob}`);
    expect(out).not.toContain(blob);
    expect(out).toContain('••••');
  });

  // Regression: formats that escaped the original 3-regex redactor (cross-audit
  // HIGH). Each must now be masked, not leaked into diagnostics output.
  it('masks an AWS access key id (no sk- prefix, 20 chars)', () => {
    const k = 'AKIAIOSFODNN7EXAMPLE';
    const out = redact(`provider error: ${k} rejected`);
    expect(out).not.toContain(k);
    expect(out).toContain('••••');
  });

  it('masks a bare 32-char alphanumeric key (e.g. Mistral) under the old 40-char floor', () => {
    const k = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
    const out = redact(`auth failed with ${k}`);
    expect(out).not.toContain(k);
    expect(out).toContain('••••');
  });

  it('masks a fine-grained github_pat_ token', () => {
    const k = 'github_pat_11ABCDEFG0abcdefghij_KLMNOPqrstuvwxyz1234567890ABCDEF';
    const out = redact(`token=${k}`);
    expect(out).not.toContain(k);
  });

  it('masks a base64url token containing - and _ (JWT signature / OAuth)', () => {
    const k = 'aGVsbG8td29ybGQtdGVzdC1zaWduYXR1cmUtX18tLS1hYmM';
    const out = redact(`refresh ${k} done`);
    expect(out).not.toContain(k);
  });

  it('masks a Google 1// refresh token', () => {
    const k = '1//0gABCDEFGHIJKLMNOPQRSTUVWXYZ-_abcdefghij';
    const out = redact(`stored ${k}`);
    expect(out).not.toContain(k);
  });

  it('masks a value following a secret key NAME regardless of shape', () => {
    expect(redact('password: hunter2supersecret')).toContain('••••');
    expect(redact('password: hunter2supersecret')).not.toContain('hunter2supersecret');
    expect(redact('Authorization: Bearer shortishtoken')).not.toContain('shortishtoken');
  });

  it('leaves ordinary text untouched', () => {
    expect(redact('just a normal sentence')).toBe('just a normal sentence');
  });

  it('handles empty strings', () => {
    expect(redact('')).toBe('');
  });
});

// Regression: URL/DSN-embedded credentials and bare delimiter-adjacent tokens
// previously slipped through (cross-audit HIGH — only key-NAMED values were
// masked). These flow from provider `error` / cron `last_error` columns and
// tailed log lines straight into model-visible output.
describe('redact — DSN credentials and delimiter-adjacent tokens', () => {
  it('masks the password in a postgres DSN', () => {
    const out = redact('postgres://admin:s3cr3t@db');
    expect(out).not.toContain('s3cr3t');
    expect(out).toContain('••••');
    // scheme/user/host are preserved (only the password is masked).
    expect(out).toContain('postgres://admin:');
    expect(out).toContain('@db');
  });

  it('masks the password in a redis DSN', () => {
    const out = redact('redis://default:p4ssw0rd@cache');
    expect(out).not.toContain('p4ssw0rd');
    expect(out).toContain('••••');
  });

  // SEC-2: colon-less userinfo (`scheme://TOKEN@host`) — the token IS the
  // userinfo, no user:pass split, so the colon-based DSN rule misses it.
  it('masks a colon-less URL userinfo token (scheme://TOKEN@host)', () => {
    const out = redact('clone from https://ghp_abcdef0123456789tokenval@github.com/o/r.git');
    expect(out).not.toContain('ghp_abcdef0123456789tokenval');
    expect(out).toContain('••••');
    // scheme + host preserved.
    expect(out).toContain('https://');
    expect(out).toContain('@github.com');
  });

  it('does not mangle an ordinary @-free URL', () => {
    expect(redact('see https://github.com/owner/repo for details')).toBe(
      'see https://github.com/owner/repo for details'
    );
  });

  it('masks the password in a mongodb DSN with symbols', () => {
    const out = redact('mongodb://root:Hunter2!@10.0.0.5/db');
    expect(out).not.toContain('Hunter2!');
    expect(out).toContain('••••');
  });

  it('masks the password in an amqp DSN', () => {
    const out = redact('amqp://svc:rabbitMQpw@broker');
    expect(out).not.toContain('rabbitMQpw');
    expect(out).toContain('••••');
  });

  it('masks a DSN password embedded in an error string', () => {
    const out = redact('ECONNREFUSED postgres://user:passW0rd123@host/db');
    expect(out).not.toContain('passW0rd123');
    expect(out).toContain('••••');
  });

  it('masks a bare delimiter-adjacent token with no secret key name', () => {
    // `ref` is NOT a known secret key NAME, so the key-name rule does not fire
    // and the 16-char run is too short for the base64/hex shape rules — only the
    // generic delimiter-adjacent rule catches it.
    const out = redact('ref=abcdef1234567890');
    expect(out).not.toContain('abcdef1234567890');
    expect(out).toContain('••••');
  });

  it('still masks the existing key-named control', () => {
    const out = redact('x-api-key: abcdefghijkl');
    expect(out).not.toContain('abcdefghijkl');
    expect(out).toContain('••••');
  });

  // NEGATIVE cases: ordinary prose / short words must not be mangled.
  it('does not mangle an ordinary sentence with no secrets', () => {
    expect(redact('the build failed after 3 retries')).toBe('the build failed after 3 retries');
  });

  it('does not mangle a short timestamp with colons', () => {
    expect(redact('user logged in at 12:30:45 today')).toBe('user logged in at 12:30:45 today');
  });
});

// ---------------------------------------------------------------------------
// MCP health + read-only shape — config JSON only (no sqlite needed)
// ---------------------------------------------------------------------------

describe('createConciergeDiagServer — MCP health (config JSON)', () => {
  it('flags an enabled server that exposes 0 tools and redacts its lastError', () => {
    const configPath = tmp('wayland-config.txt');
    fs.writeFileSync(
      configPath,
      encodeConfig({
        'mcp.config': [
          {
            id: 'a',
            name: 'broken-server',
            enabled: true,
            tools: [],
            status: 'error',
            lastError: `auth failed with ${FAKE_SECRET}`,
          },
          {
            id: 'b',
            name: 'healthy-server',
            enabled: true,
            tools: [{ name: 't1' }, { name: 't2' }],
            status: 'connected',
          },
          {
            id: 'c',
            name: 'disabled-server',
            enabled: false,
            tools: [],
          },
        ],
      })
    );

    const server = createConciergeDiagServer({ configPath });
    const result = server.mcpHealth();

    expect(result.available).toBe(true);
    const broken = result.items.find((s) => s.name === 'broken-server');
    expect(broken?.flag).toContain('0 tools');
    // Secret in lastError must be masked.
    expect(JSON.stringify(result)).not.toContain(FAKE_SECRET);
    expect(broken?.lastError).toContain('••••1234');

    const healthy = result.items.find((s) => s.name === 'healthy-server');
    expect(healthy?.toolCount).toBe(2);
    expect(healthy?.flag).toBeNull();

    // Disabled servers with 0 tools are not flagged.
    const disabled = result.items.find((s) => s.name === 'disabled-server');
    expect(disabled?.flag).toBeNull();
  });

  it('degrades gracefully when the config path is missing', () => {
    const server = createConciergeDiagServer({ configPath: tmp('does-not-exist.txt') });
    const result = server.mcpHealth();
    expect(result.available).toBe(false);
    expect(result.items).toEqual([]);
  });

  it('accepts plain-JSON config as a fallback encoding', () => {
    const configPath = tmp('plain.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ 'mcp.config': [{ id: 'p', name: 'plain', enabled: true, tools: [{ name: 'x' }] }] })
    );
    const server = createConciergeDiagServer({ configPath });
    const result = server.mcpHealth();
    expect(result.available).toBe(true);
    expect(result.items[0].toolCount).toBe(1);
  });

  it('reports unavailable when mcp.config is not an array', () => {
    const configPath = tmp('no-mcp.txt');
    fs.writeFileSync(configPath, encodeConfig({ 'other.key': 1 }));
    const server = createConciergeDiagServer({ configPath });
    const result = server.mcpHealth();
    expect(result.available).toBe(false);
    expect(result.items).toEqual([]);
  });

  it('returns unavailable for an empty config file', () => {
    const configPath = tmp('empty.txt');
    fs.writeFileSync(configPath, '');
    const server = createConciergeDiagServer({ configPath });
    expect(server.mcpHealth().available).toBe(false);
  });

  it('exposes only read-only methods — no mutation method exists', () => {
    const server = createConciergeDiagServer({});
    const writeLike = /set|write|update|insert|delete|create|mutat|put|remove|save|patch/i;
    for (const [key, value] of Object.entries(server)) {
      if (typeof value === 'function') {
        expect(key).not.toMatch(writeLike);
      }
    }
    // The exact read-only surface.
    expect(Object.keys(server).sort()).toEqual(
      [
        'agentInstalls',
        'configPaths',
        'mcpHealth',
        'name',
        'overview',
        'providers',
        'recentErrors',
        'scheduledTasks',
        'tvControl',
        'voice',
        'workspace',
      ].sort()
    );
  });

  it('overview never throws when every source is missing', () => {
    const server = createConciergeDiagServer({});
    const result = server.overview();
    expect(result.scheduledTasks.available).toBe(false);
    expect(result.mcp.available).toBe(false);
    expect(result.providers.available).toBe(false);
    expect(result.recentErrors.available).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// recentErrors — log dir only (no sqlite needed)
// ---------------------------------------------------------------------------

describe('createConciergeDiagServer — recentErrors (logs)', () => {
  it('tails error lines and redacts secrets in them', () => {
    const logDir = tmp('logs');
    fs.mkdirSync(logDir);
    fs.writeFileSync(
      path.join(logDir, 'main.log'),
      [
        'info: everything is fine',
        `error: provider rejected token ${FAKE_SECRET}`,
        'debug: noise',
        'WARN: cron missed a beat',
      ].join('\n')
    );

    const server = createConciergeDiagServer({ logDir });
    const result = server.recentErrors();

    expect(result.available).toBe(true);
    expect(result.lines.some((l) => l.includes('provider rejected'))).toBe(true);
    expect(result.lines.some((l) => l.toLowerCase().includes('cron missed'))).toBe(true);
    expect(result.lines.some((l) => l.includes('everything is fine'))).toBe(false);
    expect(JSON.stringify(result)).not.toContain(FAKE_SECRET);
  });

  it('degrades gracefully when the log dir is missing', () => {
    const server = createConciergeDiagServer({ logDir: tmp('no-logs') });
    const result = server.recentErrors();
    expect(result.available).toBe(false);
    expect(result.lines).toEqual([]);
  });

  // SECURITY: home-directory paths / OS usernames embedded in log CONTENT (not
  // just `source` metadata) must be scrubbed before they reach the model. The
  // username segment is the leak — `/Users/<name>`, `C:\Users\<name>`.
  it('scrubs home/username paths embedded in tailed log lines', () => {
    const logDir = tmp('logs-home');
    fs.mkdirSync(logDir);
    fs.writeFileSync(
      path.join(logDir, 'main.log'),
      [
        'error: cannot read /Users/alice/Library/wayland/config.json',
        'error: spawn failed for C:\\Users\\alice\\AppData\\Roaming\\wayland',
      ].join('\n')
    );

    const server = createConciergeDiagServer({ logDir });
    const result = server.recentErrors();
    const serialized = JSON.stringify(result);

    expect(result.available).toBe(true);
    // The username must not survive in any form.
    expect(serialized).not.toContain('/Users/alice');
    expect(serialized).not.toContain('C:\\Users\\alice');
    expect(serialized).not.toContain('alice');
    // The path shape is preserved with the username masked.
    expect(serialized).toContain('/Users/<user>');
    expect(serialized).toContain('C:\\\\Users\\\\<user>');
  });

  // #1038: readdirSync returns directory order, so keeping the FIRST
  // MAX_LOG_FILES entries dropped the newest logs and the section reported
  // stale lines as "recent".
  //
  // The fixture puts the NEWEST files in the MIDDLE of the alphabet on purpose.
  // An earlier version named them so the newest sorted last, on the reasoning
  // that any implementation taking "the first six" would lose them. That only
  // held for a FORWARD directory order: reversed, the newest two land first and
  // the buggy slice keeps them, so the test passed against the bug. Measured
  // across 200 shuffled orders, the buggy implementation survived 28 of them.
  // With the newest in the middle, neither direction can reach them by accident.
  it('reports the NEWEST log files, not whichever the directory listed first', () => {
    const logDir = tmp('logs-rotating');
    fs.mkdirSync(logDir);
    const base = Date.UTC(2026, 0, 1) / 1000;
    // Alphabetical position is deliberately uncorrelated with age: the `m` pair
    // is newest, the `z` block is middle-aged, the `a` block is oldest.
    const fixture = [
      ...Array.from({ length: 6 }, (_, i) => ({ name: `a${i + 1}`, ageHours: i + 1 })),
      ...Array.from({ length: 6 }, (_, i) => ({ name: `z${i + 1}`, ageHours: i + 10 })),
      { name: 'm1', ageHours: 20 },
      { name: 'm2', ageHours: 21 },
    ];
    for (const { name, ageHours } of fixture) {
      const file = path.join(logDir, `${name}.log`);
      fs.writeFileSync(file, `error: marker for ${name}\n`);
      const when = base + ageHours * 3600;
      fs.utimesSync(file, when, when);
    }

    const server = createConciergeDiagServer({ logDir });
    const result = server.recentErrors();
    const joined = result.lines.join('\n');

    expect(result.available).toBe(true);
    // The six newest by mtime, and nothing else: m2, m1, then z6 down to z3.
    for (const name of ['m2', 'm1', 'z6', 'z5', 'z4', 'z3']) {
      expect(joined).toContain(`marker for ${name}`);
    }
    // Everything older fell outside MAX_LOG_FILES. The `a` block is first in
    // directory order, which is exactly what the old implementation kept.
    for (const name of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'z1', 'z2']) {
      expect(joined).not.toContain(`marker for ${name}`);
    }
  });

  // The trailing MAX_LOG_LINES slice only means "most recent" if the files are
  // walked oldest-first. Otherwise a truncated section keeps the OLDEST lines
  // and discards the newest, which is the same defect one layer down and the
  // half a user actually feels.
  //
  // An earlier version of this test used two files of one line each. That
  // proved the ordering but never activated the slice at all, because two
  // matching lines against MAX_LOG_LINES of 40 makes `slice(-40)` a no-op, so
  // the assertion in the name was not the assertion being made. This fixture
  // carries 60 matching lines so truncation genuinely fires, and the newer file
  // sorts FIRST alphabetically so directory order alone would put its lines at
  // the front, where the tail slice throws them away.
  it('orders collected lines oldest-first so a truncated tail keeps the newest', () => {
    const logDir = tmp('logs-order');
    fs.mkdirSync(logDir);
    const base = Date.UTC(2026, 0, 1) / 1000;
    const LINES_PER_FILE = 30;
    for (const [name, ageHours] of [
      ['a-newer', 2],
      ['b-older', 1],
    ] as const) {
      const body = Array.from(
        { length: LINES_PER_FILE },
        (_, i) => `error: ${name} entry ${i}`
      ).join('\n');
      const file = path.join(logDir, `${name}.log`);
      fs.writeFileSync(file, `${body}\n`);
      const when = base + ageHours * 3600;
      fs.utimesSync(file, when, when);
    }

    const server = createConciergeDiagServer({ logDir });
    const lines = server.recentErrors().lines;

    // Truncation really happened: 60 matching lines in, MAX_LOG_LINES out.
    expect(lines).toHaveLength(40);
    // What survived the tail slice is the NEWER file, not the older one.
    const newerKept = lines.filter((line) => line.includes('a-newer entry')).length;
    const olderKept = lines.filter((line) => line.includes('b-older entry')).length;
    expect(newerKept).toBe(LINES_PER_FILE);
    expect(olderKept).toBe(40 - LINES_PER_FILE);
    // And the newest line of all is the last one retained.
    expect(lines.at(-1)).toContain(`a-newer entry ${LINES_PER_FILE - 1}`);
  });
});

// ---------------------------------------------------------------------------
// Observability — a real load failure must be visible (not silently swallowed),
// while a legitimately-missing source stays quiet. (cross-audit HIGH)
// ---------------------------------------------------------------------------

describe('createConciergeDiagServer — config observability', () => {
  it('emits a diagnostic when the config is present but undecodable', () => {
    const configPath = tmp('garbage-config.txt');
    // Exists and non-empty, but neither base64(JSON) nor plain JSON.
    fs.writeFileSync(configPath, 'not base64 @@@ not json');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const server = createConciergeDiagServer({ configPath });
      const result = server.mcpHealth();
      expect(result.available).toBe(false);
      expect(errSpy).toHaveBeenCalled();
    } finally {
      errSpy.mockRestore();
    }
  });

  it('stays silent when the config path is simply missing', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const server = createConciergeDiagServer({ configPath: tmp('absent.txt') });
      expect(server.mcpHealth().available).toBe(false);
      expect(errSpy).not.toHaveBeenCalled();
    } finally {
      errSpy.mockRestore();
    }
  });
});

describeNativeSqlite('createConciergeDiagServer — db observability', () => {
  it('emits a redacted diagnostic when a db path is set but unopenable', () => {
    // A directory exists but cannot be opened as a SQLite file → open throws.
    const badDb = tmp('not-a-db-dir');
    fs.mkdirSync(badDb);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const server = createConciergeDiagServer({ providerDbPath: badDb });
      const result = server.providers();
      expect(result.available).toBe(false);
      expect(errSpy).toHaveBeenCalled();
    } finally {
      errSpy.mockRestore();
    }
  });

  it('stays silent when the db path is simply missing', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const server = createConciergeDiagServer({ providerDbPath: tmp('missing.db') });
      const result = server.providers();
      expect(result.available).toBe(false);
      expect(errSpy).not.toHaveBeenCalled();
    } finally {
      errSpy.mockRestore();
    }
  });
});

// ---------------------------------------------------------------------------
// Home-directory scrub — `source` strings must not disclose the OS username.
// ---------------------------------------------------------------------------

describe('createConciergeDiagServer — source path scrubbing', () => {
  it('renders a home-dir path as ~ and never leaks the literal home', () => {
    const home = os.homedir();
    const logDir = path.join(home, '.wayland-concierge-diag-absent');
    const server = createConciergeDiagServer({ logDir });
    const result = server.recentErrors();
    expect(result.available).toBe(false);
    expect(result.source).toContain('~');
    expect(result.source).not.toContain(home);
  });
});

// ---------------------------------------------------------------------------
// Scheduled tasks + providers — require the native better-sqlite3 driver
// ---------------------------------------------------------------------------

function makeCronDb(dbPath: string): void {
  const db = new BetterSqlite3(dbPath);
  db.exec(
    `CREATE TABLE cron_jobs (
       id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       enabled INTEGER NOT NULL,
       next_run_at INTEGER,
       last_run_at INTEGER,
       last_error TEXT
     )`
  );
  const insert = db.prepare(
    'INSERT INTO cron_jobs (id, name, enabled, next_run_at, last_run_at, last_error) VALUES (?, ?, ?, ?, ?, ?)'
  );
  // Enabled but last run errored AND no next run → stuck.
  insert.run('1', 'daily-digest', 1, null, 1_700_000_000_000, `boom from ${FAKE_SECRET}`);
  // Healthy enabled job → no whyNotRunning.
  insert.run('2', 'weekly-report', 1, 2_000_000_000_000, 1_700_000_000_000, null);
  // Disabled job.
  insert.run('3', 'paused-job', 0, null, null, null);
  // Enabled, errored, but still has a next run scheduled → retry message.
  insert.run('4', 'retrying-job', 1, 2_000_000_000_000, 1_700_000_000_000, 'transient timeout');
  // Enabled, no error, but no next run → no-next-run message.
  insert.run('5', 'no-next-job', 1, null, 1_700_000_000_000, null);
  db.close();
}

function makeProviderDb(dbPath: string): void {
  const db = new BetterSqlite3(dbPath);
  db.exec(
    `CREATE TABLE model_registry_providers (
       provider_id TEXT PRIMARY KEY,
       connected_via TEXT,
       state TEXT NOT NULL,
       error TEXT,
       creds_encrypted TEXT,
       created_at INTEGER,
       updated_at INTEGER
     )`
  );
  const insert = db.prepare(
    `INSERT INTO model_registry_providers
       (provider_id, connected_via, state, error, creds_encrypted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  // A provider in error state, with a secret stashed in creds_encrypted that
  // must NEVER surface (and a secret in the error string that must be masked).
  insert.run('anthropic', 'api-key', 'error', `401 unauthorized ${FAKE_SECRET}`, FAKE_SECRET, 1, 2);
  // A healthy connected provider.
  insert.run('openai', 'api-key', 'connected', null, FAKE_SECRET, 1, 2);
  db.close();
}

describeNativeSqlite('createConciergeDiagServer — scheduled tasks (cron sqlite)', () => {
  it('derives whyNotRunning for stuck jobs and leaves healthy jobs null', () => {
    const cronDbPath = tmp('wayland.db');
    makeCronDb(cronDbPath);

    const server = createConciergeDiagServer({ cronDbPath });
    const result = server.scheduledTasks();

    expect(result.available).toBe(true);

    const digest = result.items.find((j) => j.name === 'daily-digest');
    expect(digest?.whyNotRunning).toBeTruthy();
    expect(digest?.whyNotRunning).toContain('stuck');
    // Secret embedded in the lastError is masked everywhere.
    expect(JSON.stringify(result)).not.toContain(FAKE_SECRET);
    expect(digest?.lastError).toContain('••••1234');

    const weekly = result.items.find((j) => j.name === 'weekly-report');
    expect(weekly?.whyNotRunning).toBeNull();

    const paused = result.items.find((j) => j.name === 'paused-job');
    expect(paused?.whyNotRunning).toContain('disabled');

    const retrying = result.items.find((j) => j.name === 'retrying-job');
    expect(retrying?.whyNotRunning).toContain('retry');

    const noNext = result.items.find((j) => j.name === 'no-next-job');
    expect(noNext?.whyNotRunning).toContain('no next run');
  });

  it('degrades gracefully when the cron db is missing', () => {
    const server = createConciergeDiagServer({ cronDbPath: tmp('missing.db') });
    const result = server.scheduledTasks();
    expect(result.available).toBe(false);
    expect(result.items).toEqual([]);
  });
});

describeNativeSqlite('createConciergeDiagServer — providers (sqlite, state only)', () => {
  it('reports provider state + error but NEVER the encrypted credentials', () => {
    const providerDbPath = tmp('providers.db');
    makeProviderDb(providerDbPath);

    const server = createConciergeDiagServer({ providerDbPath });
    const result = server.providers();

    expect(result.available).toBe(true);

    const anthropic = result.items.find((p) => p.id === 'anthropic');
    expect(anthropic?.state).toBe('error');
    expect(anthropic?.flag).toBeTruthy();

    const openai = result.items.find((p) => p.id === 'openai');
    expect(openai?.state).toBe('connected');
    expect(openai?.flag).toBeNull();

    // No credentials column or full secret anywhere in the output.
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(FAKE_SECRET);
    expect(serialized).not.toContain('creds');
    expect(serialized).not.toContain('credsEncrypted');
  });

  // SECURITY: a home/username path stored in the `error` column must be scrubbed
  // — these strings flow through sanitize() only, never an explicit scrubHome().
  it('scrubs home/username paths in the provider error column', () => {
    const providerDbPath = tmp('providers-home.db');
    const db = new BetterSqlite3(providerDbPath);
    db.exec(
      `CREATE TABLE model_registry_providers (
         provider_id TEXT PRIMARY KEY,
         connected_via TEXT,
         state TEXT NOT NULL,
         error TEXT,
         creds_encrypted TEXT,
         created_at INTEGER,
         updated_at INTEGER
       )`
    );
    db.prepare(
      `INSERT INTO model_registry_providers
         (provider_id, connected_via, state, error, creds_encrypted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run('local', 'self-hosted', 'error', 'ENOENT: missing /Users/alice/.wayland/model.gguf', null, 1, 2);
    db.close();

    const server = createConciergeDiagServer({ providerDbPath });
    const serialized = JSON.stringify(server.providers());

    expect(serialized).not.toContain('/Users/alice');
    expect(serialized).not.toContain('alice');
    expect(serialized).toContain('/Users/<user>');
  });
});

describeNativeSqlite('createConciergeDiagServer — overview (all sources wired)', () => {
  it('combines every section into one snapshot', () => {
    const cronDbPath = tmp('wayland.db');
    const providerDbPath = tmp('providers.db');
    const configPath = tmp('wayland-config.txt');
    makeCronDb(cronDbPath);
    makeProviderDb(providerDbPath);
    fs.writeFileSync(configPath, encodeConfig({ 'mcp.config': [{ id: 'x', name: 'srv', enabled: true, tools: [] }] }));

    const server = createConciergeDiagServer({ cronDbPath, providerDbPath, configPath });
    const result = server.overview();

    expect(result.scheduledTasks.available).toBe(true);
    expect(result.providers.available).toBe(true);
    expect(result.mcp.available).toBe(true);
    expect(result.mcp.items[0].flag).toContain('0 tools');
    expect(JSON.stringify(result)).not.toContain(FAKE_SECRET);
  });
});

// ---------------------------------------------------------------------------
// Workspace health — flags projects/conversations on throwaway temp dirs
// ---------------------------------------------------------------------------

function makeWorkspaceDb(dbPath: string): void {
  const db = new BetterSqlite3(dbPath);
  db.exec(
    `CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, workspace TEXT);
     CREATE TABLE conversations (id TEXT PRIMARY KEY, name TEXT NOT NULL, extra TEXT, updated_at INTEGER);`
  );
  const proj = db.prepare('INSERT INTO projects (id, name, workspace) VALUES (?, ?, ?)');
  proj.run('p1', 'no-workspace-project', ''); // empty -> temp fallback
  proj.run('p2', 'real-project', '/Users/someone/Documents/real-project'); // persistent
  // A real user folder whose name happens to contain "-temp-" + a short year/
  // counter suffix must NOT be mistaken for an engine temp dir (needs >=10 digits).
  proj.run('p3', 'year-suffixed-project', '/Users/someone/Documents/client-temp-2024');
  const conv = db.prepare('INSERT INTO conversations (id, name, extra, updated_at) VALUES (?, ?, ?, ?)');
  conv.run(
    'c1',
    'temp-chat',
    JSON.stringify({ workspace: '/Users/someone/.wayland/wcore-temp-1782747314076', customWorkspace: false }),
    2000
  );
  conv.run(
    'c2',
    'real-chat',
    JSON.stringify({ workspace: '/Users/someone/Documents/real-project', customWorkspace: true }),
    1000
  );
  db.close();
}

describeNativeSqlite('createConciergeDiagServer — workspace health', () => {
  it('flags empty-workspace projects and temp-workspace conversations, not real ones', () => {
    const workspaceDbPath = tmp('wayland.db');
    makeWorkspaceDb(workspaceDbPath);

    const server = createConciergeDiagServer({ workspaceDbPath });
    const result = server.workspace();

    expect(result.available).toBe(true);

    const noWs = result.items.find((i) => i.name === 'no-workspace-project');
    expect(noWs?.isTemporary).toBe(true);
    expect(noWs?.whyProblem).toContain('no persistent workspace');

    const realProj = result.items.find((i) => i.name === 'real-project');
    expect(realProj?.isTemporary).toBe(false);
    expect(realProj?.whyProblem).toBeNull();

    // Regression: a "-temp-<year>" folder name is a real user dir, not an engine
    // temp dir (which uses a >=10-digit Date.now() timestamp).
    const yearProj = result.items.find((i) => i.name === 'year-suffixed-project');
    expect(yearProj?.isTemporary).toBe(false);
    expect(yearProj?.whyProblem).toBeNull();

    const tempChat = result.items.find((i) => i.name === 'temp-chat');
    expect(tempChat?.isTemporary).toBe(true);
    expect(tempChat?.whyProblem).toContain('temporary workspace');

    // A conversation with customWorkspace:true and a real path is NOT reported.
    expect(result.items.find((i) => i.name === 'real-chat')).toBeUndefined();
  });

  it('degrades gracefully when the workspace db is missing', () => {
    const server = createConciergeDiagServer({ workspaceDbPath: tmp('missing.db') });
    const result = server.workspace();
    expect(result.available).toBe(false);
    expect(result.items).toEqual([]);
  });
});

describe('createConciergeDiagServer — config paths', () => {
  it('reports app + engine config dirs (home-scrubbed) with the two-paths note', () => {
    const server = createConciergeDiagServer({
      appConfigDir: '/Users/someone/Library/Application Support/Wayland/config',
      engineConfigDir: '/Users/someone/.config/wayland-core',
    });
    const result = server.configPaths();

    expect(result.available).toBe(true);
    expect(result.info.appConfigDir).toContain('Wayland/config');
    expect(result.info.engineConfigDir).toContain('wayland-core');
    expect(result.info.note).toContain('two separate config locations');
    // Username must be scrubbed from both paths.
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('/Users/someone');
  });

  it('falls back to the config-file directory when appConfigDir is unset', () => {
    const server = createConciergeDiagServer({ configPath: '/Users/someone/cfg/wayland-config.txt' });
    const result = server.configPaths();
    expect(result.available).toBe(true);
    expect(result.info.appConfigDir).toContain('/cfg');
  });
});

// ---------------------------------------------------------------------------
// Platform / architecture — the "why is Wayland slow on my new Mac" answer
// ---------------------------------------------------------------------------

describe('createConciergeDiagServer — platform architecture', () => {
  it('flags an x64 build running under ARM64 translation in the overview', () => {
    const server = createConciergeDiagServer({ appArch: 'x64', runningUnderARM64Translation: true });
    const { platform } = server.overview();

    expect(platform.available).toBe(true);
    expect(platform.info.appArch).toBe('x64');
    expect(platform.info.runningUnderARM64Translation).toBe(true);
    expect(platform.info.whyProblem).toContain('translation');
  });

  it('reports no problem when the build runs natively', () => {
    const server = createConciergeDiagServer({ appArch: 'arm64', runningUnderARM64Translation: false });
    const { platform } = server.overview();

    expect(platform.available).toBe(true);
    expect(platform.info.appArch).toBe('arm64');
    expect(platform.info.runningUnderARM64Translation).toBe(false);
    expect(platform.info.whyProblem).toBeNull();
  });

  it('reads the injected env vars when no deps are passed', () => {
    const prevArch = process.env.WAYLAND_APP_ARCH;
    const prevTranslated = process.env.WAYLAND_ARM64_TRANSLATED;
    process.env.WAYLAND_APP_ARCH = 'x64';
    process.env.WAYLAND_ARM64_TRANSLATED = '1';
    try {
      const { platform } = createConciergeDiagServer({}).overview();
      expect(platform.info.appArch).toBe('x64');
      expect(platform.info.runningUnderARM64Translation).toBe(true);
    } finally {
      if (prevArch === undefined) delete process.env.WAYLAND_APP_ARCH;
      else process.env.WAYLAND_APP_ARCH = prevArch;
      if (prevTranslated === undefined) delete process.env.WAYLAND_ARM64_TRANSLATED;
      else process.env.WAYLAND_ARM64_TRANSLATED = prevTranslated;
    }
  });

  it('degrades to unavailable when the app runtime was never injected', () => {
    const prevArch = process.env.WAYLAND_APP_ARCH;
    const prevTranslated = process.env.WAYLAND_ARM64_TRANSLATED;
    delete process.env.WAYLAND_APP_ARCH;
    delete process.env.WAYLAND_ARM64_TRANSLATED;
    try {
      const { platform } = createConciergeDiagServer({}).overview();
      expect(platform.available).toBe(false);
      expect(platform.info.appArch).toBeNull();
      expect(platform.info.whyProblem).toBeNull();
    } finally {
      if (prevArch !== undefined) process.env.WAYLAND_APP_ARCH = prevArch;
      if (prevTranslated !== undefined) process.env.WAYLAND_ARM64_TRANSLATED = prevTranslated;
    }
  });
});
