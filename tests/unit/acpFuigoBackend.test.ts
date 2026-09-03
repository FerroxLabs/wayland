import { describe, it, expect } from 'vitest';
import { ACP_BACKENDS_ALL, ACP_ENABLED_BACKENDS } from '@/common/types/acpTypes';

/**
 * Fuigo is a first-party Rust agent that speaks ACP natively
 * (agent-client-protocol 0.10.4) over `fuigo acp stdio`.
 *
 * The assertions that matter here are the two DELIBERATE OMISSIONS, because
 * both look like oversights to anyone tidying this table later.
 */
describe('acpTypes - fuigo backend', () => {
  const fuigo = ACP_BACKENDS_ALL.fuigo;

  it('launches native ACP over stdio with no bridge', () => {
    expect(fuigo).toBeDefined();
    expect(fuigo.id).toBe('fuigo');
    expect(fuigo.cliCommand).toBe('fuigo');
    // `fuigo acp stdio` - taken from the agent's own run script, not guessed.
    expect(fuigo.acpArgs).toEqual(['acp', 'stdio']);
    expect(fuigo.supportsStreaming).toBe(true);
    expect(fuigo.authRequired).toBe(false);
    expect(ACP_ENABLED_BACKENDS.fuigo).toBeDefined();
  });

  it('carries NO npx fallback, because Fuigo has no Windows ARM package', () => {
    // `fuigo@1.0.2` lists `fuigo-win32-arm64` in optionalDependencies and that
    // package DOES NOT EXIST - npm refuses to create an unscoped name holding
    // the token `win32-arm64`. The real binary is at the scoped
    // `@fuigo/win32-arm64`, but the package name is COMPUTED from
    // `${process.platform}-${process.arch}`, so nothing resolves it until the
    // upstream 1.0.3 alias ships.
    //
    // Wayland ships a win-arm64 installer. An npx fallback would install
    // nothing there and fail at SPAWN, which is strictly worse than the agent
    // simply not being detected. Restore this only once 1.0.3 is published.
    expect(fuigo.defaultCliPath).toBeUndefined();
  });

  it('routes at Flux through its own config file, not the environment', () => {
    // Not 'env' like wnano: Fuigo takes no base URL from the environment. It
    // reads `[model.*]` blocks from config.toml, each carrying `base_url` and
    // `env_key = "FUIGO_API_KEY"`, so a connector must WRITE that file.
    //
    // Whoever writes it must set an explicit `context_window` per tier. Fuigo
    // assumes 200k when it is absent; a Flux lane can route to a 128k backend,
    // auto-compaction then never fires, and one such session grew to 17M
    // cumulative input tokens.
    expect(fuigo.fluxCompat).toBe('setup');
  });

  it('does not claim native skills discovery it has not been proven to have', () => {
    expect(fuigo.skillsDirs).toBeUndefined();
  });
});
