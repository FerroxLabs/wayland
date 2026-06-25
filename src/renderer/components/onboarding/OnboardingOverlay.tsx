/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Modal } from '@arco-design/web-react';
import React, { useCallback, useEffect, useState } from 'react';
import { ConfigStorage } from '@/common/config/storage';
import { useOnboardingDetection } from '@renderer/hooks/useOnboardingDetection';
import OnboardingFlow from './OnboardingFlow';
import styles from './OnboardingOverlay.module.css';

/**
 * Synchronous local marker mirrored alongside the async bridge flag. localStorage
 * is always-local (even in headless mode) and synchronous, so it durably records
 * a dismiss even if the cross-process `ConfigStorage.set` write never lands.
 */
const LOCAL_MARKER_KEY = 'onboardingCompleted';

const readLocalMarker = (): boolean => {
  try {
    return localStorage.getItem(LOCAL_MARKER_KEY) === '1';
  } catch {
    return false;
  }
};

const writeLocalMarker = (): void => {
  try {
    localStorage.setItem(LOCAL_MARKER_KEY, '1');
  } catch {
    // No localStorage (or quota) — bridge flag remains the source of truth.
  }
};

/**
 * First-run onboarding overlay.
 *
 * Shows once on first launch: gated on `ConfigStorage.onboardingCompleted`.
 * Renders the scenario (A/B/C/D) chosen from live detection, lets the user
 * connect Flux Router or skip, then sets the flag so it never shows again.
 *
 * Mounted inside `ProtectedLayout` (post-auth) so unauthenticated cold boots
 * land on /login without the overlay flashing over the login screen.
 */
const OnboardingOverlay: React.FC = () => {
  const { detection, loading: detecting } = useOnboardingDetection();
  // `null` = flag not yet read; gate the overlay behind this so it never
  // flashes before we know whether onboarding was already completed.
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Synchronous local marker wins immediately: if a prior dismiss landed in
    // localStorage, treat onboarding as completed without waiting on (or
    // depending on) the cross-process bridge read.
    if (readLocalMarker()) {
      setCompleted(true);
      return;
    }
    ConfigStorage.get('onboardingCompleted')
      .then((value) => {
        if (!cancelled) setCompleted(Boolean(value) || readLocalMarker());
      })
      .catch(() => {
        // On read failure, fail safe: treat as completed so we never block a
        // returning user behind a broken overlay.
        if (!cancelled) setCompleted(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Open exactly once, when both the flag and detection have resolved and the
  // user has not completed onboarding yet.
  useEffect(() => {
    if (completed === false && !detecting && detection) {
      setOpen(true);
    }
  }, [completed, detecting, detection]);

  const dismiss = useCallback(() => {
    setOpen(false);
    setCompleted(true);
    // Always record the synchronous, always-local marker first so a fresh boot
    // never re-opens the overlay even if the bridge write below never durably
    // lands (the headless-arm64 reopen gap, issue #8).
    writeLocalMarker();
    void ConfigStorage.set('onboardingCompleted', true).catch(() => {
      // Bridge write failed — retry once. The localStorage marker already
      // covers the cross-restart case; this just best-effort syncs the bridge.
      void ConfigStorage.set('onboardingCompleted', true).catch(() => {});
    });
  }, []);

  if (completed !== false || detecting || !detection || !open) {
    return null;
  }

  return (
    <Modal
      visible={open}
      footer={null}
      closable={false}
      maskClosable={false}
      escToExit={false}
      onCancel={dismiss}
      className={`${styles.modal} w-[920px] max-w-[94vw]`}
      style={{ width: 'min(920px, 94vw)' }}
    >
      <OnboardingFlow detection={detection} onFinish={dismiss} />
    </Modal>
  );
};

export default OnboardingOverlay;
