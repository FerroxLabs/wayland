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
const { CAPABILITIES, expectedEvidence } = require('./collectRawAcceptanceEvidence');
const matrix = require('./verifyHardeningMatrix');
const { verifyPlatformPackageSmoke } = require('./verifyPlatformPackageSmokes');
const { verifyUpdaterObservation } = require('./verifyUpdaterObservation');

const REQUIRED_GATES = Object.freeze({
  tests: 'bun run test',
  typecheck: 'bunx tsc --noEmit',
  lint: 'bun run lint',
  build: 'bun run build:renderer:web',
  'dependency-security':
    'node ../trust-root/scripts/release-acceptance/verifySevereDependencyAudit.js dependency-audit.json',
});

function parseArgs(argv) {
  const options = {};
  const known = new Map([
    ['--raw', 'raw'],
    ['--gates', 'gates'],
    ['--out', 'out'],
  ]);
  for (let index = 0; index < argv.length; index += 2) {
    const key = known.get(argv[index]);
    const value = argv[index + 1];
    if (!key || !value || value.startsWith('--')) fail('M8I_ARGUMENT_INVALID', argv[index] || 'missing-value');
    options[key] = value;
  }
  if (!options.raw || !options.gates || !options.out) fail('M8I_ARGUMENT_INVALID', 'raw-gates-and-out-required');
  return options;
}

function gateFor(kind, id) {
  if (kind === 'hardening-gate') {
    if (id === 'dependency-security' || id === 'security') return 'dependency-security';
    if (id === 'bundle' || id === 'packaging' || id === 'performance') return 'build';
    if (id === 'localization' || id === 'accessibility') return 'lint';
  }
  if (kind === 'criterion' && ['SC-06A', 'SC-06B', 'SC-06C', 'SC-06D'].includes(id)) return 'typecheck';
  return 'tests';
}

function verifyGateResults(gatesRoot, candidate) {
  const resultFile = readJsonFile(gatesRoot, 'gate-results.json', 'M8I_GATE_RESULTS_INVALID');
  const result = exactKeys(resultFile.value, ['contract', 'candidate', 'gates'], 'M8I_GATE_RESULTS_INVALID');
  const observedCandidate = candidateIdentity(result.candidate, 'M8I_GATE_RESULTS_INVALID');
  if (
    result.contract !== 'wayland-protected-release-gates/1.0' ||
    observedCandidate.commit !== candidate.commit ||
    observedCandidate.tree !== candidate.tree ||
    !Array.isArray(result.gates) ||
    result.gates.length !== Object.keys(REQUIRED_GATES).length
  ) {
    fail('M8I_GATE_RESULTS_INVALID', 'contract-candidate-or-coverage');
  }
  const gates = new Map();
  for (const entry of result.gates) {
    exactKeys(entry, ['id', 'command', 'exitCode', 'logPath', 'logSha256'], 'M8I_GATE_RESULTS_INVALID');
    if (
      !Object.prototype.hasOwnProperty.call(REQUIRED_GATES, entry.id) ||
      gates.has(entry.id) ||
      entry.command !== REQUIRED_GATES[entry.id] ||
      entry.exitCode !== 0
    ) {
      fail('M8I_GATE_RESULTS_INVALID', `red-foreign-or-duplicate:${entry.id}`);
    }
    const log = regularFile(gatesRoot, entry.logPath, 'M8I_GATE_RESULTS_INVALID');
    if (sha256(log.bytes) !== entry.logSha256) fail('M8I_GATE_RESULTS_INVALID', `log-digest-mismatch:${entry.id}`);
    gates.set(entry.id, { ...entry, logAbsolutePath: log.absolute });
  }
  return gates;
}

function sameCandidate(observed, expected, code) {
  const candidate = candidateIdentity(observed, code);
  if (candidate.commit !== expected.commit || candidate.tree !== expected.tree) {
    fail(code, 'stale-or-foreign-candidate');
  }
}

