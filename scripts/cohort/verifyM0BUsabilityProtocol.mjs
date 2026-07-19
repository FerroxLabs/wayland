#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE), '../..');

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

function hasModifier(node, kind) {
  return node.modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

function evaluateLiteral(node, constants, sourceFile, path) {
  if (ts.isAsExpression(node)) {
    if (node.type.getText(sourceFile) !== 'const') fail('M0B_RUNTIME_SOURCE', path, 'non-const-assertion');
    return evaluateLiteral(node.expression, constants, sourceFile, path);
  }
  if (ts.isParenthesizedExpression(node)) return evaluateLiteral(node.expression, constants, sourceFile, path);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text.replaceAll('_', ''));
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isIdentifier(node)) {
    if (!constants.has(node.text)) fail('M0B_RUNTIME_SOURCE', path, `unknown-identifier=${node.text}`);
    return constants.get(node.text);
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const operand = evaluateLiteral(node.operand, constants, sourceFile, path);
    if (typeof operand !== 'number') fail('M0B_RUNTIME_SOURCE', path, 'non-numeric-negative');
    return -operand;
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element, index) => {
      if (ts.isSpreadElement(element)) fail('M0B_RUNTIME_SOURCE', `${path}[${index}]`, 'spread');
      return evaluateLiteral(element, constants, sourceFile, `${path}[${index}]`);
    });
  }
  if (ts.isObjectLiteralExpression(node)) {
    const result = {};
    for (const property of node.properties) {
      if (
        !ts.isPropertyAssignment(property) ||
        property.name === undefined ||
        ts.isComputedPropertyName(property.name)
      ) {
        fail('M0B_RUNTIME_SOURCE', path, 'non-literal-property');
      }
      const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : undefined;
      if (key === undefined) fail('M0B_RUNTIME_SOURCE', path, 'invalid-property-name');
      if (Object.hasOwn(result, key)) fail('M0B_RUNTIME_SOURCE', `${path}.${key}`, 'duplicate-property');
      result[key] = evaluateLiteral(property.initializer, constants, sourceFile, `${path}.${key}`);
    }
    return result;
  }
  fail('M0B_RUNTIME_SOURCE', path, `non-literal=${ts.SyntaxKind[node.kind]}`);
}

