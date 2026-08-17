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

  it('a boundary-free run of 8KB with no whitespace at all empties the ring', async () => {
    // The accepted cost, pinned so it cannot drift silently: when the whole retained
    // window is a single whitespace-free token there is nothing there that separates
    // a base64 blob from a secret, so it all goes. The banner still names the reason.
    const { ring, banner } = await driveChildStderr('y'.repeat(9000) + 'GLUED-ON-ERROR');
    expect(ring).toBe('');
    expect(banner).not.toContain('GLUED-ON-ERROR');
    expect(banner).toContain('connection_close');
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
