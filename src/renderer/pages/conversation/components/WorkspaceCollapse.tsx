/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Folder, FolderOpen } from 'lucide-react';
import classNames from 'classnames';
import React from 'react';

interface WorkspaceCollapseProps {
  /** Whether expanded */
  expanded: boolean;
  /** Callback for toggling expanded state */
  onToggle: () => void;
  /** Collapse panel header */
  header: React.ReactNode;
  /** Collapse panel content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Whether the sider is collapsed - hide group header and remove indent when collapsed */
  siderCollapsed?: boolean;
}

/**
 * Workspace collapse component - simple collapsible panel for workspace grouping
 */
const WorkspaceCollapse: React.FC<WorkspaceCollapseProps> = ({
  expanded,
  onToggle,
  header,
  children,
  className,
  siderCollapsed = false,
}) => {
  // When sider is collapsed, force content to expand and hide the header
  const showContent = siderCollapsed || expanded;

  return (
    <div className={classNames('workspace-collapse min-w-0', className)}>
      {/* Collapse header - hidden when sider is collapsed */}
      {!siderCollapsed && (
        <div
          className='flex items-center gap-8px h-40px px-10px cursor-pointer hover:bg-[rgba(var(--primary-6),0.14)] rd-8px transition-colors min-w-0'
          onClick={onToggle}
        >
          {/* Expand/collapse folder icon - 28px container aligns with other sider rows */}
          <span className='w-28px h-28px flex items-center justify-center shrink-0'>
            {expanded ? (
              <FolderOpen size={20} className='line-height-0' />
            ) : (
              <Folder size={20} className='line-height-0' />
            )}
          </span>

          {/* Header content */}
          <div className='flex-1 min-w-0 overflow-hidden'>{header}</div>
        </div>
      )}

      {/* Collapse content - children indented 20px so child icon centers align near parent text start, forming a clear hierarchy */}
      {showContent && (
        <div className={classNames('workspace-collapse-content min-w-0', { 'pl-20px': !siderCollapsed })}>
          {children}
        </div>
      )}
    </div>
  );
};

export default WorkspaceCollapse;
