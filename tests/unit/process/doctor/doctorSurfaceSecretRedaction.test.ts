/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Doctor-surface sweep for GHSA-2g2m-r86j-jg6h.
 *
 * The advisory's own remediation says to audit the REST of the Doctor surface
 * for the same pattern: any check that interpolates free-form error text from a
 * credential-bearing source hands that credential to a report with a "Copy
 * report" button. These are the sinks that audit found, each proved by feeding a
 * realistic credential through the real check.
 *
 * The engine-`config.toml` sink - the advisory's primary defect - is covered
 * separately and in more depth by `engineConfigParseErrorRedaction.test.ts`.
 *
 * SCOPE OF WHAT THESE PROVE: the sinks below are free-form text with no
 * structure to strip, so `redactSecrets` is all they have, and it is best-effort.
 * Every secret used here carries a recognisable VALUE prefix (`sk-ant-`, a JWT
 * `eyJ` header), which is the rule that masks them. The scrubber's LABEL rule
 * misses the prefixed spelling `ANTHROPIC_API_KEY=<prefixless value>` (#1026,
 * owned elsewhere), so these tests must not be read as proving those sinks
 * cannot leak - only that they no longer pass recognisable secrets straight
 * through, which is what they previously did.
 */

import { describe, expect, it } from 'vitest';
import { checkMcpServers } from '@process/doctor/checks/mcpChecks';
import { checkBackends } from '@process/doctor/checks/backendChecks';
import { checkEngineContractPin, checkEngineReachable } from '@process/doctor/checks/engineChecks';
import { checkWorkspaceDrift, checkWorkspaceConfigured } from '@process/doctor/checks/workspaceChecks';
import { collectConfiguredWorkspaces, collectWorkspaceConfigEntries } from '@process/doctor/workspaceInventory';
import { runDoctor } from '@process/doctor/runner';
import { redactSecrets } from '@process/utils/secretRedaction';
import type { IMcpServer } from '@/common/config/storage';
import type { DetectedAgent } from '@/common/types/detectedAgent';

const API_KEY = 'sk-ant-api03-Zx91QmT4LpVn7BdKe0RsYcHu2WjAgF6oXlP3NtEbQvMk8ZaSdCyRfGhJ';
const BEARER = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ3YXlsYW5kLXRlc3QifQ.s3cr3tS1gnatureV4lu3';

/**
 * THE PREFIXLESS CANARY. A 32-hex value behind a PREFIXED label - the common
 * spelling in the wild, and the one `redactSecrets` cannot see: its label rule
 * anchors a word boundary before the label and there is no boundary between `_`
 * and a letter, so `AZURE_OPENAI_API_KEY=<value>` survives a scrub entirely
 * (#1026). Any sink that keeps this out is doing so STRUCTURALLY - by dropping
 * the text, matching the declaration literally, or allowlisting a shape - which
 * is the only kind of fix that cannot regress when a pattern set shifts.
 */
const PREFIXLESS_KEY = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const PREFIXLESS_ASSIGNMENT = `AZURE_OPENAI_API_KEY=${PREFIXLESS_KEY}`;

/**
 * A SHORT credential. `redactSecrets` floors every rule at 8 characters, so a
 * 7-character password is invisible to it no matter how it is labelled - and a
 * database password of this length is entirely ordinary.
 */
const SHORT_SECRET = 'hunter7';

/** A 4-character one, the shortest this check masks at all. */
const TINY_SECRET = '9182';

/**
 * A BARE credential: no label, no assignment, no recognisable prefix. Nothing in
 * any scrubber can match this, which is why the only fixes that close it are
 * structural ones.
 */
const BARE_SECRET = 'f0e9d8c7b6a5948372615041302f1e0d';

/** Distinctive prefixes as well as whole values, so a partial leak still counts. */
const findsSecret = (text: string): boolean =>
  text.includes(API_KEY) ||
  text.includes('sk-ant-api03-Zx91') ||
  text.includes(BEARER) ||
  text.includes('s3cr3tS1gnatureV4lu3');