function copyUpdaterObservation(rawRoot, output, target, candidate, verifier) {
  const observationRelative = `updater-observations/${target}/observation.json`;
  const observationFile = readJsonFile(rawRoot, observationRelative, 'M8I_UPDATER_OBSERVATION_INVALID');
  const observation = observationFile.value;
  exactKeys(
    observation,
    [
      'contract',
      'candidate',
      'target',
      'nonce',
      'startedAt',
      'completedAt',
      'expiresAt',
      'observer',
      'candidateArtifact',
      'rollbackArtifact',
      'packageSmoke',
      'runtimeEvents',
      'stateSnapshots',
    ],
    'M8I_UPDATER_OBSERVATION_INVALID'
  );
  sameCandidate(observation.candidate, candidate, 'M8I_UPDATER_OBSERVATION_INVALID');
  if (
    observation.contract !== 'wayland-updater-packaged-observation/1.0' ||
    observation.target !== target ||
    !observation.observer ||
    observation.observer.authority !== 'nonce-bound-packaged-runtime-observer'
  ) {
    fail('M8I_UPDATER_OBSERVATION_INVALID', target);
  }

  let trusted;
  try {
    trusted = verifier({ observationPath: observationFile.absolute });
  } catch (error) {
    fail('M8I_UPDATER_OBSERVATION_INVALID', `${target}:${error.message}`);
  }
  exactKeys(trusted, ['contract', 'candidate', 'authority', 'receiptSha256'], 'M8I_UPDATER_OBSERVATION_INVALID');
  sameCandidate(trusted.candidate, candidate, 'M8I_UPDATER_OBSERVATION_INVALID');
  if (
    trusted.contract !== 'wayland-updater-trusted-observation/1.0' ||
    trusted.authority !== 'nonce-bound-packaged-runtime-observer' ||
    trusted.receiptSha256 !== sha256(observationFile.bytes)
  ) {
    fail('M8I_UPDATER_OBSERVATION_INVALID', `${target}:untrusted-receipt`);
  }

  const referenced = [
    observationRelative,
    `updater-observations/${target}/${observation.candidateArtifact.file}`,
    `updater-observations/${target}/${observation.rollbackArtifact.file}`,
    `updater-observations/${target}/${observation.packageSmoke.file}`,
    `updater-observations/${target}/${observation.runtimeEvents.file}`,
    ...observation.stateSnapshots.map((snapshot) => `updater-observations/${target}/${snapshot.file}`),
  ];
  for (const relative of new Set(referenced)) copyRegularFile(rawRoot, relative, output);
  return { observationRelative, observation, trusted };
}

