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
export type IUpdateProjectParams = Partial<Pick<IProject, 'name' | 'description' | 'workspace' | 'icon' | 'iconColor' | 'pinned' | 'pinnedAt'>>;
