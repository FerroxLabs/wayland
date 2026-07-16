/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  M0B_ACCESSIBILITY_SEVERITIES,
  M0B_COHORTS,
  M0B_PRIMARY_JOURNEYS,
  M0B_RETURN_REASONS,
  M0B_SCHEMA_VERSION,
  M0B_SHELLS,
  M0B_SUPPORT_CATEGORIES,
  M0B_ZERO_TOLERANCE_REASONS,
  type M0BCohortEvent,
  type M0BValidationResult,
} from './types';

const COMMON_FIELDS = [
  'schemaVersion',
  'eventId',
  'participantIdHash',
  'sessionId',
  'occurredAtMs',
  'cohort',
  'shell',
  'kind',
] as const;

const EVENT_FIELDS: Record<string, readonly string[]> = {
  session_started: COMMON_FIELDS,
  session_ended: COMMON_FIELDS,
  session_crashed: COMMON_FIELDS,
  journey_started: [...COMMON_FIELDS, 'journeyRunId', 'journeyId'],
  journey_completed: [...COMMON_FIELDS, 'journeyRunId', 'journeyId'],
  journey_failed: [...COMMON_FIELDS, 'journeyRunId', 'journeyId'],
  accessibility_violation: [...COMMON_FIELDS, 'severity'],
  support_contact: [...COMMON_FIELDS, 'category'],
  shell_returned_to_classic: [...COMMON_FIELDS, 'reason'],
  zero_tolerance_stop: [...COMMON_FIELDS, 'reason'],
};

const FORBIDDEN_FIELD_PATTERN =
  /(prompt|message|content|text|file|path|url|uri|secret|token|password|api.?key|argument|command|query|response|output|input|metadata)/i;
const OPAQUE_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const HASH_PATTERN = /^[a-f0-9]{16,128}$/;

const isOneOf = <T extends string>(value: unknown, values: readonly T[]): value is T =>
  typeof value === 'string' && values.includes(value as T);

function invalid(code: Exclude<M0BValidationResult, { ok: true }>['code'], field?: string): M0BValidationResult {
  return { ok: false, code, field };
}

/**
 * Parse the cohort authority event format. Unknown fields are rejected rather
 * than stripped so prompt, file, URL, tool argument, or secret collection can
 * never be hidden behind a nominally valid aggregate.
 */
export function validateM0BCohortEvent(input: unknown): M0BValidationResult {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('not_object');
  }

  const record = input as Record<string, unknown>;
  const kind = record.kind;
  if (typeof kind !== 'string' || !(kind in EVENT_FIELDS)) {
    return invalid('unknown_event_kind', 'kind');
  }

  const allowedFields = new Set(EVENT_FIELDS[kind]);
  for (const key of Object.keys(record)) {
    if (!allowedFields.has(key)) {
      return invalid(FORBIDDEN_FIELD_PATTERN.test(key) ? 'forbidden_field' : 'unknown_field', key);
    }
  }
  for (const key of allowedFields) {
    if (!(key in record)) {
      return invalid('missing_field', key);
    }
  }

  if (record.schemaVersion !== M0B_SCHEMA_VERSION) return invalid('invalid_field', 'schemaVersion');
  if (typeof record.eventId !== 'string' || !OPAQUE_ID_PATTERN.test(record.eventId)) {
    return invalid('invalid_field', 'eventId');
  }
  if (typeof record.participantIdHash !== 'string' || !HASH_PATTERN.test(record.participantIdHash)) {
    return invalid('invalid_field', 'participantIdHash');
  }
  if (typeof record.sessionId !== 'string' || !OPAQUE_ID_PATTERN.test(record.sessionId)) {
    return invalid('invalid_field', 'sessionId');
  }
  if (!Number.isSafeInteger(record.occurredAtMs) || Number(record.occurredAtMs) < 0) {
    return invalid('invalid_field', 'occurredAtMs');
  }
  if (!isOneOf(record.cohort, M0B_COHORTS)) return invalid('invalid_field', 'cohort');
  if (!isOneOf(record.shell, M0B_SHELLS)) return invalid('invalid_field', 'shell');

  if (kind.startsWith('journey_')) {
    if (typeof record.journeyRunId !== 'string' || !OPAQUE_ID_PATTERN.test(record.journeyRunId)) {
      return invalid('invalid_field', 'journeyRunId');
    }
    if (!isOneOf(record.journeyId, M0B_PRIMARY_JOURNEYS)) {
      return invalid('invalid_field', 'journeyId');
    }
  } else if (kind === 'accessibility_violation') {
    if (!isOneOf(record.severity, M0B_ACCESSIBILITY_SEVERITIES)) {
      return invalid('invalid_field', 'severity');
    }
  } else if (kind === 'support_contact') {
    if (!isOneOf(record.category, M0B_SUPPORT_CATEGORIES)) {
      return invalid('invalid_field', 'category');
    }
  } else if (kind === 'shell_returned_to_classic') {
    if (!isOneOf(record.reason, M0B_RETURN_REASONS)) {
      return invalid('invalid_field', 'reason');
    }
  } else if (kind === 'zero_tolerance_stop') {
    if (!isOneOf(record.reason, M0B_ZERO_TOLERANCE_REASONS)) {
      return invalid('invalid_field', 'reason');
    }
  }

  return { ok: true, event: record as M0BCohortEvent };
}
