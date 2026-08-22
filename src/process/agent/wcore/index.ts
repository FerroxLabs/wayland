/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve as resolvePath } from 'node:path';
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
import { describeSpawnError, describeExitReason } from './execFailureReason';
import { describeContractRejection, profileStripHedge } from './startFailureReason';
import {
  buildEngineSpawnEnv,
  buildOutputDirective,
  buildSpawnConfig,
  resolveOutputDir,
  appendDesktopMcpProfile,
  WCORE_DESKTOP_HOST_ASSISTANT,
  WCORE_DESKTOP_MCP_PROFILE,
  engineInheritsShellKey,
  isOpenAIFamilyModelId,
  MissingApiKeyError,
  planVaultPassphraseDelivery,
  type VaultPassphraseDelivery,
} from './envBuilder';
import { activeRunOutputDir } from '@process/services/artifacts/runOutputDir';
import { ProfileIsolationError, nativeConfigDir, resolveActiveConfigDir } from './profilePaths';
import { readCodexAuthFile } from '@process/onboarding/codexAuthFile';
import { getToolKeyStore } from './toolKeyStore';
import { hydrateModelForSpawn, resolveModelSecretsForSpawn } from '@process/providers/ipc/modelRegistryIpc';
import { vertexSpawnCredentialsForModel } from '@process/providers/vertexSpawnCredentials';
import { DEFAULT_ACCOUNT_ID } from '@/common/config/account';
import { killChild } from '@process/agent/acp/utils';
import { trackAgentChild } from '@process/agent/agentChildRegistry';
import type {
  WCoreEvent,
  WCoreCommand,
  WCoreCapabilities,
  ApprovalScope,
  RenderMime,
  PathGrantAccess,
  WCoreWorkspacePolicy,
} from './protocol';
import { registerLivePathGrantSession } from './pathGrantSessions';
import { parseQuestionTool } from './questionTool';
import { stripAnsi, wcoreStderrLevel } from './stderrLog';
import { redactSecrets } from '@process/utils/secretRedaction';
import { handleHostSendMessageRequest, defaultHostSendDeps } from './hostSendMessage';
import { DesktopCoreContractError, DesktopCoreV1Consumer } from './desktopContractV1';
import { AnvilPersistentMutationWatcher } from './anvilMutationWatcher';
import { withGlobalWCoreProfileLease, withWCoreProjectConfigLease } from './projectConfigLease';
// Note: `DesktopProfileSpliceError` is deliberately NOT imported here - it is
// thrown by `spliceDesktopMcpProfile` inside `writeGlobalMcpProfile` and
// allowed to propagate unmodified through `start()`'s existing generic
// reject path; this file never catches or narrows on it.
import { spliceDesktopMcpProfile } from './desktopProfileSplice';
import {
  ProjectConfigTransaction,
  readProjectConfigNoFollow,
  recoverProjectConfigTransaction,
} from './projectConfigTransaction';

// The project-config filename the engine actually loads from its cwd (verified
// against bundled wayland-core 0.12.25: `--project-dir` help + strings). The
// engine reads `.wayland-core.toml` (file form) — NOT `.wcore.toml` — so the
// `--profile` lookup and `[providers.*].compat` overrides the desktop writes
// here are only seen when this matches. A mismatch makes `--profile
// __wayland_desktop_session` fail init with "Profile ... not found in config".
const WCORE_PROJECT_CONFIG = '.wayland-core.toml';

// Keep the last ~2KB of engine stderr so a spawn/init failure can surface the
// engine's real bail reason (e.g. a keyless model, bad config) instead of an
// opaque "exited with code N" (#484). Capped to bound memory on a chatty engine.
const WCORE_STDERR_TAIL_MAX = 2048;

/**
 * #1098: the closed `render_artifact` mime vocabulary, mirrored from
 * `wcore-protocol::events::RenderMime`. Held as a runtime set because the wire
 * is untyped JSON — the compile-time union proves nothing about what actually
 * arrives, and Core's rule is that an unknown kind is REFUSED, never coerced.
 */
/**
 * Host-side caps for a `render_artifact`, mirroring the engine's own 1 MiB /
 * 256-byte limits. Restated here because a host must not rely on the far side
 * of a wire for its own safety, and because the failure mode is unrecoverable:
 * the IPC bridge has no reject and no timeout, so an oversized payload hangs
 * the renderer for the life of the process.
 */
const MAX_RENDER_ARTIFACT_CONTENT_CHARS = 1024 * 1024;
const MAX_RENDER_ARTIFACT_TITLE_CHARS = 256;

const RENDERABLE_ARTIFACT_MIMES: ReadonlySet<RenderMime> = new Set<RenderMime>([
  'text/plain',
  'text/markdown',
  'text/html',
]);

type StreamEventHandler = (event: { type: string; data: unknown; msg_id: string; subject?: string }) => void;

