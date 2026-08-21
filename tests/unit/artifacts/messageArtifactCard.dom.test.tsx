/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * T5, renderer half. THE CARD THE WHOLE MILESTONE IS FOR.
 *
 * THE LEDGER UNDER THIS TEST IS A REAL ONE. The file is written to whatever the
 * production spawn resolver names for the conversation, registered by the
 * production sweep, and turned into card content by the production builder. No
 * fixture summary is hand-written anywhere, because the defect this milestone
 * exists to fix was a test that created the very thing whose absence was the
 * bug - so a card assembled from a fixture would prove exactly nothing about
 * whether a card ever appears.
 *
 * TWO CLAIMS, AND THE SECOND IS EASY TO LOSE.
 *
 *  1. The card names the user's actual file and its controls address an
 *     ARTIFACT ID - never a path.
 *  2. THE LABELS. Exactly one control keeps the user inside Wayland and one
 *     hands the file to another application, and they must be tellable apart.
 *     Before this, on a PDF, the app rendered "[Preview]" next to "[Open in
 *     Preview]" - one of those stays here, the other launches Apple's
 *     Preview.app, and nothing on screen said which. That is asserted here as
 *     a real property, not left to a code review to notice.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ipcMock = vi.hoisted(() => ({
  open: vi.fn(),
  reveal: vi.fn(),
  saveCopy: vi.fn(),
  refresh: vi.fn(),
  openTarget: vi.fn(),
}));

const previewMock = vi.hoisted(() => ({ launchPreview: vi.fn() }));

vi.mock('@/renderer/hooks/file/usePreviewLauncher', () => ({
  usePreviewLauncher: () => ({ launchPreview: previewMock.launchPreview, loading: false }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    artifacts: {
      open: { invoke: ipcMock.open },
      reveal: { invoke: ipcMock.reveal },
      saveCopy: { invoke: ipcMock.saveCopy },
      refresh: { invoke: ipcMock.refresh },
      openTarget: { invoke: ipcMock.openTarget },
    },
  },
}));

/**
 * The REAL en-US strings, not `key:params` echoes.
 *
 * A test that renders translation KEYS cannot see that two buttons say the same
 * word, which is the entire second claim above. So the locale bundle is loaded
 * and interpolated for real.
 */
import enConversation from '@renderer/services/i18n/locales/en-US/conversation.json';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const path = key.replace(/^conversation\./, '').split('.');
      let node: unknown = enConversation;
      for (const segment of path) node = (node as Record<string, unknown>)?.[segment];
      let text = typeof node === 'string' ? node : key;
      // i18next plural selection, only as far as these strings need it.
      if (typeof params?.count === 'number' && params.count !== 1) {
        const plural = (enConversation as Record<string, any>)[path[0]]?.[`${path[1]}_other`];
        if (typeof plural === 'string') text = plural;
      }
      for (const [name, value] of Object.entries(params ?? {})) {
        text = text.replaceAll(`{{${name}}}`, String(value));
      }
      return text;
    },
  }),
}));

import { resolveOutputDir } from '@process/agent/wcore/envBuilder';
import {
  buildChatArtifactCardContent,
  buildChatArtifactCardMessage,
} from '@process/services/artifacts/chatArtifactCard';
import { clearChatSweepMemo, sweepChatRun } from '@process/services/artifacts/chatRun';
import MessageArtifactCard from '@renderer/pages/conversation/Messages/components/MessageArtifactCard';
import type { IMessageArtifactCard } from '@/common/chat/chatLib';
import { DEFAULT_LANGUAGE } from '@/common/config/i18n';

const CONVERSATION = 'convcard0001';

let root = '';
let workspace = '';
let ledgerPath = '';

