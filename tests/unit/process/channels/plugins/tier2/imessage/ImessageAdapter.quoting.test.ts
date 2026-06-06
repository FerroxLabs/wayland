/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adversarial tests for quoteAppleScriptString. These are security-critical:
 * a regression here would be a script-injection vector.
 */

import { describe, expect, it } from 'vitest';
import { quoteAppleScriptString } from '@process/channels/plugins/tier2/imessage/ImessageAdapter';

describe('quoteAppleScriptString - security helper', () => {
  it('wraps a plain string in double quotes', () => {
    expect(quoteAppleScriptString('hello')).toBe('"hello"');
  });

  it('escapes embedded double-quotes', () => {
    // Input: say "hi"
    // Expected AppleScript literal: "say \"hi\""
    expect(quoteAppleScriptString('say "hi"')).toBe('"say \\"hi\\""');
  });

  it('escapes backslashes before quote escaping (order matters)', () => {
    // Input: back\slash
    // In the escaped string: back\\slash → wrapped: "back\\slash"
    expect(quoteAppleScriptString('back\\slash')).toBe('"back\\\\slash"');
  });

  it('handles a string that is just a double-quote', () => {
    expect(quoteAppleScriptString('"')).toBe('"\\""');
  });

  it('handles a handle containing double-quote (injection attempt)', () => {
    // Adversarial handle: "+1555" & (do shell script "rm -rf /")
    // After quoting it must be inert inside a string literal.
    const adversarial = '"+1555" & (do shell script "rm -rf /")';
    const result = quoteAppleScriptString(adversarial);
    // Must start and end with double-quote and contain no unescaped quote inside.
    expect(result.startsWith('"')).toBe(true);
    expect(result.endsWith('"')).toBe(true);
    // The inner part (strip outer quotes) must have all " escaped as \"
    const inner = result.slice(1, -1);
    // No unescaped double-quote: all " must be preceded by \
    expect(inner).not.toMatch(/(?<!\\)"/);
  });

  it('escapes newlines so they do not break the single-line AppleScript expression', () => {
    expect(quoteAppleScriptString('line1\nline2')).toBe('"line1\\nline2"');
  });

  it('escapes carriage returns', () => {
    expect(quoteAppleScriptString('line1\rline2')).toBe('"line1\\rline2"');
  });

  it('handles an empty string', () => {
    expect(quoteAppleScriptString('')).toBe('""');
  });

  it('handles a multi-line adversarial message body', () => {
    const body = 'First line\n"quoted"\nback\\slash';
    const result = quoteAppleScriptString(body);
    expect(result.startsWith('"')).toBe(true);
    expect(result.endsWith('"')).toBe(true);
    const inner = result.slice(1, -1);
    expect(inner).not.toMatch(/(?<!\\)"/);
    expect(inner).not.toContain('\n');
    expect(inner).not.toContain('\r');
  });
});
