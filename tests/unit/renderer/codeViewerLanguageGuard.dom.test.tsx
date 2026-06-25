/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * CodeViewer — language guard renders without throwing (#253).
 *
 * `metadata?.language` can reach CodeViewer as undefined (extensionless files)
 * or as an explicit null/empty string. The download-title built
 * `language.toUpperCase()`, which threw a render-time TypeError when language
 * was null/'' (the `= 'text'` default param only covers undefined). The fix
 * guards it as `(language || 'text').toUpperCase()`.
 *
 * This is a fail-on-old guard: with the old code, rendering with language=null
 * throws inside render; with the fix it renders fine.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && typeof opts.defaultValue === 'string' ? (opts.defaultValue as string) : key,
  }),
}));

// Heavy syntax highlighter — render its children as plain text.
vi.mock('react-syntax-highlighter', () => ({
  LightAsync: ({ children }: { children: React.ReactNode }) => React.createElement('pre', null, children),
}));
vi.mock('react-syntax-highlighter/dist/esm/styles/hljs', () => ({ vs: {}, vs2015: {} }));

// Hooks CodeViewer calls — stub to inert values.
vi.mock('@/renderer/hooks/chat/useAutoScroll', () => ({ useAutoScroll: vi.fn() }));
vi.mock('@/renderer/hooks/ui/useTextSelection', () => ({
  useTextSelection: () => ({ selectedText: '', selectionPosition: null, clearSelection: vi.fn() }),
}));
vi.mock('@/renderer/hooks/chat/useTypingAnimation', () => ({
  useTypingAnimation: ({ content }: { content: string }) => ({ displayedContent: content }),
}));
vi.mock('../renderers/SelectionToolbar', () => ({ default: () => null }));

import CodePreview from '@/renderer/pages/conversation/Preview/components/viewers/CodeViewer';

describe('CodeViewer — language guard (#253)', () => {
  it('renders with language=undefined without throwing', () => {
    expect(() =>
      render(<CodePreview content='hello' language={undefined} viewMode='source' />)
    ).not.toThrow();
  });

  it('renders with language=null without throwing (fail-on-old: language.toUpperCase())', () => {
    // The download title uses (language || "text").toUpperCase(); with the
    // pre-fix `language.toUpperCase()`, an explicit null threw a TypeError at
    // render (the default param only covers undefined). hideToolbar defaults to
    // false so the title attribute is exercised.
    expect(() =>
      render(<CodePreview content='hello' language={null as unknown as undefined} viewMode='source' />)
    ).not.toThrow();
  });
});
