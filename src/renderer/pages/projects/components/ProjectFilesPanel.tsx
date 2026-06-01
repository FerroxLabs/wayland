/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message } from '@arco-design/web-react';
import React from 'react';
import ChatWorkspace from '@/renderer/pages/conversation/Workspace';
import { PreviewPanel, PreviewProvider, usePreviewContext } from '@/renderer/pages/conversation/Preview';

/**
 * Project Files = the same file tree the chat workspace uses, PLUS the same
 * file viewer/editor/preview. Clicking a file in the tree calls openPreview()
 * (via PreviewContext, exactly as in a conversation); we host the provider here
 * and render the PreviewPanel beside the tree so the project Files tab gets the
 * full read/edit/preview experience instead of a dead tree.
 */
const FilesInner: React.FC<{ workspace: string; projectId: string }> = ({ workspace, projectId }) => {
  const { isOpen } = usePreviewContext();
  return (
    <div className='flex h-full w-full overflow-hidden'>
      <div
        className={isOpen ? 'w-340px flex-shrink-0 h-full overflow-hidden' : 'flex-1 h-full overflow-hidden'}
        style={isOpen ? { borderRight: '1px solid var(--color-border-2)' } : undefined}
      >
        <ChatWorkspace workspace={workspace} conversation_id={`project:${projectId}`} messageApi={Message} />
      </div>
      {isOpen && (
        <div className='flex-1 min-w-0 h-full overflow-hidden'>
          <PreviewPanel />
        </div>
      )}
    </div>
  );
};

const ProjectFilesPanel: React.FC<{ workspace: string; projectId: string }> = ({ workspace, projectId }) => (
  <PreviewProvider>
    <FilesInner workspace={workspace} projectId={projectId} />
  </PreviewProvider>
);

export default ProjectFilesPanel;
