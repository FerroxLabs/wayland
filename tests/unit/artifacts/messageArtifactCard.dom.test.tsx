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
  // MOCK EXTENSION, not a test change. The card now reads a few VERIFIED bytes
  // for its preview band, so the partial bridge this file stubs has to carry
  // the fifth artifact channel or the component cannot mount at all. Every
  // assertion that existed before this line still asserts exactly what it did.
  preview: vi.fn(),
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
      preview: { invoke: ipcMock.preview },
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
import type { ArtifactRejectionReason } from '@/common/types/artifacts';
import { formatArtifactSize } from '@/common/types/artifacts';

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
  ipcMock.preview.mockResolvedValue({ kind: 'text', text: '# what wayland is\n', truncated: false });
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

    // ASYNC NOW, AND ONLY ASYNC. "Open here" awaits a verified read before it
    // launches (see C4) - it used to hand `canonicalPath` straight to the
    // renderer's viewer with no ledger involved at all, which is why clicking
    // it on an edited file could never raise the changed state. The claim is
    // byte-identical: exactly one launch, and the OS launcher untouched.
    await waitFor(() => expect(previewMock.launchPreview).toHaveBeenCalledTimes(1));
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
    // ---------------------------------------------------------------------
    // THIS ASSERTION IS INVERTED DELIBERATELY AND IT IS THE POINT OF C2.
    // It used to read `expect(line).toContain('symlink')`, which PINNED the
    // defect: the card was printing the host's internal kebab-case vocabulary
    // straight to a non-technical person at the exact moment their report did
    // not arrive. The reason is now folded into one of five translated
    // buckets, so the raw slug reaching the screen is the failure and is
    // asserted as one. The count assertion is kept unchanged.
    // ---------------------------------------------------------------------
    expect(line).toContain('was not a regular file');
    expect(line).not.toContain('symlink');
    expect(line).not.toContain('not-regular-file');
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
  /**
   * ---------------------------------------------------------------------
   * THE REBUILT CARD. Three bands, one accent, real bytes.
   * ---------------------------------------------------------------------
   * What shipped first was a 1px outline around four identical text links and
   * it was rejected on sight. These are the mechanical halves of the design
   * that a screenshot cannot check on every run.
   */
  describe('the three-band card', () => {
    it('draws at most three rows and reads the preview exactly ONCE, however many deliverables there are', async () => {
      const message = await produceCard({
        'a.md': '# a\n',
        'b.md': '# b\n',
        'c.md': '# c\n',
        'd.md': '# d\n',
        'e.md': '# e\n',
        'f.md': '# f\n',
        'g.md': '# g\n',
      });
      expect(message.content.artifacts.length).toBe(7);

      render(<MessageArtifactCard message={message} />);

      expect(screen.getAllByTestId('artifact-card-row').length).toBe(3);
      // ONE preview read per card, ever. Seven 104px bands is a 900px card and
      // seven verified reads per render; this is the whole reason there is no
      // batch provider, no lazy loader and no concurrency budget.
      await waitFor(() => expect(ipcMock.preview).toHaveBeenCalledTimes(1));
      expect(screen.getAllByTestId('artifact-card-preview').length).toBe(1);
      expect(screen.getByTestId('artifact-card-more').textContent).toContain('4');
    });

    it('gives the newest deliverable a band and the other rows none', async () => {
      const message = await produceCard({ 'a.md': '# a\n', 'b.md': '# b\n' });

      render(<MessageArtifactCard message={message} />);

      expect(screen.getAllByTestId('artifact-card-row').length).toBe(2);
      expect(screen.getAllByTestId('artifact-card-preview').length).toBe(1);
      expect(screen.queryByTestId('artifact-card-more')).toBeNull();
      await waitFor(() => expect(ipcMock.preview).toHaveBeenCalledTimes(1));
    });

    /**
     * THE SECURITY PROPERTY, ASSERTED RATHER THAN REVIEWED. Preview bytes are
     * attacker-influenced: a model wrote them. They enter a `<pre>` and
     * nothing else, so an HTML deliverable previews as its SOURCE.
     */
    it('puts text bytes in a <pre> as TEXT, never as markup', async () => {
      ipcMock.preview.mockResolvedValue({
        kind: 'text',
        text: '<script>window.__pwned = 1</script><img src=x onerror=alert(1)>',
        truncated: true,
      });
      const message = await produceCard({ 'page.html': '<h1>hi</h1>\n' });

      const { container } = render(<MessageArtifactCard message={message} />);

      const band = await screen.findByTestId('artifact-card-preview-text');
      expect(band.tagName).toBe('PRE');
      expect(band.textContent).toContain('<script>window.__pwned = 1</script>');
      // The bytes are on screen and NOTHING was parsed out of them.
      expect(container.querySelector('script')).toBeNull();
      expect(container.querySelector('iframe')).toBeNull();
      expect(container.querySelectorAll('img').length).toBe(0);
      expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined();
    });

    it('puts image bytes in an <img> and nothing else', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      ipcMock.preview.mockResolvedValue({ kind: 'image', dataUrl });
      const message = await produceCard({ 'shot.png': 'not really a png\n' });

      render(<MessageArtifactCard message={message} />);

      const image = await screen.findByTestId('artifact-card-preview-image');
      expect(image.tagName).toBe('IMG');
      expect(image.getAttribute('src')).toBe(dataUrl);
      expect(screen.queryByTestId('artifact-card-preview-text')).toBeNull();
    });

    it('shows the file glyph, never an empty box, when the host refuses the bytes', async () => {
      ipcMock.preview.mockResolvedValue({ kind: 'none', reason: 'binary' });
      const message = await produceCard({ 'report.pdf': '%PDF-1.4\n' });

      render(<MessageArtifactCard message={message} />);

      expect(await screen.findByTestId('artifact-card-preview-glyph')).toBeTruthy();
      expect(screen.queryByTestId('artifact-card-preview-text')).toBeNull();
      // A refused preview must not disable the file. The internal viewer has
      // its own PDF renderer and Open here still works.
      expect(screen.getByTestId('artifact-card-open-here')).toBeTruthy();
    });

    /**
     * THE REMOTE VIEWER. `artifacts.` is remote-denied by PREFIX, so on a
     * paired WebUI the client throws rather than resolving. Every other
     * control on this card is click-triggered and only fails when touched; a
     * mount-time read is the one that would fail unprompted on every render.
     */
    it('falls back to the glyph when the bridge refuses the channel outright', async () => {
      ipcMock.preview.mockRejectedValue(new Error('bridge provider artifacts.preview is unavailable'));
      const message = await produceCard({ 'summary.md': '# x\n' });

      render(<MessageArtifactCard message={message} />);

      const glyph = await screen.findByTestId('artifact-card-preview-glyph');
      // The glyph is ALSO the pre-settle placeholder - deliberately, so the
      // band is never an empty box for a frame. Its presence therefore proves
      // nothing on its own. What proves the rejection was CAUGHT and turned
      // into a refusal is the settled tint: an unsettled band is muted, a
      // settled one takes the file type's colour.
      await waitFor(() =>
        expect(glyph.querySelector('svg')?.getAttribute('class') ?? '').toContain('text-warning')
      );
      expect(screen.getByTestId('artifact-card')).toBeTruthy();
      expect(screen.queryByTestId('artifact-card-error')).toBeNull();
    });

    /**
     * THE REPAIR HAS A TRIGGER THAT ACTUALLY FIRES. There is no filesystem
     * watcher, so a hand-edit surfaces on the NEXT mount - and before this the
     * only path to the changed state was clicking one of the three host
     * actions, which is not what a user does after editing their own file.
     */
    it('raises the changed state on mount, with no click at all, when the digest moved', async () => {
      ipcMock.preview.mockResolvedValue({ kind: 'none', reason: 'changed' });
      const message = await produceCard({ 'brief.md': '# brief\n' });

      render(<MessageArtifactCard message={message} />);

      expect(await screen.findByTestId('artifact-card-changed')).toBeTruthy();
      const update = screen.getByTestId('artifact-card-update');
      // ...and Update takes the accent. Open here demotes: the file on disk is
      // not the file this card is about, so opening it is the wrong first move.
      expect(update.className).toContain('bg-brand');
      expect(screen.getByTestId('artifact-card-open-here').className).not.toContain('bg-brand');
    });

    it('refuses to launch the viewer on a file that changed under the card', async () => {
      const message = await produceCard({ 'brief.md': '# brief\n' });
      render(<MessageArtifactCard message={message} />);
      await waitFor(() => expect(ipcMock.preview).toHaveBeenCalled());

      ipcMock.preview.mockResolvedValue({ kind: 'none', reason: 'changed' });
      fireEvent.click(screen.getByTestId('artifact-card-open-here'));

      expect(await screen.findByTestId('artifact-card-changed')).toBeTruthy();
      expect(previewMock.launchPreview).not.toHaveBeenCalled();
    });

    it('keeps opening the viewer for every refusal that is NOT a digest refusal', async () => {
      ipcMock.preview.mockResolvedValue({ kind: 'none', reason: 'too-large' });
      const message = await produceCard({ 'big.md': '# big\n' });

      render(<MessageArtifactCard message={message} />);
      fireEvent.click(screen.getByTestId('artifact-card-open-here'));

      await waitFor(() => expect(previewMock.launchPreview).toHaveBeenCalledTimes(1));
      expect(screen.queryByTestId('artifact-card-changed')).toBeNull();
    });

    /**
     * EXACTLY ONE PER CARD, NOT PER ROW - which is a defect found by looking at
     * a three-deliverable card in the running app rather than at this file. The
     * accent was on every row's primary, so a card with three deliverables drew
     * three orange buttons and the hierarchy was gone again.
     */
    it('fills exactly one button with the accent even on a card of many deliverables', async () => {
      const message = await produceCard({ 'a.md': '# a\n', 'b.md': '# b\n', 'c.md': '# c\n' });

      const { container } = render(<MessageArtifactCard message={message} />);
      await waitFor(() => expect(ipcMock.preview).toHaveBeenCalled());

      expect(screen.getAllByTestId('artifact-card-row').length).toBe(3);
      const accented = [...container.querySelectorAll('button')].filter((button) =>
        button.className.split(/\s+/).includes('bg-brand')
      );
      expect(accented.length).toBe(1);
      // ...and it belongs to the NEWEST deliverable, the one with the band.
      const firstRow = screen.getAllByTestId('artifact-card-row')[0];
      expect(firstRow.contains(accented[0])).toBe(true);
    });

    /** EXACTLY ONE. Four equal-weight controls is the thing being fixed. */
    it('fills exactly one button with the accent', async () => {
      const message = await produceCard({ 'summary.md': '# x\n' });

      const { container } = render(<MessageArtifactCard message={message} />);
      await waitFor(() => expect(ipcMock.preview).toHaveBeenCalled());

      const accented = [...container.querySelectorAll('button')].filter((button) =>
        button.className.split(/\s+/).includes('bg-brand')
      );
      expect(accented.length).toBe(1);
      expect(accented[0].getAttribute('data-testid')).toBe('artifact-card-open-here');
    });

    /**
     * THE META LINE. Format proper noun, shared byte formatter, clock time -
     * and no translatable "File"/"just now" invention, which is why none of
     * these needed a new key.
     */
    it('names the format, the size and a clock time under the filename', async () => {
      const message = await produceCard({ 'summary.md': '# what wayland is\n' });

      render(<MessageArtifactCard message={message} />);

      const meta = screen.getByTestId('artifact-card-meta').textContent ?? '';
      expect(meta).toContain('Markdown');
      expect(meta).toContain(formatArtifactSize(message.content.artifacts[0].sizeBytes));
      expect(meta).toMatch(/\d{1,2}[:.]\d{2}/);
      // The filename is a separate, louder line - not folded into the meta.
      expect(screen.getByTestId('artifact-card-name').textContent).toBe('summary.md');
    });

    it('falls back to the uppercased extension rather than inventing a translatable noun', async () => {
      const message = await produceCard({ 'sheet.tsv': 'a\tb\n' });

      render(<MessageArtifactCard message={message} />);

      const meta = screen.getByTestId('artifact-card-meta').textContent ?? '';
      expect(meta).toContain('TSV');
      expect(meta).not.toContain('File');
    });

    /**
     * THE FIVE BUCKETS. `rejectionBucketFor` is the host's own table, so this
     * asserts the renderer actually goes through it rather than that the table
     * is right - which the host's exhaustive test already pins.
     */
    it('folds every rejection reason into a sentence, never a kebab-case slug', () => {
      const reasons: ArtifactRejectionReason[] = [
        'not-an-object',
        'not-a-string',
        'empty',
        'absolute',
        'home-relative',
        'traversal',
        'unsafe-form',
        'escapes-workspace',
        'symlink',
        'not-regular-file',
        'missing',
        'too-large',
        'too-many',
        'unreadable',
      ];
      for (const reason of reasons) {
        const message = {
          id: 'x',
          msg_id: 'x',
          type: 'artifact_card',
          position: 'left',
          conversation_id: CONVERSATION,
          content: { artifacts: [], rejected: [{ reason, count: 1 }] },
        } as unknown as IMessageArtifactCard;
        const view = render(<MessageArtifactCard message={message} />);
        const line = screen.getByTestId('artifact-card-rejected').textContent ?? '';
        expect(line).not.toContain(reason);
        expect(line).not.toMatch(/[a-z]+-[a-z]+/);
        expect(line.length).toBeGreaterThan(reason.length);
        view.unmount();
      }
    });

    it('sums two reasons that share a bucket into one phrase', () => {
      const message = {
        id: 'x',
        msg_id: 'x',
        type: 'artifact_card',
        position: 'left',
        conversation_id: CONVERSATION,
        content: {
          artifacts: [],
          rejected: [
            { reason: 'escapes-workspace', count: 2 },
            { reason: 'traversal', count: 1 },
            { reason: 'unreadable', count: 1 },
          ],
        },
      } as unknown as IMessageArtifactCard;

      render(<MessageArtifactCard message={message} />);

      const line = screen.getByTestId('artifact-card-rejected').textContent ?? '';
      // Three reasons, TWO sentences: the two path refusals are the same
      // sentence to a person and differ only in which validator line caught
      // them.
      expect(line).toContain("3 saved outside this chat's folder");
      expect(line).toContain('1 could not be read');
      expect(line).toContain('4 files');
    });
  });

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
