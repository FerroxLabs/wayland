/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const monacoPackage = /@monaco-editor|(?:^|["'/:@])monaco-editor(?:["'/@]|$)/i;

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
    expect(existsSync(resolve(projectRoot, 'node_modules/@monaco-editor'))).toBe(false);
    expect(existsSync(resolve(projectRoot, 'node_modules/monaco-editor'))).toBe(false);
  });

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
