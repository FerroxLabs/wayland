/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Acceptance (d) of the key-ring lane: when the service has to regenerate a key
 * ring it could not unlock, the turn proceeds AND a non-blocking in-thread
 * notice names the cause. Never a modal, never a dead retry button, never
 * silence.
 *
 * This exercises the seam every backend shares. `composePrompt` is what
 * wayland-core, native ACP (Claude Code / Codex), Gemini, non-native ACP and
 * Team role prompts all call to resolve the Constitution, so a notice emitted
 * there reaches all of them; the previous version of this test lived inside one
 * manager and mocked the Constitution service wholesale, which meant it could
 * only prove that one manager called a stub while every other backend reclaimed
 * in silence.
 *
 * The service here is the real one, against a real scratch profile with a real
 * corrupted ring.
 */
import { createHash, createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConstitutionArchiveSecretBackend } from '@process/services/constitution/constitutionFsTransaction';

const { mockAddMessage } = vi.hoisted(() => ({ mockAddMessage: vi.fn() }));

vi.mock('@process/utils/message', () => ({
  addMessage: mockAddMessage,
  addOrUpdateMessage: vi.fn(),
}));

type BinaryFixture = {
  binaryPath: string;
  manifestPath: string;
  sha256: `sha256:${string}`;
  size: number;
  installRoot: string;
};

let cachedFixture: BinaryFixture | undefined;

