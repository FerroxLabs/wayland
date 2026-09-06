/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #520 command visibility (desktop half). The wire's `tool_running` /
 * `tool_result` events carry only `call_id` + `tool_name`; the humanized command
 * ("Execute: ls -la") is sent once, on the preceding `tool_request`
 * (ToolInfo.description). The renderer merges tool_group frames by callId with a
 * plain `{...existing, ...incoming}` spread, so the mapper emitting an empty
 * `description` on the running/result frame OVERWRITES the command shown at
 * request time - the regression users reported after 0.11.2 ("running a command"
 * but not WHICH command). The mapper now stashes the request-time description
 * per callId and re-attaches it, so the command stays visible for the whole
 * tool lifecycle.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { WCoreAgent, type WCoreAgentOptions } from '@/process/agent/wcore';
import type { WCoreEvent } from '@/process/agent/wcore/protocol';
import { DesktopCoreV1Consumer } from '@/process/agent/wcore/desktopContractV1';
import { composeMessage, transformMessage, type IMessageToolGroup, type TMessage } from '@/common/chat/chatLib';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';

type Emitted = { type: string; data?: unknown; msg_id?: string };

/** A WCoreAgent whose only wiring is a capture of every emitted stream event. */
const makeAgent = () => {
  const emitted: Emitted[] = [];
  const options = {
    workspace: '/tmp/wcore-test',
    model: {} as never,
    onStreamEvent: (event: Emitted) => emitted.push(event),
  } as unknown as WCoreAgentOptions;
  const agent = new WCoreAgent(options);
  // handleEvent is private; drive it directly to exercise the pure mapping.
  const feed = (event: WCoreEvent) => (agent as unknown as { handleEvent: (e: WCoreEvent) => void }).handleEvent(event);
  return { emitted, feed };
};

/** Pull the single tool descriptor out of the most recent tool_group frame. */
const lastToolFrame = (emitted: Emitted[]) => {
  const groups = emitted.filter((e) => e.type === 'tool_group');
  const last = groups[groups.length - 1];
  const data = (last?.data ?? []) as Array<{ callId: string; name: string; description: string; status: string }>;
  return data[0];
};

const request: WCoreEvent = {
  type: 'tool_request',
  msg_id: 'm1',
  call_id: 'c1',
  tool: { name: 'bash', category: 'exec', args: { command: 'ls -la' }, description: 'Execute: ls -la' },
};
const running: WCoreEvent = { type: 'tool_running', msg_id: 'm1', call_id: 'c1', tool_name: 'bash' };
const result: WCoreEvent = {
  type: 'tool_result',
  msg_id: 'm1',
  call_id: 'c1',
  tool_name: 'bash',
  status: 'success',
  output: 'total 0',
  output_type: 'text',
};

describe('#520 wcore tool command visibility', () => {
  it('carries the request-time command onto the running frame (was blanked)', () => {
    const { emitted, feed } = makeAgent();
    feed(request);
    feed(running);
    const frame = lastToolFrame(emitted);
    expect(frame.status).toBe('Executing');
    expect(frame.description).toBe('Execute: ls -la');
  });

  it('keeps the command on the finished result frame', () => {
    const { emitted, feed } = makeAgent();
    feed(request);
    feed(running);
    feed(result);
    const frame = lastToolFrame(emitted);
    expect(frame.status).toBe('Success');
    expect(frame.description).toBe('Execute: ls -la');
  });

  it('falls back to an empty description when no request preceded the running frame', () => {
    const { emitted, feed } = makeAgent();
    feed(running); // no matching tool_request cached
    expect(lastToolFrame(emitted).description).toBe('');
  });

  it('drops the cached command once the tool is terminal (no leak / stale reuse)', () => {
    const { emitted, feed } = makeAgent();
    feed(request);
    feed(result); // terminal → cache entry for c1 cleared
    feed({ ...running }); // a stray later running frame for the same callId
    expect(lastToolFrame(emitted).description).toBe('');
  });
});

const fixture = (name: string): string =>
  readFileSync(path.resolve('contracts/wayland-desktop-core/v1/events', `${name}.json`), 'utf8').trim();

function projectedTools(emitted: Emitted[]): IMessageToolGroup['content'] {
  let messages: TMessage[] = [];
  for (const event of emitted.filter((entry) => entry.type === 'tool_group')) {
    messages = composeMessage(
      transformMessage({ ...event, conversation_id: 'announcement-test' } as IResponseMessage),
      messages
    );
  }
  // Exercise the stored-message JSON representation, not just a cached agent field.
  const restored = JSON.parse(JSON.stringify(messages)) as TMessage[];
  return restored.flatMap((message) => (message.type === 'tool_group' ? message.content : []));
}

describe('#1189 auto-approved tool announcements', () => {
  it('decodes the shipped announcement and retains its command through a completed saved card', () => {
    const { emitted, feed } = makeAgent();
    const consumer = new DesktopCoreV1Consumer();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      for (const name of ['ready', 'stream_start', 'call_announced']) {
        for (const decoded of consumer.consumeChunk(`${fixture(name)}\n`)) {
          if (decoded.kind === 'event') feed(decoded.event);
        }
      }
      feed({ type: 'tool_running', msg_id: 'msg-001', call_id: 'call-tool-002', tool_name: 'Bash' });
      feed({
        type: 'tool_result',
        msg_id: 'msg-001',
        call_id: 'call-tool-002',
        tool_name: 'Bash',
        status: 'success',
        output: 'tests passed',
        output_type: 'text',
      });
      const tools = projectedTools(emitted);
      expect(tools).toHaveLength(1);
      expect(tools[0]).toMatchObject({
        name: 'Bash',
        description: 'Run the test suite',
        status: 'Success',
        confirmationDetails: { type: 'exec', command: 'cargo test' },
      });
      expect(emitted.filter((event) => event.type === 'tool_group').flatMap((event) => event.data)).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ status: 'Confirming' })])
      );
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('preserves the affected file for an auto-approved edit, without asking for approval', () => {
    const { emitted, feed } = makeAgent();
    feed({
      type: 'call_announced',
      msg_id: 'm1',
      call_id: 'edit-1',
      tool: {
        name: 'Write',
        category: 'edit',
        args: { file_path: '/workspace/report.md' },
        description: 'Write report',
      },
    } as WCoreEvent);
    feed({ type: 'tool_running', msg_id: 'm1', call_id: 'edit-1', tool_name: 'Write' });
    feed({
      type: 'tool_result',
      msg_id: 'm1',
      call_id: 'edit-1',
      tool_name: 'Write',
      status: 'success',
      output: 'saved',
      output_type: 'text',
    });
    expect(projectedTools(emitted)[0]).toMatchObject({
      status: 'Success',
      description: 'Write report',
      confirmationDetails: { type: 'edit', fileName: '/workspace/report.md' },
    });
  });

  it('keeps concurrent announcements separate and releases the cancelled call cache', () => {
    const { emitted, feed } = makeAgent();
    feed({ ...request, type: 'call_announced' } as WCoreEvent);
    feed({
      ...request,
      type: 'call_announced',
      call_id: 'c2',
      tool: { ...request.tool, description: 'second command' },
    } as WCoreEvent);
    feed({ ...running, call_id: 'c2' });
    expect(lastToolFrame(emitted).description).toBe('second command');
    feed(running);
    expect(lastToolFrame(emitted).description).toBe('Execute: ls -la');
    feed({ type: 'tool_cancelled', msg_id: 'm1', call_id: 'c1', reason: 'cancelled' });
    feed(running);
    expect(lastToolFrame(emitted).description).toBe('');
  });
});
