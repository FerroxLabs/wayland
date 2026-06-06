/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Custom toolbar slot content structure
 */
export interface PreviewToolbarExtras {
  left?: ReactNode;
  right?: ReactNode;
}

export interface PreviewToolbarExtrasContextValue {
  setExtras: (extras: PreviewToolbarExtras | null) => void;
}

const PreviewToolbarExtrasContext = createContext<PreviewToolbarExtrasContextValue | null>(null);

export const PreviewToolbarExtrasProvider = PreviewToolbarExtrasContext.Provider;

/**
 * Hook for preview components to set extra toolbar elements
 */
export const usePreviewToolbarExtras = () => {
  return useContext(PreviewToolbarExtrasContext);
};
