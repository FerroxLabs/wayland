/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WAYLAND_KNOWLEDGE_DIR } from './bootstrap';
import { confinePath } from '@process/bridge/pathConfinement';
import { resolveWithinApprovedDirectory } from '@process/bridge/userApprovedPaths';
import { getIjfwArchiveService } from '@process/services/memory/ijfwArchiveService';
import i18n from '@process/services/i18n';

/**
 * Read, write, inject and manage a project's `.wayland/` knowledge.
 *
 * Knowledge lives at `{workspace}/.wayland/` and is scoped to ONE project (the
 * deliberate fix for Foundry's "notebooks leaked into every chat" bug). It is
 * surfaced two ways:
 *   1. The project workspace UI (editable instructions / rules / decisions +
 *      dropped reference files).
 *   2. Auto-injection: when a chat is created inside a project, the substantive
 *      knowledge is appended to that one conversation's system-rules channel
 *      (see ConversationServiceImpl.createConversation). Per-conversation, never
 *      global, so it cannot leak into non-project chats.
 */

/** The three first-class, editable knowledge documents. */
export type KnowledgeKind = 'context' | 'rules' | 'decisions';

const KNOWLEDGE_FILE: Record<KnowledgeKind, string> = {
  context: 'CONTEXT.md',
  rules: 'rules.md',
  decisions: 'decisions.md',
};

/** Section labels used when composing the injected prompt block. */
const INJECT_LABEL: Record<KnowledgeKind, string> = {
  context: 'Project context',
  rules: 'Project rules & conventions',
  decisions: 'Project decisions',
};

const REFERENCE_DIR = 'reference';
const SUMMARY_FILE = 'summaries.json';

export type KnowledgeSummaries = Partial<Record<KnowledgeKind, string>>;

export type ProjectKnowledge = {
  context: string;
  rules: string;
  decisions: string;
};

export type ReferenceFile = {
  name: string;
  path: string;
  size: number;
};

const knowledgeRoot = (workspace: string): string => path.join(workspace, WAYLAND_KNOWLEDGE_DIR);

const readIfExists = async (filePath: string): Promise<string> => {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
};

/** Read all three knowledge documents (empty string for any missing file). */
export async function readProjectKnowledge(workspace: string): Promise<ProjectKnowledge> {
  if (!workspace || !workspace.trim()) return { context: '', rules: '', decisions: '' };
  const root = knowledgeRoot(workspace);
  const [context, rules, decisions] = await Promise.all([
    readIfExists(path.join(root, KNOWLEDGE_FILE.context)),
    readIfExists(path.join(root, KNOWLEDGE_FILE.rules)),
    readIfExists(path.join(root, KNOWLEDGE_FILE.decisions)),
  ]);
  return { context, rules, decisions };
}

/** Write one knowledge document, creating the `.wayland/` folder if needed. */
export async function writeProjectKnowledge(workspace: string, kind: KnowledgeKind, content: string): Promise<void> {
  if (!workspace || !workspace.trim()) throw new Error('Project has no workspace folder');
  const root = knowledgeRoot(workspace);
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(path.join(root, KNOWLEDGE_FILE[kind]), content, 'utf-8');
}

/**
 * Strip the seeded boilerplate so a freshly-bootstrapped, unedited document
 * injects NOTHING (no prompt noise). We drop the top `# heading`, instructional
 * blockquote lines (`> ...`), and surrounding whitespace; whatever real content
 * the user typed remains. Returns '' when only boilerplate is present.
 */
const substantive = (raw: string): string => {
  if (!raw) return '';
  const body = raw
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (t.startsWith('>')) return false; // instructional blockquote
      if (/^#\s/.test(t)) return false; // top-level heading (the seeded title)
      return true;
    })
    .join('\n')
    .trim();
  return body;
};

/**
 * Compose the project's substantive knowledge into a single block ready to
 * append to a conversation's system-rules channel. Returns '' when the project
 * has no workspace or no edited knowledge yet (so nothing is injected).
 */
export async function loadProjectKnowledgeBlock(workspace: string): Promise<string> {
  const k = await readProjectKnowledge(workspace);
  const sections: string[] = [];
  (Object.keys(KNOWLEDGE_FILE) as KnowledgeKind[]).forEach((kind) => {
    const body = substantive(k[kind]);
    if (body) sections.push(`## ${INJECT_LABEL[kind]}\n\n${body}`);
  });
  if (sections.length === 0) return '';
  return `[Project Knowledge - shared context for every chat in this project]\n\n${sections.join('\n\n')}`;
}

