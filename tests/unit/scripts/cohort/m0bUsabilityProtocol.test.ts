import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  canonicalProtocolBytes,
  readRuntimeBindings,
  validateProtocolObject,
  verifyProtocolBytes,
} from '../../../../scripts/cohort/verifyM0BUsabilityProtocol.mjs';

const PROTOCOL_PATH = resolve(process.cwd(), 'contracts/cohort/m0b-usability-protocol.json');
const protocolBytes = readFileSync(PROTOCOL_PATH, 'utf8');
const protocol = JSON.parse(protocolBytes);

function cloneProtocol(): any {
  return structuredClone(protocol);
}

function expectInvalid(mutate: (candidate: any) => void, pattern?: RegExp): void {
  const candidate = cloneProtocol();
  mutate(candidate);
  expect(() => validateProtocolObject(candidate)).toThrow(pattern ?? /M0B_PROTOCOL_/);
}

describe('M0B usability protocol', () => {
  it('accepts the canonical frozen protocol and returns a stable digest', () => {
    const first = verifyProtocolBytes(protocolBytes);
    const second = verifyProtocolBytes(protocolBytes);

    expect(first).toEqual(second);
    expect(first).toEqual({
      valid: true,
      protocolVersion: 'wayland-desktop-m0b-usability/1',
      state: 'frozen-pre-day0',
      sha256: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      canonicalSha256: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      bytes: Buffer.byteLength(protocolBytes),
    });
    expect(verifyProtocolBytes(canonicalProtocolBytes(protocol)).canonicalSha256).toBe(first.canonicalSha256);
  });

  it('mechanically reads the complete closed runtime vocabulary and fixed constants', () => {
    expect(readRuntimeBindings()).toEqual({
      schemaVersion: 1,
      observationWindowDays: 14,
      dayMs: 86_400_000,
      cohorts: ['novice', 'knowledge-work', 'developer', 'operator'],
      shells: ['classic', 'cockpit'],
      primaryJourneys: [
        'chat.first-response',
        'project.resume',
        'cowork.create-artifact',
        'developer.modify-and-verify',
        'operator.run-automation',
      ],
      returnReasons: [
        'performance',
        'confusing-navigation',
        'missing-capability',
        'reliability',
        'accessibility',
        'trust-or-control',
        'other-no-text',
      ],
      sharedReturnReasons: [
        'performance',
        'confusing-navigation',
        'missing-capability',
        'reliability',
        'accessibility',
        'trust-or-control',
        'other-no-text',
      ],
      supportCategories: ['blocked', 'setup', 'bug', 'how-to'],
      accessibilitySeverities: ['critical', 'serious'],
      zeroToleranceReasons: [
        'data-loss-or-corruption',
        'permission-widening',
        'approval-bypass',
        'cross-project-leakage',
        'receipt-forgery',
      ],
      minimums: { participantsTotal: 20, participantsPerCohort: 5, startsPerPrimaryJourney: 10 },
      thresholds: {
        maxJourneyFailureRateDelta: 0,
        maxP95LatencyRatio: 1.15,
        minCrashFreeSessionRateDelta: -0.005,
        maxSupportContactsPerParticipantDelta: 0,
        maxAccessibilityViolationsPerSessionDelta: 0,
        maxReturnToClassicRate: 0.1,
      },
    });
  });

  it('rejects executable suffixes after numeric, array, alias, and object literal prefixes', () => {
    const files = [
      'scripts/cohort/verifyM0BUsabilityProtocol.mjs',
      'scripts/cohort/readM0BRuntimeBindings.ts',
      'contracts/cohort/m0b-usability-protocol.json',
      'tsconfig.json',
      'src/process/services/cohort/types.ts',
      'src/common/types/cohortRollout.ts',
      'src/process/services/cohort/policy.ts',
    ];
    const cases = [
      {
        file: 'src/process/services/cohort/types.ts',
        from: 'export const M0B_DAY_MS = 86_400_000;',
        to: 'export const M0B_DAY_MS = 86_400_000 + 1;',
      },
      {
        file: 'src/process/services/cohort/types.ts',
        from: 'export const M0B_DAY_MS = 86_400_000;',
        to: '// export const M0B_DAY_MS = 86_400_000;\nexport const M0B_DAY_MS = 1;',
      },
      {
        file: 'src/process/services/cohort/types.ts',
        from: 'export const M0B_DAY_MS = 86_400_000;',
        to: 'export const M0B_DAY_MS = 86_400_000;\nexport const M0B_DAY_MS = 86_400_000;',
      },
      {
        file: 'src/process/services/cohort/types.ts',
        from: 'export const M0B_DAY_MS = 86_400_000;',
        to: 'export const M0B_DAY_MS = 86_400_000;\nM0B_DAY_MS += 1;',
      },
      {
        file: 'src/process/services/cohort/types.ts',
        from: "export const M0B_SHELLS = Object.freeze(['classic', 'cockpit'] as const);",
        to: "export const M0B_SHELLS = Object.freeze(['classic', 'cockpit'].slice(0, 1));",
      },
      {
        file: 'src/process/services/cohort/types.ts',
        from: 'export const M0B_COHORTS = COHORT_ASSIGNMENTS;',
        to: "export const M0B_COHORTS = COHORT_ASSIGNMENTS.concat('forged');",
      },
      {
        file: 'src/process/services/cohort/policy.ts',
        from: '  startsPerPrimaryJourney: 10,\n});',
        to: '  startsPerPrimaryJourney: 10,\n}) && Object.freeze({ participantsTotal: 1 });',
      },
      {
        file: 'src/process/services/cohort/policy.ts',
        from: '  startsPerPrimaryJourney: 10,\n});',
        to: '  startsPerPrimaryJourney: 10,\n});\nObject.assign(M0B_DEFAULT_MINIMUMS, { participantsTotal: 1 });',
        frozenNoOp: true,
      },
      {
        file: 'src/process/services/cohort/policy.ts',
        from: '  startsPerPrimaryJourney: 10,\n});',
        to: "  startsPerPrimaryJourney: 10,\n});\nM0B_DEFAULT_MINIMUMS['participantsTotal'] = 1;",
        frozenNoOp: true,
      },
      {
        file: 'src/process/services/cohort/policy.ts',
        from: '  startsPerPrimaryJourney: 10,\n});',
        to: "  startsPerPrimaryJourney: 10,\n});\n(M0B_DEFAULT_MINIMUMS as Record<string, number>)['participantsTotal'] = 1;",
        frozenNoOp: true,
      },
      {
        file: 'src/process/services/cohort/policy.ts',
        from: '  startsPerPrimaryJourney: 10,\n});',
        to: "  startsPerPrimaryJourney: 10,\n});\nconst minimumsAlias = M0B_DEFAULT_MINIMUMS;\nminimumsAlias['participantsTotal'] = 1;",
        frozenNoOp: true,
      },
      {
        file: 'src/process/services/cohort/policy.ts',
        from: '  startsPerPrimaryJourney: 10,\n});',
        to: '  startsPerPrimaryJourney: 10,\n});\nconst holder = { value: M0B_DEFAULT_MINIMUMS };\nholder.value.participantsTotal = 1;',
        frozenNoOp: true,
      },
      {
        file: 'src/process/services/cohort/policy.ts',
        from: '  startsPerPrimaryJourney: 10,\n});',
        to: "  startsPerPrimaryJourney: 10,\n});\nReflect.set(M0B_DEFAULT_MINIMUMS, 'participantsTotal', 1);",
        frozenNoOp: true,
      },
      {
        file: 'src/process/services/cohort/policy.ts',
        from: '  startsPerPrimaryJourney: 10,\n});',
        to: "  startsPerPrimaryJourney: 10,\n});\ndelete M0B_DEFAULT_MINIMUMS['participantsTotal'];",
        frozenNoOp: true,
      },
      {
        file: 'src/process/services/cohort/policy.ts',
        from: '  startsPerPrimaryJourney: 10,\n});',
        to: "  startsPerPrimaryJourney: 10,\n});\nfunction alter(value: object) { Reflect.set(value, 'participantsTotal', 1); }\nalter(M0B_DEFAULT_MINIMUMS);",
        frozenNoOp: true,
      },
    ];

    for (const mutation of cases) {
      const fixtureRoot = mkdtempSync(resolve(tmpdir(), 'wayland-m0b-protocol-audit-'));
      try {
        for (const file of files) {
          const destination = resolve(fixtureRoot, file);
          mkdirSync(dirname(destination), { recursive: true });
          cpSync(resolve(process.cwd(), file), destination);
        }
        symlinkSync(resolve(process.cwd(), 'node_modules'), resolve(fixtureRoot, 'node_modules'), 'dir');
        const target = resolve(fixtureRoot, mutation.file);
        const source = readFileSync(target, 'utf8');
        expect(source).toContain(mutation.from);
        writeFileSync(target, source.replace(mutation.from, mutation.to));

        let runtimeAccepted = false;
        if (mutation.to.startsWith('// export')) {
          expect(readRuntimeBindings(fixtureRoot).dayMs).toBe(1);
        } else if (mutation.frozenNoOp) {
          try {
            expect(readRuntimeBindings(fixtureRoot).minimums.participantsTotal).toBe(20);
            runtimeAccepted = true;
          } catch (error) {
            expect(error).toMatchObject({ code: 'M0B_RUNTIME_EXECUTION' });
          }
        } else {
          expect(() => readRuntimeBindings(fixtureRoot), mutation.to).toThrow(/M0B_RUNTIME_(?:SOURCE|EXECUTION)/);
        }

        const runCli = () =>
          execFileSync(
            'node',
            [
              resolve(fixtureRoot, 'scripts/cohort/verifyM0BUsabilityProtocol.mjs'),
              resolve(fixtureRoot, 'contracts/cohort/m0b-usability-protocol.json'),
            ],
            { stdio: 'pipe' }
          );
        if (mutation.frozenNoOp && runtimeAccepted) expect(runCli).not.toThrow();
        else expect(runCli, mutation.to).toThrow();
      } finally {
        rmSync(fixtureRoot, { recursive: true, force: true });
      }
    }
  });

  it.each([
    ['cohorts', 'runtimeContract.cohorts'],
    ['shells', 'runtimeContract.shells'],
    ['primaryJourneys', 'runtimeContract.primaryJourneys'],
    ['returnReasons', 'runtimeContract.returnReasons'],
    ['supportCategories', 'runtimeContract.supportCategories'],
    ['accessibilitySeverities', 'runtimeContract.accessibilitySeverities'],
    ['zeroToleranceReasons', 'runtimeContract.zeroToleranceReasons'],
  ])('rejects missing %s runtime values', (field, path) => {
    expectInvalid((candidate) => candidate.runtimeContract[field].pop(), new RegExp(path));
  });

  it.each([
    'cohorts',
    'shells',
    'primaryJourneys',
    'returnReasons',
    'supportCategories',
    'accessibilitySeverities',
    'zeroToleranceReasons',
  ])('rejects extra %s runtime values', (field) => {
    expectInvalid((candidate) => candidate.runtimeContract[field].push('copied-stale-value'));
  });

  it.each([
    'cohorts',
    'shells',
    'primaryJourneys',
    'returnReasons',
    'supportCategories',
    'accessibilitySeverities',
    'zeroToleranceReasons',
  ])('rejects reordered %s runtime values', (field) => {
    expectInvalid((candidate) => candidate.runtimeContract[field].reverse());
  });

  it.each([
    'cohorts',
    'shells',
    'primaryJourneys',
    'returnReasons',
    'supportCategories',
    'accessibilitySeverities',
    'zeroToleranceReasons',
  ])('rejects case-aliased %s runtime values', (field) => {
    expectInvalid((candidate) => {
      candidate.runtimeContract[field][0] = candidate.runtimeContract[field][0].toUpperCase();
    });
  });

  it('rejects schema, observation-window, and day-duration drift', () => {
    expectInvalid((candidate) => (candidate.runtimeContract.schemaVersion = 2));
    expectInvalid((candidate) => (candidate.lifecycle.observationWindowDays = 13));
    expectInvalid((candidate) => (candidate.lifecycle.dayMs = 86_399_999), /lifecycle.dayMs/);
    expectInvalid((candidate) => (candidate.lifecycle.dayMs = 86_400_001), /lifecycle.dayMs/);
    expectInvalid((candidate) => (candidate.lifecycle.dayMs = 86_400_000.5), /lifecycle.dayMs/);
    expectInvalid((candidate) => delete candidate.lifecycle.dayMs, /lifecycle/);
  });

  it('rejects omitted, extra, reordered, or duplicated participant segments', () => {
    expectInvalid((candidate) => candidate.participantSegments.pop());
    expectInvalid((candidate) => candidate.participantSegments.push(structuredClone(candidate.participantSegments[0])));
    expectInvalid((candidate) => candidate.participantSegments.reverse());
    expectInvalid((candidate) => (candidate.participantSegments[0].id = 'NOVICE'));
  });

  it('rejects omitted or altered novice and primary-journey scripts', () => {
    expectInvalid((candidate) => candidate.scripts.noviceEntry.pop());
    expectInvalid((candidate) => (candidate.scripts.noviceEntry[0].prompt = ''));
    expectInvalid((candidate) => candidate.scripts.primaryJourneys.pop());
    expectInvalid((candidate) => candidate.scripts.primaryJourneys.reverse());
    expectInvalid((candidate) => (candidate.scripts.primaryJourneys[0].success = ''));
  });

  it('rejects incomplete rubrics and authority-comprehension language', () => {
    expectInvalid((candidate) => delete candidate.rubrics.confusion);
    expectInvalid((candidate) => candidate.rubrics.outcome.push('mostly-success'));
    expectInvalid((candidate) => candidate.rubrics.authorityComprehension.questions.pop());
    expectInvalid((candidate) => (candidate.rubrics.disclosurePreference.pass = ''));
  });

  it('rejects missing or weakened Classic comparison and expert parity', () => {
    expectInvalid((candidate) => delete candidate.classicComparison);
    expectInvalid((candidate) => (candidate.classicComparison.baselineShell = 'cockpit'));
    expectInvalid(
      (candidate) => (candidate.classicComparison.expertInteractionBudget.maximumAdditionalInteractions = 1)
    );
    expectInvalid((candidate) => (candidate.classicComparison.decisionRule = ''));
    expectInvalid(
      (candidate) =>
        (candidate.classicComparison.decisionRule =
          'Cockpit passes regardless of missing evidence, thresholds, or zero-tolerance stops.')
    );
  });

  it('binds all runtime minimums and comparison thresholds', () => {
    for (const key of Object.keys(protocol.measurement.minimums)) {
      expectInvalid((candidate) => delete candidate.measurement.minimums[key]);
      expectInvalid((candidate) => (candidate.measurement.minimums[key] += 1));
    }
    for (const key of Object.keys(protocol.measurement.thresholds)) {
      expectInvalid((candidate) => delete candidate.measurement.thresholds[key]);
      expectInvalid((candidate) => (candidate.measurement.thresholds[key] += 0.01));
    }
  });

  it('rejects missing denominators, altered soak, and incomplete automatic stops', () => {
    for (const key of Object.keys(protocol.measurement.denominators)) {
      expectInvalid((candidate) => delete candidate.measurement.denominators[key]);
      expectInvalid((candidate) => (candidate.measurement.denominators[key] = ''));
      expectInvalid(
        (candidate) =>
          (candidate.measurement.denominators[key] =
            key === 'journeyFailureRate'
              ? 'journey_completed / journey_started'
              : protocol.measurement.denominators.journeyFailureRate)
      );
    }
    expectInvalid((candidate) => delete candidate.measurement.soak);
    expectInvalid((candidate) => (candidate.measurement.soak.calendarDays = 1));
    expectInvalid((candidate) => (candidate.measurement.soak.simulationAllowed = true));
    expectInvalid((candidate) => (candidate.measurement.soak.backfillAllowed = true));
    expectInvalid((candidate) => candidate.measurement.automaticStops.pop());
  });

  it('rejects privacy widening, owner drift, and self-authorization', () => {
    expectInvalid((candidate) => candidate.privacy.excluded.pop());
    expectInvalid((candidate) => candidate.privacy.allowedModes.push('content-upload'));
    expectInvalid((candidate) => delete candidate.decisionAuthority);
    expectInvalid((candidate) => (candidate.decisionAuthority.displayName = 'Someone Else'));
    expectInvalid((candidate) => (candidate.decisionAuthority.invitedAlphaEnabledByProtocol = true));
    expectInvalid((candidate) => (candidate.signing.protocolMaySelfAuthorize = true));
    expectInvalid((candidate) => candidate.signing.requiredBindings.pop());
  });

  it('rejects post-start mutation and incomplete invalidation rules', () => {
    expectInvalid((candidate) => (candidate.lifecycle.state = 'active'));
    expectInvalid((candidate) => (candidate.lifecycle.observationStartedAtMs = Date.now()));
    expectInvalid((candidate) => candidate.invalidationRules.pop());
    expectInvalid((candidate) => (candidate.invalidationRules[0] = ''));
  });

  it('binds every normative free-text field to the frozen protocol semantics', () => {
    const mutations: Array<(candidate: any) => void> = [
      (candidate) => (candidate.participantSegments[0].eligibility = 'Any participant.'),
      (candidate) => (candidate.participantSegments[0].requiredEvidence = 'No evidence required.'),
      (candidate) => (candidate.scripts.noviceEntry[0].prompt = 'Do anything.'),
      (candidate) => (candidate.scripts.noviceEntry[0].success = 'Any output.'),
      (candidate) => (candidate.scripts.noviceEntry[0].failure = 'Never fails.'),
      (candidate) => (candidate.scripts.primaryJourneys[0].prompt = 'Do anything.'),
      (candidate) => (candidate.scripts.primaryJourneys[0].success = 'Any output.'),
      (candidate) => (candidate.scripts.primaryJourneys[0].failure = 'Never fails.'),
      (candidate) => (candidate.rubrics.disclosurePreference.requirement = 'No disclosure required.'),
      (candidate) => (candidate.rubrics.disclosurePreference.pass = 'Always passes.'),
      (candidate) => (candidate.rubrics.disclosurePreference.fail = 'Never fails.'),
      (candidate) => (candidate.rubrics.authorityComprehension.pass = 'Always passes.'),
      (candidate) => (candidate.rubrics.authorityComprehension.fail = 'Never fails.'),
      (candidate) => (candidate.classicComparison.assignment = 'No comparison required.'),
      (candidate) => (candidate.classicComparison.expertInteractionBudget.interactions = 'Nothing measured.'),
      (candidate) => (candidate.classicComparison.decisionRule = 'Missing evidence is a pass.'),
      (candidate) => (candidate.invalidationRules[0] = 'Protocol mutation is allowed.'),
    ];
    mutations.forEach((mutate) => expectInvalid(mutate, /canonicalSha256/));
  });

  it('rejects unknown keys at every authority boundary', () => {
    expectInvalid((candidate) => (candidate.unreviewed = true));
    expectInvalid((candidate) => (candidate.lifecycle.unreviewed = true));
    expectInvalid((candidate) => (candidate.measurement.unreviewed = true));
    expectInvalid((candidate) => (candidate.scripts.primaryJourneys[0].unreviewed = true));
  });

  it('binds raw bytes separately from canonical semantics and rejects duplicate keys', () => {
    const reformatted = verifyProtocolBytes(` ${protocolBytes}`);
    const original = verifyProtocolBytes(protocolBytes);
    expect(reformatted.sha256).not.toBe(original.sha256);
    expect(reformatted.canonicalSha256).toBe(original.canonicalSha256);
    expect(() => verifyProtocolBytes(protocolBytes.replace('{', '{"protocolVersion":"forged",'))).toThrow(
      /M0B_PROTOCOL_DUPLICATE_KEY/
    );
  });
});
