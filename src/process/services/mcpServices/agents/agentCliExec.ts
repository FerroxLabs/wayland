/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { execErrorDetail, safeExecFile } from '@process/utils/safeExec';
import { getEnhancedEnv } from '@process/utils/shellEnv';
import { agentConfigCliEnv } from '../agentConfigRoot';

type ExecResult = { stdout: string; stderr: string };

/**
 * How long ONE `<agent> mcp add|remove` call gets.
 *
 * Replaces a hard-coded `timeout: 5000` that appeared at fifteen call sites
 * across these adapters and was never justified by a measurement. It is how
 * the user's failure happened: a removal reported
 * `claude:Claude Code: user/com.ferroxlabs-tvcontrol: failed: Command timed
 * out after 5000ms` on a healthy server with 105 reachable tools.
 *
 * MEASURED, not guessed. 2026-08-23, macOS 10-core at load average 39 (the
 * realistic condition - several agents running), 64 alternating add/remove
 * calls against the REAL `claude`, `qwen`, `gemini` and `codex` binaries in a
 * redirected home (see {@link agentConfigCliEnv}), every call rc=0:
 *
 *     command          n     min     med     max
 *     claude-add       8     819     978    1469
 *     claude-remove    8     804     858    1240
 *     codex-add        8     118     224     884
 *     codex-remove     8     111     140     911
 *     gemini-add       8    1375    1834    2798
 *     gemini-remove    8    1455    1649    7524   <-
 *     qwen-add         8     894    1021    2218
 *     qwen-remove      8     855    1049    1777
 *     ALL             64     111     965    7524   p95 1927
 *
 * One call in 64 (1.6%) exceeded 5,000 ms. A single user action fans out to
 * roughly eight such calls, so ~12% of user actions would hit that wall - one
 * in eight, which is the rate the user actually experienced. The wall was
 * BELOW the observed cost of the call it guarded, so it was a coin flip.
 *
 * 15,000 ms is 2.0x the observed worst call and 15x the median. It is
 * deliberately NOT the class-level 30,000 ms budget: with one retry (below)
 * the worst case must still fit inside
 * `MCP_AGENT_PUBLICATION_DEADLINE_MS` (45,000 ms), and 2 x 30,000 does not.
 */
export const MCP_AGENT_CLI_TIMEOUT_MS = 15_000;

/** Pause before the single retry. Short: this is contention, not rate limiting. */
export const MCP_AGENT_CLI_RETRY_BACKOFF_MS = 500;

/**
 * A timeout is NOT a failure - it is an UNKNOWN.
 *
 * The child was killed mid-flight, so we do not know whether it wrote. That is
 * a different fact from "the CLI answered and said no", and the two must never
 * be reported with the same words.
 */
export function isAgentCliTimeout(error: unknown): boolean {
  const e = error as { killed?: boolean; message?: string };
  if (e?.killed === true) return true;
  return typeof e?.message === 'string' && /timed out after \d+ms/.test(e.message);
}

/**
 * Standard environment for an agent CLI call: the enhanced PATH (so the CLI is
 * found when Wayland was launched from Finder/launchd), colour and
 * `NODE_OPTIONS` neutralised, and every home-ish variable redirected when an
 * agent-config sandbox is in force.
 */
export function agentCliFailureDetail(error: unknown): string {
  // `execErrorDetail` has no exit code to report for a killed child, so it
  // prefixes the line "failed:". A timeout is not a failure, and that word must
  // not travel with it.
  if (isAgentCliTimeout(error)) return `no answer within ${MCP_AGENT_CLI_TIMEOUT_MS}ms`;
  return execErrorDetail(error);
}

export function agentCliEnv(): NodeJS.ProcessEnv {
  return agentConfigCliEnv({
    ...getEnhancedEnv(),
    NODE_OPTIONS: '',
    TERM: 'dumb',
    NO_COLOR: '1',
  } as NodeJS.ProcessEnv);
}

/**
 * Run one agent-CLI command under the measured budget, retrying ONCE on a
 * timeout and only on a timeout.
 *
 * Retrying is safe here for exactly one reason, and it is the same reason this
 * lane does not do all-or-nothing rollback: every operation these adapters
 * perform is IDEMPOTENT. Publication is an upsert (`claude mcp add-json`
 * refuses a duplicate name, so its adapter removes-then-adds); removal by name
 * is a delete whose second application is a no-op. A retry therefore CONVERGES.
 * It never compounds, and it never doubles an entry.
 *
 * A non-timeout failure is NOT retried. The CLI answered - "unsupported
 * transport", "invalid name", a parse error in the user's own config - and
 * running it again produces the same answer more slowly.
 */
