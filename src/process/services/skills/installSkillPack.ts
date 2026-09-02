/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Install a skill pack from an HTTPS archive, for the `install_skill`
 * [CONCIERGE_PROPOSE] kind.
 *
 * WHY THIS EXISTS. Wayland already had two skill import paths and neither could
 * deliver a pack a customer bought:
 *   - Settings -> Skills -> Import writes to `~/.wayland/skills/imported`, copies
 *     `*.md` only and non-recursively, and registers in memory. Nothing in the
 *     main process ever reads that directory, and the entry is gone on restart.
 *   - Assistants -> Add Skills installs to the directory that IS read, but only
 *     surfaces skills already sitting in one of five scan roots.
 * Neither is something a non-technical buyer can be walked through on a phone
 * call. This path is one click on a card that names what is being installed.
 *
 * THE SECURITY MODEL, stated plainly, because a skill is not data - it is
 * INSTRUCTIONS THE MODEL LATER OBEYS, so installing a hostile one is closer to
 * running code than to opening a file.
 *
 *   1. The proposal block is model-authored and therefore prompt-injectable. The
 *      URL alone authorises nothing.
 *   2. `sha256` pins the BYTES. A hijacked host, a swapped archive or a mutated
 *      CDN copy changes the hash, and a mismatch is a refusal - never a warning
 *      the user can click past.
 *   3. The human clicking Accept on a card that names the skill and shows the
 *      origin is the consent boundary, exactly as it already is for `add_mcp`
 *      (which installs an npm package that runs code).
 *   4. `SkillGuard` scans the extracted markdown. A `blocked` verdict refuses
 *      the install outright. Read {@link scanPack} for exactly what is and is
 *      NOT covered - the honest scope matters more than the reassurance.
 *   5. The declared `name` must equal the pack's own frontmatter `name`. Trusting
 *      either side alone lets a card say one thing and disk receive another.
 *
 * Every failure below is a refusal that names its reason. None of them repairs
 * the input: a pack that fails a check is not a typo, it is the shape an attack
 * takes.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import JSZip from 'jszip';

import { SkillGuard } from '@process/services/skills/SkillGuard';
import type { LlmScanCall } from '@process/services/skills/skillGuardLlmScan';
import type { SkillSecurityReport } from '@/common/types/skillTypes';
import { getSkillsDir } from '@process/utils/initStorage';

/** Hard cap on the archive we will pull down (packs are markdown, not media). */
export const MAX_PACK_BYTES = 8 * 1024 * 1024;

/**
 * Cap on the EXPANDED size of an archive, and on how many entries it may hold.
 *
 * `MAX_PACK_BYTES` bounds the download; it says nothing about what the download
 * expands to. Measured: a 17,461-byte archive expands to 17,825,792 bytes, so a
 * file comfortably under the 8 MiB download cap can expand to gigabytes and
 * exhaust the main process before anything else in this module runs.
 */
export const MAX_UNCOMPRESSED_BYTES = 32 * 1024 * 1024;
export const MAX_PACK_ENTRIES = 2_000;

/**
 * The ONLY file types a pack may carry.
 *
 * This is an ALLOWLIST, and it replaced a denylist for a reason worth keeping:
 * a denylist of executable extensions was demonstrably incomplete. A file named
 * `helper` with no extension at all produced `path.extname() === ''` and passed;
 * so did `run.sh.` (trailing dot) and `run.sh ` (trailing space), which macOS
 * tolerates. `.jar`, `.vbs`, `.wsf`, `.lua`, `.applescript`, `.desktop`,
 * `.msi`, `.scr`, `.com`, `.node` and `.wasm` were all simply missing.
 *
 * The attack a denylist could not stop: a pack ships `helper` containing
 * `#!/bin/sh`, plus a SKILL.md that says "run `bash helper`". Nothing refuses
 * it, SkillGuard never reads it (it scans `.md` only), and `initAgent` stages
 * the whole directory into the workspace the agent runs shell in. Execute bits
 * are irrelevant - `bash f` and `java -jar f` do not need them.
 *
 * A pack is documentation, data, and - DISCLOSED - the tools it needs to run.
 * Shell scripts and binaries stay refused; `.py` and `.mjs` are allowed and are
 * named back to the importer before install. See
 * {@link ALLOWED_PACK_SCRIPT_EXTENSIONS}.
 */
