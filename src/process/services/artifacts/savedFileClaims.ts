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
  String.raw`^(?:~?\/)?(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]+\.(?:${DELIVERABLE_EXTENSIONS.join('|')})$`
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
