/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { deriveStep } from '@/common/chat/activity/activityLabels';
import type { TMessage } from '@/common/chat/chatLib';
import {
  adaptAcpMessages,
  adaptWCoreMessages,
  projectExecution,
  selectCanonicalRunSnapshot,
  selectCurrentExecutionMessages,
  type ExecutionActivity,
  type ExecutionBackend,
  type ExecutionSeed,
} from '@/common/execution';
import ExecutionSpine from '@/renderer/pages/conversation/components/ExecutionSpine';
import WorkbenchHost from '@/renderer/pages/conversation/components/WorkbenchHost';
import { MessageListProvider } from '@/renderer/pages/conversation/Messages/hooks';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string; completed?: number; total?: number; count?: number }) =>
      options?.defaultValue
        ?.replace('{{completed}}', String(options.completed))
        .replace('{{total}}', String(options.total))
        .replace('{{count}}', String(options.count)) ?? _key,
  }),
}));

/**
 * The workbench is Workspace ONLY: the spine publishes NOTHING to the right
 * rail. `mission` / "Progress" and the `projection:*` "Engine" sections were
 * both unpublished deliberately (ExecutionSpine/index.tsx), so the mission rail
 * these cases used to read the run through no longer mounts anywhere.
 *
 * Several guarantees below were only ever OBSERVABLE through that rail - the
 * humanized step labels, the secret masking those labels inherit, the ACP turn
 * window. They are NOT dropped: the rail was a renderer of the canonical run,
 * and the canonical run is still what the spine computes, so those cases now
 * assert on the run itself, built by the two helpers below through the exact
 * same calls the component makes. Every one of them still fails if the
 * behaviour it names regresses; what is gone is only the extra `<li>` the
 * deleted panel used to wrap the value in.
 */
const NOW = 2_000;

/**
 * ExecutionSpine's own pipeline, called directly:
 * selectCurrentExecutionMessages -> adapt<backend> -> projectExecution ->
 * selectCanonicalRunSnapshot, seeded the way the component seeds it
 * (index.tsx:58-76). The runId each case asserts on the DOM is passed in here
 * too, which is what keeps the helper pinned to the run actually rendered
 * rather than to a hand-built parallel one.
 */
const canonicalRun = (backend: ExecutionBackend, messages: readonly TMessage[], runId: string) => {
  const [correlationId, turnId] = [runId.slice(0, runId.indexOf(':')), runId.slice(runId.indexOf(':') + 1)];
  const identity = { runId, turnId, correlationId } as const;
  const seed: ExecutionSeed = {
    identity,
    actor: { backend, agentId: backend },
    scope: { workspaceId: 'workspace-1', host: 'desktop', trust: 'unknown', scheduled: false },
    requestedGovernance: { mode: 'ask', enforceability: 'advisory' },
  };
  const context = { identity, observedAt: NOW };
  const current = selectCurrentExecutionMessages(backend, messages);
  const events = backend === 'wcore' ? adaptWCoreMessages(current, context) : adaptAcpMessages(current, context);
  return selectCanonicalRunSnapshot(projectExecution(seed, events, { now: NOW }));
};

/**
 * The step label a user reads, built the way every renderer of a canonical
 * activity builds it: the chat timeline's own humanizer over name + detail +
 * command. A step therefore reads as the work done ("Running printf 'ok'"),
 * not as the tool's name - and a credential that survived into any of those
 * three fields would surface right here.
 */
const stepLabel = (activity: ExecutionActivity): string =>
  deriveStep({
    kind: 'tool',
    name: activity.name,
    detail: activity.detail,
    ...(activity.command ? { command: activity.command } : {}),
  }).label;

