/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { SkillGuard } from '@process/services/skills/SkillGuard';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

// D-03 / #885 — trusted-bundle exemption at the verdict producer.
//
// Builtin/first-party skills that ship inside the code-signed, read-only app
// bundle (`source: 'wayland-library'` + a bundle-relative path) legitimately
// contain content the guard flags as *critical* (credential-store references,
// piped-to-shell commands). Before the fix the boot sweep scanned them and
// flipped them to `blocked`, so they refused to load — that is #885.
//
// The exemption is scoped by `isTrustedBundleSkill` = source is exactly
// `wayland-library` AND the path resolves inside the bundle root it would be
// read from. Both facts originate inside the signed bundle, so the exemption
// cannot be spoofed by user content. Every other source (imported / user /
// cli-discovered / team), any absolute path, and any relative path that escapes
// the root (#985) stays fully scanned and blockable.

// A body that trips two independent CRITICAL regex rules: a dot-env secrets
// reference (credential-access) and a piped-to-shell command (shell-execution).
// Either alone yields `blocked` when scanned; a trusted-bundle skill must reach
// `clean` WITHOUT ever being scanned.
const CRITICAL_BODY = '# helper\n\nReads secrets from the .env file, then runs: cat setup.sh | bash';

// Build a lib whose readFile serves `index.json` and any body keyed by a suffix
// match (mirrors skillLibrarySweep.test.ts). `readScanBody` / `loadBody` join
// the entry path under `resourceDir`, so absolute entry paths still resolve to
// a suffix the mock can answer.
const makeLib = (index: SkillIndexEntry[], bodies: Record<string, string>) =>
  SkillLibrary.getInstance({
    resourceDir: '/fake/skills-library',
    readFile: vi.fn(async (p: string): Promise<string> => {
      if (p.endsWith('index.json')) return JSON.stringify(index);
      for (const [key, content] of Object.entries(bodies)) {
        if (p.includes(key)) return content;
      }
      throw new Error(`Not found: ${p}`);
    }),
  });

// Names SkillGuard.scan actually saw, flattened across every batched call.
const scannedNames = (spy: ReturnType<typeof vi.spyOn>): string[] =>
  spy.mock.calls.flatMap((call) => (call[0] as Array<{ name: string }>).map((s) => s.name));

beforeEach(() => {
  SkillLibrary.resetInstance();
  vi.restoreAllMocks();
});

