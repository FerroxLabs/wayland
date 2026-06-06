/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { firstSafeCuratedModel } from '@renderer/pages/guid/components/GuidModelSelector';
import type { CuratedModel } from '@process/providers/types';

const model = (over: Partial<CuratedModel> & { id: string }): CuratedModel =>
  ({
    providerId: 'google-gemini',
    displayName: over.id,
    family: over.id,
    kind: 'text',
    recommended: false,
    enabled: false,
    ...over,
  }) as unknown as CuratedModel;

describe('firstSafeCuratedModel', () => {
  // The live bug: Google returns `antigravity-preview-05-2026` first in its
  // Gemini model list, so it lands at curated[0] as a disabled dead preview.
  // The stale-pin fallback must skip it and pick the first recommended model.
  it('skips a leading disabled preview and returns the first recommended model', () => {
    const curated = [
      model({ id: 'antigravity-preview-05-2026', recommended: false, enabled: false }),
      model({ id: 'aqa', recommended: false, enabled: false }),
      model({ id: 'gemini-3.5-flash', recommended: true, enabled: true, role: 'flagship' }),
    ];
    expect(firstSafeCuratedModel(curated)?.id).toBe('gemini-3.5-flash');
  });

  it('falls back to the first enabled model when none are recommended', () => {
    const curated = [
      model({ id: 'antigravity-preview-05-2026', recommended: false, enabled: false }),
      model({ id: 'gemini-2.0-flash', recommended: false, enabled: true }),
    ];
    expect(firstSafeCuratedModel(curated)?.id).toBe('gemini-2.0-flash');
  });

  it('falls back to the first NON-EXPERIMENTAL model when none are recommended or enabled', () => {
    // Never blindly curated[0]: a leading preview must be skipped even as the
    // last-resort fallback, so the first non-experimental entry wins.
    const curated = [
      model({ id: 'only-preview', recommended: false, enabled: false }),
      model({ id: 'another-disabled', recommended: false, enabled: false }),
    ];
    expect(firstSafeCuratedModel(curated)?.id).toBe('another-disabled');
  });

  it('returns undefined when every model is experimental/preview (never surface a preview)', () => {
    // The antigravity guard: if the only options are previews, leave the user's
    // pin untouched rather than silently switch them onto a preview they never chose.
    const curated = [
      model({ id: 'antigravity-preview-05-2026', recommended: false, enabled: false }),
      model({ id: 'gemini-3.0-exp', recommended: true, enabled: true }),
    ];
    expect(firstSafeCuratedModel(curated)).toBeUndefined();
  });

  it('returns undefined for an empty list', () => {
    expect(firstSafeCuratedModel([])).toBeUndefined();
  });
});
