/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useDragUpload } from '@/renderer/hooks/file/useDragUpload';
import { usePasteService } from '@/renderer/hooks/file/usePasteService';
import { allSupportedExts, type FileMetadata } from '@/renderer/services/FileService';
import { measureCaretTop, scrollCaretToLastLine } from '../utils/caretUtils';
import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { useCallback, useEffect, useRef, useState } from 'react';

export type GuidInputResult = {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  files: string[];
  setFiles: React.Dispatch<React.SetStateAction<string[]>>;
  dir: string;
  setDir: React.Dispatch<React.SetStateAction<string>>;
  isInputFocused: boolean;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleFilesPasted: (pastedFiles: FileMetadata[]) => void;
  handleFilesUploaded: (uploadedPaths: string[]) => void;
  handleRemoveFile: (targetPath: string) => void;
  /**
   * v0.4.7.1 (RENDERER-1) - Ref attached to the Arco `Input.TextArea` so the
   * Kickoff `Accept` flow and the IntentSuggestionPanel prompt-accept flow
   * can actually focus the DOM textarea after prefilling. Arco exposes both
   * `.focus()` and `.dom` on this ref.
   */
  textareaRef: React.RefObject<RefTextAreaType | null>;
  handleTextareaFocus: () => void;
  handleTextareaBlur: () => void;
  onPaste: ReturnType<typeof usePasteService>['onPaste'];
  isFileDragging: boolean;
  dragHandlers: ReturnType<typeof useDragUpload>['dragHandlers'];
};

type UseGuidInputOptions = {
  locationState: { workspace?: string; paletteInitialPrompt?: string } | null;
};

/**
 * Hook that manages input state, file handling, and drag/paste for the Guid page.
 */
export const useGuidInput = ({ locationState }: UseGuidInputOptions): GuidInputResult => {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [dir, setDir] = useState<string>('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<RefTextAreaType | null>(null);

  // Read workspace from location.state (passed from tabs add button)
  useEffect(() => {
    if (locationState?.workspace) {
      setDir(locationState.workspace);
    }
  }, [locationState]);

  // Read starter prompt from location.state (passed from the ⌘K command
  // palette). Pre-fills the chat input so the user lands on /guid with the
  // prompt scaffold already in place and can continue typing immediately.
  useEffect(() => {
    if (locationState?.paletteInitialPrompt) {
      setInput(locationState.paletteInitialPrompt);
    }
  }, [locationState]);

  // Handle pasted files (append mode to support multiple pastes)
  const handleFilesPasted = useCallback((pastedFiles: FileMetadata[]) => {
    const filePaths = pastedFiles.map((file) => file.path);
    setFiles((prevFiles) => [...prevFiles, ...filePaths]);
    setDir('');
  }, []);

  // Handle files uploaded via dialog (append mode)
  const handleFilesUploaded = useCallback((uploadedPaths: string[]) => {
    setFiles((prevFiles) => [...prevFiles, ...uploadedPaths]);
  }, []);

  const handleRemoveFile = useCallback((targetPath: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== targetPath));
  }, []);

  // Use drag upload hook (drag treated like paste, appends to existing files)
  const { isFileDragging, dragHandlers } = useDragUpload({
    supportedExts: allSupportedExts,
    onFilesAdded: handleFilesPasted,
  });

  // Use shared PasteService integration (paste appends to existing files)
  const { onPaste, onFocus } = usePasteService({
    supportedExts: allSupportedExts,
    onFilesAdded: handleFilesPasted,
    onTextPaste: (text: string) => {
      const textarea = document.activeElement as HTMLTextAreaElement | null;
      if (textarea && textarea.tagName === 'TEXTAREA') {
        const start = textarea.selectionStart ?? textarea.value.length;
        const end = textarea.selectionEnd ?? start;
        const currentValue = textarea.value;
        const newValue = currentValue.slice(0, start) + text + currentValue.slice(end);
        setInput(newValue);

        setTimeout(() => {
          const newPos = start + text.length;
          textarea.setSelectionRange(newPos, newPos);
          const caretTop = measureCaretTop(textarea, newPos);
          scrollCaretToLastLine(textarea, caretTop);
        }, 0);
      } else {
        setInput((prev) => prev + text);
      }
    },
  });

  const handleTextareaFocus = useCallback(() => {
    onFocus();
    setIsInputFocused(true);
    // v0.4.7.1 (RENDERER-1) - Actually focus the underlying textarea. Prior
    // version only flipped the state flag, so the Kickoff Accept / Intent
    // prompt-accept callers ended up with a prefilled but un-focused field.
    textareaRef.current?.focus();
  }, [onFocus]);

  const handleTextareaBlur = useCallback(() => {
    setIsInputFocused(false);
  }, []);

  return {
    input,
    setInput,
    files,
    setFiles,
    dir,
    setDir,
    isInputFocused,
    loading,
    setLoading,
    handleFilesPasted,
    handleFilesUploaded,
    handleRemoveFile,
    textareaRef,
    handleTextareaFocus,
    handleTextareaBlur,
    onPaste,
    isFileDragging,
    dragHandlers,
  };
};
