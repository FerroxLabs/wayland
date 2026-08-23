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
 * Usage (macOS, on a machine that has driven the app):
 *   node scripts/fixtures/capture-assistant-save-claims.mjs [--write]
 *
 * Without `--write` it prints what it found and changes nothing. The databases
 * are opened READ-ONLY through `sqlite3`; this script never writes to a profile.
 *
 * On a machine with no Wayland profiles this script finds nothing and the
 * committed fixture is what the tests use.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
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
];

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

const captured = {};
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

const found = Object.keys(captured).length;
console.log(`captured ${found}/${WANTED.length}`);
for (const [key, entry] of Object.entries(captured)) {
  console.log(`  ${key}  ${entry.profile}/${entry.conversationId}/${entry.messageId}  ${entry.text.length} chars`);
}

if (process.argv.includes('--write')) {
  if (found !== WANTED.length) {
    console.error('refusing to write a partial fixture');
    process.exit(1);
  }
  writeFileSync(
    FIXTURE,
    `${JSON.stringify({ capturedBy: 'scripts/fixtures/capture-assistant-save-claims.mjs', messages: captured }, null, 2)}\n`
  );
  console.log(`wrote ${FIXTURE}`);
}
