/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ONE TURN OF A CHAT, from "the agent stopped talking" to "the user has a
 * deliverable they can open".
 *
 * `taskRun.ts` is the scheduled equivalent: a cron run opens a staging
 * directory, the agent writes into it, and publication registers what it left.
 * A chat has no run to open and nothing to publish - it just writes into the
 * namespace T1 reserved for it - so the seam it needs is only the last half:
 * walk the namespace, register what is there, report what was refused.
 *
 * -------------------------------------------------------------------------
 * THE IDENTITY DECISION: `runId` IS THE CONVERSATION, NOT THE TURN.
 * -------------------------------------------------------------------------
 * `artifactIdFor` is deterministic on (workspace, runId, relativePath), and
 * `readArtifactLedger` collapses records by id with the LAST one winning. So:
 *
 *  - With the conversation as the run id, turn 5 rewriting `report.md`
 *    re-registers under the SAME artifact id. The reader collapses it to one
 *    row carrying the current digest, and the card that was already on screen
 *    keeps working, because the id it holds still resolves.
 *  - With a per-TURN run id - which reads as more correct, and is the mistake
 *    this comment exists to prevent - every turn mints a NEW id for the same
 *    file. The rail fills with duplicate rows of one report, and every row but
 *    the newest is permanently dead: its recorded digest no longer matches the
 *    bytes on disk, so `openVerified` refuses it forever.
 *
 * The cost is accepted and named: per-turn provenance is lost. `runAt` still
 * moves, so "Edited 5 minutes ago" is still true.
 *
 * -------------------------------------------------------------------------
 * A DIRECTORY WALK, NEVER MODEL MARKUP.
 * -------------------------------------------------------------------------
 * What counts as a deliverable is what is IN the namespace, not what the model
 * remembered to link in its final message. A model that writes the file and
 * forgets to mention it still gets a card. This is deliberately stricter than
 * deriving outputs from markdown links, and must not be weakened into a hybrid.
 *
 * The walk is still an UNTRUSTED declaration: the agent chose those names and
 * could have written a symlink out of the workspace, so every path goes through
 * `registerArtifacts` exactly as a scheduled run's staged output does.
 * Rejections are RETURNED, so a refused file has a reason the user can be shown
 * instead of being silently absent.
 */

import { promises as fs, type Dirent } from 'fs';
import path from 'path';

/**
 * The engine spawn's OWN resolver, imported rather than mirrored.
 *
 * The one thing this module must never get wrong is which directory it walks.
 * A private copy of the path rule would keep passing its own tests while
 * sweeping a directory the engine was never told about - a rail over an empty
 * folder, which is the failure the whole milestone is about. So the sweep asks
 * the same function the spawn asked.
 */
import { resolveOutputDir } from '@process/agent/wcore/envBuilder';

import {
  readArtifactLedger,
  registerArtifacts,
  type ArtifactRecord,
  type ArtifactRejection,
  type RegistrationResult,
} from './artifactLedger';
import {
  extractSavedFileClaims,
  reconcileSavedFileClaims,
  type SavedFileClaim,
  type UnsupportedSavedFileClaim,
} from './savedFileClaims';

/** Stop walking this deep. A chat's deliverables are reports, not a source tree. */
const MAX_CHAT_DEPTH = 8;

/** Stop collecting this many paths. The ledger caps RECORDS separately. */
const MAX_CHAT_ENTRIES = 512;

export interface ChatSweepInput {
  conversationId: string;
  /** The conversation's workspace, exactly as the spawn resolved it. */
  workspace: string;
  ledgerPath: string;
  /** A LABEL on the record, never an authenticated identity. */
  declaredBy?: string;
  now?: Date;
}

export interface ChatSweepResult {
  /** The directory walked, as the production resolver named it. */
  outputDir: string;
  /**
   * Every deliverable currently in the namespace - the ones this sweep
   * registered AND the ones an earlier sweep already had and that have not
   * changed. The card names what the user HAS, not what changed this turn.
   */
  registered: ArtifactRecord[];
  /** Files the ledger refused, with the reason. Never swallowed. */
  rejected: ArtifactRejection[];
  /**
   * Files the assistant SAID it saved on this turn that the walk cannot account
   * for. Empty on every ordinary turn, and absent entirely when no assistant
   * text was available to check.
   */
  unsupported?: UnsupportedSavedFileClaim[];
}

/**
 * What this process last hashed for a given file, so an unchanged deliverable
 * is not re-sha256'd on every single turn of a long chat.
 *
 * Deliberately process-local and deliberately NOT authoritative: on a fresh
 * process it is empty and every file is hashed once, which is the safe
 * direction. A skip requires size AND mtime to be identical to the values
 * observed at the last successful registration, and the record it stands in for
 * is read back from the ledger - so a skip can never invent a record, only
 * avoid recomputing one.
 */
