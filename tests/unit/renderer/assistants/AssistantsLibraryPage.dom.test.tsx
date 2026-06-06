/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Integration test for the chat-redesign /assistants library page.
 *
 * Verifies the page wires the lifted AssistantEditDrawer + grouping +
 * URL-synced filters together end-to-end, without re-creating the
 * Settings page's state shape.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const mockEditor = vi.hoisted(() => ({
  editVisible: false,
  setEditVisible: vi.fn(),
  isCreating: false,
  editName: '',
  setEditName: vi.fn(),
  editDescription: '',
  setEditDescription: vi.fn(),
  editAvatar: '',
  setEditAvatar: vi.fn(),
  editAgent: 'gemini',
  setEditAgent: vi.fn(),
  editContext: '',
  setEditContext: vi.fn(),
  promptViewMode: 'preview' as 'preview' | 'edit',
  setPromptViewMode: vi.fn(),
  availableSkills: [],
  selectedSkills: [],
  setSelectedSkills: vi.fn(),
  pendingSkills: [],
  setPendingSkills: vi.fn(),
  customSkills: [],
  setCustomSkills: vi.fn(),
  deletePendingSkillName: null,
  setDeletePendingSkillName: vi.fn(),
  deleteCustomSkillName: null,
  setDeleteCustomSkillName: vi.fn(),
  skillsModalVisible: false,
  setSkillsModalVisible: vi.fn(),
  builtinAutoSkills: [],
  disabledBuiltinSkills: [],
  setDisabledBuiltinSkills: vi.fn(),
  deleteConfirmVisible: false,
  setDeleteConfirmVisible: vi.fn(),
  handleSave: vi.fn(),
  handleDeleteClick: vi.fn(),
  handleDeleteConfirm: vi.fn(),
  handleEdit: vi.fn().mockResolvedValue(undefined),
  handleCreate: vi.fn().mockResolvedValue(undefined),
  handleDuplicate: vi.fn(),
  handleToggleEnabled: vi.fn(),
}));

// T2a.6 - Team launchers (kind === 'team') moved to /teams via W2a.
// Fixture now includes a team launcher to assert it gets FILTERED OUT
// on /assistants (regression guard), plus the original specialist +
// builtin entries that must still render.
const mockAssistants = vi.hoisted(() => [
  {
    id: 'builtin-word-creator',
    name: 'Word Creator',
    nameI18n: { 'en-US': 'Word Creator' },
    descriptionI18n: { 'en-US': 'Build Word docs' },
    isBuiltin: true,
    isPreset: true,
    presetAgentType: 'gemini',
  },
  {
    id: 'ext-fire-sales',
    name: 'Fire Sales',
    nameI18n: { 'en-US': 'Fire Sales' },
    descriptionI18n: { 'en-US': 'Sells things' },
    isBuiltin: false,
    isPreset: true,
    presetAgentType: 'gemini',
    _source: 'extension',
    _kind: 'specialist',
  },
  {
    id: 'ext-doc-helper',
    name: 'Doc Helper',
    nameI18n: { 'en-US': 'Doc Helper' },
    descriptionI18n: { 'en-US': 'Helps with docs' },
    isBuiltin: false,
    isPreset: true,
    presetAgentType: 'claude',
    _source: 'extension',
    _kind: 'specialist',
  },
  {
    id: 'ext-cold-outbound',
    name: 'Cold Outbound',
    nameI18n: { 'en-US': 'Cold Outbound' },
    descriptionI18n: { 'en-US': 'Team launcher - must NOT render on /assistants' },
    isBuiltin: false,
    isPreset: true,
    presetAgentType: 'gemini',
    _source: 'extension',
    _kind: 'team',
  },
]);

const setSelectedAgentMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string; count?: number; backend?: string; name?: string }) => {
      const fallback = opts?.defaultValue ?? _key;
      if (opts?.count !== undefined) return fallback.replace('{{count}}', String(opts.count));
      if (opts?.backend) return fallback.replace('{{backend}}', opts.backend);
      if (opts?.name) return fallback.replace('{{name}}', opts.name);
      return fallback;
    },
  }),
}));

vi.mock('@/renderer/utils/platform', () => ({
  resolveExtensionAssetUrl: (v: string) => v,
}));

vi.mock('@/renderer/hooks/assistant', () => ({
  useAssistantList: () => ({
    assistants: mockAssistants,
    activeAssistantId: null,
    setActiveAssistantId: vi.fn(),
    activeAssistant: null,
    isExtensionAssistant: (a: { _source?: string }) => a?._source === 'extension',
    loadAssistants: vi.fn().mockResolvedValue(undefined),
    localeKey: 'en-US',
  }),
  useDetectedAgents: () => ({
    availableBackends: [{ id: 'gemini', name: 'Gemini' }],
    refreshAgentDetection: vi.fn().mockResolvedValue(undefined),
  }),
  useAssistantEditor: () => mockEditor,
  useAssistantSkills: () => ({
    externalSources: [],
    activeSourceTab: '',
    setActiveSourceTab: vi.fn(),
    activeSource: null,
    filteredExternalSkills: [],
    externalSkillsLoading: false,
    searchExternalQuery: '',
    setSearchExternalQuery: vi.fn(),
    refreshing: false,
    handleRefreshExternal: vi.fn(),
    showAddPathModal: false,
    setShowAddPathModal: vi.fn(),
    customPathName: '',
    setCustomPathName: vi.fn(),
    customPathValue: '',
    setCustomPathValue: vi.fn(),
    handleAddCustomPath: vi.fn(),
    handleAddFoundSkills: vi.fn(),
  }),
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn().mockResolvedValue(null),
    set: setSelectedAgentMock,
  },
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    extensions: {
      getAssistants: {
        invoke: vi
          .fn()
          .mockResolvedValue([
            { id: 'ext-fire-sales', category: 'sell' },
            { id: 'ext-doc-helper', category: 'write' },
          ]),
      },
    },
  },
}));

