/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Integration test for the Phase 2 new-chat starter wiring.
 *
 * Mounting the full GuidPage in jsdom would drag in dozens of unrelated
 * subsystems (IPC bridges, SWR caches, agent registry, etc.). Instead we
 * compose the three pieces (IntentPillBar + IntentSuggestionPanel +
 * RecentsStrip) with the same handler shapes GuidPage.tsx wires up and
 * assert end-to-end behaviour: pill click expands the panel, prompt click
 * fills the input AND routes via `selectPresetAssistant`.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React, { useCallback, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string; [k: string]: unknown }) => {
      const dv = options?.defaultValue ?? _key;
      return typeof dv === 'string'
        ? dv.replace(/{{\s*(\w+)\s*}}/g, (_m, name: string) => String(options?.[name] ?? ''))
        : _key;
    },
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({
    children,
    onClick,
    icon,
    type: _type,
    size: _size,
    shape: _shape,
    ...rest
  }: React.ComponentProps<'button'> & {
    type?: string;
    size?: string;
    shape?: string;
    icon?: React.ReactNode;
  }) => (
    <button type='button' onClick={onClick} {...rest}>
      {icon}
      {children}
    </button>
  ),
}));

vi.mock('swr', () => ({
  default: () => ({ data: [] as Record<string, unknown>[] }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    extensions: {
      getAssistants: { invoke: () => Promise.resolve([] as Record<string, unknown>[]) },
    },
  },
}));

vi.mock('@/renderer/pages/guid/hooks/useRecentConversations', () => ({
  useRecentConversations: () => ({ recents: [] }),
}));

import IntentPillBar from '@/renderer/pages/guid/components/newChatStarter/IntentPillBar';
import IntentSuggestionPanel from '@/renderer/pages/guid/components/newChatStarter/IntentSuggestionPanel';
import RecentsStrip from '@/renderer/pages/guid/components/newChatStarter/RecentsStrip';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import { INTENTS, type IntentKey, type IntentPrompt } from '@/renderer/pages/guid/intents';

type SelectedAssistantKey = string | null;
type RecentSummary = { id: string };

/**
 * Mini-GuidPage harness that mirrors the wiring inside `GuidPage.tsx`. The
 * goal is to exercise the same callback shapes GuidPage uses, not to
 * recreate the full page.
 */
const TestHarness: React.FC<{
  onAssistantSelected: (key: SelectedAssistantKey) => void;
  onInputSet: (text: string) => void;
  onRecentResume: (conv: RecentSummary) => void;
}> = ({ onAssistantSelected, onInputSet, onRecentResume }) => {
  const [activeIntent, setActiveIntent] = useState<IntentKey | null>(null);
  const [input, setInput] = useState('');

  const handleIntent = useCallback((next: IntentKey | null) => setActiveIntent(next), []);

  const handlePromptSelect = useCallback(
    (prompt: IntentPrompt) => {
      // Mirror Phase 1's selectPresetAssistant Rory rule: resolve the preset
      // from ASSISTANT_PRESETS first, fall back to gemini for bundle ids.
      const preset = ASSISTANT_PRESETS.find((p) => p.id === prompt.targetAssistantId);
      const backend = preset?.presetAgentType ?? 'gemini';
      onAssistantSelected(`custom:${preset?.id ?? prompt.targetAssistantId}@${backend}`);
      onInputSet(prompt.promptText);
      setInput(prompt.promptText);
    },
    [onAssistantSelected, onInputSet]
  );

  return (
    <div>
      <input data-testid='harness-input' readOnly value={input} />
      <IntentPillBar activeIntent={activeIntent} onSelect={handleIntent} />
      {activeIntent ? (
        <IntentSuggestionPanel
          intent={activeIntent}
          onSelect={handlePromptSelect}
          onClose={() => setActiveIntent(null)}
        />
      ) : null}
      <RecentsStrip
        onSelect={onRecentResume}
        recents={[
          {
            id: 'conv-resume',
            name: 'Prior chat',
            assistantId: undefined,
            assistantName: undefined,
            assistantIcon: undefined,
            modifyTime: 1,
          },
        ]}
      />
    </div>
  );
};

