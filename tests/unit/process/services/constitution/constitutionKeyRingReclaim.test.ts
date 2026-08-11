/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Constitution key ring must degrade, not brick.
 *
 * Live defect: every conversational turn on every backend died with
 * "Error while decrypting the ciphertext provided to safeStorage.decryptString".
 * The artifact that could not be opened is the revision authority - a 355-byte
 * ring of HMAC keys that sign the short-lived `rev:v2:` compare-and-swap tokens
 * a read hands back on the next write. It holds no user content, and the
 * Constitution text itself is not sealed with it. It is regenerable, so losing
 * it must cost at most an in-flight token, never the whole product.
 *
 * These are the acceptance cases, and each is written so it can fail:
 *   (a) a profile whose ring is undecryptable still composes a turn's prompt
 *   (b) the old ciphertext survives beside the new ring, byte for byte
 *   (c) a pathologically slow secret store cannot be re-entered past the budget
 *   (d) covered in tests/unit/WCoreManagerConstitutionReclaim.test.ts (the
 *       user-visible notice lives in the turn surface, not in this service)
 */
import { createHash, createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ConstitutionFsBinaryError,
  createTestOnlyConstitutionFsBinaryAuthority,
  verifyConstitutionFsBinary,
} from '@process/services/constitution/constitutionFsBinary';
import { ConstitutionFsService } from '@process/services/constitution/constitutionFsService';
import { ConstitutionFsTransactionError } from '@process/services/constitution/constitutionFsTransaction';
import type { ConstitutionArchiveSecretBackend } from '@process/services/constitution/constitutionFsTransaction';
import {
  CONSTITUTION_SECRET_UNLOCK_TIMEOUT,
  isConstitutionSecretUnlockTimeout,
  withConstitutionSecretUnlockBudget,
} from '@process/services/constitution/constitutionSecretUnlockBudget';

void ConstitutionFsBinaryError;

let cachedRealBinary: ReturnType<typeof verifyConstitutionFsBinary> | undefined;

function realBinary() {
  if (cachedRealBinary) return cachedRealBinary;
  const manifest = path.join(process.cwd(), 'native', 'constitution-fs', 'Cargo.toml');
  execFileSync('cargo', ['build', '--locked', '--manifest-path', manifest], { stdio: 'pipe' });
  const built = path.join(process.cwd(), 'native', 'constitution-fs', 'target', 'debug', 'wayland-constitution-fs');
  const installRoot = mkdtempSync(path.join(os.tmpdir(), 'constitution-reclaim-binary-'));
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
  cachedRealBinary = verifyConstitutionFsBinary({
    binaryPath,
    manifestPath,
    authority: createTestOnlyConstitutionFsBinaryAuthority({
      sha256,
      size: bytes.byteLength,
      platform: process.platform,
      arch: process.arch,
      fileName: 'wayland-constitution-fs',
      installRoot,
      packaged: false,
    }),
  });
  return cachedRealBinary;
}

const SAFE_STORAGE_FAILURE = 'Error while decrypting the ciphertext provided to safeStorage.decryptString.';

/**
 * A stand-in for Electron `safeStorage` that behaves the way the real one does
 * on the failure under test: ciphertext carries the `enc:v1:` envelope, and a
 * blob whose bytes were not sealed by THIS identity throws the exact crypto
 * error the owner saw. Byte-corrupting a real envelope lands in the same place,
 * which is how the fixture below is built.
 */
