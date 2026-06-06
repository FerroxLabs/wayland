import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from '@arco-design/web-react';
import { channel } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import type { IProvider, TProviderWithModel } from '@/common/config/storage';
import { useModelProviderList } from '@renderer/hooks/agent/useModelProviderList';
import { useGeminiModelSelection } from '@renderer/pages/conversation/platforms/gemini/useGeminiModelSelection';
import type { GeminiModelSelection } from '@renderer/pages/conversation/platforms/gemini/useGeminiModelSelection';

type ChannelModelConfigKey =
  | 'assistant.telegram.defaultModel'
  | 'assistant.lark.defaultModel'
  | 'assistant.dingtalk.defaultModel'
  | 'assistant.weixin.defaultModel'
  | 'assistant.wecom.defaultModel';

/**
 * Wraps useGeminiModelSelection with ConfigStorage persistence for a specific channel config key.
 * Mirrors the internal hook from ChannelModalContent - extracted here for use in detail pages.
 */
export const useChannelModelSelection = (configKey: ChannelModelConfigKey): GeminiModelSelection => {
  const { t } = useTranslation();
  const { providers } = useModelProviderList();
  const [resolvedInitialModel, setResolvedInitialModel] = useState<TProviderWithModel | undefined>(undefined);
  const [restored, setRestored] = useState(false);
  const retryCountRef = useRef(0);
  const MAX_RESTORE_RETRIES = 5;

  useEffect(() => {
    if (restored || providers.length === 0) return;

    const restore = async () => {
      try {
        const saved = (await ConfigStorage.get(configKey)) as { id: string; useModel: string } | undefined;
        if (!saved?.id || !saved?.useModel) {
          setRestored(true);
          return;
        }

        const provider = providers.find((p) => p.id === saved.id);
        if (!provider) {
          retryCountRef.current += 1;
          if (retryCountRef.current >= MAX_RESTORE_RETRIES) {
            setRestored(true);
          }
          return;
        }

        const isGoogleAuth = provider.platform?.toLowerCase().includes('gemini-with-google-auth');
        if (isGoogleAuth || provider.model?.includes(saved.useModel)) {
          setResolvedInitialModel({ ...provider, useModel: saved.useModel } as TProviderWithModel);
        }
        setRestored(true);
      } catch (error) {
        console.error(`[useChannelModelSelection] Failed to restore model for ${configKey}:`, error);
        setRestored(true);
      }
    };

    void restore();
  }, [configKey, providers, restored]);

  const onSelectModel = useCallback(
    async (provider: IProvider, modelName: string) => {
      try {
        const modelRef = { id: provider.id, useModel: modelName };
        await ConfigStorage.set(configKey, modelRef);

        const platform = configKey.replace('assistant.', '').replace('.defaultModel', '') as
          | 'telegram'
          | 'lark'
          | 'dingtalk'
          | 'weixin'
          | 'wecom';
        const agentKey = `assistant.${platform}.agent` as const;
        const currentAgent = await ConfigStorage.get(agentKey);
        await channel.syncChannelSettings
          .invoke({
            platform,
            agent: (currentAgent as { backend: string; customAgentId?: string; name?: string }) || { backend: 'gemini' },
            model: modelRef,
          })
          .catch((err) => console.warn(`[useChannelModelSelection] syncChannelSettings failed for ${platform}:`, err));

        Message.success(t('settings.assistant.modelSwitched', 'Model switched successfully'));
        return true;
      } catch (error) {
        console.error(`[useChannelModelSelection] Failed to save model for ${configKey}:`, error);
        Message.error(t('settings.assistant.modelSaveFailed', 'Failed to save model'));
        return false;
      }
    },
    [configKey, t]
  );

  return useGeminiModelSelection({ initialModel: resolvedInitialModel, onSelectModel });
};
