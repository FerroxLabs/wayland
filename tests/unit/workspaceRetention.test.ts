/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  classifyManagedWorkspaceRetention,
  type ManagedWorkspaceEvidence,
} from '@/process/services/workspaceRetention';
import { describe, expect, it } from 'vitest';

const DAY = 24 * 60 * 60 * 1000;

function emptyShell(overrides: Partial<ManagedWorkspaceEvidence> = {}): ManagedWorkspaceEvidence {
  return {
    managedProvenance: true,
    inventoryComplete: true,
    referenceCount: 0,
    scheduleCount: 0,
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
  it('only makes a fully proved empty abandoned shell quarantine-eligible', () => {
    expect(classifyManagedWorkspaceRetention(emptyShell())).toEqual({
      classifications: ['empty-abandoned'],
      disposition: 'quarantine-eligible',
      reasons: ['complete evidence proves an empty app-managed shell beyond the retention window'],
    });
  });

  it.each([
    ['conversation or Project reference', { referenceCount: 1 }, 'referenced'],
    ['schedule', { scheduleCount: 1 }, 'scheduled'],
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
    ['unknown artifact count', { artifactCount: null }],
    ['unknown user-promotion state', { userPromoted: null }],
    ['unknown content state', { userContent: 'unknown' as const }],
    ['unknown mutation state', { modified: null }],
    ['unknown abandonment age', { abandonedForMs: null }],
    ['negative count', { referenceCount: -1 }],
    ['non-integer count', { artifactCount: 0.5 }],
    ['invalid retention window', { retentionWindowMs: -1 }],
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
