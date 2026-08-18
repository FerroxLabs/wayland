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
 * Fixed at the ring rather than at the banner: drop the partial leading record, so
 * no half-token ever exists for the scrubber to miss.
 *
 * A record boundary is `\r` as well as `\n`, and a ring with NO boundary anywhere
 * still has to drop its leading run of non-whitespace. The first cut of this fix
 * handled only `\n` and kept the entire 8KB when there was none, which left the
 * half-token exactly where it started - reproduced live, `LEAK=true`, on a
 * space-separated config echo and on bare-CR output. So both paths are exercised
 * here WITH a credential in the payload, not just for diagnostic survival.
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
  for (const [label, sep] of [
    ['no newline anywhere, space-separated', ' '],
    ['bare carriage returns, no newline', '\r'],
  ] as const) {
    describe(`a ring cut mid-credential with ${label}`, () => {
      it('leaves no half-token in the ring itself', async () => {
        const { ring } = await driveChildStderr(payloadCutting(6, sep));
        expect(ring.length).toBeLessThanOrEqual(RING_MAX);
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
    // 9KB of unbroken text has no record boundary to cut at. Dropping the leading
    // run of non-whitespace costs one token, so the real error still lands on screen.
    const { ring, banner } = await driveChildStderr('y'.repeat(9000) + ' THE-REAL-ERROR');
    expect(ring).toContain('THE-REAL-ERROR');
    expect(banner).toContain('THE-REAL-ERROR');
  }, 20000);

  it('a boundary-free run of 8KB with no whitespace at all still delivers the diagnostic', async () => {
    // This pinned an accepted COST, not an invariant: the whole retained window was one
    // whitespace-free token, `^\S+` ate all of it and the ring emptied, and the user got a
    // banner with no stderr section. The cost stopped existing when the scrub moved to the
    // collection site - every credential in the window is already `[redacted]` by the time
    // the cut is chosen, so keeping the window is safe and `cutRing || sliced` keeps it.
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
    const payload = `${'z'.repeat(20000)} THE-REAL-ERROR${'z'.repeat(1000)}\n`;
    const { ring, banner } = await driveChildStderr(payload);
    expect(ring.length).toBe(RING_MAX);
    expect(ring).toContain('THE-REAL-ERROR');
    expect(banner).toContain('Agent stderr:');
    expect(banner).toContain('THE-REAL-ERROR');
  }, 20000);

  it('a credential split across two stderr chunks is not orphaned by the scrub', async () => {
    // The hazard the collection-site scrub introduces, and the reason it holds back the
    // ring's trailing non-whitespace run. Scrubbing the buffer the instant it overflows
    // would mask the half of a credential that has arrived, replacing its ANCHOR with
    // `[redacted]`, and the half arriving in the NEXT chunk would then be unmatchable by
    // any later scrub. Measured that way: 51 characters of this key reached the banner.
    const split = 24;
    const first = `${'pad line\n'.repeat(950)}token ${SECRET.slice(0, split)}`;
    const { ring, banner } = await driveSplitChildStderr(first, `${SECRET.slice(split)} trailing diagnostic\n`);

    expect(ring).not.toContain(SECRET.slice(split));
    expect(banner).not.toContain(SECRET.slice(split));
    // Known positives: the credential was masked as a WHOLE one rather than lost, and the
    // diagnostic that arrived with it still reached the user.
    expect(ring).not.toContain(SECRET);
    expect(banner).toContain('[redacted]');
    expect(banner).toContain('trailing diagnostic');
  }, 30000);

  it('an oversized Bearer token is scrubbed rather than held back raw past its anchor', async () => {
    // The bound on the chunk-split carry. The carry leaves the ring's trailing
    // non-whitespace run raw so a credential straddling two chunks is not half-masked. Left
    // UNBOUNDED that backfires: a single 9KB `Bearer` value is one non-whitespace run, so the
    // whole thing would be held back raw, the cap would land inside it, and the `Bearer`
    // anchor sitting just before it would be cut away - leaving exactly the anchorless
    // remainder the carry exists to prevent. A run longer than a credential prefix is a
    // value, not a straddle, so it is scrubbed normally.
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
});