export const ALLOWED_PACK_EXTENSIONS = [
  '.md',
  '.markdown',
  '.txt',
  '.csv',
  '.tsv',
  '.json',
  '.yaml',
  '.yml',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
];

/**
 * Script types a pack may carry, mirroring
 * {@link import('./SkillImport').DISCLOSED_SCRIPT_EXTENSIONS}.
 *
 * Kept in step with the zip importer on purpose: the two paths install the same
 * artefact, and a pack that imports through Settings but is refused by the
 * concierge (or the reverse) is a bug the user experiences as randomness. See
 * that constant for why disclosure - not refusal - is the property that matters
 * here. Shell scripts and binaries remain disallowed on both paths.
 */
export const ALLOWED_PACK_SCRIPT_EXTENSIONS = ['.py', '.mjs'];

/**
 * Normalise an entry name the way the filesystem would, so a trailing dot or
 * space cannot smuggle a disallowed type past `path.extname`.
 */
function normalisedExtension(name: string): string {
  return path.extname(name.replace(/[. ]+$/, '')).toLowerCase();
}

/**
 * First file in the tree that a pack is not allowed to carry, or null.
 *
 * Symlinks are refused outright: a pack has no legitimate reason to ship one,
 * and a copier that dereferences it turns the link into a real copy of whatever
 * it pointed at.
 */
export async function findDisallowedFile(dir: string, prefix = ''): Promise<string | null> {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) return rel;
    if (entry.isDirectory()) {
      const hit = await findDisallowedFile(path.join(dir, entry.name), rel);
      if (hit) return hit;
      continue;
    }
    const ext = normalisedExtension(entry.name);
    if (!ALLOWED_PACK_EXTENSIONS.includes(ext) && !ALLOWED_PACK_SCRIPT_EXTENSIONS.includes(ext)) return rel;
  }
  return null;
}

/**
 * Every script the pack carries, relative to its root, sorted. The caller
 * DISCLOSES these - a pack may ship a tool, but never a silent one.
 */
export async function findPackScripts(dir: string, prefix = ''): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      found.push(...(await findPackScripts(path.join(dir, entry.name), rel)));
      continue;
    }
    if (ALLOWED_PACK_SCRIPT_EXTENSIONS.includes(normalisedExtension(entry.name))) found.push(rel);
  }
  return found.sort();
}

export type InstallSkillPackResult =
  | { ok: true; name: string; installedTo: string; files: number }
  | { ok: false; reason: string };

