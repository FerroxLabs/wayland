/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import type { ICreateConversationParams } from '@/common/adapter/ipcBridge';
import type { TChatConversation, TProviderWithModel } from '@/common/config/storage';
import type { AcpBackend, AcpBackendAll } from '@/common/types/acpTypes';
import { getSkillsDirsForBackend, hasNativeSkillSupport } from '@/common/types/acpTypes';
import { isManagedWorkspaceName } from '@/common/types/managedWorkspaceRetention';
import { uuid } from '@/common/utils';
import { randomUUID } from 'node:crypto';

// Re-export for backward compatibility (tests mock this path)
export { hasNativeSkillSupport };
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { getSkillsDir, getBuiltinSkillsCopyDir, getAutoSkillsDir, getSystemDir, ProcessConfig } from './initStorage';
import { computeOpenClawIdentityHash } from './openclawUtils';
import { writeWorkspaceGitignore } from './workspaceGitignore';
import { copyDirectoryRecursively, getDataPath } from './utils';
import { getInstallUuid } from '@process/services/kickoff/installUuid';
import {
  recordManagedWorkspaceProvenance,
  type ManagedWorkspaceCreationIdentity,
} from '@process/services/managedWorkspaceProvenance';

/**
 * Minimal skills.preferences shape used by setupAssistantWorkspace.
 * Passed as an injectable seam so callers (and tests) can provide it directly
 * rather than having to go through ProcessConfig.
 */
export type WorkspaceSkillsPreferences = {
  pinned: string[];
  disabled: string[];
  revision: number;
};

/**
 * Minimal SkillIndexEntry shape needed by setupAssistantWorkspace for the
 * blocked-verdict guard. Callers pass their own library entries; the default
 * production path loads them lazily from SkillLibrary.
 */
export type WorkspaceSkillEntry = {
  name: string;
  security?: { verdict: string };
};

/**
 * Set up native workspace structure for assistant (skill symlinks only)
 *
 * Symlinks into CLI-native skills directories for auto-discovery.
 * The BOUNDED SET rule: only _builtin auto-skills + pinned skills +
 * assistant's own enabledSkills are symlinked.  Library-only entries
 * are NEVER symlinked - they are reached on-demand via wayland_search_skills.
 *
 * Defense-in-depth: skills with security.verdict === 'blocked' are never
 * symlinked regardless of any other setting (B8 quarantines them physically;
 * this is the second filter).
 *
 * Invoked (via setupWorkspaceSkills) for temp workspaces and for project
 * workspaces (#455); a non-project user-picked custom workspace is left alone.
 * For project workspaces a managed `.gitignore` keeps these dot-dirs out of the
 * user's git, so skills resolve without polluting the folder.
 *
 * Note: Rules/personality are injected via system prompt, NOT written to context files
 */
