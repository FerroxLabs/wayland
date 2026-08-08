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
});
