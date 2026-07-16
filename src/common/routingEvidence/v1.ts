/**
 * Flux routing-evidence consumer contract v1.
 * Producer source: TradeCanyon/flux-router PR #142, merged at 6e7fa427.
 */

import { z } from 'zod';

export const FLUX_ROUTING_EVIDENCE_VERSION = '1.0.0' as const;
export const FLUX_ROUTING_EVIDENCE_GENERATOR_VERSION = '1.0.1' as const;
export const FLUX_ROUTING_EVIDENCE_PRODUCER_COMMIT = '6e7fa427ee6c062b531e67c0e7e1cedfd7aff208' as const;
export const FLUX_ROUTING_EVIDENCE_BASELINE = '6eda360c8497b4dab0e26003ad7bad03d0aa9c6f' as const;
export const FLUX_ROUTING_EVIDENCE_SCHEMA_SHA256 =
  '356fb1f472c9909bc5a11003edf8e4e30e93ad3d06c8607316973acfb490e85a' as const;
export const FLUX_ROUTING_EVIDENCE_BUNDLE_SHA256 =
  '128b817984ff2bb76b8fd8c10d1f35b4ce3ac24498fe1f693068fc4e6d1ce9fd' as const;

const opaqueId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/);
const nonEmpty = z.string().min(1);

export const fluxCorrelationSchema = z
  .object({
    correlation_id: opaqueId,
    desktop_task_id: opaqueId,
    desktop_turn_id: opaqueId,
    backend_spawn_id: opaqueId,
    request_id: opaqueId,
  })
  .strict();

export type FluxRoutingCorrelation = z.infer<typeof fluxCorrelationSchema>;

const degradedProfileSchema = z
  .object({
    profile: z.literal('no_flux'),
    reason: nonEmpty,
    activation: z.literal('on_capability_failure'),
    route_explanations: z.literal(false),
    cost_claims: z.literal(false),
    provider_attempts: z.literal(false),
  })
  .strict();

export const fluxRoutingCapabilitySchema = z
  .object({
    type: z.literal('routing.capabilities'),
    contract_version: z.literal(FLUX_ROUTING_EVIDENCE_VERSION),
    generator_version: z.literal(FLUX_ROUTING_EVIDENCE_GENERATOR_VERSION),
    generated_at: z.string().datetime({ offset: true }),
    ttl_seconds: z.number().int().positive(),
    available: z.boolean(),
    producer: z
      .object({ name: z.literal('flux-router'), baseline_commit: z.literal(FLUX_ROUTING_EVIDENCE_BASELINE) })
      .strict(),
    features: z
      .object({
        routing_evidence: z.boolean(),
        provider_attempts: z.boolean(),
        fallbacks: z.boolean(),
        cost: z.enum(['authoritative_when_priced', 'unavailable']),
        latency: z.enum(['producer_observed_ms', 'unavailable']),
        explicit_native_passthrough: z.literal(true),
      })
      .strict(),
    degraded_profile: degradedProfileSchema,
    reason: z.string().nullable(),
  })
  .strict();

export type FluxRoutingCapability = z.infer<typeof fluxRoutingCapabilitySchema>;

export type FluxRoutingCapabilityDecision =
  | { profile: 'flux'; reason: null; capability: FluxRoutingCapability }
  | { profile: 'no_flux'; reason: string; capability: null };

const commonEvent = {
  contract_version: z.literal(FLUX_ROUTING_EVIDENCE_VERSION),
  event_id: opaqueId,
  sequence: z.number().int().nonnegative(),
  emitted_at: z.string().datetime({ offset: true }),
  correlation: fluxCorrelationSchema,
};

const explicitNativeRoute = z
  .object({
    route_mode: z.literal('explicit_native'),
    requested_model: nonEmpty,
    selected_model: nonEmpty,
    provider: nonEmpty,
    flux_involved: z.literal(false),
    reroute_allowed: z.literal(false),
    precedence: z.literal('explicit_native_over_flux_auto'),
  })
  .strict()
  .refine((route) => route.requested_model === route.selected_model, {
    message: 'Explicit native routing cannot change the requested model.',
  });

const fluxAutoRoute = z
  .object({
    route_mode: z.literal('flux_auto'),
    requested_model: z.literal('flux-auto'),
    selected_model: nonEmpty,
    provider: nonEmpty,
    flux_involved: z.literal(true),
    reroute_allowed: z.literal(true),
    precedence: z.literal('flux_auto'),
  })
  .strict();

