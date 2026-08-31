import '@/common/platform/register-node';

import { createHash, createPrivateKey, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import canonicalize from 'canonicalize';

import { verifyCanonicalEvidenceSignature } from '../../../../scripts/verify-wayland-nano-activation';
import artifactManifest from '../../../../docs/evidence/phase2/activation-artifact-manifest.json';
import crashReceipt from '../../../../docs/evidence/phase2/activation-negative-crash-receipt.json';
import {
  AcpConnection,
  type ResolvedWaylandNanoActivationInput,
  type WaylandNanoActivationAttempt,
} from '@process/agent/acp/AcpConnection';
import { verifyWaylandNanoBinary } from '@process/agent/activation/waylandNanoBinaryVerifier';
import type { SignedWaylandNanoActivation, SignedWaylandNanoControl } from '@process/agent/activation/types';
import { LegacyConnectorFactory } from '@process/acp/compat/LegacyConnectorFactory';
import type { AgentConfig } from '@process/acp/types';
import { noopProtocolHandlers } from '@process/acp/types';

const SOURCE_SHA = '288de9ed3185c91717f8f777c9975c784709e824';
const LOCK_SHA256 = '3d6ec29f3b19e0b3778a5de222418ec497eaf79be8e93a92dd120d986bdb930a';
const LOCK_BLOB = '7bb979cf829f7bf0a63692d8485bfc8e4935ed13';

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('Wayland Nano exact-artifact acceptance contract', () => {
  it('pins the corrected merged Nano source and immutable lock identity', () => {
    expect(artifactManifest.nano).toEqual({
      cargoLockBlob: LOCK_BLOB,
      cargoLockSha256: LOCK_SHA256,
      ciRunId: 33318936491,
      mergeCommit: '1d80ecf93c1ec5fe14e89a44e89c4a0142ba1c9b',
      reviewedSourceCommit: SOURCE_SHA,
    });
    expect(artifactManifest.build.freshCheckoutRequired).toBe(true);
    expect(artifactManifest.build.nanoContractSuites).toContain('cargo test --locked -p nano-activation --lib');
    expect(artifactManifest.build.prebuiltArtifactsAccepted).toBe(false);
    expect(artifactManifest.build.profiles).toEqual(['debug', 'release']);
    expect(artifactManifest.nanoFixtureHelper).toEqual({
      cargoLockSha256: LOCK_SHA256,
      ciRunId: 33355945120,
      privateHandoffSchema: 'wayland.nano.phase2-fixture-private/v1',
      productionCliExposure: false,
      publicSchema: 'wayland.nano.phase2-fixture/v2',
      sourceCommit: '75a192920b27a5a485df91e35154be6dacba414c',
    });
  });

  it('freezes five positive and twenty-six negative acceptance rows', () => {
    expect(artifactManifest.matrix.positiveCount).toBe(5);
    expect(artifactManifest.matrix.negativeCount).toBe(26);
    expect(artifactManifest.matrix.totalCount).toBe(31);
    expect(artifactManifest.matrix.rowIds).toHaveLength(31);
    expect(new Set(artifactManifest.matrix.rowIds)).toHaveLength(31);
    expect(sha256(artifactManifest.matrix.rowIds.join('\n'))).toBe(artifactManifest.matrix.rowIdsSha256);
    expect(crashReceipt.rows).toHaveLength(31);
    expect(crashReceipt.rows.filter((row) => row.expected === 'accept')).toHaveLength(5);
    expect(crashReceipt.rows.filter((row) => row.expected === 'refuse')).toHaveLength(26);
    expect(crashReceipt.productionBootstrap).toEqual({
      authorizationKeyId: 'phase2-offline-bootstrap-2026-08-30',
      challengeSchema: 'wayland.nano.offline-bootstrap-challenge/v1',
      consumptionReceiptSchema: 'wayland.nano.offline-bootstrap-consumption-receipt/v1',
      exactArtifactBound: true,
      ordinaryDetachedBootstrap: 'refused_no_controlling_tty',
      ownerDirectedAgentOperatedBootstrap: true,
      physicalConsolePresenceReplaced: true,
    });
  });

  it('requires external process/state/effect oracles and terminal refusal for every row', () => {
    for (const row of crashReceipt.rows) {
      expect(row.oracles).toContain('process');
      expect(row.oracles).toContain('state');
      expect(row.oracles).toContain('effect');
      expect(row.fallbackAllowed).toBe(false);
      expect(row.receiptAuthority).toBe('nano');
    }
  });

  it('rejects tampered, wrong-key, wrong-domain and noncanonical signed evidence', () => {
    const first = generateKeyPairSync('ed25519');
    const second = generateKeyPairSync('ed25519');
    const domain = Buffer.from('WAYLAND-NANO-EVIDENCE-TEST\0v1\0');
    const unsigned = { counter: 1, schema: 'wayland.nano.evidence-test/v1' };
    const payload = canonicalize(unsigned)!;
    const signature = sign(null, Buffer.concat([domain, Buffer.from(payload)]), first.privateKey).toString('base64url');
    const raw = Buffer.from(canonicalize({ ...unsigned, signature })!);
    const rawPublic = first.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);
    const wrongPublic = second.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);

    expect(verifyCanonicalEvidenceSignature(raw, rawPublic, domain).schema).toBe(unsigned.schema);
    const tampered = Buffer.from(canonicalize({ ...unsigned, counter: 2, signature })!);
    expect(() => verifyCanonicalEvidenceSignature(tampered, rawPublic, domain)).toThrow(/signature/);
    expect(() => verifyCanonicalEvidenceSignature(raw, wrongPublic, domain)).toThrow(/signature/);
    expect(() => verifyCanonicalEvidenceSignature(raw, rawPublic, Buffer.from('WRONG\0'))).toThrow(/signature/);
    expect(() =>
      verifyCanonicalEvidenceSignature(
        Buffer.from(JSON.stringify({ ...unsigned, signature }, null, 2)),
        rawPublic,
        domain
      )
    ).toThrow(/canonical JCS/);
  });

  it('constructs process authority only through the Nano-owned evidence helper', async () => {
    const home = process.env.WAYLAND_NANO_FIXTURE_DESKTOP_HOME;
    const seed = process.env.WAYLAND_NANO_FIXTURE_DESKTOP_ISSUER_SEED;
    const receiptPublic = process.env.WAYLAND_NANO_FIXTURE_RECEIPT_PUBLIC_KEY;
    if (!home && !seed && !receiptPublic) return;
    expect(home).toBeTruthy();
    expect(seed).toBeTruthy();
    expect(receiptPublic).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect((await stat(home!)).isDirectory()).toBe(true);
    expect((await stat(seed!)).isFile()).toBe(true);
    const bootstrap = await readFile(path.join(home!, 'activation', 'bootstrap-receipt.json'));
    expect(
      verifyCanonicalEvidenceSignature(
        bootstrap,
        Buffer.from(receiptPublic!, 'base64url'),
        Buffer.from('WAYLAND-NANO-ADMIN-BOOTSTRAP\0v1\0')
      ).schema
    ).toBe('wayland.nano.admin-bootstrap-receipt/v1');
  });

  it('binds a runtime artifact only when supplied by the fresh-checkout verifier', async () => {
    const executable = process.env.WAYLAND_NANO_EXACT_EXECUTABLE;
    const executableSha = process.env.WAYLAND_NANO_EXACT_EXECUTABLE_SHA256;
    const checkout = process.env.WAYLAND_NANO_EXACT_CHECKOUT;
    if (!executable && !executableSha && !checkout) return;
    expect(executable).toBeTruthy();
    expect(executableSha).toMatch(/^[0-9a-f]{64}$/);
    expect(checkout).toBeTruthy();
    const executableInfo = await stat(executable!);
    expect(executableInfo.isFile()).toBe(true);
    expect(sha256(await readFile(executable!))).toBe(executableSha);
    expect(path.isAbsolute(checkout!)).toBe(true);
    expect(sha256(await readFile(path.join(checkout!, 'Cargo.lock')))).toBe(LOCK_SHA256);
  });

  it('admits valid signed activation through both real Desktop ACP stacks without caller-carrier fallback', async () => {
    const executable = process.env.WAYLAND_NANO_EXACT_EXECUTABLE;
    const executableSha = process.env.WAYLAND_NANO_EXACT_EXECUTABLE_SHA256;
    const fixtureHome = process.env.WAYLAND_NANO_FIXTURE_DESKTOP_HOME;
    const fixtureSeed = process.env.WAYLAND_NANO_FIXTURE_DESKTOP_ISSUER_SEED;
    const receiptPublic = process.env.WAYLAND_NANO_FIXTURE_RECEIPT_PUBLIC_KEY;
    if (!executable && !executableSha && !fixtureHome && !fixtureSeed && !receiptPublic) return;
    expect(executable).toBeTruthy();
    expect(executableSha).toMatch(/^[0-9a-f]{64}$/);
    expect(fixtureHome).toBeTruthy();
    expect(fixtureSeed).toBeTruthy();
    expect(receiptPublic).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const parent = await mkdtemp(path.join(os.tmpdir(), 'wayland-nano-real-desktop-stacks-'));
    const home = fixtureHome!;
    const workspace = path.join(parent, 'workspace');
    const stagingLegacy = path.join(parent, 'staging-legacy');
    const stagingSdk = path.join(parent, 'staging-sdk');
    const hostileHome = path.join(parent, 'caller-controlled-home');
    await Promise.all([mkdir(workspace), mkdir(stagingLegacy), mkdir(stagingSdk), mkdir(hostileHome)]);
    await writeFile(path.join(hostileHome, 'sentinel'), 'unchanged');
    let legacy: AcpConnection | undefined;
    let sdk: ReturnType<LegacyConnectorFactory['create']> | undefined;
    let issuerSeed: Buffer | undefined;
    const observations: Array<{ activation: SignedWaylandNanoActivation; receipt: Record<string, unknown> }> = [];
    try {
      issuerSeed = await readFile(fixtureSeed!);
      const fluxKeyPath = path.join(parent, 'flux-api-key.txt');
      await writeFile(fluxKeyPath, 'phase2-public-process-fixture-not-a-live-key', { mode: 0o600 });
      const environment = {
        FLUX_API_KEY_FILE: fluxKeyPath,
        NANO_HOME: home,
      };
      const hostileEnvironment = {
        FLUX_API_KEY_FILE: path.join(hostileHome, 'hostile-flux-key.txt'),
        NANO_ADMIN_ROOT_KEYREF: path.join(hostileHome, 'hostile-admin.keyref'),
        NANO_HOME: hostileHome,
      };
      const binaryInfo = await stat(executable!);
      const input = async (stagingRoot: string): Promise<ResolvedWaylandNanoActivationInput> => {
        const binary = await verifyWaylandNanoBinary({
          canonicalPath: executable!,
          cargoLockSha256: LOCK_SHA256,
          sha256: executableSha!,
          size: binaryInfo.size,
          sourceCommitSha: SOURCE_SHA,
          stagingRoot,
        });
        return Object.freeze({
          binary,
          spawnEnv: Object.freeze(environment),
          buildAttempt: async ({ operation, sessionId }) => {
            const activation = signedActivation(issuerSeed!, operation, sessionId ?? undefined);
            const attempt: WaylandNanoActivationAttempt = Object.freeze({
              activation,
              buildControl: async (control, boundSessionId) =>
                signedControl(issuerSeed!, String(activation.activation_id), control, boundSessionId),
              observeTerminalResponse: (value) => {
                const receipt = acceptedReceipt(value, receiptPublic!);
                if (!receipt) return false;
                observations.push({ activation, receipt });
                return true;
              },
            });
            return attempt;
          },
        });
      };

      let legacySpawns = 0;
      legacy = new AcpConnection(await input(stagingLegacy));
      await legacy.connect('wnano', executable, workspace, undefined, hostileEnvironment);
      legacySpawns += 1;
      await legacy.initialize();
      expect((await legacy.newSession(workspace)).sessionId).toEqual(expect.any(String));
      await verifyDesktopReceiptObservation(observations.shift(), executableSha!, home);
      expect(legacySpawns).toBe(1);
      await legacy.disconnect();
      legacy = undefined;

      const sdkInput = await input(stagingSdk);
      sdk = new LegacyConnectorFactory().create(
        {
          agentBackend: 'wnano',
          agentSource: 'builtin',
          agentId: 'phase2-exact-sdk-stack',
          cwd: workspace,
          args: [],
          env: hostileEnvironment,
          waylandNanoActivation: sdkInput,
          waylandNanoMode: 'authenticated',
        } satisfies AgentConfig,
        noopProtocolHandlers
      );
      await sdk.start();
      expect(sdk.lifecycleSnapshot.pid).toEqual(expect.any(Number));
      expect((await sdk.createSession({ cwd: workspace, mcpServers: [] })).sessionId).toEqual(expect.any(String));
      await verifyDesktopReceiptObservation(observations.shift(), executableSha!, home);
      expect(await readdir(hostileHome)).toEqual(['sentinel']);
      await sdk.close();
      sdk = undefined;
    } finally {
      await sdk?.close().catch(() => {});
      await legacy?.disconnect().catch(() => {});
      issuerSeed?.fill(0);
      await rm(parent, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  }, 30_000);
});

function fixturePrivateKey(seed: Buffer) {
  return createPrivateKey({
    key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]),
    format: 'der',
    type: 'pkcs8',
  });
}

