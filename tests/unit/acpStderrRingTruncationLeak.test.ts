/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1023 FINDING 4: the stderr ring must not hand the banner a HALF credential.
 *
 * #1020 newly routes `ProcessAcpClient`'s 8KB stderr ring into the chat transcript
 * through `buildCrashMessage`, which makes the ring's truncation a disclosure path.
 * `redactSecrets` fires correctly on WHOLE credentials, but the ring kept the last
 * 8192 characters and cut at an arbitrary character: shave even one character off
 * `sk-ant-api03-` and the vendor-prefix rule stops matching, so the remainder of a
 * real key survives every downstream scrub. Cuts 1, 3, 6, 10, 13 and 20 characters
 * in all leaked.
 *
 * The half-token sits at the START of the ring, so the banner's own 2048-character
 * tail usually hides it. It stops hiding it the moment redaction SHRINKS the ring
 * below 2048, which is exactly what a bridge dumping a block of credentials to
 * stderr produces: every whole key collapses to `[redacted]`, the ring drops from
 * 8192 to about 1300 characters, no tail slice happens, and the one token that was
 * NOT redacted is the half one at the cut - on screen, in the chat transcript.
 *
 * Fixed at the ring rather than at the banner: the ring holds COMPLETE RECORDS, and
 * its budget is enforced by dropping whole records off the front, so no half-token
 * ever exists for the scrubber to miss.
 *
 * A record boundary is `\r` as well as `\n`. Output with NO boundary anywhere has
 * nothing to drop, so it is retained from its head instead of cut - which is safe for
 * the same reason the drop is: what is retained keeps the ANCHOR that makes it
 * redactable, and it is the anchorless REMAINDER that the scrubber cannot see.
 *
 * The second half of this file is the audit of the first attempt at that fix, which
 * scrubbed at the COLLECTION site instead and shipped two HIGH regressions. See
 * 'a partial credential is never scrubbed at the collection site' below.
 *
 * Driven through a REAL child process writing to REAL stderr.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import { buildCrashMessage } from '@process/acp/session/AcpSession';
import { isProcessAlive } from '@process/acp/infra/processUtils';
import { redactSecrets } from '@process/utils/secretRedaction';

/** A real Anthropic key shape. Only the WHOLE token is redactable. */
const SECRET = 'sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGhIjKlMnOpQrStUvWxYz';

/** Mirrors `STARTUP_STDERR_MAX` in ProcessAcpClient. */
const RING_MAX = 8192;

/** Mirrors `STDERR_PENDING_MAX` in ProcessAcpClient. */
const PENDING_MAX = 32768;

/**
 * A bare 32-hex secret, used deliberately INSTEAD of a prefixed key: no rule matches it
 * on its own, so a row built on it tests the scrubber's ANCHOR STRUCTURE rather than
 * prefix luck.
 */
const HEX = 'f0e9d8c7b6a5948372615041302f1e0d';

const spawned: ChildProcess[] = [];

