/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Which folders may become a persisted grant, and why one may not.
 *
 * WHY THE HOST DECIDES THIS AT ALL. Core refuses an ungrantable root with a
 * typed `PathGrantError`, but that error never reaches the wire: `grant_path`
 * flattens it to `eprintln!` and returns `false`, and the session emits an
 * untyped `Info` string with no updated policy receipt. A host that waited for
 * the engine to say no would therefore persist an entry that never took effect
 * and show it in Settings as if it had. So every refusal is made here, before
 * anything is written and long before anything is sent.
 *
 * WHY IT MIRRORS CORE RATHER THAN INVENTING ITS OWN RULES. A root Core would
 * refuse must never become a persisted entry, or the durable list and the
 * engine's actual authority drift apart silently. The order and the substance
 * below track `WorkspacePolicy::grant_session_read_root_full`
 * (`crates/wcore-tools/src/workspace_policy.rs` on wayland-core `main`):
 *
 *   canonicalise -> file becomes its containing directory -> filesystem root ->
 *   `$HOME` or anything containing it -> credential stores (both directions) ->
 *   `is_secret_path_static`.
 *
 * The one deliberate ADDITION is {@link FolderGrantRootContext.waylandPrivateRoots}:
 * Wayland's own config tree holds the user's provider API keys and the engine's
 * memory database. Core has no reason to know about it; the host does.
 *
 * ── The comment that used to stand here was WRONG ──────────────────────────
 * It said `is_secret_path_static` was deliberately omitted because the shapes
 * it catches (`~/.ssh`, `~/.aws`) are already refused by the credential-store
 * check. That reasoning holds only for `$HOME`-RELATIVE copies. The host joins
 * every `CREDENTIAL_STORES` entry to `$HOME`; Core's `SECRET_DIR_SEGMENTS`
 * match `/.ssh/`, `/.gnupg/`, `/.aws/`, `/.azure/`, `/.gcloud/` ANYWHERE in the
 * path, and `SECRET_EXTENSIONS` / `SECRET_BASENAMES` / `SECRET_SUFFIXES` match
 * the folder's own name.
 *
 * So `/opt/deploy/.ssh/keys` was accepted here and refused by Core - verified
 * against `v0.13.4:crates/wcore-tools/src/workspace_policy.rs`, where
 * `grantable_read_root_shape` calls `is_secret_path_static(&dir)` and returns
 * `PathGrantError::SecretPath`. No authority leaked, because Core fails closed.
 * What it produced is the exact failure this mirror exists to prevent: a
 * Settings entry that quietly holds nothing, and a card that told the user a
 * folder was opened for a call the engine then refused.
 *
 * It is now mirrored, in {@link isSecretGrantPath}, EXACTLY - including where
 * Core is narrower than one might write it fresh (`/opt/deploy/.ssh` with
 * nothing under it does not match `/.ssh/` and is granted). Being stricter than
 * the engine would swap a silent no-op for a refusal the engine would not have
 * made, and this module's whole job is to give the same answer Core gives.
 *
 * ── Why spelling is not enough ─────────────────────────────────────────────
 * Every rule above is a LEXICAL comparison of pathnames after `realpath`, and a
 * pathname is not an identity. Two different spellings can name one directory
 * without either being a symlink, so `realpath` collapses neither:
 *
 *   - macOS FIRMLINKS. `/System/Volumes/Data/Users/<you>` and `/Users/<you>` are
 *     the same directory on every Mac since 10.15. `realpath` returns each
 *     unchanged, so the home-directory refusal was bypassable by spelling on the
 *     platform Wayland ships to. This was measured on this machine, not inferred.
 *   - Linux BIND MOUNTS. `mount --bind / /tmp/innocent` leaves
 *     `realpath("/tmp/innocent")` as `/tmp/innocent`.
 *   - Windows VOLUME MOUNT POINTS, the same shape via `mountvol`.
 *
 * So each refusal is also asked by IDENTITY - `dev` + `ino` from `fs.stat`,
 * read as BigInt because APFS inode numbers exceed `Number.MAX_SAFE_INTEGER`
 * and a lossy compare would produce FALSE matches. Identity answers "is this the
 * same directory as X"; it cannot answer "does this CONTAIN X", so the lexical
 * pass stays and does that half.
 *
 * WHAT THIS STILL DOES NOT CATCH, stated rather than hidden: a candidate that
 * CONTAINS a protected root only through an alias. `/System/Volumes/Data` is a
 * real example - it holds the home firmlink but is not identical to any
 * protected root or to any ancestor of one, so it is accepted. Closing it would
 * mean re-deriving every protected root under every candidate prefix, which is
 * a stat storm at read time for a case that needs a deliberately odd pick in a
 * native folder dialog. Left open on purpose.
 *
 * WHERE IDENTITY IS UNAVAILABLE the checks degrade to exactly today's lexical
 * behaviour rather than to a wrong answer: a `dev` or `ino` of zero is treated
 * as "no identity reported" and skipped, because a platform that reports zero
 * for everything would otherwise make every directory equal to every protected
 * root and refuse the entire feature.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { FolderGrantRefusal } from '@/common/workspace/folderGrants';

