/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Flux connector for OpenClaw. OpenClaw cannot be routed by env alone — its
 * provider resolver reads `configuredProvider?.baseUrl ?? envDefault`, so a
 * user who has ever configured a base URL silently keeps their own and env
 * injection is a no-op. So we register a `flux` provider inside its own
 * `openclaw.json`, preserving every sibling provider and top-level key.
 *
 * Shapes verified against the published npm tarball (openclaw@2026.7.1-2,
 * `dist/types.models-*.d.ts`), not from documentation:
 *
 *   ModelProviderConfig  = { baseUrl: string; apiKey?: SecretInput; api?: ModelApi; ... }
 *   ModelDefinitionConfig= { id: string; name: string; reasoning: boolean; input: [...]; ... }
 *
 * Two details that are easy to get wrong and expensive to get wrong:
 *
 *  - It is `baseUrl`, NOT `baseURL`. opencode uses the other casing in the very
 *    next file, and these configs are case-sensitive.
 *  - The provider MUST NOT be named `openai`. The `openai/*` prefix routes
 *    through OpenClaw's native Codex app-server harness rather than its own
 *    inference loop, so naming it `openai` would quietly bypass everything here.
 *    `flux` sidesteps that entirely.
 *
 * Unlike hermes, this deliberately does NOT use a Wayland-scoped config home.
 * OpenClaw's state dir also holds device identity, pairing, sessions, agents and
 * channel config, so scoping it would hand the user a SECOND OpenClaw with no
 * memory of the first — their Telegram assistant and their Wayland assistant
 * would be strangers. Routing one shared instance is the point, so we take on
 * writing a file we do not own, and pay for it with a backup and a real undo.
 */

import { createHash, randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { FLUX_SURFACE } from '@/common/config/flux';
import { writeAtomic } from '@process/services/ijfw/atomicFile';

import { deleteReceipt, getReceipt, setReceipt } from './manifest';
import type { ConnectorContext, ConnectorStatus, FluxConnectorReport, InstallReceipt } from './types';

const TOOL = 'openclaw';

/** Provider id. Never `openai` — see the header note about the Codex harness. */
const PROVIDER_ID = 'flux';
const DEFAULT_MODEL_ID = 'flux-auto';
/** What `agents.defaults.model.primary` must say to actually route. */
const PRIMARY_REF = `${PROVIDER_ID}/${DEFAULT_MODEL_ID}`;

type JsonObject = Record<string, unknown>;

/**
 * Model rows for the flux provider. `id`, `name`, `reasoning` and `input` are
 * all REQUIRED by ModelDefinitionConfig — an entry missing any of them is
 * rejected, so this is the minimum viable row rather than a stylistic choice.
 */
const FLUX_MODELS: JsonObject[] = [
  { id: 'flux-auto', name: 'Flux Auto', reasoning: true, input: ['text', 'image'] },
];

/**
 * Resolve OpenClaw's config path the way upstream does: `OPENCLAW_CONFIG_PATH`
 * wins outright, then the state dir (`OPENCLAW_STATE_DIR`), then `~/.openclaw`.
 */
export function resolveOpenClawConfigPath(): string {
  const explicit = process.env.OPENCLAW_CONFIG_PATH?.trim();
  if (explicit !== undefined && explicit.length > 0) return explicit;

  const stateDir = process.env.OPENCLAW_STATE_DIR?.trim();
  const base = stateDir !== undefined && stateDir.length > 0 ? stateDir : path.join(os.homedir(), '.openclaw');
  return path.join(base, 'openclaw.json');
}

/** sha256 of the one setting that defines "routed" (apiKey excluded). */
export function managedHash(baseUrl: string): string {
  return createHash('sha256').update(`models.providers.${PROVIDER_ID}.baseUrl=${baseUrl}`).digest('hex');
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parse, or refuse. An unparseable config must never be "recovered" by writing
 * a fresh one over it — that would delete a working setup to install a feature.
 */
function parseConfig(raw: string, configPath: string): JsonObject {
  if (raw.trim().length === 0) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `openclaw config at ${configPath} is not valid JSON. Fix or move it before connecting Flux; refusing to overwrite it.`
    );
  }
  if (!isObject(parsed)) {
    throw new Error(`openclaw config at ${configPath} is not a JSON object`);
  }
  return parsed;
}

