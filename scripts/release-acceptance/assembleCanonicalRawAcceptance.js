#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { candidateIdentity, copyRegularFile, exactKeys, fail, sha256, writeJson } = require('./acceptanceBundle');
const { CAPABILITIES } = require('./collectRawAcceptanceEvidence');
const matrix = require('./verifyHardeningMatrix');

const CORE_ASSET_BY_TARGET = Object.freeze({
  'darwin-arm64': 'wayland-core-v0.12.25-aarch64-apple-darwin.tar.gz',
  'darwin-x64': 'wayland-core-v0.12.25-x86_64-apple-darwin.tar.gz',
  'win32-arm64': 'wayland-core-v0.12.25-aarch64-pc-windows-msvc.zip',
  'win32-x64': 'wayland-core-v0.12.25-x86_64-pc-windows-msvc.zip',
  'linux-arm64': 'wayland-core-v0.12.25-aarch64-unknown-linux-gnu.tar.gz',
  'linux-x64': 'wayland-core-v0.12.25-x86_64-unknown-linux-gnu.tar.gz',
});

function parseArgs(argv) {
  const values = {};
  const flags = new Map([
    ['--artifacts', 'artifacts'],
    ['--candidate', 'candidate'],
    ['--out', 'out'],
  ]);
  for (let index = 0; index < argv.length; index += 2) {
    const key = flags.get(argv[index]);
    if (!key || !argv[index + 1]) fail('M8I_ARGUMENT_INVALID', argv[index] || 'missing-value');
    values[key] = argv[index + 1];
  }
  if (!values.artifacts || !values.candidate || !values.out) {
    fail('M8I_ARGUMENT_INVALID', 'artifacts-candidate-and-out-required');
  }
  return values;
}

function walkRegularFiles(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) fail('M8I_CANONICAL_ARTIFACT_INVALID', `symlink:${absolute}`);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(absolute);
    }
  };
  visit(root);
  return files;
}

function parseJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function exactlyOne(files, predicate, code, detail) {
  const matches = files.filter(predicate);
  if (matches.length !== 1) fail(code, `${detail}:count-${matches.length}`);
  return matches[0];
}

function copyAbsolute(file, outputRoot, relative) {
  const sourceRoot = path.dirname(file);
  return copyRegularFile(sourceRoot, path.basename(file), outputRoot, relative);
}