function produceProtectedAcceptanceEvidence(rawDirectory, gatesDirectory, outputDirectory, options = {}) {
  const rawRoot = path.resolve(rawDirectory);
  const gatesRoot = path.resolve(gatesDirectory);
  const output = path.resolve(outputDirectory);
  if (fs.existsSync(output)) fail('M8I_OUTPUT_INVALID', 'already-exists');
  fs.mkdirSync(output, { recursive: false, mode: 0o700 });

  const candidateRecord = readJsonFile(rawRoot, 'candidate.json', 'M8I_CANDIDATE_INVALID').value;
  exactKeys(candidateRecord, ['contract', 'candidate'], 'M8I_CANDIDATE_INVALID');
  if (candidateRecord.contract !== 'wayland-raw-acceptance-candidate/1.0') {
    fail('M8I_CANDIDATE_INVALID', 'unsupported-contract');
  }
  const candidate = candidateIdentity(candidateRecord.candidate);
  const gates = verifyGateResults(gatesRoot, candidate);
  copyRegularFile(rawRoot, 'candidate.json', output);
  for (const gate of gates.values()) {
    copyRegularFile(gatesRoot, gate.logPath, output, `gate-logs/${gate.id}.log`);
  }

  for (const { kind, id } of expectedEvidence()) {
    const gate = gates.get(gateFor(kind, id));
    const relative = `proofs/release/${kind}/${id}.json`;
    writeJson(path.join(output, relative), {
      contract: 'wayland-raw-release-evidence/1.0',
      candidate,
      kind,
      id,
      status: 'passed',
      authority: 'protected-release-trust-root-observer',
      command: gate.command,
      exitCode: gate.exitCode,
      logSha256: gate.logSha256,
    });
  }

  const capabilitySealFile = readJsonFile(rawRoot, 'capability-seal.json', 'M8I_CAPABILITY_SEAL_INVALID');
  sameCandidate(capabilitySealFile.value.candidate, candidate, 'M8I_CAPABILITY_SEAL_INVALID');
  const capabilityModes = new Map(capabilitySealFile.value.capabilities.map((entry) => [entry.id, entry.mode]));
  for (const id of CAPABILITIES) {
    const mode = capabilityModes.get(id);
    if (mode !== 'included' && mode !== 'excluded') fail('M8I_RELEASE_CLAIM_INVALID', id);
    const proofRelative = `proofs/claims/${id}.json`;
    writeJson(path.join(output, proofRelative), {
      contract: 'wayland-raw-release-claim-evidence/1.0',
      candidate,
      id,
      claimed: mode === 'included',
      status: 'passed',
      authority: 'protected-release-trust-root-observer',
      sourceEvidenceSha256: sha256(capabilitySealFile.bytes),
    });
  }

  for (const target of matrix.TARGETS) {
    const relative = `package-smokes/${target}.json`;
    const smokeFile = readJsonFile(rawRoot, relative, 'M8I_PLATFORM_SMOKE_INVALID');
    try {
      (options.verifyPlatformPackageSmoke || verifyPlatformPackageSmoke)(
        { target, receiptPath: smokeFile.absolute },
        { candidate, target }
      );
    } catch (error) {
      fail('M8I_PLATFORM_SMOKE_INVALID', `${target}:${error.message}`);
    }
    copyRegularFile(rawRoot, relative, output);
    const updater = copyUpdaterObservation(
      rawRoot,
      output,
      target,
      candidate,
      options.verifyUpdaterObservation || verifyUpdaterObservation
    );

    for (const gate of matrix.TARGET_PROOF_GATES) {
      const packageGate = gate === 'package-identity-signature' || gate === 'install';
      const sourceRelative = packageGate ? relative : updater.observationRelative;
      const source = regularFile(output, sourceRelative, 'M8I_TARGET_GATE_EVIDENCE_INVALID');
      writeJson(path.join(output, `proofs/target-gates/${target}/${gate}.json`), {
        contract: 'wayland-raw-target-hardening-evidence/1.0',
        candidate,
        target,
        gate,
        status: 'passed',
        authority: 'protected-release-trust-root-observer',
        sourceEvidencePath: sourceRelative,
        sourceEvidenceSha256: sha256(source.bytes),
        observedPhase:
          gate === 'updater'
            ? 'failedUpdate'
            : gate === 'rollback'
              ? 'rollback'
              : gate === 're-upgrade'
                ? 'reupgrade'
                : gate,
        trustedObservationSha256: packageGate ? null : updater.trusted.receiptSha256,
      });
    }
  }

  const passthrough = [
    'capability-seal.json',
    'capability-receipts/manifest.json',
    'publisher-artifacts.json',
    ...CAPABILITIES.flatMap((id) => [
      `conditional/capability-release-acceptance-${id}.json`,
      `capability-receipts/${id}.json`,
      `capability-receipts/${id}.proof.log`,
    ]),
  ];
  const publisher = readJsonFile(rawRoot, 'publisher-artifacts.json', 'M8I_PUBLISHER_INDEX_INVALID').value;
  for (const artifact of publisher.artifacts || []) passthrough.push(artifact.path);
  for (const relative of passthrough) copyRegularFile(rawRoot, relative, output);

  const gateDigest = sha256(
    Buffer.from(
      [...gates.values()]
        .map((gate) => `${gate.id}:${gate.logSha256}`)
        .sort()
        .join('\n')
    )
  );
  writeJson(path.join(output, 'release-findings-clearance.json'), {
    contract: 'wayland-release-findings-clearance/1.0',
    candidate,
    unresolved: { blocker: 0, critical: 0, high: 0 },
    authority: 'automated-release-tracker',
    evidenceSha256: gateDigest,
  });
  writeJson(path.join(output, 'release-blocker-clearance.json'), {
    contract: 'wayland-release-blocker-clearance/1.0',
    candidate,
    unresolved: { p0: 0, p1: 0 },
    authority: 'automated-release-tracker',
    evidenceSha256: gateDigest,
  });

  // This is an index only. Each member has already passed the protected
  // single-observation verifier; consumers must still require exact six-target
  // coverage and may not treat this index as a substitute authority receipt.
  writeJson(path.join(output, 'updater-observation.json'), {
    contract: 'wayland-updater-protected-observation-index/1.0',
    candidate,
    authority: 'protected-release-trust-root-observer',
    observations: matrix.TARGETS.map((target) => ({
      target,
      observationPath: `updater-observations/${target}/observation.json`,
      observationSha256: sha256(fs.readFileSync(path.join(output, `updater-observations/${target}/observation.json`))),
    })),
  });
  return { candidate, output, gates: gates.size };
}

module.exports = { REQUIRED_GATES, produceProtectedAcceptanceEvidence };

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    process.stdout.write(
      `${JSON.stringify(produceProtectedAcceptanceEvidence(options.raw, options.gates, options.out))}\n`
    );
  } catch (error) {
    process.stderr.write(`Protected release evidence rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}
