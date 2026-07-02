/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Flux connector for the OpenAI Codex CLI. Codex routes through Flux's
 * Responses surface: it POSTs `model=flux-auto` to `<base_url>/v1/responses`.
 * It cannot be pointed at Flux by env vars alone - it needs a
 * `[model_providers.flux]` table in its own TOML config (`~/.codex/config.toml`,
 * or `CODEX_HOME/config.toml`), then `model_provider = "flux"` selected. It
 * reads the bearer token from the `FLUX_API_KEY` env var at request time.
 *
 * Ported from the proven Rust connector at
 * flux-desktop/crates/flux-connectors/src/codex.rs. Wayland adaptations:
 *  - `base_url` is the REMOTE Flux Responses surface (FLUX_SURFACE.responses)
 *    rather than a local daemon. Codex appends `/responses` itself.
 *  - This connector registers ONLY the `[model_providers.flux]` provider table
 *    in the user's config (additive, safe, never selects flux globally). The
 *    per-chat `model_provider = "flux"` selection is handled at spawn time by
 *    the routing layer via a Wayland-scoped CODEX_HOME, so native model picks
 *    keep using the user's own provider.
 *
 * Writes are surgical: we replace ONLY the `[model_providers.flux]` block as a
 * text section (regex-anchored), leaving every other table, key, and comment
 * byte-identical. This mirrors `setSandboxModeInConfig`'s text-merge philosophy
 * and avoids a comment-dropping full TOML round-trip. Reads use `smol-toml`
 * (already a dependency) to detect the on-disk flux provider for drift.
 */

