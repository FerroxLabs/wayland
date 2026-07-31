/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs. Changes are documented in the project history.
 */

import { SUPPORTED_LANGUAGES } from '@/common/config/i18n';

describe('i18n config', () => {
  it('should include uk-UA in supported languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('uk-UA');
  });

  it('should have en-US (English) as the first language - English-first, Western-priority order', () => {
    expect(SUPPORTED_LANGUAGES[0]).toBe('en-US');
  });
});
