/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const runtimeTextExtensions = new Set(['.cjs', '.css', '.html', '.js', '.json', '.jsx', '.mjs', '.ts', '.tsx']);
const forbiddenRuntimePatterns = [
  /@monaco-editor\//i,
  /(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"]monaco-editor(?:\/|['"])/i,
  /(?:https?:)?\/\/[^\s'"]*(?:monaco-editor|monaco\/min\/vs)/i,
  /[\\/]node_modules[\\/]monaco-editor[\\/]/i,
];

function collectRuntimeFiles(path: string): string[] {
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return runtimeTextExtensions.has(extname(path)) ? [path] : [];

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'skills-library') return [];
    return collectRuntimeFiles(resolve(path, entry.name));
  });
}

describe('Monaco-free runtime boundary', () => {
  it('locks the repaired dependency cohort without Monaco packages', () => {
    const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      overrides: Record<string, string>;
      resolutions: Record<string, string>;
    };
    const lockfile = readFileSync(resolve(projectRoot, 'bun.lock'), 'utf8');
    const allDeclaredDependencies = JSON.stringify({
      dependencies: packageJson.dependencies,
      devDependencies: packageJson.devDependencies,
      overrides: packageJson.overrides,
      resolutions: packageJson.resolutions,
    });

    expect(packageJson.dependencies).toMatchObject({
      '@codemirror/language': '^6.12.2',
      '@codemirror/state': '^6.6.0',
      '@codemirror/view': '^6.40.0',
      dompurify: '^3.4.12',
      mermaid: '^11.16.0',
      multer: '^2.2.0',
      'react-router-dom': '^7.18.1',
      ws: '^8.21.1',
    });
    expect(packageJson.devDependencies.vite).toBe('^6.4.3');

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

    expect(allDeclaredDependencies).not.toMatch(/@monaco-editor|"monaco-editor"/i);
    expect(lockfile).not.toMatch(/@monaco-editor|"monaco-editor"\s*:|monaco-editor@\d/i);
    expect(existsSync(resolve(projectRoot, 'node_modules/@monaco-editor'))).toBe(false);
    expect(existsSync(resolve(projectRoot, 'node_modules/monaco-editor'))).toBe(false);
  });

  it('rejects Monaco imports, loaders, CDNs, and build configuration', () => {
    const runtimeFiles = [
      resolve(projectRoot, 'electron.vite.config.ts'),
      resolve(projectRoot, 'vite.renderer.config.ts'),
      resolve(projectRoot, 'src/renderer/index.html'),
      ...collectRuntimeFiles(resolve(projectRoot, 'src')),
      ...collectRuntimeFiles(resolve(projectRoot, 'public')),
      ...collectRuntimeFiles(resolve(projectRoot, 'resources')),
      ...collectRuntimeFiles(resolve(projectRoot, 'assets')),
    ];

    expect(runtimeFiles.length).toBeGreaterThan(100);
    for (const file of runtimeFiles) {
      const source = readFileSync(file, 'utf8');
      for (const pattern of forbiddenRuntimePatterns) {
        expect(source, `${file} contains ${pattern}`).not.toMatch(pattern);
      }
    }

    const htmlViewer = readFileSync(
      resolve(projectRoot, 'src/renderer/pages/conversation/Preview/components/viewers/HTMLViewer.tsx'),
      'utf8'
    );
    expect(htmlViewer).toContain('../editors/HTMLEditor');
  });
});
