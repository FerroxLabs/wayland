/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Flux connector for sst opencode. opencode cannot route through Flux via env
 * vars, so we register a `flux` provider inside its own config file
 * (`opencode.json`), preserving every sibling provider and top-level key.
 *
 * Config path resolution and the `provider.flux` shape are ported from the
 * proven Rust connector at flux-desktop/crates/flux-connectors/src/opencode.rs.
 * The one Wayland adaptation: baseURL is the remote Flux surface
 * (FLUX_SURFACE.openai) rather than a local daemon, and rollback is surgical
 * (delete only `provider.flux`) rather than a full-file snapshot restore.
 *
 * opencode is case-sensitive about `baseURL` (camelCase). The
 * `@ai-sdk/openai-compatible` npm provider makes opencode use
 * `/v1/chat/completions`, the surface Flux serves.
 */

import { createHash, randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { FLUX_SURFACE } from '@/common/config/flux';
import { writeAtomic } from '@process/services/ijfw/atomicFile';

import { deleteReceipt, getReceipt, setReceipt } from './manifest';
import type {
  ConnectorContext,
  ConnectorStatus,
  FluxConnectorReport,
  InstallReceipt,
} from './types';

const TOOL = 'opencode';

type JsonObject = Record<string, unknown>;

/** Default models seeded when `provider.flux.models` is absent. */
const DEFAULT_FLUX_MODELS: JsonObject = {
  'flux-auto': { name: 'Flux Auto' },
  'flux-fast': { name: 'Flux Fast' },
  'flux-standard': { name: 'Flux Standard' },
  'flux-reasoning': { name: 'Flux Reasoning' },
};

/**
 * Resolve opencode's config file path, honoring `OPENCODE_CONFIG_DIR` and
 * `XDG_CONFIG_HOME` like upstream does. Falls back to
 * `~/.config/opencode/opencode.json` per the XDG Base Directory Specification.
 */
export function resolveOpencodeConfigPath(): string {
  const configDir = process.env.OPENCODE_CONFIG_DIR;
  if (configDir !== undefined && configDir.length > 0) {
    return path.join(configDir, 'opencode.json');
  }
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg !== undefined && xdg.length > 0 ? xdg : path.join(os.homedir(), '.config');
  return path.join(base, 'opencode', 'opencode.json');
}

/** sha256 of `provider.flux.options.baseURL=<baseURL>` (apiKey excluded). */
export function managedHash(baseURL: string): string {
  return createHash('sha256').update(`provider.flux.options.baseURL=${baseURL}`).digest('hex');
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Parse the config root, treating empty/whitespace as `{}` and throwing on
 * malformed JSON or a non-object root (named with the path). */
function parseConfig(raw: string, configPath: string): JsonObject {
  if (raw.trim().length === 0) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`opencode config at ${configPath} is not valid JSON: ${message}`);
  }
  if (!isObject(parsed)) {
    throw new Error(`opencode config at ${configPath} root must be a JSON object`);
  }
  return parsed;
}

/** Read the current baseURL under provider.flux.options, if present. */
function readFluxBaseURL(root: JsonObject): string | undefined {
  const provider = root.provider;
  if (!isObject(provider)) return undefined;
  const flux = provider.flux;
  if (!isObject(flux)) return undefined;
  const options = flux.options;
  if (!isObject(options)) return undefined;
  const baseURL = options.baseURL;
  return typeof baseURL === 'string' ? baseURL : undefined;
}

/** Timestamp safe for use in a file name (no colons). */
function isoSafeTimestamp(iso: string): string {
  return iso.replace(/:/g, '-');
}

/** Determine the routing status of opencode relative to its receipt. */
export async function opencodeStatus(ctx: ConnectorContext): Promise<ConnectorStatus> {
  const configPath = ctx.configPathOverride ?? resolveOpencodeConfigPath();
  const receipt = await getReceipt(ctx.manifestPath, TOOL);

  let raw: string;
  try {
    raw = await fs.promises.readFile(configPath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return 'absent';
    }
    throw err;
  }

  if (receipt === undefined) {
    return 'unconfigured';
  }

  // A health-check read must never throw. A config that exists but is not valid
  // JSON is no longer in our known-good managed state: report drift.
  let root: JsonObject;
  try {
    root = parseConfig(raw, configPath);
  } catch {
    return 'drifted';
  }
  const baseURL = readFluxBaseURL(root);
  if (baseURL === undefined) {
    return 'unconfigured';
  }
  return managedHash(baseURL) === receipt.managedHash ? 'routed' : 'drifted';
}

/**
 * Write (or update) the Flux provider into opencode's config. Preserves every
 * sibling provider and top-level key; only touches `provider.flux`.
 */
