/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Test for #882: conversation tabs render only the title. A tab opened from a
 * project must also show a muted secondary project label - resolved from the
 * tab's projectId via useProjects() - that survives title truncation (the label
 * is shrink-0 while the title flexes and ellipsizes). A tab without a project
 * shows just the name (never "undefined").
 */

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      create: { invoke: vi.fn() },
      popout: { invoke: vi.fn(() => Promise.resolve()) },
      dockBack: { invoke: vi.fn(() => Promise.resolve()) },
      popoutClosed: { on: vi.fn(() => () => void 0) },
    },
  },
}));

vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => false,
}));

vi.mock('../../../src/renderer/pages/conversation/hooks/useConversationAgents', () => ({
  useConversationAgents: () => ({ cliAgents: [], presetAssistants: [], isLoading: false }),
}));

vi.mock('@/renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => ({ isMobile: false }),
}));

vi.mock('@/renderer/pages/guid/constants', () => ({
  CUSTOM_AVATAR_IMAGE_MAP: {},
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

vi.mock('@/renderer/pages/projects/hooks/useProjects', () => ({
  useProjects: () => ({ projects: [{ id: 'proj-1', name: 'Continuity' }] }),
}));

import { STORAGE_KEYS } from '../../../src/common/config/storageKeys';
import ConversationTabs from '../../../src/renderer/pages/conversation/components/ConversationTabs';
import {
  ConversationTabsProvider,
  useConversationTabs,
} from '../../../src/renderer/pages/conversation/hooks/ConversationTabsContext';

type SeedTab = {
  id: string;
  name: string;
  workspace: string;
  type: 'gemini';
  projectId?: string;
};

const seedTabs = (tabs: SeedTab[], activeTabId: string) => {
  localStorage.setItem(STORAGE_KEYS.CONVERSATION_TABS, JSON.stringify({ openTabs: tabs, activeTabId }));
};

const renderTabs = (activeId: string) =>
  render(
    <ConversationTabsProvider>
      <MemoryRouter initialEntries={[`/conversation/${activeId}`]}>
        <ConversationTabs />
        <Routes>
          <Route path='/conversation/:id' element={<div />} />
        </Routes>
      </MemoryRouter>
    </ConversationTabsProvider>
  );

const tabOf = (name: string) => screen.getByText(name).closest('.group\\/tab') as HTMLElement;

describe('ConversationTabs project label (#882)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows the resolved project name as a secondary label on a project tab', () => {
    seedTabs([{ id: 'c1', name: 'Read continuity files', workspace: '/w', type: 'gemini', projectId: 'proj-1' }], 'c1');
    renderTabs('c1');

    const tab = tabOf('Read continuity files');
    const label = within(tab).getByTestId('tab-project-label');
    expect(label).toHaveTextContent('Continuity');
  });

  it('keeps the project label rendered (shrink-0) when the title is long', () => {
    const longTitle = 'Read all the continuity files and reconcile them across every open workstream today';
    seedTabs([{ id: 'c2', name: longTitle, workspace: '/w', type: 'gemini', projectId: 'proj-1' }], 'c2');
    renderTabs('c2');

    const tab = tabOf(longTitle);
    const label = within(tab).getByTestId('tab-project-label');
    expect(label).toBeInTheDocument();
    expect(label.className).toContain('shrink-0');

    // The title flexes and ellipsizes so the shrink-0 project label stays visible.
    const title = within(tab).getByText(longTitle);
    expect(title.className).toContain('text-ellipsis');
    expect(title.className).toContain('min-w-0');
  });

  it('shows just the name (no project label) on a tab with no project', () => {
    seedTabs([{ id: 'c3', name: 'No project chat', workspace: '/w', type: 'gemini' }], 'c3');
    renderTabs('c3');

    const tab = tabOf('No project chat');
    expect(within(tab).queryByTestId('tab-project-label')).not.toBeInTheDocument();
    expect(tab).not.toHaveTextContent('undefined');
  });

  it('keeps the close control shrink-0 so it survives title truncation', () => {
    const longTitle = 'Reconcile every continuity file across all open workstreams before end of day';
    seedTabs([{ id: 'c6', name: longTitle, workspace: '/w', type: 'gemini', projectId: 'proj-1' }], 'c6');
    renderTabs('c6');

    const tab = tabOf(longTitle);
    // The X close control must not shrink away when the title is long.
    // (SVG className is an SVGAnimatedString, so read the class attribute.)
    const closeIcon = within(tab).getByTestId('icon-X');
    expect(closeIcon.getAttribute('class') ?? '').toContain('shrink-0');
  });

  it('backfills the project label for a restored tab when its conversation is (re)opened', async () => {
    // A tab restored from persistence before the projectId field existed has no
    // projectId; opening its conversation (conversation/index.tsx calls openTab)
    // must backfill it so the label appears (xaudit finding 5).
    seedTabs([{ id: 'c7', name: 'Restored chat', workspace: '/w', type: 'gemini' }], 'c7');

    const Reopener: React.FC = () => {
      const { openTab } = useConversationTabs();
      React.useEffect(() => {
        openTab({ id: 'c7', name: 'Restored chat', type: 'gemini', extra: { projectId: 'proj-1' } } as never);
      }, [openTab]);
      return null;
    };

    render(
      <ConversationTabsProvider>
        <MemoryRouter initialEntries={['/conversation/c7']}>
          <ConversationTabs />
          <Reopener />
          <Routes>
            <Route path='/conversation/:id' element={<div />} />
          </Routes>
        </MemoryRouter>
      </ConversationTabsProvider>
    );

    const label = await screen.findByTestId('tab-project-label');
    expect(label).toHaveTextContent('Continuity');
  });
});
