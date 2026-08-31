export type WaylandNanoCapability =
  | 'filesystem.read'
  | 'filesystem.write'
  | 'shell.execute'
  | 'network.egress'
  | 'mcp.invoke'
  | 'task.spawn'
  | 'checkpoint.mutate'
  | 'computer.use';

export type WaylandNanoControl = 'cancel' | 'pause';

export type WaylandNanoBudgets = Readonly<{
  max_turns: number;
  max_tool_calls: number;
  max_input_tokens: number;
  max_output_tokens: number;
  max_cost_microcents: number;
  wall_clock_ms: number;
}>;

export type WaylandNanoBinding = Readonly<{
  productSubjectId: string;
  principalId: string;
  projectId: string;
  issuerId: string;
  issuerKeyRef: string;
  backend: 'wayland-nano';
}>;

export type WaylandNanoActivationSetupState =
  | Readonly<{ enabled: true; binding: WaylandNanoBinding }>
  | Readonly<{
      enabled: false;
      reason: 'binding_missing' | 'binding_retired' | 'binding_invalid' | 'issuer_key_unavailable';
    }>;

export type WaylandNanoContinuity = Readonly<{
  strategy: 'fresh' | 'session_resume' | 'memory_recall';
  fallback: 'none' | 'fresh' | 'memory_recall';
  resume_fingerprint: string | null;
}>;

export type WaylandNanoActivationRequest = Readonly<{
  logicalActivationId: string;
  sessionId: string | null;
  continuity: WaylandNanoContinuity;
  capabilities: readonly WaylandNanoCapability[];
  budgets: WaylandNanoBudgets;
  deadline: string;
  controls: readonly WaylandNanoControl[];
  issuedAt: string;
  notBefore: string;
  notAfter: string;
}>;

export type SignedWaylandNanoActivation = Readonly<{
  schema: 'wayland.nano.activation/v1';
  issuer_id: string;
  key_id: string;
  alg: 'Ed25519';
  issued_at: string;
  not_before: string;
  not_after: string;
  nonce: string;
  product_subject_id: string;
  principal_id: string;
  project_id: string;
  activation_id: string;
  idempotency_key: string;
  session_id: string | null;
  continuity: WaylandNanoContinuity;
  capabilities: readonly WaylandNanoCapability[];
  budgets: WaylandNanoBudgets;
  deadline: string;
  controls: readonly WaylandNanoControl[];
  signature: string;
}>;

export type SignedWaylandNanoControl = Readonly<{
  schema: 'wayland.nano.control/v1';
  issuer_id: string;
  key_id: string;
  alg: 'Ed25519';
  activation_id: string;
  session_id: string;
  principal_id: string;
  project_id: string;
  control: WaylandNanoControl;
  nonce: string;
  issued_at: string;
  not_after: string;
  signature: string;
}>;

export type WaylandNanoSigner = Readonly<{
  keyId: string;
  sign(message: Uint8Array): Promise<Uint8Array>;
}>;
