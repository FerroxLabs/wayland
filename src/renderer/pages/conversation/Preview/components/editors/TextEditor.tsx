/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useThemeContext } from '@/renderer/hooks/context/ThemeContext';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import React, { useCallback, useMemo } from 'react';

interface TextEditorProps {
  value: string; // Editor content
  onChange: (value: string) => void; // Content change callback
  readOnly?: boolean; // Whether read-only
  containerRef?: React.RefObject<HTMLDivElement>; // Container ref for scroll sync
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void; // Scroll callback
}

/**
 * Generic text editor component
 *
 * Based on CodeMirror, supports syntax highlighting and live editing
 */
const TextEditor: React.FC<TextEditorProps> = ({ value, onChange, readOnly = false, containerRef, onScroll }) => {
  const { theme } = useThemeContext();

  // Listen to container scroll events
  React.useEffect(() => {
    const container = containerRef?.current;
    if (!container || !onScroll) return;

    const handleScroll = () => {
      onScroll(container.scrollTop, container.scrollHeight, container.clientHeight);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, onScroll]);

  // Use useCallback to avoid creating new function on each render
  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  // Memoize basicSetup config
  const basicSetupConfig = useMemo(
    () => ({
      lineNumbers: true, // Show line numbers
      highlightActiveLineGutter: true, // Highlight active line gutter
      highlightActiveLine: true, // Highlight active line
      foldGutter: true, // Code folding
    }),
    []
  );

  // Memoize style object
  const editorStyle = useMemo(
    () => ({
      fontSize: '14px',
      height: '100%',
      textAlign: 'left' as const, // Text align left
    }),
    []
  );

  return (
    <div ref={containerRef} className='h-full w-full overflow-auto text-left'>
      <CodeMirror
        value={value}
        height='100%'
        theme={theme === 'dark' ? 'dark' : 'light'}
        extensions={[EditorView.lineWrapping]}
        onChange={handleChange}
        readOnly={readOnly}
        basicSetup={basicSetupConfig}
        style={editorStyle}
      />
    </div>
  );
};

// Use React.memo to only re-render when props actually change
export default React.memo(TextEditor);
