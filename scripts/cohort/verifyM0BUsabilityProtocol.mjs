#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE), '../..');
const TYPES_FILE = resolve(REPOSITORY_ROOT, 'src/process/services/cohort/types.ts');
const COMMON_TYPES_FILE = resolve(REPOSITORY_ROOT, 'src/common/types/cohortRollout.ts');
const POLICY_FILE = resolve(REPOSITORY_ROOT, 'src/process/services/cohort/policy.ts');

const PROTOCOL_VERSION = 'wayland-desktop-m0b-usability/1';
const FROZEN_CANONICAL_SHA256 = 'sha256:886d38d16a1fe380f83c816d787c228f56c18f9a51e3701a35a97ebd551e252a';
const PRIVACY_MODES = ['local-aggregate-only', 'structured-cohort-uat'];
const OUTCOMES = ['success', 'failure', 'abandoned'];
const CONFUSION_LEVELS = ['none', 'self-recovered', 'moderator-prompt-required', 'blocked'];
const NOVICE_SCRIPT_IDS = ['novice.quick-start', 'novice.substantial-work'];
const DENOMINATORS = {
  journeyFailureRate: 'journey_failed / journey_started',
  journeySuccessRate: 'journey_completed / journey_started',
  p95LatencyMs: 'terminal journey duration for journey_completed or journey_failed',
  crashFreeSessionRate: 'session_ended / (session_ended + session_crashed)',
  supportContactsPerParticipant: 'support_contact / distinct participantIdHash from session_started',
  accessibilityViolationsPerSession: 'critical-or-serious accessibility_violation / session_started',
  returnToClassicRate: 'shell_returned_to_classic / cockpit session_started',
};
const DENOMINATOR_KEYS = Object.keys(DENOMINATORS);
const PRIVACY_EXCLUSIONS = [
  'prompt-or-message-content',
  'file-content-or-path',
  'url-or-query',
  'tool-arguments-or-command',
  'credential-or-secret',
  'freeform-metadata',
];
const SIGNING_BINDINGS = [
  'protocolSha256',
  'candidateCommit',
  'candidateTree',
  'appVersion',
  'windowStartMs',
  'windowEndMs',
  'aggregateReportSha256',
  'decisionOwner',
  'decisionSignedAtMs',
  'signature',
];

export class M0BProtocolError extends Error {
  constructor(code, path, detail) {
    super(`${code}:${path}${detail ? `:${detail}` : ''}`);
    this.name = 'M0BProtocolError';
    this.code = code;
    this.path = path;
  }
}

function fail(code, path, detail) {
  throw new M0BProtocolError(code, path, detail);
}

function object(value, path) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('M0B_PROTOCOL_TYPE', path, 'object');
  return value;
}

function exactKeys(value, expected, path) {
  const record = object(value, path);
  const actual = Object.keys(record);
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail('M0B_PROTOCOL_KEYS', path, `expected=${expected.join(',')};actual=${actual.join(',')}`);
  }
  return record;
}

function nonEmptyString(value, path) {
  if (typeof value !== 'string' || value.trim() !== value || value.length === 0) {
    fail('M0B_PROTOCOL_VALUE', path, 'non-empty-trimmed-string');
  }
  return value;
}

function exactValue(actual, expected, path) {
  if (!Object.is(actual, expected)) fail('M0B_PROTOCOL_VALUE', path, `expected=${String(expected)}`);
}

function exactArray(actual, expected, path) {
  if (!Array.isArray(actual)) fail('M0B_PROTOCOL_TYPE', path, 'array');
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    fail('M0B_PROTOCOL_ARRAY', path, `expected=${JSON.stringify(expected)};actual=${JSON.stringify(actual)}`);
  }
  if (new Set(actual).size !== actual.length) fail('M0B_PROTOCOL_ARRAY', path, 'duplicates');
}

function positiveSafeInteger(value, path) {
  if (!Number.isSafeInteger(value) || value < 1) fail('M0B_PROTOCOL_NUMBER', path, 'positive-safe-integer');
}

function finiteNumber(value, path) {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail('M0B_PROTOCOL_NUMBER', path, 'finite-number');
}