const sweepMemo = new Map<string, { sizeBytes: number; mtimeMs: number; artifactId: string }>();

const memoKey = (workspace: string, conversationId: string, relative: string): string =>
  `${workspace}\0${conversationId}\0${relative}`;

/** Test seam only. */
export function clearChatSweepMemo(): void {
  sweepMemo.clear();
}

/**
 * The task id a chat's deliverables are filed under.
 *
 * Namespaced so it can never collide with a cron job id, which is what
 * `taskId` means everywhere else in the ledger.
 */
export function chatTaskIdFor(conversationId: string): string {
  return `chat:${conversationId}`;
}

/**
 * Register everything the conversation has produced.
 *
 * Safe to call on every turn end, including turns that produced nothing: an
 * empty namespace (the common case - most turns are conversation) does no
 * filesystem work beyond one failed `readdir` and writes nothing.
 */
export async function sweepChatRun(input: ChatSweepInput): Promise<ChatSweepResult> {
  // No run is ever open here: a scheduled run's output belongs to
  // `commitTaskRun`, which publishes it by rename. Passing `undefined` asks the
  // resolver for exactly the chat namespace.
  const outputDir = resolveOutputDir(input.workspace, undefined, input.conversationId);
  const found = await collectChatPaths(outputDir);
  if (found.length === 0) return { outputDir, registered: [], rejected: [] };

  const { fresh, unchanged } = await partitionByChange(input, outputDir, found);

  let result: RegistrationResult = { registered: [], rejected: [] };
  if (fresh.length > 0) {
    result = await registerArtifacts({
      ledgerPath: input.ledgerPath,
      workspace: input.workspace,
      runDir: outputDir,
      taskId: chatTaskIdFor(input.conversationId),
      // THE DECISION. See the module header before changing this.
      runId: input.conversationId,
      declaredBy: input.declaredBy ?? 'Chat',
      declarations: fresh.map((relative) => ({ path: relative })),
      now: input.now,
    });
    await rememberRegistered(input, outputDir, result.registered);
  }

  return { outputDir, registered: [...result.registered, ...unchanged], rejected: result.rejected };
}

/**
 * The turn-end decision, separated from the turn-end WIRING.
 *
 * `initBridge` registers this against `conversation.turnCompleted`. Everything
 * that decides whether a sweep should happen lives here so it can be exercised
 * without an Electron app: which turn states are terminal, what makes an event
 * unusable, and the rule that a sweep failure must never escape.
 *
 * BEST-EFFORT BY CONSTRUCTION. This runs on the completion of every turn in the
 * product. A ledger the app cannot write, a workspace the user deleted mid-turn,
 * a permission error - none of them may turn into a rejected promise on a path
 * the user experiences as "I finished talking to the assistant".
 */
export interface ChatTurnEvent {
  sessionId?: string;
  state?: string;
  workspace?: string;
  /**
   * Does this turn belong to a scheduled task? Straight off the real event's
   * `runtime.hasTask`, which `ConversationTurnCompletionService` sets from
   * `Boolean(extra.cronJobId)`. Optional because a caller that cannot tell
   * should get the CHAT behaviour, which is the one with the claim check.
   */
  hasTask?: boolean;
}

/**
 * Turn states that mean the agent has STOPPED. `ai_waiting_input` is the
 * canonical "finished and idle" event; `stopped` and `error` are the two other
 * ways a turn ends. A turn that errored may still have written the file before
 * it failed, so it sweeps too - refusing to look would lose a real deliverable
 * over an unrelated failure.
 */
const TERMINAL_TURN_STATES: ReadonlySet<string> = new Set(['ai_waiting_input', 'stopped', 'error']);

export function isTerminalChatTurn(state: string | undefined): boolean {
  return typeof state === 'string' && TERMINAL_TURN_STATES.has(state);
}

