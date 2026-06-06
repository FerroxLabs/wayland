/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Button } from '@arco-design/web-react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import { INTENTS, type IntentKey, type IntentPrompt } from '../../intents';
import styles from './IntentSuggestionPanel.module.css';

export type IntentSuggestionPanelProps = {
  /** Intent whose prompts should be shown. */
  intent: IntentKey;
  /** Fires when the user picks a prompt - caller fills input + routes assistant. */
  onSelect: (prompt: IntentPrompt) => void;
  /** Fires when the close button is clicked. */
  onClose: () => void;
};

type ExtensionAssistantSummary = { id?: unknown; name?: unknown };

const PRESET_NAME_LOOKUP: Record<string, string> = (() => {
  const lookup: Record<string, string> = {};
  for (const preset of ASSISTANT_PRESETS) {
    lookup[preset.id] = preset.nameI18n['en-US'] ?? preset.id;
  }
  return lookup;
})();

const IntentSuggestionPanel: React.FC<IntentSuggestionPanelProps> = ({ intent, onSelect, onClose }) => {
  const { t } = useTranslation();
  const def = INTENTS[intent];

  const { data: extensionAssistants } = useSWR(
    'extensions.assistants',
    () => ipcBridge.extensions.getAssistants.invoke().catch(() => [] as Record<string, unknown>[])
  );

  const nameLookup = useMemo(() => {
    const lookup: Record<string, string> = { ...PRESET_NAME_LOOKUP };
    for (const ext of (extensionAssistants ?? []) as ExtensionAssistantSummary[]) {
      const id = typeof ext.id === 'string' ? ext.id : undefined;
      if (!id) continue;
      if (lookup[id]) continue;
      const name = typeof ext.name === 'string' && ext.name.length > 0 ? ext.name : id;
      lookup[id] = name;
    }
    return lookup;
  }, [extensionAssistants]);

  const intentLabel = t(`guid.newChat.intent.${intent}`, { defaultValue: def.label });

  return (
    <section
      className={styles.panel}
      data-testid='intent-suggestion-panel'
      data-intent={intent}
      aria-label={t('guid.newChat.suggestionPanel.label', {
        defaultValue: '{{label}} starter prompts',
        label: intentLabel,
      })}
    >
      <header className={styles.header}>
        <span className={styles.title}>
          {t('guid.newChat.suggestionPanel.heading', {
            defaultValue: 'Start with {{label}}',
            label: intentLabel,
          })}
        </span>
        <Button
          size='mini'
          type='text'
          icon={<X size={14} />}
          onClick={onClose}
          aria-label={t('guid.newChat.suggestionPanel.close', { defaultValue: 'Close suggestions' })}
        />
      </header>
      <ul className={styles.promptList}>
        {def.prompts.map((prompt, idx) => {
          const assistantName = nameLookup[prompt.targetAssistantId] ?? prompt.targetAssistantId;
          return (
            <li key={`${prompt.targetAssistantId}:${idx}`}>
              <button
                type='button'
                className={styles.promptRow}
                data-testid='intent-suggestion-row'
                data-target-assistant-id={prompt.targetAssistantId}
                onClick={() => onSelect(prompt)}
              >
                <span className={styles.promptTitle}>{prompt.title}</span>
                <span className={styles.promptText}>{prompt.promptText}</span>
                <span className={styles.promptMeta}>
                  <span className={styles.metaDot} aria-hidden='true' />
                  <span className={styles.metaArrow} aria-hidden='true'>
                    →
                  </span>
                  <span className={styles.metaAssistant}>{assistantName}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default IntentSuggestionPanel;
