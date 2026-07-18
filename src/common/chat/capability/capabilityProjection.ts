/**
 * A read-only, backend-neutral projection of capability evidence.
 *
 * This module deliberately owns no discovery, routing, credential, or session
 * authority. Process adapters feed it normalized evidence; it only validates,
 * ranks, bounds, and freezes a display-safe snapshot.
 */

export const CAPABILITY_PROJECTION_VERSION = '1.0' as const;
export const MAX_CAPABILITY_EVIDENCE = 256;
export const DEFAULT_CAPABILITY_MAX_AGE_MS = 5 * 60_000;

const MAX_MODELS_PER_PROVIDER = 512;
const MAX_MCP_ITEMS_PER_KIND = 1_024;
const MAX_TOTAL_MODELS = 4_096;
const MAX_TOTAL_MCP_ITEMS = 8_192;
const MAX_STRING = 128;
const MAX_REASON = 512;
const MAX_FUTURE_SKEW_MS = 30_000;

export type CapabilityEvidenceSource =
  | 'session_receipt'
  | 'runtime_probe'
  | 'routing_contract'
  | 'engine_ready'
  | 'provider_registry'
  | 'stored_config'
  | 'static_catalog';

export type CapabilitySourceContractIdentity = {
  name: string;
  version: string;
  digest: string;
};

export type CapabilityStatus = 'configured' | 'available' | 'degraded' | 'unavailable';
export type ProviderMode = 'local' | 'byok' | 'flux';
export type ModelModality = 'text' | 'image' | 'audio' | 'video' | 'files';

export type CapabilityModelEvidence = {
  id: string;
  label?: string;
  inputModalities: ModelModality[];
  outputModalities: ModelModality[];
};

export type CapabilityStreamWindow = {
  /** First sequence intentionally included in this bounded projection window. */
  startSequence: number;
  /** Last sequence intentionally included; every sequence in the range must exist. */
  endSequence: number;
};

export type ProviderCapabilityPayload = {
  providerId: string;
  mode: ProviderMode;
  status: CapabilityStatus;
  reason?: string;
  models: CapabilityModelEvidence[];
  /** Authoritative callable count when the producer cannot disclose model identities. */
  callableModelCount?: number;
};

export type SelectionCapabilityPayload = {
  providerId: string;
  modelId: string;
  mode: ProviderMode;
  status: 'available' | 'degraded' | 'unavailable' | 'fallback';
  requestedModelId?: string;
  fallbackFrom?: { providerId: string; modelId: string };
  handoffFrom?: { providerId: string; modelId: string };
  reason?: string;
};

export type McpCapabilityPayload = {
  serverId: string;
  status: 'configured' | 'probe_reachable' | 'published_unverified' | 'registered' | 'degraded' | 'failed';
  tools?: string[];
  resources?: string[];
  prompts?: string[];
  reason?: string;
};

export type VoiceCapabilityPayload = {
  direction: 'input' | 'output';
  providerId: string;
  status: CapabilityStatus;
  voices?: string[];
  reason?: string;
};

export type BrowserCapabilityPayload = {
  status: CapabilityStatus;
  controls: Array<'observe' | 'navigate' | 'interact' | 'computer_use'>;
  reason?: string;
};

export type CapabilityEvidence = {
  contractVersion: typeof CAPABILITY_PROJECTION_VERSION;
  evidenceId: string;
  source: CapabilityEvidenceSource;
  sourceInstance: string;
  sourceContract: CapabilitySourceContractIdentity;
  observedAt: number;
  sequence: number;
  streamWindow: CapabilityStreamWindow;
  conversationId?: string;
  sessionId?: string;
} & (
  | { kind: 'provider'; payload: ProviderCapabilityPayload }
  | { kind: 'selection'; payload: SelectionCapabilityPayload }
  | { kind: 'mcp'; payload: McpCapabilityPayload }
  | { kind: 'voice'; payload: VoiceCapabilityPayload }
  | { kind: 'browser'; payload: BrowserCapabilityPayload }
);

export type CapabilityProjectionIssueCode =
  | 'oversized_input'
  | 'malformed_evidence'
  | 'version_mismatch'
  | 'source_mismatch'
  | 'session_mismatch'
  | 'stale_evidence'
  | 'future_evidence'
  | 'conflicting_claims'
  | 'evidence_gap'
  | 'invalid_handoff'
  | 'unavailable_dependency'
  | 'unsupported_modality';

export type CapabilityProjectionIssue = Readonly<{
  code: CapabilityProjectionIssueCode;
  evidenceId?: string;
  reason: string;
}>;

export type ProjectedProvider = Readonly<{
  providerId: string;
  mode: ProviderMode;
  status: CapabilityStatus;
  reason: string | null;
  models: ReadonlyArray<
    Readonly<{
      id: string;
      label: string;
      inputModalities: ReadonlyArray<ModelModality>;
      outputModalities: ReadonlyArray<ModelModality>;
    }>
  >;
  callableModelCount: number;
  evidenceId: string;
}>;

export type CapabilityProjection = Readonly<{
  contractVersion: typeof CAPABILITY_PROJECTION_VERSION;
  state: 'ready' | 'needs_setup' | 'degraded' | 'unavailable' | 'invalid';
  conversationId: string;
  sessionId: string;
  selected: null | Readonly<{
    providerId: string;
    modelId: string;
    mode: ProviderMode;
    status: 'available' | 'degraded' | 'unavailable' | 'fallback';
    requestedModelId: string | null;
    fallbackFrom: Readonly<{ providerId: string; modelId: string }> | null;
    handoffFrom: Readonly<{ providerId: string; modelId: string }> | null;
    reason: string | null;
    inputModalities: ReadonlyArray<ModelModality>;
    outputModalities: ReadonlyArray<ModelModality>;
    evidenceId: string;
  }>;
  providers: ReadonlyArray<ProjectedProvider>;
  mcp: Readonly<{
    status: 'available' | 'degraded' | 'unavailable' | 'unverified';
    servers: ReadonlyArray<
      Readonly<{
        serverId: string;
        status: McpCapabilityPayload['status'];
        tools: ReadonlyArray<string>;
        resources: ReadonlyArray<string>;
        prompts: ReadonlyArray<string>;
        reason: string | null;
        evidenceId: string;
      }>
    >;
    tools: ReadonlyArray<string>;
    resources: ReadonlyArray<string>;
    prompts: ReadonlyArray<string>;
  }>;
  voice: Readonly<{
    input: Readonly<{
      status: CapabilityStatus;
      providerId: string | null;
      voices: ReadonlyArray<string>;
      reason: string | null;
    }>;
    output: Readonly<{
      status: CapabilityStatus;
      providerId: string | null;
      voices: ReadonlyArray<string>;
      reason: string | null;
    }>;
  }>;
  browser: Readonly<{
    status: CapabilityStatus;
    controls: ReadonlyArray<BrowserCapabilityPayload['controls'][number]>;
    reason: string | null;
  }>;
  issues: ReadonlyArray<CapabilityProjectionIssue>;
  evidenceIds: ReadonlyArray<string>;
}>;

