/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs. Changes are documented in the project history.
 */

export const CODEX_MODE_AUTO_EDIT = 'autoEdit';
export const CODEX_MODE_FULL_AUTO = 'yolo';
export const CODEX_MODE_FULL_AUTO_NO_SANDBOX = 'yoloNoSandbox';

export function isCodexNoSandboxMode(mode?: string | null): boolean {
  return mode === CODEX_MODE_FULL_AUTO_NO_SANDBOX;
}

export function isCodexAutoApproveMode(mode?: string | null): boolean {
  return mode === CODEX_MODE_FULL_AUTO || mode === CODEX_MODE_FULL_AUTO_NO_SANDBOX;
}
