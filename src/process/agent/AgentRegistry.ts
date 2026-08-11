/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { acpDetector } from '@process/agent/acp/AcpDetector';
import type {
  AcpDetectedAgent,
  WCoreDetectedAgent,
  DetectedAgent,
  GeminiDetectedAgent,
  NanobotDetectedAgent,
  OpenClawDetectedAgent,
  RemoteDetectedAgent,
} from '@/common/types/detectedAgent';
import { isAgentKind } from '@/common/types/detectedAgent';
import type { AcpLaunchSpec } from '@/common/types/acpTypes';
import type { RemoteAgentConfig } from '@process/agent/remote/types';
import { detectWCore } from '@process/agent/wcore/binaryResolver';
import { listManagedAcpAgents } from '@process/services/agentInstaller/installedAgentLaunch';

// Resolve the bundled wayland-core version once per app run (the binary doesn't
// change at runtime) so the Wayland Core settings page shows the REAL engine
// version instead of a hardcoded pin that silently drifts on every bump.
// detectWCore() spawns `wayland-core --version` synchronously, so memoize it.
let cachedWCoreInfo: { version?: string; cliPath?: string } | undefined;
function getWCoreInfo(): { version?: string; cliPath?: string } {
  if (cachedWCoreInfo) return cachedWCoreInfo;
  try {
    const detected = detectWCore();
    // detectWCore returns the raw `wayland-core 0.11.0` line; surface a clean vX.Y.Z.
    const match = detected.version?.match(/(\d+\.\d+\.\d+(?:-[\w.]+)?)/);
    cachedWCoreInfo = { version: match ? `v${match[1]}` : undefined, cliPath: detected.path };
  } catch {
    cachedWCoreInfo = {};
  }
  return cachedWCoreInfo;
}

/**
 * Central registry for ALL detected execution engines.
 *
 * Coordinates sub-detectors, owns merged state, and provides the unified
 * `getDetectedAgents()` API consumed by IPC bridges.
 *
 * Sources:
 *   - Gemini       - always present (no CLI detection)
 *   - ACP builtin  - CLI agents on PATH (claude, qwen, codex, …)
 *   - ACP extension - contributed by hub extensions
 *   - Remote       - user-configured WebSocket agents (from DB)
 *   - WCore        - always present (Rust binary, availability resolved at runtime)
 *   - OpenClaw GW  - detected via `openclaw` CLI on PATH
 *   - Nanobot      - detected via `nanobot` CLI on PATH
 *   - Custom ACP   - user-defined ACP CLIs from ConfigStorage 'assistants'
 *
 * Preset assistants (prompt-only presets with no CLI binary) are NOT
 * execution engines - they live in the configuration layer and reference
 * execution engines by backend type.
 */
class AgentRegistry {
  private detectedAgents: DetectedAgent[] = [];
  private isInitialized = false;
  private mutationQueue: Promise<void> = Promise.resolve();

  // Cache sub-detector results for partial refresh
  private builtinAgents: AcpDetectedAgent[] = [];
  private extensionAgents: AcpDetectedAgent[] = [];
  private remoteAgents: RemoteDetectedAgent[] = [];
  private otherAgents: DetectedAgent[] = [];
  private customAgents: AcpDetectedAgent[] = [];
  private managedAgents: AcpDetectedAgent[] = [];

  /**
   * Caught errors from sub-detector loading paths (e.g. remote agent DB read).
   * Surfaced via `getLoadErrors()` so the renderer can distinguish
   * "no agents configured" from "agent loading failed". Cleared on every
   * full re-detection (initialize/refreshAll) and on the targeted refresh
   * for the affected source (e.g. refreshRemoteAgents clears remote errors).
   */
  loadErrors: string[] = [];

  private createGeminiAgent(): GeminiDetectedAgent {
    return {
      id: 'gemini',
      name: 'Gemini CLI',
      kind: 'gemini',
      available: true,
      backend: 'gemini',
    };
  }

