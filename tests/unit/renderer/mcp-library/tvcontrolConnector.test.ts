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

import { resolveMcpStdioSpawn } from '@process/services/mcpServices/mcpStdioSpawn';
import { entryToServerData } from '@/renderer/pages/settings/McpLibrary/entryToServerData';
import type { CatalogEntry } from '@/renderer/pages/settings/McpLibrary/types';
import tvcontrolEntry from '@/renderer/mcp-catalog/entries/com.ferroxlabs-tvcontrol.json';

const entry = tvcontrolEntry as unknown as CatalogEntry;

const GUIDE_PATH = join(__dirname, '../../../../src/renderer/mcp-catalog/guides/com.ferroxlabs-tvcontrol.md');

function readGuideRaw(): string {
  return readFileSync(GUIDE_PATH, 'utf-8');
}

/**
 * Parse the guide the same way the app does: anchored frontmatter regex plus
 * js-yaml FAILSAFE_SCHEMA (`useMcpLibrary.ts:121,127`), matching the sibling
 * `telegramConnector.test.ts`.
 *
 * A bare `raw.split('---')[1]` — what this file used to do — silently truncates
 * the moment any step body contains a markdown `---` divider, and it resolves
 * scalars with the DEFAULT schema while production gets strings from FAILSAFE.
 * A guide test that parses differently from the app can pass on a file the app
 * cannot load.
 */
function parseGuideLikeProduction(): {
  steps: Array<{ id: string; body: string; warning?: string; inputs?: Array<{ name: string }> }>;
} {
  const match = readGuideRaw().match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('tvcontrol guide missing frontmatter');
  return yaml.load(match[1], { schema: yaml.FAILSAFE_SCHEMA }) as ReturnType<typeof parseGuideLikeProduction>;
}