/** Write a file where the resolver said, then sweep it through production. */
async function produceCard(files: Record<string, string>, extra?: () => Promise<void>) {
  const outputDir = resolveOutputDir(workspace, undefined, CONVERSATION);
  for (const [relative, body] of Object.entries(files)) {
    const target = path.join(outputDir, ...relative.split('/'));
    // eslint-disable-next-line no-await-in-loop -- deterministic fixture ordering
    await fs.mkdir(path.dirname(target), { recursive: true });
    // eslint-disable-next-line no-await-in-loop -- see above
    await fs.writeFile(target, body, 'utf8');
  }
  await extra?.();
  const result = await sweepChatRun({ conversationId: CONVERSATION, workspace, ledgerPath, declaredBy: 'Chat' });
  const content = buildChatArtifactCardContent(result);
  if (!content) throw new Error('the sweep produced no card');
  return buildChatArtifactCardMessage(CONVERSATION, content) as IMessageArtifactCard;
}

beforeEach(async () => {
  clearChatSweepMemo();
  vi.clearAllMocks();
  ipcMock.openTarget.mockResolvedValue({ applicationName: null });
  ipcMock.open.mockResolvedValue({ ok: true });
  ipcMock.reveal.mockResolvedValue({ ok: true });
  ipcMock.saveCopy.mockResolvedValue({ ok: true });
  ipcMock.refresh.mockResolvedValue({ ok: true });
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-card-')));
  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  ledgerPath = path.join(root, 'artifact-ledger.jsonl');
});

afterEach(async () => {
  clearChatSweepMemo();
  await fs.rm(root, { recursive: true, force: true });
});