/**
 * `$HOME`-relative credential stores, copied from Core's `CREDENTIAL_STORES`.
 * Kept in the same order so a future diff against the engine list is readable.
 */
export const USER_CREDENTIAL_STORES: readonly string[] = [
  '.ssh',
  '.gnupg',
  '.aws',
  '.azure',
  '.kube',
  '.docker',
  '.npmrc',
  '.netrc',
  '.pgpass',
  '.pypirc',
  '.git-credentials',
  '.m2/settings.xml',
  '.gradle/gradle.properties',
  '.cargo/credentials.toml',
  '.terraform.d',
  '.bash_history',
  '.zsh_history',
  '.config/gcloud',
  '.config/gh',
  '.config/glab-cli',
  '.config/op',
  '.config/doctl',
];

/**
 * Core's `SECRET_EXTENSIONS`, `SECRET_BASENAMES`, `SECRET_DIR_SEGMENTS` and
 * `SECRET_SUFFIXES`, copied verbatim and in the same order so a future diff
 * against `crates/wcore-tools/src/workspace_policy.rs` is readable.
 *
 * These are what `is_secret_path_static` matches, and `grantable_read_root_shape`
 * applies it to the FOLDER it is about to grant - so they gate a directory
 * grant here for exactly the same reason.
 */
const SECRET_EXTENSIONS: readonly string[] = ['pem', 'key', 'p12', 'pfx', 'tfstate'];
const SECRET_BASENAMES: readonly string[] = ['id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa'];
const SECRET_DIR_SEGMENTS: readonly string[] = ['/.ssh/', '/.gnupg/', '/.aws/', '/.azure/', '/.gcloud/'];
const SECRET_SUFFIXES: readonly string[] = [
  '/.env',
  '/.git/config',
  '/.git-credentials',
  '/.npmrc',
  '/.pypirc',
  '/.netrc',
  '/.dockercfg',
  '/.aws/credentials',
  '/.kube/config',
  '/.git/hooks/',
  '/.docker/config.json',
  '/gradle.properties',
];

/**
 * Win32 strips trailing spaces and dots from a path component before opening
 * it, so `.env `, `.env.` and `.env. ` all open `.env`. Stripped on every
 * platform: this is a DENY list, and over-denying one pathological name is a
 * visible refusal where under-denying hands over a credential.
 */
const withoutTrailingSpacesAndDots = (value: string): string => value.replace(/[ .]+$/, '');

/**
 * Core's `is_secret_path_static`, mirrored for the canonical folder a grant
 * names.
 *
 * NOT `$HOME`-relative, and that is the whole point of it existing alongside
 * the credential-store check: the segment rules match anywhere in the path, so
 * `/opt/deploy/.ssh/keys` is caught here and nowhere else.
 *
 * Case is folded and backslashes are folded to `/` on EVERY rule and EVERY
 * platform, as Core does - on macOS and Windows the filesystem is
 * case-insensitive, so a case-sensitive denylist is bypassable by spelling.
 */
