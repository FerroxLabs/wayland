/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { ConfigStorage } from '@/common/config/storage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { getGeminiModeList, type GeminiModeOption } from './useModeModeList';

export interface GeminiGoogleAuthModelResult {
  geminiModeOptions: GeminiModeOption[];
  isGoogleAuth: boolean;
  subscriptionStatus?: {
    isSubscriber: boolean;
    tier?: string;
    lastChecked: number;
    message?: string;
  };
}

export const useGeminiGoogleAuthModels = (): GeminiGoogleAuthModelResult => {
  const { t } = useTranslation();
  const { data: geminiConfig } = useSWR('gemini.config', () => ConfigStorage.get('gemini.config'));
  const proxyKey = geminiConfig?.proxy || '';

  // Check whether Google Auth CLI is ready.
  const { data: isGoogleAuth } = useSWR('google.auth.status' + proxyKey, async () => {
    const data = await ipcBridge.googleAuth.status.invoke({ proxy: geminiConfig?.proxy });
    return data.success;
  });

  const shouldCheckSubscription = Boolean(isGoogleAuth);

  // Only hit CLI subscription API when authenticated.
  const subscriptionKey = shouldCheckSubscription ? 'gemini.subscription.status' + proxyKey : null;
  const { data: subscriptionResponse } = useSWR(subscriptionKey, () => {
    return ipcBridge.gemini.subscriptionStatus.invoke({ proxy: geminiConfig?.proxy });
  });

  // Generate model list matching terminal CLI
  const descriptions = useMemo(
    () => ({
      autoGemini3: t(
        'gemini.mode.autoGemini3Desc',
        'Let Gemini CLI decide the best model for the task: gemini-3.1-pro-preview, gemini-3-flash'
      ),
      autoGemini25: t(
        'gemini.mode.autoGemini25Desc',
        'Let Gemini CLI decide the best model for the task: gemini-2.5-pro, gemini-2.5-flash'
      ),
      manual: t('gemini.mode.manualDesc', 'Manually select a model'),
    }),
    [t]
  );
  const geminiModeOptions = useMemo(() => getGeminiModeList({ descriptions }), [descriptions]);

  return {
    geminiModeOptions,
    isGoogleAuth: Boolean(isGoogleAuth),
    subscriptionStatus: subscriptionResponse?.data,
  };
};
