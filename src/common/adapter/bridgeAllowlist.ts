/**
 * @license
 * Copyright 2026 Ferrox Labs
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
 *     (renderer-side providers reverse this - see RENDERER_PROVIDED_KEYS)
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
 * Keep this list exhaustive - adding a renderer-side `.provider(fn)` requires
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
  // WebSocket heartbeat (browser webui only - Electron preload doesn't send pong,
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
 * `buildProvider` - this is a pure side-effect wrapper.
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
 * Behavior is otherwise identical to `storage.buildStorage` - pure side-effect
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
 * Provider keys that a REMOTE (paired-device WebSocket) caller must never reach,
 * even though they pass {@link isAllowedInboundName} (which only gates the set of
 * names the trusted local renderer may use). The WebSocket token proves a paired
 * browser, not the local trusted user, so these write/exec/mutation providers are
 * default-DENIED for remote callers (WS-POSTAUTH-DISPATCH).
 *
 * This is a denylist, not a tiny whitelist: everything the paired WebUI legitimately
 * needs (conversation/chat/list/model/usage/memory/wiki/cron reads, etc.) stays
 * allowed; only the dangerous write/exec/install surface is removed.
 *
 * Matching is by key (the part after the `subscribe-` wire prefix), using exact
 * keys plus a small set of prefixes that cover whole dangerous namespaces.
 */
const REMOTE_DENIED_PREFIXES: readonly string[] = [
  // Shell execution / open-with handlers (cmd/explorer, open, xdg-open).
  'shell.',
  // Hub extension install/update/retry/uninstall - remote-reachable RCE chain.
  'hub.',
];
// Note: fs provider keys are registered WITHOUT an `fs.` prefix on the wire
// (e.g. `write-file`, `remove-entry`), so the dangerous fs surface is enumerated
// explicitly in REMOTE_DENIED_KEYS below rather than matched by prefix.

/**
 * Exact provider keys denied to remote WS callers. Covers the fs mutation/raw-read
 * surface (registered without an `fs.` wire prefix), skill/assistant mutation, MCP
 * agent-install mutation, and the app.* providers that can write settings, change
 * the CDP config, control startup, or restart the process.
 */
const REMOTE_DENIED_KEYS: ReadonlySet<string> = new Set([
  // --- Filesystem write / delete / rename / temp / raw-buffer reads ---
  'write-file',
  'remove-entry',
  'rename-entry',
  'read-file',
  'read-file-buffer',
  'create-temp-file',
  'create-upload-file',
  'fetch-remote-image',
  'add-custom-external-path',
  'remove-custom-external-path',
  // fs raw-read / enumeration / archive / workspace-copy surface (arbitrary path access).
  'get-file-metadata',
  'get-file-by-dir',
  'list-workspace-files',
  'get-image-base64',
  'create-zip-file',
  'copy-files-to-workspace',
  // --- Skill / assistant mutation (delete/write/import) ---
  'delete-skill',
  'delete-assistant-rule',
  'delete-assistant-skill',
  'write-assistant-rule',
  'write-assistant-skill',
  'import-skill',
  'skills.build.draft',
  'skills.import.folder',
  'skills.import.git',
  'skills.import.single-skill-md',
  'skills.import.zip',
  'skills.rescan-all',
  'skills.scan',
  'skills.set-pinned',
  // --- MCP mutation (agent install/remove, OAuth login/logout, credential set) ---
  'mcp.sync-to-agents',
  'mcp.remove-from-agents',
  'mcp.login-oauth',
  'mcp.logout-oauth',
  'mcp.set-byo-oauth-credentials',
  // --- Project knowledge draft (reads arbitrary filePaths to feed the model) ---
  'project.generate-knowledge-draft',
  // --- Storage destructive / disk operations ---
  'storage:changeDir',
  'storage:clearDir',
  'storage:openDir',
  'storage:resetAll',
  'storage:importBackup',
  // --- app.* / process control that writes or executes ---
  'app.set-start-on-boot',
  'app.set-zoom-factor',
  'app.update-cdp-config',
  'restart-app',
  'open-external',
  'open-file',
  'open-dev-tools',
  'show-item-in-folder',
]);

/**
 * Return true iff a provider invocation `name` (the full wire name, e.g.
 * `subscribe-write-file`) is permitted for a REMOTE WebSocket caller.
 *
 * This is applied IN ADDITION to {@link isAllowedInboundName}: a name must pass
 * BOTH to be dispatched from the WS path. Non-`subscribe-` names (control-plane
 * heartbeat, renderer-side callbacks) are unaffected here - the inbound allowlist
 * already constrains them and they carry no write/exec capability.
 *
 * @param name Full inbound wire name as received from the WebSocket client.
 * @returns `false` if the resolved provider key is in the remote denylist.
 */
export function isAllowedForRemote(name: string): boolean {
  if (typeof name !== 'string' || name.length === 0) return false;

  // Only provider invocations carry capability; everything else (callbacks,
  // heartbeat) is already constrained by isAllowedInboundName.
  if (!name.startsWith('subscribe-')) return true;

  const key = name.slice('subscribe-'.length);
  if (REMOTE_DENIED_KEYS.has(key)) return false;
  for (const prefix of REMOTE_DENIED_PREFIXES) {
    if (key.startsWith(prefix)) return false;
  }
  return true;
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

  // Provider response from renderer-side provider: subscribe.callback-<key><key><id>
  //
  // The platform's actual wire format (verified against @office-ai/platform's
  // emitter source) is `subscribe.callback-${key}${i(key)}` where
  // `i(e) = e + Math.random().toString(16).slice(2,10)`. That expands to
  // `subscribe.callback-${key}${key}${random8hex}` - the key appears TWICE,
  // because the invoker side computes the id as `<key><8hex>` and the
  // emitter then prepends the key again when forming the callback name.
  //
  // An earlier draft of this allowlist expected `subscribe.callback-<key><id>`
  // (single key) and rejected legitimate callbacks, breaking the entire
  // provider response path - search-workspace responses to Claude/ACP
  // sessions stalled until the prompt timed out. Fix: accept the doubled
  // key prefix, then require exactly 8 lowercase hex chars as the suffix.
  if (name.startsWith('subscribe.callback-')) {
    const rest = name.slice('subscribe.callback-'.length);
    for (const key of RENDERER_PROVIDED_KEYS) {
      // Doubled-key form: `<key><key><8hex>` (the actual platform format).
      const doubledPrefix = key + key;
      if (rest.startsWith(doubledPrefix)) {
        const suffix = rest.slice(doubledPrefix.length);
        if (/^[0-9a-f]{8}$/.test(suffix)) return true;
      }
      // Single-key form: `<key><8hex>`. Kept for back-compat in case some
      // platform version (or test fixture) emits without the doubling.
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

/** Test/diagnostics helper - never call from runtime hot paths. */
export function _getRegisteredKeysForTests(): {
  providers: ReadonlySet<string>;
  emitters: ReadonlySet<string>;
} {
  return { providers: providerKeys, emitters: emitterKeys };
}