function assembleCanonicalRawAcceptance(artifactsDirectory, candidateValue, outputDirectory) {
  const artifactsRoot = path.resolve(artifactsDirectory);
  const output = path.resolve(outputDirectory);
  const candidate = candidateIdentity(candidateValue, 'M8I_CANDIDATE_INVALID');
  if (!fs.statSync(artifactsRoot).isDirectory()) fail('M8I_CANONICAL_ARTIFACT_INVALID', 'not-directory');
  if (fs.existsSync(output)) fail('M8I_OUTPUT_INVALID', 'already-exists');
  fs.mkdirSync(output, { recursive: false, mode: 0o700 });
  const files = walkRegularFiles(artifactsRoot);
  writeJson(path.join(output, 'candidate.json'), {
    contract: 'wayland-raw-acceptance-candidate/1.0',
    candidate,
  });

  for (const target of matrix.TARGETS) {
    const smoke = exactlyOne(
      files,
      (file) => {
        const value = parseJson(file);
        return (
          value?.contract === 'wayland-platform-package-smoke/2' &&
          value.target === target &&
          value.sourceIdentity?.commit === candidate.commit &&
          value.sourceIdentity?.tree === candidate.tree
        );
      },
      'M8I_PLATFORM_SMOKE_INVALID',
      target
    );
    copyAbsolute(smoke, output, `package-smokes/${target}.json`);

    const observation = exactlyOne(
      files,
      (file) => {
        const value = parseJson(file);
        return (
          value?.contract === 'wayland-updater-packaged-observation/1.0' &&
          value.target === target &&
          value.candidate?.commit === candidate.commit &&
          value.candidate?.tree === candidate.tree
        );
      },
      'M8I_UPDATER_OBSERVATION_INVALID',
      target
    );
    const manifest = parseJson(observation);
    const observationRoot = path.dirname(observation);
    const references = [
      ['observation.json', observation],
      [manifest.candidateArtifact?.file, path.resolve(observationRoot, manifest.candidateArtifact?.file || '')],
      [manifest.rollbackArtifact?.file, path.resolve(observationRoot, manifest.rollbackArtifact?.file || '')],
      [manifest.packageSmoke?.file, path.resolve(observationRoot, manifest.packageSmoke?.file || '')],
      [manifest.runtimeEvents?.file, path.resolve(observationRoot, manifest.runtimeEvents?.file || '')],
      ...(Array.isArray(manifest.stateSnapshots)
        ? manifest.stateSnapshots.map((entry) => [entry.file, path.resolve(observationRoot, entry.file || '')])
        : []),
    ];
    for (const [relative, absolute] of references) {
      if (
        typeof relative !== 'string' ||
        !relative ||
        path.isAbsolute(relative) ||
        (!absolute.startsWith(`${observationRoot}${path.sep}`) && absolute !== observation)
      ) {
        fail('M8I_UPDATER_OBSERVATION_INVALID', `${target}:unsafe-reference`);
      }
      copyAbsolute(absolute, output, `updater-observations/${target}/${relative}`);
    }
  }

  const capabilityManifest = exactlyOne(
    files,
    (file) => parseJson(file)?.contract === 'wayland-capability-acceptance-manifest/1.0',
    'M8I_CAPABILITY_RECEIPT_INVALID',
    'manifest'
  );
  const capabilityRoot = path.dirname(capabilityManifest);
  const manifest = parseJson(capabilityManifest);
  if (
    manifest.candidate?.commit !== candidate.commit ||
    manifest.candidate?.tree !== candidate.tree ||
    !Array.isArray(manifest.receipts)
  ) {
    fail('M8I_CAPABILITY_RECEIPT_INVALID', 'stale-or-malformed-manifest');
  }
  copyAbsolute(capabilityManifest, output, 'capability-receipts/manifest.json');
  for (const entry of manifest.receipts) {
    if (!CAPABILITIES.includes(entry.capabilityId)) fail('M8I_CAPABILITY_RECEIPT_INVALID', 'unknown-capability');
    for (const [sourceName, outputName] of [
      [entry.receiptFile, `${entry.capabilityId}.json`],
      [entry.proofFile, `${entry.capabilityId}.proof.log`],
    ]) {
      if (path.basename(sourceName) !== sourceName) fail('M8I_CAPABILITY_RECEIPT_INVALID', 'unsafe-path');
      copyAbsolute(path.join(capabilityRoot, sourceName), output, `capability-receipts/${outputName}`);
    }
  }

  for (const capabilityId of CAPABILITIES) {
    const receipt = exactlyOne(
      files,
      (file) => {
        const value = parseJson(file);
        return (
          value?.contract === 'wayland-capability-release-acceptance/1.0' &&
          value.capabilityId === capabilityId &&
          value.candidate?.commit === candidate.commit &&
          value.candidate?.tree === candidate.tree
        );
      },
      'M8I_CONDITIONAL_RECEIPT_INVALID',
      capabilityId
    );
    copyAbsolute(receipt, output, `conditional/capability-release-acceptance-${capabilityId}.json`);
  }

  const publisherArtifacts = [];
  for (const target of matrix.TARGETS) {
    const expectedAsset = CORE_ASSET_BY_TARGET[target];
    const archive = exactlyOne(
      files,
      (file) => path.basename(file) === expectedAsset,
      'M8I_PUBLISHER_ARTIFACT_INVALID',
      target
    );
    const assetName = path.basename(archive);
    const copied = copyAbsolute(archive, output, `publisher-artifacts/${assetName}`);
    publisherArtifacts.push({
      assetName,
      releaseTag: 'v0.12.25',
      expectedSha256: copied.sha256.slice('sha256:'.length),
      path: `publisher-artifacts/${assetName}`,
    });
  }
  writeJson(path.join(output, 'publisher-artifacts.json'), {
    contract: 'wayland-raw-publisher-artifacts/1.0',
    artifacts: publisherArtifacts,
  });
  return { candidate, files: walkRegularFiles(output).length, output };
}

module.exports = { assembleCanonicalRawAcceptance };

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const candidate = JSON.parse(options.candidate);
    process.stdout.write(
      `${JSON.stringify(assembleCanonicalRawAcceptance(options.artifacts, candidate, options.out))}\n`
    );
  } catch (error) {
    process.stderr.write(`Canonical raw acceptance assembly rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}