export type CapabilityProjectionOptions = {
  conversationId: string;
  sessionId: string;
  now?: number;
  maxAgeMs?: number;
  requiredInputModalities?: readonly ModelModality[];
  /** Mandatory producer pins. Every consumed source must have an exact entry. */
  expectedSourceContracts: Partial<Record<CapabilityEvidenceSource, CapabilitySourceContractIdentity>>;
  /** Mandatory launch/generation pins. Every consumed source must have an exact allowed instance. */
  expectedSourceInstances: Partial<Record<CapabilityEvidenceSource, string | readonly string[]>>;
};

type NormalizedEvidence = CapabilityEvidence;

const SOURCE_AUTHORITY: Readonly<Record<CapabilityEvidenceSource, number>> = {
  session_receipt: 700,
  runtime_probe: 600,
  routing_contract: 550,
  engine_ready: 500,
  provider_registry: 400,
  stored_config: 200,
  static_catalog: 100,
};

const LIVENESS_SOURCES = new Set<CapabilityEvidenceSource>([
  'session_receipt',
  'runtime_probe',
  'routing_contract',
  'engine_ready',
  'provider_registry',
]);

const SOURCE_KINDS: Readonly<Record<CapabilityEvidence['kind'], ReadonlySet<CapabilityEvidenceSource>>> = {
  provider: new Set([
    'session_receipt',
    'runtime_probe',
    'routing_contract',
    'provider_registry',
    'stored_config',
    'static_catalog',
  ]),
  selection: new Set(['session_receipt']),
  mcp: new Set(['session_receipt', 'runtime_probe', 'stored_config']),
  voice: new Set(['runtime_probe', 'stored_config']),
  browser: new Set(['engine_ready', 'runtime_probe', 'stored_config']),
};

const MODALITIES = new Set<ModelModality>(['text', 'image', 'audio', 'video', 'files']);
const PROVIDER_MODES = new Set<ProviderMode>(['local', 'byok', 'flux']);
const CAPABILITY_STATUSES = new Set<CapabilityStatus>(['configured', 'available', 'degraded', 'unavailable']);
const MCP_STATUSES = new Set<McpCapabilityPayload['status']>([
  'configured',
  'probe_reachable',
  'published_unverified',
  'registered',
  'degraded',
  'failed',
]);
const BROWSER_CONTROLS = new Set<BrowserCapabilityPayload['controls'][number]>([
  'observe',
  'navigate',
  'interact',
  'computer_use',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  try {
    return Object.getPrototypeOf(value) === Object.prototype;
  } catch {
    return false;
  }
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedKeys = new Set(allowed);
  try {
    const keys = Reflect.ownKeys(value);
    if (
      !keys.every((key) => {
        if (typeof key !== 'string' || !allowedKeys.has(key)) return false;
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        return Boolean(descriptor?.enumerable && Object.hasOwn(descriptor, 'value'));
      })
    ) {
      return false;
    }
    // A polluted Object.prototype must not provide an optional or required
    // protocol field that the evidence object itself did not declare.
    return allowed.every((key) => !(key in value) || Object.hasOwn(value, key));
  } catch {
    return false;
  }
}

/** Locale-independent identity ordering. Never use localeCompare for protocol state. */
export function compareCapabilityIdentity(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function cleanString(value: unknown, max = MAX_STRING): string | null {
  if (typeof value !== 'string') return null;
  // Bound validation work before trim() scans or allocates attacker-controlled
  // input. Protocol strings are intentionally strict and never need megabytes
  // of surrounding whitespace.
  if (value.length === 0 || value.length > max) return null;
  const cleaned = value.trim();
  return cleaned.length > 0 && cleaned.length <= max ? cleaned : null;
}

/**
 * Remove high-confidence credential material from a bounded diagnostic string.
 *
 * This intentionally does not redact arbitrary long words or prose. Bare-token
 * matching is limited to well-known credential families; generic values are
 * removed only behind an explicit credential assignment/header/query key.
 */
function redactReasonSecrets(reason: string): string {
  return reason
    .replace(
      /-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----[\s\S]*?(?:-----END (?:[A-Z0-9]+ )?PRIVATE KEY-----|$)/gi,
      '[redacted-private-key]'
    )
    .replace(
      /\bhttps:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/gi,
      '[redacted-slack-webhook]'
    )
    .replace(/\b((?:https?|postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqps?):\/\/)[^@\s/]+@/gi, '$1[redacted]@')
    .replace(
      /([?&#](?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|id[_-]?token|session[_-]?token|x-amz-(?:credential|signature|security-token)|token|auth|credential|key|secret|password|passwd|pwd|signature|sig)=)[^&#\s]+/gi,
      '$1[redacted]'
    )
    .replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, '[redacted-aws-access-key]')
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,255}\b/g, '[redacted-github-token]')
    .replace(/\bgh[pousr]_[A-Za-z0-9]{20,255}\b/g, '[redacted-github-token]')
    .replace(/\bgl(?:pat|ptt|ft|rt|cbt|dt|imt|agent|soat)-[A-Za-z0-9_-]{12,255}\b/g, '[redacted-gitlab-token]')
    .replace(/\bxox[a-z]-[A-Za-z0-9-]{10,255}\b/gi, '[redacted-slack-token]')
    .replace(/\bAIza[0-9A-Za-z_-]{35}\b/g, '[redacted-google-api-key]')
    .replace(/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g, '[redacted-jwt]')
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, '[redacted-provider-key]')
    .replace(/\b(authorization\s*[:=]\s*)(?:Bearer|Basic)\s+[^\s,;]+/gi, '$1[redacted]')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
    .replace(
      /\b((?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|private[_ -]?key|account[_ -]?key|shared[_ -]?access[_ -]?(?:key|signature)|aws[_ -]?secret[_ -]?access[_ -]?key|authorization|password|passwd|pwd|token|secret|credential|sas)\s*[:=]\s*)(["'])[^"']{4,}\2/gi,
      '$1[redacted]'
    )
    .replace(
      /\b((?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|private[_ -]?key|account[_ -]?key|shared[_ -]?access[_ -]?(?:key|signature)|aws[_ -]?secret[_ -]?access[_ -]?key|authorization|password|passwd|pwd|token|secret|credential|sas)\s*[:=]\s*)[^\s,;&]+/gi,
      '$1[redacted]'
    );
}

function cleanReason(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  const reason = cleanString(value, MAX_REASON);
  if (!reason) return reason;
  return redactReasonSecrets(reason);
}

/** Reject credential-shaped material from identifiers/inventory that is echoed. */
function cleanDisplayString(value: unknown, max = MAX_STRING): string | null {
  const cleaned = cleanString(value, max);
  if (!cleaned) return null;
  return redactReasonSecrets(cleaned) === cleaned ? cleaned : null;
}

function cleanStringList(value: unknown, maxItems: number): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const cleaned: string[] = [];
  for (const item of value) {
    const text = cleanDisplayString(item);
    if (!text) return null;
    cleaned.push(text);
  }
  return [...new Set(cleaned)].toSorted();
}

function cleanEnumList<T extends string>(value: unknown, allowed: ReadonlySet<T>, maxItems: number): T[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const cleaned: T[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !allowed.has(item as T)) return null;
    cleaned.push(item as T);
  }
  return [...new Set(cleaned)].toSorted();
}

