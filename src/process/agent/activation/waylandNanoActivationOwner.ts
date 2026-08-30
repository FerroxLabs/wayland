import { randomUUID } from 'node:crypto';

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
import type { WaylandNanoBinding, WaylandNanoBudgets, WaylandNanoCapability, WaylandNanoControl } from './types';

const OPAQUE_REFERENCE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256 = /^[0-9a-f]{64}$/;

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
  readonly #resumeFingerprints = new Map<string, string>();
  readonly #pendingActivationIds = new Set<string>();
  readonly #binaryTokens = new Set<VerifiedWaylandNanoBinary>();
  #disposed = false;

  constructor(options: WaylandNanoActivationOwnerOptions) {
    this.#artifactExpectation = freezeExpectation(options.artifactExpectation);
    this.#grant = freezeGrant(options.grant);
    this.#now = options.now ?? (() => new Date());
    this.#randomId = options.randomId ?? randomUUID;
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
              if (observed.sessionId && observed.resumeFingerprint) {
                this.#resumeFingerprints.set(observed.sessionId, observed.resumeFingerprint);
              }
              logicalIds.delete(retryKey);
              this.#pendingActivationIds.delete(assertion.activation_id);
              return this.#builder.completeLogicalActivation(assertion.activation_id);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
