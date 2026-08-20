/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-8. The preview surface renders HTML a model wrote from third-party data
 * nobody vetted, on an unattended daily cron. Two claims are tested here, and
 * both were settled by EXECUTING Electron, not by reading its docs:
 *
 *  - `javascript: false` on the guest also kills the HOST's
 *    `webContents.executeJavaScript`, which the preview's scroll-sync and
 *    inspect-mode ride on. Measured: it throws.
 *  - a `default-src 'none'` CSP stops the PAGE's scripts while leaving the
 *    host's `executeJavaScript` working. Measured: page script did not run,
 *    host script returned.
 *
 * So script-disabling is done with CSP, and egress is killed at the session.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  UNTRUSTED_PREVIEW_CSP,
  UNTRUSTED_PREVIEW_PARTITION,
  isBlockedPreviewRequestUrl,
  withPreviewCsp,
} from '@/common/preview/untrustedPreview';
import { hardenUntrustedPreviewSession } from '@process/services/preview/untrustedPreviewSession';

describe('untrusted preview policy', () => {
  it('names a NON-persistent partition so nothing survives the preview', () => {
    expect(UNTRUSTED_PREVIEW_PARTITION).not.toMatch(/^persist:/);
    expect(UNTRUSTED_PREVIEW_PARTITION.length).toBeGreaterThan(0);
  });

  it('denies scripts and every remote fetch by default', () => {
    expect(UNTRUSTED_PREVIEW_CSP).toContain("default-src 'none'");
    // No script source of any kind may be admitted.
    expect(UNTRUSTED_PREVIEW_CSP).not.toMatch(/script-src/);
    expect(UNTRUSTED_PREVIEW_CSP).not.toContain('https:');
    expect(UNTRUSTED_PREVIEW_CSP).not.toContain('http:');
    expect(UNTRUSTED_PREVIEW_CSP).not.toContain('*');
    // Local presentation still has to work: the report's own images and styles.
    expect(UNTRUSTED_PREVIEW_CSP).toMatch(/img-src[^;]*data:/);
    expect(UNTRUSTED_PREVIEW_CSP).toMatch(/img-src[^;]*file:/);
    expect(UNTRUSTED_PREVIEW_CSP).toMatch(/style-src[^;]*'unsafe-inline'/);
  });
});

describe('isBlockedPreviewRequestUrl', () => {
  it('blocks every remote scheme - this is the exfiltration channel', () => {
    for (const url of [
      'https://evil.example/beacon?d=secret',
      'http://evil.example/beacon',
      'ws://evil.example/',
      'wss://evil.example/',
      'ftp://evil.example/',
      'chrome-extension://abc/x.js',
    ]) {
      expect(isBlockedPreviewRequestUrl(url)).toBe(true);
    }
  });

  it('allows the schemes a local preview genuinely loads', () => {
    for (const url of ['file:///tmp/report/report.html', 'data:text/html,x', 'blob:null/abc', 'about:blank']) {
      expect(isBlockedPreviewRequestUrl(url)).toBe(false);
    }
  });

  it('blocks an unparseable or empty target rather than passing it through', () => {
    expect(isBlockedPreviewRequestUrl('')).toBe(true);
    expect(isBlockedPreviewRequestUrl('not a url')).toBe(true);
  });
});

