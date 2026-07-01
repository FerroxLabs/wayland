import { describe, expect, it } from 'vitest';
import {
  createUserAcronym,
  deleteUserAcronym,
  updateUserAcronym,
  validateAcronym,
  type UserAcronym,
} from '@/common/chat/acronyms/userAcronyms';

const make = (overrides: Partial<UserAcronym> = {}): UserAcronym => ({
  id: overrides.id ?? 'id-1',
  acronym: overrides.acronym ?? 'WWA',
  expansion: overrides.expansion ?? 'Where We At',
  description: overrides.description ?? 'Status update',
  enabled: overrides.enabled ?? true,
  sourceId: overrides.sourceId,
  createdAt: overrides.createdAt ?? 1,
  updatedAt: overrides.updatedAt ?? 1,
});

describe('validateAcronym', () => {
  it('rejects empty, invalid, long, and duplicate acronyms', () => {
    expect(validateAcronym('', [])).toEqual({ valid: false, reason: 'empty' });
    expect(validateAcronym('1BAD', [])).toEqual({ valid: false, reason: 'invalidChars' });
    expect(validateAcronym('has space', [])).toEqual({ valid: false, reason: 'invalidChars' });
    expect(validateAcronym('A'.repeat(33), [])).toEqual({ valid: false, reason: 'tooLong' });
    expect(validateAcronym('wwa', [make()])).toEqual({ valid: false, reason: 'duplicate' });
  });

  it('allows an edit to keep its own acronym', () => {
    expect(validateAcronym('wwa', [make()], 'id-1')).toEqual({ valid: true });
  });
});

describe('createUserAcronym', () => {
  it('creates normalized custom acronyms', () => {
    const next = createUserAcronym([], {
      acronym: ' eib ',
      expansion: ' Explain It Back ',
      description: ' Plain language recap ',
    });

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      acronym: 'eib',
      expansion: 'Explain It Back',
      description: 'Plain language recap',
      enabled: true,
    });
    expect(next[0].id).toBeTruthy();
  });

  it('creates disabled extension overrides', () => {
    const next = createUserAcronym([], {
      acronym: 'WWA',
      expansion: 'Where We At',
      enabled: false,
      sourceId: 'openclaw:wwa',
    });

    expect(next[0]).toMatchObject({ enabled: false, sourceId: 'openclaw:wwa' });
  });
});

describe('updateUserAcronym', () => {
  it('updates an acronym and preserves source override ids', () => {
    const existing = [make({ id: 'id-1', sourceId: 'openclaw:wwa', createdAt: 100, updatedAt: 100 })];
    const next = updateUserAcronym(existing, 'id-1', {
      acronym: 'CI',
      expansion: 'Check In',
      description: '',
      enabled: true,
    });

    expect(next[0]).toMatchObject({
      acronym: 'CI',
      expansion: 'Check In',
      sourceId: 'openclaw:wwa',
      createdAt: 100,
    });
    expect(next[0].updatedAt).toBeGreaterThanOrEqual(100);
  });
});

describe('deleteUserAcronym', () => {
  it('removes the matching custom acronym', () => {
    expect(deleteUserAcronym([make({ id: 'id-1' }), make({ id: 'id-2' })], 'id-1').map((item) => item.id)).toEqual([
      'id-2',
    ]);
  });
});
