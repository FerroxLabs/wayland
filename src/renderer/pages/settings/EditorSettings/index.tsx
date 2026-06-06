import { Radio, Select, Switch } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, PreferenceRow } from '@renderer/components/settings/shared';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import { useEditorSettings } from '@renderer/hooks/settings/useEditorSettings';
import type { AutoSaveDelay, EditorDefaultMode } from '@renderer/hooks/settings/useEditorSettings';

const AUTO_SAVE_OPTIONS: { label: string; value: AutoSaveDelay }[] = [
  { label: '0.5s', value: 500 },
  { label: '1s', value: 1000 },
  { label: '1.5s', value: 1500 },
  { label: '3s', value: 3000 },
  { label: 'Off', value: 'off' },
];

const EditorSettings: React.FC = () => {
  const { t } = useTranslation();
  const { settings, update } = useEditorSettings();

  return (
    <SettingsPageShell
      title={t('settings.sider.editor')}
      subtitle={t('settings.editorPage.subtitle', 'How Markdown documents open, save, and render in Wayland.')}
    >
      <Card title={t('settings.editorPage.preferencesTitle')}>
        <PreferenceRow label={t('settings.editorPage.defaultMode')} help={t('settings.editorPage.defaultModeHelp')}>
          <Radio.Group
            value={settings.defaultMode}
            onChange={(v) => update('defaultMode', v as EditorDefaultMode)}
            type='button'
            size='small'
          >
            <Radio value='editor'>{t('settings.editorPage.modeEditor')}</Radio>
            <Radio value='source'>{t('settings.editorPage.modeSource')}</Radio>
            <Radio value='preview'>{t('settings.editorPage.modePreview')}</Radio>
          </Radio.Group>
        </PreferenceRow>

        <PreferenceRow
          label={t('settings.editorPage.autoSaveDelay')}
          help={t('settings.editorPage.autoSaveDelayHelp')}
        >
          <Select
            value={settings.autoSaveDelay}
            onChange={(v) => update('autoSaveDelay', v as AutoSaveDelay)}
            options={AUTO_SAVE_OPTIONS}
            style={{ width: 100 }}
            size='small'
          />
        </PreferenceRow>

        <PreferenceRow
          label={t('settings.editorPage.frontmatter')}
          help={t('settings.editorPage.frontmatterHelp')}
        >
          <Switch checked={settings.preserveFrontmatter} onChange={(v) => update('preserveFrontmatter', v)} />
        </PreferenceRow>

        <PreferenceRow label={t('settings.editorPage.spellCheck')}>
          <Switch checked={settings.spellCheck} onChange={(v) => update('spellCheck', v)} />
        </PreferenceRow>

        <PreferenceRow
          label={t('settings.editorPage.syntaxHighlight')}
          help={t('settings.editorPage.syntaxHighlightHelp')}
        >
          <Switch checked={settings.syntaxHighlight} onChange={(v) => update('syntaxHighlight', v)} />
        </PreferenceRow>
      </Card>
    </SettingsPageShell>
  );
};

export default EditorSettings;