afterEach(() => {
  for (const child of spawned.splice(0)) {
    if (child.pid && isProcessAlive(child.pid)) {
      try {
        process.kill(child.pid, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }
});

/**
 * Real child writes `payload` to real stderr through the real `setupStderrCapture`.
 * Returns both the surviving ring and the banner #1020 would put on screen for it.
 */
async function driveChildStderr(payload: string): Promise<{ ring: string; banner: string }> {
  const client = new ProcessAcpClient(
    async () => {
      const child = spawn(process.execPath, ['-e', 'process.stderr.write(process.env.ACP_PAYLOAD ?? "");'], {
        stdio: 'pipe',
        env: { ...process.env, ACP_PAYLOAD: payload },
      });
      spawned.push(child);
      return child;
    },
    { backend: 'probe', handlers: {} as never }
  );

  // The probe child never speaks ACP, so initialize rejects. Stderr capture is
  // attached at step 2 of start(), before the handshake, and that is the code here.
  await client.start().catch(() => undefined);
  await new Promise((r) => setTimeout(r, 300));

  const ring = (client as unknown as { stderrBuffer: string }).stderrBuffer;
  const banner = buildCrashMessage({
    reason: 'connection_close',
    exitCode: null,
    signal: null,
    stderr: ring,
    unexpectedDuringPrompt: false,
  })!;
  return { ring, banner };
}

/**
 * Two real stderr writes separated by a real gap, so they arrive as SEPARATE chunks and
 * split `whole` across the ring's overflow. `first` must already exceed {@link RING_MAX}
 * or the overflow branch never runs on it and the test proves nothing - asserted, because
 * a first cut of this test used a 8130-character chunk and passed vacuously.
 */
async function driveSplitChildStderr(first: string, second: string): Promise<{ ring: string; banner: string }> {
  if (first.length <= RING_MAX) throw new Error('the first chunk must overflow the ring');
  const client = new ProcessAcpClient(
    async () => {
      const child = spawn(
        process.execPath,
        [
          '-e',
          'process.stderr.write(process.env.ACP_A ?? "");' +
            'setTimeout(() => process.stderr.write(process.env.ACP_B ?? ""), 150);',
        ],
        { stdio: 'pipe', env: { ...process.env, ACP_A: first, ACP_B: second } }
      );
      spawned.push(child);
      return child;
    },
    { backend: 'probe', handlers: {} as never }
  );

  await client.start().catch(() => undefined);
  await new Promise((r) => setTimeout(r, 600));

  const ring = (client as unknown as { stderrBuffer: string }).stderrBuffer;
  const banner = buildCrashMessage({
    reason: 'connection_close',
    exitCode: null,
    signal: null,
    stderr: ring,
    unexpectedDuringPrompt: false,
  })!;
  return { ring, banner };
}

/**
 * A payload whose last {@link RING_MAX} characters begin exactly `offset` characters INTO
 * `head` - an ANCHOR followed by its secret - with NO record boundary anywhere in that
 * window, then whole credentials so redaction shrinks the ring under the banner's
 * 2048-character tail.
 *
 * The leading padding is space-separated on purpose. `\bBearer`, `\bAuthorization` and
 * `\bapi_key` each need a word boundary in FRONT of the anchor, and padding that ends on a
 * word character silently defeats all three - which made a first cut of this probe report
 * a post-fix leak that its own padding, not the code, had caused. Both that and the cut
 * arithmetic are ASSERTED rather than assumed.
 */
function anchorCutPayload(head: string, offset: number): string {
  const restLen = RING_MAX - (head.length - offset);
  let rest = ' ';
  while (rest.length + SECRET.length + 1 <= restLen) rest += `${SECRET} `;
  rest += 'o'.repeat(restLen - rest.length);

  const payload = `${'q '.repeat(250)}${head}${rest}`;
  const window = payload.slice(-RING_MAX);
  if (window !== head.slice(offset) + rest) throw new Error(`payload arithmetic wrong for ${head}`);
  if (/[\r\n]/.test(window)) throw new Error('the retained window must contain no record boundary');
  if (!payload.includes(` ${head}`)) throw new Error('the anchor needs a word boundary in front of it');
  return payload;
}

/**
 * A payload whose last {@link RING_MAX} characters begin exactly `offset` characters
 * INTO a credential, followed by whole `sep`-separated credentials so redaction
 * shrinks the ring under the banner's 2048-character tail.
 *
 * `sep` is the separator standing in for a newline. A single space is the case that
 * matters most: a structured logger emitting one JSON line of over 8KB with a config
 * echo in it has no `\n` in the retained window at all.
 *
 * The arithmetic is ASSERTED, not assumed: the first cut of this test put the cut in
 * the filler instead and passed against the unfixed code.
 */
function payloadCutting(offset: number, sep = '\n'): string {
  const restLen = RING_MAX - (SECRET.length - offset);
  let rest = sep;
  while (rest.length + SECRET.length + sep.length <= restLen) rest += `${SECRET}${sep}`;
  rest += 'o'.repeat(restLen - rest.length);

  const payload = `noise ${'x'.repeat(70)}${sep}`.repeat(30) + `token ${SECRET}${rest}`;
  const cut = payload.slice(-RING_MAX);
  if (cut !== SECRET.slice(offset) + rest) throw new Error(`payload arithmetic wrong for offset ${offset}`);
  return payload;
}

describe('#1023 the stderr ring must not leak a truncated credential', () => {
  it('KNOWN POSITIVE: a WHOLE credential in a real child stderr is redacted out of the banner', async () => {
    const { banner } = await driveChildStderr(`bridge token: ${SECRET}\n`);
    expect(banner).not.toContain(SECRET);
    expect(banner).toContain('[redacted]');
    // Not vacuous: the surrounding diagnostic really did reach the banner.
    expect(banner).toContain('bridge token');
  }, 20000);

  for (const offset of [1, 3, 6, 10, 13, 20]) {
    describe(`a ring cut ${offset} characters into a credential`, () => {
      it('leaves no half-token in the ring itself', async () => {
        const { ring } = await driveChildStderr(payloadCutting(offset));
        expect(ring.length).toBeLessThanOrEqual(RING_MAX);
        // The record-boundary invariant: the ring never BEGINS mid-token.
        expect(ring.startsWith(SECRET.slice(offset))).toBe(false);
        // And the consequence that matters: nothing in the ring survives the
        // scrubber. Asserted on the SCRUBBED ring, because an intact credential
        // trivially contains its own suffix.
        expect(redactSecrets(ring)).not.toContain(SECRET.slice(offset));
      }, 20000);

      it('leaves no half-token in the user-visible banner', async () => {
        const { banner } = await driveChildStderr(payloadCutting(offset));
        expect(banner).not.toContain(SECRET.slice(offset));
        // Known positive in the same banner: the whole credentials DID redact, so a
        // pass here is the truncation being fixed, not the scrubber being absent.
        expect(banner).toContain('[redacted]');
      }, 20000);
    });
  }

  // The separators that are NOT `\n`. A single space is the no-boundary case, where
  // the first cut of this fix kept all 8192 characters including the half-token; a
  // bare `\r` is a real record boundary that a `\n`-only search walks straight past.
  // Both were reproduced leaking against the `\n`-only code, so a pass here is the
  // second cut of the fix and not an untested payload.
  //
  // PREMISE CHANGED for the space-separated row (#1023 audit HIGH-1/HIGH-2 fix). It
  // used to assert the ring never exceeds `RING_MAX`, and that could only ever be
  // true because the ring CUT its retained text at an arbitrary character. It no
  // longer does: the budget is now enforced by dropping whole records, so a payload
  // with no record boundary in it has nothing to drop and is retained entire, up to
  // `PENDING_MAX`. The substantive assertions - the ring never begins mid-token, and
  // nothing in it survives the scrubber - are unchanged and are what this row is for.
  for (const [label, sep, maxLen] of [
    ['no newline anywhere, space-separated', ' ', PENDING_MAX],
    ['bare carriage returns, no newline', '\r', RING_MAX],
  ] as const) {
    describe(`a ring cut mid-credential with ${label}`, () => {
      it('leaves no half-token in the ring itself', async () => {
        const { ring } = await driveChildStderr(payloadCutting(6, sep));
        expect(ring.length).toBeLessThanOrEqual(maxLen);
        expect(ring.startsWith(SECRET.slice(6))).toBe(false);
        expect(redactSecrets(ring)).not.toContain(SECRET.slice(6));
      }, 20000);

      it('leaves no half-token in the user-visible banner', async () => {
        const { banner } = await driveChildStderr(payloadCutting(6, sep));
        expect(banner).not.toContain(SECRET.slice(6));
        // Known positive in the same banner: the whole credentials DID redact, so a
        // pass is the truncation being fixed and not the scrubber being absent.
        expect(banner).toContain('[redacted]');
      }, 20000);
    });
  }

  it('a stderr tail with NO newline at all still reaches the banner', async () => {
    // 9KB of unbroken text has no record boundary to cut at, so it is retained whole
    // rather than cut - the real error still lands on screen, and nothing in the ring
    // ever lost the anchor that makes it redactable.
    const { ring, banner } = await driveChildStderr('y'.repeat(9000) + ' THE-REAL-ERROR');
    expect(ring).toContain('THE-REAL-ERROR');
    expect(banner).toContain('THE-REAL-ERROR');
  }, 20000);

  it('a boundary-free run of 8KB with no whitespace at all still delivers the diagnostic', async () => {
    // This pinned an accepted COST, not an invariant: the whole retained window was one
    // whitespace-free token, `^\S+` ate all of it and the ring emptied, and the user got a
    // banner with no stderr section. The cost stopped existing when the ring started
    // cutting on RECORD boundaries only - there is no boundary here, so there is no cut,
    // and a run kept from its head keeps every anchor attached to what is retained.
    const { ring, banner } = await driveChildStderr('y'.repeat(9000) + 'GLUED-ON-ERROR');
    expect(ring).toContain('GLUED-ON-ERROR');
    expect(banner).toContain('GLUED-ON-ERROR');
    expect(banner).toContain('connection_close');
  }, 20000);

  it('KNOWN POSITIVE: the scrubber needs its ANCHOR, so an anchorless secret is invisible', () => {
    // The premise the rows below rest on. `redactSecrets` masks `Bearer <token>` because of
    // the word `Bearer`, not because of anything in the token - so a cut that damages the
    // ANCHOR is just as much a disclosure as a cut that damages the secret, and dropping
    // the leading non-whitespace run removes the anchor rather than the secret.
    expect(redactSecrets(HEX)).toBe(HEX);
    expect(redactSecrets(`Bearer ${HEX}`)).toContain('[redacted]');
    expect(redactSecrets(`earer ${HEX}`)).toContain(HEX);
    expect(redactSecrets('api_key = hunter2hunter2')).toContain('[redacted]');
    expect(redactSecrets('_key = hunter2hunter2')).toContain('hunter2hunter2');
  });

  // The scrubber's anchor is not always attached to its secret: `Bearer`, `Authorization:`
  // and `api_key =` all keep it in a separate whitespace-delimited word. A ring cut landing
  // inside the ANCHOR therefore left the secret WHOLE and merely un-anchored, and the
  // no-boundary fallback then dropped the mangled anchor and kept the secret. All four rows
  // below reached the banner intact before the scrub moved to the collection site.
  for (const [label, head, offset, secret] of [
    ['inside "Bearer"', `Bearer ${HEX}`, 2, HEX],
    ['inside "api_key"', 'api_key = hunter2hunter2', 3, 'hunter2hunter2'],
    ['at the "api_key = " separator', 'api_key = hunter2hunter2', 7, 'hunter2hunter2'],
    ['inside "Authorization"', `Authorization: ${HEX}`, 4, HEX],
    // Already safe before the fix, and kept as the contrast: this shape puts the anchor and
    // the secret in ONE whitespace-free run, so dropping that run took the secret with it.
    ['inside "password=" (anchor and secret in one run)', 'password=SuperSecret99', 2, 'SuperSecret99'],
  ] as const) {
    it(`a ring cut ${label} leaves no anchorless secret behind`, async () => {
      const { ring, banner } = await driveChildStderr(anchorCutPayload(head, offset));
      expect(redactSecrets(ring)).not.toContain(secret);
      expect(banner).not.toContain(secret);
      // Known positive in the SAME payload: the whole `sk-ant-` keys did redact, so a pass
      // here is the anchor being preserved and not the scrubber being absent.
      expect(banner).toContain('[redacted]');
    }, 20000);
  }

  it('a single record larger than the whole ring still delivers a diagnostic', async () => {
    // A 21KB minified stack frame, JSON config echo or base64 dump terminated by one `\n`
    // leaves the retained window with its only boundary at the very last character, so
    // `slice(boundary + 1)` returned '' and the banner lost its stderr section entirely -
    // a diagnostic main delivered. Measured before: ringLen=0. Main: 8192 with the error.
    //
    // PREMISE CHANGED (#1023 audit HIGH-1/HIGH-2 fix): this used to assert the ring is
    // EXACTLY `RING_MAX`, which required cutting the record's head off at character
    // 12809. That cut is the disclosure path this whole file exists for - `redactSecrets`
    // cannot mask what has lost its anchor - and it is not made safe by scrubbing first,
    // because a scrub applied to text the child is still writing orphans the remainder.
    // So the record is retained WHOLE, bounded by `PENDING_MAX`, and the assertion that
    // matters is unchanged: the real error reaches the user.
    const payload = `${'z'.repeat(20000)} THE-REAL-ERROR${'z'.repeat(1000)}\n`;
    const { ring, banner } = await driveChildStderr(payload);
    expect(ring.length).toBeGreaterThan(RING_MAX);
    expect(ring.length).toBeLessThanOrEqual(PENDING_MAX);
    expect(ring).toContain('THE-REAL-ERROR');
    expect(banner).toContain('Agent stderr:');
    expect(banner).toContain('THE-REAL-ERROR');
  }, 20000);

  it('a credential split across two stderr chunks is not orphaned by the scrub', async () => {
    // The hazard a collection-site scrub introduces. Scrubbing the buffer the instant it
    // overflows masks the half of a credential that has arrived, replacing its ANCHOR with
    // `[redacted]`, and the half arriving in the NEXT chunk is then unmatchable by any
    // later scrub. Measured that way: 51 characters of this key reached the banner.
    //
    // PREMISE CHANGED (#1023 audit HIGH-1/HIGH-2 fix): the two ring assertions used to be
    // written on the RAW ring, which only passed because the ring was pre-scrubbed at the
    // collection site. It no longer is - a resumable scrub does not exist, so the ring
    // holds raw text and every consumer scrubs at read. The assertion is therefore made
    // where the guarantee actually lives: on the SCRUBBED ring, which is what
    // `buildStderrTail` and `AgentStartupError` hand the user.
    const split = 24;
    const first = `${'pad line\n'.repeat(950)}token ${SECRET.slice(0, split)}`;
    const { ring, banner } = await driveSplitChildStderr(first, `${SECRET.slice(split)} trailing diagnostic\n`);

    expect(redactSecrets(ring)).not.toContain(SECRET.slice(split));
    expect(banner).not.toContain(SECRET.slice(split));
    // Known positives: the credential was masked as a WHOLE one rather than lost, and the
    // diagnostic that arrived with it still reached the user.
    expect(redactSecrets(ring)).not.toContain(SECRET);
    expect(banner).toContain('[redacted]');
    expect(banner).toContain('trailing diagnostic');
  }, 30000);

  it('an oversized Bearer token is scrubbed rather than held back raw past its anchor', async () => {
    // A single 9KB `Bearer` value is one boundary-free run that overflows the budget on
    // its own, and the anchor that makes it redactable is the word sitting in FRONT of
    // it. Any cut that trims this to the budget takes the anchor and leaves the value,
    // which is the disclosure this file exists for - so the run is retained from its
    // head instead, anchor included, and the read-time scrub still masks the whole
    // thing. This shape is why the budget is not a hard cap.
    const token = 'Zk9'.repeat(3000);
    const payload = `${'q '.repeat(50)}Bearer ${token}`;
    if (payload.length <= RING_MAX) throw new Error('the payload must overflow the ring');
    if (/[\r\n]/.test(payload.slice(-RING_MAX))) throw new Error('the window must have no boundary');
    if (!payload.slice(-RING_MAX).startsWith('Zk9') && !payload.slice(-RING_MAX).startsWith('k9Z')) {
      throw new Error('the window must start INSIDE the token, past the Bearer anchor');
    }

    const { ring, banner } = await driveChildStderr(payload);
    expect(redactSecrets(ring)).not.toContain(token.slice(-1000));
    expect(banner).not.toContain(token.slice(-1000));
    // Known positive: this value IS redactable when its anchor survives, so a pass here is
    // the anchor being kept rather than the scrubber having no rule for it.
    expect(redactSecrets(`Bearer ${token}`)).toContain('[redacted]');
  }, 20000);

  it('cuts at a leading \\r rather than a later \\n, keeping the records in between', async () => {
    // Taking whichever boundary comes FIRST is what makes bare-CR output safe, and it
    // is also the cheaper cut: the `\n`-only search discarded everything up to the
    // newline, which measured 2801 characters of real diagnostics on this payload.
    const head = `${SECRET}\r${'diag line one '.repeat(200)}\n${'diag line two '.repeat(200)}`;
    const pad = 'p'.repeat(RING_MAX - (SECRET.length - 6) - (head.length - SECRET.length));
    const { ring } = await driveChildStderr('lead '.repeat(100) + head + pad);
    expect(ring.startsWith(SECRET.slice(6))).toBe(false);
    expect(ring).toContain('diag line one');
  }, 20000);
  // ─── The audit of the FIRST attempt at this fix ────────────────────────────────
  //
  // #1023 originally scrubbed at the COLLECTION site - `redactSecrets` on the buffer
  // the moment it overflowed, before the cap - on the argument that a credential masked
  // while whole cannot be cut in half afterwards. The argument is sound and the code was
  // not, because `redactSecrets` is not RESUMABLE: the buffer at overflow time is a
  // PREFIX of a stream the child is still writing, masking a partial credential replaces
  // its anchor with `[redacted]`, and the continuation arriving in the next chunk is then
  // anchorless and invisible to every later scrub - including the read-time scrub in
  // `buildStderrTail`, which is the only thing between the ring and the transcript.
  //
  // Both rows below were reproduced leaking through the real path before the ring moved
  // to complete records. They are the regression tests for that.

  it('a partial credential is never scrubbed at the collection site (long-run straddle)', async () => {
    // HIGH-1. The first attempt held back the trailing non-whitespace run from its scrub
    // so a straddled credential could be completed by the next chunk - but bounded that
    // carry at 256 characters, and minified JSON on stderr is ONE long run. Over the
    // bound the carry was disabled and the partial was masked anyway. Measured through
    // this exact path: `"key":"[redacted]` followed by 51 plaintext characters of the
    // key, in the banner.
    const split = 24;
    // Known positives for the shape: the partial IS masked while its prefix is intact,
    // and the remainder alone is invisible - which is what makes an orphan a leak.
    expect(redactSecrets(`{"key":"${SECRET.slice(0, split)}`)).toContain('[redacted]');
    expect(redactSecrets(SECRET.slice(split))).toBe(SECRET.slice(split));

    const run = `{"cfg":"${'A'.repeat(300)}","key":"${SECRET.slice(0, split)}`;
    if ((/\S*$/.exec(run)?.[0].length ?? 0) <= 256) throw new Error('the run must exceed any plausible carry bound');
    const first = `${'pad line here\n'.repeat(700)}${run}`;
    const { ring, banner } = await driveSplitChildStderr(first, `${SECRET.slice(split)}","tail":"REAL-DIAGNOSTIC"}\n`);

    expect(redactSecrets(ring)).not.toContain(SECRET.slice(split));
    expect(banner).not.toContain(SECRET.slice(split));
    // Known positives in the same banner: the key was masked as a WHOLE credential, and
    // the diagnostic that arrived with it still reached the user.
    expect(banner).toContain('[redacted]');
    expect(banner).toContain('REAL-DIAGNOSTIC');
  }, 30000);

  it('a partial credential is never scrubbed at the collection site (PEM straddle)', async () => {
    // HIGH-2. The carry bound is irrelevant here - PEM lines are 64 characters - and no
    // carry could have helped, because the credential spans RECORDS. The PEM rule has an
    // end-of-input alternative, so an unterminated block matches BEGIN-to-end-of-buffer:
    // the collection-site scrub ate the `-----BEGIN PRIVATE KEY-----` anchor while the
    // body was still arriving, and everything after it was never masked again. Measured
    // through this path: the whole key body AND its `-----END PRIVATE KEY-----` line in
    // the banner. Needs only a multi-KB key across more than one write.
    const body = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj';
    const pemHead = `-----BEGIN PRIVATE KEY-----\n${`${body}\n`.repeat(6)}`;
    const pemTail = `${`${body}\n`.repeat(6)}-----END PRIVATE KEY-----\n`;
    // Known positives for the shape: a WHOLE block is masked, and a block that has lost
    // its BEGIN line is invisible to the scrubber.
    expect(redactSecrets(pemHead + pemTail)).not.toContain(body);
    expect(redactSecrets(pemTail)).toContain(body);

    const first = `${'pad line here\n'.repeat(700)}${pemHead}`;
    const { ring, banner } = await driveSplitChildStderr(first, `${pemTail}REAL-DIAGNOSTIC\n`);

    expect(redactSecrets(ring)).not.toContain(body);
    expect(banner).not.toContain(body);
    expect(banner).not.toContain('-----END PRIVATE KEY-----');
    expect(banner).toContain('[redacted]');
    expect(banner).toContain('REAL-DIAGNOSTIC');
  }, 30000);

  it('an agent that never emits a newline cannot grow the ring without bound', async () => {
    // The other half of "never cut a partial record": a partial that is never completed
    // would otherwise be retained forever. At `PENDING_MAX` the fragment is FROZEN as a
    // final record and the stream is discarded until the next real boundary, so the ring
    // resumes at a point that cannot be mid-credential - the alternative, trimming the
    // fragment's head, is the anchor cut this whole file is about.
    //
    // Generated INSIDE the child rather than passed through the environment: a 33KB
    // environment variable is over the win32 limit.
    const client = new ProcessAcpClient(
      async () => {
        const child = spawn(
          process.execPath,
          [
            '-e',
            "process.stderr.write('x'.repeat(33000) + ' token sk-ant-api03-AbCdEfGhIjK');" +
              "setTimeout(() => process.stderr.write('LmNoPqRsTuVwXyZ0123456789 orphan\\nREAL-DIAGNOSTIC\\n'), 150);",
          ],
          { stdio: 'pipe' }
        );
        spawned.push(child);
        return child;
      },
      { backend: 'probe', handlers: {} as never }
    );
    await client.start().catch(() => undefined);
    await new Promise((r) => setTimeout(r, 600));
    const ring = (client as unknown as { stderrBuffer: string }).stderrBuffer;

    expect(ring.length).toBeLessThanOrEqual(PENDING_MAX);
    // The continuation of the frozen fragment is DISCARDED, not retained anchorless.
    expect(ring).not.toContain('LmNoPqRsTuVwXyZ0123456789');
    // And the ring resumes: the diagnostic written after the flood still reaches the user.
    expect(ring).toContain('REAL-DIAGNOSTIC');
  }, 30000);
});
