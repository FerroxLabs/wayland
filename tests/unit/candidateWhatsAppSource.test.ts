import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const {
  resolveCandidateWhatsAppSource,
  prepareCandidateWhatsAppSource,
} = require('../../scripts/candidate-whatsapp-source.js');
const { verifySourceMirror } = require('../../scripts/verify-packaged-resources.js');
const protectedAuthority = require('../../scripts/whatsapp-bridge-source.json');
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'candidate-bridge-')));
  roots.push(root);
  const source = path.join(root, 'src/process/channels/whatsapp-bridge');
  const authorityPath = path.join(root, 'scripts/whatsapp-bridge-source.json');
  const files: Record<string, string> = Object.fromEntries(
    Object.keys(protectedAuthority.files).map((name) => [name, `fixture ${name}\n`])
  );
  files['package.json'] = JSON.stringify({
    name: '@wayland/whatsapp-bridge',
    dependencies: { axios: '1.20.0' },
    scripts: { postinstall: 'untrusted-candidate-command' },
  });
  files['bun.lock'] =
    '{\n"dependencies": {\n"axios": "1.20.0"\n},\n"packages": {\n"axios": ["axios@1.20.0", "", {}, "sha512-YQ=="]\n}\n}\n';
  const authority = {
    contract: protectedAuthority.contract,
    files: {} as Record<string, { size: number; sha256: string }>,
  };
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(source, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    authority.files[name] = {
      size: Buffer.byteLength(content),
      sha256: crypto.createHash('sha256').update(content).digest('hex'),
    };
  }
  fs.mkdirSync(path.dirname(authorityPath), { recursive: true });
  fs.writeFileSync(authorityPath, JSON.stringify(authority));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ overrides: { 'form-data': '4.0.6' } }));
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules/\n');
  fs.mkdirSync(path.join(source, 'node_modules/axios'), { recursive: true });
  fs.writeFileSync(path.join(source, 'node_modules/axios/index.js'), 'module.exports = "1.20.0";');
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  git('init', '--quiet');
  const commit = () => {
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'fixture');
    return { commit: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}') };
  };
  return { root, source, authorityPath, authority, commit, identity: commit() };
}

