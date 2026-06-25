import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Input, Message, Spin } from '@arco-design/web-react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { XaiOAuthResult } from '@/common/types/onboarding';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';

/** Inline X (formerly Twitter) wordmark. The monochrome glyph adapts to theme. */
const XMark: React.FC = () => (
  <svg viewBox='0 0 24 24' width={14} height={14} fill='currentColor' aria-hidden focusable='false'>
    <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.967 6.817H1.677l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z' />
  </svg>
);

/** Map each OAuth failure reason to its inline-message i18n key suffix. */
const ERROR_KEY: Record<Exclude<XaiOAuthResult, { ok: true }>['error'], string> = {
  unauthorized: 'xaiUnauthorized',
  'no-credit': 'xaiNoCredit',
  offline: 'xaiOffline',
  cancelled: 'xaiCancelled',
  timeout: 'xaiFailed',
  unknown: 'xaiFailed',
};

/** Reveal the manual paste fallback only if the loopback hasn't auto-completed. */
const PASTE_FALLBACK_DELAY_MS = 12_000;

/**
 * "Sign in with X (Grok)" - native xAI OAuth connect.
 *
 * Wired to `ipcBridge.xaiAuth.login`, which runs the OAuth 2.0 PKCE flow against
 * `accounts.x.ai` and persists the bearer token through the model-registry
 * connect path as the `xai` provider. In practice xAI delivers the code to our
 * loopback automatically a few seconds after the browser opens, so the normal
 * path is a brief "finishing in your browser" wait. As a fallback (if the
 * loopback never fires), after a short delay we reveal a box to paste the code
 * the xAI page shows; submitting it (`xaiAuth.submitCode`) completes the same flow.
 */
const XGrokButton: React.FC = () => {
  const { t } = useTranslation();
  // The Models tree wraps this in a `ModelRegistryProvider`, so `providers` is
  // the shared snapshot that re-renders live on every `modelRegistry.listChanged`
  // event - the connected-state row flips the moment xAI connects / disconnects.
  const { providers } = useModelRegistry();
  const isXaiConnected = useMemo(
    () => providers.some((p) => p.providerId === 'xai' && p.state === 'connected'),
    [providers]
  );
  const [loading, setLoading] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Each sign-in attempt gets a token; a cancelled/superseded flow's pending
  // login promise is ignored so a late timeout can't pop a stale error.
  const flowToken = useRef(0);
  const pasteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPasteTimer = useCallback(() => {
    if (pasteTimer.current) {
      clearTimeout(pasteTimer.current);
      pasteTimer.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearPasteTimer();
    setLoading(false);
    setAwaitingCode(false);
    setShowPaste(false);
    setSubmitting(false);
    setCode('');
  }, [clearPasteTimer]);

  const finish = useCallback(
    (res: XaiOAuthResult) => {
      reset();
      if (res.ok) {
        Message.success(
          res.reused ? t('settings.modelsPage.connect.xaiReused') : t('settings.modelsPage.connect.xaiSuccess')
        );
      } else if ('error' in res) {
        Message.error(t(`settings.modelsPage.connect.${ERROR_KEY[res.error]}`));
      }
    },
    [reset, t]
  );

  const handleClick = useCallback(() => {
    const token = ++flowToken.current;
    setLoading(true);
    setAwaitingCode(true);
    setShowPaste(false);
    setCode('');
    clearPasteTimer();
    pasteTimer.current = setTimeout(() => setShowPaste(true), PASTE_FALLBACK_DELAY_MS);
    // Opens the browser + starts the loopback. xAI usually delivers the code to
    // the loopback within a few seconds; resolves then (or on a pasted code, or
    // timeout). Not awaited so the waiting panel shows immediately.
    void ipcBridge.xaiAuth.login
      .invoke()
      .then((res) => {
        if (flowToken.current === token) finish(res);
      })
      .catch(() => {
        if (flowToken.current === token) finish({ ok: false, error: 'unknown' });
      });
  }, [clearPasteTimer, finish]);

  const handleSubmitCode = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const { accepted } = await ipcBridge.xaiAuth.submitCode.invoke({ code: trimmed });
      if (!accepted) {
        setSubmitting(false);
        Message.error(t('settings.modelsPage.connect.xaiCodeNotAccepted'));
      }
      // When accepted, the login promise resolves through finish() momentarily.
    } catch {
      setSubmitting(false);
      Message.error(t('settings.modelsPage.connect.xaiFailed'));
    }
  }, [code, t]);

  const handleCancel = useCallback(() => {
    flowToken.current++; // invalidate the in-flight login promise
    reset();
  }, [reset]);

  // When xAI is already connected and no sign-in flow is in progress, show a
  // quiet "Signed in with X" row instead of the plain CTA so users stop
  // re-clicking it. A small text Reconnect re-runs the same OAuth flow.
  const showConnected = isXaiConnected && !awaitingCode;

  return (
    <div className='w-full flex flex-col gap-8px'>
      {showConnected ? (
        <div className='w-full box-border flex items-center gap-8px min-h-40px px-14px py-6px rd-2px bg-[var(--color-fill-2)] border border-[var(--color-border-2)] text-14px text-[var(--color-text-2)]'>
          <XMark />
          <span className='whitespace-nowrap'>{t('settings.modelsPage.connect.xaiConnected')}</span>
          <Check size={15} className='shrink-0 text-[var(--color-success-6,#00b42a)]' aria-hidden='true' />
          <div className='flex-1' />
          <Button type='text' size='mini' onClick={handleClick}>
            {t('settings.modelsPage.connect.xaiReconnect')}
          </Button>
        </div>
      ) : (
        <Button long loading={loading && !awaitingCode} disabled={loading} icon={<XMark />} onClick={handleClick}>
          {t('settings.modelsPage.connect.xai')}
        </Button>
      )}
      {awaitingCode && (
        <div className='box-border flex flex-col gap-8px p-10px rd-8px bg-[var(--color-fill-2)] border border-[var(--color-border-2)]'>
          <div className='flex items-center gap-8px text-12px leading-18px text-[var(--color-text-2)]'>
            <Spin size={14} />
            <span>
              {t('settings.modelsPage.connect.xaiWaiting', {
                defaultValue: 'Finishing sign-in in your browser. Approve it in the tab that opened - this completes on its own.',
              })}
            </span>
          </div>
          {showPaste && (
            <div className='flex flex-col gap-6px pt-6px border-t border-[var(--color-border-2)]'>
              <div className='text-12px leading-18px text-[var(--color-text-3)]'>
                {t('settings.modelsPage.connect.xaiPasteHint', {
                  defaultValue: 'Taking a while? Copy the code from the x.ai page and paste it here to finish.',
                })}
              </div>
              <div className='flex gap-6px items-center'>
                <Input
                  value={code}
                  onChange={setCode}
                  allowClear
                  placeholder={t('settings.modelsPage.connect.xaiPastePlaceholder', { defaultValue: 'Paste code from x.ai' })}
                  onPressEnter={() => void handleSubmitCode()}
                />
                <Button type='primary' loading={submitting} disabled={code.trim().length === 0} onClick={() => void handleSubmitCode()}>
                  {t('settings.modelsPage.connect.xaiPasteSubmit', { defaultValue: 'Finish' })}
                </Button>
              </div>
            </div>
          )}
          <div>
            <Button type='text' size='mini' onClick={handleCancel}>
              {t('settings.modelsPage.connect.xaiPasteCancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default XGrokButton;
