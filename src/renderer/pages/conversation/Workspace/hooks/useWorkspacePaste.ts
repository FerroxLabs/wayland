/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IDirOrFile } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import { usePasteService } from '@/renderer/hooks/file/usePasteService';
import { uploadFileViaHttp } from '@/renderer/services/FileService';
import { trackUpload } from '@/renderer/hooks/file/useUploadState';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MessageApi, PasteConfirmState, SelectedNodeRef } from '../types';
import { getTargetFolderPath } from '../utils/treeHelpers';

interface UseWorkspacePasteOptions {
  conversationId: string;
  workspace: string;
  messageApi: MessageApi;
  t: (key: string, options?: Record<string, unknown>) => string;

  // Dependencies from useWorkspaceTree
  files: IDirOrFile[];
  selected: string[];
  selectedNodeRef: React.MutableRefObject<SelectedNodeRef | null>;
  refreshWorkspace: () => void;

  // Dependencies from useWorkspaceModals
  pasteConfirm: PasteConfirmState;
  setPasteConfirm: React.Dispatch<React.SetStateAction<PasteConfirmState>>;
  closePasteConfirm: () => void;
}

/**
 * useWorkspacePaste - Handle file paste and add logic
 */
export function useWorkspacePaste(options: UseWorkspacePasteOptions) {
  const {
    conversationId,
    workspace,
    messageApi,
    t,
    files,
    selected,
    selectedNodeRef,
    refreshWorkspace,
    pasteConfirm,
    setPasteConfirm,
    closePasteConfirm,
  } = options;

  // Track paste target folder (for visual feedback)
  const [pasteTargetFolder, setPasteTargetFolder] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const copyFilesIntoWorkspace = useCallback(
    async (selectedFiles: string[]) => {
      if (!selectedFiles.length) {
        return;
      }

      const result = await ipcBridge.fs.copyFilesToWorkspace.invoke({ filePaths: selectedFiles, workspace });
      const copiedFiles = result.data?.copiedFiles ?? [];
      const failedFiles = result.data?.failedFiles ?? [];

      if (copiedFiles.length > 0) {
        setTimeout(() => {
          refreshWorkspace();
        }, 300);
      }

      if (!result.success || failedFiles.length > 0) {
        const fallback = failedFiles.length > 0 ? 'Some files failed to copy' : result.msg;
        messageApi.warning(fallback || t('common.unknownError') || 'Copy failed');
      }
    },
    [workspace, refreshWorkspace, messageApi, t]
  );

  const handleSelectHostFiles = useCallback(() => {
    void ipcBridge.dialog.showOpen
      .invoke({
        properties: ['openFile', 'multiSelections'],
        defaultPath: workspace,
      })
      .then((selectedFiles) => {
        if (selectedFiles && selectedFiles.length > 0) {
          return copyFilesIntoWorkspace(selectedFiles);
        }
      })
      .catch(() => {
        // Silently ignore errors
      });
  }, [copyFilesIntoWorkspace, workspace]);

  const handleUploadDeviceFiles = useCallback(() => {
    if (isElectronDesktop()) {
      handleSelectHostFiles();
      return;
    }

    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.style.display = 'none';
      input.addEventListener('change', async () => {
        const fileList = input.files;
        if (!fileList || fileList.length === 0) return;
        let successCount = 0;
        try {
          for (let i = 0; i < fileList.length; i++) {
            const tracker = trackUpload(fileList[i].size, 'workspace');
            try {
              await uploadFileViaHttp(fileList[i], conversationId, tracker.onProgress);
              successCount++;
            } catch (error) {
              messageApi.error(t('common.unknownError') || 'Upload failed');
            } finally {
              tracker.finish();
            }
          }
          if (successCount > 0) {
            messageApi.success(t('common.fileAttach.uploadSuccess') || 'Uploaded');
            setTimeout(() => refreshWorkspace(), 300);
          }
        } catch {
          // unexpected error
        }
        input.value = '';
      });
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    fileInputRef.current.click();
  }, [conversationId, handleSelectHostFiles, messageApi, refreshWorkspace, t]);

  useEffect(() => {
    return () => {
      if (fileInputRef.current?.parentNode) {
        fileInputRef.current.parentNode.removeChild(fileInputRef.current);
      }
      fileInputRef.current = null;
    };
  }, []);

  /**
   * Handle files to add (from paste service)
   */
  const handleFilesToAdd = useCallback(
    async (filesMeta: { name: string; path: string }[]) => {
      if (!filesMeta || filesMeta.length === 0) return;

      // Use utility function to get target folder path
      const targetFolder = getTargetFolderPath(selectedNodeRef.current, selected, files, workspace);
      const targetFolderPath = targetFolder.fullPath;
      const targetFolderKey = targetFolder.relativePath;

      // Set paste target folder for visual feedback
      if (targetFolderKey) {
        setPasteTargetFolder(targetFolderKey);
      }

      // If user has disabled confirmation, perform copy directly
      const skipConfirm = await ConfigStorage.get('workspace.pasteConfirm');
      if (skipConfirm) {
        try {
          const filePaths = filesMeta.map((f) => f.path);
          const res = await ipcBridge.fs.copyFilesToWorkspace.invoke({ filePaths, workspace: targetFolderPath });
          const copiedFiles = res.data?.copiedFiles ?? [];
          const failedFiles = res.data?.failedFiles ?? [];

          if (copiedFiles.length > 0) {
            messageApi.success(t('common.fileAttach.uploadSuccess') || 'Pasted');
            setTimeout(() => refreshWorkspace(), 300);
          }

          if (!res.success || failedFiles.length > 0) {
            // Notify user when any paste fails
            const fallback = failedFiles.length > 0 ? 'Some files failed to copy' : res.msg;
            messageApi.warning(fallback || t('common.unknownError') || 'Paste failed');
          }
        } catch (error) {
          messageApi.error(t('common.unknownError') || 'Paste failed');
        } finally {
          // Reset paste target folder after operation completes (success or failure)
          setPasteTargetFolder(null);
        }
        return;
      }

      // Otherwise show confirmation modal
      setPasteConfirm({
        visible: true,
        fileName: filesMeta[0].name,
        filesToPaste: filesMeta.map((f) => ({ path: f.path, name: f.name })),
        doNotAsk: false,
        targetFolder: targetFolderKey,
      });
    },
    [workspace, refreshWorkspace, t, messageApi, files, selected, selectedNodeRef, setPasteConfirm]
  );

  /**
   * Confirm paste operation
   */
  const handlePasteConfirm = useCallback(async () => {
    if (!pasteConfirm.filesToPaste || pasteConfirm.filesToPaste.length === 0) return;

    try {
      // Save preference if user checked "do not ask again"
      if (pasteConfirm.doNotAsk) {
        await ConfigStorage.set('workspace.pasteConfirm', true);
      }

      // Get target folder path
      const targetFolder = getTargetFolderPath(selectedNodeRef.current, selected, files, workspace);
      const targetFolderPath = targetFolder.fullPath;

      const filePaths = pasteConfirm.filesToPaste.map((f) => f.path);
      const res = await ipcBridge.fs.copyFilesToWorkspace.invoke({ filePaths, workspace: targetFolderPath });
      const copiedFiles = res.data?.copiedFiles ?? [];
      const failedFiles = res.data?.failedFiles ?? [];

      if (copiedFiles.length > 0) {
        messageApi.success(t('common.fileAttach.uploadSuccess') || 'Pasted');
        setTimeout(() => refreshWorkspace(), 300);
      }

      if (!res.success || failedFiles.length > 0) {
        const fallback = failedFiles.length > 0 ? 'Some files failed to copy' : res.msg;
        messageApi.warning(fallback || t('common.unknownError') || 'Paste failed');
      }

      closePasteConfirm();
    } catch (error) {
      messageApi.error(t('common.unknownError') || 'Paste failed');
    } finally {
      setPasteTargetFolder(null);
    }
  }, [pasteConfirm, closePasteConfirm, messageApi, t, files, selected, selectedNodeRef, workspace, refreshWorkspace]);

  // Register paste service to catch global paste events when workspace component is focused
  const { onFocus } = usePasteService({
    supportedExts: [],
    onFilesAdded: (files) => {
      const meta = files.map((f) => ({ name: f.name, path: f.path }));
      void handleFilesToAdd(meta);
    },
    conversationId,
    source: 'workspace',
  });

  return {
    pasteTargetFolder,
    handleSelectHostFiles,
    handleUploadDeviceFiles,
    handleFilesToAdd,
    handlePasteConfirm,
    onFocusPaste: onFocus,
  };
}
