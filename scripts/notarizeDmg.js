const { execSync } = require('child_process');
const path = require('path');
const { runBounded, isNotaryStall, markNotaryStalled, notaryStallSeen } = require('./signingExec');

/**
 * afterAllArtifactBuild — notarize + staple the .dmg artifacts.
 *
 * `afterSign` notarizes and staples the .app. But the .app and the .dmg carry
 * SEPARATE notarization tickets, and an un-notarized dmg downloaded via a
 * browser (which sets the quarantine bit) is rejected by Gatekeeper as
 * "<app> is damaged and can't be opened" — even when the app inside is
 * perfectly notarized. That shipped once (rc.2.1). This hook closes the gap so
 * the disk image the user actually double-clicks is itself notarized.
 *
 * Mirrors afterSign's contract: failure is non-fatal and loud. The release
 * smoke gate (`scripts/release-smoke-macos.sh`) is the hard stop that refuses
 * to publish an unstapled dmg, so a transient notary stall degrades to "gate
 * blocks publish" rather than "broken dmg silently ships".
 *
 * @param {{ artifactPaths: string[], outDir: string }} buildResult
 */
exports.default = async function notarizeDmg(buildResult) {
  const dmgs = (buildResult.artifactPaths || []).filter((p) => p.endsWith('.dmg'));
  if (dmgs.length === 0) {
    return;
  }

  const appleId = process.env.appleId;
  const appleIdPassword = process.env.appleIdPassword;
  const teamId = process.env.teamId;
  if (!appleId || !appleIdPassword || !teamId) {
    console.log('notarizeDmg: skipping — missing Apple ID credentials');
    return;
  }

  // The dmg must be code-signed with Developer ID BEFORE notarizing. A merely
  // notarized+stapled-but-unsigned dmg is still rejected by Gatekeeper as
  // "no usable signature" (proven on rc.2.1) — stapling a ticket is not enough,
  // spctl requires a primary signature too. CI passes the identity as CSC_NAME.
  const identity = process.env.CSC_NAME || process.env.identity;
  if (!identity) {
    console.log('notarizeDmg: skipping — no signing identity (CSC_NAME) available');
    return;
  }

  for (const dmg of dmgs) {
    const name = path.basename(dmg);
    try {
      console.log(`notarizeDmg: code-signing ${name} with Developer ID (no timestamp)…`);
      signDmgNoTimestamp(identity, dmg);

      // The notary submit + staple both contact Apple over the network and can
      // hit transient stalls — e.g. NSURLErrorDomain Code=-1001 "request timed
      // out" — that have nothing to do with the artifact or our credentials.
      // Without a retry a single Apple hiccup ships the dmg signed-but-unstapled
      // and the smoke gate blocks the entire release (v0.9.8 arm64 hit exactly
      // this). Retry the network-bound steps with backoff before degrading.
      await notarizeAndStapleWithRetry({ dmg, name, appleId, appleIdPassword, teamId });

      // Stapling rewrites the dmg bytes, so the updater metadata that referenced
      // the pre-staple dmg is now stale. The manifest CANNOT be repaired here:
      // electron-builder writes latest-mac.yml in its final publish-task phase,
      // which runs AFTER this afterAllArtifactBuild hook returns — the file does
      // not exist on disk yet (#109). Repair runs as a post-build workflow step
      // (scripts/repair-mac-manifest.mjs) once the yml is on disk; the release
      // smoke gate (verify-update-metadata.mjs) then confirms it.
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`::warning title=DMG notarization not completed::${name}: ${message}`);
      console.warn(
        `⚠️ ${name} ships signed-but-unstapled. The release smoke gate will block publishing it — re-run once Apple's notary recovers.`
      );
    }
  }
};

/** Sleep without blocking the event loop (the hook is async). */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * notarytool's own `--wait` timeout. A submission that burns most of this window
 * is Apple's notary queue stalling, not a transient connection blip. 15 min
 * comfortably catches a healthy submission (those return in 1-5 min) while
 * keeping the stall budget small: app-notarize + dmg-notarize are two waits in
 * series, so a 20m window let a stall stack toward the 120-min job cap.
 */
const NOTARY_WAIT_TIMEOUT_MIN = 15;

/**
 * Decide whether a failed dmg-notarization attempt is worth retrying.
 *
 * The retry exists for transient connection blips (NSURLErrorDomain -1001), which
 * fail FAST — the next attempt usually connects. But when Apple's notary queue is
 * slow, `notarytool --wait --timeout` burns the FULL window before giving up, and
 * retrying just spends another full window against the same stalled queue
 * (observed: 3 windows of dead wait wedging a single release). So treat an
 * attempt that ran most of the wait window as terminal: stop retrying and degrade
 * to signed-but-unstapled, where the release smoke gate makes the publish call.
 *
 * @param {{ attempt: number, maxAttempts: number, elapsedMs: number, waitTimeoutMs: number }} p
 * @returns {boolean} true to retry, false to give up now
 */
function shouldRetryNotarization({ attempt, maxAttempts, elapsedMs, waitTimeoutMs }) {
  if (attempt >= maxAttempts) {
    return false;
  }
  // A near-full-window failure is a slow queue, not a blip -> retrying won't help.
  if (isNotaryStall(elapsedMs, waitTimeoutMs)) {
    return false;
  }
  return true;
}