/** Separate matcher for the prefixless canary, on the VALUE not the label. */
const findsPrefixlessKey = (text: string): boolean => text.includes(PREFIXLESS_KEY);

/** Every string a Doctor result can put in front of the user. */
const surfaced = (result: { detail: string; remediation?: string }): string =>
  `${result.detail}\n${result.remediation ?? ''}`;

describe('MCP check — the probe error is free-form text from a credential-carrying declaration', () => {
  const server = (name: string): IMcpServer =>
    ({
      id: name,
      name,
      enabled: true,
      transport: { type: 'http', url: 'https://mcp.example.com', headers: { Authorization: `Bearer ${BEARER}` } },
    }) as unknown as IMcpServer;

  it('KNOWN POSITIVE: the matcher finds the secret in the unscrubbed probe text', () => {
    expect(findsSecret(`401 Unauthorized (sent Authorization: Bearer ${BEARER})`)).toBe(true);
  });

  it('scrubs a bearer echoed back by a failing server', async () => {
    const result = await checkMcpServers({
      listServers: async () => [server('notion')],
      testConnection: async () => ({
        success: false,
        error: `401 Unauthorized (sent Authorization: Bearer ${BEARER})`,
      }),
    });
    expect(result.status).toBe('fail');
    expect(findsSecret(surfaced(result))).toBe(false);
    // Still names the server so the user knows what to fix.
    expect(result.detail).toContain('notion');
  });

  it('PREFIXLESS CANARY: masks a declared env value the server echoed on stderr', async () => {
    const stdio = {
      id: 'azure',
      name: 'azure',
      enabled: true,
      transport: {
        type: 'stdio',
        command: 'node',
        args: ['./server.js'],
        env: { AZURE_OPENAI_API_KEY: PREFIXLESS_KEY },
      },
    } as unknown as IMcpServer;

    // The real shape: the child dies before the handshake and `McpProtocol`
    // appends up to 300 characters of its stderr as `Server output: ...`.
    const result = await checkMcpServers({
      listServers: async () => [stdio],
      testConnection: async () => ({
        success: false,
        error: `MCP error -32000: Connection closed. Server output: Traceback: config error with ${PREFIXLESS_ASSIGNMENT} at startup`,
      }),
    });

    expect(result.status).toBe('fail');
    // `redactSecrets` alone cannot do this - see PREFIXLESS_KEY. It is masked
    // because the value is in `transport.env`, matched literally.
    expect(findsPrefixlessKey(surfaced(result))).toBe(false);
    // The diagnostic still identifies the server and the failure.
    expect(result.detail).toContain('azure');
    expect(result.detail).toContain('Connection closed');
  });

  it('PREFIXLESS CANARY: masks a declared header value and a declared arg', async () => {
    const declared = {
      id: 'hosted',
      name: 'hosted',
      enabled: true,
      transport: {
        type: 'http',
        url: 'https://mcp.example.com',
        headers: { 'X-Api-Key': PREFIXLESS_KEY },
      },
    } as unknown as IMcpServer;
    const withArg = {
      id: 'argy',
      name: 'argy',
      enabled: true,
      transport: { type: 'stdio', command: 'node', args: ['./s.js', `--api-key=${PREFIXLESS_KEY}`] },
    } as unknown as IMcpServer;

    // Both spellings the server can echo: the BARE secret on its own, and the
    // whole wrapped token it was declared as.
    const echoes = [
      `rejected request carrying ${PREFIXLESS_KEY}`,
      `Usage: server --api-key=${PREFIXLESS_KEY}`,
      `X-Api-Key: ${PREFIXLESS_KEY} was refused`,
    ];
    const cases = [declared, withArg].flatMap((subject) => echoes.map((echo) => ({ subject, echo })));
    const results = await Promise.all(
      cases.map(async ({ subject, echo }) => ({
        subject,
        outcome: await checkMcpServers({
          listServers: async () => [subject],
          testConnection: async () => ({ success: false, error: echo }),
        }),
      }))
    );
    for (const { subject, outcome } of results) {
      expect(findsPrefixlessKey(surfaced(outcome))).toBe(false);
      expect(outcome.detail).toContain(subject.name);
    }
  });

  it('SHORT CANARY: masks a 7-char password and a 4-char pin from env', async () => {
    // `redactSecrets` floors every rule at 8 characters, so neither of these is
    // visible to it. They are masked here only because they are declared values.
    const server3 = {
      id: 'db',
      name: 'db',
      enabled: true,
      transport: { type: 'stdio', command: 'node', env: { DB_PASSWORD: SHORT_SECRET, PIN: TINY_SECRET } },
    } as unknown as IMcpServer;
    const result = await checkMcpServers({
      listServers: async () => [server3],
      testConnection: async () => ({
        success: false,
        error: `auth failed: password ${SHORT_SECRET} pin ${TINY_SECRET}`,
      }),
    });
    expect(result.detail).not.toContain(SHORT_SECRET);
    expect(result.detail).not.toContain(TINY_SECRET);
    expect(result.detail).toContain('db');
  });

  it('does NOT mask a 1-3 char env value, which would shred the whole detail', async () => {
    // `DEBUG=1` is an ordinary declaration. Masking it would blank every "1" in
    // the error text, destroying the diagnostic instead of protecting anything.
    const server4 = {
      id: 'dbg',
      name: 'dbg',
      enabled: true,
      transport: { type: 'stdio', command: 'node', env: { DEBUG: '1', TZ: 'UTC' } },
    } as unknown as IMcpServer;
    const result = await checkMcpServers({
      listServers: async () => [server4],
      testConnection: async () => ({ success: false, error: 'MCP error -32000: exited with code 1 at 10:31 UTC' }),
    });
    expect(result.detail).toContain('-32000');
    expect(result.detail).toContain('code 1');
    expect(result.detail).toContain('UTC');
  });

  it('ACCEPTANCE: the two commonest MCP failures stay readable', async () => {
    // A stock filesystem-server declaration. Masking whole `args` turned these
    // into `registry.npmjs.org/[redacted]` and `scandir '[redacted]'` - i.e. the
    // tool whose only job is to diagnose these two failures could no longer say
    // which package or which directory. Both strings must survive verbatim.
    const filesystem = {
      id: 'fs',
      name: 'filesystem',
      enabled: true,
      transport: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/alice/Documents'],
        env: { NODE_ENV: 'production' },
      },
    } as unknown as IMcpServer;

    const wrongPackage = await checkMcpServers({
      listServers: async () => [filesystem],
      testConnection: async () => ({
        success: false,
        error:
          'MCP error -32000: Connection closed. Server output: npm ERR! 404 Not Found - GET https://registry.npmjs.org/@modelcontextprotocol/server-filesystem - Not found.',
      }),
    });
    expect(wrongPackage.detail).toContain('npm ERR! 404');
    expect(wrongPackage.detail).toContain('https://registry.npmjs.org/@modelcontextprotocol/server-filesystem');

    const missingDir = await checkMcpServers({
      listServers: async () => [filesystem],
      testConnection: async () => ({
        success: false,
        error: "ENOENT: no such file or directory, scandir '/Users/alice/Documents'",
      }),
    });
    expect(missingDir.detail).toContain('ENOENT: no such file or directory');
    expect(missingDir.detail).toContain("scandir '/Users/alice/Documents'");
  });

  it('PREFIXLESS CANARY: masks a token embedded in a hosted endpoint URL', async () => {
    // Path-embedded is the standard shape for Zapier / Smithery / Composio, and
    // undici echoes the URL in its own error text.
    const urls = [
      `https://mcp.example.com/v1/${PREFIXLESS_KEY}/sse`,
      `https://mcp.example.com/sse?t=${PREFIXLESS_KEY}`,
      `https://mcp.example.com/sse?azure_openai_api_key=${PREFIXLESS_KEY}`,
    ];
    const results = await Promise.all(
      urls.map((url) =>
        checkMcpServers({
          listServers: async () => [
            { id: 'hosted', name: 'hosted', enabled: true, transport: { type: 'sse', url } } as unknown as IMcpServer,
          ],
          testConnection: async () => ({ success: false, error: `getaddrinfo ENOTFOUND for ${url}` }),
        })
      )
    );
    for (const result of results) {
      expect(findsPrefixlessKey(surfaced(result))).toBe(false);
      expect(result.detail).toContain('hosted');
    }
  });

  it('PREFIXLESS CANARY: masks the mcp-remote --header Authorization shape', async () => {
    // The documented `mcp-remote` spelling. Reaching the bare token needs TWO
    // unwraps: past the `:`, then past the space after `Bearer`.
    const shapes = [
      ['mcp-remote', 'https://x/sse', '--header', `Authorization: Bearer ${PREFIXLESS_KEY}`],
      ['mcp-remote', 'https://x/sse', `--header=Authorization: Bearer ${PREFIXLESS_KEY}`],
    ];
    const echoes = [`rejected: ${PREFIXLESS_KEY}`, `sent Bearer ${PREFIXLESS_KEY}`];
    const combos = shapes.flatMap((args) => echoes.map((echo) => ({ args, echo })));
    const results = await Promise.all(
      combos.map(({ args, echo }) =>
        checkMcpServers({
          listServers: async () => [
            {
              id: 'remote',
              name: 'remote',
              enabled: true,
              transport: { type: 'stdio', command: 'npx', args },
            } as unknown as IMcpServer,
          ],
          testConnection: async () => ({ success: false, error: echo }),
        })
      )
    );
    for (const result of results) {
      expect(findsPrefixlessKey(surfaced(result))).toBe(false);
    }
  });

  it('PREFIXLESS CANARY: masks an env value declared with a trailing space', async () => {
    // A trailing space is legal in an env value (`validateMcpEnvEntry` rejects
    // only <= 0x1f), and the untrimmed original never matches the echoed token.
    const result = await checkMcpServers({
      listServers: async () => [
        {
          id: 'sloppy',
          name: 'sloppy',
          enabled: true,
          transport: { type: 'stdio', command: 'node', env: { TOK: `${PREFIXLESS_KEY} ` } },
        } as unknown as IMcpServer,
      ],
      testConnection: async () => ({ success: false, error: `bad token ${PREFIXLESS_KEY}` }),
    });
    expect(findsPrefixlessKey(surfaced(result))).toBe(false);
  });

  it('scrubs an api_key echoed from a stdio server env', async () => {
    const result = await checkMcpServers({
      listServers: async () => [server('custom')],
      testConnection: async () => ({
        // Masked on the strength of the `sk-ant-` VALUE prefix. The
        // `ANTHROPIC_API_KEY=` label itself does not trigger the scrubber's
        // label rule (#1026) - that is why the value's shape matters here.
        success: false,
        error: `spawn failed: ANTHROPIC_API_KEY=${API_KEY} node ./server.js`,
      }),
    });
    expect(findsSecret(surfaced(result))).toBe(false);
    expect(result.detail).toContain('custom');
  });
});

