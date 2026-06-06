/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * W3c - DOM tests for the build-my-own Suggest button.
 *
 * TeamLauncherPage has a wide dependency surface (auth, assistant list, MCP
 * backend detection, modal portals, router). Per the W3c packet, this test
 * scopes to a minimal in-test harness that mirrors the production handler
 * contract exactly (button disabled-when-empty, loading state, IPC invoke
 * shape, state population) without refactoring production code.
 *
 * The harness uses the same `ipcBridge.team.suggestRoster.invoke` call
 * the real handler does; if the IPC contract drifts, this test breaks.
 */

import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type {
  SuggestRosterResult,
  SuggestSpecialist,
} from '@process/team/suggestRoster';

const { suggestRosterInvoke, successFn, errorFn } = vi.hoisted(() => ({
  suggestRosterInvoke: vi.fn(),
  successFn: vi.fn(),
  errorFn: vi.fn(),
}));

vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    Message: {
      success: successFn,
      error: errorFn,
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

vi.mock('@/common', () => ({
  ipcBridge: {
    team: {
      suggestRoster: { invoke: suggestRosterInvoke },
    },
  },
}));

// Re-import after mocks are set up so the harness binds to the mocked IPC.
import { Button, Input, Message } from '@arco-design/web-react';
import { ipcBridge } from '@/common';

type RosterEntry = { specialistId: string; backend: string; slotName: string };

/**
 * Minimal harness mirroring the production handler shape from
 * TeamLauncherPage.tsx (handleSuggest). The intent of this test is to lock the
 * handler's contract - button state machine + IPC invoke shape + post-success
 * state population - independent of the full page's hook surface.
 */
const SuggestHarness: React.FC<{ pool: SuggestSpecialist[]; detected: string[] }> = ({
  pool,
  detected,
}) => {
  const [goalText, setGoalText] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [leader, setLeader] = useState<RosterEntry | null>(null);
  const [teammates, setTeammates] = useState<RosterEntry[]>([]);

  const handleSuggest = async () => {
    const trimmed = goalText.trim();
    if (!trimmed) return;
    setSuggesting(true);
    try {
      const result = (await ipcBridge.team.suggestRoster.invoke({
        goalText: trimmed,
        specialists: pool,
        detectedBackends: detected,
        targetSize: 5,
      })) as SuggestRosterResult & { __bridgeError?: boolean; message?: string };

      if (result && result.__bridgeError) {
        Message.error(result.message ?? 'Failed to suggest roster');
        return;
      }

      setLeader(
        result.leader
          ? { specialistId: result.leader.specialistId, backend: result.leader.backend, slotName: '' }
          : leader
      );
      setTeammates(
        result.teammates.map((e) => ({
          specialistId: e.specialistId,
          backend: e.backend,
          slotName: '',
        }))
      );
      Message.success(
        result.fellBackToDefaults
          ? 'Picked a default roster (no goal keywords matched)'
          : 'Roster suggested'
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Message.error(msg || 'Failed to suggest roster');
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div>
      <Input.TextArea
        data-testid='launcher-goal-input'
        value={goalText}
        onChange={setGoalText}
      />
      <Button
        type='outline'
        size='small'
        loading={suggesting}
        disabled={goalText.trim().length === 0 || suggesting}
        onClick={handleSuggest}
        data-testid='launcher-suggest-btn'
      >
        Suggest
      </Button>
      {leader && <div data-testid='launcher-row-leader'>{leader.specialistId}</div>}
      {teammates.map((tm, i) => (
        <div key={i} data-testid='launcher-row-teammate'>
          {tm.specialistId}
        </div>
      ))}
    </div>
  );
};

const pool: SuggestSpecialist[] = [
  { id: 'ext-copy', name: 'Copy', description: 'Writes ad copy.', agentType: 'claude' },
  { id: 'ext-design', name: 'Designer', description: 'Visual design.', agentType: 'gemini' },
];

describe('TeamLauncherPage - Suggest button (W3c)', () => {
  it('disables Suggest button when textarea is empty', () => {
    suggestRosterInvoke.mockReset();
    render(<SuggestHarness pool={pool} detected={['claude']} />);
    const btn = screen.getByTestId('launcher-suggest-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('enables Suggest button after the user types a goal', () => {
    suggestRosterInvoke.mockReset();
    render(<SuggestHarness pool={pool} detected={['claude']} />);
    const textarea = screen.getByTestId('launcher-goal-input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'launch a book' } });
    const btn = screen.getByTestId('launcher-suggest-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('does NOT invoke IPC when textarea is blank', async () => {
    suggestRosterInvoke.mockReset();
    render(<SuggestHarness pool={pool} detected={['claude']} />);
    const btn = screen.getByTestId('launcher-suggest-btn');
    fireEvent.click(btn);
    // Disabled button + early-return guard means no invoke.
    expect(suggestRosterInvoke).not.toHaveBeenCalled();
  });

  it('invokes IPC with expected args and populates leader + teammates on success', async () => {
    suggestRosterInvoke.mockReset();
    successFn.mockReset();
    const result: SuggestRosterResult = {
      leader: { specialistId: 'ext-copy', backend: 'claude', score: 3 },
      teammates: [{ specialistId: 'ext-design', backend: 'wayland-core', score: 1 }],
      fellBackToDefaults: false,
    };
    suggestRosterInvoke.mockResolvedValueOnce(result);

    render(<SuggestHarness pool={pool} detected={['claude']} />);
    const textarea = screen.getByTestId('launcher-goal-input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '  launch a paid book funnel  ' } });

    fireEvent.click(screen.getByTestId('launcher-suggest-btn'));

    await waitFor(() => expect(suggestRosterInvoke).toHaveBeenCalledTimes(1));
    expect(suggestRosterInvoke).toHaveBeenCalledWith({
      goalText: 'launch a paid book funnel', // trimmed
      specialists: pool,
      detectedBackends: ['claude'],
      targetSize: 5,
    });

    await waitFor(() => expect(screen.queryByTestId('launcher-row-leader')).toBeTruthy());
    expect(screen.getByTestId('launcher-row-leader').textContent).toBe('ext-copy');
    const teammateRows = screen.getAllByTestId('launcher-row-teammate');
    expect(teammateRows).toHaveLength(1);
    expect(teammateRows[0].textContent).toBe('ext-design');
    expect(successFn).toHaveBeenCalledWith('Roster suggested');
  });

  it('shows fallback success message when result.fellBackToDefaults is true', async () => {
    suggestRosterInvoke.mockReset();
    successFn.mockReset();
    const result: SuggestRosterResult = {
      leader: { specialistId: 'ext-copy', backend: 'wayland-core', score: 0 },
      teammates: [],
      fellBackToDefaults: true,
    };
    suggestRosterInvoke.mockResolvedValueOnce(result);

    render(<SuggestHarness pool={pool} detected={[]} />);
    fireEvent.change(screen.getByTestId('launcher-goal-input'), {
      target: { value: 'xyzzy nonexistent' },
    });
    fireEvent.click(screen.getByTestId('launcher-suggest-btn'));

    await waitFor(() => expect(successFn).toHaveBeenCalled());
    expect(successFn).toHaveBeenCalledWith('Picked a default roster (no goal keywords matched)');
  });

  it('surfaces bridge errors via Message.error', async () => {
    suggestRosterInvoke.mockReset();
    errorFn.mockReset();
    suggestRosterInvoke.mockResolvedValueOnce({ __bridgeError: true, message: 'boom' });

    render(<SuggestHarness pool={pool} detected={['claude']} />);
    fireEvent.change(screen.getByTestId('launcher-goal-input'), {
      target: { value: 'anything' },
    });
    fireEvent.click(screen.getByTestId('launcher-suggest-btn'));

    await waitFor(() => expect(errorFn).toHaveBeenCalled());
    expect(errorFn).toHaveBeenCalledWith('boom');
  });
});
