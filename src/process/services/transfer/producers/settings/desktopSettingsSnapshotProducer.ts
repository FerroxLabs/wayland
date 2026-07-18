/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TransferSnapshotObjectInput } from '@process/services/transfer/export';

export const DESKTOP_SETTINGS_SNAPSHOT_CONTRACT = 'wayland-transfer-desktop-preferences/1.0' as const;
export const DESKTOP_SETTINGS_SNAPSHOT_SCHEMA_VERSION = 1 as const;

const MAX_SNAPSHOT_BYTES = 1024 * 1024;
const MAX_TEXT_LENGTH = 256;
const MAX_IDENTIFIER_LENGTH = 256;
const MAX_LIST_ITEMS = 512;
const PORTABLE_IDENTIFIER = /^[\p{L}\p{N}][\p{L}\p{N}._:@/+-]{0,255}$/u;
const ABSOLUTE_PATH = /(?:^|[\s"'])(?:~\/|\/[^\s"']*|[A-Za-z]:[\\/]|\\\\)/;

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };
type SettingsRecord = Record<string, unknown>;

export type DesktopSettingsSnapshotReader = Readonly<{
  /** Must return an authoritative atomic clone of the current config store. */
  readConfigSnapshot(): Promise<unknown>;
}>;

export type DesktopSettingsTransferDocument = Readonly<{
  contract: typeof DESKTOP_SETTINGS_SNAPSHOT_CONTRACT;
  schemaVersion: typeof DESKTOP_SETTINGS_SNAPSHOT_SCHEMA_VERSION;
  logicalStateId: 'desktop.preferences';
  values: Readonly<Record<string, Json>>;
}>;

export class DesktopSettingsSnapshotError extends Error {
  constructor(
    readonly code:
      | 'SETTINGS_READ_FAILED'
      | 'SETTINGS_ROOT_INVALID'
      | 'SETTINGS_VALUE_INVALID'
      | 'SETTINGS_MUTATED_DURING_SNAPSHOT'
      | 'SETTINGS_SNAPSHOT_TOO_LARGE',
    message: string
  ) {
    super(message);
    this.name = 'DesktopSettingsSnapshotError';
  }
}

function invalid(key: string): never {
  throw new DesktopSettingsSnapshotError('SETTINGS_VALUE_INVALID', `Unsupported portable setting ${key}.`);
}

function isPlainRecord(value: unknown): value is SettingsRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function ownValue(record: SettingsRecord, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor) return undefined;
  if (!('value' in descriptor)) invalid(key);
  return descriptor.value;
}

function portableBoolean(value: unknown, key: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') invalid(key);
  return value;
}

function portableInteger(value: unknown, key: string, minimum: number, maximum: number): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) invalid(key);
  return value as number;
}

function rejectPath(value: string, key: string): void {
  if (value.includes('\0') || ABSOLUTE_PATH.test(value)) invalid(key);
}

function portableText(value: unknown, key: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_TEXT_LENGTH) invalid(key);
  if (/\p{Cc}/u.test(value)) invalid(key);
  rejectPath(value, key);
  return value;
}

function portableIdentifier(value: unknown, key: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > MAX_IDENTIFIER_LENGTH || !PORTABLE_IDENTIFIER.test(value)) {
    invalid(key);
  }
  rejectPath(value, key);
  return value;
}

function portableIdentifierList(value: unknown, key: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > MAX_LIST_ITEMS) invalid(key);
  const result = value.map((entry) => portableIdentifier(entry, key)!);
  if (new Set(result).size !== result.length) invalid(key);
  return result;
}

function portableQuietHours(value: unknown, key: string): { start: string; end: string } | undefined {
  if (value === undefined) return undefined;
  if (!isPlainRecord(value)) invalid(key);
  const keys = Object.keys(value).toSorted();
  if (keys.length !== 2 || keys[0] !== 'end' || keys[1] !== 'start') invalid(key);
  const start = ownValue(value, 'start');
  const end = ownValue(value, 'end');
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (typeof start !== 'string' || typeof end !== 'string' || !time.test(start) || !time.test(end)) invalid(key);
  return { start, end };
}

