const { execFileSync } = require('child_process');

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

module.exports = {
  runBounded,
  NOTARY_STALL_FRACTION,
  isNotaryStall,
  markNotaryStalled,
  notaryStallSeen,
  resetNotaryStalled,
};
