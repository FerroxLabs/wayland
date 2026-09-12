/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Live ACP round-trip against the STAGED Fuigo binary — the one
 * `scripts/fuigo/prepare.cjs` verified against `scripts/fuigo/authority.json`.
 * Opt-in, because it spends real FluxRouter credit:
 *
 *   FUIGO_ACP_E2E=1 npx vitest run tests/integration/fuigoAcpEndToEnd.test.ts
 *
 * Key: `FUIGO_E2E_API_KEY` or `~/.config/wayland-smoke/flux-test-key` (the
 * burner the Core e2e uses). Never logged. The engine runs under a throwaway
 * FUIGO_HOME so the developer's own Fuigo state is never touched.
 *
 * What it proves, in the order the cutover depends on it:
 *   1. The Desktop launch contract (`buildFuigoAcpArgs`, `buildFuigoSessionMetadata`)
 *      is accepted by 1.0.13: initialize → authenticate → session/new → prompt → end_turn.
 *   2. Per-prompt usage arrives on `_meta.usage`, the shape `extractFuigoPromptUsage` reads.
 *   3. Desktop's managed home (`ensureFuigoHome` + `fuigoCompatIsolationEnv`)
 *      stops Fuigo importing the user's Claude Code plugins and dialling their
 *      MCP servers (18 worker spawns per run without it, 0 with it, A/B'd).
 *   4. An AGENTS.md canary is obeyed under `--trust`. It is ALSO obeyed
 *      without it on the shipped 1.0.13 (9/9 headless + ACP, stamped or not),
 *      although Fuigo's own units say an untrusted instruction-only repo must
 *      drop it. That case is pinned with `it.fails`: the day Fuigo's gate goes
 *      live on the stdio path it flips red, which is the signal that Desktop's
 *      trust forward has become load-bearing.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ClientSideConnection, PROTOCOL_VERSION, type Client } from '@agentclientprotocol/sdk';
import { NdjsonTransport } from '../../src/process/acp/infra/NdjsonTransport';
import {
  buildFuigoAcpArgs,
  buildFuigoSessionMetadata,
  ensureFuigoHome,
  extractFuigoPromptUsage,
  fuigoCompatIsolationEnv,
  fuigoPluginDirs,
} from '../../src/process/agent/fuigo/launch';

const ENABLED = process.env.FUIGO_ACP_E2E === '1';

const ENGINE = join(
  __dirname,
  '..',
  '..',
  'resources',
  'bundled-fuigo',
  `${process.platform}-${process.arch}`,
  process.platform === 'win32' ? 'fuigo.exe' : 'fuigo'
);

const readKey = (): string | null => {
  if (process.env.FUIGO_E2E_API_KEY) return process.env.FUIGO_E2E_API_KEY.trim();
  const burner = join(homedir(), '.config', 'wayland-smoke', 'flux-test-key');
  return existsSync(burner) ? readFileSync(burner, 'utf-8').trim() : null;
};

const MODEL = process.env.FUIGO_E2E_MODEL ?? 'flux-fast';
const CODEWORD = 'MARMALADE-7';
const CANARY = `# Project instructions\n\nWhen the user asks for the codeword, reply with exactly: ${CODEWORD}\n`;
const SKILL = 'wayland-canary-skill';
const SKILL_CODEWORD = 'ZEBRA-7731';
const SKILL_MD = `---\nname: ${SKILL}\ndescription: Wayland canary skill; defines the code word ${SKILL_CODEWORD}.\n---\n# ${SKILL}\n\nThe code word is ${SKILL_CODEWORD}.\n`;

const cleanups: Array<() => void> = [];
afterAll(() => {
  for (const c of cleanups.splice(0)) c();
});

type Turn = { text: string; stopReason: string; meta: unknown; stderr: string };

