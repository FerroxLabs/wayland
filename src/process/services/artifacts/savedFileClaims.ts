/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DID THE ASSISTANT JUST SAY IT SAVED A FILE THAT IS NOT THERE?
 *
 * Asked for a brief saved as a file, Smart Trader replied "File saved to
 * artifacts/chat/42d0fd61/chart-brief.md." on a turn that made ZERO tool calls.
 * The directory was never created and nothing on the machine was ever named
 * `chart-brief.md`. A persona clause saying "never claim a file you did not
 * write" is a sentence in a document that a model may or may not weight; the
 * only test you can write for it is that the sentence exists. This module is
 * the part that does not depend on the model agreeing.
 *
 * -------------------------------------------------------------------------
 * WHY IT CAN LIVE HERE AT ALL: THE HOST ALREADY HOLDS BOTH HALVES.
 * -------------------------------------------------------------------------
 * At turn end `chatRun` has walked the conversation's reserved deliverables
 * namespace and knows EXACTLY which files exist, and `initBridge` can read the
 * final assistant text out of the database. Nothing else in the system holds
 * both facts at the same instant, and until now nothing had ever compared them.
 *
 * -------------------------------------------------------------------------
 * BOTH EXPORTS ARE PURE, AND THAT IS THE REASON THIS IS ITS OWN FILE.
 * -------------------------------------------------------------------------
 * No database, no Electron, no filesystem - the same reasoning that put
 * `previewDocument.ts` in its own file. The one thing reconciliation needs from
 * disk (does a file of this name exist somewhere else under the workspace?) is
 * passed IN as a lookup the caller built, so the decision table can be
 * exercised against real captured turns with nothing mounted.
 *
 * -------------------------------------------------------------------------
 * PRECISION OVER RECALL, NON-NEGOTIABLY.
 * -------------------------------------------------------------------------
 * A false positive means the app contradicts a model that told the truth, in
 * writing, in front of the user. That is a worse product than the bug. So a
 * claim is extracted only when a save verb and a deliverable filename sit
 * TOGETHER ON ONE LINE within a short window of each other, and every rule
 * below is pinned by a fixture captured out of a real turn
 * (`tests/fixtures/artifacts/assistantSaveClaims.json`) rather than by a
 * sentence written to match it.
 *
 * THE RECALL GAPS ARE DELIBERATE AND ARE NAMED:
 *  - "Files written:" followed by a bullet list of paths finds nothing, because
 *    the verb and the names are on different lines. Real, observed, and left
 *    alone: widening the window to cross lines is exactly the change that turns
 *    "the report is in `artifacts/market/`" into an accusation.
 *  - A markdown link to a file is NOT treated as a claim. 47 real assistant
 *    turns were scanned across every profile on the development machine and not
 *    one of them linked a deliverable that way, so the rule could not be
 *    fixtured, and an unfixtured rule here is a liability.
 *  - Fenced code blocks are not stripped as a separate rule. They did not need
 *    to be: in the captured corpus a fenced path always sits alone on its line,
 *    so the one-line window already refuses it, and stripping fences would be a
 *    second rule doing the first rule's work with no fixture of its own.
 */

import type { UnsupportedClaimVerdict, UnsupportedSavedFileClaim } from '@/common/types/artifacts';

/**
 * The extensions a person would call a deliverable.
 *
 * Closed on purpose. `.py`, `.ts` and `.log` are things an agent writes while
 * working; naming one of those is not the failure this exists to catch, and
 * every extension added here is a new way to be wrong about a truthful model.
 */
const DELIVERABLE_EXTENSIONS = ['md', 'html', 'htm', 'csv', 'json', 'txt', 'pdf', 'xlsx'] as const;

/**
 * Completed-tense save verbs only.
 *
 * `save`, `write` and `writes` are excluded because they are what a model says
 * about what it is ABOUT to do or what a tool does in general - both observed
 * in the corpus ("I'll capture everything into brainstorm.md", "The skill
 * writes its HTML to its own folder"). The hyphen in the boundary is doing real
 * work too: a captured turn says "the safe-write guard refused overwrite", and
 * neither `safe-write` nor `overwrite` may read as a claim.
 *
 * `saved`, `wrote` and `created` are each carried by a real positive fixture.
 * `written` and `exported` are here because the failure they describe is the
 * same one; `written` is pinned in the negative direction by the `writeRefused`
 * fixture, which contains it and must still extract nothing.
 */