export function isSecretGrantPath(target: string): boolean {
  const scoped = withoutTrailingSpacesAndDots(target.replace(/\\/g, '/').toLowerCase());

  // Derived from the final component of the ORIGINAL path, then trimmed, then
  // folded - the extension of `foo.key ` is `key `, which matches nothing, so
  // it has to be re-derived from the TRIMMED name rather than taken as-is.
  const name = withoutTrailingSpacesAndDots(path.basename(target)).toLowerCase();
  if (name.length > 0) {
    const lastDot = name.lastIndexOf('.');
    if (lastDot >= 0 && SECRET_EXTENSIONS.includes(name.slice(lastDot + 1))) return true;
    if (SECRET_BASENAMES.includes(name)) return true;
    // `service-account*.json`, bare `key.json`, and separator-bounded
    // `*-key.json` / `*_key.json`. Deliberately NOT `monkey.json`.
    if (
      name.endsWith('.json') &&
      (name.startsWith('service-account') ||
        name === 'key.json' ||
        name.endsWith('-key.json') ||
        name.endsWith('_key.json'))
    ) {
      return true;
    }
    // `terraform.tfstate` and `terraform.tfstate.backup` (compound extension).
    if (name.includes('.tfstate')) return true;
  }

  if (SECRET_DIR_SEGMENTS.some((segment) => scoped.includes(segment))) return true;

  return SECRET_SUFFIXES.some((fragment) => {
    if (fragment.endsWith('/')) return scoped.includes(fragment);
    const at = scoped.lastIndexOf(fragment);
    if (at < 0) return false;
    // Bounded, so `/.envoy` does not match `/.env`.
    const after = scoped.slice(at + fragment.length);
    return after.length === 0 || after.startsWith('.') || after.startsWith('/');
  });
}

/** Core's `SYSTEM_CREDENTIAL_STORES`, per platform. */
export function systemCredentialStores(): readonly string[] {
  if (process.platform === 'darwin') return ['/Library/Keychains'];
  if (process.platform === 'linux') return ['/etc/docker', '/etc/kubernetes'];
  return [];
}

/**
 * Whether `candidate` names a filesystem root - `/`, a Windows drive root, or a
 * UNC share root.
 *
 * Checked against BOTH the POSIX and the Win32 grammars regardless of the host,
 * so `C:\` is refused as a root everywhere instead of being refused on macOS as
 * "not an absolute path", which would report the wrong reason to the user and
 * would make the drive-root rule untestable off Windows.
 */
export function isFilesystemRoot(candidate: string): boolean {
  const isRootIn = (impl: path.PlatformPath): boolean => {
    try {
      const normalised = impl.normalize(candidate);
      return impl.parse(normalised).root === normalised;
    } catch {
      return false;
    }
  };
  return isRootIn(path.win32) || isRootIn(path.posix);
}

/**
 * macOS and Windows ship case-insensitive filesystems, so a case-sensitive
 * comparison there is bypassable by spelling. Linux is genuinely case-sensitive
 * and folding there would over-refuse a real, distinct directory.
 */
const FOLD_CASE = process.platform === 'win32' || process.platform === 'darwin';

const forCompare = (value: string): string => {
  const resolved = path.resolve(value);
  return FOLD_CASE ? resolved.toLowerCase() : resolved;
};

export function pathsEqual(a: string, b: string): boolean {
  return forCompare(a) === forCompare(b);
}

/** True when `child` IS `ancestor` or lives beneath it. */
export function isWithin(child: string, ancestor: string): boolean {
  const c = forCompare(child);
  const a = forCompare(ancestor);
  if (c === a) return true;
  return c.startsWith(a.endsWith(path.sep) ? a : `${a}${path.sep}`);
}

/**
 * Core's `canon_for_scope`: resolve the path, and when it does not exist,
 * resolve its parent and re-attach the final component. A credential store the
 * user does not happen to have must still be comparable.
 */
export async function canonicaliseForScope(target: string): Promise<string> {
  try {
    return await fs.realpath(target);
  } catch {
    try {
      return path.join(await fs.realpath(path.dirname(target)), path.basename(target));
    } catch {
      return target;
    }
  }
}

export type FolderGrantRootContext = Readonly<{
  /** The user's home directory. Refused itself, and so is any ancestor of it. */
  homeDir: string;
  /**
   * Wayland's own config / credential / engine-state directories. Refused in
   * BOTH directions: a grant inside one discloses it, and a grant containing
   * one discloses it just as completely.
   */
  waylandPrivateRoots: readonly string[];
}>;

export type FolderGrantRootCheck =
  /** `root` is canonical, is a real directory, and is safe to persist. */
  Readonly<{ ok: true; root: string }> | Readonly<{ ok: false; refusal: FolderGrantRefusal }>;

const refuse = (refusal: FolderGrantRefusal): FolderGrantRootCheck => ({ ok: false, refusal });

