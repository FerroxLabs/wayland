/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IPC bridge for the Wayland Core engine `config.toml` sections + profile
 * directories. Wires the typed `ipcBridge.wcoreConfig` / `ipcBridge.wcoreProfiles`
 * surfaces over the main-process `configBridge` + `profileStore` helpers.
 *
 * SECURITY (SEC-6) - HUMAN/RENDERER ONLY. `wcoreConfig.patchField` mutates a
 * deliberately closed subset of the engine's security-load-bearing runtime
 * config. It is remote-denied in
 * `bridgeAllowlist.ts` and must NEVER be exposed to the agent/engine tool
 * surface: an agent that could call it could rewrite its own tool allow-list,
 * weaken approvals, or force a secret into the bash sandbox.
 *
 * The bridge exposes no arbitrary section replacement and no security/env
 * passthrough mutation. Every accepted field and value domain is validated in
 * main before an atomic merge.
 */

import { mkdir } from 'node:fs/promises';
import { isIP } from 'node:net';
import { shell } from 'electron';
import { getSection, mutateConfig, readConfig } from '@process/agent/wcore/configBridge';
import { resolveEffectiveWcoreRuntime } from '@process/agent/wcore/effectiveRuntime';
import {
  createSerializedPreferenceStore,
  isValidOutputBudgetPreference,
  openEffectiveRuntimeFolder,
  readOutputBudgetPreference,
  readRawEngineModePreference,
} from '@process/agent/wcore/effectiveRuntimeActions';
import {
  resolveActiveConfigIdentity,
  standaloneConfigDir,
  withProfileAuthorityLock,
} from '@process/agent/wcore/profilePaths';
import { initWcoreProfileIpc } from '@process/agent/wcore/profileStore';
import { ProcessConfig, resolveConciergeDiagDeps } from '@process/utils/initStorage';
import { ipcBridge } from '@/common';
import type { IWcoreConfigFieldPatch } from '@/common/adapter/ipcBridge';
import type {
  IWcoreBrowserPolicy,
  IWcoreBrowserPolicyProjection,
  IWcoreEffectiveRuntime,
} from '@/common/adapter/ipcBridge';

/** Exact editable MemoryConfig surface in the bundled Core producer. */
export const WCORE_EDITABLE_MEMORY_SCHEMA = {
  coreVersion: '0.12.25',
  producerFields: ['enabled', 'dream_cycle_throttle_secs', 'decay_interval_secs', 'embedder'],
  editableFields: ['enabled'],
} as const;

/** Desktop can project requested policy, but Core v0.12.25 exposes no effective-policy receipt. */
export const WCORE_BROWSER_POLICY_PROJECTION_SCHEMA = {
  schemaVersion: 1,
  coreVersion: '0.12.25',
  effectiveState: 'producer-evidence-unavailable',
  restartState: 'unknown',
} as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isExactDataObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  const actual = Object.keys(descriptors).toSorted();
  const expected = [...keys].toSorted();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) return false;
  return Object.values(descriptors).every((descriptor) => 'value' in descriptor && !descriptor.get && !descriptor.set);
}

function isPlainDataObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every(
    (descriptor) => 'value' in descriptor && !descriptor.get && !descriptor.set
  );
}

function isPlainStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return false;
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.keys(descriptors).length !== value.length + 1) return false;
  return Object.entries(descriptors).every(([key, descriptor]) => {
    if (key === 'length') return 'value' in descriptor;
    if (!/^\d+$/.test(key) || !('value' in descriptor) || descriptor.get || descriptor.set) return false;
    return typeof descriptor.value === 'string';
  });
}

