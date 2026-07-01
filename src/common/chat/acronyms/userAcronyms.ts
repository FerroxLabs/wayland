/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { uuid } from '@/common/utils';

export const USER_ACRONYMS_CONFIG_KEY = 'slash.customAcronyms';

export interface UserAcronym {
  id: string;
  acronym: string;
  expansion: string;
  description: string;
  enabled: boolean;
  /** Extension acronym id this user entry overrides. Omitted for user-created acronyms. */
  sourceId?: string;
  createdAt: number;
  updatedAt: number;
}

export type UserAcronymInput = {
  acronym: string;
  expansion: string;
  description?: string;
  enabled?: boolean;
  sourceId?: string;
};

export type AcronymLike = {
  id: string;
  acronym: string;
  sourceId?: string;
};

export const MAX_ACRONYM_LENGTH = 32;
const ACRONYM_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export type AcronymValidationError = 'empty' | 'tooLong' | 'invalidChars' | 'duplicate';
export type AcronymValidationResult = { valid: true } | { valid: false; reason: AcronymValidationError };

export function validateAcronym(
  rawAcronym: string,
  existing: readonly AcronymLike[],
  excludeId?: string,
  excludeSourceId?: string
): AcronymValidationResult {
  const acronym = rawAcronym.trim();
  if (!acronym) {
    return { valid: false, reason: 'empty' };
  }
  if (acronym.length > MAX_ACRONYM_LENGTH) {
    return { valid: false, reason: 'tooLong' };
  }
  if (!ACRONYM_RE.test(acronym)) {
    return { valid: false, reason: 'invalidChars' };
  }
  const lower = acronym.toLowerCase();
  const clash = existing.some(
    (item) =>
      item.id !== excludeId &&
      (!excludeSourceId || item.sourceId !== excludeSourceId) &&
      item.acronym.toLowerCase() === lower
  );
  if (clash) {
    return { valid: false, reason: 'duplicate' };
  }
  return { valid: true };
}

function normalizeInput(input: UserAcronymInput): Required<Omit<UserAcronymInput, 'sourceId'>> & { sourceId?: string } {
  return {
    acronym: input.acronym.trim(),
    expansion: input.expansion.trim(),
    description: input.description?.trim() ?? '',
    enabled: input.enabled ?? true,
    sourceId: input.sourceId,
  };
}

export function createUserAcronym(
  existing: readonly UserAcronym[],
  input: UserAcronymInput,
  validationExisting: readonly AcronymLike[] = existing
): UserAcronym[] {
  const normalized = normalizeInput(input);
  const check = validateAcronym(normalized.acronym, validationExisting, undefined, normalized.sourceId);
  if (check.valid === false) {
    throw new Error(`Invalid acronym: ${check.reason}`);
  }
  if (!normalized.expansion) {
    throw new Error('Expansion cannot be empty');
  }
  const now = Date.now();
  return [
    ...existing,
    {
      id: uuid(),
      acronym: normalized.acronym,
      expansion: normalized.expansion,
      description: normalized.description,
      enabled: normalized.enabled,
      sourceId: normalized.sourceId,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function updateUserAcronym(
  existing: readonly UserAcronym[],
  id: string,
  input: UserAcronymInput,
  validationExisting: readonly AcronymLike[] = existing
): UserAcronym[] {
  const target = existing.find((item) => item.id === id);
  if (!target) {
    return [...existing];
  }
  const normalized = normalizeInput(input);
  const sourceId = normalized.sourceId ?? target.sourceId;
  const check = validateAcronym(normalized.acronym, validationExisting, id, sourceId);
  if (check.valid === false) {
    throw new Error(`Invalid acronym: ${check.reason}`);
  }
  if (!normalized.expansion) {
    throw new Error('Expansion cannot be empty');
  }
  return existing.map((item) =>
    item.id === id
      ? {
          ...item,
          acronym: normalized.acronym,
          expansion: normalized.expansion,
          description: normalized.description,
          enabled: normalized.enabled,
          sourceId,
          updatedAt: Date.now(),
        }
      : item
  );
}

export function deleteUserAcronym(existing: readonly UserAcronym[], id: string): UserAcronym[] {
  return existing.filter((item) => item.id !== id);
}