function cleanModel(value: unknown): CapabilityModelEvidence | null {
  if (!isRecord(value)) return null;
  if (!hasOnlyKeys(value, ['id', 'label', 'inputModalities', 'outputModalities'])) return null;
  const id = cleanDisplayString(value.id);
  const label = value.label === undefined ? undefined : cleanDisplayString(value.label);
  const inputModalities = cleanEnumList(value.inputModalities, MODALITIES, MODALITIES.size);
  const outputModalities = cleanEnumList(value.outputModalities, MODALITIES, MODALITIES.size);
  if (!id || label === null || !inputModalities || !outputModalities) return null;
  return { id, label: label ?? id, inputModalities, outputModalities };
}

function cleanPair(value: unknown): { providerId: string; modelId: string } | undefined | null {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return null;
  if (!hasOnlyKeys(value, ['providerId', 'modelId'])) return null;
  const providerId = cleanDisplayString(value.providerId);
  const modelId = cleanDisplayString(value.modelId);
  return providerId && modelId ? { providerId, modelId } : null;
}

function cleanSourceContract(value: unknown): CapabilitySourceContractIdentity | undefined | null {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return null;
  if (!hasOnlyKeys(value, ['name', 'version', 'digest'])) return null;
  const name = cleanString(value.name);
  const version = cleanString(value.version);
  const digest = cleanString(value.digest);
  return name && version && digest ? { name, version, digest } : null;
}

function cleanStreamWindow(value: unknown, sequence: number): CapabilityStreamWindow | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ['startSequence', 'endSequence'])) return null;
  const startSequence = value.startSequence;
  const endSequence = value.endSequence;
  if (
    !Number.isSafeInteger(startSequence) ||
    !Number.isSafeInteger(endSequence) ||
    (startSequence as number) < 0 ||
    (endSequence as number) < (startSequence as number) ||
    sequence < (startSequence as number) ||
    sequence > (endSequence as number) ||
    (endSequence as number) - (startSequence as number) + 1 > MAX_CAPABILITY_EVIDENCE
  ) {
    return null;
  }
  return { startSequence: startSequence as number, endSequence: endSequence as number };
}

function issue(code: CapabilityProjectionIssueCode, reason: string, evidenceId?: string): CapabilityProjectionIssue {
  return { code, reason, ...(evidenceId ? { evidenceId } : {}) };
}

