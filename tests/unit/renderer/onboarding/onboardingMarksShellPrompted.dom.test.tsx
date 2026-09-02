/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * A brand-new install must never be ambushed by "Try the new Cockpit layout?".
 *
 * `ShellChoiceOverlay` opens on `!promptedForShell && onboardingCompleted`, so
 * onboarding owns the other half of that pair. It used to mark the flag ONLY
 * inside `finishLayout` (the layout screen's own Continue), which meant any
 * other way out of the wizard set `onboardingCompleted` and left the flag
 * unset - and launch two opened blocked by that modal.
 *
 * Measured on a fresh profile before the fix: wizard completed,
 * `onboardingCompleted: true`, NO `ui.shellChoicePrompted` key at all, and the
 * second launch came up behind the Cockpit prompt. For a Masterclass buyer
 * that lands mid-guide, and picking Cockpit renames the sidebar entries the
 * guide tells them to click.
 *
 * The contract asserted here is the pairing itself: whatever route completes
 * onboarding, both flags move together.
 */

import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DetectionResult } from '@/common/types/onboarding';

const markShellChoicePrompted = vi.fn().mockResolvedValue(undefined);
const configSet = vi.fn().mockResolvedValue(undefined);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn().mockResolvedValue(undefined),
    set: (...args: unknown[]) => configSet(...args),
  },
}));

vi.mock('@renderer/utils/ui/shellChoice', () => ({
  markShellChoicePrompted: () => markShellChoicePrompted(),
  hasBeenPromptedForShell: vi.fn().mockResolvedValue(false),
}));

const detection: DetectionResult = {
  name: 'Matty',
  clis: [],
  agents: [],
  envKeys: [],
  ollama: { running: false, models: [] },
  fluxConnected: false,
  claudePro: false,
} as unknown as DetectionResult;

vi.mock('@renderer/hooks/useOnboardingDetection', () => ({
  useOnboardingDetection: () => ({ detection, loading: false }),
}));

/** Render the real overlay, then drive its dismiss the way every exit does. */
vi.mock('../../../../src/renderer/components/onboarding/OnboardingFlow', () => ({
  default: ({ onFinish }: { onFinish: () => void }) => (
    <button type='button' data-testid='finish' onClick={onFinish}>
      finish
    </button>
  ),
}));

import OnboardingOverlay from '@renderer/components/onboarding/OnboardingOverlay';

describe('onboarding completion marks the shell choice prompted', () => {
  beforeEach(() => {
    window.localStorage.clear();
    markShellChoicePrompted.mockClear();
    configSet.mockClear();
  });
  afterEach(cleanup);

  it('marks the shell choice prompted on the SAME exit that sets onboardingCompleted', async () => {
    const { findByTestId } = render(<OnboardingOverlay />);
    (await findByTestId('finish')).click();

    await waitFor(() => {
      expect(configSet).toHaveBeenCalledWith('onboardingCompleted', true);
    });
    // The pairing. Without it ShellChoiceOverlay opens over the app on launch two.
    await waitFor(() => {
      expect(markShellChoicePrompted).toHaveBeenCalled();
    });
  });
});
