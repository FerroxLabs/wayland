/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Lift proof for useAssistantEditor.
 *
 * The hook today is consumed only by AssistantSettings. The chat-redesign
 * Phase 3 (/assistants library page) will mount AssistantEditDrawer from
 * outside the Settings tree, which means useAssistantEditor must also be
 * callable from any page - no hidden Settings-context coupling.
 *
 * This test calls the hook in isolation (no Settings parent) with minimal
 * synthetic params, then asserts the documented return shape. If the hook
 * silently reaches into Settings context or breaks when mounted standalone,
 * this test fails.
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useAssistantEditor } from '../../../../src/renderer/hooks/assistant';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

vi.mock('../../../../src/common', () => ({
  ipcBridge: {
    fs: {
      readAssistantRule: { invoke: vi.fn().mockResolvedValue('') },
      readAssistantSkill: { invoke: vi.fn().mockResolvedValue('') },
      listAvailableSkills: { invoke: vi.fn().mockResolvedValue([]) },
      listBuiltinAutoSkills: { invoke: vi.fn().mockResolvedValue([]) },
      writeAssistantRule: { invoke: vi.fn().mockResolvedValue(undefined) },
      importSkillWithSymlink: { invoke: vi.fn().mockResolvedValue({ success: true }) },
    },
  },
}));

vi.mock('../../../../src/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn().mockResolvedValue([]),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAssistantEditor - lift contract', () => {
  const baseParams = {
    localeKey: 'en-US',
    activeAssistant: null,
    isExtensionAssistant: () => false,
    setActiveAssistantId: vi.fn(),
    loadAssistants: vi.fn().mockResolvedValue(undefined),
    refreshAgentDetection: vi.fn().mockResolvedValue(undefined),
    // The hook only calls .error on this - a stub function is enough.
    message: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() } as unknown as Parameters<
      typeof useAssistantEditor
    >[0]['message'],
  };

  it('mounts in isolation (no Settings parent) and returns a populated state object', () => {
    const { result } = renderHook(() => useAssistantEditor(baseParams));

    expect(result.current).toBeDefined();
    // Drawer closed, not creating, no selection by default.
    expect(result.current.editVisible).toBe(false);
    expect(result.current.isCreating).toBe(false);
    expect(result.current.editName).toBe('');
    expect(result.current.editAvatar).toBe('');
    expect(result.current.editAgent).toBe('gemini');
    expect(result.current.promptViewMode).toBe('preview');
  });

  it('exposes the full handler surface the drawer needs', () => {
    const { result } = renderHook(() => useAssistantEditor(baseParams));

    // Handlers must be functions - if any are undefined the drawer will
    // crash at runtime when wired up from a non-Settings page.
    expect(typeof result.current.handleEdit).toBe('function');
    expect(typeof result.current.handleCreate).toBe('function');
    expect(typeof result.current.handleDuplicate).toBe('function');
    expect(typeof result.current.handleSave).toBe('function');
    expect(typeof result.current.handleDeleteClick).toBe('function');
    expect(typeof result.current.handleDeleteConfirm).toBe('function');
    expect(typeof result.current.handleToggleEnabled).toBe('function');
  });

  it('exposes every state field the drawer destructures', () => {
    const { result } = renderHook(() => useAssistantEditor(baseParams));

    // This is the contract the drawer relies on - keep in sync with the
    // destructure inside AssistantEditDrawer.tsx. If a field is removed
    // from the hook return, this assertion fails BEFORE the drawer
    // crashes silently.
    const required = [
      'editVisible',
      'setEditVisible',
      'isCreating',
      'editName',
      'setEditName',
      'editDescription',
      'setEditDescription',
      'editAvatar',
      'setEditAvatar',
      'editAgent',
      'setEditAgent',
      'editContext',
      'setEditContext',
      'promptViewMode',
      'setPromptViewMode',
      'availableSkills',
      'selectedSkills',
      'setSelectedSkills',
      'pendingSkills',
      'customSkills',
      'setDeletePendingSkillName',
      'setDeleteCustomSkillName',
      'setSkillsModalVisible',
      'builtinAutoSkills',
      'disabledBuiltinSkills',
      'setDisabledBuiltinSkills',
      'handleSave',
      'handleDeleteClick',
    ] as const;

    for (const key of required) {
      expect(result.current).toHaveProperty(key);
    }
  });

  // Suppress unused-import warning on React; renderHook needs it in scope
  // for some test runners' JSX transform.
  void React;
});