// Drawer & modals - substitute minimal stubs to avoid pulling in their full
// dependency graph. The page wiring contract is "renders <AssistantEditDrawer>
// with editor + list + availableBackends + editAvatarImage props" - we
// assert that contract through the editor handlers being callable.
vi.mock('@/renderer/pages/settings/AssistantSettings/AssistantEditDrawer', () => ({
  default: ({ editor }: { editor: { editVisible: boolean } }) => (
    <div data-testid='mock-edit-drawer' data-visible={String(editor.editVisible)} />
  ),
}));
vi.mock('@/renderer/pages/settings/AssistantSettings/DeleteAssistantModal', () => ({
  default: () => null,
}));
vi.mock('@/renderer/pages/settings/AssistantSettings/AddSkillsModal', () => ({
  default: () => null,
}));
vi.mock('@/renderer/pages/settings/AssistantSettings/SkillConfirmModals', () => ({
  default: () => null,
}));
vi.mock('@/renderer/pages/settings/AssistantSettings/AddCustomPathModal', () => ({
  default: () => null,
}));
vi.mock('@/renderer/pages/settings/AssistantSettings/assistantUtils', () => ({
  resolveAvatarImageSrc: () => undefined,
}));

import AssistantsLibraryPage from '../../../../src/renderer/pages/assistants/AssistantsLibraryPage';

const renderPage = (initialRoute = '/assistants') =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AssistantsLibraryPage />
    </MemoryRouter>
  );

describe('AssistantsLibraryPage', () => {
  it('renders Specialists + Built-ins groups (Teams group removed by W2a)', async () => {
    renderPage();

    await waitFor(() => {
      // Built-ins group always renders (BuildMyOwn lives at its tail).
      expect(screen.getByTestId('assistants-group-builtins')).toBeTruthy();
    });
    // Specialists group renders when at least one specialist is present.
    expect(screen.getByTestId('assistants-group-specialists')).toBeTruthy();
    // Teams group is gone - team launchers now live on /teams.
    expect(screen.queryByTestId('assistants-group-teams')).toBeNull();
    // BuildMyOwnCard at end of Built-ins.
    expect(screen.getByTestId('assistant-card-build-my-own')).toBeTruthy();
    // Cards rendered for surviving (specialist + builtin) assistants.
    expect(screen.getByTestId('assistant-card-builtin-word-creator')).toBeTruthy();
    expect(screen.getByTestId('assistant-card-ext-fire-sales')).toBeTruthy();
    expect(screen.getByTestId('assistant-card-ext-doc-helper')).toBeTruthy();
  });

  it('REGRESSION (T2a.4): renders 0 entries with _kind === "team"', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('assistants-library-page'));
    // Team launchers MUST NOT render on /assistants - they moved to /teams.
    expect(screen.queryByTestId('assistant-card-ext-cold-outbound')).toBeNull();
    const teamTypedCards = document.querySelectorAll('[data-card-type="team"]');
    expect(teamTypedCards.length).toBe(0);
  });

  it('clicking a card persists the selected agent key and would route to /guid', async () => {
    setSelectedAgentMock.mockClear();
    renderPage();

    await waitFor(() => screen.getByTestId('assistant-card-builtin-word-creator'));
    fireEvent.click(screen.getByTestId('assistant-card-builtin-word-creator'));

    await waitFor(() => {
      expect(setSelectedAgentMock).toHaveBeenCalledWith('guid.lastSelectedAgent', 'custom:builtin-word-creator');
    });
  });

  it('clicking BuildMyOwnCard opens the drawer in create mode', async () => {
    mockEditor.handleCreate.mockClear();
    renderPage();

    await waitFor(() => screen.getByTestId('assistant-card-build-my-own'));
    fireEvent.click(screen.getByTestId('assistant-card-build-my-own'));

    await waitFor(() => {
      expect(mockEditor.handleCreate).toHaveBeenCalledTimes(1);
    });
  });

  it('clicking the action-bar CTA also opens the drawer in create mode', async () => {
    mockEditor.handleCreate.mockClear();
    renderPage();

    await waitFor(() => screen.getByTestId('assistants-build-my-own-cta'));
    fireEvent.click(screen.getByTestId('assistants-build-my-own-cta'));

    await waitFor(() => {
      expect(mockEditor.handleCreate).toHaveBeenCalledTimes(1);
    });
  });

  it('FilterRail type filter routes through URL and excludes non-matching cards', async () => {
    renderPage('/assistants?type=builtin');

    await waitFor(() => screen.getByTestId('assistants-group-builtins'));
    expect(screen.getByTestId('assistant-card-builtin-word-creator')).toBeTruthy();
    expect(screen.queryByTestId('assistant-card-ext-fire-sales')).toBeNull();
    expect(screen.queryByTestId('assistant-card-ext-doc-helper')).toBeNull();
  });

  it('FilterRail domain filter narrows by category via URL search param', async () => {
    renderPage('/assistants?domain=write');

    await waitFor(() => screen.getByTestId('assistants-group-specialists'));
    expect(screen.getByTestId('assistant-card-ext-doc-helper')).toBeTruthy();
    expect(screen.queryByTestId('assistant-card-ext-fire-sales')).toBeNull();
    expect(screen.queryByTestId('assistant-card-builtin-word-creator')).toBeNull();
  });
});