const PUBLIC_ORIGIN_PATTERN =
  /^(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function isPublicIpv4(address: string): boolean {
  const [a, b] = address.split('.').map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

/** Expand an already-syntax-checked IPv6 literal for Core policy parity. */
function ipv6Segments(literal: string): number[] | null {
  let expanded = literal;
  const lastColon = expanded.lastIndexOf(':');
  const ipv4Tail = expanded.slice(lastColon + 1);
  if (ipv4Tail.includes('.')) {
    if (isIP(ipv4Tail) !== 4) return null;
    const octets = ipv4Tail.split('.').map(Number);
    expanded = `${expanded.slice(0, lastColon)}:${((octets[0] << 8) | octets[1]).toString(16)}:${(
      (octets[2] << 8) |
      octets[3]
    ).toString(16)}`;
  }

  const halves = expanded.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const words = [...left, ...Array.from({ length: missing }, () => '0'), ...right];
  if (words.length !== 8 || words.some((word) => !/^[0-9a-f]{1,4}$/.test(word))) return null;
  return words.map((word) => Number.parseInt(word, 16));
}

function isPublicIpv6(address: string): boolean {
  const words = ipv6Segments(address);
  if (!words) return false;
  const [first] = words;
  const unspecified = words.every((word) => word === 0);
  const loopback = words.slice(0, 7).every((word) => word === 0) && words[7] === 1;
  if (
    unspecified ||
    loopback ||
    (first & 0xfe00) === 0xfc00 ||
    (first & 0xffc0) === 0xfe80 ||
    (first & 0xff00) === 0xff00
  ) {
    return false;
  }
  const mapped = words.slice(0, 5).every((word) => word === 0) && words[5] === 0xffff;
  // Core handoff: wcore-browser's policy.rs must mirror these unspecified and
  // IPv4-compatible checks. Desktop remains stricter until that producer seam
  // is versioned and proven by the shared policy corpus.
  const compatible = words.slice(0, 6).every((word) => word === 0);
  if (!mapped && !compatible) return true;
  const embeddedV4 = `${words[6] >> 8}.${words[6] & 0xff}.${words[7] >> 8}.${words[7] & 0xff}`;
  return isPublicIpv4(embeddedV4);
}

function isPublicOriginPattern(value: string): boolean {
  if (value.length === 0 || value.length > 253 || value !== value.trim() || value !== value.toLowerCase()) return false;
  const wildcard = value.startsWith('*.');
  const bare = wildcard ? value.slice(2) : value;
  if (bare === 'localhost' || bare.endsWith('.localhost') || bare.endsWith('.local')) return false;
  if (isIP(bare) === 4) {
    return !wildcard && isPublicIpv4(bare);
  }
  if (isIP(bare) === 6) return !wildcard && isPublicIpv6(bare);
  if (/^[0-9.]+$/.test(bare) || bare.includes(':')) return false;
  return PUBLIC_ORIGIN_PATTERN.test(value);
}

export function validateWcoreBrowserPolicy(value: unknown): string | null {
  if (!isExactDataObject(value, ['defaultAction', 'allowedOrigins', 'deniedOrigins'])) {
    return 'Browser policy must be an exact plain data object';
  }
  if (!['deny', 'allow', 'ask'].includes(String(value.defaultAction))) {
    return 'Browser default action must be deny, allow, or ask';
  }
  for (const field of ['allowedOrigins', 'deniedOrigins'] as const) {
    const entries = value[field];
    if (
      !isPlainStringArray(entries) ||
      entries.length > 200 ||
      entries.some((entry) => !isPublicOriginPattern(entry))
    ) {
      return `Browser ${field} must contain public host patterns such as example.com, *.example.com, or 1.1.1.1`;
    }
    if (new Set(entries).size !== entries.length) return `Browser ${field} must not contain duplicates`;
  }
  return null;
}

export function readWcoreBrowserPolicyRequest(config: Record<string, unknown>): IWcoreBrowserPolicy | null {
  if (!Object.hasOwn(config, 'browser')) return null;
  if (!isPlainDataObject(config.browser)) {
    throw new Error('Stored Core Browser section is malformed');
  }
  const browser = config.browser;
  if (!Object.hasOwn(browser, 'policy')) return null;
  const policy = browser.policy;
  const policyKeys = ['default_action', 'allowed_origins', 'denied_origins'] as const;
  if (!isExactDataObject(policy, policyKeys)) {
    throw new Error('Stored Core Browser policy contains unknown or malformed fields');
  }
  const candidate = {
    defaultAction: policy.default_action,
    allowedOrigins: policy.allowed_origins,
    deniedOrigins: policy.denied_origins,
  };
  const error = validateWcoreBrowserPolicy(candidate);
  if (error) throw new Error(`Stored Core Browser policy is invalid: ${error}`);
  return candidate as IWcoreBrowserPolicy;
}

export function projectWcoreBrowserPolicyRequest(
  requested: IWcoreBrowserPolicy | null,
  runtime: IWcoreEffectiveRuntime
): IWcoreBrowserPolicyProjection {
  if (requested !== null) {
    const error = validateWcoreBrowserPolicy(requested);
    if (error) throw new Error(`Requested Core Browser policy is invalid: ${error}`);
  }
  return {
    schemaVersion: WCORE_BROWSER_POLICY_PROJECTION_SCHEMA.schemaVersion,
    coreVersion: WCORE_BROWSER_POLICY_PROJECTION_SCHEMA.coreVersion,
    requested:
      requested === null
        ? null
        : {
            policy: structuredClone(requested),
            mode: runtime.mode,
            profile: runtime.profile,
            engineConfigPath: runtime.engineConfigPath,
            desktopConfigPath: runtime.desktopConfigPath,
          },
    effective: null,
    effectiveState: WCORE_BROWSER_POLICY_PROJECTION_SCHEMA.effectiveState,
    restartState: WCORE_BROWSER_POLICY_PROJECTION_SCHEMA.restartState,
  };
}

export function validateWcoreConfigPatch(patch: unknown): string | null {
  if (!isExactDataObject(patch, ['section', 'field', 'value']))
    return 'config patch must be an exact plain data object';
  const section = patch.section;
  const field = patch.field;
  const value = patch.value;
  if (section === 'tools') {
    if (field !== 'allow_list' || !isPlainStringArray(value)) return 'only tools.allow_list may be patched';
    if (value.some((item) => item.length === 0 || item.length > 128)) {
      return 'tools.allow_list must contain valid tool names';
    }
    if (new Set(value).size !== value.length) return 'tools.allow_list must not contain duplicates';
    return null;
  }
  if (section === 'builtin_tools') {
    return (field === 'script.enabled' || field === 'repomap.enabled') && typeof value === 'boolean'
      ? null
      : 'only boolean builtin Script and RepoMap gates may be patched';
  }
  if (section === 'default') {
    return field === 'approval_mode' && (value === 'default' || value === 'auto-edit' || value === 'force')
      ? null
      : 'default.approval_mode is invalid';
  }
  if (section !== 'memory') return 'config patch section is not allowed';
  return field === 'enabled' && typeof value === 'boolean'
    ? null
    : `only memory.enabled is editable for bundled Core ${WCORE_EDITABLE_MEMORY_SCHEMA.coreVersion}`;
}

/**
 * Merge one typed field under configBridge's process-wide mutation lock.
 * `path` is test-only; IPC never accepts a renderer-supplied path.
 */
export async function applyWcoreConfigPatch(patch: unknown, path?: string): Promise<void> {
  const validationError = validateWcoreConfigPatch(patch);
  if (validationError) throw new Error(validationError);
  const intent = patch as IWcoreConfigFieldPatch;

  await mutateConfig((config) => {
    const section = asRecord(config[intent.section]);
    if (intent.section === 'builtin_tools') {
      const gate = intent.field === 'script.enabled' ? 'script' : 'repomap';
      section[gate] = { ...asRecord(section[gate]), enabled: intent.value };
    } else {
      section[intent.field] = intent.value;
    }
    config[intent.section] = section;
    return { value: undefined, changed: true };
  }, path);
}

const preferenceAuthority = {
  get: (key: string) => ProcessConfig.get(key as never) as Promise<unknown>,
  set: (key: string, value: unknown) => ProcessConfig.set(key as never, value as never),
  remove: (key: string) => ProcessConfig.remove(key as never),
};

async function resolveEffectiveRuntimeUnlocked(): Promise<Awaited<ReturnType<typeof resolveEffectiveWcoreRuntime>>> {
  const rawEngineMode = await readRawEngineModePreference(preferenceAuthority);
  return resolveEffectiveWcoreRuntime({
    rawEngineMode,
    desktopConfigPath: resolveConciergeDiagDeps().configPath!,
    // This settings snapshot has no active-conversation prompt payload. Do not
    // claim that a chat-specific overlay was injected merely because managed
    // mode is selected; WCoreManager decides that at conversation launch.
    desktopPromptOverlayApplied: false,
    resolveActiveConfigIdentity,
    standaloneConfigDir,
  });
}

/** Snapshot runtime identity under profile authority; callers do IO afterward. */
function snapshotEffectiveRuntime(): Promise<Awaited<ReturnType<typeof resolveEffectiveWcoreRuntime>>> {
  return withProfileAuthorityLock(resolveEffectiveRuntimeUnlocked);
}

function effectiveRuntimeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return typeof error === 'object' && error !== null && Reflect.get(error, 'code') === 'PROFILE_ISOLATION'
    ? `[PROFILE_ISOLATION] ${message}`
    : message;
}

/**
 * Bind a config operation to the exact path the next Core session will read.
 * The shared authority lock serializes profile activation, raw-mode changes and
 * config publication so the target cannot change between resolution and IO.
 */
export function withEffectiveConfigTarget<T>(operation: (path: string) => Promise<T>): Promise<T> {
  return withProfileAuthorityLock(async () => operation((await resolveEffectiveRuntimeUnlocked()).engineConfigPath));
}

export function parseRawEngineModePreference(value: unknown): boolean {
  if (value === undefined) return false;
  if (typeof value === 'boolean') return value;
  throw new Error('stored raw engine mode is invalid');
}

export function isRawEngineModeIntent(value: unknown): value is { enabled: boolean } {
  return isExactDataObject(value, ['enabled']) && typeof value.enabled === 'boolean';
}

/**
 * Initialise the Wayland Core config + profile IPC handlers.
 *
 * `getSection` is a read; `patchField` is the human-only, remote-denied mutator
 * that always targets the effective managed-profile or standalone raw
 * `config.toml` (no caller-supplied path) and accepts only the closed field
 * union above.
 */
export function initWcoreConfigBridge(): void {
  const preferences = createSerializedPreferenceStore(preferenceAuthority);

  ipcBridge.wcoreConfig.getSection.provider(async ({ section }) => {
    try {
      const readableSections = new Set(['tools', 'builtin_tools', 'default', 'memory']);
      if (!readableSections.has(section)) throw new Error('Core config section is not exposed to the renderer');
      return {
        ok: true,
        value: await withEffectiveConfigTarget((path) => getSection<Record<string, unknown>>(section, path)),
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcBridge.wcoreConfig.patchField.provider(
    async ({ patch }): Promise<import('@/common/adapter/ipcBridge').IWcoreConfigMutationResult> => {
      try {
        await withEffectiveConfigTarget((path) => applyWcoreConfigPatch(patch, path));
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  );

  ipcBridge.wcoreConfig.getBrowserPolicy.provider(async () => {
    try {
      const projection = await withProfileAuthorityLock(async () => {
        const runtime = await resolveEffectiveRuntimeUnlocked();
        const requested = readWcoreBrowserPolicyRequest(await readConfig(runtime.engineConfigPath));
        return projectWcoreBrowserPolicyRequest(requested, runtime);
      });
      return {
        ok: true,
        projection,
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcBridge.wcoreConfig.setBrowserPolicy.provider(async ({ policy }) => {
    try {
      const validationError = validateWcoreBrowserPolicy(policy);
      if (validationError) throw new Error(validationError);
      await withEffectiveConfigTarget((path) =>
        mutateConfig((config) => {
          const browser = asRecord(config.browser);
          browser.policy = {
            ...asRecord(browser.policy),
            default_action: policy.defaultAction,
            allowed_origins: [...policy.allowedOrigins],
            denied_origins: [...policy.deniedOrigins],
          };
          config.browser = browser;
          return { value: undefined, changed: true };
        }, path)
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcBridge.wcoreConfig.getEffectiveRuntime.provider(async () => {
    try {
      return { ok: true, runtime: await snapshotEffectiveRuntime() };
    } catch (error) {
      return { ok: false, error: effectiveRuntimeErrorMessage(error) };
    }
  });

  ipcBridge.wcoreConfig.setRawEngineMode.provider(async (intent: unknown) => {
    if (!isRawEngineModeIntent(intent)) return { ok: false, error: 'raw engine mode intent must be boolean' };
    return withProfileAuthorityLock(() => preferences.set('wcore.rawEngineMode', intent.enabled));
  });

  ipcBridge.wcoreConfig.getOutputBudget.provider(async () => {
    try {
      const value = await readOutputBudgetPreference(preferenceAuthority);
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcBridge.wcoreConfig.setOutputBudget.provider(async ({ value }) => {
    if (!isValidOutputBudgetPreference(value)) return { ok: false, error: 'invalid output budget' };
    return preferences.set('wcore.outputBudget', value);
  });

  ipcBridge.wcoreConfig.openEffectiveRuntimeFolder.provider(async ({ target }) => {
    return openEffectiveRuntimeFolder(target, {
      // Only identity resolution is locked. mkdir/shell.openPath operate on
      // the immutable snapshot after authority is released.
      resolveRuntime: snapshotEffectiveRuntime,
      ensureDirectory: (path) => mkdir(path, { recursive: true }),
      openPath: (path) => shell.openPath(path),
    });
  });

  initWcoreProfileIpc();
}
