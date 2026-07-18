#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  candidateIdentity,
  copyRegularFile,
  exactKeys,
  fail,
  readJsonFile,
  regularFile,
  sha256,
  writeJson,
} = require('./acceptanceBundle');
const { verifySevereDependencyAudit } = require('./verifySevereDependencyAudit');

const UNTRUSTED_GATES = Object.freeze({
  tests: 'bun run test',
  typecheck: 'bunx tsc --noEmit',
  lint: 'bun run lint',
  build: 'bun run build:renderer:web',
});
const DEPENDENCY_GATE = Object.freeze({
  id: 'dependency-security',
  command: 'node ../trust-root/scripts/release-acceptance/verifySevereDependencyAudit.js dependency-audit.json',
});
const COMMIT = /^[0-9a-f]{40,64}$/;
const RUN_NUMBER = /^[1-9][0-9]*$/;
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function expectedContext(input) {
  const value = exactKeys(
    input,
    ['candidate', 'trustRootCommit', 'repository', 'workflowRef', 'runId', 'runAttempt', 'job'],
    'M8J_GATE_CONTEXT_INVALID'
  );
  const candidate = candidateIdentity(value.candidate, 'M8J_GATE_CONTEXT_INVALID');
  if (
    !COMMIT.test(String(value.trustRootCommit)) ||
    !REPOSITORY.test(String(value.repository)) ||
    value.workflowRef !==
      `${value.repository}/.github/workflows/release-acceptance-trust-root.yml@refs/heads/release-trust-v1` ||
    !RUN_NUMBER.test(String(value.runId)) ||
    !RUN_NUMBER.test(String(value.runAttempt)) ||
    value.job !== 'candidate-gates'
  ) {
    fail('M8J_GATE_CONTEXT_INVALID', 'malformed-context');
  }
  return { ...value, candidate };
}

function verifyHandoff(root, expected) {
  const file = readJsonFile(root, 'handoff.json', 'M8J_GATE_HANDOFF_INVALID');
  const handoff = exactKeys(
    file.value,
    ['contract', 'candidate', 'trustRoot', 'workflow', 'audit', 'gates'],
    'M8J_GATE_HANDOFF_INVALID'
  );
  const candidate = candidateIdentity(handoff.candidate, 'M8J_GATE_HANDOFF_INVALID');
  exactKeys(handoff.trustRoot, ['commit'], 'M8J_GATE_HANDOFF_INVALID');
  exactKeys(
    handoff.workflow,
    ['repository', 'ref', 'sha', 'workflowRef', 'runId', 'runAttempt', 'job'],
    'M8J_GATE_HANDOFF_INVALID'
  );
  exactKeys(handoff.audit, ['path', 'sha256'], 'M8J_GATE_HANDOFF_INVALID');
  if (
    handoff.contract !== 'wayland-untrusted-candidate-gates/1.0' ||
    candidate.commit !== expected.candidate.commit ||
    candidate.tree !== expected.candidate.tree ||
    handoff.trustRoot.commit !== expected.trustRootCommit ||
    handoff.workflow.repository !== expected.repository ||
    handoff.workflow.ref !== 'refs/heads/release-trust-v1' ||
    handoff.workflow.sha !== expected.trustRootCommit ||
    handoff.workflow.workflowRef !== expected.workflowRef ||
    String(handoff.workflow.runId) !== String(expected.runId) ||
    String(handoff.workflow.runAttempt) !== String(expected.runAttempt) ||
    handoff.workflow.job !== expected.job ||
    !Array.isArray(handoff.gates) ||
    handoff.gates.length !== Object.keys(UNTRUSTED_GATES).length
  ) {
    fail('M8J_GATE_HANDOFF_INVALID', 'stale-foreign-or-incomplete');
  }
  const audit = regularFile(root, handoff.audit.path, 'M8J_GATE_HANDOFF_INVALID');
  if (handoff.audit.path !== 'dependency-audit.json' || sha256(audit.bytes) !== handoff.audit.sha256) {
    fail('M8J_GATE_HANDOFF_INVALID', 'dependency-audit-digest-mismatch');
  }
  return { handoff, audit };
}