const SAVE_VERB = /(?<![A-Za-z-])(?:saved|wrote|written|created|exported)(?![A-Za-z-])/gi;

/**
 * A path- or filename-shaped token ending in a deliverable extension.
 *
 * ANCHORED, AND TESTED AGAINST ONE TOKEN AT A TIME. The first version of this
 * was one unanchored global regex swept across the whole line, and because the
 * character class contains `.` it backtracked quadratically: 80,000 characters
 * of "a.a.a.a..." took SIXTY-EIGHT SECONDS in the main process and returned
 * nothing. This runs at the end of every turn in the product, so that is a
 * hang on the path the user experiences as "I finished talking to the
 * assistant". A model pasting a long version string, a dotted identifier list
 * or a stack trace is completely ordinary; nothing in the captured corpus looks
 * like it, which is why it had to be MEASURED and not reasoned about.
 *
 * Anchored at both ends, each candidate is examined exactly once. THE ANCHORS
 * ARE THE FIX AND THAT WAS MEASURED, NOT ASSUMED: a 512-character token cap was
 * tried first and the adversarial cases still passed without it, while removing
 * the anchors and sweeping the line again put them back at 21s, 23s and 61s.
 * The cap was therefore dropped rather than kept as a talisman.
 */
const CLAIMED_PATH = new RegExp(
  String.raw`^(?:~?\/)?(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]+\.(?:${DELIVERABLE_EXTENSIONS.join('|')})$`,
  // A model that shouts the name - `CHART-BRIEF.MD` - was invisible to a
  // case-sensitive extension test. This is the ONE recall change taken here,
  // and it was measured before it was taken. Over 196,320 real assistant turns
  // this flag ALONE - no other change - suppresses nothing and adds exactly TWO
  // claims, and both are turns from the session that wrote this change, quoting
  // `CHART-BRIEF.MD` out of the test below. On text nobody wrote about the flag,
  // it produces nothing the case-sensitive pattern did not already produce.
  'i'
);

/**
 * Characters that cannot appear inside a path token, so they end one.
 *
 * This is what the old regex's character class was doing implicitly, made
 * explicit so the split is a linear scan rather than a backtracking search.
 * Backticks, brackets, quotes and the em/en dashes a model uses as separators
 * are all here, which is why a path wrapped in any of them comes out clean.
 */
const TOKEN_BOUNDARY: ReadonlySet<string> = new Set([
  ' ', '\t', '\r', '`', '"', "'", '(', ')', '[', ']', '{', '}', '<', '>', ',', ';', '|', '*', '\u2014', '\u2013',
]);

/** Sentence punctuation a model glues onto the end of a path. */
const TRAILING_PUNCTUATION: ReadonlySet<string> = new Set(['.', ',', ':', ';', '!', '?']);

/**
 * How far apart the verb and the name may sit, in characters, on one line.
 *
 * 120 is the distance in the widest real positive: "...wrote the 10 curated
 * items directly to the correct team workspace folder (`/Users/.../ai-news.md`)"
 * is 74. Anything much wider starts sweeping up a second sentence.
 */
const CLAIM_WINDOW = 120;

/**
 * At most this many corrections on one card.
 *
 * A card listing forty filenames is noise, and a turn making forty save claims
 * is not the failure mode this was built for.
 */
const MAX_CLAIMS = 8;