describe('ExecutionSpine', () => {
  it('renders the thread from the canonical run and publishes nothing to the workbench', () => {
    const messages = [
      {
        id: 'plan-1',
        conversation_id: 'conversation-1',
        type: 'plan',
        content: {
          sessionId: 'session-1',
          entries: [{ content: 'Build the report', status: 'in_progress', priority: 'high' }],
        },
        createdAt: 1_000,
      },
      {
        id: 'activity-1',
        conversation_id: 'conversation-1',
        type: 'activity',
        content: { turnId: 'turn-1', status: 'running', nodes: [] },
        createdAt: 1_000,
      },
    ] as TMessage[];
    render(
      <WorkbenchHost conversationId='conversation-1'>
        <MessageListProvider value={messages}>
          <ExecutionSpine
            backend='wcore'
            conversationId='conversation-1'
            workspaceId='workspace-1'
            projectId='project-1'
            agentId='wcore'
          >
            <div>conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );
    const thread = screen.getByTestId('execution-thread-summary');
    // The turn id comes off the latest activity message, not off the
    // conversation - so this is the canonical run's own identity, reached
    // through the DOM.
    expect(thread.dataset.runId).toBe('conversation-1:turn-1');
    expect(thread.textContent).toContain('Build the report');
    // ONCE, not twice. The step used to render a second time in the mission
    // rail; a re-published Progress section would put it back and turn this
    // red, which is the point of asserting the count rather than presence.
    expect(screen.getAllByText('Build the report')).toHaveLength(1);
    expect(screen.queryByTestId('workbench-mission')).toBeNull();
    expect(screen.queryByTestId('workbench-panel')).toBeNull();
  });

  // A plain WCore turn emits no `plan` message at all - it just runs tools, so
  // the run's progress IS the steps it took. Nothing but the activity stream
  // carries them, and the canonical run is where the spine puts them: a turn
  // whose tools are dropped on the floor here is a turn nothing downstream can
  // describe. The live half - "this run has not settled" - is still on the DOM,
  // where the thread's status bar reads it.
  it('carries the steps taken when a WCore turn has tools but no plan', () => {
    const messages = [
      {
        id: 'user',
        conversation_id: 'conversation-1',
        type: 'text',
        position: 'right',
        content: { content: 'Run the probe' },
        createdAt: 1_000,
      },
      {
        id: 'tools',
        conversation_id: 'conversation-1',
        type: 'tool_group',
        content: [
          { callId: 'a', name: 'Bash', description: "Execute: printf 'ok'", status: 'Success' },
          { callId: 'b', name: 'ReadFile', description: 'Read config.ts', status: 'Executing' },
        ],
        createdAt: 1_100,
      },
    ] as TMessage[];
    render(
      <WorkbenchHost conversationId='conversation-1'>
        <MessageListProvider value={messages}>
          <ExecutionSpine backend='wcore' conversationId='conversation-1' workspaceId='workspace-1' agentId='wcore'>
            <div>conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );
    // Labels come from the same humanizer the chat timeline uses, so a step
    // reads as the work done ("Running printf 'ok'"), not the tool's name.
    const run = canonicalRun('wcore', messages, screen.getByTestId('execution-spine').dataset.runId ?? '');
    const labels = run.activities.map(stepLabel);
    expect(labels).toContain("Running printf 'ok'");
    expect(labels).toContain('Reading config.ts');
    // A dispatched tool proves the run left the queue; one is still Executing,
    // so the run has not settled - and the thread's live bar says so.
    const thread = screen.getByTestId('execution-thread-summary');
    expect(thread.dataset.lifecycle).toBe('running');
    expect(thread.textContent).toContain('running');
  });

  // A tool-only turn produces no `activity` message, which is the only thing
  // that used to carry a terminal lifecycle - so a run that finished hours ago
  // reloaded from the DB still wearing a blue "running" tag.
  it('settles a tool-only turn once every tool is terminal', () => {
    const messages = [
      { id: 'user', conversation_id: 'c1', type: 'text', position: 'right', content: { content: 'go' } },
      {
        id: 'tools',
        conversation_id: 'c1',
        type: 'tool_group',
        content: [
          { callId: 'a', name: 'Bash', description: "Execute: printf 'ok'", status: 'Success' },
          { callId: 'b', name: 'Bash', description: 'Execute: false', status: 'Error' },
        ],
      },
    ] as TMessage[];
    render(
      <WorkbenchHost conversationId='c1'>
        <MessageListProvider value={messages}>
          <ExecutionSpine backend='wcore' conversationId='c1' workspaceId='workspace-1' agentId='wcore'>
            <div>conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );
    // Settling is visible in the thread as the live bar STANDING DOWN: the spine
    // still renders (the run is real), but a finished run has no current
    // activity to narrate, so the status bar goes. Read straight off the DOM,
    // "no bar" would also be what a hidden spine looks like - hence both halves.
    expect(screen.getByTestId('execution-spine')).toBeTruthy();
    expect(screen.queryByTestId('execution-thread-summary')).toBeNull();
    const run = canonicalRun('wcore', messages, screen.getByTestId('execution-spine').dataset.runId ?? '');
    expect(run.lifecycle).toBe('completed');
    expect(run.lifecycle).not.toBe('running');
  });

  // #610's obligation is the ADAPTER's, not the rail's: the spine's canonical
  // run carries the real invocation, so a credential must already be masked by
  // the time any renderer builds a label out of it
  // (common/execution/adapters/wcore.ts:221-222, :270). The mission rail was
  // merely the first renderer to prove it; with the rail unpublished the
  // obligation is asserted one step earlier, on the fields the label is built
  // from AND on the built label itself - so a leak has nowhere left to hide.
  // This is the ONLY coverage of that adapter's redaction (adapters.test.ts
  // exercises the same adapter but never a secret), so it must not thin out.
  it('masks an inline secret in a step command before it can reach a label', () => {
    const messages = [
      { id: 'user', conversation_id: 'c1', type: 'text', position: 'right', content: { content: 'go' } },
      {
        id: 'tools',
        conversation_id: 'c1',
        type: 'tool_group',
        content: [
          {
            callId: 'a',
            name: 'Bash',
            description: 'Execute: curl -H "Authorization: Bearer sk-ant-secretvalue123456" https://x.test',
            status: 'Success',
          },
        ],
      },
    ] as TMessage[];
    render(
      <WorkbenchHost conversationId='c1'>
        <MessageListProvider value={messages}>
          <ExecutionSpine backend='wcore' conversationId='c1' workspaceId='workspace-1' agentId='wcore'>
            <div>conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );
    const run = canonicalRun('wcore', messages, screen.getByTestId('execution-spine').dataset.runId ?? '');
    const activity = run.activities[0];
    // The raw fields first: a label truncates, so asserting only on the label
    // lets a long secret pass by being cut off rather than by being masked.
    const fields = `${activity.name} ${activity.detail ?? ''} ${activity.command ?? ''}`;
    expect(fields).not.toContain('sk-ant-secretvalue123456');
    expect(fields).toContain('••••••');
    // Then the label a user actually reads.
    expect(stepLabel(activity)).not.toContain('sk-ant-secretvalue123456');
    expect(stepLabel(activity)).toContain('••••••');
  });

  // A cross-audit reproduced this: `command` was masked but `detail` was not,
  // and for a non-command tool the label is built from name + detail - so the
  // credential rendered anyway, through the field nobody had masked.
  it('masks a secret that reaches the label through detail, not command', () => {
    const messages = [
      { id: 'user', conversation_id: 'c1', type: 'text', position: 'right', content: { content: 'go' } },
      {
        id: 'tools',
        conversation_id: 'c1',
        type: 'tool_group',
        content: [
          {
            callId: 'a',
            name: 'web_search',
            // Kept short on purpose: the label caps at 40 chars, so a long
            // secret is truncated and an assertion on its tail passes even
            // unmasked. This value survives the cap intact - which still
            // matters, because the label is asserted on below alongside the
            // untruncated field it is built from.
            description: 'query: client_secret=hunter2val',
            status: 'Success',
          },
        ],
      },
    ] as TMessage[];
    render(
      <WorkbenchHost conversationId='c1'>
        <MessageListProvider value={messages}>
          <ExecutionSpine backend='wcore' conversationId='c1' workspaceId='workspace-1' agentId='wcore'>
            <div>conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );
    const run = canonicalRun('wcore', messages, screen.getByTestId('execution-spine').dataset.runId ?? '');
    const activity = run.activities[0];
    // `detail` is the field this case exists for: it carries no command, so the
    // label is built from name + detail and only detail-side masking saves it.
    expect(activity.detail ?? '').not.toContain('hunter2val');
    expect(activity.detail ?? '').toContain('••••••');
    expect(stepLabel(activity)).not.toContain('hunter2val');
    expect(stepLabel(activity)).toContain('••••••');
  });

  it('does not overwhelm an ordinary chat with any execution chrome', () => {
    render(
      <WorkbenchHost conversationId='conversation-1'>
        <MessageListProvider value={[]}>
          <ExecutionSpine backend='gemini' conversationId='conversation-1' workspaceId='workspace-1' agentId='gemini'>
            <div>ordinary chat</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );
    // Retargeted with the rail's removal: `execution-mission-rail` can no longer
    // be rendered by anything, so asserting its absence proved nothing. What
    // still has to hold is that an ordinary chat gets the children and NOTHING
    // else - no spine wrapper, no status bar, no workbench.
    expect(screen.queryByTestId('execution-spine')).toBeNull();
    expect(screen.queryByTestId('execution-thread-summary')).toBeNull();
    expect(screen.queryByTestId('workbench-panel')).toBeNull();
    expect(screen.getByText('ordinary chat')).toBeTruthy();
  });

  // The Engine projections went with Progress: `projection:*` was the Status /
  // Policy box, and the Automation lane was one of its sections. The spine no
  // longer renders ExecutionWorkbenchProjections at all, so the lane does not
  // exist to be registered - and a NAVIGATION REQUEST for it, the one path that
  // used to force the panel open regardless of what the user had collapsed,
  // must now land inert rather than resurrect the box.
  it('registers no Automation lane for a scheduled WCore run, even when one is requested', () => {
    const messages = [
      {
        id: 'trigger',
        msg_id: 'trigger',
        type: 'cron_trigger',
        position: 'center',
        conversation_id: 'conversation-1',
        content: { cronJobId: 'job-1', cronJobName: 'Daily', triggeredAt: 100 },
        createdAt: 100,
        status: 'finish',
      },
      {
        id: 'prompt',
        msg_id: 'prompt',
        type: 'text',
        position: 'right',
        conversation_id: 'conversation-1',
        content: {
          content: 'Run',
          cronMeta: { source: 'cron', cronJobId: 'job-1', cronJobName: 'Daily', triggeredAt: 100 },
        },
        createdAt: 101,
        hidden: true,
        status: 'finish',
      },
    ] as TMessage[];

    render(
      <WorkbenchHost
        conversationId='conversation-1'
        requestedSectionId='projection:automation'
        requestKey='desktop:schedule-run:job-1:100'
      >
        <MessageListProvider value={messages}>
          <ExecutionSpine backend='wcore' conversationId='conversation-1' workspaceId='workspace-1' agentId='wcore'>
            <div>scheduled conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );

    // The spine really did run over these messages - it rendered its children.
    // A scheduled run with no execution work of its own is INVISIBLE to the
    // thread (`visible` is false, index.tsx:79-85), which is precisely why the
    // Automation lane used to be registered outside that gate: it was the one
    // section such a turn ever got. Nothing is registered outside the gate any
    // more, so the lane is gone and the request for it lands inert.
    expect(screen.getByText('scheduled conversation')).toBeTruthy();
    expect(screen.queryByTestId('workbench-projection-automation')).toBeNull();
    expect(screen.queryByTestId('workbench-panel')).toBeNull();
    expect(screen.queryByTestId('workbench-stack')).toBeNull();
  });

  it('renders only the current ACP plan when the session id is reused after a completed turn', () => {
    const messages = [
      {
        id: 'old-user',
        conversation_id: 'conversation-1',
        type: 'text',
        position: 'right',
        content: { content: 'Old turn' },
      },
      {
        id: 'old-tool',
        conversation_id: 'conversation-1',
        type: 'acp_tool_call',
        content: {
          sessionId: 'same-session',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: 'old-tool',
            status: 'completed',
            title: 'Historical completed tool',
            kind: 'execute',
          },
        },
      },
      {
        id: 'new-user',
        conversation_id: 'conversation-1',
        type: 'text',
        position: 'right',
        content: { content: 'New turn' },
      },
      {
        id: 'new-plan',
        conversation_id: 'conversation-1',
        type: 'plan',
        content: {
          sessionId: 'same-session',
          entries: [{ content: 'Current plan step', status: 'in_progress', priority: 'high' }],
        },
      },
    ] as TMessage[];

    render(
      <WorkbenchHost conversationId='conversation-1'>
        <MessageListProvider value={messages}>
          <ExecutionSpine backend='acp' conversationId='conversation-1' workspaceId='workspace-1' agentId='codex'>
            <div>conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );

    // Once, in the thread. It was twice while the rail rendered the plan too.
    expect(screen.getAllByText('Current plan step')).toHaveLength(1);
    // The historical tool is an ACTIVITY, and the thread bar narrates only the
    // current PLAN step - so its absence from the DOM would be true however
    // badly the window leaked. The window is asserted where it is applied.
    const run = canonicalRun('acp', messages, screen.getByTestId('execution-spine').dataset.runId ?? '');
    expect(run.plan.map((step) => step.content)).toEqual(['Current plan step']);
    expect(JSON.stringify(run.activities)).not.toContain('Historical completed tool');
  });

  /**
   * The removal pin.
   *
   * Progress and Engine were unpublished by a product decision, not by an
   * accident, and the way they come back is somebody re-adding a
   * `useWorkbenchSection(missionSection)` line that every other test in this
   * file would happily tolerate. This case is the one that would not: a wcore
   * turn that plainly did tool work - the exact input that used to open the
   * Progress panel - must leave the workbench with nothing in it from the spine.
   */
  it('publishes no workbench section for a wcore turn that did tool work', () => {
    const messages = [
      { id: 'user', conversation_id: 'c1', type: 'text', position: 'right', content: { content: 'go' } },
      {
        id: 'tools',
        conversation_id: 'c1',
        type: 'tool_group',
        content: [{ callId: 'a', name: 'Bash', description: "Execute: printf 'ok'", status: 'Executing' }],
      },
    ] as TMessage[];
    const { container } = render(
      <WorkbenchHost conversationId='c1'>
        <MessageListProvider value={messages}>
          <ExecutionSpine backend='wcore' conversationId='c1' workspaceId='workspace-1' agentId='wcore'>
            <div>conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );
    // The run IS live: the spine rendered for it. Without this the rest of the
    // case would pass on an empty conversation, which proves nothing.
    expect(screen.getByTestId('execution-spine')).toBeTruthy();

    expect(screen.queryByTestId('workbench-mission')).toBeNull();
    expect(container.querySelectorAll('[data-testid^="workbench-projection-"]')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Progress' })).toBeNull();
    // Nothing registered at all: no panel, no stack, and no collapsed rail
    // toggle - that toggle appears the moment ANY section exists, so it is the
    // cheapest witness that the registry is genuinely empty.
    expect(screen.queryByTestId('workbench-panel')).toBeNull();
    expect(screen.queryByTestId('workbench-stack')).toBeNull();
    expect(screen.queryByLabelText(/^Open workbench/)).toBeNull();
  });
});
