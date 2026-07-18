/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaletteAction } from '@/renderer/components/cmdk/useCommandPaletteSources';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockOpenExternalUrl = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/renderer/utils/platform', () => ({ openExternalUrl: mockOpenExternalUrl }));

// Stub i18n so assertions can target the raw keys passed by the component.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the data hook so each test has full control over the rows the
// palette renders, without dragging in IPC bridges or SWR.
const mockUseCommandPaletteSources = vi.hoisted(() => vi.fn());
vi.mock('@/renderer/components/cmdk/useCommandPaletteSources', () => ({
  useCommandPaletteSources: mockUseCommandPaletteSources,
}));

import CommandPalette from '@/renderer/components/cmdk/CommandPalette';

const ASSISTANTS = [
  { id: 'cold-outbound', name: 'Cold Outbound', presetAgentType: 'gemini', category: 'builtin' as const },
  { id: 'code-review', name: 'Code Review', presetAgentType: 'wcore', category: 'builtin' as const },
  { id: 'marketing', name: 'Marketing Specialist', presetAgentType: 'gemini', category: 'specialist' as const },
];

const RECENTS = [
  { id: 'conv-1', title: 'Yesterday onboarding chat', modifyTime: 1000 },
  { id: 'conv-2', title: 'Bug report triage', modifyTime: 900 },
];

const PROMPTS = [
  { id: 'brainstorm', label: 'common.cmdk.prompts.brainstorm', text: 'Help me brainstorm ideas about ' },
  { id: 'plan', label: 'common.cmdk.prompts.plan', text: 'Draft a plan for ' },
];

const routeAction = (overrides: Partial<PaletteAction> = {}): PaletteAction => ({
  id: 'activity.inspect',
  label: 'Activity',
  description: 'Inspect running work',
  keywords: ['activity', 'running'],
  capability: 'activity',
  intent: 'diagnose',
  target: { kind: 'route', path: '/mission-control' },
  availability: 'available',
  ...overrides,
});

const setSources = (
  overrides: Partial<{
    assistants: typeof ASSISTANTS;
    recents: typeof RECENTS;
    prompts: typeof PROMPTS;
    actions: PaletteAction[];
  }> = {}
) => {
  mockUseCommandPaletteSources.mockReturnValue({
    assistants: overrides.assistants ?? ASSISTANTS,
    recents: overrides.recents ?? RECENTS,
    prompts: overrides.prompts ?? PROMPTS,
    actions: overrides.actions ?? [],
  });
};