export async function onChatTurnCompleted(
  event: ChatTurnEvent,
  deps: {
    ledgerPath: string;
    /**
     * The turn's final assistant text, fetched lazily so this module never
     * learns what a database is. `initBridge` already reads exactly this for the
     * workflow driver; the read is one indexed query for five rows and it runs
     * once per terminal turn.
     */
    lastAgentText?: (conversationId: string) => Promise<string | null>;
    onSwept?: (result: ChatSweepResult, event: ChatTurnEvent) => void | Promise<void>;
    onError?: (error: unknown) => void;
  }
): Promise<ChatSweepResult | null> {
  if (!isTerminalChatTurn(event.state)) return null;
  const conversationId = event.sessionId;
  const workspace = event.workspace;
  if (!conversationId || !workspace) return null;

  try {
    const result = await sweepChatRun({ conversationId, workspace, ledgerPath: deps.ledgerPath });

    // WHAT THE MODEL JUST SAID, AGAINST WHAT IS ACTUALLY THERE.
    //
    // This is the only place in the product holding both at once. A save claim
    // the walk cannot account for is B5, and the failure it describes is silent
    // by nature, so the host has to be the one that notices.
    //
    // ONLY WHERE THE HOST KNOWS WHERE THE FILE WAS SUPPOSED TO GO. A scheduled
    // run's deliverables never enter the chat namespace this sweep walks: they
    // go to a staging tree that `commitTaskRun` publishes by rename, AFTER the
    // turn ends. Meanwhile the shipped morning-report body (Step 4 item 4)
    // instructs the model to name `morning-brief.html` in that final message.
    // Comparing the two produced a correction on a run that had delivered
    // perfectly - `absent` before publication (the elsewhere walk skips dot
    // directories, and the staging tree is `.staging`), `elsewhere` after it.
    // A false accusation is worse than the silence, so the check declines the
    // turns whose filing rules it does not model.
    const unsupported = event.hasTask
      ? []
      : await reconcileTurnClaims(result, conversationId, workspace, deps.lastAgentText);
    if (unsupported.length > 0) result.unsupported = unsupported;

    // Nothing produced is the common case - most turns are conversation - and
    // it must not reach the card path at all. It yields to an unsupported claim
    // and to NOTHING else: an empty card is still never drawn.
    if (result.registered.length === 0 && result.rejected.length === 0 && unsupported.length === 0) return result;
    await deps.onSwept?.(result, event);
    return result;
  } catch (error) {
    deps.onError?.(error);
    return null;
  }
}

/**
 * Turn the assistant's last words into a verdict, or into nothing.
 *
 * BEST-EFFORT LIKE EVERYTHING ELSE ON THIS PATH. No text available, no claim
 * made, or a workspace that cannot be read - all three answer "nothing to say",
 * because a check that fails must never become an accusation.
 */
async function reconcileTurnClaims(
  result: ChatSweepResult,
  conversationId: string,
  workspace: string,
  lastAgentText?: (conversationId: string) => Promise<string | null>
): Promise<UnsupportedSavedFileClaim[]> {
  if (!lastAgentText) return [];
  let text: string | null = null;
  try {
    text = await lastAgentText(conversationId);
  } catch {
    return [];
  }
  if (!text) return [];

  const claims = extractSavedFileClaims(text);
  if (claims.length === 0) return [];

  // Only the names the ledger cannot vouch for are worth a disk search, and on
  // an ordinary turn there are none.
  const registeredNames = new Set(result.registered.map((record) => record.relativePath.split('/').pop() ?? ''));
  const unaccounted = claims.filter((claim) => !registeredNames.has(claim.fileName));
  const elsewhere: ReadonlyMap<string, string> =
    unaccounted.length > 0
      ? await findElsewhereInWorkspace(workspace, result.outputDir, unaccounted)
      : new Map<string, string>();

  return reconcileSavedFileClaims(claims, { registered: result.registered, elsewhere });
}

/** Stop the elsewhere search this deep. A deliverable is not buried in a source tree. */
const MAX_ELSEWHERE_DEPTH = 6;

/** Stop the elsewhere search after this many directories, whatever it has found. */
const MAX_ELSEWHERE_DIRS = 400;

/**
 * Is a file of this name anywhere ELSE under the workspace?
 *
 * The C-2 defect wrote a real brief to `artifacts/market` from a chat that only
 * ever collects from `artifacts/chat/<id>`, and the honest thing to tell the
 * user is where their file actually is - not that it does not exist.
 *
 * Bounded hard, because this runs on a turn end: depth, directory count, dot
 * directories and the usual dependency mounds are all refused, and the
 * deliverables namespace itself is skipped because a hit there would already
 * have been a ledger record.
 */
const SKIPPED_DIRS: ReadonlySet<string> = new Set(['node_modules', 'venv', 'target', 'dist', 'build', 'vendor']);

