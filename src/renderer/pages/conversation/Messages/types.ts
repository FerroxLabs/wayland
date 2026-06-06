/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Type definitions for message tool results
 */

export interface ImageGenerationResult {
  img_url?: string;
  relative_path?: string;
  error?: string;
}

export interface WriteFileResult {
  fileDiff: string;
  fileName: string;
  [key: string]: unknown;
}