function keychainBackend(
  identity: string,
  hooks: { onDecrypt?: (ciphertext: string) => void } = {}
): ConstitutionArchiveSecretBackend {
  const tag = (plaintext: string) => createHmac('sha256', identity).update(plaintext, 'utf8').digest('hex');
  return {
    encryptString: (plaintext) => `enc:v1:${Buffer.from(`${tag(plaintext)}|${plaintext}`, 'utf8').toString('base64')}`,
    decryptString: (ciphertext) => {
      hooks.onDecrypt?.(ciphertext);
      if (!ciphertext.startsWith('enc:v1:')) throw new Error(SAFE_STORAGE_FAILURE);
      const decoded = Buffer.from(ciphertext.slice('enc:v1:'.length), 'base64').toString('utf8');
      const separator = decoded.indexOf('|');
      if (separator < 0) throw new Error(SAFE_STORAGE_FAILURE);
      const plaintext = decoded.slice(separator + 1);
      // Authenticated, exactly like the real thing: a flipped byte or a foreign
      // identity fails the tag rather than yielding readable garbage.
      if (decoded.slice(0, separator) !== tag(plaintext)) throw new Error(SAFE_STORAGE_FAILURE);
      return plaintext;
    },
  };
}

/** Flip one byte of the sealed envelope in place, leaving the `enc:v1:` prefix. */
function corruptEnvelope(filePath: string): Buffer {
  const original = readFileSync(filePath);
  const text = original.toString('utf8');
  const body = text.slice('enc:v1:'.length);
  const index = Math.floor(body.length / 2);
  const swapped = body[index] === 'A' ? 'B' : 'A';
  writeFileSync(filePath, `enc:v1:${body.slice(0, index)}${swapped}${body.slice(index + 1)}`, { mode: 0o600 });
  return original;
}

function lockedSidecars(authorityPath: string): string[] {
  const directory = path.dirname(authorityPath);
  return readdirSync(directory)
    .filter((name) => name.startsWith(`${path.basename(authorityPath)}.locked-`))
    .map((name) => path.join(directory, name));
}

function scratchProfile(label: string) {
  const parent = mkdtempSync(path.join(os.tmpdir(), `constitution-reclaim-${label}-`));
  return {
    root: path.join(parent, '.wayland'),
    authorityPath: path.join(parent, 'user-data', 'constitution', 'revision-authority.enc'),
  };
}