/* -------------------------------------------------------------------------
 * B5-AS-SHIPPED: THE FEATURE ACCUSED HONEST TURNS.
 * -------------------------------------------------------------------------
 * "A save verb near a deliverable name" is also the exact shape of a model
 * saying it did NOT write the file, and of a model saying somebody ELSE wrote
 * it. Measured over 196,248 real assistant turns lifted out of this machine's
 * own session transcripts and Wayland message databases, the rules above
 * extracted 3,909 claims and 334 of them - one in twelve - were a turn saying
 * the opposite of a save.
 *
 * ONE IS A REAL TURN OUT OF SEAN'S OWN PROFILE. Wayland conversation
 * `7a12df6a`: "They're fabricated. You wrote this from memory" reads as a claim
 * to have written `ai-news.md`, 63 characters away. No card was ever drawn for
 * it - that conversation is from 2026-07-03 and this feature did not exist yet
 * - but it is not hypothetical either: `getLastAgentText` accepts any `text`
 * row whose `position` is not `right` (`initBridge.ts`), and that critique is
 * stored at `left` exactly like an assistant reply, so the checker cannot tell
 * them apart. It is the shape the feature is now live for.
 *
 * So the verb list is filtered before the token scan. THE GUARD ONLY EVER
 * REMOVES CLAIMS, which is the safe direction: its worst failure is silence.
 *
 * All 334 suppressions were classified by the cue that cancelled them, and
 * every one whose line could be read as a first-person save - 28 of them - was
 * read in full. Zero were a genuine save claim.
 * The two rules below that are NOT plain negation - the clause-ending dash and
 * the first-person override - exist because a naive version lost six real
 * claims that the corpus proves are true, including this one, which carries
 * both directions in a single sentence:
 *
 *   "Written: .../ROADMAP.md (ROADMAP.md only; PROJECT.md, REQUIREMENTS.md,
 *    STATE.md untouched; no phase dirs created)."
 *
 * ROADMAP.md must still be claimed. The other three must not.
 *
 * WHAT IT STILL GETS WRONG, NAMED RATHER THAN IMPLIED. This REDUCES false
 * accusations; it does not end them, and the card's wording is the half that
 * covers the rest. Measured residuals over the same corpus:
 *  - The cue sets are ENGLISH. Twelve locales ship. A German or Japanese turn
 *    saying it wrote nothing is not seen at all.
 *  - A question is not a cue: "Want me to turn this into a written decision doc
 *    (a keepable `FORK-EVALUATION.md`)?" still reads as a claim. Of the 3,374
 *    lines this guard still claims from, 22 contain a question mark at all, and
 *    most of those are genuine claims that merely mention one. No rule was built
 *    on a class that small - a rule with a handful of instances behind it is a
 *    rule that has not been tested.
 *  - A negation in the PREVIOUS SENTENCE does not reach: that is the clause
 *    scoping working as designed, and widening it is what re-breaks the
 *    genuine claims above.
 *  - A quoted log line, and a negation further than 24 characters after the
 *    verb, are both still missed.
 * That is why `claimedButAbsent` now says the host COULD NOT VERIFY the file
 * rather than that no such file was written: the guard makes the accusation
 * rarer, and the wording makes the residue honest instead of wrong.
 * ------------------------------------------------------------------------- */

/**
 * Words that, standing before a save verb in its own clause, mean the save did
 * not happen.
 *
 * MEASURED, NOT IMAGINED. Counted as the cue that actually cancelled a verb
 * across the corpus: `not` 159, `never` 88, `no` 79, `haven't` 14, `nothing`
 * 12, `cannot` 3, `hadn't` 2, and one each of `hasn't`, `weren't`, `neither`
 * and `none`. The rest of the contraction family is unattested spelling of an
 * attested class, which is a different thing from a guess.
 *
 * `without`, `unable`, `failed`, `refused` and `skipped` were in the first
 * version of this set and are deliberately NOT here. They are not idle - added
 * back they cancel 69 verbs across 195,888 turns - but they change the claim
 * count by EXACTLY ZERO, so all they can ever do is find a new way to be wrong
 * about a truthful model: "I skipped the extras and saved report.md" is a
 * genuine claim that `skipped` silently ate.
 */
const NEGATOR: ReadonlySet<string> = new Set([
  'not', 'no', 'never', 'nothing', 'none', 'neither', 'nor',
  "didn't", "don't", "doesn't", "hasn't", "haven't", "hadn't", "wasn't", "weren't",
  "isn't", "aren't", "can't", 'cannot', "couldn't", "won't", "wouldn't", "shouldn't",
]);

/**
 * Subjects that make the verb somebody ELSE's action.
 *
 * `your` is deliberately absent: it killed a genuine claim, "also saved to your
 * Desktop as wayland-agents-mock.html". A possessive is not a subject.
 */
const OTHER_SUBJECT: ReadonlySet<string> = new Set([
  'you', "you've", 'user', 'they', "they've", 'someone', 'somebody',
]);

/**
 * Modals and complementizers that put the whole clause in the hypothetical.
 *
 * Unlike a negator these are NOT overridden by a first-person subject: "If I
 * had written config.md" is conditional precisely because `if` scopes over its
 * own subject.
 */
