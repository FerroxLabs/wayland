/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs. Changes are documented in the project history.
 */

// Re-export from canonical location in common/types
export type {
  DetectedAgentKind,
  DetectedAgent,
  AcpDetectedAgent,
  GeminiDetectedAgent,
  RemoteDetectedAgent,
  WCoreDetectedAgent,
  NanobotDetectedAgent,
  OpenClawDetectedAgent,
  RemoteAgentProtocol,
  RemoteAgentAuthType,
} from '@/common/types/detectedAgent';

export { isAgentKind } from '@/common/types/detectedAgent';
