const { execFileSync, execSync } = require('child_process');

/**
 * Run a signing / notarization CLI with a HARD timeout.
 *
 * `codesign --timestamp` and `xcrun stapler staple` make network calls to Apple
 * (timestamp.apple.com / the ticket-distribution servers) and have NO
 * client-side timeout — when an Apple server stalls they block forever and wedge
 * the whole build. Three consecutive v0.9.7 release runs hung 90-160 min at
 * exactly `codesign --timestamp` (orphaned `codesign` in the cleanup logs).
 *
 * We spawn the tool DIRECTLY via `execFileSync` (no `/bin/sh -c`) so that when
 * Node's timeout elapses, the SIGKILL lands on the real process. A string-form
 * `execSync` runs through a shell, and for a compound/forking command the kill
 * hits the shell while the tool orphans — re-introducing the exact hang. Direct
 * spawn also keeps the signing identity / paths out of a shell command string.
 *
 * Never throws — returns false on failure or timeout so callers decide how to
 * degrade. (Do NOT use this for `notarytool submit`: that needs the password
 * passed via a shell env var to keep it out of the process argv, and notarytool
 * already bounds itself with `--timeout`.)
 *
 * @param {string} file  executable, e.g. 'codesign' or 'xcrun'
 * @param {string[]} args
 * @param {{ timeoutMs: number, label: string }} opts
 * @returns {boolean} true on clean exit, false on failure/timeout
 */
function runBounded(file, args, { timeoutMs, label }) {
  try {
    execFileSync(file, args, { stdio: 'inherit', timeout: timeoutMs, killSignal: 'SIGKILL' });
    return true;
  } catch (error) {
    // On a Node sync-spawn timeout, `error.code === 'ETIMEDOUT'` is the reliable
    // signal (`error.killed` is undefined on the sync path).
    const timedOut = Boolean(error && error.code === 'ETIMEDOUT');
    const detail = timedOut
      ? `timed out after ${Math.round(timeoutMs / 1000)}s (no response — in CI usually a locked signing keychain)`
      : 'failed';
    console.warn(`${label}: ${detail}: ${error && error.message}`);
    return false;
  }
}

/**
 * Fraction of a notarize `--timeout` window past which a FAILED attempt is read
 * as a stalled Apple queue (the submission sat "In Progress" to the cap) rather
 * than a fast connection blip (NSURLErrorDomain -1001) worth retrying.
 */
const NOTARY_STALL_FRACTION = 0.8;

/**
 * Shared across afterSign (the .app ticket) and notarizeDmg (the .dmg ticket),
 * which run in the SAME electron-builder process and require() this module, so
 * the flag is shared via Node's require cache. When the app notarize burns most
 * of its window, the dmg notarize seconds later hits the SAME stalled queue —
 * this lets it skip straight to a single attempt instead of re-discovering the
 * stall over another full window. That is what keeps a notary stall from
 * stacking two ~full-window waits and approaching the 120-min job timeout.
 */
let notaryStalled = false;

/**
 * True when a notarize attempt ran >= NOTARY_STALL_FRACTION of its --timeout.
 * @param {number} elapsedMs how long the failed attempt actually ran
 * @param {number} timeoutMs the notarytool --timeout window in ms
 * @returns {boolean}
 */
function isNotaryStall(elapsedMs, timeoutMs) {
  return elapsedMs >= timeoutMs * NOTARY_STALL_FRACTION;
}

/** Record that this build hit a notary stall (see `notaryStalled`). */
function markNotaryStalled() {
  notaryStalled = true;
}

/** Whether an earlier notarize call in this build already hit a stall. */
function notaryStallSeen() {
  return notaryStalled;
}

/** Test-only: reset the shared stall flag between cases. */
function resetNotaryStalled() {
  notaryStalled = false;
}