function signFixture<T extends Record<string, unknown>>(
  unsigned: T,
  seed: Buffer,
  domain: string
): T & { signature: string } {
  const payload = canonicalize(unsigned);
  if (!payload) throw new Error('fixture request canonicalization failed');
  return Object.freeze({
    ...unsigned,
    signature: sign(null, Buffer.concat([Buffer.from(domain), Buffer.from(payload)]), fixturePrivateKey(seed)).toString(
      'base64url'
    ),
  });
}

function signedActivation(
  seed: Buffer,
  operation: 'new' | 'load',
  sessionId?: string,
  resumeFingerprint?: string
): SignedWaylandNanoActivation {
  const issuedAt = new Date();
  const issued = issuedAt.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const notAfter = new Date(issuedAt.getTime() + 5 * 60_000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const unique = randomBytes(12).toString('hex');
  return signFixture(
    {
      activation_id: `phase2-${unique}`,
      alg: 'Ed25519' as const,
      budgets: Object.freeze({
        max_cost_microcents: 1_000,
        max_input_tokens: 4_096,
        max_output_tokens: 2_048,
        max_tool_calls: 8,
        max_turns: 4,
        wall_clock_ms: 60_000,
      }),
      capabilities: Object.freeze(['filesystem.read']),
      continuity: Object.freeze({
        fallback: 'none' as const,
        resume_fingerprint: operation === 'load' ? (resumeFingerprint ?? null) : null,
        strategy: operation === 'load' ? ('session_resume' as const) : ('fresh' as const),
      }),
      controls: Object.freeze(['cancel' as const, 'pause' as const]),
      deadline: notAfter,
      idempotency_key: `phase2-${unique}`,
      issued_at: issued,
      issuer_id: 'wayland-desktop',
      key_id: 'desktop-phase2-fixture-key',
      nonce: `phase2-${unique}`,
      not_after: notAfter,
      not_before: new Date(issuedAt.getTime() - 5_000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      principal_id: 'main',
      product_subject_id: 'phase2-agent',
      project_id: 'phase2-project',
      schema: 'wayland.nano.activation/v1' as const,
      session_id: operation === 'load' ? (sessionId ?? null) : null,
    },
    seed,
    'WAYLAND-NANO-ACTIVATION\0v1\0'
  );
}

function signedControl(
  seed: Buffer,
  activationId: string,
  control: 'cancel' | 'pause',
  sessionId: string
): SignedWaylandNanoControl {
  const issuedAt = new Date();
  return signFixture(
    {
      activation_id: activationId,
      alg: 'Ed25519' as const,
      control,
      issued_at: issuedAt.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      issuer_id: 'wayland-desktop',
      key_id: 'desktop-phase2-fixture-key',
      nonce: `control-${randomBytes(12).toString('hex')}`,
      not_after: new Date(issuedAt.getTime() + 5 * 60_000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      principal_id: 'main',
      project_id: 'phase2-project',
      schema: 'wayland.nano.control/v1' as const,
      session_id: sessionId,
    },
    seed,
    'WAYLAND-NANO-CONTROL\0v1\0'
  );
}

function acceptedReceipt(value: unknown, publicKey: string): Record<string, unknown> | undefined {
  const meta = (value as Record<string, unknown> | undefined)?._meta as Record<string, unknown> | undefined;
  const raw = canonicalize(meta?.waylandNanoActivationReceipt);
  if (!raw) return undefined;
  const receipt = verifyCanonicalEvidenceSignature(
    Buffer.from(raw),
    Buffer.from(publicKey, 'base64url'),
    Buffer.from('WAYLAND-NANO-RECEIPT\0v1\0')
  );
  if (
    receipt.schema === 'wayland.nano.activation-receipt/v1' &&
    ['admitted', 'replayed'].includes(String(receipt.decision)) &&
    receipt.source_commit_sha === SOURCE_SHA &&
    receipt.cargo_lock_sha256 === LOCK_SHA256
  )
    return receipt;
  return undefined;
}

async function verifyDesktopReceiptObservation(
  observation: { activation: SignedWaylandNanoActivation; receipt: Record<string, unknown> } | undefined,
  executableSha256: string,
  home: string
): Promise<void> {
  if (!observation) throw new Error('Desktop stack did not observe a terminal Nano receipt');
  const { activation, receipt } = observation;
  const unsigned = { ...activation } as Record<string, unknown>;
  delete unsigned.signature;
  const canonical = canonicalize(unsigned);
  if (!canonical) throw new Error('Desktop fixture activation is not canonicalizable');
  expect(receipt).toMatchObject({
    activation_id: activation.activation_id,
    admin_epoch: 1,
    cargo_lock_sha256: LOCK_SHA256,
    canonical_payload_sha256: sha256(canonical),
    control: null,
    decision: 'admitted',
    executable_sha256: executableSha256,
    grant_epoch: 1,
    issuer_epoch: 1,
    issuer_id: 'wayland-desktop',
    key_id: 'desktop-phase2-fixture-key',
    principal_id: 'main',
    product_subject_id: 'phase2-agent',
    project_id: 'phase2-project',
    revocation_epoch: 1,
    session_id: null,
    source_commit_sha: SOURCE_SHA,
  });
  expect(receipt.authority_journal_position).toEqual(expect.any(Number));
  expect(receipt.activation_journal_position).toEqual(expect.any(Number));
  const raw = canonicalize(receipt);
  expect(raw).toBeTruthy();
  const journal = await readFile(path.join(home, 'activation', 'admission.jsonl'), 'utf8');
  expect(journal).toContain(Buffer.from(raw!).toString('base64'));
}
