import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const {
  UNTRUSTED_GATES,
  promoteCandidateGateEvidence,
} = require('../../../scripts/release-acceptance/promoteCandidateGateEvidence') as {
  UNTRUSTED_GATES: Record<string, string>;
  promoteCandidateGateEvidence: (
    source: string,
    output: string,
    context: Record<string, unknown>
  ) => Record<string, unknown>;
};
const { sha256 } = require('../../../scripts/release-acceptance/acceptanceBundle') as {
  sha256: (bytes: Buffer) => string;
};

const roots: string[] = [];
const candidate = { commit: 'a'.repeat(40), tree: 'b'.repeat(40) };
const context = {
  candidate,
  trustRootCommit: 'c'.repeat(40),
  repository: 'FerroxLabs/wayland',
  workflowRef:
    'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml@refs/heads/release-trust-v1',
  runId: '12345',
  runAttempt: '1',
  job: 'candidate-gates',
};

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture(audit: unknown = { safe: [{ id: 1, severity: 'moderate' }] }) {
  const root = mkdtempSync(join(tmpdir(), 'wayland-untrusted-gates-'));
  roots.push(root);
  const gates = Object.entries(UNTRUSTED_GATES).map(([id, command]) => {
    const bytes = Buffer.from(`${id} passed\n`);
    writeFileSync(join(root, `${id}.log`), bytes);
    return { id, command, exitCode: 0, logPath: `${id}.log`, logSha256: sha256(bytes) };
  });
  const auditBytes = Buffer.from(`${JSON.stringify(audit)}\n`);
  writeFileSync(join(root, 'dependency-audit.json'), auditBytes);
  const handoff = {
    contract: 'wayland-untrusted-candidate-gates/1.0',
    candidate,
    trustRoot: { commit: context.trustRootCommit },
    workflow: {
      repository: context.repository,
      ref: 'refs/heads/release-trust-v1',
      sha: context.trustRootCommit,
      workflowRef: context.workflowRef,
      runId: context.runId,
      runAttempt: context.runAttempt,
      job: context.job,
    },
    audit: { path: 'dependency-audit.json', sha256: sha256(auditBytes) },
    gates,
  };
  writeFileSync(join(root, 'handoff.json'), `${JSON.stringify(handoff)}\n`);
  return { root, handoff };
}

