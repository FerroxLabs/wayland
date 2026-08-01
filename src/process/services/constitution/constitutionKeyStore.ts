import { randomBytes, randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import type { ConstitutionArchiveSecretBackend } from './constitutionFsTransaction';
import { constitutionRevisionDurabilitySyncPath } from './constitutionRevisionAuthority';
import { syncPublicationTargetSync } from '@process/utils/durabilitySync';

type KeyState = {
  schemaVersion: 1;
  journalKeyBase64: string;
  activeArchiveKeyId: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ConstitutionKeyStoreDependencies = Readonly<{
  linkPublication?: (temporary: string, statePath: string) => void;
  replacePublication?: (temporary: string, statePath: string) => void;
  syncPublication?: (statePath: string) => void;
}>;

function syncPublication(statePath: string): void {
  // 'r' is O_RDONLY, which Windows refuses to fsync; route through the shared
  // platform rule instead.
  syncPublicationTargetSync(constitutionRevisionDurabilitySyncPath(statePath));
}

function hasTransactionHistory(root: string): boolean {
  const history = path.join(root, 'archives', 'constitution-history');
  if (!existsSync(history)) return false;
  const stat = lstatSync(history);
  if (!stat.isDirectory() || stat.isSymbolicLink()) return true;
  return readdirSync(history).length > 0;
}

function parseState(raw: string): KeyState {
  const value = JSON.parse(raw) as Partial<KeyState>;
  const keys = Object.keys(value).toSorted();
  const key = Buffer.from(value.journalKeyBase64 ?? '', 'base64');
  if (
    JSON.stringify(keys) !== JSON.stringify(['activeArchiveKeyId', 'journalKeyBase64', 'schemaVersion']) ||
    value.schemaVersion !== 1 ||
    key.byteLength !== 32 ||
    key.toString('base64') !== value.journalKeyBase64 ||
    (value.activeArchiveKeyId !== null &&
      (typeof value.activeArchiveKeyId !== 'string' || !UUID_PATTERN.test(value.activeArchiveKeyId)))
  )
    throw new Error('CONSTITUTION_FS_KEY_STATE_INVALID');
  key.fill(0);
  return value as KeyState;
}

export class ConstitutionKeyStore {
  private readonly statePath: string;
  private state: KeyState;

  constructor(
    private readonly root: string,
    private readonly secretBackend: ConstitutionArchiveSecretBackend,
    statePath = path.join(root, '.constitution-keys.enc'),
    private readonly dependencies: ConstitutionKeyStoreDependencies = {}
  ) {
    this.statePath = statePath;
    this.state = this.loadOrCreate();
  }

  private loadOrCreate(): KeyState {
    if (existsSync(this.statePath)) {
      const stat = lstatSync(this.statePath);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 64 * 1024) {
        throw new Error('CONSTITUTION_FS_KEY_STATE_INVALID');
      }
      return parseState(this.secretBackend.decryptString(readFileSync(this.statePath, 'utf8')));
    }
    if (hasTransactionHistory(this.root)) {
      throw new Error('CONSTITUTION_FS_KEY_STATE_MISSING_WITH_HISTORY');
    }
    const state: KeyState = {
      schemaVersion: 1,
      journalKeyBase64: randomBytes(32).toString('base64'),
      activeArchiveKeyId: null,
    };
    return this.persist(state, true);
  }

  private readPersistedState(): KeyState {
    const stat = lstatSync(this.statePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 64 * 1024) {
      throw new Error('CONSTITUTION_FS_KEY_STATE_INVALID');
    }
    return parseState(this.secretBackend.decryptString(readFileSync(this.statePath, 'utf8')));
  }

  private persist(state: KeyState, exclusive: boolean): KeyState {
    const encrypted = this.secretBackend.encryptString(JSON.stringify(state));
    const temporary = `${this.statePath}.${randomUUID()}.tmp`;
    const fd = openSync(temporary, 'wx', 0o600);
    try {
      writeFileSync(fd, encrypted, 'utf8');
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    let published = false;
    try {
      if (exclusive) {
        (this.dependencies.linkPublication ?? linkSync)(temporary, this.statePath);
        published = true;
        unlinkSync(temporary);
      } else {
        (this.dependencies.replacePublication ?? renameSync)(temporary, this.statePath);
        published = true;
      }
      (this.dependencies.syncPublication ?? syncPublication)(this.statePath);
      return state;
    } catch (error) {
      try {
        unlinkSync(temporary);
      } catch {
        /* preserve original failure */
      }
      if (exclusive && !published && (error as NodeJS.ErrnoException).code === 'EEXIST') {
        // Another process won the no-clobber publication. Adopt only the exact
        // persisted, decryptable winner; never continue with our discarded key.
        return this.readPersistedState();
      }
      if (published) {
        throw new Error('CONSTITUTION_FS_KEY_STATE_PUBLICATION_NOT_DURABLE', { cause: error });
      }
      throw error;
    }
  }

  journalKey(): Buffer {
    return Buffer.from(this.state.journalKeyBase64, 'base64');
  }

  activeArchiveKeyId(): string | null {
    return this.state.activeArchiveKeyId;
  }

  setActiveArchiveKeyId(keyId: string): void {
    if (!UUID_PATTERN.test(keyId)) throw new Error('CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE');
    const next = { ...this.state, activeArchiveKeyId: keyId };
    this.state = this.persist(next, false);
  }
}
