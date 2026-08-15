/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Flux connector for Kimi Code (Moonshot).
 *
 * Kimi Code was previously classified as vendor-locked. It is not. Verified by
 * running the real binary against a scratch `KIMI_CODE_HOME`: its `config.toml`
 * accepts a generic `type = "openai"` provider with `base_url` + `api_key`,
 * `kimi doctor` reports the result valid, and `kimi provider list --json` reads
 * the provider and its models back. That makes it `fluxCompat: 'setup'` - the
 * same one-time-config-write mechanic opencode and codex already use.
 *
 * Env injection was tested and does NOT work: exporting `KIMI_BASE_URL` and
 * `KIMI_API_KEY` with no config change registers nothing. So this connector is
 * the only route, and `'env'` is not an option.
 *
 * Writes are a textual splice of ONLY our own tables, mirroring codex.ts. A
 * structured TOML round-trip is unacceptable here: a real Kimi config carries
 * hand-written `[providers."managed:kimi-code"]` tables, nested `.oauth`
 * sub-tables, `[services.*]` blocks and comments, and round-tripping drops the
 * comments and reorders the rest. Reads use `smol-toml` for drift detection
 * only, never to re-serialize.
 *
 * `max_context_size` is deliberately omitted from the model tables. It is not
 * required - a model registers and validates without it - and a guessed context
 * window is worse than an absent one.
 *
 * Like the opencode connector, this writes the Flux API key into a config file
 * in plaintext, because that is the only credential channel Kimi Code offers
 * for a third-party provider. Callers must treat the key as disclosed to disk.
 */

