/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CodexToolCallUpdate } from '@/common/chat/chatLib';
import FileChangesPanel, { type FileChangeItem } from '@/renderer/components/base/FileChangesPanel';
import { usePreviewLauncher } from '@/renderer/hooks/file/usePreviewLauncher';
import { extractContentFromDiff, parseDiff, type FileChangeInfo } from '@/renderer/utils/file/diffUtils';
import { getFileTypeInfo } from '@/renderer/utils/file/fileType';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { WriteFileResult } from '../types';

// Re-export for backwards compatibility
export { parseDiff, type FileChangeInfo } from '@/renderer/utils/file/diffUtils';

type TurnDiffContent = Extract<CodexToolCallUpdate, { subtype: 'turn_diff' }>;

// Support two data sources
export interface MessageFileChangesProps {
  /** Codex turn_diff messages */
  turnDiffChanges?: TurnDiffContent[];
  /** Gemini tool_group WriteFile results */
  writeFileChanges?: WriteFileResult[];
  /** Additional class name */
  className?: string;

  diffsChanges?: FileChangeInfo[];
}

/**
 * File changes message component
 *
 * Display all generated/modified files in the conversation, click to preview
 */
const MessageFileChanges: React.FC<MessageFileChangesProps> = ({
  turnDiffChanges = [],
  writeFileChanges = [],
  diffsChanges = [],
  className,
}) => {
  const { t } = useTranslation();
  const { launchPreview } = usePreviewLauncher();

  // Parse all file changes
  const fileChanges = useMemo(() => {
    const filesMap = new Map<string, FileChangeInfo>();

    // Process Codex turn_diff messages
    for (const change of turnDiffChanges) {
      const fileInfo = parseDiff(change.data.unified_diff);
      filesMap.set(fileInfo.fullPath, fileInfo);
    }

    // Process Gemini WriteFile results
    for (const change of writeFileChanges) {
      if (change.fileDiff) {
        const fileInfo = parseDiff(change.fileDiff, change.fileName);
        filesMap.set(fileInfo.fullPath, fileInfo);
      }
    }

    return Array.from(filesMap.values()).concat(diffsChanges);
  }, [turnDiffChanges, writeFileChanges, diffsChanges]);

  // Click preview button → open file preview
  const handleFileClick = useCallback(
    (file: FileChangeItem) => {
      const fileInfo = fileChanges.find((f) => f.fullPath === file.fullPath);
      if (!fileInfo) return;

      const { contentType, editable, language } = getFileTypeInfo(fileInfo.fileName);

      void launchPreview({
        relativePath: fileInfo.fullPath,
        fileName: fileInfo.fileName,
        contentType,
        editable,
        language,
        fallbackContent: editable ? extractContentFromDiff(fileInfo.diff) : undefined,
        diffContent: fileInfo.diff,
      });
    },
    [fileChanges, launchPreview]
  );

  // Click change stats → open diff comparison view
  const handleDiffClick = useCallback(
    (file: FileChangeItem) => {
      const fileInfo = fileChanges.find((f) => f.fullPath === file.fullPath);
      if (!fileInfo) return;

      void launchPreview({
        fileName: fileInfo.fileName,
        contentType: 'diff',
        editable: false,
        language: 'diff',
        diffContent: fileInfo.diff,
      });
    },
    [fileChanges, launchPreview]
  );

  // Don't render if no file changes
  if (fileChanges.length === 0) {
    return null;
  }

  return (
    <FileChangesPanel
      title={t('messages.fileChangesCount', { count: fileChanges.length })}
      files={fileChanges}
      onFileClick={handleFileClick}
      onDiffClick={handleDiffClick}
      className={className}
    />
  );
};

export default React.memo(MessageFileChanges);
