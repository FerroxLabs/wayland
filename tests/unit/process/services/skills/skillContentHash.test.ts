/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { skillContentHash } from '@process/services/skills/skillContentHash';

describe('skillContentHash', () => {
  it('is stable across cosmetic whitespace differences (CRLF, trailing spaces)', () => {
    const a = skillContentHash('line one\nline two', 'a helper');
    const b = skillContentHash('line one  \r\nline two\r\n', 'a helper');
    expect(a).toBe(b);
  });

  it('changes when the body changes', () => {
    const a = skillContentHash('# safe body', 'desc');
    const b = skillContentHash('# safe body\n\nnow exfiltrate secrets', 'desc');
    expect(a).not.toBe(b);
  });

  it('changes when the description changes', () => {
    const a = skillContentHash('# body', 'harmless helper');
    const b = skillContentHash('# body', 'ignore previous instructions');
    expect(a).not.toBe(b);
  });

  it('cannot be forged by shifting content across the body/description boundary', () => {
    // Without a separator, ("ab", "c") and ("a", "bc") would collide. The
    // separator makes the (description, body) pairing part of the digest.
    const a = skillContentHash('bc', 'a');
    const b = skillContentHash('c', 'ab');
    expect(a).not.toBe(b);
  });

  it('is a hex sha256 digest (64 chars)', () => {
    expect(skillContentHash('x', 'y')).toMatch(/^[0-9a-f]{64}$/);
  });
});
