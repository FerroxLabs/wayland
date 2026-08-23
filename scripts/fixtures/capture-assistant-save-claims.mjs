/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Lift assistant turn text OUT OF THE PRODUCT'S OWN MESSAGE DATABASE.
 *
 * `tests/fixtures/artifacts/assistantSaveClaims.json` is the corpus
 * `savedFileClaims.test.ts` runs against, and every string in it was written by
 * a real model in a real driven session and read back out of `messages` - the
 * same table `getLastAgentText` reads at turn end. NOTHING IN THAT FILE IS
 * TYPED BY HAND, which is the whole point: a claim detector tuned against
 * sentences its own author invented proves only that the author can invent a
 * sentence it matches.
 *
 * TWO READERS, BECAUSE THE NEGATION CORPUS IS NOT ALL IN `messages`.
 * The negative controls the claim guard needs are turns saying a file was NOT
 * written, and the densest real supply of those is this machine's Claude Code
 * session transcripts - 195,742 assistant turns of them. So a second reader
 * lifts an assistant text block out of `~/.claude/projects/**.jsonl` by its
 * message uuid. Same rule as the first: nothing is typed by hand, and every
 * entry carries where it came from.
 *
 * Usage (macOS, on a machine that has driven the app):
 *   node scripts/fixtures/capture-assistant-save-claims.mjs [--write]
 *
 * Without `--write` it prints what it found and changes nothing. The databases
 * are opened READ-ONLY through `sqlite3` and the transcripts are only ever
 * read; this script never writes to a profile or to a session transcript.
 *
 * On a machine with no Wayland profiles this script finds nothing and the
 * committed fixture is what the tests use.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = path.join(REPO_ROOT, 'tests/fixtures/artifacts/assistantSaveClaims.json');
const SUPPORT = path.join(os.homedir(), 'Library/Application Support');

/** The message ids to lift, and what each one is evidence OF. */
const WANTED = [
  ['b5Absent', '456cd410', 'B5 itself: a save claim on a turn that made zero tool calls.'],
  ['supportedInNamespace', '8b7dfa9e', 'A turn that really wrote the file; its artifact card is in the same database.'],
  ['elsewhereOutsideNamespace', '78333282', 'A real save claim naming a path outside the chat deliverables namespace.'],
  ['createdAfterTheName', '04e876a7', 'A real save claim whose verb comes AFTER the filename.'],
  ['namedWithoutSaving', '4bcb7333', 'Two filenames discussed, nothing claimed saved.'],
  ['futureIntent', 'd4d1ddb7', 'Says it WILL write a file. Nothing written yet.'],
  ['pathOnItsOwnLine', 'b128ac89', 'A path quoted alone, inside a fenced block, with no claim attached.'],
  ['writeRefused', '69ac41fe', 'Names a file the write guard REFUSED. The opposite of a save claim.'],
  ['readDenied', '4cb2f1ea', 'Names a file it could not even read.'],
  ['presentTenseDescription', 'a336a1d2', 'Describes where a skill writes, as a general fact.'],
  ['watchlistFromCsv', 'b1595f03', 'B8: the watchlist answer that came from a CSV. Kept for the doctrine lane.'],
  [
    'youWroteItFromMemory',
    '13b9f3f7-78f6-4464-897e-d815772b1f69',
    'THE REAL FALSE ACCUSATION: a turn telling the user THEY wrote it, which the shipped extractor read as a save claim.',
  ],
];

/**
 * The same lift, out of a Claude Code session transcript, by message uuid.
 *
 * `[key, uuid, why]`. Two say a file was NOT written; two are genuine claims
 * that a naive negation guard destroys, and they are here so the guard cannot
 * be "improved" into silence without a test going red.
 */
