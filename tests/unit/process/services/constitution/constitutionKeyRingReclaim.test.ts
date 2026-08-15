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
 *   (d) covered in constitutionReclaimNotice.test.ts (the user-visible notice
 *       lives on the composer seam every backend shares, not in this service)
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
    }, 60_000);

    // (a) again, on the profile a real user actually has. Writing a
    // Constitution creates `.constitution-keys.enc`, which makes the first read
    // publish a `complete` legacy-migration marker naming the ring's lineage.
    // Renaming that ring aside makes it look REMOVED to the migration guard, so
    // a reclaim that does not understand the binding is refused by it and the
    // turn dies exactly as before. This is the case that matters.
    it('composes a turn against a written Constitution whose key ring cannot be decrypted', () => {
      const { root, authorityPath } = scratchProfile('written');
      const backend = keychainBackend('installation-A');

      const owner = new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath);
      const absent = owner.readConstitution();
      owner.writeConstitution('Be direct.', absent.revision, '3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d');
      expect(owner.readConstitution().status).toBe('present');
      // The two facts that make the easy branch unreachable.
      expect(existsSync(path.join(root, '.constitution-keys.enc'))).toBe(true);
      expect(existsSync(`${authorityPath}.legacy-v1-migration.json`)).toBe(true);
      corruptEnvelope(authorityPath);

      const service = new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath);
      const composed = service.readWithOverlay(undefined);
      expect(composed.constitution.status).toBe('present');
      expect(composed.constitution.content).toBe('Be direct.');
      expect(composed.constitution.revision).toMatch(/^rev:v2:[0-9a-f-]{36}:[A-Za-z0-9_-]+$/);
      expect(service.consumeRevisionAuthorityReclaim()).not.toBeNull();
      expect(lockedSidecars(authorityPath)).toHaveLength(1);

      // The profile is not merely readable, it is whole: the binding moved to
      // the new lineage, so a write still commits against the same
      // authenticated transaction state.
      const written = service.writeConstitution(
        'Be direct, and finish.',
        composed.constitution.revision,
        '4a5b6c7d-8e9f-4a1b-8c2d-3e4f5a6b7c8d'
      );
      expect(written.status).toBe('committed');
      expect(service.readConstitution()).toMatchObject({ status: 'present', content: 'Be direct, and finish.' });
    }, 60_000);

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
    }, 60_000);

    // (c) A secret store that blocks must not be re-entered on every turn and
    // every assertPersisted. The first synchronous native call cannot be
    // interrupted from this process (see the module doc); what is provable, and
    // what is asserted here, is that the expensive blob is attempted ONCE and
    // the turn still completes.
    it('attempts a budget-blowing unlock once and still completes the read', () => {
      const { root, authorityPath } = scratchProfile('budget');
      const owner = new ConstitutionFsService(
        root,
        realBinary(),
        keychainBackend('installation-A'),
        undefined,
        authorityPath
      );
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
    }, 60_000);

    // A store that has gone slow is not evidence about who sealed the ring. The
    // budget must not launder "the keychain would not answer" into "this ring
    // is foreign", because that regenerates a possibly perfect ring and tells
    // the user something untrue about why.
    it('does not reclaim a ring the secret store merely refused to answer for', () => {
      const { root, authorityPath } = scratchProfile('timeout');
      const backend = keychainBackend('installation-A');
      const owner = new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath);
      owner.readConstitution();
      const ring = readFileSync(authorityPath);

      // A blob whose unlock both fails and costs the whole budget. The first
      // attempt is what arms the quarantine; a later service in the same
      // process then meets the quarantine rather than the store.
      let clock = 0;
      const budgeted = withConstitutionSecretUnlockBudget(
        {
          encryptString: backend.encryptString,
          decryptString: (ciphertext) => {
            if (ciphertext === ring.toString('utf8')) {
              clock += 120;
              throw new Error(SAFE_STORAGE_FAILURE);
            }
            clock += 1;
            return backend.decryptString(ciphertext);
          },
        },
        { budgetMs: 50, now: () => clock }
      );
      expect(() => budgeted.decryptString(ring.toString('utf8'))).toThrow(SAFE_STORAGE_FAILURE);

      const service = new ConstitutionFsService(root, realBinary(), budgeted, undefined, authorityPath);
      let thrown: unknown;
      try {
        service.readWithOverlay(undefined);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(ConstitutionFsTransactionError);
      expect((thrown as ConstitutionFsTransactionError).code).toBe(CONSTITUTION_SECRET_UNLOCK_TIMEOUT);
      // The copy stays truthful: nothing here proves the ring came from
      // somewhere else, so it must not say so.
      expect((thrown as Error).message).not.toContain('different installation');
      expect((thrown as Error).message).not.toContain('safeStorage');
      // And the ring is exactly where it was, untouched.
      expect(readFileSync(authorityPath)).toEqual(ring);
      expect(lockedSidecars(authorityPath)).toHaveLength(0);
      expect(service.consumeRevisionAuthorityReclaim()).toBeNull();
    }, 60_000);

    // The reclaim can land between the two halves of minting a revision. If the
    // second half re-resolves the authority it looks the first half's key id up
    // in a ring that never had it, and a raw authority error reaches the user.
    it('mints a revision from one resolution of the authority, not two', () => {
      const { root, authorityPath } = scratchProfile('toctou');
      const backend = keychainBackend('installation-A');
      const owner = new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath);
      const absent = owner.readConstitution();
      owner.writeConstitution('Be direct.', absent.revision, '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d');

      let ringReads = 0;
      const counting: ConstitutionArchiveSecretBackend = {
        encryptString: backend.encryptString,
        decryptString: (ciphertext) => {
          if (ciphertext.startsWith('enc:v1:') && ciphertext === readFileSync(authorityPath, 'utf8')) ringReads += 1;
          return backend.decryptString(ciphertext);
        },
      };
      const service = new ConstitutionFsService(root, realBinary(), counting, undefined, authorityPath);
      const read = service.readConstitution();
      expect(read.status).toBe('present');

      // One authority resolution per revision minted. Re-resolving inside the
      // key lookup doubles this and opens the window the reclaim falls into.
      expect(ringReads).toBe(1);
    }, 60_000);

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
    }, 60_000);

    // If the replacement cannot be minted, the profile must be left exactly as
    // it was found and the user routed to recovery - not stranded between the
    // two states with their ring moved and nothing in its place.
    it('restores the original ring and routes to recovery when the reclaim cannot help', () => {
      const { root, authorityPath } = scratchProfile('unrescuable');
      const owner = new ConstitutionFsService(
        root,
        realBinary(),
        keychainBackend('installation-A'),
        undefined,
        authorityPath
      );
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
      expect((thrown as ConstitutionFsTransactionError).code).toBe(
        'CONSTITUTION_FS_REVISION_AUTHORITY_UNAUTHENTICATED'
      );
      // Never a crypto stack trace, always a remedy.
      expect((thrown as Error).message).not.toContain('safeStorage');
      expect((thrown as Error).message).toContain('Settings');
      // Nothing was reported as reclaimed.
      expect(service.consumeRevisionAuthorityReclaim()).toBeNull();
      // The invariant the doc comment claims, asserted where it is claimed: the
      // ring is back at its canonical path with its original bytes. Checking
      // only that SOME survivor matches is satisfied by the sidecar alone,
      // which is the exact half-reclaimed state this is supposed to forbid.
      expect(readFileSync(authorityPath)).toEqual(sealed);
      expect(lockedSidecars(authorityPath)).toHaveLength(0);
    }, 60_000);

    // The sidecar naming is the only thing standing between a second reclaim
    // and silently overwriting the first generation of preserved bytes.
    it('keeps every generation of preserved ring side by side', () => {
      const { root, authorityPath } = scratchProfile('repeat');
      const backend = keychainBackend('installation-A');
      const generations: Buffer[] = [];

      for (let generation = 0; generation < 3; generation += 1) {
        const owner = new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath);
        owner.readConstitution();
        corruptEnvelope(authorityPath);
        generations.push(readFileSync(authorityPath));
        // A fresh service each time: the reclaim is once per service by design.
        new ConstitutionFsService(root, realBinary(), backend, undefined, authorityPath).readWithOverlay(undefined);
      }

      const sidecars = lockedSidecars(authorityPath);
      expect(sidecars).toHaveLength(3);
      const preserved = sidecars.map((sidecar) => readFileSync(sidecar));
      for (const generation of generations) {
        expect(preserved.some((bytes) => bytes.equals(generation))).toBe(true);
      }
    }, 60_000);
  }
);