const baseProps = () => ({
  open: true,
  onClose: vi.fn(),
  onLaunchPreset: vi.fn(),
  onResumeChat: vi.fn(),
  onFillPrompt: vi.fn(),
});

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    setSources();
    const props = baseProps();
    render(<CommandPalette {...props} open={false} />);
    expect(screen.queryByTestId('cmdk-overlay')).not.toBeInTheDocument();
  });

  it('renders the search input and all group headings when open with no query', () => {
    setSources();
    render(<CommandPalette {...baseProps()} />);

    expect(screen.getByPlaceholderText('common.cmdk.placeholder')).toBeInTheDocument();
    expect(screen.getByText('common.cmdk.groups.bestMatch')).toBeInTheDocument();
    expect(screen.getByText('common.cmdk.groups.specialists')).toBeInTheDocument();
    expect(screen.getByText('common.cmdk.groups.builtins')).toBeInTheDocument();
    expect(screen.getByText('common.cmdk.groups.recents')).toBeInTheDocument();
    expect(screen.getByText('common.cmdk.groups.prompts')).toBeInTheDocument();
  });

  it('filters rows by query and surfaces best-match at the top', () => {
    setSources();
    render(<CommandPalette {...baseProps()} />);

    const input = screen.getByPlaceholderText('common.cmdk.placeholder') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'cold outb' } });

    // The "Cold Outbound" row should still be in the DOM (rendered in best
    // match + builtins groups) while "Marketing Specialist" should be
    // filtered out by cmdk's default fuzzy filter.
    const matchingRows = screen.getAllByText('Cold Outbound');
    expect(matchingRows.length).toBeGreaterThan(0);
    expect(screen.queryByText('Marketing Specialist')).not.toBeInTheDocument();
  });

  it('invokes onLaunchPreset and onClose when an assistant row is selected via click', () => {
    setSources();
    const props = baseProps();
    render(<CommandPalette {...props} />);

    // Click the "Cold Outbound" row in the built-ins group. We scope to the
    // group so we don't accidentally hit the best-match copy.
    const builtinsHeading = screen.getByText('common.cmdk.groups.builtins');
    const groupRoot = builtinsHeading.closest('[cmdk-group=""]') as HTMLElement;
    expect(groupRoot).toBeTruthy();
    const row = within(groupRoot).getByText('Cold Outbound');
    fireEvent.click(row);

    expect(props.onLaunchPreset).toHaveBeenCalledTimes(1);
    expect(props.onLaunchPreset).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cold-outbound', name: 'Cold Outbound' })
    );
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onResumeChat with the conversation id when a recent row is selected', () => {
    setSources();
    const props = baseProps();
    render(<CommandPalette {...props} />);

    const recentsHeading = screen.getByText('common.cmdk.groups.recents');
    const groupRoot = recentsHeading.closest('[cmdk-group=""]') as HTMLElement;
    const row = within(groupRoot).getByText('Bug report triage');
    fireEvent.click(row);

    expect(props.onResumeChat).toHaveBeenCalledWith('conv-2');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onFillPrompt with the prompt entry when a starter prompt is selected', () => {
    setSources();
    const props = baseProps();
    render(<CommandPalette {...props} />);

    const promptsHeading = screen.getByText('common.cmdk.groups.prompts');
    const groupRoot = promptsHeading.closest('[cmdk-group=""]') as HTMLElement;
    const row = within(groupRoot).getByText('common.cmdk.prompts.brainstorm');
    fireEvent.click(row);

    expect(props.onFillPrompt).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'brainstorm', text: 'Help me brainstorm ideas about ' })
    );
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when Escape is pressed', () => {
    setSources();
    const props = baseProps();
    render(<CommandPalette {...props} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the empty-state when filtering matches nothing', () => {
    setSources();
    render(<CommandPalette {...baseProps()} />);

    const input = screen.getByPlaceholderText('common.cmdk.placeholder') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'zzzzzz-no-match-zzzzz' } });

    expect(screen.getByText('common.cmdk.noResults')).toBeInTheDocument();
  });

  it('omits empty categories when no rows match the bucket', () => {
    setSources({
      assistants: [
        { id: 'a', name: 'Solo Assistant', presetAgentType: 'gemini', category: 'builtin' as const },
      ],
      recents: [],
      prompts: [],
    });
    render(<CommandPalette {...baseProps()} />);

    expect(screen.getByText('common.cmdk.groups.builtins')).toBeInTheDocument();
    expect(screen.queryByText('common.cmdk.groups.recents')).not.toBeInTheDocument();
    expect(screen.queryByText('common.cmdk.groups.prompts')).not.toBeInTheDocument();
    expect(screen.queryByText('common.cmdk.groups.specialists')).not.toBeInTheDocument();
    expect(screen.queryByText('common.cmdk.groups.teams')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation: Enter on the focused row activates it', () => {
    setSources();
    const props = baseProps();
    render(<CommandPalette {...props} />);

    const input = screen.getByPlaceholderText('common.cmdk.placeholder') as HTMLInputElement;
    // Narrow the result set to one deterministic row so Enter fires that
    // row's onSelect without depending on cmdk's initial-selection order.
    fireEvent.change(input, { target: { value: 'Yesterday onboarding' } });

    fireEvent.keyDown(input, { key: 'Enter' });

    // One of the recent/best-match callbacks must have fired with conv-1.
    expect(props.onResumeChat).toHaveBeenCalledWith('conv-1');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('keeps colliding assistant and action ids type-safe and activates the exact route action', () => {
    setSources({
      assistants: [
        { id: 'shared-id', name: 'Shared assistant', presetAgentType: 'wcore', category: 'builtin' as const },
      ],
      recents: [],
      prompts: [],
      actions: [routeAction({ id: 'shared-id', label: 'Shared management action' })],
    });
    const props = baseProps();
    render(<CommandPalette {...props} />);

    const actionsHeading = screen.getByText('common.cmdk.groups.actions');
    const groupRoot = actionsHeading.closest('[cmdk-group=""]') as HTMLElement;
    fireEvent.click(within(groupRoot).getByText('Shared management action'));

    expect(mockNavigate).toHaveBeenCalledWith('/mission-control', undefined);
    expect(props.onLaunchPreset).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves unavailable capabilities visible but fail-closed and non-activating', () => {
    setSources({
      assistants: [],
      recents: [],
      prompts: [],
      actions: [
        routeAction({
          availability: 'unavailable',
          unavailableReason: 'Runtime registration is missing',
        }),
      ],
    });
    const props = baseProps();
    render(<CommandPalette {...props} />);

    const actionsHeading = screen.getByText('common.cmdk.groups.actions');
    const groupRoot = actionsHeading.closest('[cmdk-group=""]') as HTMLElement;
    const row = within(groupRoot).getByText('Activity').closest('[cmdk-item=""]') as HTMLElement;
    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(within(groupRoot).getByText('Unavailable · Runtime registration is missing')).toBeInTheDocument();
    fireEvent.click(row);

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('surfaces degraded capability status while preserving its exact diagnostic route', () => {
    setSources({
      assistants: [],
      recents: [],
      prompts: [],
      actions: [
        routeAction({
          availability: 'degraded',
          unavailableReason: 'One activity source is offline',
        }),
      ],
    });
    const props = baseProps();
    render(<CommandPalette {...props} />);

    const actionsHeading = screen.getByText('common.cmdk.groups.actions');
    const groupRoot = actionsHeading.closest('[cmdk-group=""]') as HTMLElement;
    expect(within(groupRoot).getByText('Degraded · One activity source is offline')).toBeInTheDocument();
    fireEvent.click(within(groupRoot).getByText('Activity'));

    expect(mockNavigate).toHaveBeenCalledWith('/mission-control', undefined);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('keyboard-activates the exact nested management destination', () => {
    setSources({
      assistants: [],
      recents: [],
      prompts: [],
      actions: [
        routeAction({
          id: 'teams.create',
          label: 'Build a team',
          description: 'Create a durable Desktop team',
          capability: 'teams',
          intent: 'create',
          target: { kind: 'route', path: '/teams/new' },
        }),
      ],
    });
    const props = baseProps();
    render(<CommandPalette {...props} />);
    const input = screen.getByPlaceholderText('common.cmdk.placeholder') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Build a team' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/teams/new', undefined);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe('buildCapabilityActionIndex', () => {
  it('covers every required M7 capability with unique ids and exact deep links', async () => {
    const actual = await vi.importActual<
      typeof import('@/renderer/components/cmdk/useCommandPaletteSources')
    >('@/renderer/components/cmdk/useCommandPaletteSources');
    const actions = actual.buildCapabilityActionIndex();

    expect(new Set(actions.map((action) => action.id))).toHaveProperty('size', actions.length);
    expect(actions.map((action) => action.capability)).toEqual(
      expect.arrayContaining([
        'chat',
        'projects',
        'assistants',
        'workflows',
        'teams',
        'skills',
        'connections',
        'automations',
        'activity',
        'memory',
        'wiki',
      ])
    );
    expect(actions.find((action) => action.id === 'teams.create')?.target).toEqual({
      kind: 'route',
      path: '/teams/new',
    });
    expect(actions.find((action) => action.id === 'connections.connected')?.target).toEqual({
      kind: 'route',
      path: '/settings/mcp-library/connected',
    });
  });

  it('creates immutable copies and overlays availability without mutating the canonical index', async () => {
    const actual = await vi.importActual<
      typeof import('@/renderer/components/cmdk/useCommandPaletteSources')
    >('@/renderer/components/cmdk/useCommandPaletteSources');
    const degraded = actual.buildCapabilityActionIndex({
      'connections.manage': { availability: 'degraded', reason: 'Registration receipt is stale' },
    });
    degraded[0].keywords.push('mutated-test-value');
    const clean = actual.buildCapabilityActionIndex();

    expect(degraded.find((action) => action.id === 'connections.manage')).toEqual(
      expect.objectContaining({ availability: 'degraded', unavailableReason: 'Registration receipt is stale' })
    );
    expect(clean[0].keywords).not.toContain('mutated-test-value');
    expect(clean.find((action) => action.id === 'connections.manage')?.availability).toBe('available');
  });
});
