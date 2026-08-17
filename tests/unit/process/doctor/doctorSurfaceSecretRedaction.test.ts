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
 */

import { describe, expect, it } from 'vitest';
import { checkMcpServers } from '@process/doctor/checks/mcpChecks';
import { checkBackends } from '@process/doctor/checks/backendChecks';
import { checkEngineContractPin } from '@process/doctor/checks/engineChecks';
import { runDoctor } from '@process/doctor/runner';
import type { IMcpServer } from '@/common/config/storage';
import type { DetectedAgent } from '@/common/types/detectedAgent';

const API_KEY = 'sk-ant-api03-Zx91QmT4LpVn7BdKe0RsYcHu2WjAgF6oXlP3NtEbQvMk8ZaSdCyRfGhJ';
const BEARER = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ3YXlsYW5kLXRlc3QifQ.s3cr3tS1gnatureV4lu3';

/** Distinctive prefixes as well as whole values, so a partial leak still counts. */
const findsSecret = (text: string): boolean =>
  text.includes(API_KEY) ||
  text.includes('sk-ant-api03-Zx91') ||
  text.includes(BEARER) ||
  text.includes('s3cr3tS1gnatureV4lu3');

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

  it('scrubs an api_key echoed from a stdio server env', async () => {
    const result = await checkMcpServers({
      listServers: async () => [server('custom')],
      testConnection: async () => ({
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
