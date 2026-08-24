/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The spinner must stay off once the engine says the turn ended.
 *
 * Three frames ride out of the turn-end path AFTER `finish`: the activity
 * settle, the stripped-text correction, and the propose card. All three name
 * the turn, so any one of them counted as "the turn is talking" re-arms
 * `streamRunning` — and nothing further is coming, so it never clears again.
 *
 * `activity_turn_end` and `content_replace` were each excluded when they were
 * added. `cron_propose` was not, and it is emitted from the same function, one
 * statement above the `content_replace` that was. Reproduced live on Core
 * 0.13.0: a cron turn read "Working… 254s" minutes after the engine had logged
 * `stream_end`, and navigating away and back cleared it — the durable state was
 * already right, only the mounted view was wrong.
 *
 * `artifact_card` is the FOURTH frame to ride that path and the fourth time
 * this line has shipped broken. It is emitted from `initBridge` after the chat
 * artifact sweep persists the card, which is strictly after `finish`. Measured
 * live at 30-38ms after the finish frame across three runs, so the commit
 * effect that syncs `streamRunningRef` has always already landed and the
 * re-arm fires every single time, not intermittently. Observed symptom: a chat
 * that wrote `sea-notes.md` sat on "Working…" with a live Stop button for 472
 * seconds while the engine had long since logged `stream_end` with
 * finish_reason `stop`.
 *
 * ----------------------------------------------------------------------------
 * THE RECIPE BLOCK AT THE BOTTOM DOES NOT HAND-WRITE ITS FRAME.
 * ----------------------------------------------------------------------------
 * A hand-built `{ type: 'artifact_card' }` object proves only that the denylist
 * contains a string. The frame the app actually wedges on is built by the
 * production sweep from real bytes on disk, and that is what the recipe block
 * feeds the hook: a real file written into the directory the production spawn
 * resolver names, registered by the production turn-end handler, folded into
 * card content and a card message by the production builders. If the sweep
 * stops producing a card, or the card message stops carrying a `msg_id`, the
 * recipe block stops testing anything and says so out loud instead of passing.
 */
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { resolveOutputDir } from '@process/agent/wcore/envBuilder';
import {
  buildChatArtifactCardContent,
  buildChatArtifactCardMessage,
} from '@process/services/artifacts/chatArtifactCard';
import { clearChatSweepMemo, onChatTurnCompleted } from '@process/services/artifacts/chatRun';
import { MessageListProvider, useMessageList } from '@/renderer/pages/conversation/Messages/hooks';
import { useWCoreMessage } from '@/renderer/pages/conversation/platforms/wcore/useWCoreMessage';

let streamHandler: ((message: IResponseMessage) => void) | null = null;

vi.mock('@/renderer/services/i18n', () => ({ default: { t: (key: string) => key } }));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      get: { invoke: vi.fn().mockResolvedValue(null) },
      update: { invoke: vi.fn().mockResolvedValue(undefined) },
      responseStream: {
        on: (handler: (message: IResponseMessage) => void) => {
          streamHandler = handler;
          return () => {
            streamHandler = null;
          };
        },
      },
    },
    database: {
      getConversationMessages: { invoke: vi.fn().mockResolvedValue([]) },
    },
  },
}));

const CONV = 'conv-after-turn';
const TURN = 'turn-1';

const Harness = () => {
  const { running } = useWCoreMessage(CONV);
  useMessageList();
  return <span data-testid='running'>{String(running)}</span>;
};

const renderHarness = () =>
  render(
    <MessageListProvider value={[]}>
      <Harness />
    </MessageListProvider>
  );

const emit = (message: IResponseMessage) =>
  act(() => {
    streamHandler?.(message);
  });

const frame = (type: string, data: unknown = '', msgId: string = TURN): IResponseMessage =>
  ({ type, conversation_id: CONV, msg_id: msgId, data }) as unknown as IResponseMessage;

/** Drive a whole turn up to and including the engine's terminal frame. */
const runTurnToFinish = async () => {
  renderHarness();
  await waitFor(() => expect(streamHandler).not.toBeNull());
  emit(frame('start'));
  emit(frame('content', 'scheduling that for you'));
  emit(frame('finish'));
  await waitFor(() => expect(screen.getByTestId('running').textContent).toBe('false'));
};

