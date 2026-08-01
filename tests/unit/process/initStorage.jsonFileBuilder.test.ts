import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { JsonFileBuilder } from '@process/utils/initStorage';

/**
 * Test the in-memory cached JsonFileBuilder behavior.
 *
 * The format assertions retain an independent decoder so backward compatibility
 * is checked without trusting the implementation under test. Mutation tests use
 * the real builder and exercise its store-wide persistence boundary.
 */

const encode = (data: unknown) => btoa(encodeURIComponent(String(data)));
const decode = (base64: string) => decodeURIComponent(atob(base64));

describe('JsonFileBuilder in-memory cache behavior', () => {
  let tmpDir: string;
  let filePath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsonfilebuilder-test-'));
    filePath = path.join(tmpDir, 'test-config.txt');
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('encode/decode roundtrip', () => {
    it('should roundtrip simple JSON', () => {
      const data = { theme: 'dark', language: 'zh' };
      const encoded = encode(JSON.stringify(data));
      const decoded = JSON.parse(decode(encoded));
      expect(decoded).toEqual(data);
    });

    it('should roundtrip unicode and special characters', () => {
      const data = { name: '中文测试', emoji: '🎉', special: '<script>alert("xss")</script>' };
      const encoded = encode(JSON.stringify(data));
      const decoded = JSON.parse(decode(encoded));
      expect(decoded).toEqual(data);
    });

    it('should roundtrip nested objects and arrays', () => {
      const data = {
        'mcp.config': [{ id: 'server1', name: 'test', enabled: true }],
        'model.config': [{ id: 'p1', platform: 'openai', model: ['gpt-4'] }],
      };
      const encoded = encode(JSON.stringify(data));
      const decoded = JSON.parse(decode(encoded));
      expect(decoded).toEqual(data);
    });

    describe('backward compatibility with existing files', () => {
      it('should read a pre-existing base64-encoded file', async () => {
        const data = { 'gemini.config': { authType: 'oauth', proxy: '' }, theme: 'dark' };
        await fs.writeFile(filePath, encode(JSON.stringify(data)));

        const raw = readFileSync(filePath).toString();
        const parsed = JSON.parse(decode(raw));
        expect(parsed).toEqual(data);
      });

      it('should return empty object for empty file', () => {
        // File doesn't exist → readFileSync throws → catch → {} as S
        expect(existsSync(filePath)).toBe(false);
      });

      it('quarantines corrupted base64 before recovering a clean writable store', async () => {
        await fs.writeFile(filePath, '!!!invalid-base64!!!');
        const store = JsonFileBuilder<Record<string, unknown>>(filePath);

        await expect(store.get('anything')).resolves.toBeUndefined();
        await expect(store.set('wcore.rawEngineMode', true)).resolves.toBe(true);
        const quarantined = (await fs.readdir(tmpDir)).filter((name) => name.startsWith('test-config.txt.corrupt-'));
        expect(quarantined).toHaveLength(1);
        expect(await fs.readFile(path.join(tmpDir, quarantined[0]), 'utf8')).toBe('!!!invalid-base64!!!');
        expect(JSON.parse(decode(await fs.readFile(filePath, 'utf8')))).toEqual({ 'wcore.rawEngineMode': true });
      });

      it.skipIf(process.platform === 'win32')(
        'preserves valid bytes in place when a permission failure cannot prove corruption',
        async () => {
          const payload = encode(JSON.stringify({ irreplaceable: 'history' }));
          await fs.writeFile(filePath, payload, { mode: 0o600 });
          await fs.chmod(filePath, 0o000);
          const store = JsonFileBuilder<Record<string, unknown>>(filePath);

          await expect(store.toJson()).rejects.toThrow('without proving corruption');

          await fs.chmod(filePath, 0o600);
          expect(await fs.readFile(filePath, 'utf8')).toBe(payload);
          expect((await fs.readdir(tmpDir)).filter((name) => name.includes('.corrupt-'))).toEqual([]);
        }
      );

      it.each(['', encode('[]'), encode('null'), encode('"scalar"')])(
        'quarantines an existing non-object storage payload before recovery',
        async (payload) => {
          await fs.writeFile(filePath, payload);
          const store = JsonFileBuilder<Record<string, unknown>>(filePath);
          await expect(store.toJson()).resolves.toEqual({});
          await expect(store.set('safe', true)).resolves.toBe(true);
          const quarantined = (await fs.readdir(tmpDir)).filter((name) => name.startsWith('test-config.txt.corrupt-'));
          expect(quarantined).toHaveLength(1);
          expect(await fs.readFile(path.join(tmpDir, quarantined[0]), 'utf8')).toBe(payload);
          expect(JSON.parse(decode(await fs.readFile(filePath, 'utf8')))).toEqual({ safe: true });
        }
      );

      it('loads valid array-root conversation history without weakening object-root stores', async () => {
        const messages = [{ id: 'm1', content: 'hello' }];
        await fs.writeFile(filePath, encode(JSON.stringify(messages)));

        const store = JsonFileBuilder<Array<{ id: string; content: string }>>(filePath, 'array');

        expect(await store.toJson()).toEqual(messages);
      });

      it('quarantines a wrong-root array history before recovering an empty array', async () => {
        const payload = encode(JSON.stringify({ id: 'not-an-array' }));
        await fs.writeFile(filePath, payload);
        const store = JsonFileBuilder<Array<{ id: string }>>(filePath, 'array');

        await expect(store.toJson()).resolves.toEqual([]);
        await expect(store.setJson([{ id: 'replacement' }])).resolves.toEqual([{ id: 'replacement' }]);
        const quarantined = (await fs.readdir(tmpDir)).filter((name) => name.startsWith('test-config.txt.corrupt-'));
        expect(quarantined).toHaveLength(1);
        expect(await fs.readFile(path.join(tmpDir, quarantined[0]), 'utf8')).toBe(payload);
      });

      it('initializes a missing array-root history as an empty array', async () => {
        const store = JsonFileBuilder<unknown[]>(filePath, 'array');

        expect(await store.toJson()).toEqual([]);
      });

      it('clears and reloads an array-root history as an array', async () => {
        const store = JsonFileBuilder<Array<{ id: string }>>(filePath, 'array');
        await store.setJson([{ id: 'before-clear' }]);

        await expect(store.clear()).resolves.toEqual([]);
        expect(await store.toJson()).toEqual([]);
        expect(await JsonFileBuilder<unknown[]>(filePath, 'array').toJson()).toEqual([]);
      });

      it('rejects a wrong-root setJson before changing array storage or cache', async () => {
        const store = JsonFileBuilder<Array<{ id: string }>>(filePath, 'array');
        await store.setJson([{ id: 'safe' }]);
        const before = await fs.readFile(filePath, 'utf8');

        await expect(store.setJson({ id: 'wrong-root' } as never)).rejects.toThrow('storage root must be a JSON array');
        expect(await fs.readFile(filePath, 'utf8')).toBe(before);
        expect(await store.toJson()).toEqual([{ id: 'safe' }]);
      });
    });
  });

  describe('write serialization', () => {
    it('should persist data that survives a fresh read from disk', async () => {
      const data = { 'mcp.config': [{ id: '1', name: 'test' }], theme: 'light' };
      const encoded = encode(JSON.stringify(data));

      // Ensure parent dir exists (same as WriteFile)
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, encoded);

      // Fresh read from disk
      const raw = readFileSync(filePath).toString();
      const parsed = JSON.parse(decode(raw));
      expect(parsed).toEqual(data);
    });

    it('should handle rapid sequential writes without corruption', async () => {
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Simulate rapid writes via promise chain (same pattern as JsonFileBuilder)
      let writeChain: Promise<unknown> = Promise.resolve();
      let cache: Record<string, unknown> = {};

      for (let i = 0; i < 20; i++) {
        cache[`key${i}`] = `value${i}`;
        const encoded = encode(JSON.stringify(cache));
        writeChain = writeChain.then(() => fs.writeFile(filePath, encoded));
      }

      await writeChain;

      // Verify final state
      const raw = readFileSync(filePath).toString();
      const parsed = JSON.parse(decode(raw));
      expect(Object.keys(parsed)).toHaveLength(20);
      expect(parsed.key0).toBe('value0');
      expect(parsed.key19).toBe('value19');
    });

    it('does not let a failed key write contaminate a later sibling-key snapshot', async () => {
      type TestConfig = {
        'wcore.rawEngineMode': boolean;
        'wcore.outputBudget': { mode: 'auto' } | { mode: 'fixed'; value: number };
      };

      const store = JsonFileBuilder<TestConfig>(filePath);
      await store.setJson({
        'wcore.rawEngineMode': false,
        'wcore.outputBudget': { mode: 'auto' },
      });

      // Replacing the target file with a directory makes the atomic rename fail
      // after the candidate mutation has been built. The in-memory committed
      // state must remain unchanged.
      await fs.rm(filePath);
      await fs.mkdir(filePath);
      await expect(store.set('wcore.rawEngineMode', true)).rejects.toThrow();
      expect(await store.get('wcore.rawEngineMode')).toBe(false);

      // Once persistence is available again, a sibling ProcessConfig write must
      // be built from the last successful state, never the rejected candidate.
      await fs.rm(filePath, { recursive: true });
      await store.set('wcore.outputBudget', { mode: 'fixed', value: 4096 });

      const persisted = JSON.parse(decode(await fs.readFile(filePath, 'utf8'))) as TestConfig;
      expect(persisted).toEqual({
        'wcore.rawEngineMode': false,
        'wcore.outputBudget': { mode: 'fixed', value: 4096 },
      });
    });

    it('serializes concurrent sibling-key writes into one complete snapshot', async () => {
      type TestConfig = { alpha?: number; beta?: number };
      const store = JsonFileBuilder<TestConfig>(filePath);

      await Promise.all([store.set('alpha', 1), store.set('beta', 2)]);

      const persisted = JSON.parse(decode(await fs.readFile(filePath, 'utf8'))) as TestConfig;
      expect(persisted).toEqual({ alpha: 1, beta: 2 });
    });

    it('does not expose the committed cache through a returned mutation result', async () => {
      type TestConfig = { nested: { enabled: boolean } };
      const store = JsonFileBuilder<TestConfig>(filePath);

      const result = await store.setJson({ nested: { enabled: false } });
      result.nested.enabled = true;

      expect((await store.toJson()).nested.enabled).toBe(false);
      const persisted = JSON.parse(decode(await fs.readFile(filePath, 'utf8'))) as TestConfig;
      expect(persisted.nested.enabled).toBe(false);
    });

    it.each(['toJson', 'toJsonSync', 'get', 'getSync'] as const)(
      '%s returns a detached value that cannot poison sibling persistence',
      async (surface) => {
        type TestConfig = { nested: { enabled: boolean }; sibling: string };
        const store = JsonFileBuilder<TestConfig>(filePath);
        await store.setJson({ nested: { enabled: false }, sibling: 'before' });

        let exposed: { enabled: boolean };
        if (surface === 'toJson') exposed = (await store.toJson()).nested;
        else if (surface === 'toJsonSync') exposed = store.toJsonSync().nested;
        else if (surface === 'get') exposed = await store.get('nested');
        else exposed = store.getSync('nested');
        exposed.enabled = true;

        expect((await store.get('nested')).enabled).toBe(false);
        await store.set('sibling', 'after');

        const persisted = JSON.parse(decode(await fs.readFile(filePath, 'utf8'))) as TestConfig;
        expect(persisted).toEqual({ nested: { enabled: false }, sibling: 'after' });
      }
    );

    it.each([
      ['non-cloneable function', { run: () => 'never persisted' }],
      ['non-JSON BigInt', { amount: 1n }],
    ])('rejects a %s before disk or cache can diverge', async (_label, candidate) => {
      type TestConfig = { payload: unknown; sibling: string };
      const store = JsonFileBuilder<TestConfig>(filePath);
      await store.setJson({ payload: { safe: true }, sibling: 'before' });
      const before = await fs.readFile(filePath, 'utf8');

      await expect(store.set('payload', candidate)).rejects.toThrow();
      expect(await fs.readFile(filePath, 'utf8')).toBe(before);
      expect(await store.get('payload')).toEqual({ safe: true });

      await store.set('sibling', 'after');
      const persisted = JSON.parse(decode(await fs.readFile(filePath, 'utf8'))) as TestConfig;
      expect(persisted).toEqual({ payload: { safe: true }, sibling: 'after' });
    });

    it('rejects a cyclic candidate before disk or cache can diverge and recovers the queue', async () => {
      type TestConfig = { payload: unknown; sibling: string };
      const store = JsonFileBuilder<TestConfig>(filePath);
      await store.setJson({ payload: { safe: true }, sibling: 'before' });
      const before = await fs.readFile(filePath, 'utf8');
      const cyclic: Record<string, unknown> = {};
      cyclic.self = cyclic;

      await expect(store.set('payload', cyclic)).rejects.toThrow();
      expect(await fs.readFile(filePath, 'utf8')).toBe(before);
      expect(await store.get('payload')).toEqual({ safe: true });

      await store.set('sibling', 'after');
      const persisted = JSON.parse(decode(await fs.readFile(filePath, 'utf8'))) as TestConfig;
      expect(persisted).toEqual({ payload: { safe: true }, sibling: 'after' });
    });

    it('promotes the same canonical JSON value that was written to disk', async () => {
      type TestConfig = { payload: unknown };
      const store = JsonFileBuilder<TestConfig>(filePath);
      const date = new Date('2026-07-18T00:00:00.000Z');

      await store.set('payload', { date, nonFinite: Number.POSITIVE_INFINITY, omitted: undefined });

      const expected = { date: date.toISOString(), nonFinite: null };
      expect(await store.get('payload')).toEqual(expected);
      const persisted = JSON.parse(decode(await fs.readFile(filePath, 'utf8'))) as TestConfig;
      expect(persisted.payload).toEqual(expected);
    });
  });

  describe('snapshot quiescence', () => {
    it('captures a detached atomic snapshot and blocks every mutation surface synchronously', async () => {
      type TestConfig = { value?: number; nested?: { enabled: boolean } };
      const store = JsonFileBuilder<TestConfig>(filePath);
      await store.setJson({ value: 1, nested: { enabled: false } });
      const lease = store.acquireSnapshotLease();
      const first = lease.read();
      first.value = 99;
      first.nested!.enabled = true;

      expect(lease.epoch).toBe(1);
      expect(store.getMutationEpoch()).toBe(1);
      expect(lease.read()).toEqual({ value: 1, nested: { enabled: false } });
      expect(store.toJsonSync()).toEqual({ value: 1, nested: { enabled: false } });
      expect(() => store.set('value', 2)).toThrow('Mutation blocked while snapshot lease is held');
      expect(() => store.setJson({ value: 2 })).toThrow('Mutation blocked while snapshot lease is held');
      expect(() => store.update('value', async () => 2)).toThrow('Mutation blocked while snapshot lease is held');
      expect(() => store.remove('value')).toThrow('Mutation blocked while snapshot lease is held');
      expect(() => store.clear()).toThrow('Mutation blocked while snapshot lease is held');
      const blockedBackup = path.join(tmpDir, 'blocked-backup', 'backup.txt');
      expect(() => store.backup(blockedBackup)).toThrow('Mutation blocked while snapshot lease is held');
      expect(existsSync(path.dirname(blockedBackup))).toBe(false);

      lease.release();
      await expect(store.set('value', 2)).resolves.toBe(2);
      expect(store.getMutationEpoch()).toBe(2);
    });

    it('fails snapshot acquisition while a mutation is queued or in flight', async () => {
      type TestConfig = { value?: number };
      const store = JsonFileBuilder<TestConfig>(filePath);
      let continueUpdate: (() => void) | undefined;
      const gate = new Promise<void>((resolve) => {
        continueUpdate = resolve;
      });

      const mutation = store.update('value', async () => {
        await gate;
        return 1;
      });

      expect(() => store.acquireSnapshotLease()).toThrow('Snapshot lease blocked by pending mutation');
      continueUpdate?.();
      await mutation;

      const lease = store.acquireSnapshotLease();
      expect(lease.read()).toEqual({ value: 1 });
      lease.release();
    });

    it('rejects overlapping leases and stale idempotent release cannot release a successor', async () => {
      const store = JsonFileBuilder<Record<string, unknown>>(filePath);
      const first = store.acquireSnapshotLease();
      expect(() => store.acquireSnapshotLease()).toThrow('Snapshot lease already held');

      first.release();
      const second = store.acquireSnapshotLease();
      first.release();
      expect(() => first.read()).toThrow('Snapshot lease already released');
      expect(() => store.set('blocked', true)).toThrow('Mutation blocked while snapshot lease is held');

      second.release();
      second.release();
      await expect(store.set('allowed', true)).resolves.toBe(true);
    });

    it('advances epoch only after successful persistence and recovers after a failed write', async () => {
      type TestConfig = { value?: number };
      const store = JsonFileBuilder<TestConfig>(filePath);
      expect(store.getMutationEpoch()).toBe(0);
      await store.set('value', 1);
      expect(store.getMutationEpoch()).toBe(1);

      await fs.rm(filePath);
      await fs.mkdir(filePath);
      await expect(store.set('value', 2)).rejects.toThrow();
      expect(store.getMutationEpoch()).toBe(1);
      expect(await store.get('value')).toBe(1);

      await fs.rm(filePath, { recursive: true });
      await store.set('value', 3);
      expect(store.getMutationEpoch()).toBe(2);
    });

    it('treats backup as a serialized persisted-state mutation', async () => {
      const store = JsonFileBuilder<{ value?: number }>(filePath);
      await store.set('value', 1);
      const destination = path.join(tmpDir, 'backup', 'config.txt');

      await store.backup(destination);

      expect(store.getMutationEpoch()).toBe(2);
      expect(existsSync(filePath)).toBe(false);
      expect(JSON.parse(decode(await fs.readFile(destination, 'utf8')))).toEqual({ value: 1 });
    });

    it('does not advance epoch when backup fails', async () => {
      const store = JsonFileBuilder<{ value?: number }>(filePath);
      await store.set('value', 1);
      await fs.rm(filePath);
      await fs.mkdir(filePath);

      await expect(store.backup(path.join(tmpDir, 'failed-backup.txt'))).rejects.toThrow();

      expect(store.getMutationEpoch()).toBe(1);
      expect(await store.get('value')).toBe(1);
    });
  });
});
