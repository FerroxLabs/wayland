import { describe, expect, it } from 'vitest';

import signingExec = require('../../scripts/signingExec.js');

type Classification = {
  kind: 'accepted' | 'rejected' | 'transient';
  status: string | null;
  submissionId: string | null;
  stalled: boolean;
};

const { parseNotarytoolOutput, classifyNotarizationOutcome, isNotarizationFatal } = signingExec as {
  parseNotarytoolOutput: (output: string) => { submissionId: string | null; status: string | null };
  classifyNotarizationOutcome: (p: { output?: string; elapsedMs?: number; waitTimeoutMs?: number }) => Classification;
  isNotarizationFatal: (p: { kind: string; hasIdentity: boolean }) => boolean;
};

const SUBMISSION_ID = '2efe2717-52ef-43a5-96dc-0797e4ca1041';

/** A real `xcrun notarytool submit --wait` transcript, verdict parameterised. */
function transcript(status: string): string {
  return [
    'Conducting pre-submission checks for Wayland-notarize.zip and initiating connection to the Apple notary service...',
    'Submission ID received',
    `  id: ${SUBMISSION_ID}`,
    'Upload progress: 100.00% (182 MB of 182 MB)',
    'Successfully uploaded file',
    `  id: ${SUBMISSION_ID}`,
    '  path: /tmp/Wayland-notarize.zip',
    'Waiting for processing to complete.',
    'Current status: In Progress....',
    'Processing complete',
    `  id: ${SUBMISSION_ID}`,
    `  status: ${status}`,
    '',
  ].join('\n');
}

// notarytool runs with `--timeout 15m`.
const WAIT_MS = 15 * 60_000;

describe('parseNotarytoolOutput', () => {
  it('extracts the submission id and the FINAL status, not the interim one', () => {
    // Without the submission id, `xcrun notarytool log <id>` cannot be run and
    // Apple's actual reason is unrecoverable after the build ends.
    expect(parseNotarytoolOutput(transcript('Invalid'))).toEqual({
      submissionId: SUBMISSION_ID,
      status: 'Invalid',
    });
  });

  it('returns nulls when notarytool never got far enough to print a verdict', () => {
    expect(parseNotarytoolOutput('Error: HTTP status code: 503. Service Unavailable')).toEqual({
      submissionId: null,
      status: null,
    });
  });
});

describe('classifyNotarizationOutcome', () => {
  it('classifies `status: Invalid` as a REJECTION even though notarytool exits 0', () => {
    // This is the v0.12.0 failure: notarytool exits 0 on a rejection, so an
    // exit-code reading saw success and only the later stapler error surfaced.
    const outcome = classifyNotarizationOutcome({
      output: transcript('Invalid'),
      elapsedMs: 90_000,
      waitTimeoutMs: WAIT_MS,
    });
    expect(outcome.kind).toBe('rejected');
    expect(outcome.submissionId).toBe(SUBMISSION_ID);
    expect(outcome.status).toBe('Invalid');
  });

  it('classifies `status: Rejected` as a REJECTION', () => {
    expect(classifyNotarizationOutcome({ output: transcript('Rejected') }).kind).toBe('rejected');
  });

  it('classifies `status: Accepted` as accepted', () => {
    expect(classifyNotarizationOutcome({ output: transcript('Accepted') }).kind).toBe('accepted');
  });

  it('classifies a fast connection blip as TRANSIENT, so the retry policy still applies', () => {
    const outcome = classifyNotarizationOutcome({
      output: 'Error: NSURLErrorDomain Code=-1001 "The request timed out."',
      elapsedMs: 4_000,
      waitTimeoutMs: WAIT_MS,
    });
    expect(outcome.kind).toBe('transient');
    expect(outcome.stalled).toBe(false);
  });

  it('classifies a burned-window stall as TRANSIENT and flags it stalled', () => {
    // Apple's queue stalling must keep degrading with a warning — that is the
    // deliberate existing behaviour and must not become fatal.
    const outcome = classifyNotarizationOutcome({
      output: 'Waiting for processing to complete.\nCurrent status: In Progress....',
      elapsedMs: 14 * 60_000,
      waitTimeoutMs: WAIT_MS,
    });
    expect(outcome.kind).toBe('transient');
    expect(outcome.stalled).toBe(true);
  });
});

describe('isNotarizationFatal', () => {
  it('FAILS the build on a rejection when a Developer ID identity is present', () => {
    expect(isNotarizationFatal({ kind: 'rejected', hasIdentity: true })).toBe(true);
  });

  it('stays non-fatal on a rejection with NO identity (local / dev / PR builds)', () => {
    expect(isNotarizationFatal({ kind: 'rejected', hasIdentity: false })).toBe(false);
  });

  it('stays non-fatal for a transient failure even with an identity', () => {
    expect(isNotarizationFatal({ kind: 'transient', hasIdentity: true })).toBe(false);
    expect(isNotarizationFatal({ kind: 'accepted', hasIdentity: true })).toBe(false);
  });
});
