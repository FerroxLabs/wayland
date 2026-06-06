/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * New API gateway platform identifier
 */
export const NEW_API_PLATFORM_ID = 'new-api';

/**
 * Check if platform is New API gateway type
 */
export const isNewApiPlatform = (platform: string): boolean => {
  return platform === NEW_API_PLATFORM_ID;
};
