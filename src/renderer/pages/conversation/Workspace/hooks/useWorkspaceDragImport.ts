/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import type { TFunction } from 'i18next';
import { ipcBridge } from '@/common';
import { FileService } from '@/renderer/services/FileService';
import type { MessageApi } from '../types';

interface UseWorkspaceDragImportOptions {
  onFilesDropped: (files: Array<{ path: string; name: string }>) => Promise<void> | void;
  messageApi: MessageApi;
  t: TFunction<'translation'>;
  /** Conversation ID for WebUI HTTP uploads */
  conversationId: string;
}

interface DroppedItem {
  path: string;
  name: string;
  kind: 'file' | 'directory';
}

const getBaseName = (targetPath: string): string => {
  const parts = targetPath.replace(/[\\/]+$/, '').split(/[\\/]/);
  return parts.pop() || targetPath;
};

const dedupeItems = (items: DroppedItem[]): DroppedItem[] => {
  const map = new Map<string, DroppedItem>();
  for (const item of items) {
    if (!map.has(item.path)) {
      map.set(item.path, item);
    }
  }
  return Array.from(map.values());
};

export function useWorkspaceDragImport({
  onFilesDropped,
  messageApi,
  t,
  conversationId,
}: UseWorkspaceDragImportOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const resetDragState = useCallback(() => {
    dragCounterRef.current = 0;
    setIsDragging(false);
  }, []);

  const handleDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isDragging) {
        setIsDragging(true);
      }
    },
    [isDragging]
  );

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const createTempItemsFromFiles = useCallback(
    async (files: File[]): Promise<DroppedItem[]> => {
      if (!files.length) return [];
      const pseudoList = Object.assign([...files], {
        length: files.length,
        item: (index: number) => files[index] || null,
      }) as unknown as FileList;

      const processed = await FileService.processDroppedFiles(pseudoList, conversationId, 'workspace');
      return processed.map((meta) => ({ path: meta.path, name: meta.name, kind: 'file' as const }));
    },
    [conversationId]
  );

  /**
   * Resolve dropped items, detect whether they are files or directories
   */
  const resolveDroppedItems = useCallback(async (items: DroppedItem[]): Promise<DroppedItem[]> => {
    const unique = new Map<string, DroppedItem>();

    for (const item of items) {
      try {
        const metadata = await ipcBridge.fs.getFileMetadata.invoke({ path: item.path });
        const itemName = metadata.name || item.name || getBaseName(item.path);
        const kind = metadata.isDirectory ? 'directory' : 'file';
        unique.set(item.path, { path: item.path, name: itemName, kind });
      } catch (error) {
        console.warn('[WorkspaceDragImport] Failed to inspect dropped path:', item.path, error);
        const fallbackName = item.name || getBaseName(item.path);
        unique.set(item.path, { path: item.path, name: fallbackName, kind: 'file' });
      }
    }

    return Array.from(unique.values());
  }, []);

  const handleDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      resetDragState();

      const dataTransfer = event.dataTransfer || event.nativeEvent?.dataTransfer;
      const itemsWithPath: DroppedItem[] = [];
      const filesWithoutPath: File[] = [];

      if (dataTransfer?.files && dataTransfer.files.length > 0) {
        for (let i = 0; i < dataTransfer.files.length; i++) {
          const file = dataTransfer.files[i];

          // Use Electron webUtils.getPathForFile API to get absolute path for file/directory
          let filePath: string | undefined;
          if (window.electronAPI?.getPathForFile) {
            try {
              filePath = window.electronAPI.getPathForFile(file);
            } catch (err) {
              console.warn('[WorkspaceDragImport] getPathForFile failed:', err);
            }
          }

          // Fallback to File.path property (older Electron or non-Electron)
          if (!filePath) {
            const electronFile = file as File & { path?: string };
            filePath = electronFile.path;
          }

          if (filePath) {
            const name = file.name || getBaseName(filePath);
            itemsWithPath.push({ path: filePath, name, kind: 'file' });
          } else {
            // No path property, might be from browser or non-Electron
            // Check if it's a directory (via webkitGetAsEntry)
            const item = dataTransfer.items?.[i];
            const entry = item?.webkitGetAsEntry?.();
            if (entry?.isDirectory) {
              // Directory without path, cannot process
              console.warn('[WorkspaceDragImport] Directory without path property, cannot process:', entry.name);
            } else {
              // Plain file, need to create temp file
              filesWithoutPath.push(file);
            }
          }
        }
      }

      let tempItems: DroppedItem[] = [];
      if (filesWithoutPath.length > 0) {
        try {
          tempItems = await createTempItemsFromFiles(filesWithoutPath);
        } catch (error) {
          console.error('[WorkspaceDragImport] Failed to create temp files:', error);
        }
      }

      const dedupedWithPath = dedupeItems(itemsWithPath);
      const targets = dedupedWithPath.length > 0 ? await resolveDroppedItems(dedupedWithPath) : tempItems;

      if (targets.length === 0) {
        messageApi.warning(
          t('conversation.workspace.dragNoFiles', {
            defaultValue: 'No valid files detected. Please drag from Finder/Explorer.',
          })
        );
        return;
      }

      try {
        await onFilesDropped(targets.map(({ path, name }) => ({ path, name })));
      } catch (error) {
        console.error('Failed to import dropped files:', error);
        messageApi.error(
          t('conversation.workspace.dragFailed', {
            defaultValue: 'Failed to import dropped files.',
          })
        );
      }
    },
    [conversationId, createTempItemsFromFiles, messageApi, onFilesDropped, resetDragState, resolveDroppedItems, t]
  );

  const dragHandlers = {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  return {
    isDragging,
    dragHandlers,
  };
}
