/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import type { Writable } from 'node:stream';
import { parse, stringify } from 'smol-toml';
import type { TProviderWithModel } from '@/common/config/storage';
import { VAULT_PASSPHRASE_CHILD_FD, resolveSpawnVaultPassphrase } from '@process/secrets';
// #746: reuse the ACP turn timer rather than clone it — it is a dependency-free
// start/reset/pause/resume/stop timer and is already the proven watchdog behind
// AcpSession's prompt timeout.
import { PromptTimer } from '@process/acp/session/PromptTimer';
import { resolveWCoreBinary } from './binaryResolver';
import {
  buildEngineSpawnEnv,
  buildSpawnConfig,
  appendDesktopMcpProfile,
  WCORE_DESKTOP_MCP_PROFILE,
  engineInheritsShellKey,
  isOpenAIFamilyModelId,
  MissingApiKeyError,
  planVaultPassphraseDelivery,
  type VaultPassphraseDelivery,
} from './envBuilder';
import { ProfileIsolationError, resolveActiveConfigDir } from './profilePaths';
import { readCodexAuthFile } from '@process/onboarding/codexAuthFile';
import { getToolKeyStore } from './toolKeyStore';
import { hydrateModelForSpawn, resolveModelSecretsForSpawn } from '@process/providers/ipc/modelRegistryIpc';
import { vertexSpawnCredentialsForModel } from '@process/providers/vertexSpawnCredentials';
import { DEFAULT_ACCOUNT_ID } from '@/common/config/account';
import { killChild } from '@process/agent/acp/utils';
import { trackAgentChild } from '@process/agent/agentChildRegistry';
import type { WCoreEvent, WCoreCommand, WCoreCapabilities } from './protocol';
import { parseQuestionTool } from './questionTool';
import { stripAnsi, wcoreStderrLevel } from './stderrLog';
import { handleHostSendMessageRequest, defaultHostSendDeps } from './hostSendMessage';
import { DesktopCoreContractError, DesktopCoreV1Consumer } from './desktopContractV1';
import { AnvilPersistentMutationWatcher } from './anvilMutationWatcher';
import { withWCoreProjectConfigLease } from './projectConfigLease';
import {
  ProjectConfigTransaction,
  readProjectConfigNoFollow,
  recoverProjectConfigTransaction,
} from './projectConfigTransaction';

const WCORE_PROJECT_CONFIG = '.wcore.toml';

// Keep the last ~2KB of engine stderr so a spawn/init failure can surface the
// engine's real bail reason (e.g. a keyless model, bad config) instead of an
// opaque "exited with code N" (#484). Capped to bound memory on a chatty engine.
const WCORE_STDERR_TAIL_MAX = 2048;

// High-confidence secret shapes to mask before engine stderr is surfaced into the
// user-facing error UI (#484 audit). Init failures shouldn't echo credentials,
// but stderr is untrusted engine output, so scrub known token formats defensively
// (the full text still goes to the local console log for debugging). Conservative
// on purpose: only well-known prefixes + bearer tokens, so real error text is
// preserved.
const SECRET_PATTERNS: RegExp[] = [
  /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/g, // OpenAI / Stripe style
  /\bBearer\s+[A-Za-z0-9._-]{16,}\b/gi, // Authorization: Bearer <token>
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g, // GitHub tokens
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, // Slack tokens
  /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key id
];

function redactSecrets(text: string): string {
  let out = text;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, '[redacted]');
  }
  return out;
}

type StreamEventHandler = (event: { type: string; data: unknown; msg_id: string; subject?: string }) => void;

/**
 * Sanitize an existing `.wcore.toml` body and merge in the app's own provider
 * config, returning the serialized result plus whether an attacker-owned
 * `providers` table was present and dropped.
 *
 * Provider tables are app-owned: they hold `base_url`/endpoint keys that decide
 * where credentials and prompts are sent. A pre-placed or sibling-written config
 * must never inject or keep a provider override the app did not author, or an
 * attacker with workspace write access could redirect traffic to their own host
 * (RT-B6-07).
 *
 * We parse with a real TOML library rather than scanning lines, because TOML
 * exposes the same `providers` table through many equivalent syntaxes -
 * bracket header `[providers.openai]`, inline table
 * `providers = { openai = { ... } }`, dotted key `providers.openai.base_url`,
 * spaced dotted `providers . openai . base_url`, quoted-key header
 * `["providers"]`, headers with trailing comments - and a string scan cannot
 * robustly catch them all. Parsing collapses every form into the single
 * top-level `providers` object key, so one `delete` strips every variant.
 *
 * The app's own provider fragment (`appContent`) is parsed and its `providers`
 * (plus any other app-owned top-level keys) merged over the sanitized user
 * object, so the app's values always win. Legitimate user-authored non-provider
 * settings (top-level keys, other tables) are preserved.
 *
 * Fails closed: if the existing file is not valid TOML (malformed / attacker
 * garbage), the user content is discarded entirely and only the app's
 * known-good config is written. `parsed` is `false` in that case.
 */
function sanitizeProjectConfig(
  existing: string,
  appContent: string
): { written: string; strippedProviders: boolean; parsed: boolean } {
  const appObject = parse(appContent) as Record<string, unknown>;

  let userObject: Record<string, unknown>;
  try {
    userObject = parse(existing) as Record<string, unknown>;
  } catch {
    // Fail closed: unparseable user content is untrusted - write only the
    // app's known-good config.
    return { written: `${stringify(appObject).trim()}\n`, strippedProviders: false, parsed: false };
  }

  // Every TOML form of an attacker `providers` override collapses to this one
  // top-level key after parsing, so a single delete catches all variants.
  const strippedProviders = Object.prototype.hasOwnProperty.call(userObject, 'providers');
  delete userObject.providers;

  // App-owned keys (including `providers`) win over anything user-authored.
  // Profiles are the one nested merge: Desktop owns only its reserved launch
  // profile, not the user's other project profiles. Preserve those while still
  // letting the reserved key win over a pre-placed collision.
  const userProfiles =
    userObject.profiles && typeof userObject.profiles === 'object'
      ? (userObject.profiles as Record<string, unknown>)
      : undefined;
  const appProfiles =
    appObject.profiles && typeof appObject.profiles === 'object'
      ? (appObject.profiles as Record<string, unknown>)
      : undefined;
  const mergedProfiles = appProfiles ? { ...userProfiles, ...appProfiles } : userProfiles;
  const merged = { ...userObject, ...appObject, ...(mergedProfiles ? { profiles: mergedProfiles } : {}) };
  return { written: `${stringify(merged).trim()}\n`, strippedProviders, parsed: true };
}

/**
 * A legacy stdio MCP declaration for the wcore session. Current Core rejects
 * untrusted wire-added stdio processes, so user connectors must be published
 * into trusted startup config before spawn. The remaining team bridge users of
 * this type are tracked by M1M until Core pins a host-declaration contract.
 * `awaitReady` requires a terminal receipt for this exact server name.
 */
export type StdioMcpOption = {
  name: string;
  command: string;
  args: string[];
  env: Array<{ name: string; value: string }>;
  awaitReady?: boolean;
};

export type WCoreAgentOptions = {
  workspace: string;
  model: TProviderWithModel;
  proxy?: string;
  yoloMode?: boolean;
  presetRules?: string;
  maxTokens?: number;
  maxTurns?: number;
  sessionId?: string;
  resume?: string;
  /**
   * Raw-engine (power-user) mode. When true, the spawn omits Desktop's
   * config/model/prompt/selected-connector overrides so Core resolves those
   * from its own `config.toml` like the standalone CLI. Desktop's private
   * protocol, permissions, team bridge, and allowlisted host integration stay
   * active.
   * `WCoreManager` reads the main-process `ProcessConfig` key
   * `wcore.rawEngineMode` and also
   * skips the Constitution/skills/specialist prompt overlay when this is set.
   */
  rawEngineMode?: boolean;
  /**
   * Legacy stdio MCP declarations sent after Core startup. Do not add user
   * connectors here; publish them into trusted startup config instead.
   */
  stdioMcpServers?: StdioMcpOption[];
  /** Exact trusted-config MCP names allowed into this Desktop-managed session. */
  mcpServerNames?: string[];
  /**
   * Active profile directory captured by the manager before MCP publication.
   * Pinning the launch to the same directory prevents a profile switch between
   * config publication and spawn from silently dropping or crossing connectors.
   */
  waylandHome?: string;
  onStreamEvent: StreamEventHandler;
  onProcessExit?: (code: number | null, activeMsgId: string) => void;
  /** Unconditional child-lifecycle notification, including idle and post-turn exits. */
  onProcessTerminated?: (code: number | null) => void;
  onPong?: () => void;
};

