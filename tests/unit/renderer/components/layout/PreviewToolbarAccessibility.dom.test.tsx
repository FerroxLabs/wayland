/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const translations: Record<string, string> = {
  'common.download': 'Download',
  'preview.closePreview': 'Close preview',
  'preview.downloadFile': 'Download file',
  'preview.editor': 'Editor',
  'preview.openInSystemApp': 'Open in system app',
  'preview.openSplitScreen': 'Open split screen',
  'preview.preview': 'Preview',
  'preview.source': 'Source',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

import PreviewToolbar from '@renderer/pages/conversation/Preview/components/PreviewPanel/PreviewToolbar';

describe('PreviewToolbar accessibility', () => {
  it('exposes view modes and toolbar actions as named keyboard controls', () => {
    const onViewModeChange = vi.fn();
    const onSplitScreenToggle = vi.fn();
    const onOpenInSystem = vi.fn();
    const onDownload = vi.fn();
    const onClose = vi.fn();

    render(
      <PreviewToolbar
        contentType='markdown'
        isMarkdown
        isHTML={false}
        isEditable={false}
        isEditMode={false}
        viewMode='source'
        isMdFile
        isSplitScreenEnabled={false}
        fileName='notes.md'
        showOpenInSystemButton
        historyTarget={null}
        snapshotSaving={false}
        onViewModeChange={onViewModeChange}
        onSplitScreenToggle={onSplitScreenToggle}
        onEditClick={vi.fn()}
        onExitEdit={vi.fn()}
        onSaveSnapshot={vi.fn()}
        onRefreshHistory={vi.fn()}
        renderHistoryDropdown={() => null}
        onOpenInSystem={onOpenInSystem}
        onDownload={onDownload}
        onClose={onClose}
      />
    );

    expect(screen.getByText('notes.md')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Source' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Editor' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open split screen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open in system app' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download file' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));

    expect(onViewModeChange).toHaveBeenNthCalledWith(1, 'editor');
    expect(onViewModeChange).toHaveBeenNthCalledWith(2, 'preview');
    expect(onSplitScreenToggle).toHaveBeenCalledOnce();
    expect(onOpenInSystem).toHaveBeenCalledOnce();
    expect(onDownload).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
