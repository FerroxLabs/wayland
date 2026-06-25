import React, { useCallback, useMemo, useState } from 'react';
import { Button, Message } from '@arco-design/web-react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { ChatGptOAuthResult } from '@/common/types/onboarding';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';

/** Inline OpenAI wordmark. The monochrome glyph adapts to theme. */
const OpenAiMark: React.FC = () => (
  <svg viewBox='0 0 24 24' width={14} height={14} fill='currentColor' aria-hidden focusable='false'>
    <path d='M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 22.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z' />
  </svg>
);

/** Map each OAuth failure reason to its inline-message i18n key suffix. */
const ERROR_KEY: Record<Exclude<ChatGptOAuthResult, { ok: true }>['error'], string> = {
  unauthorized: 'chatgptUnauthorized',
  'no-credit': 'chatgptNoCredit',
  offline: 'chatgptOffline',
  cancelled: 'chatgptCancelled',
  timeout: 'chatgptFailed',
  unknown: 'chatgptFailed',
};

/**
 * "Sign in with ChatGPT" - native OpenAI subscription OAuth connect.
 *
 * Wired to `ipcBridge.chatgptAuth.login`, which runs the OAuth 2.0 PKCE flow
 * against `auth.openai.com` (the same path the Codex CLI uses) and persists the
 * subscription bundle as the `chatgpt-subscription` provider. On success the
 * home picker / model selection can use the ChatGPT models via the user's
 * subscription - no API key, no `codex` CLI on PATH.
 *
 * The hint below is deliberately calm: it tells the user this signs in with their
 * ChatGPT subscription via the same path the Codex CLI uses, and that OpenAI may
 * change or restrict it.
 */
const ChatGptButton: React.FC = () => {
  const { t } = useTranslation();
  // The Models tree wraps this in a `ModelRegistryProvider`, so `providers` is
  // the shared snapshot that re-renders live on every `modelRegistry.listChanged`
  // event - the connected-state row flips the moment ChatGPT connects.
  const { providers } = useModelRegistry();
  const isChatGptConnected = useMemo(
    () => providers.some((p) => p.providerId === 'chatgpt-subscription' && p.state === 'connected'),
    [providers]
  );
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const res: ChatGptOAuthResult = await ipcBridge.chatgptAuth.login.invoke();
      if (res.ok) {
        Message.success(t('settings.modelsPage.connect.chatgptSuccess'));
        return;
      }
      if ('error' in res) {
        Message.error(t(`settings.modelsPage.connect.${ERROR_KEY[res.error]}`));
      }
    } catch {
      Message.error(t('settings.modelsPage.connect.chatgptFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // When ChatGPT is already connected, show a quiet "Signed in with ChatGPT" row
  // instead of the plain CTA so users stop re-clicking it. A small text Reconnect
  // re-runs the same OAuth flow (refreshes the token).
  if (isChatGptConnected && !loading) {
    return (
      <div className='w-full box-border flex items-center gap-8px min-h-40px px-14px py-6px rd-2px bg-[var(--color-fill-2)] border border-[var(--color-border-2)] text-14px text-[var(--color-text-2)]'>
        <OpenAiMark />
        <span className='whitespace-nowrap'>{t('settings.modelsPage.connect.chatgptConnected')}</span>
        <Check size={15} className='shrink-0 text-[var(--color-success-6,#00b42a)]' aria-hidden='true' />
        <div className='flex-1' />
        <Button type='text' size='mini' onClick={() => void handleClick()}>
          {t('settings.modelsPage.connect.chatgptReconnect')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button long loading={loading} icon={<OpenAiMark />} onClick={() => void handleClick()}>
        {t('settings.modelsPage.connect.chatgpt')}
      </Button>
      <div className='mt-1 text-12px text-[var(--color-text-3)]'>{t('settings.modelsPage.connect.chatgptNote')}</div>
    </>
  );
};

export default ChatGptButton;
