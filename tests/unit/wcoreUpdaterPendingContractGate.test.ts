/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1108 follow-up - the boot-time contract gate on a STAGED engine update.
 *
 * `installWCoreUpdate` verifies a release against DESKTOP_CORE_V1_PIN before it
 * stages anything, so a `<binary>.pending` matched the pin AT STAGING TIME. But
 * the pin belongs to Desktop, and Desktop can update itself before the pending
 * is ever applied:
 *
 *   1. Desktop A stages Core X as `.pending` (Windows: the live binary is locked).
 *   2. Desktop auto-updates itself to B, whose pin is a DIFFERENT contract minor.
 *   3. Boot: the pending is swapped in, and now shadows the bundled binary that
 *      works, because `resolveWCoreBinary` prefers the override.
 *
 * That is the same shape #1108 exists to prevent, and the launch quarantine only
 * catches it AFTER the customer eats a broken launch. So the swap itself must
 * re-check, and it must do so WITHOUT a network call: this runs synchronously in
 * the main-process bootstrap ahead of `initializeProcess()`.
 *
 * The check is local. Staging writes the pin identity it verified against beside
 * the pending as `<binary>.pending.contract`; the swap compares that record to
 * this build's own `contracts/wayland-desktop-core/v1/manifest.json` - the same
 * file DESKTOP_CORE_V1_PIN is transcribed from, and already one of the coupled
 * edits an engine bump touches, so there is no fifth file to drift.
 *
 * FAILS CLOSED. A missing record, an unreadable one, and a mismatching one are
 * all refusals. A pending staged by a Desktop that predates this gate carries no
 * record and is therefore refused - correct, because its compatibility cannot be
 * proven, and the customer simply re-runs an update that IS gated.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import localManifest from '../../contracts/wayland-desktop-core/v1/manifest.json';
import { applyPendingSwapGuarded, pendingContractRecordFor } from '../../src/process/agent/wcore/wcoreUpdater';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-pending-gate-'));
const finalPath = path.join(tmp, 'wayland-core');
const pendingPath = `${finalPath}.pending`;
const recordPath = `${pendingPath}.contract`;
const prevPath = `${finalPath}.prev`;

/** The record staging writes for an engine that DOES match this build's pin. */
const matchingRecord = (): string => JSON.stringify(pendingContractRecordFor());

beforeEach(() => {
  for (const p of [finalPath, pendingPath, recordPath, prevPath]) fs.rmSync(p, { force: true });
});
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('applyPendingSwapGuarded - #1108 boot-time contract gate', () => {
  it('applies a pending whose recorded contract matches this build', () => {
    fs.writeFileSync(finalPath, 'OLD');
    fs.writeFileSync(pendingPath, 'NEW');
    fs.writeFileSync(recordPath, matchingRecord());

    expect(applyPendingSwapGuarded(finalPath).applied).toBe(true);
    expect(fs.readFileSync(finalPath, 'utf8')).toBe('NEW');
    expect(fs.existsSync(pendingPath)).toBe(false);
    // The record is consumed with the pending it describes.
    expect(fs.existsSync(recordPath)).toBe(false);
  });

  it('REFUSES a pending whose recorded contract minor is not this build pin', () => {
    fs.writeFileSync(finalPath, 'OLD');
    fs.writeFileSync(pendingPath, 'NEW');
    const stale = pendingContractRecordFor();
    fs.writeFileSync(recordPath, JSON.stringify({ ...stale, minor: stale.minor - 1 }));

    expect(applyPendingSwapGuarded(finalPath).applied).toBe(false);
    // The working binary is untouched - this is the whole point.
    expect(fs.readFileSync(finalPath, 'utf8')).toBe('OLD');
    // The refused pending is cleared so it cannot retry forever.
    expect(fs.existsSync(pendingPath)).toBe(false);
    expect(fs.existsSync(recordPath)).toBe(false);
  });

  it('REFUSES a pending whose recorded fixture digest differs', () => {
    fs.writeFileSync(finalPath, 'OLD');
    fs.writeFileSync(pendingPath, 'NEW');
    const stale = pendingContractRecordFor();
    fs.writeFileSync(recordPath, JSON.stringify({ ...stale, fixtureDigest: `${stale.fixtureDigest}00` }));

    expect(applyPendingSwapGuarded(finalPath).applied).toBe(false);
    expect(fs.readFileSync(finalPath, 'utf8')).toBe('OLD');
  });

  it('REFUSES a pending staged before this gate existed (no record at all)', () => {
    fs.writeFileSync(finalPath, 'OLD');
    fs.writeFileSync(pendingPath, 'NEW');

    expect(applyPendingSwapGuarded(finalPath).applied).toBe(false);
    expect(fs.readFileSync(finalPath, 'utf8')).toBe('OLD');
    expect(fs.existsSync(pendingPath)).toBe(false);
  });

  it('REFUSES an unreadable record rather than guessing', () => {
    fs.writeFileSync(finalPath, 'OLD');
    fs.writeFileSync(pendingPath, 'NEW');
    fs.writeFileSync(recordPath, '{ this is not json');

    expect(applyPendingSwapGuarded(finalPath).applied).toBe(false);
    expect(fs.readFileSync(finalPath, 'utf8')).toBe('OLD');
  });

  it('no pending file at all: no-op, and does not touch the live binary', () => {
    fs.writeFileSync(finalPath, 'OLD');
    expect(applyPendingSwapGuarded(finalPath).applied).toBe(false);
    expect(fs.readFileSync(finalPath, 'utf8')).toBe('OLD');
  });

  it('records the identity this build actually pins, not a hard-coded copy', () => {
    const record = pendingContractRecordFor();
    // Reads through to the contract corpus, so an engine bump moves this with it.
    expect(record.name).toBe(localManifest.contract.name);
    expect(record.major).toBe(localManifest.contract.major);
    expect(record.minor).toBe(localManifest.contract.minor);
    expect(record.generator).toBe(localManifest.generator);
    expect(record.fixtureDigest).toBe(localManifest.fixture_digest);
    expect(record.schemaDigest).toBe(localManifest.schema_digest);
    expect(record.sourceInputsDigest).toBe(localManifest.source_inputs_digest);
  });
});