/** Largest single memory entry body included in the injected memory block. */
const MEMORY_ENTRY_CHAR_CAP = 8_000;
/** Largest total memory block injected into a chat's system-rules channel. */
const MEMORY_BLOCK_CHAR_CAP = 24_000;
/** Most memory entries scanned when building the injected block. */
const MEMORY_BLOCK_MAX_ENTRIES = 50;

/**
 * Compose the user's global Wayland Memory store (`~/.ijfw/memory/*.md`) into a
 * single attributed block ready to append to a conversation's system-rules
 * channel, alongside the project-knowledge block. This is what lets the chat
 * agent answer questions about content the user dropped into the Memory UI
 * (GitHub #256): drop ingestion writes full file content under the GLOBAL memory
 * dir, but the only context the agent previously saw was project `.wayland/`
 * knowledge, so dropped memory was invisible to chat.
 *
 * We read from the already-in-process `getIjfwArchiveService()` index (no new
 * disk walk or watcher) and pull only entries whose source file lives under the
 * global memory dir - exactly where drop ingestion and `quickAdd('global')`
 * write - so per-project memory (surfaced separately, read-only, in the Memory
 * tab) is not pulled in and cannot double with project knowledge. Bodies are
 * read in full (the list index only carries a 200-char preview); per-entry and
 * total size are capped, and the block truncates gracefully. Returns '' when the
 * store is empty or unreadable, so nothing is injected.
 *
 * The entry cap (MEMORY_BLOCK_MAX_ENTRIES) is applied AFTER the global-store
 * filter, never before (#256). `listEntries` returns the whole corpus -
 * global AND per-project entries, recency-sorted - so capping at the service
 * layer would let a user's active project (which may have written dozens of
 * recent journal/observation entries) push every global-memory entry past the
 * cap, leaving the global filter empty and re-introducing the "not found"
 * symptom. We deliberately do NOT use `listEntries({ project: 'global' })`: the
 * `global` tag is not reliably present on everything under the global dir
 * (`quickAdd('global')` writes `tags: []`, and drops that already carry their
 * own frontmatter bypass the `scope: global` mapping), so the sourcePath prefix
 * is the true source of truth for global-store membership.
 */
export async function loadGlobalMemoryBlock(): Promise<string> {
  const globalDir = path.join(os.homedir(), '.ijfw', 'memory');
  const svc = getIjfwArchiveService();
  let listed: Awaited<ReturnType<typeof svc.listEntries>>;
  try {
    // No `limit`: pull the full recency-sorted corpus so the global filter and
    // the entry cap below both operate on global entries only, not on a corpus
    // already truncated by the user's active per-project entries.
    listed = await svc.listEntries({ sort: 'recent' });
  } catch (err) {
    console.warn('[projectKnowledge] global memory block: list failed:', err);
    return '';
  }

  const globalEntries = listed.entries
    .filter((e) => e.sourcePath.startsWith(globalDir + path.sep))
    .slice(0, MEMORY_BLOCK_MAX_ENTRIES);
  if (globalEntries.length === 0) return '';

  const sections: string[] = [];
  let used = 0;
  for (const entry of globalEntries) {
    // Stop before reading the next body once the remaining char budget is
    // nearly exhausted: the heading + label overhead means a section needs room
    // beyond its body, so once `used` is within one body-cap of the total cap we
    // cannot fit another meaningful entry and should not read it (#256 perf).
    if (used + MEMORY_ENTRY_CHAR_CAP > MEMORY_BLOCK_CHAR_CAP && used > 0) break;

    let body = entry.bodyPreview;
    try {
      const full = await svc.getEntry(entry.id);
      if (full?.body) body = full.body;
    } catch {
      // fall back to the preview already in hand
    }
    body = body.trim();
    if (!body) continue;
    if (body.length > MEMORY_ENTRY_CHAR_CAP) body = `${body.slice(0, MEMORY_ENTRY_CHAR_CAP)}\n\n…(truncated)`;
    const heading = entry.summary.trim() || 'Untitled';
    const section = `## ${heading}\n\n${body}`;
    if (used + section.length > MEMORY_BLOCK_CHAR_CAP) break;
    sections.push(section);
    used += section.length;
  }

  if (sections.length === 0) return '';
  const label = i18n.t('memory.injectedLabel', {
    defaultValue: 'User memory (from Wayland Memory) - the user dropped or saved this; use it to answer questions about it',
  });
  return `[${label}]\n\n${sections.join('\n\n')}`;
}

