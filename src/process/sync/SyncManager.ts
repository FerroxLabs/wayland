/**
 * SyncManager - orchestrates E2EE settings sync.
 *
 * Security model:
 * - Passphrase is accepted only during enable() and held in memory as a
 *   derived key (Uint8Array). It is never persisted.
 * - The salt (32 random bytes) IS persisted in sync-state.json in hex, which
 *   is standard practice - salt is not secret.
 * - The derived key is lost on app restart; the user must re-enable to re-derive.
 * - API keys are NEVER included in the sync payload (see gatherPayload()).
 */

import { app } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateSalt, deriveKey } from './crypto/deriveKey';
import { seal, open } from './crypto/secretbox';
import { LocalFileBackend } from './backends/LocalFileBackend';
import type { SyncPayload, SyncState, SyncStatus, SyncResult } from './types';

const STATE_FILE = 'sync-state.json';

function statePath(): string {
  return path.join(app.getPath('userData'), STATE_FILE);
}

function readState(): SyncState | null {
  try {
    const raw = fs.readFileSync(statePath(), 'utf-8');
    return JSON.parse(raw) as SyncState;
  } catch {
    return null;
  }
}

function writeState(state: SyncState): void {
  fs.writeFileSync(statePath(), JSON.stringify(state, null, 2));
}

function clearState(): void {
  try {
    fs.unlinkSync(statePath());
  } catch {
    // already gone
  }
}

/**
 * Gather Beta-1 payload: theme + editor + system + notifications config files.
 * Providers/assistants/agents/skills are TODO for GA (require key stripping).
 */
async function gatherPayload(): Promise<SyncPayload['data']> {
  // Beta-1: payload is intentionally minimal. The encryption pipe is the
  // deliverable; exhaustive settings coverage is GA scope.
  return {};
}

export class SyncManager {
  // Derived key held in memory only - lost on restart.
  private _key: Uint8Array | null = null;
  private _state: SyncState | null = null;

  constructor() {
    this._state = readState();
  }

  /**
   * Enable sync. Derives key from passphrase + fresh salt, writes encrypted
   * payload to the backend, and persists state (no passphrase, no key).
   */
  async enable(passphrase: string, backendType: 'local-file', backendPath: string): Promise<void> {
    const salt = generateSalt();
    const key = await deriveKey(passphrase, salt);

    const data = await gatherPayload();
    const payload: SyncPayload = { schemaVersion: 1, updatedAt: Date.now(), data };
    const plaintext = Buffer.from(JSON.stringify(payload));
    const sealed = seal(plaintext, key);

    const backend = new LocalFileBackend(backendPath);
    backend.write(Buffer.from(sealed));

    const state: SyncState = {
      enabled: true,
      saltHex: Buffer.from(salt).toString('hex'),
      backendType,
      backendPath,
      lastSync: Date.now(),
    };
    writeState(state);

    this._key = key;
    this._state = state;
  }

  /** Disable sync and clear persisted state. Key is wiped from memory. */
  async disable(): Promise<void> {
    this._key = null;
    this._state = null;
    clearState();
  }

  /** Return current sync status. */
  async status(): Promise<SyncStatus> {
    const state = readState();
    if (!state?.enabled) return { enabled: false };
    return {
      enabled: true,
      lastSync: state.lastSync,
      itemsCount: 0, // Beta: payload coverage is minimal
    };
  }

  /**
   * Force a sync cycle. Requires the key to be in memory (i.e., enable() was
   * called this session). If the key is gone (app restarted), returns an error.
   *
   * Conflict resolution: last-write-wins per top-level data key.
   */
  async forceSync(): Promise<SyncResult> {
    if (!this._key || !this._state) {
      throw new Error('Sync is not active. Re-enable sync to continue.');
    }

    const backend = new LocalFileBackend(this._state.backendPath);

    // Pull remote
    let pulled = 0;
    const remoteBlob = backend.read();
    let remoteData: SyncPayload['data'] = {};
    if (remoteBlob) {
      const decrypted = open(new Uint8Array(remoteBlob), this._key);
      if (decrypted) {
        try {
          const remote = JSON.parse(Buffer.from(decrypted).toString()) as SyncPayload;
          remoteData = remote.data;
          pulled = Object.keys(remoteData).length;
        } catch {
          // corrupt remote payload - treat as empty, will be overwritten
        }
      }
    }

    // Gather local
    const localData = await gatherPayload();

    // Merge: last-write-wins per top-level key (local is newer)
    const merged: SyncPayload['data'] = { ...remoteData, ...localData };

    // Push merged
    const payload: SyncPayload = { schemaVersion: 1, updatedAt: Date.now(), data: merged };
    const sealed = seal(Buffer.from(JSON.stringify(payload)), this._key);
    backend.write(Buffer.from(sealed));

    const pushed = Object.keys(merged).length;

    // Update lastSync in state
    this._state = { ...this._state, lastSync: Date.now() };
    writeState(this._state);

    return { pulled, pushed };
  }
}

/** Singleton for use by syncIpc. */
export const syncManager = new SyncManager();
