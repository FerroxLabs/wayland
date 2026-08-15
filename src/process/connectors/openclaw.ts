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
import * as path from 'node:path';

import { FLUX_SURFACE } from '@/common/config/flux';
import { writeAtomic } from '@process/services/ijfw/atomicFile';

import { resolveOpenClawConfigPathForWrite } from '@process/agent/openclaw/openclawConfig';

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
const FLUX_MODELS: JsonObject[] = [{ id: 'flux-auto', name: 'Flux Auto', reasoning: true, input: ['text', 'image'] }];

/**
 * Resolve OpenClaw's config path.
 *
 * Delegates to the SAME resolver the rest of the OpenClaw integration uses
 * rather than re-deriving it. Writing to a path the gateway reader disagrees
 * with is how you create a second config that shadows the user's real one - see
 * that function's note on migrated `.clawdbot` installs.
 */
export function resolveOpenClawConfigPath(): string {
  return resolveOpenClawConfigPathForWrite();
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

  // Capture a provider that was already sitting under our id, BEFORE we touch
  // it. `flux` is not a reserved name: a user may run their own router under
  // exactly this id, with their own key and model rows. Only captured when we
  // have no receipt — once we own the block, the thing worth restoring is
  // whatever we recorded the first time, not our own previous write.
  const existingProvider = readPath(root, ['models', 'providers', PROVIDER_ID]);
  const priorProvider =
    priorReceipt !== undefined
      ? (priorReceipt.priorProvider ?? null)
      : existingProvider !== undefined
        ? JSON.parse(JSON.stringify(existingProvider))
        : null;

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
  // Whatever is on disk right now, if it is not ours, IS the user's current
  // choice and becomes the thing to restore. Deferring to the stored receipt
  // instead would discard a default they picked after our first install — the
  // "Reapply" path on a drifted config does exactly that — and would then
  // report that we replaced a value we did not replace.
  //
  // The receipt, not the string, is what makes a value ours. `flux/flux-auto`
  // is not a name we reserve: a user pointing their OWN `flux` provider at
  // Flux Router already has exactly this primary, and on a first install
  // matching the string alone recorded their default as "there was none" —
  // removal then deleted it. Found by the live sweep against a real config.
  const priorDefaultModel =
    priorReceipt !== undefined && currentPrimary === PRIMARY_REF
      ? (priorReceipt.priorDefaultModel ?? null)
      : currentPrimary;
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
    priorProvider,
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
  if (priorProvider !== null) {
    changes.push(`Replaced an existing "${PROVIDER_ID}" provider you already had; it is restored if you remove Flux`);
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
  // An unparseable config must not block the rest of removal. Refusing to
  // rewrite a file we cannot parse is right - that guard stays - but throwing
  // here also skipped deleteReceipt below, so status stayed 'drifted' forever
  // and the modal offered Remove and Reapply as the only two actions, BOTH of
  // which parse and are therefore both dead ends. The user could not
  // un-configure Flux from the UI at all. Removal is a rollback of OUR state;
  // it must still complete when the user's own file is beyond our reach.
  let parsed: Record<string, unknown> | undefined;
  if (raw !== undefined) {
    try {
      parsed = parseConfig(raw, configPath);
    } catch {
      changes.push(
        `Could not parse ${configPath}, so it was left untouched. Remove the "${PROVIDER_ID}" provider by hand.`
      );
    }
  }

  if (parsed !== undefined) {
    const root = parsed;
    let touched = false;

    const providers = readPath(root, ['models', 'providers']);
    if (isObject(providers) && providers[PROVIDER_ID] !== undefined) {
      // Only DELETE what we added. If the id was already in use when we
      // installed, put their block back verbatim - deleting it would take their
      // endpoint, their key and their model rows with it.
      const prior = receipt?.priorProvider ?? null;
      if (prior !== null && prior !== undefined) {
        providers[PROVIDER_ID] = prior;
        changes.push(`Restored the "${PROVIDER_ID}" provider you had before Flux in ${configPath}`);
      } else {
        delete providers[PROVIDER_ID];
        changes.push(`Removed models.providers.${PROVIDER_ID} from ${configPath}`);
      }
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
  } else if (raw === undefined) {
    // Guarded on `raw`, not on `parsed`: an unparseable config also lands here
    // and telling that user their config "does not exist" would be a second
    // false statement on top of the one that stranded them.
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
