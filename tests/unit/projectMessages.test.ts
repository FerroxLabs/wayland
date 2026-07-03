/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type {
  IMessageActivity,
  IMessageAcpToolCall,
  IMessageSubAgent,
  IMessageToolGroup,
} from '../../src/common/chat/chatLib';
import {
  acpToolCallToNode,
  activityToSteps,
  subAgentToStep,
  toolGroupToNodes,
  toolSummaryToSteps,
} from '../../src/common/chat/activity/projectMessages';

const toolGroupMsg = (): IMessageToolGroup =>
  ({
    type: 'tool_group',
    content: [
      {
        callId: 'c1',
        name: 'Read',
        description: '',
        renderOutputAsMarkdown: false,
        status: 'Success',
        resultDisplay: '/src/config.ts',
      },
      { callId: 'c2', name: 'Bash', description: '', renderOutputAsMarkdown: false, status: 'Executing' },
    ],
  }) as unknown as IMessageToolGroup;

const acpMsg = (): IMessageAcpToolCall =>
  ({
    type: 'acp_tool_call',
    content: {
      sessionId: 's1',
      update: {
        sessionUpdate: 'tool_call',
        toolCallId: 't1',
        status: 'in_progress',
        title: 'web_search',
        kind: 'execute',
      },
    },
  }) as unknown as IMessageAcpToolCall;

describe('projectMessages.toolGroupToNodes', () => {
  it('maps tool_group items to canonical nodes with status + detail', () => {
    const nodes = toolGroupToNodes(toolGroupMsg().content);
    expect(nodes[0]).toMatchObject({ id: 'c1', kind: 'tool', name: 'Read', status: 'done', detail: '/src/config.ts' });
    expect(nodes[1]).toMatchObject({ id: 'c2', name: 'Bash', status: 'running' });
  });
});

describe('projectMessages.acpToolCallToNode', () => {
  it('reads the nested .update fields and maps in_progress -> running', () => {
    expect(acpToolCallToNode(acpMsg().content)).toMatchObject({
      id: 't1',
      kind: 'tool',
      name: 'web_search',
      status: 'running',
    });
  });
  it('synthesizes an id when toolCallId is missing (never vanishes)', () => {
    const content = {
      sessionId: 's1',
      update: {
        sessionUpdate: 'tool_call',
        toolCallId: '',
        status: 'in_progress',
        title: 'web_search',
        kind: 'execute',
      },
    } as unknown as IMessageAcpToolCall['content'];
    const node = acpToolCallToNode(content);
    expect(node.id).toBe('acp:execute:web_search');
    expect(node.name).toBe('web_search');
  });
});

describe('projectMessages.toolSummaryToSteps', () => {
  it('projects a mixed wcore + ACP group into humanized steps', () => {
    const steps = toolSummaryToSteps([toolGroupMsg(), acpMsg()], 'wcore');
    expect(steps).toHaveLength(3);
    expect(steps[0]).toMatchObject({ id: 'c1', label: 'Reading config.ts', glyph: 'file', source: 'wcore' });
    expect(steps[1].label).toBe('Running a command'); // Bash, no command → humanized fallback
    expect(steps[2].glyph).toBe('web'); // web_search
  });
});

// #520 command visibility: an exec tool carries its command in the `exec`
// confirmationDetails; toolGroupToNodes must lift it onto the node so the
// timeline label shows the ACTUAL command instead of a generic "Running a command".
const execToolGroupMsg = (over?: Partial<IMessageToolGroup['content'][number]>): IMessageToolGroup =>
  ({
    type: 'tool_group',
    content: [
      {
        callId: 'e1',
        name: 'Bash',
        description: '',
        renderOutputAsMarkdown: false,
        status: 'Executing',
        confirmationDetails: { type: 'exec', title: 'Execute: echo hi', rootCommand: 'echo', command: 'echo hi' },
        ...over,
      },
    ],
  }) as unknown as IMessageToolGroup;

describe('projectMessages.toolGroupToNodes command (#520)', () => {
  it('lifts the exec command onto the node', () => {
    const node = toolGroupToNodes(execToolGroupMsg().content)[0];
    expect(node.command).toBe('echo hi');
  });

  it('falls back to the item description when there are no exec confirmationDetails', () => {
    const node = toolGroupToNodes(
      execToolGroupMsg({ confirmationDetails: undefined, description: 'Execute: ls -la' }).content
    )[0];
    expect(node.command).toBe('Execute: ls -la');
  });

  it('leaves command unset when neither is present', () => {
    const node = toolGroupToNodes(execToolGroupMsg({ confirmationDetails: undefined, description: '' }).content)[0];
    expect(node.command).toBeUndefined();
  });

  it('surfaces the command as the timeline label (not "Running a command")', () => {
    const step = toolSummaryToSteps([execToolGroupMsg()], 'wcore')[0];
    expect(step.label).toBe('Running echo hi');
    expect(step.glyph).toBe('command');
  });
});

