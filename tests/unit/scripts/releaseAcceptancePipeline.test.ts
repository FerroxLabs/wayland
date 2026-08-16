import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import YAML from 'yaml';

const { regularFile } = require('../../../scripts/release-acceptance/acceptanceBundle') as {
  regularFile: (root: string, relative: string, code: string) => { bytes: Buffer };
};
const { verifySevereDependencyAudit } = require('../../../scripts/release-acceptance/verifySevereDependencyAudit') as {
  verifySevereDependencyAudit: (file: string) => {
    contract: string;
    critical: number;
    high: number;
  };
};
const { REQUIRED_GATES } = require('../../../scripts/release-acceptance/produceProtectedAcceptanceEvidence') as {
  REQUIRED_GATES: Record<string, string>;
};
const { assembleCanonicalRawAcceptance } =
  require('../../../scripts/release-acceptance/assembleCanonicalRawAcceptance') as {
    assembleCanonicalRawAcceptance: (
      artifacts: string,
      candidate: { commit: string; tree: string },
      out: string
    ) => { candidate: { commit: string; tree: string }; files: number; output: string };
  };
const prepareWaylandCore = require('../../../scripts/prepareWaylandCore') as {
  DEFAULT_WCORE_VERSION: string;
  getAssetName: (platform: string, arch: string, tag: string) => string;
};
const { CAPABILITIES } = require('../../../scripts/release-acceptance/collectRawAcceptanceEvidence') as {
  CAPABILITIES: string[];
};
const { TARGETS } = require('../../../scripts/release-acceptance/verifyHardeningMatrix') as { TARGETS: string[] };
const { produceConditionalCapabilityReceipts } =
  require('../../../scripts/release-acceptance/produceProtectedAcceptanceEvidence') as {
    produceConditionalCapabilityReceipts: (
      rawRoot: string,
      output: string,
      candidate: { commit: string; tree: string },
      seal: Record<string, any>,
      gates: Map<string, { logSha256: string }>
    ) => void;
  };

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('protected release acceptance pipeline', () => {
  it('mints conditional capability receipts only inside protected evidence production', () => {
    const root = mkdtempSync(join(tmpdir(), 'wayland-protected-capability-'));
    roots.push(root);
    const raw = join(root, 'raw');
    const output = join(root, 'output');
    mkdirSync(join(raw, 'capability-receipts'), { recursive: true });
    mkdirSync(output);
    const digest = (value: string) => `sha256:${createHash('sha256').update(value).digest('hex')}`;
    const candidate = { commit: 'a'.repeat(40), tree: 'b'.repeat(40) };
    const logBytes = 'protected cowork proof output\n';
    writeFileSync(join(raw, 'capability-receipts/cowork-office.proof.log'), logBytes);
    const proofBytes = `${JSON.stringify({ contract: 'wayland-capability-proof/1.0' })}\n`;
    writeFileSync(join(raw, 'capability-receipts/cowork-office.proof.json'), proofBytes);
    const receipt = { capabilityId: 'cowork-office', packets: ['C0-B', 'C1'] };
    const receiptBytes = `${JSON.stringify(receipt)}\n`;
    writeFileSync(join(raw, 'capability-receipts/cowork-office.json'), receiptBytes);
    const receiptSha256 = digest(receiptBytes);
    const proofSha256 = digest(proofBytes);
    const logSha256 = digest(logBytes);
    writeFileSync(
      join(raw, 'capability-receipts/manifest.json'),
      `${JSON.stringify({
        contract: 'wayland-capability-acceptance-manifest/2.0',
        candidate,
        selectionSha256: digest('selection'),
        receipts: [
          {
            capabilityId: 'cowork-office',
            receiptFile: 'cowork-office.json',
            receiptSha256,
            proofFile: 'cowork-office.proof.json',
            proofSha256,
            logFile: 'cowork-office.proof.log',
            logSha256,
          },
        ],
      })}\n`
    );
    produceConditionalCapabilityReceipts(
      raw,
      output,
      candidate,
      {
        capabilities: [
          { id: 'cowork-office', mode: 'included', receiptSha256, sourceSha256: digest('cowork-source') },
          ...['voice', 'mcp', 'sandbox', 'flux'].map((id) => ({ id, mode: 'excluded' })),
        ],
      },
      new Map([
        ['tests', { logSha256: digest('tests') }],
        ['build', { logSha256: digest('build') }],
      ])
    );
    const protectedReceipt = JSON.parse(
      readFileSync(join(output, 'conditional/capability-release-acceptance-cowork-office.json'), 'utf8')
    );
    expect(protectedReceipt.receiptIds).toEqual(['C0-B', 'C1', 'C0-RELEASE-CLOSURE']);
    expect(new Set(protectedReceipt.receiptDigests).size).toBe(3);
    expect(protectedReceipt.authority).toBe('canonical-capability-acceptance-validator');
  });

  it('keeps final acceptance authority outside the candidate workflow', () => {
    const dispatcher = readFileSync('.github/workflows/release-acceptance.yml', 'utf8');
    const trustRoot = readFileSync('.github/workflows/release-acceptance-trust-root.yml', 'utf8');
    const release = readFileSync('.github/workflows/build-and-release.yml', 'utf8');

    expect(dispatcher).not.toContain('actions/attest-build-provenance');
    expect(dispatcher).not.toContain('id-token: write');
    expect(dispatcher).toContain('--ref release-trust-v1');
    expect(trustRoot).toContain('refs/heads/release-trust-v1');
    expect(trustRoot).toContain('WAYLAND_RELEASE_TRUST_ROOT_SHA');
    expect(trustRoot).toContain('path: trust-root');
    expect(trustRoot).toContain('path: candidate');
    expect(trustRoot).toContain('trust-root/scripts/release-acceptance/verifyFinalAcceptance.js');
    expect(trustRoot).toContain('produceProtectedAcceptanceEvidence.js');
    expect(trustRoot).toContain('collectRawAcceptanceEvidence.js');
    expect(release).toContain('assemble-raw-release-acceptance:');
    expect(release).toContain('final-release-acceptance:');
    expect(release).toContain('needs: [release-smoke-gate, release-smoke-gate-windows, final-release-acceptance]');
    expect(release).toContain("needs.final-release-acceptance.result == 'success'");
  });

  it('reruns the pinned package smoke against installer bytes on every native protected runner', () => {
    const observer = readFileSync('.github/workflows/protected-platform-package-observer.yml', 'utf8');
    expect(observer).toContain("github.ref == 'refs/heads/release-trust-v1'");
    expect(observer).toContain('ref: ${{ inputs.candidate_commit }}');
    expect(observer).toContain('node ../trust/scripts/platform-package-smoke.mjs');
    expect(observer).toContain('--candidate-state-file');
    expect(observer).toContain('createProtectedPlatformObservation.js');
    expect(observer).toContain('actions/attest-build-provenance@v2');
    for (const target of ['darwin-arm64', 'darwin-x64', 'win32-arm64', 'win32-x64', 'linux-arm64', 'linux-x64']) {
      expect(observer).toContain(`target: ${target}`);
    }
  });

  it('dispatches, resolves, and imports the exact six-target protected observer run before raw assembly', () => {
    const release = YAML.parse(readFileSync('.github/workflows/build-and-release.yml', 'utf8'));
    const observe = release.jobs['protected-platform-observations'];
    const assemble = release.jobs['assemble-raw-release-acceptance'];
    const text = JSON.stringify(observe);

    expect(observe.permissions).toEqual({ actions: 'write', contents: 'read' });
    expect(text).not.toContain('actions/checkout');
    expect(text).toContain('protected-platform-package-observer.yml');
    expect(text).toContain('candidate_commit');
    expect(text).toContain('candidate_tree');
    expect(text).toContain('producer_run_id');
    expect(text).toContain('producer_run_attempt');
    expect(text).toContain('display_title');
    for (const target of ['darwin-arm64', 'darwin-x64', 'win32-arm64', 'win32-x64', 'linux-arm64', 'linux-x64']) {
      expect(text).toContain(target);
    }
    expect(assemble.needs).toContain('protected-platform-observations');
    expect(assemble.if).toContain("needs.protected-platform-observations.result == 'success'");
  });

  it('dispatches and imports the exact six-target protected updater journey before raw assembly', () => {
    const release = YAML.parse(readFileSync('.github/workflows/build-and-release.yml', 'utf8'));
    const observe = release.jobs['protected-updater-observations'];
    const assemble = release.jobs['assemble-raw-release-acceptance'];
    const text = JSON.stringify(observe);

    expect(observe.permissions).toEqual({ actions: 'write', contents: 'read' });
    expect(text).not.toContain('actions/checkout');
    expect(text).toContain('protected-updater-journey-observer.yml');
    expect(text).toContain('candidate_commit');
    expect(text).toContain('candidate_tree');
    expect(text).toContain('producer_run_id');
    expect(text).toContain('producer_run_attempt');
    expect(text).toContain('display_title');
    for (const target of ['darwin-arm64', 'darwin-x64', 'win32-arm64', 'win32-x64', 'linux-arm64', 'linux-x64']) {
      expect(text).toContain(target);
    }
    expect(assemble.needs).toContain('protected-updater-observations');
    expect(assemble.if).toContain("needs.protected-updater-observations.result == 'success'");
  });

  it('trustRootJobSeparation keeps candidate execution outside OIDC and attestation authority', () => {
    const workflow = YAML.parse(readFileSync('.github/workflows/protected-platform-package-observer.yml', 'utf8'));
    const observe = workflow.jobs.observe;
    const sign = workflow.jobs.sign;
    const observeText = JSON.stringify(observe);
    const signText = JSON.stringify(sign);

    expect(workflow['run-name']).toContain('candidate=${{ inputs.candidate_commit }}');
    expect(workflow['run-name']).toContain('producer=${{ inputs.producer_run_id }}');
    expect(workflow['run-name']).toContain('attempt=${{ inputs.producer_run_attempt }}');
    expect(observe.permissions).toEqual({ actions: 'read', contents: 'read' });
    expect(observe.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN).toBe('');
    expect(observe.env.ACTIONS_ID_TOKEN_REQUEST_URL).toBe('');
    expect(observeText).toContain('platform-package-smoke.mjs');
    expect(observeText).toContain('.github/workflows/build-and-release.yml');
    expect(observeText).toContain('in_progress:null|completed:success');
    expect(observeText).not.toContain('attest-build-provenance');
    expect(observeText).not.toContain('createProtectedPlatformObservation.js');

    expect(sign.needs).toBe('observe');
    expect(sign.permissions).toEqual({
      actions: 'read',
      attestations: 'write',
      contents: 'read',
      'id-token': 'write',
    });
    expect(signText).toContain('createProtectedPlatformObservation.js');
    expect(signText).toContain('attest-build-provenance');
    expect(signText).not.toContain('platform-package-smoke.mjs');
    expect(signText).not.toContain('inputs.candidate_commit","path":"candidate');
  });

  it('binds the protected proof plan to the complete required gate set', () => {
    expect(REQUIRED_GATES).toEqual({
      tests: 'bun run test',
      typecheck: 'bunx tsc --noEmit',
      lint: 'bun run lint',
      build: 'bun run build:renderer:web',
      'dependency-security':
        'node ../trust-root/scripts/release-acceptance/verifySevereDependencyAudit.js dependency-audit.json',
    });
  });

  it('fails dependency acceptance on critical or high findings and ignores lower severities', () => {
    const root = mkdtempSync(join(tmpdir(), 'wayland-dependency-audit-'));
    roots.push(root);
    const report = join(root, 'audit.json');
    writeFileSync(report, JSON.stringify({ bad: [{ severity: 'high' }], low: [{ severity: 'low' }] }));
    expect(() => verifySevereDependencyAudit(report)).toThrow(/M8I_SEVERE_DEPENDENCY_FINDINGS/);
    writeFileSync(report, JSON.stringify({ bad: [{ severity: 'critical' }] }));
    expect(() => verifySevereDependencyAudit(report)).toThrow(/M8I_SEVERE_DEPENDENCY_FINDINGS/);
    writeFileSync(report, JSON.stringify({ okay: [{ severity: 'moderate' }, { severity: 'low' }] }));
    expect(verifySevereDependencyAudit(report)).toEqual({
      contract: 'wayland-severe-dependency-clearance/1.0',
      critical: 0,
      high: 0,
    });
  });

  it('derives the pinned Wayland Core release tag from the packaging code, never a typed literal', () => {
    const release = YAML.parse(readFileSync('.github/workflows/build-and-release.yml', 'utf8'));
    const assemble = release.jobs['assemble-raw-release-acceptance'];
    const download = assemble.steps.find(
      (step: { name?: string }) => step.name === 'Download exact pinned Wayland Core publisher artifacts'
    );

    expect(download).toBeTruthy();
    expect(download.run).toContain("require('./scripts/prepareWaylandCore.js').DEFAULT_WCORE_VERSION");
    // A hard-coded engine tag here is exactly the drift that made the assembler
    // derive v0.13.0 asset names while the workflow downloaded v0.12.25.
    expect(download.run).not.toMatch(/v\d+\.\d+\.\d+/);
    expect(prepareWaylandCore.DEFAULT_WCORE_VERSION).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('resolves the protected package smoke even when the build job uploaded its own copy', () => {
    const root = mkdtempSync(join(tmpdir(), 'wayland-raw-acceptance-'));
    roots.push(root);
    const artifacts = join(root, 'artifacts');
    const output = join(root, 'output');
    const candidate = { commit: 'a'.repeat(40), tree: 'b'.repeat(40) };
    const write = (file: string, value: unknown) => {
      mkdirSync(join(artifacts, file, '..'), { recursive: true });
      writeFileSync(join(artifacts, file), typeof value === 'string' ? value : JSON.stringify(value));
    };
    const smokeReport = (target: string, protectedCopy: boolean) => ({
      contract: 'wayland-platform-package-smoke/2',
      target,
      protectedCopy,
      sourceIdentity: { commit: candidate.commit, tree: candidate.tree },
    });

    for (const target of TARGETS) {
      // 1. the build job's own upload - the duplicate that made exactlyOne throw
      write(`build/${target}/platform-package-smoke-${target}.json`, smokeReport(target, false));
      // 2. the protected observer bundle - the only authoritative copy
      const dir = `protected-platform-observations/${target}`;
      write(`${dir}/platform-package-smoke-${target}.json`, smokeReport(target, true));
      write(`${dir}/installer-${target}.bin`, 'installer');
      write(`${dir}/protected-platform-observation-${target}.json`, {
        contract: 'wayland-protected-platform-package-observation/1.0',
        target,
        candidate,
        report: { fileName: `platform-package-smoke-${target}.json` },
        installer: { fileName: `installer-${target}.bin` },
      });
      // 3. the updater bundle, which carries a third copy of the smoke report
      const updater = `updater-observations/${target}`;
      write(`${updater}/package-smoke.json`, smokeReport(target, false));
      for (const name of ['initial.bin', 'candidate.bin', 'rollback.bin', 'events.json', 'state-0.json']) {
        write(`${updater}/${name}`, 'bytes');
      }
      write(`${updater}/observation.json`, {
        contract: 'wayland-updater-packaged-observation/1.0',
        target,
        candidate,
        initialArtifact: { file: 'initial.bin' },
        candidateArtifact: { file: 'candidate.bin' },
        rollbackArtifact: { file: 'rollback.bin' },
        packageSmoke: { file: 'package-smoke.json' },
        runtimeEvents: { file: 'events.json' },
        stateSnapshots: [{ file: 'state-0.json' }],
      });
      const [platform, arch] = target.split('-');
      write(
        `wayland-core/${prepareWaylandCore.getAssetName(platform, arch, prepareWaylandCore.DEFAULT_WCORE_VERSION)}`,
        'archive'
      );
    }
    for (const capability of CAPABILITIES) {
      write(`capability-receipts/${capability}.json`, { capabilityId: capability });
      write(`capability-receipts/${capability}.proof.json`, { capabilityId: capability });
      write(`capability-receipts/${capability}.proof.log`, 'log');
    }
    write('capability-receipts/manifest.json', {
      contract: 'wayland-capability-acceptance-manifest/2.0',
      candidate,
      receipts: CAPABILITIES.map((capabilityId) => ({
        capabilityId,
        receiptFile: `${capabilityId}.json`,
        proofFile: `${capabilityId}.proof.json`,
        logFile: `${capabilityId}.proof.log`,
      })),
    });

    const result = assembleCanonicalRawAcceptance(artifacts, candidate, output);

    expect(result.candidate).toEqual(candidate);
    for (const target of TARGETS) {
      const copied = JSON.parse(readFileSync(join(output, 'package-smokes', `${target}.json`), 'utf8'));
      expect(copied.protectedCopy).toBe(true);
    }
    const publisher = JSON.parse(readFileSync(join(output, 'publisher-artifacts.json'), 'utf8'));
    expect(publisher.artifacts).toHaveLength(TARGETS.length);
    for (const entry of publisher.artifacts) {
      expect(entry.releaseTag).toBe(prepareWaylandCore.DEFAULT_WCORE_VERSION);
    }
  });

  it('rejects symlink evidence instead of following it', () => {
    const root = mkdtempSync(join(tmpdir(), 'wayland-release-evidence-'));
    roots.push(root);
    writeFileSync(join(root, 'real.json'), '{}');
    symlinkSync(join(root, 'real.json'), join(root, 'link.json'));
    expect(() => regularFile(root, 'link.json', 'M8I_TEST')).toThrow(/M8I_TEST:not-regular-file/);
  });
});
