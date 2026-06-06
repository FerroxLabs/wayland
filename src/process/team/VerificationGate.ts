// src/process/team/VerificationGate.ts
//
// P3 verification / hallucination gate.
//
// When a teammate proposes a task `completed`, the gate gets a second opinion
// from IJFW's cross-audit (`ijfw_cross_audit_converge`) before the completion
// is allowed to stand. On a real FAIL the task is sent back to `in_progress`
// with the critique attached; a 2nd consecutive fail raises a needs-human
// signal. The gate NEVER traps a task in `verifying`: any infra-unavailable
// window (IJFW installing / install_failed / offline / disabled / CI) or
// inconclusive verdict fails SOFT to `completed` with an advisory note.
//
// Contract notes (probed live against the real MCP tool):
//   - The tool is a git-diff auditor: it requires a `commitRange` string and
//     IGNORES any free-text claim/artifact. We derive the range from the task's
//     stamped start ref; with no ref we fail SOFT (a bogus range silently
//     returns PASS, which is worse than skipping).
//   - Trust a FAIL. Trust a PASS only when >= 1 lens actually ran
//     (perIteration[0].lensResults.length > 0); PASS-with-zero-lens is
//     inconclusive. consensus_failed / UNREACHABLE are inconclusive.
//   - Never pass `autoFix: true` - it mutates code with git commits.
import type { TeamTask } from './types';
import type { IjfwInvokeResult } from '@/common/types/ijfw';

/** Per-task / per-team gate policy. */
export type VerificationPolicy = 'off' | 'advisory' | 'blocking';

/** The IJFW MCP invoke surface the gate depends on (the live `ijfwMcpClient`). */
type IjfwInvoke = (
  verb: string,
  args?: Record<string, unknown>,
  opts?: { timeoutMs?: number }
) => Promise<IjfwInvokeResult>;

/** Shape of one converged finding returned by cross-audit. */
type CrossAuditFinding = {
  severity?: string;
  dimension?: string;
  location?: string;
  issue?: string;
  whyItMatters?: string;
  fix?: string;
  _lens?: string;
};

/** Top-level cross-audit result (after `unwrapMcpResult` JSON-parses it). */
type CrossAuditResult = {
  verdict?: 'PASS' | 'CONDITIONAL' | 'FAIL' | 'consensus_failed' | 'UNREACHABLE';
  findings?: CrossAuditFinding[];
  perIteration?: Array<{ lensResults?: Array<{ lens?: string; verdict?: string }> }>;
};

/** The verification record persisted onto `task.metadata.verification`. */
export type VerificationRecord = {
  /** Final gate outcome that was applied to the task. */
  outcome: 'pass' | 'fail' | 'advisory' | 'needs_human';
  /** Raw converge verdict, when one was produced. */
  verdict?: string;
  /** Human-readable note (advisory reasons, fail-soft cause). */
  note?: string;
  /** Converged findings, when the gate produced a FAIL. */
  critique?: CrossAuditFinding[];
  /** Count of consecutive verification failures for this task. */
  failCount: number;
  /** Set true once a 2nd consecutive fail escalates to a human. */
  needsHuman?: boolean;
  /** When the gate ran. */
  checkedAt: number;
};

/** What the gate tells `TaskManager.update` to do with the proposed completion. */
export type GateDecision =
  // Allow the completion through. `verification` is the record to persist.
  | { kind: 'complete'; verification: VerificationRecord }
  // Reject: send the task back to `in_progress` with the critique attached.
  | { kind: 'reject'; verification: VerificationRecord };

/**
 * Build the git commit range for a task from its stamped start ref. Returns
 * undefined when the task carries no ref (the gate then fails SOFT rather than
 * sending a bogus range - a nonexistent range silently returns PASS).
 *
 * Recognised metadata shapes (first match wins):
 *   - `metadata.startRef` / `metadata.headAtStart` -> `${ref}..HEAD`
 *   - `metadata.baseBranch` + `metadata.taskBranch` -> `${base}..${branch}`
 */
function buildCommitRange(task: TeamTask): string | undefined {
  const md = task.metadata ?? {};
  const startRef = typeof md.startRef === 'string' && md.startRef ? md.startRef : undefined;
  const headAtStart = typeof md.headAtStart === 'string' && md.headAtStart ? md.headAtStart : undefined;
  const ref = startRef ?? headAtStart;
  if (ref) return `${ref}..HEAD`;

  const baseBranch = typeof md.baseBranch === 'string' && md.baseBranch ? md.baseBranch : undefined;
  const taskBranch = typeof md.taskBranch === 'string' && md.taskBranch ? md.taskBranch : undefined;
  if (baseBranch && taskBranch) return `${baseBranch}..${taskBranch}`;

  return undefined;
}

/** Read the prior consecutive-fail count off the task's last verification record. */
function priorFailCount(task: TeamTask): number {
  const v = (task.metadata ?? {}).verification as VerificationRecord | undefined;
  return typeof v?.failCount === 'number' ? v.failCount : 0;
}

export class VerificationGate {
  /**
   * @param invoke      the IJFW MCP invoke surface (live `ijfwMcpClient.invoke`)
   * @param getPolicy   resolves the active policy for a task. Default `advisory`
   *                    (records the verdict, never blocks). `blocking` is opt-in
   *                    per team; even then, infra-unavailable fails SOFT.
   */
  constructor(
    private readonly invoke: IjfwInvoke,
    private readonly getPolicy: (task: TeamTask) => VerificationPolicy = () => 'advisory'
  ) {}

