/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { buildFastAckPrompt, cleanFastAck } from '@process/services/completion/fastAck';

describe('buildFastAckPrompt', () => {
  it('asks for a single-sentence acknowledgement, not an answer', () => {
    const out = buildFastAckPrompt('Refactor the auth module');
    expect(out).toContain('ONE short sentence');
    expect(out).toContain('Do NOT answer the request itself');
    expect(out).toContain('Refactor the auth module');
  });

  it('trims the user message and caps very long input', () => {
    const long = 'x'.repeat(5000);
    const out = buildFastAckPrompt(`   ${long}   `);
    // The embedded gist must be capped (1000 chars), not the whole 5000.
    const xCount = (out.match(/x/g) ?? []).length;
    expect(xCount).toBe(1000);
  });
});

describe('cleanFastAck', () => {
  it('returns the first non-empty line, stripped of wrapping quotes', () => {
    expect(cleanFastAck('"Got it — I will scan the module first."')).toBe(
      'Got it — I will scan the module first.'
    );
  });

  it('collapses to a single line', () => {
    expect(cleanFastAck('\n\n  First line here  \nsecond line')).toBe('First line here');
  });

  it('returns empty string for blank output', () => {
    expect(cleanFastAck('   \n  \n')).toBe('');
  });
});
