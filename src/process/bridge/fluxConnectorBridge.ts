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
  KimiSetupResult,
  KimiStatusResult,
  OpencodeSetupResult,
  OpencodeStatusResult,
  OpenClawSetupResult,
  OpenClawStatusResult,
} from '@/common/types/fluxConnector';
import { acpDetector } from '@process/agent/acp/AcpDetector';
import { codexStatus, removeCodex, resolveCodexConfigPath, setupCodex } from '@process/connectors/codex';
import { readConnectedFluxKey } from '@process/connectors/fluxKey';
import { kimiStatus, removeKimi, resolveKimiConfigPath, setupKimi } from '@process/connectors/kimi';
import { openclawStatus, removeOpenClaw, resolveOpenClawConfigPath, setupOpenClaw } from '@process/connectors/openclaw';
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
 * Turn a throwing remove into a report the renderer can actually display.
 *
 * The setup handlers already catch and return a typed refusal; the remove
 * handlers did not, and a rejection here does not reach the caller as a
 * rejection - it never settles the renderer promise at all, so FluxSetupModal's
 * `finally { setBusy(false) }` never runs. The user gets a Remove button that
 * spins forever with no message, which reads as a hang rather than a failure.
 *
 * Resolving with `action: 'failed'` puts the reason in the changes list the
 * modal already renders, and costs no new i18n key.
 */
async function reportOnThrow(
  tool: string,
  run: () => Promise<FluxConnectorReport>
): Promise<FluxConnectorReport> {
  try {
    return await run();
  } catch (err) {
    return {
      tool,
      action: 'failed',
      status: 'drifted',
      configPath: '',
      configExistedBefore: true,
      backupPath: null,
      changes: [`Could not remove Flux from ${tool}: ${String(err)}`],
      rollbackCommand: `Removal failed, so nothing was changed. Fix the error above and try again.`,
      baseURL: '',
    };
  }
}

/**
 * Handler: surgically remove the Flux provider from opencode's config. Does not
 * need the flux key.
 */
export async function handleRemoveOpencode(): Promise<FluxConnectorReport> {
  return reportOnThrow('opencode', () => removeOpencode(buildContext('')));
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
  return reportOnThrow('codex', () => removeCodex(buildCodexContext('')));
}

/** True when a `kimi` binary is detectable on PATH. Never throws. */
async function kimiOnPath(): Promise<boolean> {
  try {
    const found = await acpDetector.batchCheckCliAvailability(['kimi']);
    return found.has('kimi');
  } catch {
    return false;
  }
}

/**
 * Handler: report Kimi Code's routing status, resolved config path, and whether
 * kimi is installed (binary on PATH OR a config file present). Does not need the
 * flux key. Kimi Code takes a generic `type = "openai"` provider, so it uses the
 * plain OpenAI surface - NOT codex's Responses surface.
 */
export async function handleKimiStatus(): Promise<KimiStatusResult> {
  const ctx = buildContext('');
  const status = await kimiStatus(ctx);
  const configPath = resolveKimiConfigPath();
  const installed = (await kimiOnPath()) || existsSync(configPath);
  return { status, configPath, installed };
}

/**
 * Handler: install (or refresh) the Flux provider in Kimi Code's config. Reads
 * the connected flux key; if Flux is not connected, returns a typed refusal and
 * never calls the connector.
 */
export async function handleSetupKimi(): Promise<KimiSetupResult> {
  const fluxKey = await readConnectedFluxKey();
  if (fluxKey === undefined) {
    return { ok: false, reason: 'flux-not-connected' };
  }
  try {
    const report = await setupKimi(buildContext(fluxKey));
    return { ok: true, report };
  } catch (err) {
    return { ok: false, reason: 'error', message: String(err) };
  }
}

/**
 * Handler: surgically remove the Flux provider from Kimi Code's config. Does not
 * need the flux key.
 */
export async function handleRemoveKimi(): Promise<FluxConnectorReport> {
  return reportOnThrow('kimi', () => removeKimi(buildContext('')));
}

async function openclawOnPath(): Promise<boolean> {
  try {
    const found = await acpDetector.batchCheckCliAvailability(['openclaw']);
    return found.has('openclaw');
  } catch {
    return false;
  }
}

/**
 * Handler: report OpenClaw's routing status, resolved config path, and whether
 * openclaw is installed (binary on PATH OR a config file present). Does not need
 * the flux key.
 */
export async function handleOpenClawStatus(): Promise<OpenClawStatusResult> {
  const ctx = buildContext('');
  const status = await openclawStatus(ctx);
  const configPath = resolveOpenClawConfigPath();
  const installed = (await openclawOnPath()) || existsSync(configPath);
  return { status, configPath, installed };
}

/**
 * Handler: register the Flux provider in OpenClaw's config and point its default
 * model at it. Reads the connected flux key; if Flux is not connected, returns a
 * typed refusal and never touches the user's config.
 */
export async function handleSetupOpenClaw(): Promise<OpenClawSetupResult> {
  const fluxKey = await readConnectedFluxKey();
  if (fluxKey === undefined) {
    return { ok: false, reason: 'flux-not-connected' };
  }
  try {
    const report = await setupOpenClaw(buildContext(fluxKey));
    return { ok: true, report };
  } catch (err) {
    return { ok: false, reason: 'error', message: String(err) };
  }
}

/**
 * Handler: surgically remove the Flux provider from OpenClaw's config and
 * restore the default model it replaced. Does not need the flux key.
 */
export async function handleRemoveOpenClaw(): Promise<FluxConnectorReport> {
  return reportOnThrow('openclaw', () => removeOpenClaw(buildContext('')));
}

/** Register the flux-connector IPC providers (opencode + codex + kimi + openclaw). */
export function initFluxConnectorBridge(): void {
  ipcBridge.fluxConnector.opencodeStatus.provider(handleOpencodeStatus);
  ipcBridge.fluxConnector.setupOpencode.provider(handleSetupOpencode);
  ipcBridge.fluxConnector.removeOpencode.provider(handleRemoveOpencode);
  ipcBridge.fluxConnector.codexStatus.provider(handleCodexStatus);
  ipcBridge.fluxConnector.setupCodex.provider(handleSetupCodex);
  ipcBridge.fluxConnector.removeCodex.provider(handleRemoveCodex);
  ipcBridge.fluxConnector.kimiStatus.provider(handleKimiStatus);
  ipcBridge.fluxConnector.setupKimi.provider(handleSetupKimi);
  ipcBridge.fluxConnector.removeKimi.provider(handleRemoveKimi);
  ipcBridge.fluxConnector.openclawStatus.provider(handleOpenClawStatus);
  ipcBridge.fluxConnector.setupOpenClaw.provider(handleSetupOpenClaw);
  ipcBridge.fluxConnector.removeOpenClaw.provider(handleRemoveOpenClaw);
}