function portableSkillPreferences(
  value: unknown,
  key: string
): { pinned: string[]; disabled: string[]; revision: number } | undefined {
  if (value === undefined) return undefined;
  if (!isPlainRecord(value)) invalid(key);
  const keys = Object.keys(value).toSorted();
  if (keys.length !== 3 || keys[0] !== 'disabled' || keys[1] !== 'pinned' || keys[2] !== 'revision') invalid(key);
  const pinned = portableIdentifierList(ownValue(value, 'pinned'), key);
  const disabled = portableIdentifierList(ownValue(value, 'disabled'), key);
  const revision = portableInteger(ownValue(value, 'revision'), key, 0, Number.MAX_SAFE_INTEGER);
  if (!pinned || !disabled || revision === undefined) invalid(key);
  if (pinned.some((id) => disabled.includes(id))) invalid(key);
  return { pinned, disabled, revision };
}

function portableOutputBudget(value: unknown, key: string): { mode: 'auto' | 'fixed'; value?: number } | undefined {
  if (value === undefined) return undefined;
  if (!isPlainRecord(value)) invalid(key);
  const keys = Object.keys(value).toSorted();
  if (keys.some((candidate) => candidate !== 'mode' && candidate !== 'value')) invalid(key);
  const mode = ownValue(value, 'mode');
  if (mode !== 'auto' && mode !== 'fixed') invalid(key);
  const amount = portableInteger(ownValue(value, 'value'), key, 1, 10_000_000);
  if (mode === 'auto' && amount !== undefined) invalid(key);
  if (mode === 'fixed' && amount === undefined) invalid(key);
  return amount === undefined ? { mode } : { mode, value: amount };
}

function setIfDefined(target: Record<string, Json>, key: string, value: Json | undefined): void {
  if (value !== undefined) target[key] = value;
}

/**
 * Deliberate allowlist. Provider credentials, MCP definitions, workspace trust,
 * filesystem roots, install identifiers, OAuth state, channel tokens, cached
 * model payloads, and executable/agent configuration never enter this family.
 */
