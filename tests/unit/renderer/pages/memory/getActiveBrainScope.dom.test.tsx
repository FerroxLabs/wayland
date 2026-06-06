/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Task 3.5 - getActiveBrainScope resolver.
 *
 * Wave 5 will feed the resolver output into `ipcBridge.ijfw.brainInvoke` so
 * memory verbs are scoped to the active workspace when one exists, and fall
 * back to the global "app" brain otherwise.
 *
 * Resolver contract:
 *   - In a conversation with a workspace path → `{ scope: 'project', path: workspace }`.
 *   - No active conversation (outside ConversationProvider, or workspace
 *     missing / empty) → `{ scope: 'app', path: '/' }`.
 *
 * The hook reads `useConversationContextSafe()`; testing the resolver with
 * the safe variant means we exercise both branches without mounting a
 * fake conversation tree.
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ConversationProvider,
  type ConversationContextValue,
} from '@renderer/hooks/context/ConversationContext';
import { useActiveBrainScope } from '@renderer/pages/memory/getActiveBrainScope';

describe('useActiveBrainScope', () => {
  it('returns app scope when no conversation context is mounted', () => {
    const { result } = renderHook(() => useActiveBrainScope());
    expect(result.current).toEqual({ scope: 'app', path: '/' });
  });

  it('returns app scope when conversation has no workspace', () => {
    const value: ConversationContextValue = {
      conversationId: 'c1',
      type: 'gemini',
    };
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ConversationProvider value={value}>{children}</ConversationProvider>
    );
    const { result } = renderHook(() => useActiveBrainScope(), { wrapper });
    expect(result.current).toEqual({ scope: 'app', path: '/' });
  });

  it('returns project scope when conversation has a workspace path', () => {
    const value: ConversationContextValue = {
      conversationId: 'c2',
      type: 'acp',
      workspace: '/Users/test/dev/wayland',
    };
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ConversationProvider value={value}>{children}</ConversationProvider>
    );
    const { result } = renderHook(() => useActiveBrainScope(), { wrapper });
    expect(result.current).toEqual({
      scope: 'project',
      path: '/Users/test/dev/wayland',
    });
  });

  it('falls back to app scope when workspace is the empty string', () => {
    const value: ConversationContextValue = {
      conversationId: 'c3',
      type: 'codex',
      workspace: '',
    };
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ConversationProvider value={value}>{children}</ConversationProvider>
    );
    const { result } = renderHook(() => useActiveBrainScope(), { wrapper });
    expect(result.current).toEqual({ scope: 'app', path: '/' });
  });
});
