/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useThemeContext } from '@/renderer/hooks/context/ThemeContext';
import { markdown } from '@codemirror/lang-markdown';
import CodeMirror from '@uiw/react-codemirror';
import React, { useRef, useCallback } from 'react';
import { useCodeMirrorScroll, useScrollSyncTarget } from '../../hooks/useScrollSyncHelpers';

interface MarkdownEditorProps {
  value: string; // Editor content
  onChange: (value: string) => void; // Content change callback
  readOnly?: boolean; // Whether read-only
  containerRef?: React.RefObject<HTMLDivElement>; // Container ref for scroll sync
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void; // Scroll callback
}

/**
 * Markdown editor component
 *
 * Based on CodeMirror, supports syntax highlighting and live editing
 */
const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  containerRef,
  onScroll,
}) => {
  const { theme } = useThemeContext();
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  // Use CodeMirror scroll hook
  const { setScrollPercent } = useCodeMirrorScroll(editorWrapperRef, onScroll);

  // Listen for external scroll sync requests
  const handleTargetScroll = useCallback(
    (targetPercent: number) => {
      setScrollPercent(targetPercent);
    },
    [setScrollPercent]
  );
  useScrollSyncTarget(containerRef, handleTargetScroll);

  return (
    <div ref={containerRef} className='h-full w-full overflow-hidden'>
      <div ref={editorWrapperRef} className='h-full w-full'>
        <CodeMirror
          value={value}
          height='100%'
          theme={theme === 'dark' ? 'dark' : 'light'}
          extensions={[markdown()]} // Markdown syntax support
          onChange={onChange}
          readOnly={readOnly}
          basicSetup={{
            lineNumbers: true, // Show line numbers
            highlightActiveLineGutter: true, // Highlight active line gutter
            highlightActiveLine: true, // Highlight active line
            foldGutter: true, // Code folding
          }}
          style={{
            fontSize: '14px',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
};

export default MarkdownEditor;