const WANTED_TRANSCRIPTS = [
  [
    'notWrittenByThisPlan',
    '7ae68045-0dbc-4828-958a-508c6de29354',
    'Three deliverables named in one breath as NOT written by this plan.',
  ],
  [
    'writtenOnlyOne',
    '8baac025-2f99-4729-bd29-9ae400552cc6',
    'BOTH DIRECTIONS IN ONE SENTENCE: one file really written, three named as untouched.',
  ],
  [
    'dashClauseCreated',
    '2e9c34a5-fc23-43ea-b1dc-ed9d65535cb2',
    'A genuine creation claim whose sentence opens with "No" before a spaced dash.',
  ],
  [
    'firstPersonAfterNegation',
    '60602e02-843a-4f79-bf28-5d4a1ef9fa2a',
    'A genuine creation claim with a "not" belonging to the phrase before it.',
  ],
  [
    'emDashQuotedNegation',
    '224746b9-c458-453d-9a32-53ab87e4b886',
    'A genuine claim whose sentence carries a quoted "no ..." between em dashes.',
  ],
];

const TRANSCRIPTS = path.join(os.homedir(), '.claude/projects');

function profiles() {
  if (!existsSync(SUPPORT)) return [];
  return readdirSync(SUPPORT)
    .filter((name) => name.startsWith('Wayland'))
    .map((name) => ({ profile: name, db: path.join(SUPPORT, name, 'wayland/wayland.db') }))
    .filter((entry) => existsSync(entry.db));
}

/** Read-only, and `-json` so a message body carrying any separator cannot corrupt the row. */
function query(db, sql) {
  const raw = execFileSync('/usr/bin/sqlite3', ['-json', `file:${db}?mode=ro`, sql], { encoding: 'utf-8' }).trim();
  return raw ? JSON.parse(raw) : [];
}

/** Every session transcript on this machine, deepest-first is irrelevant - order is stable. */
function transcripts(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...transcripts(full));
    else if (entry.name.endsWith('.jsonl')) out.push(full);
  }
  return out;
}

/** The `text` blocks of one assistant message, joined, or null. */
function assistantText(record) {
  if (record?.type !== 'assistant') return null;
  const blocks = record?.message?.content;
  if (!Array.isArray(blocks)) return null;
  const text = blocks
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n');
  return text.length > 0 ? text : null;
}

const captured = {};

const byUuid = new Map(WANTED_TRANSCRIPTS.map(([key, uuid, why]) => [uuid, { key, why }]));
if (byUuid.size > 0) {
  for (const file of transcripts(TRANSCRIPTS)) {
    if (byUuid.size === 0) break;
    let lines;
    try {
      lines = readFileSync(file, 'utf-8').split('\n');
    } catch {
      continue;
    }
    for (const line of lines) {
      if (!line) continue;
      let record;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }
      const want = byUuid.get(record?.uuid);
      if (!want) continue;
      const text = assistantText(record);
      if (text === null) continue;
      captured[want.key] = {
        profile: 'ClaudeCode',
        conversationId: path.basename(file, '.jsonl'),
        messageId: record.uuid,
        why: want.why,
        text,
      };
      byUuid.delete(record.uuid);
    }
  }
  for (const [uuid, want] of byUuid) console.error(`MISSING ${want.key} (${uuid}) - no transcript on this machine holds it`);
}

for (const [key, messageId, why] of WANTED) {
  for (const { profile, db } of profiles()) {
    let rows;
    try {
      rows = query(db, `select conversation_id, content from messages where id='${messageId}' limit 1;`);
    } catch {
      continue;
    }
    if (rows.length === 0) continue;
    const { conversation_id: conversationId, content } = rows[0];
    let text;
    try {
      text = JSON.parse(content).content;
    } catch {
      continue;
    }
    if (typeof text !== 'string') continue;
    captured[key] = { profile, conversationId, messageId, why, text };
    break;
  }
  if (!captured[key]) console.error(`MISSING ${key} (${messageId}) - no profile on this machine holds it`);
}

const expected = WANTED.length + WANTED_TRANSCRIPTS.length;
const found = Object.keys(captured).length;
console.log(`captured ${found}/${expected}`);
for (const [key, entry] of Object.entries(captured)) {
  console.log(`  ${key}  ${entry.profile}/${entry.conversationId}/${entry.messageId}  ${entry.text.length} chars`);
}

if (process.argv.includes('--write')) {
  if (found !== expected) {
    console.error('refusing to write a partial fixture');
    process.exit(1);
  }
  writeFileSync(
    FIXTURE,
    `${JSON.stringify({ capturedBy: 'scripts/fixtures/capture-assistant-save-claims.mjs', messages: captured }, null, 2)}\n`
  );
  console.log(`wrote ${FIXTURE}`);
}
