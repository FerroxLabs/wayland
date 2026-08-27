/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1052 - the residual main-thread freeze in the engine-config recovery channel.
 *
 * #1031 bounded the REPAIR PLANNER with a cumulative parse budget, and that part
 * holds. What it could not bound is the parse `inspectEngineConfig` performs
 * BEFORE the planner ever runs: `findParseProblem(source)` parses the whole
 * document once, synchronously, with no budget at all, and the budget's deadline
 * is only ever checked BETWEEN parses so it cannot interrupt one that has
 * started. This channel auto-fires when the recovery panel mounts, on the
 * Electron MAIN thread, so that one parse freezes every window and all IPC.
 *
 * Measured on the Hetzner build box with smol-toml 1.6.1, one parse of one
 * document (no planner involved):
 *
 *     128 KB / 16k bare table headers ->  144 ms
 *     256 KB / 32k bare table headers ->   90 ms
 *     512 KB / 65k bare table headers ->  213 ms
 *     512 KB of inline tables         ->  300 ms
 *
 * That box is roughly 6-8x faster than the laptop #1052 was measured on, which
 * is where the reported 1.5-2 s comes from. Bounding the BYTES that reach the
 * parser is therefore what bounds the freeze, and the refusal it produces has an
 * existing, tested UI: the panel renders the reason, the resolved path, and the
 * unconditional "Show me the file" escape hatch.
 *
 * The second half is the FIFO named in the same issue: `readFileBytes` had no
 * timeout, so a `config.toml` that is a FIFO blocked the inspect call forever and
 * the panel rendered nothing at all. Executed, not assumed: the call did not
 * return within 10 s.
 */

import { describe, expect, it } from 'vitest';
import { inspectEngineConfig, type EngineConfigRecoveryDeps } from '@process/agent/wcore/engineConfigRecovery';

const CONFIG_PATH = '/scratch/wayland-core/config.toml';

function deps(overrides: Partial<EngineConfigRecoveryDeps> = {}): EngineConfigRecoveryDeps {
  return {
    resolveConfigPath: async () => CONFIG_PATH,
    readFileBytes: async () => Buffer.from('', 'utf-8'),
    writeFileExclusive: async () => {},
    renameFile: async () => {},
    isRegularFile: async () => true,
    removeFile: async () => {},
    now: () => new Date(0),
    ...overrides,
  };
}

/** ~512 KB of bare table headers - the shape #1052 measured at 1.5-2 s. */
function pathologicalHeaders(): string {
  let doc = '';
  for (let i = 0; i < 65_000; i += 1) doc += `[a${i}]\n`;
  return doc;
}

describe('#1052 inspectEngineConfig bounds its own parse', () => {
  it('refuses a document too large to parse on the main thread', async () => {
    const doc = pathologicalHeaders();
    expect(Buffer.byteLength(doc, 'utf-8')).toBeGreaterThan(512 * 1024);

    const started = Date.now();
    const result = await inspectEngineConfig(deps({ readFileBytes: async () => Buffer.from(doc, 'utf-8') }));
    const elapsed = Date.now() - started;

    // Not `ok` and not `invalid`: both of those are claims about the document's
    // TOML validity, and the whole point is that it was never parsed.
    expect(result.status).toBe('unreadable');
    expect(result).toMatchObject({ status: 'unreadable', path: CONFIG_PATH });
    // Generous, because a loaded box must not decide this - the bound being
    // asserted is "a linear pre-scan", which is single-digit milliseconds.
    expect(elapsed).toBeLessThan(500);
  });

  it('gives up on a config.toml whose read never returns (the FIFO case)', async () => {
    const result = await inspectEngineConfig(
      deps({
        readTimeoutMs: 50,
        readFileBytes: () => new Promise<Buffer>(() => {}),
      })
    );
    expect(result.status).toBe('unreadable');
  }, 3_000);

  it('KNOWN POSITIVE: an ordinary config is still parsed and reported exactly', async () => {
    // Proves the two refusals above are not simply "inspect always refuses".
    const ok = await inspectEngineConfig(
      deps({ readFileBytes: async () => Buffer.from('[security]\nenabled = false\n', 'utf-8') })
    );
    expect(ok).toEqual({ status: 'ok', path: CONFIG_PATH });

    const broken = await inspectEngineConfig(
      deps({ readFileBytes: async () => Buffer.from('[security]\nenabled = falseegress = []\n', 'utf-8') })
    );
    expect(broken.status).toBe('invalid');
  });

  it('KNOWN POSITIVE: a large-but-plausible config is still analysed', async () => {
    // The cap must not refuse a config a real user could actually have. 32 KB of
    // genuine tables is already ~6x the largest engine config observed.
    let doc = '';
    while (Buffer.byteLength(doc, 'utf-8') < 32 * 1024) {
      doc += `[mcp.server_${doc.length}]\ncommand = "npx"\nargs = ["-y", "some-package"]\n\n`;
    }
    const result = await inspectEngineConfig(deps({ readFileBytes: async () => Buffer.from(doc, 'utf-8') }));
    expect(result.status).toBe('ok');
  });
});
