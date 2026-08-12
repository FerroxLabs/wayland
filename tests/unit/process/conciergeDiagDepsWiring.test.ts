/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { ConciergeDiagDeps } from '@process/resources/builtinMcp/conciergeDiagServer';

/**
 * The gap that made three new diagnostics dead on arrival.
 *
 * `conciergeDiagServer` reads its paths from injected deps, falling back to env
 * vars. Every one of the 34 tests written alongside the voice, agent-install
 * and TVControl sections injected those deps DIRECTLY — so all 34 passed while
 * nothing in the app ever set them, and both new sections returned
 * "not available" in production. The tool description had already started
 * promising those sections to the model, which is worse than not offering them.
 *
 * A unit test cannot reach `resolveConciergeDiagDeps()` — it lives in
 * `initStorage`, which pulls Electron. So this guards the contract from the
 * other end: it pins the dep names the reader depends on, and the reader's own
 * fallback pins the env var names. If someone renames a field on one side, this
 * fails rather than silently returning "not available" forever.
 *
 * The names below MUST stay in step with:
 *   - the reader:  conciergeDiagServer.ts (`deps.X ?? process.env.Y`)
 *   - the writer:  initStorage.ts `resolveConciergeDiagDeps()` + `conciergeDiagEnv`
 */
describe('concierge diag dependency contract', () => {
  /** Every dep the reader consumes, and the env var it falls back to. */
  const CONTRACT: Array<[keyof ConciergeDiagDeps, string]> = [
    ['configPath', 'WAYLAND_CONFIG_PATH'],
    ['cronDbPath', 'WAYLAND_CRON_DB'],
    ['providerDbPath', 'WAYLAND_PROVIDER_DB'],
    ['workspaceDbPath', 'WAYLAND_WORKSPACE_DB'],
    ['logDir', 'WAYLAND_LOG_DIR'],
    ['appConfigDir', 'WAYLAND_APP_CONFIG_DIR'],
    ['engineConfigDir', 'WAYLAND_ENGINE_CONFIG_DIR'],
    ['voiceModelsDir', 'WAYLAND_VOICE_MODELS_DIR'],
    ['agentInstallRoot', 'WAYLAND_AGENT_INSTALL_ROOT'],
  ];

  it('names every dep the server reads, including the two added for voice and agent installs', () => {
    const names = CONTRACT.map(([dep]) => dep);
    expect(names).toContain('voiceModelsDir');
    expect(names).toContain('agentInstallRoot');
  });

  /**
   * Read the reader's own source and assert each pairing literally appears in
   * it. This is deliberately a source assertion rather than a behavioural one:
   * the failure being guarded against is a NAME going out of step between two
   * files, which no amount of injecting values can detect.
   */
  it('pairs each dep with the env var the server actually falls back to', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const path = await import('node:path');
    const here = path.dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(
      path.resolve(here, '../../../src/process/resources/builtinMcp/conciergeDiagServer.ts'),
      'utf-8'
    );

    for (const [dep, envVar] of CONTRACT) {
      expect(source, `${String(dep)} must fall back to ${envVar}`).toContain(
        `deps.${String(dep)} ?? process.env.${envVar}`
      );
    }
  });
});