function parseEvidence(value: unknown): { evidence?: NormalizedEvidence; issue?: CapabilityProjectionIssue } {
  if (!isRecord(value)) return { issue: issue('malformed_evidence', 'Evidence must be an object') };
  if (
    !hasOnlyKeys(value, [
      'contractVersion',
      'evidenceId',
      'source',
      'sourceInstance',
      'sourceContract',
      'observedAt',
      'sequence',
      'streamWindow',
      'conversationId',
      'sessionId',
      'kind',
      'payload',
    ])
  ) {
    return { issue: issue('malformed_evidence', 'Evidence envelope contains unknown fields') };
  }
  const evidenceId = cleanDisplayString(value.evidenceId) ?? undefined;
  if (value.contractVersion !== CAPABILITY_PROJECTION_VERSION) {
    return { issue: issue('version_mismatch', 'Capability evidence contract version does not match', evidenceId) };
  }
  const source = cleanString(value.source) as CapabilityEvidenceSource | null;
  const sourceInstance = cleanString(value.sourceInstance);
  const kind = cleanString(value.kind) as CapabilityEvidence['kind'] | null;
  if (
    !evidenceId ||
    !source ||
    !Object.hasOwn(SOURCE_AUTHORITY, source) ||
    !sourceInstance ||
    !kind ||
    !Object.hasOwn(SOURCE_KINDS, kind) ||
    !Number.isFinite(value.observedAt) ||
    !Number.isSafeInteger(value.sequence) ||
    (value.sequence as number) < 0 ||
    !isRecord(value.payload)
  ) {
    return { issue: issue('malformed_evidence', 'Evidence envelope is malformed', evidenceId) };
  }
  if (!SOURCE_KINDS[kind].has(source)) {
    return { issue: issue('source_mismatch', `${source} cannot author ${kind} evidence`, evidenceId) };
  }
  const conversationId = value.conversationId === undefined ? undefined : cleanString(value.conversationId);
  const sessionId = value.sessionId === undefined ? undefined : cleanString(value.sessionId);
  const sourceContract = cleanSourceContract(value.sourceContract);
  const streamWindow = cleanStreamWindow(value.streamWindow, value.sequence as number);
  if (conversationId === null || sessionId === null || !sourceContract || !streamWindow) {
    return { issue: issue('malformed_evidence', 'Source, session, or stream binding is malformed', evidenceId) };
  }

  const common = {
    contractVersion: CAPABILITY_PROJECTION_VERSION,
    evidenceId,
    source,
    sourceInstance,
    sourceContract,
    observedAt: value.observedAt as number,
    sequence: value.sequence as number,
    streamWindow,
    ...(conversationId ? { conversationId } : {}),
    ...(sessionId ? { sessionId } : {}),
  };
  const payload = value.payload;

  if (kind === 'provider') {
    if (!hasOnlyKeys(payload, ['providerId', 'mode', 'status', 'reason', 'models', 'callableModelCount'])) {
      return { issue: issue('malformed_evidence', 'Provider payload contains unknown fields', evidenceId) };
    }
    const providerId = cleanDisplayString(payload.providerId);
    const mode = cleanString(payload.mode) as ProviderMode | null;
    const status = cleanString(payload.status) as CapabilityStatus | null;
    const reason = cleanReason(payload.reason);
    const callableModelCount = payload.callableModelCount === undefined ? undefined : payload.callableModelCount;
    if (
      !providerId ||
      !mode ||
      !PROVIDER_MODES.has(mode) ||
      !status ||
      !CAPABILITY_STATUSES.has(status) ||
      reason === null ||
      (callableModelCount !== undefined &&
        (!Number.isSafeInteger(callableModelCount) || (callableModelCount as number) < 0)) ||
      !Array.isArray(payload.models) ||
      payload.models.length > MAX_MODELS_PER_PROVIDER
    ) {
      return { issue: issue('malformed_evidence', 'Provider capability payload is malformed', evidenceId) };
    }
    if (source === 'routing_contract' && (providerId !== 'flux-router' || mode !== 'flux')) {
      return {
        issue: issue('source_mismatch', 'Routing-contract evidence may describe only Flux capability', evidenceId),
      };
    }
    if ((source === 'stored_config' || source === 'static_catalog') && status !== 'configured') {
      return {
        issue: issue(
          'source_mismatch',
          `${source} may describe configured models but cannot prove live provider availability`,
          evidenceId
        ),
      };
    }
    const models = payload.models.map(cleanModel);
    if (models.some((model) => !model)) {
      return { issue: issue('malformed_evidence', 'Provider model evidence is malformed', evidenceId) };
    }
    const byId = new Map<string, CapabilityModelEvidence>();
    for (const model of models as CapabilityModelEvidence[]) {
      const prior = byId.get(model.id);
      if (prior && canonical(prior) !== canonical(model)) {
        return {
          issue: issue('conflicting_claims', `Provider repeats model ${model.id} with conflicting claims`, evidenceId),
        };
      }
      byId.set(model.id, model);
    }
    const normalizedModelCount = callableModelCount === undefined ? byId.size : (callableModelCount as number);
    if (normalizedModelCount < byId.size) {
      return {
        issue: issue('conflicting_claims', 'Callable model count is smaller than the named catalog', evidenceId),
      };
    }
    return {
      evidence: {
        ...common,
        kind,
        payload: {
          providerId,
          mode,
          status,
          ...(reason ? { reason } : {}),
          models: [...byId.values()].toSorted((a, b) => compareCapabilityIdentity(a.id, b.id)),
          callableModelCount: normalizedModelCount,
        },
      },
    };
  }

  if (kind === 'selection') {
    if (
      !hasOnlyKeys(payload, [
        'providerId',
        'modelId',
        'mode',
        'status',
        'requestedModelId',
        'fallbackFrom',
        'handoffFrom',
        'reason',
      ])
    ) {
      return { issue: issue('malformed_evidence', 'Selection payload contains unknown fields', evidenceId) };
    }
    const providerId = cleanDisplayString(payload.providerId);
    const modelId = cleanDisplayString(payload.modelId);
    const mode = cleanString(payload.mode) as ProviderMode | null;
    const status = cleanString(payload.status) as SelectionCapabilityPayload['status'] | null;
    const requestedModelId =
      payload.requestedModelId === undefined ? undefined : cleanDisplayString(payload.requestedModelId);
    const fallbackFrom = cleanPair(payload.fallbackFrom);
    const handoffFrom = cleanPair(payload.handoffFrom);
    const reason = cleanReason(payload.reason);
    if (
      !providerId ||
      !modelId ||
      !mode ||
      !PROVIDER_MODES.has(mode) ||
      !status ||
      !new Set(['available', 'degraded', 'unavailable', 'fallback']).has(status) ||
      requestedModelId === null ||
      fallbackFrom === null ||
      handoffFrom === null ||
      reason === null ||
      (status === 'fallback' && !fallbackFrom) ||
      (fallbackFrom !== undefined && handoffFrom !== undefined)
    ) {
      return { issue: issue('malformed_evidence', 'Selection capability payload is malformed', evidenceId) };
    }
    return {
      evidence: {
        ...common,
        kind,
        payload: {
          providerId,
          modelId,
          mode,
          status,
          ...(requestedModelId ? { requestedModelId } : {}),
          ...(fallbackFrom ? { fallbackFrom } : {}),
          ...(handoffFrom ? { handoffFrom } : {}),
          ...(reason ? { reason } : {}),
        },
      },
    };
  }

  if (kind === 'mcp') {
    if (!hasOnlyKeys(payload, ['serverId', 'status', 'tools', 'resources', 'prompts', 'reason'])) {
      return { issue: issue('malformed_evidence', 'MCP payload contains unknown fields', evidenceId) };
    }
    const serverId = cleanDisplayString(payload.serverId);
    const status = cleanString(payload.status) as McpCapabilityPayload['status'] | null;
    const tools = cleanStringList(payload.tools, MAX_MCP_ITEMS_PER_KIND);
    const resources = cleanStringList(payload.resources, MAX_MCP_ITEMS_PER_KIND);
    const prompts = cleanStringList(payload.prompts, MAX_MCP_ITEMS_PER_KIND);
    const reason = cleanReason(payload.reason);
    if (!serverId || !status || !MCP_STATUSES.has(status) || !tools || !resources || !prompts || reason === null) {
      return { issue: issue('malformed_evidence', 'MCP capability payload is malformed', evidenceId) };
    }
    if (source !== 'session_receipt' && (tools.length > 0 || resources.length > 0 || prompts.length > 0)) {
      return { issue: issue('source_mismatch', 'Only a session receipt may publish MCP inventory', evidenceId) };
    }
    if (status === 'registered' && source !== 'session_receipt') {
      return { issue: issue('source_mismatch', 'Only a session receipt may prove MCP registration', evidenceId) };
    }
    if (source === 'stored_config' && status !== 'configured') {
      return { issue: issue('source_mismatch', 'Stored MCP configuration cannot claim runtime state', evidenceId) };
    }
    if (status === 'registered' && tools.length + resources.length + prompts.length === 0) {
      return { issue: issue('source_mismatch', 'Registered MCP evidence must publish useful inventory', evidenceId) };
    }
    if (status !== 'registered' && (tools.length > 0 || resources.length > 0 || prompts.length > 0)) {
      return {
        issue: issue('source_mismatch', 'Unregistered MCP evidence cannot expose callable inventory', evidenceId),
      };
    }
    return {
      evidence: {
        ...common,
        kind,
        payload: { serverId, status, tools, resources, prompts, ...(reason ? { reason } : {}) },
      },
    };
  }

  if (kind === 'voice') {
    if (!hasOnlyKeys(payload, ['direction', 'providerId', 'status', 'voices', 'reason'])) {
      return { issue: issue('malformed_evidence', 'Voice payload contains unknown fields', evidenceId) };
    }
    const direction = cleanString(payload.direction) as VoiceCapabilityPayload['direction'] | null;
    const providerId = cleanDisplayString(payload.providerId);
    const status = cleanString(payload.status) as CapabilityStatus | null;
    const voices = cleanStringList(payload.voices, MAX_MCP_ITEMS_PER_KIND);
    const reason = cleanReason(payload.reason);
    if (
      !direction ||
      !new Set(['input', 'output']).has(direction) ||
      !providerId ||
      !status ||
      !CAPABILITY_STATUSES.has(status) ||
      !voices ||
      reason === null ||
      (source === 'stored_config' && status !== 'configured')
    ) {
      return {
        issue: issue('source_mismatch', 'Voice evidence exceeds its source authority or is malformed', evidenceId),
      };
    }
    return {
      evidence: {
        ...common,
        kind,
        payload: { direction, providerId, status, voices, ...(reason ? { reason } : {}) },
      },
    };
  }

  if (!hasOnlyKeys(payload, ['status', 'controls', 'reason'])) {
    return { issue: issue('malformed_evidence', 'Browser payload contains unknown fields', evidenceId) };
  }
  const status = cleanString(payload.status) as CapabilityStatus | null;
  const controls = cleanEnumList(payload.controls, BROWSER_CONTROLS, BROWSER_CONTROLS.size);
  const reason = cleanReason(payload.reason);
  if (
    !status ||
    !CAPABILITY_STATUSES.has(status) ||
    !controls ||
    reason === null ||
    (source === 'stored_config' && status !== 'configured')
  ) {
    return {
      issue: issue('source_mismatch', 'Browser evidence exceeds its source authority or is malformed', evidenceId),
    };
  }
  return { evidence: { ...common, kind, payload: { status, controls, ...(reason ? { reason } : {}) } } };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .toSorted()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function entityKey(evidence: NormalizedEvidence): string {
  switch (evidence.kind) {
    case 'provider':
      return evidence.payload.providerId;
    case 'selection':
      return 'selection';
    case 'mcp':
      return evidence.payload.serverId;
    case 'voice':
      return evidence.payload.direction;
    case 'browser':
      return 'browser';
  }
}

function groupBy<T, K>(values: readonly T[], keyFor: (value: T) => K): Map<K, T[]> {
  const grouped = new Map<K, T[]>();
  for (const value of values) {
    const key = keyFor(value);
    grouped.set(key, [...(grouped.get(key) ?? []), value]);
  }
  return grouped;
}

function streamKey(evidence: NormalizedEvidence): string {
  return `${evidence.source}\u0000${evidence.sourceInstance}`;
}

function streamClaimIdentity(evidence: NormalizedEvidence): string {
  const { evidenceId: _evidenceId, ...claim } = evidence;
  return canonical(claim);
}

/** Validate the producer's bounded global stream before any entity reduction. */
function validateEvidenceStreams(evidence: readonly NormalizedEvidence[]): CapabilityProjectionIssue | undefined {
  for (const [key, claims] of groupBy(evidence, streamKey)) {
    const windows = new Set(claims.map((claim) => canonical(claim.streamWindow)));
    if (windows.size !== 1) {
      return issue('conflicting_claims', `Capability stream ${key} has conflicting windows`, claims[0]?.evidenceId);
    }
    const window = claims[0].streamWindow;
    const bySequence = groupBy(claims, (claim) => claim.sequence);
    const ordered: NormalizedEvidence[] = [];
    for (let sequence = window.startSequence; sequence <= window.endSequence; sequence += 1) {
      const sequenceClaims = bySequence.get(sequence);
      if (!sequenceClaims || sequenceClaims.length === 0) {
        return issue('evidence_gap', `Capability stream ${key} is missing sequence ${sequence}`);
      }
      if (new Set(sequenceClaims.map(streamClaimIdentity)).size > 1) {
        return issue(
          'conflicting_claims',
          `Capability stream ${key} reuses sequence ${sequence}`,
          sequenceClaims[0].evidenceId
        );
      }
      ordered.push(sequenceClaims.toSorted((a, b) => compareCapabilityIdentity(a.evidenceId, b.evidenceId))[0]);
    }
    if ([...bySequence.keys()].some((sequence) => sequence < window.startSequence || sequence > window.endSequence)) {
      return issue('conflicting_claims', `Capability stream ${key} contains evidence outside its declared window`);
    }
    for (let index = 1; index < ordered.length; index += 1) {
      if (ordered[index].observedAt < ordered[index - 1].observedAt) {
        return issue('conflicting_claims', `Capability stream ${key} time moves backwards`, ordered[index].evidenceId);
      }
    }
  }
  return undefined;
}

function selectAuthoritative(
  evidence: readonly NormalizedEvidence[],
  kind: Exclude<CapabilityEvidence['kind'], 'selection'>
): { selected: NormalizedEvidence[]; issue?: CapabilityProjectionIssue } {
  const grouped = new Map<string, NormalizedEvidence[]>();
  for (const item of evidence.filter((candidate) => candidate.kind === kind)) {
    const key = entityKey(item);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  const selected: NormalizedEvidence[] = [];
  for (const [key, claims] of grouped) {
    const streamLatest = new Map<string, NormalizedEvidence>();
    const streams = groupBy(claims, streamKey);
    for (const [sourceAndInstance, streamClaims] of streams) {
      const bySequence = groupBy(streamClaims, (claim) => claim.sequence);
      const ordered: NormalizedEvidence[] = [];
      for (const sequenceClaims of bySequence.values()) {
        if (new Set(sequenceClaims.map((claim) => canonical(claim.payload))).size > 1) {
          return {
            selected: [],
            issue: issue(
              'conflicting_claims',
              `${kind} ${key} has conflicting stream claims`,
              sequenceClaims[0]?.evidenceId
            ),
          };
        }
        ordered.push(sequenceClaims.toSorted((a, b) => compareCapabilityIdentity(a.evidenceId, b.evidenceId))[0]);
      }
      ordered.sort((a, b) => a.sequence - b.sequence);
      for (let index = 1; index < ordered.length; index += 1) {
        if (ordered[index].observedAt < ordered[index - 1].observedAt) {
          return {
            selected: [],
            issue: issue('conflicting_claims', `${kind} ${key} stream time moves backwards`, ordered[index].evidenceId),
          };
        }
      }
      streamLatest.set(sourceAndInstance, ordered.at(-1)!);
    }
    const candidates = [...streamLatest.values()];
    const liveCandidates = candidates.filter((candidate) => LIVENESS_SOURCES.has(candidate.source));
    let eligible = liveCandidates.length > 0 ? liveCandidates : candidates;
    if (kind === 'mcp') {
      const registeredReceipts = candidates.filter(
        (candidate) => candidate.source === 'session_receipt' && candidate.payload.status === 'registered'
      );
      if (registeredReceipts.length > 0) {
        const latestReceiptTime = Math.max(...registeredReceipts.map((candidate) => candidate.observedAt));
        const laterRevocations = liveCandidates.filter(
          (candidate) =>
            candidate.observedAt > latestReceiptTime &&
            (candidate.payload.status === 'degraded' || candidate.payload.status === 'failed')
        );
        // Reachability/configuration observations do not revoke a bound session
        // registration receipt. An explicit later failure still supersedes it.
        eligible = laterRevocations.length > 0 ? laterRevocations : registeredReceipts;
      }
    }
    const latestTime = Math.max(...eligible.map((candidate) => candidate.observedAt));
    const latestAtTime = eligible.filter((candidate) => candidate.observedAt === latestTime);
    const highestAuthority = Math.max(...latestAtTime.map((candidate) => SOURCE_AUTHORITY[candidate.source]));
    const latest = latestAtTime.filter((candidate) => SOURCE_AUTHORITY[candidate.source] === highestAuthority);
    if (latest.length > 1 && new Set(latest.map((candidate) => canonical(candidate.payload))).size > 1) {
      return { selected: [], issue: issue('conflicting_claims', `${kind} ${key} has equally authoritative conflicts`) };
    }
    selected.push(latest.toSorted((a, b) => compareCapabilityIdentity(a.evidenceId, b.evidenceId))[0]);
  }
  return { selected: selected.toSorted((a, b) => compareCapabilityIdentity(entityKey(a), entityKey(b))) };
}

function selectSessionSelection(evidence: readonly NormalizedEvidence[]): {
  selected: Extract<NormalizedEvidence, { kind: 'selection' }> | null;
  issue?: CapabilityProjectionIssue;
} {
  const claims = evidence.filter(
    (candidate): candidate is Extract<NormalizedEvidence, { kind: 'selection' }> => candidate.kind === 'selection'
  );
  if (claims.length === 0) return { selected: null };
  if (new Set(claims.map((claim) => claim.sourceInstance)).size !== 1) {
    return { selected: null, issue: issue('conflicting_claims', 'Multiple sources claim selected-session authority') };
  }
  const bySequence = new Map<number, Extract<NormalizedEvidence, { kind: 'selection' }>>();
  for (const claim of claims) {
    const prior = bySequence.get(claim.sequence);
    if (prior && canonical(prior.payload) !== canonical(claim.payload)) {
      return {
        selected: null,
        issue: issue('conflicting_claims', 'Selected-session sequence conflicts', claim.evidenceId),
      };
    }
    bySequence.set(claim.sequence, prior && prior.evidenceId < claim.evidenceId ? prior : claim);
  }
  const ordered = [...bySequence.values()].toSorted((a, b) => a.sequence - b.sequence);
  const initial = ordered[0];
  if (initial?.payload.handoffFrom || initial?.payload.fallbackFrom) {
    return {
      selected: null,
      issue: issue(
        'invalid_handoff',
        'Initial selected-session claim cannot assert an unobserved predecessor',
        initial.evidenceId
      ),
    };
  }
  for (let index = 1; index < ordered.length; index += 1) {
    const prior = ordered[index - 1];
    const current = ordered[index];
    if (current.observedAt < prior.observedAt) {
      return {
        selected: null,
        issue: issue('conflicting_claims', 'Selected-session stream time moves backwards', current.evidenceId),
      };
    }
    const changed =
      prior.payload.providerId !== current.payload.providerId || prior.payload.modelId !== current.payload.modelId;
    if (!changed) {
      if (current.payload.fallbackFrom || current.payload.handoffFrom) {
        return {
          selected: null,
          issue: issue(
            'invalid_handoff',
            'Unchanged selected-session claim cannot assert a predecessor transition',
            current.evidenceId
          ),
        };
      }
      continue;
    }
    const lineage = current.payload.status === 'fallback' ? current.payload.fallbackFrom : current.payload.handoffFrom;
    const selfLineage =
      lineage?.providerId === current.payload.providerId && lineage?.modelId === current.payload.modelId;
    const validLineage =
      changed && lineage?.providerId === prior.payload.providerId && lineage?.modelId === prior.payload.modelId;
    if (selfLineage || !validLineage) {
      return {
        selected: null,
        issue: issue(
          'invalid_handoff',
          'Selected-session lineage does not bind its immediate predecessor',
          current.evidenceId
        ),
      };
    }
  }
  return { selected: ordered.at(-1) ?? null };
}

function deepFreeze<T>(value: T): Readonly<T> {
  const stack: unknown[] = [value];
  const seen = new Set<object>();
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current !== 'object' || current === null || seen.has(current)) continue;
    seen.add(current);
    for (const child of Object.values(current)) stack.push(child);
    Object.freeze(current);
  }
  return value as Readonly<T>;
}

