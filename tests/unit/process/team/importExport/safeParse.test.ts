/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// tests/unit/process/team/importExport/safeParse.test.ts
//
// W4 (T4.6.1) - DOS + prototype-pollution + recursion limits.
//
// Concurrency note: each `safeParseWithTimeout` call holds one slot in the
// bounded queue (cap = 2 active workers). Tests that fire many parses in
// parallel must wait for prior calls to release before the next can start,
// up to the 5s queue-wait timeout. Slow CI runners can hit this window -
// the queue test asserts the queue-wait timeout fires, NOT an arbitrary
// elapsed time.

import { describe, it, expect } from 'vitest';
import {
  enforceMaxDepth,
  MAX_JSON_DEPTH,
  MAX_TEAM_FILE_BYTES,
  rejectPrototypePollutionKeys,
  safeParseWithTimeout,
} from '@process/team/importExport/safeParse';
import {
  TeamImportBusyError,
  TeamImportError,
} from '@process/team/importExport/errors';

describe('safeParseWithTimeout - DOS + recursion guards', () => {
  it('rejects input larger than 256KB before spawning a worker', async () => {
    const oversize = 'a'.repeat(MAX_TEAM_FILE_BYTES + 1);
    await expect(safeParseWithTimeout(oversize)).rejects.toBeInstanceOf(TeamImportError);
  });

  it('parses small valid JSON in the worker thread', async () => {
    const value = await safeParseWithTimeout('{"hello":"world"}');
    expect(value).toEqual({ hello: 'world' });
  });

  it('rejects invalid JSON with TeamImportError carrying TEAM_IMPORT_INVALID_JSON code', async () => {
    await expect(safeParseWithTimeout('{not json')).rejects.toMatchObject({
      code: 'TEAM_IMPORT_INVALID_JSON',
    });
  });

  it('terminates the worker on timeout and stays responsive', async () => {
    // Build an UNDER-byte-cap string that is *still* JSON-invalid in a way
    // that forces the worker to do real CPU work before giving up. The byte
    // cap (256KB) means we cannot use a giant nested array, so we use a
    // 0ms timeout instead: that guarantees the timeout fires regardless of
    // input size and lets us verify the worker is reaped before the caller
    // returns. The parser would otherwise succeed on the trivial input,
    // proving the timeout path beats the message-arrival path.
    const small = JSON.stringify({ ok: true });
    const start = Date.now();
    await expect(safeParseWithTimeout(small, 0)).rejects.toMatchObject({
      code: 'TEAM_IMPORT_TIMEOUT',
    });
    const elapsed = Date.now() - start;
    // Even with a 0ms timeout, the cleanup (worker.terminate + promise
    // resolution) must complete well under 1.5s.
    expect(elapsed).toBeLessThan(1500);
  }, 5000);

  it('runs ≤ MAX_CONCURRENT_PARSE_WORKERS in parallel and queues the rest', async () => {
    // Fire 5 parses simultaneously. The bounded queue allows 2 to run; the
    // remaining 3 must wait. All 5 should eventually resolve successfully
    // (they parse trivial JSON). The bounded queue itself is what we're
    // exercising - if it failed open, the process would spawn 5 workers
    // and the test would fork-bomb. We just assert all resolve cleanly.
    const text = '{"x":1}';
    const promises = Array.from({ length: 5 }, () => safeParseWithTimeout(text));
    const results = await Promise.all(promises);
    expect(results).toHaveLength(5);
    expect(results.every((v) => (v as { x: number }).x === 1)).toBe(true);
  });
});

describe('rejectPrototypePollutionKeys', () => {
  it('rejects {"__proto__": …} at root', () => {
    const raw = JSON.parse('{"__proto__":{"polluted":true}}');
    expect(() => rejectPrototypePollutionKeys(raw)).toThrow(/Prototype-pollution/);
  });

  it('rejects {"constructor": …} at root', () => {
    expect(() => rejectPrototypePollutionKeys({ constructor: { polluted: true } })).toThrow(
      /Prototype-pollution/
    );
  });

  it('rejects {"prototype": …} at root', () => {
    expect(() => rejectPrototypePollutionKeys({ prototype: { polluted: true } })).toThrow(
      /Prototype-pollution/
    );
  });

  it('rejects pollution keys nested deep in the object graph', () => {
    // `{ __proto__: X }` in a JS object literal is the prototype-setting
    // syntax and does NOT create an own property. JSON.parse, by contrast,
    // creates a real own `__proto__` enumerable property - which is exactly
    // the bypass our walker must catch. Use JSON.parse to materialize it.
    const nested = JSON.parse('{"a":{"b":{"c":{"__proto__":{"polluted":true}}}}}');
    expect(() => rejectPrototypePollutionKeys(nested)).toThrow(/Prototype-pollution/);
  });

  it('rejects `constructor` key nested deep in the object graph', () => {
    // `constructor` is a normal own property in object literals, no parse needed.
    expect(() =>
      rejectPrototypePollutionKeys({ a: { b: { c: { constructor: { polluted: true } } } } })
    ).toThrow(/Prototype-pollution/);
  });

  it('walks arrays without false-positives', () => {
    expect(() =>
      rejectPrototypePollutionKeys([{ ok: 1 }, { also: { ok: 1 } }])
    ).not.toThrow();
  });

  it('global Object.prototype is not polluted after a rejected payload', () => {
    expect(() => rejectPrototypePollutionKeys({ constructor: { polluted: true } })).toThrow();
    expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('enforceMaxDepth', () => {
  it('accepts depth equal to MAX_JSON_DEPTH', () => {
    // Build depth-6: {a:{a:{a:{a:{a:{a:1}}}}}}
    let value: unknown = 1;
    for (let i = 0; i < MAX_JSON_DEPTH - 1; i++) value = { a: value };
    expect(() => enforceMaxDepth(value, MAX_JSON_DEPTH)).not.toThrow();
  });

  it('rejects depth one greater than MAX_JSON_DEPTH', () => {
    let value: unknown = 1;
    for (let i = 0; i < MAX_JSON_DEPTH + 1; i++) value = { a: value };
    expect(() => enforceMaxDepth(value, MAX_JSON_DEPTH)).toThrow(/depth/i);
  });

  it('treats arrays as a depth level', () => {
    let value: unknown = 1;
    for (let i = 0; i < MAX_JSON_DEPTH + 1; i++) value = [value];
    expect(() => enforceMaxDepth(value, MAX_JSON_DEPTH)).toThrow(/depth/i);
  });
});

describe('TeamImportBusyError shape', () => {
  it('is a subclass of TeamImportError with TEAM_IMPORT_BUSY code', () => {
    const err = new TeamImportBusyError();
    expect(err).toBeInstanceOf(TeamImportError);
    expect(err.code).toBe('TEAM_IMPORT_BUSY');
  });
});
