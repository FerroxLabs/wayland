/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fsAsync } from 'fs';
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
      permissionReview?: {
        approvedAt: string;
        approvedRiskLevel: 'safe' | 'moderate' | 'dangerous';
        approvedPermissions: string[];
      };
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
        permissionReview: state.permissionReview
          ? {
              approvedAt: new Date(state.permissionReview.approvedAt),
              approvedRiskLevel: state.permissionReview.approvedRiskLevel,
              approvedPermissions: state.permissionReview.approvedPermissions,
            }
          : undefined,
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
let _pendingSaveStates = new Map<string, ExtensionState>();
let _saveTimer: ReturnType<typeof setTimeout> | undefined;
let _flushInFlight: Promise<void> | undefined;

export function savePersistedStates(states: Map<string, ExtensionState>): void {
  for (const [name, state] of states) {
    _pendingSaveStates.set(name, { ...state });
  }
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    void flushPersistedStates();
  }, 500);
}

export async function flushPersistedStates(): Promise<void> {
  clearTimeout(_saveTimer);
  _saveTimer = undefined;

  if (_flushInFlight) {
    await _flushInFlight;
  }
  if (_pendingSaveStates.size === 0) return;

  const states = _pendingSaveStates;
  _pendingSaveStates = new Map<string, ExtensionState>();
  _flushInFlight = _writePersistedStates(states).finally(() => {
    _flushInFlight = undefined;
  });
  await _flushInFlight;

  if (_pendingSaveStates.size > 0) {
    await flushPersistedStates();
  }
}

async function _writePersistedStates(states: Map<string, ExtensionState>): Promise<void> {
  const statesFile = resolveStatesFile();
  const statesDir = path.dirname(statesFile);

  try {
    await fsAsync.mkdir(statesDir, { recursive: true });

    const data: PersistedStates = {
      version: 1,
      extensions: {},
    };

    try {
      const raw = await fsAsync.readFile(statesFile, 'utf-8');
      const existing = JSON.parse(raw) as PersistedStates;
      if (existing.version === 1 && existing.extensions && typeof existing.extensions === 'object') {
        data.extensions = { ...existing.extensions };
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(
          '[Extensions] Failed to merge existing persisted states:',
          error instanceof Error ? error.message : error
        );
      }
    }

    for (const [name, state] of states) {
      data.extensions[name] = {
        enabled: state.enabled,
        disabledAt: state.disabledAt?.toISOString(),
        disabledReason: state.disabledReason,
        permissionReview: state.permissionReview
          ? {
              approvedAt: state.permissionReview.approvedAt.toISOString(),
              approvedRiskLevel: state.permissionReview.approvedRiskLevel,
              approvedPermissions: state.permissionReview.approvedPermissions,
            }
          : undefined,
        installed: (state as any).installed,
        lastVersion: (state as any).lastVersion,
        installError: (state as any).installError,
      };
    }

    // Atomic write: write to temp file then rename
    const tmpFile = statesFile + '.tmp';
    await fsAsync.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    await fsAsync.rename(tmpFile, statesFile);

    extensionEventBus.emitLifecycle(ExtensionSystemEvents.STATES_PERSISTED, {
      extensionName: '*',
      version: '0.0.0',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Extensions] Failed to save persisted states:', error instanceof Error ? error.message : error);
  }
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
    await flushPersistedStates();
  }
}
