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
import { runDoctor } from '@process/doctor/runner';
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

  it('leaves a short non-secret env value alone so the diagnostic survives', async () => {
    // A blanket literal replacement with no length floor would blank the word
    // "production" out of the probe's own error text.
    const server2 = {
      id: 'plain',
      name: 'plain',
      enabled: true,
      transport: { type: 'stdio', command: 'node', env: { NODE_ENV: 'prod', PORT: '3000' } },
    } as unknown as IMcpServer;
    const result = await checkMcpServers({
      listServers: async () => [server2],
      testConnection: async () => ({ success: false, error: 'listen EADDRINUSE on port 3000 in prod mode' }),
    });
    expect(result.detail).toContain('3000');
    expect(result.detail).toContain('prod');
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