describe('SkillLibrary trusted-bundle exemption (D-03 / #885)', () => {
  it('exempts a wayland-library skill with a relative path and critical content: clean, never scanned, body loads', async () => {
    const scanSpy = vi.spyOn(SkillGuard, 'scan');
    const lib = makeLib(
      [
        {
          name: 'trusted-critical',
          description: 'a first-party helper that documents credentials',
          type: 'skill',
          source: 'wayland-library',
          metadata: { tags: ['helper'] },
          path: 'bodies/trusted-critical.md',
        },
      ],
      { 'trusted-critical': CRITICAL_BODY }
    );

    await lib.rescanStale();

    const entry = await lib.get('trusted-critical');
    expect(entry?.security?.verdict).toBe('clean');
    // The guard was NOT invoked for the trusted entry (provenance, not scan).
    expect(scannedNames(scanSpy)).not.toContain('trusted-critical');
    // And the body loads despite the critical content — #885 symptom retired.
    expect(await lib.loadBody('trusted-critical')).toBe(CRITICAL_BODY);
  });

  it('still scans an imported skill with the same critical content: blocked, body refused', async () => {
    const scanSpy = vi.spyOn(SkillGuard, 'scan');
    const lib = makeLib(
      [
        {
          name: 'imported-critical',
          description: 'an untrusted import',
          type: 'skill',
          source: 'imported',
          metadata: { tags: ['x'] },
          path: 'bodies/imported-critical.md',
        },
      ],
      { 'imported-critical': CRITICAL_BODY }
    );

    await lib.rescanStale();

    const entry = await lib.get('imported-critical');
    expect(entry?.security?.verdict).toBe('blocked');
    expect(scannedNames(scanSpy)).toContain('imported-critical');
    // The enforcement gate still refuses a blocked body.
    expect(await lib.loadBody('imported-critical')).toBeNull();
  });

  it('SECURITY REGRESSION: a wayland-library claim with an ABSOLUTE path is NOT exempted — it is scanned and blocked', async () => {
    const scanSpy = vi.spyOn(SkillGuard, 'scan');
    const lib = makeLib(
      [
        {
          name: 'spoof-skill',
          description: 'claims to be first-party',
          type: 'skill',
          source: 'wayland-library',
          metadata: { tags: ['x'] },
          // Absolute path → body would resolve from a writable location, not the
          // signed bundle. The source label alone must NOT grant trust.
          path: '/evil/spoof.md',
        },
      ],
      { 'spoof.md': CRITICAL_BODY }
    );

    await lib.rescanStale();

    const entry = await lib.get('spoof-skill');
    expect(entry?.security?.verdict).toBe('blocked');
    expect(scannedNames(scanSpy)).toContain('spoof-skill');
    expect(await lib.loadBody('spoof-skill')).toBeNull();
  });

  it('SECURITY REGRESSION (#985): a wayland-library claim with a TRAVERSING relative path is NOT exempted', async () => {
    const scanSpy = vi.spyOn(SkillGuard, 'scan');
    const lib = makeLib(
      [
        {
          name: 'traversal-skill',
          description: 'claims to be first-party',
          type: 'skill',
          source: 'wayland-library',
          metadata: { tags: ['x'] },
          // Relative, so `path.isAbsolute` is false - but it escapes the bundle
          // root entirely, so the body would come from a writable location. A
          // non-absolute path is NOT proof of bundle anchoring.
          path: '../../../../tmp/evil.md',
        },
      ],
      { 'evil.md': CRITICAL_BODY }
    );

    await lib.rescanStale();

    const entry = await lib.get('traversal-skill');
    expect(entry?.security?.verdict).toBe('blocked');
    expect(scannedNames(scanSpy)).toContain('traversal-skill');
    expect(await lib.loadBody('traversal-skill')).toBeNull();
  });

  it('#985: still exempts a nested relative path that stays inside the bundle root', async () => {
    const scanSpy = vi.spyOn(SkillGuard, 'scan');
    const lib = makeLib(
      [
        {
          name: 'nested-trusted',
          description: 'first-party, nested under the bundle root',
          type: 'skill',
          source: 'wayland-library',
          metadata: { tags: ['helper'] },
          path: 'bodies/nested/deep/nested-trusted.md',
        },
      ],
      { 'nested-trusted': CRITICAL_BODY }
    );

    await lib.rescanStale();

    const entry = await lib.get('nested-trusted');
    expect(entry?.security?.verdict).toBe('clean');
    expect(scannedNames(scanSpy)).not.toContain('nested-trusted');
  });

  it('does not exempt a team skill (writable user-data): critical content is scanned and blocked', async () => {
    const scanSpy = vi.spyOn(SkillGuard, 'scan');
    const lib = makeLib(
      [
        {
          name: 'team-critical',
          description: 'a team-shared skill',
          type: 'skill',
          source: 'team',
          metadata: { tags: ['x'] },
          path: '/team/team-critical.md',
        },
      ],
      { 'team-critical': CRITICAL_BODY }
    );

    await lib.rescanStale();

    const entry = await lib.get('team-critical');
    expect(entry?.security?.verdict).toBe('blocked');
    expect(scannedNames(scanSpy)).toContain('team-critical');
  });
});

describe('SkillLibrary.rescanIfStale trusted-bundle exemption (D-03 / #885)', () => {
  it('exempts a trusted-bundle skill on the single-skill path without scanning', async () => {
    const scanSpy = vi.spyOn(SkillGuard, 'scan');
    const lib = makeLib(
      [
        {
          name: 'trusted-single',
          description: 'first-party single-scan path',
          type: 'skill',
          source: 'wayland-library',
          metadata: { tags: ['helper'] },
          path: 'bodies/trusted-single.md',
        },
      ],
      { 'trusted-single': CRITICAL_BODY }
    );

    const report = await lib.rescanIfStale('trusted-single');

    expect(report?.verdict).toBe('clean');
    expect(scannedNames(scanSpy)).not.toContain('trusted-single');
  });

  it('still scans an imported skill on the single-skill path: blocked', async () => {
    const scanSpy = vi.spyOn(SkillGuard, 'scan');
    const lib = makeLib(
      [
        {
          name: 'imported-single',
          description: 'untrusted single-scan path',
          type: 'skill',
          source: 'imported',
          metadata: { tags: ['x'] },
          path: 'bodies/imported-single.md',
        },
      ],
      { 'imported-single': CRITICAL_BODY }
    );

    const report = await lib.rescanIfStale('imported-single');

    expect(report?.verdict).toBe('blocked');
    expect(scannedNames(scanSpy)).toContain('imported-single');
  });
});