function unwrapExpression(node) {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function mutationTargets(node, names) {
  const current = unwrapExpression(node);
  if (ts.isIdentifier(current)) return names.has(current.text);
  if (ts.isPropertyAccessExpression(current) || ts.isElementAccessExpression(current)) {
    return mutationTargets(current.expression, names);
  }
  return false;
}

function callName(node) {
  const current = unwrapExpression(node);
  if (!ts.isPropertyAccessExpression(current) && !ts.isElementAccessExpression(current)) return null;
  const receiver = unwrapExpression(current.expression);
  if (!ts.isIdentifier(receiver)) return null;
  const property = ts.isPropertyAccessExpression(current)
    ? current.name.text
    : current.argumentExpression &&
        (ts.isStringLiteral(current.argumentExpression) ||
          ts.isNoSubstitutionTemplateLiteral(current.argumentExpression))
      ? current.argumentExpression.text
      : null;
  return property === null ? null : `${receiver.text}.${property}`;
}

function collectBindingNames(name, output) {
  if (ts.isIdentifier(name)) {
    output.add(name.text);
    return;
  }
  for (const element of name.elements) {
    if (!ts.isOmittedExpression(element)) collectBindingNames(element.name, output);
  }
}

function collectProtectedAliases(sourceFile, protectedNames) {
  const aliases = new Set(protectedNames);
  let changed = true;
  while (changed) {
    changed = false;
    const visit = (node) => {
      if (ts.isVariableDeclaration(node) && node.initializer && mutationTargets(node.initializer, aliases)) {
        const before = aliases.size;
        collectBindingNames(node.name, aliases);
        changed ||= aliases.size !== before;
      }
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isIdentifier(unwrapExpression(node.left)) &&
        mutationTargets(node.right, aliases)
      ) {
        const before = aliases.size;
        aliases.add(unwrapExpression(node.left).text);
        changed ||= aliases.size !== before;
      }
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(sourceFile, visit);
  }
  return aliases;
}

function assertNoRuntimeMutation(sourceFile, names, filePath) {
  const protectedNames = collectProtectedAliases(sourceFile, names);
  const assignmentOperators = new Set([
    ts.SyntaxKind.EqualsToken,
    ts.SyntaxKind.PlusEqualsToken,
    ts.SyntaxKind.MinusEqualsToken,
    ts.SyntaxKind.AsteriskEqualsToken,
    ts.SyntaxKind.SlashEqualsToken,
    ts.SyntaxKind.PercentEqualsToken,
    ts.SyntaxKind.AmpersandEqualsToken,
    ts.SyntaxKind.BarEqualsToken,
    ts.SyntaxKind.CaretEqualsToken,
    ts.SyntaxKind.LessThanLessThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.AsteriskAsteriskEqualsToken,
    ts.SyntaxKind.BarBarEqualsToken,
    ts.SyntaxKind.AmpersandAmpersandEqualsToken,
    ts.SyntaxKind.QuestionQuestionEqualsToken,
  ]);
  const mutatingMethods = new Set([
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse',
    'fill',
    'copyWithin',
  ]);
  const visit = (node) => {
    if (
      ts.isBinaryExpression(node) &&
      assignmentOperators.has(node.operatorToken.kind) &&
      mutationTargets(node.left, protectedNames)
    ) {
      fail('M0B_RUNTIME_SOURCE', filePath, `post-declaration-mutation=${node.left.getText(sourceFile)}`);
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken) &&
      mutationTargets(node.operand, protectedNames)
    ) {
      fail('M0B_RUNTIME_SOURCE', filePath, `post-declaration-mutation=${node.operand.getText(sourceFile)}`);
    }
    if (ts.isDeleteExpression(node) && mutationTargets(node.expression, protectedNames)) {
      fail('M0B_RUNTIME_SOURCE', filePath, `post-declaration-mutation=delete ${node.expression.getText(sourceFile)}`);
    }
    const callee = ts.isCallExpression(node) ? unwrapExpression(node.expression) : null;
    const methodName =
      callee && ts.isPropertyAccessExpression(callee)
        ? callee.name.text
        : callee &&
            ts.isElementAccessExpression(callee) &&
            callee.argumentExpression &&
            (ts.isStringLiteral(callee.argumentExpression) ||
              ts.isNoSubstitutionTemplateLiteral(callee.argumentExpression))
          ? callee.argumentExpression.text
          : null;
    const receiver =
      callee && (ts.isPropertyAccessExpression(callee) || ts.isElementAccessExpression(callee))
        ? callee.expression
        : null;
    if (
      ts.isCallExpression(node) &&
      methodName !== null &&
      mutatingMethods.has(methodName) &&
      receiver !== null &&
      mutationTargets(receiver, protectedNames)
    ) {
      fail('M0B_RUNTIME_SOURCE', filePath, `post-declaration-mutation=${node.expression.getText(sourceFile)}`);
    }
    if (ts.isCallExpression(node)) {
      const mutationApi = callName(node.expression);
      const mutationApis = new Set([
        'Object.assign',
        'Object.defineProperty',
        'Object.defineProperties',
        'Object.setPrototypeOf',
        'Reflect.set',
        'Reflect.defineProperty',
        'Reflect.deleteProperty',
        'Reflect.setPrototypeOf',
      ]);
      if (
        mutationApi &&
        mutationApis.has(mutationApi) &&
        node.arguments[0] &&
        mutationTargets(node.arguments[0], protectedNames)
      ) {
        fail('M0B_RUNTIME_SOURCE', filePath, `post-declaration-mutation=${mutationApi}`);
      }
      if (
        node.arguments.some((argument) => mutationTargets(argument, protectedNames)) &&
        mutationApi !== 'Object.freeze'
      ) {
        fail('M0B_RUNTIME_SOURCE', filePath, `protected-reference-escape=${node.expression.getText(sourceFile)}`);
      }
      if (
        ts.isIdentifier(unwrapExpression(node.expression)) &&
        ['eval', 'Function'].includes(unwrapExpression(node.expression).text)
      ) {
        fail('M0B_RUNTIME_SOURCE', filePath, `dynamic-code=${unwrapExpression(node.expression).text}`);
      }
    }
    if (ts.isNewExpression(node) && node.arguments?.some((argument) => mutationTargets(argument, protectedNames))) {
      fail('M0B_RUNTIME_SOURCE', filePath, `protected-reference-escape=new ${node.expression.getText(sourceFile)}`);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
}

function collectExportedConstants(filePath, seed = new Map()) {
  const source = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (sourceFile.parseDiagnostics.length > 0) fail('M0B_RUNTIME_SOURCE', filePath, 'typescript-parse-error');
  const constants = new Map(seed);
  const localNames = new Set();

  for (const statement of sourceFile.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !hasModifier(statement, ts.SyntaxKind.ExportKeyword) ||
      (statement.declarationList.flags & ts.NodeFlags.Const) === 0
    ) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.initializer === undefined) {
        fail('M0B_RUNTIME_SOURCE', filePath, 'non-identifier-exported-const');
      }
      const name = declaration.name.text;
      if (localNames.has(name)) fail('M0B_RUNTIME_SOURCE', `${filePath}:${name}`, 'duplicate-live-export');
      localNames.add(name);
      try {
        constants.set(name, evaluateLiteral(declaration.initializer, constants, sourceFile, `${filePath}:${name}`));
      } catch (error) {
        if (!(error instanceof M0BProtocolError) || !error.message.includes('unknown-identifier=')) throw error;
      }
    }
  }
  assertNoRuntimeMutation(sourceFile, localNames, filePath);
  return constants;
}

function requiredConstant(constants, name) {
  if (!constants.has(name)) fail('M0B_RUNTIME_SOURCE', name, 'missing-exported-constant');
  return constants.get(name);
}

export function readRuntimeBindings(repositoryRoot = REPOSITORY_ROOT) {
  const commonTypesFile = resolve(repositoryRoot, 'src/common/types/cohortRollout.ts');
  const typesFile = resolve(repositoryRoot, 'src/process/services/cohort/types.ts');
  const policyFile = resolve(repositoryRoot, 'src/process/services/cohort/policy.ts');
  const common = collectExportedConstants(commonTypesFile);
  const cohort = collectExportedConstants(typesFile, common);
  const policy = collectExportedConstants(policyFile, cohort);
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

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(SCRIPT_FILE)) {
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