/**
 * Apple's terminal `status:` values that mean the submission was JUDGED and
 * REFUSED. These are deterministic: the same bytes resubmitted get the same
 * verdict, so retrying or "re-running once Apple recovers" can never help.
 *
 * This distinction is the whole point of this module's notarize helpers.
 * `xcrun notarytool submit --wait` EXITS 0 on a rejection — it reports "I
 * successfully obtained a verdict", not "the verdict was good". So an
 * exit-code-only reading sees success, proceeds to `stapler`, and surfaces the
 * failure as a stapler error, which looks exactly like a transient Apple
 * outage. Eight consecutive v0.12.0 release builds went green that way while
 * Apple was returning `status: Invalid` for unsigned nested binaries.
 */
const NOTARY_REJECTED_STATUSES = new Set(['invalid', 'rejected']);

/**
 * Pull the submission id and the final status out of a notarytool transcript.
 *
 * notarytool prints the id under several sections ("Submission ID received",
 * "Successfully uploaded file", "Processing complete") — all the same uuid, so
 * the first match is taken. The final verdict is the LAST `status:` line: with
 * `--wait` the tool also prints interim `Current status: In Progress` lines.
 *
 * @param {string} output combined stdout+stderr of the notarytool run
 * @returns {{ submissionId: string | null, status: string | null }}
 */
function parseNotarytoolOutput(output) {
  const text = typeof output === 'string' ? output : '';
  const idMatch = text.match(/^[^\S\n]*id:[^\S\n]*([0-9a-fA-F-]{36})[^\S\n]*$/m);
  const statusMatches = text.match(/^[^\S\n]*status:[^\S\n]*(.+?)[^\S\n]*$/gm);
  let status = null;
  if (statusMatches && statusMatches.length > 0) {
    const last = statusMatches[statusMatches.length - 1];
    status = last.replace(/^[^\S\n]*status:[^\S\n]*/, '').trim() || null;
  }
  return { submissionId: idMatch ? idMatch[1] : null, status };
}

/**
 * Classify one notarize attempt as `accepted`, `rejected` or `transient`.
 *
 * `rejected` requires Apple to have actually returned a terminal refusal
 * status. Anything else — a connection blip, a queue stall, notarytool giving
 * up on its own `--timeout`, an output shape we don't recognise — stays
 * `transient` so the existing retry/backoff and degrade-with-a-warning
 * behaviour is preserved unchanged.
 *
 * @param {{ output?: string, elapsedMs?: number, waitTimeoutMs?: number }} p
 * @returns {{ kind: 'accepted'|'rejected'|'transient', status: string|null, submissionId: string|null, stalled: boolean }}
 */
function classifyNotarizationOutcome({ output, elapsedMs = 0, waitTimeoutMs = Number.POSITIVE_INFINITY } = {}) {
  const { submissionId, status } = parseNotarytoolOutput(output);
  const normalized = status ? status.toLowerCase() : null;
  const stalled = isNotaryStall(elapsedMs, waitTimeoutMs);
  if (normalized === 'accepted') {
    return { kind: 'accepted', status, submissionId, stalled: false };
  }
  if (normalized && NOTARY_REJECTED_STATUSES.has(normalized)) {
    return { kind: 'rejected', status, submissionId, stalled: false };
  }
  return { kind: 'transient', status, submissionId, stalled };
}

/**
 * A rejection is only a BUILD FAILURE when this build had a real Developer ID
 * identity to sign with. Local, dev and fork-PR builds have no identity, cannot
 * produce a notarizable artifact by construction, and must stay usable — they
 * keep the historic warn-and-continue behaviour.
 *
 * @param {{ kind: string, hasIdentity: boolean }} p
 * @returns {boolean}
 */
function isNotarizationFatal({ kind, hasIdentity }) {
  return kind === 'rejected' && Boolean(hasIdentity);
}

/**
 * Print Apple's own reason for a rejection (`xcrun notarytool log <id>`).
 *
 * Without this the cause is unrecoverable after the build: the notarize
 * transcript says only "Invalid", and the submission ages out of
 * `notarytool history`. Diagnosing the v0.12.0 rejection took eight release
 * attempts for exactly this reason. Best-effort and never throws — the caller
 * is already failing the build and must not lose the primary error.
 */