function literalParser(source, constants, path) {
  let offset = 0;
  const whitespace = () => {
    while (/\s/.test(source[offset] ?? '')) offset += 1;
  };
  const identifier = () => {
    whitespace();
    const match = /^[A-Za-z_$][\w$-]*/.exec(source.slice(offset));
    if (!match) fail('M0B_RUNTIME_SOURCE', path, `identifier-at-${offset}`);
    offset += match[0].length;
    return match[0];
  };
  const string = () => {
    whitespace();
    const quote = source[offset];
    if (quote !== "'" && quote !== '"') fail('M0B_RUNTIME_SOURCE', path, `string-at-${offset}`);
    offset += 1;
    let result = '';
    while (offset < source.length && source[offset] !== quote) {
      if (source[offset] === '\\') {
        offset += 1;
        const escaped = source[offset];
        const escapes = { n: '\n', r: '\r', t: '\t', '\\': '\\', "'": "'", '"': '"' };
        result += escapes[escaped] ?? escaped;
      } else {
        result += source[offset];
      }
      offset += 1;
    }
    if (source[offset] !== quote) fail('M0B_RUNTIME_SOURCE', path, 'unterminated-string');
    offset += 1;
    return result;
  };
  const value = () => {
    whitespace();
    const character = source[offset];
    if (character === "'" || character === '"') return string();
    if (character === '[') {
      offset += 1;
      const result = [];
      whitespace();
      while (source[offset] !== ']') {
        result.push(value());
        whitespace();
        if (source[offset] === ',') {
          offset += 1;
          whitespace();
          if (source[offset] === ']') break;
        } else if (source[offset] !== ']') {
          fail('M0B_RUNTIME_SOURCE', path, `array-delimiter-at-${offset}`);
        }
      }
      if (source[offset] !== ']') fail('M0B_RUNTIME_SOURCE', path, 'unterminated-array');
      offset += 1;
      return result;
    }
    if (character === '{') {
      offset += 1;
      const result = {};
      whitespace();
      while (source[offset] !== '}') {
        const key = source[offset] === "'" || source[offset] === '"' ? string() : identifier();
        whitespace();
        if (source[offset] !== ':') fail('M0B_RUNTIME_SOURCE', path, `object-colon-at-${offset}`);
        offset += 1;
        result[key] = value();
        whitespace();
        if (source[offset] === ',') {
          offset += 1;
          whitespace();
          if (source[offset] === '}') break;
        } else if (source[offset] !== '}') {
          fail('M0B_RUNTIME_SOURCE', path, `object-delimiter-at-${offset}`);
        }
      }
      if (source[offset] !== '}') fail('M0B_RUNTIME_SOURCE', path, 'unterminated-object');
      offset += 1;
      return result;
    }
    const numberMatch = /^-?\d[\d_]*(?:\.\d[\d_]*)?/.exec(source.slice(offset));
    if (numberMatch) {
      offset += numberMatch[0].length;
      return Number(numberMatch[0].replaceAll('_', ''));
    }
    const name = identifier();
    if (name === 'true') return true;
    if (name === 'false') return false;
    if (name === 'null') return null;
    if (constants.has(name)) return constants.get(name);
    fail('M0B_RUNTIME_SOURCE', path, `unknown-identifier=${name}`);
  };
  return value();
}

function exportedInitializer(source, name, path) {
  const marker = new RegExp(`export\\s+const\\s+${name}\\b`).exec(source);
  if (!marker) return undefined;
  let offset = marker.index + marker[0].length;
  let depth = 0;
  let quote = null;
  let escaped = false;
  let equals = -1;
  for (; offset < source.length; offset += 1) {
    const character = source[offset];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') quote = character;
    else if ('([{<'.includes(character)) depth += 1;
    else if (')]}>'.includes(character)) depth -= 1;
    else if (character === '=' && depth === 0) {
      equals = offset;
      break;
    } else if (character === ';' && depth === 0) break;
  }
  if (equals < 0) fail('M0B_RUNTIME_SOURCE', path, 'initializer-missing');
  offset = equals + 1;
  const start = offset;
  depth = 0;
  quote = null;
  escaped = false;
  for (; offset < source.length; offset += 1) {
    const character = source[offset];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') quote = character;
    else if ('([{'.includes(character)) depth += 1;
    else if (')]}'.includes(character)) depth -= 1;
    else if (character === ';' && depth === 0) return source.slice(start, offset).trim();
  }
  fail('M0B_RUNTIME_SOURCE', path, 'initializer-unterminated');
}