describe('backends check — loader errors come from credential-bearing config stores', () => {
  const agents: DetectedAgent[] = [
    { id: 'claude', name: 'Claude Code', kind: 'acp', available: true, backend: 'claude' } as unknown as DetectedAgent,
  ];

  it('scrubs a credential carried in a remote-agent loader error', async () => {
    const result = await checkBackends({
      getDetectedAgents: () => agents,
      getLoadErrors: () => [`[remote] request rejected for token ${API_KEY}`],
    });
    expect(result.status).toBe('warn');
    expect(findsSecret(surfaced(result))).toBe(false);
    // Still reports that a loader failed, and how many.
    expect(result.detail).toContain('1 loader error(s)');
  });
});

describe('engine reachability check — unbounded `--version` stdout', () => {
  it('PREFIXLESS CANARY: surfaces only the version number, never the rest of the banner', async () => {
    // `detectWCore` hands back whatever `execFileSync` printed, unvalidated and
    // unbounded (`binaryResolver.ts`).
    const result = await checkEngineReachable(() => ({
      available: true,
      path: '/opt/wayland/engine',
      version: `wayland-core 0.13.0 (env ${PREFIXLESS_ASSIGNMENT})`,
    }));

    expect(result.status).toBe('pass');
    expect(findsPrefixlessKey(surfaced(result))).toBe(false);
    // Still actionable: the version the user needs is still reported.
    expect(result.detail).toContain('0.13.0');
  });

  it('PREFIXLESS CANARY: none of the six adversarial banners leaks', async () => {
    // Every one of these returned `pass` with the credential in the detail under
    // the first, unanchored/unbounded pattern. The last needs no version banner
    // at all: the search simply started INSIDE the token.
    const long = 'x'.repeat(200_000);
    const banners = [
      `1.0.0-sk-ant-api03-${'A'.repeat(40)}`,
      `0.13.0_${PREFIXLESS_KEY}`,
      `0.13.0+build.${'eyJhbGciOiJIUzI1NiJ9'}.${'b'.repeat(46)}`,
      `token=sk-ant-1.2.3-${'c'.repeat(58)}`,
      `9.9.9-${long}`,
      `wayland-core 0.13.0 (env ${PREFIXLESS_ASSIGNMENT})`,
    ];

    const results = await Promise.all(
      banners.map((version) => checkEngineReachable(() => ({ available: true, path: '/opt/e', version })))
    );

    for (const result of results) {
      const text = surfaced(result);
      expect(findsPrefixlessKey(text)).toBe(false);
      expect(findsSecret(text)).toBe(false);
      expect(text).not.toContain('A'.repeat(40));
      expect(text).not.toContain('b'.repeat(46));
      expect(text).not.toContain('c'.repeat(58));
      expect(text).not.toContain(long);
      // Belt-and-braces cap: nothing version-shaped can be long.
      expect(text.length).toBeLessThan(200);
    }
  });

  it('still accepts the three legitimate banner spellings', async () => {
    const cases: Array<[string, string]> = [
      ['v0.10.0', 'v0.10.0'],
      ['wayland-core 0.13.0 (env X)', '0.13.0'],
      ['banner v0.10.0 extra', 'v0.10.0'],
    ];
    const results = await Promise.all(
      cases.map(([version]) => checkEngineReachable(() => ({ available: true, path: '/opt/e', version })))
    );
    results.forEach((result, index) => {
      expect(result.status).toBe('pass');
      expect(result.detail).toContain(`engine ${cases[index][1]} is reachable`);
    });
  });

  it('accepts a normal prerelease/build tail but not an unbounded one', async () => {
    const ok = await checkEngineReachable(() => ({ available: true, path: '/opt/e', version: '0.13.0-rc.1' }));
    expect(ok.status).toBe('pass');
    expect(ok.detail).toContain('0.13.0-rc.1');
  });

  it('warns without echoing stdout when it carries no version number', async () => {
    const result = await checkEngineReachable(() => ({
      available: true,
      path: '/opt/wayland/engine',
      version: `garbage ${PREFIXLESS_ASSIGNMENT}`,
    }));

    expect(result.status).toBe('warn');
    expect(findsPrefixlessKey(surfaced(result))).toBe(false);
    expect(result.detail).toContain('did not report a usable version');
  });
});

