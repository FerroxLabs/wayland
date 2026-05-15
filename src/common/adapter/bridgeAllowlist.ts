/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IPC bridge allowlist (C1 hardening).
 *
 * The preload contract (`electronAPI.emit`) forwards arbitrary (name, data)
 * tuples from the renderer into the main-process bridge emitter. Without an
 * allowlist, a renderer XSS could call dangerous providers directly
 * (fs.writeFile, fs.removeEntry, shell.openExternal, etc.).
 *
 * This module is the single source of truth for which event names are
 * permitted to cross the renderer→main boundary. It works by wrapping the
 * platform's `bridge.buildProvider` / `bridge.buildEmitter` factories: every
 * declared key is recorded here at module-load time, and only those keys
 * (with their `subscribe-` / `subscribe.callback-` wire prefixes) are
 * accepted by the inbound dispatcher.
 *
 * Wire-protocol shape (see @office-ai/platform):
 *   - provider invocation: renderer → main as `subscribe-<key>`
 *   - provider response  : main → renderer as `subscribe.callback-<key><id>`
 *     (renderer-side providers reverse this — see RENDERER_PROVIDED_KEYS)
 *   - emitter event      : main → renderer as `<key>` (renderer never
 *     re-emits these inbound)
 *
 * A small set of constant control names (heartbeat, auth) is also allowed.
 */

import { bridge, storage } from '@office-ai/platform';

/** Keys registered via `buildProvider` (main-process providers, renderer invokes). */
const providerKeys = new Set<string>();

/** Keys registered via `buildEmitter` (main → renderer events). */
const emitterKeys = new Set<string>();

/**
 * Keys whose `provider` is registered in the RENDERER (so main `invoke`s and
 * renderer responds via `subscribe.callback-<key><id>`). The renderer is the
 * only side that emits the callback wire name for these keys, so the inbound
 * dispatcher must accept `subscribe.callback-<key>...` for each of them.
 *
 * Keep this list exhaustive — adding a renderer-side `.provider(fn)` requires
 * adding the key here.
 */
const RENDERER_PROVIDED_KEYS: ReadonlySet<string> = new Set([
  // src/renderer/pages/conversation/Workspace/hooks/useWorkspaceEvents.ts
  'conversation.response.search.workspace',
]);

/**
 * Control-plane names that don't go through buildProvider/buildEmitter but
 * are legitimate wire messages renderer → main (or webui → main).
 */
const CONTROL_ALLOWED: ReadonlySet<string> = new Set([
  // WebSocket heartbeat (browser webui only — Electron preload doesn't send pong,
  // but listing here keeps the allowlist consistent across both dispatchers).
  'pong',
  'ping',
  // File-selection bridge (WebUI mode). Browser sends `subscribe-show-open`
  // which the WebSocketManager intercepts BEFORE invoking the bridge emitter,
  // so it never reaches the dispatcher. Listed for documentation only.
]);

/**
 * Wrap `bridge.buildProvider` so every declared provider key is recorded.
 *
 * Returned object is identical in shape and behavior to the platform's
 * `buildProvider` — this is a pure side-effect wrapper.
 */
export function buildProvider<Data extends unknown, Params extends unknown = undefined>(
  key: string
): ReturnType<typeof bridge.buildProvider<Data, Params>> {
  providerKeys.add(key);
  return bridge.buildProvider<Data, Params>(key);
}

/**
 * Wrap `bridge.buildEmitter` so every declared emitter key is recorded.
 */
export function buildEmitter<Params extends unknown = undefined>(
  key: string
): ReturnType<typeof bridge.buildEmitter<Params>> {
  emitterKeys.add(key);
  return bridge.buildEmitter<Params>(key);
}

/**
 * Wrap `storage.buildStorage` so every namespace's `get`/`set`/`clear`/`remove`
 * wire key is recorded in the allowlist. The platform's internal `buildStorage`
 * calls `bridge.buildProvider` directly (NOT our wrapped `buildProvider`), so
 * without this wrapper every storage namespace silently bypasses C1.
 *
 * Wire keys per namespace (from @office-ai/platform internals):
 *   `<namespace>.storage.get`
 *   `<namespace>.storage.set`
 *   `<namespace>.storage.clear`
 *   `<namespace>.storage.remove`
 *
 * Behavior is otherwise identical to `storage.buildStorage` — pure side-effect
 * wrapper for allowlist registration.
 */
export function buildStorage<Refer = unknown>(
  namespace: string,
  options?: { debug: boolean }
): ReturnType<typeof storage.buildStorage<Refer>> {
  providerKeys.add(`${namespace}.storage.get`);
  providerKeys.add(`${namespace}.storage.set`);
  providerKeys.add(`${namespace}.storage.clear`);
  providerKeys.add(`${namespace}.storage.remove`);
  return options ? storage.buildStorage<Refer>(namespace, options) : storage.buildStorage<Refer>(namespace);
}

/**
 * Return true iff `name` is a wire event that the renderer (or WebUI client)
 * is permitted to send to the main-process bridge emitter.
 */
export function isAllowedInboundName(name: string): boolean {
  if (typeof name !== 'string' || name.length === 0) return false;

  // Provider invocation: subscribe-<key>
  if (name.startsWith('subscribe-')) {
    const key = name.slice('subscribe-'.length);
    return providerKeys.has(key);
  }

  // Provider response from renderer-side provider: subscribe.callback-<key><id>
  // The platform appends an 8-hex random id (see `i = (e) => e + Math.random()...`
  // in @office-ai/platform: `Math.random().toString(16).slice(2,10)`), so the
  // residual after stripping the key must be exactly 8 lowercase hex chars.
  // Anchor the suffix to prevent a permitted key being a prefix of an arbitrary name.
  if (name.startsWith('subscribe.callback-')) {
    const rest = name.slice('subscribe.callback-'.length);
    for (const key of RENDERER_PROVIDED_KEYS) {
      if (rest.startsWith(key)) {
        const suffix = rest.slice(key.length);
        if (/^[0-9a-f]{8}$/.test(suffix)) return true;
      }
    }
    return false;
  }

  // Control-plane names (heartbeat, etc.).
  return CONTROL_ALLOWED.has(name);
}

/** Test/diagnostics helper — never call from runtime hot paths. */
export function _getRegisteredKeysForTests(): {
  providers: ReadonlySet<string>;
  emitters: ReadonlySet<string>;
} {
  return { providers: providerKeys, emitters: emitterKeys };
}
