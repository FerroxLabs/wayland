/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const postinstall = require('../../../scripts/postinstall.js') as {
  OBSOLETE_RUNTIME_PACKAGES: string[];
  pruneObsoleteRuntimePackages(nodeModulesRoot: string): string[];
};

const testRoots: string[] = [];

function createNodeModulesRoot(): string {
  const root = resolve(process.cwd(), 'node_modules', `.postinstall-prune-test-${process.pid}-${testRoots.length}`);
  mkdirSync(root, { recursive: true });
  testRoots.push(root);
  return root;
}

function createPackage(root: string, packageName: string): string {
  const packageRoot = resolve(root, ...packageName.split('/'));
  mkdirSync(packageRoot, { recursive: true });
  writeFileSync(resolve(packageRoot, 'package.json'), JSON.stringify({ name: packageName }));
  return packageRoot;
}

afterEach(() => {
  for (const root of testRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('postinstall obsolete runtime pruning', () => {
  it('removes the complete fixed Monaco runtime cohort and preserves unrelated packages', () => {
    const root = createNodeModulesRoot();
    const unrelated = createPackage(root, '@codemirror/view');
    for (const packageName of postinstall.OBSOLETE_RUNTIME_PACKAGES) createPackage(root, packageName);

    expect(postinstall.pruneObsoleteRuntimePackages(root)).toEqual(postinstall.OBSOLETE_RUNTIME_PACKAGES);
    for (const packageName of postinstall.OBSOLETE_RUNTIME_PACKAGES) {
      expect(existsSync(resolve(root, ...packageName.split('/')))).toBe(false);
    }
    expect(existsSync(unrelated)).toBe(true);
  });

  it('is a no-op when the node_modules root or obsolete packages are absent', () => {
    const missingRoot = resolve(process.cwd(), 'node_modules', `.postinstall-missing-${process.pid}`);
    expect(postinstall.pruneObsoleteRuntimePackages(missingRoot)).toEqual([]);

    const emptyRoot = createNodeModulesRoot();
    expect(postinstall.pruneObsoleteRuntimePackages(emptyRoot)).toEqual([]);
  });
});
