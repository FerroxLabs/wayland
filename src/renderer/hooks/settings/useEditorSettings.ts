import { useCallback, useState } from 'react';

export type EditorDefaultMode = 'editor' | 'source' | 'preview';
export type AutoSaveDelay = 500 | 1000 | 1500 | 3000 | 'off';

export type EditorSettings = {
  defaultMode: EditorDefaultMode;
  autoSaveDelay: AutoSaveDelay;
  preserveFrontmatter: boolean;
  spellCheck: boolean;
  syntaxHighlight: boolean;
};

const STORAGE_KEY = 'wayland.editor.settings';

const DEFAULTS: EditorSettings = {
  defaultMode: 'editor',
  autoSaveDelay: 1500,
  preserveFrontmatter: true,
  spellCheck: false,
  syntaxHighlight: false,
};

function load(): EditorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<EditorSettings>) };
  } catch {
    return DEFAULTS;
  }
}

function save(settings: EditorSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(load);

  const update = useCallback(<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      save(next);
      return next;
    });
  }, []);

  return { settings, update };
}
