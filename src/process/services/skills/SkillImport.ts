/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SkillImport - hardened process-side importer for all four import vectors.
 *
 * Security posture:
 *  - Folder import copies (never symlinks) to defeat TOCTOU.
 *  - Git import allowlists hosts to block file:// and arbitrary proto schemes.
 *  - Zip import validates every entry path is inside the extraction dir (zip-slip),
 *    rejects symlink entries, strips non-.md files, and warns on executable refs.
 *  - Every imported skill is run through SkillGuard.scan({ llm: true }).
 *  - Blocked verdict → SkillQuarantine.quarantine(); clean/review → kept.
 *  - Registered into SkillLibrary after import.
 */

import path from 'node:path';
import { homedir } from 'node:os';
import type { SkillSecurityReport, SkillType } from '@/common/types/skillTypes';
import type { SkillScanInput } from './skillGuardRules';
import { SkillGuard } from './SkillGuard';
import { SkillLibrary } from './SkillLibrary';
import { SkillQuarantine, type SkillQuarantineIo } from './SkillQuarantine';
import type { LlmScanCall } from './skillGuardLlmScan';
import { makeOneShotLlmScanCall } from './skillGuardLlmCall';

export const IMPORTED_DIR = path.join(homedir(), '.wayland', 'skills', 'imported');

// ---------------------------------------------------------------------------
// IO seam - injected for tests; defaults to real Node.js ops
// ---------------------------------------------------------------------------

export type SkillImportIo = {
  /** Lstat a path (needed to detect symlinks without following them). */
  lstat: (p: string) => Promise<{ isSymbolicLink(): boolean; isDirectory(): boolean }>;
  /** Read a directory, returning filenames. */
  readdir: (p: string) => Promise<string[]>;
  /** Read a file as a Buffer. */
  readFile: (p: string) => Promise<Buffer>;
  /** Copy a file (src → dest). */
  copyFile: (src: string, dest: string) => Promise<void>;
  /** Ensure a directory exists (recursive). MUST create parent dirs. */
  mkdir: (p: string, opts?: { recursive?: boolean }) => Promise<void>;
  /** Write a Buffer to a file. */
  writeFile: (p: string, data: Buffer | string) => Promise<void>;
  /** Clone a git repo to destDir. */
  gitClone: (url: string, destDir: string) => Promise<void>;
  /** Extract a zip archive to destDir. Returns entries as { path, isSymlink, data }[]. */
  unzip: (zipPath: string, destDir: string) => Promise<ZipEntry[]>;
  /** Create a temporary directory, returning its path. */
  mkdtemp: (prefix: string) => Promise<string>;
  /** Remove a directory tree. */
  rmdir: (p: string) => Promise<void>;
};

export type ZipEntry = {
  /** Relative path as stored in the archive (may contain ../ for zip-slip). */
  path: string;
  isSymlink: boolean;
  data: Buffer;
};