/** Lowercase hex sha-256 of a buffer. */
export function sha256Hex(buf: Uint8Array): string {
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Read `name:` out of a SKILL.md front-matter block.
 *
 * Deliberately the SAME shape the Skills picker uses (`fsBridge`), so a pack that
 * this installer accepts is a pack the picker would also have listed. Two
 * different front-matter readers is how a file becomes valid in one half of the
 * product and invisible in the other.
 */
export function frontmatterName(skillMd: string): string | null {
  const fm = skillMd.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const m = fm[1].match(/^name:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

/**
 * Validate an already-extracted pack directory and copy it into the skills dir
 * that assistants actually read.
 *
 * Split out from the download so it is testable without a network: the rules are
 * the valuable part, and a rule that can only be exercised against a live URL is
 * a rule nobody re-checks.
 */
/**
 * Repair a swap that a crash interrupted.
 *
 * The swap is `target -> .previous`, then `.incoming -> target`, then delete
 * `.previous`. A process death BETWEEN the first two renames leaves the skill
 * INVISIBLE - `target` is gone and the user's only copy is sitting in
 * `.previous` under a name nothing looks at. Worse, the next install of the same
 * pack sees `target` absent, takes the no-previous branch, and then deletes that
 * `.previous` at the end: the crash loses the skill and the retry destroys the
 * backup.
 *
 * So: before any install, restore a `.previous` whose target is missing, and
 * clear `.incoming` left from an interrupted copy. Exported and called at the
 * top of {@link installExtractedPack} so recovery happens on the path that would
 * otherwise do the damage.
 */
export async function recoverInterruptedInstalls(skillsDir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(skillsDir);
  } catch {
    return [];
  }

  const recovered: string[] = [];
  for (const name of entries) {
    if (name.endsWith('.incoming')) {
      await fs.rm(path.join(skillsDir, name), { recursive: true, force: true });
      continue;
    }
    if (!name.endsWith('.previous')) continue;

    const backup = path.join(skillsDir, name);
    const target = path.join(skillsDir, name.slice(0, -'.previous'.length));
    try {
      await fs.access(target);
      // The target survived, so the backup is genuinely spent.
      await fs.rm(backup, { recursive: true, force: true });
    } catch {
      // The target is missing: this backup is the user's only copy.
      await fs.rename(backup, target);
      recovered.push(path.basename(target));
    }
  }
  return recovered;
}

/**
 * If `dir` holds exactly one directory and no SKILL.md, return that directory.
 * Otherwise return `dir` unchanged.
 */
export async function unwrapSingleFolder(dir: string): Promise<string> {
  const names = await fs.readdir(dir);
  if (names.includes('SKILL.md')) return dir;
  if (names.length !== 1) return dir;
  const only = path.join(dir, names[0]);
  const st = await fs.lstat(only);
  if (st.isSymbolicLink() || !st.isDirectory()) return dir;
  return only;
}

export async function installExtractedPack(
  extractedDir: string,
  declaredName: string,
  opts: { skillsDir?: string; overwrite?: boolean } = {}
): Promise<InstallSkillPackResult> {
  const skillsDir = opts.skillsDir ?? getSkillsDir();

  // Heal a swap a crash interrupted BEFORE deciding whether this name is taken -
  // otherwise the collision check below reads a half-state as "free" and the
  // final cleanup deletes the user's only surviving copy.
  await recoverInterruptedInstalls(skillsDir);

  // A zip almost always wraps its contents in one folder - `zip -r`, Finder
  // Compress and Explorer all do. Without this the pack installs under the temp
  // directory's name with the real folder nested below it. Same fix, and same
  // reason, as `SkillImport._unwrapSingleFolder`.
  extractedDir = await unwrapSingleFolder(extractedDir);

  const executable = await findDisallowedFile(extractedDir);
  if (executable !== null) {
    return {
      ok: false,
      reason: `The pack contains a file type that cannot be safety-checked (${executable}), so it was not installed.`,
    };
  }

  let skillMd: string;
  try {
    skillMd = await fs.readFile(path.join(extractedDir, 'SKILL.md'), 'utf-8');
  } catch {
    return { ok: false, reason: 'The pack has no SKILL.md at its root.' };
  }

  const actualName = frontmatterName(skillMd);
  if (!actualName) {
    return { ok: false, reason: 'The pack’s SKILL.md has no readable name in its front matter.' };
  }
  if (actualName !== declaredName) {
    // The card said one thing; the archive contains another. Refuse rather than
    // silently install under either name.
    return {
      ok: false,
      reason: `The pack calls itself "${actualName}" but the install offered "${declaredName}".`,
    };
  }

  const target = path.join(skillsDir, declaredName);
  if (!opts.overwrite) {
    try {
      await fs.access(target);
      return { ok: false, reason: `A skill named "${declaredName}" is already installed.` };
    } catch {
      // Not present - good.
    }
  }

  await fs.mkdir(skillsDir, { recursive: true });
  // Copy to a sibling, THEN swap. `rm` followed by `cp` is not atomic: a copy
  // that fails halfway leaves the user with neither their old skill nor the new
  // one, and any edits they made to it are gone.
  const staged = `${target}.incoming`;
  const backup = `${target}.previous`;
  await fs.rm(staged, { recursive: true, force: true });
  await fs.cp(extractedDir, staged, { recursive: true });
  let hadPrevious = false;
  try {
    await fs.access(target);
    await fs.rm(backup, { recursive: true, force: true });
    await fs.rename(target, backup);
    hadPrevious = true;
  } catch {
    // Nothing installed under this name yet.
  }
  try {
    await fs.rename(staged, target);
  } catch (e) {
    if (hadPrevious) await fs.rename(backup, target).catch(() => {});
    await fs.rm(staged, { recursive: true, force: true });
    return { ok: false, reason: `Could not install the pack (${e instanceof Error ? e.message : String(e)}).` };
  }
  await fs.rm(backup, { recursive: true, force: true });

  const files = await countFiles(target);
  return { ok: true, name: declaredName, installedTo: target, files };
}

async function countFiles(dir: string): Promise<number> {
  let n = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += await countFiles(path.join(dir, entry.name));
    else n += 1;
  }
  return n;
}

/** Where a download is staged before it is validated. Never the skills dir. */
export function stagingRoot(): string {
  return path.join(os.tmpdir(), 'wayland-skill-pack');
}

/**
 * Extract a pack archive into `destDir`, refusing anything that tries to escape.
 *
 * ZIP-SLIP: an archive entry may store `../../.ssh/authorized_keys` as its name.
 * Every entry is resolved against the destination and refused if it lands
 * outside, so a hostile pack cannot write a byte beyond its own folder.
 *
 * MEASURED, so nobody mistakes this for the only thing standing in the way:
 * JSZip already NORMALISES traversal segments away, on write AND on read - a
 * zip built with a literal `../../pwned.txt` entry (via python zipfile) is
 * reported by `loadAsync` as plain `pwned.txt`. So this check cannot currently
 * be reached through JSZip, and `safeEntryPath` is unit-tested directly rather
 * than through a fixture archive that cannot express the attack. It stays
 * because the day the archive reader changes is the day it starts mattering,
 * and a guard added after that change is a guard added too late.
 */
/**
 * Resolve one archive entry against the extraction root, or null when it escapes.
 *
 * Exported so the rule is testable on its own: see the note on {@link extractPack}
 * for why a fixture archive cannot currently express the attack.
 */
export function safeEntryPath(root: string, relative: string): string | null {
  const abs = path.resolve(root, relative);
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return abs;
}

export async function extractPack(
  archive: Uint8Array,
  destDir: string
): Promise<{ ok: true; files: number } | { ok: false; reason: string }> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(archive);
  } catch {
    return { ok: false, reason: 'The download is not a readable ZIP archive.' };
  }

  const root = path.resolve(destDir);
  const entries = Object.values(zip.files);
  if (entries.length === 0) return { ok: false, reason: 'The archive is empty.' };

  if (entries.length > MAX_PACK_ENTRIES) {
    return { ok: false, reason: `The archive holds too many files (${entries.length}).` };
  }

  let files = 0;
  let expanded = 0;
  for (const entry of entries) {
    // Strip a single wrapping directory so both `pack.zip/SKILL.md` and
    // `pack.zip/tide-morning-brief/SKILL.md` install the same way. Anything
    // deeper keeps its shape.
    // A ZIP may legitimately use `\` as its separator. On macOS that becomes a
    // literal backslash in a FILENAME rather than a directory, so normalise it
    // before confinement - otherwise the same archive installs two shapes.
    const rel = entry.name.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!rel || rel === './') continue;
    const abs = safeEntryPath(root, rel);
    if (abs === null) {
      return { ok: false, reason: `The archive tries to write outside its folder (${entry.name}).` };
    }
    if (entry.dir) {
      await fs.mkdir(abs, { recursive: true });
      continue;
    }
    await fs.mkdir(path.dirname(abs), { recursive: true });
    const bytes = await entry.async('uint8array');
    expanded += bytes.length;
    if (expanded > MAX_UNCOMPRESSED_BYTES) {
      return { ok: false, reason: 'The archive expands to more data than a skill pack is allowed to contain.' };
    }
    await fs.writeFile(abs, Buffer.from(bytes));
    files += 1;
  }
  return { ok: true, files };
}

