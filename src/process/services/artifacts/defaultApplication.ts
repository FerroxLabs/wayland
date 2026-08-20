/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WHAT WILL ACTUALLY HAPPEN WHEN THE USER CLICKS OPEN.
 *
 * The button said "Open". The user could not tell whether that meant Preview, a
 * browser, or the thing that hijacked `.md` last week - and a deliverable is
 * exactly the case where it matters, because the file was written by an agent
 * and the user has not seen it yet. So the label names the app: "Open in
 * Preview".
 *
 * ELECTRON CANNOT ANSWER THIS. `app.getApplicationNameForProtocol` resolves
 * PROTOCOLS (`mailto:`, `https:`) and there is no cross-platform API for the
 * default handler of a FILE EXTENSION. So this resolves per platform, where it
 * is cheap and reliable, and returns null everywhere else.
 *
 * A BUTTON THAT LIES IS WORSE THAN A VAGUE ONE. Every path here returns null
 * rather than a guess: an unresolved type, a helper that is not installed, a
 * timeout, a name that does not look like a name. Null renders as the plain
 * "Open" the button has always said. Nothing here ever widens what may be
 * opened - `refuseUnsafeOpenTarget` still decides that, and is consulted FIRST
 * so a target the host would refuse never gets an app name promising otherwise.
 *
 * PER PLATFORM
 *
 *  - darwin: `NSWorkspace.URLForApplicationToOpenURL` through `osascript -l
 *    JavaScript`, then the FileManager display name of the bundle. This is the
 *    same Launch Services answer the OS itself would use, not an inference from
 *    the extension.
 *  - linux: `xdg-mime query filetype` then `xdg-mime query default`, then the
 *    `Name=` field of the resulting `.desktop` entry, looked up across the XDG
 *    application directories. Where `xdg-mime` is absent (a headless box, a
 *    minimal container) both queries fail and the answer is null.
 *  - win32: NOT RESOLVED. The honest answer needs the `UserChoice` ProgId out
 *    of the per-user registry and then a friendly name that is frequently
 *    missing or a raw ProgId like `htmlfile`. Getting it wrong shows the user a
 *    name for an app that will not open the file, which is the one outcome this
 *    module exists to avoid, so Windows keeps the plain "Open".
 *
 * The effects are injected so the decisions - the sanitiser, the `.desktop`
 * lookup, the refusal to name an app for a refused target - are tested against
 * a real filesystem with only the subprocess recorded.
 */

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { refuseUnsafeOpenTarget } from '@process/bridge/shellOpenSafety';

/** A helper that has not answered by now is not going to help the label. */
export const DEFAULT_APP_TIMEOUT_MS = 2500;

/** An application name is a menu item, not a paragraph. */
export const MAX_APPLICATION_NAME_LENGTH = 64;

/** How long a resolved name is reused before the OS is asked again. */
export const DEFAULT_APP_CACHE_TTL_MS = 5 * 60 * 1000;

/** Distinct extensions remembered at once. A user has a handful of file types. */
export const DEFAULT_APP_CACHE_MAX_ENTRIES = 64;

export interface DefaultApplicationEffects {
  platform: NodeJS.Platform;
  /** Run a helper, capturing stdout. Null on ANY failure: missing, non-zero, timeout. */
  run(file: string, args: readonly string[]): Promise<string | null>;
  /** Read a text file. Null when unreadable. */
  readText(file: string): Promise<string | null>;
  /** Directories holding `.desktop` entries, most specific first (linux only). */
  applicationDirs(): readonly string[];
  /** The type gate. A target it refuses is never given an app name. */
  refuse(target: string): Promise<{ ok: false; error: string } | null>;
}

/**
 * Reduce a candidate to a name we are willing to print, or to null.
 *
 * The input is an OS-supplied string that reaches a button label, so it is
 * bounded, flattened to one line and stripped of control characters. A
 * `.desktop` file is a plain text file any installed package can write, and on
 * Linux it can also sit in the user's own `~/.local/share/applications`, which
 * an agent with shell access can write to.
 */
export function sanitizeApplicationName(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  // eslint-disable-next-line no-control-regex -- control characters in a button label are exactly what is being removed
  const flattened = raw.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim();
  if (!flattened) return null;
  if (flattened.length > MAX_APPLICATION_NAME_LENGTH) return null;
  return flattened;
}

/**
 * The JXA program asked to resolve one file.
 *
 * The path arrives as `argv[0]`, never interpolated into the source: a filename
 * is model-authored text and building a script around it is how a quoting bug
 * becomes script injection. `URLForApplicationToOpenURL` returns nil for a type
 * with no handler, which becomes an empty string and then null.
 */
const MAC_RESOLVER_SCRIPT = [
  'function run(argv) {',
  '  ObjC.import("AppKit");',
  '  var url = $.NSWorkspace.sharedWorkspace.URLForApplicationToOpenURL($.NSURL.fileURLWithPath(argv[0]));',
  '  if (!url) return "";',
  '  var bundle = ObjC.unwrap(url.path);',
  '  if (!bundle) return "";',
  '  return ObjC.unwrap($.NSFileManager.defaultManager.displayNameAtPath(bundle));',
  '}',
].join('\n');

async function resolveOnMac(target: string, effects: DefaultApplicationEffects): Promise<string | null> {
  return sanitizeApplicationName(await effects.run('osascript', ['-l', 'JavaScript', '-e', MAC_RESOLVER_SCRIPT, target]));
}

