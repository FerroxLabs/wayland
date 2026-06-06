/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { toLineTextMessage } from '@process/channels/plugins/tier2/line/LineAdapter';

describe('toLineTextMessage', () => {
  it('builds a LINE text message from a short outgoing message', () => {
    const msg = toLineTextMessage({ type: 'text', text: 'Hello LINE' });
    expect(msg).toEqual({ type: 'text', text: 'Hello LINE' });
  });

  it('truncates text exceeding the 5000-char LINE limit', () => {
    const long = 'a'.repeat(6000);
    const msg = toLineTextMessage({ type: 'text', text: long });
    expect(msg.text.length).toBe(5000);
  });

  it('throws when text is empty after trim', () => {
    expect(() => toLineTextMessage({ type: 'text', text: '   ' })).toThrow(
      /cannot be empty/i,
    );
  });

  it('throws when text is absent', () => {
    expect(() => toLineTextMessage({ type: 'text' })).toThrow(/cannot be empty/i);
  });

  it('preserves multi-line text content', () => {
    const multiline = 'Line one\nLine two\nLine three';
    const msg = toLineTextMessage({ type: 'text', text: multiline });
    expect(msg.text).toBe(multiline);
  });
});