/** True for a Node error carrying an ENOENT-style "file not found" code. */
const isNotFound = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as NodeJS.ErrnoException).code === 'ENOENT';

/**
 * Read the editable one-line summaries for each knowledge doc. Stored in
 * `.wayland/summaries.json` (separate from the docs so a doc edit never clobbers
 * its summary and vice-versa). Returns {} when absent.
 *
 * ENOENT (no file yet) and a *parse failure* are deliberately distinguished:
 * a missing file is normal and yields {}, but a corrupt file throws so the
 * caller (writeProjectSummary) refuses to clobber sibling summaries - see
 * REL-IJFW-01.
 */
export async function readProjectSummaries(workspace: string): Promise<KnowledgeSummaries> {
  if (!workspace || !workspace.trim()) return {};
  const file = path.join(knowledgeRoot(workspace), SUMMARY_FILE);
  let raw: string;
  try {
    raw = await fs.readFile(file, 'utf-8');
  } catch (err) {
    if (isNotFound(err)) return {}; // no summaries yet - normal
    throw err; // unreadable for some other reason - surface it, don't mask
  }
  try {
    const parsed = JSON.parse(raw) as KnowledgeSummaries;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    throw new SummaryParseError(file, err);
  }
}

/** Thrown when `summaries.json` exists but is not parseable JSON. */
class SummaryParseError extends Error {
  constructor(
    readonly file: string,
    readonly cause: unknown
  ) {
    super(`Corrupt summaries.json at ${file}`);
    this.name = 'SummaryParseError';
  }
}

/** Write/replace one doc's one-line summary, preserving the others. */
export async function writeProjectSummary(workspace: string, kind: KnowledgeKind, summary: string): Promise<void> {
  if (!workspace || !workspace.trim()) throw new Error('Project has no workspace folder');
  const root = knowledgeRoot(workspace);
  await fs.mkdir(root, { recursive: true });
  const file = path.join(root, SUMMARY_FILE);

  let current: KnowledgeSummaries;
  try {
    current = await readProjectSummaries(workspace);
  } catch (err) {
    // A corrupt file would otherwise read back as {} and let this write erase
    // every sibling summary (REL-IJFW-01). Preserve the bad file as a `.corrupt`
    // backup so nothing is lost, then start fresh from {} for this one key.
    if (err instanceof SummaryParseError) {
      const backup = `${file}.corrupt-${Date.now()}`;
      try {
        await fs.rename(file, backup);
        console.warn(`[projectKnowledge] corrupt ${SUMMARY_FILE} backed up to ${backup}:`, err.cause);
      } catch (renameErr) {
        // Could not move the corrupt file - refuse to clobber it.
        console.error(`[projectKnowledge] refusing to overwrite corrupt ${SUMMARY_FILE}:`, renameErr);
        throw err;
      }
      current = {};
    } else {
      throw err;
    }
  }

  current[kind] = summary;
  await fs.writeFile(file, JSON.stringify(current, null, 2), 'utf-8');
}

/**
 * Append one decision to `.wayland/decisions.md` as a dated bullet and return
 * the updated document. This is the manual "+ Add decision" path for the Memory
 * tab; the decisions doc is also auto-injected into every chat in the project.
 */
export async function appendProjectDecision(workspace: string, text: string): Promise<string> {
  if (!workspace || !workspace.trim()) throw new Error('Project has no workspace folder');
  const trimmed = text.trim();
  if (!trimmed) {
    const current = await readProjectKnowledge(workspace);
    return current.decisions;
  }
  const root = knowledgeRoot(workspace);
  await fs.mkdir(root, { recursive: true });
  const file = path.join(root, KNOWLEDGE_FILE.decisions);
  const existing = await readIfExists(file);
  const date = new Date().toISOString().slice(0, 10);
  const bullet = `- ${date} - ${trimmed.replace(/\n+/g, ' ')}`;
  const next = existing.trim() ? `${existing.replace(/\s+$/, '')}\n${bullet}\n` : `${bullet}\n`;
  await fs.writeFile(file, next, 'utf-8');
  return next;
}

const IJFW_MEMORY_DIR = path.join('.ijfw', 'memory');
const IJFW_FILE_CHAR_CAP = 24_000;

export type IjfwMemoryFile = { name: string; content: string };