describe('withPreviewCsp', () => {
  it('puts the policy first inside an existing head', () => {
    const out = withPreviewCsp('<html><head><title>Brief</title></head><body>x</body></html>');
    expect(out).toContain(UNTRUSTED_PREVIEW_CSP);
    expect(out.indexOf('Content-Security-Policy')).toBeLessThan(out.indexOf('<title>'));
  });

  it('creates a head when the document has none', () => {
    const out = withPreviewCsp('<html><body>x</body></html>');
    expect(out).toContain(UNTRUSTED_PREVIEW_CSP);
    expect(out.indexOf('Content-Security-Policy')).toBeLessThan(out.indexOf('<body>'));
  });

  it('handles a bare fragment with no html element at all', () => {
    const out = withPreviewCsp('<p>hello</p>');
    expect(out).toContain(UNTRUSTED_PREVIEW_CSP);
    expect(out.indexOf('Content-Security-Policy')).toBeLessThan(out.indexOf('<p>'));
  });

  it('strips a document-supplied CSP meta so ours is the only one', () => {
    const hostile =
      '<html><head><meta http-equiv="Content-Security-Policy" content="default-src *"><title>t</title></head><body></body></html>';
    const out = withPreviewCsp(hostile);
    expect(out).not.toContain('default-src *');
    expect(out.match(/http-equiv=["']?Content-Security-Policy/gi)).toHaveLength(1);
  });

  it('is idempotent - re-rendering the same content does not stack policies', () => {
    const once = withPreviewCsp('<html><head></head><body>x</body></html>');
    const twice = withPreviewCsp(once);
    expect(twice.match(/http-equiv=["']?Content-Security-Policy/gi)).toHaveLength(1);
  });

  it('leaves an injected <base> in place - relative file resources still resolve', () => {
    const out = withPreviewCsp('<html><head><base href="file:///tmp/report/"></head><body></body></html>');
    expect(out).toContain('<base href="file:///tmp/report/">');
    expect(UNTRUSTED_PREVIEW_CSP).not.toContain('base-uri');
  });
});

describe('hardenUntrustedPreviewSession', () => {
  const buildFakeSession = () => {
    const captured: {
      beforeRequest?: (details: { url: string }, cb: (r: { cancel: boolean }) => void) => void;
      headersReceived?: (
        details: { url: string; responseHeaders?: Record<string, string[]> },
        cb: (r: { responseHeaders?: Record<string, string[]> }) => void
      ) => void;
      permissionRequest?: (...args: unknown[]) => void;
      permissionCheck?: (...args: unknown[]) => boolean;
    } = {};
    return {
      captured,
      target: {
        webRequest: {
          onBeforeRequest: (_filter: unknown, listener: never) => {
            captured.beforeRequest = listener;
          },
          onHeadersReceived: (_filter: unknown, listener: never) => {
            captured.headersReceived = listener;
          },
        },
        setPermissionRequestHandler: (handler: never) => {
          captured.permissionRequest = handler;
        },
        setPermissionCheckHandler: (handler: never) => {
          captured.permissionCheck = handler;
        },
      },
    };
  };

  it('cancels a remote subresource and lets a local one through', () => {
    const { captured, target } = buildFakeSession();
    hardenUntrustedPreviewSession(target);

    const blocked = vi.fn();
    captured.beforeRequest!({ url: 'https://evil.example/beacon?d=secret' }, blocked);
    expect(blocked).toHaveBeenCalledWith({ cancel: true });

    const allowed = vi.fn();
    captured.beforeRequest!({ url: 'file:///tmp/report/report.html' }, allowed);
    expect(allowed).toHaveBeenCalledWith({ cancel: false });
  });

  it('stamps our CSP over any the response carried', () => {
    const { captured, target } = buildFakeSession();
    hardenUntrustedPreviewSession(target);

    const cb = vi.fn();
    captured.headersReceived!(
      {
        url: 'file:///tmp/report/report.html',
        responseHeaders: { 'content-security-policy': ["default-src *"], 'X-Other': ['keep'] },
      },
      cb
    );
    const headers = cb.mock.calls[0][0].responseHeaders as Record<string, string[]>;
    const cspKeys = Object.keys(headers).filter((k) => k.toLowerCase() === 'content-security-policy');
    expect(cspKeys).toHaveLength(1);
    expect(headers[cspKeys[0]]).toEqual([UNTRUSTED_PREVIEW_CSP]);
    expect(headers['X-Other']).toEqual(['keep']);
  });

  it('denies every permission request and check', () => {
    const { captured, target } = buildFakeSession();
    hardenUntrustedPreviewSession(target);

    const decide = vi.fn();
    captured.permissionRequest!({}, 'media', decide);
    expect(decide).toHaveBeenCalledWith(false);
    expect(captured.permissionCheck!({}, 'media')).toBe(false);
  });
});
