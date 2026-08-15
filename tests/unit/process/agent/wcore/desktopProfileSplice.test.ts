/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-01 Task 1 (RED): pure tests for the new global-config MCP profile splice.
 *
 * No fs, no `WCoreAgent` - this exercises `spliceDesktopMcpProfile` as a leaf
 * pure function. The `fragment` input is built via the REAL
 * `appendDesktopMcpProfile(null, names)` from `envBuilder.ts` so these tests
 * exercise the real fragment shape, not a hand-typed stand-in.
 */
import { parse } from 'smol-toml';
import { describe, expect, it } from 'vitest';
import { appendDesktopMcpProfile, WCORE_DESKTOP_MCP_PROFILE } from '@process/agent/wcore/envBuilder';
import { DesktopProfileSpliceError, spliceDesktopMcpProfile } from '@process/agent/wcore/desktopProfileSplice';

type ParsedGlobalConfig = {
  profiles?: Record<string, { mcp_servers?: string[] }>;
  providers?: Record<string, unknown>;
};

describe('spliceDesktopMcpProfile', () => {
  it('returns exactly the fragment when no existing content is present', () => {
    const fragment = appendDesktopMcpProfile(null, ['tavily', 'firecrawl']);

    const result = spliceDesktopMcpProfile(null, fragment);

    expect(result).toBe(fragment);
    const parsed = parse(result) as ParsedGlobalConfig;
    expect(parsed.profiles?.[WCORE_DESKTOP_MCP_PROFILE]?.mcp_servers).toEqual(['firecrawl', 'tavily']);
  });

  it('preserves an unrelated table and a comment verbatim (anti-round-trip proof)', () => {
    const existing = ['# my note', '[providers.anthropic]', 'base_url = "https://api.anthropic.com"', ''].join('\n');
    const fragment = appendDesktopMcpProfile(null, ['tavily']);

    const result = spliceDesktopMcpProfile(existing, fragment);

    // Byte-for-byte substring survival - a parse+stringify round trip would
    // silently drop the comment, which is exactly what this guards against.
    // This is the PRIMARY automated anti-round-trip guard: it fails the
    // moment anyone "simplifies" the implementation back to parse+stringify.
    expect(result).toContain('# my note');
    expect(result).toContain('[providers.anthropic]');
    expect(result).toContain('base_url = "https://api.anthropic.com"');
    const parsed = parse(result) as ParsedGlobalConfig;
    expect(parsed.profiles?.[WCORE_DESKTOP_MCP_PROFILE]?.mcp_servers).toEqual(['tavily']);
  });

  it('replaces a stale reserved table (prior crash or a second sequential launch) with exactly one fresh occurrence', () => {
    const staleFragment = appendDesktopMcpProfile(null, ['old-server']);
    const existing = ['[providers.anthropic]', 'base_url = "https://api.anthropic.com"', '', staleFragment].join('\n');
    const fresh = appendDesktopMcpProfile(null, ['tavily', 'firecrawl']);

    const result = spliceDesktopMcpProfile(existing, fresh);

    const occurrences = result.split(`[profiles.${WCORE_DESKTOP_MCP_PROFILE}]`).length - 1;
    expect(occurrences).toBe(1);
    expect(result).toContain('[providers.anthropic]');
    const parsed = parse(result) as ParsedGlobalConfig;
    expect(parsed.profiles?.[WCORE_DESKTOP_MCP_PROFILE]?.mcp_servers).toEqual(['firecrawl', 'tavily']);
  });

  it('is idempotent in shape across repeated splices (no duplicate table, no growing blank lines)', () => {
    const staleFragment = appendDesktopMcpProfile(null, ['old-server']);
    const existing = ['[providers.anthropic]', 'base_url = "https://api.anthropic.com"', '', staleFragment].join('\n');
    const fresh = appendDesktopMcpProfile(null, ['tavily', 'firecrawl']);
    const once = spliceDesktopMcpProfile(existing, fresh);

    const again = appendDesktopMcpProfile(null, ['another-server']);
    const twice = spliceDesktopMcpProfile(once, again);

    const occurrences = twice.split(`[profiles.${WCORE_DESKTOP_MCP_PROFILE}]`).length - 1;
    expect(occurrences).toBe(1);
    expect(twice.split('\n\n\n').length).toBe(1);
    const parsed = parse(twice) as ParsedGlobalConfig;
    expect(parsed.profiles?.[WCORE_DESKTOP_MCP_PROFILE]?.mcp_servers).toEqual(['another-server']);
  });

  it('fails closed (throws DesktopProfileSpliceError) on unparseable existing content, never returning a string', () => {
    const garbage = 'this is = not [valid\nunterminated = "string\n';
    const fragment = appendDesktopMcpProfile(null, ['tavily']);

    let thrown: unknown;
    let returned: unknown;
    try {
      returned = spliceDesktopMcpProfile(garbage, fragment);
    } catch (error) {
      thrown = error;
    }

    expect(returned).toBeUndefined();
    expect(thrown).toBeInstanceOf(DesktopProfileSpliceError);
    // Names the reserved table so a human fixing the file by hand knows what
    // to look for.
    expect((thrown as Error).message).toContain(`profiles.${WCORE_DESKTOP_MCP_PROFILE}`);
    // Contrast with sanitizeProjectConfig's discard-on-fail-closed posture
    // for the small Desktop-managed WORKSPACE file (index.ts): that file
    // discards unparseable user content and writes only the app's known-good
    // config. The global config.toml also holds the user's real
    // providers/credentials/memory settings, so unparseable content there
    // must never be silently discarded - it must throw and touch nothing.
  });
  // ─────────────────────────────────────────────────────────────────────────
  // K-01 4-leg cross-audit regressions (Gemini 3.1 Pro leg, all three
  // reproduced by execution before being fixed). These lock real defects that
  // shipped in the first GREEN commit - do not relax them.
  // ─────────────────────────────────────────────────────────────────────────

  it('never deletes user content that merely LOOKS like the reserved header inside a multi-line string', () => {
    const fragment = appendDesktopMcpProfile(null, ['tvcontrol']);
    // A multi-line string whose body quotes the reserved header AND a later
    // header-looking line. The naive line scanner removed everything between
    // them; because the survivor still parsed, the fail-closed guard never
    // fired and the loss was SILENT.
    const existing = [
      'template = """',
      `[profiles.${WCORE_DESKTOP_MCP_PROFILE}]`,
      'DO NOT LOSE THIS LINE',
      '[some_table]',
      '"""',
      'other = 1',
      '',
    ].join('\n');

    const spliced = spliceDesktopMcpProfile(existing, fragment);

    expect(spliced).toContain('DO NOT LOSE THIS LINE');
    const parsed = parse(spliced) as { template?: string; other?: number };
    expect(parsed.template).toContain('DO NOT LOSE THIS LINE');
    expect(parsed.other).toBe(1);
  });

  it('still removes a REAL prior reserved table even when a multi-line string also quotes one', () => {
    const fragment = appendDesktopMcpProfile(null, ['tvcontrol']);
    const existing = [
      'note = """',
      `[profiles.${WCORE_DESKTOP_MCP_PROFILE}]`,
      '"""',
      '',
      `[profiles.${WCORE_DESKTOP_MCP_PROFILE}]`,
      'mcp_servers = ["stale"]',
      '',
      '[providers.anthropic]',
      'model = "x"',
      '',
    ].join('\n');

    const spliced = spliceDesktopMcpProfile(existing, fragment);

    // The stale real table is gone, the quoted one survives, the fresh one wins.
    expect(spliced).not.toContain('"stale"');
    expect(spliced).toContain('note = """');
    const parsed = parse(spliced) as ParsedGlobalConfig & { note?: string };
    expect(parsed.profiles?.[WCORE_DESKTOP_MCP_PROFILE]?.mcp_servers).toEqual(['tvcontrol']);
    expect(parsed.note).toContain(`[profiles.${WCORE_DESKTOP_MCP_PROFILE}]`);
  });

  it('never carries a secret from a smol-toml parse error into the thrown message', () => {
    const fragment = appendDesktopMcpProfile(null, ['tvcontrol']);
    // smol-toml echoes the offending SOURCE LINE verbatim after a blank line.
    // On the user's real global config that line can hold a live credential.
    const secret = 'sk-ant-AUDIT-CANARY-VALUE';
    const malformed = `api_key = "${secret}" oops\n`;

    let thrown: unknown;
    try {
      spliceDesktopMcpProfile(malformed, fragment);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(DesktopProfileSpliceError);
    expect((thrown as Error).message).not.toContain(secret);
    expect((thrown as Error).message).not.toContain('sk-ant-');
    // The human-readable reason is still preserved.
    expect((thrown as Error).message).toContain('not valid TOML');
  });

  it('gives an actionable error when the user declares profiles as an inline table', () => {
    const fragment = appendDesktopMcpProfile(null, ['tvcontrol']);
    // TOML forbids extending an inline table with a bracketed sub-table, so
    // this config can never accept the reserved section. Failing closed is
    // correct; failing incomprehensibly is not - every launch would break with
    // no hint that the fix is one line in the user's own file.
    const existing = 'profiles = { work = { mcp_servers = ["a"] } }\n';

    let thrown: unknown;
    try {
      spliceDesktopMcpProfile(existing, fragment);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(DesktopProfileSpliceError);
    expect((thrown as Error).message).toContain('inline value');
    expect((thrown as Error).message).toContain('[profiles.<name>]');
  });
  it('recognises the QUOTED spelling of the reserved table as the same table', () => {
    const fragment = appendDesktopMcpProfile(null, ['tvcontrol']);
    // `[profiles."__wayland_desktop_session"]` is valid TOML denoting exactly
    // the table Desktop owns. Raw-string matching missed it, so the stale table
    // survived, a second one was appended, and the output parse failed - every
    // managed launch bricked until the user hand-rewrote valid syntax.
    const existing = [`[profiles."${WCORE_DESKTOP_MCP_PROFILE}"]`, 'mcp_servers = ["stale"]', ''].join('\n');

    const spliced = spliceDesktopMcpProfile(existing, fragment);

    expect(spliced).not.toContain('"stale"');
    const parsed = parse(spliced) as ParsedGlobalConfig;
    expect(parsed.profiles?.[WCORE_DESKTOP_MCP_PROFILE]?.mcp_servers).toEqual(['tvcontrol']);
  });

  it('leaves an ordinary [profiles] table holding OTHER profiles untouched', () => {
    const fragment = appendDesktopMcpProfile(null, ['tvcontrol']);
    const existing = ['[profiles.work]', 'mcp_servers = ["keep-me"]', ''].join('\n');

    const spliced = spliceDesktopMcpProfile(existing, fragment);

    expect(spliced).toContain('"keep-me"');
    const parsed = parse(spliced) as ParsedGlobalConfig;
    expect(parsed.profiles?.work?.mcp_servers).toEqual(['keep-me']);
    expect(parsed.profiles?.[WCORE_DESKTOP_MCP_PROFILE]?.mcp_servers).toEqual(['tvcontrol']);
  });
});
