/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useThemeContext } from '@/renderer/hooks/context/ThemeContext';
import { Button } from '@arco-design/web-react';
// Migrated from @icon-park/react to lucide-react after the icon-sweep commit
// (6ba3a0659) removed IconParkHOC. JSX usages keep the icon-park-style names
// via import aliases to minimize diff.
import {
  Bold as TextBold,
  Code,
  GripVertical as Drag,
  Heading1 as H1,
  Heading2 as H2,
  Heading3 as H3,
  Italic as TextItalic,
  Link as LinkIcon,
  List as UnorderedList,
  ListOrdered as OrderedList,
  Minus as DividingLine,
  Plus,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from 'lucide-react';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Typography from '@tiptap/extension-typography';
import { type Editor, EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// tiptap-markdown registers parsing on setContent and exposes
// editor.storage.markdown.getMarkdown() for the onChange path.
import { Markdown } from 'tiptap-markdown';
import { joinFrontmatter, splitFrontmatter } from './frontmatter';
import { createSlashCommand, type SlashKeyHandle, SlashMenuPopup, type SlashState } from './slashMenu';
import styles from './TipTapMarkdownEditor.module.css';

type TipTapMarkdownEditorProps = {
  value: string;
  onChange?: (md: string) => void;
  readOnly?: boolean;
  isStreaming?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
};

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
};

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ active, disabled, title, onClick, children }) => (
  <Button
    type='text'
    size='mini'
    title={title}
    aria-label={title}
    aria-pressed={!!active}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    icon={children}
    className={`${styles.toolbarBtn} ${active ? styles.toolbarBtnActive : ''}`}
  />
);

const ToolbarDivider: React.FC = () => <span className={styles.toolbarDivider} aria-hidden='true' />;

type FormatButtonsProps = {
  editor: Editor;
  /** 'full' shows undo/redo + horizontal rule; 'bubble' is a tighter row. */
  variant: 'full' | 'bubble';
};

const FormatButtons: React.FC<FormatButtonsProps> = ({ editor, variant }) => {
  const promptLink = useCallback(() => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL (leave empty to remove)', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <>
      <ToolbarButton
        title='Heading 1'
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <H1 size='16' />
      </ToolbarButton>
      <ToolbarButton
        title='Heading 2'
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <H2 size='16' />
      </ToolbarButton>
      <ToolbarButton
        title='Heading 3'
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <H3 size='16' />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        title='Bold (⌘B)'
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <TextBold size='16' />
      </ToolbarButton>
      <ToolbarButton
        title='Italic (⌘I)'
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TextItalic size='16' />
      </ToolbarButton>
      <ToolbarButton
        title='Strikethrough'
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size='16' />
      </ToolbarButton>
      <ToolbarButton
        title='Inline code'
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size='16' />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        title='Bulleted list'
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <UnorderedList size='16' />
      </ToolbarButton>
      <ToolbarButton
        title='Numbered list'
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <OrderedList size='16' />
      </ToolbarButton>
      <ToolbarButton
        title='Blockquote'
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size='16' />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton title='Link' active={editor.isActive('link')} onClick={promptLink}>
        <LinkIcon size='16' />
      </ToolbarButton>
      {variant === 'full' && (
        <>
          <ToolbarButton title='Horizontal rule' onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <DividingLine size='16' />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            title='Undo (⌘Z)'
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo size='16' />
          </ToolbarButton>
          <ToolbarButton
            title='Redo (⌘⇧Z)'
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo size='16' />
          </ToolbarButton>
        </>
      )}
    </>
  );
};

const TopToolbar: React.FC<{ editor: Editor }> = ({ editor }) => (
  <div className={styles.toolbar} role='toolbar' aria-label='Markdown formatting'>
    <FormatButtons editor={editor} variant='full' />
  </div>
);

const BubbleToolbar: React.FC<{ editor: Editor }> = ({ editor }) => (
  <div className={styles.bubbleMenu} role='toolbar' aria-label='Inline formatting'>
    <FormatButtons editor={editor} variant='bubble' />
  </div>
);

/**
 * TipTap WYSIWYG markdown editor.
 *
 * Hybrid UX:
 *   - Sticky top toolbar (full format strip + undo/redo) - always discoverable
 *   - BubbleMenu on selection - quick inline formatting without leaving the line
 *   - SlashCommand on '/' - block insertion (headings, lists, table, code, …)
 *   - DragHandle on hover - "+" inserts a paragraph below, grip reorders blocks
 *   - Placeholder hint on empty blocks: "Press '/' for commands…"
 *
 * Streaming: while `isStreaming`, every `value` change replaces the doc
 * via setContent. When not streaming, user edits are preserved.
 */
