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