/**
 * SCRUB-ONLY, and knowingly incomplete. A chat title IS user prose, so unlike a
 * TOML parse error or an MCP declaration there is nothing structural to strip.
 * The prefixed-label form `AZURE_OPENAI_API_KEY=<value>` therefore still survives
 * both labels - verified by execution - exactly as it does in backendChecks, and
 * it is blocked on the same fix (#1026). It is deliberately NOT pinned by an
 * assertion here: the scrub call is already the regression guard, #1026 closes
 * the prefixed form through that same call with no further change to this file,
 * and a test asserting the gap stays open would only red out that lane's CI.
 */
describe('workspace checks — labels built from auto-generated chat titles', () => {
  // A conversation's name is generated from the user's FIRST MESSAGE, so pasting
  // a credential into chat makes it the chat title (`doctor/registry.ts`).
  const leakyLabel = `Chat "Rotate my ${API_KEY} please"`;

  it('scrubs the label in the drift check', async () => {
    const result = await checkWorkspaceDrift({
      listWorkspaces: async () => [{ label: leakyLabel, path: '/gone/workspace' }],
      pathExists: async () => false,
    });
    expect(result.status).toBe('fail');
    expect(findsSecret(surfaced(result))).toBe(false);
    // Still names the path so the user can act.
    expect(result.detail).toContain('/gone/workspace');
  });

  it('scrubs the workspace PATH, not just the label', async () => {
    // A workspace folder can itself be named after a credential.
    const result = await checkWorkspaceDrift({
      listWorkspaces: async () => [{ label: 'Chat conv-1', path: `/Users/a/ws/${API_KEY}` }],
      pathExists: async () => false,
    });
    expect(findsSecret(surfaced(result))).toBe(false);
  });

  it('scrubs the label in the configured check', async () => {
    const result = await checkWorkspaceConfigured({
      listWorkspaces: async () => [{ label: leakyLabel, path: '/tmp/throwaway', customWorkspace: false }],
      tmpDir: '/tmp',
    });
    expect(result.status).toBe('warn');
    expect(findsSecret(surfaced(result))).toBe(false);
    expect(result.detail).toContain('/tmp/throwaway');
  });
});

