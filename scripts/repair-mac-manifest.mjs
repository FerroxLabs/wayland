#!/usr/bin/env node
/**
 * repair-mac-manifest.mjs — post-build repair of the macOS update feed.
 *
 * electron-updater verifies a downloaded artifact's SHA512 + size against
 * `latest-mac.yml`. electron-builder computes each artifact's digest at
 * artifact-created time — BEFORE the .dmg is notarized + stapled — and only
 * flushes `latest-mac.yml` to disk in its final publish-task phase, which runs
 * AFTER the `afterAllArtifactBuild` hook returns. So `notarizeDmg` staples the
 * dmg (its bytes grow ~7.6 KB) but CANNOT patch the manifest from inside the
 * hook: the file does not exist yet. By the time the build step finishes, the
 * dmg is stapled and the on-disk yml carries the stale pre-staple dmg hash —
 * that is #109 ("checksum mismatch" on in-app update).
 *
 * This script runs as a workflow step AFTER the macOS build, when the yml is on
 * disk and the dmg is stapled. It recomputes the real SHA512 (base64 of the raw
 * digest, electron-builder's format) + byte size of every artifact the manifest
 * references and rewrites any stale entry in place. Idempotent: a correct
 * manifest is left byte-for-byte unchanged. The release smoke gate
 * (`verify-update-metadata.mjs`, read-only) then confirms the result.
 *
 * Usage: node scripts/repair-mac-manifest.mjs --dir out
 * Exit:  0 = repaired or already-correct, 1 = a referenced artifact is missing
 *        (cannot recompute) or no mac manifest found.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

function parseArgs(argv) {
  const out = { dir: '' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir') out.dir = argv[++i];
  }
  return out;
}

function sha512Base64(filePath) {
  return createHash('sha512').update(readFileSync(filePath)).digest('base64');
}

/**
 * Rewrite, in place, the sha512 + size lines that follow each `- url:` entry and
 * the trailing top-level `sha512:`/`size:` (which describe the `path:` artifact),
 * using the real digests of the on-disk files. Line-based to preserve formatting
 * so an unchanged manifest stays byte-identical.
 */
function repairManifest(ymlPath) {
  const dir = dirname(ymlPath);
  const lines = readFileSync(ymlPath, 'utf8').split('\n');
  let changed = false;
  let missing = [];

  // Resolve the artifact a sha512/size pair belongs to: the nearest preceding
  // `url:` (indented, inside files[]) or the top-level `path:` (column 0).
  let currentFile = null; // { name, indented }
  let pathFile = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const urlM = line.match(/^(\s*)-\s*url:\s*(.+?)\s*$/);
    if (urlM) {
      currentFile = { name: urlM[2].trim() };
      continue;
    }
    const pathM = line.match(/^path:\s*(.+?)\s*$/);
    if (pathM) {
      pathFile = pathM[1].trim();
      currentFile = { name: pathFile }; // trailing top-level sha512/size describe path
      continue;
    }
    // Any other column-0 key ends the current files[] block.
    if (/^\S/.test(line) && !pathM) {
      // keep pathFile-derived currentFile only right after a `path:` line; a
      // different top-level key (version/releaseDate) clears it.
      if (!/^(sha512|size):/.test(line)) currentFile = pathFile && currentFile?.name === pathFile ? currentFile : null;
    }
    if (!currentFile) continue;

    const artifact = join(dir, currentFile.name);
    const shaM = line.match(/^(\s*sha512:\s*)(.+?)\s*$/);
    if (shaM) {
      if (!existsSync(artifact)) {
        missing.push(currentFile.name);
        continue;
      }
      const real = sha512Base64(artifact);
      if (shaM[2] !== real) {
        lines[i] = `${shaM[1]}${real}`;
        changed = true;
      }
      continue;
    }
    const sizeM = line.match(/^(\s*size:\s*)(\d+)\s*$/);
    if (sizeM) {
      if (!existsSync(artifact)) continue;
      const real = String(readFileSync(artifact).length);
      if (sizeM[2] !== real) {
        lines[i] = `${sizeM[1]}${real}`;
        changed = true;
      }
    }
  }

  if (changed) writeFileSync(ymlPath, lines.join('\n'));
  return { changed, missing: [...new Set(missing)] };
}

function main() {
  const { dir } = parseArgs(process.argv.slice(2));
  if (!dir || !existsSync(dir)) {
    console.error(`FAIL: pass an existing --dir (got ${dir || '<none>'}).`);
    process.exit(1);
  }
  const manifests = readdirSync(dir).filter((f) => /^latest.*mac.*\.yml$/.test(f));
  if (manifests.length === 0) {
    console.error(`FAIL: no latest*mac*.yml in ${dir}.`);
    process.exit(1);
  }

  let anyMissing = false;
  for (const m of manifests) {
    const ymlPath = join(dir, m);
    const { changed, missing } = repairManifest(ymlPath);
    if (missing.length > 0) {
      anyMissing = true;
      console.error(`  MISSING  ${m}: referenced artifact(s) not on disk: ${missing.join(', ')}`);
    }
    console.log(`  ${changed ? 'REPAIRED' : 'OK      '} ${m}`);
  }

  if (anyMissing) {
    console.error('FAIL: a referenced artifact was missing — manifest cannot be fully repaired.');
    process.exit(1);
  }
  console.log('mac manifest repair: done.');
}

main();