export async function runAgentCli(
  file: string,
  args: string[],
  options: { env?: NodeJS.ProcessEnv; timeout?: number; retries?: number } = {}
): Promise<ExecResult> {
  const timeout = options.timeout ?? MCP_AGENT_CLI_TIMEOUT_MS;
  const retries = options.retries ?? 1;
  const env = options.env ?? agentCliEnv();

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await safeExecFile(file, args, { timeout, env });
    } catch (error) {
      lastError = error;
      if (!isAgentCliTimeout(error) || attempt === retries) throw error;
      console.warn(
        `[mcp] ${file} ${args[0] ?? ''} ${args[1] ?? ''} timed out after ${timeout}ms; retrying once in ${MCP_AGENT_CLI_RETRY_BACKOFF_MS}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, MCP_AGENT_CLI_RETRY_BACKOFF_MS));
    }
  }
  throw lastError;
}

/**
 * What one scope of one agent told us about a removal.
 *
 * `absent` is the one that has been reported wrongly everywhere. Removing
 * something that is already gone is the goal state - the user asked for it not
 * to be there and it is not there. It is a SUCCESS. Reporting it as a failure
 * is what put "Server not found in project settings" inside a red
 * "removal partially failed" banner.
 */
export type RemovalSignal = 'removed' | 'absent' | 'unknown' | 'error';

export interface RemovalScopeReport {
  /** Human-facing scope label, e.g. `user`, `project`. */
  scope: string;
  signal: RemovalSignal;
  /** The CLI's own words. Only used when the aggregate is not a success. */
  detail?: string;
}

/**
 * Collapse per-scope removal signals into one honest per-agent result.
 *
 * Precedence, and the reason for each step:
 *
 *  1. `removed` wins outright. We saw it go. Nothing else can downgrade that.
 *  2. `unknown` beats `error`. A scope we could not reach means the removal is
 *     NOT PROVEN, so the operation has to stay retryable; a retry converges
 *     because removal by name is idempotent. Reporting "failed" here would
 *     both overstate what we know and strand the user with no next step.
 *  3. `error` - the CLI answered with a real problem. Surface its words.
 *  4. all `absent` - it was not there in any scope. Success.
 */
export function aggregateRemovalSignals(
  agentLabel: string,
  reports: readonly RemovalScopeReport[]
): { success: boolean; outcome: 'applied' | 'already-absent' | 'timed-out' | 'failed'; error?: string } {
  if (reports.some((r) => r.signal === 'removed')) {
    return { success: true, outcome: 'applied' };
  }

  // An unknown scope is rendered in OUR words, never `execErrorDetail`'s. That
  // helper prefixes a killed child with "failed:" (there is no exit code to
  // report), and the whole point of this classification is that a timeout is
  // not a failure. Leaking the word back into the sentence undoes it.
  const details = reports
    .filter((r) => r.signal === 'unknown' || r.signal === 'error')
    .map((r) => (r.signal === 'unknown' ? `${r.scope}: no answer` : `${r.scope}: ${r.detail ?? r.signal}`))
    .join('; ');

  if (reports.some((r) => r.signal === 'unknown')) {
    return {
      success: false,
      outcome: 'timed-out',
      error: `${agentLabel} did not answer in time, so its config was left unchanged and unverified. Retry the removal. (${details})`,
    };
  }

  if (reports.some((r) => r.signal === 'error')) {
    return { success: false, outcome: 'failed', error: details };
  }

  return { success: true, outcome: 'already-absent' };
}

/**
 * Collapse a publication's per-server failures into one honest per-agent
 * result. `timedOut` is tracked separately from `failures` for the same reason
 * removal separates `unknown` from `error`: a killed child is an unknown, not
 * a refusal, and the user's next step is "retry", not "fix something".
 */
export function aggregatePublicationFailures(
  agentLabel: string,
  failures: readonly string[],
  timedOut: boolean
): { success: boolean; outcome: 'applied' | 'timed-out' | 'failed'; error?: string } {
  if (failures.length === 0) return { success: true, outcome: 'applied' };
  if (timedOut) {
    return {
      success: false,
      outcome: 'timed-out',
      error: `${agentLabel} did not answer in time, so its config may or may not have been updated. Retry - republishing is safe. (${failures.join('; ')})`,
    };
  }
  return { success: false, outcome: 'failed', error: failures.join('; ') };
}
