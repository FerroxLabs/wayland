/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * THE HOST NOTICES THAT THE ASSISTANT SAID SOMETHING UNTRUE.
 *
 * B5: "File saved to artifacts/chat/42d0fd61/chart-brief.md." on a turn with
 * zero tool calls and no such file anywhere. At the instant that turn ended the
 * host held BOTH facts - the directory walk that says the namespace is empty,
 * and the assistant text that says a file is in it - and had never compared
 * them, because one line returned early:
 *
 *     if (result.registered.length === 0 && result.rejected.length === 0) return result;
 *
 * That line is correct for the ordinary turn and must stay correct for it. This
 * file is the assertion that it now yields to a claim, and ONLY to a claim.
 *
 * NOTHING HERE IS A MOCK OF THE SEAM. The production `onChatTurnCompleted` runs
 * against a real temp workspace whose deliverables directory is named by the
 * production `resolveOutputDir`, writes into a real ledger file, and is handed
 * the VERBATIM assistant text of the B5 turn, lifted out of the product's own
 * message database (see `scripts/fixtures/capture-assistant-save-claims.mjs`).
 */

import { promises as fs, readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveOutputDir } from '@process/agent/wcore/envBuilder';
import { buildChatArtifactCardContent } from '@process/services/artifacts/chatArtifactCard';
import { clearChatSweepMemo, onChatTurnCompleted, type ChatSweepResult } from '@process/services/artifacts/chatRun';

const FIXTURE = path.resolve(__dirname, '../../fixtures/artifacts/assistantSaveClaims.json');
const corpus = JSON.parse(readFileSync(FIXTURE, 'utf-8')) as {
  messages: Record<string, { text: string; conversationId: string }>;
};

/** The exact text the model produced on the B5 turn. */
const B5_TEXT = corpus.messages.b5Absent.text;
/** The conversation it happened in, so the namespace path in the claim is real. */
const CONVERSATION = corpus.messages.b5Absent.conversationId;

let root = '';
let workspace = '';
let ledgerPath = '';

const outputDir = (): string => resolveOutputDir(workspace, undefined, CONVERSATION);

/** Act as the agent would: write into the directory the spawn named. */
async function agentWrites(relative: string, body: string): Promise<void> {
  const target = path.join(outputDir(), ...relative.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
}

/** Act as the C-2 defect did: write into the workspace, outside the namespace. */
async function agentWritesElsewhere(relative: string, body: string): Promise<void> {
  const target = path.join(workspace, ...relative.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
}

interface Run {
  swept: ChatSweepResult | null;
  result: ChatSweepResult | null;
}

/** One terminal turn through the production handler. */
async function turnEnds(lastAgentText: string | null): Promise<Run> {
  let swept: ChatSweepResult | null = null;
  const result = await onChatTurnCompleted(
    { sessionId: CONVERSATION, workspace, state: 'ai_waiting_input' },
    {
      ledgerPath,
      lastAgentText: async () => lastAgentText,
      onSwept: (value) => {
        swept = value;
      },
    }
  );
  return { swept, result };
}

beforeEach(async () => {
  clearChatSweepMemo();
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-claims-')));
  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  ledgerPath = path.join(root, 'artifact-ledger.jsonl');
});

afterEach(async () => {
  clearChatSweepMemo();
  await fs.rm(root, { recursive: true, force: true });
});

describe('turn-end reconciliation of what the assistant claimed', () => {
  it('CONTROL: the fixture really is the B5 turn', () => {
    expect(B5_TEXT).toContain('File saved to artifacts/chat/42d0fd61/chart-brief.md.');
    expect(CONVERSATION).toBe('42d0fd61');
  });

  it('B5: an empty namespace plus a save claim draws a card that says so', async () => {
    const { swept } = await turnEnds(B5_TEXT);

    expect(swept).not.toBeNull();
    expect(swept?.registered).toEqual([]);
    expect(swept?.unsupported).toEqual([{ fileName: 'chart-brief.md', verdict: 'absent' }]);

    const content = buildChatArtifactCardContent(swept as ChatSweepResult);
    expect(content).not.toBeNull();
    expect(content?.artifacts).toEqual([]);
    expect(content?.unsupported).toEqual([{ fileName: 'chart-brief.md', verdict: 'absent' }]);
  });

  it('the file really being there says nothing at all, and the card is just the file', async () => {
    await agentWrites('chart-brief.md', '# Chart brief\n\nBINANCE:BTCUSDT, 240.\n');
    const { swept } = await turnEnds(B5_TEXT);

    expect(swept?.unsupported ?? []).toEqual([]);
    const content = buildChatArtifactCardContent(swept as ChatSweepResult);
    expect(content?.artifacts.map((artifact) => artifact.fileName)).toEqual(['chart-brief.md']);
    expect(content?.unsupported).toBeUndefined();
  });

  it('the C-2 shape: written to the workspace but outside the namespace, and named', async () => {
    await agentWritesElsewhere('artifacts/market/chart-brief.md', '# Chart brief\n');
    const { swept } = await turnEnds(B5_TEXT);

    expect(swept?.unsupported).toEqual([
      { fileName: 'chart-brief.md', verdict: 'elsewhere', actualPath: 'artifacts/market/chart-brief.md' },
    ]);
  });

  it('THE COMMON CASE STAYS FREE: no claim and no files draws nothing', async () => {
    const quiet = corpus.messages.namedWithoutSaving.text;
    const { swept, result } = await turnEnds(quiet);

    expect(swept).toBeNull();
    expect(result?.registered).toEqual([]);
    expect(result?.unsupported ?? []).toEqual([]);
  });

  it('a turn with no assistant text at all is the common case too', async () => {
    const { swept } = await turnEnds(null);
    expect(swept).toBeNull();
  });

  it('a real deliverable with no claim still draws its card', async () => {
    await agentWrites('sea-notes.md', 'The sea holds more water than every river on Earth.\n');
    const { swept } = await turnEnds(corpus.messages.namedWithoutSaving.text);

    expect(swept?.registered.map((record) => record.relativePath)).toEqual([
      `artifacts/chat/${CONVERSATION}/sea-notes.md`,
    ]);
    expect(swept?.unsupported ?? []).toEqual([]);
  });
});
