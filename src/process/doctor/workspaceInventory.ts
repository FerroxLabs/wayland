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

import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import type { WorkspaceEntry, WorkspaceConfigEntry } from './checks/workspaceChecks';

/** The two listing services the inventory reads, injected so it is testable. */
export type WorkspaceInventoryDeps = {
  listProjects: () => Promise<IProject[]>;
  listConversations: () => Promise<TChatConversation[]>;
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
 * Emitting the id makes the leak UNREACHABLE rather than unlikely - the same
 * producer-side correction this advisory already applied to the engine config
 * parse error and to the MCP declaration. Nothing actionable is lost: the
 * workspace PATH is the half the user acts on, and it is still reported.
 */
export function doctorEntityLabel(kind: 'Project' | 'Chat', id: string): string {
  return `${kind} ${id}`;
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
    entries.push({ label, path });
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

  const projects = await deps.listProjects().catch((): IProject[] => []);
  for (const project of projects) {
    entries.push({
      label: doctorEntityLabel('Project', project.id),
      path: asPath(project.workspace),
      customWorkspace: null,
    });
  }

  const conversations = await deps.listConversations().catch((): TChatConversation[] => []);
  for (const conversation of conversations) {
    const extra = conversation.extra as { workspace?: unknown; customWorkspace?: unknown } | undefined;
    const path = asPath(extra?.workspace);
    const customWorkspace = typeof extra?.customWorkspace === 'boolean' ? extra.customWorkspace : null;
    if (path === null && customWorkspace === null) continue;
    entries.push({ label: doctorEntityLabel('Chat', conversation.id), path, customWorkspace });
  }

  return entries;
}
