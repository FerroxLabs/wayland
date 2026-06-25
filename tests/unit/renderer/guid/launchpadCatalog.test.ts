/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { Bot } from 'lucide-react';
import { resolveBarEntry } from '@/renderer/pages/guid/components/newChatStarter/launchpadCatalog';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';

const assistantsFixture: AssistantListItem[] = [
  // Lucide avatar - should resolve Icon to the matching component (not Bot).
  { id: 'ppt-creator', name: 'PPT Creator', avatar: 'lucide:Presentation' } as AssistantListItem,
  // Extension-asset URL - should land an avatarUrl + Bot fallback icon.
  {
    id: 'ext-morph-ppt',
    name: 'Morph PPT',
    avatar: 'wayland-asset://asset/some/morph.svg',
  } as AssistantListItem,
  // Emoji avatar - should land an avatarEmoji.
  { id: 'pptx-generator', name: 'PPTX Generator', avatar: '📊' } as AssistantListItem,
  // No avatar at all - falls through to Bot icon, no avatarUrl/avatarEmoji.
  { id: 'ext-openclaw-setup', name: 'OpenClaw Setup Expert' } as AssistantListItem,
];

describe('launchpadCatalog.resolveBarEntry', () => {
  it('Cowork anchor is the only isCowork=true entry', () => {
    const cowork = resolveBarEntry('builtin-cowork', assistantsFixture, 'en-US');
    expect(cowork?.isCowork).toBe(true);

    const writeCopy = resolveBarEntry('builtin-copy', assistantsFixture, 'en-US');
    // builtin-copy is the write-copy anchor's assistantId (ext-* ids were
    // remapped to builtin-* when the waylandteams catalog went native); it
    // resolves via the anchor path with isCowork=false.
    expect(writeCopy?.isCowork).toBe(false);
  });

  it('resolves lucide:Foo avatars to the matching Lucide icon component', () => {
    const entry = resolveBarEntry('ppt-creator', assistantsFixture, 'en-US');
    expect(entry).not.toBeNull();
    expect(entry?.avatarUrl).toBeUndefined();
    expect(entry?.avatarEmoji).toBeUndefined();
    // The Icon should NOT be the Bot fallback - it should be the Presentation icon.
    expect(entry?.Icon).not.toBe(Bot);
  });

  it('resolves wayland-asset:// avatars to an avatarUrl for <img> rendering', () => {
    const entry = resolveBarEntry('ext-morph-ppt', assistantsFixture, 'en-US');
    expect(entry).not.toBeNull();
    expect(entry?.avatarUrl).toBeDefined();
    expect(entry?.avatarEmoji).toBeUndefined();
  });

  it('keeps emoji avatars as avatarEmoji glyphs', () => {
    const entry = resolveBarEntry('pptx-generator', assistantsFixture, 'en-US');
    expect(entry).not.toBeNull();
    expect(entry?.avatarEmoji).toBe('📊');
    expect(entry?.avatarUrl).toBeUndefined();
  });

  it('falls back to the Bot icon when no avatar is provided', () => {
    const entry = resolveBarEntry('ext-openclaw-setup', assistantsFixture, 'en-US');
    expect(entry).not.toBeNull();
    expect(entry?.Icon).toBe(Bot);
    expect(entry?.avatarUrl).toBeUndefined();
    expect(entry?.avatarEmoji).toBeUndefined();
  });

  it('returns null when nothing resolves (unknown id, not in presets)', () => {
    const entry = resolveBarEntry('ext-this-does-not-exist', assistantsFixture, 'en-US');
    expect(entry).toBeNull();
  });
});