type MutableVoiceDirection = {
  status: CapabilityStatus;
  providerId: string | null;
  voices: string[];
  reason: string | null;
};

function emptyVoice(): MutableVoiceDirection {
  return { status: 'unavailable', providerId: null, voices: [], reason: null };
}

function invalidProjection(
  options: CapabilityProjectionOptions,
  issues: readonly CapabilityProjectionIssue[],
  evidenceIds: readonly string[] = []
): CapabilityProjection {
  return deepFreeze({
    contractVersion: CAPABILITY_PROJECTION_VERSION,
    state: 'invalid' as const,
    conversationId: cleanDisplayString(options.conversationId) ?? '',
    sessionId: cleanDisplayString(options.sessionId) ?? '',
    selected: null,
    providers: [],
    mcp: { status: 'unavailable' as const, servers: [], tools: [], resources: [], prompts: [] },
    voice: { input: emptyVoice(), output: emptyVoice() },
    browser: { status: 'unavailable' as const, controls: [], reason: null },
    issues: [...issues].toSorted((a, b) =>
      compareCapabilityIdentity(
        `${a.code}:${a.evidenceId ?? ''}:${a.reason}`,
        `${b.code}:${b.evidenceId ?? ''}:${b.reason}`
      )
    ),
    evidenceIds: [...evidenceIds].toSorted(),
  });
}

