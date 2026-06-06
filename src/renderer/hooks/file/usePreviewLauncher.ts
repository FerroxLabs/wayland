/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { joinPath } from '@/common/chat/chatLib';
import type { PreviewContentType } from '@/common/types/preview';
import { useConversationContextSafe } from '@/renderer/hooks/context/ConversationContext';
import { usePreviewContext } from '@/renderer/pages/conversation/Preview';
import {
  LARGE_TEXT_PREVIEW_MAX_LENGTH,
  LARGE_TEXT_PREVIEW_THRESHOLD,
} from '@/renderer/pages/conversation/Preview/constants';
import { useCallback, useState } from 'react';

const LARGE_TEXT_PREVIEW_TYPES = new Set<PreviewContentType>(['code', 'markdown', 'html', 'diff']);

const normalizeLargeTextPreview = (
  content: string,
  contentType: PreviewContentType
): { content: string; truncated: boolean } => {
  if (!LARGE_TEXT_PREVIEW_TYPES.has(contentType) || content.length <= LARGE_TEXT_PREVIEW_THRESHOLD) {
    return { content, truncated: false };
  }

  return {
    content: content.slice(0, LARGE_TEXT_PREVIEW_MAX_LENGTH),
    truncated: true,
  };
};

/**
 * Preview launch options
 */
interface PreviewLaunchOptions {
  /** Workspace-relative path */
  relativePath?: string;
  /** Fallback path (absolute or provided path) */
  originalPath?: string;
  /** File name */
  fileName?: string;
  /** Preview title */
  title?: string;
  /** Code language (for syntax highlighting) */
  language?: string;
  /** Content type */
  contentType: PreviewContentType;
  /** Whether editable */
  editable: boolean;
  /** Use this content if file read fails (editable) */
  fallbackContent?: string;
  /** Read-only diff fallback */
  diffContent?: string;
}

/**
 * Shared preview launcher logic for components that need edit/preview buttons.
 *
 * Processing flow:
 * 1. Editable files: try reading actual file content first
 * 2. Read failed: use fallbackContent as fallback
 * 3. Non-editable: show diffContent (read-only)
 *
 * @returns {{ launchPreview: Function, loading: boolean }}
 */
export const usePreviewLauncher = () => {
  const conversationContext = useConversationContextSafe();
  const workspace = conversationContext?.workspace;
  const { openPreview } = usePreviewContext();
  const [loading, setLoading] = useState(false);

  /**
   * Launch preview panel
   */
  const launchPreview = useCallback(
    async ({
      relativePath,
      originalPath,
      fileName,
      title,
      language,
      contentType,
      editable,
      fallbackContent,
      diffContent,
    }: PreviewLaunchOptions) => {
      setLoading(true);

      // Path resolution
      // Prefer workspace + relative path to build absolute path
      const absolutePath = workspace && relativePath ? joinPath(workspace, relativePath) : undefined;
      const resolvedPath = absolutePath || originalPath || relativePath || undefined;

      // Compute file name and title
      const computedFileName =
        fileName || (relativePath ? relativePath.split(/[\\/]/).pop() || relativePath : undefined);
      const previewTitle = title || computedFileName || relativePath || contentType.toUpperCase();

      // Preview metadata
      const metadata = {
        title: previewTitle,
        fileName: computedFileName || previewTitle,
        filePath: resolvedPath,
        workspace,
        language,
      };

      // 1. Optimistic preview: Show fallback content immediately if available
      let hasOpened = false;
      if (typeof fallbackContent === 'string') {
        const normalizedFallback = normalizeLargeTextPreview(fallbackContent, contentType);
        openPreview(normalizedFallback.content, contentType, {
          ...metadata,
          editable: normalizedFallback.truncated ? false : editable,
        });
        hasOpened = true;
      }

      try {
        // 2. Try to read actual file content (override optimistic preview)
        if (absolutePath || originalPath) {
          try {
            const pathToRead = absolutePath || originalPath;

            if (contentType === 'image') {
              const base64 = await ipcBridge.fs.getImageBase64.invoke({ path: pathToRead! });
              openPreview(base64, contentType, {
                ...metadata,
                editable,
              });
              return;
            }

            const binaryOnlyTypes: PreviewContentType[] = ['pdf', 'ppt', 'word', 'excel'];
            if (binaryOnlyTypes.includes(contentType)) {
              // These formats rely on file path; no need to read file content
              openPreview('', contentType, {
                ...metadata,
                editable,
              });
              return;
            }

            // Use Promise.race to prevent hanging
            const content = await Promise.race([
              ipcBridge.fs.readFile.invoke({ path: pathToRead! }),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('File read timeout')), 5000)),
            ]);
            const normalizedContent = normalizeLargeTextPreview(content, contentType);
            openPreview(normalizedContent.content, contentType, {
              ...metadata,
              editable: normalizedContent.truncated ? false : editable,
            });
            return;
          } catch (error) {
            // Read failed, log warning if optimistic preview is already shown
          }
        }

        // 3. If not opened and file read failed, handle fallback cases
        if (!hasOpened) {
          // Show diff content (read-only)
          if (diffContent) {
            openPreview(diffContent, 'diff', {
              ...metadata,
              editable: false,
            });
            return;
          }
        }
      } catch (error) {
        console.error('[usePreviewLauncher] Failed to open preview:', error);
      } finally {
        setLoading(false);
      }
    },
    [workspace, openPreview]
  );

  return { launchPreview, loading };
};

export type { PreviewLaunchOptions };
