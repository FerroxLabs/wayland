/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4c - Sandboxed-team task content sanitization.
 *
 * Strict allowlist render filter built on DOMPurify. DB stores raw input;
 * this runs at render time when team.isSandboxed === true. Trusted teams
 * render through the normal markdown pipeline.
 *
 * Callers MUST pass the returned HTML through DOMPurify-sanitized rendering
 * only - this module is the only safe path for sandboxed team task content.
 *
 * @deprecated Not yet wired into production. v0.6.0-wayland-teams ships
 * without a dedicated task-description render sink: `TeamActivityTab`
 * renders all event payload strings via React text children (auto-escaped),
 * so there is no live HTML sink for imported-team content today. This
 * helper is preserved as a defense-in-depth utility for the W5.2 / v0.6.1
 * task tab work that introduces the first real HTML sink for imported
 * teams. Wiring `dangerouslySetInnerHTML` before that sink lands would
 * widen the attack surface, not close it. The W5 audit MED (gemini CRIT-1
 * downgrade) tracked this gap and accepted Option B (note + export test).
 */

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['p', 'br', 'em', 'strong', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'];
const ALLOWED_ATTR = ['href'];
const SAFE_HREF_SCHEMES = ['http:', 'https:', 'mailto:'];

const isSafeHref = (href: string): boolean => {
  const trimmed = href.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return true;
  return SAFE_HREF_SCHEMES.some((scheme) => trimmed.startsWith(scheme));
};

/** Plain-text title - strips all HTML; caller renders as React text child. */
export const sanitizeTeamTaskTitle = (raw: string): string => {
  return DOMPurify.sanitize(raw, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/** Markdown-style description - strict DOMPurify allowlist. */
export const sanitizeTeamTaskDescription = (rawHtml: string): string => {
  const cleaned = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: [
      'style',
      'script',
      'iframe',
      'object',
      'embed',
      'svg',
      'math',
      'video',
      'audio',
      'source',
      'picture',
      'link',
      'meta',
      'base',
      'img',
    ],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onmouseenter', 'onmouseleave'],
  });

  // Anchor post-pass: reject unsafe schemes, force rel + target.
  return cleaned.replace(/<a\b([^>]*?)\bhref=(["'])([^"']*)\2([^>]*)>/gi, (_match, before, quote, href, after) => {
    if (!isSafeHref(href)) return '';
    const stripped = `${before} ${after}`
      .replace(/\srel=(["'])[^"']*\1/gi, '')
      .replace(/\starget=(["'])[^"']*\1/gi, '')
      .trim();
    const spacer = stripped ? ` ${stripped}` : '';
    return `<a${spacer} href=${quote}${href}${quote} rel="noopener noreferrer nofollow" target="_blank">`;
  });
};
