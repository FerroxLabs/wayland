import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getDesktopFluxRoutingEvidenceAdapter,
  getWebCloudFluxRoutingEvidenceAdapter,
  initDesktopFluxRoutingEvidenceAdapter,
  initWebCloudFluxRoutingEvidenceAdapter,
} from '@process/flux/FluxRoutingEvidenceAdapter';

/**
 * Physical-absence guard for FLUX-01 / SAF-05.
 *
 * The merged producer contract defines corpus serialization and replay but no
 * live transport. This suite proves, from the actual source tree, that the
 * shipping application cannot expose a route explanation, attempt history, Flux
 * cost reconciliation, or debit authority: no production callsite supplies a
 * live capability response or producer stream to `FluxRoutingEvidenceAdapter`.
 * Any future transport must arrive as a separately planned, hostile-proofed
 * contract — this application, as source, does not invent it.
 */

const srcRoot = path.join(process.cwd(), 'src');
const ADAPTER_MODULE = '@process/flux/FluxRoutingEvidenceAdapter';
const CONSUMER_MODULE = '@/common/routingEvidence';

// Repo-relative paths of the composition roots that own the boundary.
const DESKTOP_ROOT = 'src/process/bridge/index.ts';
const WEBCLOUD_ROOT = 'src/process/utils/initBridgeStandalone.ts';
const ADAPTER_FILE = 'src/process/flux/FluxRoutingEvidenceAdapter.ts';
const CONSUMER_FILES = new Set(['src/common/routingEvidence/v1.ts', 'src/common/routingEvidence/index.ts']);

// Symbols that would mint a live claim if a production callsite invoked them.
const LIVE_DELIVERY_SYMBOLS = [
  '.replay(',
  'consumeFluxRoutingEvidence',
  'inspectFluxRoutingCapability',
  'getDesktopFluxRoutingEvidenceAdapter',
  'getWebCloudFluxRoutingEvidenceAdapter',
];

function walkSource(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSource(full));
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const allProductionSources = walkSource(srcRoot);

function rel(absolute: string): string {
  return path.relative(process.cwd(), absolute);
}

function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), 'utf8');
}

function importsModule(source: string, moduleSpecifier: string): boolean {
  // Matches `from '<module>'` and `from '<module>/...'` (submodule imports).
  const escaped = moduleSpecifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`from\\s+['"]${escaped}(?:/[^'"]*)?['"]`).test(source);
}

describe('Flux routing evidence: trusted live delivery is physically absent', () => {
  it('imports the adapter only from the two composition roots', () => {
    const importers = allProductionSources
      .filter((file) => rel(file) !== ADAPTER_FILE)
      .filter((file) => importsModule(fs.readFileSync(file, 'utf8'), ADAPTER_MODULE))
      .map(rel)
      .toSorted();

    expect(importers).toEqual([DESKTOP_ROOT, WEBCLOUD_ROOT].toSorted());
  });

  it('consumes the routing-evidence reducer only inside the adapter', () => {
    const consumers = allProductionSources
      .filter((file) => !CONSUMER_FILES.has(rel(file)))
      .filter((file) => importsModule(fs.readFileSync(file, 'utf8'), CONSUMER_MODULE))
      .map(rel)
      .toSorted();

    // Only the adapter may translate producer evidence into claims. No cost
    // ledger, catalog, or model surface is allowed to consume it directly.
    expect(consumers).toEqual([ADAPTER_FILE]);
  });

  it.each([DESKTOP_ROOT, WEBCLOUD_ROOT])(
    'composition root %s only initializes the no_flux boundary and never delivers evidence',
    (rootPath) => {
      const source = read(rootPath);
      const initSymbol =
        rootPath === DESKTOP_ROOT ? 'initDesktopFluxRoutingEvidenceAdapter' : 'initWebCloudFluxRoutingEvidenceAdapter';
      expect(source).toContain(`${initSymbol}()`);
      for (const symbol of LIVE_DELIVERY_SYMBOLS) {
        expect(source, `${rootPath} must not reference ${symbol}`).not.toContain(symbol);
      }
    }
  );

  it('binds the adapter to the producer contract and to no cost, catalog, or engine source', () => {
    const source = read(ADAPTER_FILE);
    const importSpecifiers = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
    // The adapter's sole external dependency is the pinned producer contract.
    // Nothing routes engine/computed/unknown cost or catalog estimates into it.
    expect(importSpecifiers).toEqual([CONSUMER_MODULE]);
  });

  it('proves the one ACP replay callsite is an unrelated turn replay, not Flux delivery', () => {
    // The only `.replay(` in production is the ACP failover turn-replay callback.
    // It must not masquerade as trusted Flux delivery: it neither imports the
    // adapter nor consumes routing evidence, and its replay is a local closure.
    const acpFile = 'src/renderer/pages/conversation/platforms/acp/acpFluxFailover.ts';
    const source = read(acpFile);
    expect(source).toMatch(/replay:\s*\(turn:\s*FluxFailoverTurn\)\s*=>\s*void/);
    expect(importsModule(source, ADAPTER_MODULE)).toBe(false);
    expect(importsModule(source, CONSUMER_MODULE)).toBe(false);

    // Belt-and-braces: across the whole tree, no file both imports the adapter
    // and calls `.replay(`.
    const offenders = allProductionSources.filter((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return importsModule(text, ADAPTER_MODULE) && text.includes('.replay(');
    });
    expect(offenders.map(rel)).toEqual([]);
  });

  it('leaves both initialized composition roots with no route, attempt, cost, or debit surface', () => {
    const desktop = initDesktopFluxRoutingEvidenceAdapter();
    const webCloud = initWebCloudFluxRoutingEvidenceAdapter();

    expect(getDesktopFluxRoutingEvidenceAdapter()).toBe(desktop);
    expect(getWebCloudFluxRoutingEvidenceAdapter()).toBe(webCloud);

    for (const snapshot of [desktop.current(), webCloud.current()]) {
      expect(snapshot.decision.profile).toBe('no_flux');
      expect(snapshot.decision.summary).toBeNull();
      expect(snapshot.decision).toMatchObject({ events: [] });
      // Adapter presence alone exposes no customer-visible claim.
      expect(snapshot.claims).toEqual({ routeExplanations: false, providerAttempts: false, costClaims: false });
    }

    // Disabling is idempotent and never resurrects a claim.
    expect(desktop.disable().claims).toEqual({ routeExplanations: false, providerAttempts: false, costClaims: false });
  });
});
