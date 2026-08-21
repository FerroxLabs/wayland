/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-8, renderer half. The `data:` document the preview webview loads is
 * assembled here, so this is the last point at which the policy can be put
 * INSIDE the bytes - which is the only protection the browser (WebUI) preview
 * has, since it has no Electron session behind it.
 */

import { describe, expect, it } from 'vitest';

import { UNTRUSTED_PREVIEW_CSP } from '@/common/preview/untrustedPreview';
import { buildPreviewDataUrl, buildPreviewDocument } from '@renderer/pages/conversation/Preview/previewDocument';

const decode = (dataUrl: string): string => decodeURIComponent(dataUrl.replace(/^data:text\/html;charset=utf-8,/, ''));

describe('buildPreviewDocument', () => {
  it('carries the untrusted-preview CSP', () => {
    const out = buildPreviewDocument('<html><head></head><body>hi</body></html>', undefined);
    expect(out).toContain(UNTRUSTED_PREVIEW_CSP);
  });

  it('injects a base href so relative resources still resolve, AFTER the policy', () => {
    const out = buildPreviewDocument(
      '<html><head></head><body><img src="chart.png"></body></html>',
      '/tmp/report/r.html'
    );
    expect(out).toContain('<base href="file:///tmp/report/">');
    expect(out.indexOf('Content-Security-Policy')).toBeLessThan(out.indexOf('<base'));
  });

  it('does not add a second base when the document already has one', () => {
    const out = buildPreviewDocument(
      '<html><head><base href="file:///a/"></head><body></body></html>',
      '/tmp/r/r.html'
    );
    expect(out.match(/<base\b/gi)).toHaveLength(1);
  });

  it('strips a hostile document-supplied policy', () => {
    const out = buildPreviewDocument(
      '<html><head><meta http-equiv="Content-Security-Policy" content="default-src *"></head><body></body></html>',
      undefined
    );
    expect(out).not.toContain('default-src *');
    expect(out.match(/http-equiv=["']?Content-Security-Policy/gi)).toHaveLength(1);
  });
});

describe('buildPreviewDataUrl', () => {
  it('produces a data: URL whose decoded document is policed', () => {
    const url = buildPreviewDataUrl(
      '<html><head></head><body><script>fetch("https://x")</script></body></html>',
      undefined
    );
    expect(url.startsWith('data:text/html;charset=utf-8,')).toBe(true);
    const doc = decode(url);
    expect(doc).toContain(UNTRUSTED_PREVIEW_CSP);
    // The script TAG survives - CSP is what stops it running, and that is the
    // measured behaviour: the page script did not execute while the host's
    // executeJavaScript still did. Rewriting the bytes would be lying about
    // what the user's file contains.
    expect(doc).toContain('<script>');
  });

  it('percent-encodes so a `#` in the report cannot truncate the document', () => {
    const url = buildPreviewDataUrl('<html><body>a#b&c</body></html>', undefined);
    expect(url).not.toContain('#');
    expect(decode(url)).toContain('a#b&c');
  });
});

describe('externalOpenNeedsWarning', () => {
  it('warns for HTML - the one preview kind that is an active document once it leaves', async () => {
    const { externalOpenNeedsWarning } = await import('@renderer/pages/conversation/Preview/previewDocument');
    expect(externalOpenNeedsWarning('html')).toBe(true);
  });

  it('does not warn for inert kinds - a warning nobody needs is a warning nobody reads', async () => {
    const { externalOpenNeedsWarning } = await import('@renderer/pages/conversation/Preview/previewDocument');
    for (const kind of ['image', 'pdf', 'markdown', 'text', 'csv', 'excel', 'word', 'ppt', 'code']) {
      expect(externalOpenNeedsWarning(kind)).toBe(false);
    }
  });
});