describe.runIf(process.platform === 'darwin' || process.platform === 'linux')(
  'Constitution key ring degrades instead of bricking the product',
  () => {
    // (a) The exact shape of the owner's profile: a real, correctly-published
    // `enc:v1:` ring whose bytes this installation cannot open. Before this
    // change the read threw and every turn on every backend died on it.
    it('composes a turn against a profile whose key ring cannot be decrypted', () => {
      const { root, authorityPath } = scratchProfile('turn');
      const backend = keychainBackend('installation-A');

      const owner = new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath);
      expect(owner.readConstitution().status).toBe('absent');
      expect(existsSync(authorityPath)).toBe(true);
      corruptEnvelope(authorityPath);

      // A fresh process against the same, now-unreadable profile.
      const service = new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath);

      // readWithOverlay is what composePrompt calls, which is what
      // WCoreManager.start calls. It must return, not throw.
      const composed = service.readWithOverlay(undefined);
      expect(composed.constitution.status).toBe('absent');
      // A usable ring was minted: the revision token is signed and well-formed.
      expect(composed.constitution.revision).toMatch(/^rev:v2:[0-9a-f-]{36}:[A-Za-z0-9_-]+$/);
      // And the service reports the reclaim exactly once, for the surface above.
      const reclaim = service.consumeRevisionAuthorityReclaim();
      expect(reclaim).not.toBeNull();
      expect(service.consumeRevisionAuthorityReclaim()).toBeNull();
    });

    // (b) The bytes are the user's. Regenerating the ring is allowed; destroying
    // what could not be read is not.
    it('keeps the unreadable ciphertext beside the new ring, byte for byte', () => {
      const { root, authorityPath } = scratchProfile('preserve');
      const backend = keychainBackend('installation-A');

      const owner = new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath);
      owner.readConstitution();
      corruptEnvelope(authorityPath);
      const unreadable = readFileSync(authorityPath);

      const service = new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath);
      service.readWithOverlay(undefined);

      const sidecars = lockedSidecars(authorityPath);
      expect(sidecars).toHaveLength(1);
      expect(readFileSync(sidecars[0]!)).toEqual(unreadable);
      // The replacement is a genuinely different ring, not the same bytes moved.
      expect(readFileSync(authorityPath)).not.toEqual(unreadable);
      const reclaim = service.consumeRevisionAuthorityReclaim();
      expect(reclaim?.archivedPath).toBe(sidecars[0]);
    });

    // (c) A secret store that blocks must not be re-entered on every turn and
    // every assertPersisted. The first synchronous native call cannot be
    // interrupted from this process (see the module doc); what is provable, and
    // what is asserted here, is that the expensive blob is attempted ONCE and
    // the turn still completes.
    it('attempts a budget-blowing unlock once and still completes the read', () => {
      const { root, authorityPath } = scratchProfile('budget');
      const owner = new ConstitutionFsService(root, realBinary(), keychainBackend('installation-A'), undefined, authorityPath);
      owner.readConstitution();
      corruptEnvelope(authorityPath);
      const unreadable = readFileSync(authorityPath, 'utf8');

      const attempts: string[] = [];
      const slow = keychainBackend('installation-A', {
        onDecrypt: (ciphertext) => {
          attempts.push(ciphertext);
        },
      });
      // A clock the wrapper reads, so the budget is exercised without the test
      // actually sleeping: every unlock "takes" 120ms against a 50ms budget.
      let clock = 0;
      const budgeted = withConstitutionSecretUnlockBudget(
        {
          encryptString: slow.encryptString,
          decryptString: (ciphertext) => {
            // Only the foreign blob is expensive, which is the real shape: the
            // macOS keychain prompt is raised by the item this identity cannot
            // open, not by the ring this installation just sealed.
            clock += ciphertext === unreadable ? 120 : 1;
            return slow.decryptString(ciphertext);
          },
        },
        { budgetMs: 50, now: () => clock }
      );

      const service = new ConstitutionFsService(root, realBinary(), budgeted, undefined, authorityPath);
      expect(service.readWithOverlay(undefined).constitution.status).toBe('absent');

      // The unreadable ring cost its budget exactly once, even though the read
      // path re-verifies the authority on every revision it mints.
      expect(attempts.filter((ciphertext) => ciphertext === unreadable)).toHaveLength(1);
      // Everything after that is the replacement ring, which is readable here.
      expect(attempts.length).toBeGreaterThan(1);
    });

    // The distinction that keeps this from being a blanket "delete what you
    // cannot read": a ring that decrypts fine but is structurally corrupt is
    // NOT an unlock failure and must still fail closed.
    it('does not reclaim a ring that decrypts but does not validate', () => {
      const { root, authorityPath } = scratchProfile('invalid');
      const backend = keychainBackend('installation-A');
      const owner = new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath);
      owner.readConstitution();
      writeFileSync(authorityPath, backend.encryptString('{"schemaVersion":3}'), { mode: 0o600 });

      const service = new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath);
      expect(() => service.readWithOverlay(undefined)).toThrow('CONSTITUTION_FS_REVISION_AUTHORITY_INVALID');
      expect(lockedSidecars(authorityPath)).toHaveLength(0);
      expect(service.consumeRevisionAuthorityReclaim()).toBeNull();
    });

    // If the replacement cannot be minted, the profile must be left exactly as
    // it was found and the user routed to recovery - not stranded between the
    // two states with their ring moved and nothing in its place.
    it('restores the original ring and routes to recovery when the reclaim cannot help', () => {
      const { root, authorityPath } = scratchProfile('unrescuable');
      const owner = new ConstitutionFsService(root, realBinary(), keychainBackend('installation-A'), undefined, authorityPath);
      owner.readConstitution();
      const sealed = readFileSync(authorityPath);

      // Seals fine, opens nothing - not even what it just wrote.
      const hopeless: ConstitutionArchiveSecretBackend = {
        encryptString: keychainBackend('installation-B').encryptString,
        decryptString: () => {
          throw new Error(SAFE_STORAGE_FAILURE);
        },
      };
      const service = new ConstitutionFsService(root, realBinary(), hopeless, undefined, authorityPath);

      let thrown: unknown;
      try {
        service.readWithOverlay(undefined);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(ConstitutionFsTransactionError);
      expect((thrown as ConstitutionFsTransactionError).code).toBe('CONSTITUTION_FS_REVISION_AUTHORITY_UNAUTHENTICATED');
      // Never a crypto stack trace, always a remedy.
      expect((thrown as Error).message).not.toContain('safeStorage');
      expect((thrown as Error).message).toContain('Settings');
      // Nothing was reported as reclaimed, and the bytes still exist.
      expect(service.consumeRevisionAuthorityReclaim()).toBeNull();
      const survivors = [authorityPath, ...lockedSidecars(authorityPath)].filter((candidate) => existsSync(candidate));
      expect(survivors.some((candidate) => readFileSync(candidate).equals(sealed))).toBe(true);
    });
  }
);

