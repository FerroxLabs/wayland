/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  classifyManagedWorkspaceRetention,
  type ManagedWorkspaceEvidence,
} from '@/process/services/workspaceRetention';
import { parseManagedWorkspaceInventoryReport } from '@/common/types/managedWorkspaceRetention';
import { describe, expect, it } from 'vitest';

const DAY = 24 * 60 * 60 * 1000;

function emptyShell(overrides: Partial<ManagedWorkspaceEvidence> = {}): ManagedWorkspaceEvidence {
  return {
    managedProvenance: true,
    inventoryComplete: true,
    referenceCount: 0,
    scheduleCount: 0,
    activeProcessCount: 0,
    artifactCount: 0,
    userPromoted: false,
    userContent: 'absent',
    modified: false,
    abandonedForMs: 31 * DAY,
    retentionWindowMs: 30 * DAY,
    ...overrides,
  };
}

describe('classifyManagedWorkspaceRetention', () => {
  it('only makes a fully proved empty abandoned shell a non-authoritative review candidate', () => {
    expect(classifyManagedWorkspaceRetention(emptyShell())).toEqual({
      classifications: ['empty-abandoned'],
      disposition: 'review-candidate',
      reasons: ['complete evidence proves an empty app-managed shell beyond the retention window'],
    });
  });

  it.each([
    ['conversation or Project reference', { referenceCount: 1 }, 'referenced'],
    ['schedule', { scheduleCount: 1 }, 'scheduled'],
    ['active process', { activeProcessCount: 1 }, 'active'],
    ['artifact or receipt', { artifactCount: 1 }, 'artifact-bearing'],
    ['user-authored file', { userContent: 'present' as const }, 'modified'],
    ['post-creation mutation', { modified: true }, 'modified'],
    ['user promotion', { userPromoted: true }, 'user-promoted'],
  ])('preserves a workspace with a %s', (_name, overrides, classification) => {
    const result = classifyManagedWorkspaceRetention(emptyShell(overrides));
    expect(result.disposition).toBe('preserve');
    expect(result.classifications).toContain(classification);
  });

  it.each([
    ['foreign/unproven provenance', { managedProvenance: false }],
    ['incomplete inventory', { inventoryComplete: false }],
    ['unknown reference count', { referenceCount: null }],
    ['unknown schedule count', { scheduleCount: null }],
    ['unknown active-process count', { activeProcessCount: null }],
    ['unknown artifact count', { artifactCount: null }],
    ['unknown user-promotion state', { userPromoted: null }],
    ['unknown content state', { userContent: 'unknown' as const }],
    ['unknown mutation state', { modified: null }],
    ['unknown abandonment age', { abandonedForMs: null }],
    ['negative count', { referenceCount: -1 }],
    ['non-integer count', { artifactCount: 0.5 }],
    ['invalid retention window', { retentionWindowMs: -1 }],
    ['malformed provenance', { managedProvenance: 'yes' as unknown as boolean }],
    ['malformed completeness', { inventoryComplete: 1 as unknown as boolean }],
  ])('fails closed when evidence has %s', (_name, overrides) => {
    const result = classifyManagedWorkspaceRetention(emptyShell(overrides));
    expect(result.disposition).toBe('preserve');
    expect(result.classifications).toContain('unknown');
  });

  it('preserves an empty shell until the retention window elapses', () => {
    const result = classifyManagedWorkspaceRetention(emptyShell({ abandonedForMs: 29 * DAY }));
    expect(result).toMatchObject({ classifications: ['unknown'], disposition: 'preserve' });
    expect(result.reasons).toContain('the visible retention window has not elapsed');
  });

  it('does not let an empty classification override any preservation evidence', () => {
    const result = classifyManagedWorkspaceRetention(
      emptyShell({ referenceCount: 2, scheduleCount: 1, artifactCount: 3, userPromoted: true, modified: true })
    );
    expect(result.disposition).toBe('preserve');
    expect(result.classifications).toEqual([
      'referenced',
      'scheduled',
      'artifact-bearing',
      'modified',
      'user-promoted',
    ]);
    expect(result.classifications).not.toContain('empty-abandoned');
  });
});

function completeReferencedReport() {
  const evidence = emptyShell({ referenceCount: 1 });
  return {
    generatedAt: '2026-07-19T00:00:00.000Z',
    root: '/managed/work',
    canonicalRoot: '/managed/work',
    authorityCompleteness: {
      conversation: 'complete',
      project: 'complete',
      schedule: 'complete',
      artifact: 'complete',
      receipt: 'complete',
      'active-process': 'complete',
      provenance: 'complete',
      snapshot: 'complete',
    },
    complete: true,
    entries: [
      {
        path: '/managed/work/wcore-temp-1736900000000',
        canonicalPath: '/managed/work/wcore-temp-1736900000000',
        evidence,
        decision: classifyManagedWorkspaceRetention(evidence),
        references: [{ source: 'conversation', id: 'chat-1' }],
        errors: [],
      },
    ],
    summary: { discovered: 1, preserved: 1, reviewCandidate: 0, unknown: 0 },
    errors: [],
  };
}

describe('parseManagedWorkspaceInventoryReport semantic admission', () => {
  it('accepts a complete report only when evidence, references, and decision agree', () => {
    expect(parseManagedWorkspaceInventoryReport(completeReferencedReport())).not.toBeNull();
  });

  it('rejects classifications and reasons that contradict the shared classifier', () => {
    const classification = completeReferencedReport();
    classification.entries[0].decision = {
      classifications: ['unknown'],
      disposition: 'preserve',
      reasons: classification.entries[0].decision.reasons,
    };
    expect(parseManagedWorkspaceInventoryReport(classification)).toBeNull();

    const reason = completeReferencedReport();
    reason.entries[0].decision.reasons = ['attacker-supplied explanation'];
    expect(parseManagedWorkspaceInventoryReport(reason)).toBeNull();
  });

  it('rejects authority counts that contradict projected references', () => {
    const report = completeReferencedReport();
    report.entries[0].references = [];
    expect(parseManagedWorkspaceInventoryReport(report)).toBeNull();
  });

  it('rejects duplicate or blank projected authority identities', () => {
    const duplicate = completeReferencedReport();
    duplicate.entries[0].evidence.referenceCount = 2;
    duplicate.entries[0].decision = classifyManagedWorkspaceRetention(duplicate.entries[0].evidence);
    duplicate.entries[0].references = [
      { source: 'conversation', id: 'chat-1' },
      { source: 'conversation', id: 'chat-1' },
    ];
    expect(parseManagedWorkspaceInventoryReport(duplicate)).toBeNull();

    const blank = completeReferencedReport();
    blank.entries[0].references[0].id = '   ';
    expect(parseManagedWorkspaceInventoryReport(blank)).toBeNull();
  });

  it('rejects a false incomplete claim when every authority and entry is complete', () => {
    const report = completeReferencedReport();
    report.complete = false;
    expect(parseManagedWorkspaceInventoryReport(report)).toBeNull();
  });
});
