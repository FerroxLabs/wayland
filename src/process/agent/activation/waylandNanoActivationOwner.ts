import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, realpath } from 'node:fs/promises';
import path from 'node:path';
import canonicalize from 'canonicalize';

import type {
  ResolvedWaylandNanoActivationInput,
  WaylandNanoActivationAttempt,
  WaylandNanoBindingOwner,
} from '@process/agent/acp/AcpConnection';
import { WaylandNanoActivationBuilder } from './waylandNanoActivation';
import { WaylandNanoActivationKeyStore, type WaylandNanoSafeStorage } from './waylandNanoActivationKeyStore';
import {
  verifyWaylandNanoBinary,
  type VerifiedWaylandNanoBinary,
  type WaylandNanoBinaryExpectation,
} from './waylandNanoBinaryVerifier';
import { WaylandNanoBindingStore } from './waylandNanoBindingStore';
import { enforceOwnerOnlyPath } from './waylandNanoBindingStore';
import type { WaylandNanoBinding, WaylandNanoBudgets, WaylandNanoCapability, WaylandNanoControl } from './types';

const OPAQUE_REFERENCE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const SOURCE_SHA = /^[0-9a-f]{40}$/;
const MANIFEST_SCHEMA = 'wayland.nano.desktop-activation-owner/v1';
const MANIFEST_FILE = 'activation-artifact.json';
const MANIFEST_KEYS = ['artifact', 'grant', 'schema'] as const;
const ARTIFACT_KEYS = ['canonicalPath', 'cargoLockSha256', 'sha256', 'size', 'sourceCommitSha', 'stagingRoot'] as const;
const GRANT_KEYS = ['budgets', 'capabilities', 'controls', 'validityMs'] as const;
const BUDGET_KEYS = [
  'max_cost_microcents',
  'max_input_tokens',
  'max_output_tokens',
  'max_tool_calls',
  'max_turns',
  'wall_clock_ms',
] as const;
const CAPABILITIES = new Set<WaylandNanoCapability>([
  'filesystem.read',
  'filesystem.write',
  'shell.execute',
  'network.egress',
  'mcp.invoke',
  'task.spawn',
  'checkpoint.mutate',
  'computer.use',
]);
const CONTROLS = new Set<WaylandNanoControl>(['cancel', 'pause']);

export type WaylandNanoActivationGrant = Readonly<{
  capabilities: readonly WaylandNanoCapability[];
  budgets: WaylandNanoBudgets;
  controls: readonly WaylandNanoControl[];
  validityMs: number;
}>;

export type WaylandNanoActivationOwnerOptions = Readonly<{
  userDataRoot: string;
  safeStorage: WaylandNanoSafeStorage;
  artifactExpectation: WaylandNanoBinaryExpectation;
  grant: WaylandNanoActivationGrant;
  /** Owner-loaded durable resume evidence; never conversation or caller data. */
  resumeFingerprints?: Readonly<Record<string, string>>;
  now?: () => Date;
  randomId?: () => string;
}>;

/** Load the sole owner-controlled, canonical startup manifest. Absence or invalidity is default-off. */
export async function loadWaylandNanoActivationOwnerOptions(
  userDataRoot: string,
  safeStorage: WaylandNanoSafeStorage
): Promise<WaylandNanoActivationOwnerOptions | null> {
  try {
    const root = await realpath(userDataRoot);
    const ownerRoot = path.join(root, 'wayland-nano');
    const ownerRootMetadata = await lstat(ownerRoot);
    if (
      !ownerRootMetadata.isDirectory() ||
      ownerRootMetadata.isSymbolicLink() ||
      (process.platform !== 'win32' && (ownerRootMetadata.mode & 0o077) !== 0) ||
      path.dirname(await realpath(ownerRoot)) !== root
    ) {
      return null;
    }
    await enforceOwnerOnlyPath(ownerRoot, 'directory', 'full', true);
    const manifestPath = path.join(ownerRoot, MANIFEST_FILE);
    const metadata = await lstat(manifestPath);
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      metadata.nlink !== 1 ||
      metadata.size <= 0 ||
      metadata.size > 64 * 1024 ||
      (process.platform !== 'win32' && (metadata.mode & 0o077) !== 0) ||
      path.dirname(await realpath(manifestPath)) !== ownerRoot
    ) {
      return null;
    }
    await enforceOwnerOnlyPath(manifestPath, 'file', 'full', true);
    const handle = await open(manifestPath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    let raw: string;
    try {
      const held = await handle.stat();
      if (
        !held.isFile() ||
        held.nlink !== 1 ||
        held.dev !== metadata.dev ||
        held.ino !== metadata.ino ||
        held.size !== metadata.size
      ) {
        return null;
      }
      raw = await handle.readFile('utf8');
    } finally {
      await handle.close();
    }
    if (raw.startsWith('\uFEFF') || raw.endsWith('\n') || raw.endsWith('\r')) return null;
    const parsed: unknown = JSON.parse(raw);
    if (canonicalize(parsed) !== raw || !isRecord(parsed) || !hasExactKeys(parsed, MANIFEST_KEYS)) return null;
    if (parsed.schema !== MANIFEST_SCHEMA || !isRecord(parsed.artifact) || !isRecord(parsed.grant)) return null;
    if (!hasExactKeys(parsed.artifact, ARTIFACT_KEYS) || !hasExactKeys(parsed.grant, GRANT_KEYS)) return null;
    const artifact = parseArtifact(parsed.artifact, ownerRoot);
    const grant = parseGrant(parsed.grant);
    if (!artifact || !grant) return null;
    if (!new WaylandNanoActivationKeyStore(root, safeStorage).preflightCustody()) return null;
    // Read the complete binding document through its strict parser before any
    // owner is installed. An absent/empty store is valid-ready; malformed,
    // noncanonical, or non-owner-only state remains default-off.
    await new WaylandNanoBindingStore(root).listTombstones();
    await ensurePrivateStagingRoot(artifact.stagingRoot, ownerRoot);
    return Object.freeze({ userDataRoot: root, safeStorage, artifactExpectation: artifact, grant });
  } catch {
    return null;
  }
}