/** Walk to a nested object, creating missing levels; throws on a non-object in the way. */
function ensureObjectPath(root: JsonObject, keys: string[], configPath: string): JsonObject {
  let node = root;
  const walked: string[] = [];
  for (const key of keys) {
    walked.push(key);
    if (node[key] === undefined) {
      node[key] = {};
    } else if (!isObject(node[key])) {
      throw new Error(`openclaw config at ${configPath} has a non-object \`${walked.join('.')}\``);
    }
    node = node[key] as JsonObject;
  }
  return node;
}

/** Read a nested value without creating anything. */
function readPath(root: JsonObject, keys: string[]): unknown {
  let node: unknown = root;
  for (const key of keys) {
    if (!isObject(node)) return undefined;
    node = node[key];
  }
  return node;
}

function readFluxBaseUrl(root: JsonObject): string | undefined {
  const value = readPath(root, ['models', 'providers', PROVIDER_ID, 'baseUrl']);
  return typeof value === 'string' ? value : undefined;
}

function isoSafeTimestamp(iso: string): string {
  return iso.replace(/:/g, '-');
}

/** Routing status of openclaw relative to its receipt. */
export async function openclawStatus(ctx: ConnectorContext): Promise<ConnectorStatus> {
  const configPath = ctx.configPathOverride ?? resolveOpenClawConfigPath();
  const receipt = await getReceipt(ctx.manifestPath, TOOL);

  let raw: string;
  try {
    raw = await fs.promises.readFile(configPath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return 'absent';
    throw err;
  }

  if (receipt === undefined) return 'unconfigured';

  // A health check must never throw: a config that no longer parses is not in
  // our known-good managed state, which is drift, not a crash.
  let root: JsonObject;
  try {
    root = parseConfig(raw, configPath);
  } catch {
    return 'drifted';
  }

  const baseUrl = readFluxBaseUrl(root);
  if (baseUrl === undefined) return 'unconfigured';
  if (managedHash(baseUrl) !== receipt.managedHash) return 'drifted';

  // Registering the provider routes nothing on its own. If the user has since
  // pointed their default back at another provider, we are installed but not
  // routing, and saying "routed" would be a lie the badge repeats.
  return readPath(root, ['agents', 'defaults', 'model', 'primary']) === PRIMARY_REF ? 'routed' : 'drifted';
}

/**
 * Register the Flux provider in openclaw's own config and point its default
 * model at it. Preserves every sibling provider and top-level key.
 */
export async function setupOpenClaw(ctx: ConnectorContext): Promise<FluxConnectorReport> {
  const baseUrl = ctx.baseURL || FLUX_SURFACE.openai;
  const configPath = ctx.configPathOverride ?? resolveOpenClawConfigPath();
  await fs.promises.mkdir(path.dirname(configPath), { recursive: true });

  const configExistedBefore = fs.existsSync(configPath);
  const raw = configExistedBefore ? await fs.promises.readFile(configPath, 'utf-8') : '';
  const root = parseConfig(raw, configPath);

  const priorBaseUrl = readFluxBaseUrl(root);
  const priorReceipt = await getReceipt(ctx.manifestPath, TOOL);

  // Snapshot the whole file on the FIRST install only, and only if it existed.
  // A reinstall keeps pointing at the original pre-Flux snapshot.
  let backupPath: string | null;
  if (priorReceipt !== undefined) {
    backupPath = priorReceipt.backupPath;
  } else if (configExistedBefore) {
    const snapshotDir = path.join(ctx.backupDir, TOOL);
    const nonce = randomBytes(4).toString('hex');
    backupPath = path.join(snapshotDir, `openclaw.${isoSafeTimestamp(new Date().toISOString())}.${nonce}.json`);
    await writeAtomic(backupPath, raw);
  } else {
    backupPath = null;
  }

  const provider = ensureObjectPath(root, ['models', 'providers', PROVIDER_ID], configPath);
  provider.baseUrl = baseUrl;
  provider.apiKey = ctx.fluxKey;
  provider.api = 'openai-completions';
  // Never clobber a models list the user has customised.
  if (provider.models === undefined) provider.models = FLUX_MODELS;

  // Capture the default we are about to overwrite BEFORE overwriting it, and
  // only on the first install — a reinstall must not record our own value as
  // the thing to restore, which would make removal a no-op.
  const modelDefaults = ensureObjectPath(root, ['agents', 'defaults', 'model'], configPath);
  const currentPrimary = typeof modelDefaults.primary === 'string' ? modelDefaults.primary : null;
  const priorDefaultModel =
    priorReceipt !== undefined ? (priorReceipt.priorDefaultModel ?? null) : currentPrimary === PRIMARY_REF ? null : currentPrimary;
  modelDefaults.primary = PRIMARY_REF;

  await writeAtomic(configPath, `${JSON.stringify(root, null, 2)}\n`);

  const receipt: InstallReceipt = {
    tool: TOOL,
    managedHash: managedHash(baseUrl),
    configPath,
    backupPath,
    baseURL: baseUrl,
    installedAt: new Date().toISOString(),
    priorDefaultModel,
  };
  await setReceipt(ctx.manifestPath, receipt);

  let action: FluxConnectorReport['action'];
  const changes: string[] = [];
  if (priorBaseUrl === undefined) {
    action = 'installed';
    changes.push(`Added models.providers.${PROVIDER_ID} pointing at ${baseUrl}`);
  } else if (priorBaseUrl === baseUrl) {
    action = 'already-routed';
    changes.push(`models.providers.${PROVIDER_ID} already pointed at ${baseUrl}; refreshed apiKey`);
  } else {
    action = 'updated';
    changes.push(`Updated models.providers.${PROVIDER_ID}.baseUrl from ${priorBaseUrl} to ${baseUrl}`);
  }
  changes.push(
    priorDefaultModel !== null
      ? `Set agents.defaults.model.primary to ${PRIMARY_REF} (was ${priorDefaultModel}; restored on removal)`
      : `Set agents.defaults.model.primary to ${PRIMARY_REF}`
  );

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
        ? `Run the in-app "Remove Flux from OpenClaw" action, or restore the backup: cp "${backupPath}" "${configPath}"`
        : `Run the in-app "Remove Flux from OpenClaw" action, or delete the models.providers.${PROVIDER_ID} block from ${configPath}`,
    baseURL: baseUrl,
  };
}