const CONDITIONAL: ReadonlySet<string> = new Set([
  'if', 'whether', 'unless', 'would', 'could', 'might', 'should',
]);

/**
 * A first-person subject ENDS the backward scan.
 *
 * "...not the 52KB ctx.md we just created" and "There were no errors and I
 * saved the brief" both put a negation in front of a verb it does not govern.
 * The nearest subject is the one the verb belongs to, so a `we`/`I` between the
 * cue and the verb means the cue was the previous clause's.
 */
const FIRST_PERSON: ReadonlySet<string> = new Set(['i', "i've", 'we', "we've"]);

/** How many words either side of the verb carry a cue. */
const CUE_LOOKBACK_WORDS = 6;
const CUE_LOOKAHEAD_WORDS = 2;

/**
 * How many CHARACTERS either side the guard may look. BOUNDED, AND THE BOUND IS
 * THE WHOLE POINT.
 *
 * Scanning back to the true clause start is O(line) per verb, and this file has
 * already shipped one quadratic scan that took 68 SECONDS in the main process.
 * Measured again, here, on one 210,000-character line carrying 10,000 save
 * verbs: bounded 77 ms, unbounded 83,210 ms - and on the 20,000-verb line the
 * suite already carries, 49 ms against 131,543 ms. A reviewer who "simplifies"
 * this to a clause scan ships the hang back; the suite proves it, at 62,411 ms
 * against a 1000 ms budget. 96 covers the widest real cue distance in the
 * corpus - "No file named chart-brief.md was created" is 33.
 */
const CUE_LOOKBACK_CHARS = 96;
const CUE_LOOKAHEAD_CHARS = 24;

/**
 * CHARACTER TESTS, NOT REGEXES, AND THE REASON IS THE BUDGET ABOVE.
 *
 * The cue scan touches up to 96 characters per save verb, so a `/\s/.test()`
 * per character is 3.8 MILLION regex calls on the 20,000-verb line the
 * adversarial suite already carries. Measured on that line: regex character
 * tests 114 ms, these 22 ms, against a 1000 ms budget shared with the tests
 * that predate this guard. The 114 ms passed on an idle machine and went over
 * a second under load, which is a flaky suite rather than a fast one.
 *
 * `\s` is a fixed set, so this is an equality, not an approximation: the ASCII
 * codes are inline and everything above 127 falls through to the same regex.
 * Proven equal to the regex spelling over all 196,248 real turns in the corpus
 * - identical claims, every turn - before it was taken.
 */
const NON_ASCII_SPACE = /\s/;

function isSpace(code: number): boolean {
  if (code === 32 || (code >= 9 && code <= 13)) return true;
  return code > 127 && NON_ASCII_SPACE.test(String.fromCharCode(code));
}

/** `[A-Za-z0-9'"\`]` - the characters a cue word may begin or end with. */
function isCueCharacter(code: number): boolean {
  return (
    (code >= 97 && code <= 122) || // a-z, and the segment is lower-cased first
    (code >= 65 && code <= 90) ||
    (code >= 48 && code <= 57) ||
    code === 39 || // '
    code === 34 || // "
    code === 96 // `
  );
}

/**
 * Does the character at `index` end a clause?
 *
 * Sentence punctuation only counts when whitespace follows it, because the dot
 * inside `chart-brief.md` is not a clause end and treating it as one is what
 * let "No file named chart-brief.md was created" read as a claim. An em or en
 * dash always counts - it cannot occur inside a path token, which is why it is
 * already a TOKEN_BOUNDARY. A plain hyphen counts ONLY when spaced on both
 * sides, so `chart-brief` stays one word while "No observation needed - the
 * session created 31-14-SUMMARY.md" reads as the two clauses it is.
 */
function breaksClause(line: string, index: number): boolean {
  const code = line.charCodeAt(index);
  // An em or en dash. Both are already TOKEN_BOUNDARY characters.
  if (code === 0x2014 || code === 0x2013) return true;
  const isPunctuation =
    code === 46 || code === 59 || code === 58 || code === 33 || code === 63 || code === 44; // . ; : ! ? ,
  // The overwhelmingly common case, and it costs one comparison chain.
  if (!isPunctuation && code !== 45) return false;
  const endsWord = index + 1 >= line.length || isSpace(line.charCodeAt(index + 1));
  if (code === 45) return endsWord && index > 0 && isSpace(line.charCodeAt(index - 1)); // -
  return endsWord;
}

