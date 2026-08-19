/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { realpathSync } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

/**
 * Type gate for targets the app hands to an OS *launcher*
 * (`shell.openPath`, `open`, `xdg-open`, `code`).
 *
 * `confinePath` bounds the LOCATION of a path - it realpath-collapses the
 * existing prefix and fails closed outside the authorized roots. It says
 * nothing about the TYPE. An agent writing `report.command`, `payload.desktop`
 * or an `Evil.app` bundle INSIDE its own workspace passes confinement trivially,
 * because the workspace *is* an authorized root - and the OS handler then
 * executes it. Confinement and this gate are complementary: location, then type.
 *
 * ## Allow-list, not deny-list
 *
 * The enforcement below is an allow-list of openable document types, with one
 * bounded refusal set layered on top for *directories*. That choice is
 * deliberate:
 *
 *  - The set of types an OS will EXECUTE is open-ended and grows without us:
 *    LaunchServices, the Windows shell and freedesktop all add associations,
 *    and a third-party install can make `.py` or `.jar` a launch target on a
 *    machine where it was inert. A deny-list loses by default - one missed
 *    extension is arbitrary code execution.
 *  - The set of types this feature legitimately needs is small and enumerable:
 *    agent-produced reports, data, media, and plain-text source. Unknown or
 *    novel extensions fail closed, which is the correct default for a launcher.
 *
 * Directories are the exception: they cannot be enumerated by extension (a
 * workspace may legitimately be named `release.v2`), and the only directories an
 * OS launches instead of browsing are registered bundles, which *are* identified
 * by a bounded, well-known extension set. So directories are allowed unless they
 * carry a bundle extension.
 *
 * Types deliberately absent from the allow-list, and why - macOS: `.app`,
 * `.command`, `.tool`, `.scpt`, `.scptd`, `.applescript`, `.workflow`, `.dmg`,
 * `.pkg`; linux: `.desktop`, `.appimage`, `.deb`, `.rpm`, `.run`; win32:
 * `.exe`, `.bat`, `.cmd`, `.com`, `.ps1`, `.psm1`, `.scr`, `.msi`, `.msp`,
 * `.lnk`, `.pif`, `.cpl`, `.reg`, `.inf`, `.scf`, `.hta`, `.vbs`, `.vbe`,
 * `.wsf`, `.jse`; cross-platform interpreter targets `.js`, `.mjs`, `.cjs`,
 * `.py`, `.pyw`, `.rb`, `.pl`, `.php`, `.jar`, `.sh`, `.bash`, `.zsh`, `.fish`,
 * `.lua`, `.r` (a Lua-for-Windows or R install registers those to an
 * interpreter, exactly the "inert here, executable there" case a launcher must
 * fail closed on); and archives/disk images, which expand into any of the above.
 *
 * ## Office documents
 *
 * `.doc`, `.xls`, `.ppt`, `.docx`, `.xlsx`, `.pptx` are admitted deliberately.
 * The gate's question is "does the OS handler EXECUTE this by default", and for
 * every Office format the answer is no: the handler opens a document, and macro
 * execution is gated behind Protected View and the Trust Center (macros in
 * internet-sourced files are blocked outright since 2022). The legacy OLE
 * formats are macro-CAPABLE, but capability is not dispatch, and refusing an
 * everyday `.doc` would be friction with no security won.
 *
 * The macro-enabled formats (`.docm`, `.xlsm`, `.pptm`, `.xlam`, `.ppam`) stay
 * out on a different basis: they SELF-DECLARE macros, so refusing them is a free
 * signal-based filter, and nothing this feature legitimately produces needs a
 * macro workbook. That asymmetry is intentional, not an oversight.
 *
 * Refusals are returned as a structured `{ ok: false, error }` - the IPC bridge
 * has no rejection channel, so a throw would hang the renderer forever, and a
 * silent no-op is exactly the failure mode the shell providers already had to
 * fix once (#616).
 */

/** A refusal to hand `target` to an OS launcher. */
export type OpenTargetRefusal = { ok: false; error: string };

/**
 * File extensions safe to hand to an OS launcher: documents, data, media, and
 * plain-text source whose default association on macOS, Windows and Linux is a
 * viewer/editor rather than an interpreter. Lower-case, leading dot.
 */
