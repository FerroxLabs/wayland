/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export const SHELL_EXPERIENCES = ['classic', 'cockpit'] as const;
export type ShellExperience = (typeof SHELL_EXPERIENCES)[number];

/** Existing and unclassified installs always remain on the proven shell. */
export function resolveShellExperience(value: unknown): ShellExperience {
  return value === 'cockpit' ? 'cockpit' : 'classic';
}
