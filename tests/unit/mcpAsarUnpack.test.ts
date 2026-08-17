import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');

/**
 * Extract outfile basenames from build-mcp-servers.js.
 * Matches patterns like: outfile: path.join(ROOT, 'out/main/xxx.js')
 */
function getBuildOutputFiles(): string[] {
  const script = fs.readFileSync(path.join(ROOT, 'scripts/build-mcp-servers.js'), 'utf-8');
  const matches = [...script.matchAll(/outfile:\s*path\.join\(ROOT,\s*'([^']+)'\)/g)];
  return matches.map((m) => m[1]);
}

/**
 * Extract asarUnpack entries from electron-builder.yml that match out/main/*.js
 */
function getAsarUnpackEntries(): string[] {
  const yml = fs.readFileSync(path.join(ROOT, 'electron-builder.yml'), 'utf-8');
  const matches = [...yml.matchAll(/-\s*'(out\/main\/[^']+\.js)'/g)];
  return matches.map((m) => m[1]);
}

/**
 * Every npm package an MCP build marks esbuild-`external:` beyond the two
 * SHARED_OPTIONS defaults (`electron`, `bun:sqlite`, neither of which is an
 * unpackable node_modules dependency at runtime).
 */
function getExternalNpmDeps(): string[] {
  const script = fs.readFileSync(path.join(ROOT, 'scripts/build-mcp-servers.js'), 'utf-8');
  const matches = [...script.matchAll(/external:\s*\[([^\]]*)\]/g)];
  const names = new Set<string>();
  for (const m of matches) {
    for (const raw of m[1].split(',')) {
      const name = raw.trim().replace(/^['"]|['"]$/g, '');
      if (!name || name.startsWith('...') || name === 'electron' || name.startsWith('bun:')) continue;
      names.add(name);
    }
  }
  return [...names];
}

/** asarUnpack entries of the `**\/node_modules/<pkg>/**\/*` shape. */
function getAsarUnpackNodeModules(): string[] {
  const yml = fs.readFileSync(path.join(ROOT, 'electron-builder.yml'), 'utf-8');
  const matches = [...yml.matchAll(/-\s*'\*\*\/node_modules\/([^/']+)\/\*\*\/\*'/g)];
  return matches.map((m) => m[1]);
}

describe('MCP asar unpack consistency', () => {
  it('every MCP build output must be listed in electron-builder.yml asarUnpack', () => {
    const buildOutputs = getBuildOutputFiles();
    const asarEntries = getAsarUnpackEntries();

    expect(buildOutputs.length).toBeGreaterThan(0);

    const missing = buildOutputs.filter((f) => !asarEntries.includes(f));
    if (missing.length > 0) {
      throw new Error(
        `MCP scripts built but NOT in asarUnpack:\n` +
          missing.map((f) => `  - ${f}`).join('\n') +
          `\n\nAdd them to electron-builder.yml asarUnpack section.`
      );
    }
  });

  /**
   * #1019: the concierge-diag MCP is bundled with `better-sqlite3` marked
   * esbuild-`external:`, so the standalone stdio process `require()`s it at
   * runtime — and a native module cannot be loaded from inside the asar. Deleting
   * the `**\/node_modules/better-sqlite3/**\/*` asarUnpack line therefore arms a
   * panic in a subprocess whose only user-visible symptom is "0 tools", pointing
   * the next investigation at the MCP runtime layer instead of at packaging.
   * Nothing asserted this: `conciergeDiagBundle.test.ts` pins the `external:`
   * marking, which is the OTHER half of the same contract.
   *
   * Derived from the build script rather than hardcoded, so a future external
   * native dep is covered the day it is added.
   */
  it('every npm package an MCP build marks external must be asarUnpacked', () => {
    const externals = getExternalNpmDeps();
    const unpacked = getAsarUnpackNodeModules();

    // Confirms the method finds a KNOWN POSITIVE before any zero is believed.
    expect(externals).toContain('better-sqlite3');
    expect(unpacked.length).toBeGreaterThan(0);

    const missing = externals.filter((dep) => !unpacked.includes(dep));
    expect(missing).toEqual([]);
  });
});
