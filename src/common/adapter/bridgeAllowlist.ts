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
 * Thrown by a bridge `invoke()` when the call cannot reach its provider on the
 * transport this renderer is using (#979).
 *
 * The platform's `invoke()` is RESOLVE-ONLY: it settles a call only when
 * `subscribe.callback-<key><id>` arrives, and there is no reject path and no
 * timeout in the wire protocol. The WS dispatcher therefore answers a
 * remote-denied call with an error ENVELOPE (`settleRejectedInvoke`,
 * src/process/webserver/adapter.ts) so the caller settles instead of hanging -
 * which means the renderer receives a NON-NULL object where it expected data,
 * every `?? []` / `?? default` is skipped, and the next `.find()` / `.slice()`
 * throws in render phase and blanks the app via the root ErrorBoundary.
 *
 * This error restores the missing failure channel on the client side: a call
 * that cannot succeed rejects, so `catch` / SWR `error` / `?? default` all work
 * the way the call sites already assume.
 */
export class BridgeUnavailableError extends Error {
  /** Provider key (the part after the `subscribe-` wire prefix). */
  readonly key: string;
  /** Why the call cannot reach a provider (`remote-forbidden` / `not-allowed`). */
  readonly reason: string;

  constructor(key: string, reason: string) {
    super(`Bridge method "${key}" is not available on this transport (${reason})`);
    this.name = 'BridgeUnavailableError';
    this.key = key;
    this.reason = reason;
  }
}

/**
 * True iff this JS context is a renderer talking to main over the REMOTE
 * WebSocket transport (browser WebUI / paired device / standalone Docker).
 *
 * Reuses the signal the app already uses everywhere else for this question -
 * the presence of the preload-injected `window.electronAPI` (see
 * `isElectronDesktop()` in src/renderer/utils/platform.ts, and the transport
 * branch in src/common/adapter/browser.ts which opens the WebSocket precisely
 * when that object is absent). The main process has no `window`, so it is never
 * classified as remote; this is deliberately evaluated per call rather than
 * memoized at module load, because preload injection races module evaluation.
 *
 * This is a CLIENT-side convenience gate only. It is not a security control and
 * removes none: the authority is still `isAllowedForRemote` on the server's WS
 * dispatch path, which is what this function's key check consults.
 */
export function isRemoteBridgeTransport(): boolean {
  return typeof window !== 'undefined' && !(window as { electronAPI?: unknown }).electronAPI;
}

/** `detail` values `settleRejectedInvoke` uses when it refuses a call. */
const REJECTION_ENVELOPE_DETAILS: ReadonlySet<string> = new Set(['remote-forbidden', 'not-allowed']);

/**
 * True iff `value` is exactly the refusal envelope `settleRejectedInvoke`
 * sends: `{ error: 'failed', detail: <refusal reason> }` and nothing else.
 *
 * The shape check is deliberately exact. Real providers do return payloads that
 * carry `error: 'failed'` (e.g. `project.generate-knowledge-draft` answers
 * `{ draft: '', error: 'failed', detail: <server message> }`), and those are
 * legitimate resolved values that must NOT be turned into rejections.
 */
function isRefusalEnvelope(value: unknown): value is { error: 'failed'; detail: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.error !== 'failed') return false;
  if (typeof record.detail !== 'string' || !REJECTION_ENVELOPE_DETAILS.has(record.detail)) return false;
  return Object.keys(record).length === 2;
}

/**
 * Wrap `bridge.buildProvider` so every declared provider key is recorded, and
 * so a call that the remote transport cannot serve REJECTS instead of resolving
 * with the refusal envelope (#979).
 *
 * `provider` is passed through untouched; only `invoke` is wrapped, and only on
 * the remote transport. On the local Electron renderer and in the main process
 * this is the same pure side-effect wrapper it has always been.
 */
export function buildProvider<Data, Params = undefined>(
  key: string
): ReturnType<typeof bridge.buildProvider<Data, Params>> {
  providerKeys.add(key);
  const base = bridge.buildProvider<Data, Params>(key);
  const baseInvoke = base.invoke as (params?: Params) => Promise<Data>;

  const invoke = async (params?: Params): Promise<Data> => {
    if (!isRemoteBridgeTransport()) return baseInvoke(params);
    // Fail fast on a key the server's WS dispatcher will refuse anyway. Reading
    // the SAME predicate the dispatcher applies is what makes drift structurally
    // impossible - there is no second copy of the denylist.
    if (isRemoteDeniedProviderKey(key)) throw new BridgeUnavailableError(key, 'remote-forbidden');
    const result = await baseInvoke(params);
    // Defence in depth: a refusal can still arrive for a key this side did not
    // classify as denied (e.g. the value-level config-write gate). Convert it.
    if (isRefusalEnvelope(result)) throw new BridgeUnavailableError(key, result.detail);
    return result;
  };

  return { provider: base.provider, invoke: invoke as typeof base.invoke };
}

