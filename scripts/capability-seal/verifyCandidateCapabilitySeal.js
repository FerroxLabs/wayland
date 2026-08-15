'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CONTRACT = 'wayland-candidate-capabilities/2.0';
const RECEIPT_CONTRACT = 'wayland-capability-acceptance/3.0';
const RECEIPT_MANIFEST_CONTRACT = 'wayland-capability-acceptance-manifest/2.0';
const PROOF_CONTRACT = 'wayland-capability-proof/1.0';
const SEAL_CONTRACT = 'wayland-candidate-capability-seal/3.0';
const ATTESTATION_REPOSITORY = 'FerroxLabs/wayland';
const ATTESTATION_SIGNER = 'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml';
const ATTESTATION_SOURCE_REF = 'refs/heads/release-trust-v1';
const ATTESTATION_PREDICATE = 'https://slsa.dev/provenance/v1';
const REQUIRED = new Map([
  ['cowork-office', ['C0-B', 'C1']],
  ['voice', ['M5V-A']],
  ['mcp', ['M1M', 'MCP-4']],
  ['sandbox', ['M1S', 'SBX-2']],
  ['flux', ['M1F']],
]);
const EXCLUSION_INVENTORY = new Map([
  [
    'cowork-office',
    [
      'resources/bundled-officecli',
      'src/process/services/capabilities/OfficeCliAuthoringCapability.ts',
      'src/process/services/capabilities/CapabilitiesManifest.ts',
      'src/process/resources/assistant/cowork',
      'src/process/resources/skills/officecli-docx',
      'src/process/resources/skills/officecli-word-form',
      'src/process/resources/skills/officecli-pitch-deck',
      'src/process/resources/skills/officecli-data-dashboard',
      'src/process/resources/skills/officecli-xlsx',
      'src/process/resources/skills/officecli-academic-paper',
      'src/process/resources/skills/officecli-pptx',
      'src/process/resources/skills/officecli-financial-model',
      'src/process/resources/skills/_builtin/office-cli',
      'src/process/bridge/officecliInstaller.ts',
      'src/process/bridge/officeWatchBridge.ts',
      'src/process/bridge/pptPreviewBridge.ts',
      'src/renderer/pages/conversation/components/composerMenu',
      'src/renderer/assets/icons/cowork.svg',
    ],
  ],
  [
    'voice',
    [
      'resources/voice-models',
      'src/process/services/voice',
      'src/process/bridge/voiceAssetBridge.ts',
      'src/process/bridge/voiceSynthBridge.ts',
      'src/common/voice',
      'src/common/types/voiceAsset.ts',
      'src/renderer/services/voice',
      'src/renderer/pages/conversation/voice',
      'src/renderer/pages/settings/VoiceSettings',
    ],
  ],
  [
    'mcp',
    [
      'src/process/services/mcpServices',
      'src/process/bridge/mcpBridge.ts',
      'src/process/extensions/resolvers/McpServerResolver.ts',
      'src/process/doctor/checks/mcpChecks.ts',
      'src/process/acp/session/McpConfig.ts',
      'src/process/agent/acp/mcpSessionConfig.ts',
      'src/process/task/mcpConnectorGuidance.ts',
      'src/process/utils/mcpScriptDir.ts',
      'src/process/team/mcp',
      'src/process/team/mcpReadiness.ts',
      'src/process/webserver/routes/mcpConfigRoutes.ts',
      'src/process/webserver/routes/mcpOAuthRoutes.ts',
      'src/process/services/ijfw/mcpWireProtocol.ts',
      'src/common/mcp',
      'src/common/mcp.ts',
      'src/renderer/mcp-catalog',
      'src/renderer/hooks/mcp',
      'src/renderer/pages/settings/McpLibrary',
      'src/renderer/pages/settings/ToolsSettings/McpAgentStatusDisplay.tsx',
      'src/renderer/services/McpConfigService.ts',
      'src/renderer/utils/mcp',
    ],
  ],
  [
    'sandbox',
    [
      'src/process/extensions/sandbox',
      'src/process/team/sandbox',
      'src/renderer/pages/settings/WCoreConfig/panes/SecurityPane.tsx',
      'src/renderer/pages/settings/WCoreConfig/panes/RuntimePane.tsx',
    ],
  ],
  [
    'flux',
    [
      'src/process/flux',
      'src/process/connectors/fluxKey.ts',
      'src/process/webserver/routes/fluxConnectRoutes.ts',
      'src/process/task/fluxRouting.ts',
      'src/process/onboarding/connectFlux.ts',
      'src/process/bridge/fluxConnectorBridge.ts',
      'src/process/providers/catalog/fluxVirtualModels.ts',
      'src/process/utils/fluxSttDefault.ts',
      'src/process/utils/fluxImageDefault.ts',
      'src/common/routingEvidence',
      'src/common/config/flux.ts',
      'src/common/types/fluxConnector.ts',
      'src/renderer/services/FluxConnectService.ts',
      'src/renderer/hooks/useFluxConnected.ts',
      'src/renderer/pages/conversation/platforms/acp/acpFluxFailover.ts',
      'src/renderer/components/onboarding/ConnectFluxStep.tsx',
      'src/renderer/components/layout/Sider/SiderNav/SiderFluxRouterEntry.tsx',
      'src/renderer/pages/settings/ModelsSettings/components/FluxRouterHero.tsx',
      'src/renderer/pages/settings/ModelsSettings/components/FluxRouterHero.module.css',
      'src/renderer/pages/settings/AgentSettings/FluxSetupModal.tsx',
      'src/renderer/pages/settings/AgentSettings/FluxRouterCard.tsx',
    ],
  ],
]);
const SUITES = Object.freeze({
  'cowork-office': [
    'tests/unit/coworkAuthorityIsolation.test.ts',
    'tests/unit/coworkContract.test.ts',
    'tests/unit/coworkReplayContract.test.ts',
    'tests/unit/officecliInstaller.test.ts',
    'tests/unit/process/services/capabilities/OfficeCliAuthoringCapability.test.ts',
    'tests/e2e/cowork/replayContract.test.ts',
  ],
  voice: [
    'tests/unit/common/VoiceSessionMachine.test.ts',
    'tests/unit/common/voiceResponseText.test.ts',
    'tests/unit/process/services/voice/textToSpeech.test.ts',
    'tests/unit/process/services/voice/voiceAssetManager.test.ts',
    'tests/unit/process/bridge/voiceSynthBridge.test.ts',
    'tests/unit/renderer/conversation/VoiceConversationMode.dom.test.tsx',
  ],
  mcp: [
    'tests/unit/common/mcpSessionReceipt.test.ts',
    'tests/unit/process/services/mcpServices/mcpSessionTruthGate.test.ts',
    'tests/unit/process/services/mcpServices/runtimeMcpServers.test.ts',
    'tests/unit/process/bridge/McpSessionRebindCoordinator.test.ts',
    'tests/unit/process/agent/wcore/desktopMcpProfile.test.ts',
    'tests/integration/mcpAgentConsumption.test.ts',
  ],
  sandbox: [
    'tests/unit/extensions/sandboxHost.test.ts',
    'tests/unit/extensions/sandboxPermission.test.ts',
    'tests/unit/process/task/codexNativeSandbox.test.ts',
    'tests/unit/process/team/sandbox/acpFileOpGate.test.ts',
    'tests/unit/process/team/sandbox/capabilityCheck.test.ts',
    'tests/unit/process/team/sandbox/workspaceFs.test.ts',
  ],
  flux: [
    'tests/unit/fluxRoutingEvidence.test.ts',
    'tests/unit/process/flux/FluxRoutingEvidenceAdapter.test.ts',
    'tests/unit/task/fluxRoutingSafety.test.ts',
    'tests/unit/task/fluxRoutingResolvedModel.test.ts',
    'tests/unit/renderer/acpFluxFailover.test.ts',
    'tests/unit/process/bridge/fluxConnectorBridge.test.ts',
  ],
});
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const COMMIT = /^[0-9a-f]{40,64}$/;

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function exactKeys(value, keys) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort())
  );
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}