/**
 * Fetch the archive and verify it against the hash the card showed.
 *
 * The size cap is checked against what actually arrived, not the advertised
 * Content-Length, because a header is the one part of a response an attacker
 * controls for free.
 */
export async function downloadAndVerify(
  url: string,
  expectedSha256: string
): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; reason: string }> {
  let res: Response;
  try {
    res = await fetch(url, { redirect: 'follow' });
  } catch (e) {
    return { ok: false, reason: `Could not reach the download (${e instanceof Error ? e.message : String(e)}).` };
  }
  if (!res.ok) return { ok: false, reason: `The download returned HTTP ${res.status}.` };

  // STREAM, and stop at the cap. `await res.arrayBuffer()` buffers the WHOLE
  // response first and only then measures it, so a hostile host can exhaust the
  // main process's memory before the cap its own comment defends is ever
  // consulted. Content-Length is not checked instead of this: a header is the
  // one part of a response an attacker sets for free.
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = res.body?.getReader();
  if (!reader) return { ok: false, reason: 'The download returned no body.' };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_PACK_BYTES) {
      await reader.cancel().catch(() => {});
      return { ok: false, reason: `The pack is larger than the ${Math.round(MAX_PACK_BYTES / 1024 / 1024)}MB limit.` };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    bytes.set(c, at);
    at += c.byteLength;
  }

  const actual = sha256Hex(bytes);
  if (actual !== expectedSha256) {
    // NOT a warning. The bytes are not the bytes the user agreed to install.
    return { ok: false, reason: 'The download did not match its expected checksum, so it was not installed.' };
  }
  return { ok: true, bytes };
}

