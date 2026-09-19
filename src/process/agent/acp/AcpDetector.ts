/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { execSync } from 'child_process';

import type { AcpBackendConfig } from '@/common/types/acpTypes';
import { POTENTIAL_ACP_CLIS } from '@/common/types/acpTypes';
import type { AcpDetectedAgent } from '@/common/types/detectedAgent';
import { ExtensionRegistry } from '@process/extensions';
import { safeExec, safeExecFile } from '@process/utils/safeExec';
import { ProcessConfig } from '@process/utils/initStorage';
import { getEnhancedEnv } from '@process/utils/shellEnv';

/**
 * One PowerShell start-up costs ~0.5-2s on a healthy box and far more on a
 * loaded one, so every CLI the cheap `where` pass missed is probed in a SINGLE
 * process. Probing each CLI separately (the pre-0.13.1 shape) meant ~20
 * concurrent PowerShell spawns during start-up: on a slow Windows machine they
 * all hit their individual timeout at once, starving window creation and
 * outliving shutdown.
 */
const POWERSHELL_PROBE_TIMEOUT_MS = 15000;

/**
 * The synchronous probe path runs on the Electron main thread, so its ceiling
 * is what the UI freezes for when PowerShell is slow to answer. It gets a much
 * smaller budget than the async path: a win-arm64 runner blocked here for the
 * full 15 s on a single missing CLI, which stalled the CDP endpoint (served by
 * the browser process) and failed the packaged smoke twice in a row (#1410).
 */
const SYNC_POWERSHELL_PROBE_TIMEOUT_MS = 3000;

/**
 * PowerShell one-liner that echoes each command it can resolve. `commands` are
 * pre-validated against /^[a-zA-Z0-9_.-]+$/ by the callers, so single-quoting
 * cannot break out of the array literal.
 */
function powerShellProbeScript(commands: string[]): string {
  const list = commands.map((cmd) => `'${cmd}'`).join(',');
  return `$ErrorActionPreference='SilentlyContinue'; foreach ($c in @(${list})) { if (Get-Command -All $c) { Write-Output $c } }`;
}

/** Keep only echoed names we actually asked about (ignore stray PowerShell noise). */
function parsePowerShellProbeOutput(stdout: string, requested: string[]): string[] {
  const asked = new Set(requested);
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => asked.has(line));
}

/**
 * ACP agent detector - discovers ACP protocol agents from two sources:
 *
 * **Builtin agents** - Well-known CLI tools (claude, qwen, goose, etc.) defined
 * in POTENTIAL_ACP_CLIS. Detected via `which`/`where` on the system PATH.
 *
 * **Extension agents** - Contributed by installed extensions via
 * `contributes.acpAdapters` in the extension manifest. Discovered from
 * ExtensionRegistry at runtime. Verified via CLI availability before inclusion.
 *
 * **Custom agents** - User-defined ACP CLIs from ConfigStorage 'assistants'.
 * No CLI availability check - the user is responsible for the path they provide.
 *
 * This class is a pure detection module - it does NOT own state or coordinate
 * multiple detectors. State management and orchestration live in AgentRegistry.
 */
class AcpDetector {
  private enhancedEnv: NodeJS.ProcessEnv | undefined;
  /** Memoized "is a usable WSL distro present" result (undefined = not probed yet). */
  private wslAvailable: boolean | undefined;

  /** Clear cached environment so newly installed/removed CLIs are detected. */
  clearEnvCache(): void {
    this.enhancedEnv = undefined;
    this.wslAvailable = undefined;
  }