describe('protected observer verifies candidate WhatsApp source as pinned data', () => {
  it('accepts a committed dependency update while retaining the full installed-source inventory check', () => {
    const f = fixture();
    const resolved = resolveCandidateWhatsAppSource(f.root, f.identity);
    const bundle = fs.mkdtempSync(path.join(os.tmpdir(), 'installed-bridge-'));
    roots.push(bundle);
    fs.cpSync(f.source, bundle, { recursive: true });
    expect(verifySourceMirror(bundle, f.source, protectedAuthority, 'linux', 'x64')).toBe(false);
    expect(verifySourceMirror(bundle, resolved.whatsappSourceDir, resolved.whatsappAuthority, 'linux', 'x64')).toBe(
      true
    );
    fs.appendFileSync(path.join(bundle, 'node_modules/axios/index.js'), 'tampered');
    expect(verifySourceMirror(bundle, resolved.whatsappSourceDir, resolved.whatsappAuthority, 'linux', 'x64')).toBe(
      false
    );
  });
  it('rejects a changed source file even when the caller keeps the old identity', () => {
    const f = fixture();
    fs.appendFileSync(path.join(f.source, 'bridge.js'), 'changed');
    expect(() => resolveCandidateWhatsAppSource(f.root, f.identity)).toThrow('identity changed or worktree is dirty');
  });
  it('rejects a committed source change with an unchanged manifest pin', () => {
    const f = fixture();
    fs.appendFileSync(path.join(f.source, 'bridge.js'), 'changed');
    expect(() => resolveCandidateWhatsAppSource(f.root, f.commit())).toThrow('differs from its committed pin');
  });
  it.each(['omission', 'extra-path', 'invalid-pin'])(
    'rejects a candidate-authored %s authority even when committed',
    (mutation) => {
      const f = fixture();
      if (mutation === 'omission') delete f.authority.files['bun.lock'];
      if (mutation === 'extra-path') f.authority.files['../outside'] = f.authority.files['bun.lock'];
      if (mutation === 'invalid-pin') f.authority.files['bun.lock'].sha256 = 'invalid';
      fs.writeFileSync(f.authorityPath, JSON.stringify(f.authority));
      expect(() => resolveCandidateWhatsAppSource(f.root, f.commit())).toThrow(/protected contract|invalid file pin/);
    }
  );
  it('rejects a candidate source symlink', () => {
    const f = fixture();
    const file = path.join(f.source, 'bridge.js');
    fs.unlinkSync(file);
    fs.symlinkSync(path.join(f.source, 'allowlist.js'), file);
    expect(() => resolveCandidateWhatsAppSource(f.root, f.commit())).toThrow('regular files');
  });
  it('requires the exact captured source identity', () => {
    const f = fixture();
    expect(() => resolveCandidateWhatsAppSource(f.root, { ...f.identity, commit: '1'.repeat(40) })).toThrow(
      'identity changed'
    );
    expect(() => resolveCandidateWhatsAppSource(f.root, undefined)).toThrow('verified commit/tree');
  });
  it('reconstructs with pinned Bun, frozen lock, and lifecycle scripts disabled', () => {
    const f = fixture();
    const execute = vi.fn().mockReturnValueOnce('1.3.14\n').mockReturnValue('');
    prepareCandidateWhatsAppSource(f.root, f.identity, execute);
    expect(execute).toHaveBeenLastCalledWith('bun', ['install', '--frozen-lockfile', '--ignore-scripts'], {
      cwd: f.source,
      stdio: 'inherit',
    });
  });
  it('refuses a different package manager version before installing dependencies', () => {
    const f = fixture();
    const execute = vi.fn().mockReturnValue('1.4.2\n');
    expect(() => prepareCandidateWhatsAppSource(f.root, f.identity, execute)).toThrow('requires Bun 1.3.14');
    expect(execute).toHaveBeenCalledTimes(1);
  });
  it('refuses a dependency installation that changes tracked inputs', () => {
    const f = fixture();
    const execute = vi
      .fn()
      .mockReturnValueOnce('1.3.14\n')
      .mockImplementation(() => {
        fs.appendFileSync(path.join(f.source, 'bun.lock'), 'changed');
        return '';
      });
    expect(() => prepareCandidateWhatsAppSource(f.root, f.identity, execute)).toThrow(
      'identity changed or worktree is dirty'
    );
  });
});

