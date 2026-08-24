/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMessageRenderArtifact } from '@/common/chat/chatLib';
import { usePreviewContext } from '@/renderer/pages/conversation/Preview';
import { previewContentTypeForRenderMime } from '@/renderer/pages/conversation/Preview/previewContentType';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The card for a `render_artifact` frame (#1098).
 *
 * WHY IT OFFERS ONLY PREVIEW. The frame carries CONTENT and no path. Open and
 * Reveal both hand a path to the operating system, and there is no path here to
 * hand over — an Open button on this card could only be a button that fails, or
 * worse, one that guessed a path. The deliverable card next door (see
 * ArtifactActionBar) offers all three precisely because it has a real file on
 * disk behind an id. Same app, two different cards, because they are backed by
 * two different things.
 *
 * That absence is the feature, not a limitation. It is the reason Core could
 * refuse to grant the seatbelt `lsopen` operation (#1102) without losing "show
 * this to the user": rendering needs zero filesystem authority at the host, so
 * it works headless, over SSH, and identically on all three platforms.
 *
 * `content` is UNTRUSTED — model-authored or read out of the workspace. It goes
 * to the internal viewer, which renders `text/html` inside the sandboxed
 * preview surface (data URL + the untrusted-preview CSP, no host bridge) and
 * never into this component's own DOM.
 *
 * Naming is load-bearing here: PREVIEW IS THE INTERNAL VIEWER. This card never
 * says "Open", because Open in this app means handing the file to an external
 * tool.
 */
const MessageRenderArtifact: React.FC<{ message: IMessageRenderArtifact }> = ({ message }) => {
  const { t } = useTranslation();
  const { openPreview } = usePreviewContext();
  const { title, mime, content, truncated } = message.content;

  const preview = useCallback(() => {
    openPreview(content, previewContentTypeForRenderMime(mime), {
      title,
      // Read-only: there is no file behind this, so a save would have nowhere
      // to go. `filePath`/`workspace` are deliberately absent — the preview
      // toolbar derives its "Open in system app" button from `metadata.filePath`
      // (PreviewPanel), so omitting it is what keeps the external hand-off off
      // a surface that has nothing to hand over.
      editable: false,
    });
  }, [openPreview, content, mime, title, truncated]);

  return (
    <div
      data-testid='render-artifact-card'
      className='b-1px b-solid b-[var(--border-base)] rd-12px px-12px py-10px max-w-800px w-full box-border'
    >
      <div className='text-11px color-[var(--text-secondary)]'>{t('messages.renderArtifact.label')}</div>
      <div data-testid='render-artifact-title' className='text-14px font-medium color-[var(--text-primary)] break-all'>
        {title}
      </div>
      {truncated && (
        <div data-testid='render-artifact-truncated' className='text-12px color-[var(--text-secondary)] mt-4px'>
          {t('messages.renderArtifact.truncated')}
        </div>
      )}
      <div
        data-testid='render-artifact-preview'
        onClick={preview}
        className='b-1px b-solid b-[var(--border-base)] rd-8px px-12px py-6px mt-8px inline-flex cursor-pointer hover:bg-[var(--bg-hover)] color-[var(--text-primary)] text-13px'
      >
        {t('messages.renderArtifact.preview')}
      </div>
    </div>
  );
};

export default MessageRenderArtifact;