  private createWCoreAgent(): WCoreDetectedAgent {
    const info = getWCoreInfo();
    return {
      id: 'wcore',
      name: 'Wayland Core',
      kind: 'wcore',
      available: true,
      backend: 'wcore',
      ...(info.version ? { version: info.version } : {}),
      ...(info.cliPath ? { cliPath: info.cliPath } : {}),
    };
  }

  /**
   * Detect non-ACP CLI agents (openclaw-gateway, nanobot) via CLI availability.
   * Uses the same `which`/`where` check as AcpDetector.
   */
  private detectOtherCliAgents(): DetectedAgent[] {
    const agents: DetectedAgent[] = [];

    if (acpDetector.isCliAvailable('openclaw')) {
      agents.push({
        id: 'openclaw-gateway',
        name: 'OpenClaw Gateway',
        kind: 'openclaw-gateway',
        available: true,
        backend: 'openclaw-gateway',
        cliPath: 'openclaw',
      } satisfies OpenClawDetectedAgent);
    }

    if (acpDetector.isCliAvailable('nanobot')) {
      agents.push({
        id: 'nanobot',
        name: 'Nanobot',
        kind: 'nanobot',
        available: true,
        backend: 'nanobot',
        cliPath: 'nanobot',
      } satisfies NanobotDetectedAgent);
    }

    return agents;
  }

  /**
   * Agents Wayland installed into its own prefix, as detected agents.
   *
   * These are NOT on the system PATH — Wayland never puts anything there — so
   * `AcpDetector` can never see them and, before this existed, an install that
   * genuinely succeeded left the agent absent from the picker.
   *
   * Each entry carries the receipt's `launch` descriptor. `cliPath` is set to
   * the backend's own command name purely as the legacy field's value: every
   * spawn seam prefers `launch` when it is a valid spec, so the string is never
   * parsed for a managed agent.
   *
   * Never throws: a failure to read receipts must degrade to "no managed
   * installs", which is exactly today's behaviour, not a registry that fails to
   * initialise and leaves the user with no agents at all.
   */
  private loadManagedAgents(): AcpDetectedAgent[] {
    try {
      return listManagedAcpAgents().map((managed) => ({
        id: managed.backend,
        name: managed.name,
        kind: 'acp' as const,
        available: true,
        backend: managed.backend,
        cliPath: managed.launch.command,
        launch: managed.launch,
        managedAgentId: managed.agentId,
        ...(managed.acpArgs ? { acpArgs: managed.acpArgs } : {}),
      }));
    } catch (error) {
      const message = `[managed] ${String((error as { message?: unknown })?.message ?? error)}`;
      console.error('[AgentRegistry] Failed to load managed agent installs:', error);
      this.loadErrors.push(message);
      return [];
    }
  }

  private async loadRemoteAgents(): Promise<RemoteDetectedAgent[]> {
    try {
      // Dynamic import to avoid circular dependency at module load time
      const { getDatabase } = await import('@process/services/database');
      const db = await getDatabase();
      const configs: RemoteAgentConfig[] = db.getRemoteAgents();
      return configs.map((config) => ({
        id: `remote:${config.id}`,
        name: config.name,
        kind: 'remote' as const,
        available: true,
        backend: 'remote',
        remoteAgentId: config.id,
        url: config.url,
        protocol: config.protocol,
        authType: config.authType,
      }));
    } catch (error) {
      const message = `[remote] ${String((error as { message?: unknown })?.message ?? error)}`;
      console.error('[AgentRegistry] Failed to load remote agents:', error);
      this.loadErrors.push(message);
      // NOTE: Sentry is not currently imported in this file; capture deferred
      // to a follow-up slice that wires Sentry into the main process modules.
      return [];
    }
  }

