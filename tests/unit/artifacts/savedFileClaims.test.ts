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
    expect(entries.length).toBeGreaterThanOrEqual(17);
    for (const entry of entries) {
      expect(entry.messageId).toMatch(/^[0-9a-f-]{6,}$/);
      expect(entry.profile).toMatch(/^(Wayland|ClaudeCode)/);
      expect(entry.text.length).toBeGreaterThan(0);
    }
    // BOTH readers, asserted. The negation controls come out of session
    // transcripts and the save claims out of `messages`; a capture run that
    // silently lost one reader would leave half this file testing nothing.
    expect(entries.some((entry) => entry.profile.startsWith('Wayland'))).toBe(true);
    expect(entries.filter((entry) => entry.profile === 'ClaudeCode').length).toBeGreaterThanOrEqual(5);
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

/**
 * B5-AS-SHIPPED: THE FEATURE ACCUSED HONEST TURNS MORE OFTEN THAN IT CAUGHT LIARS.
 *
 * The extractor above asks only "is there a completed-tense save verb near a
 * deliverable name". A model that says it did NOT write the file says it in
 * exactly that shape, and so does a model talking about what SOMEBODY ELSE
 * wrote. Measured over 196,248 real assistant turns lifted out of this machine's
 * own session transcripts and Wayland message databases, 334 of the 3,909
 * extracted claims - one in twelve - were a turn saying the opposite of a save.
 *
 * ONE OF THEM IS A REAL TURN OUT OF SEAN'S OWN DATABASE: `youWroteItFromMemory`
 * below is a report that the sweep was fabricated - "You wrote this from
 * memory" - and the shipped extractor reads it as a claim to have written
 * `ai-news.md`.
 *
 * THE FIXTURES BELOW ARE CAPTURED, NOT INVENTED, for the reason the header of
 * this file gives. Four of them come from Claude Code session transcripts rather
 * than from `messages`, which is why the capture script grew a second reader;
 * each carries the session file and the message uuid it was lifted from.
 */
describe('a turn that says it did NOT save is not a save claim', () => {
  describe('NEGATION AND ATTRIBUTION - captured turns that must extract nothing', () => {
    it('THE REAL FALSE ACCUSATION: "You wrote this from memory" is about the USER, not a save', () => {
      /*
       * Wayland/`7a12df6a`/`13b9f3f7`, captured out of Sean's own profile. The
       * distance from `wrote` to `ai-news.md` is 63 characters, inside the
       * 120-character window, so the shipped extractor claims the file.
       *
       * NO CARD WAS EVER DRAWN FOR THIS TURN - it is from 2026-07-03 and the
       * feature did not exist yet - and it is not hypothetical either. It is
       * stored with `position` `left`, and `getLastAgentText` takes any `text`
       * row that is not `right`, so the checker cannot tell this critique from
       * an assistant reply. Read the row, not the label: this is the shape the
       * feature is now live for.
       */
      expect(turn('youWroteItFromMemory')).toContain('wrote');
      expect(names(turn('youWroteItFromMemory'))).toEqual([]);
    });

    it('three files named in one breath as NOT written by this plan', () => {
      expect(turn('notWrittenByThisPlan')).toContain('not written');
      expect(names(turn('notWrittenByThisPlan'))).toEqual([]);
    });
  });

  describe('THE OTHER DIRECTION - a truthful save in the same sentence as a negation', () => {
    it('names the file it DID write and drops the ones the same sentence says it did not', () => {
      // "Written: .../ROADMAP.md (ROADMAP.md only; PROJECT.md, REQUIREMENTS.md,
      // STATE.md untouched; no phase dirs created)." One real turn carrying both
      // directions: a guard that only ever suppresses would lose ROADMAP.md.
      const claimed = names(turn('writtenOnlyOne'));
      expect(claimed[0]).toBe('ROADMAP.md');
      // `no phase dirs created` no longer vouches for the two names near it.
      expect(claimed).not.toContain('REQUIREMENTS.md');
      expect(claimed).not.toContain('STATE.md');
      /*
       * PROJECT.md IS STILL CLAIMED, AND THAT IS NOT THIS GUARD'S DOING.
       *
       * It sits 103 characters from the leading `Written:` - inside the
       * pre-existing 120-character CLAIM_WINDOW - so the verb it is attached to
       * was never cancelled and never could be by a negation rule. Narrowing
       * the window is a recall change measured against a different corpus
       * (the widest real positive is 74) and is not taken here. Asserted rather
       * than hidden, so the next person sees the real edge instead of a test
       * shaped to look clean.
       */
      expect(claimed).toContain('PROJECT.md');
    });

    it('a spaced dash ends the clause, so "No observation needed - X created" is a claim', () => {
      expect(turn('dashClauseCreated')).toContain('No observation needed');
      expect(names(turn('dashClauseCreated'))).toEqual(['STATE.md']);
    });

    it('an em dash ends the clause, so a quoted "no ..." does not reach the verb', () => {
      // "...the editorial gate—a hard constraint from the CONTEXT stating "no em
      // dashes or en dashes, digits not words"—has caught violations in newly
      // written planning prose. Two files contain em dashes: CONTEXT.md..."
      // The `no` is inside the quoted constraint, between two em dashes. Without
      // the dash rule the sentence reads as one clause and both files go quiet.
      expect(turn('emDashQuotedNegation')).toContain('no em dashes');
      expect(names(turn('emDashQuotedNegation'))).toContain('CONTEXT.md');
    });

    it('a first-person subject after the negation means the negation was the last clause', () => {
      // "...not the 52KB ctx.md we just created" - `we` sits between `not` and
      // the verb, so the `not` belongs to the phrase before it.
      expect(turn('firstPersonAfterNegation')).toContain('not the');
      expect(names(turn('firstPersonAfterNegation'))).toEqual(['ctx.md']);
    });
  });

  /**
   * THE FOUR SHAPES A MODEL USES TO SAY IT DID NOT WRITE SOMETHING.
   *
   * These four are written HERE rather than captured, and they are the only
   * strings in this file that are: each is the class the captured fixtures above
   * are one instance of, and the live step in the ship plan types the third one
   * into the running app by hand. Every one of them is a real class in the
   * corpus - `not` 129 times, `no` 63, `never` 56, `you`/`user`/`they` 14.
   */
  const CANCELLED: ReadonlyArray<readonly [string, string]> = [
    ['a plain negation', 'I have not saved anything to report.md.'],
    ['a contraction, with the apostrophe a model actually types', 'I haven’t created report.pdf yet.'],
    ['the live-step sentence', 'I have not saved anything. No file named chart-brief.md was created.'],
    ['somebody else did it', 'The deps you created in package.json look right to me.'],
    ['a conditional', 'If I had written config.md it would be in the repo.'],
    ['a bare "nothing" AFTER the verb', 'I wrote nothing to summary.md.'],
  ];
  for (const [label, text] of CANCELLED) {
    it(`extracts nothing: ${label}`, () => {
      expect(extractSavedFileClaims(text)).toEqual([]);
    });
  }

  /**
   * AND THE ONES THE GUARD MUST NOT TOUCH. If any of these goes quiet the
   * feature is dead and the suite still passes, which is the failure mode a
   * precision fix invites.
   */
  const KEPT: ReadonlyArray<readonly [string, string, string]> = [
    ['B5 itself', 'File saved to artifacts/chat/42d0fd61/chart-brief.md.', 'chart-brief.md'],
    ['a dash-separated apology', 'No problem — I saved the summary to report.md.', 'report.md'],
    [
      'a negation in the PREVIOUS clause',
      'There were no errors and I saved the brief to chart-brief.md.',
      'chart-brief.md',
    ],
    ['a request restated before the claim', 'You asked me to and I saved report.md', 'report.md'],
    ['an outcome word that is not a negation', 'I skipped the extras and saved report.md.', 'report.md'],
  ];
  for (const [label, text, expected] of KEPT) {
    it(`still extracts ${expected}: ${label}`, () => {
      expect(names(text)).toEqual([expected]);
    });
  }

  it('SHOUTED filenames do not escape the check', () => {
    // A model that types the name in caps was invisible to the extractor,
    // because the extension pattern was case-sensitive. Measured over 196,320
    // real turns, the `i` flag alone suppresses nothing and adds exactly TWO
    // claims - both in turns from the session that wrote this change, quoting
    // the line below back at itself.
    expect(names('File saved to artifacts/chat/42d0fd61/CHART-BRIEF.MD.')).toEqual(['CHART-BRIEF.MD']);
  });
});