describe('constitution secret unlock budget', () => {
  it('fails fast on a blob that already blew the budget, instead of blocking again', () => {
    let clock = 0;
    let calls = 0;
    const budgeted = withConstitutionSecretUnlockBudget(
      {
        encryptString: (plaintext) => plaintext,
        decryptString: () => {
          calls += 1;
          clock += 120_000;
          throw new Error(SAFE_STORAGE_FAILURE);
        },
      },
      { budgetMs: 10_000, now: () => clock }
    );

    // The first synchronous native call cannot be interrupted from here. It is
    // allowed to run to its failure, and that cost is what arms the quarantine.
    expect(() => budgeted.decryptString('slow-blob')).toThrow(SAFE_STORAGE_FAILURE);
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
          if (ciphertext === 'slow-blob') {
            clock += 120_000;
            throw new Error(SAFE_STORAGE_FAILURE);
          }
          clock += 1;
          return ciphertext;
        },
      },
      { budgetMs: 10_000, now: () => clock }
    );

    expect(() => budgeted.decryptString('slow-blob')).toThrow(SAFE_STORAGE_FAILURE);
    expect(() => budgeted.decryptString('slow-blob')).toThrow(CONSTITUTION_SECRET_UNLOCK_TIMEOUT);
    // The degrade path has to be able to read what it just sealed. A global
    // breaker here would turn one recoverable failure into a permanent one.
    expect(budgeted.decryptString('fresh-ring')).toBe('fresh-ring');
  });

  // The budget destroys rings if it treats "slow" as "broken". A ring that
  // opened is a ring that works, however long the store took to say so, and
  // quarantining it would send a healthy profile down the reclaim path and tell
  // the user their ring came from another installation.
  it('never quarantines a slow unlock that actually succeeded', () => {
    let clock = 0;
    let calls = 0;
    const observed: number[] = [];
    const budgeted = withConstitutionSecretUnlockBudget(
      {
        encryptString: (plaintext) => plaintext,
        decryptString: (ciphertext) => {
          calls += 1;
          clock += 120_000;
          return ciphertext;
        },
      },
      { budgetMs: 10_000, now: () => clock, onBudgetExceeded: (elapsed) => observed.push(elapsed) }
    );

    expect(budgeted.decryptString('slow-but-fine')).toBe('slow-but-fine');
    expect(budgeted.decryptString('slow-but-fine')).toBe('slow-but-fine');
    expect(calls).toBe(2);
    expect(observed).toEqual([]);
  });

  it('reports the measured overrun so the cost is discoverable in the log', () => {
    let clock = 0;
    const observed: number[] = [];
    const budgeted = withConstitutionSecretUnlockBudget(
      {
        encryptString: (plaintext) => plaintext,
        decryptString: () => {
          clock += 31_000;
          throw new Error(SAFE_STORAGE_FAILURE);
        },
      },
      { budgetMs: 10_000, now: () => clock, onBudgetExceeded: (elapsed) => observed.push(elapsed) }
    );

    expect(() => budgeted.decryptString('blob')).toThrow(SAFE_STORAGE_FAILURE);
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