  /**
   * Deduplicate agents by backend ID. First occurrence wins - merge order
   * determines priority: WCore > Gemini > Builtin > Managed > Other > Remote > Extension > Custom.
   * When an extension contributes the same backend as a builtin, the builtin wins.
   *
   * Managed installs sit immediately BEHIND the PATH-detected builtins, and that
   * position IS decision D1: a system copy the user already has wins outright,
   * so the managed entry (the only one carrying a `launch` descriptor) survives
   * only when the PATH probe found nothing. Moving it ahead of `builtinAgents`
   * would silently take a working user setup away from them.
   *
   * Remote and custom agents share their `backend` string but are individually
   * addressable via their unique `id`, so they skip backend dedup.
   */
  private deduplicate(agents: DetectedAgent[]): DetectedAgent[] {
    const seen = new Set<string>();
    const result: DetectedAgent[] = [];

    for (const agent of agents) {
      const key = agent.kind === 'remote' || agent.backend === 'custom' ? agent.id : agent.backend;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(agent);
    }

    return result;
  }

  // prettier-ignore
  private merge(): void {
    this.detectedAgents = this.deduplicate([
      this.createWCoreAgent(),
      this.createGeminiAgent(),
      ...this.builtinAgents,
      ...this.managedAgents,
      ...this.otherAgents,
      ...this.remoteAgents,
      ...this.extensionAgents,
      ...this.customAgents,
    ]);
  }

  private async runExclusiveMutation<T>(task: () => Promise<T>): Promise<T> {
    const previousMutation = this.mutationQueue;
    let releaseCurrentMutation: (() => void) | undefined;

    this.mutationQueue = new Promise<void>((resolve) => {
      releaseCurrentMutation = resolve;
    });

    await previousMutation;

    try {
      return await task();
    } finally {
      releaseCurrentMutation?.();
    }
  }

  /**
   * Run all detection paths and update cached results.
   * Shared by initialize() and refreshAll().
   */
  private async detectAll(): Promise<void> {
    acpDetector.clearEnvCache();
    this.loadErrors = [];

    const [builtinAgents, extensionAgents, remoteAgents, customAgents] = await Promise.all([
      acpDetector.detectBuiltinAgents(),
      acpDetector.detectExtensionAgents(),
      this.loadRemoteAgents(),
      acpDetector.detectCustomAgents(),
    ]);

    this.builtinAgents = builtinAgents;
    this.extensionAgents = extensionAgents;
    this.remoteAgents = remoteAgents;
    this.customAgents = customAgents;
    this.otherAgents = this.detectOtherCliAgents();
    this.managedAgents = this.loadManagedAgents();
    this.merge();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    await this.runExclusiveMutation(async () => {
      if (this.isInitialized) return;

      console.log('[AgentRegistry] Starting agent detection...');
      const startTime = Date.now();

      await this.detectAll();
      this.isInitialized = true;

      const elapsed = Date.now() - startTime;
      const agentSummary = this.detectedAgents.map((a) => a.name).join(', ');
      console.log(
        `[AgentRegistry] Completed in ${elapsed}ms, found ${this.detectedAgents.length} agents: ${agentSummary}`
      );
    });
  }

  getDetectedAgents(): DetectedAgent[] {
    return [...this.detectedAgents];
  }

  /**
   * Returns errors caught during sub-detector loading (e.g. remote agent DB
   * read failures). Surfaced separately from `getDetectedAgents()` so the
   * existing array return shape (consumed by 10+ sites) is unchanged.
   *
   * Renderer should display these alongside the agent list so the user can
   * tell "no remote agents configured" apart from "remote loading failed".
   */
  getLoadErrors(): string[] {
    return [...this.loadErrors];
  }

  getAcpAgents(): AcpDetectedAgent[] {
    return this.detectedAgents.filter((a): a is AcpDetectedAgent => isAgentKind(a, 'acp'));
  }

  hasAgents(): boolean {
    return this.detectedAgents.length > 0;
  }

