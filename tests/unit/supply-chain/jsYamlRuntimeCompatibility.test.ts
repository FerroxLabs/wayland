/** Installed-parser regression for the js-yaml merge-chain and ordered-map fixes. */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type Yaml = {
  load: (source: string, options?: { schema?: unknown }) => unknown;
  dump: (value: unknown) => string;
  safeLoad?: (source: string) => unknown;
  FAILSAFE_SCHEMA: unknown;
};
type Package = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

const root = process.cwd();
const bridgeRoot = path.join(root, 'src/process/channels/whatsapp-bridge');
const rootRequire = createRequire(path.join(root, 'package.json'));
const bridgeRequire = createRequire(path.join(bridgeRoot, 'package.json'));
const nycRequire = createRequire(rootRequire.resolve('@istanbuljs/load-nyc-config/package.json'));
const copies = [
  { name: 'root v4', require: rootRequire, version: '4.3.1' },
  { name: 'load-nyc-config v3', require: nycRequire, version: '3.15.1' },
  { name: 'external bridge v4', require: bridgeRequire, version: '4.3.1' },
].map((copy) => ({
  ...copy,
  packagePath: copy.require.resolve('js-yaml/package.json'),
  yaml: copy.require('js-yaml') as Yaml,
}));

function installedPackages(modules: string): string[] {
  const packages: string[] = [];
  const inspect = (directory: string) => {
    const metadata = path.join(directory, 'package.json');
    if (!existsSync(metadata)) return;
    packages.push(metadata);
    const nested = path.join(directory, 'node_modules');
    if (existsSync(nested)) packages.push(...installedPackages(nested));
  };
  for (const entry of readdirSync(modules, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const directory = path.join(modules, entry.name);
    if (entry.name.startsWith('@')) {
      for (const child of readdirSync(directory)) inspect(path.join(directory, child));
    } else inspect(directory);
  }
  return packages;
}

describe('installed js-yaml API-line inventory', () => {
  it('resolves every declared consumer to its patched major and leaves no vulnerable parser copy', () => {
    const packages = [
      path.join(root, 'package.json'),
      ...installedPackages(path.join(root, 'node_modules')),
      ...installedPackages(path.join(bridgeRoot, 'node_modules')),
    ];
    const parsers: string[] = [];
    let consumers = 0;
    for (const file of packages) {
      const metadata = JSON.parse(readFileSync(file, 'utf8')) as Package;
      if (metadata.name === 'js-yaml') parsers.push(file);
      const range = metadata.dependencies?.['js-yaml'] ?? metadata.optionalDependencies?.['js-yaml'];
      if (!range) continue;
      const resolved = createRequire(file)('js-yaml/package.json') as Package;
      expect(resolved.version, `${metadata.name} at ${file} requires ${range}`).toBe(
        range.startsWith('^3.') ? '3.15.1' : '4.3.1'
      );
      consumers += 1;
    }
    expect(consumers).toBeGreaterThanOrEqual(10);
    // Worktrees may share node_modules; compare the same canonical identity as require.resolve.
    expect(parsers.map((file) => realpathSync(file)).sort()).toEqual(
      copies.map((copy) => realpathSync(copy.packagePath)).sort()
    );
  });
});

describe.each(copies)('$name compatibility', ({ yaml, require: requireFromConsumer, version }) => {
  it('keeps aliases, multiline Unicode, scalars and dump/load round trips', () => {
    expect((requireFromConsumer('js-yaml/package.json') as Package).version).toBe(version);
    const value = yaml.load(
      'base: &base {enabled: true, retries: 3}\nitem:\n  <<: *base\n  name: Café\n  note: |\n    first\n    second\n  empty: null\n  date: 2026-09-06\n'
    );
    expect(value).toEqual({
      base: { enabled: true, retries: 3 },
      item: {
        enabled: true,
        retries: 3,
        name: 'Café',
        note: 'first\nsecond\n',
        empty: null,
        date: new Date('2026-09-06T00:00:00Z'),
      },
    });
    expect(yaml.load(yaml.dump(value))).toEqual(value);
  });

  it('preserves ordered maps and rejects duplicate mappings and ordered-map keys', () => {
    expect(yaml.load('!!omap\n- first: 1\n- second: 2\n')).toEqual([{ first: 1 }, { second: 2 }]);
    expect(() => yaml.load('a: 1\na: 2\n')).toThrow();
    expect(() => yaml.load('!!omap\n- a: 1\n- a: 2\n')).toThrow();
  });

  it('keeps the FAILSAFE schema narrow and updater identifiers as strings', () => {
    expect(yaml.load('enabled: true\ncount: 12\nempty: null\n', { schema: yaml.FAILSAFE_SCHEMA })).toEqual({
      enabled: 'true',
      count: '12',
      empty: 'null',
    });
    expect(() => yaml.load('!!omap\n- a: 1\n', { schema: yaml.FAILSAFE_SCHEMA })).toThrow();
    expect(
      yaml.load('version: 0.12.15\nsha512: AAZz+/==\nfiles:\n  - url: Wayland-0.12.15.zip\n    sha512: AAZz+/==\n')
    ).toEqual({ version: '0.12.15', sha512: 'AAZz+/==', files: [{ url: 'Wayland-0.12.15.zip', sha512: 'AAZz+/==' }] });
  });

  it('retains the v3 safe API and rejects executable tags in default v4', () => {
    if (version.startsWith('3.')) {
      expect(typeof yaml.safeLoad).toBe('function');
      expect(yaml.safeLoad?.('enabled: true')).toEqual({ enabled: true });
    } else {
      expect(() => yaml.load('!!js/function "function () { return 1; }"')).toThrow();
    }
  });
});

it('runs the actual load-nyc-config and external bridge cosmiconfig YAML loaders', async () => {
  const temporary = mkdtempSync(path.join(os.tmpdir(), 'wayland-js-yaml-'));
  try {
    writeFileSync(path.join(temporary, 'package.json'), '{}\n');
    const configFile = path.join(temporary, '.nycrc.yaml');
    writeFileSync(configFile, 'all: true\ninclude:\n  - src/**/*.ts\n');
    const nyc = rootRequire('@istanbuljs/load-nyc-config') as {
      loadNycConfig: (options: { cwd: string; nycrcPath: string }) => Promise<Record<string, unknown>>;
    };
    expect(await nyc.loadNycConfig({ cwd: temporary, nycrcPath: '.nycrc.yaml' })).toMatchObject({
      all: true,
      include: ['src/**/*.ts'],
    });
    const cosmiconfig = bridgeRequire('cosmiconfig') as {
      cosmiconfigSync: (name: string) => { load: (file: string) => { config: unknown } | null };
    };
    expect(cosmiconfig.cosmiconfigSync('wayland-fixture').load(configFile)?.config).toEqual({
      all: true,
      include: ['src/**/*.ts'],
    });
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

// Fixed-size inputs stay inside a killable child, never the test/app event loop.
// No option disables or raises the upstream default safety limits.
const boundedProbe = String.raw`
const yaml = require(require('node:path').dirname(process.argv[1]));
const mode = process.argv[2];
if (mode === 'omap') {
  const source = '!!omap\n' + Array.from({length: 12000}, (_, i) => '- key' + i + ': ' + i).join('\n');
  const result = yaml.load(source);
  if (result.length !== 12000 || result[11999].key11999 !== 11999) throw new Error('ordered map changed');
  let rejected = false;
  try { yaml.load('!!omap\n- same: 1\n- same: 2\n'); } catch { rejected = true; }
  if (!rejected) throw new Error('duplicate ordered-map key accepted');
  process.stdout.write(JSON.stringify({bounded: true, entries: result.length, duplicateRejected: true}));
} else {
  let source;
  if (mode === 'chain') {
    source = 'base0: &base0 {key0: 0}\n';
    for (let i = 1; i <= 160; i++) source += 'base' + i + ': &base' + i + ' {<<: *base' + (i - 1) + ', key' + i + ': ' + i + '}\n';
  } else {
    source = 'base: &base {' + Array.from({length: 100}, (_, i) => 'key' + i + ': ' + i).join(', ') + '}\nmerged:\n  <<: [' + Array(101).fill('*base').join(', ') + ']\n';
  }
  let reason = '';
  try { yaml.load(source); } catch (error) { reason = String(error.message); }
  if (!reason.includes('maxTotalMergeKeys')) throw new Error('default merge-key bound was not enforced: ' + reason);
  process.stdout.write(JSON.stringify({bounded: true, mergeLimitRejected: true}));
}
`;

describe.each(copies)('$name isolated complexity bounds', ({ packagePath }) => {
  it.each(['chain', 'repeated-alias', 'omap'])('bounds %s without disabling upstream limits', (mode) => {
    const result = spawnSync(process.execPath, ['--max-old-space-size=128', '-e', boundedProbe, packagePath, mode], {
      encoding: 'utf8',
      timeout: 5000,
      killSignal: 'SIGKILL',
      maxBuffer: 64 * 1024,
    });
    expect(result.error, result.stderr).toBeUndefined();
    expect(result.signal, result.stderr).toBeNull();
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ bounded: true });
  });
});
