/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The agent MUST NOT be able to send a file off this machine.
 *
 * "Send to..." is an exfiltration primitive with a human confirmation in front
 * of it. That confirmation is only worth something if the agent cannot reach
 * the capability by another door - and this product HAS such a door already:
 * an agent writes a `[WAYLAND_CHANNEL_SEND]` block into its own reply,
 * `resolveChannelSendProtocol` parses it, and a file goes out over a channel.
 * There is even a bundled SKILL that teaches it (`weixin-file-send`). So the
 * question "can the agent reach this?" is not theoretical here; it has a
 * worked example on the other side.
 *
 * WHY THIS IS A TEST AND NOT A ONE-TIME GREP: a grep proves today. The way this
 * boundary actually breaks is somebody adding a helpful skill or a tool that
 * exposes the send "so the agent can email the report itself", which is exactly
 * the request that will eventually be made.
 *
 * Every case carries a KNOWN-POSITIVE CONTROL, because an absence proved by a
 * search that could not have found anything is not a result.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import '@/common/adapter/ipcBridge';
import { _getRegisteredKeysForTests, isAllowedInboundName } from '@/common/adapter/bridgeAllowlist';

const SKILLS_ROOT = path.resolve(__dirname, '../../../src/process/resources/skills');

/** The wire keys and the client-side names that reach them. */
const SEND_SURFACE = ['artifacts.send-to', 'artifacts.send-targets', 'sendArtifactTo', 'artifacts.sendTo'];

/**
 * A marker the AGENT genuinely uses to push a file out over a channel. Its
 * presence in the corpus is what proves a search over that corpus can find an
 * agent-facing capability at all.
 */
const AGENT_REACHABLE_MARKER = 'WAYLAND_CHANNEL_SEND';

async function readAllSkillDocs(): Promise<Array<{ file: string; body: string }>> {
  const docs: Array<{ file: string; body: string }> = [];
  const walk = async (dir: string): Promise<void> => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.md')) docs.push({ file: full, body: await fs.readFile(full, 'utf8') });
    }
  };
  await walk(SKILLS_ROOT);
  return docs;
}

describe('the send capability is unreachable from any agent surface', () => {
  it('no bundled SKILL mentions it - and the corpus proves the search works', async () => {
    const docs = await readAllSkillDocs();

    // Control 1: the corpus is real. A zero here would make the absence below
    // meaningless - it would "pass" for a directory that failed to load.
    expect(docs.length).toBeGreaterThan(30);

    // Control 2: the search CAN find an agent-facing outbound-file capability
    // in this exact corpus, by this exact method. `weixin-file-send/SKILL.md`
    // teaches the agent to emit a channel-send block.
    const agentReachable = docs.filter((doc) => doc.body.includes(AGENT_REACHABLE_MARKER));
    expect(agentReachable.length).toBeGreaterThan(0);

    // ...and with that established, the artifact send appears in none of them.
    const leaked = docs.filter((doc) => SEND_SURFACE.some((needle) => doc.body.includes(needle)));
    expect(leaked.map((doc) => path.relative(SKILLS_ROOT, doc.file))).toEqual([]);
  });

  it('is not a renderer-provided key, so main can never invoke it outward', () => {
    // `RENDERER_PROVIDED_KEYS` is the set main INVOKES and the renderer answers.
    // A send provider on that list would be a capability main could be talked
    // into calling. It is a main-side provider only, in one direction.
    const { providers } = _getRegisteredKeysForTests();

    // Control: these really are registered providers. A typo would make the
    // assertion below vacuous.
    expect(providers.has('artifacts.send-to')).toBe(true);
    expect(providers.has('artifacts.send-targets')).toBe(true);

    // The renderer-provided set is tiny and explicit; neither send key is in it.
    // Asserted through the public predicate rather than the private constant:
    // a renderer-provided key is one whose `subscribe.callback-` form is
    // accepted inbound.
    for (const key of ['artifacts.send-to', 'artifacts.send-targets']) {
      expect(isAllowedInboundName(`subscribe.callback-${key}${key}0123abcd`)).toBe(false);
    }
    // Control: the one key that IS renderer-provided is accepted, so the
    // negative above is a real discrimination and not a broken name format.
    const provided = 'conversation.response.search.workspace';
    expect(isAllowedInboundName(`subscribe.callback-${provided}${provided}0123abcd`)).toBe(true);
  });
});