/**
 * Read IJFW's own per-project memory (`{workspace}/.ijfw/memory/*.md`) when IJFW
 * has actually run in this project's workspace. This is IJFW's record (its
 * progress journal / handoffs), surfaced READ-ONLY and clearly attributed in the
 * project Memory tab - never edited here and never auto-injected into chats.
 * Returns `{ available: false }` when the folder is absent.
 */
export async function readProjectIjfwMemory(
  workspace: string
): Promise<{ available: boolean; files: IjfwMemoryFile[] }> {
  if (!workspace || !workspace.trim()) return { available: false, files: [] };
  const dir = path.join(workspace, IJFW_MEMORY_DIR);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return { available: false, files: [] };
  }
  const mdFiles = entries.filter((n) => n.toLowerCase().endsWith('.md')).sort();
  const files: IjfwMemoryFile[] = [];
  for (const name of mdFiles) {
    try {
      const raw = await fs.readFile(path.join(dir, name), 'utf-8');
      const content = raw.length > IJFW_FILE_CHAR_CAP ? `${raw.slice(0, IJFW_FILE_CHAR_CAP)}\n\n…(truncated)` : raw;
      files.push({ name, content });
    } catch {
      // unreadable file - skip
    }
  }
  return { available: files.length > 0, files };
}

/** List files dropped into the project's `.wayland/reference/` folder. */
export async function listProjectReference(workspace: string): Promise<ReferenceFile[]> {
  if (!workspace || !workspace.trim()) return [];
  const dir = path.join(knowledgeRoot(workspace), REFERENCE_DIR);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const files = await Promise.all(
    entries.map(async (name): Promise<ReferenceFile | null> => {
      try {
        const full = path.join(dir, name);
        const stat = await fs.stat(full);
        if (!stat.isFile()) return null;
        return { name, path: full, size: stat.size };
      } catch {
        return null;
      }
    })
  );
  return files.filter((f): f is ReferenceFile => f !== null).sort((a, b) => a.name.localeCompare(b.name));
}

/** Most reference files accepted in one addProjectReference call. */
const MAX_REFERENCE_FILES = 50;
/** Largest single reference file that may be copied (bytes). */
const MAX_REFERENCE_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Copy dropped files into `.wayland/reference/`. Returns the resulting file
 * list. Name collisions are de-duplicated with a numeric suffix so a re-drop
 * never silently overwrites.
 *
 * Sources are renderer-supplied (drag-drop file paths) so they are NOT trusted.
 * Reference files are later read back into chat prompts, so an arbitrary file
 * here is an arbitrary read-into-model exfil primitive (SEC-IPC-04). Defenses:
 *   - PRIMARY GATE: each source must either confine to an authorized app root
 *     (`confinePath`) OR sit inside a directory the user explicitly approved
 *     through the native open dialog (`resolveWithinApprovedDirectory`). A plain
 *     absolute path the renderer injects (e.g. `/etc/passwd`, ~/.aws/credentials)
 *     is neither - it never reaches lstat/copyFile. Dialog-picked files remain
 *     accepted because dialogBridge approves their parent directory in MAIN.
 *   - lstat (NOT stat) and refuse symlinks/junctions/reparse points on the
 *     source itself, so a symlink can never be dereferenced to capture its
 *     sensitive target (e.g. ~/.aws/credentials).
 *   - copy only regular files (skip dirs / sockets / devices / fifos).
 *   - cap the per-call count and per-file size to bound abuse and disk use.
 */
