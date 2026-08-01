/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useThemeContext } from '@/renderer/hooks/context/ThemeContext';
import { html } from '@codemirror/lang-html';
import { history, historyKeymap } from '@codemirror/commands';
import { indentOnInput, indentRange } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import React, { useMemo, useRef, useCallback } from 'react';
import { useCodeMirrorScroll, useScrollSyncTarget } from '../../hooks/useScrollSyncHelpers';

interface HTMLEditorProps {
  value: string;
  onChange: (value: string) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  filePath?: string; // Used to generate stable key
}

/**
 * Reindent only the lines changed by a paste transaction.
 *
 * CodeMirror reports every changed range independently. Keeping those ranges
 * independent is important for multi-cursor paste: collapsing them into one
 * minimum-to-maximum span would reformat untouched HTML between the cursors.
 */
const formatHtmlPaste = EditorState.transactionFilter.of((transaction) => {
  if (!transaction.docChanged || !transaction.isUserEvent('input.paste')) {
    return transaction;
  }

  const changedLineRanges: Array<{ from: number; to: number }> = [];
  transaction.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
    const lastChangedPosition = toB > fromB ? toB - 1 : fromB;
    changedLineRanges.push({
      from: transaction.newDoc.lineAt(fromB).from,
      to: transaction.newDoc.lineAt(lastChangedPosition).to,
    });
  });

  const formattingChanges: Array<{ from: number; to: number; insert: string }> = [];
  const formattedLines = new Set<number>();

  for (const range of changedLineRanges) {
    const rangeChanges = indentRange(transaction.state, range.from, range.to);
    rangeChanges.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
      const lineStart = transaction.state.doc.lineAt(fromA).from;
      if (formattedLines.has(lineStart)) return;
      formattedLines.add(lineStart);
      formattingChanges.push({ from: fromA, to: toA, insert: inserted.toString() });
    });
  }

  return formattingChanges.length
    ? [transaction, { changes: formattingChanges, sequential: true, userEvent: 'input.format' }]
    : transaction;
});

/**
 * HTML code editor component
 *
 * Uses CodeMirror for HTML code editing with undo/redo history support
 */
const HTMLEditor: React.FC<HTMLEditorProps> = ({ value, onChange, containerRef, onScroll, filePath }) => {
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

  // Use filePath as part of key to ensure editor instance is stable
  const editorKey = useMemo(() => {
    return filePath || 'html-editor';
  }, [filePath]);

  // Wrap onChange to add type checking
  const handleChange = useCallback(
    (newValue: string) => {
      // Strict type checking
      if (typeof newValue !== 'string') {
        console.error('[HTMLEditor] onChange received non-string value:', newValue);
        return;
      }
      onChange(newValue);
    },
    [onChange]
  );

  // Configure extensions including HTML syntax and history support
  const extensions = useMemo(
    () => [
      html(),
      EditorState.allowMultipleSelections.of(true),
      EditorView.lineWrapping,
      indentOnInput(),
      formatHtmlPaste,
      history(), // Explicitly add history support
      keymap.of(historyKeymap), // Add history keymaps
    ],
    []
  );

  return (
    <div ref={containerRef} className='h-full w-full overflow-hidden'>
      <div ref={editorWrapperRef} className='h-full w-full'>
        <CodeMirror
          key={editorKey}
          value={value}
          height='100%'
          theme={theme === 'dark' ? 'dark' : 'light'}
          extensions={extensions}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            history: false, // Disable basicSetup history, use our own
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

export default HTMLEditor;
