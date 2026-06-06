/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Preview module type definitions
 *
 * Note: Core type definitions are in @/common/types/preview for IPC
 */

// Re-export types from common for convenience within module
export type {
  PreviewContentType,
  PreviewHistoryTarget,
  PreviewSnapshotInfo,
  RemoteImageFetchRequest,
} from '@/common/types/preview';

/**
 * View mode
 */
export type ViewMode = 'source' | 'preview';

/**
 * Preview tab information
 */
export interface PreviewTabInfo {
  id: string;
  title: string;
  isDirty?: boolean;
}
