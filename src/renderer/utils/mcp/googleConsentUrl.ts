/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Google Workspace MCP OAuth consent-URL detection (#475).
 *
 * The `start_google_auth` tool (Google Workspace MCP) returns a Google consent
 * URL as plain text in its result. The composer renders MCP tool results as an
 * inert <pre>, so the URL is not clickable and the browser hand-off never
 * happens. We detect that specific URL so the UI can offer an "open in browser"
 * affordance — without turning arbitrary tool output into openable links.
 *
 * Scoped deliberately narrow: only the `start_google_auth` tool, and only a
 * host of `accounts.google.com`, so a hostile tool result can't smuggle an
 * arbitrary link into a one-click button.
 */

/** Matches a Google accounts consent URL, excluding surrounding whitespace/markup. */
const GOOGLE_CONSENT_URL_RE = /https:\/\/accounts\.google\.com\/[^\s"')<>\]]+/i;

/** Tool names arrive MCP-prefixed (server__tool); match the suffix. */
function isStartGoogleAuth(toolName: string): boolean {
  return toolName.toLowerCase().includes('start_google_auth');
}

/**
 * Extract the Google OAuth consent URL from a `start_google_auth` tool result.
 * Returns the URL string, or null when the tool isn't start_google_auth, the
 * result isn't a string, or no accounts.google.com URL is present.
 */
export function extractGoogleConsentUrl(toolName: string | undefined, resultDisplay: unknown): string | null {
  if (!toolName || !isStartGoogleAuth(toolName)) return null;
  if (typeof resultDisplay !== 'string' || resultDisplay.length === 0) return null;

  const match = resultDisplay.match(GOOGLE_CONSENT_URL_RE);
  if (!match) return null;

  // Trim trailing punctuation that commonly hugs an inline URL (". , ; )") so a
  // sentence-embedded link resolves to the bare URL.
  return match[0].replace(/[.,;)\]]+$/, '');
}