/**
 * Wrap `bridge.buildEmitter` so every declared emitter key is recorded.
 */
export function buildEmitter<Params = undefined>(key: string): ReturnType<typeof bridge.buildEmitter<Params>> {
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
/**
 * How long a single storage call may hang before it is treated as failed.
 *
 * The bridge underneath is resolve-only: it has no reject path and no timeout,
 * so a provider that never answers leaves the renderer's promise pending
 * FOREVER. Every `await ConfigStorage.get/set(...)` in the renderer - and there
 * are dozens - is therefore a potential permanent stall, and because nothing
 * ever rejects, the `.catch()` blocks already written around them cannot fire
 * and the failure is completely silent.
 *
 * That is not theoretical. It shipped: one stalled write left a user's home
 * page showing "No model configured yet" with a dead Send button while the
 * picker listed hundreds of models, and separately made the preset assistant's
 * backend switch a silent no-op - no change, no error, because that handler
 * awaits storage inside a try/catch that never sees a rejection.
 *
 * Generous on purpose. These are local disk reads and writes of a config that
 * is ~1 MB; anything past this is wedged, not slow. Turning the stall into a
 * rejection is what lets all that existing error handling finally work.
 */
const STORAGE_CALL_TIMEOUT_MS = 15_000;

function withStorageTimeout<T>(namespace: string, method: string, call: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`${namespace}.storage.${method} did not answer within ${STORAGE_CALL_TIMEOUT_MS}ms`));
    }, STORAGE_CALL_TIMEOUT_MS);
    const finish = (fn: (value: never) => void) => (value: never) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    try {
      call().then(finish(resolve as never), finish(reject as never));
    } catch (error) {
      finish(reject as never)(error as never);
    }
  });
}