const OPENABLE_FILE_EXTENSIONS = new Set([
  // Plain text and structured data
  '.txt',
  '.text',
  '.md',
  '.markdown',
  '.mdx',
  '.rst',
  '.adoc',
  '.log',
  '.csv',
  '.tsv',
  '.json',
  '.jsonl',
  '.ndjson',
  '.yaml',
  '.yml',
  '.toml',
  '.ini',
  '.cfg',
  '.conf',
  '.xml',
  '.diff',
  '.patch',
  // Documents
  '.pdf',
  '.rtf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.odt',
  '.ods',
  '.odp',
  '.pages',
  '.numbers',
  '.key',
  '.epub',
  // Images
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.tif',
  '.tiff',
  '.ico',
  '.heic',
  '.heif',
  '.avif',
  '.svg',
  // Audio / video
  '.mp3',
  '.m4a',
  '.wav',
  '.aac',
  '.flac',
  '.ogg',
  '.opus',
  '.mp4',
  '.m4v',
  '.mov',
  '.webm',
  '.mkv',
  '.avi',
  '.wmv',
  // Web and stylesheets (open in a browser/editor, not a shell)
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.sass',
  '.less',
  // Compiled-language source: no OS association executes these on any of the
  // three platforms. Interpreter-backed sources (.js/.py/.rb/.sh/...) are
  // excluded on purpose - see the module comment.
  '.c',
  '.h',
  '.cc',
  '.cpp',
  '.cxx',
  '.hpp',
  '.hh',
  '.cs',
  '.go',
  '.rs',
  '.java',
  '.kt',
  '.swift',
  '.sql',
  '.graphql',
  '.proto',
  // TypeScript / component sources. Same class as the compiled-language sources
  // above: no OS association executes them anywhere. Windows Script Host
  // dispatches `.js`/`.jse`/`.wsf`/`.vbs` - never `.ts`, which the Windows shell
  // maps to an MPEG-2 transport stream, i.e. a media viewer. Refusing them made
  // the memory archive's "Open source file" a dead click on this very codebase.
  '.ts',
  '.tsx',
  '.jsx',
  '.mts',
  '.cts',
  '.vue',
  '.svelte',
  // Plain-text authoring/data formats with an editor (or subtitle) association.
  '.tex',
  '.srt',
  '.vtt',
  '.env',
]);

/**
 * Directory extensions the OS treats as a launchable bundle rather than a
 * folder to browse. Bounded by construction: these are the registered bundle
 * types, not an open-ended guess at "things that execute".
 */
const EXECUTABLE_BUNDLE_EXTENSIONS = new Set([
  '.app',
  '.bundle',
  '.framework',
  '.kext',
  '.plugin',
  '.appex',
  '.xpc',
  '.prefpane',
  '.qlgenerator',
  '.mdimporter',
  '.osax',
  '.scptd',
  '.workflow',
  '.action',
  '.service',
  '.saver',
  '.wdgt',
  '.docset',
  '.pkg',
  '.mpkg',
]);

/**
 * Paths the MAIN process produced itself and vouches for.
 *
 * The updater downloads a release asset (`.dmg`/`.exe`/`.msi`/`.AppImage`/...)
 * into the OS downloads dir, verifies its SHA-512 against the signed release
 * metadata, and the update modal then offers "Open". That target is an
 * installer by definition, so the allow-list above would refuse it - correctly,
 * for renderer-supplied input. This registry is the narrow, unforgeable
 * exception: only main-process code can add to it, the renderer cannot, and it
 * authorizes exactly one already-integrity-checked file rather than a type.
 */
const appProducedTargets = new Set<string>();

/**
 * Vouch for a specific file the main process created and verified, exempting it
 * from the open-target type gate. Never call this with renderer-supplied input.
 *
 * @param target - Absolute path to the app-produced file.
 */
export function registerAppProducedOpenTarget(target: string): void {
  if (typeof target !== 'string' || target.length === 0) return;
  let resolved: string;
  try {
    resolved = path.resolve(target);
  } catch {
    return;
  }
  appProducedTargets.add(resolved);
  // The gate receives the realpath-collapsed form from `confinePath` (on macOS
  // `/var/...` collapses to `/private/var/...`), so register that form too.
  try {
    appProducedTargets.add(realpathSync(resolved));
  } catch {
    // Not created yet, or already removed; the resolved form still applies.
  }
}

/**
 * Decide whether a CONFINED path may be handed to an OS launcher.
 *
 * Call this only after `confinePath` has accepted the path: it assumes the
 * argument is already absolute and realpath-collapsed. Reveal-style operations
 * (`shell.showItemInFolder`) must NOT call it - selecting a file in the file
 * manager never executes it, so gating Reveal would only break a safe action.
 *
 * @param target - The confined absolute path.
 * @returns A structured refusal, or `null` when the target may be opened.
 */
export async function refuseUnsafeOpenTarget(target: string): Promise<OpenTargetRefusal | null> {
  if (appProducedTargets.has(target)) return null;

  let info: Awaited<ReturnType<typeof stat>>;
  try {
    info = await stat(target);
  } catch {
    return { ok: false, error: 'target does not exist' };
  }

  const ext = path.extname(target).toLowerCase();

  if (info.isDirectory()) {
    if (EXECUTABLE_BUNDLE_EXTENSIONS.has(ext)) {
      return { ok: false, error: `refusing to launch a "${ext}" bundle` };
    }
    return null;
  }

  if (!info.isFile()) {
    return { ok: false, error: 'refusing to open a non-regular file' };
  }

  if (ext === '') {
    // With no extension there is no association to dispatch on, so macOS and
    // Linux fall back to the execute bit and run the file in a terminal. A
    // plain data file (README, NOTES, Makefile) is still fine to open.
    // Windows reports mode 0o666 for every file, so this only ever fires on
    // POSIX - which is also the only place the fallback exists.
    if ((info.mode & 0o111) !== 0) {
      return { ok: false, error: 'refusing to open an executable file' };
    }
    return null;
  }

  if (!OPENABLE_FILE_EXTENSIONS.has(ext)) {
    return { ok: false, error: `refusing to open "${ext}": not an openable document type` };
  }

  return null;
}
