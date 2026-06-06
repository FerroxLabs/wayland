/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string; backend?: string; name?: string }) => {
      const fallback = opts?.defaultValue ?? _key;
      if (opts?.backend) return fallback.replace('{{backend}}', opts.backend);
      if (opts?.name) return fallback.replace('{{name}}', opts.name);
      return fallback;
    },
  }),
}));

vi.mock('@/renderer/utils/platform', () => ({
  resolveExtensionAssetUrl: (v: string) => v,
}));

vi.mock('@/renderer/pages/guid/constants', () => ({
  CUSTOM_AVATAR_IMAGE_MAP: {},
}));

import AssistantCard from '../../../../src/renderer/pages/assistants/components/AssistantCard';
import type { AssistantListItem } from '../../../../src/renderer/pages/settings/AssistantSettings/types';

const buildAssistant = (overrides: Partial<AssistantListItem> = {}): AssistantListItem =>
  ({
    id: 'builtin-word-creator',
    name: 'Word Creator',
    nameI18n: { 'en-US': 'Word Creator' },
    description: 'Build Word docs',
    descriptionI18n: { 'en-US': 'Build Word docs' },
    presetAgentType: 'gemini',
    isBuiltin: true,
    isPreset: true,
    avatar: '📝',
    ...overrides,
  }) as AssistantListItem;

describe('AssistantCard', () => {
  it('renders name and description (backend hint intentionally removed in F3)', () => {
    render(
      <AssistantCard
        assistant={buildAssistant()}
        type='builtin'
        localeKey='en-US'
        onLaunch={vi.fn()}
        onMenuClick={vi.fn()}
      />
    );

    expect(screen.getByText('Word Creator')).toBeTruthy();
    expect(screen.getByText('Build Word docs')).toBeTruthy();
    // Backend hint was removed per Sean's F3 - the chat-input model selector
    // is the only override surface. The card must NOT advertise a backend.
    expect(screen.queryByText(/Runs on/i)).toBeNull();
  });

  it('invokes onLaunch when the card body is clicked', () => {
    const onLaunch = vi.fn();
    render(
      <AssistantCard
        assistant={buildAssistant()}
        type='builtin'
        localeKey='en-US'
        onLaunch={onLaunch}
        onMenuClick={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('assistant-card-builtin-word-creator'));
    expect(onLaunch).toHaveBeenCalledTimes(1);
    expect(onLaunch.mock.calls[0][0].id).toBe('builtin-word-creator');
  });

  it('routes the menu icon click to onMenuClick and does not launch', () => {
    const onLaunch = vi.fn();
    const onMenuClick = vi.fn();
    render(
      <AssistantCard
        assistant={buildAssistant()}
        type='builtin'
        localeKey='en-US'
        onLaunch={onLaunch}
        onMenuClick={onMenuClick}
      />
    );

    fireEvent.click(screen.getByTestId('assistant-card-menu-builtin-word-creator'));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
    expect(onLaunch).not.toHaveBeenCalled();
  });

  it('applies the type dot class for the requested type', () => {
    const { container } = render(
      <AssistantCard
        assistant={buildAssistant({ id: 'team-fire', isBuiltin: false })}
        type='team'
        localeKey='en-US'
        onLaunch={vi.fn()}
        onMenuClick={vi.fn()}
      />
    );

    const card = container.querySelector('[data-card-type="team"]');
    expect(card).not.toBeNull();
  });
});
