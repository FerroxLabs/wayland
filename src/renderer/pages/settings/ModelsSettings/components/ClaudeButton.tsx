import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Input, Message, Spin } from '@arco-design/web-react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { AnthropicOAuthResult } from '@/common/types/onboarding';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';

/** Inline Anthropic/Claude burst mark. The monochrome glyph adapts to theme. */
const ClaudeMark: React.FC = () => (
  <svg viewBox='0 0 24 24' width={14} height={14} fill='currentColor' aria-hidden focusable='false'>
    <path d='M12 2c.4 3.6 1.2 5.6 2.9 7.1C16.4 10.8 18.4 11.6 22 12c-3.6.4-5.6 1.2-7.1 2.9C13.2 16.4 12.4 18.4 12 22c-.4-3.6-1.2-5.6-2.9-7.1C7.6 13.2 5.6 12.4 2 12c3.6-.4 5.6-1.2 7.1-2.9C10.8 7.6 11.6 5.6 12 2Z' />
  </svg>
);

/** Map each OAuth failure reason to its inline-message i18n key suffix. */
const ERROR_KEY: Record<Exclude<AnthropicOAuthResult, { ok: true }>['error'], string> = {
  unauthorized: 'claudeUnauthorized',
  'no-credit': 'claudeNoCredit',
  offline: 'claudeOffline',
  cancelled: 'claudeCancelled',
  timeout: 'claudeFailed',
  unknown: 'claudeFailed',
};

/**
 * "Sign in with Claude" - native Anthropic subscription OAuth connect.
 *
 * Wired to `ipcBridge.anthropicAuth.login`, which runs the OAuth 2.0 PKCE flow
 * against `claude.ai` (the same public client Claude Code uses) and persists the
 * subscription bundle as the `claude-subscription` provider. Anthropic's public
 * client is NOT registered for a loopback redirect, so it shows a `code#state`
 * on the console page for the user to copy; the paste box below feeds it back via
 * `anthropicAuth.submitCode`. On success the Claude models become selectable and
 * `~/.claude/.credentials.json` is written so the Claude Code agent runs on the
 * subscription.
 *
 * The note is deliberately honest: Anthropic blocks subscription-OAuth logins
 * inside third-party tools, so a later chat turn can still be rejected even after
 * a successful sign-in.
 */
