/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Flux Connector Bridge
 *
 * Exposes the main-process opencode Flux connector to the renderer over the IPC
 * bridge. The ConnectorContext (flux key + userData paths) is assembled here in
 * main; the renderer never touches the keychain or the filesystem. The flux key
 * is only read for the setup action (which writes it into opencode's config);
 * status and remove never need it.
 */

import path from 'node:path';

import { app } from 'electron';

import { ipcBridge } from '@/common';
import { FLUX_SURFACE } from '@/common/config/flux';
import type {
  CodexSetupResult,
  CodexStatusResult,
  FluxConnectorReport,
  OpencodeSetupResult,
  OpencodeStatusResult,
} from '@/common/types/fluxConnector';
import { acpDetector } from '@process/agent/acp/AcpDetector';
import { codexStatus, removeCodex, resolveCodexConfigPath, setupCodex } from '@process/connectors/codex';
import { readConnectedFluxKey } from '@process/connectors/fluxKey';
import { opencodeStatus, removeOpencode, resolveOpencodeConfigPath, setupOpencode } from '@process/connectors/opencode';
import type { ConnectorContext } from '@process/connectors/types';
import { existsSync } from 'node:fs';

/**
 * Build a ConnectorContext from the app's userData paths and the Flux surface.
 * The caller decides whether to populate `fluxKey`: status and remove pass an
 * empty string (they never read it), setup passes the connected key.
 */
function buildContext(fluxKey: string): ConnectorContext {
  return {
    fluxKey,
    baseURL: FLUX_SURFACE.openai,
    manifestPath: path.join(app.getPath('userData'), 'flux-connectors.json'),
    backupDir: path.join(app.getPath('userData'), 'flux-connector-backups'),
  };
}

/**
 * Like `buildContext` but pinned to the Responses surface, which codex uses.
 * Codex appends `/responses` to this base_url itself.
 */
function buildCodexContext(fluxKey: string): ConnectorContext {
  return { ...buildContext(fluxKey), baseURL: FLUX_SURFACE.responses };
}

/** True when an `opencode` binary is detectable on PATH. Never throws. */
async function opencodeOnPath(): Promise<boolean> {
  try {
    const found = await acpDetector.batchCheckCliAvailability(['opencode']);
    return found.has('opencode');
  } catch {
    return false;
  }
}

/**
 * Handler: report opencode's routing status, resolved config path, and whether
 * opencode is installed (binary on PATH OR a config file present). Does not need
 * the flux key.
 */
export async function handleOpencodeStatus(): Promise<OpencodeStatusResult> {
  const ctx = buildContext('');
  const status = await opencodeStatus(ctx);
  const configPath = resolveOpencodeConfigPath();
  const installed = (await opencodeOnPath()) || existsSync(configPath);
  return { status, configPath, installed };
}

/**
 * Handler: install (or refresh) the Flux provider into opencode's config. Reads
 * the connected flux key; if Flux is not connected, returns a typed refusal and
 * never calls the connector.
 */
export async function handleSetupOpencode(): Promise<OpencodeSetupResult> {
  const fluxKey = await readConnectedFluxKey();
  if (fluxKey === undefined) {
    return { ok: false, reason: 'flux-not-connected' };
  }
  try {
    const report = await setupOpencode(buildContext(fluxKey));
    return { ok: true, report };
  } catch (err) {
    return { ok: false, reason: 'error', message: String(err) };
  }
}

/**
 * Handler: surgically remove the Flux provider from opencode's config. Does not
 * need the flux key.
 */
export async function handleRemoveOpencode(): Promise<FluxConnectorReport> {
  return removeOpencode(buildContext(''));
}

/** True when a `codex` binary is detectable on PATH. Never throws. */
async function codexOnPath(): Promise<boolean> {
  try {
    const found = await acpDetector.batchCheckCliAvailability(['codex']);
    return found.has('codex');
  } catch {
    return false;
  }
}

/**
 * Handler: report codex's routing status, resolved config path, and whether
 * codex is installed (binary on PATH OR a config file present). Does not need
 * the flux key.
 */
export async function handleCodexStatus(): Promise<CodexStatusResult> {
  const ctx = buildCodexContext('');
  const status = await codexStatus(ctx);
  const configPath = resolveCodexConfigPath();
  const installed = (await codexOnPath()) || existsSync(configPath);
  return { status, configPath, installed };
}

/**
 * Handler: install (or refresh) the Flux provider into codex's config. Reads the
 * connected flux key; if Flux is not connected, returns a typed refusal and
 * never calls the connector.
 */
export async function handleSetupCodex(): Promise<CodexSetupResult> {
  const fluxKey = await readConnectedFluxKey();
  if (fluxKey === undefined) {
    return { ok: false, reason: 'flux-not-connected' };
  }
  try {
    const report = await setupCodex(buildCodexContext(fluxKey));
    return { ok: true, report };
  } catch (err) {
    return { ok: false, reason: 'error', message: String(err) };
  }
}

/**
 * Handler: surgically remove the Flux provider from codex's config. Does not
 * need the flux key.
 */
export async function handleRemoveCodex(): Promise<FluxConnectorReport> {
  return removeCodex(buildCodexContext(''));
}

/** Register the flux-connector IPC providers (opencode + codex). */
export function initFluxConnectorBridge(): void {
  ipcBridge.fluxConnector.opencodeStatus.provider(handleOpencodeStatus);
  ipcBridge.fluxConnector.setupOpencode.provider(handleSetupOpencode);
  ipcBridge.fluxConnector.removeOpencode.provider(handleRemoveOpencode);
  ipcBridge.fluxConnector.codexStatus.provider(handleCodexStatus);
  ipcBridge.fluxConnector.setupCodex.provider(handleSetupCodex);
  ipcBridge.fluxConnector.removeCodex.provider(handleRemoveCodex);
}