const routeSelectedSchema = z
  .object({
    ...commonEvent,
    event_type: z.literal('route.selected'),
    evidence: z.union([explicitNativeRoute, fluxAutoRoute]),
  })
  .strict();

const routeOverrideSchema = z
  .object({
    ...commonEvent,
    event_type: z.literal('route.user_override'),
    evidence: z
      .object({
        route_mode: z.enum(['explicit_native', 'flux_auto']),
        requested_model: nonEmpty,
        replaced_mode: z.enum(['explicit_native', 'flux_auto']),
      })
      .strict(),
  })
  .strict();

const attemptStartedSchema = z
  .object({
    ...commonEvent,
    event_type: z.literal('provider.attempt_started'),
    evidence: z.object({ attempt_id: nonEmpty, provider: nonEmpty, model: nonEmpty }).strict(),
  })
  .strict();

const attemptFailedSchema = z
  .object({
    ...commonEvent,
    event_type: z.literal('provider.attempt_failed'),
    evidence: z.object({ attempt_id: nonEmpty, reason_code: nonEmpty, retryable: z.boolean() }).strict(),
  })
  .strict();

const retrySchema = z
  .object({
    ...commonEvent,
    event_type: z.literal('provider.retry_scheduled'),
    evidence: z
      .object({
        after_attempt_id: nonEmpty,
        retry_number: z.number().int().positive(),
        backoff_ms: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

const fallbackSchema = z
  .object({
    ...commonEvent,
    event_type: z.literal('provider.fallback_selected'),
    evidence: z
      .object({
        from_attempt_id: nonEmpty.optional(),
        from_circuit_id: nonEmpty.optional(),
        provider: nonEmpty,
        model: nonEmpty,
        reason_code: nonEmpty,
      })
      .strict()
      .refine((value) => Number(Boolean(value.from_attempt_id)) + Number(Boolean(value.from_circuit_id)) === 1, {
        message: 'Fallback evidence requires exactly one source.',
      }),
  })
  .strict();

const circuitSchema = z
  .object({
    ...commonEvent,
    event_type: z.literal('provider.circuit_open'),
    evidence: z
      .object({
        circuit_id: nonEmpty,
        provider: nonEmpty,
        model: nonEmpty,
        degraded: z.literal(true),
        reason_code: nonEmpty,
      })
      .strict(),
  })
  .strict();

const unavailableSchema = z
  .object({
    ...commonEvent,
    event_type: z.literal('connection.unavailable'),
    evidence: z
      .object({
        reason_code: z.enum(['disconnected', 'invalid_credential']),
        credential_state: z.enum(['unknown', 'invalid']),
      })
      .strict(),
  })
  .strict();

const pricedCostSchema = z
  .object({
    attempt_id: nonEmpty,
    price_status: z.literal('priced'),
    cost_microusd: z.number().int().nonnegative(),
    currency: z.literal('USD'),
    latency_ms: z.number().int().nonnegative(),
  })
  .strict();

const unpricedCostSchema = z
  .object({
    attempt_id: nonEmpty,
    price_status: z.literal('unpriced'),
    cost_microusd: z.null(),
    currency: z.null(),
    latency_ms: z.number().int().nonnegative(),
    reason_code: z.literal('price_unknown'),
  })
  .strict();

const costSchema = z
  .object({
    ...commonEvent,
    event_type: z.literal('request.cost_observed'),
    evidence: z.union([pricedCostSchema, unpricedCostSchema]),
  })
  .strict();

const terminalSchema = z
  .object({
    ...commonEvent,
    event_type: z.literal('request.terminal'),
    evidence: z
      .object({ outcome: z.enum(['success', 'failure']), reason_code: nonEmpty, attempt_id: nonEmpty.nullable() })
      .strict(),
  })
  .strict();

export const fluxRoutingEventSchema = z.discriminatedUnion('event_type', [
  routeSelectedSchema,
  routeOverrideSchema,
  attemptStartedSchema,
  attemptFailedSchema,
  retrySchema,
  fallbackSchema,
  circuitSchema,
  unavailableSchema,
  costSchema,
  terminalSchema,
]);

export type FluxRoutingEvent = z.infer<typeof fluxRoutingEventSchema>;

export type FluxRoutingEvidenceSummary = {
  route: z.infer<typeof routeSelectedSchema>['evidence'] | null;
  attempts: Array<z.infer<typeof attemptStartedSchema>['evidence']>;
  retries: number;
  fallbacks: number;
  cost: z.infer<typeof costSchema>['evidence'] | null;
  terminal: z.infer<typeof terminalSchema>['evidence'];
};

export type FluxRoutingDecision =
  | { profile: 'flux'; reason: null; events: FluxRoutingEvent[]; summary: FluxRoutingEvidenceSummary }
  | { profile: 'no_flux'; reason: string; events: []; summary: null };

const noFlux = (reason: string): FluxRoutingDecision => ({ profile: 'no_flux', reason, events: [], summary: null });

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .toSorted(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function sameCorrelation(left: FluxRoutingCorrelation, right: FluxRoutingCorrelation): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

export function inspectFluxRoutingCapability(value: unknown, now = new Date()): FluxRoutingCapabilityDecision {
  if (value === null || value === undefined) {
    return { profile: 'no_flux', reason: 'capability_absent', capability: null };
  }
  if (
    value &&
    typeof value === 'object' &&
    'contract_version' in value &&
    (value as { contract_version?: unknown }).contract_version !== FLUX_ROUTING_EVIDENCE_VERSION
  ) {
    return { profile: 'no_flux', reason: 'unsupported_contract_version', capability: null };
  }
  const parsed = fluxRoutingCapabilitySchema.safeParse(value);
  if (!parsed.success) return { profile: 'no_flux', reason: 'capability_malformed', capability: null };
  if (!parsed.data.available || !parsed.data.features.routing_evidence) {
    return {
      profile: 'no_flux',
      reason: parsed.data.reason ?? parsed.data.degraded_profile.reason,
      capability: null,
    };
  }
  const generatedAt = Date.parse(parsed.data.generated_at);
  const ageMs = now.getTime() - generatedAt;
  if (ageMs < -30_000) return { profile: 'no_flux', reason: 'capability_from_future', capability: null };
  if (ageMs > parsed.data.ttl_seconds * 1000) {
    return { profile: 'no_flux', reason: 'capability_stale', capability: null };
  }
  return { profile: 'flux', reason: null, capability: parsed.data };
}

export function evaluateFluxRoutingCapability(value: unknown, now = new Date()): FluxRoutingDecision['profile'] {
  return inspectFluxRoutingCapability(value, now).profile;
}

/**
 * Validate and replay one complete serialized request. Any ambiguity degrades to
 * no_flux so the UI cannot claim a route, attempt, or cost it did not prove.
 */
export function consumeFluxRoutingEvidence(
  values: unknown[],
  expectedCorrelation: FluxRoutingCorrelation
): FluxRoutingDecision {
  if (!Array.isArray(values) || values.length === 0 || values.length > 1_000) return noFlux('stream_invalid');
  if (!fluxCorrelationSchema.safeParse(expectedCorrelation).success) return noFlux('expected_correlation_malformed');
  const accepted: FluxRoutingEvent[] = [];
  const eventIds = new Map<string, string>();
  const attempts = new Set<string>();
  const failedAttempts = new Set<string>();
  const costedAttempts = new Set<string>();
  const circuits = new Set<string>();
  let routeSeen = false;
  let routeRerouteAllowed: boolean | null = null;
  let connectionSeen = false;
  let overrideMode: 'explicit_native' | 'flux_auto' | null = null;
  let expectedSequence = 0;
  let terminalSeen = false;

  for (const value of values) {
    const parsed = fluxRoutingEventSchema.safeParse(value);
    if (!parsed.success) return noFlux('event_malformed');
    const event = parsed.data;
    const serialized = canonicalJson(event);
    const prior = eventIds.get(event.event_id);
    if (prior !== undefined) {
      if (prior !== serialized) return noFlux('duplicate_conflict');
      continue;
    }
    if (terminalSeen) return noFlux('event_after_terminal');
    if (event.sequence !== expectedSequence) return noFlux('sequence_invalid');
    expectedSequence += 1;
    eventIds.set(event.event_id, serialized);
    if (!sameCorrelation(expectedCorrelation, event.correlation)) return noFlux('correlation_mismatch');

    switch (event.event_type) {
      case 'route.user_override':
        if (routeSeen || attempts.size > 0 || overrideMode !== null) return noFlux('route_override_invalid');
        overrideMode = event.evidence.route_mode;
        break;
      case 'route.selected':
        if (routeSeen || attempts.size > 0 || connectionSeen) return noFlux('route_selection_invalid');
        if (overrideMode !== null && event.evidence.route_mode !== overrideMode) {
          return noFlux('route_override_mismatch');
        }
        routeSeen = true;
        routeRerouteAllowed = event.evidence.reroute_allowed;
        break;
      case 'connection.unavailable':
        if (routeSeen || attempts.size > 0 || connectionSeen) return noFlux('connection_invalid');
        connectionSeen = true;
        break;
      case 'provider.attempt_started':
        if (!routeSeen || attempts.has(event.evidence.attempt_id)) return noFlux('attempt_invalid');
        attempts.add(event.evidence.attempt_id);
        break;
      case 'provider.attempt_failed':
        if (!attempts.has(event.evidence.attempt_id) || failedAttempts.has(event.evidence.attempt_id)) {
          return noFlux('attempt_failure_invalid');
        }
        failedAttempts.add(event.evidence.attempt_id);
        break;
      case 'provider.retry_scheduled':
        if (!failedAttempts.has(event.evidence.after_attempt_id)) return noFlux('retry_source_invalid');
        break;
      case 'provider.circuit_open':
        if (!routeSeen || attempts.size > 0) return noFlux('circuit_invalid');
        circuits.add(event.evidence.circuit_id);
        break;
      case 'provider.fallback_selected':
        if (routeRerouteAllowed !== true) return noFlux('fallback_forbidden');
        if (event.evidence.from_attempt_id && !failedAttempts.has(event.evidence.from_attempt_id)) {
          return noFlux('fallback_source_invalid');
        }
        if (event.evidence.from_circuit_id && !circuits.has(event.evidence.from_circuit_id)) {
          return noFlux('fallback_source_invalid');
        }
        break;
      case 'request.cost_observed':
        if (!attempts.has(event.evidence.attempt_id) || costedAttempts.has(event.evidence.attempt_id)) {
          return noFlux('cost_invalid');
        }
        costedAttempts.add(event.evidence.attempt_id);
        break;
      case 'request.terminal':
        if (event.evidence.outcome === 'success') {
          if (
            event.evidence.attempt_id === null ||
            !attempts.has(event.evidence.attempt_id) ||
            !costedAttempts.has(event.evidence.attempt_id) ||
            failedAttempts.has(event.evidence.attempt_id)
          ) {
            return noFlux('terminal_success_invalid');
          }
        } else if (event.evidence.attempt_id === null) {
          if (!connectionSeen) return noFlux('terminal_failure_invalid');
        } else if (!failedAttempts.has(event.evidence.attempt_id)) {
          return noFlux('terminal_failure_invalid');
        }
        terminalSeen = true;
        break;
      default:
        break;
    }
    accepted.push(event);
  }

  const terminal = accepted.findLast((event) => event.event_type === 'request.terminal');
  if (!terminal || terminal.event_type !== 'request.terminal') return noFlux('terminal_missing');
  const unavailable = accepted.find((event) => event.event_type === 'connection.unavailable');
  if (unavailable?.event_type === 'connection.unavailable') return noFlux(unavailable.evidence.reason_code);
  const route = accepted.findLast((event) => event.event_type === 'route.selected');
  const cost = accepted.findLast((event) => event.event_type === 'request.cost_observed');

  return {
    profile: 'flux',
    reason: null,
    events: accepted,
    summary: {
      route: route?.event_type === 'route.selected' ? route.evidence : null,
      attempts: accepted
        .filter(
          (event): event is z.infer<typeof attemptStartedSchema> => event.event_type === 'provider.attempt_started'
        )
        .map(({ evidence }) => evidence),
      retries: accepted.filter(({ event_type }) => event_type === 'provider.retry_scheduled').length,
      fallbacks: accepted.filter(({ event_type }) => event_type === 'provider.fallback_selected').length,
      cost: cost?.event_type === 'request.cost_observed' ? cost.evidence : null,
      terminal: terminal.evidence,
    },
  };
}