export function buildStorage<Refer = unknown>(
  namespace: string,
  options?: { debug: boolean }
): ReturnType<typeof storage.buildStorage<Refer>> {
  providerKeys.add(`${namespace}.storage.get`);
  providerKeys.add(`${namespace}.storage.set`);
  providerKeys.add(`${namespace}.storage.clear`);
  providerKeys.add(`${namespace}.storage.remove`);
  const built = options ? storage.buildStorage<Refer>(namespace, options) : storage.buildStorage<Refer>(namespace);
  // Wrap the four wire methods so a wedged provider surfaces as a rejection
  // instead of an eternal pending promise. Allowlist registration above is
  // untouched: this changes only how long a call may hang, never which calls
  // are permitted.
  const wrapped = built as unknown as Record<string, unknown>;
  for (const method of ['get', 'set', 'clear', 'remove'] as const) {
    const original = wrapped[method];
    if (typeof original !== 'function') continue;
    const fn = original as (...args: unknown[]) => Promise<unknown>;
    wrapped[method] = (...args: unknown[]) => withStorageTimeout(namespace, method, () => fn.apply(built, args));
  }
  return built;
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
  // P2-9 artifact seam. `artifacts.open` reaches an OS launcher on the LOCAL
  // machine and `artifacts.save-copy` writes a file there; both are the same
  // class as `shell.` above. `artifacts.list` is denied with them rather than
  // separately, because it enumerates the absolute paths of every workspace the
  // user has - a reconnaissance aid, and the exact input a path-based attack
  // would want. There is no remote artifact view, so the whole namespace goes.
  'artifacts.',
  // Hub extension install/update/retry/uninstall - remote-reachable RCE chain.
  'hub.',
  // Cost observability (WS-D). There is no remote cost view today, so deny the
  // ENTIRE cost.* namespace to paired-device WebSocket callers: the read
  // aggregates (summary/byModel/byBackend/byConversation/byTeam/series) plus the
  // WS-F budget mutations (cost.upsertBudget / cost.deleteBudget) that land
  // later. byConversation/series in particular disclose per-conversation usage
  // and a fine-grained activity timeline. Local-renderer-only surface.
  'cost.',
  // #645 Terminal mode. terminal.open spawns a real PTY running the chat's agent
  // CLI on a TTY; terminal.input writes keystrokes into it. A paired-device WS
  // token proves a remote browser, NOT the local trusted user, so the ENTIRE
  // terminal.* namespace (open/input/resize/close) is denied to remote callers.
  // This IS the "local-only" control from the spec: a buildProvider handler has
  // no per-call remote signal, so the guarantee is enforced here at the wire by
  // name — a remote peer can never spawn or attach a PTY (acceptance §8.6).
  'terminal.',
  // Document conversion accepts an arbitrary local file path and returns the
  // extracted Word/Excel/PowerPoint contents. A paired remote browser must not
  // turn that local-only utility into a filesystem read primitive.
  'document.',
  // #671 Per-workspace access axis. workspaceTrust.set can switch a workspace to
  // trusted-edits (auto-approve bounded read/edit); workspaceTrust.get discloses
  // the security posture. A paired-device WS token proves a remote browser, NOT
  // the local trusted user, so the ENTIRE workspaceTrust.* namespace is denied to
  // remote callers — a remote peer must never arm or read local trust.
  'workspaceTrust.',
  // Instance transfer begins with local authority discovery and grows into
  // privileged export/import publication. Deny the entire namespace so a
  // future provider cannot become remotely reachable by omission.
  'waylandTransfer.',
  // #1024 Engine config recovery. Three of the four channels write to or move
  // the engine's `config.toml`, the file holding the user's providers, API keys
  // and memory/skills settings: `repair` rewrites it, `regenerate` renames it
  // away behind a confirmation, and `reveal` asks the HOST OS to open a
  // Finder/Explorer window. The fourth, `inspect`, is a read, but it discloses
  // the host's engine config path and its integrity posture - the same
  // reconnaissance class as `doctor.run`. A paired-device WS token proves a
  // remote BROWSER, not the local trusted user, so the ENTIRE namespace is
  // denied. A PREFIX and not four exact keys, for the reason stated on
  // `waylandTransfer.` directly above and proved by execution: with only the
  // exact keys listed, `engine-config-recovery.setPath` was remotely ALLOWED
  // while `terminal.anythingNew` was denied. A namespace where three of four
  // channels move a credential-bearing file must not be one omission away from
  // being reachable.
  'engine-config-recovery.',
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
  'move-entry',
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
  'skills.confirm-import',
  'skills.import.folder',
  'skills.import.git',
  'skills.import.single-skill-md',
  'skills.import.zip',
  'skills.rescan-all',
  'skills.scan',
  'skills.scan-library',
  'skills.set-pinned',
  // --- Model registry secret/write IPC. connect/rekey/detectKeys mutate or
  //     disclose stored credentials, so a paired WebUI must never reach them.
  //     `resolveForChatStart` is deliberately NOT denied here: audit C4 hardened
  //     it to return ONLY a non-secret chat-start handle (id / platform /
  //     modelId / baseUrl) - the decrypted key is dropped and re-resolved in the
  //     main process at spawn, never crossing IPC (proven by the
  //     "never returns decrypted secrets" handler test). A remote/headless WebUI
  //     MUST reach it to bind a chat to a model; denying it left every remote
  //     model pick unresolved ("No model configured yet" - cannot chat). ---
  'modelRegistry.connect',
  'modelRegistry.rekey',
  'modelRegistry.detectKeys',
  // --- Spawns a local process (`ollama serve`) on the HOST machine. A paired
  //     browser session must never be able to start a daemon on the desktop it
  //     is talking to. The read-only `localRuntimeStatus` companion is NOT
  //     denied: it reports only installed/running booleans and the remote
  //     Models page needs it to explain why a local provider is unreachable. ---
  'modelRegistry.startLocalRuntime',
  // --- Wayland Core tool-backend key mutation (plant/clear a search API key) ---
  'wcoreToolKeys.set',
  'wcoreToolKeys.delete',
  // --- Wayland Core engine config.toml mutation (rewrite tool allow-list /
  //     sandbox policy / env passthrough). A remote caller reaching this could
  //     disable the sandbox or force-allow secrets into bash (SEC-6).
  //
  //     #987: a `wcoreConfig.setSection` entry used to head this group. No such
  //     provider is registered — `setSection()` is a MAIN-process helper in
  //     src/process/agent/wcore/configBridge.ts that the typed providers below
  //     call; it never crosses the wire. Matching here is exact, so the entry
  //     could never fire: it was protection that protected nothing, the same
  //     failure the agent-installer note further down warns about. The real
  //     wire surface is the typed setters, all of which are denied. ---
  'wcoreConfig.patchField',
  'wcoreConfig.setBrowserPolicy',
  'wcoreConfig.setRawEngineMode',
  'wcoreConfig.setOutputBudget',
  'wcoreConfig.openEffectiveRuntimeFolder',
  // Also deny the read: it discloses the engine's security/tools posture to a
  // paired WebUI client (no secret values, but defence-in-depth — SEC review F2).
  'wcoreConfig.getSection',
  'wcoreConfig.getBrowserPolicy',
  // Exact runtime config identity includes absolute local filesystem paths.
  'wcoreConfig.getEffectiveRuntime',
  //     #990: `wcoreConfig.getOutputBudget` is the one member of this namespace
  //     that is deliberately NOT denied, and the gap is design rather than drift.
  //     It was carved out in the same commit that denied every sibling (#925),
  //     and `bridgeAllowlist.redteam.test.ts` has asserted the split ever since
  //     ("keeps output-budget reads remote but denies the mutation"). The reason
  //     the reads above are denied does not apply to it: its whole payload is
  //     `{ mode: 'auto' | 'fixed'; value?: number }` - a token cap, with no
  //     secret, no local path, and nothing about the sandbox or tool posture.
  //     `setOutputBudget` above is the half that matters and stays denied, as
  //     does the `wcore.outputBudget` config-storage side door further down.
  //     Recorded here because an unexplained gap in an otherwise-uniform group
  //     gets re-raised every time someone reads the file; the sync test in
  //     `bridgeAllowlistWcoreConfig.redteam.test.ts` now pins the whole namespace
  //     so a FUTURE sibling cannot inherit this carve-out by omission.
  // Profile metadata includes local names and filesystem paths. Remote has no
  // redacted DTO or authority contract, so fail closed.
  'wcoreProfiles.list',
  // The workspace retention preview is read-only but carries canonical local
  // paths plus conversation/project/schedule identifiers. Keep that diagnostic
  // inventory on the trusted local renderer only.
  'workspaceRetention.preview',
  // Instance-transfer discovery exposes the local authority inventory and is
  // also the first step toward a privileged export. Keep it local-only even
  // though the current provider is read-only.
  'waylandTransfer.preview',
  // --- Cron write/exec surface. A cron job carries `agentConfig.mode`, which the
  //     executor applies via `task.setMode()` at run time. With the bundled
  //     engine now honoring a wire `set_mode` (WAYLAND_ALLOW_WIRE_FORCE, #495), a
  //     remote-authored job with mode `yolo`/`force`/`auto_edit`/`bypassPermissions`
  //     would spawn a Force/AutoEdit-mode agent with NO local user action. There
  //     is no per-call remote/local signal inside a buildProvider handler (remote
  //     enforcement is name-based here), so mode cannot be clamped in-handler;
  //     deny the write/exec surface outright, mirroring `wcoreConfig.patchField`.
  //     add-job/update-job set the mode; run-now fires the agent (exec);
  //     save-skill writes the job's SKILL.md verbatim (validated only for YAML
  //     frontmatter shape, NOT instruction content), so a remote caller could
  //     plant arbitrary agent instructions that the next scheduled fire runs
  //     with exec capability — deny it too; confirm-proposal accepts a pending
  //     cron proposal (creates a real job) and leaks its edit payload. The
  //     restore-archived-job recreates a local schedule plus its executable
  //     skill instructions, so it is denied too. Read-only views (cron.list-jobs /
  //     list-archived-jobs / list-jobs-by-conversation / get-job / has-skill)
  //     and cron.remove-job stay allowed for the paired UI. Tradeoff:
  //     remote devices can no longer create/update, plant skills for, accept
  //     proposals for, or manually trigger cron jobs; scheduled jobs still fire
  //     and local creation is unaffected. ---
  'cron.add-job',
  'cron.update-job',
  'cron.run-now',
  'cron.save-skill',
  'cron.confirm-proposal',
  'cron.restore-archived-job',
  // --- P2-4 workspace promotion. `promote` copies the chat's files into the
  //     user's Documents, pauses and re-arms the schedule, and repoints the
  //     conversation; `preview` enumerates local workspace paths and the names
  //     of every file earlier runs left behind. A paired-device token proves a
  //     remote browser, not the local trusted user, so the whole namespace is
  //     denied rather than just the write.
  //
  //     EXACT keys, not a prefix: this Set is matched with `.has(key)`, so the
  //     bare string `'promotion.'` that used to sit here matched no provider at
  //     all and the namespace stayed remote-reachable. The prefix list is not
  //     the answer either - `isAllowedOutboundToRemote` is DERIVED from this
  //     rule, so a namespace prefix silences every emitter under it too. Every
  //     promotion key that exists is named here, and
  //     `tests/unit/promotionRemoteDenied.test.ts` enumerates the LIVE provider
  //     registry rather than a hand list, so a future `promotion.*` provider
  //     cannot slip past this the way the first one did. ---
  'promotion.preview',
  'promotion.promote',
  // --- In-app engine updater. `install` downloads + stages a native binary the
  //     next engine spawn executes; a remote caller reaching it is an RCE chain.
  //     `check` hits the network + discloses the engine version. HUMAN-only. ---
  'wcoreUpdate.check',
  'wcoreUpdate.install',
  // --- Wayland Core profile fs mutation (create/clone/activate/delete profile
  //     directories under the profiles root). Remote-denied (SEC-4). ---
  'wcoreProfiles.create',
  'wcoreProfiles.clone',
  'wcoreProfiles.activate',
  'wcoreProfiles.remove',
  // --- Asleep-engine pending-send store (SEC-8). Message bodies are PII/secrets
  //     held in main-process memory only. A remote caller must never read a held
  //     body (take/peek) or inject one (hold), nor drop another user's hold. ---
  'pendingSend.hold',
  'pendingSend.take',
  'pendingSend.peek',
  'pendingSend.clear',
  // --- Channel pairing (codes grant a remote user access to the assistant).
  //     Reading the pending codes discloses live access tokens; approve/reject
  //     mutate authorization. A paired WebUI must never harvest a pending code
  //     or self-approve, so deny all three to remote WS callers. ---
  'channel.get-pending-pairings',
  'channel.approve-pairing',
  'channel.reject-pairing',
  // --- Channel config / authorization mutation + disclosure. Same threat class
  //     as the pairing trio above: a paired WebUI must never reconfigure a
  //     channel (enable/disable a plugin, rotate the webhook token, sync
  //     settings such as WhatsApp mode='dedicated' + ownerNumbers which
  //     auto-authorizes an arbitrary number), revoke/disclose authorized users,
  //     or fire test-plugin (an outbound network call made with caller-supplied
  //     credentials). The read-only status providers the WebUI legitimately
  //     needs (channel.get-plugin-status / get-active-sessions /
  //     get-webhook-exposure and the channel.*-changed event emitters) stay
  //     allowed. ---
  'channel.enable-plugin',
  'channel.disable-plugin',
  // Discloses a channel's saved connection details (IMAP/SMTP hosts + the
  // account address). Same disclosure threat class as the config mutators
  // above, so a paired WebUI must not read it back. Secrets are already reduced
  // to presence flags in the handler, but the non-secret host/address fields
  // still warrant deny for remote callers.
  'channel.get-plugin-config',
  'channel.rotate-webhook-token',
  'channel.sync-channel-settings',
  'channel.revoke-user',
  'channel.get-authorized-users',
  'channel.test-plugin',
  // --- WebUI admin auth surface (WS-POSTAUTH). The webui.* bridge providers are
  //     registered via buildProvider, so a paired-device WS caller passes
  //     isAllowedInboundName and reaches them with NO in-handler remote guard
  //     (unlike the gated `webui-direct-*` ipcMain handlers). These mint/return
  //     admin credentials or mutate auth: `start` returns the initial password,
  //     `reset-password` broadcasts a new plaintext admin password to every
  //     paired client, `change-password`/`change-username` rewrite the admin
  //     login with NO current-password check, `generate-qr-token` /
  //     `verify-qr-token` mint a full admin session token, and `stop` /
  //     `revoke-device` disrupt access. Deny all to remote callers; the
  //     read-only views (webui.get-status / list-paired-devices / activity-log)
  //     stay allowed for the paired UI. ---
  'webui.start',
  'webui.stop',
  'webui.change-password',
  'webui.change-username',
  'webui.reset-password',
  'webui.generate-qr-token',
  'webui.verify-qr-token',
  'webui.revoke-device',
  // --- Onboarding credential writes. connect-pasted-key persists a
  //     caller-supplied provider key (remote credential injection / overwrite of
  //     the legitimate key); connect-flux mints + persists a Flux provider
  //     credential via OAuth. Same class as modelRegistry.connect /
  //     wcoreToolKeys.set (already denied). The read-only onboarding.infer-focus
  //     stays allowed. ---
  'onboarding.connect-pasted-key',
  'onboarding.connect-flux',
  // --- Flux connector writes for Kimi Code. `setup-kimi` takes the stored Flux
  //     key and writes it, in plaintext, into a CLI config file on the HOST.
  //     That is the same class as connect-flux directly above, so a paired
  //     remote caller must not be able to drive it. `remove-kimi` mutates the
  //     same host file. `kimi-status` is a read and stays allowed so the
  //     settings panel still renders remotely.
  //
  //     NOTE: the equivalent opencode and codex channels (`setup-opencode`,
  //     `remove-opencode`, `setup-codex`, `remove-codex`) are NOT denied today
  //     and remain reachable. That looks like an oversight rather than a
  //     decision, but it is shipped behaviour and changing it could break a
  //     paired-device flow, so it is left for an explicit call rather than
  //     changed here. This entry stops the gap from widening by one more
  //     channel in the meantime. ---
  'flux-connector:setup-kimi',
  'flux-connector:remove-kimi',
  //     The openclaw pair is the same class and is denied for the same reason:
  //     `setup-openclaw` reads the stored Flux key and writes it in plaintext
  //     into `~/.openclaw/openclaw.json`, and also repoints the user's default
  //     model; `remove-openclaw` mutates that same host file. `openclaw-status`
  //     is a read and stays allowed so the panel still renders remotely.
  'flux-connector:setup-openclaw',
  'flux-connector:remove-openclaw',
  // --- Managed agent installs (K-05, decision D7). `install` runs a package
  //     manager against the user's profile — it fetches an npm package and
  //     writes an executable tree under userData; `uninstall` recursively
  //     removes a directory. Both are code-on-the-host actions of the same class
  //     as `onboarding.connect-flux` above. A paired-device WS token proves a
  //     remote BROWSER, not the local trusted user, so neither is reachable from
  //     the wire. `agent-installer:status` is a read and stays allowed so the
  //     Agents settings page still renders remotely.
  //
  //     THE KEYS BELOW ARE FULLY QUALIFIED ON PURPOSE. `isAllowedForRemote`
  //     strips only the `subscribe-` transport prefix and then matches this set
  //     EXACTLY against the remaining wire key, which is the whole channel name.
  //     A bare `install` / `uninstall` entry would match nothing that is ever
  //     sent, so it would sit here looking like protection while the install
  //     channel stayed wide open to remote callers. A redteam test reproduces
  //     that exact mistake as a mutation. ---
  'agent-installer:install',
  'agent-installer:uninstall',
  //     `cancel` KILLS a running install. It writes nothing, but a remote caller
  //     that can cancel can deny the local user the install they asked for, on
  //     repeat. Denied for the same reason as the other two, and spelled out in
  //     full for the same reason: matching is exact.
  'agent-installer:cancel',
  // --- Native xAI "Sign in with X (Grok)" OAuth. Both mint/persist the `xai`
  //     provider credential via the model-registry connect path - same class as
  //     connect-flux above. A remote WS caller must never drive an OAuth mint or
  //     trigger a refresh-token exchange. ---
  'xai.auth.login',
  'xai.auth.refresh',
  'xai.auth.submit-code',
  // --- Native "Sign in with ChatGPT" OAuth. Both mint/persist the
  //     `chatgpt-subscription` provider bundle (refresh + access tokens) via the
  //     OAuth flow - same credential-minting class as xai.auth.* above. A remote
  //     WS caller must never drive an OAuth mint or a refresh-token exchange. ---
  'chatgpt.auth.login',
  'chatgpt.auth.refresh',
  // --- Cost observability (WS-D / WS-F). The whole cost.* namespace is already
  //     denied to remote callers via the `cost.` prefix above; these exact keys
  //     are enumerated for documentation + defence-in-depth. byConversation +
  //     series leak per-conversation usage and a fine-grained activity timeline;
  //     upsertBudget / deleteBudget (added by WS-F) are mutations a paired WebUI
  //     must never reach. ---
  'cost.byConversation',
  'cost.series',
  'cost.upsertBudget',
  'cost.deleteBudget',
  'cost.listBudgets',
  // --- MCP mutation (agent install/remove, OAuth login/logout, credential set) ---
  'mcp.sync-to-agents',
  'mcp.remove-from-agents',
  'mcp.archive-configured-server',
  'mcp.restore-archived-server',
  'mcp.login-oauth',
  'mcp.cancel-oauth',
  'mcp.logout-oauth',
  'mcp.set-byo-oauth-credentials',
  // --- Memory mutation (#414 edit/delete of the user's local memory files) ---
  //     The memory.* namespace is intentionally open to the paired WebUI for
  //     READS (list/get/projects/tags/stats). These two providers perform a
  //     real, hard, unrecoverable rewrite/delete of an on-disk memory block, so
  //     a remote/paired peer must never reach them: update-entry silently
  //     rewrites a block, delete-entry hard-deletes it (atomic rename/unlink,
  //     no recycle). Reads stay allowed; only the destructive mutations are
  //     denied to remote. (Local Electron IPC never passes through this gate.)
  'memory.update-entry',
  'memory.delete-entry',
  'memory.restore-archived-entry',
  //     #924: set-quick-add is a WRITE that was sitting on the allowed side of
  //     the read/write line stated above. It creates an on-disk memory entry,
  //     and it now carries a projectPath selector that steers WHICH indexed
  //     project receives it. Denying it puts the namespace back in line with
  //     the READS-only policy this block documents and keeps the new selector
  //     off the remote surface entirely. Local Electron IPC is unaffected.
  'memory.set-quick-add',
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
  // A paired remote/WebUI client must not steer the LOCAL desktop's completion
  // focus gate: its "on-screen conversation" is not the desktop's, and letting it
  // write the single foreground value would silently suppress desktop banners (#579).
  'app.set-foreground-conversation',
  'restart-app',
  'open-external',
  'open-file',
  'open-dev-tools',
  'show-item-in-folder',
  // --- Doctor / health-check (issue #35). The report enumerates the host's
  //     provider connectivity verdicts, MCP server reachability, detected
  //     backends, workspace paths, and config posture. None of it is a raw
  //     secret, but disclosing the full diagnostic posture to a paired WebUI is
  //     a reconnaissance aid — deny it to remote callers (defence-in-depth).
  //     `doctor.copy-text` writes caller-supplied text to the host's OS
  //     clipboard from MAIN (Electron `clipboard.writeText`); a remote caller
  //     reaching it is a clipboard-injection primitive, so deny it too. ---
  'doctor.run',
  'doctor.copy-text',
  // NOTE: `engine-config-recovery.*` (#1024) is denied by PREFIX in
  //     REMOTE_DENIED_PREFIXES above, not enumerated here. See that entry.
  // --- Terminal mode (#645) ENABLE toggle. The read (get-terminal-enabled) is a
  //     harmless boolean and stays allowed, but a remote peer must not flip the
  //     advanced PTY feature ON. The PTY spawn itself is already denied via the
  //     `terminal.` prefix, so this is defense-in-depth against enabling the
  //     capability surface, matching app.set-* / storage:* setting denials. ---
  'system-settings:set-terminal-enabled',
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

  return !isRemoteDeniedProviderKey(name.slice('subscribe-'.length));
}

