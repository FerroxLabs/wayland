/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Notion-style slash command for the TipTap markdown editor.
 *
 * Typing `/` opens a filterable command palette anchored to the cursor.
 * Arrow keys navigate, Enter executes the selected command, Escape closes.
 * Each command transforms the current block (e.g. into a heading, list,
 * table, code block, divider) using TipTap chains.
 *
 * Architecture:
 *   - `SlashCommand(setState, keyRef)` is a factory that builds a TipTap
 *     Extension wrapping `@tiptap/suggestion`. The Suggestion plugin pushes
 *     all UI state (visible items, anchor rect, command callback) through
 *     `setState` instead of mounting its own React renderer / portal.
 *   - The parent renders `<SlashMenuPopup>` from React's main tree based
 *     on that state. This sidesteps the React 19 / Tiptap `ReactRenderer`
 *     incompatibility where `.element` could be null at portal-append time.
 */

// Migrated from @icon-park/react to lucide-react after the icon-sweep commit
// (6ba3a0659) removed IconParkHOC. JSX usages keep the icon-park-style names
// via import aliases to minimize diff.
import {
  AlignLeft as AlignTextLeft,
  Braces as CodeBrackets,
  CheckSquare as CheckOne,
  Code,
  Heading1 as H1,
  Heading2 as H2,
  Heading3 as H3,
  LayoutList as ListView,
  List as UnorderedList,
  ListOrdered as OrderedList,
  Minus,
  Quote,
  Table as TableFile,
} from 'lucide-react';
import { type Editor, Extension, type Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './TipTapMarkdownEditor.module.css';

export type SlashItem = {
  label: string;
  description: string;
  keywords: string[];
  icon: React.ReactNode;
  action: (args: { editor: Editor; range: Range }) => void;
};

const ICON_SIZE = '18';

export const SLASH_ITEMS: SlashItem[] = [
  {
    label: 'Text',
    description: 'Plain paragraph',
    keywords: ['text', 'paragraph', 'plain', 'p'],
    icon: <AlignTextLeft size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    label: 'Heading 1',
    description: 'Large section heading',
    keywords: ['heading', 'h1', 'title', 'large'],
    icon: <H1 size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    label: 'Heading 2',
    description: 'Medium section heading',
    keywords: ['heading', 'h2', 'subtitle', 'medium'],
    icon: <H2 size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    label: 'Heading 3',
    description: 'Small section heading',
    keywords: ['heading', 'h3', 'small'],
    icon: <H3 size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    label: 'Bulleted list',
    description: 'Simple bullet list',
    keywords: ['bullet', 'list', 'unordered', 'ul'],
    icon: <UnorderedList size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    label: 'Numbered list',
    description: 'List with 1., 2., 3.',
    keywords: ['numbered', 'list', 'ordered', 'ol'],
    icon: <OrderedList size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    label: 'Task list',
    description: 'Track to-dos with checkboxes',
    keywords: ['task', 'todo', 'to-do', 'checkbox', 'check'],
    icon: <CheckOne size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleList('taskList', 'taskItem').run();
    },
  },
  {
    label: 'Quote',
    description: 'Pull-quote block',
    keywords: ['quote', 'blockquote', 'citation'],
    icon: <Quote size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run();
    },
  },
  {
    label: 'Code block',
    description: 'Multi-line code with monospace font',
    keywords: ['code', 'codeblock', 'pre', 'fenced'],
    icon: <CodeBrackets size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    label: 'Inline code',
    description: 'Wrap in `backticks`',
    keywords: ['code', 'inline', 'mono'],
    icon: <Code size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setMark('code').run();
    },
  },
  {
    label: 'Divider',
    description: 'Horizontal rule across the page',
    keywords: ['divider', 'hr', 'horizontal', 'rule', 'separator'],
    icon: <Minus size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    label: 'Table',
    description: '3×3 grid with header row',
    keywords: ['table', 'grid', 'rows', 'columns'],
    icon: <TableFile size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    label: 'Bulleted list (nested)',
    description: 'List that can have sub-items',
    keywords: ['nested', 'tree', 'sub', 'hierarchy', 'outline'],
    icon: <ListView size={ICON_SIZE} />,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
];

function filterSlashItems(query: string): SlashItem[] {
  if (!query) return SLASH_ITEMS.slice(0, 10);
  const q = query.toLowerCase();
  return SLASH_ITEMS.filter(
    (item) => item.label.toLowerCase().includes(q) || item.keywords.some((k) => k.toLowerCase().includes(q))
  ).slice(0, 10);
}

/**
 * Public state shape consumed by `<SlashMenuPopup>`. The parent editor
 * holds this in a React state; the Suggestion plugin pushes updates via
 * the `setState` ref handed to `createSlashCommand`.
 */
export type SlashState = {
  open: boolean;
  items: SlashItem[];
  command: (item: SlashItem) => void;
  rect: DOMRect | null;
};

/** Imperative handle exposed by the popup so the suggestion plugin can
 *  forward arrow/Enter/Escape keys back into it. */
export type SlashKeyHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

type SlashMenuPopupProps = SlashState & {
  keyHandleRef: React.MutableRefObject<SlashKeyHandle | null>;
  onClose: () => void;
};

