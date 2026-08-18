/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { describe, it, expect } from 'vitest';

import { buildCrashMessage } from '../../../../../src/process/acp/session/AcpSession';
import {
  CRASH_MARKER_PROCESS_EXIT,
  CRASH_MARKER_TRANSPORT_CLOSE,
} from '../../../../../src/process/acp/session/crashMarkers';
import type { AgentDisconnectReason, DisconnectInfo } from '../../../../../src/process/acp/infra/IAcpClient';

function info(over: Partial<DisconnectInfo> = {}): DisconnectInfo {
  return {
    reason: 'process_exit',
    exitCode: null,
    signal: null,
    stderr: '',
    unexpectedDuringPrompt: false,
    ...over,
  };
}

const ALL_REASONS: AgentDisconnectReason[] = ['process_exit', 'process_close', 'pipe_close', 'connection_close'];

describe('buildCrashMessage', () => {
  it('returns null when info is undefined', () => {
    expect(buildCrashMessage(undefined)).toBeNull();
  });

  describe('an OBSERVED process exit still says so', () => {
    it('exit code', () => {
      expect(buildCrashMessage(info({ reason: 'process_exit', exitCode: 1 }))).toBe(
        'process exited unexpectedly (code: 1, signal: none) [reason: process_exit]'
      );
    });

    it('signal', () => {
      expect(buildCrashMessage(info({ reason: 'process_exit', signal: 'SIGSEGV' }))).toBe(
        'process exited unexpectedly (code: unknown, signal: SIGSEGV) [reason: process_exit]'
      );
    });

    it('exit code 0 counts as observed', () => {
      const msg = buildCrashMessage(info({ reason: 'process_close', exitCode: 0 }))!;
      expect(msg).toContain(CRASH_MARKER_PROCESS_EXIT);
      expect(msg).toContain('code: 0');
      expect(msg).not.toContain(CRASH_MARKER_TRANSPORT_CLOSE);
    });

    it('a signal seen on a transport-reason disconnect is still an exit', () => {
      const msg = buildCrashMessage(info({ reason: 'pipe_close', signal: 'SIGILL' }))!;
      expect(msg).toContain('signal: SIGILL');
      expect(msg).toContain('[reason: pipe_close]');
    });
  });

  describe('#1020 an UNOBSERVED exit must not be asserted', () => {
    // The two reasons that can carry null/null in practice are the transport
    // ones, but the rule is about the evidence, not the reason - so all four are
    // checked.
    for (const reason of ALL_REASONS) {
      it(`${reason} with no code and no signal reports a transport drop`, () => {
        const msg = buildCrashMessage(info({ reason }))!;
        expect(msg).toContain(CRASH_MARKER_TRANSPORT_CLOSE);
        expect(msg).toContain(`[reason: ${reason}]`);
        // The defect: these literals were the entire old message.
        expect(msg).not.toContain(CRASH_MARKER_PROCESS_EXIT);
        expect(msg).not.toContain('code: unknown');
        expect(msg).not.toContain('signal: none');
        // And it must say the process death is unproven WITHOUT reassuring the
        // user that the child is probably alive: that reassurance was measured
        // false for 6 of 20 real crashes (#1023).
        expect(msg).toContain('we cannot tell whether the agent crashed or the connection dropped');
        expect(msg).not.toContain('may still be running');
        expect(msg).not.toContain('not a confirmed crash');
      });
    }
  });

  describe('prompt in flight vs idle', () => {
    it('tells the user the turn did not land when a prompt was in flight', () => {
      const msg = buildCrashMessage(info({ reason: 'connection_close', unexpectedDuringPrompt: true }))!;
      expect(msg).toContain('lost before it could complete');
      expect(msg).toContain('was not resent automatically');
    });

    // #1023: `PromptExecutor.handlePromptError` refuses to replay this turn because a
    // dead pipe can swallow the `tool_call` that would say what already ran, so the
    // turn may have already executed an approved `rm`. The copy must not instruct the
    // human to do by hand the thing the code declines to do for them.
    it('warns that part of the turn may already have run instead of telling the user to resend', () => {
      const msg = buildCrashMessage(info({ reason: 'connection_close', unexpectedDuringPrompt: true }))!;
      expect(msg).toContain('The agent may already have carried out part of this message');
      expect(msg).toContain('check the result before sending it again');
      // The old copy was a bare instruction to resend.
      expect(msg).not.toContain('was not resent automatically - send it again');
    });

    it('says nothing about a lost turn when none was in flight', () => {
      const msg = buildCrashMessage(info({ reason: 'connection_close', unexpectedDuringPrompt: false }))!;
      expect(msg).not.toContain('lost before it could complete');
      expect(msg).not.toContain('was not resent automatically');
    });
  });

  describe('stderr tail', () => {
    it('surfaces the reason the agent actually gave', () => {
      const msg = buildCrashMessage(info({ reason: 'connection_close', stderr: 'Cannot find module zod/v4\n' }))!;
      expect(msg).toContain('Agent stderr:');
      expect(msg).toContain('Cannot find module zod/v4');
    });

    it('scrubs secrets through the shared redactor', () => {
      const secrets = [
        'sk-abcdefghijklmnopqrstuvwx',
        'Bearer abcdefghijklmnopqrst',
        'ghp_abcdefghijklmnopqrstuvwxyz01',
        'AKIA0123456789ABCDEF',
        'api_key = hunter2hunter2',
      ].join('\n');
      const msg = buildCrashMessage(info({ reason: 'connection_close', stderr: secrets }))!;
      expect(msg).toContain('[redacted]');
      expect(msg).not.toContain('sk-abcdefghijklmnopqrstuvwx');
      expect(msg).not.toContain('ghp_abcdefghijklmnopqrstuvwxyz01');
      expect(msg).not.toContain('AKIA0123456789ABCDEF');
      expect(msg).not.toContain('hunter2hunter2');
      // The label survives so the diagnostic still reads sensibly.
      expect(msg).toContain('api_key');
    });

    it('strips ANSI so the banner stays plain text', () => {
      const coloured = `[31mboom[0m`;
      const msg = buildCrashMessage(info({ reason: 'connection_close', stderr: coloured }))!;
      expect(msg).toContain('boom');
      expect(msg).not.toContain('');
    });

    it('bounds the tail and keeps the END of it', () => {
      const stderr = 'x'.repeat(9000) + 'THE-REAL-ERROR';
      const msg = buildCrashMessage(info({ reason: 'connection_close', stderr }))!;
      expect(msg).toContain('THE-REAL-ERROR');
      // 2048-char tail plus the head line, nowhere near the 9KB input.
      expect(msg.length).toBeLessThan(2500);
    });

    it('omits the section entirely when stderr is blank', () => {
      expect(buildCrashMessage(info({ reason: 'connection_close', stderr: '   \n\n' }))!).not.toContain('Agent stderr');
    });
  });

  describe('downstream crash detectors keep matching', () => {
    // Both banners must stay classifiable as a crash or the renderer's loading
    // state never clears (AcpAgentV2) and a teammate is never restarted
    // (TeammateManager).
    it('both markers are non-empty and distinct', () => {
      expect(CRASH_MARKER_PROCESS_EXIT).toBeTruthy();
      expect(CRASH_MARKER_TRANSPORT_CLOSE).toBeTruthy();
      expect(CRASH_MARKER_TRANSPORT_CLOSE).not.toBe(CRASH_MARKER_PROCESS_EXIT);
    });

    it('every disconnect carries exactly one marker', () => {
      for (const reason of ALL_REASONS) {
        for (const exit of [{}, { exitCode: 3 }, { signal: 'SIGTERM' }]) {
          const msg = buildCrashMessage(info({ reason, ...exit }))!;
          const hits =
            Number(msg.includes(CRASH_MARKER_PROCESS_EXIT)) + Number(msg.includes(CRASH_MARKER_TRANSPORT_CLOSE));
          expect(hits, `${reason} ${JSON.stringify(exit)}`).toBe(1);
        }
      }
    });
  });
});