  /**
   * Refresh builtin CLI agents only (called when system PATH may have changed).
   * Clears cached env so newly installed/removed CLIs are detected.
   */
  async refreshBuiltinAgents(): Promise<void> {
    await this.runExclusiveMutation(async () => {
      acpDetector.clearEnvCache();

      const oldBuiltins = this.builtinAgents.map((a) => a.backend);
      this.builtinAgents = await acpDetector.detectBuiltinAgents();
      this.otherAgents = this.detectOtherCliAgents();
      const newBuiltins = this.builtinAgents.map((a) => a.backend);
      this.merge();

      const added = newBuiltins.filter((b) => !oldBuiltins.includes(b));
      const removed = oldBuiltins.filter((b) => !newBuiltins.includes(b));
      if (added.length > 0 || removed.length > 0) {
        console.log(`[AgentRegistry] Builtin agents changed: +[${added.join(', ')}] -[${removed.join(', ')}]`);
      }
    });
  }

  /**
   * Refresh extension-contributed agents (called after ExtensionRegistry.hotReload).
   * Clears cached env so newly installed CLIs are discoverable.
   */
  async refreshExtensionAgents(): Promise<void> {
    await this.runExclusiveMutation(async () => {
      acpDetector.clearEnvCache();
      this.extensionAgents = await acpDetector.detectExtensionAgents();
      this.merge();
    });
  }

  /**
   * Refresh remote agents from the database.
   * Called when remote agent config changes (create/update/delete).
   */
  async refreshRemoteAgents(): Promise<void> {
    await this.runExclusiveMutation(async () => {
      // Drop only the [remote]-prefixed errors so a successful reload clears
      // a previously surfaced failure without losing errors from other sources.
      this.loadErrors = this.loadErrors.filter((e) => !e.startsWith('[remote]'));
      this.remoteAgents = await this.loadRemoteAgents();
      this.merge();
    });
  }

  /**
   * The launch descriptor to spawn a backend with, or null to use `cliPath`.
   *
   * Reads the MERGED list, not the managed list, so it inherits decision D1
   * rather than re-deciding it: when the user has their own copy on PATH the
   * merged entry for that backend is the PATH one, which carries no `launch`,
   * and this returns null so the existing cliPath resolution runs untouched.
   *
   * Returns null before `initialize()` has run, which is the pre-existing
   * behaviour (no launch spec, spawn by cliPath) and never worse than it.
   */
  getManagedLaunchSpec(backend: string): AcpLaunchSpec | null {
    const entry = this.detectedAgents.find(
      (agent): agent is AcpDetectedAgent => isAgentKind(agent, 'acp') && agent.backend === backend
    );
    return entry?.launch ?? null;
  }

  /**
   * Re-read managed installs from disk. Called by the installer bridge after an
   * install or uninstall so the picker reflects the receipt immediately instead
   * of at the next full re-detection.
   */
  async refreshManagedAgents(): Promise<void> {
    await this.runExclusiveMutation(async () => {
      // Drop only the [managed]-prefixed errors so a successful reload clears a
      // previously surfaced failure without losing errors from other sources.
      this.loadErrors = this.loadErrors.filter((e) => !e.startsWith('[managed]'));
      this.managedAgents = this.loadManagedAgents();
      this.merge();
    });
  }

  /**
   * Refresh custom ACP agents from ConfigStorage 'assistants'.
   * Called after the user adds/edits/deletes a custom agent in Settings.
   */
  async refreshCustomAgents(): Promise<void> {
    await this.runExclusiveMutation(async () => {
      this.customAgents = await acpDetector.detectCustomAgents();
      this.merge();
    });
  }

  /**
   * Re-run all detection paths from scratch.
   * Called after hub install since onInstall hooks may have installed new CLIs.
   */
  async refreshAll(): Promise<void> {
    await this.runExclusiveMutation(() => this.detectAll());
  }
}

export const agentRegistry = new AgentRegistry();