/**
 * A directory's filesystem identity as `dev:ino`, or null when there is not an
 * honest one to report.
 *
 * BigInt, not the default number stat: an APFS inode is routinely larger than
 * `Number.MAX_SAFE_INTEGER` (`/System/Volumes/Data` reads
 * `1152921500311879682`, which rounds to `…700` as a double). Two distinct
 * directories rounding to the same double would make this over-refuse.
 *
 * A zero `dev` or `ino` means the platform did not report one. Null, not
 * `"0:0"` - otherwise every unidentified directory would compare equal to every
 * other and the whole feature would refuse itself.
 */
async function directoryIdentity(dir: string): Promise<string | null> {
  try {
    const stat = await fs.stat(dir, { bigint: true });
    // Stringified rather than compared as BigInt: this project targets below
    // ES2020, so a `0n` literal does not compile.
    const dev = stat.dev.toString();
    const ino = stat.ino.toString();
    if (dev === '0' || ino === '0') return null;
    return `${dev}:${ino}`;
  } catch {
    return null;
  }
}

/** `dir`, then its parent, and so on up to the filesystem root. */
function ancestorChain(dir: string): string[] {
  const chain: string[] = [];
  let current = path.resolve(dir);
  for (;;) {
    chain.push(current);
    const parent = path.dirname(current);
    if (parent === current) return chain;
    current = parent;
  }
}

/**
 * The protected roots for one context, canonicalised once and indexed by
 * identity as well as by spelling.
 *
 * `sameAs` and `under` are NOT one map, because the two lexical directions are
 * not symmetric and collapsing them would break the feature:
 *
 *   - `sameAs` is compared against the CANDIDATE ONLY. It holds every protected
 *     root AND every ancestor of one, mirroring "the candidate contains a
 *     protected root".
 *   - `under` is compared against the candidate AND each of its ancestors,
 *     mirroring "the candidate is inside a protected root". The home directory
 *     is deliberately absent from it: `~/Projects` is inside `$HOME` and is
 *     exactly what this feature exists to allow.
 */
type PreparedFolderGrantRoots = Readonly<{
  home: string;
  wayland: readonly string[];
  credentials: readonly string[];
  sameAs: ReadonlyMap<string, FolderGrantRefusal>;
  under: ReadonlyMap<string, FolderGrantRefusal>;
}>;

/**
 * Keyed by the context OBJECT, which every caller builds fresh per operation
 * (`defaultFolderGrantRootContext` returns a new one each call). So this is a
 * within-one-operation memo and never a cross-session cache - revalidating a
 * full 64-entry list would otherwise re-canonicalise and re-stat ~30 protected
 * roots 64 times over.
 */
const preparedRoots = new WeakMap<FolderGrantRootContext, Promise<PreparedFolderGrantRoots>>();

async function prepare(context: FolderGrantRootContext): Promise<PreparedFolderGrantRoots> {
  const home = await canonicaliseForScope(context.homeDir);
  const wayland = await Promise.all(context.waylandPrivateRoots.map(canonicaliseForScope));
  const credentials = await Promise.all([
    ...USER_CREDENTIAL_STORES.map((relative) => canonicaliseForScope(path.join(home, relative))),
    ...systemCredentialStores().map(canonicaliseForScope),
  ]);

  const sameAs = new Map<string, FolderGrantRefusal>();
  const under = new Map<string, FolderGrantRefusal>();

  // Built in REVERSE of the lexical refusal order, so a directory that belongs
  // to two classes at once (`$HOME` is an ancestor of `~/.ssh`) is reported the
  // way the lexical pass above it reports the same directory.
  const index = async (roots: readonly string[], refusal: FolderGrantRefusal, alsoUnder: boolean): Promise<void> => {
    for (const root of roots) {
      for (const ancestor of ancestorChain(root)) {
        const identity = await directoryIdentity(ancestor);
        if (identity) sameAs.set(identity, refusal);
      }
      if (!alsoUnder) continue;
      const identity = await directoryIdentity(root);
      if (identity) under.set(identity, refusal);
    }
  };
  await index(credentials, 'credential_store', true);
  await index(wayland, 'wayland_private', true);
  await index([home], 'home_directory', false);

  return { home, wayland, credentials, sameAs, under };
}

function prepareFolderGrantRoots(context: FolderGrantRootContext): Promise<PreparedFolderGrantRoots> {
  let pending = preparedRoots.get(context);
  if (!pending) {
    pending = prepare(context);
    preparedRoots.set(context, pending);
  }
  return pending;
}

