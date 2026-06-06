/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isImageAvatar } from '@/renderer/utils/avatar';

describe('isImageAvatar', () => {
  it('returns true for known image extensions (case-insensitive)', () => {
    expect(isImageAvatar('foo.svg')).toBe(true);
    expect(isImageAvatar('foo.PNG')).toBe(true);
    expect(isImageAvatar('foo.jpg')).toBe(true);
    expect(isImageAvatar('foo.jpeg')).toBe(true);
    expect(isImageAvatar('foo.webp')).toBe(true);
    expect(isImageAvatar('foo.gif')).toBe(true);
  });

  it('returns true for known URL schemes', () => {
    expect(isImageAvatar('https://example.com/a.bin')).toBe(true);
    expect(isImageAvatar('http://example.com/a.bin')).toBe(true);
    expect(isImageAvatar('wayland-asset://asset/icon')).toBe(true);
    expect(isImageAvatar('file:///abs/path')).toBe(true);
    expect(isImageAvatar('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
  });

  it('returns false for emoji or plain text glyphs', () => {
    expect(isImageAvatar('🤖')).toBe(false);
    expect(isImageAvatar('AB')).toBe(false);
    expect(isImageAvatar('hello')).toBe(false);
  });

  it('returns false for unsupported extensions', () => {
    expect(isImageAvatar('foo.txt')).toBe(false);
    expect(isImageAvatar('foo.mp4')).toBe(false);
  });

  it('returns false for the empty string', () => {
    expect(isImageAvatar('')).toBe(false);
  });
});
