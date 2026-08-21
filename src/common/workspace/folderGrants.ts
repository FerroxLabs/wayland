/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The shared vocabulary for "folders this workspace may reach" — Wayland's
 * boundary axis, the equivalent of `codex --add-dir` / `claude --add-dir`.
 *
 * WHY A BOUNDARY AXIS AT ALL. Wayland already has a *prompting* axis (the
 * folder-grant consent card, agent modes) and had no *boundary* axis: no way
 * for the user to say "this folder is fine" IN ADVANCE. Unattended runs — cron,
 * Autopilot — have nobody at the window to answer a card, so a read outside the
 * workspace is a dead end there no matter how the prompting axis is set. A
 * persisted list is what turns that dead end into a recoverable one, by prior
 * consent rather than by widening anything at run time.
 *
 * WHY THE LIST NEVER LIVES IN THE WORKSPACE. The agent has write access to its
 * own workspace. A grant list stored there would be a list the agent can edit,
 * which is self-escalation with extra steps. The record belongs in app
 * user-data, keyed by workspace, where only the app writes it.
 *
 * WHY THE HOST OWNS THE DURABLE RECORD. Core's grants are session-scoped by
 * construction: `grant_path` takes a host-chosen `grant_id` and `revoke_path`
 * takes it back, and nothing survives the process. The host replays the list at
 * spawn. That is the right split — the user's list lives where the user can see
 * and edit it, and the engine holds no authority the host did not just hand it.
 */

/**
 * Read is the only grantable access.
 *
 * `write` exists on the wire (`PathGrantAccess::Write`) and Core REFUSES it
 * rather than silently downgrading — deliberately, so a host that can express
 * the request gets a legible refusal instead of shipping a button that promises
 * more than it delivers. Wayland does not express it: there is no product
 * question to which "write outside the workspace" is the answer.
 */
export type FolderGrantAccess = 'read';

/**
 * Where a grant came from. Persisted so a user can later explain every entry —
 * a grant nobody can account for is a grant nobody can audit.
 */
export type FolderGrantOrigin =
  /** Answered "always allow this folder" on a path-boundary consent card. */
  | 'consent_card'
  /** Added deliberately from Settings, with no pending tool call. */
  | 'settings';

/** One persisted folder grant. */
export interface FolderGrant {
  /**
   * Host-chosen, stable for the life of the entry, and the ONLY revoke handle:
   * it is echoed to `revoke_path` to withdraw this exact grant. Regenerating it
   * on replay would strand whatever the engine is holding.
   */
  grantId: string;
  /**
   * The folder, exactly as it was shown to the user when they consented.
   * Display and authority must not drift apart, so this is written from the
   * same accessor the card rendered from (`pathBoundaryRootOf`).
   */
  root: string;
  access: FolderGrantAccess;
  /** Unix ms. When the user consented. */
  grantedAtMs: number;
  origin: FolderGrantOrigin;
}

/** The persisted per-workspace record. */
export interface WorkspaceFolderGrants {
  /** Workspace identity, from the workspace identity marker. Never a path. */
  workspaceId: string;
  grants: FolderGrant[];
}

/**
 * Why a root cannot be granted. Returned instead of a bare boolean so the
 * refusal can be shown to the user in the terms they will recognise.
 *
 * These are refused HOST-SIDE, before anything reaches the engine, and that is
 * not belt-and-braces. Core's `emit_path_grant` reports a refusal as a plain
 * `Info` message on the session output and emits no updated policy receipt —
 * there is no typed error to catch — so a host that relied on the engine saying
 * no would persist an entry that never took effect.
 */
export type FolderGrantRefusal =
  /** Filesystem root, or a drive root on Windows. */
  | 'root_of_filesystem'
  /** The home directory itself. Granting it grants nearly everything. */
  | 'home_directory'
  /** Wayland's own config / credential storage. */
  | 'wayland_private'
  /** Not an absolute path, or not a real directory. */
  | 'not_an_absolute_directory';