function projectPortableSettings(snapshot: unknown): Readonly<Record<string, Json>> {
  if (!isPlainRecord(snapshot)) {
    throw new DesktopSettingsSnapshotError('SETTINGS_ROOT_INVALID', 'The Desktop config snapshot is not an object.');
  }

  const values: Record<string, Json> = Object.create(null) as Record<string, Json>;
  setIfDefined(values, 'ambient.enabled', portableBoolean(ownValue(snapshot, 'ambient.enabled'), 'ambient.enabled'));
  setIfDefined(values, 'colorScheme', portableIdentifier(ownValue(snapshot, 'colorScheme'), 'colorScheme'));
  setIfDefined(
    values,
    'concierge.capabilityInjection',
    portableBoolean(ownValue(snapshot, 'concierge.capabilityInjection'), 'concierge.capabilityInjection')
  );
  setIfDefined(
    values,
    'concierge.defaultPersona',
    portableBoolean(ownValue(snapshot, 'concierge.defaultPersona'), 'concierge.defaultPersona')
  );
  setIfDefined(
    values,
    'concierge.panelDismissed',
    portableBoolean(ownValue(snapshot, 'concierge.panelDismissed'), 'concierge.panelDismissed')
  );
  setIfDefined(values, 'language', portableIdentifier(ownValue(snapshot, 'language'), 'language'));
  setIfDefined(
    values,
    'launchpad.barOrder',
    portableIdentifierList(ownValue(snapshot, 'launchpad.barOrder'), 'launchpad.barOrder')
  );
  setIfDefined(
    values,
    'models.autoRefresh',
    portableBoolean(ownValue(snapshot, 'models.autoRefresh'), 'models.autoRefresh')
  );
  setIfDefined(
    values,
    'notifications.agentError',
    portableBoolean(ownValue(snapshot, 'notifications.agentError'), 'notifications.agentError')
  );
  setIfDefined(
    values,
    'notifications.agentFinished',
    portableBoolean(ownValue(snapshot, 'notifications.agentFinished'), 'notifications.agentFinished')
  );
  setIfDefined(
    values,
    'notifications.channelMessage',
    portableBoolean(ownValue(snapshot, 'notifications.channelMessage'), 'notifications.channelMessage')
  );
  setIfDefined(
    values,
    'notifications.playSound',
    portableBoolean(ownValue(snapshot, 'notifications.playSound'), 'notifications.playSound')
  );
  setIfDefined(
    values,
    'notifications.quietHours',
    portableQuietHours(ownValue(snapshot, 'notifications.quietHours'), 'notifications.quietHours')
  );
  setIfDefined(
    values,
    'onboarding.focusArea',
    portableIdentifierList(ownValue(snapshot, 'onboarding.focusArea'), 'onboarding.focusArea')
  );
  setIfDefined(
    values,
    'onboardingCompleted',
    portableBoolean(ownValue(snapshot, 'onboardingCompleted'), 'onboardingCompleted')
  );
  setIfDefined(values, 'pinnedModels', portableIdentifierList(ownValue(snapshot, 'pinnedModels'), 'pinnedModels'));
  setIfDefined(
    values,
    'skills.cliDiscovery.enabled',
    portableBoolean(ownValue(snapshot, 'skills.cliDiscovery.enabled'), 'skills.cliDiscovery.enabled')
  );
  setIfDefined(
    values,
    'skills.preferences',
    portableSkillPreferences(ownValue(snapshot, 'skills.preferences'), 'skills.preferences')
  );
  setIfDefined(
    values,
    'skillsMarket.enabled',
    portableBoolean(ownValue(snapshot, 'skillsMarket.enabled'), 'skillsMarket.enabled')
  );
  setIfDefined(
    values,
    'system.autoPreviewOfficeFiles',
    portableBoolean(ownValue(snapshot, 'system.autoPreviewOfficeFiles'), 'system.autoPreviewOfficeFiles')
  );
  setIfDefined(
    values,
    'system.closeToTray',
    portableBoolean(ownValue(snapshot, 'system.closeToTray'), 'system.closeToTray')
  );
  setIfDefined(
    values,
    'system.cronNotificationEnabled',
    portableBoolean(ownValue(snapshot, 'system.cronNotificationEnabled'), 'system.cronNotificationEnabled')
  );
  setIfDefined(values, 'system.keepAwake', portableBoolean(ownValue(snapshot, 'system.keepAwake'), 'system.keepAwake'));
  setIfDefined(
    values,
    'system.notificationEnabled',
    portableBoolean(ownValue(snapshot, 'system.notificationEnabled'), 'system.notificationEnabled')
  );
  setIfDefined(
    values,
    'system.routeThroughFlux',
    portableBoolean(ownValue(snapshot, 'system.routeThroughFlux'), 'system.routeThroughFlux')
  );
  setIfDefined(values, 'theme', portableIdentifier(ownValue(snapshot, 'theme'), 'theme'));
  setIfDefined(
    values,
    'ui.shell',
    (() => {
      const shell = ownValue(snapshot, 'ui.shell');
      if (shell === undefined) return undefined;
      if (shell !== 'classic' && shell !== 'cockpit') invalid('ui.shell');
      return shell;
    })()
  );
  setIfDefined(
    values,
    'ui.zoomFactor',
    (() => {
      const zoom = ownValue(snapshot, 'ui.zoomFactor');
      if (zoom === undefined) return undefined;
      if (typeof zoom !== 'number' || !Number.isFinite(zoom) || zoom < 0.5 || zoom > 3) invalid('ui.zoomFactor');
      return zoom;
    })()
  );
  setIfDefined(
    values,
    'update.deferWhileBusy',
    portableBoolean(ownValue(snapshot, 'update.deferWhileBusy'), 'update.deferWhileBusy')
  );
  setIfDefined(
    values,
    'upload.saveToWorkspace',
    portableBoolean(ownValue(snapshot, 'upload.saveToWorkspace'), 'upload.saveToWorkspace')
  );
  setIfDefined(values, 'user.displayName', portableText(ownValue(snapshot, 'user.displayName'), 'user.displayName'));
  setIfDefined(
    values,
    'wcore.outputBudget',
    portableOutputBudget(ownValue(snapshot, 'wcore.outputBudget'), 'wcore.outputBudget')
  );
  setIfDefined(
    values,
    'workspace.pasteConfirm',
    portableBoolean(ownValue(snapshot, 'workspace.pasteConfirm'), 'workspace.pasteConfirm')
  );
  return values;
}