const ClaudeButton: React.FC = () => {
  const { t } = useTranslation();
  // The Models tree wraps this in a `ModelRegistryProvider`, so `providers` is
  // the shared snapshot that re-renders live on every `modelRegistry.listChanged`
  // event - the connected-state row flips the moment Claude connects.
  const { providers } = useModelRegistry();
  const isClaudeConnected = useMemo(
    () => providers.some((p) => p.providerId === 'claude-subscription' && p.state === 'connected'),
    [providers]
  );
  const [loading, setLoading] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Each sign-in attempt gets a token; a cancelled/superseded flow's pending
  // login promise is ignored so a late timeout can't pop a stale error.
  const flowToken = useRef(0);

  const reset = useCallback(() => {
    setLoading(false);
    setAwaitingCode(false);
    setSubmitting(false);
    setCode('');
  }, []);

  const finish = useCallback(
    (res: AnthropicOAuthResult) => {
      reset();
      if (res.ok) {
        Message.success(t('settings.modelsPage.connect.claudeSuccess', { defaultValue: 'Signed in with Claude' }));
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
    setCode('');
    // Opens the browser to the Anthropic consent page, which shows a code to
    // paste. Not awaited so the paste panel renders immediately; resolves on a
    // pasted code, cancel, or timeout.
    void ipcBridge.anthropicAuth.login
      .invoke()
      .then((res) => {
        if (flowToken.current === token) finish(res);
      })
      .catch(() => {
        if (flowToken.current === token) finish({ ok: false, error: 'unknown' });
      });
  }, [finish]);

  const handleSubmitCode = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const { accepted } = await ipcBridge.anthropicAuth.submitCode.invoke({ code: trimmed });
      if (!accepted) {
        setSubmitting(false);
        Message.error(
          t('settings.modelsPage.connect.claudeCodeNotAccepted', {
            defaultValue: "That code wasn't accepted. Copy it again from the Anthropic page.",
          })
        );
      }
      // When accepted, the login promise resolves through finish() momentarily.
    } catch {
      setSubmitting(false);
      Message.error(t('settings.modelsPage.connect.claudeFailed'));
    }
  }, [code, t]);

  const handleCancel = useCallback(() => {
    flowToken.current++; // invalidate the in-flight login promise
    reset();
  }, [reset]);

  // When Claude is already connected and no sign-in flow is in progress, show a
  // quiet "Signed in with Claude" row instead of the plain CTA so users stop
  // re-clicking it. A small text Reconnect re-runs the same OAuth flow.
  const showConnected = isClaudeConnected && !awaitingCode;

  return (
    <div className='w-full flex flex-col gap-8px'>
      {showConnected ? (
        <div className='w-full box-border flex items-center gap-8px min-h-40px px-14px py-6px rd-2px bg-[var(--color-fill-2)] border border-[var(--color-border-2)] text-14px text-[var(--color-text-2)]'>
          <ClaudeMark />
          <span className='whitespace-nowrap'>
            {t('settings.modelsPage.connect.claudeConnected', { defaultValue: 'Signed in with Claude' })}
          </span>
          <Check size={15} className='shrink-0 text-[var(--color-success-6,#00b42a)]' aria-hidden='true' />
          <div className='flex-1' />
          <Button type='text' size='mini' onClick={handleClick}>
            {t('settings.modelsPage.connect.claudeReconnect', { defaultValue: 'Reconnect' })}
          </Button>
        </div>
      ) : (
        <Button long loading={loading && !awaitingCode} disabled={loading} icon={<ClaudeMark />} onClick={handleClick}>
          {t('settings.modelsPage.connect.claude', { defaultValue: 'Sign in with Claude' })}
        </Button>
      )}
      {awaitingCode && (
        <div className='box-border flex flex-col gap-8px p-10px rd-8px bg-[var(--color-fill-2)] border border-[var(--color-border-2)]'>
          <div className='flex items-center gap-8px text-12px leading-18px text-[var(--color-text-2)]'>
            <Spin size={14} />
            <span>
              {t('settings.modelsPage.connect.claudeWaiting', {
                defaultValue:
                  'Approve the sign-in in the tab that opened, then copy the code Anthropic shows and paste it below.',
              })}
            </span>
          </div>
          <div className='flex flex-col gap-6px pt-6px border-t border-[var(--color-border-2)]'>
            <div className='flex gap-6px items-center'>
              <Input
                value={code}
                onChange={setCode}
                allowClear
                placeholder={t('settings.modelsPage.connect.claudePastePlaceholder', {
                  defaultValue: 'Paste code from claude.ai',
                })}
                onPressEnter={() => void handleSubmitCode()}
              />
              <Button
                type='primary'
                loading={submitting}
                disabled={code.trim().length === 0}
                onClick={() => void handleSubmitCode()}
              >
                {t('settings.modelsPage.connect.claudePasteSubmit', { defaultValue: 'Finish' })}
              </Button>
            </div>
          </div>
          <div>
            <Button type='text' size='mini' onClick={handleCancel}>
              {t('settings.modelsPage.connect.claudePasteCancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </div>
      )}
      <div className='text-12px text-[var(--color-text-3)]'>
        {t('settings.modelsPage.connect.claudeNote', {
          defaultValue:
            'Signs in with your Claude Pro/Max subscription (the same path Claude Code uses). Anthropic may restrict subscription use inside third-party apps, so some chats may be rejected.',
        })}
      </div>
    </div>
  );
};

export default ClaudeButton;
