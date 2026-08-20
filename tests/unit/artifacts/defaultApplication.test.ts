/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * NAMING THE APP ON THE BUTTON, WITHOUT EVER NAMING THE WRONG ONE.
 *
 * The claim this module makes is narrow: "Open in Preview" is only ever printed
 * when the OS actually said Preview. Every other outcome - an unresolvable type,
 * a helper that is not installed, a platform with no cheap answer, a name that
 * does not look like a name, a target the launcher would refuse anyway - must
 * come back as null, which renders as the plain "Open" the button always said.
 * A wrong app name is worse than a vague one, because the user acts on it.
 *
 * The `.desktop` half runs against REAL files in REAL XDG directories that this
 * test writes; only the `xdg-mime` subprocess is recorded, because it does not
 * exist on a headless box - which is itself one of the cases under test.
 *
 * The unresolvable-target claim is checked against the SAME `shellOpenSafety`
 * gate the actions use, on a real file, not a stub of it.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cachedDefaultApplicationName,
  clearDefaultApplicationCache,
  createDefaultApplicationEffects,
  DEFAULT_APP_CACHE_TTL_MS,
  MAX_APPLICATION_NAME_LENGTH,
  parseDesktopEntryName,
  resolveDefaultApplicationName,
  sanitizeApplicationName,
  type DefaultApplicationEffects,
} from '@process/services/artifacts/defaultApplication';

let root = '';
let appsDir = '';
let brief = '';

/** Effects with nothing recorded but the subprocess. Real files, real gate. */
function effectsFor(
  platform: NodeJS.Platform,
  run: (file: string, args: readonly string[]) => Promise<string | null>
): DefaultApplicationEffects {
  const real = createDefaultApplicationEffects();
  return { ...real, platform, run, applicationDirs: () => [appsDir] };
}

async function writeDesktopEntry(name: string, body: string): Promise<void> {
  await fs.writeFile(path.join(appsDir, name), body, 'utf8');
}

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-default-app-'));
  appsDir = path.join(root, 'share', 'applications');
  await fs.mkdir(appsDir, { recursive: true });
  brief = path.join(root, 'brief.html');
  await fs.writeFile(brief, '<html></html>', 'utf8');
  clearDefaultApplicationCache();
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
  clearDefaultApplicationCache();
});