function collectExportedConstants(filePath, seed = new Map()) {
  const source = readFileSync(filePath, 'utf8');
  const constants = new Map(seed);
  const names = [...source.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)\b/g)].map((match) => match[1]);
  for (const name of names) {
    const initializer = exportedInitializer(source, name, `${filePath}:${name}`);
    try {
      constants.set(name, literalParser(initializer, constants, `${filePath}:${name}`));
    } catch (error) {
      if (!(error instanceof M0BProtocolError) || !error.message.includes('unknown-identifier=')) throw error;
    }
  }
  return constants;
}

function requiredConstant(constants, name) {
  if (!constants.has(name)) fail('M0B_RUNTIME_SOURCE', name, 'missing-exported-constant');
  return constants.get(name);
}

export function readRuntimeBindings() {
  const common = collectExportedConstants(COMMON_TYPES_FILE);
  const cohort = collectExportedConstants(TYPES_FILE, common);
  const policy = collectExportedConstants(POLICY_FILE, cohort);
  return {
    schemaVersion: requiredConstant(cohort, 'M0B_SCHEMA_VERSION'),
    observationWindowDays: requiredConstant(cohort, 'M0B_OBSERVATION_WINDOW_DAYS'),
    dayMs: requiredConstant(cohort, 'M0B_DAY_MS'),
    cohorts: requiredConstant(cohort, 'M0B_COHORTS'),
    shells: requiredConstant(cohort, 'M0B_SHELLS'),
    primaryJourneys: requiredConstant(cohort, 'M0B_PRIMARY_JOURNEYS'),
    returnReasons: requiredConstant(cohort, 'M0B_RETURN_REASONS'),
    sharedReturnReasons: requiredConstant(common, 'COCKPIT_RETURN_REASONS'),
    supportCategories: requiredConstant(cohort, 'M0B_SUPPORT_CATEGORIES'),
    accessibilitySeverities: requiredConstant(cohort, 'M0B_ACCESSIBILITY_SEVERITIES'),
    zeroToleranceReasons: requiredConstant(cohort, 'M0B_ZERO_TOLERANCE_REASONS'),
    minimums: requiredConstant(policy, 'M0B_DEFAULT_MINIMUMS'),
    thresholds: requiredConstant(policy, 'M0B_DEFAULT_COMPARISON_THRESHOLDS'),
  };
}

function validateScriptList(value, ids, path) {
  if (!Array.isArray(value) || value.length !== ids.length) fail('M0B_PROTOCOL_ARRAY', path, 'script-count');
  value.forEach((entry, index) => {
    const script = exactKeys(entry, ['id', 'prompt', 'success', 'failure'], `${path}[${index}]`);
    exactValue(script.id, ids[index], `${path}[${index}].id`);
    nonEmptyString(script.prompt, `${path}[${index}].prompt`);
    nonEmptyString(script.success, `${path}[${index}].success`);
    nonEmptyString(script.failure, `${path}[${index}].failure`);
  });
}

function validateRuntimeContract(runtimeContract, runtime) {
  const value = exactKeys(
    runtimeContract,
    [
      'schemaVersion',
      'cohorts',
      'shells',
      'primaryJourneys',
      'returnReasons',
      'supportCategories',
      'accessibilitySeverities',
      'zeroToleranceReasons',
    ],
    'runtimeContract'
  );
  exactValue(value.schemaVersion, runtime.schemaVersion, 'runtimeContract.schemaVersion');
  exactArray(value.cohorts, runtime.cohorts, 'runtimeContract.cohorts');
  exactArray(value.shells, runtime.shells, 'runtimeContract.shells');
  exactArray(value.primaryJourneys, runtime.primaryJourneys, 'runtimeContract.primaryJourneys');
  exactArray(value.returnReasons, runtime.returnReasons, 'runtimeContract.returnReasons');
  exactArray(value.returnReasons, runtime.sharedReturnReasons, 'runtimeContract.sharedReturnReasons');
  exactArray(value.supportCategories, runtime.supportCategories, 'runtimeContract.supportCategories');
  exactArray(value.accessibilitySeverities, runtime.accessibilitySeverities, 'runtimeContract.accessibilitySeverities');
  exactArray(value.zeroToleranceReasons, runtime.zeroToleranceReasons, 'runtimeContract.zeroToleranceReasons');
}