describe('protected source-derived dependency manifest alternatives', () => {
  function manifestFixture() {
    const f = fixture();
    const relative = 'node_modules/axios/package.json';
    const manifest = {
      name: 'axios',
      version: '1.20.0',
      dependencies: { 'form-data': '^4.0.6', other: '^1.0.0' },
      optionalDependencies: { 'form-data': '^4.0.6', optional: '^2.0.0' },
      scripts: { test: 'original-test-command' },
    };
    const pristine = JSON.stringify(manifest, null, 2) + '\n';
    fs.writeFileSync(path.join(f.source, relative), pristine);
    const resolved = resolveCandidateWhatsAppSource(f.root, f.identity);
    const bundle = fs.mkdtempSync(path.join(os.tmpdir(), 'installed-manifest-'));
    roots.push(bundle);
    fs.cpSync(f.source, bundle, { recursive: true });
    const normalized = {
      ...manifest,
      dependencies: { ...manifest.dependencies, 'form-data': '*' },
      optionalDependencies: { ...manifest.optionalDependencies, 'form-data': '*' },
    };
    const installedManifest = path.join(bundle, relative);
    const writeInstalled = (value: unknown) =>
      fs.writeFileSync(installedManifest, JSON.stringify(value, null, 2) + '\n');
    const check = (variants = resolved.whatsappDependencyManifestVariants) =>
      verifySourceMirror(bundle, f.source, resolved.whatsappAuthority, 'linux', 'x64', undefined, [], variants);
    return { ...f, relative, pristine, resolved, bundle, normalized, installedManifest, writeInstalled, check };
  }

  it('accepts pristine dependency bytes with the alternative present', () => {
    const f = manifestFixture();
    expect(f.check()).toBe(true);
  });

  it('accepts exactly the existing producer transformation of overridden dependency ranges', () => {
    const f = manifestFixture();
    f.writeInstalled(f.normalized);
    expect(f.check()).toBe(true);
    expect(f.check({})).toBe(false);
  });

  it.each(['version', 'script', 'extra field', 'unrelated dependency', 'unrelated optional', 'partial transformation'])(
    'rejects %s changes even alongside the allowed transformation',
    (mutation) => {
      const f = manifestFixture();
      const changed = structuredClone(f.normalized);
      if (mutation === 'version') changed.version = '1.20.1';
      if (mutation === 'script') changed.scripts.test = 'changed-command';
      if (mutation === 'extra field') Object.assign(changed, { injected: true });
      if (mutation === 'unrelated dependency') changed.dependencies.other = '*';
      if (mutation === 'unrelated optional') changed.optionalDependencies.optional = '*';
      if (mutation === 'partial transformation') changed.optionalDependencies['form-data'] = '^4.0.6';
      f.writeInstalled(changed);
      expect(f.check()).toBe(false);
    }
  );

  it('does not normalize installed JSON formatting before comparing it', () => {
    const f = manifestFixture();
    fs.writeFileSync(f.installedManifest, JSON.stringify(f.normalized));
    expect(f.check()).toBe(false);
  });

  it.each(['runtime', 'extra file', 'missing file', 'symlink'])(
    'retains rejection of %s changes with an otherwise valid manifest',
    (mutation) => {
      const f = manifestFixture();
      f.writeInstalled(f.normalized);
      const runtime = path.join(f.bundle, 'node_modules/axios/index.js');
      if (mutation === 'runtime') fs.appendFileSync(runtime, 'tampered');
      if (mutation === 'extra file') fs.writeFileSync(path.join(f.bundle, 'extra.js'), 'extra');
      if (mutation === 'missing file') fs.unlinkSync(runtime);
      if (mutation === 'symlink') {
        fs.unlinkSync(f.installedManifest);
        fs.symlinkSync(path.join(f.source, f.relative), f.installedManifest);
      }
      expect(f.check()).toBe(false);
    }
  );

  it.each(['wrong pristine hash', 'invalid normalized hash', 'null pin', 'traversal', 'root manifest'])(
    'rejects an invalid alternative: %s',
    (mutation) => {
      const f = manifestFixture();
      const variants = structuredClone(f.resolved.whatsappDependencyManifestVariants);
      const pin = variants[f.relative];
      if (mutation === 'wrong pristine hash') pin.pristine.sha256 = '0'.repeat(64);
      if (mutation === 'invalid normalized hash') pin.normalized.sha256 = 'not-a-hash';
      if (mutation === 'null pin') variants[f.relative] = null;
      if (mutation === 'traversal') variants['node_modules/../package.json'] = pin;
      if (mutation === 'root manifest') variants['package.json'] = pin;
      expect(f.check(variants)).toBe(false);
    }
  );

  it('derives no alternatives when the candidate has no dependency overrides', () => {
    const f = manifestFixture();
    fs.writeFileSync(path.join(f.root, 'package.json'), '{}');
    const resolved = resolveCandidateWhatsAppSource(f.root, f.commit());
    expect(resolved.whatsappDependencyManifestVariants).toEqual({});
  });

  it.each([null, [], { 'form-data': {} }, { '../outside': '1.0.0' }])(
    'refuses a malformed candidate override map %#',
    (overrides) => {
      const f = fixture();
      fs.writeFileSync(path.join(f.root, 'package.json'), JSON.stringify({ overrides }));
      expect(() => resolveCandidateWhatsAppSource(f.root, f.commit())).toThrow('must be string maps');
    }
  );

  it('returns alternatives derived after frozen dependency installation, not a stale pre-install snapshot', () => {
    const f = fixture();
    const execute = vi
      .fn()
      .mockReturnValueOnce('1.3.14\n')
      .mockImplementation(() => {
        fs.writeFileSync(
          path.join(f.source, 'node_modules/axios/package.json'),
          JSON.stringify({ name: 'axios', version: '1.20.0', dependencies: { 'form-data': '^4.0.6' } })
        );
        return '';
      });
    const resolved = prepareCandidateWhatsAppSource(f.root, f.identity, execute);
    expect(Object.keys(resolved.whatsappDependencyManifestVariants)).toEqual(['node_modules/axios/package.json']);
  });
});
