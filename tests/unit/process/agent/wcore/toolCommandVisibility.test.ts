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
import { describe, it, expect } from 'vitest';
import { WCoreAgent, type WCoreAgentOptions } from '@/process/agent/wcore';
import type { WCoreEvent } from '@/process/agent/wcore/protocol';

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