describe('constitution secret unlock budget', () => {
  it('fails fast on a blob that already blew the budget, instead of blocking again', () => {
    let clock = 0;
    let calls = 0;
    const budgeted = withConstitutionSecretUnlockBudget(
      {
        encryptString: (plaintext) => plaintext,
        decryptString: (ciphertext) => {
          calls += 1;
          clock += 120_000;
          return ciphertext;
        },
      },
      { budgetMs: 10_000, now: () => clock }
    );

    // The first synchronous native call cannot be interrupted from here. It is
    // allowed to return, and its cost is what arms the quarantine.
    expect(budgeted.decryptString('slow-blob')).toBe('slow-blob');
    expect(calls).toBe(1);

    const before = clock;
    let thrown: unknown;
    try {
      budgeted.decryptString('slow-blob');
    } catch (error) {
      thrown = error;
    }
    // Bounded: no time passed, and the backend was never re-entered.
    expect(clock - before).toBe(0);
    expect(calls).toBe(1);
    expect(isConstitutionSecretUnlockTimeout(thrown)).toBe(true);
    expect((thrown as Error).message).toBe(CONSTITUTION_SECRET_UNLOCK_TIMEOUT);
  });

  it('quarantines only the blob that was slow, so a replacement ring stays readable', () => {
    let clock = 0;
    const budgeted = withConstitutionSecretUnlockBudget(
      {
        encryptString: (plaintext) => plaintext,
        decryptString: (ciphertext) => {
          clock += ciphertext === 'slow-blob' ? 120_000 : 1;
          return ciphertext;
        },
      },
      { budgetMs: 10_000, now: () => clock }
    );

    budgeted.decryptString('slow-blob');
    expect(() => budgeted.decryptString('slow-blob')).toThrow(CONSTITUTION_SECRET_UNLOCK_TIMEOUT);
    // The degrade path has to be able to read what it just sealed. A global
    // breaker here would turn one recoverable failure into a permanent one.
    expect(budgeted.decryptString('fresh-ring')).toBe('fresh-ring');
  });

  it('reports the measured overrun so the cost is discoverable in the log', () => {
    let clock = 0;
    const observed: number[] = [];
    const budgeted = withConstitutionSecretUnlockBudget(
      {
        encryptString: (plaintext) => plaintext,
        decryptString: (ciphertext) => {
          clock += 31_000;
          return ciphertext;
        },
      },
      { budgetMs: 10_000, now: () => clock, onBudgetExceeded: (elapsed) => observed.push(elapsed) }
    );

    budgeted.decryptString('blob');
    expect(observed).toEqual([31_000]);
  });

  it('leaves a fast unlock completely alone', () => {
    let clock = 0;
    const budgeted = withConstitutionSecretUnlockBudget(
      {
        encryptString: (plaintext) => plaintext,
        decryptString: (ciphertext) => {
          clock += 5;
          return ciphertext;
        },
      },
      { budgetMs: 10_000, now: () => clock }
    );

    expect(budgeted.decryptString('blob')).toBe('blob');
    expect(budgeted.decryptString('blob')).toBe('blob');
    expect(budgeted.decryptString('blob')).toBe('blob');
  });
});
