// src/process/acp/compat/LegacyConnectorFactory.ts

/**
 * Bridges old backend-specific connector logic (acpConnectors.ts) into
 * the new ClientFactory interface used by AcpSession.
 *
 * For npx-based backends (claude, codex, codebuddy) this reuses the
 * battle-tested connect*() functions which handle:
 *  - Full shell environment loading (API keys from .zshrc)
 *  - npx resolution and Node.js version checking
 *  - Phase 1 (prefer-offline) / Phase 2 (fresh) retry
 *  - Cached binary resolution (codex)
 *  - detached process spawning on Unix
 *
 * For all other backends this delegates to spawnGenericBackend().
 */

import type { AcpClient, ClientFactory } from '@process/acp/infra/IAcpClient';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import type { AgentConfig, ProtocolHandlers } from '@process/acp/types';
import {
  connectClaude,
  connectCodebuddy,
  connectCodex,
  spawnGenericBackend,
  type NpxConnectHooks,
  type SpawnResult,
} from '@process/agent/acp/acpConnectors';
import { AcpError } from '@process/acp/errors/AcpError';
import { isAcpLaunchSpec } from '@/common/types/acpTypes';
import type { ChildProcess } from 'node:child_process';

type BuiltinConnectFn = (
  cwd: string,
  hooks: NpxConnectHooks,
  customEnv?: Record<string, string>
) => Promise<void>;

const NPX_BACKENDS: Record<string, BuiltinConnectFn> = {
  codex: connectCodex,
  claude: connectClaude,
  codebuddy: connectCodebuddy,
};

export class LegacyConnectorFactory implements ClientFactory {
  create(config: AgentConfig, handlers: ProtocolHandlers): AcpClient {
    const spawnFn = () => spawnLegacyChild(config);
    return new ProcessAcpClient(spawnFn, { backend: config.agentBackend, handlers });
  }
}

/**
 * Extract just the child-process spawn from the old connector logic.
 * ProcessAcpClient manages stderr capture, lifecycle, and transport internally,
 * so we only need to produce the ChildProcess.
 */
async function spawnLegacyChild(config: AgentConfig): Promise<ChildProcess> {
  const backend = config.agentBackend;
  const cwd = config.cwd;

  // Shape-checked, not merely truthy: `launch` reaches here from the persisted
  // conversation `extra`, which is untyped JSON at runtime. A malformed descriptor
  // is treated as absent, so the legacy resolution below still applies and we
  // never spawn a partial one.
  const launch = isAcpLaunchSpec(config.launch) ? config.launch : undefined;

  // An agent WAYLAND INSTALLED wins over the npx bridge. NPX_BACKENDS is keyed by
  // backend name, so claude/codex/codebuddy used to short-circuit here before the
  // launch guard was ever reached: the installer's descriptor was discarded in
  // silence and a different binary (the npx-fetched bridge) ran instead. Those
  // three are exactly the backends K-05 ships an installer for.
  //
  // Preferring the descriptor over throwing is deliberate: the npx bridge is the
  // FALLBACK for a backend with no local install, and refusing to spawn would
  // make an installed claude/codex/codebuddy unusable outright. The trade is that
  // the npx-only preparation is skipped - for claude that means the cc-switch
  // provider env (readClaudeProviderEnvFromCcSwitch), and for codebuddy the
  // ~/.codebuddy/mcp.json `--mcp-config` argument. Neither describes the installed
  // agent, and spawnGenericBackend still applies `config.env` (the Flux routing
  // surface) exactly as connectNpxBackend does.
  //
  // PROVENANCE, not mere presence, is what earns that. A launch spec reaches here
  // from the persisted conversation `extra`, and `origin` is stamped in exactly
  // one place: `resolveManagedAgentLaunch`, reading an install receipt. A spec
  // that arrived any other way - a stale conversation whose install has since
  // been removed, a hand-edited `extra` - describes a binary Wayland cannot
  // vouch for, so the bridge stays in charge. A user's own PATH codex, which
  // never produces a spec at all, keeps the bridge it has always used.
  const fromWaylandInstall = launch?.origin === 'wayland-install';

  if (!fromWaylandInstall) {
    const npxConnect = NPX_BACKENDS[backend];
    if (npxConnect) {
      // Thread the per-spawn customEnv (e.g. the Flux routing surface:
      // ANTHROPIC_BASE_URL / ANTHROPIC_MODEL / CLAUDE_CONFIG_DIR for claude) into
      // the npx connector. Without this the bridge spawns with the user's native
      // env and ignores Flux routing entirely.
      return spawnViaNpxHooks(npxConnect, cwd, config.env);
    }
  }
  // An installed agent supplies `launch` ({ command, args }); everything else still
  // supplies a `command` string. Pass `launch` through so createGenericSpawnConfig
  // never re-parses it - `config.command` is ignored entirely when `launch` is set.
  if (launch || config.command) {
    const result = await spawnGenericBackend(backend, config.command ?? '', cwd, config.args, config.env, launch);
    return result.child;
  }
  throw new AcpError('CONNECTION_FAILED', `No CLI path for backend "${backend}"`, { retryable: false });
}

function spawnViaNpxHooks(
  connectFn: BuiltinConnectFn,
  cwd: string,
  customEnv?: Record<string, string>
): Promise<ChildProcess> {
  return new Promise<ChildProcess>((resolve, reject) => {
    let resolved = false;
    let lastChild: ChildProcess | null = null;

    const hooks: NpxConnectHooks = {
      setup: async (result: SpawnResult) => {
        if (!resolved) {
          resolved = true;
          lastChild = result.child;
          resolve(result.child);
        }
      },
      cleanup: async () => {
        if (lastChild) {
          try {
            lastChild.kill();
          } catch {
            /* already dead */
          }
          lastChild = null;
        }
      },
    };

    connectFn(cwd, hooks, customEnv).catch((err) => {
      if (!resolved) {
        reject(
          new AcpError('CONNECTION_FAILED', `Failed to connect: ${(err as Error).message}`, {
            cause: err,
            retryable: true,
          })
        );
      }
    });
  });
}
