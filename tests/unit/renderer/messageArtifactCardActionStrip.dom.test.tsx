/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE ACTION STRIP IS ONE ROW, AT THE WIDTH THE SHELL ACTUALLY GIVES IT.
 *
 * The strip was laid out against a 520px card and that number went stale. The
 * card's `!max-w-520px` is a MAX, not a width: with the workbench docked the
 * narrowest column the shell will hand this card is
 * WORKBENCH_DOCK_MIN_WIDTH 740 (conversation/components/ChatLayout/index.tsx)
 * less WorkbenchHost's 340px panel and 36px rail, less MessageList's px-8px -
 * about 348px. At 348px `flex-wrap` dropped "Save a copy" onto a second line
 * and the footer stopped reading as a band.
 *
 * WHAT THIS TEST CAN AND CANNOT PROVE. jsdom performs NO layout: every box is
 * 0x0, so "did the strip wrap?" is not observable here and asserting it would
 * be theatre. What IS observable, and what the fix actually is, is the style
 * contract that makes wrapping impossible:
 *
 *   - the row does not wrap (`flex-nowrap`, and no `flex-wrap`);
 *   - every labelled control may shrink (`min-w-0`, and NOT `shrink-0`);
 *   - every label truncates instead of pushing the row wider (`truncate`);
 *   - every glyph refuses to squash (`shrink-0`).
 *
 * That is asserted below. The pixel claim itself belongs to a live sweep.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ipcMock = vi.hoisted(() => ({
  open: vi.fn(),
  reveal: vi.fn(),
  saveCopy: vi.fn(),
  refresh: vi.fn(),
  openTarget: vi.fn(),
  preview: vi.fn(),
}));

vi.mock('@/renderer/hooks/file/usePreviewLauncher', () => ({
  usePreviewLauncher: () => ({ launchPreview: vi.fn(), loading: false }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    artifacts: {
      open: { invoke: ipcMock.open },
      reveal: { invoke: ipcMock.reveal },
      saveCopy: { invoke: ipcMock.saveCopy },
      refresh: { invoke: ipcMock.refresh },
      openTarget: { invoke: ipcMock.openTarget },
      preview: { invoke: ipcMock.preview },
    },
  },
}));

/** The REAL strings - the longest label is the whole reason the row overflows. */
import enConversation from '@renderer/services/i18n/locales/en-US/conversation.json';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const segments = key.replace(/^conversation\./, '').split('.');
      let node: unknown = enConversation;
      for (const segment of segments) node = (node as Record<string, unknown>)?.[segment];
      let text = typeof node === 'string' ? node : key;
      for (const [name, value] of Object.entries(params ?? {})) {
        text = text.replaceAll(`{{${name}}}`, String(value));
      }
      return text;
    },
  }),
}));

import MessageArtifactCard from '@renderer/pages/conversation/Messages/components/MessageArtifactCard';
import type { IMessageArtifactCard } from '@/common/chat/chatLib';

const CONVERSATION = 'convstrip0001';

/**
 * A card fixture, deliberately. This suite asserts a LAYOUT contract, not the
 * ledger - the sweep's own tests own that, and driving a real filesystem here
 * would only slow the claim down.
 */
const message = {
  id: `artifact-card-${CONVERSATION}`,
  msg_id: `artifact-card-${CONVERSATION}`,
  type: 'artifact_card',
  position: 'left',
  conversation_id: CONVERSATION,
  createdAt: 1_700_000_000_000,
  status: 'finish',
  content: {
    artifacts: [
      {
        artifactId: 'art-0001',
        taskId: 'task-0001',
        runId: 'run-0001',
        fileName: 'summary.md',
        canonicalPath: '/tmp/summary.md',
        sizeBytes: 128,
        runAt: new Date(1_700_000_000_000).toISOString(),
        declaredBy: 'Chat',
      },
    ],
    rejected: [],
    unsupported: [],
  },
} as unknown as IMessageArtifactCard;

const LABELLED = ['artifact-card-open-here', 'artifact-card-open-external', 'artifact-card-save-copy'] as const;

beforeEach(() => {
  vi.clearAllMocks();
  // The longest label there is, and the one the strip has to survive.
  ipcMock.openTarget.mockResolvedValue({ applicationName: 'Hearth' });
  ipcMock.preview.mockResolvedValue({ kind: 'text', text: '# summary\n', truncated: false });
});

describe('artifact card action strip - holds one row at the docked-workbench width', () => {
  it('never wraps the strip onto a second line', async () => {
    render(<MessageArtifactCard message={message} />);

    const actions = await screen.findByTestId('artifact-card-actions');
    const classes = actions.className.split(/\s+/);

    expect(classes).toContain('flex-nowrap');
    expect(classes).not.toContain('flex-wrap');
  });

  it('lets every labelled control shrink instead of holding the row open', async () => {
    render(<MessageArtifactCard message={message} />);
    // The external label only lands once the host has named the app.
    await waitFor(() => expect(screen.getByTestId('artifact-card-open-external').textContent).toContain('Hearth'));

    for (const testId of LABELLED) {
      const button = screen.getByTestId(testId);
      const classes = button.className.split(/\s+/);
      expect(classes, `${testId} must be allowed to shrink`).toContain('min-w-0');
      expect(classes, `${testId} must not pin the row open`).not.toContain('shrink-0');
    }
  });

  it('truncates the labels and never the glyphs', async () => {
    render(<MessageArtifactCard message={message} />);
    await waitFor(() => expect(screen.getByTestId('artifact-card-open-external').textContent).toContain('Hearth'));

    for (const testId of LABELLED) {
      const button = screen.getByTestId(testId);

      const label = button.querySelector('span');
      expect(label, `${testId} needs its label in an element that can truncate`).toBeTruthy();
      expect(label?.className.split(/\s+/), `${testId} label must truncate`).toContain('truncate');
      expect(label?.textContent?.trim().length ?? 0).toBeGreaterThan(0);

      const glyph = button.querySelector('svg');
      expect(glyph?.getAttribute('class')?.split(/\s+/), `${testId} glyph must not squash`).toContain('shrink-0');
    }

    // The icon-only control has nothing left to give, so it holds its width.
    const reveal = screen.getByTestId('artifact-card-reveal');
    expect(reveal.className.split(/\s+/)).toContain('shrink-0');
    expect(reveal.getAttribute('aria-label')).toBe(enConversation.artifactCard.reveal);
  });
});
