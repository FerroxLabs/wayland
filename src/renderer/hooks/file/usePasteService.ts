import type { FileMetadata } from '@/renderer/services/FileService';
import type { UploadSource } from '@/renderer/hooks/file/useUploadState';
import { PasteService } from '@/renderer/services/PasteService';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from '@arco-design/web-react';
import { uuid } from '@renderer/utils/common';

interface UsePasteServiceProps {
  supportedExts: string[];
  onFilesAdded?: (files: FileMetadata[]) => void;
  onTextPaste?: (text: string) => void;
  /** Conversation ID for WebUI file uploads */
  conversationId?: string;
  source?: UploadSource;
}

/**
 * Generic PasteService integration hook.
 * Provides unified paste handling for all components.
 */
export const usePasteService = ({
  supportedExts,
  onFilesAdded,
  onTextPaste,
  conversationId,
  source = 'sendbox',
}: UsePasteServiceProps) => {
  const { t } = useTranslation();
  const componentId = useRef('paste-service-' + uuid(4)).current;
  // Unified paste event handling
  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      // Check whether files are present; if so, prevent default immediately
      const files = event.clipboardData?.files;
      if (files && files.length > 0) {
        event.preventDefault();
        event.stopPropagation();
      }

      try {
        const handled = await PasteService.handlePaste(
          event,
          supportedExts,
          onFilesAdded || (() => {}),
          onTextPaste,
          conversationId,
          source
        );
        if (handled && (!files || files.length === 0)) {
          // If it wasn't a file paste but was handled (e.g. plain text paste), also prevent default
          event.preventDefault();
          event.stopPropagation();
        }
        return handled;
      } catch (err) {
        Message.error(t('common.fileAttach.failed'));
        return false;
      }
    },
    [conversationId, source, supportedExts, onFilesAdded, onTextPaste, t]
  );

  // Focus handling
  const handleFocus = useCallback(() => {
    PasteService.setLastFocusedComponent(componentId);
  }, [componentId]);

  // Register paste handler
  useEffect(() => {
    PasteService.init();
    PasteService.registerHandler(componentId, handlePaste);

    return () => {
      PasteService.unregisterHandler(componentId);
    };
  }, [componentId, handlePaste]);

  return {
    onFocus: handleFocus,
    onPaste: handlePaste,
  };
};