/**
 * THIS RUNS AT THE END OF EVERY TURN IN THE PRODUCT, IN THE MAIN PROCESS.
 *
 * The first implementation scanned each line with one unanchored global regex
 * whose character class contained `.`, so an assistant message of dotted tokens
 * backtracked quadratically: 80,000 characters of "a.a.a.a..." took SIXTY-EIGHT
 * SECONDS and produced zero claims. Nothing in the corpus looks like that, which
 * is exactly why it had to be measured rather than reasoned about - a model
 * pasting a long version string, a stack trace or a dotted identifier list is
 * ordinary, and the cost lands on the path the user experiences as "I finished
 * talking to the assistant".
 *
 * The scanner is now tokenise-then-anchor: each candidate is tested once, at
 * position zero, against an anchored pattern.
 */
describe('adversarial assistant text cannot stall the turn', () => {
  const cases: ReadonlyArray<readonly [string, string]> = [
    // The one that took 68s. No valid extension anywhere, so the answer is zero
    // and every character is wasted work.
    ['dotted tokens with no deliverable extension', `saved ${'a.'.repeat(40_000)}x`],
    ['a very deep path that never resolves', `saved ${'a/'.repeat(40_000)}b.zz`],
    ['one line, twenty thousand save verbs', `${'saved '.repeat(20_000)}report.md`],
    ['five thousand lines of prose', `wrote something ${'x'.repeat(200)}\n`.repeat(5_000)],
    ['twenty thousand real claims', 'saved a.md\n'.repeat(20_000)],
    // THE CUE WINDOW IS BOUNDED AND THIS IS THE TEST THAT SAYS SO. Scanning
    // back to the clause start instead of a fixed 96 characters takes this line
    // from 22 ms to 58,969 ms as this suite measures it - the file's own
    // quadratic defect, rebuilt inside the negation guard, on the path the user
    // experiences as "I finished talking to the assistant".
    ['ten thousand verbs, each with prose in front of it', `${'the report was saved '.repeat(10_000)}report.md`],
  ];

  for (const [label, text] of cases) {
    it(label, () => {
      const started = Date.now();
      const claims = extractSavedFileClaims(text);
      const elapsed = Date.now() - started;
      // Generous by two orders of magnitude against the 68s that was measured;
      // the point is the shape of the curve, not a millisecond budget.
      expect(elapsed, `${text.length} chars took ${elapsed}ms`).toBeLessThan(1000);
      expect(claims.length).toBeLessThanOrEqual(8);
    });
  }
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