export function validateProtocolObject(input, runtime = readRuntimeBindings()) {
  const protocol = exactKeys(
    input,
    [
      'protocolVersion',
      'lifecycle',
      'runtimeContract',
      'participantSegments',
      'scripts',
      'rubrics',
      'classicComparison',
      'measurement',
      'privacy',
      'decisionAuthority',
      'signing',
      'invalidationRules',
    ],
    '$'
  );
  exactValue(protocol.protocolVersion, PROTOCOL_VERSION, 'protocolVersion');

  const lifecycle = exactKeys(
    protocol.lifecycle,
    ['state', 'observationStartedAtMs', 'observationWindowDays', 'dayMs', 'mutationPolicy'],
    'lifecycle'
  );
  exactValue(lifecycle.state, 'frozen-pre-day0', 'lifecycle.state');
  exactValue(lifecycle.observationStartedAtMs, null, 'lifecycle.observationStartedAtMs');
  exactValue(lifecycle.observationWindowDays, runtime.observationWindowDays, 'lifecycle.observationWindowDays');
  exactValue(lifecycle.dayMs, runtime.dayMs, 'lifecycle.dayMs');
  if (!Number.isSafeInteger(lifecycle.dayMs) || lifecycle.dayMs !== 86_400_000) {
    fail('M0B_PROTOCOL_NUMBER', 'lifecycle.dayMs', 'exactly-86400000');
  }
  exactValue(
    lifecycle.mutationPolicy,
    'any-byte-change-after-day0-invalidates-observation',
    'lifecycle.mutationPolicy'
  );
  validateRuntimeContract(protocol.runtimeContract, runtime);

  if (!Array.isArray(protocol.participantSegments) || protocol.participantSegments.length !== runtime.cohorts.length) {
    fail('M0B_PROTOCOL_ARRAY', 'participantSegments', 'one-per-runtime-cohort');
  }
  protocol.participantSegments.forEach((entry, index) => {
    const segment = exactKeys(entry, ['id', 'eligibility', 'requiredEvidence'], `participantSegments[${index}]`);
    exactValue(segment.id, runtime.cohorts[index], `participantSegments[${index}].id`);
    nonEmptyString(segment.eligibility, `participantSegments[${index}].eligibility`);
    nonEmptyString(segment.requiredEvidence, `participantSegments[${index}].requiredEvidence`);
  });

  const scripts = exactKeys(protocol.scripts, ['noviceEntry', 'primaryJourneys'], 'scripts');
  validateScriptList(scripts.noviceEntry, NOVICE_SCRIPT_IDS, 'scripts.noviceEntry');
  validateScriptList(scripts.primaryJourneys, runtime.primaryJourneys, 'scripts.primaryJourneys');

  const rubrics = exactKeys(
    protocol.rubrics,
    ['outcome', 'confusion', 'disclosurePreference', 'authorityComprehension'],
    'rubrics'
  );
  exactArray(rubrics.outcome, OUTCOMES, 'rubrics.outcome');
  exactArray(rubrics.confusion, CONFUSION_LEVELS, 'rubrics.confusion');
  const disclosure = exactKeys(
    rubrics.disclosurePreference,
    ['requirement', 'pass', 'fail'],
    'rubrics.disclosurePreference'
  );
  Object.entries(disclosure).forEach(([key, value]) => nonEmptyString(value, `rubrics.disclosurePreference.${key}`));
  const authority = exactKeys(
    rubrics.authorityComprehension,
    ['questions', 'pass', 'fail'],
    'rubrics.authorityComprehension'
  );
  exactArray(
    authority.questions,
    ['Who is acting?', 'Where will the work happen?', 'What can it change without asking?'],
    'rubrics.authorityComprehension.questions'
  );
  nonEmptyString(authority.pass, 'rubrics.authorityComprehension.pass');
  nonEmptyString(authority.fail, 'rubrics.authorityComprehension.fail');

  const comparison = exactKeys(
    protocol.classicComparison,
    ['baselineShell', 'candidateShell', 'assignment', 'expertInteractionBudget', 'decisionRule'],
    'classicComparison'
  );
  exactValue(comparison.baselineShell, 'classic', 'classicComparison.baselineShell');
  exactValue(comparison.candidateShell, 'cockpit', 'classicComparison.candidateShell');
  nonEmptyString(comparison.assignment, 'classicComparison.assignment');
  nonEmptyString(comparison.decisionRule, 'classicComparison.decisionRule');
  const budget = exactKeys(
    comparison.expertInteractionBudget,
    ['reference', 'maximumAdditionalInteractions', 'interactions'],
    'classicComparison.expertInteractionBudget'
  );
  exactValue(budget.reference, 'classic', 'classicComparison.expertInteractionBudget.reference');
  exactValue(
    budget.maximumAdditionalInteractions,
    0,
    'classicComparison.expertInteractionBudget.maximumAdditionalInteractions'
  );
  nonEmptyString(budget.interactions, 'classicComparison.expertInteractionBudget.interactions');

  const measurement = exactKeys(
    protocol.measurement,
    ['minimums', 'thresholds', 'denominators', 'missingDenominatorPolicy', 'soak', 'automaticStops'],
    'measurement'
  );
  const minimums = exactKeys(measurement.minimums, Object.keys(runtime.minimums), 'measurement.minimums');
  for (const [key, expected] of Object.entries(runtime.minimums)) {
    positiveSafeInteger(minimums[key], `measurement.minimums.${key}`);
    exactValue(minimums[key], expected, `measurement.minimums.${key}`);
  }
  const thresholds = exactKeys(measurement.thresholds, Object.keys(runtime.thresholds), 'measurement.thresholds');
  for (const [key, expected] of Object.entries(runtime.thresholds)) {
    finiteNumber(thresholds[key], `measurement.thresholds.${key}`);
    exactValue(thresholds[key], expected, `measurement.thresholds.${key}`);
  }
  const denominators = exactKeys(measurement.denominators, DENOMINATOR_KEYS, 'measurement.denominators');
  Object.entries(DENOMINATORS).forEach(([key, value]) =>
    exactValue(denominators[key], value, `measurement.denominators.${key}`)
  );
  exactValue(measurement.missingDenominatorPolicy, 'null-and-fail-closed', 'measurement.missingDenominatorPolicy');
  const soak = exactKeys(
    measurement.soak,
    ['calendarDays', 'simulationAllowed', 'backfillAllowed'],
    'measurement.soak'
  );
  exactValue(soak.calendarDays, runtime.observationWindowDays, 'measurement.soak.calendarDays');
  exactValue(soak.simulationAllowed, false, 'measurement.soak.simulationAllowed');
  exactValue(soak.backfillAllowed, false, 'measurement.soak.backfillAllowed');
  exactArray(measurement.automaticStops, runtime.zeroToleranceReasons, 'measurement.automaticStops');

  const privacy = exactKeys(
    protocol.privacy,
    ['allowedModes', 'consent', 'excluded', 'participantIdentity'],
    'privacy'
  );
  exactArray(privacy.allowedModes, PRIVACY_MODES, 'privacy.allowedModes');
  exactValue(privacy.consent, 'explicit-opt-in', 'privacy.consent');
  exactArray(privacy.excluded, PRIVACY_EXCLUSIONS, 'privacy.excluded');
  exactValue(privacy.participantIdentity, 'one-way participantIdHash only', 'privacy.participantIdentity');

  const owner = exactKeys(
    protocol.decisionAuthority,
    ['id', 'displayName', 'role', 'invitedAlphaEnabledByProtocol'],
    'decisionAuthority'
  );
  exactValue(owner.id, 'sean-donahoe', 'decisionAuthority.id');
  exactValue(owner.displayName, 'Sean Donahoe', 'decisionAuthority.displayName');
  exactValue(owner.role, 'M0B decision owner', 'decisionAuthority.role');
  exactValue(owner.invitedAlphaEnabledByProtocol, false, 'decisionAuthority.invitedAlphaEnabledByProtocol');

  const signing = exactKeys(
    protocol.signing,
    ['receiptVersion', 'requiredBindings', 'signatureLocation', 'protocolMaySelfAuthorize'],
    'signing'
  );
  exactValue(signing.receiptVersion, 'wayland-desktop-m0b-observation/1', 'signing.receiptVersion');
  exactArray(signing.requiredBindings, SIGNING_BINDINGS, 'signing.requiredBindings');
  exactValue(signing.signatureLocation, 'external-receipt', 'signing.signatureLocation');
  exactValue(signing.protocolMaySelfAuthorize, false, 'signing.protocolMaySelfAuthorize');

  if (!Array.isArray(protocol.invalidationRules) || protocol.invalidationRules.length !== 7) {
    fail('M0B_PROTOCOL_ARRAY', 'invalidationRules', 'exactly-seven-rules');
  }
  protocol.invalidationRules.forEach((rule, index) => nonEmptyString(rule, `invalidationRules[${index}]`));
  const canonicalSha256 = `sha256:${createHash('sha256').update(canonicalProtocolBytes(protocol)).digest('hex')}`;
  exactValue(canonicalSha256, FROZEN_CANONICAL_SHA256, '$.canonicalSha256');
  return protocol;
}