/**
 * #746: idle ceiling for a single wcore turn.
 *
 * The engine can stop emitting frames mid-turn — no `stream_end`, no `error` — and
 * the desktop had NO turn watchdog at all (only *startup* timeouts existed), so the
 * chat span "working" forever; the report is a 24h+ silent spin on a read-only task.
 *
 * This bounds only IDLE time, never total turn time:
 *   - every turn-scoped frame RESETS it (so a long but active turn is never cut), and
 *   - it is PAUSED for the whole tool request→result window (so a legitimately long
 *     build, or a human taking their time over an approval, is never falsely cancelled).
 * Engine heartbeats (`pong`) carry no msg_id and so can NOT keep a stalled turn alive.
 *
 * Env-overridable for support/debugging; floored so it can't be set uselessly low and
 * clamped to the 32-bit setTimeout ceiling (a larger value fires immediately).
 */
const DEFAULT_TURN_STALL_TIMEOUT_MS = 600_000; // 10 min with zero agent progress
const MIN_TURN_STALL_TIMEOUT_MS = 60_000;
const MAX_TIMER_MS = 2_147_483_647;

export function resolveTurnStallTimeoutMs(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number(env.WAYLAND_WCORE_TURN_STALL_TIMEOUT_MS);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TURN_STALL_TIMEOUT_MS;
  return Math.min(Math.max(parsed, MIN_TURN_STALL_TIMEOUT_MS), MAX_TIMER_MS);
}

export class WCoreAgent {
  private childProcess: ChildProcess | null = null;
  /**
   * A failed tree shutdown remains authoritative even if the root process emits
   * `exit` and clears `childProcess`. Without this latch, a second kill could
   * report success while an unproved descendant from the first attempt remains.
   */
  private shutdownFailure: unknown = null;
  /** Exact child whose complete process tree still owns shutdown authority. */
  private failedShutdownChild: ChildProcess | null = null;
  /** Serialize every tree-proof caller for one exact child identity. */
  private treeShutdownAttempt: { child: ChildProcess; promise: Promise<void> } | null = null;
  private disposed = false;
  private ready = false;
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  private readyReject!: (err: Error) => void;
  private onStreamEvent: StreamEventHandler;
  private _onProcessExit: WCoreAgentOptions['onProcessExit'];
  private _onProcessTerminated: WCoreAgentOptions['onProcessTerminated'];
  private _onPong: WCoreAgentOptions['onPong'];
  private options: WCoreAgentOptions;
  private activeMsgId: string | null = null;
  // #520 command visibility: the wire's `tool_running` / `tool_result` events
  // carry only `call_id` + `tool_name` - not the command/description. The engine
  // sends the humanized command (e.g. "Execute: ls") once, on the preceding
  // `tool_request` (ToolInfo.description). The renderer merges tool_group frames
  // by callId with a plain `{...existing, ...incoming}` spread, so an incoming
  // empty `description` OVERWRITES the command shown at request time - which is
  // why the running/finished card lost the command after 0.11.2. We stash the
  // request-time description per callId and re-attach it to the running/result
  // frames so the command stays visible for the whole tool lifecycle.
  private toolDescriptionByCallId = new Map<string, string>();
  /**
   * #746: turn stall watchdog. Started on send(), reset by every turn frame,
   * stopped on the terminal frame (stream_end / error) — see
   * {@link resolveTurnStallTimeoutMs}.
   */
  private stallTimer: PromptTimer;
  /**
   * Pause sources for {@link stallTimer}, keyed by tool call_id. PromptTimer's
   * pause()/resume() is NOT re-entrant, and tool windows can overlap (parallel
   * tool calls), so we only pause on the 0→1 edge and only resume on the 1→0 edge.
   * The lifecycle is deliberately identical to `toolDescriptionByCallId` (added on
   * `tool_request`, dropped on `tool_result` / `tool_cancelled`) so a pause can
   * never outlive its tool call.
   */
  private stallPauseReasons = new Set<string>();
  private projectConfigTransaction: ProjectConfigTransaction | null = null;
  private vertexCredentialRoot: string | null = null;
  private readonly mcpWaiters = new Map<
    string,
    { resolve: () => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }
  >();
  public sessionId?: string;
  public capabilities?: WCoreCapabilities;
  /**
   * The `--max-tokens` value actually passed to wcore. As of #456 this is
   * explicit-only: it is set when the caller passed an explicit `maxTokens`,
   * and otherwise `undefined` (no `--max-tokens` arg added) so the engine
   * sizes the budget per-model itself (`size_output_cap`). Set during
   * `start()`. `WCoreManager` still mirrors a defined value into
   * `data.data.maxTokens`, but the legacy `output_tokens`-vs-budget truncation
   * heuristic is retired in favour of the engine's definitive
   * `finish_reason:'length'`, so an `undefined` value here no longer weakens
   * truncation detection.
   */
  public resolvedMaxTokens?: number;
  /**
   * Rolling tail of the engine's stderr (last ~2KB). Captured so a failed spawn
   * or a ready-timeout can surface the engine's real bail reason rather than an
   * opaque exit code (#484).
   */
  private stderrTail = '';
  private readonly desktopContract = new DesktopCoreV1Consumer();
  private readonly anvilMutationWatcher: AnvilPersistentMutationWatcher;

  constructor(options: WCoreAgentOptions) {
    this.options = options;
    this.anvilMutationWatcher = new AnvilPersistentMutationWatcher(options.workspace, (reason) => {
      const revoked = this.desktopContract.markWorkspaceMutated();
      if (revoked.length > 0) {
        console.warn('[WCoreAgent] publication-bound Anvil trust revoked', { reason, receiptIds: revoked });
        this.onStreamEvent({
          type: 'anvil_trust_changed',
          data: { receipt_ids: revoked, status: 'historical', reason, requires_fresh_core_validation: true },
          msg_id: '',
        });
      }
    });
    this.stallTimer = new PromptTimer(resolveTurnStallTimeoutMs(), () => this.handleTurnStall());
    this.onStreamEvent = options.onStreamEvent;
    this._onProcessExit = options.onProcessExit;
    this._onProcessTerminated = options.onProcessTerminated;
    this._onPong = options.onPong;
    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
  }

  get bootstrap(): Promise<void> {
    return this.readyPromise;
  }

  /**
   * Resolve the forwarded tool-backend keys (`ENV_NAME → value`) to inject into
   * the engine spawn env. Best-effort: any failure (DB unavailable, encryption
   * backend missing) yields an empty map so the engine still spawns with full
   * provider auth - tool search keys are optional, provider auth is not.
   */
  private async loadForwardedToolKeys(): Promise<Record<string, string>> {
    try {
      const store = await getToolKeyStore();
      return store.collectForwardedEnv();
    } catch (err) {
      console.warn('[WCoreAgent] Failed to load tool-backend keys:', err);
      return {};
    }
  }

  async start(): Promise<void> {
    if (this.disposed) throw new Error('Wayland Core agent was stopped before bootstrap');
    if (this.options.rawEngineMode) {
      return this.startWithProjectConfigLease();
    }

    return withWCoreProjectConfigLease(this.options.workspace, async (canonicalWorkspace) => {
      try {
        await this.startWithProjectConfigLease(canonicalWorkspace);
      } finally {
        // Core's ready event proves startup config has been consumed. Restore
        // before releasing the workspace lease so a sibling launch can never
        // observe or inherit this chat's provider/MCP profile.
        // A failed tree proof does not prove consumption or exit. Keep the
        // launch-specific config in place until an identity-bound retry proves
        // the exact stale tree stopped.
        if (this.ready || (!this.childProcess && !this.failedShutdownChild)) {
          this.restoreProjectConfig();
        }
      }
    });
  }

