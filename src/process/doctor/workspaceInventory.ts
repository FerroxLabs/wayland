/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The workspace inventory the two workspace Doctor checks consume.
 *
 * Extracted out of `registry.ts` for the same reason `engineConfigProbe` was:
 * this is where an entry's LABEL is chosen, that choice is the fix for a
 * credential-disclosure defect (GHSA-2g2m-r86j-jg6h), and a security boundary
 * that can only be reached through Electron singletons is a boundary nobody can
 * test. Nothing here touches Electron; `registry.ts` binds the live services.
 */

import { relative, sep } from 'node:path';
import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import type { WorkspaceEntry, WorkspaceConfigEntry } from './checks/workspaceChecks';

/** The two listing services the inventory reads, injected so it is testable. */
export type WorkspaceInventoryDeps = {
  listProjects: () => Promise<IProject[]>;
  listConversations: () => Promise<TChatConversation[]>;
  /**
   * Absolute path of the app's OWN default workspace base dir
   * (`defaultWorkspaceBaseDir()`, i.e. `~/Documents/Wayland`), or `null` when it
   * could not be resolved.
   *
   * REQUIRED rather than optional on purpose. Its whole job is to decide which
   * paths are app-derived and must have their leaf withheld, so a caller that
   * forgets it re-opens the leak silently. `null` is the honest "could not
   * resolve" answer and is handled, but it has to be passed deliberately.
   */
  appManagedWorkspaceBase: string | null;
};

/**
 * Identify a project or conversation in a Doctor label by its APP-GENERATED id,
 * never by its user-authored name.
 *
 * A conversation's name is generated from the user's FIRST MESSAGE, so a
 * credential pasted into a chat becomes the chat title and from there a line in a
 * report the Doctor panel offers to copy. No scrubber closes that: a bare secret
 * typed as a first message carries no label, no assignment and no recognisable
 * prefix, so it matches no rule at all - verified by execution, and the reason
 * the earlier "wait for #1026" plan for this sink was wrong. Truncating the name
 * would not close it either, since a short credential survives any truncation.
 *
 * CORRECTION. An earlier version of this comment claimed emitting the id made
 * the leak "UNREACHABLE rather than unlikely". That was FALSE for projects, and
 * measured to be false: a project's default workspace is
 * `~/Documents/Wayland/<project-name>` (`allocateProjectWorkspace`) and the leaf
 * is the sanitised name verbatim, so the name simply re-entered through the PATH
 * half of the same line. Executed, the drift detail read
 * `Project proj-1 -> /Users/x/Documents/Wayland/<the name>`. The id fixes the
 * LABEL only; {@link doctorWorkspaceDisplayPath} is what closes the path.
 */
export function doctorEntityLabel(kind: 'Project' | 'Chat', id: string): string {
  return `${kind} ${id}`;
}

/** Stands in for a withheld app-derived folder name in a Doctor detail. */
const WITHHELD_LEAF = '(folder name withheld)';

/**
 * True when `candidate` sits at or below `base`.
 *
 * A bare `relative().startsWith('..')` is UNSOUND, and the trap that matters here
 * is the one that fails OPEN: `base/..foo` is inside `base` and its relative form
 * is `..foo`, which starts with `..`, so a naive test calls it outside and the
 * folder name goes into the report. The walk test therefore needs the separator
 * (or an exact `..`).
 *
 * The other classic trap - a win32 cross-drive path, where `relative` returns an
 * ABSOLUTE result rather than a `..` walk - is deliberately NOT guarded, and the
 * direction of the error is why. This is a REDACTION decision, not an access
 * decision: a false "contained" withholds a folder name that did not need
 * withholding, while a false "outside" prints one that did. So a cross-drive path
 * reads as contained and is over-withheld, which costs a user on another Windows
 * drive the name of their own folder and leaks nothing. Do not "fix" this by
 * adding an `isAbsolute` early return without also pinning it with a test - that
 * flips the one case this file cannot exercise back to fail-open.
 */
function isAtOrUnder(candidate: string, base: string): boolean {
  // `candidate === base` relativises to the empty string, which passes both tests
  // below, so the "at" half needs no arm of its own.
  const rel = relative(base, candidate);
  return rel !== '..' && !rel.startsWith(`..${sep}`);
}

