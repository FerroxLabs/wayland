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

// Every token build-with-builder.js legitimately accepts on a directory-only
// build. Anything OUTSIDE this set (a positional distributable target like `dmg`
// / `zip` / `nsis`, a negation like `--no-dir` or a `--dir false` value, or a `--`
// terminator) means the effective electron-builder target is NOT provably a bare
// directory — so we must NOT skip the seal. An allowlist (not a denylist) so no
// unenumerated distributable form can slip through.
const CANONICAL_DIR_BUILD_TOKENS = new Set([
  'auto',
  '--dir',
  '--mac',
  '--win',
  '--windows',
  '--linux',
  '--skip-vite',
  '--skip-native',
  '--pack-only',
  '--force',
]);

const ARCH_TOKEN = /^--?(x64|arm64|armv7l|ia32|universal)$/;

/**
 * True iff argv is an unambiguous directory-only build: `--dir` is present AND
 * every token is allowlisted (platform/arch/dir/build flags). Rejects electron-
 * builder forms where a distributable target could override `--dir`
 * (`--mac dmg --dir`, `--dir false`, `--dir --no-dir`, `-- --dir`).
 *
 * @param {string[]} argv
 * @returns {boolean}
 */
function isCanonicalDirOnlyArgs(argv) {
  if (!Array.isArray(argv) || !argv.includes('--dir')) return false;
  return argv.every((token) => CANONICAL_DIR_BUILD_TOKENS.has(token) || ARCH_TOKEN.test(token));
}

/**
 * The seal is skipped ONLY for an explicitly-local, UNAMBIGUOUS directory-only
 * build — never a distributable (dmg/zip/nsis) build. A leaked
 * `WAYLAND_LOCAL_VERIFICATION=1` env var can never deseal a shippable artifact:
 * a release/CI build (no `--dir`, or with any distributable/negation token) fails
 * this check, so the seal is written (fail-safe to the release path).
 *
 * @param {Record<string, string | undefined>} env
 * @param {string[]} argv build arguments (e.g. process.argv.slice(2))
 * @returns {boolean} true iff the flag is exactly '1' AND argv is canonically dir-only
 */
function isLocalVerificationDirBuild(env, argv) {
  return isLocalVerificationBuild(env) && isCanonicalDirOnlyArgs(argv);
}

// Primary electron-builder distributable/installer artifact extensions. A local
// verification (`--dir`) build must emit ONLY an unpacked `.app`/dir — none of
// these. This is the class-closing backstop: even if some future arg or retry
// path tried to synthesize a distributable, its presence fails the build.
const DISTRIBUTABLE_ARTIFACT = /\.(dmg|pkg|zip|exe|msi|appx|appimage|deb|rpm|snap)$/i;

/**
 * @param {string[]} fileNames basenames produced by the build (top-level artifacts)
 * @returns {string[]} the subset that are distributable/installer artifacts
 */
function findDistributableArtifacts(fileNames) {
  if (!Array.isArray(fileNames)) return [];
  return fileNames.filter((name) => typeof name === 'string' && DISTRIBUTABLE_ARTIFACT.test(name));
}

module.exports = {
  isLocalVerificationBuild,
  isLocalVerificationDirBuild,
  isCanonicalDirOnlyArgs,
  findDistributableArtifacts,
};
