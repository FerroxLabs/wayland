/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEffectiveSelection, installShadowCopyHandler } from '@/renderer/utils/shadowSelection';

/** Build a fake Selection with the given (non-collapsed) text. */
function fakeSelection(text: string, collapsed = false): Selection {
  return {
    isCollapsed: collapsed,
    toString: () => text,
  } as unknown as Selection;
}

/** Attach a shadow host whose shadowRoot.getSelection() returns `sel`. */
function shadowHostWithSelection(sel: Selection | null): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  // jsdom does not implement ShadowRoot.getSelection(); stub it.
  (root as unknown as { getSelection: () => Selection | null }).getSelection = () => sel;
  return host;
}

/** Dispatch a synthetic `copy` event with a working clipboardData bag. */
function dispatchCopy(target: EventTarget): { written: Record<string, string>; defaultPrevented: boolean } {
  const written: Record<string, string> = {};
  const event = new Event('copy', { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: { setData: (type: string, data: string) => (written[type] = data) },
  });
  Object.defineProperty(event, 'target', { value: target });
  document.dispatchEvent(event);
  return { written, defaultPrevented: event.defaultPrevented };
}

describe('getEffectiveSelection', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('returns the document selection when it has text', () => {
    const docSel = fakeSelection('hello from doc');
    vi.spyOn(document, 'getSelection').mockReturnValue(docSel);
    expect(getEffectiveSelection(document.body)?.toString()).toBe('hello from doc');
  });

  it('falls through to a shadow-root selection when the document selection is empty', () => {
    vi.spyOn(document, 'getSelection').mockReturnValue(fakeSelection('', true));
    const host = shadowHostWithSelection(fakeSelection('agent message text'));
    expect(getEffectiveSelection(host)?.toString()).toBe('agent message text');
  });

  it('returns the (empty) document selection when no shadow selection exists', () => {
    const empty = fakeSelection('', true);
    vi.spyOn(document, 'getSelection').mockReturnValue(empty);
    const host = shadowHostWithSelection(fakeSelection('', true));
    expect(getEffectiveSelection(host)).toBe(empty);
  });
});

describe('installShadowCopyHandler', () => {
  let dispose: () => void;

  beforeEach(() => {
    dispose = installShadowCopyHandler();
  });
  afterEach(() => {
    dispose();
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('copies shadow-root selection text when the document selection is empty', () => {
    vi.spyOn(document, 'getSelection').mockReturnValue(fakeSelection('', true));
    const host = shadowHostWithSelection(fakeSelection('shadow copied text'));
    const { written, defaultPrevented } = dispatchCopy(host);
    expect(written['text/plain']).toBe('shadow copied text');
    expect(defaultPrevented).toBe(true);
  });

  it('leaves a normal (non-empty document) selection to the native copy', () => {
    vi.spyOn(document, 'getSelection').mockReturnValue(fakeSelection('typed in an input'));
    const { written, defaultPrevented } = dispatchCopy(document.body);
    expect(written['text/plain']).toBeUndefined();
    expect(defaultPrevented).toBe(false);
  });

  it('does nothing when there is no selection anywhere', () => {
    vi.spyOn(document, 'getSelection').mockReturnValue(fakeSelection('', true));
    const host = shadowHostWithSelection(fakeSelection('', true));
    const { written, defaultPrevented } = dispatchCopy(host);
    expect(written['text/plain']).toBeUndefined();
    expect(defaultPrevented).toBe(false);
  });
});