describe('protected release trust-root job separation', () => {
  it('grants signing authority only to a job that never executes candidate lifecycle or package commands', () => {
    const workflow = parse(readFileSync('.github/workflows/release-acceptance-trust-root.yml', 'utf8'));
    expect(workflow.permissions).toEqual({ actions: 'read', contents: 'read' });

    const candidateJob = workflow.jobs['candidate-gates'];
    const finalJob = workflow.jobs['final-acceptance'];
    expect(candidateJob.permissions).toEqual({ actions: 'read', contents: 'read' });
    expect(candidateJob.permissions).not.toHaveProperty('id-token');
    expect(candidateJob.permissions).not.toHaveProperty('attestations');
    expect(candidateJob.env.ACTIONS_ID_TOKEN_REQUEST_URL).toBe('');
    expect(candidateJob.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN).toBe('');
    expect(finalJob.needs).toBe('candidate-gates');
    expect(finalJob.permissions).toMatchObject({ 'id-token': 'write', attestations: 'write' });

    const candidateRuns = candidateJob.steps.map((step: any) => step.run || '').join('\n');
    const finalRuns = finalJob.steps.map((step: any) => step.run || '').join('\n');
    expect(candidateRuns).toContain('bun install --frozen-lockfile');
    expect(candidateRuns).toContain("run_gate tests 'bun run test'");
    expect(candidateRuns).toContain("run_gate build 'bun run build:renderer:web'");
    expect(finalRuns).not.toMatch(/\b(?:bun|npm|pnpm|yarn)\s+(?:install|run|x|exec)\b/);
    expect(finalRuns).not.toContain('candidate/package.json');
    expect(
      finalJob.steps
        .filter((step: any) => step['working-directory'] === 'candidate')
        .map((step: any) => step.name)
    ).toEqual(['Verify candidate data identity and immutability']);

    const candidateActions = candidateJob.steps.map((step: any) => step.uses || '').join('\n');
    const finalActions = finalJob.steps.map((step: any) => step.uses || '').join('\n');
    expect(candidateActions).not.toContain('actions/attest-build-provenance');
    expect(finalActions).toContain('actions/attest-build-provenance');
  });

  it('authenticates the exact same-run gate artifact before protected promotion', () => {
    const workflow = readFileSync('.github/workflows/release-acceptance-trust-root.yml', 'utf8');
    expect(workflow).toContain('artifact-ids: ${{ needs.candidate-gates.outputs.artifact-id }}');
    expect(workflow).toContain('.workflow_run.id | tostring');
    expect(workflow).toContain(".workflow_run.head_sha");
    expect(workflow).toContain(".digest");
    expect(workflow).toContain('promoteCandidateGateEvidence.js');
    expect(workflow).toContain('--runId "$GITHUB_RUN_ID"');
    expect(workflow).toContain('--candidateCommit "$CANDIDATE_REF"');
    expect(workflow).toContain('--candidateTree "$CANDIDATE_TREE"');
  });

  it('promotes only exact candidate gate bytes and runs dependency authority in protected code', () => {
    const { root } = fixture();
    const output = join(root, 'promoted');
    const result = promoteCandidateGateEvidence(root, output, context);
    expect(result).toMatchObject({ candidate, gates: 5 });
    const receipt = JSON.parse(readFileSync(join(output, 'gate-results.json'), 'utf8'));
    expect(receipt.contract).toBe('wayland-protected-release-gates/1.0');
    expect(receipt.gates.map((gate: any) => gate.id)).toEqual([
      'tests',
      'typecheck',
      'lint',
      'build',
      'dependency-security',
    ]);
    expect(readFileSync(join(output, 'dependency-security.log'), 'utf8')).toContain(
      'wayland-severe-dependency-clearance/1.0'
    );
  });

  it('fails closed on stale workflow identity, tampered logs, and severe dependency findings', () => {
    const stale = fixture();
    expect(() =>
      promoteCandidateGateEvidence(stale.root, join(stale.root, 'stale-out'), {
        ...context,
        runId: '99999',
      })
    ).toThrow(/M8J_GATE_HANDOFF_INVALID:stale-foreign-or-incomplete/);

    const tampered = fixture();
    writeFileSync(join(tampered.root, 'tests.log'), 'forged\n');
    expect(() =>
      promoteCandidateGateEvidence(tampered.root, join(tampered.root, 'tampered-out'), context)
    ).toThrow(/M8J_GATE_HANDOFF_INVALID:log-digest-mismatch:tests/);

    const severe = fixture({ vulnerable: [{ id: 7, severity: 'high' }] });
    expect(() =>
      promoteCandidateGateEvidence(severe.root, join(severe.root, 'severe-out'), context)
    ).toThrow(/M8I_SEVERE_DEPENDENCY_FINDINGS/);
  });

  it('rejects unknown fields and symlinked evidence from the untrusted job', () => {
    const extra = fixture();
    extra.handoff.workflow.escalate = true;
    writeFileSync(join(extra.root, 'handoff.json'), `${JSON.stringify(extra.handoff)}\n`);
    expect(() => promoteCandidateGateEvidence(extra.root, join(extra.root, 'extra-out'), context)).toThrow(
      /M8J_GATE_HANDOFF_INVALID:missing-or-unknown-critical-field/
    );

    const linked = fixture();
    rmSync(join(linked.root, 'tests.log'));
    mkdirSync(join(linked.root, 'outside'));
    writeFileSync(join(linked.root, 'outside', 'tests.log'), 'tests passed\n');
    require('node:fs').symlinkSync(join(linked.root, 'outside', 'tests.log'), join(linked.root, 'tests.log'));
    expect(() => promoteCandidateGateEvidence(linked.root, join(linked.root, 'linked-out'), context)).toThrow(
      /M8J_GATE_HANDOFF_INVALID:not-regular-file:tests.log/
    );
  });
});