/**
 * The path to RENDER for a workspace, or `undefined` when the real path is safe
 * to render as-is.
 *
 * For an app-derived workspace the folder name is the user-authored entity name,
 * so printing the path prints the name. Everything below the app's own base dir
 * is therefore replaced by {@link WITHHELD_LEAF}, keeping the base (which is the
 * actionable half - it is where the user looks in Finder) and dropping the part
 * that carries the name.
 *
 * DECIDED, and the trade is deliberate: a path OUTSIDE the base is one the user
 * typed or picked themselves, it is not derived from an entity name, and a
 * workspace the user chose is the one they most need named to act on it. Those
 * stay verbatim, scrubbed only. A path the user picked that happens to sit inside
 * the base is over-withheld; that direction of error is harmless and not worth a
 * second signal to distinguish.
 *
 * The comparison is also run on lowercased copies because macOS and Windows
 * filesystems are case-insensitive by default, so a stored path differing only in
 * case names the same directory. Over-withholding is again the safe direction.
 */
export function doctorWorkspaceDisplayPath(path: string, appManagedBase: string | null): string | undefined {
  if (!appManagedBase) return undefined;
  const under = isAtOrUnder(path, appManagedBase) || isAtOrUnder(path.toLowerCase(), appManagedBase.toLowerCase());
  if (!under) return undefined;
  return `${appManagedBase}${sep}${WITHHELD_LEAF}`;
}

/**
 * Every configured workspace path: project workspaces plus conversation
 * `extra.workspace` directories. Deduplicated by path so a project and its
 * conversations sharing a folder are reported once.
 */
export async function collectConfiguredWorkspaces(deps: WorkspaceInventoryDeps): Promise<WorkspaceEntry[]> {
  const entries: WorkspaceEntry[] = [];
  const seen = new Set<string>();

  const add = (label: string, path: unknown): void => {
    if (typeof path !== 'string' || path.trim().length === 0) return;
    if (seen.has(path)) return;
    seen.add(path);
    // `path` stays the REAL path - the check stats it - and `displayPath` is what
    // gets rendered. Collapsing the two would make an app-derived workspace stat
    // the base dir, which exists, and the drift check would silently stop failing.
    const displayPath = doctorWorkspaceDisplayPath(path, deps.appManagedWorkspaceBase);
    entries.push({ label, path, ...(displayPath ? { displayPath } : {}) });
  };

  const projects = await deps.listProjects().catch((): IProject[] => []);
  for (const project of projects) {
    add(doctorEntityLabel('Project', project.id), project.workspace);
  }

  const conversations = await deps.listConversations().catch((): TChatConversation[] => []);
  for (const conversation of conversations) {
    // `extra.workspace` exists on gemini/acp conversations; read defensively
    // since the union is wide and some kinds carry no workspace.
    const extra = conversation.extra as { workspace?: unknown } | undefined;
    add(doctorEntityLabel('Chat', conversation.id), extra?.workspace);
  }

  return entries;
}

/**
 * Every configured workspace with its persistent-vs-temp classification inputs:
 * project workspaces (no `customWorkspace` flag → `null`) plus conversation
 * `extra.workspace` / `extra.customWorkspace`. Conversations that carry no
 * workspace binding at all are skipped (nothing to assess).
 */
export async function collectWorkspaceConfigEntries(deps: WorkspaceInventoryDeps): Promise<WorkspaceConfigEntry[]> {
  const entries: WorkspaceConfigEntry[] = [];

  const asPath = (value: unknown): string | null =>
    typeof value === 'string' && value.trim().length > 0 ? value : null;

  /** Same split as the drift inventory: real `path` classified, `displayPath` rendered. */
  const withDisplay = (path: string | null): { displayPath?: string } => {
    const displayPath = path === null ? undefined : doctorWorkspaceDisplayPath(path, deps.appManagedWorkspaceBase);
    return displayPath ? { displayPath } : {};
  };

  const projects = await deps.listProjects().catch((): IProject[] => []);
  for (const project of projects) {
    const path = asPath(project.workspace);
    entries.push({
      label: doctorEntityLabel('Project', project.id),
      path,
      customWorkspace: null,
      ...withDisplay(path),
    });
  }

  const conversations = await deps.listConversations().catch((): TChatConversation[] => []);
  for (const conversation of conversations) {
    const extra = conversation.extra as { workspace?: unknown; customWorkspace?: unknown } | undefined;
    const path = asPath(extra?.workspace);
    const customWorkspace = typeof extra?.customWorkspace === 'boolean' ? extra.customWorkspace : null;
    if (path === null && customWorkspace === null) continue;
    entries.push({ label: doctorEntityLabel('Chat', conversation.id), path, customWorkspace, ...withDisplay(path) });
  }

  return entries;
}