import { createHash, randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { FLUX_SURFACE } from '@/common/config/flux';
import { writeAtomic } from '@process/services/ijfw/atomicFile';
import { parse as parseToml } from 'smol-toml';

import { deleteReceipt, getReceipt, setReceipt } from './manifest';
import type { ConnectorContext, ConnectorStatus, FluxConnectorReport, InstallReceipt } from './types';

const TOOL = 'kimi';

/** Provider id written into Kimi's config. Also the prefix of our model ids. */
const PROVIDER_ID = 'flux-router';

type TomlObject = Record<string, unknown>;

/**
 * Resolve Kimi Code's config path, honoring `KIMI_CODE_HOME` exactly as the
 * binary does (verified: the binary carries `KIMI_CODE_HOME` and resolves
 * `~/.kimi-code` only as the fallback). Note this is `.kimi-code`, NOT `.kimi`
 * - the latter is the legacy tree that `kimi migrate` copies out of.
 */
export function resolveKimiConfigPath(): string {
  const home = process.env.KIMI_CODE_HOME;
  const base = home !== undefined && home.length > 0 ? home : path.join(os.homedir(), '.kimi-code');
  return path.join(base, 'config.toml');
}

/** sha256 of `providers.flux-router.base_url=<baseURL>` (api key excluded). */
export function managedHash(baseURL: string): string {
  return createHash('sha256').update(`providers.${PROVIDER_ID}.base_url=${baseURL}`).digest('hex');
}

/** Model aliases we publish. Names mirror the opencode connector's set. */
const FLUX_MODELS: Array<{ id: string; displayName: string }> = [
  { id: 'flux-auto', displayName: 'Flux Auto' },
  { id: 'flux-fast', displayName: 'Flux Fast' },
  { id: 'flux-standard', displayName: 'Flux Standard' },
  { id: 'flux-reasoning', displayName: 'Flux Reasoning' },
];

/**
 * Render the exact tables we own: one provider, then one table per model alias.
 * `type = "openai"` is the generic OpenAI-compatible provider kind, confirmed
 * accepted by `kimi doctor` against the real binary.
 */
function fluxBlocks(baseURL: string, apiKey: string): string {
  const lines = [
    `[providers."${PROVIDER_ID}"]`,
    'type = "openai"',
    `api_key = ${JSON.stringify(apiKey)}`,
    `base_url = ${JSON.stringify(baseURL)}`,
    '',
  ];
  for (const model of FLUX_MODELS) {
    lines.push(
      `[models."${PROVIDER_ID}/${model.id}"]`,
      `provider = "${PROVIDER_ID}"`,
      `model = ${JSON.stringify(model.id)}`,
      `display_name = ${JSON.stringify(model.displayName)}`,
      ''
    );
  }
  return lines.join('\n');
}

/**
 * Match our provider table: the header line through the start of the next table
 * header or end of file. Anchored at line start, and the closing `"\]` means a
 * sibling like `[providers."flux-router-2"]` is not clobbered.
 */
const FLUX_PROVIDER_BLOCK_RE = new RegExp(
  String.raw`^\[providers\."${PROVIDER_ID}"\][\s\S]*?(?=^\s*\[|\s*$(?![\s\S]))`,
  'm'
);

/** Match every one of our model tables. Global: there is more than one. */
const FLUX_MODEL_BLOCK_RE = new RegExp(
  String.raw`^\[models\."${PROVIDER_ID}/[^"]*"\][\s\S]*?(?=^\s*\[|\s*$(?![\s\S]))`,
  'gm'
);

/** Remove every table we own, leaving all other bytes untouched. */
function stripFluxBlocks(raw: string): string {
  return raw
    .replace(FLUX_PROVIDER_BLOCK_RE, '')
    .replace(FLUX_MODEL_BLOCK_RE, '')
    .replace(/\n{3,}/g, '\n\n');
}

function isObject(value: unknown): value is TomlObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read base_url from the parsed config's flux provider, if present. */
function readFluxBaseURL(parsed: TomlObject): string | undefined {
  const providers = parsed.providers;
  if (!isObject(providers)) return undefined;
  const flux = providers[PROVIDER_ID];
  if (!isObject(flux)) return undefined;
  const baseURL = flux.base_url;
  return typeof baseURL === 'string' ? baseURL : undefined;
}

/** Timestamp safe for a filename. Windows forbids a colon (NTFS ADS). */
function isoSafeTimestamp(iso: string): string {
  return iso.replace(/:/g, '-');
}

/** Routing status of Kimi Code relative to its receipt. */
export async function kimiStatus(ctx: ConnectorContext): Promise<ConnectorStatus> {
  const configPath = ctx.configPathOverride ?? resolveKimiConfigPath();
  const receipt = await getReceipt(ctx.manifestPath, TOOL);

  let raw: string;
  try {
    raw = await fs.promises.readFile(configPath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return 'absent';
    throw err;
  }

  if (receipt === undefined) return 'unconfigured';

  // A health check must never throw. A config that exists but no longer parses
  // is not our known-good state: report drift rather than crashing the panel.
  let parsed: TomlObject;
  try {
    parsed = parseToml(raw) as TomlObject;
  } catch {
    return 'drifted';
  }

  const baseURL = readFluxBaseURL(parsed);
  if (baseURL === undefined) return 'unconfigured';
  return managedHash(baseURL) === receipt.managedHash ? 'routed' : 'drifted';
}

/**
 * Write (or refresh) the Flux provider in Kimi Code's config, preserving every
 * table, key and comment we do not own.
 *
 * Deliberately does NOT touch `default_model`. Selecting Flux globally is the
 * user's call - silently repointing their default model at a different provider
 * is not a setup step, it is a hijack. This matches the opencode connector,
 * which also registers without selecting.
 */
export async function setupKimi(ctx: ConnectorContext): Promise<FluxConnectorReport> {
  const baseURL = ctx.baseURL || FLUX_SURFACE.openai;
  const configPath = ctx.configPathOverride ?? resolveKimiConfigPath();
  await fs.promises.mkdir(path.dirname(configPath), { recursive: true });

  const configExistedBefore = fs.existsSync(configPath);
  const raw = configExistedBefore ? await fs.promises.readFile(configPath, 'utf-8') : '';

  let priorBaseURL: string | undefined;
  if (raw.trim().length > 0) {
    try {
      priorBaseURL = readFluxBaseURL(parseToml(raw) as TomlObject);
    } catch {
      // Unparseable on the way in. We still splice textually - our regexes do
      // not need a parse - but we cannot claim to know the prior base URL.
      priorBaseURL = undefined;
    }
  }
  const priorReceipt = await getReceipt(ctx.manifestPath, TOOL);

  // Snapshot the whole file on the FIRST install only, and only if one existed.
  // A later install reuses the original snapshot so the nuclear restore always
  // means "back to before Wayland ever touched this".
  let backupPath: string | null;
  if (priorReceipt !== undefined) {
    backupPath = priorReceipt.backupPath;
  } else if (configExistedBefore) {
    const stamp = isoSafeTimestamp(new Date().toISOString());
    const nonce = randomBytes(4).toString('hex');
    backupPath = path.join(ctx.backupDir, TOOL, `config.${stamp}.${nonce}.toml`);
    await writeAtomic(backupPath, raw);
  } else {
    backupPath = null;
  }

  const stripped = stripFluxBlocks(raw).replace(/\s*$/, '');
  const nextContent = (stripped.length > 0 ? `${stripped}\n\n` : '') + fluxBlocks(baseURL, ctx.fluxKey);

  // Never hand Kimi a file it cannot read. If our own splice produced invalid
  // TOML, fail before the rename with the user's config still intact.
  try {
    parseToml(nextContent);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Refusing to write ${configPath}: the result would not be valid TOML (${message})`);
  }

  await writeAtomic(configPath, nextContent);

  const receipt: InstallReceipt = {
    tool: TOOL,
    managedHash: managedHash(baseURL),
    configPath,
    backupPath,
    baseURL,
    installedAt: new Date().toISOString(),
  };
  await setReceipt(ctx.manifestPath, receipt);

  let action: FluxConnectorReport['action'];
  const changes: string[] = [];
  if (priorBaseURL === undefined) {
    action = 'installed';
    changes.push(`Added providers."${PROVIDER_ID}" pointing at ${baseURL}`);
  } else if (priorBaseURL === baseURL) {
    action = 'already-routed';
    changes.push(`providers."${PROVIDER_ID}" already pointed at ${baseURL}; refreshed the key`);
  } else {
    action = 'updated';
    changes.push(`Updated providers."${PROVIDER_ID}" base_url from ${priorBaseURL} to ${baseURL}`);
  }
  changes.push(`Registered ${FLUX_MODELS.length} Flux model aliases; default_model left unchanged`);

  return {
    tool: TOOL,
    action,
    status: 'routed',
    configPath,
    configExistedBefore,
    backupPath,
    changes,
    rollbackCommand:
      backupPath !== null
        ? `Run the in-app "Remove Flux from Kimi Code" action, or restore the backup: cp "${backupPath}" "${configPath}"`
        : `Run the in-app "Remove Flux from Kimi Code" action, or delete the providers."${PROVIDER_ID}" and models."${PROVIDER_ID}/*" tables from ${configPath}`,
    baseURL,
  };
}

/**
 * Surgical rollback: delete only the tables we own, preserving every sibling
 * and any edit the user made after setup. The full snapshot stays on disk as a
 * manual nuclear option.
 */
export async function removeKimi(ctx: ConnectorContext): Promise<FluxConnectorReport> {
  const configPath = ctx.configPathOverride ?? resolveKimiConfigPath();
  const receipt = await getReceipt(ctx.manifestPath, TOOL);

  let raw: string | undefined;
  try {
    raw = await fs.promises.readFile(configPath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
  const exists = raw !== undefined;

  const changes: string[] = [];
  if (raw !== undefined) {
    if (FLUX_PROVIDER_BLOCK_RE.test(raw) || raw.match(FLUX_MODEL_BLOCK_RE) !== null) {
      const stripped = stripFluxBlocks(raw).replace(/\s*$/, '');
      const next = stripped.length > 0 ? `${stripped}\n` : '';
      await writeAtomic(configPath, next);
      changes.push(`Removed providers."${PROVIDER_ID}" and its model aliases from ${configPath}`);
    } else {
      changes.push(`No Flux tables found in ${configPath}`);
    }
  } else {
    changes.push(`Config file ${configPath} does not exist; nothing to remove`);
  }

  await deleteReceipt(ctx.manifestPath, TOOL);

  const backupPath = receipt?.backupPath ?? null;
  return {
    tool: TOOL,
    action: 'removed',
    status: exists ? 'unconfigured' : 'absent',
    configPath,
    configExistedBefore: exists,
    backupPath,
    changes,
    rollbackCommand:
      backupPath !== null
        ? `Flux was removed surgically. To restore the pre-install config: cp "${backupPath}" "${configPath}"`
        : 'Flux was removed surgically. No pre-install snapshot exists (setup created the config).',
    baseURL: receipt?.baseURL ?? ctx.baseURL,
  };
}
