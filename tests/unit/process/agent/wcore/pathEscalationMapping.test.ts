/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1099 / #1098 — the wcore adapter's half of the v0.13.4 contract.
 *
 * Contract source: wayland-core main `56ec176e`. v0.13.4 is NOT published, so
 * these frames are transcribed from the engine's serde attributes rather than
 * captured from a live run:
 *   - `ToolEscalation` is internally tagged (`tag = "kind"`, snake_case), so the
 *     discriminant arrives as `kind: "path_boundary"`
 *     (crates/wcore-protocol/src/events.rs:1885);
 *   - `RenderMime` is a CLOSED three-token vocabulary and a host is required to
 *     refuse anything outside it rather than default
 *     (crates/wcore-protocol/src/events.rs:647).
 */
import { describe, it, expect, vi } from 'vitest';
import { WCoreAgent, type WCoreAgentOptions } from '@/process/agent/wcore';
import type { WCoreEvent } from '@/process/agent/wcore/protocol';

type Emitted = { type: string; data?: unknown; msg_id?: string };

const makeAgent = () => {
  const emitted: Emitted[] = [];
  const options = {
    workspace: '/tmp/wcore-test',
    model: {} as never,
    onStreamEvent: (event: Emitted) => emitted.push(event),
  } as unknown as WCoreAgentOptions;
  const agent = new WCoreAgent(options);
  const feed = (event: WCoreEvent) => (agent as unknown as { handleEvent: (e: WCoreEvent) => void }).handleEvent(event);
  return { emitted, feed };
};

const ROOT = '/Users/sean/Documents/reports';
const TARGET = `${ROOT}/q3.md`;

/** A `Read` outside the workspace. Note the category: `info`, the branch Auto Edit auto-approves. */
const escalatedRead: WCoreEvent = {
  type: 'tool_request',
  msg_id: 'm1',
  call_id: 'c1',
  tool: {
    name: 'Read',
    category: 'info',
    args: { file_path: TARGET },
    description: `Read ${TARGET}`,
    escalation: { kind: 'path_boundary', target: TARGET, access: 'read', suggested_root: ROOT },
  },
};

/** The same call WITHOUT the escalation field — an engine that never classified it. */
const plainRead: WCoreEvent = {
  type: 'tool_request',
  msg_id: 'm1',
  call_id: 'c2',
  tool: { name: 'Read', category: 'info', args: { file_path: 'README.md' }, description: 'Read README.md' },
};

const toolFrame = (emitted: Emitted[]) => {
  const groups = emitted.filter((e) => e.type === 'tool_group');
  const data = (groups[groups.length - 1]?.data ?? []) as Array<{
    callId: string;
    confirmationDetails?: Record<string, unknown>;
  }>;
  return data[0];
};

describe('#1099 tool_request escalation mapping', () => {
  it('lifts a path_boundary escalation into its own confirmation type, not the info catch-all', () => {
    const { emitted, feed } = makeAgent();
    feed(escalatedRead);

    const details = toolFrame(emitted).confirmationDetails;
    expect(details?.type).toBe('path_boundary');
    expect(details?.target).toBe(TARGET);
    // The CONTAINING FOLDER, which is what a grant opens. Core is explicit that
    // putting `target` on an "always allow this folder" button would be a button
    // that lies about its own scope.
    expect(details?.suggestedRoot).toBe(ROOT);
    expect(details?.suggestedRoot).not.toBe(details?.target);
    expect(details?.access).toBe('read');
  });

  it('CONTROL: the identical call without an escalation still maps to info', () => {
    // This is the whole risk in one assertion. `info` is the category Auto Edit
    // auto-approves, so if the escalation were ignored the boundary read would
    // be silently approved with `once` — which cannot resolve a boundary.
    const { emitted, feed } = makeAgent();
    feed(plainRead);

    expect(toolFrame(emitted).confirmationDetails?.type).toBe('info');
  });

  it('classifies ahead of the read, on the request frame — the whole point of #1099', () => {
    const { emitted, feed } = makeAgent();
    feed(escalatedRead);

    // One frame, at request time, already carrying the folder decision. The old
    // flow only ever produced this information as a refusal AFTER the fact.
    const frames = emitted.filter((e) => e.type === 'tool_group');
    expect(frames).toHaveLength(1);
    expect((frames[0].data as Array<{ status: string }>)[0].status).toBe('Confirming');
  });
});

