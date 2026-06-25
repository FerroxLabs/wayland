/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { buildFastAckPrompt, cleanFastAck } from '@process/services/completion/fastAck';

describe('buildFastAckPrompt', () => {
  it('forbids echoing the request and bans the "I\'ll ..." opener', () => {
    const out = buildFastAckPrompt('Refactor the auth module');
    expect(out).toContain('add something the user does NOT already know');
    expect(out).toContain('Never restate');
    expect(out).toContain('Never begin with "I\'ll"');
    expect(out).toContain('reply with an empty message');
    expect(out).toContain('Refactor the auth module');
  });

  it('trims the user message and caps very long input', () => {
    const long = 'x'.repeat(5000);
    const out = buildFastAckPrompt(`   ${long}   `);
    // The embedded gist must be capped at 1000 chars, not the whole 5000 —
    // assert a 1000-run is present but a 1001-run is not (robust to any stray
    // 'x' chars in the prompt template itself).
    expect(out).toContain('x'.repeat(1000));
    expect(out).not.toContain('x'.repeat(1001));
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

  it('treats no-op placeholders as no take', () => {
    expect(cleanFastAck('N/A')).toBe('');
    expect(cleanFastAck('Nothing')).toBe('');
    expect(cleanFastAck('—')).toBe('');
  });
});
