/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import coworkSvg from '@/renderer/assets/icons/cowork.svg';

/**
 * Map custom avatar identifiers to their resolved image URLs.
 */
export const CUSTOM_AVATAR_IMAGE_MAP: Record<string, string> = {
  'cowork.svg': coworkSvg,
  '\u{1F6E0}\u{FE0F}': coworkSvg,
};