async function findElsewhereInWorkspace(
  workspace: string,
  outputDir: string,
  claims: readonly SavedFileClaim[]
): Promise<Map<string, string>> {
  const wanted = new Set(claims.map((claim) => claim.fileName));
  const found = new Map<string, string>();
  let visited = 0;

  async function walk(dir: string, prefix: string, depth: number): Promise<void> {
    if (depth > MAX_ELSEWHERE_DEPTH || visited >= MAX_ELSEWHERE_DIRS || found.size === wanted.size) return;
    visited += 1;
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (found.size === wanted.size) return;
      if (entry.name.startsWith('.') || SKIPPED_DIRS.has(entry.name)) continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (path.join(dir, entry.name) === outputDir) continue;
        // eslint-disable-next-line no-await-in-loop -- depth-first, bounded walk; opening the whole tree at once buys nothing on a turn end
        await walk(path.join(dir, entry.name), relative, depth + 1);
      } else if (entry.isFile() && wanted.has(entry.name) && !found.has(entry.name)) {
        found.set(entry.name, relative);
      }
    }
  }

  await walk(workspace, '', 0);
  return found;
}

/**
 * Split the walk into files that need hashing and files this process already
 * hashed at this exact (size, mtime) and that the ledger still holds.
 *
 * A file is only skipped when BOTH halves agree: the memo says the bytes are
 * unchanged, and the ledger still has the record the memo points at. Losing
 * either one re-registers, which costs a hash and is always correct.
 */
async function partitionByChange(
  input: ChatSweepInput,
  outputDir: string,
  found: readonly string[]
): Promise<{ fresh: string[]; unchanged: ArtifactRecord[] }> {
  const fresh: string[] = [];
  const unchanged: ArtifactRecord[] = [];
  const anyMemo = found.some((relative) => sweepMemo.has(memoKey(input.workspace, input.conversationId, relative)));
  if (!anyMemo) return { fresh: [...found], unchanged };

  const byId = new Map((await readArtifactLedger(input.ledgerPath)).map((record) => [record.artifactId, record]));

  await Promise.all(
    found.map(async (relative) => {
      const memo = sweepMemo.get(memoKey(input.workspace, input.conversationId, relative));
      const record = memo ? byId.get(memo.artifactId) : undefined;
      if (!memo || !record) {
        fresh.push(relative);
        return;
      }
      try {
        const stat = await fs.lstat(path.join(outputDir, ...relative.split('/')));
        if (stat.isFile() && stat.size === memo.sizeBytes && stat.mtimeMs === memo.mtimeMs) {
          unchanged.push(record);
          return;
        }
      } catch {
        // Unreadable now: let `registerArtifacts` say so out loud.
      }
      fresh.push(relative);
    })
  );

  return { fresh, unchanged };
}

/** Record what was just hashed, so the next turn can skip it. */
async function rememberRegistered(
  input: ChatSweepInput,
  outputDir: string,
  registered: readonly ArtifactRecord[]
): Promise<void> {
  await Promise.all(
    registered.map(async (record) => {
      // The record's path is workspace-relative and the walk is namespace-
      // relative, so the record is re-anchored on the directory that was
      // actually walked rather than on a second guess at the prefix.
      const absolute = path.resolve(record.workspace, ...record.relativePath.split('/'));
      const relative = path.relative(outputDir, absolute);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return;
      try {
        const stat = await fs.lstat(absolute);
        sweepMemo.set(memoKey(input.workspace, input.conversationId, relative.split(path.sep).join('/')), {
          sizeBytes: stat.size,
          mtimeMs: stat.mtimeMs,
          artifactId: record.artifactId,
        });
      } catch {
        // No memo entry means "hash it again next time", which is safe.
      }
    })
  );
}

/**
 * Every file in the chat namespace, relative to it, POSIX-separated.
 *
 * A symlink is COLLECTED, not skipped, so the ledger refuses it OUT LOUD rather
 * than it vanishing with no reason anywhere. Recursion reads the dirent's own
 * type, which `readdir` does not resolve through a symlink, so a symlinked
 * directory is a leaf here and cannot walk the sweep out of the namespace.
 *
 * Dot entries are skipped: every workspace scanner already skips them, so a
 * dot file could never be shown to the user as a deliverable anyway.
 */
async function collectChatPaths(outputDir: string): Promise<string[]> {
  const found: string[] = [];

  async function walk(dir: string, prefix: string, depth: number): Promise<void> {
    if (depth > MAX_CHAT_DEPTH || found.length >= MAX_CHAT_ENTRIES) return;
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.toSorted((a, b) => a.name.localeCompare(b.name))) {
      if (found.length >= MAX_CHAT_ENTRIES) return;
      if (entry.name.startsWith('.')) continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        // eslint-disable-next-line no-await-in-loop -- depth-first walk of a small deliverable tree; parallelism would open the whole tree at once for no gain
        await walk(path.join(dir, entry.name), relative, depth + 1);
      } else {
        found.push(relative);
      }
    }
  }

  await walk(outputDir, '', 0);
  return found;
}
