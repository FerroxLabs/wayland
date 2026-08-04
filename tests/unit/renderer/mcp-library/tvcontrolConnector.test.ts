/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TVControl is the first catalog connector whose usefulness depends on a
 * precondition Wayland cannot satisfy for the user: TradingView Desktop has to
 * be running, started with its control port open. The catalog schema has no
 * way to express a precondition, so the SETUP GUIDE is the only place that
 * instruction exists.
 *
 * A guide only renders when the entry declares `x-wayland.setupGuide.path`
 * (DetailPage reads the guide only if that field is present, and
 * build-catalog-index derives `guideUrl` from it). Omit it and the connector
 * still installs, still shows green, and silently never works - so these tests
 * pin the wiring rather than the prose.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import yaml from 'js-yaml';
import { describe, it, expect } from 'vitest';

import { entryToServerData } from '@/renderer/pages/settings/McpLibrary/entryToServerData';
import type { CatalogEntry } from '@/renderer/pages/settings/McpLibrary/types';
import tvcontrolEntry from '@/renderer/mcp-catalog/entries/com.ferroxlabs-tvcontrol.json';

const entry = tvcontrolEntry as unknown as CatalogEntry;

describe('TVControl catalog connector', () => {
  it('spawns the published npm package over stdio', () => {
    const data = entryToServerData(entry, {});

    expect(data.transport.type).toBe('stdio');
    // `npx` is deliberate: resolveMcpStdioSpawn rewrites it to Wayland's
    // bundled Bun for the probe and for Core/ACP sessions, so the connector
    // works on a machine with no system node.
    expect((data.transport as { command: string }).command).toBe('npx');
    expect(JSON.stringify(data.transport)).toContain('@ferroxlabs/tvcontrol');
  });

  it('declares no auth, so the install card does not demand a token', () => {
    // With any non-"none" method DetailPage renders "Sign-in or a token is
    // required after install." and routes Install through the oauth-flow
    // branch - both wrong for a connector that talks to a local desktop app.
    expect(entry['x-wayland'].auth.method).toBe('none');
    expect(entry.packages[0].environmentVariables ?? []).toEqual([]);
  });

  it('declares a setup guide, without which the precondition never reaches the user', () => {
    const guidePath = entry['x-wayland'].setupGuide?.path;
    expect(guidePath, 'entry must declare x-wayland.setupGuide.path').toBe(
      'guides/com.ferroxlabs-tvcontrol.md'
    );
  });

  it('the guide actually tells the user to start TradingView with the control port', () => {
    // The one instruction the whole connector depends on. Asserted against the
    // guide body so it cannot be edited away while the file still exists.
    const raw = readFileSync(
      join(__dirname, '../../../../src/renderer/mcp-catalog/guides/com.ferroxlabs-tvcontrol.md'),
      'utf-8'
    );
    const front = yaml.load(raw.split('---')[1]) as { steps: Array<{ id: string; body: string }> };
    const bodies = front.steps.map((step) => step.body).join('\n');

    expect(bodies).toContain('--remote-debugging-port=9222');
    expect(bodies, 'Store installs need the bundled launcher, not the direct path').toContain(
      'launch_tv_debug.bat'
    );
  });

  it('does not enable the arbitrary-page-JS tool', () => {
    // ui_evaluate runs arbitrary JavaScript in the TradingView page and is
    // unregistered unless TV_MCP_ADVANCED=1. The catalog must never set it.
    expect(JSON.stringify(entry)).not.toContain('TV_MCP_ADVANCED');
  });
});