import { createHash, randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { FLUX_SURFACE } from '@/common/config/flux';
import { getCodexConfigPath } from '@process/task/codexConfig';
import { writeAtomic } from '@process/services/ijfw/atomicFile';
import { parse as parseToml } from 'smol-toml';

import { deleteReceipt, getReceipt, setReceipt } from './manifest';
import type { ConnectorContext, ConnectorStatus, FluxConnectorReport, InstallReceipt } from './types';

const TOOL = 'codex';

type JsonObject = Record<string, unknown>;

/**
 * Resolve codex's config file path. Honors `CODEX_HOME` (else `~/.codex`) via
 * the shared `getCodexConfigPath` so this connector and the codex config layer
 * always agree on the file they read.
 */
export function resolveCodexConfigPath(): string {
  return getCodexConfigPath();
}

/** sha256 of `model_providers.flux.base_url=<baseURL>` (token excluded). */
export function managedHash(baseURL: string): string {
  return createHash('sha256').update(`model_providers.flux.base_url=${baseURL}`).digest('hex');
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Render the exact `[model_providers.flux]` block we write. Trailing newline so
 * it concatenates cleanly with whatever follows. `name`/`env_key`/`wire_api`
 * are fixed; only `base_url` varies, so the managed hash keys on `base_url`.
 */
function fluxProviderBlock(baseURL: string): string {
  return [
    '[model_providers.flux]',
    'name = "Flux"',
    `base_url = "${baseURL}"`,
    'env_key = "FLUX_API_KEY"',
    'wire_api = "responses"',
    '',
  ].join('\n');
}

/**
 * Matches an existing `[model_providers.flux]` table: the header line through
 * the start of the next table header (`[...]`) or end of file. Multiline +
 * dot-matches-newline are emulated with `[\s\S]`. Anchored at line start so a
 * `[model_providers.fluxx]` sibling is not clobbered (the `\]` terminates it).
 */
const FLUX_PROVIDER_BLOCK_RE = /^\[model_providers\.flux\][\s\S]*?(?=^\s*\[|\s*$(?![\s\S]))/m;

/** Read the base_url under [model_providers.flux] from parsed TOML, if present. */
function readFluxBaseURL(parsed: JsonObject): string | undefined {
  const providers = parsed.model_providers;
  if (!isObject(providers)) return undefined;
  const flux = providers.flux;
  if (!isObject(flux)) return undefined;
  const baseURL = flux.base_url;
  return typeof baseURL === 'string' ? baseURL : undefined;
}

/** Timestamp safe for use in a file name (no colons). */
function isoSafeTimestamp(iso: string): string {
  return iso.replace(/:/g, '-');
}

/** Determine the routing status of codex relative to its receipt. */
export async function codexStatus(ctx: ConnectorContext): Promise<ConnectorStatus> {
  const configPath = ctx.configPathOverride ?? resolveCodexConfigPath();
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

  // A health-check read must never throw. A config that exists but is no longer
  // valid TOML is not in our known-good managed state: report drift.
  let parsed: JsonObject;
  try {
    parsed = parseToml(raw) as JsonObject;
  } catch {
    return 'drifted';
  }
  const baseURL = readFluxBaseURL(parsed);
  if (baseURL === undefined) {
    return 'unconfigured';
  }
  return managedHash(baseURL) === receipt.managedHash ? 'routed' : 'drifted';
}

/**
 * Write (or update) the `[model_providers.flux]` table into codex's config.
 * Preserves every other table, key, and comment by replacing only the flux
 * block as text. Snapshots the original bytes on the first install.
 */
export async function setupCodex(ctx: ConnectorContext): Promise<FluxConnectorReport> {
  const baseURL = ctx.baseURL || FLUX_SURFACE.responses;
  const configPath = ctx.configPathOverride ?? resolveCodexConfigPath();
  await fs.promises.mkdir(path.dirname(configPath), { recursive: true });

  const configExistedBefore = fs.existsSync(configPath);
  const raw = configExistedBefore ? await fs.promises.readFile(configPath, 'utf-8') : '';

  // Validate TOML before mutating: never clobber a config we cannot parse.
  let priorBaseURL: string | undefined;
  if (raw.trim().length > 0) {
    let parsed: JsonObject;
    try {
      parsed = parseToml(raw) as JsonObject;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`codex config at ${configPath} is not valid TOML: ${message}`, { cause: err });
    }
    priorBaseURL = readFluxBaseURL(parsed);
  }

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
    backupPath = path.join(snapshotDir, `config.${isoSafeTimestamp(installedAtForBackup)}.${nonce}.toml`);
    await writeAtomic(backupPath, raw);
  } else {
    backupPath = null;
  }

  const newline = raw.includes('\r\n') ? '\r\n' : '\n';
  const block = fluxProviderBlock(baseURL).split('\n').join(newline);

  let nextContent: string;
  if (FLUX_PROVIDER_BLOCK_RE.test(raw)) {
    // Replace the existing flux provider block in place.
    nextContent = raw.replace(FLUX_PROVIDER_BLOCK_RE, block);
  } else if (raw.trim().length > 0) {
    // Append after the existing content, separated by a blank line.
    const trimmed = raw.replace(/\s*$/, '');
    nextContent = `${trimmed}${newline}${newline}${block}`;
  } else {
    nextContent = block;
  }
  if (!nextContent.endsWith(newline)) {
    nextContent = `${nextContent}${newline}`;
  }

  await writeAtomic(configPath, nextContent);

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
    changes.push(`Added [model_providers.flux] pointing at ${baseURL}`);
  } else if (priorBaseURL === baseURL) {
    action = 'already-routed';
    changes.push(`[model_providers.flux] already pointed at ${baseURL}; refreshed the block`);
  } else {
    action = 'updated';
    changes.push(`Updated [model_providers.flux] base_url from ${priorBaseURL} to ${baseURL}`);
  }

  const rollbackCommand =
    backupPath !== null
      ? `Run the in-app "Remove Flux from codex" action, or restore the backup: cp "${backupPath}" "${configPath}"`
      : `Run the in-app "Remove Flux from codex" action, or delete the [model_providers.flux] block from ${configPath}`;

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
 * Gentle rollback: surgically delete only the `[model_providers.flux]` table
 * (preserving every other table, key, comment, and later user edits) and drop
 * the manifest receipt. The full snapshot remains as a manual nuclear restore.
 */
export async function removeCodex(ctx: ConnectorContext): Promise<FluxConnectorReport> {
  const configPath = ctx.configPathOverride ?? resolveCodexConfigPath();
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
    if (FLUX_PROVIDER_BLOCK_RE.test(raw)) {
      // Remove the block and collapse the blank line it leaves behind.
      const stripped = raw.replace(FLUX_PROVIDER_BLOCK_RE, '').replace(/\n{3,}/g, '\n\n');
      const newline = raw.includes('\r\n') ? '\r\n' : '\n';
      const normalized = stripped.replace(/\s*$/, '') + (stripped.trim().length > 0 ? newline : '');
      changes.push(`Removed [model_providers.flux] from ${configPath}`);
      await writeAtomic(configPath, normalized);
    } else {
      changes.push(`No [model_providers.flux] block found in ${configPath}`);
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