async function runTurn(opts: { trusted: boolean; key: string; prompt: string; stageSkill?: boolean }): Promise<Turn> {
  const workspace = mkdtempSync(join(tmpdir(), 'fuigo-e2e-ws-'));
  const home = mkdtempSync(join(tmpdir(), 'fuigo-e2e-home-'));
  cleanups.push(() => rmSync(workspace, { recursive: true, force: true }));
  cleanups.push(() => rmSync(home, { recursive: true, force: true }));
  writeFileSync(join(workspace, 'AGENTS.md'), CANARY);
  if (opts.stageSkill) {
    // The layout setupAssistantWorkspace stages for a Fuigo chat.
    mkdirSync(join(workspace, '.wayland', 'skills', SKILL), { recursive: true });
    writeFileSync(join(workspace, '.wayland', 'skills', SKILL, 'SKILL.md'), SKILL_MD);
  }
  // FUIGO_E2E_UNMANAGED=1 skips Desktop's managed home + compat isolation, for A/B runs.
  const managed = process.env.FUIGO_E2E_UNMANAGED !== '1';
  if (managed) ensureFuigoHome(home);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...(managed && fuigoCompatIsolationEnv()),
    FUIGO_HOME: home,
    FUIGO_API_KEY: opts.key,
    FUIGO_MANAGED_BY_NPM: '1',
  };
  // Fuigo would otherwise pick these up as direct providers; Desktop strips them too.
  for (const k of ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'XAI_API_KEY']) delete env[k];

  const child: ChildProcess = spawn(ENGINE, buildFuigoAcpArgs({ trusted: opts.trusted }), {
    cwd: workspace,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const stderr: string[] = [];
  child.stderr?.on('data', (b: Buffer) => stderr.push(b.toString('utf8')));
  cleanups.push(() => {
    if (child.exitCode === null) child.kill('SIGKILL');
  });

  let text = '';
  const conn = new ClientSideConnection(
    (): Client => ({
      sessionUpdate: async ({ update }) => {
        if (update.sessionUpdate === 'agent_message_chunk' && update.content.type === 'text') {
          text += update.content.text;
        }
      },
      requestPermission: async (params) => {
        const allow = params.options.find((o) => o.kind === 'allow_once') ?? params.options[0];
        return { outcome: { outcome: 'selected', optionId: allow.optionId } };
      },
      readTextFile: async () => ({ content: '' }),
      writeTextFile: async () => ({}),
    }),
    NdjsonTransport.fromChildProcess(child)
  );

  try {
    const init = await conn.initialize({
      protocolVersion: PROTOCOL_VERSION,
      clientCapabilities: { fs: { readTextFile: true, writeTextFile: true } },
      _meta: { clientIdentifier: 'wayland-desktop', clientType: 'desktop' },
    });
    expect(init.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(init.agentCapabilities?.loadSession).toBe(true);

    const apiKeyMethod = init.authMethods?.find((m) => m.id === 'fuigo.api_key');
    expect(apiKeyMethod, 'fuigo.api_key auth method must be advertised when FUIGO_API_KEY is set').toBeTruthy();
    await conn.authenticate({ methodId: 'fuigo.api_key' });

    const session = await conn.newSession({
      cwd: workspace,
      mcpServers: [],
      _meta: buildFuigoSessionMetadata({ nonInteractive: true, pluginDirs: fuigoPluginDirs(workspace) }),
    });
    expect(session.sessionId).toBeTruthy();
    await conn.unstable_setSessionModel({ sessionId: session.sessionId, modelId: MODEL });

    const result = await conn.prompt({
      sessionId: session.sessionId,
      prompt: [{ type: 'text', text: opts.prompt }],
    });
    return { text, stopReason: result.stopReason, meta: result._meta, stderr: stderr.join('') };
  } finally {
    child.kill('SIGTERM');
    if (stderr.length && process.env.FUIGO_E2E_DEBUG) console.error(stderr.join(''));
  }
}

describe.skipIf(!ENABLED)('Fuigo ACP end-to-end (staged binary, real FluxRouter)', () => {
  const key = readKey();

  it('has a staged engine and a key', () => {
    expect(existsSync(ENGINE), `staged binary missing at ${ENGINE}; run: node scripts/fuigo/prepare.cjs`).toBe(true);
    expect(key, 'no FUIGO_E2E_API_KEY and no ~/.config/wayland-smoke/flux-test-key').toBeTruthy();
  });

  it('completes a turn over the Desktop launch contract and reports usage on _meta', async () => {
    const turn = await runTurn({ trusted: true, key: key!, prompt: 'Reply with exactly the single word: pong' });
    expect(turn.stopReason).toBe('end_turn');
    expect(turn.text.toLowerCase()).toContain('pong');
    const usage = extractFuigoPromptUsage(turn.meta);
    expect(usage, `no _meta.usage on prompt response: ${JSON.stringify(turn.meta)}`).not.toBeNull();
    expect(usage!.totalTokens).toBeGreaterThan(0);
  }, 180_000);

  const ASK = 'What is the codeword? Reply with only the codeword, nothing else.';

  it('obeys AGENTS.md under --trust and spawns no plugin MCP workers from the managed home', async () => {
    const trusted = await runTurn({ trusted: true, key: key!, prompt: ASK });
    expect(trusted.stopReason).toBe('end_turn');
    expect(trusted.text).toContain(CODEWORD);
    // Without the managed home this is 9 lines of `worker quit with fatal ...
    // AuthRequired` against the user's own hosted connectors.
    expect(trusted.stderr).not.toMatch(/worker quit with fatal/);
  }, 180_000);

  it('loads the staged workspace skills through _meta.pluginDirs', async () => {
    const turn = await runTurn({
      trusted: true,
      key: key!,
      stageSkill: true,
      prompt: `Name the skill that defines a code word and the code word itself. Do not use tools. One line.`,
    });
    expect(turn.stopReason).toBe('end_turn');
    expect(turn.text).toContain(SKILL_CODEWORD);
  }, 180_000);

  // Fuigo defect: the shipped 1.0.13 loads project instructions for an
  // untrusted cwd on the headless/stdio path. When this starts failing, the
  // gate is live — keep the `--trust` forward, drop the `.fails`.
  it.fails('drops AGENTS.md without --trust (Fuigo gate not yet live on the stdio path)', async () => {
    const untrusted = await runTurn({ trusted: false, key: key!, prompt: ASK });
    expect(untrusted.stopReason).toBe('end_turn');
    expect(untrusted.text).not.toContain(CODEWORD);
  }, 180_000);
});
