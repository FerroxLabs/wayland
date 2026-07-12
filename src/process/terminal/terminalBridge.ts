/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Terminal mode — main-process bridge. Spawns and drives one PTY per
 * (chat, terminal tab), running that chat's agent CLI in its native TUI.
 *
 * Two guards, defense-in-depth:
 *  1. LOCAL-ONLY. Enforced by name at the WS wire: bridgeAllowlist denies the
 *     whole `terminal.*` namespace to remote peers (a buildProvider handler has
 *     no per-call remote signal, so this is the correct enforcement point). A
 *     remote peer therefore never reaches these handlers at all.
 *  2. FEATURE-FLAG (backend). `open` re-reads `terminal.enabled` from
 *     ProcessConfig and refuses when off — UI hiding is convenience, this is the
 *     control.
 * The command is resolved entirely main-side from `sessionId` (no renderer argv).
 */
import { existsSync } from 'node:fs';
import * as os from 'node:os';
import { ipcBridge } from '@/common';
import { getEnhancedEnv } from '@process/utils/shellEnv';
import { SqliteConversationRepository } from '@process/services/database/SqliteConversationRepository';
import { isTerminalModeEnabled } from './terminalConfig';
import { ProfileIsolationError, resolveActiveConfigDir } from '@process/agent/wcore/profilePaths';
import { resolveTerminalCommand } from './terminalCommand';
import { resolveCommandPath } from './terminalPath';
import { forgetPty, getPty, hasPty, killPty, livePtyCount, registerPty } from './terminalRegistry';

/** Bound concurrent PTYs to keep resource use sane (spec §5). */
const MAX_TERMINALS = 8;

const conversationRepo = new SqliteConversationRepository();

export function initTerminalBridge(): void {
  ipcBridge.terminal.open.provider(async ({ terminalId, sessionId, cols, rows }) => {
    // Guard 2: backend feature-flag check (guard 1, local-only, is enforced at
    // the WS wire before we get here).
    if (!(await isTerminalModeEnabled())) return { ok: false, reason: 'disabled' } as const;

    // Lazy-load the native PTY addon ONLY when the terminal feature is actually
    // used. Terminal mode is off by default; a static top-level import would run
    // the native `require('@lydell/node-pty')` during main-bundle evaluation, and
    // a load failure there (incompatible glibc/musl, missing prebuild arch, AV
    // quarantine of pty.node) would throw before any window exists and brick
    // launch for everyone. Loading it here, behind the flag and in a try/catch,
    // contains any native-load failure to the terminal feature.
    let spawn: typeof import('@lydell/node-pty').spawn;
    try {
      ({ spawn } = await import('@lydell/node-pty'));
    } catch (err) {
      console.error('[terminal] node-pty native module failed to load:', err);
      return { ok: false, reason: 'unsupported' } as const;
    }

    // Re-opening an already-live terminal is a no-op success (idempotent mount).
    if (hasPty(terminalId)) return { ok: true } as const;

    if (livePtyCount() >= MAX_TERMINALS) return { ok: false, reason: 'at-capacity' } as const;

    // Resolve the command entirely from the session — the renderer supplies no argv.
    const conversation = await conversationRepo.getConversation(sessionId);
    if (!conversation) return { ok: false, reason: 'not-found' } as const;

    const spec = resolveTerminalCommand(conversation);
    if (!spec) return { ok: false, reason: 'unsupported' } as const;

    const env = getEnhancedEnv();

    // #278: the `wcore` terminal launches the ENGINE binary itself, so it is an
    // engine spawn and the WAYLAND_HOME contract binds it exactly as it binds the
    // --json-stream spawn. getEnhancedEnv() is the user's SHELL env, which never
    // carries WAYLAND_HOME - so without this the TUI resolves the engine's DEFAULT
    // home no matter which profile is active, and then READS AND WRITES there
    // (config.toml, memory.db, credentials). That is a live cross-profile bleed,
    // and a nastier one than the spawn path because the TUI writes.
    //
    // Fail closed only on ProfileIsolationError (a named profile we cannot resolve);
    // a default-branch fault must not block the terminal. See resolveActiveConfigDir.
    if (conversation.type === 'wcore') {
      try {
        env.WAYLAND_HOME = await resolveActiveConfigDir();
      } catch (err) {
        if (err instanceof ProfileIsolationError) {
          console.error('[terminal] refusing to launch the engine TUI:', err.message);
          return { ok: false, reason: 'profile-unresolved' } as const;
        }
        console.warn('[terminal] Failed to resolve the active profile config dir:', err);
      }
    }

    const commandPath = resolveCommandPath(spec.command, env);
    if (!commandPath) return { ok: false, reason: 'missing-cli' } as const;

    const cwd = spec.cwd && existsSync(spec.cwd) ? spec.cwd : os.homedir();

    let pty;
    try {
      pty = spawn(commandPath, spec.args, {
        name: 'xterm-color',
        cols: cols && cols > 0 ? cols : 80,
        rows: rows && rows > 0 ? rows : 24,
        cwd,
        env,
      });
    } catch (err) {
      console.error('[terminal] PTY spawn failed:', err);
      return { ok: false, reason: 'missing-cli' } as const;
    }

    registerPty(terminalId, pty);
    pty.onData((data) => ipcBridge.terminal.output.emit({ terminalId, data }));
    pty.onExit(({ exitCode }) => {
      forgetPty(terminalId);
      ipcBridge.terminal.exit.emit({ terminalId, exitCode });
    });

    return { ok: true } as const;
  });

  ipcBridge.terminal.input.provider(async ({ terminalId, data }) => {
    const pty = getPty(terminalId);
    if (pty) pty.write(data);
  });

  ipcBridge.terminal.resize.provider(async ({ terminalId, cols, rows }) => {
    if (cols <= 0 || rows <= 0) return;
    const pty = getPty(terminalId);
    if (!pty) return;
    try {
      pty.resize(cols, rows);
    } catch (err) {
      // A resize racing PTY exit can throw; harmless.
      console.warn('[terminal] resize failed:', err);
    }
  });

  ipcBridge.terminal.close.provider(async ({ terminalId }) => {
    killPty(terminalId);
  });
}
