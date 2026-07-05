/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowTabbedSider - Build #116. The single right-sider content for a
 * workflow conversation: one Arco Tabs strip with "Steps" and "Workspace",
 * replacing the old double rail (a fixed 280px StepRail beside ChatLayout's
 * collapsible workspace sider).
 *
 * - "Steps" hosts {@link WorkflowRailSlotHost}; WorkflowSurface portals its live
 *   step rail into it (see WorkflowRailSlot).
 * - "Workspace" renders the conversation's normal workspace panel. When the
 *   conversation has no workspace, the Workspace tab is omitted and only Steps
 *   shows.
 *
 * Collapse + resize are ChatLayout's (this is just its `sider` content), so the
 * whole panel is one collapse target and one resize handle.
 */

import { Tabs } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { WORKSPACE_HAS_FILES_EVENT, type WorkspaceHasFilesDetail } from '@/renderer/utils/workspace/workspaceEvents';

import { WorkflowRailSlotHost } from './WorkflowRailSlot';
import styles from './WorkflowTabbedSider.module.css';

export type WorkflowTabbedSiderProps = {
  /** The conversation's workspace panel; omit/null when the chat has no workspace. */
  workspace?: React.ReactNode;
};

export const WorkflowTabbedSider: React.FC<WorkflowTabbedSiderProps> = ({ workspace }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('steps');
  const hasWorkspace = workspace != null;

  // Build #593 fix. When the workflow writes/edits files, surface the Workspace
  // tab so the new files are actually visible. The sider auto-expands elsewhere
  // (useWorkspaceCollapse) but the active tab would otherwise stay on Steps.
  useEffect(() => {
    if (typeof window === 'undefined' || !hasWorkspace) {
      return undefined;
    }
    const handleHasFiles = (event: Event) => {
      const detail = (event as CustomEvent<WorkspaceHasFilesDetail>).detail;
      if (detail?.hasFiles) {
        setActiveTab('workspace');
      }
    };
    window.addEventListener(WORKSPACE_HAS_FILES_EVENT, handleHasFiles);
    return () => {
      window.removeEventListener(WORKSPACE_HAS_FILES_EVENT, handleHasFiles);
    };
  }, [hasWorkspace]);

  return (
    <Tabs className={styles.tabs} activeTab={activeTab} onChange={setActiveTab} size='small' lazyload={false}>
      <Tabs.TabPane key='steps' title={t('workflow.sider.stepsTab', { defaultValue: 'Steps' })}>
        <div className={styles.pane}>
          <WorkflowRailSlotHost />
        </div>
      </Tabs.TabPane>
      {hasWorkspace && (
        <Tabs.TabPane key='workspace' title={t('workflow.sider.workspaceTab', { defaultValue: 'Workspace' })}>
          <div className={styles.pane}>{workspace}</div>
        </Tabs.TabPane>
      )}
    </Tabs>
  );
};

export default WorkflowTabbedSider;