/** Read `description:` out of a SKILL.md front-matter block, or '' when absent. */
export function frontmatterDescription(skillMd: string): string {
  const fm = skillMd.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fm) return '';
  const m = fm[1].match(/^description:\s*['"]?(.+?)['"]?\s*$/m);
  return m ? m[1].trim() : '';
}

/** Every `.md` file in the tree, relative to `dir`, depth-first and sorted. */
export async function markdownFiles(dir: string, prefix = ''): Promise<string[]> {
  const out: string[] = [];
  for (const entry of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await markdownFiles(path.join(dir, entry.name), rel)));
    else if (entry.name.toLowerCase().endsWith('.md')) out.push(rel);
  }
  return out;
}

export type PackScanResult = {
  verdict: 'clean' | 'review' | 'blocked';
  reports: Array<{ file: string; report: SkillSecurityReport }>;
};

/**
 * Scan a pack's markdown with SkillGuard.
 *
 * WHAT THIS COVERS, stated exactly, because the previous version of this comment
 * claimed a scan the code did not perform:
 *   - EVERY `.md` file in the tree, not just the root SKILL.md. All of it lands
 *     in `<userData>/config/skills/<name>` and any of it can end up in an agent
 *     prompt, so scanning only the entry point would be the same
 *     scanned-in-name-only shape this installer exists to avoid.
 *   - The root SKILL.md is scanned with its REAL `description`, not `''`. The
 *     rules treat description as an injection channel precisely because it goes
 *     verbatim into agent prompts, and the Settings importer passes an empty
 *     string there - a gap worth not copying.
 *
 * WHAT THIS DOES NOT COVER:
 *   - Non-markdown files. SkillGuard takes strings and reasons about prompt
 *     content; it has no opinion on a `.mjs` or a `.txt`. Those are carried into
 *     the skills directory UNSCANNED. That is why {@link installExtractedPack}
 *     refuses executable extensions outright rather than pretending a scan
 *     covered them.
 *   - The LLM layer FAILS OPEN by design: a throw or a timeout yields no
 *     findings and `llmScanned: false`, falling back to the regex verdict.
 */
export async function scanPack(dir: string, opts: { llmCall?: LlmScanCall } = {}): Promise<PackScanResult> {
  const files = await markdownFiles(dir);
  const inputs = await Promise.all(
    files.map(async (rel) => {
      const body = await fs.readFile(path.join(dir, rel), 'utf-8');
      return {
        name: rel,
        body,
        description: rel === 'SKILL.md' ? frontmatterDescription(body) : '',
        tags: [] as string[],
      };
    })
  );
  if (inputs.length === 0) return { verdict: 'blocked', reports: [] };

  const reports = await SkillGuard.scan(inputs, { llm: true, llmCall: opts.llmCall });
  const paired = reports.map((report, i) => ({ file: files[i], report }));
  const verdict = paired.some((p) => p.report.verdict === 'blocked')
    ? 'blocked'
    : paired.some((p) => p.report.verdict === 'review')
      ? 'review'
      : 'clean';
  return { verdict, reports: paired };
}

/**
 * Read `reason` off a failed `{ok:false, reason}` result.
 *
 * This project's tsconfig does not enable `strictNullChecks`, and without it
 * TypeScript will not narrow a discriminated union through `if (!r.ok)`.
 */
