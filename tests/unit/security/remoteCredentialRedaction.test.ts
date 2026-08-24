/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Closing the EXECUTION path did not close EXFILTRATION.
 *
 * N3 remote-denied `mcp.compare-and-set-config`, so a paired peer can no longer
 * choose what the host spawns. But three READ channels stayed remote-allowed and
 * each returns `IMcpServer[]` with `transport.env` and `transport.headers`
 * verbatim - measured, not assumed:
 *
 *   mcp.get-config-snapshot   remoteDenied=false
 *   mcp.get-agent-configs     remoteDenied=false
 *   agent.config.storage.get  remoteDenied=false   (the config gate matches
 *                                                   `.set` only, so the getter
 *                                                   had no gate at all)
 *
 * A WebSocket token proves a paired BROWSER, not the human at the desktop. It
 * must not be able to read every connector credential on the machine.
 */
import { describe, it, expect } from 'vitest';
import {
  redactForRemote,
  redactSecretFields,
  isSecretBearingCallback,
  REDACTED,
} from '@/common/adapter/remoteRedaction';

const snapshotName = 'subscribe.callback-mcp.get-config-snapshot1a2b3c4d';

const realSecret = 'sk-live-DO-NOT-LEAK-0123456789';

function snapshotPayload() {
  return {
    id: '1a2b3c4d',
    data: {
      revision: 'rev-7',
      servers: [
        {
          id: 'srv-1',
          name: 'com.ferroxlabs-tvcontrol',
          enabled: true,
          transport: {
            type: 'stdio',
            command: 'bunx',
            args: ['--bun', '@ferroxlabs/tvcontrol'],
            env: { TV_API_KEY: realSecret, TV_MCP_ADVANCED: '0' },
          },
        },
        {
          id: 'srv-2',
          name: 'remote-http',
          enabled: true,
          transport: { type: 'http', url: 'https://example.test', headers: { Authorization: `Bearer ${realSecret}` } },
        },
      ],
    },
  };
}

describe('a paired browser never receives connector credentials', () => {
  it('removes every env value and every header value from a snapshot response', () => {
    const out = JSON.stringify(redactForRemote(snapshotName, snapshotPayload()));
    expect(out).not.toContain(realSecret);
    expect(out).toContain(REDACTED);
  });

  it('keeps the SHAPE so the remote MCP page still renders', () => {
    // Denying these keys was the other option and it ships a dead page. The
    // remote client needs to know the connector exists and what it is; it never
    // needs the secret.
    const out = redactForRemote(snapshotName, snapshotPayload()) as {
      data: { revision: string; servers: Array<{ name: string; transport: Record<string, unknown> }> };
    };
    expect(out.data.revision).toBe('rev-7');
    expect(out.data.servers).toHaveLength(2);
    expect(out.data.servers[0].name).toBe('com.ferroxlabs-tvcontrol');
    expect(out.data.servers[0].transport.command).toBe('bunx');
    // The variable NAMES survive - a UI can say "2 environment variables set".
    expect(Object.keys(out.data.servers[0].transport.env as object)).toEqual(['TV_API_KEY', 'TV_MCP_ADVANCED']);
    expect((out.data.servers[0].transport.env as Record<string, string>).TV_API_KEY).toBe(REDACTED);
  });

  it('covers all four secret-bearing callback keys, by name', () => {
    for (const key of [
      'mcp.get-config-snapshot',
      'mcp.get-agent-configs',
      'agent.config.storage.get',
      'mcp.compare-and-set-config',
    ]) {
      expect(isSecretBearingCallback(`subscribe.callback-${key}deadbeef`)).toBe(true);
    }
  });

  it('leaves every OTHER outbound message untouched and identical', () => {
    // Over-broad redaction would corrupt the whole remote stream. This is the
    // control that proves the matcher is not simply returning true.
    const other = { id: 'x', data: { text: realSecret, env: { KEEP: 'me' } } };
    expect(isSecretBearingCallback('subscribe.callback-conversation.get-messages99887766')).toBe(false);
    expect(redactForRemote('subscribe.callback-conversation.get-messages99887766', other)).toBe(other);
  });

  it('does not hang on a cyclic payload', () => {
    // This runs on every outbound message; it must never be able to wedge the socket.
    const cyclic: Record<string, unknown> = { name: 'a' };
    cyclic.self = cyclic;
    expect(() => redactSecretFields(cyclic)).not.toThrow();
  });

  it('redacts a scalar secret field too, not only the map-shaped ones', () => {
    const out = redactSecretFields({ apiKey: realSecret, token: realSecret, nested: { password: realSecret } });
    expect(JSON.stringify(out)).not.toContain(realSecret);
  });
});
