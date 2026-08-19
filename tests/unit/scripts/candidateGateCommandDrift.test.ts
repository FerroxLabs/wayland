import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const { UNTRUSTED_GATES } = require('../../../scripts/release-acceptance/promoteCandidateGateEvidence') as {
  UNTRUSTED_GATES: Record<string, string>;
};
const { REQUIRED_GATES } = require('../../../scripts/release-acceptance/produceProtectedAcceptanceEvidence') as {
  REQUIRED_GATES: Record<string, string>;
};

const workflow = readFileSync(
  join(__dirname, '..', '..', '..', '.github', 'workflows', 'release-acceptance-trust-root.yml'),
  'utf8'
);

// The gate command is written in three places: the workflow that runs it, the
// promotion step that admits its result, and the evidence producer that requires
// it. promoteCandidateGateEvidence refuses any entry whose command is not
// character-identical to its own copy, so a change to one of the three is a
// release-time failure and nothing else.
//
// That is not hypothetical. The workflow was corrected from `bunx tsc --noEmit`
// to `bun run typecheck` (a raw tsc runs out of heap without the NODE_OPTIONS
// that package.json sets) and both constants kept the old spelling. Because this
// whole path had never executed, no test and no run ever disagreed with it.
describe('candidate gate command drift', () => {
  const recorded = new Map(
    [...workflow.matchAll(/^\s*run_gate\s+(\S+)\s+'([^']+)'\s*$/gm)].map((match) => [match[1], match[2]])
  );

  it('finds the gates the workflow actually runs', () => {
    expect(recorded.size).toBeGreaterThan(0);
    expect([...recorded.keys()].sort()).toEqual(Object.keys(UNTRUSTED_GATES).sort());
  });

  it('runs exactly the command the promotion step will admit', () => {
    for (const [id, command] of recorded) {
      expect(`${id}=${command}`).toBe(`${id}=${UNTRUSTED_GATES[id]}`);
    }
  });

  it('keeps the promoted and required gate commands identical', () => {
    for (const [id, command] of Object.entries(UNTRUSTED_GATES)) {
      expect(`${id}=${REQUIRED_GATES[id]}`).toBe(`${id}=${command}`);
    }
  });

  it('requires the dependency gate on top of the untrusted ones', () => {
    expect(Object.keys(REQUIRED_GATES).sort()).toEqual([...Object.keys(UNTRUSTED_GATES), 'dependency-security'].sort());
  });
});