function canonicalJson(value: Json): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as { readonly [key: string]: Json };
  return `{${Object.keys(record)
    .toSorted()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(',')}}`;
}

async function readProjected(reader: DesktopSettingsSnapshotReader): Promise<Readonly<Record<string, Json>>> {
  let snapshot: unknown;
  try {
    snapshot = await reader.readConfigSnapshot();
  } catch {
    throw new DesktopSettingsSnapshotError('SETTINGS_READ_FAILED', 'The Desktop config snapshot could not be read.');
  }
  try {
    return projectPortableSettings(snapshot);
  } catch (error) {
    if (error instanceof DesktopSettingsSnapshotError) throw error;
    throw new DesktopSettingsSnapshotError(
      'SETTINGS_VALUE_INVALID',
      'The Desktop config snapshot contains an unsupported portable value.'
    );
  }
}

/** Real main-process adapter over the current atomic ProcessConfig store. */
export function createProcessConfigSettingsSnapshotReader(): DesktopSettingsSnapshotReader {
  return {
    readConfigSnapshot: async () => {
      const { ProcessConfig } = await import('@process/utils/initStorage');
      return ProcessConfig.toJson();
    },
  };
}

/**
 * Capture the allowlisted Desktop preferences twice and reject observed races.
 * The caller remains responsible for any wider Desktop/Core quiescence lease.
 */
export async function produceDesktopSettingsSnapshot(
  reader: DesktopSettingsSnapshotReader = createProcessConfigSettingsSnapshotReader()
): Promise<TransferSnapshotObjectInput> {
  const first = await readProjected(reader);
  const second = await readProjected(reader);
  const firstCanonical = canonicalJson(first);
  if (canonicalJson(second) !== firstCanonical) {
    throw new DesktopSettingsSnapshotError(
      'SETTINGS_MUTATED_DURING_SNAPSHOT',
      'Desktop settings changed during snapshot capture.'
    );
  }

  const document: DesktopSettingsTransferDocument = {
    contract: DESKTOP_SETTINGS_SNAPSHOT_CONTRACT,
    schemaVersion: DESKTOP_SETTINGS_SNAPSHOT_SCHEMA_VERSION,
    logicalStateId: 'desktop.preferences',
    values: first,
  };
  const bytes = new TextEncoder().encode(canonicalJson(document as unknown as Json));
  if (bytes.byteLength > MAX_SNAPSHOT_BYTES) {
    throw new DesktopSettingsSnapshotError(
      'SETTINGS_SNAPSHOT_TOO_LARGE',
      `Desktop settings snapshot exceeds ${MAX_SNAPSHOT_BYTES} bytes.`
    );
  }

  return Object.freeze({
    key: 'desktop-preferences-v1',
    logicalStateId: 'desktop.preferences',
    authorityId: 'desktop.config',
    kind: 'state',
    provenance: 'snapshot-state',
    bytes,
  });
}
