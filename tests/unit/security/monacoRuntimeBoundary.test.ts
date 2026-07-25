/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const monacoPackage = /@monaco-editor|(?:^|["'/:@])monaco-editor(?:["'/@]|$)/i;

function installedPackageManifests(root: string): string[] {
  if (!existsSync(root)) return [];

  const manifests: string[] = [];
  // `aliased` marks a directory reached through a symlink. Only those need a
  // realpath to break symlink cycles - real directories cannot form one - and
  // realpathSync opens a handle per directory on Windows, so canonicalizing all
  // ~21k node_modules directories was why this test blew the 10s timeout there
  // while finishing in under a second on macOS.
  const pending: { directory: string; aliased: boolean }[] = [{ directory: root, aliased: true }];
  const visited = new Set<string>();

  while (pending.length > 0) {
    const { directory, aliased } = pending.pop()!;
    if (aliased) {
      let canonicalDirectory: string;
      try {
        canonicalDirectory = realpathSync(directory);
      } catch {
        continue;
      }
      if (visited.has(canonicalDirectory)) continue;
      visited.add(canonicalDirectory);
    }

    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isFile() && entry.name === 'package.json') {
        manifests.push(path);
        continue;
      }
      if (entry.isDirectory()) {
        pending.push({ directory: path, aliased: false });
        continue;
      }
      if (entry.isSymbolicLink()) {
        try {
          if (statSync(path).isDirectory()) pending.push({ directory: path, aliased: true });
        } catch {
          // Broken optional-dependency links do not represent installed packages.
        }
      }
    }
  }

  return manifests;
}

describe('Monaco-free dependency and build-input boundary', () => {
  it('locks the repaired dependency cohort without Monaco packages', () => {
    const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    const dependencies = packageJson.dependencies as Record<string, string>;
    const devDependencies = packageJson.devDependencies as Record<string, string>;
    const lockfile = readFileSync(resolve(projectRoot, 'bun.lock'), 'utf8');
    const declaredDependencySurfaces = JSON.stringify(
      Object.fromEntries(
        Object.entries(packageJson).filter(([key]) =>
          [
            'dependencies',
            'devDependencies',
            'optionalDependencies',
            'peerDependencies',
            'overrides',
            'resolutions',
          ].includes(key)
        )
      )
    );

    expect(dependencies).toMatchObject({
      '@codemirror/language': '^6.12.2',
      '@codemirror/state': '^6.6.0',
      '@codemirror/view': '^6.40.0',
      dompurify: '^3.4.12',
      mermaid: '^11.16.0',
      multer: '^2.2.0',
      'react-router-dom': '^7.18.1',
      ws: '^8.21.1',
    });
    expect(devDependencies.vite).toBe('^6.4.3');

    for (const [name, version] of Object.entries({
      dompurify: '3.4.12',
      mermaid: '11.16.0',
      multer: '2.2.0',
      'react-router-dom': '7.18.1',
      vite: '6.4.3',
      ws: '8.21.1',
    })) {
      expect(lockfile).toContain(`"${name}": ["${name}@${version}"`);
    }

    expect(declaredDependencySurfaces).not.toMatch(monacoPackage);
    expect(lockfile).not.toMatch(/@monaco-editor|"monaco-editor"\s*:|monaco-editor@\d/i);
    const installedPackages = installedPackageManifests(resolve(projectRoot, 'node_modules')).map((manifestPath) => {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
        name?: string;
        version?: string;
      };
      return { manifestPath, name: manifest.name ?? '', version: manifest.version ?? '' };
    });
    const installedMonacoPackages = installedPackages.filter(({ name }) => monacoPackage.test(name));

    expect(installedMonacoPackages).toEqual([]);

    for (const [name, version] of Object.entries({
      dompurify: '3.4.12',
      mermaid: '11.16.0',
      multer: '2.2.0',
      'react-router-dom': '7.18.1',
      vite: '6.4.3',
      ws: '8.21.1',
    })) {
      const installedManifest = JSON.parse(
        readFileSync(resolve(projectRoot, 'node_modules', name, 'package.json'), 'utf8')
      ) as { name: string; version: string };
      expect(installedManifest).toMatchObject({ name, version });
    }
    // Walking every installed package is inherently filesystem-bound: ~21k
    // directories and ~3.1k manifests. That is under a second on macOS and CI
    // Linux, but a Windows shard pays per-syscall antivirus cost on all of it
    // and exceeded the 10s default.
  }, 60_000);

  it('keeps Monaco out of the owned renderer build inputs', () => {
    const buildInputs = [
      'electron.vite.config.ts',
      'vite.renderer.config.ts',
      'src/renderer/pages/conversation/Preview/components/viewers/HTMLViewer.tsx',
    ];

    for (const relativePath of buildInputs) {
      const source = readFileSync(resolve(projectRoot, relativePath), 'utf8');
      expect(source, `${relativePath} contains a Monaco build input`).not.toMatch(monacoPackage);
    }

    const htmlViewer = readFileSync(
      resolve(projectRoot, 'src/renderer/pages/conversation/Preview/components/viewers/HTMLViewer.tsx'),
      'utf8'
    );
    expect(htmlViewer).toContain('../editors/HTMLEditor');
  });
});
