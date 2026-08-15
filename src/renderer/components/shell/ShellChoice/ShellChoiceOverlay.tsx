/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Modal } from '@arco-design/web-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfigStorage } from '@/common/config/storage';
import type { ShellExperience } from '@/common/shellExperience';
import { useShellExperience } from '@renderer/hooks/ui/useShellExperience';
import { hasBeenPromptedForShell, markShellChoicePrompted } from '@renderer/utils/ui/shellChoice';
import ShellChoiceCards from './ShellChoiceCards';

/**
 * One-time Classic / Cockpit prompt for EXISTING installs.
 *
 * New users meet this choice as a step inside first-run onboarding. Anyone who
 * already finished onboarding never sees that flow again, so without this they
 * would stay on Classic forever and never learn Cockpit exists — it is otherwise
 * only reachable from Settings > Navigation.
 *
 * Deliberately kept to a single dismissible prompt. This choice previously had a
 * cohort ceremony (consent panel, return-reason survey, observation window) that
 * was removed on purpose; this is discovery, not a gate, and it must not grow
 * back into one. Whatever the user does — pick either shell, or close it — the
 * prompt is recorded as shown and never returns.
 *
 * Mounted next to OnboardingOverlay so it lands post-auth and cannot flash over
 * the login screen.
 */
const ShellChoiceOverlay: React.FC = () => {
  const { t } = useTranslation();
  const { shell, setShell } = useShellExperience();
  // `null` = not yet resolved. Gate rendering on this so the prompt never
  // flashes before we know whether it was already answered.
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<ShellExperience>('classic');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [prompted, onboarded] = await Promise.all([
          hasBeenPromptedForShell(),
          // Only EXISTING installs get this surface; a first-run user is served
          // the same choice inside the onboarding flow, and showing both would
          // ask the same question twice in one session.
          ConfigStorage.get('onboardingCompleted')
            .then(Boolean)
            .catch(() => false),
        ]);
        if (!cancelled) setEligible(!prompted && onboarded);
      } catch {
        // Fail closed: never interrupt a returning user on a broken read.
        if (!cancelled) setEligible(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Open exactly once. Without the latch this effect re-fires on every `shell`
  // change — including the one our own confirm causes — which reopens the modal
  // the moment the user picks Cockpit.
  const openedOnce = useRef(false);
  useEffect(() => {
    if (!eligible || openedOnce.current) return;
    openedOnce.current = true;
    setPending(shell);
    setOpen(true);
  }, [eligible, shell]);

  const close = useCallback(() => {
    setOpen(false);
    setEligible(false);
    void markShellChoicePrompted();
  }, []);

  /**
   * Close first, persist after.
   *
   * The close must not be downstream of the shell write: `setShell` awaits a
   * rollout read after the preference lands, so awaiting it leaves the modal on
   * screen over an app that has already visibly switched. The user has answered
   * either way — `close()` records that — and a failed write just leaves them on
   * their current shell with Settings > Navigation still available.
   */
  const confirm = useCallback(() => {
    const choice = pending;
    close();
    if (choice !== shell) void setShell(choice).catch((): void => undefined);
  }, [pending, shell, setShell, close]);

  if (!open) return null;

  return (
    <Modal
      visible={open}
      title={t('shellChoice.prompt.title', { defaultValue: 'Try the new Cockpit layout?' })}
      onCancel={close}
      maskClosable={false}
      style={{ width: 'min(760px, 94vw)' }}
      footer={
        <div className='flex justify-end gap-8px'>
          <Button onClick={close}>{t('shellChoice.prompt.later', { defaultValue: 'Not now' })}</Button>
          <Button type='primary' onClick={confirm}>
            {t('shellChoice.prompt.confirm', { defaultValue: 'Use this layout' })}
          </Button>
        </div>
      }
    >
      <p data-testid='shell-choice-prompt' className='mb-16px text-[var(--color-text-2)]'>
        {t('shellChoice.prompt.body', {
          defaultValue:
            'Cockpit is a new layout over the same chats, projects and settings — nothing moves or is deleted. You can switch back any time in Settings > Navigation.',
        })}
      </p>
      <ShellChoiceCards value={pending} onChange={setPending} />
    </Modal>
  );
};

export default ShellChoiceOverlay;