describe('naming the default application', () => {
  it('resolves a linux handler through xdg-mime and a REAL .desktop entry', async () => {
    await writeDesktopEntry(
      'firefox.desktop',
      ['[Desktop Entry]', 'Type=Application', 'Name=Firefox Web Browser', 'Exec=firefox %u', ''].join('\n')
    );
    const run = vi.fn(async (_file: string, args: readonly string[]) =>
      args[1] === 'filetype' ? 'text/html\n' : 'firefox.desktop\n'
    );

    expect(await resolveDefaultApplicationName(brief, effectsFor('linux', run))).toBe('Firefox Web Browser');
    expect(run.mock.calls[0]).toEqual(['xdg-mime', ['query', 'filetype', brief]]);
    expect(run.mock.calls[1]).toEqual(['xdg-mime', ['query', 'default', 'text/html']]);
  });

  it('degrades to no name when xdg-mime is not installed', async () => {
    // Exactly what a headless box or a minimal container gives us, and the
    // reason the button must survive having no answer at all.
    const run = vi.fn(async () => null);
    expect(await resolveDefaultApplicationName(brief, effectsFor('linux', run))).toBeNull();
  });

  it('degrades to no name when the entry the helper names is not on disk', async () => {
    const run = vi.fn(async (_file: string, args: readonly string[]) =>
      args[1] === 'filetype' ? 'text/html' : 'nothing-installed.desktop'
    );
    expect(await resolveDefaultApplicationName(brief, effectsFor('linux', run))).toBeNull();
  });

  it('refuses a .desktop id that is a path rather than an id', async () => {
    // The id comes from a helper's stdout. Joining `../../etc/passwd` onto an
    // application directory would read a file this has no business reading.
    const run = vi.fn(async (_file: string, args: readonly string[]) =>
      args[1] === 'filetype' ? 'text/html' : '../../../etc/passwd'
    );
    const readText = vi.fn(async () => 'root:x:0:0');
    const effects = { ...effectsFor('linux', run), readText };

    expect(await resolveDefaultApplicationName(brief, effects)).toBeNull();
    expect(readText).not.toHaveBeenCalled();
  });

  it('runs the darwin resolver with the path as an ARGUMENT, never inside the script', async () => {
    // A filename is model-authored text. Building a script around one is how a
    // quoting bug becomes script injection in a process that can open anything.
    // A double quote is illegal in a Windows filename, so the fixture keeps
    // every hostile character the host actually permits rather than skipping
    // the assertion there: the argument-passing contract holds on all three.
    const hostileName =
      process.platform === 'win32' ? "it's quoted; osascript -e evil.html" : 'it\'s "quoted"; osascript -e evil.html';
    const hostile = path.join(root, hostileName);
    await fs.writeFile(hostile, '<html></html>', 'utf8');
    const run = vi.fn(async () => 'Preview\n');

    expect(await resolveDefaultApplicationName(hostile, effectsFor('darwin', run))).toBe('Preview');
    const [file, args] = run.mock.calls[0];
    expect(file).toBe('osascript');
    expect(args[args.length - 1]).toBe(hostile);
    // The script itself is a constant: the path appears nowhere in it.
    expect(args.slice(0, -1).join(' ')).not.toContain('evil');
  });

  it('returns no name on win32, rather than guessing one', async () => {
    const run = vi.fn(async () => 'Notepad');
    expect(await resolveDefaultApplicationName(brief, effectsFor('win32', run))).toBeNull();
    expect(run).not.toHaveBeenCalled();
  });

  it('never names an app for a target the launcher would REFUSE', async () => {
    // A `.command` is refused by `openArtifact`, so labelling its button
    // "Open in Terminal" would promise something the host will not do. The gate
    // here is the real `refuseUnsafeOpenTarget`, on a real file.
    const script = path.join(root, 'report.command');
    await fs.writeFile(script, '#!/bin/sh\necho hi\n', 'utf8');
    const run = vi.fn(async () => 'Terminal\n');

    expect(await resolveDefaultApplicationName(script, effectsFor('darwin', run))).toBeNull();
    // And the subprocess was never even spent on it.
    expect(run).not.toHaveBeenCalled();

    // The control: the same effects DO name an app for an allowed type, so the
    // refusal above is the gate and not a resolver that always returns null.
    expect(await resolveDefaultApplicationName(brief, effectsFor('darwin', run))).toBe('Terminal');
  });

  it('parses Name from the [Desktop Entry] group and nowhere else', async () => {
    expect(parseDesktopEntryName(['[Desktop Entry]', 'Name=Okular', 'Name[de]=Okular DE', ''].join('\n'))).toBe(
      'Okular'
    );
    // A desktop ACTION carries its own Name for a menu item, not the app.
    expect(
      parseDesktopEntryName(
        ['[Desktop Entry]', 'Type=Application', '', '[Desktop Action new]', 'Name=New Window'].join('\n')
      )
    ).toBeNull();
    // Localised keys alone are not an answer.
    expect(parseDesktopEntryName(['[Desktop Entry]', 'Name[de]=Nur Deutsch'].join('\n'))).toBeNull();
    expect(parseDesktopEntryName('nothing here')).toBeNull();
  });

  it('refuses a name that is not shaped like a name', async () => {
    const esc = String.fromCharCode(27);
    expect(sanitizeApplicationName('Preview')).toBe('Preview');
    expect(sanitizeApplicationName('  Google Chrome \n')).toBe('Google Chrome');
    expect(sanitizeApplicationName('')).toBeNull();
    expect(sanitizeApplicationName(null)).toBeNull();
    // A `.desktop` file is plain text anything can write, including into the
    // user's own ~/.local/share/applications.
    expect(sanitizeApplicationName(`${esc}[2JEvil`)).toBe('[2JEvil');
    expect(sanitizeApplicationName('A'.repeat(MAX_APPLICATION_NAME_LENGTH + 1))).toBeNull();
  });

  it('rejects an over-long .desktop name end to end rather than printing it', async () => {
    await writeDesktopEntry(
      'huge.desktop',
      ['[Desktop Entry]', `Name=${'A'.repeat(MAX_APPLICATION_NAME_LENGTH + 1)}`, ''].join('\n')
    );
    const run = vi.fn(async (_file: string, args: readonly string[]) =>
      args[1] === 'filetype' ? 'text/html' : 'huge.desktop'
    );
    expect(await resolveDefaultApplicationName(brief, effectsFor('linux', run))).toBeNull();
  });

  it('refuses a mime type that is not a mime type', async () => {
    const run = vi.fn(async (_file: string, args: readonly string[]) =>
      args[1] === 'filetype' ? 'xdg-mime: command not found' : 'anything.desktop'
    );
    expect(await resolveDefaultApplicationName(brief, effectsFor('linux', run))).toBeNull();
    // The second query was never issued: the first answer was not a mime type.
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('asks the OS ONCE per file type, and asks again after the answer goes stale', async () => {
    // Every resolution spawns a subprocess and the card asks on every mount.
    const run = vi.fn(async () => 'Preview\n');
    const effects = effectsFor('darwin', run);
    const other = path.join(root, 'second.html');
    await fs.writeFile(other, '<html></html>', 'utf8');

    expect(await cachedDefaultApplicationName(brief, effects, 1_000)).toBe('Preview');
    expect(await cachedDefaultApplicationName(other, effects, 2_000)).toBe('Preview');
    expect(run).toHaveBeenCalledTimes(1);

    // A user who changes their file association must not be told the old answer
    // forever, so the memo has a lifetime.
    expect(await cachedDefaultApplicationName(brief, effects, 1_000 + DEFAULT_APP_CACHE_TTL_MS + 1)).toBe('Preview');
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('re-runs the type gate on EVERY call, because the cache key is the extension', async () => {
    // The gate is PATH-dependent - target does not exist, not a regular file,
    // extensionless-executable - and the cache key is the EXTENSION. With the
    // gate behind the cache it ran for the first `.html` and never again, so a
    // DELETED artifact inherited a sibling's "Open in Preview" and then refused
    // on click: a button naming an app that will not open the file, which is
    // the one outcome this module exists to prevent.
    const run = vi.fn(async () => 'Preview\n');
    const effects = effectsFor('darwin', run);
    const gone = path.join(root, 'deleted.html');

    // Warm the cache from a file that really is there.
    expect(await cachedDefaultApplicationName(brief, effects, 1_000)).toBe('Preview');
    expect(run).toHaveBeenCalledTimes(1);

    // Same extension, cache hot, but this file does not exist. The real gate
    // refuses it, so it gets no name - and no second subprocess either.
    expect(await cachedDefaultApplicationName(gone, effects, 1_100)).toBeNull();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('does not let one refused target poison the cache for its whole extension', async () => {
    // The inverse failure. Resolving a missing `.html` first used to store a
    // null under `.html`, flattening every real `.html` to the bare "Open" for
    // the whole TTL.
    const run = vi.fn(async () => 'Preview\n');
    const effects = effectsFor('darwin', run);
    const gone = path.join(root, 'deleted.html');

    expect(await cachedDefaultApplicationName(gone, effects, 1_000)).toBeNull();
    expect(await cachedDefaultApplicationName(brief, effects, 1_100)).toBe('Preview');
  });

  it('caches per EXTENSION, so a different type is resolved separately', async () => {
    const run = vi.fn(async (_file: string, args: readonly string[]) =>
      args[args.length - 1]?.endsWith('.pdf') ? 'Acrobat\n' : 'Preview\n'
    );
    const effects = effectsFor('darwin', run);
    const pdf = path.join(root, 'report.pdf');
    await fs.writeFile(pdf, '%PDF-1.4', 'utf8');

    expect(await cachedDefaultApplicationName(brief, effects, 1_000)).toBe('Preview');
    expect(await cachedDefaultApplicationName(pdf, effects, 1_000)).toBe('Acrobat');
    expect(run).toHaveBeenCalledTimes(2);
  });
});