/**
 * The `Name=` of a `.desktop` entry, from its `[Desktop Entry]` group only.
 *
 * Localised variants (`Name[de]=`) are ignored: the app runs in the user's
 * locale but the desktop-entry locale keys are keyed on a different string than
 * the one the renderer has, and printing a German name to an English UI is a
 * worse answer than the C-locale one. Additional groups (`[Desktop Action ...]`)
 * carry their own `Name=` for a MENU ITEM, not the application, so parsing
 * stops at the first group boundary.
 */
export function parseDesktopEntryName(contents: string): string | null {
  let inEntry = false;
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (line.startsWith('[')) {
      if (inEntry) return null;
      inEntry = line === '[Desktop Entry]';
      continue;
    }
    if (!inEntry || !line.startsWith('Name')) continue;
    const equals = line.indexOf('=');
    if (equals < 0) continue;
    if (line.slice(0, equals).trim() !== 'Name') continue;
    return sanitizeApplicationName(line.slice(equals + 1));
  }
  return null;
}

/**
 * A `.desktop` id resolves to a file under one of the application directories.
 *
 * The id can carry a `-` for a subdirectory (`kde-okular.desktop`), but it is
 * an id supplied by a helper, so it is treated as untrusted: anything that is
 * not a plain `<name>.desktop` segment is refused rather than joined onto a
 * path.
 */
async function readDesktopEntryName(entryId: string, effects: DefaultApplicationEffects): Promise<string | null> {
  if (!/^[A-Za-z0-9][A-Za-z0-9._+-]{0,127}\.desktop$/.test(entryId)) return null;
  for (const dir of effects.applicationDirs()) {
    // eslint-disable-next-line no-await-in-loop -- most specific directory wins, so the lookup must stop at the first hit
    const contents = await effects.readText(path.join(dir, entryId));
    if (contents === null) continue;
    const name = parseDesktopEntryName(contents);
    if (name) return name;
  }
  return null;
}

async function resolveOnLinux(target: string, effects: DefaultApplicationEffects): Promise<string | null> {
  const mimeType = (await effects.run('xdg-mime', ['query', 'filetype', target]))?.trim();
  if (!mimeType || !/^[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]*\/[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]*$/.test(mimeType)) return null;
  // `xdg-mime query default` prints one entry per line; the first is the default.
  const entryId = (await effects.run('xdg-mime', ['query', 'default', mimeType]))?.split('\n')[0]?.trim();
  if (!entryId) return null;
  return readDesktopEntryName(entryId, effects);
}

/**
 * The display name of the application the OS would open `target` with, or null
 * when that cannot be established honestly.
 *
 * The type gate runs FIRST. A `.command` is refused by `openArtifact`, so
 * labelling its button "Open in Terminal" would promise something the host will
 * not do - and it would also spend a subprocess resolving a target that can
 * never be launched.
 */
export async function resolveDefaultApplicationName(
  target: string,
  effects: DefaultApplicationEffects = createDefaultApplicationEffects()
): Promise<string | null> {
  if (await effects.refuse(target)) return null;
  if (effects.platform === 'darwin') return resolveOnMac(target, effects);
  if (effects.platform === 'linux') return resolveOnLinux(target, effects);
  return null;
}

/** freedesktop search order: user overrides first, then system. */
function xdgApplicationDirs(): string[] {
  const home = os.homedir();
  const dataHome = process.env.XDG_DATA_HOME?.trim() || path.join(home, '.local', 'share');
  const dataDirs = (process.env.XDG_DATA_DIRS?.trim() || '/usr/local/share:/usr/share').split(':').filter(Boolean);
  return [dataHome, ...dataDirs].map((dir) => path.join(dir, 'applications'));
}

export function createDefaultApplicationEffects(): DefaultApplicationEffects {
  return {
    platform: process.platform,
    run: (file, args) =>
      new Promise<string | null>((resolve) => {
        execFile(
          file,
          [...args],
          { timeout: DEFAULT_APP_TIMEOUT_MS, windowsHide: true, maxBuffer: 64 * 1024 },
          (error, stdout) => resolve(error ? null : stdout)
        );
      }),
    readText: (file) => fs.readFile(file, 'utf-8').catch((): null => null),
    applicationDirs: xdgApplicationDirs,
    refuse: (target) => refuseUnsafeOpenTarget(target),
  };
}

/**
 * Resolution memoised by file extension.
 *
 * Every resolution spawns a subprocess, the card asks on every render, and
 * React re-runs an effect on every mount - so without this a preview panel
 * spawns `osascript` repeatedly for an answer that changes when the user
 * changes a file association, which is to say almost never. The TTL is the
 * hedge for that "almost": a stale name is a lie with a five-minute lifetime,
 * and no cache at all would be a subprocess per render.
 */
const nameByExtension = new Map<string, { name: string | null; at: number }>();

export function clearDefaultApplicationCache(): void {
  nameByExtension.clear();
}

export async function cachedDefaultApplicationName(
  target: string,
  effects?: DefaultApplicationEffects,
  now: number = Date.now()
): Promise<string | null> {
  const key = path.extname(target).toLowerCase();
  // A file with no extension resolves by content on Linux and by type on macOS,
  // so it has no cache key that means anything. Asked every time, or never.
  if (!key) return resolveDefaultApplicationName(target, effects);

  const hit = nameByExtension.get(key);
  if (hit && now - hit.at < DEFAULT_APP_CACHE_TTL_MS) return hit.name;

  const name = await resolveDefaultApplicationName(target, effects);
  nameByExtension.set(key, { name, at: now });
  while (nameByExtension.size > DEFAULT_APP_CACHE_MAX_ENTRIES) {
    const oldest = nameByExtension.keys().next().value;
    if (oldest === undefined) break;
    nameByExtension.delete(oldest);
  }
  return name;
}