export async function setupAssistantWorkspace(
  workspace: string,
  options: {
    agentType?: string;
    backend?: string;
    enabledSkills?: string[];
    /** Builtin skill names to exclude from auto-injection (e.g. 'cron' for cron-spawned conversations) */
    excludeBuiltinSkills?: string[];
    /** Absolute paths to extra skill directories to symlink (e.g. cron job skill dirs) */
    extraSkillPaths?: string[];
    /**
     * Injectable skills.preferences override for testing.
     * When omitted, loaded lazily from ProcessConfig on first call.
     */
    _skillsPreferences?: WorkspaceSkillsPreferences | null;
    /**
     * Injectable library entries for the blocked-verdict guard.
     * When omitted, no library-level verdict check is performed (safe: B8 is the primary gate).
     */
    _libraryEntries?: WorkspaceSkillEntry[];
  }
): Promise<void> {
  // Determine skills directories from ACP_BACKENDS_ALL config
  const key = options.backend || options.agentType || '';
  const skillsDirs = getSkillsDirsForBackend(key);

  // If no native skill directory is known for this CLI, skip symlink setup.
  // The caller should use prompt injection as fallback.
  if (!skillsDirs) return;

  // Load skills.preferences to get the pinned + disabled sets.
  // Use injectable override when provided (enables unit testing without real storage).
  let prefs: WorkspaceSkillsPreferences | null;
  if (options._skillsPreferences !== undefined) {
    prefs = options._skillsPreferences;
  } else {
    try {
      prefs = (await ProcessConfig.get('skills.preferences')) ?? null;
    } catch {
      prefs = null;
    }
  }

  const pinnedSet = new Set(prefs?.pinned ?? []);
  const disabledSet = new Set(prefs?.disabled ?? []);

  // Build a name→verdict map for the injectable library entries (blocked guard).
  const libraryVerdictMap = new Map<string, string>();
  for (const entry of options._libraryEntries ?? []) {
    if (entry.security?.verdict) {
      libraryVerdictMap.set(entry.name, entry.security.verdict);
    }
  }

  /** Returns true when a skill must not be symlinked. */
  const isBlocked = (name: string): boolean => {
    if (disabledSet.has(name)) return true;
    const verdict = libraryVerdictMap.get(name);
    return verdict === 'blocked';
  };

  const autoSkillsDir = getAutoSkillsDir();
  const userSkillsDir = getSkillsDir();

  for (const skillsRelDir of skillsDirs) {
    const targetSkillsDir = path.join(workspace, skillsRelDir);
    await fs.mkdir(targetSkillsDir, { recursive: true });

    /**
     * Put a skill inside the workspace by COPYING it, never by symlinking.
     *
     * wayland-core runs the agent against a `SandboxedFs` rooted at the
     * workspace, and its containment check canonicalizes a path before
     * comparing (`crates/wcore-tools/src/vfs.rs`) precisely so that "a symlink
     * planted inside the sandbox that points outside is detected and refused".
     * That is deliberate hardening, not a bug.
     *
     * Our skills live in the app's config directory, which is outside every
     * workspace, so a symlinked skill resolved to a path the sandbox refuses:
     * the agent could SEE the skill and could not read a single file in it.
     * Skills whose whole value is markdown survived, because that text is fed
     * to the model directly - but the seven bundled skills that ship scripts
     * (market-open-report, pdf, morph-ppt and friends) were unusable.
     *
     * A copy canonicalizes to a path inside the root, so it just works, and it
     * needs nothing from Core: the allowlist escape hatch named in that file's
     * comment does not exist in the shipped API - `SandboxPolicy` is an enum of
     * `Required | Bypass`, and `SandboxedFs::new` takes a single root.
     *
     * Cost is bounded: only the auto-builtin set plus the skills this assistant
     * actually enables are copied, and only once per workspace.
     */
    const placeSkill = async (sourceSkillDir: string, targetSkillDir: string, label: string): Promise<void> => {
      try {
        await fs.stat(sourceSkillDir);
      } catch {
        console.warn(`[setupAssistantWorkspace] ${label} directory not found: ${sourceSkillDir}`);
        return;
      }
      try {
        await fs.lstat(targetSkillDir);
        return; // already present - leave it alone
      } catch {
        // not there yet, fall through and copy
      }
      try {
        await copyDirectoryRecursively(sourceSkillDir, targetSkillDir, { overwrite: false });
        console.log(`[setupAssistantWorkspace] Copied ${label}: ${sourceSkillDir} -> ${targetSkillDir}`);
      } catch (error) {
        console.warn(`[setupAssistantWorkspace] Failed to copy ${label} ${sourceSkillDir}:`, error);
      }
    };

    // Always place _builtin skills for all native-skill backends
    let autoSkillNames: string[] = [];
    try {
      autoSkillNames = await fs.readdir(autoSkillsDir);
    } catch {
      // _builtin dir not ready yet, skip
    }
    const excludeSet = new Set(options.excludeBuiltinSkills ?? []);
    for (const skillName of autoSkillNames) {
      if (excludeSet.has(skillName)) continue;
      // Defense-in-depth: never symlink a blocked builtin skill
      if (isBlocked(skillName)) continue;
      await placeSkill(path.join(autoSkillsDir, skillName), path.join(targetSkillsDir, skillName), 'builtin skill');
    }

    // Symlink the bounded always-on set:
    //   - assistant's own enabledSkills
    //   - globally pinned skills (skills.preferences.pinned)
    // Library-only entries are intentionally excluded here.
    const alwaysOnSkills = new Set([...(options.enabledSkills ?? []), ...pinnedSet]);
    for (const skillName of alwaysOnSkills) {
      // Skip if already symlinked as a builtin skill
      if (autoSkillNames.includes(skillName)) continue;
      // Defense-in-depth: never symlink a blocked or disabled skill
      if (isBlocked(skillName)) continue;

      // Try builtin-skills/ first, then user skills/
      const builtinCandidate = path.join(getBuiltinSkillsCopyDir(), skillName);
      const userCandidate = path.join(userSkillsDir, skillName);
      const sourceSkillDir = existsSync(builtinCandidate) ? builtinCandidate : userCandidate;
      await placeSkill(sourceSkillDir, path.join(targetSkillsDir, skillName), 'skill');
    }

    // Symlink extra skill directories (e.g. cron job SKILL.md dirs)
    for (const extraPath of options.extraSkillPaths ?? []) {
      await placeSkill(extraPath, path.join(targetSkillsDir, path.basename(extraPath)), 'extra skill');
    }
  }
}

