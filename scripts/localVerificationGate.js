// Build-time only. Pure, dependency-free leaf module: no imports, no side effects.
//
// `WAYLAND_LOCAL_VERIFICATION=1` OMITS (does NOT forge) the release capability seal
// so a local `--dir` build can produce a launchable `.app` for
// `scripts/packaged-cockpit-smoke.mjs`. The seal is a release-acceptance provenance
// artifact the running app and the smoke never read — omitting it on an explicitly
// non-release build crosses no security line (nothing is spoofed or faked).
//
// Default-OFF: any other value — unset, '0', 'true' — keeps the release path (seal
// written). Only the exact string '1' flips it, so a stray truthy env value can
// never silently skip the seal on a release box. CI/release scripts never set it.

/**
 * @param {Record<string, string | undefined>} env
 * @returns {boolean} true iff env.WAYLAND_LOCAL_VERIFICATION === '1'
 */
function isLocalVerificationBuild(env) {
  return Boolean(env) && env.WAYLAND_LOCAL_VERIFICATION === '1';
}

module.exports = { isLocalVerificationBuild };
