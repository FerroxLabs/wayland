/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Unit tests for parseSteps() - extracts `## Step N: <title>` markdown headers
// from a workflow body and returns ordered ParsedStep[] (see SPEC §4.2).

import { describe, expect, it } from 'vitest';
import { parseSteps } from '@process/services/workflow/parseSteps';

describe('parseSteps', () => {
  it('extracts a single standard `## Step 1: Title` header', () => {
    const body = '## Step 1: Audit Manual Processes\n\nCatalog every manual process.\n';
    const result = parseSteps(body);
    expect(result.truncated).toBe(false);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].n).toBe(1);
    expect(result.steps[0].title).toBe('Audit Manual Processes');
    expect(result.steps[0].body_excerpt).toContain('Catalog every manual process.');
  });

  it('extracts six sequential steps and preserves order', () => {
    const body = [
      '## Step 1: Audit',
      'Catalog the work.',
      '',
      '## Step 2: Prioritize',
      'Score by ROI.',
      '',
      '## Step 3: Design',
      'Draw the flow.',
      '',
      '## Step 4: Implement Quick Wins',
      'Ship the easy ones.',
      '',
      '## Step 5: Build Complex',
      'Tackle the hard ones.',
      '',
      '## Step 6: Monitor',
      'Watch the dashboards.',
    ].join('\n');
    const result = parseSteps(body);
    expect(result.steps).toHaveLength(6);
    expect(result.steps.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.steps.map((s) => s.title)).toEqual([
      'Audit',
      'Prioritize',
      'Design',
      'Implement Quick Wins',
      'Build Complex',
      'Monitor',
    ]);
    expect(result.truncated).toBe(false);
  });

  it('returns empty array when no `## Step` headers are present', () => {
    const body = '# Some Title\n\nNo steps in here.\n\n## Overview\n\nJust prose.\n';
    const result = parseSteps(body);
    expect(result.steps).toEqual([]);
    expect(result.truncated).toBe(false);
  });

  it('handles empty title (`## Step 1:` with nothing after colon)', () => {
    const body = '## Step 1:\n\nBody text here.\n';
    const result = parseSteps(body);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].n).toBe(1);
    expect(result.steps[0].title).toBe('');
  });

  it('caps output at 30 steps and marks truncated', () => {
    const lines: string[] = [];
    for (let i = 1; i <= 31; i++) {
      lines.push(`## Step ${i}: Title ${i}`);
      lines.push(`Body for step ${i}.`);
      lines.push('');
    }
    const result = parseSteps(lines.join('\n'));
    expect(result.steps).toHaveLength(30);
    expect(result.truncated).toBe(true);
    expect(result.steps[0].n).toBe(1);
    expect(result.steps[29].n).toBe(30);
  });

  it('returns exactly 30 steps with truncated=false at the cap boundary', () => {
    const lines: string[] = [];
    for (let i = 1; i <= 30; i++) {
      lines.push(`## Step ${i}: Title ${i}`);
      lines.push(`Body for step ${i}.`);
      lines.push('');
    }
    const result = parseSteps(lines.join('\n'));
    expect(result.steps).toHaveLength(30);
    expect(result.truncated).toBe(false);
  });

  it('body_excerpt for step N stops at the start of step N+1', () => {
    const body = [
      '## Step 1: First',
      'Body of one.',
      'MARKER_ONE',
      '',
      '## Step 2: Second',
      'Body of two.',
      'MARKER_TWO',
    ].join('\n');
    const result = parseSteps(body);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].body_excerpt).toContain('MARKER_ONE');
    expect(result.steps[0].body_excerpt).not.toContain('MARKER_TWO');
    expect(result.steps[0].body_excerpt).not.toContain('## Step 2');
    expect(result.steps[1].body_excerpt).toContain('MARKER_TWO');
  });

  it('caps body_excerpt at 8192 bytes (8KB)', () => {
    const big = 'x'.repeat(20_000);
    const body = `## Step 1: Huge\n${big}\n`;
    const result = parseSteps(body);
    expect(result.steps).toHaveLength(1);
    expect(Buffer.byteLength(result.steps[0].body_excerpt, 'utf8')).toBeLessThanOrEqual(8192);
  });

  it('preserves author-declared numbering (no auto-renumber)', () => {
    const body = [
      '## Step 2: Skipped one',
      'Body A.',
      '',
      '## Step 5: Jumped ahead',
      'Body B.',
      '',
      '## Step 7: Final',
      'Body C.',
    ].join('\n');
    const result = parseSteps(body);
    expect(result.steps.map((s) => s.n)).toEqual([2, 5, 7]);
  });

  it('matches `step` case-insensitively but only with `##`', () => {
    const body = [
      '## step 1: lowercase keyword',
      'Body A.',
      '',
      '## STEP 2: uppercase keyword',
      'Body B.',
      '',
      '### Step 3: wrong heading level',
      'Body C.',
      '',
      '## Step 4: correct',
      'Body D.',
    ].join('\n');
    const result = parseSteps(body);
    expect(result.steps.map((s) => s.n)).toEqual([1, 2, 4]);
    expect(result.steps[0].title).toBe('lowercase keyword');
    expect(result.steps[1].title).toBe('uppercase keyword');
    expect(result.steps[2].title).toBe('correct');
  });

  it('tolerates leading whitespace before `##` and trailing whitespace on title', () => {
    const body = ['   ## Step 1:    Spaced Out    ', 'Body here.'].join('\n');
    const result = parseSteps(body);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].title).toBe('Spaced Out');
  });

  it('tolerates multiple blank lines between sections', () => {
    const body = [
      '## Step 1: First',
      'Body one.',
      '',
      '',
      '',
      '',
      '## Step 2: Second',
      'Body two.',
    ].join('\n');
    const result = parseSteps(body);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].body_excerpt).toContain('Body one.');
    expect(result.steps[1].body_excerpt).toContain('Body two.');
  });

  it('returns empty for an empty string body', () => {
    const result = parseSteps('');
    expect(result.steps).toEqual([]);
    expect(result.truncated).toBe(false);
  });

  it('matches `**Step N: title**` bold-line convention used by bundled workflows', () => {
    const body = '**Step 1: Bold Title** (uses: workflow-designer)\n\nbody\n\n**Step 2: Another**\n\nmore\n';
    const result = parseSteps(body);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0]).toMatchObject({ n: 1, title: 'Bold Title' });
    expect(result.steps[1]).toMatchObject({ n: 2, title: 'Another' });
    expect(result.steps[0].body_excerpt).toContain('body');
  });

  it('still matches `## Step N: title` markdown header form', () => {
    const body = '## Step 1: Heading Form\n\nbody\n';
    const result = parseSteps(body);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toMatchObject({ n: 1, title: 'Heading Form' });
  });
});
