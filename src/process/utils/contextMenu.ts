/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WebContents } from 'electron';
import { BrowserWindow, Menu, MenuItem } from 'electron';

/**
 * Wire a native context menu (right-click) for a webContents.
 *
 * Electron ships no default right-click menu, so without this there is no way to
 * Paste an API key or Copy text via the mouse (#523). The menu is built from the
 * hit-test `params` so it only offers actions that make sense at the click point:
 * editable inputs get Cut/Copy/Paste/Select All + spellcheck suggestions; a plain
 * text selection gets Copy; a right-click on empty, non-editable chrome shows no
 * menu at all (rather than a useless empty one).
 *
 * Copy uses `role: 'copy'`, which fires the DOM copy event that the renderer's
 * shadow-copy handler intercepts, so copying agent messages (rendered inside an
 * open shadow root) works here too.
 *
 * This is intentionally attached to every webContents, including untrusted guest
 * `<webview>`s: the menu only ever exposes cut/copy/paste/selectAll/spellcheck
 * gated on `editFlags` (no devtools / navigation / open-external), and Paste into
 * a guest input is already reachable via Ctrl+V, so it adds no new capability.
 */
export function attachContextMenu(contents: WebContents): void {
  contents.on('context-menu', (_event, params) => {
    const menu = new Menu();
    const { editFlags, isEditable, selectionText, dictionarySuggestions, misspelledWord } = params;
    // Use Chromium's own `canCopy` for the Copy/Select-All gating: it reflects the
    // frame selection (which includes open shadow-root selections) whereas
    // `selectionText` can be empty for a selection that lives in a shadow root.
    const hasSelection = editFlags.canCopy || selectionText.trim().length > 0;

    // Spellcheck suggestions for a misspelled word under the cursor.
    if (isEditable && misspelledWord) {
      if (dictionarySuggestions.length === 0) {
        menu.append(new MenuItem({ label: 'No suggestions', enabled: false }));
      } else {
        for (const suggestion of dictionarySuggestions) {
          menu.append(new MenuItem({ label: suggestion, click: () => contents.replaceMisspelling(suggestion) }));
        }
      }
      menu.append(
        new MenuItem({
          label: 'Add to Dictionary',
          click: () => contents.session.addWordToSpellCheckerDictionary(misspelledWord),
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    if (isEditable && editFlags.canCut) menu.append(new MenuItem({ role: 'cut' }));
    if (hasSelection && editFlags.canCopy) menu.append(new MenuItem({ role: 'copy' }));
    if (isEditable && editFlags.canPaste) menu.append(new MenuItem({ role: 'paste' }));

    if ((isEditable || hasSelection) && editFlags.canSelectAll) {
      if (menu.items.length > 0) menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ role: 'selectAll' }));
    }

    // Nothing actionable at this point (e.g. right-click on empty chrome).
    if (menu.items.length === 0) return;

    const window = BrowserWindow.fromWebContents(contents) ?? undefined;
    menu.popup({ window });
  });
}