/**
 * How long to wait for the `workspace_policy` receipt that confirms a path
 * grant. Core emits it synchronously on the same command loop iteration, so
 * this is a liveness bound on a dead/wedged transport, not a latency budget.
 */
const WORKSPACE_POLICY_RECEIPT_TIMEOUT_MS = 5_000;

/**
 * Sanitize an existing `.wayland-core.toml` body and merge in the app's own provider
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
  /**
   * The conversation this engine serves. Used only to look up whether a
   * scheduled run is open on THIS conversation (P2-11); absent for any caller
   * that has no conversation, which simply means no run is ever found.
   */
  conversationId?: string;
  onStreamEvent: StreamEventHandler;
  onProcessExit?: (code: number | null, activeMsgId: string, signal?: NodeJS.Signals | null) => void;
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

/**
 * Core's approval reaper denies an UNANSWERED gate with this EXACT literal
 * (`crates/wcore-protocol/src/lib.rs:266`). The TTL is 300s and the reaper
 * sweeps on a 30s interval (`DEFAULT_APPROVAL_TTL` / `DEFAULT_REAP_INTERVAL`,
 * `:27` and `:32`), so the wait is 300-330s. Measured live on 2026-08-22
 * against engine v0.13.4: 323s from card to denial.
 *
 * The reason travels verbatim into `ToolCancelled.reason`
 * (`wcore-agent/src/orchestration/mod.rs:1191`) and Desktop rendered it as the
 * tool_group node's `description` with an EMPTY `name`, so the transcript read
 * `Tool: approval timed out (no host response)` - untitled engine jargon after
 * five and a half minutes of silence. Screenshotted live before this change.
 */
const CORE_APPROVAL_REAPED_REASON = 'approval timed out (no host response)';

/**
 * The collapsed tool row clamps `name: description` to this many characters and
 * appends an ellipsis. MEASURED in the running app, twice, on two different
 * drafts: both came back cut at exactly 75. Exported so the mapping's own test
 * can hold the line rather than trusting a comment.
 */
export const CANCELLATION_LABEL_MAX_CHARS = 75;

/**
 * Give the ONE reason a person cannot be expected to parse a title and a
 * sentence. Every other reason passes through unchanged - a denial, a
 * ForgeFlow decline and a Crucible cancel all carry information the user
 * needs, and rewriting them would bury it.
 *
 * ⚠️ DELIBERATELY UNTRANSLATED ENGLISH, IN ALL 12 LOCALES. `MessageToolGroup`
 * renders the node `name` RAW (`MessageToolGroup.tsx:610`), so a translation
 * key placed here would print the key itself to the user. That is strictly
 * worse than English. This is still a strict improvement over today, where the
 * raw engine reason is equally untranslated AND has no title. Translating it
 * needs a renderer change and is a named follow-up.
 */
export function describeToolCancellation(reason: string): { name: string; description: string } {
  if (reason === CORE_APPROVAL_REAPED_REASON) {
    return {
      name: 'Approval timed out',
      // LENGTH IS LOAD-BEARING, and the limit is characters, not pixels. The
      // collapsed tool row renders `name: description` and CLAMPS THE STRING
      // ITSELF at exactly 75 characters plus an ellipsis - not CSS overflow,
      // the DOM textContent is already cut. Measured twice in the running app:
      // two different drafts both came back cut at exactly 75 characters, with
      // the span 540px wide inside a 726px box, so pixel width is not the gate.
      // Keep `name` + ': ' + `description` at or under 75 or the user reads
      // half a sentence. See CANCELLATION_LABEL_MAX_CHARS.
      description: 'Waited 5 minutes. Nothing was read or changed.',
    };
  }
  return { name: '', description: reason };
}

export class WCoreAgent {
  private childProcess: ChildProcess | null = null;
  /** Root stdio transport liveness is separate from retained tree-proof
   * identity. A root may exit while `childProcess` must remain captured so its
   * complete tree can be proved stopped; that retained identity is never a
   * writable/live transport. */
  private transportAlive = false;
  private transportUnavailableReason: 'root-exit' | 'stdin' | null = null;
  /**
   * A failed tree shutdown remains authoritative even if the root process emits
   * `exit`. Without this latch, a second kill could report success while an
   * unproved descendant from the first attempt remains.
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
  /**
   * The last `workspace_policy` receipt Core emitted, or null before the first
   * one arrives. Core re-emits this after EVERY change to the effective read
   * boundary (startup, `grant_path`, `revoke_path`,
   * `grant_workspace_capability`), and its `readable_roots` is the
   * authoritative answer to "what can this chat actually reach". Nothing here
   * is host-authored: this is stored exactly as received.
   */
  private lastWorkspacePolicy: WCoreWorkspacePolicy | null = null;
  /** Resolvers waiting for the NEXT receipt. Drained and cleared on arrival. */
  private workspacePolicyWaiters: Array<(policy: WCoreWorkspacePolicy) => void> = [];
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
  /** K-01: the global `config.toml` transaction for the Desktop MCP-narrowing profile. */
  private globalProfileConfigTransaction: ProjectConfigTransaction | null = null;
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
  /**
   * Withdraw this agent from the live-session registry. Held privately so the
   * registry exposes only `{ workspace, revokePath }` and never the agent.
   */
  private readonly unpublishPathGrantSession: () => void;