/**
 * Whitespace-separated words, decoration stripped, curly apostrophes folded.
 *
 * A filename stays ONE word, which is the point: "No file named chart-brief.md
 * was created" must keep `no` inside the six-word window rather than pushing it
 * out on the dots and dashes. The fold is not cosmetic - "I haven’t created
 * report.pdf yet." extracted a claim while the ASCII spelling did not, and it
 * happens BEFORE the edges are stripped so a folded apostrophe survives them.
 */
function cueWords(segment: string): string[] {
  const text = segment.replace(/\u2019/g, "'").toLowerCase();
  const words: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    while (cursor < text.length && isSpace(text.charCodeAt(cursor))) cursor += 1;
    const wordStart = cursor;
    while (cursor < text.length && !isSpace(text.charCodeAt(cursor))) cursor += 1;
    let start = wordStart;
    let end = cursor;
    while (start < end && !isCueCharacter(text.charCodeAt(start))) start += 1;
    while (end > start && !isCueCharacter(text.charCodeAt(end - 1))) end -= 1;
    if (end > start) words.push(text.slice(start, end));
  }
  return words;
}

/** Is the save verb at `index` cancelled by a negation, an attribution or a conditional? */
function verbIsCancelled(line: string, index: number, verbLength: number): boolean {
  let start = Math.max(0, index - CUE_LOOKBACK_CHARS);
  for (let i = index - 1; i >= start; i -= 1) {
    if (breaksClause(line, i)) {
      start = i + 1;
      break;
    }
  }
  const before = cueWords(line.slice(start, index)).slice(-CUE_LOOKBACK_WORDS);

  // Nearest cue wins, and a first-person subject ends the search.
  for (let i = before.length - 1; i >= 0; i -= 1) {
    const word = before[i];
    if (FIRST_PERSON.has(word)) break;
    if (NEGATOR.has(word) || OTHER_SUBJECT.has(word)) return true;
  }
  // A conditional is not overridden by the subject it scopes over.
  for (const word of before) {
    if (CONDITIONAL.has(word)) return true;
  }

  // "I wrote nothing to summary.md." - the cancelling word can follow the verb.
  const from = index + verbLength;
  let end = Math.min(line.length, from + CUE_LOOKAHEAD_CHARS);
  for (let i = from; i < end; i += 1) {
    if (breaksClause(line, i)) {
      end = i;
      break;
    }
  }
  for (const word of cueWords(line.slice(from, end)).slice(0, CUE_LOOKAHEAD_WORDS)) {
    if (word === 'nothing' || word === 'none') return true;
  }

  return false;
}

export interface SavedFileClaim {
  /** The token exactly as the model wrote it, decoration stripped. */
  claimedPath: string;
  /** The basename. What the user recognises, and what the card names. */
  fileName: string;
}

/**
 * The two verdicts that SPEAK. `supported` emits nothing at all.
 *
 * Declared in `@/common/types/artifacts` rather than here because the renderer
 * has to translate it, which is exactly where `ArtifactRejectionReason` lives
 * and for exactly the same reason.
 */
export type { UnsupportedClaimVerdict, UnsupportedSavedFileClaim };

export interface SavedFileClaimContext {
  /**
   * The ledger-registered deliverables, by workspace-relative POSIX path. Only
   * the path is needed, so an `ArtifactRecord` satisfies this as-is.
   */
  registered: readonly { relativePath: string }[];
  /**
   * Basename -> workspace-relative path, for files that exist under the
   * workspace but OUTSIDE the deliverables namespace. Built by the caller,
   * which is the half that is allowed to touch a disk.
   */
  elsewhere: ReadonlyMap<string, string>;
}

const basenameOf = (value: string): string => {
  const cut = value.lastIndexOf('/');
  return cut >= 0 ? value.slice(cut + 1) : value;
};

/**
 * Every file the text claims, in this turn, to have written.
 *
 * Order is first-appearance and duplicates collapse on the basename, so a turn
 * that names the same report twice produces one claim.
 */
