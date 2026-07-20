/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Process-side compatibility surface for the shared pure retention classifier.
 * This module still owns no filesystem or lifecycle mutation authority.
 */
export { classifyManagedWorkspaceRetention } from '@/common/types/managedWorkspaceRetention';
export type {
  ManagedWorkspaceEvidence,
  ManagedWorkspaceRetentionDecision,
} from '@/common/types/managedWorkspaceRetention';
