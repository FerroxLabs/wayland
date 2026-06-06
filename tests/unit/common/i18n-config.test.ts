/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
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