  constructor(options: WCoreAgentOptions) {
    this.options = options;
    // Published from construction rather than from a successful spawn: a
    // Settings revoke that arrives while the engine is still booting must find
    // this session, and `revokePath` on a transport that is not up yet is a
    // no-op that resolves null rather than throwing.
    this.unpublishPathGrantSession = registerLivePathGrantSession({
      workspace: options.workspace,
      revokePath: (grantId) => this.revokePath(grantId),
    });
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

  /**
   * K-01: resolve the config directory the engine spawn's `WAYLAND_HOME` will
   * use, ONCE, before either the raw or managed launch branch. Extracted
   * verbatim from the block that used to live inline in
   * `startWithProjectConfigLease` (right before the spawn), so the global
   * MCP-profile splice target and the engine's actual `WAYLAND_HOME` can
   * never diverge (a TOCTOU the two previously-separate resolutions could
   * otherwise open).
   *
   * FAILURE CONTRACT (#278) unchanged, just relocated: a NAMED profile that
   * cannot be resolved is `ProfileIsolationError` and MUST fail the launch
   * closed - falling back to native here would bind a named profile's
   * session to the default profile's config/memory/credentials. Every other
   * failure (e.g. `os.homedir()` faulting inside `nativeConfigDir()`) is
   * warn-and-continue, so an unrelated fault never bricks default-profile
   * users.
   */
  private async resolveWaylandHomeForLaunch(): Promise<string | undefined> {
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
    return waylandHome;
  }

  async start(): Promise<void> {
    if (this.disposed) throw new Error('Wayland Core agent was stopped before bootstrap');
    const waylandHome = await this.resolveWaylandHomeForLaunch();
    if (this.options.rawEngineMode) {
      return this.startWithProjectConfigLease(this.options.workspace, waylandHome);
    }

    return withWCoreProjectConfigLease(this.options.workspace, (canonicalWorkspace) =>
      withGlobalWCoreProfileLease(waylandHome ?? nativeConfigDir(), async (canonicalConfigDir) => {
        try {
          // Pass the canonical dir as the SPLICE TARGET only, leaving
          // `waylandHome` (which may legitimately be undefined on the default
          // profile) to drive the spawn env exactly as before. Writing under the
          // lexical spelling while the lease keyed on the physical path is the
          // very interleaving the lease exists to prevent - but promoting an
          // undefined `waylandHome` to a concrete path here would also switch on
          // vault-passphrase resolution for default-profile launches, which is
          // outside this packet's scope.
          await this.startWithProjectConfigLease(canonicalWorkspace, waylandHome, canonicalConfigDir);
        } finally {
          // Core's ready event proves startup config has been consumed. Restore
          // before releasing either lease so a sibling launch can never
          // observe or inherit this chat's provider/MCP profile.
          // A failed tree proof does not prove consumption or exit. Keep the
          // launch-specific config in place until an identity-bound retry proves
          // the exact stale tree stopped.
          // Both restores share this exact gate: Core's ready event is the
          // SAME "config ingestion confirmed" signal for both targets, since
          // it is the same process reading both files.
          const consumed = this.ready || (!this.childProcess && !this.failedShutdownChild);
          if (consumed) {
            this.restoreProjectConfig();
            this.restoreGlobalMcpProfile();
          }
        }
      })
    );
  }

  private async startWithProjectConfigLease(
    workspace = this.options.workspace,
    resolvedWaylandHome?: string,
    /**
     * The canonical (realpath'd) config dir `withGlobalWCoreProfileLease` keyed
     * on. Used ONLY as the splice write target so lock identity and write target
     * cannot diverge under a symlinked config dir. Deliberately separate from
     * `resolvedWaylandHome`, which stays possibly-undefined so the default
     * profile's spawn env is unchanged.
     */
    canonicalConfigDir?: string
  ): Promise<void> {
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

    // T2: resolved ONCE, here, and threaded into BOTH the `--system-prompt`
    // directive and the spawn env. Deriving it twice would let the two disagree
    // if a run closed between them, and a directive naming a directory the
    // engine was not given is worse than no directive at all.
    const openRunOutputDir = workspace ? activeRunOutputDir(this.options.conversationId) : undefined;
    const engineOutputDir = workspace
      ? resolveOutputDir(workspace, openRunOutputDir, this.options.conversationId)
      : undefined;

    // B13. Whether the directive may tell the model to PRINT that directory.
    // Only when the resolver actually accepted the open run's staging tree -
    // `resolveOutputDir` rejects one that is not inside the workspace and falls
    // back to the chat namespace, which is permanent and keeps the old clause.
    const outputDirIsEphemeral =
      !!openRunOutputDir && !!engineOutputDir && engineOutputDir === resolvePath(openRunOutputDir);

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
      // T2. Ignored in raw-engine mode by `buildSpawnConfig`, deliberately: the
      // engine runs on its own config.toml there and Desktop overrides nothing
      // on the prompt side.
      systemPrompt: engineOutputDir
        ? buildOutputDirective(engineOutputDir, { ephemeral: outputDirIsEphemeral })
        : undefined,
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

    // K-01: the launch-local MCP-narrowing profile now lives in the GLOBAL
    // config root (resolveActiveConfigDir() / resolvedWaylandHome), not the
    // workspace .wayland-core.toml - Core 0.12.26 strips [profiles.*] from
    // project config in an untrusted workspace, silently dropping the
    // profile. The workspace file keeps carrying only genuinely
    // project-scoped content (provider compat overrides).
    // Core 0.12.26 `scope_host_runtime_mcp` scopes EVERY wire-added MCP server
    // to the host's active assistant and hard-fails without one:
    // "active assistant identity is required for a runtime MCP declaration".
    // Live-verified on the released binary - without this flag every runtime
    // `add_mcp_server` fails and the session's tool pool is empty, which is why
    // no MCP tool could execute on 0.12.26.
    //
    // A constant host identity, not a per-chat one, deliberately: config
    // servers carrying `only_for_assistant` are already excluded when no
    // assistant is active, so naming a stable identity changes nothing for
    // them, while a per-chat identity would silently break any server a user
    // scoped to a real assistant. Per-chat MCP narrowing stays the launch
    // profile's job (K-01).
    // Unconditional, including raw engine mode: raw mode still emits runtime
    // `add_mcp_server` after ready (team bridges and host connectors), and Core
    // 0.12.26 refuses every one of them without an identity. Gating this on
    // non-raw mode left exactly those declarations broken (cross-audit,
    // Codex 5.6 Sol).
    args.push('--assistant', WCORE_DESKTOP_HOST_ASSISTANT);
    const mcpServerNames = this.options.mcpServerNames;
    if (!this.options.rawEngineMode && mcpServerNames !== undefined) {
      args.push('--profile', WCORE_DESKTOP_MCP_PROFILE);
      this.writeGlobalMcpProfile(canonicalConfigDir ?? resolvedWaylandHome ?? nativeConfigDir(), mcpServerNames);
    }
    if (projectConfig) {
      this.writeProjectConfig(projectConfig, workspace);
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
    // K-01: resolution itself has moved to `resolveWaylandHomeForLaunch()`,
    // called ONCE in `start()` before either lease is acquired, so the global
    // profile splice target and this spawn's WAYLAND_HOME can never diverge.
    // The #278 fail-closed/fail-open contract (ProfileIsolationError fatal on
    // the named-profile branch, every other fault warn-and-continue on
    // `default`) is preserved byte-for-byte in that method - just relocated.
    const waylandHome = resolvedWaylandHome;
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
          // P2-6: same value the child stands in (`cwd` below), so
          // WAYLAND_OUTPUT_DIR and the agent's own `$PWD` can never disagree.
          workspace,
          // P2-11: when a scheduled run is open on THIS CONVERSATION, its
          // staging directory is the destination - the run publishes by rename,
          // so a crash leaves nothing where the user or the next run would read
          // it. Undefined for an interactive chat, which keeps the series root,
          // including an interactive chat opened in the task's own folder while
          // a scheduled run of that task is in flight.
          // T2: the SAME value the `--system-prompt` directive named. Passing
          // the already-resolved directory (rather than re-reading the run
          // registry) is what makes "the env and the directive agree" a
          // structural fact instead of a timing one. It is still re-checked for
          // containment inside `buildEngineSpawnEnv`.
          outputDir: engineOutputDir,
          // T1: with no run open this selects `artifacts/chat/<conversationId>`
          // instead of the series root, so an interactive chat's deliverables
          // are never classified as a cron series - nor retired by one.
          conversationId: this.options.conversationId,
          vaultPassphraseEnv: vaultDelivery?.env,
          spawnEnvDenylist,
          ambientEnvDenylist,
        }),
        stdio: vaultDelivery?.stdio ?? ['pipe', 'pipe', 'pipe'],
        cwd: workspace,
      });
      this.transportAlive = true;
      this.transportUnavailableReason = null;
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
      if (!this.ready) {
        // #DIA-01: surface the engine's own stderr reason instead of only this
        // JS-side parser's complaint, when the engine left one behind.
        const stderrDetail = redactSecrets(stripAnsi(this.stderrTail).trim());
        this.readyReject(new Error(describeContractRejection(stderrDetail, detail)));
      } else {
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
      // K-02/K-03 cross-audit (Codex 5.6 Sol and Kimi K3, independently): this
      // line was logged verbatim. Every OTHER stderr consumer redacts, but this
      // one wrote raw engine output straight to the log file and, through
      // `mainLogger`, to the renderer DevTools stream - so an engine that echoes
      // `Authorization: Bearer <key>` or `api_key=<key>` before failing put a
      // live credential on disk regardless of the redaction applied to the
      // user-facing error. Severity classification runs on the unredacted line
      // (the engine's own level tag is never a secret); only what is written out
      // is redacted.
      console[wcoreStderrLevel(line)]('[wcore]', redactSecrets(line));
    });

    // Capture the exact child whose listeners are being installed. Exit is a
    // root-process notification, not proof that the complete engine tree is
    // gone: descendants can remain alive after the root exits. In particular,
    // a pending or failed tree-proof attempt must retain this exact identity
    // and its launch config until that proof succeeds.
    const spawnedChild = this.childProcess;
    let rootExitObserved = false;
    const markStdinUnavailable = (error?: Error): void => {
      if (error) {
        console.warn('[WCoreAgent] stdin transport failed', redactSecrets(error.message));
      }
      this.markTransportUnavailable(spawnedChild);
    };
    // A child can remain alive after its writable command pipe closes. Treat
    // that as transport death immediately, but retain `spawnedChild` as the
    // exact process-tree identity that kill() must still prove stopped.
    spawnedChild.stdin?.on('error', markStdinUnavailable);
    spawnedChild.stdin?.on('close', () => markStdinUnavailable());
    // #853: the ONLY honest surface for a launch failure. Node delivers a spawn
    // ENOENT/EACCES/EPERM on this event and no 'exit'/'ready' ever fires, so
    // without this listener the errno is (a) an unhandled 'error' event that can
    // crash the main process and (b) invisible to the user (a bare 30s ready
    // timeout with empty stderr). Installed synchronously beside the exit
    // listener so no spawn error can arrive before it is attached. A post-ready
    // spawn 'error' is near-nonexistent (errnos fire pre-ready), so that branch
    // deliberately surfaces the reason without the log-link suffix (W3, accepted).
    spawnedChild.on('error', (err: NodeJS.ErrnoException) => {
      const reason = redactSecrets(describeSpawnError(err));
      if (!this.ready) {
        this.readyReject(new Error(reason));
      } else {
        this.onStreamEvent({ type: 'error', data: reason, msg_id: this.activeMsgId ?? '' });
      }
    });
    spawnedChild.on('exit', (code, signal) => {
      // Node promises one exit event, but keep this boundary idempotent under a
      // hostile/double-emitting child shim. Replaying terminal notifications
      // must not duplicate trust changes or manager termination callbacks.
      if (rootExitObserved) return;
      rootExitObserved = true;
      if (this.childProcess === spawnedChild) {
        this.transportAlive = false;
        this.transportUnavailableReason = 'root-exit';
      }
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
        // (#484). #853: compose via describeExitReason so a signal-kill (AV
        // SIGKILL) reads "killed by SIGKILL …" instead of "exited with code null"
        // — a numeric exit stays byte-exactly "exited with code N", keeping this
        // wording distinct from the separate 30s ready-timeout below.
        const detail = redactSecrets(stripAnsi(this.stderrTail).trim());
        const reason = describeExitReason(code, signal);
        this.readyReject(
          new Error(
            detail
              ? `wcore ${reason} during init: ${detail}${profileStripHedge(detail)}`
              : `wcore ${reason} during init`
          )
        );
      }
      if (this.activeMsgId && this._onProcessExit) {
        this._onProcessExit(code, this.activeMsgId, signal);
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
        reject(
          new Error(
            detail ? `wcore ready timeout (30s): ${detail}${profileStripHedge(detail)}` : 'wcore ready timeout (30s)'
          )
        );
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
        // session, restore the wrong .wayland-core.toml, or contaminate the stderr tail.
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
        // K-01: mirror the workspace restore above for the global profile
        // transaction - otherwise `this.globalProfileConfigTransaction` would
        // keep pointing at this failed attempt's (now-stale) transaction
        // object across the recursive retry below.
        this.restoreGlobalMcpProfile();
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
        return this.startWithProjectConfigLease(workspace, resolvedWaylandHome, canonicalConfigDir);
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

    // The ToolSearch guidance that used to be injected here is DELETED. It was a
    // prompt-level workaround for Core's ALL-tokens substring matcher (C-5),
    // fixed at DESKTOP_CORE_V1_PRODUCER_COMMIT: the matcher now filters
    // structural noise, has an exact-name tier, and bounds its echoed query.
    //
    // Deleted rather than kept "just in case" on purpose. It told the model how
    // to phrase searches, so leaving it in would have silently biased the very
    // measurement Core asked for - we could not have said whether the engine
    // improved or our prompt did.

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

      case 'tool_cancelled': {
        // A3 - one reason, and one only, gets plain English. Everything else
        // passes through byte-for-byte.
        const cancelled = describeToolCancellation(event.reason);
        this.onStreamEvent({
          type: 'tool_group',
          data: [
            {
              callId: event.call_id,
              name: cancelled.name,
              description: cancelled.description,
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
      }

      // #1098: the engine handed us CONTENT to display. No path is carried, so
      // nothing downstream can offer the OS launcher a target — which is the
      // whole point (#1102: `open` is unavailable under the macOS seatbelt, and
      // granting `lsopen` would be an execution escape).
      case 'render_artifact': {
        // The mime vocabulary is CLOSED engine-side. Refuse anything outside it
        // here, at the first boundary, rather than defaulting: a kind we cannot
        // render must not reach the renderer disguised as one we can.
        if (!RENDERABLE_ARTIFACT_MIMES.has(event.mime)) {
          console.warn(`[WCoreAgent] dropped render_artifact with unrenderable mime: ${String(event.mime)}`);
          break;
        }
        // The mime is validated above; `content` and `title` are not, and they
        // arrive as untyped JSON. The engine caps them, but a host must not
        // depend on the far side of a wire for its own safety - and the cost of
        // being wrong here is not a bad render, it is a PERMANENT one: the IPC
        // bridge can neither reject nor carry an oversized reply, so a single
        // malformed frame wedges the renderer with no timeout to recover it.
        // Non-strings are dropped like an unrenderable mime; oversize is clamped
        // rather than dropped, and reuses the `truncated` flag the event already
        // carries so the user is told the view is partial.
        if (typeof event.content !== 'string' || typeof event.title !== 'string') {
          console.warn('[WCoreAgent] dropped render_artifact with a non-string title or content');
          break;
        }
        const clampedContent = event.content.slice(0, MAX_RENDER_ARTIFACT_CONTENT_CHARS);
        const clampedTitle = event.title.slice(0, MAX_RENDER_ARTIFACT_TITLE_CHARS);
        this.onStreamEvent({
          type: 'render_artifact',
          data: {
            callId: event.call_id,
            title: clampedTitle,
            mime: event.mime,
            content: clampedContent,
            truncated: event.truncated || clampedContent.length < event.content.length,
          },
          msg_id: event.msg_id,
        });
        break;
      }

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

      // #1099 boundary axis. This is the ONLY host-visible answer to "what can
      // this chat actually reach", and the only structural confirmation that a
      // `grant_path` landed: Core emits the updated receipt in the `Ok` arm of
      // `emit_path_grant` and NOWHERE ELSE, flattening its typed
      // `PathGrantError` into an untyped `info` string. Absence of a receipt is
      // therefore the refusal signal - which only works if the host is actually
      // listening for one, so this must not fall through to `default:`.
      case 'workspace_policy':
        this.lastWorkspacePolicy = event.policy;
        this.resolveWorkspacePolicyWaiters(event.policy);
        this.onStreamEvent({ type: 'workspace_policy', data: event.policy, msg_id: '' });
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

    // #1099: the engine classified a filesystem boundary BEFORE running the
    // call. Checked first, ahead of every category dispatch, because the
    // escalation is orthogonal to category — a `Read` outside the workspace
    // arrives as `info`, which is the branch Auto Edit auto-approves. Routing
    // it here is what stops it being answered as an ordinary info prompt.
    const escalation = tool.escalation;
    if (escalation?.kind === 'path_boundary') {
      return {
        type: 'path_boundary' as const,
        title: tool.description,
        target: escalation.target,
        suggestedRoot: escalation.suggested_root,
        access: escalation.access,
      };
    }

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
    this.writeCommand(cmd);
  }

  async send(content: string, msgId: string, files?: string[]): Promise<void> {
    await this.readyPromise;
    // A retained child after root exit is shutdown authority, not a live
    // transport. Reject before publishing turn identity or arming the watchdog
    // so a write to dead stdin cannot become a silent ten-minute stall.
    if (this.disposed) throw new Error('Wayland Core agent was stopped before the turn could be sent');
    const written = this.writeCommand({
      type: 'message',
      msg_id: msgId,
      content,
      files,
    });
    if (!written) {
      throw new Error(
        this.transportUnavailableReason === 'root-exit'
          ? 'Wayland Core transport exited before the turn could be sent'
          : 'Wayland Core transport is unavailable; the turn was not sent'
      );
    }
    // #746: arm the stall watchdog for this turn. Armed at SEND (not at stream_start)
    // so a turn that never even starts streaming — the engine going silent on the
    // request itself — is still bounded.
    this.activeMsgId = msgId;
    this.startStallWatchdog();
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

  approveTool(callId: string, scope: ApprovalScope = 'once', answer?: string): void {
    // `answer` carries an AskUserQuestion choice back through the approval
    // channel (see WCoreCommand.tool_approve). Only attach when present so a
    // plain approval keeps its exact prior wire shape.
    this.sendCommand({ type: 'tool_approve', call_id: callId, scope, ...(answer ? { answer } : {}) });
  }

  denyTool(callId: string, reason = ''): void {
    this.sendCommand({ type: 'tool_deny', call_id: callId, reason });
  }

  /**
   * The last `workspace_policy` receipt, or null if none has arrived. Read it
   * for display; use the value {@link grantPath} resolves with when the answer
   * has to be "did THAT grant land".
   */
  get workspacePolicy(): WCoreWorkspacePolicy | null {
    return this.lastWorkspacePolicy;
  }

  /**
   * The roots Core last reported this session may READ. Empty before the first
   * receipt - which is "not yet known", not "nothing is readable", so a caller
   * must not render an empty array as a boundary.
   */
  get workspaceReadableRoots(): readonly string[] {
    return this.lastWorkspacePolicy?.readable_roots ?? [];
  }

  /**
   * Grant this session standing READ access to one folder outside the workspace.
   *
   * Resolves with the UPDATED policy receipt when Core accepts, and with `null`
   * when no receipt arrives inside `timeoutMs`. `null` is the refusal signal and
   * the whole reason this returns a promise instead of being fire-and-forget:
   * Core answers a refusal with an untyped `info` string and NO receipt (see
   * `emit_path_grant`), so "no error came back" is not evidence the grant took.
   * A caller that treated this as void would be asserting a boundary it never
   * confirmed.
   *
   * The waiter is armed BEFORE the command is written, so a receipt that lands
   * on the very next line cannot be missed.
   *
   * Core refuses outright unless the engine was launched with
   * `--allow-host-path-grants` (see `buildSpawnConfig`'s `allowHostPathGrants`).
   */
  grantPath(
    grant: { grantId: string; root: string; access?: PathGrantAccess; expiresAtMs?: number },
    timeoutMs = WORKSPACE_POLICY_RECEIPT_TIMEOUT_MS
  ): Promise<WCoreWorkspacePolicy | null> {
    const receipt = this.awaitNextWorkspacePolicy(timeoutMs);
    this.sendCommand({
      type: 'grant_path',
      grant_id: grant.grantId,
      root: grant.root,
      ...(grant.access ? { access: grant.access } : {}),
      ...(grant.expiresAtMs !== undefined ? { expires_at_ms: grant.expiresAtMs } : {}),
    });
    return receipt;
  }

  /**
   * Withdraw the grant made under `grantId`. Idempotent: Core treats an unknown
   * id as a no-op and re-emits the receipt either way, so unlike
   * {@link grantPath} a `null` here means the HOST failed to get the command
   * out, never that Core declined.
   */
  revokePath(grantId: string, timeoutMs = WORKSPACE_POLICY_RECEIPT_TIMEOUT_MS): Promise<WCoreWorkspacePolicy | null> {
    const receipt = this.awaitNextWorkspacePolicy(timeoutMs);
    this.sendCommand({ type: 'revoke_path', grant_id: grantId });
    return receipt;
  }

  private awaitNextWorkspacePolicy(timeoutMs: number): Promise<WCoreWorkspacePolicy | null> {
    return new Promise((resolve) => {
      let settled = false;
      const waiter = (policy: WCoreWorkspacePolicy): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(policy);
      };
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.workspacePolicyWaiters = this.workspacePolicyWaiters.filter((entry) => entry !== waiter);
        resolve(null);
      }, timeoutMs);
      this.workspacePolicyWaiters.push(waiter);
    });
  }

  private resolveWorkspacePolicyWaiters(policy: WCoreWorkspacePolicy): void {
    const waiters = this.workspacePolicyWaiters;
    this.workspacePolicyWaiters = [];
    for (const waiter of waiters) waiter(policy);
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
    return this.transportAlive;
  }

  private markTransportUnavailable(child: ChildProcess): void {
    if (this.childProcess !== child || !this.transportAlive) return;
    this.transportAlive = false;
    this.transportUnavailableReason = 'stdin';
    this.stopStallWatchdog();
    if (!this.ready) {
      this.readyReject(new Error('wcore command transport closed during init'));
    }
    const activeMsgId = this.activeMsgId;
    this.activeMsgId = null;
    if (activeMsgId) this._onProcessExit?.(null, activeMsgId);
  }

  private writeCommand(cmd: WCoreCommand): boolean {
    const child = this.childProcess;
    const stdin = child?.stdin;
    if (
      !child ||
      !this.transportAlive ||
      this.disposed ||
      !stdin ||
      !stdin.writable ||
      stdin.destroyed ||
      stdin.writableEnded
    ) {
      if (child && this.transportAlive && (!stdin || !stdin.writable || stdin.destroyed || stdin.writableEnded)) {
        this.markTransportUnavailable(child);
      }
      return false;
    }

    const validated = this.desktopContract.validateOutboundCommand(cmd);
    try {
      stdin.write(JSON.stringify(validated) + '\n');
    } catch {
      this.markTransportUnavailable(child);
      throw new Error('Wayland Core transport write failed; the command was not sent');
    }

    // A hostile/custom stream can emit error/close synchronously from write().
    // Do not publish turn authority after such a write boundary collapsed.
    return (
      this.transportAlive && this.childProcess === child && stdin.writable && !stdin.destroyed && !stdin.writableEnded
    );
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
        if (this.childProcess === child) {
          this.transportAlive = false;
          this.childProcess = null;
        }
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
    // Unpublish FIRST: everything below can yield or throw, and a session that
    // is on its way out must not keep collecting revokes it can no longer send.
    this.unpublishPathGrantSession();
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
    // K-01: mirror the workspace restore for the global profile transaction -
    // an explicit stop() must not leave the Desktop MCP-narrowing profile
    // published in the user's real global config.toml. Idempotent, exactly
    // like restoreProjectConfig() above.
    this.restoreGlobalMcpProfile();
  }

  /**
   * Write a temporary .wayland-core.toml in the workspace for provider compat overrides.
   * Backs up existing file content so it can be restored on exit.
   *
   * Security (RT-B6-07): the app owns every `[providers.*]` section because those
   * carry `base_url`/endpoint overrides that decide where API keys and prompts are
   * sent. A pre-placed or sibling-written `.wayland-core.toml` must never be allowed to
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
   * Restore or remove the .wayland-core.toml written by writeProjectConfig.
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

  /**
   * K-01: write the Desktop MCP-narrowing profile into the GLOBAL
   * `config.toml` at `targetDir` (the resolved `WAYLAND_HOME` this launch
   * will spawn with), instead of the workspace `.wayland-core.toml` - Core
   * 0.12.26 strips `[profiles.*]` from project config in an untrusted
   * workspace, silently dropping the profile there.
   *
   * Mirrors `writeProjectConfig`'s shape exactly: heal a stale journal from a
   * prior crashed launch BEFORE trusting on-disk bytes as ground truth, read
   * via the no-follow reader (never an unguarded read of the user's real
   * config), splice via `spliceDesktopMcpProfile` (textual only - see that
   * module's head comment for why a round trip is forbidden here), then
   * journal the transaction the same way. A `DesktopProfileSpliceError` from
   * the splice is NOT caught here - it propagates through `start()`'s
   * existing generic reject path, and this method touches nothing on that
   * failure (the throw happens before `ProjectConfigTransaction.begin` runs).
   */
  private writeGlobalMcpProfile(targetDir: string, serverNames: readonly string[]): void {
    const configPath = join(targetDir, 'config.toml');
    // K-01 cross-audit (Codex 5.6 Sol leg): on a clean machine the native config
    // dir may not exist yet. Connector publication creates it, but a chat with
    // ZERO selected connectors skips that path entirely and still reaches here,
    // so `ProjectConfigTransaction.begin` would write its sibling backup/marker
    // into a missing directory and abort the very first launch with ENOENT.
    // 0o700 matches the engine's own credential-file posture: this directory
    // holds config.toml and credentials.
    mkdirSync(targetDir, { recursive: true, mode: 0o700 });
    recoverProjectConfigTransaction(configPath);
    const existingBytes = readProjectConfigNoFollow(configPath);
    const existing = existingBytes?.toString('utf-8') ?? null;

    const fragment = appendDesktopMcpProfile(null, serverNames);
    const spliced = spliceDesktopMcpProfile(existing, fragment);

    this.globalProfileConfigTransaction = ProjectConfigTransaction.begin(configPath, spliced);
  }

  /**
   * Restore or remove the global `config.toml` profile table written by
   * `writeGlobalMcpProfile`. Byte-for-byte mirror of `restoreProjectConfig`.
   */
  private restoreGlobalMcpProfile(): void {
    const transaction = this.globalProfileConfigTransaction;
    this.globalProfileConfigTransaction = null;
    if (!transaction) return;

    try {
      transaction.restore();
    } catch (error) {
      // Keep the durable journal for the next launch to heal. Never delete the
      // only recovery evidence after a failed restore.
      console.error('[WCoreAgent] Failed to restore global profile config transaction', error);
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
