/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import type { ContextMenuState, RenameModalState, DeleteModalState, PasteConfirmState } from '../types';

/**
 * useWorkspaceModals - Manage all modal and menu states
 */
export function useWorkspaceModals() {
  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  });

  // Rename modal state
  const [renameModal, setRenameModal] = useState<RenameModalState>({
    visible: false,
    value: '',
    target: null,
  });
  const [renameLoading, setRenameLoading] = useState(false);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    visible: false,
    target: null,
    loading: false,
  });

  // Paste confirmation modal state
  const [pasteConfirm, setPasteConfirm] = useState<PasteConfirmState>({
    visible: false,
    fileName: '',
    filesToPaste: [],
    doNotAsk: false,
    targetFolder: null,
  });

  /**
   * Close context menu
   */
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => (prev.visible ? { visible: false, x: 0, y: 0, node: null } : prev));
  }, []);

  /**
   * Open context menu
   */
  const openContextMenu = useCallback((x: number, y: number, node: any) => {
    setContextMenu({ visible: true, x, y, node });
  }, []);

  /**
   * Close rename modal
   */
  const closeRenameModal = useCallback(() => {
    setRenameModal({ visible: false, value: '', target: null });
    setRenameLoading(false);
  }, []);

  /**
   * Close delete confirmation modal
   */
  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ visible: false, target: null, loading: false });
  }, []);

  /**
   * Close paste confirmation modal
   */
  const closePasteConfirm = useCallback(() => {
    setPasteConfirm({
      visible: false,
      fileName: '',
      filesToPaste: [],
      doNotAsk: false,
      targetFolder: null,
    });
  }, []);

  return {
    // Context menu
    contextMenu,
    setContextMenu,
    closeContextMenu,
    openContextMenu,

    // Rename modal
    renameModal,
    setRenameModal,
    renameLoading,
    setRenameLoading,
    closeRenameModal,

    // Delete modal
    deleteModal,
    setDeleteModal,
    closeDeleteModal,

    // Paste confirm
    pasteConfirm,
    setPasteConfirm,
    closePasteConfirm,
  };
}