// Default real-fs implementation - not used in tests.
import { lstat, readdir, readFile, copyFile, mkdir, writeFile, rm, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import JSZip from 'jszip';

const execAsync = promisify(exec);

export const defaultSkillImportIo: SkillImportIo = {
  lstat,
  readdir,
  readFile,
  copyFile,
  mkdir: async (p, opts) => {
    // fs/promises mkdir returns the first-created dir path with { recursive: true };
    // the SkillImportIo contract is Promise<void>, so discard it.
    await mkdir(p, opts);
  },
  writeFile,
  gitClone: async (url, destDir) => {
    await execAsync(`git clone --depth 1 -- ${JSON.stringify(url)} ${JSON.stringify(destDir)}`);
  },
  unzip: async (zipPath, _destDir) => {
    const buf = await readFile(zipPath);
    const zip = await JSZip.loadAsync(buf);
    const entries: ZipEntry[] = [];
    for (const [entryPath, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const data = Buffer.from(await entry.async('arraybuffer'));
      // JSZip does not expose Unix mode bits directly; treat as non-symlink.
      entries.push({ path: entryPath, isSymlink: false, data });
    }
    return entries;
  },
  mkdtemp: (prefix) => mkdtemp(path.join(os.tmpdir(), prefix)),
  rmdir: (p) => rm(p, { recursive: true, force: true }),
};

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type ImportedSkillResult = {
  /** Skill name derived from the directory basename. */
  name: string;
  /** Absolute path inside ~/.wayland/skills/imported/<name>/ */
  destPath: string;
  /** Security scan report. */
  report: SkillSecurityReport;
  /** Type declared in the SKILL.md frontmatter (default 'skill'). */
  type: SkillType;
  /** Raw SKILL.md body - lets the import dispatcher route agent-profiles. */
  body: string;
  /**
   * Whether the skill was actually registered into the library. `clean`
   * verdicts register immediately (true); `review` verdicts are held pending
   * an explicit user "Import anyway" (false) and only register via
   * `confirmImport` (C3). Blocked verdicts never appear here - they are
   * quarantined instead.
   */
  registered: boolean;
};

export type ImportResult = {
  imported: ImportedSkillResult[];
  /** Skills routed to quarantine (verdict === 'blocked'). */
  quarantined: string[];
  /** Non-fatal warnings (e.g. executable-ref in zip). */
  warnings: string[];
};

// ---------------------------------------------------------------------------
// Allowlisted git host patterns
// ---------------------------------------------------------------------------

// Accepts https:// and the short-form `git@<host>:` SSH URL. Rejects
// file://, http://, and - critically - bare `ssh://` because that pattern
// has no host restriction and would let a malicious caller submit
// `ssh://internal.host/internal-repo` and clone against an arbitrary
// internal SSH host (SSRF). The `git@<host>:` short form already covers
// GitHub/GitLab SSH use cases. (H5 fix.)
const GIT_ALLOWLIST = [/^https:\/\//, /^git@[a-zA-Z0-9.-]+:/];

function isAllowedGitUrl(url: string): boolean {
  return GIT_ALLOWLIST.some((re) => re.test(url));
}

// Regex to flag SKILL.md bodies that reference relative executable paths.
const EXECUTABLE_REF_RE = /\.(\/scripts\/[^\s)'"]+|\/bin\/[^\s)'"]+)/;

// Whitelist of valid SKILL.md frontmatter `type:` values. Anything else
// (missing block, unknown value) falls back to 'skill' so a malformed
// header can never register an entry under an unexpected surface.
const VALID_SKILL_TYPES: ReadonlySet<SkillType> = new Set(['skill', 'workflow', 'agent-profile']);

/**
 * Extract the frontmatter `type:` from a SKILL.md body. Reads only the
 * leading `---\n…\n---` block; defaults to 'skill' when absent or invalid.
 * Kept local (and regex-only, no YAML dep) to mirror the rest of this file's
 * dependency-free posture; the canonical parser in AcpSkillManager is renderer-
 * adjacent and pulls more surface than the importer needs.
 */
export function parseFrontmatterType(body: string): SkillType {
  const block = body.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!block) return 'skill';
  const m = block[1].match(/^type:[ \t]*['"]?([^'"\n]+?)['"]?[ \t]*$/m);
  const raw = m ? (m[1].trim() as SkillType) : 'skill';
  return VALID_SKILL_TYPES.has(raw) ? raw : 'skill';
}

/**
 * Decompression caps to defend against zip-bombs. A skill is a small bundle of
 * markdown; these limits reject a single entry or a total payload that is
 * implausible for a real skill import.
 */
const MAX_ZIP_ENTRY_BYTES = 16 * 1024 * 1024; // 16 MiB per entry
const MAX_ZIP_TOTAL_BYTES = 64 * 1024 * 1024; // 64 MiB total

/**
 * Resolve a zip entry destination inside `baseDir`, rejecting any path that
 * escapes it (zip-slip). Normalizes BOTH separators before inspection so a
 * mixed-separator entry (e.g. `a/..\\..\\evil`) cannot bypass the check on
 * either POSIX or Windows.
 *
 * @returns the contained absolute path, or `null` if the entry traverses out.
 */
function resolveContainedEntry(baseDir: string, entryName: string): string | null {
  const normalized = entryName.replace(/\\/g, '/');
  if (normalized.split('/').some((seg) => seg === '..')) {
    return null;
  }
  const root = path.resolve(baseDir);
  const resolved = path.resolve(root, normalized);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return null;
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Public class
// ---------------------------------------------------------------------------

export class SkillImport {
  private readonly io: SkillImportIo;
  private readonly quarantineIo: SkillQuarantineIo | undefined;
  /**
   * LLM deep-sweep call for the import path (C1). Defaults to the real
   * oneShot-backed scanner; injected in tests. Imports are untrusted, rare
   * events, so every import gets exactly one model call per skill.
   */
  private readonly llmCall: LlmScanCall;

  constructor(io: SkillImportIo = defaultSkillImportIo, quarantineIo?: SkillQuarantineIo, llmCall?: LlmScanCall) {
    this.io = io;
    this.quarantineIo = quarantineIo;
    this.llmCall = llmCall ?? makeOneShotLlmScanCall();
  }

  // -------------------------------------------------------------------------
  // importFolder
  // -------------------------------------------------------------------------

  /**
   * Copy a skill folder into ~/.wayland/skills/imported/<basename>/.
   * Rejects if srcPath itself is a symlink (TOCTOU hardening).
   */
  async importFolder(srcPath: string): Promise<ImportResult> {
    const stat = await this.io.lstat(srcPath);
    if (stat.isSymbolicLink()) {
      throw new Error(`Rejected: source path is a symlink - ${srcPath}`);
    }
    if (!stat.isDirectory()) {
      throw new Error(`Rejected: source path is not a directory - ${srcPath}`);
    }
    return this._copyAndScan(srcPath);
  }

  // -------------------------------------------------------------------------
  // importGit
  // -------------------------------------------------------------------------

  /**
   * Clone a git URL into a temp dir, then treat as folder import.
   * Only https://, git@host:, and ssh:// schemes are allowed.
   */
  async importGit(url: string): Promise<ImportResult> {
    if (!isAllowedGitUrl(url)) {
      throw new Error(`Rejected: git URL uses a disallowed scheme - ${url}`);
    }
    const tmpDir = await this.io.mkdtemp('wayland-git-import-');
    try {
      await this.io.gitClone(url, tmpDir);
      return await this._copyAndScan(tmpDir);
    } finally {
      await this.io.rmdir(tmpDir).catch(() => {});
    }
  }

  // -------------------------------------------------------------------------
  // importZip
  // -------------------------------------------------------------------------

  /**
   * Extract a zip archive, validate every entry (zip-slip + symlink + type),
   * then treat extracted .md files as a folder import.
   */
  async importZip(zipPath: string): Promise<ImportResult> {
    const tmpDir = await this.io.mkdtemp('wayland-zip-import-');
    const warnings: string[] = [];
    try {
      const entries = await this.io.unzip(zipPath, tmpDir);

      // H4: reject multi-skill zips. The previous implementation flattened
      // every `.md` into `path.basename(entry.path)`, so `skill-a/SKILL.md`
      // and `skill-b/SKILL.md` collided and a malicious caller could engineer
      // the order so the surviving body differed from what was scanned. One
      // skill per zip is the well-formed contract - bulk import is folder-
      // based via importFolder.
      const skillMdCount = entries.filter((e) => !e.isSymlink && path.basename(e.path) === 'SKILL.md').length;
      if (skillMdCount > 1) {
        throw new Error(
          `Rejected: zip contains ${skillMdCount} SKILL.md files. ` +
            'Import a single skill per zip, or use the folder import for bundles.'
        );
      }

      let totalBytes = 0;
      for (const entry of entries) {
        // Reject symlink entries.
        if (entry.isSymlink) {
          throw new Error(`Rejected: zip contains a symlink entry - ${entry.path}`);
        }
        // Zip-slip: reject `..` segments under either separator, then require
        // the resolved path to stay inside tmpDir. A separator-blind check
        // alone misses mixed-separator entries like `a/..\\..\\evil` (the
        // backslash form is literal on POSIX `path.resolve` but traverses on
        // Windows `path.win32.resolve`).
        if (resolveContainedEntry(tmpDir, entry.path) === null) {
          throw new Error(`Rejected: zip entry escapes extraction dir - ${entry.path}`);
        }
        // Zip-bomb cap: bound per-entry and cumulative decompressed size.
        if (entry.data.length > MAX_ZIP_ENTRY_BYTES) {
          throw new Error(`Rejected: zip entry exceeds size cap - ${entry.path}`);
        }
        totalBytes += entry.data.length;
        if (totalBytes > MAX_ZIP_TOTAL_BYTES) {
          throw new Error('Rejected: zip total decompressed size exceeds cap');
        }
        // Strip non-.md files (don't write them).
        if (!entry.path.endsWith('.md')) {
          continue;
        }
        // Warn on executable-ref patterns in SKILL.md bodies.
        const body = entry.data.toString('utf-8');
        if (EXECUTABLE_REF_RE.test(body)) {
          warnings.push(`Warning: ${entry.path} references a relative executable path`);
        }
        // Write only .md files to tmpDir, flattening to the basename. Safe
        // now because the multi-SKILL.md guard above rejects ambiguous zips.
        const destFile = path.join(tmpDir, path.basename(entry.path));
        await this.io.writeFile(destFile, entry.data);
      }
      const result = await this._copyAndScan(tmpDir);
      return { ...result, warnings: [...result.warnings, ...warnings] };
    } finally {
      await this.io.rmdir(tmpDir).catch(() => {});
    }
  }

  // -------------------------------------------------------------------------
  // importSingleSkillMd
  // -------------------------------------------------------------------------

  /**
   * Copy a single SKILL.md file into ~/.wayland/skills/imported/<basename>/SKILL.md.
   */
  async importSingleSkillMd(srcPath: string): Promise<ImportResult> {
    const stat = await this.io.lstat(srcPath);
    if (stat.isSymbolicLink()) {
      throw new Error(`Rejected: source path is a symlink - ${srcPath}`);
    }
    const skillName = path.basename(path.dirname(srcPath));
    const destDir = path.join(IMPORTED_DIR, skillName);
    await this.io.mkdir(destDir, { recursive: true });
    const destFile = path.join(destDir, 'SKILL.md');
    await this.io.copyFile(srcPath, destFile);
    // Read body for scan.
    const body = (await this.io.readFile(srcPath)).toString('utf-8');
    return this._scanAndRegister([{ name: skillName, body, destDir }]);
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /** Copy srcDir into IMPORTED_DIR/<basename> and run scan+register. */
  private async _copyAndScan(srcDir: string): Promise<ImportResult> {
    const basename = path.basename(srcDir);
    const destDir = path.join(IMPORTED_DIR, basename);
    await this.io.mkdir(destDir, { recursive: true });

    const files = await this.io.readdir(srcDir);
    let body = '';
    for (const file of files) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destDir, file);
      // Only copy .md files (SKILL.md + any supporting docs).
      if (!file.endsWith('.md')) continue;
      // H6: per-child lstat. importFolder lstats the root only; without
      // this check a folder containing `SKILL.md -> /etc/passwd` (or any
      // other attacker-pointed symlink) would have its target read and
      // copied into the user's skills directory.
      const childStat = await this.io.lstat(srcFile);
      if (childStat.isSymbolicLink()) {
        throw new Error(`Rejected: source folder contains a symlink - ${srcFile}`);
      }
      await this.io.copyFile(srcFile, destFile);
      if (file === 'SKILL.md') {
        body = (await this.io.readFile(srcFile)).toString('utf-8');
      }
    }

    return this._scanAndRegister([{ name: basename, body, destDir }]);
  }

  /**
   * Scan a batch of imported skills through the full Security Sweep (regex +
   * LLM deep read, C1) and gate registration on the verdict (C3):
   *  - `blocked` → quarantine, refuse (never returned in `imported`).
   *  - `review`  → HELD. Not registered; returned with `registered: false` so
   *    the renderer can show the findings and require an explicit
   *    "Import anyway" that calls `confirmImport`.
   *  - `clean`   → registered immediately with `registered: true`.
   */
  private async _scanAndRegister(
    skills: Array<{ name: string; body: string; destDir: string }>
  ): Promise<ImportResult> {
    const inputs: SkillScanInput[] = skills.map((s) => ({
      name: s.name,
      body: s.body,
      description: '',
      tags: [] as string[],
    }));

    // Only the untrusted import/user path passes llm:true with a real llmCall.
    const reports = await SkillGuard.scan(inputs, { llm: true, llmCall: this.llmCall });

    const imported: ImportedSkillResult[] = [];
    const quarantined: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      const report = reports[i];

      if (report.verdict === 'blocked') {
        // Route to quarantine.
        await SkillQuarantine.quarantine(skill.name, skill.destDir, this.quarantineIo);
        quarantined.push(skill.name);
        continue;
      }

      // `review` is HELD pending explicit consent: the on-disk copy stays
      // (so confirmImport can re-verify it) but it is NOT registered, so no
      // agent can retrieve it until the user approves.
      let registered = false;
      if (report.verdict === 'clean') {
        warnings.push(...this._register(skill.name, skill.destDir, skill.body, report));
        registered = true;
      }

      imported.push({
        name: skill.name,
        destPath: skill.destDir,
        report,
        type: parseFrontmatterType(skill.body),
        body: skill.body,
        registered,
      });
    }

    return { imported, quarantined, warnings };
  }

  /**
   * Register an already-swept, non-blocked skill into the library under its
   * frontmatter type. Returns any collision warnings. Shared by the clean-path
   * auto-register and the review-path `confirmImport`.
   */
  private _register(name: string, destDir: string, body: string, report: SkillSecurityReport): string[] {
    return SkillLibrary.getInstance().registerSource([
      {
        name,
        description: '',
        type: parseFrontmatterType(body),
        source: 'imported',
        path: path.join(destDir, 'SKILL.md'),
        metadata: { tags: [] },
        security: report,
      },
    ]);
  }

  /**
   * Register a previously-swept, user-approved `review` skill (C3 consent gate).
   *
   * Idempotent and replay-safe. The renderer passes the on-disk imported path
   * and the `contentHash` from the report the user actually saw. We re-read the
   * SKILL.md that is on disk RIGHT NOW and re-scan it (regex only - the deep
   * sweep already ran at import time and the user is approving that verdict):
   *  - If the freshly-hashed content does not match the approved `contentHash`,
   *    the on-disk body changed since the user reviewed it → refuse. This is
   *    what stops an approval from being replayed against different content.
   *  - If the fresh verdict is `blocked`, refuse (a regex block is absolute).
   *  - Otherwise register and return ok.
   *
   * Re-running is safe: registering the same entry twice is a no-op overwrite.
   */
  async confirmImport(params: {
    name: string;
    destPath: string;
    contentHash: string;
  }): Promise<{ ok: true } | { ok: false; error: 'content-changed' | 'blocked' | 'not-found' }> {
    const { name, destPath, contentHash } = params;
    const skillMd = path.join(destPath, 'SKILL.md');
    let body: string;
    try {
      body = (await this.io.readFile(skillMd)).toString('utf-8');
    } catch {
      return { ok: false, error: 'not-found' };
    }

    const [report] = await SkillGuard.scan([{ name, body, description: '', tags: [] }], { llm: false });

    // Replay guard: the approval is bound to the exact content the user saw.
    if (report.contentHash !== contentHash) {
      return { ok: false, error: 'content-changed' };
    }
    if (report.verdict === 'blocked') {
      await SkillQuarantine.quarantine(name, destPath, this.quarantineIo);
      return { ok: false, error: 'blocked' };
    }

    this._register(name, destPath, body, report);
    return { ok: true };
  }
}