export function extractSavedFileClaims(text: string): SavedFileClaim[] {
  if (typeof text !== 'string' || text.length === 0) return [];

  const claims: SavedFileClaim[] = [];
  const seen = new Set<string>();

  for (const line of text.split('\n')) {
    if (claims.length >= MAX_CLAIMS) break;

    // Verb first: a line with no completed-tense save verb cannot carry a claim,
    // and most lines are that, so they cost one regex sweep and nothing else.
    SAVE_VERB.lastIndex = 0;
    const verbs: number[] = [];
    for (let match = SAVE_VERB.exec(line); match !== null; match = SAVE_VERB.exec(line)) {
      // A turn that says it did NOT save is not a save claim, and neither is a
      // turn about what somebody else wrote. See the block above `NEGATOR`.
      if (verbIsCancelled(line, match.index, match[0].length)) continue;
      verbs.push(match.index);
    }
    if (verbs.length === 0) continue;

    for (const token of pathTokens(line)) {
      if (claims.length >= MAX_CLAIMS) break;
      if (!CLAIMED_PATH.test(token.text)) continue;
      // The window looks BOTH ways: "Done. `wayland-verify.md` created with
      // WAYLAND_OK." is a real turn whose verb follows the name.
      if (!hasVerbNear(verbs, token.start, token.end)) continue;

      const fileName = basenameOf(token.text);
      if (!fileName || seen.has(fileName)) continue;
      seen.add(fileName);
      claims.push({ claimedPath: token.text, fileName });
    }
  }

  return claims;
}

/** One linear pass, splitting a line into candidate tokens with their offsets. */
function* pathTokens(line: string): Generator<{ text: string; start: number; end: number }> {
  let cursor = 0;
  while (cursor < line.length) {
    while (cursor < line.length && TOKEN_BOUNDARY.has(line[cursor])) cursor += 1;
    const start = cursor;
    while (cursor < line.length && !TOKEN_BOUNDARY.has(line[cursor])) cursor += 1;
    if (cursor === start) break;
    let end = cursor;
    while (end > start && TRAILING_PUNCTUATION.has(line[end - 1])) end -= 1;
    if (end > start) yield { text: line.slice(start, end), start, end };
  }
}

/**
 * Is a save verb within the window of [start, end)?
 *
 * `verbs` comes out of a left-to-right scan, so it is sorted, and a binary
 * search keeps a line carrying many verbs AND many tokens linear rather than
 * quadratic. `some()` over every verb for every token is the shape that turns
 * one pathological message into a stalled turn.
 */
function hasVerbNear(verbs: readonly number[], start: number, end: number): boolean {
  let low = 0;
  let high = verbs.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (verbs[mid] < start) low = mid + 1;
    else high = mid;
  }
  // `low` is the first verb at or after `start`; the one before it is the last
  // verb that precedes the token.
  if (low < verbs.length && verbs[low] - end <= CLAIM_WINDOW) return true;
  return low > 0 && start - verbs[low - 1] <= CLAIM_WINDOW;
}

/**
 * Three verdicts per claim, of which only two produce output.
 *
 *  - `supported` - a registered deliverable of that name exists. Say nothing.
 *  - `elsewhere` - the file is real but sits outside the namespace this chat
 *    collects from. This is the C-2 failure, and the user should be told WHERE
 *    it is rather than that it does not exist.
 *  - `absent`    - nothing anywhere under the workspace. This is B5.
 *
 * Matching is by BASENAME. It is the loose direction on purpose: a loose match
 * can only ever turn a correction into silence, and silence is the safe error.
 */
export function reconcileSavedFileClaims(
  claims: readonly SavedFileClaim[],
  context: SavedFileClaimContext
): UnsupportedSavedFileClaim[] {
  if (claims.length === 0) return [];

  const registeredNames = new Set(context.registered.map((record) => basenameOf(record.relativePath)));

  const unsupported: UnsupportedSavedFileClaim[] = [];
  for (const claim of claims) {
    if (registeredNames.has(claim.fileName)) continue;
    const actualPath = context.elsewhere.get(claim.fileName);
    if (actualPath) {
      unsupported.push({ fileName: claim.fileName, verdict: 'elsewhere', actualPath });
      continue;
    }
    unsupported.push({ fileName: claim.fileName, verdict: 'absent' });
  }
  return unsupported;
}