export function canonicalProtocolBytes(protocol) {
  return `${JSON.stringify(protocol, null, 2)}\n`;
}

function assertNoDuplicateJsonKeys(bytes) {
  let offset = 0;
  const whitespace = () => {
    while (/\s/.test(bytes[offset] ?? '')) offset += 1;
  };
  const stringToken = () => {
    whitespace();
    const start = offset;
    if (bytes[offset] !== '"') fail('M0B_PROTOCOL_JSON', '$', `string-at-${offset}`);
    offset += 1;
    let escaped = false;
    while (offset < bytes.length) {
      const character = bytes[offset];
      offset += 1;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') return JSON.parse(bytes.slice(start, offset));
    }
    fail('M0B_PROTOCOL_JSON', '$', 'unterminated-string');
  };
  const value = (path) => {
    whitespace();
    if (bytes[offset] === '{') {
      offset += 1;
      whitespace();
      const keys = new Set();
      while (bytes[offset] !== '}') {
        const key = stringToken();
        if (keys.has(key)) fail('M0B_PROTOCOL_DUPLICATE_KEY', `${path}.${key}`, 'duplicate');
        keys.add(key);
        whitespace();
        if (bytes[offset] !== ':') fail('M0B_PROTOCOL_JSON', path, `colon-at-${offset}`);
        offset += 1;
        value(`${path}.${key}`);
        whitespace();
        if (bytes[offset] === ',') {
          offset += 1;
          whitespace();
        } else if (bytes[offset] !== '}') {
          fail('M0B_PROTOCOL_JSON', path, `object-delimiter-at-${offset}`);
        }
      }
      offset += 1;
      return;
    }
    if (bytes[offset] === '[') {
      offset += 1;
      whitespace();
      let index = 0;
      while (bytes[offset] !== ']') {
        value(`${path}[${index}]`);
        index += 1;
        whitespace();
        if (bytes[offset] === ',') {
          offset += 1;
          whitespace();
        } else if (bytes[offset] !== ']') {
          fail('M0B_PROTOCOL_JSON', path, `array-delimiter-at-${offset}`);
        }
      }
      offset += 1;
      return;
    }
    if (bytes[offset] === '"') {
      stringToken();
      return;
    }
    const primitive = /^(?:-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(bytes.slice(offset));
    if (!primitive) fail('M0B_PROTOCOL_JSON', path, `value-at-${offset}`);
    offset += primitive[0].length;
  };
  value('$');
  whitespace();
  if (offset !== bytes.length) fail('M0B_PROTOCOL_JSON', '$', `trailing-at-${offset}`);
}

export function verifyProtocolBytes(bytes, runtime = readRuntimeBindings()) {
  let parsed;
  try {
    parsed = JSON.parse(bytes);
  } catch {
    fail('M0B_PROTOCOL_JSON', '$', 'invalid-json');
  }
  assertNoDuplicateJsonKeys(bytes);
  const canonical = canonicalProtocolBytes(parsed);
  validateProtocolObject(parsed, runtime);
  return {
    valid: true,
    protocolVersion: parsed.protocolVersion,
    state: parsed.lifecycle.state,
    sha256: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
    canonicalSha256: `sha256:${createHash('sha256').update(canonical).digest('hex')}`,
    bytes: Buffer.byteLength(bytes),
  };
}

export function verifyProtocolFile(filePath) {
  return verifyProtocolBytes(readFileSync(resolve(filePath), 'utf8'));
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_FILE) {
  const protocolPath = process.argv[2];
  if (!protocolPath || process.argv.length !== 3) {
    process.stderr.write('usage: verifyM0BUsabilityProtocol.mjs <protocol.json>\n');
    process.exitCode = 2;
  } else {
    try {
      process.stdout.write(`${JSON.stringify(verifyProtocolFile(protocolPath))}\n`);
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : 'M0B_PROTOCOL_UNKNOWN'}\n`);
      process.exitCode = 1;
    }
  }
}
