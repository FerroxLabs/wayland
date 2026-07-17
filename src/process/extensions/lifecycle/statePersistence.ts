/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fsAsync } from 'fs';
import { randomUUID } from 'crypto';
import * as path from 'path';
import type { ExtensionState } from '../types';
import { extensionEventBus, ExtensionSystemEvents } from './ExtensionEventBus';
import { getDataPath } from '@process/utils';

const EXTENSION_STATES_FILE_ENV = 'WAYLAND_EXTENSION_STATES_FILE';
const DEFAULT_STATES_FILE = 'extension-states.json';

function resolveStatesFile(): string {
  const override = process.env[EXTENSION_STATES_FILE_ENV]?.trim();
  if (override) {
    return path.resolve(override);
  }
  return path.join(getDataPath(), DEFAULT_STATES_FILE);
}

/**
 * Persisted state format on disk.
 * Stored under getDataPath(): ~/.wayland/extension-states.json (Electron release),
 * ~/.wayland-dev/extension-states.json (Electron macOS dev), or the platform-standard
 * app data dir on Windows/Linux. Can be overridden via WAYLAND_EXTENSION_STATES_FILE.
 */
interface PersistedStates {
  /** Schema version for future migrations */
  version: 1;
  /** Map of extensionName → persisted state */
  extensions: Record<
    string,
    {
      enabled: boolean;
      disabledAt?: string; // ISO date string
      disabledReason?: string;
      /** Track whether onInstall has been run for this extension */
      installed?: boolean;
      /** Last known version - used for migration detection */
      lastVersion?: string;
      /** Install error message for Agent Hub tracking */
      installError?: string;
    }
  >;
}

/**
 * Load persisted extension states from disk (async to avoid blocking the main process).
 * Returns an empty map if the file doesn't exist or is invalid.
 */
export async function loadPersistedStates(): Promise<Map<string, ExtensionState>> {
  const result = new Map<string, ExtensionState>();
  const statesFile = resolveStatesFile();

  try {
    const raw = await fsAsync.readFile(statesFile, 'utf-8');
    const data = JSON.parse(raw) as PersistedStates;

    if (data.version !== 1) {
      console.warn('[Extensions] Unknown state file version, ignoring persisted states');
      return result;
    }

    for (const [name, state] of Object.entries(data.extensions)) {
      result.set(name, {
        enabled: state.enabled,
        disabledAt: state.disabledAt ? new Date(state.disabledAt) : undefined,
        disabledReason: state.disabledReason,
        installed: state.installed,
        lastVersion: state.lastVersion,
        installError: state.installError,
      });
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('[Extensions] Failed to load persisted states:', error instanceof Error ? error.message : error);
    }
  }

  return result;
}

/**
 * Save extension states to disk (async to avoid blocking the main process).
 * Creates the target directory if it doesn't exist.
 * Writes are debounced - rapid successive calls coalesce into a single disk write.
 */
let _pendingSaveStates: Map<string, ExtensionState> | undefined;
let _saveTimer: ReturnType<typeof setTimeout> | undefined;
let _saveSequence: Promise<void> = Promise.resolve();

const RENAME_RETRY_DELAYS_MS = [25, 50, 100, 200, 400] as const;
const RETRYABLE_RENAME_ERRORS = new Set(['EACCES', 'EBUSY', 'EPERM']);

async function renameWithRetry(source: string, destination: string, attempt = 0): Promise<void> {
  try {
    await fsAsync.rename(source, destination);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (!code || !RETRYABLE_RENAME_ERRORS.has(code) || attempt >= RENAME_RETRY_DELAYS_MS.length) {
      throw error;
    }

    await new Promise<void>((resolve) => setTimeout(resolve, RENAME_RETRY_DELAYS_MS[attempt]));
    await renameWithRetry(source, destination, attempt + 1);
  }
}

export function savePersistedStates(states: Map<string, ExtensionState>): void {
  _pendingSaveStates = states;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => _flushPersistedStates(), 500);
}

function _flushPersistedStates(): void {
  if (!_pendingSaveStates) return;
  const states = _pendingSaveStates;
  _pendingSaveStates = undefined;

  const statesFile = resolveStatesFile();
  const write = _saveSequence.then(() => _writePersistedStates(states, statesFile));
  _saveSequence = write.catch((error: unknown) => {
    console.error('[Extensions] Failed to save persisted states:', error instanceof Error ? error.message : error);
  });
}

async function _writePersistedStates(states: Map<string, ExtensionState>, statesFile: string): Promise<void> {
  const statesDir = path.dirname(statesFile);

  await fsAsync.mkdir(statesDir, { recursive: true });

  const data: PersistedStates = {
    version: 1,
    extensions: {},
  };

  for (const [name, state] of states) {
    data.extensions[name] = {
      enabled: state.enabled,
      disabledAt: state.disabledAt?.toISOString(),
      disabledReason: state.disabledReason,
      installed: (state as any).installed,
      lastVersion: (state as any).lastVersion,
      installError: (state as any).installError,
    };
  }

  // Keep the temp file beside the destination so the final rename stays on
  // one filesystem. A unique name prevents overlapping saves or processes
  // from clobbering each other's in-progress write.
  const tmpFile = path.join(statesDir, `.${path.basename(statesFile)}.${process.pid}.${randomUUID()}.tmp`);
  try {
    await fsAsync.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    // Windows can transiently reject replacement while another process has
    // the destination open. Retrying the atomic rename preserves the old
    // file until the complete replacement is ready.
    await renameWithRetry(tmpFile, statesFile);
  } finally {
    try {
      await fsAsync.rm(tmpFile, { force: true });
    } catch (error) {
      console.warn(
        '[Extensions] Failed to remove temporary state file:',
        error instanceof Error ? error.message : error
      );
    }
  }

  extensionEventBus.emitLifecycle(ExtensionSystemEvents.STATES_PERSISTED, {
    extensionName: '*',
    version: '0.0.0',
    timestamp: Date.now(),
  });
}

/**
 * Check if an extension needs its onInstall hook to run.
 * Returns true if:
 * - Extension has never been seen before (first install)
 * - Extension version has changed (upgrade)
 */
export function needsInstallHook(
  extensionName: string,
  currentVersion: string,
  persistedStates: Map<string, ExtensionState>
): { isFirstInstall: boolean; isUpgrade: boolean } {
  const persisted = persistedStates.get(extensionName);

  if (!persisted || !persisted.installed) {
    return { isFirstInstall: true, isUpgrade: false };
  }

  if (persisted.lastVersion && persisted.lastVersion !== currentVersion) {
    return { isFirstInstall: false, isUpgrade: true };
  }

  return { isFirstInstall: false, isUpgrade: false };
}

/**
 * Clear the installed state for an extension so that the next hotReload
 * treats it as a fresh install and re-runs the onInstall lifecycle hook.
 */
export async function markExtensionForReinstall(extensionName: string): Promise<void> {
  const states = await loadPersistedStates();
  const state = states.get(extensionName);
  if (state) {
    states.set(extensionName, { ...state, installed: false });
    savePersistedStates(states);
  }
}
