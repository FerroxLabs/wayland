/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Get the current selection, checking Shadow DOM roots if needed.
 *
 * MarkdownView (ShadowView) renders agent messages inside an OPEN shadow root,
 * so `document.getSelection()` returns a collapsed/empty selection while the
 * real selection lives inside a shadowRoot. This walks up from `target` to find
 * a shadow host and reads that root's selection instead.
 */
export function getEffectiveSelection(target: EventTarget | null): Selection | null {
  // First try the standard selection.
  const docSel = document.getSelection();
  if (docSel && !docSel.isCollapsed && docSel.toString().trim()) {
    return docSel;
  }

  // If the standard selection is empty, search for a selection inside Shadow DOM.
  // Walk up from the event target to find a shadow host.
  let el: Node | null = target instanceof Node ? target : null;
  while (el) {
    if (el instanceof Element && el.shadowRoot) {
      const shadowSel = (el.shadowRoot as unknown as { getSelection?: () => Selection | null }).getSelection?.();
      if (shadowSel && !shadowSel.isCollapsed && shadowSel.toString().trim()) {
        return shadowSel;
      }
    }
    el = el.parentNode;
  }

  return docSel;
}

/**
 * Install a global `copy` handler that copies text selected inside an open
 * shadow root (agent messages render there — issue #523).
 *
 * Chromium's native Copy (Ctrl+C and the context-menu Copy, both routed through
 * webContents.copy()) reads `document.getSelection()`, which is empty for a
 * selection that lives in a shadow root — so copy silently does nothing. We only
 * intervene when the document-level selection is empty AND a shadow-root
 * selection exists, so normal input / textarea / plain-DOM copy is untouched.
 *
 * @returns a disposer that removes the listener.
 */
export function installShadowCopyHandler(): () => void {
  const onCopy = (e: ClipboardEvent): void => {
    // Leave normal copies alone: if the document selection already has text,
    // the native copy works fine and we must not override it.
    const docSel = document.getSelection();
    if (docSel && !docSel.isCollapsed && docSel.toString().trim()) {
      return;
    }

    const sel = getEffectiveSelection(e.target);
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString();
    if (!text.trim()) return;

    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', text);
      e.preventDefault();
    }
  };

  document.addEventListener('copy', onCopy, true);
  return () => document.removeEventListener('copy', onCopy, true);
}