export async function setupOpencode(ctx: ConnectorContext): Promise<FluxConnectorReport> {
  const baseURL = ctx.baseURL || FLUX_SURFACE.openai;
  const configPath = ctx.configPathOverride ?? resolveOpencodeConfigPath();
  await fs.promises.mkdir(path.dirname(configPath), { recursive: true });

  const configExistedBefore = fs.existsSync(configPath);
  const raw = configExistedBefore ? await fs.promises.readFile(configPath, 'utf-8') : '';
  const root = parseConfig(raw, configPath);

  const priorBaseURL = readFluxBaseURL(root);
  const priorReceipt = await getReceipt(ctx.manifestPath, TOOL);

  // Backup: snapshot the full file only on the FIRST install and only when a
  // config already existed. A later install reuses the original snapshot.
  let backupPath: string | null;
  if (priorReceipt !== undefined) {
    backupPath = priorReceipt.backupPath;
  } else if (configExistedBefore) {
    const installedAtForBackup = new Date().toISOString();
    const snapshotDir = path.join(ctx.backupDir, TOOL);
    const nonce = randomBytes(4).toString('hex');
    backupPath = path.join(
      snapshotDir,
      `opencode.${isoSafeTimestamp(installedAtForBackup)}.${nonce}.json`,
    );
    await writeAtomic(backupPath, raw);
  } else {
    backupPath = null;
  }

  // Merge provider.flux, preserving siblings. Error if provider or
  // provider.flux exists but is not an object (do not clobber).
  if (root.provider === undefined) {
    root.provider = {};
  } else if (!isObject(root.provider)) {
    throw new Error(`opencode config at ${configPath} has a non-object \`provider\` key`);
  }
  const provider = root.provider as JsonObject;

  if (provider.flux === undefined) {
    provider.flux = {};
  } else if (!isObject(provider.flux)) {
    throw new Error(`opencode config at ${configPath} has a non-object \`provider.flux\``);
  }
  const flux = provider.flux as JsonObject;

  flux.name = 'Flux Router';
  flux.npm = '@ai-sdk/openai-compatible';

  if (flux.options === undefined) {
    flux.options = {};
  } else if (!isObject(flux.options)) {
    throw new Error(`opencode config at ${configPath} has a non-object \`provider.flux.options\``);
  }
  const options = flux.options as JsonObject;
  options.apiKey = ctx.fluxKey;
  options.baseURL = baseURL;

  // Never overwrite a pre-existing models map (user may have custom aliases).
  if (flux.models === undefined) {
    flux.models = DEFAULT_FLUX_MODELS;
  }

  await writeAtomic(configPath, `${JSON.stringify(root, null, 2)}\n`);

  const installedAt = new Date().toISOString();
  const receipt: InstallReceipt = {
    tool: TOOL,
    managedHash: managedHash(baseURL),
    configPath,
    backupPath,
    baseURL,
    installedAt,
  };
  await setReceipt(ctx.manifestPath, receipt);

  // Classify the action against the state observed before we wrote.
  let action: FluxConnectorReport['action'];
  const changes: string[] = [];
  if (priorBaseURL === undefined) {
    action = 'installed';
    changes.push(`Added provider.flux pointing at ${baseURL}`);
  } else if (priorBaseURL === baseURL) {
    action = 'already-routed';
    changes.push(`provider.flux already pointed at ${baseURL}; refreshed apiKey`);
  } else {
    action = 'updated';
    changes.push(`Updated provider.flux baseURL from ${priorBaseURL} to ${baseURL}`);
  }

  const rollbackCommand =
    backupPath !== null
      ? `Run the in-app "Remove Flux from opencode" action, or restore the backup: cp "${backupPath}" "${configPath}"`
      : `Run the in-app "Remove Flux from opencode" action, or delete the provider.flux block from ${configPath}`;

  return {
    tool: TOOL,
    action,
    status: 'routed',
    configPath,
    configExistedBefore,
    backupPath,
    changes,
    rollbackCommand,
    baseURL,
  };
}

/**
 * Gentle rollback: surgically delete only `provider.flux` (preserving every
 * sibling and any later user edits) and drop the manifest receipt. The full
 * snapshot remains as a manual nuclear-restore option.
 */
export async function removeOpencode(ctx: ConnectorContext): Promise<FluxConnectorReport> {
  const configPath = ctx.configPathOverride ?? resolveOpencodeConfigPath();
  const receipt = await getReceipt(ctx.manifestPath, TOOL);

  let raw: string | undefined;
  try {
    raw = await fs.promises.readFile(configPath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }
  const exists = raw !== undefined;

  const changes: string[] = [];
  if (raw !== undefined) {
    const root = parseConfig(raw, configPath);
    const provider = root.provider;
    if (isObject(provider) && provider.flux !== undefined) {
      delete provider.flux;
      changes.push(`Removed provider.flux from ${configPath}`);
      await writeAtomic(configPath, `${JSON.stringify(root, null, 2)}\n`);
    } else {
      changes.push(`No provider.flux block found in ${configPath}`);
    }
  } else {
    changes.push(`Config file ${configPath} does not exist; nothing to remove`);
  }

  await deleteReceipt(ctx.manifestPath, TOOL);

  const backupPath = receipt?.backupPath ?? null;
  const rollbackCommand =
    backupPath !== null
      ? `Flux was removed surgically. To fully restore the pre-install config, run: cp "${backupPath}" "${configPath}"`
      : `Flux was removed surgically. No pre-install snapshot exists (the config was created by setup).`;

  return {
    tool: TOOL,
    action: 'removed',
    status: exists ? 'unconfigured' : 'absent',
    configPath,
    configExistedBefore: exists,
    backupPath,
    changes,
    rollbackCommand,
    baseURL: receipt?.baseURL ?? ctx.baseURL,
  };
}
