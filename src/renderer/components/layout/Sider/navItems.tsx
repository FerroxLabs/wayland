/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Config-driven registry for the sider top-zone nav entries (#118).
 *
 * The nine entries used to be hand-composed as JSX in `Sider/index.tsx`. This
 * registry owns their ORDER (Mission Control first) and exposes the metadata the
 * Settings > Navigation pane needs to toggle each one's visibility. Each entry's
 * bespoke `isActive` logic and per-entry props stay encapsulated in its `render`
 * closure, so the live components (and their collapsed icon-rail behaviour) are
 * unchanged — only their composition is now data-driven.
 */

import React from 'react';
import { Brain, Clock, FolderKanban, Gauge, LayoutGrid, MessagesSquare, Search, Users, Workflow } from 'lucide-react';

import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';
import {
  SiderAssistantsEntry,
  SiderMemoryEntry,
  SiderMissionControlEntry,
  SiderProjectsEntry,
  SiderScheduledEntry,
  SiderSearchEntry,
  SiderSessionsEntry,
  SiderTeamsEntry,
  SiderWorkflowsEntry,
} from './SiderNav';

/** Shared context threaded into every nav entry's `render`. */
export type SiderNavContext = {
  pathname: string;
  isMobile: boolean;
  collapsed: boolean;
  siderTooltipProps: SiderTooltipProps;
  /** Navigate to a top-zone destination (cleans tooltips, closes preview, etc.). */
  onTopZoneNav: (target: string) => void;
  /** Assistants has a bespoke handler (navigates to `/assistants`). */
  onAssistantsClick: () => void;
  /** Search popover: called when a conversation is picked from search. */
  onConversationSelect: () => void;
  /** Optional: fired after any entry activation (mobile drawer close). */
  onSessionClick?: () => void;
};

export type SiderNavItem = {
  /** Stable id — persisted in the hidden-set and used as the React key. */
  id: string;
  /** i18n key for the Settings > Navigation list label. */
  labelKey: string;
  /** Fallback label when the i18n key is missing. */
  defaultLabel: string;
  /** Icon shown beside the label in the Settings > Navigation list. */
  icon: React.ReactNode;
  /** Render the live sider entry for the given context. */
  render: (ctx: SiderNavContext) => React.ReactNode;
};

/**
 * The nav entries in display order. Mission Control is first (#118). Adding an
 * entry here automatically surfaces it in the sider AND in the Settings >
 * Navigation visibility list; it defaults to visible (absent from the
 * hidden-set).
 */
export const SIDER_NAV_ITEMS: SiderNavItem[] = [
  {
    id: 'mission-control',
    labelKey: 'missionControl.sidebarLabel',
    defaultLabel: 'Mission Control',
    icon: <Gauge size={16} />,
    render: (ctx) => (
      <SiderMissionControlEntry
        key='mission-control'
        isMobile={ctx.isMobile}
        isActive={ctx.pathname.startsWith('/mission-control')}
        collapsed={ctx.collapsed}
        siderTooltipProps={ctx.siderTooltipProps}
        onClick={() => ctx.onTopZoneNav('/mission-control')}
      />
    ),
  },
  {
    id: 'sessions',
    labelKey: 'conversations.siderEntry',
    defaultLabel: 'Conversations',
    icon: <MessagesSquare size={16} />,
    render: (ctx) => (
      <SiderSessionsEntry
        key='sessions'
        isMobile={ctx.isMobile}
        isActive={ctx.pathname.startsWith('/conversations')}
        collapsed={ctx.collapsed}
        siderTooltipProps={ctx.siderTooltipProps}
        onClick={() => ctx.onTopZoneNav('/conversations')}
      />
    ),
  },
  {
    id: 'search',
    labelKey: 'conversation.historySearch.shortTitle',
    defaultLabel: 'Search',
    icon: <Search size={16} />,
    render: (ctx) => (
      <SiderSearchEntry
        key='search'
        isMobile={ctx.isMobile}
        collapsed={ctx.collapsed}
        siderTooltipProps={ctx.siderTooltipProps}
        onConversationSelect={ctx.onConversationSelect}
        onSessionClick={ctx.onSessionClick}
      />
    ),
  },
  {
    id: 'projects',
    labelKey: 'projects.siderEntry',
    defaultLabel: 'Projects',
    icon: <FolderKanban size={16} />,
    render: (ctx) => (
      <SiderProjectsEntry
        key='projects'
        isMobile={ctx.isMobile}
        isActive={ctx.pathname.startsWith('/project')}
        collapsed={ctx.collapsed}
        siderTooltipProps={ctx.siderTooltipProps}
        onClick={() => ctx.onTopZoneNav('/projects')}
      />
    ),
  },
  {
    id: 'assistants',
    labelKey: 'assistants.siderEntry',
    defaultLabel: 'Assistants',
    icon: <LayoutGrid size={16} />,
    render: (ctx) => (
      <SiderAssistantsEntry
        key='assistants'
        isMobile={ctx.isMobile}
        isActive={ctx.pathname === '/assistants'}
        collapsed={ctx.collapsed}
        siderTooltipProps={ctx.siderTooltipProps}
        onClick={ctx.onAssistantsClick}
      />
    ),
  },
  {
    id: 'workflows',
    labelKey: 'workflows.siderEntry',
    defaultLabel: 'Workflows',
    icon: <Workflow size={16} />,
    render: (ctx) => (
      <SiderWorkflowsEntry
        key='workflows'
        isMobile={ctx.isMobile}
        isActive={ctx.pathname.startsWith('/workflows')}
        collapsed={ctx.collapsed}
        siderTooltipProps={ctx.siderTooltipProps}
        onClick={() => ctx.onTopZoneNav('/workflows')}
      />
    ),
  },
  {
    id: 'scheduled',
    labelKey: 'cron.scheduledTasks',
    defaultLabel: 'Scheduled Tasks',
    icon: <Clock size={16} />,
    render: (ctx) => (
      <SiderScheduledEntry
        key='scheduled'
        isMobile={ctx.isMobile}
        isActive={ctx.pathname.startsWith('/scheduled')}
        collapsed={ctx.collapsed}
        siderTooltipProps={ctx.siderTooltipProps}
        onClick={() => ctx.onTopZoneNav('/scheduled')}
      />
    ),
  },
  {
    id: 'teams',
    labelKey: 'teams.siderEntry',
    defaultLabel: 'Teams',
    icon: <Users size={16} />,
    render: (ctx) => (
      <SiderTeamsEntry
        key='teams'
        isMobile={ctx.isMobile}
        isActive={ctx.pathname.startsWith('/teams')}
        collapsed={ctx.collapsed}
        siderTooltipProps={ctx.siderTooltipProps}
        onClick={() => ctx.onTopZoneNav('/teams')}
      />
    ),
  },
  {
    id: 'memory',
    labelKey: 'sider.memory',
    defaultLabel: 'Memory',
    icon: <Brain size={16} />,
    render: (ctx) => (
      <SiderMemoryEntry
        key='memory'
        isMobile={ctx.isMobile}
        isActive={ctx.pathname.startsWith('/memory') || ctx.pathname.startsWith('/wiki')}
        collapsed={ctx.collapsed}
        siderTooltipProps={ctx.siderTooltipProps}
      />
    ),
  },
];