  /**
   * Memoized check for whether a usable WSL distro exists. Runs a single fast
   * `wsl.exe -l -q` (list installed distros) at most once per instance and
   * caches the result. Returns true only if wsl.exe exists AND at least one
   * distro is listed. Any error/timeout is treated as "WSL not available".
   *
   * This gates the per-CLI `command -v` WSL probes so a WSL-less (or
   * distro-stopped) Windows box does not pay N synchronous `wsl.exe` spawns
   * on the startup detection path (#258).
   */
  private isWslAvailable(): boolean {
    if (this.wslAvailable !== undefined) return this.wslAvailable;
    if (process.platform !== 'win32') {
      this.wslAvailable = false;
      return false;
    }
    try {
      const out = execSync('wsl.exe -l -q', {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 1500,
        env: this.enhancedEnv,
      });
      // `wsl.exe -l -q` emits UTF-16; Node decodes it with embedded NULs.
      this.wslAvailable = out.split('\0').join('').trim().length > 0;
    } catch (err) {
      // wsl.exe missing / no distro / timeout - treat as not available.
      console.info('[AcpDetector] WSL presence check: not available:', (err as Error).message);
      this.wslAvailable = false;
    }
    return this.wslAvailable;
  }

  /** Argument vector for the batched PowerShell probe (async/`safeExecFile` form). */
  private powerShellProbeArgs(commands: string[]): string[] {
    return ['-NoProfile', '-NonInteractive', '-Command', powerShellProbeScript(commands)];
  }

  /** Check if a single CLI command is available on the system PATH (sync). */
  isCliAvailable(cliCommand: string): boolean {
    return this.batchCheckCliAvailabilitySync([cliCommand]).has(cliCommand);
  }

  /**
   * Batch-check which CLI commands are available on the system PATH.
   *
   * POSIX: single shell invocation using `command -v` (shell builtin,
   * no per-command process spawn).
   *
   * Windows: parallel `where` calls with PowerShell fallback.
   */
  async batchCheckCliAvailability(commands: string[]): Promise<Set<string>> {
    if (commands.length === 0) return new Set();

    // Reject commands with shell metacharacters to prevent injection
    const safe = commands.filter((cmd) => /^[a-zA-Z0-9_.-]+$/.test(cmd));
    if (safe.length === 0) return new Set();

    if (!this.enhancedEnv) {
      this.enhancedEnv = getEnhancedEnv();
    }

    const isWindows = process.platform === 'win32';

    if (!isWindows) {
      const checks = safe.map((cmd) => `command -v '${cmd}' >/dev/null 2>&1 && echo '${cmd}'`);
      const script = checks.join('; ') + '; true';
      try {
        const { stdout } = await safeExec(script, { timeout: 3000, env: this.enhancedEnv });
        return new Set(stdout.trim().split('\n').filter(Boolean));
      } catch (err) {
        console.error('[AcpDetector] Batch CLI check failed:', err);
        return new Set();
      }
    }

    const results = await Promise.allSettled(
      safe.map(async (cmd): Promise<string | null> => {
        try {
          await safeExecFile('where', [cmd], { timeout: 3000, env: this.enhancedEnv });
          return cmd;
        } catch (err) {
          console.warn(`[AcpDetector] 'where ${cmd}' failed, deferring to PowerShell:`, (err as Error).message);
          return null;
        }
      })
    );
    const found = new Set(
      results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value)
    );

    // Everything `where` missed goes to ONE PowerShell process, not one each.
    const missedByWhere = safe.filter((cmd) => !found.has(cmd));
    if (missedByWhere.length > 0) {
      try {
        const { stdout } = await safeExecFile('powershell', this.powerShellProbeArgs(missedByWhere), {
          timeout: POWERSHELL_PROBE_TIMEOUT_MS,
          env: this.enhancedEnv,
        });
        for (const cmd of parsePowerShellProbeOutput(stdout, missedByWhere)) found.add(cmd);
      } catch (err) {
        console.warn('[AcpDetector] batched PowerShell Get-Command failed:', (err as Error).message);
      }
    }

