/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * #1049 - no dependency in this repo may resolve through the GitHub API.
 *
 * `@whiskeysockets/baileys` was pinned to a commit, and that commit declares
 * `libsignal: git+https://github.com/whiskeysockets/libsignal-node`. So EVERY
 * `bun install --frozen-lockfile`, on every job, on every platform, made
 * api.github.com calls for a transitive dependency, and a GitHub wobble reddened
 * arbitrary checks:
 *
 *     error: GET https://api.github.com/repos/whiskeysockets/libsignal-node/tarball/bcea72d - 504
 *
 * On 2026-08-17 that cost PR #1022 its I18n check and three macOS shards, twice.
 * Retrying survives the outage; removing the git resolution closes it. Published
 * baileys >= 7.0.0-rc11 takes `libsignal: ^6.0.0` from the registry and declares
 * no git dependency at all.
 *
 * The lockfiles are asserted, not just the manifests: a registry SPEC whose
 * resolved tree still reaches git would keep the exposure while looking fixed.
 */
const ROOT = path.resolve(__dirname, '../../..');
const BRIDGE = path.join(ROOT, 'src/process/channels/whatsapp-bridge');

/** A `github:` or `git+…:` reference anywhere in a lockfile line. */
const GIT_REFERENCE = /github:|git\+(https|ssh|file):/;

function gitReferencingLines(file: string): string[] {
  return readFileSync(file, 'utf-8')
    .split('\n')
    .map((line, index) => [index + 1, line] as const)
    .filter(([, line]) => GIT_REFERENCE.test(line))
    .map(([number, line]) => `${path.relative(ROOT, file)}:${number}: ${line.trim().slice(0, 180)}`);
}

function dependencySpec(manifest: string, name: string): string | undefined {
  const pkg = JSON.parse(readFileSync(manifest, 'utf-8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
}

describe('#1049 dependencies resolve from the registry, never the GitHub API', () => {
  it.each([
    ['app package.json', path.join(ROOT, 'package.json')],
    ['whatsapp-bridge package.json', path.join(BRIDGE, 'package.json')],
  ])('%s pins baileys to a published version', (_label, manifest) => {
    const spec = dependencySpec(manifest, '@whiskeysockets/baileys');
    expect(spec).toBeDefined();
    expect(spec).not.toMatch(GIT_REFERENCE);
    // A published version, and one new enough to have dropped the git
    // dependency on libsignal (7.0.0-rc11 was the first).
    expect(spec).toMatch(/^7\.0\.0-rc(1[1-9]|[2-9]\d)$/);
  });

  it.each([
    ['app bun.lock', path.join(ROOT, 'bun.lock')],
    ['whatsapp-bridge bun.lock', path.join(BRIDGE, 'bun.lock')],
  ])('%s resolves nothing through git', (_label, lockfile) => {
    expect(gitReferencingLines(lockfile)).toEqual([]);
  });
});