describe('engine contract-pin check — raw fs error text', () => {
  it('scrubs the binary-read failure message', async () => {
    const result = await checkEngineContractPin(
      {
        binaryPath: () => '/opt/wayland/engine',
        advertisedSchemaDigest: async () => {
          throw new Error(`EACCES: /opt/wayland/engine (token ${API_KEY})`);
        },
      },
      'sha256:0000'
    );
    expect(result.status).toBe('warn');
    expect(findsSecret(surfaced(result))).toBe(false);
    expect(result.detail).toContain('EACCES');
  });
});

describe('MCP check — a THROWN probe must not bypass the declaration masking', () => {
  // `testMcpConnection` runs `validateMcpServer` synchronously before it spawns
  // anything, and that validator throws with the RAW url. Before the catch in
  // `probeWithTimeout`, the rejection escaped `checkMcpServers` altogether and
  // surfaced through the runner's catch-all, which knows nothing about this
  // server's declaration - so the whole masking fix was bypassed for exactly the
  // servers most likely to be malformed. Stored declarations CAN be invalid:
  // older installs and JSON imports predate validation.
  const badUrl = `https://mcp.example.com/v1/${PREFIXLESS_KEY}/sse`;
  const invalid = {
    id: 'invalid',
    name: 'invalid',
    enabled: true,
    transport: { type: 'sse', url: badUrl },
  } as unknown as IMcpServer;
  const thrower = async (): Promise<never> => {
    throw new Error(`Invalid MCP server URL for "invalid": ${badUrl}`);
  };

  it('PREFIXLESS CANARY: converts the throw into a masked per-server failure', async () => {
    const result = await checkMcpServers({ listServers: async () => [invalid], testConnection: thrower });
    expect(result.status).toBe('fail');
    expect(findsPrefixlessKey(surfaced(result))).toBe(false);
    expect(result.detail).toContain('invalid');
  });

  it('PREFIXLESS CANARY: stays masked end to end through runDoctor', async () => {
    const report = await runDoctor([
      {
        id: 'mcp.servers',
        titleKey: 'mcp.servers',
        category: 'mcp',
        run: () => checkMcpServers({ listServers: async () => [invalid], testConnection: thrower }),
      },
    ]);
    const [result] = report.results;
    expect(findsPrefixlessKey(surfaced(result))).toBe(false);
    // Not the runner's generic "Check threw an error" line - the per-server
    // detail survived, which is the point of catching it in the check.
    expect(result.detail).not.toContain('Check threw an error');
  });

  it("one malformed server does not destroy the other servers' detail", async () => {
    const healthy = {
      id: 'ok',
      name: 'ok',
      enabled: true,
      transport: { type: 'stdio', command: 'node' },
    } as unknown as IMcpServer;
    const result = await checkMcpServers({
      listServers: async () => [invalid, healthy],
      testConnection: async (server) => {
        if (server.name === 'invalid') return thrower();
        return { success: false, error: 'plain failure' };
      },
    });
    expect(result.detail).toContain('ok');
    expect(result.detail).toContain('plain failure');
    expect(findsPrefixlessKey(surfaced(result))).toBe(false);
  });
});