/**
 * Submit the dmg to the Apple notary service and staple the ticket, retrying
 * the network-bound pair only on FAST transient failures. Apple's notary
 * endpoint intermittently returns connection timeouts (-1001) that fail quickly;
 * a one-off blip should not block a release, so those retry. A failure that
 * burned the full `--timeout` window is a stalled queue, not a blip — retrying
 * there just wastes another window, so it degrades immediately. Throws after
 * giving up, so the caller still degrades to "signed-but-unstapled" and the
 * smoke gate makes the final call.
 */
async function notarizeAndStapleWithRetry({ dmg, name, appleId, appleIdPassword, teamId }) {
  // If the .app notarize (afterSign) just hit a stall, the .dmg submission lands
  // on the SAME slow queue seconds later — don't re-burn three windows
  // rediscovering it; take one shot in case it cleared, then degrade.
  const maxAttempts = notaryStallSeen() ? 1 : 3;
  if (maxAttempts === 1) {
    console.warn(`notarizeDmg: ${name} — a prior notarize hit a stalled Apple queue; single attempt then degrade.`);
  }
  const backoffMs = 60000;
  const waitTimeoutMs = NOTARY_WAIT_TIMEOUT_MIN * 60000;
  const submitCmd = [
    'xcrun notarytool submit',
    `"${dmg}"`,
    `--apple-id "${appleId}"`,
    `--team-id "${teamId}"`,
    '--password "$NOTARYTOOL_PWD"',
    '--wait',
    `--timeout ${NOTARY_WAIT_TIMEOUT_MIN}m`,
  ].join(' ');

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const startedAt = Date.now();
    try {
      console.log(`notarizeDmg: submitting ${name} to Apple notary service (attempt ${attempt}/${maxAttempts})…`);
      execSync(submitCmd, {
        stdio: 'inherit',
        env: { ...process.env, NOTARYTOOL_PWD: appleIdPassword },
      });

      // Staple the ticket so Gatekeeper validates the dmg offline. `stapler`
      // contacts Apple's ticket servers with no client timeout, so bound it too.
      if (!runBounded('xcrun', ['stapler', 'staple', dmg], { timeoutMs: 300000, label: `notarizeDmg: stapling ${name}` })) {
        throw new Error(`stapler staple failed or timed out for ${name}`);
      }
      console.log(`notarizeDmg: stapled ${name}`);
      return;
    } catch (error) {
      lastError = error;
      const elapsedMs = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : String(error);
      // A near-full-window failure is a stalled queue — record it so any later
      // notarize call short-circuits, and stop retrying here.
      const stalled = isNotaryStall(elapsedMs, waitTimeoutMs);
      if (stalled) {
        markNotaryStalled();
      }
      if (!shouldRetryNotarization({ attempt, maxAttempts, elapsedMs, waitTimeoutMs })) {
        if (attempt < maxAttempts && stalled) {
          console.warn(
            `notarizeDmg: ${name} attempt ${attempt} ran ${Math.round(elapsedMs / 60000)}m before failing — Apple's notary queue is stalled, not a transient blip. Not retrying; degrading to signed-but-unstapled (the smoke gate blocks publish).`
          );
        }
        break;
      }
      console.warn(
        `notarizeDmg: ${name} attempt ${attempt}/${maxAttempts} failed fast (${message}); retrying in ${backoffMs / 1000}s…`
      );
      await delay(backoffMs);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Code-sign the dmg with Developer ID but WITHOUT a secure timestamp.
 *
 * The dmg does NOT need its own secure timestamp: it still carries a Developer
 * ID signature (satisfying Gatekeeper's "must be signed" requirement), and
 * notarization — whose stapled ticket IS Apple-timestamped — is what makes
 * Gatekeeper accept the quarantined dmg. Proven end-to-end locally with the real
 * Ferrox cert: `--timestamp=none` dmg -> notarytool **Accepted** -> stapled ->
 * `spctl` **accepted (source=Notarized Developer ID)** on a quarantined copy.
 * `--timestamp=none` also drops an unnecessary Apple TSA round-trip.
 *
 * NOTE on the original v0.9.7 "codesign hang": it was NOT the Apple TSA. The
 * build's temp keychain auto-locks at the 300s default, and the dmg is signed
 * minutes after the app — past the lock — so codesign hung waiting for an
 * unlock prompt that never comes in CI. The real fix is
 * `security set-keychain-settings -t <long>` in the workflow's keychain setup;
 * codesign needs the unlocked keychain regardless of the timestamp flag.
 *
 * Still spawned via `runBounded` (no shell, hard timeout) as cheap defense, and
 * `--verify --strict` confirms the signature before we trust it. A failure here
 * throws so the caller degrades to "signed-but-unstapled" and the smoke gate
 * blocks publishing.
 */
function signDmgNoTimestamp(identity, dmg) {
  const name = path.basename(dmg);
  if (
    !runBounded('codesign', ['--force', '--timestamp=none', '--sign', identity, dmg], {
      timeoutMs: 60000,
      label: `notarizeDmg: signing ${name}`,
    })
  ) {
    throw new Error(`codesign (no-timestamp) failed for ${name}`);
  }
  if (
    !runBounded('codesign', ['--verify', '--strict', dmg], {
      timeoutMs: 60000,
      label: `notarizeDmg: verifying ${name}`,
    })
  ) {
    throw new Error(`codesign --verify failed for ${name}`);
  }
}

// Exported for unit testing the retry policy without spawning notarytool.
exports.shouldRetryNotarization = shouldRetryNotarization;