export const SlashMenuPopup: React.FC<SlashMenuPopupProps> = ({ open, items, command, rect, keyHandleRef, onClose }) => {
  const [selected, setSelected] = useState(0);
  const safeSelected = items.length === 0 ? 0 : Math.min(Math.max(selected, 0), items.length - 1);
  const popupRef = useRef<HTMLDivElement>(null);

  // Click-outside-to-close: any mousedown that doesn't land inside the popup
  // closes it. Skip mousedowns inside the editor's contentEditable so the
  // user can still scroll/select around the editor while the popup is open
  // before they explicitly dismiss it - but that turned out to feel laggy,
  // so any outside click closes.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (popupRef.current && target && popupRef.current.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', onMouseDown, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown, true);
    };
  }, [open, onClose]);

  useEffect(() => {
    keyHandleRef.current = {
      onKeyDown: (event) => {
        if (items.length === 0) return false;
        if (event.key === 'ArrowDown') {
          setSelected((safeSelected + 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowUp') {
          setSelected((safeSelected - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          const item = items[safeSelected];
          if (item) command(item);
          return true;
        }
        return false;
      },
    };
    return () => {
      keyHandleRef.current = null;
    };
  }, [items, command, safeSelected, keyHandleRef]);

  if (!open) return null;

  // Anchor below the trigger; flip up if there isn't room. Clamp to the
  // viewport so the popup stays visible even when the trigger sits near
  // the right edge of a narrow workspace pane.
  //
  // Render via createPortal to document.body so the popup escapes any
  // ancestor with `transform` set - the preview-panel applies a 1× transform
  // for layout-isolation purposes which would otherwise re-base position:fixed
  // to the panel's coordinate system and push the popup off-screen.
  const popupHeight = 320;
  const popupWidth = 290;
  const viewportPadding = 8;
  const flipAbove = rect ? rect.bottom + popupHeight + 12 > window.innerHeight : false;
  const rawLeft = rect ? rect.left : 0;
  const maxLeft = window.innerWidth - popupWidth - viewportPadding;
  const left = Math.round(Math.max(viewportPadding, Math.min(rawLeft, maxLeft)));
  const rawTop = rect ? (flipAbove ? rect.top - popupHeight - 6 : rect.bottom + 6) : 0;
  const top = Math.round(Math.max(viewportPadding, rawTop));

  const body =
    items.length === 0 ? (
      <div ref={popupRef} className={styles.slashMenuPortal} style={{ left, top }}>
        <div className={styles.slashMenu}>
          <div className={styles.slashMenuEmpty}>No commands match</div>
        </div>
      </div>
    ) : (
      <div ref={popupRef} className={styles.slashMenuPortal} style={{ left, top }}>
        <div className={styles.slashMenu} role='listbox' aria-label='Slash commands'>
          {items.map((item, i) => (
            <button
              key={item.label}
              type='button'
              role='option'
              aria-selected={i === safeSelected}
              className={`${styles.slashMenuItem} ${i === safeSelected ? styles.slashMenuItemActive : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                command(item);
              }}
              onMouseEnter={() => setSelected(i)}
            >
              <span className={styles.slashMenuItemIcon}>{item.icon}</span>
              <span className={styles.slashMenuItemBody}>
                <span className={styles.slashMenuItemLabel}>{item.label}</span>
                <span className={styles.slashMenuItemDesc}>{item.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );

  return createPortal(body, document.body);
};

/**
 * Build the TipTap Extension. `setState` is the React state setter held
 * in the parent component; setting it to null hides the popup. `keyRef`
 * is a mutable ref the popup writes its keyboard handler into so the
 * Suggestion plugin can forward up/down/enter/escape keys.
 */
export function createSlashCommand(
  setState: (s: SlashState | null) => void,
  keyRef: React.MutableRefObject<SlashKeyHandle | null>
): Extension {
  return Extension.create({
    name: 'slashCommand',

    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem>({
          editor: this.editor,
          char: '/',
          startOfLine: false,
          allowSpaces: false,
          items: ({ query }) => filterSlashItems(query),
          command: ({ editor, range, props }) => {
            props.action({ editor, range });
            setState(null);
          },
          // Note on close lifecycle:
          // We do NOT close the popup via Suggestion's onExit. DragHandle's
          // plugin (and other TipTap internals) emit positioning transactions
          // on every cursor move which Suggestion interprets as "active range
          // invalidated" and fires onExit on. Trusting onExit closes the popup
          // 1-2 frames after open, before the user can interact.
          //
          // Instead, the popup is closed explicitly on:
          //   - Escape key (handled in onKeyDown)
          //   - Item selection (handled in `command` above)
          //   - Cursor leaving the editor / blur (not yet handled; relies on
          //     the user pressing Escape, clicking an item, or typing further
          //     `/` to refresh)
          render: () => ({
            onStart: (p) => {
              setState({
                open: true,
                items: p.items,
                command: p.command,
                rect: p.clientRect?.() ?? null,
              });
            },
            onUpdate: (p) => {
              // onUpdate fires on every keystroke after `/` with the latest
              // filtered items + the new cursor rect. Update our state so the
              // popup re-filters live as the user types.
              setState({
                open: true,
                items: p.items,
                command: p.command,
                rect: p.clientRect?.() ?? null,
              });
            },
            onKeyDown: (p) => {
              if (p.event.key === 'Escape') {
                setState(null);
                return true;
              }
              return keyRef.current?.onKeyDown(p.event) ?? false;
            },
            onExit: () => {
              // Intentionally a no-op. See header comment above.
            },
          }),
        }),
      ];
    },
  });
}
