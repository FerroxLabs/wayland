import canonicalize from 'canonicalize';
import { createHash } from 'node:crypto';

import type {
  SignedWaylandNanoActivation,
  SignedWaylandNanoControl,
  WaylandNanoActivationRequest,
  WaylandNanoBinding,
  WaylandNanoControl,
  WaylandNanoSigner,
} from './types';

const ACTIVATION_DOMAIN = Buffer.from('WAYLAND-NANO-ACTIVATION\0v1\0', 'utf8');
const CONTROL_DOMAIN = Buffer.from('WAYLAND-NANO-CONTROL\0v1\0', 'utf8');

export type WaylandNanoActivationBuilderDependencies = Readonly<{
  randomId(): string;
  loadSigner(keyRef: string): Promise<WaylandNanoSigner>;
}>;

type RetryEntry = Readonly<{ inputDigest: string; assertion: Promise<SignedWaylandNanoActivation> }>;

export class WaylandNanoActivationRetryConflictError extends Error {
  constructor() {
    super('Wayland Nano logical activation retry changed immutable inputs');
    this.name = 'WaylandNanoActivationRetryConflictError';
  }
}

/** Sole Desktop producer for signed Nano activation and control assertions. */
export class WaylandNanoActivationBuilder {
  readonly #dependencies: WaylandNanoActivationBuilderDependencies;
  readonly #retryAssertions = new Map<string, RetryEntry>();

  constructor(dependencies: WaylandNanoActivationBuilderDependencies) {
    this.#dependencies = dependencies;
  }

  buildActivation(
    binding: WaylandNanoBinding,
    request: WaylandNanoActivationRequest
  ): Promise<SignedWaylandNanoActivation> {
    const inputDigest = retryInputDigest(binding, request);
    const existing = this.#retryAssertions.get(request.logicalActivationId);
    if (existing) {
      if (existing.inputDigest !== inputDigest) return Promise.reject(new WaylandNanoActivationRetryConflictError());
      return existing.assertion;
    }
    const pending = this.signActivation(binding, request);
    const entry = Object.freeze({ inputDigest, assertion: pending });
    this.#retryAssertions.set(request.logicalActivationId, entry);
    pending.catch(() => {
      if (this.#retryAssertions.get(request.logicalActivationId) === entry) {
        this.#retryAssertions.delete(request.logicalActivationId);
      }
    });
    return pending;
  }

  /** Production callers invoke this only after a terminal signed receipt/refusal. */
  completeLogicalActivation(logicalActivationId: string): boolean {
    return this.#retryAssertions.delete(logicalActivationId);
  }

  hasPendingLogicalActivation(logicalActivationId: string): boolean {
    return this.#retryAssertions.has(logicalActivationId);
  }

  async buildControl(
    input: Readonly<{
      binding: WaylandNanoBinding;
      activationId: string;
      sessionId: string;
      control: WaylandNanoControl;
      issuedAt: string;
      notAfter: string;
    }>
  ): Promise<SignedWaylandNanoControl> {
    const signer = await this.#dependencies.loadSigner(input.binding.issuerKeyRef);
    const unsigned = {
      schema: 'wayland.nano.control/v1' as const,
      issuer_id: input.binding.issuerId,
      key_id: signer.keyId,
      alg: 'Ed25519' as const,
      activation_id: input.activationId,
      session_id: input.sessionId,
      principal_id: input.binding.principalId,
      project_id: input.binding.projectId,
      control: input.control,
      nonce: this.#dependencies.randomId(),
      issued_at: input.issuedAt,
      not_after: input.notAfter,
    };
    const signature = await signCanonical(CONTROL_DOMAIN, unsigned, signer);
    return deepFreeze({ ...unsigned, signature });
  }

  private async signActivation(
    binding: WaylandNanoBinding,
    request: WaylandNanoActivationRequest
  ): Promise<SignedWaylandNanoActivation> {
    const signer = await this.#dependencies.loadSigner(binding.issuerKeyRef);
    const nonce = this.#dependencies.randomId();
    const idempotencyKey = this.#dependencies.randomId();
    const unsigned = {
      schema: 'wayland.nano.activation/v1' as const,
      issuer_id: binding.issuerId,
      key_id: signer.keyId,
      alg: 'Ed25519' as const,
      issued_at: request.issuedAt,
      not_before: request.notBefore,
      not_after: request.notAfter,
      nonce,
      product_subject_id: binding.productSubjectId,
      principal_id: binding.principalId,
      project_id: binding.projectId,
      activation_id: request.logicalActivationId,
      idempotency_key: idempotencyKey,
      session_id: request.sessionId,
      continuity: { ...request.continuity },
      capabilities: [...request.capabilities],
      budgets: { ...request.budgets },
      deadline: request.deadline,
      controls: [...request.controls],
    };
    const signature = await signCanonical(ACTIVATION_DOMAIN, unsigned, signer);
    return deepFreeze({ ...unsigned, signature });
  }
}

function retryInputDigest(binding: WaylandNanoBinding, request: WaylandNanoActivationRequest): string {
  return createHash('sha256').update(canonicalWaylandNanoBytes({ binding, request })).digest('hex');
}

export function canonicalWaylandNanoBytes(value: unknown): Uint8Array {
  const encoded = canonicalize(value);
  if (typeof encoded !== 'string') throw new Error('Wayland Nano assertion cannot be canonicalized');
  return Buffer.from(encoded, 'utf8');
}

async function signCanonical(domain: Uint8Array, value: unknown, signer: WaylandNanoSigner): Promise<string> {
  const canonical = canonicalWaylandNanoBytes(value);
  const message = Buffer.concat([domain, canonical]);
  const signature = Buffer.from(await signer.sign(message));
  if (signature.byteLength !== 64) throw new Error('Wayland Nano signer returned an invalid Ed25519 signature');
  return signature.toString('base64url');
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
