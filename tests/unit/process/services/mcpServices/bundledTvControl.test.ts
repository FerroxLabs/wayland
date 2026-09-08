import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ digest: '', root: '' }));
vi.mock('../../../../../scripts/tvcontrol/authority.json', () => ({
  default: {
    version: '2.5.3',
    get treeSha256() {
      return fixture.digest;
    },
  },
}));
import { createHash } from 'node:crypto';
import {
  isBundledTvControlDeclaration,
  provisionWorkspaceTvControl,
  provisionTvControlForWorkspacePolicy,
  verifyTvControlTree,
  resolveUserTvControlEntry,
} from '@process/services/mcpServices/bundledTvControl';
import { buildEngineSpawnEnv } from '@process/agent/wcore/envBuilder';

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
    '@ferroxlabs/tvcontrol/package.json': JSON.stringify({ name: '@ferroxlabs/tvcontrol', version: '2.5.3' }),
    '@ferroxlabs/tvcontrol/src/server.js': 'export const version = "2.5.3";',
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
    expect(fs.readFileSync(entry, 'utf8')).toContain('2.5.3');
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
    for (const version of ['2.4.6', '2.4.7', '2.4.8', '2.4.9', '2.5.0', '2.5.1', '2.5.2']) {
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
  it('uses the received scratch root that Core assigns to Bash instead of the inherited temp parent', () => {
    const { source, workspace } = setup();
    const temp = provisionWorkspaceTvControl(workspace, source);
    const scratch = path.join(temp, 'engine-owned-layout', 'trusted');
    fs.mkdirSync(scratch, { recursive: true });
    expect(provisionTvControlForWorkspacePolicy(workspace, temp, [workspace, scratch], source)).toBe(scratch);
    const candidate = fs.readdirSync(scratch).find((name) => name.startsWith('bunx-') && name.includes('tvcontrol'))!;
    expect(verifyTvControlTree(path.join(scratch, candidate))).toBe(true);
  });
  it.runIf(process.platform === 'win32')(
    'accepts the native Core NT-prefixed scratch receipt without changing its authority',
    () => {
      const { source, workspace } = setup();
      const temp = provisionWorkspaceTvControl(workspace, source);
      const scratch = path.join(temp, 'wayland-scratch', 'trusted');
      fs.mkdirSync(scratch, { recursive: true });
      const receiptRoots = [
        path.toNamespacedPath(workspace),
        path.toNamespacedPath(scratch),
        path.toNamespacedPath(source),
      ];
      expect(provisionTvControlForWorkspacePolicy(workspace, temp, receiptRoots, source)).toBe(scratch);
      expect(verifyTvControlTree(path.join(scratch, 'bunx-wayland-tvcontrol-2.5.3'))).toBe(true);
    }
  );
  it.runIf(process.platform === 'win32')('recognizes case and namespace aliases of one scratch grant', () => {
    const { source, workspace } = setup();
    const temp = provisionWorkspaceTvControl(workspace, source);
    const scratch = path.join(temp, 'wayland-scratch', 'trusted');
    fs.mkdirSync(scratch, { recursive: true });
    expect(
      provisionTvControlForWorkspacePolicy(
        workspace,
        path.toNamespacedPath(temp),
        [scratch, path.toNamespacedPath(scratch).toUpperCase()],
        source
      )
    ).toBe(scratch);
  });
  it.runIf(process.platform === 'win32')('still refuses a junction when Core uses a namespace-prefixed receipt', () => {
    const { source, workspace } = setup();
    const temp = provisionWorkspaceTvControl(workspace, source);
    const redirected = path.join(temp, 'redirected');
    fs.symlinkSync(source, redirected, 'junction');
    expect(() =>
      provisionTvControlForWorkspacePolicy(workspace, temp, [path.toNamespacedPath(redirected)], source)
    ).toThrow('redirected');
  });
  it('refuses missing or ambiguous receipt scratch roots without guessing their names', () => {
    const { source, workspace } = setup();
    const temp = provisionWorkspaceTvControl(workspace, source);
    expect(() => provisionTvControlForWorkspacePolicy(workspace, temp, [workspace], source)).toThrow('exactly one');
    expect(() =>
      provisionTvControlForWorkspacePolicy(workspace, temp, [path.join(temp, 'a'), path.join(temp, 'b')], source)
    ).toThrow('exactly one');
  });
  it('refuses a scratch receipt redirected through a symlink', () => {
    const { source, workspace } = setup();
    const temp = provisionWorkspaceTvControl(workspace, source);
    const redirected = path.join(temp, 'redirected');
    fs.symlinkSync(source, redirected, process.platform === 'win32' ? 'junction' : 'dir');
    expect(() => provisionTvControlForWorkspacePolicy(workspace, temp, [workspace, redirected], source)).toThrow(
      'redirected'
    );
    expect(fs.existsSync(path.join(source, 'bunx-wayland-tvcontrol-2.5.3'))).toBe(false);
  });
  it('refuses a receipt outside the workspace and preserves a corrupt scratch copy', () => {
    const { source, workspace } = setup();
    const temp = provisionWorkspaceTvControl(workspace, source);
    expect(() => provisionTvControlForWorkspacePolicy(workspace, temp, [source], source)).toThrow('exactly one');
    const scratch = path.join(temp, 'scratch');
    fs.mkdirSync(scratch);
    provisionTvControlForWorkspacePolicy(workspace, temp, [scratch], source);
    const file = path.join(scratch, 'bunx-wayland-tvcontrol-2.5.3/node_modules/@ferroxlabs/tvcontrol/src/server.js');
    fs.writeFileSync(file, 'changed');
    expect(() => provisionTvControlForWorkspacePolicy(workspace, temp, [scratch], source)).toThrow(
      'Existing workspace'
    );
    expect(fs.readFileSync(file, 'utf8')).toBe('changed');
  });
  it('rejects wrong versions and user-owned declarations', () => {
    expect(isBundledTvControlDeclaration('npx', ['@ferroxlabs/tvcontrol@2.5.4'], 'com.ferroxlabs/tvcontrol')).toBe(
      false
    );
    expect(isBundledTvControlDeclaration('npx', ['@ferroxlabs/tvcontrol@2.4.5'], 'com.ferroxlabs/tvcontrol')).toBe(
      false
    );
    expect(isBundledTvControlDeclaration('npx', ['@ferroxlabs/tvcontrol@2.5.3'])).toBe(false);
    expect(isBundledTvControlDeclaration('npx', ['@ferroxlabs/tvcontrol@2.5.3'], 'com.ferroxlabs/tvcontrol')).toBe(
      true
    );
  });
  it('fails before copying a corrupted bundled dependency', () => {
    const { source, workspace } = setup();
    fs.appendFileSync(path.join(source, 'node_modules/@ferroxlabs/tvcontrol/src/server.js'), 'tampered');
    expect(() => provisionWorkspaceTvControl(workspace, source)).toThrow('integrity');
    expect(fs.existsSync(path.join(workspace, '.wayland-runtime'))).toBe(false);
  });
  it('copies a verified tree where the unmodified collector TMPDIR search finds it', () => {
    const { source, workspace } = setup();
    const temp = provisionWorkspaceTvControl(workspace, source);
    const candidate = fs.readdirSync(temp).find((name) => name.startsWith('bunx-') && name.includes('tvcontrol'))!;
    expect(verifyTvControlTree(path.join(temp, candidate))).toBe(true);
    expect(provisionWorkspaceTvControl(workspace, source)).toBe(temp);
    expect(fs.existsSync(path.join(workspace, '.wayland-core/skills'))).toBe(false);
  });
  it('preserves and refuses a modified existing session copy', () => {
    const { source, workspace } = setup();
    const temp = provisionWorkspaceTvControl(workspace, source);
    const changed = path.join(temp, 'bunx-wayland-tvcontrol-2.5.3/node_modules/@ferroxlabs/tvcontrol/src/server.js');
    fs.writeFileSync(changed, 'user change');
    expect(() => provisionWorkspaceTvControl(workspace, source)).toThrow('Existing workspace');
    expect(fs.readFileSync(changed, 'utf8')).toBe('user change');
  });
  it('refuses a workspace runtime directory redirected outside the workspace', () => {
    const { root, source, workspace } = setup();
    fs.symlinkSync(source, path.join(workspace, '.wayland-runtime'), process.platform === 'win32' ? 'junction' : 'dir');
    expect(() => provisionWorkspaceTvControl(workspace, source)).toThrow('inside the workspace');
    expect(fs.existsSync(path.join(root, 'source/tmp'))).toBe(false);
  });
  it('changes only the engine child temp environment and preserves its output destination', () => {
    const { source, workspace } = setup();
    const before = { TMPDIR: process.env.TMPDIR, TEMP: process.env.TEMP, HOME: process.env.HOME };
    const temp = provisionWorkspaceTvControl(workspace, source);
    const env = buildEngineSpawnEnv({ providerEnv: {}, workspace, managedTempDir: temp });
    expect([env.TMPDIR, env.TEMP, env.TMP]).toEqual([temp, temp, temp]);
    expect(env.WAYLAND_OUTPUT_DIR).toBe(path.join(workspace, 'artifacts'));
    expect({ TMPDIR: process.env.TMPDIR, TEMP: process.env.TEMP, HOME: process.env.HOME }).toEqual(before);
  });
  it('rejects an external temp override', () => {
    const { source, workspace } = setup();
    expect(() => buildEngineSpawnEnv({ providerEnv: {}, workspace, managedTempDir: source })).toThrow(
      'inside its workspace'
    );
  });
});
