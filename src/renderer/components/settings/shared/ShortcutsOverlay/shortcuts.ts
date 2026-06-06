/**
 * Declarative registry of keyboard shortcuts shown in the ShortcutsOverlay.
 * keys: human-readable key names displayed in <kbd> elements.
 * i18nKey: translation key under settings.shortcuts.*
 */

export type ShortcutEntry = {
  keys: string[];
  i18nKey: string;
};

const SHORTCUTS: ShortcutEntry[] = [
  { keys: ['⌘K', 'Ctrl+K'], i18nKey: 'settings.shortcuts.openPalette' },
  { keys: ['?'], i18nKey: 'settings.shortcuts.showShortcuts' },
  { keys: ['↑', '↓'], i18nKey: 'settings.shortcuts.navigateResults' },
  { keys: ['↵'], i18nKey: 'settings.shortcuts.selectResult' },
  { keys: ['Esc'], i18nKey: 'settings.shortcuts.close' },
];

export default SHORTCUTS;