/**
 * Surgical rollback: delete only our provider and put the user's default model
 * back. Restoring the default is the whole point — deleting the provider while
 * leaving `primary` pointing at it would strand OpenClaw on a provider that no
 * longer exists, which is worse than never having connected.
 */
export async function removeOpenClaw(ctx: ConnectorContext): Promise<FluxConnectorReport> {
  const configPath = ctx.configPathOverride ?? resolveOpenClawConfigPath();
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
    const root = parseConfig(raw, configPath);
    let touched = false;

    const providers = readPath(root, ['models', 'providers']);
    if (isObject(providers) && providers[PROVIDER_ID] !== undefined) {
      delete providers[PROVIDER_ID];
      changes.push(`Removed models.providers.${PROVIDER_ID} from ${configPath}`);
      touched = true;
    } else {
      changes.push(`No models.providers.${PROVIDER_ID} block found in ${configPath}`);
    }

    // Only reverse the default if it is still OURS. If the user has since
    // pointed it somewhere else, that is a deliberate choice and overwriting it
    // with a stale pre-install value would be its own small betrayal.
    const modelDefaults = readPath(root, ['agents', 'defaults', 'model']);
    if (isObject(modelDefaults) && modelDefaults.primary === PRIMARY_REF) {
      const prior = receipt?.priorDefaultModel ?? null;
      if (prior !== null) {
        modelDefaults.primary = prior;
        changes.push(`Restored agents.defaults.model.primary to ${prior}`);
      } else {
        delete modelDefaults.primary;
        changes.push('Cleared agents.defaults.model.primary (there was none before Flux)');
      }
      touched = true;
    }

    if (touched) await writeAtomic(configPath, `${JSON.stringify(root, null, 2)}\n`);
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
        ? `Flux was removed surgically. To fully restore the pre-install config, run: cp "${backupPath}" "${configPath}"`
        : 'Flux was removed surgically. No pre-install snapshot exists (the config was created by setup).',
    baseURL: receipt?.baseURL ?? ctx.baseURL,
  };
}
