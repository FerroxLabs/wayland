/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A Project is an umbrella that owns conversations. Each conversation keeps full
 * freedom of backend / model / assistant - the project does not constrain that.
 * Scoping is carried on the conversation via `extra.projectId` (mirrors the
 * `cronJobId` pattern), so there is no per-conversation column and no execution
 * lock. The project entity itself lives in the `projects` SQLite table
 * (migration_v43).
 *
 * Deliberately leaner than Foundry's IProject: dropped `defaultAgent` /
 * `defaultModel` (the composer picks per-chat), `forgeInitialized`, and
 * `activeConversationId` (the per-project execution lock that serialized every
 * chat - the core friction we are removing).
 */
export type IProject = {
  id: string;
  name: string;
  description?: string;
  /** Optional working directory. When set, a `.wayland/` knowledge folder is bootstrapped here. */
  workspace?: string;
  /** Icon-park / lucide icon name for the project tile. */
  icon?: string;
  /** Hex color for the icon chip. */
  iconColor?: string;
  pinned: boolean;
  pinnedAt?: number;
  createTime: number;
  modifyTime: number;
};

/** Parameters accepted when creating a project. Everything except `name` is optional to keep activation energy low. */
export type ICreateProjectParams = {
  name: string;
  description?: string;
  workspace?: string;
  icon?: string;
  iconColor?: string;
};

/** Fields a user may edit on an existing project. */
export type IUpdateProjectParams = Partial<
  Pick<IProject, 'name' | 'description' | 'workspace' | 'icon' | 'iconColor' | 'pinned' | 'pinnedAt'>
>;

/**
 * How to authenticate a git clone/pull.
 * - `none`  : public repo, no credentials.
 * - `token` : HTTPS personal-access-token. Injected as a command-scoped Basic
 *   auth header; never written into the cloned repo's `.git/config`.
 * - `ssh`   : SSH transport. An optional private-key path is passed via
 *   `GIT_SSH_COMMAND`; when omitted the user's default SSH agent/keys are used.
 */
export type IGitCloneAuth =
  | { kind: 'none' }
  | { kind: 'token'; username?: string; token: string }
  | { kind: 'ssh'; privateKeyPath?: string };

/** Parameters for cloning a git repo into a fresh project workspace. */
export type IGitCloneParams = {
  url: string;
  auth?: IGitCloneAuth;
  /** Overrides the repo-name derived from the URL. */
  name?: string;
  description?: string;
};

/** Result of a successful clone: the project now pointed at the cloned dir. */
export type IGitCloneResult = { project: IProject };

/** Result of pulling an existing project's workspace. */
export type IGitPullResult = { ok: boolean; output?: string; error?: string };

/** Result of merging an agent worktree branch back into the main checkout. */
export type IGitMergeResult = { ok: boolean; output?: string; error?: string; conflict?: boolean };
