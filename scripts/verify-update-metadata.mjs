#!/usr/bin/env node
/**
 * verify-update-metadata.mjs — the update-feed integrity gate.
 *
 * electron-updater verifies a downloaded artifact's SHA512 + size against the
 * `latest*.yml` manifest. If the manifest hash does not match the artifact the
 * actual release ships, every in-app update fails with "checksum mismatch"
 * (#109). That happened on 0.9.8 mac because the dmg was stapled (its bytes
 * changed) AFTER the manifest was written, and the per-arch repair was
 * mis-targeted, so a stale manifest shipped while the Gatekeeper smoke gate
 * (which checks notarization, not manifest hashes) stayed green.
 *
 * This gate closes that gap: for every `latest*.yml` it recomputes the real
 * SHA512 (base64 of the raw digest, electron-builder's format) and byte size of
 * each referenced artifact and FAILS if any does not match. Run it before a
 * release is made public. Platform-agnostic — it only hashes files.
 *
 * Usage:
 *   node scripts/verify-update-metadata.mjs --tag v0.9.8        # download from the release (gh)
 *   node scripts/verify-update-metadata.mjs --dir path/to/dist  # verify a local dist dir
 *
 * Exit code: 0 = every manifest matches its artifacts, 1 = any mismatch/missing.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

function parseArgs(argv) {
  const out = { tag: '', dir: '' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--tag') out.tag = argv[++i];
    else if (argv[i] === '--dir') out.dir = argv[++i];
  }
  return out;
}

/** Parse the (very regular) electron-builder manifest into {url, sha512, size}[]. */
function parseManifest(text) {
  const files = [];
  let cur = null;
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    const url = line.match(/^\s*-\s*url:\s*(.+)$/);
    if (url) {
      cur = { url: url[1].trim(), sha512: '', size: NaN };
      files.push(cur);
      continue;
    }
    // A top-level key (column 0, e.g. `path:`/`sha512:`/`releaseDate:` that
    // follow the `files:` block) ends the current file entry. Without this the
    // trailing top-level `sha512:` (the .zip / path digest) overwrote the LAST
    // file entry's sha512 — making the dmg appear to carry the zip's hash and
    // producing a misleading mismatch report.
    if (/^\S/.test(raw)) cur = null;
    if (!cur) continue;
    const sha = line.match(/^\s*sha512:\s*(.+)$/);
    if (sha) cur.sha512 = sha[1].trim();
    const size = line.match(/^\s*size:\s*(\d+)\s*$/);
    if (size) cur.size = Number(size[1]);
  }
  return files;
}

function sha512Base64(filePath) {
  return createHash('sha512').update(readFileSync(filePath)).digest('base64');
}

function main() {
  const { tag, dir: dirArg } = parseArgs(process.argv.slice(2));
  let dir = dirArg;
  let cleanup = null;

  if (tag) {
    dir = mkdtempSync(join(tmpdir(), 'wl-verify-'));
    cleanup = dir;
    console.log(`==> Downloading manifests + artifacts for ${tag}…`);
    // ymls are tiny; the referenced zip/dmg/exe/AppImage are large but a release
    // gate runs once and correctness beats bandwidth.
    execFileSync(
      'gh',
      ['release', 'download', tag, '--pattern', 'latest*.yml', '--pattern', '*.zip',
        '--pattern', '*.dmg', '--pattern', '*.exe', '--pattern', '*.AppImage', '--pattern', '*.deb',
        '--pattern', '*.rpm', '--dir', dir, '--clobber'],
      { stdio: 'inherit' }
    );
  }

  if (!dir || !existsSync(dir)) {
    console.error('FAIL: no directory to verify. Pass --tag <tag> or --dir <path>.');
    process.exit(1);
  }

  const manifests = readdirSync(dir).filter((f) => /^latest.*\.yml$/.test(f));
  if (manifests.length === 0) {
    console.error(`FAIL: no latest*.yml manifests found in ${dir}.`);
    process.exit(1);
  }

  let failed = 0;
  let checked = 0;
  for (const m of manifests) {
    console.log(`\n[${m}]`);
    const files = parseManifest(readFileSync(join(dir, m), 'utf8'));
    for (const f of files) {
      const artifact = join(dir, f.url);
      if (!existsSync(artifact)) {
        console.log(`    SKIP  ${f.url} (artifact not present in dir)`);
        continue;
      }
      checked++;
      const realSha = sha512Base64(artifact);
      const realSize = readFileSync(artifact).length;
      const shaOk = realSha === f.sha512;
      // sha512 is the authoritative, cryptographic integrity check. `size` is
      // supplementary AND optional in the manifest: electron-builder omits it
      // for the Windows `latest.yml` .exe entries, so a missing size (NaN) must
      // NOT fail verification — a matching sha512 already proves byte-identity.
      // Only compare size when the manifest actually specifies one.
      const sizeOk = Number.isNaN(f.size) || realSize === f.size;
      if (shaOk && sizeOk) {
        console.log(`    PASS  ${f.url}`);
      } else {
        failed++;
        console.log(`    FAIL  ${f.url}`);
        if (!sizeOk) console.log(`            size:   manifest ${f.size}  actual ${realSize}`);
        if (!shaOk) console.log(`            sha512: manifest ${f.sha512}\n                    actual   ${realSha}`);
      }
    }
  }

  if (cleanup) rmSync(cleanup, { recursive: true, force: true });

  console.log('');
  if (failed > 0) {
    console.error(`########################################################`);
    console.error(`# UPDATE METADATA: FAIL (${failed} mismatch) — DO NOT PUBLISH #`);
    console.error(`########################################################`);
    process.exit(1);
  }
  if (checked === 0) {
    console.error('FAIL: no manifest-referenced artifacts were present to verify.');
    process.exit(1);
  }
  console.log(`UPDATE METADATA: PASS (${checked} artifacts match their manifests).`);
}

main();
