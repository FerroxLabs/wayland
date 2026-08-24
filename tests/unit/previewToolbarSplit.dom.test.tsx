/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="@testing-library/jest-dom/vitest" />

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params?.defaultValue as string) ?? key,
  }),
}));

import PreviewToolbar, {
  PREVIEW_SPLIT_MIN_WIDTH,
} from '@/renderer/pages/conversation/Preview/components/PreviewPanel/PreviewToolbar';

/**
 * jsdom performs no layout, so `offsetWidth` is 0 for every element and the
 * toolbar's own measurement can never resolve on its own. Standing a width in
 * for the measurement is the only way to exercise BOTH sides of the threshold;
 * what is proven here is the gate, not that the pane really is that wide.
 */
const withPaneWidth = (px: number) => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => px });
};

const renderToolbar = (overrides: Partial<React.ComponentProps<typeof PreviewToolbar>> = {}) => {
  const onSplitScreenToggle = vi.fn();
  const utils = render(
    <PreviewToolbar
      contentType='html'
      isMarkdown={false}
      isHTML
      isEditable={false}
      isEditMode={false}
      viewMode='preview'
      isSplitScreenEnabled={false}
      fileName='morning-brief.html'
      showOpenInSystemButton={false}
      historyTarget={null}
      snapshotSaving={false}
      onViewModeChange={vi.fn()}
      onSplitScreenToggle={onSplitScreenToggle}
      onEditClick={vi.fn()}
      onExitEdit={vi.fn()}
      onSaveSnapshot={vi.fn()}
      onRefreshHistory={vi.fn()}
      renderHistoryDropdown={() => null}
      onOpenInSystem={vi.fn()}
      onDownload={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />
  );
  return { ...utils, onSplitScreenToggle };
};

describe('preview toolbar: Source / Preview / Split', () => {
  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth');
  });

  it('offers Split at the documented threshold, beside Source and Preview', async () => {
    withPaneWidth(PREVIEW_SPLIT_MIN_WIDTH);
    renderToolbar();

    // The three view choices are one control group, not a mode picker plus a
    // second unrelated mechanism bolted on beside it.
    expect(screen.getByText('preview.code')).toBeInTheDocument();
    expect(screen.getByText('preview.preview')).toBeInTheDocument();
    expect(await screen.findByTestId('preview-split-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('preview-split-toggle')).toHaveTextContent('Split');
  });

  it('withholds Split one pixel below the threshold, where there is nothing to split', async () => {
    withPaneWidth(PREVIEW_SPLIT_MIN_WIDTH - 1);
    renderToolbar();

    // Source and Preview survive - the pane is narrow, not useless.
    expect(screen.getByText('preview.code')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('preview-split-toggle')).not.toBeInTheDocument());
  });

  /**
   * Withdrawing the control while it is ON would strand the pane in a split it
   * has no room for and no way out of - a dead end, and the reason the gate
   * cannot be render-only.
   */
  it('leaves split when the pane narrows past the threshold with split enabled', async () => {
    withPaneWidth(400);
    const { onSplitScreenToggle } = renderToolbar({ isSplitScreenEnabled: true });

    await waitFor(() => expect(onSplitScreenToggle).toHaveBeenCalledOnce());
    expect(screen.queryByTestId('preview-split-toggle')).not.toBeInTheDocument();
  });

  it('does not toggle split off while the pane is wide enough to hold it', async () => {
    withPaneWidth(900);
    const { onSplitScreenToggle } = renderToolbar({ isSplitScreenEnabled: true });

    expect(await screen.findByTestId('preview-split-toggle')).toBeInTheDocument();
    expect(onSplitScreenToggle).not.toHaveBeenCalled();
  });
});