describe('workspace inventory — the producer chooses the label', () => {
  // A conversation name is generated from the user's FIRST MESSAGE. A BARE
  // credential as that message has no label, no assignment and no recognisable
  // prefix, so NO scrubber can ever match it - which is why the fix has to be
  // here, at the producer, and not a scrub downstream.
  const services = {
    listProjects: async () => [
      { id: 'proj-1', name: BARE_SECRET, workspace: '/gone/ws', pinned: false, createTime: 0, modifyTime: 0 },
    ],
    listConversations: async () => [
      { id: 'conv-1', name: BARE_SECRET, extra: { workspace: '/gone/chat-ws', customWorkspace: false } },
    ],
  } as unknown as Parameters<typeof collectConfiguredWorkspaces>[0];

  it('KNOWN POSITIVE: no scrubber can mask a bare credential used as a chat title', () => {
    // Proves the matcher works AND that the scrub-only plan for this sink was
    // never going to close it.
    expect(redactSecrets(`Chat "${BARE_SECRET}"`)).toContain(BARE_SECRET);
  });

  it('BARE CANARY: emits the app-generated id, never the name (drift inventory)', async () => {
    const entries = await collectConfiguredWorkspaces(services);
    expect(entries).toHaveLength(2);
    for (const entry of entries) {
      expect(entry.label).not.toContain(BARE_SECRET);
    }
    expect(entries.map((entry) => entry.label)).toEqual(['Project proj-1', 'Chat conv-1']);
    // The actionable half is untouched.
    expect(entries.map((entry) => entry.path)).toEqual(['/gone/ws', '/gone/chat-ws']);
  });

  it('BARE CANARY: emits the app-generated id, never the name (configured inventory)', async () => {
    const entries = await collectWorkspaceConfigEntries(services);
    expect(entries).toHaveLength(2);
    for (const entry of entries) {
      expect(entry.label).not.toContain(BARE_SECRET);
    }
    expect(entries.map((entry) => entry.label)).toEqual(['Project proj-1', 'Chat conv-1']);
  });

  it('BARE CANARY: the rendered Doctor detail carries no trace of the name', async () => {
    const result = await checkWorkspaceDrift({
      listWorkspaces: () => collectConfiguredWorkspaces(services),
      pathExists: async () => false,
    });
    expect(result.status).toBe('fail');
    expect(result.detail).not.toContain(BARE_SECRET);
    expect(result.detail).toContain('/gone/ws');
  });
});

describe('runner — the catch-all for every check', () => {
  it('scrubs a credential carried by a thrown check error', async () => {
    const report = await runDoctor([
      {
        id: 'test.throws',
        titleKey: 'test.throws',
        category: 'config',
        run: async () => {
          throw new Error(`failed reading config: api_key = "${API_KEY}"`);
        },
      },
    ]);
    expect(report.results).toHaveLength(1);
    const [result] = report.results;
    expect(result.status).toBe('fail');
    expect(findsSecret(surfaced(result))).toBe(false);
    // Still says a check threw, so the failure is not silent.
    expect(result.detail).toContain('Check threw an error');
  });
});
