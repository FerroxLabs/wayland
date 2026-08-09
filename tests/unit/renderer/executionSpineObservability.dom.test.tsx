/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Cross-backend activity parity.
 *
 * This suite began as DEFECT B: the Observability SECTION was registered at
 * exactly one site (WCoreChat), so Claude Code and Codex (both ACP) and Gemini
 * had no such surface at all. That section has since been removed outright - it
 * re-rendered, one pane to the right and detached from the turn that produced
 * them, the very steps the transcript already shows inline, and "Observability"
 * is a developer's word in a product whose user is not one.
 *
 * The parity claim underneath it did NOT go away, so these tests did not either.
 * They now assert it where it actually lives: the shared projection. MessageList
 * routes `tool_group` AND `acp_tool_call` through the same `pushToolList` ->
 * tool_summary path (MessageList.tsx:333-355) and renders the result with
 * `toolSummaryToSteps` (MessageList.tsx:545). One projection, one renderer,
 * every backend - which is exactly what DEFECT B was about.
 *
 * The tab assertions are gone because the tab is gone. The humanization,
 * grouping and rendering assertions are all still here, and are stricter than
 * before: they compare the ACP and wcore outputs against EACH OTHER rather than
 * each against a hand-written string.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

import type { TMessage } from '@/common/chat/chatLib';
import { toolSummaryToSteps } from '@/common/chat/activity/projectMessages';
import ActivityTimeline from '@/renderer/components/chat/observability/ActivityTimeline';

const acpToolCall = (id: string, title: string, kind: string, status: string): TMessage =>
  ({
    id,
    msg_id: `m-${id}`,
    conversation_id: 'c1',
    type: 'acp_tool_call',
    position: 'left',
    content: {
      sessionId: 's1',
      update: { sessionUpdate: 'tool_call', toolCallId: id, title, kind, status },
    },
  }) as unknown as TMessage;

const toolGroup = (id: string, name: string, description: string): TMessage =>
  ({
    id,
    msg_id: `turn-${id}`,
    conversation_id: 'c1',
    type: 'tool_group',
    position: 'left',
    content: [{ callId: `${id}-a`, name, description, status: 'Success' }],
  }) as unknown as TMessage;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const steps = (messages: TMessage[]) => toolSummaryToSteps(messages as any);

describe('cross-backend activity parity (was DEFECT B)', () => {
  it('humanizes an ACP read exactly as the wcore tool_group for the same invocation', () => {
    const fromAcp = steps([acpToolCall('tc1', 'Read config.ts', 'read', 'completed')]);
    const fromWcore = steps([toolGroup('tg1', 'ReadFile', 'Read config.ts')]);

    expect(fromAcp).toHaveLength(1);
    expect(fromWcore).toHaveLength(1);
    // The invariant: same invocation, same words, whichever backend produced it.
    // Asserting the two against each other means this test cannot drift into
    // passing because both regressed to the same wrong string as a literal.
    expect(fromAcp[0].label).toBe(fromWcore[0].label);
    expect(fromAcp[0].label).toContain('config.ts');
  });

  it('projects an ACP tool stream into renderable steps and shows them', () => {
    const projected = steps([
      acpToolCall('tc1', 'Read config.ts', 'read', 'completed'),
      acpToolCall('tc2', 'Search the web for kittens', 'execute', 'completed'),
    ]);
    expect(projected).toHaveLength(2);

    render(<ActivityTimeline steps={projected} defaultExpanded />);
    const timeline = screen.getByTestId('activity-timeline');
    expect(timeline.textContent).toContain('config.ts');
    expect(timeline.textContent).toContain('Search the web for kittens');
  });

  it('projects a gemini/wcore tool_group through the identical path', () => {
    const projected = steps([toolGroup('tg1', 'ReadFile', 'Read config.ts')]);
    expect(projected).toHaveLength(1);

    render(<ActivityTimeline steps={projected} defaultExpanded />);
    expect(screen.getByTestId('activity-timeline').textContent).toContain('config.ts');
  });

  it('produces nothing to render when a turn has no tool activity', () => {
    // The old suite asserted "no tab when there is nothing to show". The same
    // guarantee, one layer down: an empty projection has no steps, and
    // ActivityTimeline renders null rather than an empty shell that can only
    // disappoint.
    expect(steps([])).toHaveLength(0);
    const { container } = render(<ActivityTimeline steps={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
