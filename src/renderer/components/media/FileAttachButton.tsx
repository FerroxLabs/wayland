/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus } from 'lucide-react';
import { Button, Dropdown, Menu, Message } from '@arco-design/web-react';
import { useConversationContextSafe } from '@/renderer/hooks/context/ConversationContext';
import { iconColors } from '@/renderer/styles/colors';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { FileService } from '@/renderer/services/FileService';
import type { FileMetadata } from '@/renderer/services/FileService';
import InChatComposerAddMenu from '@/renderer/pages/conversation/components/composerMenu/InChatComposerAddMenu';
import type { ComposerUploadItem } from '@/renderer/pages/conversation/components/composerMenu/ComposerAddMenu';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface FileAttachButtonProps {
  /** Open server/host file browser (existing ipcBridge.dialog.showOpen behavior) */
  openFileSelector: () => void;
  /** Callback when local device files are selected via browser file picker */
  onLocalFilesAdded?: (files: FileMetadata[]) => void;
}

/**
 * In-chat composer "+" button. Inside a conversation it hosts the unified
 * ComposerAddMenu (Upload / Skills / Connectors) in live mode. Outside a
 * conversation context (rare) it falls back to the original upload-only button.
 *
 * - **Electron desktop**: "+" opens the menu; "Upload File" runs the native dialog.
 * - **WebUI**: the Upload section offers host files (server browser) + device files.
 */
const FileAttachButton: React.FC<FileAttachButtonProps> = ({ openFileSelector, onLocalFilesAdded }) => {
  const conversationContext = useConversationContextSafe();
  const conversationId = conversationContext?.conversationId;
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleLocalFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0 || !onLocalFilesAdded) return;
      setUploading(true);
      try {
        const processed = await FileService.processDroppedFiles(fileList, conversationId);
        if (processed.length > 0) {
          onLocalFilesAdded(processed);
        }
      } catch {
        Message.error(t('common.fileAttach.failed'));
      } finally {
        setUploading(false);
      }
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [conversationId, onLocalFilesAdded, t]
  );

  const uploadItems = useMemo<ComposerUploadItem[]>(() => {
    if (isElectronDesktop()) {
      return [{ key: 'file', label: t('conversation.welcome.uploadFile'), onClick: openFileSelector }];
    }
    return [
      { key: 'host', label: t('common.fileAttach.hostFiles'), onClick: openFileSelector },
      { key: 'device', label: t('common.fileAttach.myDevice'), onClick: () => fileInputRef.current?.click() },
    ];
  }, [t, openFileSelector]);

  const plusIcon = <Plus size={14} strokeWidth={2} color={iconColors.brand} />;

  // Outside a conversation (no context): keep the original upload-only button.
  if (!conversationId) {
    if (isElectronDesktop()) {
      return <Button type='secondary' shape='circle' icon={plusIcon} onClick={openFileSelector} />;
    }
    const dropdownMenu = (
      <Menu
        onClickMenuItem={(key) => {
          if (key === 'host') openFileSelector();
          if (key === 'device') fileInputRef.current?.click();
        }}
      >
        <Menu.Item key='host'>{t('common.fileAttach.hostFiles')}</Menu.Item>
        <Menu.Item key='device'>{t('common.fileAttach.myDevice')}</Menu.Item>
      </Menu>
    );
    return (
      <>
        <Dropdown droplist={dropdownMenu} trigger='click' position='top'>
          <Button type='secondary' shape='circle' icon={plusIcon} loading={uploading} disabled={uploading} />
        </Dropdown>
        <input ref={fileInputRef} type='file' multiple style={{ display: 'none' }} onChange={handleLocalFileChange} />
      </>
    );
  }

  return (
    <>
      <InChatComposerAddMenu conversationId={conversationId} uploadItems={uploadItems} uploading={uploading} />
      <input ref={fileInputRef} type='file' multiple style={{ display: 'none' }} onChange={handleLocalFileChange} />
    </>
  );
};

export default FileAttachButton;
