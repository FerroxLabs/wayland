/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from '@arco-design/web-react';
import type { FileMetadata } from '@renderer/services/FileService';
import { isSupportedFile, FileService } from '@renderer/services/FileService';

export interface UseDragUploadOptions {
  supportedExts?: string[];
  onFilesAdded?: (files: FileMetadata[]) => void;
  /** Conversation ID for WebUI file uploads */
  conversationId?: string;
}

export const useDragUpload = ({ supportedExts = [], onFilesAdded, conversationId }: UseDragUploadOptions) => {
  const { t } = useTranslation();
  const [isFileDragging, setIsFileDragging] = useState(false);

  // Drag counter, prevents state flicker
  const dragCounter = useRef(0);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isFileDragging) {
        setIsFileDragging(true);
        dragCounter.current += 1;
      }
    },
    [isFileDragging]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current += 1;
    setIsFileDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current -= 1;

    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsFileDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Reset state
      dragCounter.current = 0;
      setIsFileDragging(false);

      if (!onFilesAdded) return;

      try {
        const droppedFiles = e.nativeEvent.dataTransfer!.files;

        // Step 1: validate file types and filter out unsupported files
        const validFiles: File[] = [];

        for (let i = 0; i < droppedFiles.length; i++) {
          const file = droppedFiles[i];
          if (supportedExts.length === 0 || isSupportedFile(file.name, supportedExts)) {
            validFiles.push(file);
          }
          // Note: unsupported files are silently filtered, matching original behavior
        }

        // Step 2: only process files that passed validation
        if (validFiles.length > 0) {
          // Build a FileList-shaped object for processDroppedFiles
          const validFileList = Object.assign(validFiles, {
            length: validFiles.length,
            item: (index: number) => validFiles[index] || null,
          }) as unknown as FileList;
          const processedFiles = await FileService.processDroppedFiles(validFileList, conversationId);

          if (processedFiles.length > 0) {
            onFilesAdded(processedFiles);
          }
        }
      } catch (err) {
        console.error('Failed to process dropped files:', err);
        Message.error(t('conversation.workspace.dragFailed', 'Failed to process dropped files'));
      }
    },
    [conversationId, onFilesAdded, supportedExts, t]
  );

  const dragHandlers = {
    onDragOver: handleDragOver,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  return {
    isFileDragging,
    dragHandlers,
  };
};
