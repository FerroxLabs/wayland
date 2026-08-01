/** Shared, backend-neutral capability contract. Producers publish evidence;
 * only the shared selector may turn that evidence into readiness. */
export const CAPABILITY_MANIFEST_CONTRACT = 'wayland-capability-manifest/1.0' as const;
export const CAPABILITY_EVIDENCE_CONTRACT = 'wayland-capability-evidence/1.0' as const;

export type CapabilityEnforceability = 'enforced' | 'brokered' | 'advisory';
export type CapabilityExecutionMode = 'local-binary' | 'host-service' | 'remote-provider';
export type CapabilityEvidenceStatus = 'available' | 'degraded' | 'unavailable';
export type CapabilityReadinessState = 'ready' | 'degraded' | 'brokered' | 'advisory' | 'unavailable';
export type CapabilityPlatform = Readonly<{
  platform: 'darwin' | 'linux' | 'win32';
  arch: 'arm64' | 'x64';
  artifact: string;
  binarySha256: `sha256:${string}`;
  publisherProofSha256?: `sha256:${string}`;
}>;
export type CapabilityRequirements = Readonly<{
  permission: 'none' | 'ask' | 'ask-or-trusted-edits' | 'trusted-edits';
  network: 'none' | 'optional' | 'required';
  cost: 'none' | 'metered' | 'unknown';
  credentials: ReadonlyArray<string>;
}>;
export type CapabilityDefinition = Readonly<{
  id: string;
  version: string;
  operations: ReadonlyArray<string>;
  formats: ReadonlyArray<string>;
  dependencies: ReadonlyArray<string>;
  hostAvailability: 'target-bundled' | 'host-provided' | 'remote';
  backendSupport: ReadonlyArray<string>;
  executionMode: CapabilityExecutionMode;
  requirements: CapabilityRequirements;
  platforms: ReadonlyArray<CapabilityPlatform>;
  fixtureDigest: `sha256:${string}`;
  degradedBehavior: 'unavailable-no-fallback' | 'read-only' | 'explicit-broker-consent';
  enforceability: CapabilityEnforceability;
}>;
export type CapabilityManifest = Readonly<{
  contract: typeof CAPABILITY_MANIFEST_CONTRACT;
  id: string;
  version: string;
  capabilities: ReadonlyArray<CapabilityDefinition>;
}>;
export type CapabilityDependencyEvidence = Readonly<{ id: string; status: 'ready' | 'unavailable' }>;
export type CapabilityArtifactEvidence = Readonly<{
  binarySha256: `sha256:${string}`;
  publisherProof: `sha256:${string}`;
}>;
export type CapabilityEvidence = Readonly<{
  contract: typeof CAPABILITY_EVIDENCE_CONTRACT;
  evidenceId: string;
  capabilityId: string;
  capabilityVersion: string;
  manifestId: string;
  manifestVersion: string;
  fixtureDigest: `sha256:${string}`;
  source: string;
  sourceInstance: string;
  correlationId: string;
  observedAt: number;
  expiresAt: number;
  platform: CapabilityPlatform['platform'];
  arch: CapabilityPlatform['arch'];
  backend: string;
  executionMode: CapabilityExecutionMode;
  status: CapabilityEvidenceStatus;
  operations: ReadonlyArray<string>;
  formats: ReadonlyArray<string>;
  dependencies: ReadonlyArray<CapabilityDependencyEvidence>;
  requirements: CapabilityRequirements;
  artifact?: CapabilityArtifactEvidence;
  reason: string;
}>;
export type CapabilityReadiness = Readonly<{
  capabilityId: string;
  capabilityVersion: string;
  state: CapabilityReadinessState;
  canInvoke: boolean;
  requiresBroker: boolean;
  enforceability: CapabilityEnforceability;
  operations: ReadonlyArray<string>;
  formats: ReadonlyArray<string>;
  requirements: CapabilityRequirements;
  evidenceIds: ReadonlyArray<string>;
  reason: string;
}>;
export type CapabilitySelectionContext = Readonly<{
  capabilityId: string;
  correlationId: string;
  platform: CapabilityPlatform['platform'];
  arch: CapabilityPlatform['arch'];
  backend: string;
  now: number;
}>;