export async function addProjectReference(workspace: string, sourcePaths: string[]): Promise<ReferenceFile[]> {
  if (!workspace || !workspace.trim()) throw new Error('Project has no workspace folder');
  const dir = path.join(knowledgeRoot(workspace), REFERENCE_DIR);
  await fs.mkdir(dir, { recursive: true });

  const sources = sourcePaths.slice(0, MAX_REFERENCE_FILES);
  if (sourcePaths.length > MAX_REFERENCE_FILES) {
    console.warn(`[projectKnowledge] addReference capped at ${MAX_REFERENCE_FILES} files (got ${sourcePaths.length})`);
  }

  for (const src of sources) {
    try {
      // PRIMARY GATE: resolve the source to a trusted path. A drag-drop of a
      // specific file is an explicit local user gesture, so - mirroring the
      // conversation-workspace copy path (#67) - `allowOutsideRoots` accepts a
      // source that sits outside the static/registered roots while keeping every
      // form/traversal/symlink/sensitive-location guard intact (a secret like
      // ~/.ssh/id_rsa is still rejected). Dialog-picked files still resolve via
      // resolveWithinApprovedDirectory. Both gates return the resolved,
      // realpath-collapsed path so the path validated is the path copied.
      const trusted =
        (await confinePath(src, { allowOutsideRoots: true })) ?? resolveWithinApprovedDirectory(src);
      if (trusted === null) {
        console.warn('[projectKnowledge] refusing out-of-root reference source:', src);
        continue;
      }

      // lstat does not follow symlinks: a symlinked source is rejected outright
      // rather than copying whatever it points at.
      const stat = await fs.lstat(trusted);
      if (stat.isSymbolicLink()) {
        console.warn('[projectKnowledge] refusing symlinked reference source:', src);
        continue;
      }
      if (!stat.isFile()) continue; // skip directories / non-regular files
      if (stat.size > MAX_REFERENCE_FILE_BYTES) {
        console.warn(`[projectKnowledge] refusing oversized reference source (${stat.size} bytes):`, src);
        continue;
      }
      const dest = await uniqueDest(dir, path.basename(trusted));
      await fs.copyFile(trusted, dest);
    } catch (err) {
      console.warn('[projectKnowledge] failed to copy reference file:', src, err);
    }
  }
  return listProjectReference(workspace);
}

/**
 * Write uploaded reference files (already-read bytes) into `.wayland/reference/`.
 * Returns the resulting file list. Used by the WebUI browser-upload path (#55),
 * where the user has no host filesystem to drag from and the bytes arrive over
 * an authenticated multipart upload instead of a renderer-supplied path.
 *
 * Unlike `addProjectReference`, there is no source path to confine - the bytes
 * are the payload, not a pointer to a file on disk - so the source-path gates
 * (confinePath / approved-directory / symlink) do not apply. The write is kept
 * contained the same way `removeProjectReference` is: the destination filename
 * is reduced to its basename so it can never escape the reference dir, and the
 * per-call count and per-file size are capped exactly as the copy path is.
 */
export async function saveProjectReferenceUploads(
  workspace: string,
  files: Array<{ name: string; data: Buffer }>
): Promise<ReferenceFile[]> {
  if (!workspace || !workspace.trim()) throw new Error('Project has no workspace folder');
  const dir = path.join(knowledgeRoot(workspace), REFERENCE_DIR);
  await fs.mkdir(dir, { recursive: true });

  const accepted = files.slice(0, MAX_REFERENCE_FILES);
  if (files.length > MAX_REFERENCE_FILES) {
    console.warn(`[projectKnowledge] reference upload capped at ${MAX_REFERENCE_FILES} files (got ${files.length})`);
  }

  for (const file of accepted) {
    try {
      if (file.data.byteLength > MAX_REFERENCE_FILE_BYTES) {
        console.warn(`[projectKnowledge] refusing oversized reference upload (${file.data.byteLength} bytes):`, file.name);
        continue;
      }
      // basename only - an uploaded name like `../../etc/x` can never escape the
      // reference dir (same containment as removeProjectReference).
      const safeName = path.basename(file.name);
      if (!safeName || safeName === '.' || safeName === '..') continue;
      const dest = await uniqueDest(dir, safeName);
      await fs.writeFile(dest, file.data);
    } catch (err) {
      console.warn('[projectKnowledge] failed to write reference upload:', file.name, err);
    }
  }
  return listProjectReference(workspace);
}

/** Remove one reference file by its basename (path-traversal guarded). */
export async function removeProjectReference(workspace: string, name: string): Promise<ReferenceFile[]> {
  if (!workspace || !workspace.trim()) throw new Error('Project has no workspace folder');
  const safe = path.basename(name); // never escape the reference dir
  const dir = path.join(knowledgeRoot(workspace), REFERENCE_DIR);
  try {
    await fs.unlink(path.join(dir, safe));
  } catch (err) {
    console.warn('[projectKnowledge] failed to remove reference file:', safe, err);
  }
  return listProjectReference(workspace);
}

/** Resolve a non-colliding destination path inside `dir` for `fileName`. */
async function uniqueDest(dir: string, fileName: string): Promise<string> {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  let candidate = path.join(dir, fileName);
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await fs.access(candidate);
      candidate = path.join(dir, `${base}-${n}${ext}`);
      n += 1;
    } catch {
      return candidate;
    }
  }
}