    // CLIs installed inside WSL are invisible to the Windows PATH (`where`/
    // PowerShell only see Windows executables). Probe the WSL login-shell PATH
    // for anything still missing so WSL-installed agents (claude, hermes, ...)
    // are discovered too. Silently falls through if WSL is not installed.
    const stillMissing = safe.filter((cmd) => !found.has(cmd));
    if (stillMissing.length > 0 && this.isWslAvailable()) {
      for (const cmd of await this.batchCheckCliAvailabilityWsl(stillMissing)) {
        found.add(cmd);
      }
    }
    return found;
  }

  /**
   * Probe a WSL distro's login-shell PATH for each command via
   * `wsl.exe -- bash -lc 'command -v <cli>'`. The login shell (`-l`) sources
   * the user's profile so PATH matches an interactive WSL session.
   *
   * Returns the subset of `commands` found inside WSL. Returns an empty set
   * (never throws) when WSL is not installed or no default distro exists, so
   * callers fall through to "not found".
   *
   * Only meaningful on Windows; callers gate on `process.platform === 'win32'`.
   */
  private async batchCheckCliAvailabilityWsl(commands: string[]): Promise<Set<string>> {
    if (commands.length === 0) return new Set();
    // commands are already validated against /^[a-zA-Z0-9_.-]+$/ by the caller,
    // so single-quoting inside the bash script cannot break out.
    const checks = commands.map((cmd) => `command -v '${cmd}' >/dev/null 2>&1 && echo '${cmd}'`);
    const script = checks.join('; ') + '; true';
    try {
      const { stdout } = await safeExecFile('wsl.exe', ['-e', 'bash', '-lc', script], {
        timeout: 2000,
        env: this.enhancedEnv,
      });
      return new Set(stdout.trim().split('\n').filter(Boolean));
    } catch (err) {
      // WSL not installed / no default distro / bash missing - not an error,
      // just means no WSL-side CLIs to add.
      console.info('[AcpDetector] WSL probe skipped:', (err as Error).message);
      return new Set();
    }
  }

  /**
   * Synchronous single-command fallback for callers that cannot await.
   * Used by isCliAvailable() and AgentRegistry for one-off checks.
   */
  private batchCheckCliAvailabilitySync(commands: string[]): Set<string> {
    if (commands.length === 0) return new Set();
    const safe = commands.filter((cmd) => /^[a-zA-Z0-9_.-]+$/.test(cmd));
    if (safe.length === 0) return new Set();

    if (!this.enhancedEnv) {
      this.enhancedEnv = getEnhancedEnv();
    }

    const isWindows = process.platform === 'win32';
    const whichCommand = isWindows ? 'where' : 'which';
    const found = new Set<string>();

    const missedByWhich: string[] = [];
    for (const cmd of safe) {
      try {
        execSync(`${whichCommand} ${cmd}`, { encoding: 'utf-8', stdio: 'pipe', timeout: 3000, env: this.enhancedEnv });
        found.add(cmd);
        continue;
      } catch (err) {
        if (!isWindows) continue;
        console.warn(`[AcpDetector] sync 'where ${cmd}' failed:`, (err as Error).message);
      }
      missedByWhich.push(cmd);
    }

    // One PowerShell process for every miss, not one per CLI: this runs on the
    // main thread, so N spawns x PowerShell start-up stalled window creation.
    if (missedByWhich.length > 0) {
      try {
        const out = execSync(
          `powershell -NoProfile -NonInteractive -Command "${powerShellProbeScript(missedByWhich)}"`,
          { encoding: 'utf-8', stdio: 'pipe', timeout: SYNC_POWERSHELL_PROBE_TIMEOUT_MS, env: this.enhancedEnv }
        );
        for (const cmd of parsePowerShellProbeOutput(out, missedByWhich)) found.add(cmd);
      } catch (err) {
        console.warn('[AcpDetector] sync batched PowerShell probe failed:', (err as Error).message);
      }
    }

    for (const cmd of missedByWhich) {
      if (found.has(cmd)) continue;
      // WSL-installed CLIs are invisible to the Windows PATH; probe the WSL
      // login-shell PATH - but only when a usable distro exists, so a WSL-less
      // box does not pay a synchronous wsl.exe spawn per missing CLI (#258).
      // Single-quoting is safe: cmd is validated above.
      if (!this.isWslAvailable()) continue;
      try {
        execSync(`wsl.exe -e bash -lc "command -v '${cmd}'"`, {
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 2000,
          env: this.enhancedEnv,
        });
        found.add(cmd);
      } catch (err) {
        // WSL installed but CLI not in WSL either - leave as not found.
        console.info(`[AcpDetector] sync WSL probe '${cmd}' not found:`, (err as Error).message);
      }
    }
    return found;
  }

  /**
   * Detect built-in ACP CLI agents via async batch CLI availability check.
   */
  async detectBuiltinAgents(): Promise<AcpDetectedAgent[]> {
    const allCmds = POTENTIAL_ACP_CLIS.map((cli) => cli.cmd);
    const available = await this.batchCheckCliAvailability(allCmds);
    const missing = allCmds.filter((cmd) => !available.has(cmd));

    if (missing.length > 0) {
      const envPath = this.enhancedEnv?.PATH ?? process.env.PATH ?? '(empty)';
      console.info(
        `[AcpDetector] CLI not found: [${missing.join(', ')}]. ` +
          `PATH(${envPath.length} chars): ${envPath.substring(0, 500)}`
      );
    }

    return POTENTIAL_ACP_CLIS.filter((cli) => available.has(cli.cmd)).map((cli) => ({
      id: cli.backendId,
      name: cli.name,
      kind: 'acp' as const,
      available: true,
      backend: cli.backendId,
      cliPath: cli.cmd,
      acpArgs: cli.args,
    }));
  }

  /**
   * Detect extension-contributed ACP adapters via parallel CLI availability check.
   */
  async detectExtensionAgents(): Promise<AcpDetectedAgent[]> {
    try {
      const adapters = ExtensionRegistry.getInstance().getAcpAdapters();
      if (!adapters || adapters.length === 0) return [];

      const candidates: Array<{ agent: AcpDetectedAgent; cliCommand: string }> = [];

      for (const item of adapters) {
        const adapter = item as Record<string, unknown>;
        const id = typeof adapter.id === 'string' ? adapter.id : '';
        const name = typeof adapter.name === 'string' ? adapter.name : id;
        const cliCommand = typeof adapter.cliCommand === 'string' ? adapter.cliCommand : undefined;
        const acpArgs = Array.isArray(adapter.acpArgs)
          ? adapter.acpArgs.filter((v): v is string => typeof v === 'string')
          : undefined;
        const extensionName = typeof adapter._extensionName === 'string' ? adapter._extensionName : 'unknown-extension';
        const connectionType = typeof adapter.connectionType === 'string' ? adapter.connectionType : 'unknown';

        if (connectionType !== 'cli' && connectionType !== 'stdio') continue;
        if (!cliCommand) continue;

        candidates.push({
          cliCommand,
          agent: {
            id,
            name,
            kind: 'acp',
            available: true,
            backend: id,
            cliPath: typeof adapter.defaultCliPath === 'string' ? adapter.defaultCliPath : cliCommand,
            acpArgs,
            isExtension: true,
            extensionName,
          },
        });
      }

      // Extension adapters are trusted - skip CLI availability check.
      // They declare a defaultCliPath (e.g. "bunx @augmentcode/auggie") as fallback,
      // so the CLI doesn't need to be on PATH.
      return candidates.map((c) => c.agent);
    } catch (error) {
      console.warn('[AcpDetector] Failed to load extension ACP adapters:', error);
      return [];
    }
  }

  /**
   * Detect user-defined custom ACP agents from ConfigStorage 'acp.customAgents'.
   * No CLI availability check - user is responsible for the path they provide.
   */
  async detectCustomAgents(): Promise<AcpDetectedAgent[]> {
    try {
      const customAgents = (await ProcessConfig.get('acp.customAgents')) as AcpBackendConfig[] | undefined;
      if (!customAgents?.length) return [];

      return customAgents
        .filter((a) => a.enabled !== false && !a.isPreset && Boolean(a.defaultCliPath))
        .map((a) => ({
          id: `custom:${a.id}`,
          name: a.name || 'Custom Agent',
          kind: 'acp' as const,
          available: true,
          backend: 'custom',
          cliPath: a.defaultCliPath,
          acpArgs: a.acpArgs,
          customAgentId: a.id,
        }));
    } catch (error) {
      if (error instanceof Error && (error.message.includes('ENOENT') || error.message.includes('not found'))) {
        return [];
      }
      console.warn('[AcpDetector] Unexpected error loading custom agents:', error);
      return [];
    }
  }
}

export const acpDetector = new AcpDetector();