function capabilitySourceDigest(root, commit, capabilityId) {
  const inventory = EXCLUSION_INVENTORY.get(capabilityId);
  if (!inventory) throw new Error(`Unknown capability source inventory: ${capabilityId}.`);
  let entries;
  try {
    entries = execFileSync('git', ['-C', root, 'ls-tree', '-r', '-z', '--full-tree', commit, '--', ...inventory], {
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch {
    throw new Error(`Cannot read ${capabilityId} source inventory at commit ${commit}.`);
  }
  return sha256(
    Buffer.concat([Buffer.from(canonical({ capabilityId, inventory }), 'utf8'), Buffer.from([0]), entries])
  );
}

function candidateIdentity(root, overrides = {}) {
  const commit = overrides.commit || git(root, ['rev-parse', 'HEAD']);
  const tree = overrides.tree || git(root, ['rev-parse', 'HEAD^{tree}']);
  const status =
    overrides.status === undefined ? git(root, ['status', '--porcelain', '--untracked-files=all']) : overrides.status;
  if (!COMMIT.test(commit) || !COMMIT.test(tree)) throw new Error('Candidate commit/tree identity is malformed.');
  if (status) throw new Error('Candidate source tree is dirty; capability evidence cannot bind mutable source.');
  return {
    commit,
    tree,
    ancestors: overrides.ancestors || null,
    acceptedTrees: overrides.acceptedTrees || null,
    sourceDigests: overrides.sourceDigests || null,
  };
}

function validateSelection(selection) {
  if (!exactKeys(selection, ['contract', 'capabilities']) || selection.contract !== CONTRACT) {
    throw new Error(`Capability selection must use ${CONTRACT} with no unknown critical fields.`);
  }
  if (!Array.isArray(selection.capabilities) || selection.capabilities.length !== REQUIRED.size) {
    throw new Error('Capability selection coverage is incomplete.');
  }
  const seen = new Set();
  for (const capability of selection.capabilities) {
    if (!exactKeys(capability, ['id', 'packets', 'mode', 'excludedPaths'])) {
      throw new Error('Capability selection contains unknown or missing critical fields.');
    }
    const expectedPackets = REQUIRED.get(capability.id);
    if (!expectedPackets || seen.has(capability.id))
      throw new Error(`Unknown or duplicate capability: ${capability.id}.`);
    seen.add(capability.id);
    if (JSON.stringify(capability.packets) !== JSON.stringify(expectedPackets)) {
      throw new Error(`Capability packet coverage mismatch: ${capability.id}.`);
    }
    if (!['included', 'excluded'].includes(capability.mode)) throw new Error(`Invalid mode for ${capability.id}.`);
    if (!Array.isArray(capability.excludedPaths) || capability.excludedPaths.length === 0) {
      throw new Error(`Capability ${capability.id} has no physical exclusion inventory.`);
    }
    const authoritativeInventory = EXCLUSION_INVENTORY.get(capability.id);
    if (JSON.stringify(capability.excludedPaths) !== JSON.stringify(authoritativeInventory)) {
      throw new Error(`Capability ${capability.id} physical exclusion inventory does not match authority.`);
    }
    for (const entry of capability.excludedPaths) {
      if (typeof entry !== 'string' || !entry || path.isAbsolute(entry) || entry.includes('..')) {
        throw new Error(`Capability ${capability.id} has an unsafe exclusion path.`);
      }
    }
  }
  return selection;
}

function selectionDigest(selection) {
  return sha256(canonical(validateSelection(selection)));
}

function trustRootCommit(options = {}) {
  const commit = options.trustRootCommit || process.env.WAYLAND_RELEASE_TRUST_ROOT_SHA;
  if (!COMMIT.test(String(commit || ''))) throw new Error('Release acceptance trust root is unavailable.');
  return String(commit);
}

function verifyAttestedFile(file, fileSha256, _candidate, run = execFileSync, trustedCommit) {
  if (!COMMIT.test(String(trustedCommit || ''))) throw new Error('Release acceptance trust root is unavailable.');
  let output;
  try {
    output = run(
      'gh',
      [
        'attestation',
        'verify',
        file,
        '--repo',
        ATTESTATION_REPOSITORY,
        '--signer-workflow',
        ATTESTATION_SIGNER,
        '--signer-digest',
        trustedCommit,
        '--source-digest',
        trustedCommit,
        '--source-ref',
        ATTESTATION_SOURCE_REF,
        '--predicate-type',
        ATTESTATION_PREDICATE,
        '--deny-self-hosted-runners',
        '--format',
        'json',
      ],
      { encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] }
    );
  } catch (error) {
    throw new Error(`Capability acceptance attestation failed for ${path.basename(file)}: ${error.message}`);
  }
  let attestations;
  try {
    attestations = JSON.parse(String(output));
  } catch {
    throw new Error(`Capability acceptance attestation is invalid for ${path.basename(file)}.`);
  }
  const expectedDigest = fileSha256.slice('sha256:'.length);
  if (
    !Array.isArray(attestations) ||
    !attestations.some((entry) => {
      const statement = entry?.verificationResult?.statement;
      return (
        statement?.predicateType === ATTESTATION_PREDICATE &&
        Array.isArray(statement.subject) &&
        statement.subject.some((subject) => subject?.digest?.sha256 === expectedDigest)
      );
    })
  ) {
    throw new Error(`Capability acceptance attestation does not bind exact bytes for ${path.basename(file)}.`);
  }
}

function readReceiptAuthority(receiptsDir, selection, candidate, options = {}) {
  // `candidateClaim` marks the UNTRUSTED candidate package build, which has no
  // release authority to verify these receipts against.
  //
  // The ONLY attestation of the capability receipts is produced by
  // release-acceptance-trust-root.yml ("Attest protected raw authority
  // inputs"), and that workflow cannot start until this build has already
  // uploaded `raw-release-acceptance-<candidate>` — it takes the build's own
  // run id as a required input. Demanding an attestation here is therefore
  // UNSATISFIABLE BY CONSTRUCTION: build waits on trust root, trust root waits
  // on build. It is a deadlock, not a protection.
  //
  // Nothing is weakened by skipping it. The candidate's seal is a CLAIM, never
  // authority: the trust root recreates the seal byte-for-byte from
  // independently attested raw bytes using PROTECTED code, and
  // verifyFinalAcceptance rejects any mismatch with
  // 'seal-was-not-recreated-from-authoritative-receipts'. publish-release is
  // gated on that attested receipt. Default stays fail-closed — only this
  // explicit flag opts out, mirroring the WAYLAND_LOCAL_VERIFICATION pattern.
  const candidateClaim = options.candidateClaim === true;
  const trustedCommit = options.verifyAttestedFile || candidateClaim ? undefined : trustRootCommit(options);
  const manifestFile = path.join(receiptsDir, 'manifest.json');
  const stat = fs.lstatSync(manifestFile);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Capability acceptance manifest is not a regular file.');
  const manifestBytes = fs.readFileSync(manifestFile);
  const manifestSha256 = sha256(manifestBytes);
  if (options.verifyAttestedFile) {
    options.verifyAttestedFile(manifestFile, manifestSha256, candidate, options.execFileSyncImpl, trustedCommit);
  } else if (!candidateClaim) {
    verifyAttestedFile(manifestFile, manifestSha256, candidate, options.execFileSyncImpl, trustedCommit);
  }
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  if (!exactKeys(manifest, ['contract', 'candidate', 'selectionSha256', 'receipts'])) {
    throw new Error('Capability acceptance manifest has missing or unknown critical fields.');
  }
  if (manifest.contract !== RECEIPT_MANIFEST_CONTRACT)
    throw new Error('Capability acceptance manifest contract is invalid.');
  if (
    !exactKeys(manifest.candidate, ['commit', 'tree']) ||
    manifest.candidate.commit !== candidate.commit ||
    manifest.candidate.tree !== candidate.tree
  ) {
    throw new Error('Capability acceptance manifest belongs to a stale or foreign candidate.');
  }
  const selectionSha256 = selectionDigest(selection);
  if (manifest.selectionSha256 !== selectionSha256) {
    throw new Error('Capability acceptance manifest does not bind the selected capabilities.');
  }
  const included = selection.capabilities.filter((entry) => entry.mode === 'included');
  if (!Array.isArray(manifest.receipts) || manifest.receipts.length !== included.length) {
    throw new Error('Capability acceptance manifest coverage is incomplete.');
  }
  const receipts = new Map();
  for (const entry of manifest.receipts) {
    if (
      !exactKeys(entry, [
        'capabilityId',
        'receiptFile',
        'receiptSha256',
        'proofFile',
        'proofSha256',
        'logFile',
        'logSha256',
      ])
    ) {
      throw new Error('Capability acceptance manifest receipt has missing or unknown critical fields.');
    }
    if (!included.some((capability) => capability.id === entry.capabilityId) || receipts.has(entry.capabilityId)) {
      throw new Error(`Capability acceptance manifest contains unknown or duplicate receipt: ${entry.capabilityId}.`);
    }
    if (
      path.basename(entry.receiptFile) !== entry.receiptFile ||
      path.basename(entry.proofFile) !== entry.proofFile ||
      path.basename(entry.logFile) !== entry.logFile ||
      entry.receiptFile !== `${entry.capabilityId}.json` ||
      entry.proofFile !== `${entry.capabilityId}.proof.json` ||
      entry.logFile !== `${entry.capabilityId}.proof.log` ||
      !SHA256.test(String(entry.receiptSha256)) ||
      !SHA256.test(String(entry.proofSha256)) ||
      !SHA256.test(String(entry.logSha256))
    ) {
      throw new Error(`Capability acceptance manifest path or digest is invalid: ${entry.capabilityId}.`);
    }
    const receiptFile = path.join(receiptsDir, entry.receiptFile);
    const proofFile = path.join(receiptsDir, entry.proofFile);
    const logFile = path.join(receiptsDir, entry.logFile);
    for (const [file, expected, kind] of [
      [receiptFile, entry.receiptSha256, 'receipt'],
      [proofFile, entry.proofSha256, 'proof'],
      [logFile, entry.logSha256, 'log'],
    ]) {
      const fileStat = fs.lstatSync(file);
      if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
        throw new Error(`Capability acceptance ${kind} is not a regular file: ${entry.capabilityId}.`);
      }
      const observed = sha256(fs.readFileSync(file));
      if (observed !== expected)
        throw new Error(`Capability acceptance ${kind} digest mismatch: ${entry.capabilityId}.`);
      // Same deadlock as the manifest above: on the candidate build there is
      // no trust root to verify against. The digest check immediately above
      // still binds these bytes to the manifest, and the trust root attests
      // and re-derives all of it with protected code.
      if (options.verifyAttestedFile) {
        options.verifyAttestedFile(file, observed, candidate, options.execFileSyncImpl, trustedCommit);
      } else if (!candidateClaim) {
        verifyAttestedFile(file, observed, candidate, options.execFileSyncImpl, trustedCommit);
      }
    }
    receipts.set(entry.capabilityId, { ...entry, receiptFile, proofFile, logFile });
  }
  return { manifestSha256, receipts, selectionSha256 };
}

function validateProof(proof, capability, candidate, receipt, authority) {
  if (
    !exactKeys(proof, ['contract', 'candidate', 'capabilityId', 'command', 'exitCode', 'log', 'source']) ||
    proof.contract !== PROOF_CONTRACT
  ) {
    throw new Error(`Proof for ${capability.id} has an invalid contract or critical fields.`);
  }
  if (
    !exactKeys(proof.candidate, ['commit', 'tree']) ||
    proof.candidate.commit !== candidate.commit ||
    proof.candidate.tree !== candidate.tree
  ) {
    throw new Error(`Proof for ${capability.id} belongs to a stale or foreign candidate.`);
  }
  if (proof.capabilityId !== capability.id || proof.capabilityId !== receipt.capabilityId) {
    throw new Error(`Proof for ${capability.id} has a mismatched capability identity.`);
  }
  const expectedFiles = SUITES[capability.id];
  if (
    !expectedFiles ||
    !exactKeys(proof.command, ['executable', 'arguments']) ||
    proof.command.executable !== 'bun' ||
    JSON.stringify(proof.command.arguments) !== JSON.stringify(['run', 'test:vitest', '--', ...expectedFiles])
  ) {
    throw new Error(`Proof for ${capability.id} did not execute the canonical capability suite.`);
  }
  if (!Number.isInteger(proof.exitCode) || proof.exitCode !== 0) {
    throw new Error(`Proof for ${capability.id} did not record a successful canonical suite.`);
  }
  if (
    !exactKeys(proof.log, ['file', 'sha256']) ||
    proof.log.file !== authority.logFileName ||
    proof.log.sha256 !== authority.logSha256
  ) {
    throw new Error(`Proof for ${capability.id} does not bind its exact execution log.`);
  }
  const expectedPaths = EXCLUSION_INVENTORY.get(capability.id);
  if (
    !exactKeys(proof.source, ['sha256', 'paths']) ||
    proof.source.sha256 !== receipt.sourceSha256 ||
    JSON.stringify(proof.source.paths) !== JSON.stringify(expectedPaths)
  ) {
    throw new Error(`Proof for ${capability.id} does not bind its canonical capability source inventory.`);
  }
}

function validateReceipt(receipt, capability, candidate, root) {
  const keys = [
    'contract',
    'capabilityId',
    'packets',
    'status',
    'acceptedCommit',
    'acceptedTree',
    'sourceSha256',
    'proof',
  ];
  if (!exactKeys(receipt, keys) || receipt.contract !== RECEIPT_CONTRACT) {
    throw new Error(`Receipt for ${capability.id} has an invalid contract or critical fields.`);
  }
  if (
    receipt.capabilityId !== capability.id ||
    JSON.stringify(receipt.packets) !== JSON.stringify(capability.packets) ||
    receipt.status !== 'accepted'
  ) {
    throw new Error(`Receipt for ${capability.id} does not accept the exact required packet set.`);
  }
  if (receipt.acceptedCommit !== candidate.commit || receipt.acceptedTree !== candidate.tree) {
    throw new Error(`Receipt for ${capability.id} does not accept the exact candidate commit and tree.`);
  }
  if (!COMMIT.test(String(receipt.acceptedCommit)) || !COMMIT.test(String(receipt.acceptedTree))) {
    throw new Error(`Receipt for ${capability.id} has malformed accepted source identity.`);
  }
  if (!SHA256.test(String(receipt.sourceSha256))) {
    throw new Error(`Receipt for ${capability.id} has malformed capability source identity.`);
  }
  const observedAcceptedTree =
    candidate.acceptedTrees?.[receipt.acceptedCommit] ||
    (() => {
      try {
        return git(root, ['rev-parse', `${receipt.acceptedCommit}^{tree}`]);
      } catch {
        return null;
      }
    })();
  if (observedAcceptedTree !== receipt.acceptedTree) {
    throw new Error(`Receipt for ${capability.id} accepted commit/tree identity does not exist or match.`);
  }
  const isAncestor = candidate.ancestors
    ? candidate.ancestors.includes(receipt.acceptedCommit)
    : (() => {
        try {
          execFileSync('git', ['-C', root, 'merge-base', '--is-ancestor', receipt.acceptedCommit, candidate.commit]);
          return true;
        } catch {
          return false;
        }
      })();
  if (!isAncestor) {
    throw new Error(`Receipt for ${capability.id} is stale or belongs to a source not present in this candidate.`);
  }
  const acceptedSourceSha256 =
    candidate.sourceDigests?.[receipt.acceptedCommit]?.[capability.id] ||
    capabilitySourceDigest(root, receipt.acceptedCommit, capability.id);
  if (acceptedSourceSha256 !== receipt.sourceSha256) {
    throw new Error(`Receipt for ${capability.id} does not bind its accepted capability source.`);
  }
  const candidateSourceSha256 =
    candidate.sourceDigests?.[candidate.commit]?.[capability.id] ||
    capabilitySourceDigest(root, candidate.commit, capability.id);
  if (candidateSourceSha256 !== receipt.sourceSha256) {
    throw new Error(`Capability ${capability.id} source changed after its accepted receipt.`);
  }
  if (!Array.isArray(receipt.proof) || receipt.proof.length === 0 || receipt.proof.some((item) => !SHA256.test(item))) {
    throw new Error(`Receipt for ${capability.id} has no exact proof digests.`);
  }
}

function createCapabilitySeal(options = {}) {
  const root = path.resolve(options.root || path.join(__dirname, '..', '..'));
  const selectionFile = path.resolve(options.selectionFile || path.join(__dirname, 'candidate-capabilities.json'));
  const receiptsDirInput = options.receiptsDir || process.env.WAYLAND_CAPABILITY_RECEIPTS_DIR;
  if (!receiptsDirInput) {
    throw new Error('WAYLAND_CAPABILITY_RECEIPTS_DIR is required for an evidence-backed package build.');
  }
  const receiptsDir = path.resolve(receiptsDirInput);
  const selection = validateSelection(options.selection || readJson(selectionFile));
  const candidateContext = candidateIdentity(root, options.candidate);
  const candidate = { commit: candidateContext.commit, tree: candidateContext.tree };
  if (!options.receiptsDir && !process.env.WAYLAND_CAPABILITY_RECEIPTS_DIR) {
    throw new Error('WAYLAND_CAPABILITY_RECEIPTS_DIR is required for capability authority.');
  }
  const receiptAuthority = readReceiptAuthority(receiptsDir, selection, candidate, options);
  const capabilities = [];

  for (const capability of selection.capabilities) {
    if (capability.mode === 'excluded') {
      const present = capability.excludedPaths.filter((entry) => fs.existsSync(path.join(root, entry)));
      if (present.length) {
        throw new Error(
          `Capability ${capability.id} is marked excluded but remains physically present: ${present.join(', ')}.`
        );
      }
      capabilities.push({ id: capability.id, packets: capability.packets, mode: 'excluded' });
      continue;
    }
    const authority = receiptAuthority.receipts.get(capability.id);
    if (!authority) throw new Error(`Missing acceptance receipt for ${capability.id}.`);
    const receiptFile = authority.receiptFile;
    const bytes = fs.readFileSync(receiptFile);
    const digest = sha256(bytes);
    if (digest !== authority.receiptSha256) throw new Error(`Acceptance receipt digest mismatch for ${capability.id}.`);
    const receipt = JSON.parse(bytes.toString('utf8'));
    validateReceipt(receipt, capability, candidateContext, root);
    if (receipt.proof.length !== 1 || receipt.proof[0] !== authority.proofSha256) {
      throw new Error(`Acceptance receipt proof digest mismatch for ${capability.id}.`);
    }
    let proof;
    try {
      proof = JSON.parse(fs.readFileSync(authority.proofFile, 'utf8'));
    } catch {
      throw new Error(`Acceptance proof is not structured JSON for ${capability.id}.`);
    }
    validateProof(proof, capability, candidate, receipt, {
      ...authority,
      logFileName: path.basename(authority.logFile),
    });
    capabilities.push({
      id: capability.id,
      packets: capability.packets,
      mode: 'included',
      receiptSha256: digest,
      acceptedCommit: receipt.acceptedCommit,
      acceptedTree: receipt.acceptedTree,
      sourceSha256: receipt.sourceSha256,
    });
  }

  const payload = {
    contract: SEAL_CONTRACT,
    candidate,
    selectionSha256: receiptAuthority.selectionSha256,
    receiptManifestSha256: receiptAuthority.manifestSha256,
    capabilities,
  };
  return { ...payload, sealSha256: sha256(canonical(payload)) };
}

function verifyCapabilitySeal(seal) {
  const keys = ['contract', 'candidate', 'selectionSha256', 'receiptManifestSha256', 'capabilities', 'sealSha256'];
  if (
    !exactKeys(seal, keys) ||
    seal.contract !== SEAL_CONTRACT ||
    !SHA256.test(String(seal.selectionSha256)) ||
    !SHA256.test(String(seal.receiptManifestSha256))
  ) {
    throw new Error('Packaged capability seal has invalid identity or critical fields.');
  }
  if (
    !exactKeys(seal.candidate, ['commit', 'tree']) ||
    !COMMIT.test(String(seal.candidate?.commit)) ||
    !COMMIT.test(String(seal.candidate?.tree))
  ) {
    throw new Error('Packaged capability seal candidate identity is malformed.');
  }
  if (!Array.isArray(seal.capabilities) || seal.capabilities.length !== REQUIRED.size) {
    throw new Error('Packaged capability seal coverage is incomplete.');
  }
  for (const entry of seal.capabilities) {
    const expectedKeys =
      entry?.mode === 'included'
        ? ['id', 'packets', 'mode', 'receiptSha256', 'acceptedCommit', 'acceptedTree', 'sourceSha256']
        : ['id', 'packets', 'mode'];
    if (!exactKeys(entry, expectedKeys)) throw new Error('Packaged capability seal has invalid critical fields.');
    if (
      entry.mode === 'included' &&
      (!COMMIT.test(String(entry.acceptedCommit)) ||
        !COMMIT.test(String(entry.acceptedTree)) ||
        !SHA256.test(String(entry.sourceSha256)))
    ) {
      throw new Error(`Packaged capability ${String(entry.id)} has malformed accepted source identity.`);
    }
  }
  const { sealSha256, ...payload } = seal;
  if (sha256(canonical(payload)) !== sealSha256) throw new Error('Packaged capability seal digest mismatch.');
  validateSelection({
    contract: CONTRACT,
    capabilities: seal.capabilities.map((entry) => ({
      id: entry.id,
      packets: entry.packets,
      mode: entry.mode,
      excludedPaths: EXCLUSION_INVENTORY.get(entry.id),
    })),
  });
  return seal;
}

function writeCapabilitySeal(options = {}) {
  const outputFile = path.resolve(options.outputFile);
  const seal = createCapabilitySeal(options);
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(seal, null, 2)}\n`);
  return seal;
}

module.exports = {
  CONTRACT,
  RECEIPT_CONTRACT,
  RECEIPT_MANIFEST_CONTRACT,
  PROOF_CONTRACT,
  SEAL_CONTRACT,
  SUITES,
  capabilitySourceDigest,
  createCapabilitySeal,
  sha256,
  selectionDigest,
  validateSelection,
  verifyCapabilitySeal,
  writeCapabilitySeal,
};
