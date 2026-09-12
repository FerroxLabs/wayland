import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ digest: '', root: '' }));
vi.mock('../../../../../scripts/tvcontrol/authority.json', () => ({
  default: {
    version: '2.5.1',
    get treeSha256() {
      return fixture.digest;
    },
  },
}));
import { createHash } from 'node:crypto';
import {
  isBundledTvControlDeclaration,
  resolveUserTvControlEntry,
} from '@process/services/mcpServices/bundledTvControl';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
function setup() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'tvcontrol-test-')));
  roots.push(root);
  const source = path.join(root, 'source');
  const workspace = path.join(root, 'workspace');
  fs.mkdirSync(workspace);
  const files = {
    '@ferroxlabs/tvcontrol/package.json': JSON.stringify({ name: '@ferroxlabs/tvcontrol', version: '2.5.1' }),
    '@ferroxlabs/tvcontrol/src/server.js': 'export const version = "2.5.1";',
  };
  for (const [name, text] of Object.entries(files)) {
    const target = path.join(source, 'node_modules', name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }
  fixture.digest = createHash('sha256')
    .update(
      JSON.stringify(
        Object.entries(files).map(([name, text]) => [name, createHash('sha256').update(text).digest('hex')])
      )
    )
    .digest('hex');
  return { root, source, workspace };
}

describe('bundled TVControl session provisioning', () => {
  it('stages the managed server outside the installation directory and verifies reuse', () => {
    const { source, workspace } = setup();
    const entry = resolveUserTvControlEntry(source, workspace);
    expect(entry.startsWith(workspace + path.sep)).toBe(true);
    expect(entry.startsWith(source + path.sep)).toBe(false);
    expect(fs.readFileSync(entry, 'utf8')).toContain('2.5.1');
    expect(resolveUserTvControlEntry(source, workspace)).toBe(entry);
    fs.writeFileSync(entry, 'modified');
    expect(() => resolveUserTvControlEntry(source, workspace)).toThrow('integrity');
    expect(fs.readFileSync(entry, 'utf8')).toBe('modified');
  });
  it('rejects a redirected per-user runtime directory before copying', () => {
    const { source, workspace } = setup();
    fs.symlinkSync(source, path.join(workspace, 'mcp-runtimes'), process.platform === 'win32' ? 'junction' : 'dir');
    expect(() => resolveUserTvControlEntry(source, workspace)).toThrow('redirected');
    expect(fs.existsSync(path.join(source, 'tvcontrol'))).toBe(false);
  });
  it('upgrades known managed declarations and preserves custom or modified ones', () => {
    for (const version of ['2.4.6', '2.4.7', '2.4.8', '2.4.9', '2.5.0']) {
      expect(
        isBundledTvControlDeclaration('npx', ['-y', `@ferroxlabs/tvcontrol@${version}`], 'com.ferroxlabs/tvcontrol')
      ).toBe(true);
      expect(isBundledTvControlDeclaration('npx', [`@ferroxlabs/tvcontrol@${version}`])).toBe(false);
      expect(
        isBundledTvControlDeclaration(
          'bun.exe',
          ['x', '--bun', `@ferroxlabs/tvcontrol@${version}`],
          'com.ferroxlabs/tvcontrol'
        )
      ).toBe(true);
    }
    expect(
      isBundledTvControlDeclaration('npx', ['@ferroxlabs/tvcontrol@2.4.7', '--extra'], 'com.ferroxlabs/tvcontrol')
    ).toBe(false);
  });
  it('rejects wrong versions and user-owned declarations', () => {
    expect(isBundledTvControlDeclaration('npx', ['@ferroxlabs/tvcontrol@2.4.5'], 'com.ferroxlabs/tvcontrol')).toBe(
      false
    );
    expect(isBundledTvControlDeclaration('npx', ['@ferroxlabs/tvcontrol@2.5.1'])).toBe(false);
    expect(isBundledTvControlDeclaration('npx', ['@ferroxlabs/tvcontrol@2.5.1'], 'com.ferroxlabs/tvcontrol')).toBe(
      true
    );
  });
});
