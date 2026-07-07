import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { NATIVE_COLLISION_IDS } from '@process/providers/catalog/catalogCuration';

/**
 * Guards the bundled artifact emitted by `scripts/generateProviderCatalog.mjs`.
 * Reads the committed JSON straight off disk (it is the shipped file, not a
 * fixture) and asserts the invariants the generator promises: a sane provider
 * count, well-formed entries, no native collisions leaking through, and a
 * deterministic sort-by-id (the byte-stability guard the snapshot relies on).
 */

const GENERATED_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'src',
  'process',
  'providers',
  'catalog',
  'data',
  'providerCatalog.generated.json'
);

type GeneratedEntry = {
  id: string;
  displayName: string;
  baseUrl: string;
  envVar: string;
  apiPath?: string;
};

function loadCatalog(): GeneratedEntry[] {
  const parsed = JSON.parse(readFileSync(GENERATED_PATH, 'utf8'));
  expect(Array.isArray(parsed)).toBe(true);
  return parsed as GeneratedEntry[];
}

describe('providerCatalog.generated.json', () => {
  const catalog = loadCatalog();

  it('parses and carries a sane number of entries', () => {
    expect(catalog.length).toBeGreaterThan(50);
  });

  it('has non-empty id / baseUrl / envVar on every entry', () => {
    for (const entry of catalog) {
      expect(entry.id.trim()).not.toBe('');
      expect(entry.baseUrl.trim()).not.toBe('');
      expect(entry.envVar.trim()).not.toBe('');
    }
  });

  it('contains no id that collides with a native provider', () => {
    const collisions = catalog.filter((entry) => NATIVE_COLLISION_IDS.has(entry.id)).map((entry) => entry.id);
    expect(collisions).toEqual([]);
  });

  it('is sorted by id (determinism guard)', () => {
    const ids = catalog.map((entry) => entry.id);
    expect(ids).toEqual([...ids].toSorted());
  });

  it('has unique ids', () => {
    const ids = catalog.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