  /**
   * Run the gate for a task proposing `completed`. Returns a `GateDecision`.
   * Always resolves (never throws) so a verifying task is never trapped.
   */
  async verify(task: TeamTask): Promise<GateDecision> {
    const now = Date.now();
    const policy = this.getPolicy(task);

    // Policy `off`: no second opinion - complete straight through.
    if (policy === 'off') {
      return this.complete(now, { outcome: 'pass', failCount: 0, note: 'verification off' });
    }

    // Short-circuit before paying the spawn cost when IJFW is intentionally
    // unavailable (explicit opt-out or CI). Fail SOFT to advisory-complete.
    if (process.env.WAYLAND_DISABLE_IJFW === '1' || process.env.CI) {
      return this.failSoft(now, task, 'IJFW disabled (WAYLAND_DISABLE_IJFW / CI)');
    }

    const commitRange = buildCommitRange(task);
    if (!commitRange) {
      // No ref to audit. Do NOT send a bogus range (it silently passes).
      return this.failSoft(now, task, 'no commit range on task; cross-audit skipped');
    }

    // `blocking` ship/critical tasks get the full 3-lens default; `advisory`
    // runs a single cheap lens. autoFix stays false - the gate never mutates.
    const lenses = policy === 'blocking' ? undefined : ['claude'];
    let res: IjfwInvokeResult;
    try {
      res = await this.invoke('cross_audit_converge', {
        commitRange,
        maxIterations: 1,
        ...(lenses ? { lenses } : {}),
        autoFix: false,
      });
    } catch (error) {
      // The contract is for `invoke` to return `{ ok: false }` on infra failure,
      // but a thrown rejection must NOT escape (it would strand the task) - treat
      // it identically to infra-unavailable and fail SOFT.
      const message = error instanceof Error ? error.message : String(error);
      return this.failSoft(now, task, `IJFW invoke threw (${message})`);
    }

    // Infra-unavailable (spawn_error / mcp_crashed / timeout = installing /
    // install_failed / offline / respawn backoff). Fail SOFT either policy.
    if (res.ok === false) {
      return this.failSoft(now, task, `IJFW unavailable (${res.errorReason ?? 'unknown'})`);
    }

    const result = (res.data ?? {}) as CrossAuditResult;
    const verdict = result.verdict;
    const ranLenses = result.perIteration?.[0]?.lensResults?.length ?? 0;

    // Trust a FAIL. Trust PASS only when >= 1 lens actually ran (a PASS with
    // zero lens evidence is inconclusive - the lenses could not read the diff).
    if (verdict === 'FAIL') {
      return this.handleFail(now, task, verdict, result.findings ?? [], policy);
    }
    if (verdict === 'PASS' && ranLenses > 0) {
      return this.complete(now, { outcome: 'pass', verdict, failCount: 0 });
    }

    // CONDITIONAL / consensus_failed / UNREACHABLE / PASS-with-no-lens are all
    // inconclusive. Advisory records the verdict and completes; blocking also
    // completes here (only a real FAIL with a lens that ran rejects).
    return this.failSoft(now, task, `inconclusive verdict (${verdict ?? 'none'}, lenses ran: ${ranLenses})`);
  }

  /** A real FAIL. Blocking rejects back to `in_progress`; advisory completes. */
  private handleFail(
    now: number,
    task: TeamTask,
    verdict: string,
    findings: CrossAuditFinding[],
    policy: VerificationPolicy
  ): GateDecision {
    const failCount = priorFailCount(task) + 1;
    // A 2nd consecutive fail escalates to a human (the task stays off the
    // happy path; Mission Control surfaces `needsHuman` from this record).
    const needsHuman = failCount >= 2;

    if (policy === 'advisory') {
      // Advisory records the FAIL but does NOT block the completion.
      return this.complete(now, {
        outcome: 'advisory',
        verdict,
        critique: findings,
        failCount,
        note: 'cross-audit FAIL (advisory - not blocking)',
        ...(needsHuman ? { needsHuman: true } : {}),
      });
    }

    // Blocking: send the task back to `in_progress` with the critique attached.
    return {
      kind: 'reject',
      verification: {
        outcome: needsHuman ? 'needs_human' : 'fail',
        verdict,
        critique: findings,
        failCount,
        checkedAt: now,
        ...(needsHuman ? { needsHuman: true } : {}),
        note: needsHuman
          ? 'cross-audit FAIL twice - needs human review'
          : 'cross-audit FAIL - returned to in_progress',
      },
    };
  }

  /** Build a `complete` decision carrying the verification record. */
  private complete(now: number, record: Omit<VerificationRecord, 'checkedAt'>): GateDecision {
    return { kind: 'complete', verification: { ...record, checkedAt: now } };
  }

  /**
   * Fail SOFT: allow the completion through with an advisory note. The prior
   * consecutive-fail count is CARRIED (not reset): a skipped/inconclusive audit
   * must not let a transient IJFW outage launder a genuine prior blocking FAIL
   * into a clean completion, nor defeat the needs_human escalation.
   */
  private failSoft(now: number, task: TeamTask, note: string): GateDecision {
    return this.complete(now, { outcome: 'advisory', failCount: priorFailCount(task), note: `verification skipped: ${note}` });
  }
}