function projectCapabilitiesUnsafe(
  rawEvidence: readonly unknown[],
  options: CapabilityProjectionOptions
): CapabilityProjection {
  if (!Array.isArray(rawEvidence)) {
    return invalidProjection(options, [issue('malformed_evidence', 'Capability evidence must be an array')]);
  }
  if (rawEvidence.length > MAX_CAPABILITY_EVIDENCE) {
    return invalidProjection(options, [
      issue('oversized_input', `Capability evidence exceeds ${MAX_CAPABILITY_EVIDENCE} items`),
    ]);
  }
  const conversationId = cleanDisplayString(options.conversationId);
  const sessionId = cleanDisplayString(options.sessionId);
  const now = options.now ?? Date.now();
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_CAPABILITY_MAX_AGE_MS;
  const requiredInputModalities = cleanEnumList(options.requiredInputModalities ?? [], MODALITIES, MODALITIES.size);
  if (
    !conversationId ||
    !sessionId ||
    !Number.isFinite(now) ||
    !Number.isFinite(maxAgeMs) ||
    maxAgeMs < 0 ||
    !requiredInputModalities ||
    !isRecord(options.expectedSourceContracts) ||
    !isRecord(options.expectedSourceInstances)
  ) {
    return invalidProjection(options, [issue('malformed_evidence', 'Projection options are malformed')]);
  }

  const evidence: NormalizedEvidence[] = [];
  const issues: CapabilityProjectionIssue[] = [];
  const evidenceById = new Map<string, NormalizedEvidence>();
  let totalModels = 0;
  let totalMcpItems = 0;
  for (const raw of rawEvidence) {
    let parsed: ReturnType<typeof parseEvidence>;
    try {
      parsed = parseEvidence(raw);
    } catch {
      issues.push(issue('malformed_evidence', 'Evidence could not be read safely'));
      continue;
    }
    if (parsed.issue) {
      issues.push(parsed.issue);
      continue;
    }
    const item = parsed.evidence!;
    const expectedSourceContract = options.expectedSourceContracts[item.source];
    if (
      !expectedSourceContract ||
      !item.sourceContract ||
      canonical(item.sourceContract) !== canonical(expectedSourceContract)
    ) {
      issues.push(issue('source_mismatch', 'Capability source contract identity does not match', item.evidenceId));
      continue;
    }
    const expectedInstances = options.expectedSourceInstances[item.source];
    const allowedInstances =
      typeof expectedInstances === 'string'
        ? [cleanString(expectedInstances)]
        : Array.isArray(expectedInstances)
          ? expectedInstances.map((instance) => cleanString(instance))
          : [];
    if (
      allowedInstances.length === 0 ||
      allowedInstances.some((instance) => !instance) ||
      !allowedInstances.includes(item.sourceInstance)
    ) {
      issues.push(issue('source_mismatch', 'Capability source instance/generation does not match', item.evidenceId));
      continue;
    }
    if (item.source === 'session_receipt' && (item.conversationId !== conversationId || item.sessionId !== sessionId)) {
      issues.push(
        issue('session_mismatch', 'Session receipt is bound to a different conversation or session', item.evidenceId)
      );
      continue;
    }
    const duplicate = evidenceById.get(item.evidenceId);
    if (duplicate && canonical(duplicate) !== canonical(item)) {
      issues.push(issue('conflicting_claims', 'Evidence ID was reused for a different claim', item.evidenceId));
      continue;
    }
    if (!duplicate) {
      if (item.kind === 'provider') {
        // Only disclosed identities consume the inventory memory bound. A
        // count-only producer may truthfully report any safe integer without
        // forcing allocation or making a large legitimate registry invalid.
        totalModels += item.payload.models.length;
      }
      if (item.kind === 'mcp') {
        totalMcpItems +=
          (item.payload.tools?.length ?? 0) +
          (item.payload.resources?.length ?? 0) +
          (item.payload.prompts?.length ?? 0);
      }
      if (totalModels > MAX_TOTAL_MODELS || totalMcpItems > MAX_TOTAL_MCP_ITEMS) {
        issues.push(
          issue('oversized_input', 'Capability evidence inventory exceeds aggregate bounds', item.evidenceId)
        );
        continue;
      }
      evidenceById.set(item.evidenceId, item);
      evidence.push(item);
    }
  }
  if (issues.length > 0) return invalidProjection(options, issues, [...evidenceById.keys()]);

  const streamIssue = validateEvidenceStreams(evidence);
  if (streamIssue) return invalidProjection(options, [streamIssue], [...evidenceById.keys()]);

  const providersResult = selectAuthoritative(evidence, 'provider');
  const mcpResult = selectAuthoritative(evidence, 'mcp');
  const voiceResult = selectAuthoritative(evidence, 'voice');
  const browserResult = selectAuthoritative(evidence, 'browser');
  const selectionResult = selectSessionSelection(evidence);
  const selectionIssues = [
    providersResult.issue,
    mcpResult.issue,
    voiceResult.issue,
    browserResult.issue,
    selectionResult.issue,
  ].filter((value): value is CapabilityProjectionIssue => Boolean(value));
  if (selectionIssues.length > 0) return invalidProjection(options, selectionIssues, [...evidenceById.keys()]);

  // Freshness applies to the reduced liveness state, not historical links in a
  // complete stream window. Exact-generation selection receipts remain valid
  // for the life of that session and are superseded only by a later sequence.
  const currentLiveness = [
    ...providersResult.selected,
    ...mcpResult.selected,
    ...voiceResult.selected,
    ...browserResult.selected,
  ].filter((item) => LIVENESS_SOURCES.has(item.source));
  const freshnessIssues: CapabilityProjectionIssue[] = [];
  for (const item of currentLiveness) {
    if (now - item.observedAt > maxAgeMs) {
      freshnessIssues.push(issue('stale_evidence', 'Current capability liveness evidence is stale', item.evidenceId));
    }
    if (item.observedAt - now > MAX_FUTURE_SKEW_MS) {
      freshnessIssues.push(
        issue('future_evidence', 'Current capability evidence is dated in the future', item.evidenceId)
      );
    }
  }
  if (selectionResult.selected && selectionResult.selected.observedAt - now > MAX_FUTURE_SKEW_MS) {
    freshnessIssues.push(
      issue('future_evidence', 'Selected-session evidence is dated in the future', selectionResult.selected.evidenceId)
    );
  }
  if (freshnessIssues.length > 0) {
    return invalidProjection(options, freshnessIssues, [...evidenceById.keys()]);
  }

  const providers: ProjectedProvider[] = providersResult.selected.map((item) => {
    const provider = (item as Extract<NormalizedEvidence, { kind: 'provider' }>).payload;
    return {
      providerId: provider.providerId,
      mode: provider.mode,
      status: provider.status,
      reason: provider.reason ?? null,
      models: provider.models.map((model) => ({
        id: model.id,
        label: model.label ?? model.id,
        inputModalities: [...model.inputModalities],
        outputModalities: [...model.outputModalities],
      })),
      callableModelCount: provider.callableModelCount ?? provider.models.length,
      evidenceId: item.evidenceId,
    };
  });

  let selected: CapabilityProjection['selected'] = null;
  const nonFatalIssues: CapabilityProjectionIssue[] = [];
  if (selectionResult.selected) {
    const selection = selectionResult.selected;
    const provider = providers.find((candidate) => candidate.providerId === selection.payload.providerId);
    const model = provider?.models.find((candidate) => candidate.id === selection.payload.modelId);
    const required = requiredInputModalities;
    const missing = required.filter((modality) => !model?.inputModalities.includes(modality));
    if (provider && provider.mode !== selection.payload.mode) {
      return invalidProjection(
        options,
        [
          issue(
            'conflicting_claims',
            'Selected-session mode conflicts with authoritative provider capability',
            selection.evidenceId
          ),
        ],
        [...evidenceById.keys()]
      );
    }
    const unavailableDependency = !provider || provider.status === 'configured' || provider.status === 'unavailable';
    const unsupported = unavailableDependency || !model || missing.length > 0;
    if (unsupported) {
      nonFatalIssues.push(
        issue(
          unavailableDependency ? 'unavailable_dependency' : 'unsupported_modality',
          !provider
            ? 'Selected provider has no authoritative capability evidence'
            : provider.status === 'configured'
              ? 'Selected provider is configured but has no live availability proof'
              : provider.status === 'unavailable'
                ? `Selected provider is unavailable${provider.reason ? `: ${provider.reason}` : ''}`
                : !model
                  ? 'Selected model is absent from the authoritative provider catalog'
                  : `Selected model does not support: ${missing.join(', ')}`,
          selection.evidenceId
        )
      );
    }
    const effectiveStatus = unsupported
      ? 'unavailable'
      : provider?.status === 'degraded'
        ? 'degraded'
        : selection.payload.status;
    selected = {
      providerId: selection.payload.providerId,
      modelId: selection.payload.modelId,
      mode: selection.payload.mode,
      status: effectiveStatus,
      requestedModelId: selection.payload.requestedModelId ?? null,
      fallbackFrom: selection.payload.fallbackFrom ? { ...selection.payload.fallbackFrom } : null,
      handoffFrom: selection.payload.handoffFrom ? { ...selection.payload.handoffFrom } : null,
      reason: unsupported
        ? nonFatalIssues.at(-1)!.reason
        : (selection.payload.reason ?? (provider?.status === 'degraded' ? provider.reason : null)),
      inputModalities: model ? [...model.inputModalities] : [],
      outputModalities: model ? [...model.outputModalities] : [],
      evidenceId: selection.evidenceId,
    };
  }

  const mcpServers = mcpResult.selected.map((item) => {
    const payload = (item as Extract<NormalizedEvidence, { kind: 'mcp' }>).payload;
    return {
      serverId: payload.serverId,
      status: payload.status,
      tools: [...(payload.tools ?? [])],
      resources: [...(payload.resources ?? [])],
      prompts: [...(payload.prompts ?? [])],
      reason: payload.reason ?? null,
      evidenceId: item.evidenceId,
    };
  });
  const mcpInventory = (field: 'tools' | 'resources' | 'prompts') =>
    [
      ...new Set(mcpServers.filter((server) => server.status === 'registered').flatMap((server) => server[field])),
    ].toSorted();
  const mcpStatus = mcpServers.some((server) => server.status === 'registered')
    ? mcpServers.some((server) => server.status !== 'registered')
      ? ('degraded' as const)
      : ('available' as const)
    : mcpServers.length === 0
      ? ('unavailable' as const)
      : mcpServers.some((server) => server.status === 'degraded' || server.status === 'failed') &&
          !mcpServers.every((server) => server.status === 'failed')
        ? ('degraded' as const)
        : mcpServers.every((server) => server.status === 'failed')
          ? ('unavailable' as const)
          : ('unverified' as const);

  const voice = { input: emptyVoice(), output: emptyVoice() };
  for (const item of voiceResult.selected) {
    const payload = (item as Extract<NormalizedEvidence, { kind: 'voice' }>).payload;
    voice[payload.direction] = {
      status: payload.status,
      providerId: payload.providerId,
      voices: [...(payload.voices ?? [])],
      reason: payload.reason ?? null,
    };
  }
  const browserEvidence = browserResult.selected[0] as Extract<NormalizedEvidence, { kind: 'browser' }> | undefined;
  const browser = browserEvidence
    ? {
        status: browserEvidence.payload.status,
        controls: [...browserEvidence.payload.controls],
        reason: browserEvidence.payload.reason ?? null,
      }
    : { status: 'unavailable' as const, controls: [], reason: null };

  const providerSupportsRequiredInput = (provider: ProjectedProvider): boolean => {
    if (requiredInputModalities.length === 0) return provider.callableModelCount > 0;
    return provider.models.some((model) =>
      requiredInputModalities.every((modality) => model.inputModalities.includes(modality))
    );
  };
  const compatible = providers.filter(providerSupportsRequiredInput);
  const state = selected
    ? selected.status === 'unavailable'
      ? ('unavailable' as const)
      : selected.status === 'degraded' || selected.status === 'fallback'
        ? ('degraded' as const)
        : ('ready' as const)
    : compatible.some((provider) => provider.status === 'available')
      ? ('ready' as const)
      : compatible.some((provider) => provider.status === 'degraded')
        ? ('degraded' as const)
        : providers.length === 0 || providers.some((provider) => provider.status === 'configured')
          ? ('needs_setup' as const)
          : ('unavailable' as const);

  return deepFreeze({
    contractVersion: CAPABILITY_PROJECTION_VERSION,
    state,
    conversationId,
    sessionId,
    selected,
    providers,
    mcp: {
      status: mcpStatus,
      servers: mcpServers,
      tools: mcpInventory('tools'),
      resources: mcpInventory('resources'),
      prompts: mcpInventory('prompts'),
    },
    voice,
    browser,
    issues: nonFatalIssues,
    evidenceIds: [...evidenceById.keys()].toSorted(),
  });
}

/** Public fail-closed boundary, including hostile array containers/options. */
export function projectCapabilities(
  rawEvidence: readonly unknown[],
  options: CapabilityProjectionOptions
): CapabilityProjection {
  try {
    return projectCapabilitiesUnsafe(rawEvidence, options);
  } catch {
    return invalidProjection(
      {
        conversationId: '',
        sessionId: '',
        now: 0,
        expectedSourceContracts: {},
        expectedSourceInstances: {},
      },
      [issue('malformed_evidence', 'Capability projection input could not be read safely')]
    );
  }
}