export function failureReason(result: { ok: boolean; reason?: string }, fallback: string): string {
  return result.reason ?? fallback;
}

/** The four steps the install chain drives, injectable so a test can drive the REAL chain. */
export type InstallSkillDeps = {
  download: (url: string, sha256: string) => Promise<{ ok: true; bytes: Uint8Array } | { ok: false; reason: string }>;
  extract: (bytes: Uint8Array, dir: string) => Promise<{ ok: true; files: number } | { ok: false; reason: string }>;
  scan: (dir: string) => Promise<PackScanResult>;
  /**
   * Names the runnable files the pack carries, so the reply can say what landed.
   *
   * `findPackScripts` existed for months with NO production caller - only tests
   * - so a student accepting this card installed `.py` and `.mjs` files that
   * were never mentioned to them anywhere. The scan proves a pack is not
   * malicious; it does not tell a non-technical buyer that the thing they just
   * accepted brought executable code with it.
   */
  scripts: (dir: string) => Promise<string[]>;
  install: (dir: string, name: string) => Promise<InstallSkillPackResult>;
  enable: (name: string) => Promise<boolean>;
  stagingDir: () => string;
  cleanup: (dir: string) => Promise<void>;
};

/**
 * The whole `install_skill` chain, in ONE place.
 *
 * It lives here rather than inline in the bridge because a test that
 * re-implements the chain over mocks is not a test of the chain. Two independent
 * audits demonstrated that: with the logic duplicated, `if (false && verdict !==
 * 'clean')` and a swapped `download(sha256, url)` argument order BOTH left the
 * suite fully green, because the test was exercising its own copy. The bridge
 * and the test now call this function, so a mutation here has nowhere to hide.
 *
 * Ordering is the security property: verify before unpacking, scan before
 * installing, and never install anything a scan did not pass.
 *
 * `review` is treated as `blocked` deliberately. The Settings importer can hold
 * a flagged skill unregistered and re-confirm it against the hash the user saw;
 * this card's Accept is ONE irreversible click with no second step, so there is
 * nowhere safe to park a flagged pack.
 */
export async function runInstallSkillChain(
  content: { name: string; url: string; sha256: string },
  deps: InstallSkillDeps
): Promise<string> {
  const download = await deps.download(content.url, content.sha256);
  if (!download.ok) throw new Error(failureReason(download, 'The download could not be verified.'));

  const staging = deps.stagingDir();
  try {
    const extracted = await deps.extract(download.bytes, staging);
    if (!extracted.ok) throw new Error(failureReason(extracted, 'The pack could not be unpacked.'));

    const scan = await deps.scan(staging);
    if (scan.verdict !== 'clean') {
      const flagged = scan.reports
        .filter((r) => r.report.verdict !== 'clean')
        .map((r) => r.file)
        .join(', ');
      throw new Error(
        `The pack did not pass the safety scan (${scan.verdict}${flagged ? `: ${flagged}` : ''}), so nothing was installed.`
      );
    }

    // Read the script list from STAGING, before install moves the tree and
    // before `finally` deletes it.
    const scripts = await deps.scripts(staging).catch(() => [] as string[]);

    const installed = await deps.install(staging, content.name);
    if (!installed.ok) throw new Error(failureReason(installed, 'The pack could not be installed.'));

    // Enabling is a CONVENIENCE and the install above is irreversible. If this
    // throws, the pack is already on disk and every retry fails with "already
    // installed" - permanently, with the skill switched on for nobody. So the
    // failure costs the user the toggle, never the pack. (The Settings importer
    // guards this the same way; the two paths used to disagree.)
    const enabled = await deps.enable(content.name).catch(() => false);

    const disclosure = scripts.length
      ? ` It brings ${scripts.length} runnable file${scripts.length === 1 ? '' : 's'} with it: ${scripts.join(', ')}.` +
        ' They only run when you ask for something that needs them, and you are asked before each one.'
      : '';
    return enabled
      ? `Installed "${content.name}" and switched it on for Smart Trader.${disclosure}`
      : `Installed "${content.name}" - switch it on under Assistants to use it.${disclosure}`;
  } finally {
    await deps.cleanup(staging);
  }
}