describe('TVControl catalog connector', () => {
  it('spawns the published npm package over stdio, with an exact argv', () => {
    const data = entryToServerData(entry, {});
    const transport = data.transport as { command: string; args: string[] };

    expect(transport.type ?? data.transport.type).toBe('stdio');
    // `npx` is deliberate: resolveMcpStdioSpawn rewrites it to Wayland's
    // bundled Bun for the probe and for Core/ACP sessions, so the connector
    // works on a machine with no system node.
    expect(transport.command).toBe('npx');
    // Assert the WHOLE argv, not a substring. The previous `toContain` check
    // passed against 2.2.1 — a version whose `bin` pointed at the CLI router,
    // so `npx @ferroxlabs/tvcontrol` answered an MCP initialize with
    // "Usage: tv <command>" and the connector could never connect. A substring
    // match cannot tell a working spec from an unrunnable one.
    expect(transport.args).toEqual(['@ferroxlabs/tvcontrol@2.4.2']);
  });

  it('pins a version whose published bin is the MCP server, not the CLI', () => {
    // The defect class that shipped: the catalog spec was well-formed and the
    // package existed, but `npx <pkg>` resolved to a bin that does not speak
    // MCP. Pinning is what makes that checkable at all — `latest` would let the
    // bin map move underneath this entry with every test still green.
    const pkg = entry.packages[0];
    expect(pkg.version, 'must be pinned; "latest" cannot be verified').toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.version).toBe('2.4.2');
  });

  /**
   * THE PIN LIVES IN THREE PLACES AND ONLY ONE OF THEM IS THIS FILE.
   *
   * `tvcontrol-setup/SKILL.md` carries the version inside the proposal block
   * the assistant emits - `args: @ferroxlabs/tvcontrol@<version>` - which is
   * what actually gets installed when the user clicks Apply. The catalog entry
   * carries it twice more. Nothing tied them together, so bumping the catalog
   * and forgetting the skill would install one version through the library card
   * and a different one through the assistant, with every test still green.
   *
   * The catalog entry is the source of truth here because it is what
   * `entryToServerData` builds argv from; the skill has to agree with it.
   */
  it('the setup skill proposes the SAME version the catalog entry pins', () => {
    const skill = readFileSync(
      join(__dirname, '../../../../src/process/resources/skills/tvcontrol-setup/SKILL.md'),
      'utf-8'
    );
    const proposed = skill.match(/^args:\s*@ferroxlabs\/tvcontrol@(\S+)$/m)?.[1];
    expect(proposed, 'the skill must still emit an args: line for the connector').toBeTruthy();
    expect(proposed).toBe(entry.packages[0].version);
    // Both catalog fields, too: `version` is what the library card shows and
    // `packages[0].version` is what is installed, and they are separate keys.
    expect(entry.version).toBe(entry.packages[0].version);
  });

  /**
   * The skill's own prose forbids proposing a floating tag. That instruction is
   * the reason the pin holds at all, so it is asserted rather than trusted.
   */
  it('the setup skill still refuses to propose a floating tag', () => {
    const skill = readFileSync(
      join(__dirname, '../../../../src/process/resources/skills/tvcontrol-setup/SKILL.md'),
      'utf-8'
    );
    expect(skill).toMatch(/Do not propose `@latest`/);
    // Positive control for the scan above: the file really does contain the
    // proposal block this pair of tests reads, so neither can pass vacuously.
    expect(skill).toMatch(/\[CONCIERGE_PROPOSE\]/);
  });

  /**
   * PIN COHERENCE, END TO END, AGAINST A CONSTANT.
   *
   * The three pin sites (catalog `version`, catalog `packages[0].version`, and the
   * setup skill's [CONCIERGE_PROPOSE] `args:` line) are checked against each other
   * above. That is necessary and not sufficient: all three can agree on a version
   * whose published bin is not the MCP server, which is exactly what shipped in
   * `008aa213f`.
   *
   * So this case runs the entry through the SAME two production transforms the
   * live spawn uses - entryToServerData, then resolveMcpStdioSpawn's npx -> bundled
   * Bun rewrite - and compares the resulting package spec to a constant written
   * HERE. Reading the version out of the entry and comparing it to itself passes on
   * any value; the constant is where the RED comes from.
   */
  it('the catalog, the skill and the bundled-Bun spawn all resolve one pinned version', () => {
    // The version whose published `tvcontrol` bin is src/server.js WITH a shebang,
    // so `bun x --bun <spec>` answers `initialize` instead of printing `Usage: tv`.
    // 2.3.0's bin pointed at the human CLI. Bump this deliberately, never to match.
    const EXPECTED_SPEC = '@ferroxlabs/tvcontrol@2.4.2';

    const data = entryToServerData(entry, {});
    const transport = data.transport as { command: string; args: string[] };

    // Production transform #2: what Core/ACP actually spawn. `bun` is stubbed so
    // the assertion holds on a machine with no bundled runtime on disk.
    const resolved = resolveMcpStdioSpawn(transport.command, transport.args, () => '/stub/bun', 'darwin');
    expect(resolved.args.slice(0, 2)).toEqual(['x', '--bun']);

    const spec = resolved.args.find((a) => a.startsWith('@ferroxlabs/tvcontrol@'));
    expect(spec, 'the bundled-Bun argv must still carry the pinned package spec').toBeTruthy();
    expect(spec).toBe(EXPECTED_SPEC);

    // And the assistant's proposal has to name the same one, or clicking Apply in a
    // chat installs a different version from the one the library card installs.
    const skill = readFileSync(
      join(__dirname, '../../../../src/process/resources/skills/tvcontrol-setup/SKILL.md'),
      'utf-8'
    );
    const proposed = skill.match(/^args:\s*(@ferroxlabs\/tvcontrol@\S+)$/m)?.[1];
    expect(proposed).toBe(EXPECTED_SPEC);
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
    expect(guidePath, 'entry must declare x-wayland.setupGuide.path').toBe('guides/com.ferroxlabs-tvcontrol.md');
  });

  it('the guide actually tells the user to start TradingView with the control port', () => {
    // The one instruction the whole connector depends on. Asserted against the
    // guide body so it cannot be edited away while the file still exists.
    const front = parseGuideLikeProduction();
    const bodies = front.steps.map((step) => step.body).join('\n');

    expect(bodies).toContain('--remote-debugging-port=9222');
  });

  it('warns, in rendered content, that the open port is a standing local exposure', () => {
    // SetupGuide renders `step.body` and `step.warning`. It does NOT render the
    // guide's top-level markdown body — so a disclosure written below the
    // frontmatter is invisible in the product. This connector asks the user to
    // leave an unauthenticated CDP port open on a signed-in financial app, so
    // that warning has to live somewhere that actually displays.
    const front = parseGuideLikeProduction();
    const step = front.steps.find((s) => s.id === 'enable-control');
    expect(step?.warning, 'the enable-control step must carry a rendered warning').toBeTruthy();
    expect(step?.warning).toMatch(/any program on this computer/i);
  });

  it('does not enable the arbitrary-page-JS tool, in the entry OR the guide', () => {
    // ui_evaluate runs arbitrary JavaScript in the TradingView page and stays
    // unregistered unless TV_MCP_ADVANCED=1. Checking the entry alone is the
    // wrong guard: transport.env is built from the GUIDE's `steps[].inputs[]`
    // (entryToServerData.ts:64-66), and input names only have to match
    // /^[A-Z][A-Z0-9_]*$/ — which TV_MCP_ADVANCED satisfies. So a guide edit
    // could re-enable it with an entry-only assertion still green.
    expect(JSON.stringify(entry)).not.toContain('TV_MCP_ADVANCED');

    // Assert on the STRUCTURE that reaches transport.env, not on raw text. The
    // guide's prose deliberately mentions TV_MCP_ADVANCED to tell users the
    // tool is off unless they set it themselves; a substring scan cannot tell
    // that documentation apart from an actual enablement, and would fail on
    // the very sentence that makes the default safe.
    const front = parseGuideLikeProduction();
    const inputNames = front.steps.flatMap((s) => (s.inputs ?? []).map((i) => i.name));
    expect(inputNames).toEqual([]);
  });
});