/**
 * Decide whether to lay down native skill symlinks for a workspace, and keep the
 * user's folder tidy when we do (#455 scope 4).
 *
 * - Temp workspaces (the app-created `*-temp-*` dirs): always set up skills.
 * - Project workspaces (managed or user-picked, identified by `projectId`): set
 *   up skills too — a project chat needs them to resolve — and write a managed
 *   `.gitignore` so the skill dot-dirs stay out of the user's git.
 * - A non-project custom workspace the user picked for a one-off chat is left
 *   untouched (never pollute a dir the app didn't create for a project).
 * - An APP-CREATED workspace that is neither temp nor project - the durable
 *   task folder a scheduled routine owns - is set up too. It reads as "custom"
 *   only because `buildWorkspaceWidthFiles` infers that flag from "a workspace
 *   was supplied", and a routine always supplies one. Without this a scheduled
 *   run cannot reach a single one of its declared skills: the engine sandboxes
 *   on the workspace, so the bundled scanner is refused rather than merely
 *   missing.
 *
 * `appCreatedWorkspace` is a separate signal ON PURPOSE. The tempting fix is to
 * pass `customWorkspace: false` from the cron executor, but that flag is
 * persisted onto the conversation and read by four other subsystems: Doctor
 * (`workspaceChecks.ts:151`) and the concierge diagnostics server
 * (`conciergeDiagServer.ts:1020`) both treat `false` as the app's own
 * authoritative "this is a temporary folder" and would WARN the user that a
 * folder in their Documents is temporary, and `createWCoreAgent` would blank
 * the conversation's `desc`. Skill placement must not be bought with a lie
 * about what the folder is.
 */
async function setupWorkspaceSkills(
  workspace: string,
  customWorkspace: boolean,
  isProjectWorkspace: boolean,
  options: Parameters<typeof setupAssistantWorkspace>[1],
  appCreatedWorkspace = false
): Promise<void> {
  if (customWorkspace && !isProjectWorkspace && !appCreatedWorkspace) return;
  await setupAssistantWorkspace(workspace, options);
  if (isProjectWorkspace) await writeWorkspaceGitignore(workspace);
}