function printNotarizationLog({ submissionId, appleId, appleIdPassword, teamId }) {
  if (!submissionId) {
    console.error(
      'notarize: Apple returned no submission id, so the rejection log cannot be fetched. Run `xcrun notarytool history` to locate the submission.'
    );
    return;
  }
  const cmd = [
    'xcrun notarytool log',
    `"${submissionId}"`,
    `--apple-id "${appleId}"`,
    `--team-id "${teamId}"`,
    '--password "$NOTARYTOOL_PWD"',
  ].join(' ');
  try {
    const log = execSync(`${cmd} 2>&1`, {
      encoding: 'utf8',
      env: { ...process.env, NOTARYTOOL_PWD: appleIdPassword },
      timeout: 120000,
      maxBuffer: 16 * 1024 * 1024,
    });
    console.error(`notarize: Apple's rejection log for submission ${submissionId}:\n${log}`);
  } catch (error) {
    console.error(`notarize: could not fetch the rejection log for ${submissionId}: ${error && error.message}`);
  }
}

/**
 * Submit an archive to Apple's notary service and classify the outcome.
 *
 * The password is passed through the environment ($NOTARYTOOL_PWD) so it never
 * appears in a command string or a log. Output is CAPTURED (and echoed) rather
 * than inherited, because the verdict only exists in that text — see
 * NOTARY_REJECTED_STATUSES.
 *
 * @returns {{ classification: object, elapsedMs: number, failure: Error|null, output: string }}
 */
function submitToNotary({ archivePath, appleId, appleIdPassword, teamId, waitTimeoutMin }) {
  const submitCmd = [
    'xcrun notarytool submit',
    `"${archivePath}"`,
    `--apple-id "${appleId}"`,
    `--team-id "${teamId}"`,
    '--password "$NOTARYTOOL_PWD"',
    '--wait',
    `--timeout ${waitTimeoutMin}m`,
  ].join(' ');

  const startedAt = Date.now();
  let output = '';
  let failure = null;
  try {
    output = execSync(`${submitCmd} 2>&1`, {
      encoding: 'utf8',
      env: { ...process.env, NOTARYTOOL_PWD: appleIdPassword },
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (error) {
    failure = error instanceof Error ? error : new Error(String(error));
    output = `${(error && error.stdout) || ''}${(error && error.stderr) || ''}`;
  }
  const elapsedMs = Date.now() - startedAt;
  // stdio was piped to read the verdict, so re-emit the transcript ourselves.
  if (output) {
    process.stdout.write(output.endsWith('\n') ? output : `${output}\n`);
  }
  return {
    classification: classifyNotarizationOutcome({ output, elapsedMs, waitTimeoutMs: waitTimeoutMin * 60000 }),
    elapsedMs,
    failure,
    output,
  };
}

/**
 * Build the Error for a deterministic rejection, after printing Apple's reason.
 *
 * `notarizationRejected` tells the retry loop not to spend more windows on a
 * verdict that cannot change. `notarizationFatal` tells the outer handler to
 * fail the build instead of degrading to a `::warning`.
 */
function notaryRejectionError({ classification, label, appleId, appleIdPassword, teamId, hasIdentity }) {
  printNotarizationLog({ submissionId: classification.submissionId, appleId, appleIdPassword, teamId });
  const error = new Error(
    `${label}: Apple notarization returned status "${classification.status}" (submission ${classification.submissionId || 'unknown'}). ` +
      'That is a deterministic rejection of these bytes, not a transient outage — re-running produces the same verdict until the cause in the log above is fixed.'
  );
  error.notarizationRejected = true;
  error.notarizationFatal = isNotarizationFatal({ kind: classification.kind, hasIdentity });
  return error;
}

module.exports = {
  runBounded,
  NOTARY_STALL_FRACTION,
  isNotaryStall,
  markNotaryStalled,
  notaryStallSeen,
  resetNotaryStalled,
  NOTARY_REJECTED_STATUSES,
  parseNotarytoolOutput,
  classifyNotarizationOutcome,
  isNotarizationFatal,
  printNotarizationLog,
  submitToNotary,
  notaryRejectionError,
};