/**
 * Decide whether `input` may be persisted as a grant, and return the canonical
 * directory that would be.
 *
 * The returned root - not the string the caller passed - is what gets stored,
 * so what Settings displays is what the engine will actually be handed. Storing
 * the raw input instead would let a symlink, a trailing separator, a Windows
 * 8.3 short name or a file path drift away from the authority it names.
 */
export async function classifyFolderGrantRoot(
  input: unknown,
  context: FolderGrantRootContext
): Promise<FolderGrantRootCheck> {
  if (typeof input !== 'string' || input.length === 0 || input.includes('\0')) {
    return refuse('not_an_absolute_directory');
  }

  // Before the absolute-path test, so a drive root is reported as a root on
  // every host rather than as a malformed path on POSIX.
  if (isFilesystemRoot(input)) return refuse('root_of_filesystem');
  if (!path.isAbsolute(input)) return refuse('not_an_absolute_directory');

  // `fs/promises.realpath` resolves symlinks AND expands Windows 8.3 short
  // names. `fs.realpathSync` (non-native) does NOT expand 8.3, which is how a
  // short name has slipped past a path check in this repo before.
  let canonical: string;
  try {
    canonical = await fs.realpath(input);
  } catch {
    return refuse('not_an_absolute_directory');
  }

  let stat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    stat = await fs.stat(canonical);
  } catch {
    return refuse('not_an_absolute_directory');
  }

  if (!stat.isDirectory()) {
    // Mirrors Core: a grant names a FOLDER, so if the host sent the file the
    // user was looking at, the containing directory is what they meant.
    if (!stat.isFile()) return refuse('not_an_absolute_directory');
    const parent = path.dirname(canonical);
    if (parent === canonical) return refuse('root_of_filesystem');
    canonical = parent;
    try {
      if (!(await fs.stat(canonical)).isDirectory()) return refuse('not_an_absolute_directory');
    } catch {
      return refuse('not_an_absolute_directory');
    }
  }

  // Re-checked AFTER canonicalisation: a symlink pointing at `/` would sail
  // past the pre-check above, which only ever saw the link's own name.
  if (isFilesystemRoot(canonical)) return refuse('root_of_filesystem');

  const prepared = await prepareFolderGrantRoots(context);

  // Core's `home.starts_with(&dir)`: the home directory itself, and anything
  // that contains it, reach effectively everything.
  if (isWithin(prepared.home, canonical)) return refuse('home_directory');

  // Both directions on every protected root: a grant INSIDE one discloses it,
  // and a grant CONTAINING one discloses it just as completely.
  const touches = (protectedRoots: readonly string[]): boolean =>
    protectedRoots.some((other) => isWithin(canonical, other) || isWithin(other, canonical));

  if (touches(prepared.wayland)) return refuse('wayland_private');
  if (touches(prepared.credentials)) return refuse('credential_store');

  // Core's `is_secret_path_static`, which `grantable_read_root_shape` applies
  // to the folder it is about to grant. Reported as `credential_store` rather
  // than as a new refusal code: the two are one event to the person reading it
  // ("that folder holds saved sign-in keys"), and Core's own `SecretPath` and
  // `CredentialPath` both flatten to the same untyped string on the wire.
  if (isSecretGrantPath(canonical)) return refuse('credential_store');

  // Everything above compared SPELLINGS. Ask the same questions again by
  // filesystem identity, so an alias that `realpath` does not collapse - a
  // macOS firmlink, a Linux bind mount, a Windows volume mount point - cannot
  // launder a protected root past a pathname comparison. See the module header
  // for what this covers and what it deliberately does not.
  const identity = await directoryIdentity(canonical);
  if (identity === null) return { ok: true, root: canonical };

  if (identity === (await directoryIdentity(path.parse(canonical).root))) return refuse('root_of_filesystem');

  const sameAs = prepared.sameAs.get(identity);
  if (sameAs) return refuse(sameAs);

  // `slice(1)`: the candidate itself is already answered by `sameAs`, which
  // holds every key `under` does.
  for (const ancestor of ancestorChain(canonical).slice(1)) {
    const ancestorIdentity = await directoryIdentity(ancestor);
    if (ancestorIdentity === null) continue;
    const under = prepared.under.get(ancestorIdentity);
    if (under) return refuse(under);
  }

  return { ok: true, root: canonical };
}