describe('wcore turn end — frames that arrive after `finish`', () => {
  beforeEach(() => {
    streamHandler = null;
  });

  it('stays settled when the cron propose card arrives after the turn ended', async () => {
    await runTurnToFinish();

    emit(frame('cron_propose', { name: 'Market Summary', schedule: 'weekdays 09:00' }));

    // The regression: this flipped the spinner back on, permanently.
    expect(screen.getByTestId('running').textContent).toBe('false');
  });

  it('stays settled when the concierge propose card arrives after the turn ended', async () => {
    await runTurnToFinish();

    emit(frame('concierge_propose', { summary: 'update your defaults' }));

    expect(screen.getByTestId('running').textContent).toBe('false');
  });

  it('stays settled when the chat artifact card arrives after the turn ended', async () => {
    await runTurnToFinish();

    // The card carries its OWN stable msg_id, derived from the conversation and
    // deliberately not the turn's - so `Boolean(message.msg_id)` is true and it
    // reached the re-arm exactly like a content frame. See the recipe block
    // below for the same frame built by the production sweep.
    emit(frame('artifact_card', { artifacts: [{ fileName: 'sea-notes.md' }] }, `artifact-card:${CONV}`));

    expect(screen.getByTestId('running').textContent).toBe('false');
  });

  it('stays settled for the two after-turn frames that were already excluded', async () => {
    // The contrast that keeps the case above honest: if a change ever collapses
    // this list back to a single hardcoded comparison, one of these fails rather
    // than all three quietly agreeing on the wrong answer.
    await runTurnToFinish();

    emit(frame('activity_turn_end', { outcome: 'done' }));
    emit(frame('content_replace', 'scheduling that for you'));

    expect(screen.getByTestId('running').textContent).toBe('false');
  });

  it('still re-arms on real output that arrives after a premature finish', async () => {
    // The guard this fix must not break: genuine content after `finish` means
    // the turn is talking again, and the spinner has to come back.
    await runTurnToFinish();

    emit(frame('content', 'actually, one more thing'));

    expect(screen.getByTestId('running').textContent).toBe('true');
  });
});

/**
 * THE RECIPE, END TO END, WITH NOTHING HAND-WRITTEN ON THE PRODUCING SIDE.
 *
 * Turn 1 is a plain no-tool turn. Turn 2 writes a file into the chat namespace
 * and the sweep turns it into a card. Both halves are asserted: turn 1 must
 * produce NO card (which is why it settles, and why the bug hid behind "the
 * first turn is fine"), and turn 2's card frame must not restart the spinner.
 */
const RECIPE_CONV = 'convwedge0001';
const RECIPE_TURN_1 = 'recipe-turn-1';
const RECIPE_TURN_2 = 'recipe-turn-2';

let recipeRoot = '';
let recipeWorkspace = '';
let recipeLedger = '';

