/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import type { DetectionResult } from '@/common/types/onboarding';

/**
 * Shape of the onboarding methods exposed on `window.electronAPI` by the
 * preload bridge.
 */
type OnboardingApi = {
  onboardingDetect: () => Promise<DetectionResult>;
  onboardingFluxMetrics: () => Promise<unknown | null>;
};

/** Read the onboarding-scoped methods off the global preload bridge. */
function getOnboardingApi(): Partial<OnboardingApi> {
  return (window as unknown as { electronAPI?: Partial<OnboardingApi> }).electronAPI ?? {};
}

/**
 * Run the first-run onboarding environment detection once on mount.
 *
 * Returns the detection result (or `null` while loading / on failure) and a
 * `loading` flag the overlay uses to avoid flashing before detection resolves.
 */
export function useOnboardingDetection(): { detection: DetectionResult | null; loading: boolean } {
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const api = getOnboardingApi();

    if (!api.onboardingDetect) {
      setLoading(false);
      return;
    }

    api
      .onboardingDetect()
      .then((result) => {
        if (!cancelled) setDetection(result);
      })
      .catch(() => {
        if (!cancelled) setDetection(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { detection, loading };
}
