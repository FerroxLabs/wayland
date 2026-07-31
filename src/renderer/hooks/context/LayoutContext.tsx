/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */
import React from 'react';
import type { ShellExperience } from '@/common/shellExperience';

export interface LayoutContextValue {
  /** Legacy composite (narrow OR small-screen touch). Prefer the two below. */
  isMobile: boolean;
  /** Viewport below the mobile width breakpoint - use for LAYOUT decisions (#47). */
  isNarrow: boolean;
  /** Touch / coarse pointer primary input - use for INTERACTION decisions (#47). */
  isTouch: boolean;
  /** Active presentation shell. Omitted by legacy/test providers and treated as Classic. */
  shellExperience?: ShellExperience;
  siderCollapsed: boolean;
  setSiderCollapsed: (value: boolean) => void;
}

export const LayoutContext = React.createContext<LayoutContextValue | null>(null);

export function useLayoutContext(): LayoutContextValue | null {
  return React.useContext(LayoutContext);
}