describe('new-chat starter wiring', () => {
  it('opens the suggestion panel when a pill is clicked, then routes + fills input on prompt click', () => {
    const onAssistantSelected = vi.fn();
    const onInputSet = vi.fn();
    const onRecentResume = vi.fn();
    render(
      <TestHarness
        onAssistantSelected={onAssistantSelected}
        onInputSet={onInputSet}
        onRecentResume={onRecentResume}
      />
    );

    // Panel hidden by default
    expect(screen.queryByTestId('intent-suggestion-panel')).toBeNull();

    // Activate the "Build" intent
    fireEvent.click(screen.getByRole('tab', { name: /build/i }));
    const panel = screen.getByTestId('intent-suggestion-panel');
    expect(panel.getAttribute('data-intent')).toBe('build');

    // Click first prompt — Smith
    const firstRow = screen.getAllByTestId('intent-suggestion-row')[0];
    expect(firstRow.getAttribute('data-target-assistant-id')).toBe(INTENTS.build.prompts[0].targetAssistantId);
    fireEvent.click(firstRow);

    // The chat input got the prompt text
    expect(onInputSet).toHaveBeenCalledWith(INTENTS.build.prompts[0].promptText);
    expect((screen.getByTestId('harness-input') as HTMLInputElement).value).toBe(
      INTENTS.build.prompts[0].promptText
    );

    // selectPresetAssistant routed to the bundle-id-shaped key. smith is an
    // extension assistant so the harness falls back to gemini per Phase 1's
    // documented behaviour.
    expect(onAssistantSelected).toHaveBeenCalledTimes(1);
    expect(onAssistantSelected.mock.calls[0][0]).toBe('custom:smith@gemini');
  });

  it('routes built-in preset prompts to the preset.presetAgentType backend (Rory rule)', () => {
    const onAssistantSelected = vi.fn();
    const onInputSet = vi.fn();
    const onRecentResume = vi.fn();
    render(
      <TestHarness
        onAssistantSelected={onAssistantSelected}
        onInputSet={onInputSet}
        onRecentResume={onRecentResume}
      />
    );

    // sell intent → pitch-deck-creator (built-in preset)
    fireEvent.click(screen.getByRole('tab', { name: /sell/i }));
    const rows = screen.getAllByTestId('intent-suggestion-row');
    const pitchRow = rows.find((row) => row.getAttribute('data-target-assistant-id') === 'pitch-deck-creator');
    expect(pitchRow).toBeTruthy();
    fireEvent.click(pitchRow!);

    const preset = ASSISTANT_PRESETS.find((p) => p.id === 'pitch-deck-creator');
    expect(preset).toBeTruthy();
    expect(onAssistantSelected).toHaveBeenCalledWith(`custom:pitch-deck-creator@${preset!.presetAgentType ?? 'gemini'}`);
  });

  it('toggling the active pill collapses the panel without firing onSelect', () => {
    const onAssistantSelected = vi.fn();
    const onInputSet = vi.fn();
    const onRecentResume = vi.fn();
    render(
      <TestHarness
        onAssistantSelected={onAssistantSelected}
        onInputSet={onInputSet}
        onRecentResume={onRecentResume}
      />
    );

    const writeTab = screen.getByRole('tab', { name: /write/i });
    fireEvent.click(writeTab);
    expect(screen.getByTestId('intent-suggestion-panel')).toBeTruthy();

    fireEvent.click(writeTab); // toggle off
    expect(screen.queryByTestId('intent-suggestion-panel')).toBeNull();
    expect(onAssistantSelected).not.toHaveBeenCalled();
    expect(onInputSet).not.toHaveBeenCalled();
  });

  it('clicking a recents card resumes that conversation', () => {
    const onAssistantSelected = vi.fn();
    const onInputSet = vi.fn();
    const onRecentResume = vi.fn();
    render(
      <TestHarness
        onAssistantSelected={onAssistantSelected}
        onInputSet={onInputSet}
        onRecentResume={onRecentResume}
      />
    );

    fireEvent.click(screen.getAllByTestId('recents-card')[0]);
    expect(onRecentResume).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'conv-resume' })
    );
  });
});