describe('#1098 render_artifact intake', () => {
  const frame = (mime: string): WCoreEvent =>
    ({
      type: 'render_artifact',
      msg_id: 'm1',
      call_id: 'c9',
      title: 'Q3 summary',
      mime,
      content: '# Q3',
      truncated: false,
      critical: false,
    }) as unknown as WCoreEvent;

  for (const mime of ['text/plain', 'text/markdown', 'text/html']) {
    it(`forwards ${mime}, carrying content and no path`, () => {
      const { emitted, feed } = makeAgent();
      feed(frame(mime));

      const event = emitted.find((e) => e.type === 'render_artifact');
      expect(event).toBeTruthy();
      const data = event?.data as Record<string, unknown>;
      expect(data.mime).toBe(mime);
      expect(data.content).toBe('# Q3');
      // Exact key set: a path field added later fails here rather than sliding in.
      expect(Object.keys(data).sort()).toEqual(['callId', 'content', 'mime', 'title', 'truncated']);
    });
  }

  /**
   * The mime is validated; `content` and `title` are untyped JSON off a wire.
   * The engine caps them, but the cost of trusting that and being wrong is not
   * a bad render - the IPC bridge has no reject and no timeout, so one
   * oversized payload wedges the renderer for the life of the process.
   */
  it('drops a frame whose content or title is not a string', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const bad of [{ content: { evil: true } }, { title: 42 }, { content: null }]) {
      const { emitted, feed } = makeAgent();
      feed({ ...(frame('text/markdown') as object), ...bad } as unknown as WCoreEvent);
      expect(emitted.filter((e) => e.type === 'render_artifact'), JSON.stringify(bad)).toHaveLength(0);
    }
    warn.mockRestore();
  });

  it('clamps oversized content rather than dropping it, and says so via truncated', () => {
    const { emitted, feed } = makeAgent();
    const huge = 'x'.repeat(1024 * 1024 + 500);

    feed({ ...(frame('text/markdown') as object), content: huge, truncated: false } as unknown as WCoreEvent);

    const data = emitted.find((e) => e.type === 'render_artifact')?.data as Record<string, unknown>;
    expect(data).toBeTruthy();
    expect((data.content as string).length).toBe(1024 * 1024);
    expect(data.truncated).toBe(true);
  });

  it('clamps an oversized title', () => {
    const { emitted, feed } = makeAgent();

    feed({ ...(frame('text/markdown') as object), title: 'T'.repeat(900) } as unknown as WCoreEvent);

    const data = emitted.find((e) => e.type === 'render_artifact')?.data as Record<string, unknown>;
    expect((data.title as string).length).toBe(256);
  });

  // CONTROL: an ordinary in-budget frame is untouched by any of the above, so
  // the clamps are deciding rather than mangling every artifact.
  it('CONTROL: leaves an in-budget title and content exactly as sent', () => {
    const { emitted, feed } = makeAgent();
    feed(frame('text/markdown'));
    const data = emitted.find((e) => e.type === 'render_artifact')?.data as Record<string, unknown>;
    expect(data.content).toBe('# Q3');
    expect(data.title).toBe('Q3 summary');
    expect(data.truncated).toBe(false);
  });

  it('refuses a mime outside the closed vocabulary instead of coercing it to one we can render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { emitted, feed } = makeAgent();

    feed(frame('image/png'));

    expect(emitted.filter((e) => e.type === 'render_artifact')).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
