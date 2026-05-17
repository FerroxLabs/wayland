/**
 * ModelNicknameInput — inline edit affordance for model display names.
 *
 * Usage (from W2B's ProviderConnectionCard model row):
 *
 *   <ModelNicknameInput
 *     providerId={provider.providerId}
 *     modelId={model.modelId}
 *     currentNickname={nicknames[model.modelId]}
 *     fallbackLabel={ModelDisplayNames.humanise(model.modelId)}
 *   />
 *
 * The component renders the display name as plain text. Clicking it switches
 * to an Arco Input; blur or Enter saves; Escape cancels.
 *
 * Nicknames take precedence over ModelDisplayNames.humanise() output — the
 * parent reads nicknames via ipcBridge.providers.getDisplayNames and passes
 * the per-model value as `currentNickname`.
 *
 * TODO(W2B+W2D merge): wire this into ProviderConnectionCard's model row
 * once W2B lands its <ModelRow> component.
 */
import { Input } from '@arco-design/web-react';
import type { RefInputType } from '@arco-design/web-react/es/Input/interface';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { providerNicknames } from '@/common/adapter/ipcBridge';

type Props = {
  providerId: string;
  modelId: string;
  /** Current persisted nickname (undefined = none saved). */
  currentNickname?: string;
  /** Fallback label shown when no nickname is set (e.g. ModelDisplayNames.humanise()). */
  fallbackLabel: string;
};

const ModelNicknameInput: React.FC<Props> = ({ providerId, modelId, currentNickname, fallbackLabel }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<RefInputType>(null);

  const startEdit = useCallback(() => {
    setDraft(currentNickname ?? '');
    setEditing(true);
    // Focus after state flushes
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [currentNickname]);

  const save = useCallback(() => {
    void providerNicknames.setDisplayName.invoke({ providerId, modelId, nickname: draft }).then(() => {
      setEditing(false);
    });
  }, [providerId, modelId, draft]);

  const cancel = useCallback(() => {
    setEditing(false);
  }, []);

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={setDraft}
        onBlur={save}
        onPressEnter={save}
        placeholder={t('settings.providers.nicknames.placeholder')}
        size='mini'
        style={{ width: 160 }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel();
        }}
      />
    );
  }

  return (
    <button
      type='button'
      title={t('settings.providers.nicknames.placeholder')}
      className='text-13px text-[var(--text-primary)] hover:underline cursor-text bg-transparent border-none p-0 text-left'
      onClick={startEdit}
    >
      {currentNickname || fallbackLabel}
    </button>
  );
};

export default ModelNicknameInput;
