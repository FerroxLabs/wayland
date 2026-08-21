/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-8. Assembly of the document the preview surface actually loads.
 *
 * Kept out of `HTMLRenderer.tsx` because it is the security-relevant part and
 * it is pure: the policy either is in the bytes or it is not, and that is worth
 * asserting directly rather than through a mounted component.
 *
 * The bytes of the report are NOT rewritten. A `<script>` a model wrote stays
 * in the document; CSP is what stops it running. Stripping tags would make the
 * preview a lie about what the file contains - and the user is about to decide
 * whether to send that file to their team.
 */

import { withPreviewCsp } from '@/common/preview/untrustedPreview';

/**
 * The directory of `filePath`, as a `file://` URL suitable for `<base href>`.
 * Handles both separators: a Windows path arrives with backslashes.
 */
function baseHrefFor(filePath: string): string {
  const cut = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  const dir = cut < 0 ? filePath : filePath.slice(0, cut + 1);
  return `file://${dir.replace(/\\/g, '/')}`;
}

/**
 * Policy first, then the base tag.
 *
 * Order matters twice over. CSP applies from the point the parser reads it, so
 * a policy after a `<script>` would let that script run. And the base tag has
 * to land INSIDE the head the policy injection may have just created, which is
 * only guaranteed if the policy goes in first.
 */
export function buildPreviewDocument(html: string, filePath: string | undefined): string {
  let out = withPreviewCsp(html ?? '');

  if (filePath && !/<base\s+href=/i.test(out)) {
    const baseTag = `<base href="${baseHrefFor(filePath)}">`;
    // Insert AFTER the policy meta, never before it: a base tag ahead of the
    // CSP would push the policy later in the head, and everything the parser
    // reads before a policy is read outside it.
    const policyMeta = /<meta\b[^>]*http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/i.exec(out);
    const headOpen = /<head\b[^>]*>/i.exec(out);
    const anchor = policyMeta ?? headOpen;
    // `withPreviewCsp` guarantees both exist, so the fallback only covers a
    // future caller passing in a document it never touched.
    out = anchor
      ? `${out.slice(0, anchor.index + anchor[0].length)}${baseTag}${out.slice(anchor.index + anchor[0].length)}`
      : `<head>${baseTag}</head>${out}`;
  }

  return out;
}

/**
 * The `data:` URL form.
 *
 * Fully percent-encoded rather than passed through raw: an unencoded `#` in the
 * report would be read as a fragment delimiter and silently truncate the
 * document at that byte, which is a corruption bug long before it is a security
 * one.
 */
export function buildPreviewDataUrl(html: string, filePath: string | undefined): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(buildPreviewDocument(html, filePath))}`;
}

/**
 * Does handing this preview to the OS default browser deserve a warning?
 *
 * Only HTML. Inside the panel it renders with no scripts and no network; in
 * the browser it renders with both, against third-party data a model pulled in
 * and nobody vetted - so leaving is a real downgrade in protection and the user
 * is the only one who can weigh it. Every other preview kind (an image, a PDF,
 * a spreadsheet) is inert by comparison, and a warning nobody needs is a
 * warning nobody reads.
 */
export function externalOpenNeedsWarning(contentType: string): boolean {
  return contentType === 'html';
}