/**
 * Key-level half of {@link isAllowedForRemote}: true iff the provider key (the
 * part after the `subscribe-` wire prefix) is denied to REMOTE callers.
 *
 * Exists so the bridge CLIENT (`buildProvider`, #979) can ask the same question
 * the server's dispatcher asks, against the same two collections. Nothing about
 * the denylist changes here - `isAllowedForRemote` is the identical function it
 * was, expressed in terms of this predicate.
 */
export function isRemoteDeniedProviderKey(key: string): boolean {
  if (typeof key !== 'string' || key.length === 0) return false;
  if (REMOTE_DENIED_KEYS.has(key)) return true;
  for (const prefix of REMOTE_DENIED_PREFIXES) {
    if (key.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * Wire key for the shared `agent.config` config store's setter. `ConfigStorage`
 * and `ProcessConfig` are the same store (initStorage.ts), so a value written
 * here is what `restoreDesktopWebUIFromPreferences` reads on the next launch.
 */
const CONFIG_STORAGE_SET_KEY = 'agent.config.storage.set';

/**
 * Config keys a REMOTE (paired-device WebSocket) caller must never WRITE, even
 * though the generic `agent.config.storage.set` wire key stays allowed for the
 * config reads/writes the paired WebUI legitimately needs.
 *
 * #819: `webui.start`/`webui.stop` are correctly remote-denied, but arming LAN
 * exposure does not require them - it only needs the PREFERENCE. A paired peer
 * writing `webui.desktop.allowRemote=true` (+ `enabled=true`) makes the app bind
 * `0.0.0.0` itself on the next launch, no dialog, no `webui.start`. The pref IS
 * the consent record, so the denylist has to guard the DECLARATIVE door too, not
 * just the imperative one. `restoreDesktopWebUIFromPreferences` reads only the
 * `webui.desktop.*` keys (enabled / allowRemote / port), so the prefix covers the
 * whole re-arm surface.
 *
 * #671: the same declarative-door lesson. The per-workspace trust level is
 * persisted under `workspace.trustLevel` in the SAME ProcessConfig file, so
 * denying only the dedicated `workspaceTrust.set` provider (which we do) leaves
 * a side door: a paired peer could write `workspace.trustLevel` via the generic
 * config setter, and `hydrateWorkspaceTrust` would load it into the gate cache on
 * the next launch — arming trusted-edits with no local user action. Guard the
 * persisted key here too. Selecting the Cowork assistant is a separate axis.
 */
const REMOTE_DENIED_CONFIG_KEY_PREFIXES: readonly string[] = [
  'webui.desktop.',
  'workspace.trustLevel',
  'wcore.rawEngineMode',
  // Output-budget writes must use the dedicated transactional provider, and that
  // provider (`wcoreConfig.setOutputBudget`) is itself remote-denied. Guard the
  // persisted key so the generic storage setter cannot become the side door the
  // typed path closed. The matching READ stays remote-reachable by design (#990).
  'wcore.outputBudget',
];

/**
 * True iff `(name, data)` is a remote config write to a protected key.
 *
 * Applied AFTER {@link isAllowedForRemote} on the WS dispatch path. The setter's
 * wire key (`agent.config.storage.set`) is intentionally NOT in the remote
 * denylist - denying it wholesale would break every legitimate remote config
 * write - so the gate has to be VALUE-level: inspect the target key carried in
 * the invocation payload and reject only the protected prefixes. The per-call
 * remote signal a `buildProvider` handler lacks exists here at the wire, which is
 * exactly why this belongs in the adapter and not in the storage provider.
 *
 * @param name Full inbound wire name (`subscribe-agent.config.storage.set`).
 * @param data Invocation payload as received: `{ id, data: { key, data } }`.
 */
export function isRemoteDeniedConfigWrite(name: string, data: unknown): boolean {
  if (typeof name !== 'string' || name !== `subscribe-${CONFIG_STORAGE_SET_KEY}`) return false;

  const targetKey = (data as { data?: { key?: unknown } } | null | undefined)?.data?.key;
  if (typeof targetKey !== 'string') return false;

  for (const prefix of REMOTE_DENIED_CONFIG_KEY_PREFIXES) {
    if (targetKey.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * True iff an emitter `name` (main -> client) may be broadcast to a remote
 * WebSocket peer. Inbound denial ({@link isAllowedForRemote}) stops a peer
 * INVOKING a provider; this stops a peer passively RECEIVING an emitter stream.
 *
 * #987: this used to be a SECOND hand-maintained prefix list (`['terminal.']`),
 * and a second hand-maintained list is exactly how it drifted. The inbound rule
 * grew a `cost.` deny — the whole namespace, because those methods disclose
 * spend — and the outbound rule did not, so `cost.budgetAlert` and
 * `cost.budgetGateBlocked` were still broadcast to every paired device.
 * budgetGateBlocked carries the HELD USER MESSAGE BODY (`content`, plus the
 * attached file paths), not just a number.
 *
 * The fix is structural rather than one more entry: the outbound rule is now
 * DERIVED from the inbound one, which is the single source of truth. The
 * invariant is that a namespace a paired peer may not INVOKE is a namespace it
 * may not RECEIVE either, so any future addition to REMOTE_DENIED_PREFIXES /
 * REMOTE_DENIED_KEYS is denied in both directions by construction and the two
 * rules cannot drift apart again.
 *
 * #645 (terminal.output / terminal.exit, the live PTY stream) is preserved by
 * the derived `terminal.` namespace. The local Electron renderer is unaffected
 * — it receives emitters over the in-process IPC adapter, not this WS broadcast
 * path.
 */
export function isAllowedOutboundToRemote(name: string): boolean {
  if (typeof name !== 'string' || name.length === 0) return false;
  // Emitter names carry no `subscribe-` transport prefix, so re-add it and
  // reuse the inbound predicate verbatim instead of re-implementing the match.
  return isAllowedForRemote(`subscribe-${name}`);
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