async function createExclusiveManagedWorkspace(
  workRoot: string,
  defaultWorkspaceName: string,
  attempt = 0
): Promise<{ workspace: string; creationIdentity: ManagedWorkspaceCreationIdentity }> {
  if (attempt >= 8) throw new Error('Unable to exclusively create a managed workspace');
  const collisionSuffix = BigInt(`0x${randomUUID().replaceAll('-', '')}`)
    .toString(10)
    .padStart(39, '0');
  const candidateName = attempt === 0 ? defaultWorkspaceName : `${defaultWorkspaceName}${collisionSuffix}`;
  const candidate = path.join(workRoot, candidateName);
  try {
    // This must be an exclusive create. `recursive: true` would silently
    // adopt a predictable pre-existing directory and then mint provenance for
    // content Desktop did not create.
    await fs.mkdir(candidate, { recursive: false, mode: 0o700 });
    const canonicalRoot = await fs.realpath(workRoot);
    const canonicalPath = await fs.realpath(candidate);
    const candidateStat = await fs.lstat(canonicalPath);
    if (
      candidateStat.isSymbolicLink() ||
      !candidateStat.isDirectory() ||
      path.dirname(canonicalPath) !== canonicalRoot
    ) {
      throw new Error('Managed workspace creation identity is unsafe');
    }
    return {
      workspace: candidate,
      creationIdentity: {
        canonicalRoot,
        canonicalPath,
        device: candidateStat.dev,
        inode: candidateStat.ino,
      },
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    return createExclusiveManagedWorkspace(workRoot, defaultWorkspaceName, attempt + 1);
  }
}

/**
 * Create workspace directory (without copying files)
 *
 * Note: File copying is handled by copyFilesToDirectory in sendMessage
 * This avoids files being copied twice
 */
const buildWorkspaceWidthFiles = async (
  defaultWorkspaceName: string,
  workspace?: string,
  _defaultFiles?: string[],
  providedCustomWorkspace?: boolean
) => {
  // Use the customWorkspace flag from frontend; otherwise infer from the workspace parameter
  const customWorkspace = providedCustomWorkspace !== undefined ? providedCustomWorkspace : !!workspace;

  if (!workspace) {
    const tempPath = getSystemDir().workDir;
    if (path.basename(defaultWorkspaceName) !== defaultWorkspaceName || !isManagedWorkspaceName(defaultWorkspaceName)) {
      throw new Error('Managed workspace name does not match the closed temporary-workspace grammar');
    }
    await fs.mkdir(tempPath, { recursive: true });
    const createdWorkspace = await createExclusiveManagedWorkspace(tempPath, defaultWorkspaceName);
    workspace = createdWorkspace.workspace;
    try {
      await recordManagedWorkspaceProvenance({
        authorityRoot: getDataPath(),
        workRoot: tempPath,
        workspace,
        installationId: await getInstallUuid(),
        creationIdentity: createdWorkspace.creationIdentity,
      });
    } catch (error) {
      // Creation may proceed, but the workspace can never become reviewable
      // without an authenticated process-owned provenance record.
      console.warn('[initAgent] Failed to record managed-workspace provenance; retention will preserve it', error);
    }
  } else {
    // Normalize path: strip trailing slashes and resolve to absolute path
    workspace = path.resolve(workspace);
  }

  return { workspace, customWorkspace };
};

export const createGeminiAgent = async (
  model: TProviderWithModel,
  workspace?: string,
  defaultFiles?: string[],
  webSearchEngine?: 'google' | 'default',
  customWorkspace?: boolean,
  contextFileName?: string,
  presetRules?: string,
  enabledSkills?: string[],
  presetAssistantId?: string,
  sessionMode?: string,
  isHealthCheck?: boolean,
  extraSkillPaths?: string[],
  excludeBuiltinSkills?: string[],
  projectId?: string
): Promise<TChatConversation> => {
  const { workspace: newWorkspace, customWorkspace: finalCustomWorkspace } = await buildWorkspaceWidthFiles(
    `gemini-temp-${Date.now()}`,
    workspace,
    defaultFiles,
    customWorkspace
  );

  // Set up skill symlinks for native SkillManager discovery (temp + project ws).
  await setupWorkspaceSkills(newWorkspace, finalCustomWorkspace, !!projectId, {
    agentType: 'gemini',
    enabledSkills,
    extraSkillPaths,
    excludeBuiltinSkills,
  });

  return {
    type: 'gemini',
    model,
    extra: {
      workspace: newWorkspace,
      customWorkspace: finalCustomWorkspace,
      webSearchEngine,
      contextFileName,
      // System rules
      presetRules,
      // Backward compatible: contextContent stores rules
      contextContent: presetRules,
      // Enabled skills list (loaded via SkillManager)
      enabledSkills,
      // Preset assistant ID for displaying name and avatar in conversation panel
      presetAssistantId,
      // Initial session mode from Guid page mode selector
      sessionMode,
      // Explicit marker for temporary health-check conversations
      isHealthCheck,
    },
    desc: finalCustomWorkspace ? newWorkspace : '',
    createTime: Date.now(),
    modifyTime: Date.now(),
    name: newWorkspace,
    id: uuid(),
  };
};

export const createAcpAgent = async (options: ICreateConversationParams): Promise<TChatConversation> => {
  const { extra } = options;
  const { workspace, customWorkspace } = await buildWorkspaceWidthFiles(
    `${extra.backend}-temp-${Date.now()}`,
    extra.workspace,
    extra.defaultFiles,
    extra.customWorkspace
  );

  // Set up skill symlinks for temp + project workspaces (native discovery).
  await setupWorkspaceSkills(workspace, customWorkspace, !!extra.projectId, {
    backend: extra.backend,
    enabledSkills: extra.enabledSkills,
    extraSkillPaths: extra.extraSkillPaths,
    excludeBuiltinSkills: extra.excludeBuiltinSkills,
  });

  return {
    type: 'acp',
    extra: {
      workspace: workspace,
      customWorkspace,
      backend: extra.backend as AcpBackend,
      cliPath: extra.cliPath,
      agentName: extra.agentName,
      // Fall back to presetAssistantId so a 1:1 preset spawn can resolve its
      // custom CLI config (env, cliPath). buildAgentConversationParams sets only
      // presetAssistantId for presets, but AcpAgentManager keys the assistants-
      // store lookup off customAgentId - without this, an env-bearing preset
      // (e.g. a Hermes profile carrying HERMES_PROFILE) silently loses its env in
      // 1:1 chat. Teams already has this fallback (TeamSessionService).
      customAgentId: extra.customAgentId || extra.presetAssistantId, // Also used to identify preset assistant
      presetContext: extra.presetContext, // Preset rules/prompt for the smart assistant
      // Enabled skills list (loaded via SkillManager)
      enabledSkills: extra.enabledSkills,
      // Builtin auto-injected skills to exclude
      excludeBuiltinSkills: extra.excludeBuiltinSkills,
      // Preset assistant ID for displaying name and avatar in conversation panel
      presetAssistantId: extra.presetAssistantId,
      // Initial session mode selected on Guid page (from AgentModeSelector)
      sessionMode: extra.sessionMode,
      // Pre-selected model from Guid page (cached model list)
      currentModelId: extra.currentModelId,
      // Explicit marker for temporary health-check conversations
      isHealthCheck: extra.isHealthCheck,
      // Team ownership - used by sidebar filter to hide team-owned conversations
      ...(extra.teamId ? { teamId: extra.teamId } : {}),
    },
    createTime: Date.now(),
    modifyTime: Date.now(),
    name: workspace,
    id: uuid(),
  };
};

export const createNanobotAgent = async (options: ICreateConversationParams): Promise<TChatConversation> => {
  const { extra } = options;
  const { workspace, customWorkspace } = await buildWorkspaceWidthFiles(
    `nanobot-temp-${Date.now()}`,
    extra.workspace,
    extra.defaultFiles,
    extra.customWorkspace
  );

  // Set up skill symlinks for temp + project workspaces
  await setupWorkspaceSkills(workspace, customWorkspace, !!extra.projectId, {
    agentType: 'nanobot',
    enabledSkills: extra.enabledSkills,
    extraSkillPaths: extra.extraSkillPaths,
    excludeBuiltinSkills: extra.excludeBuiltinSkills,
  });

  return {
    type: 'nanobot',
    extra: {
      workspace: workspace,
      customWorkspace,
      enabledSkills: extra.enabledSkills,
      presetAssistantId: extra.presetAssistantId,
    },
    createTime: Date.now(),
    modifyTime: Date.now(),
    name: workspace,
    id: uuid(),
  };
};

export const createRemoteAgent = async (options: ICreateConversationParams): Promise<TChatConversation> => {
  const { extra } = options;
  const { workspace, customWorkspace } = await buildWorkspaceWidthFiles(
    `remote-temp-${Date.now()}`,
    extra.workspace,
    extra.defaultFiles,
    extra.customWorkspace
  );

  await setupWorkspaceSkills(workspace, customWorkspace, !!extra.projectId, {
    enabledSkills: extra.enabledSkills,
    extraSkillPaths: extra.extraSkillPaths,
    excludeBuiltinSkills: extra.excludeBuiltinSkills,
  });

  return {
    type: 'remote',
    extra: {
      workspace,
      customWorkspace,
      remoteAgentId: extra.remoteAgentId!,
      enabledSkills: extra.enabledSkills,
      presetAssistantId: extra.presetAssistantId,
    },
    createTime: Date.now(),
    modifyTime: Date.now(),
    name: workspace,
    id: uuid(),
  };
};

export const createWCoreAgent = async (options: ICreateConversationParams): Promise<TChatConversation> => {
  const { extra } = options;
  const { workspace, customWorkspace } = await buildWorkspaceWidthFiles(
    `wcore-temp-${Date.now()}`,
    extra.workspace,
    extra.defaultFiles,
    extra.customWorkspace
  );

  // Set up skill symlinks for native discovery by wayland-core.
  // The engine looks in `.wayland-core/skills/` (engine paths.rs:46);
  // the 'wcore' agentType key is mapped to that directory in NON_ACP_SKILLS_DIRS
  // so the symlinks land where the engine reads. Project workspaces (#455) get
  // them too — with a managed .gitignore — so project chats can resolve skills.
  await setupWorkspaceSkills(
    workspace,
    customWorkspace,
    !!extra.projectId,
    {
      agentType: 'wcore',
      enabledSkills: extra.enabledSkills,
      extraSkillPaths: extra.extraSkillPaths,
      excludeBuiltinSkills: extra.excludeBuiltinSkills,
    },
    extra.appCreatedWorkspace === true
  );

  return {
    // 'wcore' is the canonical conversation type.
    type: 'wcore',
    model: options.model,
    extra: {
      workspace,
      customWorkspace,
      presetRules: extra.presetRules,
      enabledSkills: extra.enabledSkills,
      presetAssistantId: extra.presetAssistantId,
      sessionMode: extra.sessionMode,
    },
    desc: customWorkspace ? workspace : '',
    createTime: Date.now(),
    modifyTime: Date.now(),
    name: workspace,
    id: uuid(),
  };
};

export const createOpenClawAgent = async (options: ICreateConversationParams): Promise<TChatConversation> => {
  const { extra } = options;
  const { workspace, customWorkspace } = await buildWorkspaceWidthFiles(
    `openclaw-temp-${Date.now()}`,
    extra.workspace,
    extra.defaultFiles,
    extra.customWorkspace
  );

  // Set up skill symlinks for temp + project workspaces
  await setupWorkspaceSkills(workspace, customWorkspace, !!extra.projectId, {
    enabledSkills: extra.enabledSkills,
    extraSkillPaths: extra.extraSkillPaths,
    excludeBuiltinSkills: extra.excludeBuiltinSkills,
  });

  const expectedIdentityHash = await computeOpenClawIdentityHash(workspace);
  return {
    type: 'openclaw-gateway',
    extra: {
      workspace: workspace,
      backend: extra.backend as AcpBackendAll,
      agentName: extra.agentName,
      customWorkspace,
      gateway: {
        cliPath: extra.cliPath,
      },
      runtimeValidation: {
        expectedWorkspace: workspace,
        expectedBackend: extra.backend,
        expectedAgentName: extra.agentName,
        expectedCliPath: extra.cliPath,
        // Note: model is not used by openclaw-gateway, so skip expectedModel to avoid
        // validation mismatch (conversation object doesn't store model for this type)
        expectedIdentityHash,
        switchedAt: extra.runtimeValidation?.switchedAt ?? Date.now(),
      },
      // Enabled skills list (loaded via SkillManager)
      enabledSkills: extra.enabledSkills,
      // Preset assistant ID for displaying name and avatar in conversation panel
      presetAssistantId: extra.presetAssistantId,
    },
    createTime: Date.now(),
    modifyTime: Date.now(),
    name: workspace,
    id: uuid(),
  };
};
