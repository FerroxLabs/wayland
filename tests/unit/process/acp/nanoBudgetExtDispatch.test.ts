/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Does the REAL ACP SDK actually hand a `_wayland/*` notification to our
 * `extNotification` arm?
 *
 * Every other test around Nano's budget metering calls our parser directly, so
 * all of them would still pass if the SDK silently dropped the frame, answered
 * methodNotFound, or schema-validated it the way it validates `session/update`.
 * That is precisely the failure that started this whole migration: metering rode
 * `session/update` as `sessionUpdate: 'budget'`, the SDK's zod union rejected
 * every frame with -32602, and the data never reached Desktop at all.
 *
 * So this drives a real `ClientSideConnection` over a real `ndJsonStream` and
 * pushes the bytes an agent would put on the wire. It is pinned to the SDK we
 * ship: if a version bump starts validating vendor extensions, this goes red
 * here rather than silently in production.
 *
 * The frame below is a VERBATIM capture from this machine, taken by driving
 * `wayland-nano acp-host` over stdio on a real Flux turn - not a shape copied
 * out of a contract document.
 */
import { describe, expect, it } from 'vitest';
import { ClientSideConnection, ndJsonStream, type Client } from '@agentclientprotocol/sdk';
import {
  formatNanoBudgetCost,
  NANO_BUDGET_METHOD,
  parseNanoBudgetNotification,
} from '@process/acp/infra/nanoBudgetNotifications';

/** Captured off the wire: `wayland-nano 0.1.0`, real Flux turn, this machine. */
const CAPTURED_BUDGET_FRAME = {
  jsonrpc: '2.0' as const,
  method: NANO_BUDGET_METHOD,
  params: {
    limit: null,
    microcents: 0,
    observed: null,
    priced: false,
    sessionId: 'wayland-nano-session-1786698730864103000-1',
    session_tokens: 4143,
  },
};

/**
 * Feed raw agent->client bytes into a ClientSideConnection and collect whatever
 * reaches the client handlers. Mirrors how ProcessAcpClient builds its
 * connection (NdjsonTransport.fromChildProcess -> ClientSideConnection).
 */
function driveClient(frames: unknown[]): {
  ext: Array<{ method: string; params: unknown }>;
  sessionUpdates: unknown[];
  /** Live buffer of client->agent bytes. Read it AFTER settle(); never await it
   *  - the SDK keeps the connection open, so waiting for close deadlocks. */
  outbound: string[];
} {
  const ext: Array<{ method: string; params: unknown }> = [];
  const sessionUpdates: unknown[] = [];

  const input = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const f of frames) {
        controller.enqueue(new TextEncoder().encode(JSON.stringify(f) + '\n'));
      }
      controller.close();
    },
  });

  // Anything the client writes BACK matters: an unhandled notification is where
  // the SDK would emit a methodNotFound error response.
  const outbound: string[] = [];
  const output = new WritableStream<Uint8Array>({
    write(chunk) {
      outbound.push(new TextDecoder().decode(chunk));
    },
  });

  new ClientSideConnection(
    (): Client =>
      ({
        sessionUpdate: async (params: unknown) => {
          sessionUpdates.push(params);
        },
        requestPermission: async () => ({ outcome: { outcome: 'cancelled' } }),
        readTextFile: async () => ({ content: '' }),
        writeTextFile: async () => ({}),
        extNotification: async (method: string, params: unknown) => {
          ext.push({ method, params });
        },
      }) as unknown as Client,
    ndJsonStream(output, input)
  );

  return { ext, sessionUpdates, outbound };
}

/** The stream is consumed asynchronously; give the SDK's receive loop a turn. */
const settle = () => new Promise((r) => setTimeout(r, 50));

describe('ACP SDK dispatch of Nano budget ext notifications', () => {
  it('routes a captured _wayland/session/budget frame to extNotification', async () => {
    const { ext } = driveClient([CAPTURED_BUDGET_FRAME]);
    await settle();

    expect(ext).toHaveLength(1);
    expect(ext[0].method).toBe(NANO_BUDGET_METHOD);
    expect(ext[0].params).toMatchObject({ sessionId: expect.any(String), session_tokens: 4143 });
  });

  it('delivers a payload our parser turns into a usable event, end to end', async () => {
    // The two halves are tested separately elsewhere. Joining them here is the
    // point: SDK dispatch and our parsing have to agree on the SAME object, and
    // a flattening mistake on either side would only ever show up in this seam.
    const { ext } = driveClient([CAPTURED_BUDGET_FRAME]);
    await settle();

    const event = parseNanoBudgetNotification(ext[0].method, ext[0].params);
    expect(event).toEqual({
      kind: 'budget',
      sessionId: 'wayland-nano-session-1786698730864103000-1',
      sessionTokens: 4143,
      microcents: 0,
      priced: false,
      limit: null,
      observed: null,
    });
    // The honesty rule, all the way from wire bytes to rendered string.
    expect(formatNanoBudgetCost(event!)).toBe('unpriced');
  });

  it('does NOT answer a vendor notification with an error response', async () => {
    // A notification has no id, so a reply would be a protocol violation - and
    // an error reply per turn is what the old session/update route produced.
    const { outbound } = driveClient([CAPTURED_BUDGET_FRAME]);
    await settle();
    const out = outbound.join('');

    expect(out).not.toContain('-32601'); // method not found
    expect(out).not.toContain('-32602'); // invalid params
    expect(out.trim()).toBe('');
  });

  it('CONTROL: the same transport really does reject an unknown session/update kind', async () => {
    // Without this control the assertions above prove nothing - a connection
    // that silently swallowed everything would pass all three. This is the
    // exact frame Nano used to send, and it must still be refused, which is
    // what makes the move to ext notifications necessary rather than cosmetic.
    const { sessionUpdates } = driveClient([
      {
        jsonrpc: '2.0' as const,
        method: 'session/update',
        params: { sessionId: 's1', update: { sessionUpdate: 'budget', microcents: 0, session_tokens: 10232 } },
      },
    ]);
    await settle();

    expect(sessionUpdates).toHaveLength(0);
  });

  it('CONTROL: a well-formed session/update still reaches the client', async () => {
    // ...and the transport is not simply broken for everything.
    const { sessionUpdates } = driveClient([
      {
        jsonrpc: '2.0' as const,
        method: 'session/update',
        params: {
          sessionId: 's1',
          update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'NPXPIN-OK' } },
        },
      },
    ]);
    await settle();

    expect(sessionUpdates).toHaveLength(1);
  });
});
