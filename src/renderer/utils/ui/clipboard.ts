/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

/**
 * Copy text to clipboard with fallback for non-secure contexts (e.g. WebUI over HTTP).
 * Uses navigator.clipboard when available, otherwise falls back to document.execCommand('copy').
 */
export const copyText = async (text: string): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('copyText requires a browser environment');
  }

  // Prefer the async Clipboard API, but FALL BACK on any failure rather than
  // throwing. In Electron on macOS `writeText` can reject even when the API is
  // present - clipboard-write permission not granted, the document not focused,
  // or a custom-protocol context that isn't treated as secure - which surfaced a
  // spurious "Copy failed" toast (issue #10). The execCommand path below works
  // from a focused document (a click handler always provides focus).
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to the execCommand fallback
    }
  }

  // Fallback for non-secure contexts (WebUI over HTTP) and for a rejected
  // Clipboard API write.
  const previousActiveElement = document.activeElement as HTMLElement | null;
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const success = document.execCommand('copy');
    if (!success) {
      throw new Error('execCommand copy returned false');
    }
  } finally {
    document.body.removeChild(textArea);
    if (
      previousActiveElement &&
      typeof previousActiveElement.focus === 'function' &&
      document.contains(previousActiveElement)
    ) {
      previousActiveElement.focus();
    }
  }
};