const TipTapMarkdownEditor: React.FC<TipTapMarkdownEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  isStreaming = false,
  containerRef,
  onScroll,
}) => {
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const editable = !readOnly && !isStreaming;
  // Position of the block the cursor is hovering over, surfaced via
  // DragHandle's onNodeChange so the "+" button can target it.
  const [hoveredPos, setHoveredPos] = useState<number | null>(null);

  // Slash menu state - driven by the Suggestion plugin via setSlashState.
  // The popup writes its keyboard-event handler into slashKeyRef so the
  // plugin can forward up/down/enter/escape keys to it.
  const [slashState, setSlashState] = useState<SlashState | null>(null);
  const slashKeyRef = useRef<SlashKeyHandle | null>(null);

  // Frontmatter passthrough. tiptap-markdown drops YAML/TOML frontmatter
  // on parse, so we strip the raw block at mount, feed only the body to
  // ProseMirror, and prepend it back when serializing on every save.
  // The ref survives editor updates; it's overwritten during streaming
  // syncs because the agent-authored value can rewrite the whole document.
  const frontmatterRef = useRef<string | null>(null);
  const initialBody = useMemo(() => {
    const split = splitFrontmatter(value);
    frontmatterRef.current = split.raw;
    return split.body;
    // The editor mounts with whatever value was first passed in; later
    // non-streaming `value` changes are intentionally ignored (see the
    // existing useEffect below). Re-running this on every value change
    // would defeat that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extensions = useMemo(
    () => [
      // StarterKit already bundles Link, Bold/Italic/Strike/Code, headings,
      // paragraph, blockquote, lists, list-keymap, code-block, hr, hard-break,
      // dropcursor, gapcursor, history. Configure Link via the kit option;
      // never import @tiptap/extension-link separately or TipTap warns about
      // duplicate extension names and can drop plugin event handlers.
      StarterKit.configure({
        link: { openOnClick: false, autolink: true },
      }),
      Typography,
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        showOnlyCurrent: true,
        showOnlyWhenEditable: true,
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Heading';
          return "Press '/' for commands, or just start typing…";
        },
      }),
      createSlashCommand(setSlashState, slashKeyRef),
      Markdown.configure({
        html: false,
        tightLists: true,
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    []
  );

  const editor = useEditor({
    extensions,
    editable,
    content: initialBody,
    onUpdate: ({ editor: ed }) => {
      if (!onChange) return;
      const mdStorage = (ed.storage as { markdown?: { getMarkdown?: () => string } }).markdown;
      const md = mdStorage?.getMarkdown?.() ?? ed.getText();
      onChange(joinFrontmatter(frontmatterRef.current, md));
    },
  });

  // Drive toolbar re-renders ONLY when the set of active marks/nodes
  // changes (selection moves into/out of bold/italic/heading/etc.). A
  // raw `editor.on('transaction', forceUpdate)` fires ~167×/sec from
  // DragHandle + Placeholder positioning churn and loops with
  // useEditor.onRender's setOptions path.
  useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return '';
      return [
        ed.isActive('heading', { level: 1 }),
        ed.isActive('heading', { level: 2 }),
        ed.isActive('heading', { level: 3 }),
        ed.isActive('bold'),
        ed.isActive('italic'),
        ed.isActive('strike'),
        ed.isActive('code'),
        ed.isActive('bulletList'),
        ed.isActive('orderedList'),
        ed.isActive('blockquote'),
        ed.isActive('link'),
        ed.can().undo(),
        ed.can().redo(),
      ].join('|');
    },
  });

  const lastSyncedValueRef = useRef<string>(value);

  useEffect(() => {
    if (!editor) return;
    if (editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;
    if (!isStreaming) return;
    if (value === lastSyncedValueRef.current) return;
    lastSyncedValueRef.current = value;
    const split = splitFrontmatter(value);
    frontmatterRef.current = split.raw;
    editor.commands.setContent(split.body, { emitUpdate: false });
  }, [editor, isStreaming, value]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onScroll) return;
    const el = e.currentTarget;
    onScroll(el.scrollTop, el.scrollHeight, el.clientHeight);
  };

  // Memoize all callbacks passed to TipTap React menu components.
  // Fresh closures per render cause them to re-initialize their internal
  // plugins on every editor state change, which can invalidate the
  // Suggestion plugin's active range and exit the slash menu immediately
  // after onStart.
  const handleNodeChange = useCallback(({ pos }: { pos: number }) => {
    setHoveredPos(pos);
  }, []);

  const bubbleShouldShow = useCallback(({ state }: { state: { selection: { from: number; to: number; empty: boolean } } }) => {
    const { from, to, empty } = state.selection;
    return !empty && from !== to;
  }, []);

  // "+" button: insert an empty paragraph after the hovered block and put
  // the cursor there. The user can then type "/" to open the slash menu.
  const insertBlockBelow = useCallback(() => {
    if (!editor || hoveredPos == null) return;
    const node = editor.state.doc.nodeAt(hoveredPos);
    if (!node) return;
    const insertAt = hoveredPos + node.nodeSize;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, { type: 'paragraph' })
      .setTextSelection(insertAt + 1)
      .run();
  }, [editor, hoveredPos]);

  return (
    <div
      ref={containerRef}
      className={`${styles.editor} ${isDark ? 'tiptap-md-editor--dark' : ''}`}
      onScroll={handleScroll}
    >
      {isStreaming && (
        <div className='absolute right-3 top-3 z-10 rounded-full bg-blue-500/90 px-3 py-1 text-xs font-medium text-white shadow-sm'>
          Agent is writing…
        </div>
      )}
      {slashState && (
        <SlashMenuPopup
          {...slashState}
          keyHandleRef={slashKeyRef}
          onClose={() => setSlashState(null)}
        />
      )}
      {editor && editable && <TopToolbar editor={editor} />}
      {editor && editable && (
        <BubbleMenu editor={editor} shouldShow={bubbleShouldShow}>
          <BubbleToolbar editor={editor} />
        </BubbleMenu>
      )}
      {editor && editable && (
        <DragHandle editor={editor} onNodeChange={handleNodeChange}>
          <div className={styles.blockHandle}>
            <button
              type='button'
              title='Add block below'
              aria-label='Add block below'
              className={styles.blockHandleBtn}
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertBlockBelow}
            >
              <Plus size='14' />
            </button>
            <span
              role='button'
              tabIndex={-1}
              title='Drag to reorder'
              aria-label='Drag to reorder'
              className={styles.blockHandleGrip}
              data-drag-handle
            >
              <Drag size='14' />
            </span>
          </div>
        </DragHandle>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTapMarkdownEditor;