/**
 * Sole process-scoped composition for the Desktop-owned Nano activation authority.
 * It correlates trusted child metadata only to release retry state; Nano remains
 * the receipt verifier and authorization authority.
 */
export class WaylandNanoActivationOwner implements WaylandNanoBindingOwner {
  readonly #bindingStore: WaylandNanoBindingStore;
  readonly #keyStore: WaylandNanoActivationKeyStore;
  readonly #builder: WaylandNanoActivationBuilder;
  readonly #artifactExpectation: WaylandNanoBinaryExpectation;
  readonly #grant: WaylandNanoActivationGrant;
  readonly #now: () => Date;
  readonly #randomId: () => string;
  readonly #spawnEnv: Readonly<Record<string, string>>;
  readonly #resumeFingerprints = new Map<string, string>();
  readonly #pendingActivationIds = new Set<string>();
  readonly #binaryTokens = new Set<VerifiedWaylandNanoBinary>();
  #disposed = false;

  constructor(options: WaylandNanoActivationOwnerOptions) {
    this.#artifactExpectation = freezeExpectation(options.artifactExpectation);
    this.#grant = freezeGrant(options.grant);
    this.#now = options.now ?? (() => new Date());
    this.#randomId = options.randomId ?? randomUUID;
    this.#spawnEnv = Object.freeze({ NANO_HOME: path.join(options.userDataRoot, 'wayland-nano', 'nano-home') });
    this.#bindingStore = new WaylandNanoBindingStore(options.userDataRoot);
    this.#keyStore = new WaylandNanoActivationKeyStore(options.userDataRoot, options.safeStorage);
    this.#builder = new WaylandNanoActivationBuilder({
      randomId: this.#randomId,
      loadSigner: (keyRef) => this.#keyStore.signer(keyRef),
    });
    for (const [sessionId, fingerprint] of Object.entries(options.resumeFingerprints ?? {})) {
      if (OPAQUE_REFERENCE.test(sessionId) && SHA256.test(fingerprint))
        this.#resumeFingerprints.set(sessionId, fingerprint);
    }
  }

  async load(
    bindingRef: string
  ): Promise<Readonly<{ binding: WaylandNanoBinding; activation: ResolvedWaylandNanoActivationInput }> | null> {
    if (this.#disposed || !OPAQUE_REFERENCE.test(bindingRef)) return null;
    try {
      const binding = await this.#bindingStore.load(bindingRef);
      if (!binding || binding.productSubjectId !== bindingRef || !(await this.#keyStore.has(binding.issuerKeyRef))) {
        return null;
      }
      const binary = await verifyWaylandNanoBinary(this.#artifactExpectation);
      this.#binaryTokens.add(binary);
      const logicalIds = new Map<string, string>();
      const activation: ResolvedWaylandNanoActivationInput = Object.freeze({
        binary,
        spawnEnv: this.#spawnEnv,
        buildAttempt: async ({ operation, sessionId }) => {
          if (this.#disposed) throw new Error('Wayland Nano activation owner is disposed');
          const retryKey = `${operation}\0${sessionId ?? ''}`;
          let logicalActivationId = logicalIds.get(retryKey);
          if (!logicalActivationId) {
            logicalActivationId = this.#randomId();
            logicalIds.set(retryKey, logicalActivationId);
          }
          const continuity = this.continuity(operation, sessionId);
          const issuedAt = this.#now();
          const notBefore = new Date(issuedAt.getTime() - 5_000);
          const notAfter = new Date(issuedAt.getTime() + this.#grant.validityMs);
          const assertion = await this.#builder.buildActivation(binding, {
            logicalActivationId,
            sessionId,
            continuity,
            capabilities: this.#grant.capabilities,
            budgets: this.#grant.budgets,
            deadline: notAfter.toISOString(),
            controls: this.#grant.controls,
            issuedAt: issuedAt.toISOString(),
            notBefore: notBefore.toISOString(),
            notAfter: notAfter.toISOString(),
          });
          this.#pendingActivationIds.add(logicalActivationId);
          const attempt: WaylandNanoActivationAttempt = Object.freeze({
            activation: assertion,
            buildControl: (control, activeSessionId) =>
              this.#builder.buildControl({
                binding,
                activationId: assertion.activation_id,
                sessionId: activeSessionId,
                control,
                issuedAt: this.#now().toISOString(),
                notAfter: notAfter.toISOString(),
              }),
            observeTerminalResponse: (value) => {
              const observed = correlateTerminalMetadata(value, assertion, this.#artifactExpectation);
              if (!observed) return false;
              // A delayed duplicate for completed attempt A must never clear a
              // newer attempt B that now owns the same logical retry key.
              if (logicalIds.get(retryKey) !== assertion.activation_id) return false;
              if (!this.#builder.completeLogicalActivation(assertion.activation_id)) return false;
              logicalIds.delete(retryKey);
              this.#pendingActivationIds.delete(assertion.activation_id);
              if (observed.sessionId && observed.resumeFingerprint) {
                this.#resumeFingerprints.set(observed.sessionId, observed.resumeFingerprint);
              }
              return true;
            },
          });
          return attempt;
        },
      });
      return Object.freeze({ binding, activation });
    } catch {
      // Invalid/missing custody, binding, or immutable artifact is bounded nonpersistent mode.
      return null;
    }
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;
    for (const activationId of this.#pendingActivationIds) this.#builder.completeLogicalActivation(activationId);
    this.#pendingActivationIds.clear();
    this.#resumeFingerprints.clear();
    const tokens = [...this.#binaryTokens];
    this.#binaryTokens.clear();
    await Promise.allSettled(tokens.map((token) => token.dispose()));
  }

  private continuity(operation: 'new' | 'load', sessionId: string | null) {
    if (operation === 'new') {
      if (sessionId !== null) throw new Error('Fresh Wayland Nano activation cannot carry a session id');
      return Object.freeze({ strategy: 'fresh' as const, fallback: 'none' as const, resume_fingerprint: null });
    }
    if (!sessionId) throw new Error('Wayland Nano load requires an explicit session id');
    const resumeFingerprint = this.#resumeFingerprints.get(sessionId);
    if (!resumeFingerprint) throw new Error('Wayland Nano load requires owner-held resume evidence');
    return Object.freeze({
      strategy: 'session_resume' as const,
      fallback: 'none' as const,
      resume_fingerprint: resumeFingerprint,
    });
  }
}

function correlateTerminalMetadata(
  value: unknown,
  assertion: WaylandNanoActivationAttempt['activation'],
  artifact: WaylandNanoBinaryExpectation
): Readonly<{ sessionId: string | null; resumeFingerprint: string | null }> | null {
  if (!isRecord(value)) return null;
  const metadata = isRecord(value._meta) ? value._meta : value;
  const receipt = metadata.waylandNanoActivationReceipt;
  if (
    !isRecord(receipt) ||
    receipt.schema !== 'wayland.nano.activation-receipt/v1' ||
    receipt.activation_id !== assertion.activation_id ||
    receipt.product_subject_id !== assertion.product_subject_id ||
    receipt.principal_id !== assertion.principal_id ||
    receipt.project_id !== assertion.project_id ||
    receipt.source_commit_sha !== artifact.sourceCommitSha ||
    receipt.cargo_lock_sha256 !== artifact.cargoLockSha256 ||
    receipt.executable_sha256 !== artifact.sha256 ||
    typeof receipt.receipt_id !== 'string' ||
    typeof receipt.signature !== 'string'
  ) {
    return null;
  }
  const sessionId = typeof value.sessionId === 'string' ? value.sessionId : assertion.session_id;
  if (receipt.session_id !== assertion.session_id && receipt.session_id !== sessionId) return null;
  const fingerprint = metadata.waylandNanoResumeFingerprint;
  return Object.freeze({
    sessionId,
    resumeFingerprint: typeof fingerprint === 'string' && SHA256.test(fingerprint) ? fingerprint : null,
  });
}

function freezeExpectation(value: WaylandNanoBinaryExpectation): WaylandNanoBinaryExpectation {
  return Object.freeze({ ...value });
}

function freezeGrant(value: WaylandNanoActivationGrant): WaylandNanoActivationGrant {
  if (!Number.isSafeInteger(value.validityMs) || value.validityMs <= 0) {
    throw new Error('Wayland Nano activation grant validity is invalid');
  }
  return Object.freeze({
    capabilities: Object.freeze([...value.capabilities]),
    budgets: Object.freeze({ ...value.budgets }),
    controls: Object.freeze([...value.controls]),
    validityMs: value.validityMs,
  });
}

function parseArtifact(value: Record<string, unknown>, ownerRoot: string): WaylandNanoBinaryExpectation | null {
  if (
    typeof value.canonicalPath !== 'string' ||
    !path.isAbsolute(value.canonicalPath) ||
    path.resolve(value.canonicalPath) !== value.canonicalPath ||
    typeof value.stagingRoot !== 'string' ||
    path.resolve(value.stagingRoot) !== value.stagingRoot ||
    !samePath(value.stagingRoot, path.join(ownerRoot, 'staging')) ||
    typeof value.sha256 !== 'string' ||
    !SHA256.test(value.sha256) ||
    typeof value.sourceCommitSha !== 'string' ||
    !SOURCE_SHA.test(value.sourceCommitSha) ||
    typeof value.cargoLockSha256 !== 'string' ||
    !SHA256.test(value.cargoLockSha256) ||
    !Number.isSafeInteger(value.size) ||
    (value.size as number) <= 0
  ) {
    return null;
  }
  return Object.freeze({
    canonicalPath: value.canonicalPath,
    sha256: value.sha256,
    size: value.size as number,
    sourceCommitSha: value.sourceCommitSha,
    cargoLockSha256: value.cargoLockSha256,
    stagingRoot: value.stagingRoot,
  });
}

function parseGrant(value: Record<string, unknown>): WaylandNanoActivationGrant | null {
  const budgets = value.budgets;
  if (
    !Array.isArray(value.capabilities) ||
    value.capabilities.length === 0 ||
    !value.capabilities.every((item): item is WaylandNanoCapability =>
      typeof item === 'string' ? CAPABILITIES.has(item as WaylandNanoCapability) : false
    ) ||
    new Set(value.capabilities).size !== value.capabilities.length ||
    !Array.isArray(value.controls) ||
    !value.controls.every((item): item is WaylandNanoControl =>
      typeof item === 'string' ? CONTROLS.has(item as WaylandNanoControl) : false
    ) ||
    new Set(value.controls).size !== value.controls.length ||
    !Number.isSafeInteger(value.validityMs) ||
    (value.validityMs as number) <= 0 ||
    !isRecord(budgets) ||
    !hasExactKeys(budgets, BUDGET_KEYS) ||
    !BUDGET_KEYS.every((key) => Number.isSafeInteger(budgets[key]) && (budgets[key] as number) >= 0)
  ) {
    return null;
  }
  return freezeGrant({
    capabilities: value.capabilities,
    budgets: budgets as unknown as WaylandNanoBudgets,
    controls: value.controls,
    validityMs: value.validityMs as number,
  });
}

async function ensurePrivateStagingRoot(stagingRoot: string, ownerRoot: string): Promise<void> {
  if (!samePath(path.dirname(stagingRoot), ownerRoot)) throw new Error('Wayland Nano staging root escaped owner root');
  let created = false;
  await mkdir(stagingRoot, { recursive: false, mode: 0o700 })
    .then(() => {
      created = true;
    })
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'EEXIST') throw error;
    });
  const metadata = await lstat(stagingRoot);
  if (
    !metadata.isDirectory() ||
    metadata.isSymbolicLink() ||
    (process.platform !== 'win32' && (metadata.mode & 0o077) !== 0) ||
    !samePath(path.dirname(await realpath(stagingRoot)), ownerRoot)
  ) {
    throw new Error('Wayland Nano staging root is unsafe');
  }
  await enforceOwnerOnlyPath(stagingRoot, 'directory', 'full', !created);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).toSorted();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function samePath(left: string, right: string): boolean {
  return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