function promoteCandidateGateEvidence(sourceDirectory, outputDirectory, context) {
  const source = path.resolve(sourceDirectory);
  const output = path.resolve(outputDirectory);
  const expected = expectedContext(context);
  if (fs.existsSync(output)) fail('M8J_GATE_OUTPUT_INVALID', 'already-exists');
  fs.mkdirSync(output, { recursive: false, mode: 0o700 });

  const { handoff, audit } = verifyHandoff(source, expected);
  const seen = new Set();
  const promoted = [];
  for (const entry of handoff.gates) {
    exactKeys(entry, ['id', 'command', 'exitCode', 'logPath', 'logSha256'], 'M8J_GATE_HANDOFF_INVALID');
    if (
      !Object.prototype.hasOwnProperty.call(UNTRUSTED_GATES, entry.id) ||
      seen.has(entry.id) ||
      entry.command !== UNTRUSTED_GATES[entry.id] ||
      entry.exitCode !== 0 ||
      entry.logPath !== `${entry.id}.log`
    ) {
      fail('M8J_GATE_HANDOFF_INVALID', `red-foreign-or-duplicate:${entry.id}`);
    }
    const log = regularFile(source, entry.logPath, 'M8J_GATE_HANDOFF_INVALID');
    if (sha256(log.bytes) !== entry.logSha256) {
      fail('M8J_GATE_HANDOFF_INVALID', `log-digest-mismatch:${entry.id}`);
    }
    copyRegularFile(source, entry.logPath, output);
    promoted.push({ ...entry });
    seen.add(entry.id);
  }

  const clearance = verifySevereDependencyAudit(audit.absolute);
  const dependencyLog = Buffer.from(`${JSON.stringify(clearance)}\n`);
  fs.writeFileSync(path.join(output, 'dependency-security.log'), dependencyLog, { flag: 'wx', mode: 0o600 });
  promoted.push({
    ...DEPENDENCY_GATE,
    exitCode: 0,
    logPath: 'dependency-security.log',
    logSha256: sha256(dependencyLog),
  });
  writeJson(path.join(output, 'gate-results.json'), {
    contract: 'wayland-protected-release-gates/1.0',
    candidate: expected.candidate,
    gates: promoted,
  });
  return { candidate: expected.candidate, gates: promoted.length, output };
}

function parseArgs(argv) {
  const options = {};
  const known = new Set(['source', 'out', 'candidateCommit', 'candidateTree', 'trustRootCommit', 'repository', 'workflowRef', 'runId', 'runAttempt', 'job']);
  for (let index = 0; index < argv.length; index += 2) {
    const raw = argv[index];
    const value = argv[index + 1];
    const key = raw?.startsWith('--') ? raw.slice(2) : '';
    if (!known.has(key) || !value || value.startsWith('--')) fail('M8J_ARGUMENT_INVALID', raw || 'missing-value');
    options[key] = value;
  }
  for (const key of known) if (!options[key]) fail('M8J_ARGUMENT_INVALID', `missing:${key}`);
  return options;
}

module.exports = { DEPENDENCY_GATE, UNTRUSTED_GATES, promoteCandidateGateEvidence };

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    process.stdout.write(
      `${JSON.stringify(
        promoteCandidateGateEvidence(options.source, options.out, {
          candidate: { commit: options.candidateCommit, tree: options.candidateTree },
          trustRootCommit: options.trustRootCommit,
          repository: options.repository,
          workflowRef: options.workflowRef,
          runId: options.runId,
          runAttempt: options.runAttempt,
          job: options.job,
        })
      )}\n`
    );
  } catch (error) {
    process.stderr.write(`Candidate gate handoff rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}
