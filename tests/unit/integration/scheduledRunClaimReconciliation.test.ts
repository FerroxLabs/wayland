/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * WAVE-2 CROSS-LANE COUPLING. Lane B and lane C share no file, so this defect
 * could never appear as a merge marker.
 *
 * Lane C (`fix/assistant-truthfulness`) hangs a save-claim reconciler on
 * `conversation.turnCompleted`, which `ConversationTurnCompletionService`
 * fires for EVERY turn in the product - a scheduled routine run included; the
 * event even carries `runtime.hasTask`, which the handler never reads.
 * `sweepChatRun` deliberately resolves the CHAT namespace
 * (`artifacts/chat/<id>`), which a scheduled run never writes to: its output
 * goes to a staging tree that `commitTaskRun` publishes by rename.
 *
 * Lane B (`feat/morning-report-data-route`) then instructs the model, in
 * Step 4 item 4 of the shipped morning-report body, to *"Name the file -
 * `morning-brief.html` - and say it is attached below as a card."*
 *
 * So on a correct, delivering scheduled run the model names the file, lane C
 * finds an empty chat namespace, and the user is told their assistant claimed
 * a file it never wrote. That is a FALSE CORRECTION about a run that worked,
 * which lane C's own handoff calls worse than the bug it fixes.
 *
 * Everything here runs the production `onChatTurnCompleted` against a real
 * temp workspace laid out by the production `resolveOutputDir` and a real
 * ledger file. The assistant text is the sentence lane B's body asks for.
 */

import { promises as fs, readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveOutputDir } from '@process/agent/wcore/envBuilder';
import { clearChatSweepMemo, onChatTurnCompleted, type ChatSweepResult } from '@process/services/artifacts/chatRun';

/** A cron conversation id, same shape as a chat one. */
const CONVERSATION = 'a1b2c3d4e5f6a7b8';
const RUN_ID = 'rmt4sf495-37d6b3e4e9';

/**
 * What lane B's Step 4 item 4 asks the model to produce. It forbids printing
 * the directory and requires naming the FILE, so the filename is in the final
 * message on every delivering run by instruction, not by accident.
 */
const LANE_B_REPORT_TEXT = [
  'TC-TIDE morning brief, bar 2026-08-21, generated 2026-08-22 22:43 UTC.',
  '74 names scanned, 56 currently long, 20 slots.',
  'The brief has been written to morning-brief.html and is attached below as a card.',
].join('\n');

let root = '';
let workspace = '';
let ledgerPath = '';

async function place(relative: string, body: string): Promise<void> {
  const target = path.join(workspace, ...relative.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
}

/**
 * One terminal turn through the production handler. `hasTask` is the real
 * event's `runtime.hasTask`, which `ConversationTurnCompletionService` sets
 * from `Boolean(extra.cronJobId)` - true for a scheduled routine run.
 */
async function turnEnds(text: string, hasTask: boolean): Promise<ChatSweepResult | null> {
  return onChatTurnCompleted(
    { sessionId: CONVERSATION, workspace, state: 'ai_waiting_input', hasTask },
    { ledgerPath, lastAgentText: async () => text }
  );
}

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'w2i-cron-claim-'));
  workspace = path.join(root, 'Weekday morning report');
  ledgerPath = path.join(root, 'artifact-ledger.jsonl');
  await fs.mkdir(workspace, { recursive: true });
  clearChatSweepMemo?.();
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('a scheduled run that delivered correctly is not accused of fabricating its brief', () => {
  it('KNOWN POSITIVE: the chat namespace really is where the sweep looks', () => {
    // If this ever stops being the chat namespace the rest of the file is
    // measuring nothing, so it is asserted rather than assumed.
    expect(resolveOutputDir(workspace, undefined, CONVERSATION)).toBe(
      path.join(workspace, 'artifacts', 'chat', CONVERSATION)
    );
  });

  it('KNOWN POSITIVE: the extractor really does see a claim in lane B report text', async () => {
    // The coupling only exists if lane B's instructed sentence trips lane C's
    // extractor. Proving that first stops a green result below reading as
    // safety when it was really the claim never being found.
    const { extractSavedFileClaims } = await import('@process/services/artifacts/savedFileClaims');
    expect(extractSavedFileClaims(LANE_B_REPORT_TEXT).map((c) => c.fileName)).toEqual(['morning-brief.html']);
  });

  it('BEFORE publication: the brief is staged, and the run is not called a liar', async () => {
    // commitTaskRun has not run yet - the turn ends first, which is exactly why
    // lane B's body says the permanent path does not exist at this instant.
    await place(`artifacts/market/.staging/${RUN_ID}/morning-brief.html`, '<html>brief</html>');

    const result = await turnEnds(LANE_B_REPORT_TEXT, true);

    expect(result?.unsupported ?? []).toEqual([]);
  });

  it('AFTER publication: the brief is in the series tree, and the run is not called a liar', async () => {
    await place(`artifacts/market/2026-08-23/${RUN_ID}/morning-brief.html`, '<html>brief</html>');

    const result = await turnEnds(LANE_B_REPORT_TEXT, true);

    expect(result?.unsupported ?? []).toEqual([]);
  });

  it('the production WIRING actually hands the flag over', () => {
    // A corpus assertion, and labelled as one: `initBridge` needs an Electron
    // app to run, so the gate above can be correct while nothing feeds it.
    // The known-positive control below proves this read can see the call at all.
    const wiring = readFileSync(path.resolve(__dirname, '../../../src/process/utils/initBridge.ts'), 'utf-8');
    expect(wiring).toMatch(/onChatTurnCompleted\(\s*\{[^}]*hasTask:\s*event\.runtime\?\.hasTask/);
    // KNOWN POSITIVE: the same read finds the call it is qualifying.
    expect(wiring).toContain('onChatTurnCompleted(');
  });

  it('CONTROL: the same words in an ORDINARY CHAT are still caught - this is a narrowing, not a deletion', async () => {
    // Lane C's whole point. If this ever goes green the fix above has quietly
    // turned the B5 check off for everyone instead of for scheduled runs.
    const result = await turnEnds(LANE_B_REPORT_TEXT, false);

    expect(result?.unsupported).toEqual([{ fileName: 'morning-brief.html', verdict: 'absent' }]);
  });
});
