/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  resolveWorkflowPalette,
  WORKFLOW_CATEGORY_PALETTE,
} from '@/renderer/pages/guid/components/workflow/workflowPalette';

describe('resolveWorkflowPalette', () => {
  it('maps Business Operations to business-ops', () => {
    expect(resolveWorkflowPalette('Business Operations')).toBe('business-ops');
  });

  it('maps Content Creation to violet', () => {
    expect(resolveWorkflowPalette('Content Creation')).toBe('violet');
  });

  it('maps Creative Projects to rose', () => {
    expect(resolveWorkflowPalette('Creative Projects')).toBe('rose');
  });

  it('maps Career to blue', () => {
    expect(resolveWorkflowPalette('Career')).toBe('blue');
  });

  it('maps Lifestyle to amber', () => {
    expect(resolveWorkflowPalette('Lifestyle')).toBe('amber');
  });

  it('maps Software & Engineering to emerald', () => {
    expect(resolveWorkflowPalette('Software & Engineering')).toBe('emerald');
  });

  it('maps Cross-Domain to slate', () => {
    expect(resolveWorkflowPalette('Cross-Domain')).toBe('slate');
  });

  it('returns orange for null category', () => {
    expect(resolveWorkflowPalette(null)).toBe('orange');
  });

  it('returns orange for unknown category string', () => {
    expect(resolveWorkflowPalette('Totally Made Up Category')).toBe('orange');
  });

  it('returns orange for empty string', () => {
    expect(resolveWorkflowPalette('')).toBe('orange');
  });
});

describe('WORKFLOW_CATEGORY_PALETTE constant', () => {
  it('contains all seven known category keys', () => {
    expect(Object.keys(WORKFLOW_CATEGORY_PALETTE).sort()).toEqual(
      [
        'Business Operations',
        'Career',
        'Content Creation',
        'Creative Projects',
        'Cross-Domain',
        'Lifestyle',
        'Software & Engineering',
      ].sort()
    );
  });
});