  private async startWithProjectConfigLease(workspace = this.options.workspace): Promise<void> {
    const binaryPath = resolveWCoreBinary();
    if (!binaryPath) {
      throw new Error('wcore binary not found');
    }

    // Resolve the provider key in main at dispatch (audit C4/C5): the model
    // blob carries only a non-secret handle, so the decrypted key is fetched
    // here and lives only for this spawn - it never crossed IPC to the renderer
    // and is never persisted. Per-call resolution keeps concurrent chats on
    // different accounts isolated (audit C6); raw-engine mode ignores the model
    // (it uses the engine's own config.toml), so skip the lookup there.
    const spawnModel = this.options.rawEngineMode ? this.options.model : await hydrateModelForSpawn(this.options.model);

    // Auth-aware surface selection (#865 follow-up): an OpenAI-family model that
    // would wrongly inherit the Anthropic surface can be served keyless via the
    // engine's `openai-chatgpt` provider when a ChatGPT subscription is connected,
    // so a sub-only user (no OpenAI API key) is never dead-ended on "No API key
    // found". We detect a live subscription by the presence of a ChatGPT OAuth
    // token in `~/.codex/auth.json` - the SAME store the engine reads for that
    // provider, so this signal is authoritative for "the keyless spawn will work".
    // Skipped in raw-engine mode (which ignores the model entirely). The read is
    // best-effort and must NEVER abort the spawn: on any failure we fall back to
    // false (the API-key surface), so a transient/unavailable auth store degrades
    // to unchanged behavior rather than breaking init.
    let chatGptSubscriptionAvailable = false;
    if (!this.options.rawEngineMode) {
      try {
        chatGptSubscriptionAvailable = (await readCodexAuthFile()) !== null;
      } catch {
        chatGptSubscriptionAvailable = false;
      }
    }

    // #866 follow-up (reliable-surface preference): an OpenAI-family model rebound
    // off the Anthropic surface (envBuilder's guard) is served RELIABLY only on the
    // API-key `openai` surface (api.openai.com serves every gpt-5.6-*); the keyless
    // ChatGPT-OAuth surface serves a model ONLY if the account is entitled to it
    // (gpt-5.6-sol/luna 400/404 on many real subs). So prefer the key surface
    // whenever the user has a configured OpenAI provider key. The catalog-only
    // model's OWN `apiKey` is the ANTHROPIC key, NOT an OpenAI key, so we source the
    // connected `openai` provider's key HERE and thread its value in, and the env
    // builder injects OPENAI_API_KEY from it (never from `model.apiKey`).
    //
    // Gated to exactly the case the guard can fire (`platform: 'anthropic'` +
    // OpenAI-family id) so no provider-store read happens on an ordinary spawn, and
    // skipped in raw-engine mode (which ignores the model). Best-effort and never
    // fatal: any resolution failure yields no key, so the guard degrades to the
    // keyless OAuth fallback (or a recoverable missing-key) rather than aborting
    // init - the same fail-safe posture as the ChatGPT-sub read above.
    let openAiApiKey: string | undefined;
    if (
      !this.options.rawEngineMode &&
      spawnModel.platform === 'anthropic' &&
      isOpenAIFamilyModelId(spawnModel.useModel)
    ) {
      try {
        const secrets = await resolveModelSecretsForSpawn({
          providerId: 'openai',
          accountId: spawnModel.accountId ?? DEFAULT_ACCOUNT_ID,
          modelId: spawnModel.useModel,
        });
        const key = secrets?.apiKey?.trim();
        if (key) openAiApiKey = key;
      } catch {
        openAiApiKey = undefined;
      }
    }

    const {
      args,
      env,
      projectConfig,
      resolvedMaxTokens,
      missingRequiredApiKey,
      requiredKeyEnvVar,
      spawnEnvDenylist,
      ambientEnvDenylist,
    } = buildSpawnConfig(spawnModel, {
      workspace,
      maxTokens: this.options.maxTokens,
      maxTurns: this.options.maxTurns,
      autoApprove: this.options.yoloMode,
      sessionId: this.options.sessionId,
      resume: this.options.resume,
      rawEngine: this.options.rawEngineMode,
      chatGptSubscriptionAvailable,
      openAiApiKey,
    });

    // #629: refuse to spawn a doomed keyless engine. When the chosen provider
    // needs an API key but `model.apiKey` resolved empty (e.g. a Flux/BYO key
    // that was never persisted came back blank after a credit top-up), spawning
    // would burn a 30s ready-timeout and then surface a raw "No API key found"
    // with no recovery path. Fail fast with a classifiable error so the desktop
    // routes the user to the credential-recovery card (re-enter key / reconnect
    // Flux) instead. ChatGPT-OAuth, keyless-local openai, and raw-engine mode
    // never set this flag. Skip the guard when the engine would still inherit a
    // matching provider key from the user's SHELL (buildEngineSpawnEnv passes
    // allowlisted keys through) - that spawn is authenticated, so blocking it
    // would wrongly push a shell-key user to re-enter a key they already have.
    if (missingRequiredApiKey && !engineInheritsShellKey(requiredKeyEnvVar)) {
      throw new MissingApiKeyError(spawnModel.useModel);
    }

    this.resolvedMaxTokens = resolvedMaxTokens;

    // Write temporary .wcore.toml for provider compat overrides
    const effectiveProjectConfig =
      !this.options.rawEngineMode && this.options.mcpServerNames !== undefined
        ? appendDesktopMcpProfile(projectConfig, this.options.mcpServerNames)
        : projectConfig;
    if (!this.options.rawEngineMode && this.options.mcpServerNames !== undefined) {
      args.push('--profile', WCORE_DESKTOP_MCP_PROFILE);
    }
    if (effectiveProjectConfig) {
      this.writeProjectConfig(effectiveProjectConfig, workspace);
    }

    // SEC-1: spawn with an allowlisted env (provider auth creds + forwarded
    // tool-backend keys) instead of a blanket process.env spread. Tool-key
    // load is best-effort - a DB hiccup must never block the engine spawn.
    const toolKeys = await this.loadForwardedToolKeys();
    // Design B (directory-isolated profiles): point the engine's config root at
    // the active profile's dir so it reads that profile's own config.toml +
    // memory.db + skills. Resolves to the native dir for the `default` profile
    // (backward-compatible).
    //
    // #278: FAIL CLOSED, but ONLY on the failure that actually means "a named
    // profile is live and we cannot resolve its dir" - i.e. ProfileIsolationError.
    //
    // Spawning with WAYLAND_HOME unset tells the engine to use its DEFAULT home. Do
    // that while a NAMED profile is active and you bind that profile's session to
    // the default profile's config.toml / memory.db / credentials - the cross-account
    // bleed this contract exists to prevent. So that case refuses the spawn (same
    // posture as the #629 MissingApiKeyError guard above).
    //
    // Every OTHER failure is on the `default` branch - notably os.homedir(), which
    // nativeConfigDir() calls unguarded and which throws ERR_SYSTEM_ERROR when
    // uv_os_homedir fails. That fault has nothing to do with profiles, and refusing
    // the spawn for it would brick ordinary default-profile users (today: everyone,
    // since no profile UI ships yet) over a non-profile problem. Those keep the old
    // warn-and-continue: the engine falls back to the same default home it would
    // have used anyway, so behaviour is unchanged from before this fix.
    //
    // The narrowing is what makes fail-closed structurally unable to brick `default`.
    let waylandHome = this.options.waylandHome;
    // Raw-engine mode is a deliberate escape hatch to Core's standalone
    // configuration. Do not re-resolve Desktop's active profile here: doing so
    // silently turned the supposedly-raw launch back into a Desktop-managed
    // launch and made the Runtime settings path lie to the user.
    if (!waylandHome && !this.options.rawEngineMode) {
      try {
        waylandHome = await resolveActiveConfigDir();
      } catch (err) {
        if (err instanceof ProfileIsolationError) throw err;
        console.warn('[WCoreAgent] Failed to resolve active profile config dir:', err);
      }
    }
    // #710: hand the engine the profile's vault passphrase so it encrypts its
    // credential store (WAYLAND_HOME spawns otherwise fall back to a warned
    // plaintext credentials.toml). Delivery is fd-based on Unix (an extra pipe
    // at stdio index 3, invisible in /proc environ) and env-based on Windows.
    // Best-effort by design: `resolveSpawnVaultPassphrase` returns null on any
    // keychain/provisioning failure - and when the profile already holds
    // plaintext secrets the engine cannot migrate (no plaintext→vault import
    // exists engine-side) - in which case the spawn proceeds exactly as before.
    let vaultDelivery: VaultPassphraseDelivery | undefined;
    if (waylandHome) {
      const vaultPassphrase = await resolveSpawnVaultPassphrase(waylandHome);
      if (vaultPassphrase !== null) {
        vaultDelivery = planVaultPassphraseDelivery(vaultPassphrase);
      }
    }
    const providerEnv = { ...env };
    const vertexCredentials = vertexSpawnCredentialsForModel(spawnModel);
    if (vertexCredentials) {
      // Google auth requires a credential FILE path. Materialize the encrypted
      // registry value only for this child, inside a private 0700 directory,
      // and delete it on every child termination/retry/kill path.
      try {
        this.cleanupVertexCredentials();
        const root = mkdtempSync(join(tmpdir(), 'wayland-vertex-'));
        this.vertexCredentialRoot = root;
        chmodSync(root, 0o700);
        const credentialPath = join(root, 'service-account.json');
        writeFileSync(credentialPath, vertexCredentials.serviceAccountJson, { flag: 'wx', mode: 0o600 });
        providerEnv.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;
        providerEnv.VERTEX_PROJECT_ID = vertexCredentials.projectId;
        providerEnv.VERTEX_REGION = vertexCredentials.region;
      } catch (error) {
        this.cleanupVertexCredentials();
        throw error;
      }
    }
    if (this.disposed) throw new Error('Wayland Core agent was stopped during bootstrap');
    try {
      this.childProcess = spawn(binaryPath, args, {
        env: buildEngineSpawnEnv({
          providerEnv,
          toolKeys,
          waylandHome,
          vaultPassphraseEnv: vaultDelivery?.env,
          spawnEnvDenylist,
          ambientEnvDenylist,
        }),
        stdio: vaultDelivery?.stdio ?? ['pipe', 'pipe', 'pipe'],
        cwd: workspace,
      });
    } catch (error) {
      this.cleanupVertexCredentials();
      throw error;
    }
    if (vaultDelivery?.mode === 'fd') {
      // Write the passphrase into the extra pipe and close our end so the
      // engine's read-to-EOF completes. The engine reads it lazily (first
      // credential access); the pipe buffers the short payload until then.
      // Swallow EPIPE - an engine that dies before reading must not crash us.
      const fdStream = this.childProcess.stdio[VAULT_PASSPHRASE_CHILD_FD] as Writable | null;
      if (fdStream) {
        fdStream.on('error', () => {});
        fdStream.end(vaultDelivery.fdPayload);
      }
    }
    // #443: register with the last-resort reaper so a quit that truncates the
    // graceful per-agent kill still force-kills this engine child (auto-removed
    // on exit / graceful kill).
    trackAgentChild(this.childProcess);

    // Parse stdout as bounded, fatal-UTF-8 JSON Lines. Node's readline layer
    // replaces malformed UTF-8 and can retain an unbounded partial line, both
    // of which violate the Desktop v1 producer contract.
    const failDesktopContract = (error: unknown): void => {
      const detail = error instanceof Error ? error.message : String(error);
      const code = error instanceof DesktopCoreContractError ? error.code : 'unexpected_consumer_error';
      console.error('[WCoreAgent] Desktop contract failed closed', { code, detail });
      this.stopStallWatchdog();
      if (!this.ready) this.readyReject(new Error(`wcore Desktop contract rejected ready: ${detail}`));
      else {
        this.onStreamEvent({
          type: 'error',
          data: `Wayland Core protocol safety check failed: ${detail}`,
          msg_id: this.activeMsgId ?? '',
        });
      }
      const child = this.childProcess;
      if (child) void killChild(child, false).catch(() => {});
    };
    this.childProcess.stdout!.on('data', (chunk: Buffer | string) => {
      try {
        for (const result of this.desktopContract.consumeChunk(chunk)) {
          if (result.kind === 'drop') {
            console.warn('[WCoreAgent] Desktop contract dropped event', { reason: result.reason });
            continue;
          }
          if (result.contract === 'v1' && result.event.type === 'anvil_receipt') {
            this.anvilMutationWatcher.start();
          }
          this.handleEvent(result.event);
        }
      } catch (error) {
        failDesktopContract(error);
      }
    });
    this.childProcess.stdout!.on('end', () => {
      try {
        this.desktopContract.finishInput();
      } catch (error) {
        failDesktopContract(error);
      }
    });

    // Retain the raw stderr tail for failure surfacing (#484).
    this.childProcess.stderr?.on('data', (chunk: Buffer) => {
      this.stderrTail = (this.stderrTail + chunk.toString()).slice(-WCORE_STDERR_TAIL_MAX);
    });

    // Log each stderr line at the engine's own severity instead of blanket
    // [error] (#717): the engine self-labels lines (tracing format), and
    // routine INFO chatter re-tagged as host errors drowned real errors.
    // ANSI colour codes are stripped so the log file stays plain text.
    const stderrLines = createInterface({ input: this.childProcess.stderr! });
    stderrLines.on('line', (rawLine) => {
      const line = stripAnsi(rawLine);
      if (!line.trim()) return;
      console[wcoreStderrLevel(line)]('[wcore]', line);
    });

    // Capture the exact child whose listeners are being installed. Exit is a
    // root-process notification, not proof that the complete engine tree is
    // gone: descendants can remain alive after the root exits. In particular,
    // a pending or failed tree-proof attempt must retain this exact identity
    // and its launch config until that proof succeeds.
    const spawnedChild = this.childProcess;
    let rootExitObserved = false;
    spawnedChild.on('exit', (code) => {
      // Node promises one exit event, but keep this boundary idempotent under a
      // hostile/double-emitting child shim. Replaying terminal notifications
      // must not duplicate trust changes or manager termination callbacks.
      if (rootExitObserved) return;
      rootExitObserved = true;
      this.cleanupVertexCredentials();
      this.anvilMutationWatcher.stop();
      const disconnectedReceipts = this.desktopContract.markDisconnected();
      if (disconnectedReceipts.length > 0) {
        this.onStreamEvent({
          type: 'anvil_trust_changed',
          data: {
            receipt_ids: disconnectedReceipts,
            status: 'historical',
            reason: 'disconnected',
            requires_fresh_core_validation: true,
          },
          msg_id: '',
        });
      }
      // #746: the engine is gone — disarm the watchdog rather than leave a timer armed
      // against a turn nothing can finish. (activeMsgId is nulled below too, so
      // handleTurnStall would early-return anyway; this just doesn't leak the timer.)
      this.stopStallWatchdog();
      // Root exit is notification only, even when shutdown was unrequested.
      // Descendants can survive and become reparented, so this event cannot
      // restore launch config or discard the only identity available to an
      // exact killChild tree proof. stopChildWithTreeProof owns both actions.
      if (!this.ready) {
        // Surface the engine's real bail reason (its last stderr) alongside the
        // exit code so callers see the cause, not just "exited with code N"
        // (#484). The "exited with code" wording distinguishes an engine that
        // died during init from the separate 30s ready-timeout below.
        const detail = redactSecrets(stripAnsi(this.stderrTail).trim());
        this.readyReject(
          new Error(
            detail
              ? `wcore exited with code ${code} during init: ${detail}`
              : `wcore exited with code ${code} during init`
          )
        );
      }
      if (this.activeMsgId && this._onProcessExit) {
        this._onProcessExit(code, this.activeMsgId);
      }
      this._onProcessTerminated?.(code);
      this.activeMsgId = null;
    });

    // Wait for ready event with timeout. On timeout, include the engine's last
    // stderr too: a hung engine that logged an error but never exited (e.g. it's
    // blocked waiting on something) otherwise surfaces only a bare "timeout"
    // (#484). The "ready timeout (30s)" wording keeps this case distinct from an
    // engine that exited during init (handled above).
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => {
        const detail = redactSecrets(stripAnsi(this.stderrTail).trim());
        reject(new Error(detail ? `wcore ready timeout (30s): ${detail}` : 'wcore ready timeout (30s)'));
      }, 30000);
    });

    try {
      await Promise.race([this.readyPromise, timeout]);
    } catch (err) {
      // If resume failed (session not found), fallback to a new session
      if (this.options.resume) {
        console.error('[WCoreAgent] Resume failed, falling back to new session:', err);
        // Tear down the failed resume attempt before recursing. The ready-timeout
        // path leaves the engine alive, and its exit/stderr listeners read this.*
        // dynamically - once we recurse they'd point at the fresh attempt, so a
        // late exit or stderr chunk from the orphaned child could reject the new
        // session, restore the wrong .wcore.toml, or contaminate the stderr tail.
        // Prove the exact stale tree stopped before detaching its listeners or
        // replacing its identity. A best-effort kill here can leave an orphan
        // sharing this profile with the fallback engine.
        const staleChild = this.childProcess;
        if (staleChild) {
          await this.stopChildWithTreeProof(staleChild);
          staleChild.removeAllListeners();
          staleChild.stdout?.removeAllListeners();
          staleChild.stderr?.removeAllListeners();
        }
        this.cleanupVertexCredentials();
        this.restoreProjectConfig();
        this.childProcess = null;
        this.stderrTail = '';
        if (this.disposed) {
          throw new Error('Wayland Core agent was stopped during resume fallback', { cause: err });
        }
        this.options = { ...this.options, resume: undefined, sessionId: this.options.resume };
        this.ready = false;
        this.readyPromise = new Promise((resolve, reject) => {
          this.readyResolve = resolve;
          this.readyReject = reject;
        });
        return this.startWithProjectConfigLease(workspace);
      }
      throw err;
    }

    // Register legacy host MCP declarations before the first message. Waiters
    // are keyed by server name and installed BEFORE commands are written, so a
    // fast receipt cannot race registration. Every awaited server must reach a
    // terminal event; one unrelated `mcp_ready` can no longer release them all.
    const stdioMcpServers = this.options.stdioMcpServers ?? [];
    const awaitedReceipts = new Map(
      stdioMcpServers
        .filter((server) => server.awaitReady)
        .map((server) => [server.name, this.waitForMcpTerminal(server.name)] as const)
    );
    for (const server of stdioMcpServers) {
      const envRecord: Record<string, string> = {};
      for (const { name: k, value: v } of server.env) {
        envRecord[k] = v;
      }
      this.sendCommand({
        type: 'add_mcp_server',
        name: server.name,
        transport: 'stdio',
        command: server.command,
        args: server.args,
        env: envRecord,
      });
    }

    if (awaitedReceipts.size > 0) {
      await Promise.all(awaitedReceipts.values()).catch((err) => {
        console.warn('[WCoreAgent] MCP setup warning:', err);
      });
    }

    // Inject preset rules as history context (skip on resume - rules were already injected)
    if (this.options.presetRules && !this.options.resume) {
      this.sendCommand({
        type: 'init_history',
        text: `[Assistant System Rules]\n${this.options.presetRules}`,
      });
    }
  }

  private waitForMcpTerminal(name: string): Promise<void> {
    const prior = this.mcpWaiters.get(name);
    if (prior) {
      clearTimeout(prior.timer);
      prior.reject(new Error(`MCP readiness waiter replaced for "${name}"`));
    }

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.mcpWaiters.delete(name);
        reject(new Error(`MCP server "${name}" ready timeout (30s)`));
      }, 30_000);
      this.mcpWaiters.set(name, {
        timer,
        resolve: () => {
          clearTimeout(timer);
          this.mcpWaiters.delete(name);
          resolve();
        },
        reject: (error) => {
          clearTimeout(timer);
          this.mcpWaiters.delete(name);
          reject(error);
        },
      });
    });
  }

  // ─── #746: turn stall watchdog ────────────────────────────────

  private startStallWatchdog(): void {
    this.stallPauseReasons.clear();
    this.stallTimer.start();
  }

  private stopStallWatchdog(): void {
    this.stallPauseReasons.clear();
    this.stallTimer.stop();
  }

  /** Pause on the 0→1 edge only (overlapping tool calls must not double-pause). */
  private pauseStallWatchdog(reason: string): void {
    const wasIdle = this.stallPauseReasons.size === 0;
    this.stallPauseReasons.add(reason);
    if (wasIdle) this.stallTimer.pause();
  }

  /** Resume on the 1→0 edge only. Unknown reasons are ignored (no spurious resume). */
  private resumeStallWatchdog(reason: string): void {
    if (!this.stallPauseReasons.delete(reason)) return;
    if (this.stallPauseReasons.size === 0) this.stallTimer.resume();
  }

  /**
   * The turn made no progress for the whole idle window. Halt it honestly instead
   * of spinning forever (#746): tell the engine to stop (so it stops burning), then
   * emit a terminal `error` frame — the renderer treats an error frame as the end of
   * the turn and clears every running contributor, so the chat becomes usable again
   * rather than stuck on a "working" spinner with no way to send.
   */
  private handleTurnStall(): void {
    const msgId = this.activeMsgId;
    if (!msgId) return; // no turn in flight — nothing to halt

    const minutes = Math.round(resolveTurnStallTimeoutMs() / 60_000);
    console.error(`[WCoreAgent] turn ${msgId} stalled: no progress for ${minutes}m — halting (#746)`);

    this.stopStallWatchdog();
    this.activeMsgId = null;
    // Best-effort: stop the engine-side turn. Never let a failure here swallow the
    // user-facing notification below.
    try {
      this.stop();
    } catch {
      /* best effort */
    }

    this.onStreamEvent({
      type: 'error',
      data:
        `The agent stopped making progress (no activity for ${minutes} minutes), so the turn was halted. ` +
        `Nothing was lost — send a message to pick the task back up.`,
      msg_id: msgId,
    });
  }

  private handleEvent(event: WCoreEvent): void {
    // #746: any turn-scoped frame is progress — push the stall deadline out. Keyed on
    // msg_id so engine-level frames that are NOT turn progress (pong / ready /
    // mcp_ready / config_changed carry no msg_id) can't keep a stalled turn alive.
    // reset() is a no-op unless the timer is running, so a paused tool/approval
    // window stays paused.
    if ('msg_id' in event) this.stallTimer.reset();

    switch (event.type) {
      case 'ready':
        this.ready = true;
        this.sessionId = event.session_id;
        this.capabilities = event.capabilities;
        this.readyResolve();
        break;

      case 'stream_start':
        this.activeMsgId = event.msg_id;
        this.onStreamEvent({ type: 'start', data: '', msg_id: event.msg_id });
        break;

      case 'text_delta':
        this.onStreamEvent({ type: 'content', data: event.text, msg_id: event.msg_id });
        break;

      case 'thinking':
        this.onStreamEvent({ type: 'thought', data: event.text, msg_id: event.msg_id, subject: event.subject });
        break;

      case 'tool_request':
        // #520: remember the request-time command so the later running/result
        // frames (which the wire sends without it) can re-surface it.
        this.toolDescriptionByCallId.set(event.call_id, event.tool.description);
        // #746: the agent is now waiting — first on the human (this frame renders an
        // approve/deny card) and then on the tool itself. Neither is agent inactivity,
        // so pause the stall watchdog for this call's whole request→result window.
        this.pauseStallWatchdog(`tool:${event.call_id}`);
        this.onStreamEvent({
          type: 'tool_group',
          data: [
            {
              callId: event.call_id,
              name: event.tool.name,
              description: event.tool.description,
              status: 'Confirming',
              renderOutputAsMarkdown: false,
              confirmationDetails: this.mapConfirmationDetails(event),
            },
          ],
          msg_id: event.msg_id,
        });
        break;

      case 'tool_running':
        this.onStreamEvent({
          type: 'tool_group',
          data: [
            {
              callId: event.call_id,
              name: event.tool_name,
              // #520: carry the command forward (empty string would clobber it).
              description: this.toolDescriptionByCallId.get(event.call_id) ?? '',
              status: 'Executing',
              renderOutputAsMarkdown: false,
            },
          ],
          msg_id: event.msg_id,
        });
        break;

      case 'tool_result':
        this.onStreamEvent({
          type: 'tool_group',
          data: [
            {
              callId: event.call_id,
              name: event.tool_name,
              // #520: keep the command on the finished card too (the result frame
              // omits it, and the merge would otherwise blank it out).
              description: this.toolDescriptionByCallId.get(event.call_id) ?? '',
              status: event.status === 'success' ? 'Success' : 'Error',
              resultDisplay:
                event.output_type === 'diff'
                  ? { fileDiff: event.output, fileName: (event.metadata as Record<string, string>)?.file_path ?? '' }
                  : event.output,
              renderOutputAsMarkdown: event.output_type === 'text',
            },
          ],
          msg_id: event.msg_id,
        });
        // #520: the tool is terminal - drop its cached command.
        this.toolDescriptionByCallId.delete(event.call_id);
        // #746: tool window closed — the agent owes us progress again.
        this.resumeStallWatchdog(`tool:${event.call_id}`);
        break;

      case 'tool_cancelled':
        this.onStreamEvent({
          type: 'tool_group',
          data: [
            {
              callId: event.call_id,
              name: '',
              description: event.reason,
              status: 'Canceled',
              renderOutputAsMarkdown: false,
            },
          ],
          msg_id: event.msg_id,
        });
        // #520: terminal - drop its cached command.
        this.toolDescriptionByCallId.delete(event.call_id);
        // #746: tool window closed — the agent owes us progress again.
        this.resumeStallWatchdog(`tool:${event.call_id}`);
        break;

      case 'stream_end': {
        const finishPayload: Record<string, unknown> = {};
        if (event.usage) Object.assign(finishPayload, event.usage);
        if (event.finish_reason) finishPayload.finish_reason = event.finish_reason;
        const payload = Object.keys(finishPayload).length > 0 ? finishPayload : '';
        this.onStreamEvent({ type: 'finish', data: payload, msg_id: event.msg_id });
        this.activeMsgId = null;
        this.stopStallWatchdog(); // #746: turn is over
        break;
      }

      case 'error': {
        const errMsgId = event.msg_id ?? this.activeMsgId ?? '';
        this.onStreamEvent({
          type: 'error',
          data: event.error.message,
          msg_id: errMsgId,
        });
        // #746/#774: an error frame ENDS the turn (the renderer terminalizes it and
        // clears every running contributor). The turn state was previously left
        // dangling here — activeMsgId stayed set and, once the watchdog existed, a
        // dead turn would keep a timer armed and could later "stall-halt" a turn that
        // had already failed. Terminalize the agent side too.
        this.activeMsgId = null;
        this.stopStallWatchdog();
        break;
      }

      case 'info':
        this.onStreamEvent({
          type: 'info',
          data: event.message,
          msg_id: event.msg_id,
        });
        break;

      case 'config_changed':
        this.capabilities = event.capabilities;
        this.onStreamEvent({
          type: 'config_changed',
          data: event.capabilities,
          msg_id: '',
        });
        break;

      // Contract-v1 authority/evidence is reduced before this switch. Forward
      // the accepted snapshot/evidence as typed stream data for Cockpit
      // consumers; no UI may infer or manufacture these values.
      case 'execution_policy':
      case 'workflow_started':
      case 'workflow_node_event':
      case 'workflow_finished':
      case 'anvil_receipt_invalidated':
        this.onStreamEvent({ type: event.type, data: event, msg_id: '' });
        break;

      case 'anvil_receipt':
        this.onStreamEvent({
          type: event.type,
          data: { ...event, desktop_trust_status: this.desktopContract.anvilStatus(event.receipt_id) },
          msg_id: '',
        });
        break;

      case 'mcp_ready':
        this.mcpWaiters.get(event.name)?.resolve();
        this.onStreamEvent({
          type: 'mcp_ready',
          data: { name: event.name, tools: event.tools },
          msg_id: '',
        });
        break;

      // ── #713: MCP server connection failure ────────────────────────
      // Mirrors plugin_registration_failed: the session still runs, but
      // the user must see that a configured MCP server failed to connect
      // (its tools silently don't exist otherwise) and the engine's
      // remediation text. Previously this fell through to the
      // unknown-event arm and was dropped, so MCP connection failures
      // were invisible outside the log file.
      case 'mcp_failed':
        console.warn('[WCoreAgent] mcp_failed', { name: event.name, reason: event.reason });
        this.mcpWaiters.get(event.name)?.reject(new Error(`MCP server "${event.name}" failed: ${event.reason}`));
        this.onStreamEvent({
          type: 'mcp_failed',
          data: { name: event.name, reason: event.reason },
          msg_id: '',
        });
        this.onStreamEvent({
          type: 'info',
          data: `MCP server "${event.name}" failed to connect: ${event.reason}`,
          msg_id: this.activeMsgId ?? '',
        });
        break;

      case 'pong':
        this._onPong?.();
        break;

      // ── W7 F4: streaming tool-result chunk ─────────────────────────
      // Forward as an `info`-channel update so the renderer can append
      // partial output to the in-flight tool card. Hosts that don't
      // surface tool_chunk yet still see the final `tool_result` carrying
      // the full buffered output.
      case 'tool_chunk':
        this.onStreamEvent({
          type: 'tool_chunk',
          data: { callId: event.call_id, toolName: event.tool_name, chunk: event.chunk },
          msg_id: event.msg_id,
        });
        break;

      // ── Safety-critical: browser policy denied ─────────────────────
      // Surface to the user as an error so the policy decision is visible.
      // Gated by `capabilities.browser_suite`; only the wayland-browser
      // plugin emits it.
      case 'browser_policy_denied':
        console.warn('[WCoreAgent] browser_policy_denied', { url: event.url, reason: event.reason });
        this.onStreamEvent({
          type: 'error',
          data: `Browser policy denied: ${event.reason} (${event.url})`,
          msg_id: event.msg_id,
        });
        break;

      // ── W8c.1 browser op event ────────────────────────────────────
      // Forward typed so the renderer can render a compact browser-op
      // trail; safe to drop if the renderer hasn't wired it.
      case 'browser_event':
        this.onStreamEvent({
          type: 'browser_event',
          data: { callId: event.call_id, op: event.op, url: event.url, summary: event.summary },
          msg_id: event.msg_id,
        });
        break;

      // ── Safety-critical: CUA policy denied ─────────────────────────
      // Mirrors browser_policy_denied for the computer-use surface.
      case 'cua_policy_denied':
        console.warn('[WCoreAgent] cua_policy_denied', {
          op: event.op,
          app: event.app,
          reason: event.reason,
        });
        this.onStreamEvent({
          type: 'error',
          data: `Computer-use policy denied: ${event.reason} (op=${event.op}${event.app ? `, app=${event.app}` : ''})`,
          msg_id: event.msg_id,
        });
        break;

      // ── W8c.2 CUA op event ────────────────────────────────────────
      case 'cua_event':
        this.onStreamEvent({
          type: 'cua_event',
          data: {
            callId: event.call_id,
            op: event.op,
            coords: event.coords,
            summary: event.summary,
          },
          msg_id: event.msg_id,
        });
        break;

      // ── Wave RB: tool panic recovery ──────────────────────────────
      // The engine has already converted the panic to a synthetic
      // ToolResult; this event lets us surface the panic as a distinct
      // diagnostic (vs. a normal `is_error: true` ToolResult).
      case 'tool_panicked':
        console.error('[WCoreAgent] tool_panicked', {
          tool: event.tool_name,
          callId: event.call_id,
          message: event.panic_message,
        });
        this.onStreamEvent({
          type: 'error',
          data: `Tool ${event.tool_name} panicked: ${event.panic_message}`,
          msg_id: event.msg_id,
        });
        break;

      // ── Wave RB: plugin registration failed ───────────────────────
      // Plugin still loaded - partial registration is allowed - but the
      // user should see why an expected tool/hook is missing.
      case 'plugin_registration_failed':
        console.error('[WCoreAgent] plugin_registration_failed', {
          plugin: event.plugin_name,
          surface: event.surface,
          kind: event.error_kind,
          message: event.message,
        });
        this.onStreamEvent({
          type: 'info',
          data: `Plugin "${event.plugin_name}" failed to register ${event.surface}: ${event.message}`,
          msg_id: '',
        });
        break;

      // ── W7 F8: provider circuit-breaker transition ─────────────────
      // Always emitted (no capability flag) - surface `open` state as a
      // user-visible info so users notice failover; log-only for
      // half_open / closed transitions.
      case 'provider_circuit_event':
        console.warn('[WCoreAgent] provider_circuit_event', {
          primary: event.primary,
          fallback: event.fallback,
          state: event.state,
          error: event.error,
        });
        if (event.state === 'open') {
          this.onStreamEvent({
            type: 'info',
            data: `Provider ${event.primary} circuit opened${
              event.fallback ? ` - falling back to ${event.fallback}` : ''
            }${event.error ? `: ${event.error}` : ''}`,
            msg_id: this.activeMsgId ?? '',
          });
          // #252: also surface the open transition as an activity-tree node so
          // failover (which fallback provider took over) is visible in-line.
          this.onStreamEvent({
            type: 'provider_circuit_event',
            data: {
              primary: event.primary,
              fallback: event.fallback,
              state: event.state,
              error: event.error,
            },
            msg_id: this.activeMsgId ?? '',
          });
        }
        break;

      // ── W8a A.7: ExecutionBudget cap exceeded ─────────────────────
      // Always emitted (no capability flag); surface as user-visible
      // info so the user knows why the session stopped.
      case 'budget_exceeded':
        console.warn('[WCoreAgent] budget_exceeded', {
          reason: event.reason,
          observed: event.observed,
          limit: event.limit,
        });
        this.onStreamEvent({
          type: 'info',
          data: `Budget exceeded: ${event.reason} (observed ${event.observed}, limit ${event.limit})`,
          msg_id: this.activeMsgId ?? '',
        });
        break;

      // ── W7 S4: HITL approval flow ─────────────────────────────────
      // Forward typed so a future renderer can render an approval modal.
      // For now log + surface as info.
      case 'approval_required':
        console.warn('[WCoreAgent] approval_required', {
          callId: event.call_id,
          reason: event.reason,
        });
        // #746: pause ONLY for a genuine HITL escalation — i.e. one that carries a
        // resume_token. That path (WCoreManager's #264 wedge: the engine's own
        // --auto-approve self-resolve failed) does NOT go through
        // tool_request/tool_result and carries no msg_id, so without an explicit pause
        // the watchdog would keep ticking and stall-kill the turn while the human is
        // still deciding.
        //
        // A token-LESS approval_required is a different animal: in interactive mode the
        // engine emits it as a parallel *signal* on every ordinary exec/mcp approval
        // (see WCoreManager #390 — "a normal exec/mcp approval legitimately carries no
        // resume token"), and that wait is already paused by this call's
        // `tool:${call_id}` reason and released by its tool_result. Pausing on it here
        // would add an `approval:undefined` reason that NOTHING ever resumes — the user's
        // answer goes back via approveTool()/tool_approve, not approval_resume — wedging
        // the watchdog paused for the rest of the turn and silently restoring the very
        // #746 hang this fix exists to kill.
        if (event.resume_token) this.pauseStallWatchdog(`approval:${event.resume_token}`);
        this.onStreamEvent({
          type: 'approval_required',
          data: {
            callId: event.call_id,
            resumeToken: event.resume_token,
            correlationId: event.correlation_id,
            reason: event.reason,
            context: event.context,
          },
          msg_id: this.activeMsgId ?? '',
        });
        break;

      case 'suspend':
        // #746: engine suspended awaiting an out-of-band resume — not agent inactivity.
        // Same token guard as approval_required: a reason we can never resume would wedge
        // the watchdog paused for the rest of the turn.
        if (event.resume_token) this.pauseStallWatchdog(`approval:${event.resume_token}`);
        this.onStreamEvent({
          type: 'suspend',
          data: { reason: event.reason, resumeToken: event.resume_token },
          msg_id: this.activeMsgId ?? '',
        });
        break;

      case 'approval_resume':
        // #746: the human answered (or the engine self-resolved) — the agent owes us
        // progress again. Keyed on resume_token, matching the pause above.
        this.resumeStallWatchdog(`approval:${event.resume_token}`);
        this.onStreamEvent({
          type: 'approval_resume',
          data: { resumeToken: event.resume_token, approved: event.approved },
          msg_id: this.activeMsgId ?? '',
        });
        break;

      // ── W1 F9: structured turn trace ──────────────────────────────
      // Opaque payload; forward typed so a future trace UI can opt in.
      case 'trace_event':
        this.onStreamEvent({
          type: 'trace_event',
          data: event.trace,
          msg_id: event.msg_id,
        });
        break;

      // ── W6 F7: end-of-session cost aggregate ──────────────────────
      // #252: stamp the active msg_id so the renderer attaches the per-turn
      // cost rows to the in-flight turn's activity card. WCoreManager
      // force-forwards this past the empty-msg_id guard.
      case 'session_cost':
        this.onStreamEvent({
          type: 'session_cost',
          data: {
            sessionId: event.session_id,
            totalCostUsd: event.total_cost_usd,
            perTurn: event.per_turn,
          },
          msg_id: this.activeMsgId ?? '',
        });
        break;

      // ── W7 F2: sub-agent event (inner payload is opaque) ──────────
      case 'sub_agent_event':
        this.onStreamEvent({
          type: 'sub_agent_event',
          data: {
            parentCallId: event.parent_call_id,
            agentName: event.agent_name,
            inner: event.inner,
          },
          msg_id: '',
        });
        break;

      // ── W8a H.1: plugin-emitted event ─────────────────────────────
      case 'plugin_event':
        this.onStreamEvent({
          type: 'plugin_event',
          data: {
            pluginName: event.plugin_name,
            eventType: event.event_type,
            payload: event.payload,
          },
          msg_id: '',
        });
        break;

      // ── W10B F12: GEPA evolution event ────────────────────────────
      case 'evolution_event':
        this.onStreamEvent({
          type: 'evolution_event',
          data: {
            runId: event.run_id,
            generation: event.generation,
            parentId: event.parent_id,
            childId: event.child_id,
            mutationKind: event.mutation_kind,
            score: event.score,
            retained: event.retained,
          },
          msg_id: '',
        });
        break;

      // ── #537 host-delegated send_message ──────────────────────────
      // The engine (spawned with WAYLAND_SEND_MESSAGE_HOST_DELEGATE=1) routes an
      // agent `send_message` here instead of failing on its empty channel table.
      // We fulfil it through the desktop's own outbound channel plugins and reply
      // with the result, correlated by call_id.
      case 'host_send_message_request':
        void this.handleHostSendMessage(event);
        break;

      // ── Forward-compat default arm ────────────────────────────────
      // The W0 Host Decoder Contract (docs/json-stream-protocol.md
      // §"Host Decoder Contract") says hosts MUST drop unknown event
      // types silently. We deliberately log at warn level instead: any
      // line reaching this arm is a variant the engine emits but this
      // host hasn't enumerated, which is the exact failure mode this
      // file exists to prevent (safety-critical events like
      // `browser_policy_denied` were being silently dropped for an
      // entire engine release). The warn is observability, not
      // user-facing - ops sees the gap before users do. The cast keeps
      // TypeScript's exhaustiveness check honest (every variant in
      // WCoreEvent is handled above; this branch only fires at runtime
      // when the engine ships a new variant before this host learns it).
      default: {
        const unknownEvent = event as { type?: unknown };
        const typeStr = typeof unknownEvent.type === 'string' ? unknownEvent.type : '<non-string>';
        console.warn(`[WCoreAgent] unknown event type "${typeStr}" - dropping`, event);
        break;
      }
    }
  }

  /**
   * #537: fulfil a host-delegated `send_message` via the desktop's outbound
   * channel plugins and reply with `host_send_message_result`. Always replies
   * (even on failure) so the engine's tool call never hangs; the handler itself
   * never throws.
   */
  private async handleHostSendMessage(event: WCoreEvent & { type: 'host_send_message_request' }): Promise<void> {
    const result = await handleHostSendMessageRequest(event, defaultHostSendDeps());
    this.sendCommand({
      type: 'host_send_message_result',
      call_id: event.call_id,
      ok: result.ok,
      ...(result.message_id ? { message_id: result.message_id } : {}),
      ...(result.error ? { error: result.error } : {}),
    });
  }

  /**
   * Map wcore tool_request to wayland confirmation details format.
   */
  private mapConfirmationDetails(event: WCoreEvent & { type: 'tool_request' }) {
    const { tool } = event;

    // #504: AskUserQuestion arrives as an `info`-category tool (the engine has
    // no `question` ToolCategory), with the question + choices inside args. It
    // used to fall through to the `info` branch and render an empty approval
    // box. Detect it by name and lift the choices out so the renderer can show
    // them as selectable answers. The name guard mirrors the engine's own
    // answer-synth guard (tool_name == "AskUserQuestion").
    const question = parseQuestionTool(tool);
    if (question) return question;

    switch (tool.category) {
      case 'edit':
        return {
          type: 'edit' as const,
          title: tool.description,
          fileName: (tool.args as Record<string, string>).file_path ?? '',
          fileDiff: '',
        };
      case 'exec':
        return {
          type: 'exec' as const,
          title: tool.description,
          rootCommand: (tool.args as Record<string, string>).command?.split(' ')[0] ?? tool.name,
          command: (tool.args as Record<string, string>).command ?? JSON.stringify(tool.args),
        };
      case 'mcp':
        return {
          type: 'mcp' as const,
          title: tool.description,
          toolName: tool.name,
          toolDisplayName: tool.name,
          serverName: '',
        };
      case 'info':
      default:
        return {
          type: 'info' as const,
          title: tool.description,
          prompt: JSON.stringify(tool.args, null, 2),
        };
    }
  }

  sendCommand(cmd: WCoreCommand): void {
    if (!this.childProcess?.stdin?.writable) return;
    const validated = this.desktopContract.validateOutboundCommand(cmd);
    this.childProcess.stdin.write(JSON.stringify(validated) + '\n');
  }

  async send(content: string, msgId: string, files?: string[]): Promise<void> {
    await this.readyPromise;
    // #746: arm the stall watchdog for this turn. Armed at SEND (not at stream_start)
    // so a turn that never even starts streaming — the engine going silent on the
    // request itself — is still bounded.
    this.activeMsgId = msgId;
    this.startStallWatchdog();
    this.sendCommand({
      type: 'message',
      msg_id: msgId,
      content,
      files,
    });
  }

  injectConversationHistory(text: string): Promise<void> {
    this.sendCommand({ type: 'init_history', text });
    return Promise.resolve();
  }

  stop(): void {
    // #746: the turn is being cancelled — disarm the watchdog so it can't later fire
    // against a turn that is already over. Idempotent (handleTurnStall stops it first).
    this.stopStallWatchdog();
    this.sendCommand({ type: 'stop' });
  }

  approveTool(callId: string, scope: 'once' | 'always' = 'once', answer?: string): void {
    // `answer` carries an AskUserQuestion choice back through the approval
    // channel (see WCoreCommand.tool_approve). Only attach when present so a
    // plain approval keeps its exact prior wire shape.
    this.sendCommand({ type: 'tool_approve', call_id: callId, scope, ...(answer ? { answer } : {}) });
  }

  denyTool(callId: string, reason = ''): void {
    this.sendCommand({ type: 'tool_deny', call_id: callId, reason });
  }

  // W7 S4 HITL: resume a turn the engine suspended with `approval_required`.
  // The engine normally self-resolves this under --auto-approve, but that path
  // can silently fail on some provider routes (e.g. Anthropic-format `toolu_`
  // tool ids via Flux), leaving the turn wedged. Sending an explicit resume is
  // a safe, idempotent unblock (a stale/duplicate token is ignored engine-side).
  resumeApproval(resumeToken: string, approved: boolean): void {
    this.sendCommand({ type: 'approval_resume', resume_token: resumeToken, approved });
  }

  setConfig(config: { model?: string; thinking?: string; thinking_budget?: number; effort?: string }): void {
    this.sendCommand({ type: 'set_config', ...config });
  }

  setMode(mode: 'default' | 'auto_edit' | 'yolo'): void {
    this.sendCommand({ type: 'set_mode', mode });
  }

  ping(): void {
    this.sendCommand({ type: 'ping' });
  }

  get isAlive(): boolean {
    return this.childProcess !== null;
  }

  private stopChildWithTreeProof(child: ChildProcess): Promise<void> {
    const inFlight = this.treeShutdownAttempt;
    if (inFlight?.child === child) return inFlight.promise;
    if (inFlight) {
      return Promise.reject(new Error('A different Wayland Core engine tree still owns shutdown authority'));
    }

    const attempt = { child, promise: Promise.resolve() };
    attempt.promise = Promise.resolve()
      .then(() => killChild(child, false))
      .then(() => {
        if (this.failedShutdownChild === child) this.failedShutdownChild = null;
        this.shutdownFailure = null;
        if (this.childProcess === child) this.childProcess = null;
      })
      .catch((error) => {
        this.failedShutdownChild = child;
        this.shutdownFailure = error;
        throw error;
      })
      .finally(() => {
        if (this.treeShutdownAttempt === attempt) this.treeShutdownAttempt = null;
      });
    this.treeShutdownAttempt = attempt;
    return attempt.promise;
  }

  async kill(): Promise<void> {
    this.disposed = true;
    // #746: the agent is going away — a still-armed watchdog would otherwise fire on a
    // dead agent and emit a bogus stall error for a turn nobody is running.
    this.stopStallWatchdog();
    this.activeMsgId = null;
    this.anvilMutationWatcher.stop();
    const disconnectedReceipts = this.desktopContract.markDisconnected();
    if (disconnectedReceipts.length > 0) {
      this.onStreamEvent({
        type: 'anvil_trust_changed',
        data: {
          receipt_ids: disconnectedReceipts,
          status: 'historical',
          reason: 'disconnected',
          requires_fresh_core_validation: true,
        },
        msg_id: '',
      });
    }
    if (this.treeShutdownAttempt) {
      await this.treeShutdownAttempt.promise;
    } else if (this.failedShutdownChild) {
      // Once the failed root emits exit, its descendants are reparented and a
      // later scan cannot reconstruct the original tree. Retain the failure
      // rather than laundering the absent root into proof.
      if (this.childProcess !== this.failedShutdownChild) throw this.shutdownFailure;
      await this.stopChildWithTreeProof(this.failedShutdownChild);
    } else if (!this.childProcess && this.shutdownFailure) {
      throw this.shutdownFailure;
    } else if (this.childProcess) {
      // wayland-core spawns its own child tree (MCP servers, tool subprocesses).
      // A bare SIGTERM is a no-op on Windows and never reaches the tree, leaving
      // orphaned processes after quit (#139). killChild does a taskkill /T /F on
      // win32 and a SIGTERM->SIGKILL descendant sweep on POSIX.
      await this.stopChildWithTreeProof(this.childProcess);
    }
    this.cleanupVertexCredentials();
    // Keep the launch-specific config in place until the child is gone; an
    // engine still booting must never fall through to a sibling/user config.
    this.restoreProjectConfig();
  }

  /**
   * Write a temporary .wcore.toml in the workspace for provider compat overrides.
   * Backs up existing file content so it can be restored on exit.
   *
   * Security (RT-B6-07): the app owns every `[providers.*]` section because those
   * carry `base_url`/endpoint overrides that decide where API keys and prompts are
   * sent. A pre-placed or sibling-written `.wcore.toml` must never be allowed to
   * inject or keep a provider override the app did not author - otherwise an
   * attacker with workspace write access (temp-dir race or a custom workspace)
   * could redirect traffic to their own host. We therefore parse the existing
   * file with a real TOML library, drop ALL existing `providers.*` overrides
   * (in every equivalent TOML syntax), and regenerate them from the app's own
   * `content`, letting the app's intended values win. Non-provider, user-authored
   * settings are preserved. If the existing file is unparseable, we fail closed
   * and write only the app's known-good config.
   */
  private writeProjectConfig(content: string, workspace = this.options.workspace): void {
    const configPath = join(workspace, WCORE_PROJECT_CONFIG);
    recoverProjectConfigTransaction(configPath);
    const existingBytes = readProjectConfigNoFollow(configPath);
    const existing = existingBytes?.toString('utf-8') ?? null;

    let written: string;
    if (existing) {
      const { written: sanitized, strippedProviders, parsed } = sanitizeProjectConfig(existing, content);
      written = sanitized;
      if (!parsed) {
        console.warn(
          `[WCoreAgent] Existing ${WCORE_PROJECT_CONFIG} is not valid TOML; discarding it and writing only app-owned provider config.`
        );
      } else if (strippedProviders) {
        console.warn(
          `[WCoreAgent] Stripped untrusted [providers.*] override(s) from existing ${WCORE_PROJECT_CONFIG}; app-owned provider config wins.`
        );
      }
    } else {
      written = content;
    }

    // Journal original bytes durably before atomically publishing the temporary
    // launch config. A later launch heals a process-death interruption before it
    // reads or writes the project file.
    this.projectConfigTransaction = ProjectConfigTransaction.begin(configPath, written);
  }

  /**
   * Restore or remove the .wcore.toml written by writeProjectConfig.
   *
   * Multiple agents in the same workspace share one config path, so restore
   * is a read-modify-write race: the last writer wins and earlier agents must
   * not clobber it. We only act when the on-disk content still matches what
   * this agent wrote - otherwise a sibling agent owns the file and is
   * responsible for its own restore.
   */
  private restoreProjectConfig(): void {
    const transaction = this.projectConfigTransaction;
    this.projectConfigTransaction = null;
    if (!transaction) return;

    try {
      transaction.restore();
    } catch (error) {
      // Keep the durable journal for the next launch to heal. Never delete the
      // only recovery evidence after a failed restore.
      console.error('[WCoreAgent] Failed to restore project config transaction', error);
    }
  }

  private cleanupVertexCredentials(): void {
    const root = this.vertexCredentialRoot;
    this.vertexCredentialRoot = null;
    if (!root) return;
    try {
      rmSync(root, { recursive: true, force: true });
    } catch (error) {
      console.error('[WCoreAgent] Failed to remove temporary Vertex credentials', error);
    }
  }
}