/** Act as the agent does: write into the directory the PRODUCTION resolver named. */
const agentWrites = async (relative: string, body: string): Promise<void> => {
  const target = path.join(resolveOutputDir(recipeWorkspace, undefined, RECIPE_CONV), ...relative.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
};

/**
 * Run the production turn-end path and return the frame `initBridge` emits for
 * it, or null when the sweep found nothing worth a card.
 *
 * Every field is taken from production output. `type` and `msg_id` come off the
 * card MESSAGE the production builder returns, so renaming the card type in
 * `chatArtifactCard.ts` without updating the renderer's after-turn list turns
 * this suite red instead of shipping the wedge a fifth time.
 */
const sweepToCardFrame = async (): Promise<IResponseMessage | null> => {
  let emitted: IResponseMessage | null = null;
  await onChatTurnCompleted(
    { sessionId: RECIPE_CONV, state: 'ai_waiting_input', workspace: recipeWorkspace },
    {
      ledgerPath: recipeLedger,
      onSwept: (result) => {
        const content = buildChatArtifactCardContent(result);
        if (!content) return;
        const message = buildChatArtifactCardMessage(RECIPE_CONV, content);
        emitted = {
          type: message.type,
          conversation_id: RECIPE_CONV,
          msg_id: message.msg_id,
          data: content,
        } as unknown as IResponseMessage;
      },
      onError: (error) => {
        throw error;
      },
    }
  );
  return emitted;
};

const RecipeHarness = () => {
  const { running } = useWCoreMessage(RECIPE_CONV);
  useMessageList();
  return <span data-testid='running'>{String(running)}</span>;
};

const recipeFrame = (type: string, data: unknown, msgId: string): IResponseMessage =>
  ({ type, conversation_id: RECIPE_CONV, msg_id: msgId, data }) as unknown as IResponseMessage;

describe('wcore turn end — the deliverable recipe that wedged the composer', () => {
  beforeEach(async () => {
    streamHandler = null;
    clearChatSweepMemo();
    recipeRoot = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-wedge-')));
    recipeWorkspace = path.join(recipeRoot, 'workspace');
    await fs.mkdir(recipeWorkspace, { recursive: true });
    recipeLedger = path.join(recipeRoot, 'artifact-ledger.jsonl');
  });

  afterEach(async () => {
    clearChatSweepMemo();
    await fs.rm(recipeRoot, { recursive: true, force: true });
  });

  const SEA_NOTES = '- salt\n- tide\n- depth\n';

  it('settles turn 2 when the sweep really produced a card from a real file', async () => {
    render(
      <MessageListProvider value={[]}>
        <RecipeHarness />
      </MessageListProvider>
    );
    await waitFor(() => expect(streamHandler).not.toBeNull());

    // TURN 1 — plain, no tool, nothing written. Load-bearing in the live
    // recipe, and the reason is asserted rather than assumed on the next line.
    emit(recipeFrame('start', '', RECIPE_TURN_1));
    emit(recipeFrame('content', 'The sea is wide and old.', RECIPE_TURN_1));
    emit(recipeFrame('finish', { finish_reason: 'stop' }, RECIPE_TURN_1));
    await waitFor(() => expect(screen.getByTestId('running').textContent).toBe('false'));

    // A turn that produced nothing must never reach the card path, so there is
    // no frame to re-arm anything and turn 1 looks healthy.
    expect(await sweepToCardFrame()).toBeNull();
    expect(screen.getByTestId('running').textContent).toBe('false');

    // TURN 2 — the agent writes a deliverable into the chat namespace.
    await agentWrites('sea-notes.md', SEA_NOTES);
    emit(recipeFrame('start', '', RECIPE_TURN_2));
    emit(recipeFrame('content', 'Done. I saved sea-notes.md for you.', RECIPE_TURN_2));
    emit(recipeFrame('finish', { finish_reason: 'stop' }, RECIPE_TURN_2));
    await waitFor(() => expect(screen.getByTestId('running').textContent).toBe('false'));

    const cardFrame = await sweepToCardFrame();

    // If any of these fail the fixture stopped being real and the assertion
    // below would be vacuous — which is exactly how a fabricated-shape test
    // stays green through a live bug.
    expect(cardFrame).not.toBeNull();
    const card = cardFrame as unknown as {
      type: string;
      msg_id: string;
      data: { artifacts: Array<{ fileName: string; sizeBytes: number }> };
    };
    // A LITERAL, deliberately not `chatArtifactCardMsgId(RECIPE_CONV)`. Calling
    // the production helper on both sides of this assertion made it tautological:
    // mutating the helper mutated the expectation with it and the mutant lived.
    // The renderer only cares that this id is truthy and is NOT the turn's, which
    // is precisely what drags the frame into the `isTurnOutput` re-arm.
    expect(card.msg_id).toBe('artifact-card:convwedge0001');
    expect(card.msg_id).not.toBe(RECIPE_TURN_2);
    expect(card.data.artifacts.map((artifact) => artifact.fileName)).toEqual(['sea-notes.md']);
    expect(card.data.artifacts[0].sizeBytes).toBe(Buffer.byteLength(SEA_NOTES, 'utf8'));

    emit(card as unknown as IResponseMessage);

    // THE REGRESSION. Live, this line was the Stop button that never went away.
    expect(screen.getByTestId('running').textContent).toBe('false');
  });
});
