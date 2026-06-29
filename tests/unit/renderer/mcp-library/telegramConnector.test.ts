/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * GitHub #376: the Telegram connector (`com.chaindead/telegram-mcp`) never
 * connected — "Connection closed". The catalog injects env vars using the SETUP
 * GUIDE's input names (entryToServerData spreads the collected values onto
 * transport.env verbatim), and the guide collected TELEGRAM_API_ID /
 * TELEGRAM_API_HASH / TELEGRAM_PHONE. But the actual `@chaindead/telegram-mcp`
 * Go binary reads TG_APP_ID / TG_API_HASH (verified via its --help), so it got
 * no credentials and exited before the MCP handshake.
 *
 * These tests lock the corrected wiring: the guide collects TG_APP_ID +
 * TG_API_HASH, and those flow through entryToServerData onto the spawned
 * server's transport.env.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import yaml from 'js-yaml';
import { describe, it, expect } from 'vitest';

import { entryToServerData } from '@/renderer/pages/settings/McpLibrary/entryToServerData';
import type { CatalogEntry } from '@/renderer/pages/settings/McpLibrary/types';
import telegramEntry from '@/renderer/mcp-catalog/entries/com.chaindead-telegram-mcp.json';

const GUIDE_PATH = join(process.cwd(), 'src/renderer/mcp-catalog/guides/com.chaindead-telegram-mcp.md');

/** Parse the guide frontmatter the same way the app does (js-yaml FAILSAFE). */
function guideStepInputs(stepId: string): Array<{ name: string }> {
  const text = readFileSync(GUIDE_PATH, 'utf-8');
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('telegram guide missing frontmatter');
  const fm = yaml.load(match[1], { schema: yaml.FAILSAFE_SCHEMA }) as {
    steps: Array<{ id: string; inputs?: Array<{ name: string }> }>;
  };
  const step = fm.steps.find((s) => s.id === stepId);
  return step?.inputs ?? [];
}

describe('Telegram connector wiring (#376)', () => {
  it('the setup guide collects the env var names the telegram-mcp binary reads (TG_APP_ID / TG_API_HASH)', () => {
    const names = guideStepInputs('credentials').map((i) => i.name);

    expect(names).toContain('TG_APP_ID');
    expect(names).toContain('TG_API_HASH');
    // The Go binary has no TELEGRAM_* env and no server-mode phone var; collecting
    // the old names injected credentials the binary ignored (the #376 root cause).
    expect(names.some((n) => n.startsWith('TELEGRAM_'))).toBe(false);
  });

  it('entryToServerData spawns @chaindead/telegram-mcp with the pasted creds on TG_* env', () => {
    const server = entryToServerData(telegramEntry as unknown as CatalogEntry, {
      TG_APP_ID: '12345',
      TG_API_HASH: 'deadbeefdeadbeefdeadbeefdeadbeef',
    });

    expect(server.transport.type).toBe('stdio');
    expect(server.transport.command).toBe('npx');
    expect(server.transport.args?.some((a) => a.includes('@chaindead/telegram-mcp'))).toBe(true);
    expect(server.transport.env).toEqual({
      TG_APP_ID: '12345',
      TG_API_HASH: 'deadbeefdeadbeefdeadbeefdeadbeef',
    });
  });
});