describe('projectMessages.subAgentToStep', () => {
  it('projects a sub-agent card into a sub_agent step with humanized children', () => {
    const content: IMessageSubAgent['content'] = {
      parentCallId: 'p1',
      agentName: 'researcher',
      status: 'running',
      body: 'gathering...',
      nodes: [{ id: 'n1', kind: 'tool', name: 'WebFetch', status: 'done', detail: 'https://apnews.com' }],
    };
    const step = subAgentToStep(content, 'wcore');
    expect(step).toMatchObject({ id: 'p1', kind: 'sub_agent', agent: 'researcher', status: 'running' });
    expect(step.children).toHaveLength(1);
    expect(step.children?.[0].label).toBe('Reading apnews.com');
  });
  it('settles still-running children to done when the sub-agent has finished', () => {
    const content: IMessageSubAgent['content'] = {
      parentCallId: 'p2',
      agentName: 'worker',
      status: 'done',
      body: '',
      nodes: [{ id: 'c1', kind: 'thinking', name: '', status: 'running', detail: 'pondering' }],
    };
    const step = subAgentToStep(content);
    expect(step.status).toBe('done');
    // child was 'running' but the agent finished -> settled to 'done' (no stuck spinner)
    expect(step.children?.[0].status).toBe('done');
  });
});

describe('projectMessages.activityToSteps', () => {
  it('projects the activity tree nodes into steps', () => {
    const content: IMessageActivity['content'] = {
      turnId: 'turn1',
      nodes: [{ id: 'a1', kind: 'tool', name: 'Grep', status: 'done' }],
      status: 'done',
    };
    const steps = activityToSteps(content, 'wcore');
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ label: 'Searching the codebase', glyph: 'search' });
  });
});

describe('projectMessages.toolGroupToNodes - web_search sources', () => {
  it('attaches parsed sources when a web_search tool has JSON array output', () => {
    const msg: IMessageToolGroup = {
      type: 'tool_group',
      content: [
        {
          callId: 'ws1',
          name: 'web_search',
          description: '',
          renderOutputAsMarkdown: false,
          status: 'Success',
          resultDisplay: JSON.stringify([{ title: 'Example', url: 'https://example.com' }]),
        },
      ],
    } as unknown as IMessageToolGroup;
    const nodes = toolGroupToNodes(msg.content);
    expect(nodes[0].sources).toHaveLength(1);
    expect(nodes[0].sources?.[0]).toMatchObject({
      title: 'Example',
      url: 'https://example.com',
      domain: 'example.com',
    });
  });

  it('leaves sources undefined when the web_search output is prose (not JSON)', () => {
    const msg: IMessageToolGroup = {
      type: 'tool_group',
      content: [
        {
          callId: 'ws2',
          name: 'web_search',
          description: '',
          renderOutputAsMarkdown: false,
          status: 'Success',
          resultDisplay: 'No results found.',
        },
      ],
    } as unknown as IMessageToolGroup;
    const nodes = toolGroupToNodes(msg.content);
    expect(nodes[0].sources).toBeUndefined();
  });

  it('attaches sources for the bare native `web` tool with { data: { web: [...] } }', () => {
    // The Flux native web tool is named `web` (operation=search in args) and
    // returns this envelope. Captured + verified live against Flux 0.12.8.
    const msg: IMessageToolGroup = {
      type: 'tool_group',
      content: [
        {
          callId: 'web1',
          name: 'web',
          description: '',
          renderOutputAsMarkdown: true,
          status: 'Success',
          resultDisplay: JSON.stringify({
            data: { web: [{ title: 'WinBuzzer', url: 'https://winbuzzer.com/ai/openai/', snippet: '# OpenAI' }] },
            success: true,
          }),
        },
      ],
    } as unknown as IMessageToolGroup;
    const nodes = toolGroupToNodes(msg.content);
    expect(nodes[0].sources).toHaveLength(1);
    expect(nodes[0].sources?.[0]).toMatchObject({ title: 'WinBuzzer', domain: 'winbuzzer.com' });
  });

  it('does not attach sources for non-search tools', () => {
    const msg: IMessageToolGroup = {
      type: 'tool_group',
      content: [
        {
          callId: 'r1',
          name: 'Read',
          description: '',
          renderOutputAsMarkdown: false,
          status: 'Success',
          resultDisplay: '/some/file.ts',
        },
      ],
    } as unknown as IMessageToolGroup;
    const nodes = toolGroupToNodes(msg.content);
    expect(nodes[0].sources).toBeUndefined();
  });
});
