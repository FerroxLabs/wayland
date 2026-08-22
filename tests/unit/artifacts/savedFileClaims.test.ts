/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * B5. THE ASSISTANT SAID IT SAVED A FILE. THERE WAS NO FILE.
 *
 * Asked for a brief saved as a file, Smart Trader replied "File saved to
 * artifacts/chat/42d0fd61/chart-brief.md." on a turn that made ZERO tool calls.
 * The workspace existed. The directory was never created. Nothing on the
 * machine was ever named `chart-brief.md`.
 *
 * -------------------------------------------------------------------------
 * EVERY STRING IN THIS FILE WAS WRITTEN BY A MODEL, NOT BY ITS AUTHOR.
 * -------------------------------------------------------------------------
 * `tests/fixtures/artifacts/assistantSaveClaims.json` is lifted out of the
 * product's own `messages` table - the same table `getLastAgentText` reads at
 * turn end - by `scripts/fixtures/capture-assistant-save-claims.mjs`, and each
 * entry carries the profile, conversation and message id it came from. A claim
 * detector tuned against sentences its own author invented proves only that the
 * author can invent a sentence it matches, which is the whole reason this
 * corpus exists.
 *
 * -------------------------------------------------------------------------
 * THE NEGATIVE CONTROLS ARE THE LOAD-BEARING HALF OF THIS FILE.
 * -------------------------------------------------------------------------
 * A false positive means the app calls a truthful model a liar, in writing, in
 * front of the user. That is a worse product than the bug being fixed. So
 * precision beats recall here on purpose, and the recall gaps are named rather
 * than hidden: `writeRefused` really did write two files and this extractor
 * finds neither, because the claim ("Files written:") and the filenames are on
 * different lines. Staying silent there costs nothing. Speaking up wrongly does.
 */

import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { extractSavedFileClaims, reconcileSavedFileClaims } from '@process/services/artifacts/savedFileClaims';

const FIXTURE = path.resolve(__dirname, '../../fixtures/artifacts/assistantSaveClaims.json');

interface CapturedMessage {
  profile: string;
  conversationId: string;
  messageId: string;
  why: string;
  text: string;
}

const corpus = JSON.parse(readFileSync(FIXTURE, 'utf-8')) as {
  capturedBy: string;
  messages: Record<string, CapturedMessage>;
};

/** Read a captured turn by key, loudly rather than as `undefined`. */
function turn(key: string): string {
  const entry = corpus.messages[key];
  if (!entry) throw new Error(`fixture "${key}" is missing - re-run ${corpus.capturedBy}`);
  return entry.text;
}

const names = (text: string): string[] => extractSavedFileClaims(text).map((claim) => claim.fileName);

describe('extractSavedFileClaims: what the model actually claimed', () => {
  it('CONTROL: the corpus is real captured turns, not sentences written here', () => {
    // A fixture file that silently emptied would make every negative control
    // below pass for the wrong reason.
    const entries = Object.values(corpus.messages);
    expect(entries.length).toBeGreaterThanOrEqual(11);
    for (const entry of entries) {
      expect(entry.messageId).toMatch(/^[0-9a-f-]{6,}$/);
      expect(entry.profile).toMatch(/^Wayland/);
      expect(entry.text.length).toBeGreaterThan(0);
    }
  });

  it('B5: the fabricated save is extracted, verbatim, from the turn that shipped it', () => {
    const claims = extractSavedFileClaims(turn('b5Absent'));
    expect(claims).toHaveLength(1);
    expect(claims[0].fileName).toBe('chart-brief.md');
    expect(claims[0].claimedPath).toBe('artifacts/chat/42d0fd61/chart-brief.md');
  });

  it('a turn that really wrote the file makes the same shape of claim', () => {
    const claims = extractSavedFileClaims(turn('supportedInNamespace'));
    expect(claims).toHaveLength(1);
    expect(claims[0].fileName).toBe('sea-notes.md');
    expect(claims[0].claimedPath).toBe('artifacts/chat/74376140/sea-notes.md');
  });

  it('a claim naming somewhere else entirely is still a claim', () => {
    expect(names(turn('elsewhereOutsideNamespace'))).toEqual(['ai-news.md']);
  });

  it('the verb may come AFTER the filename', () => {
    // "Done. `wayland-verify.md` created with `WAYLAND_OK`." - a real turn, and
    // the reason the window looks both ways instead of only backwards.
    expect(names(turn('createdAfterTheName'))).toEqual(['wayland-verify.md']);
  });

  describe('NEGATIVE CONTROLS - every one of these must extract nothing', () => {
    it('filenames discussed, with no save verb anywhere near them', () => {
      expect(names(turn('namedWithoutSaving'))).toEqual([]);
    });

    it('a file it says it WILL write', () => {
      expect(names(turn('futureIntent'))).toEqual([]);
    });

    it('a path quoted on its own line inside a fenced block', () => {
      expect(names(turn('pathOnItsOwnLine'))).toEqual([]);
    });

    it('a file the write guard REFUSED, in a turn that also says "Files written:"', () => {
      // The recall gap is deliberate and is named in the header: the two files
      // this turn really did write are on lines of their own and are not found.
      // Silence is the safe direction; an accusation is not.
      expect(turn('writeRefused')).toContain('written');
      expect(names(turn('writeRefused'))).toEqual([]);
    });

    it('a file it could not even read', () => {
      expect(names(turn('readDenied'))).toEqual([]);
    });

    it('a general description of where a skill writes its output', () => {
      expect(names(turn('presentTenseDescription'))).toEqual([]);
    });

    it('a CSV named as the source of an answer', () => {
      expect(names(turn('watchlistFromCsv'))).toEqual([]);
    });
  });
});

describe('reconcileSavedFileClaims: three verdicts, and only two of them speak', () => {
  const claims = extractSavedFileClaims(turn('b5Absent'));

  it('B5: nothing anywhere under the workspace is ABSENT', () => {
    const unsupported = reconcileSavedFileClaims(claims, { registered: [], elsewhere: new Map() });
    expect(unsupported).toEqual([{ fileName: 'chart-brief.md', verdict: 'absent' }]);
  });

  it('a registered deliverable of that name is SUPPORTED, and says nothing', () => {
    const unsupported = reconcileSavedFileClaims(claims, {
      registered: [{ relativePath: 'artifacts/chat/42d0fd61/chart-brief.md' }],
      elsewhere: new Map(),
    });
    expect(unsupported).toEqual([]);
  });

  it('the C-2 shape - written to the workspace, outside the namespace - is ELSEWHERE', () => {
    const unsupported = reconcileSavedFileClaims(claims, {
      registered: [],
      elsewhere: new Map([['chart-brief.md', 'artifacts/market/chart-brief.md']]),
    });
    expect(unsupported).toEqual([
      { fileName: 'chart-brief.md', verdict: 'elsewhere', actualPath: 'artifacts/market/chart-brief.md' },
    ]);
  });

  it('a registered file under a DIFFERENT name does not vouch for this one', () => {
    const unsupported = reconcileSavedFileClaims(claims, {
      registered: [{ relativePath: 'artifacts/chat/42d0fd61/something-else.md' }],
      elsewhere: new Map(),
    });
    expect(unsupported).toEqual([{ fileName: 'chart-brief.md', verdict: 'absent' }]);
  });

  it('no claims means nothing to say, whatever the namespace holds', () => {
    expect(reconcileSavedFileClaims([], { registered: [], elsewhere: new Map() })).toEqual([]);
  });
});
