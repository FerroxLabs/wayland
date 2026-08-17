/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The engine-`config.toml` read the Doctor's config-integrity check consumes.
 *
 * Extracted out of `registry.ts` for one reason: this is the SANITISATION point
 * for GHSA-2g2m-r86j-jg6h, and a security boundary that can only be exercised
 * through Electron singletons is a boundary nobody can test. It has no Electron
 * dependency, so `tests/unit/process/doctor/engineConfigParseErrorRedaction.test.ts`
 * drives it against a real corrupt file on disk.
 *
 * The sanitisation lives HERE, at the producer, not at the consumer: the raw
 * `smol-toml` message echoes the user's own config lines (their `api_key`s
 * among them), so stripping it inside one check would still leave it available
 * to the next consumer of this result. See `@process/utils/tomlErrorSummary`.
 */

import { access } from 'node:fs/promises';
import { readConfig, resolveUserConfigPath } from '@process/agent/wcore/configBridge';
import { summarizeTomlError, tomlErrorPosition } from '@process/utils/tomlErrorSummary';

/**
 * `'ok'` when the config parsed or is simply absent (a fresh install has none);
 * `'corrupt'` with a SANITISED reason plus the failure's position as numbers.
 */
export type EngineConfigProbeResult =
  | { status: 'ok'; existed: boolean }
  | { status: 'corrupt'; message: string; line?: number; column?: number };

/**
 * Read + parse the engine's user `config.toml`. Never throws, and never carries
 * any of the file's own bytes out - only the parser's one-line reason (scrubbed)
 * and the line/column numbers.
 *
 * @param path Optional override; defaults to the default profile's config.
 */
export async function probeEngineConfig(path: string = resolveUserConfigPath()): Promise<EngineConfigProbeResult> {
  let existed = true;
  try {
    await access(path);
  } catch {
    existed = false;
  }

  try {
    await readConfig(path);
    return { status: 'ok', existed };
  } catch (error) {
    const position = tomlErrorPosition(error);
    return {
      status: 'corrupt',
      message: summarizeTomlError(error),
      ...(position ? { line: position.line, column: position.column } : {}),
    };
  }
}
