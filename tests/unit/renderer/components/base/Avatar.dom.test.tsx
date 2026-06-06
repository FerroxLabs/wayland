/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/renderer/pages/guid/constants', () => ({
  CUSTOM_AVATAR_IMAGE_MAP: {
    'mapped-key': 'https://cdn.example.com/mapped.png',
  } as Record<string, string>,
}));

vi.mock('@/renderer/utils/platform', () => ({
  resolveExtensionAssetUrl: (url: string | undefined) => url,
}));

import Avatar from '@/renderer/components/base/Avatar';

describe('Avatar', () => {
  it('renders <img> for image-resolving avatar values', () => {
    const { container } = render(<Avatar avatar='https://cdn.example.com/a.png' name='Alice Adams' alt='alice' />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('https://cdn.example.com/a.png');
    expect(img!.getAttribute('alt')).toBe('alice');
  });

  it('renders <span> with raw glyph for emoji-style avatars', () => {
    const { container } = render(<Avatar avatar='🤖' name='Bob Beta' />);
    expect(container.querySelector('img')).toBeNull();
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('🤖');
  });

  it('falls back to initials when no avatar is set', () => {
    const { container } = render(<Avatar name='Carol Catto' />);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('CC');
  });

  it('uses CUSTOM_AVATAR_IMAGE_MAP to resolve mapped keys to image URLs', () => {
    const { container } = render(<Avatar avatar='mapped-key' name='Dave Delta' />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('https://cdn.example.com/mapped.png');
  });
});