function binaryFixture(): BinaryFixture {
  if (cachedFixture) return cachedFixture;
  const manifest = path.join(process.cwd(), 'native', 'constitution-fs', 'Cargo.toml');
  execFileSync('cargo', ['build', '--locked', '--manifest-path', manifest], { stdio: 'pipe' });
  const built = path.join(process.cwd(), 'native', 'constitution-fs', 'target', 'debug', 'wayland-constitution-fs');
  const installRoot = mkdtempSync(path.join(os.tmpdir(), 'constitution-notice-binary-'));
  const binaryPath = path.join(installRoot, 'wayland-constitution-fs');
  const manifestPath = path.join(installRoot, 'manifest.json');
  copyFileSync(built, binaryPath);
  chmodSync(binaryPath, 0o700);
  const bytes = readFileSync(binaryPath);
  const sha256 = `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
  writeFileSync(
    manifestPath,
    JSON.stringify({
      schemaVersion: 1,
      protocolVersion: 2,
      platform: process.platform,
      arch: process.arch,
      binary: { fileName: 'wayland-constitution-fs', sha256, size: bytes.byteLength },
    })
  );
  cachedFixture = { binaryPath, manifestPath, sha256, size: bytes.byteLength, installRoot };
  return cachedFixture;
}

/**
 * The Constitution service is a process singleton that refuses to be replaced,
 * so each case gets a fresh module registry and wires its own service into it.
 */
async function freshSeam() {
  vi.resetModules();
  const binaryModule = await import('@process/services/constitution/constitutionFsBinary');
  const serviceModule = await import('@process/services/constitution/constitutionFsService');
  const composeModule = await import('@process/services/constitution/composePrompt');
  const fixture = binaryFixture();
  const binary = binaryModule.verifyConstitutionFsBinary({
    binaryPath: fixture.binaryPath,
    manifestPath: fixture.manifestPath,
    authority: binaryModule.createTestOnlyConstitutionFsBinaryAuthority({
      sha256: fixture.sha256,
      size: fixture.size,
      platform: process.platform,
      arch: process.arch,
      fileName: 'wayland-constitution-fs',
      installRoot: fixture.installRoot,
      packaged: false,
    }),
  });
  return { binary, ...serviceModule, composePrompt: composeModule.composePrompt };
}

const SAFE_STORAGE_FAILURE = 'Error while decrypting the ciphertext provided to safeStorage.decryptString.';

function keychainBackend(identity: string): ConstitutionArchiveSecretBackend {
  const tag = (plaintext: string) => createHmac('sha256', identity).update(plaintext, 'utf8').digest('hex');
  return {
    encryptString: (plaintext) => `enc:v1:${Buffer.from(`${tag(plaintext)}|${plaintext}`, 'utf8').toString('base64')}`,
    decryptString: (ciphertext) => {
      if (!ciphertext.startsWith('enc:v1:')) throw new Error(SAFE_STORAGE_FAILURE);
      const decoded = Buffer.from(ciphertext.slice('enc:v1:'.length), 'base64').toString('utf8');
      const separator = decoded.indexOf('|');
      if (separator < 0) throw new Error(SAFE_STORAGE_FAILURE);
      const plaintext = decoded.slice(separator + 1);
      if (decoded.slice(0, separator) !== tag(plaintext)) throw new Error(SAFE_STORAGE_FAILURE);
      return plaintext;
    },
  };
}

function corruptEnvelope(filePath: string): void {
  const text = readFileSync(filePath).toString('utf8');
  const body = text.slice('enc:v1:'.length);
  const index = Math.floor(body.length / 2);
  const swapped = body[index] === 'A' ? 'B' : 'A';
  writeFileSync(filePath, `enc:v1:${body.slice(0, index)}${swapped}${body.slice(index + 1)}`, { mode: 0o600 });
}

function scratchPaths(label: string) {
  const parent = mkdtempSync(path.join(os.tmpdir(), `constitution-notice-${label}-`));
  return {
    root: path.join(parent, '.wayland'),
    authorityPath: path.join(parent, 'user-data', 'constitution', 'revision-authority.enc'),
  };
}

/** A profile with a written Constitution whose ring this installation cannot open. */
async function reclaimableSeam(label: string) {
  const seam = await freshSeam();
  const { root, authorityPath } = scratchPaths(label);
  const backend = keychainBackend('installation-A');
  const owner = new seam.ConstitutionFsService(root, seam.binary, backend, undefined, authorityPath);
  const absent = owner.readConstitution();
  owner.writeConstitution('Be direct.', absent.revision, '5c2d1e4f-6a7b-4c8d-9e0f-1a2b3c4d5e6f');
  corruptEnvelope(authorityPath);
  seam.setConstitutionFsService(new seam.ConstitutionFsService(root, seam.binary, backend, undefined, authorityPath));
  return seam;
}

function notices() {
  return mockAddMessage.mock.calls.map(
    ([conversationId, message]: [string, { type?: string; content?: { type?: string; content?: string } }]) => ({
      conversationId,
      message,
    })
  );
}

describe.runIf(process.platform === 'darwin' || process.platform === 'linux')(
  'a reclaimed Constitution key ring is reported on the seam every backend shares',
  () => {
    beforeEach(() => {
      mockAddMessage.mockClear();
    });

    it('posts one non-blocking in-thread notice naming the cause', async () => {
      const seam = await reclaimableSeam('reported');

      // composePrompt is what every backend calls. It must return, not throw.
      expect(seam.composePrompt({ conversationId: 'conv-reclaim-1' }).text).toContain('Be direct.');

      const posted = notices();
      expect(posted).toHaveLength(1);
      // Keyed to the conversation whose turn triggered the reclaim.
      expect(posted[0]!.conversationId).toBe('conv-reclaim-1');
      expect(posted[0]!.message.type).toBe('tips');
      // Informational, not an error frame and not a modal.
      expect(posted[0]!.message.content?.type).toBe('warning');

      const notice = String(posted[0]!.message.content?.content ?? '');
      // A human sentence, not a code and not an i18n key path.
      expect(notice).toMatch(/^[A-Z].*\.$/s);
      expect(notice).not.toMatch(/CONSTITUTION_FS_/);
      expect(notice).not.toMatch(/(^|\s)(settings|constitution|conversation)\.[a-zA-Z]/);
      expect(notice).not.toContain('safeStorage');
      expect(notice).not.toContain('—');
      // It names the cause, says what was done, and says where the old file went.
      expect(notice).toContain('could not unlock');
      expect(notice).toContain('different installation');
      expect(notice).toContain('new key ring was created');
      expect(notice).toMatch(/revision-authority\.enc\.locked-\d{8}T\d{6}Z\.$/);
      // The tips surface collapses to about two lines, so the one thing that
      // must not be in here is a long absolute path shoving the cause under the
      // fold. The file name alone is enough to find it.
      expect(notice).not.toContain(`${path.sep}constitution${path.sep}`);
    });

    it('says nothing at all on a healthy profile', async () => {
      const seam = await freshSeam();
      const { root, authorityPath } = scratchPaths('healthy');
      seam.setConstitutionFsService(
        new seam.ConstitutionFsService(root, seam.binary, keychainBackend('installation-A'), undefined, authorityPath)
      );

      seam.composePrompt({ conversationId: 'conv-healthy' });

      expect(notices()).toHaveLength(0);
    });

    it('reports the reclaim once, not on every later turn', async () => {
      const seam = await reclaimableSeam('once');

      seam.composePrompt({ conversationId: 'conv-once' });
      seam.composePrompt({ conversationId: 'conv-once' });
      seam.composePrompt({ conversationId: 'conv-once' });

      expect(notices()).toHaveLength(1);
    });

    it('does not surface one conversation reclaim in an unrelated conversation', async () => {
      const seam = await reclaimableSeam('keyed');

      seam.composePrompt({ conversationId: 'conv-triggered' });
      seam.composePrompt({ conversationId: 'conv-unrelated' });

      const posted = notices();
      expect(posted).toHaveLength(1);
      expect(posted[0]!.conversationId).toBe('conv-triggered');
    });
  }
);