describe('T5 - the card in the conversation', () => {
  it('names the file the chat actually produced', async () => {
    const message = await produceCard({ 'summary.md': '# what wayland is\n' });

    render(<MessageArtifactCard message={message} />);

    expect(await screen.findByText('summary.md')).toBeTruthy();
    expect(screen.getByTestId('artifact-card')).toBeTruthy();
  });

  it('sends an artifact ID, never a path, for every host action', async () => {
    const message = await produceCard({ 'summary.md': '# x\n' });
    const artifactId = message.content.artifacts[0].artifactId;
    const canonicalPath = message.content.artifacts[0].canonicalPath;

    render(<MessageArtifactCard message={message} />);

    // One at a time: an action in flight disables the row, which is the
    // product behaviour and not something to click around.
    fireEvent.click(screen.getByTestId('artifact-card-open-external'));
    await waitFor(() => expect(ipcMock.open).toHaveBeenCalledWith({ artifactId }));

    fireEvent.click(screen.getByTestId('artifact-card-reveal'));
    await waitFor(() => expect(ipcMock.reveal).toHaveBeenCalledWith({ artifactId }));

    fireEvent.click(screen.getByTestId('artifact-card-save-copy'));
    await waitFor(() => expect(ipcMock.saveCopy).toHaveBeenCalledWith({ artifactId }));

    // No path crossed the boundary on any of the three.
    const everyArgument = JSON.stringify([
      ipcMock.open.mock.calls,
      ipcMock.reveal.mock.calls,
      ipcMock.saveCopy.mock.calls,
    ]);
    expect(everyArgument).not.toContain(canonicalPath);
  });

  /** CLAIM 2. */
  it('has exactly one control that stays in Wayland and one that leaves, and they read differently', async () => {
    ipcMock.openTarget.mockResolvedValue({ applicationName: 'Preview' });
    const message = await produceCard({ 'report.pdf': '%PDF-1.4\n' });

    render(<MessageArtifactCard message={message} />);

    const internal = screen.getByTestId('artifact-card-open-here');
    const external = await screen.findByTestId('artifact-card-open-external');

    expect(internal.textContent).toBe('Open here');
    expect(external.textContent).toBe('Open in Preview app');
    // The regression this exists for: two controls that both read "Preview".
    expect(internal.textContent).not.toBe(external.textContent);
    expect(internal.textContent).not.toContain('Preview');
  });

  it('opens INTERNALLY without touching the OS launcher', async () => {
    const message = await produceCard({ 'summary.md': '# x\n' });

    render(<MessageArtifactCard message={message} />);
    fireEvent.click(screen.getByTestId('artifact-card-open-here'));

    expect(previewMock.launchPreview).toHaveBeenCalledTimes(1);
    // The whole point of "stays in Wayland": no `artifacts.open`, so no
    // `shell.openPath`, so nothing is handed to the OS to execute.
    expect(ipcMock.open).not.toHaveBeenCalled();
  });

  it('falls back to a generic external label when the OS names no app', async () => {
    ipcMock.openTarget.mockResolvedValue({ applicationName: null });
    const message = await produceCard({ 'summary.md': '# x\n' });

    render(<MessageArtifactCard message={message} />);

    await waitFor(() =>
      expect(screen.getByTestId('artifact-card-open-external').textContent).toBe('Open in the default app')
    );
  });

  it('turns "changed since it was saved" into an Update the user can click', async () => {
    const message = await produceCard({ 'report.csv': 'a,b\n1,2\n' });
    const artifactId = message.content.artifacts[0].artifactId;
    ipcMock.open.mockResolvedValue({ ok: false, error: 'artifact has changed since it was recorded' });

    render(<MessageArtifactCard message={message} />);
    fireEvent.click(screen.getByTestId('artifact-card-open-external'));

    const update = await screen.findByTestId('artifact-card-update');
    expect(screen.getByTestId('artifact-card-changed').textContent).toContain('changed');

    ipcMock.open.mockResolvedValue({ ok: true });
    fireEvent.click(update);
    await waitFor(() => expect(ipcMock.refresh).toHaveBeenCalledWith({ artifactId }));
    await waitFor(() => expect(screen.queryByTestId('artifact-card-changed')).toBeNull());
  });

  it('reports an ordinary refusal as text instead of a dead button', async () => {
    const message = await produceCard({ 'summary.md': '# x\n' });
    ipcMock.open.mockResolvedValue({ ok: false, error: 'path not allowed' });

    render(<MessageArtifactCard message={message} />);
    fireEvent.click(screen.getByTestId('artifact-card-open-external'));

    expect((await screen.findByTestId('artifact-card-error')).textContent).toBe('path not allowed');
    // A refusal that is not "changed" must NOT offer the repair.
    expect(screen.queryByTestId('artifact-card-update')).toBeNull();
  });

  it('names what was refused, with a count, instead of leaving it silently absent', async () => {
    const message = await produceCard({ 'good.md': '# good\n' }, async () => {
      const outputDir = resolveOutputDir(workspace, undefined, CONVERSATION);
      await fs.writeFile(path.join(workspace, 'outside.txt'), 'x', 'utf8');
      await fs.symlink(path.join(workspace, 'outside.txt'), path.join(outputDir, 'link.md'));
    });

    render(<MessageArtifactCard message={message} />);

    const line = screen.getByTestId('artifact-card-rejected').textContent ?? '';
    expect(line).toContain('symlink');
    expect(line).toContain('1');
    // ...and the good file is still on the card. A rejection must not hide the
    // deliverable that DID work.
    expect(screen.getByText('good.md')).toBeTruthy();
  });

  it('writes NO card at all for a turn that produced nothing', async () => {
    // The builder, not the renderer: an empty card must not exist as a message
    // in the first place, so most turns - which are pure conversation - leave
    // no trace in the transcript.
    const empty = await sweepChatRun({ conversationId: CONVERSATION, workspace, ledgerPath, declaredBy: 'Chat' });

    expect(empty.registered).toEqual([]);
    expect(buildChatArtifactCardContent(empty)).toBeNull();
  });

  /**
   * The card ships en-US strings only. i18next resolves a missing key against
   * `fallbackLng`, and the en-US bundle is registered as that fallback at init,
   * so the other eleven locales render ENGLISH rather than a raw key like
   * `conversation.artifactCard.openHere`.
   *
   * Both halves of that are pinned here, because the claim is only true while
   * BOTH hold: the fallback really is en-US, and en-US really has every key the
   * component asks for.
   */
  it('renders English, not a raw key, in the eleven locales it was not translated into', () => {
    expect(DEFAULT_LANGUAGE).toBe('en-US');

    const used = [
      'title',
      'openHere',
      'openInApp',
      'openExternally',
      'reveal',
      'saveCopy',
      'changed',
      'update',
      'rejected',
      'unknownError',
    ];
    const bundle = (enConversation as Record<string, any>).artifactCard ?? {};
    for (const key of used) {
      expect(typeof bundle[key]).toBe('string');
      expect(bundle[key].length).toBeGreaterThan(0);
    }
  });
});
