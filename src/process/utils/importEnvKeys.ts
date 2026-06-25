/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Boot-time provider-key import for the standalone (headless) server.
 *
 * In Electron the Models page lets a user paste keys interactively. A headless
 * server has no such UI, so on boot we scan the environment (and the same
 * well-known CLI config files the desktop scans) for provider API keys and
 * persist any we find into the model registry - the same connect+test+catalog
 * path the interactive "Use discovered key" button runs. Without this, valid
 * keys present in the container env never reach the registry and the Models page
 * stays empty (issue #25).
 *
 * Idempotent: a provider already `connected` in the registry is skipped, so a
 * restart never re-imports or clobbers a working connection. A provider in an
 * `error` state IS retried (the key may have been fixed). Key material is never
 * logged - only provider ids and counts.
 */

import type { DiscoveredKey } from '@process/providers/detection/KeyDiscovery';
import { KeyDiscovery } from '@process/providers/detection/KeyDiscovery';
import { connectModelRegistryProvider, getModelRegistryRepository } from '@process/providers/ipc/modelRegistryIpc';
import { mirrorDisconnect } from '@process/providers/legacyModelConfigBridge';
import { ProcessConfig } from '@process/utils/initStorage';

/** Flux Router's API host + key prefix. */
const FLUX_BASE_HOST = 'fluxrouter.ai';
const FLUX_KEY_PREFIX = 'sk-flux-';

/**
 * A Flux key wired through `OPENAI_API_KEY` (+ `OPENAI_BASE_URL=…fluxrouter.ai`)
 * is the `wayland setup` convention, but it is really the Flux Router provider.
 * Detect it by the `sk-flux-` key prefix or the fluxrouter base URL so the
 * import can register it as `flux-router` (Flux branding, Flux catalog,
 * flux-auto) instead of mislabeling it as `openai`.
 */
function isFluxKey(value: string, baseUrl: string | undefined): boolean {
  return value.startsWith(FLUX_KEY_PREFIX) || (baseUrl ?? '').toLowerCase().includes(FLUX_BASE_HOST);
}

/**
 * Resolve an optional custom base URL for an env-discovered key.
 *
 * A user who wires an OpenAI-compatible gateway through `OPENAI_API_KEY` +
 * `OPENAI_BASE_URL=https://host/v1` expects the base URL to be honored, not
 * silently dropped (#25). A Flux key is special-cased to the `flux-router`
 * provider by the caller (see `isFluxKey`); every other custom-base key keeps
 * this generic OpenAI-compatible path with the base URL threaded through.
 *
 * Only env-sourced keys carry a base URL - the convention is a paired
 * `<VAR_PREFIX>_BASE_URL` env var (e.g. `OPENAI_API_KEY` -> `OPENAI_BASE_URL`).
 * File sources (`~/.codex/auth.json`) have no such pairing and return undefined.
 */
function resolveBaseUrl(key: DiscoveredKey): string | undefined {
  const envPrefix = 'env:';
  if (!key.source.startsWith(envPrefix)) return undefined;
  const varName = key.source.slice(envPrefix.length);
  // Derive the sibling base-url var by swapping the trailing `_API_KEY` (or
  // `_KEY`) suffix for `_BASE_URL` - the de facto convention across providers.
  const baseVar = varName.replace(/_API_KEY$/, '_BASE_URL').replace(/_KEY$/, '_BASE_URL');
  if (baseVar === varName) return undefined; // no recognizable key suffix
  const value = process.env[baseVar];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

/**
 * Discover provider keys from the environment and persist them into the model
 * registry. Never throws - any failure is logged and import continues with the
 * next provider so a single bad key cannot crash boot.
 */
export async function importEnvKeysOnBoot(): Promise<void> {
  const repo = getModelRegistryRepository();
  if (!repo) {
    // initModelRegistryIpc must run before this. If the repo is missing the
    // registry IPC was never wired; nothing to import into.
    console.warn('[server] Skipping env-key import: model registry not initialized');
    return;
  }

  const discovery = new KeyDiscovery();
  const found = await discovery.scan();
  if (found.length === 0) return;

  let imported = 0;
  for (const key of found) {
    try {
      const value = discovery.readValue(key);
      if (!value) continue; // source vanished between scan() and readValue()

      // Thread an optional custom base URL (e.g. an OpenAI-compatible gateway)
      // so a `*_BASE_URL` env var is honored instead of silently dropped (#25).
      const baseUrl = resolveBaseUrl(key);

      // A Flux key wired through OPENAI_* is the Flux Router provider - register
      // it as `flux-router` so it shows as Flux (not OpenAI), gets the Flux
      // catalog + flux-auto, and routes correctly. flux-router carries its own
      // endpoint, so it needs no custom base URL.
      const isFlux = key.providerId === 'openai' && isFluxKey(value, baseUrl);
      const providerId = isFlux ? 'flux-router' : key.providerId;

      // Skip providers already connected - don't re-import or overwrite a
      // working connection on every restart. Retry providers left in `error`.
      const existing = repo.getRegistryProvider(providerId);
      if (existing && existing.state === 'connected') continue;

      // Clean up a stale `openai` row from a pre-fix boot of THIS server: the
      // env's single OPENAI_API_KEY is the Flux key, so an `openai` provider
      // here can only be the same Flux key mislabeled. Remove it (and its
      // legacy mirror) so the user is left with one clean `flux-router` row.
      if (isFlux && repo.getRegistryProvider('openai')) {
        try {
          repo.deleteRegistryProvider('openai');
          // oxlint-disable-next-line no-await-in-loop -- per-key sequential cleanup of shared registry state
          await mirrorDisconnect('openai');
        } catch (cleanupError) {
          console.warn('[server] Failed to remove stale openai row while remapping to flux-router:', cleanupError);
        }
      }

      const creds = isFlux ? { key: value } : baseUrl ? { key: value, baseUrl } : { key: value };
      // oxlint-disable-next-line no-await-in-loop -- providers are imported one at a time on purpose
      const result = await connectModelRegistryProvider(providerId, creds);
      if (result.ok) {
        imported += 1;
        // Provider id only - never the key value.
        console.log(`[server] Imported provider key from environment: ${providerId}`);
        // Flux is the headless engine when wired this way, so enable Flux
        // routing once on first import - the home/chat default then resolves
        // flux-auto instead of showing "no model configured yet". Only set on a
        // fresh import (the already-connected skip above means a user who later
        // turns routing off via the WebUI is not overridden on restart).
        if (isFlux) {
          try {
            // oxlint-disable-next-line no-await-in-loop -- one-time routing enable on first Flux import
            await ProcessConfig.set('system.routeThroughFlux', true);
          } catch (routeError) {
            console.warn('[server] Failed to enable Flux routing after env import:', routeError);
          }
        }
      } else {
        console.warn(`[server] Env key for ${providerId} failed to connect: ${result.error}`);
      }
    } catch (error) {
      console.warn(`[server] Failed to import env key for ${key.providerId}:`, error);
    }
  }

  if (imported > 0) {
    console.log(`[server] Imported ${imported} provider key(s) from the environment`);
  }
}
