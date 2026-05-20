/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ICreateConversationParams } from '@/common/adapter/ipcBridge';
import type { TChatConversation, TProviderWithModel } from '@/common/config/storage';
import type { AcpBackend, AcpBackendAll } from '@/common/types/acpTypes';
import { getSkillsDirsForBackend, hasNativeSkillSupport } from '@/common/types/acpTypes';
import { uuid } from '@/common/utils';

// Re-export for backward compatibility (tests mock this path)
export { hasNativeSkillSupport };
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { getSkillsDir, getBuiltinSkillsCopyDir, getAutoSkillsDir, getSystemDir } from './initStorage';
import { computeOpenClawIdentityHash } from './openclawUtils';

/**
 * Set up native workspace structure for assistant (skill symlinks only)
 *
 * Symlink enabled skills into CLI-native skills directories for auto-discovery
 *
 * Only runs for temp workspaces (not user-specified) to avoid polluting user project dirs
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
  }
): Promise<void> {
  // Determine skills directories from ACP_BACKENDS_ALL config
  const key = options.backend || options.agentType || '';
  const skillsDirs = getSkillsDirsForBackend(key);

  // If no native skill directory is known for this CLI, skip symlink setup.
  // The caller should use prompt injection as fallback.
  if (!skillsDirs) return;

  const autoSkillsDir = getAutoSkillsDir();
  const userSkillsDir = getSkillsDir();

  for (const skillsRelDir of skillsDirs) {
    const targetSkillsDir = path.join(workspace, skillsRelDir);
    await fs.mkdir(targetSkillsDir, { recursive: true });

    // Always symlink _builtin skills for all native-skill backends
    let autoSkillNames: string[] = [];
    try {
      autoSkillNames = await fs.readdir(autoSkillsDir);
    } catch {
      // _builtin dir not ready yet, skip
    }
    const excludeSet = new Set(options.excludeBuiltinSkills ?? []);
    for (const skillName of autoSkillNames) {
      if (excludeSet.has(skillName)) continue;
      const sourceSkillDir = path.join(autoSkillsDir, skillName);
      const targetSkillDir = path.join(targetSkillsDir, skillName);
      try {
        await fs.stat(sourceSkillDir);
        try {
          await fs.lstat(targetSkillDir);
          // Already exists, skip
        } catch {
          await fs.symlink(sourceSkillDir, targetSkillDir, 'junction');
          console.log(`[setupAssistantWorkspace] Symlinked builtin skill: ${skillName} -> ${targetSkillDir}`);
        }
      } catch {
        console.warn(`[setupAssistantWorkspace] Builtin skill directory not found: ${sourceSkillDir}`);
      }
    }

    // Symlink optional enabled skills
    for (const skillName of options.enabledSkills ?? []) {
      // Skip if already symlinked as a builtin skill
      if (autoSkillNames.includes(skillName)) continue;

      // Try builtin-skills/ first, then user skills/
      const builtinCandidate = path.join(getBuiltinSkillsCopyDir(), skillName);
      const userCandidate = path.join(userSkillsDir, skillName);
      const sourceSkillDir = existsSync(builtinCandidate) ? builtinCandidate : userCandidate;
      const targetSkillDir = path.join(targetSkillsDir, skillName);

      try {
        await fs.stat(sourceSkillDir);
        try {
          await fs.lstat(targetSkillDir);
          // Already exists, skip
        } catch {
          await fs.symlink(sourceSkillDir, targetSkillDir, 'junction');
          console.log(`[setupAssistantWorkspace] Symlinked skill: ${skillName} -> ${targetSkillDir}`);
        }
      } catch {
        console.warn(`[setupAssistantWorkspace] Skill directory not found: ${sourceSkillDir}`);
      }
    }

    // Symlink extra skill directories (e.g. cron job SKILL.md dirs)
    for (const extraPath of options.extraSkillPaths ?? []) {
      const skillDirName = path.basename(extraPath);
      const targetSkillDir = path.join(targetSkillsDir, skillDirName);
      try {
        await fs.stat(extraPath);
        try {
          await fs.lstat(targetSkillDir);
        } catch {
          await fs.symlink(extraPath, targetSkillDir, 'junction');
          console.log(`[setupAssistantWorkspace] Symlinked extra skill: ${extraPath} -> ${targetSkillDir}`);
        }
      } catch {
        console.warn(`[setupAssistantWorkspace] Extra skill directory not found: ${extraPath}`);
      }
    }
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
    workspace = path.join(tempPath, defaultWorkspaceName);
    await fs.mkdir(workspace, { recursive: true });
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
  excludeBuiltinSkills?: string[]
): Promise<TChatConversation> => {
  const { workspace: newWorkspace, customWorkspace: finalCustomWorkspace } = await buildWorkspaceWidthFiles(
    `gemini-temp-${Date.now()}`,
    workspace,
    defaultFiles,
    customWorkspace
  );

  // Set up skill symlinks for native SkillManager discovery
  if (!finalCustomWorkspace) {
    await setupAssistantWorkspace(newWorkspace, {
      agentType: 'gemini',
      enabledSkills,
      extraSkillPaths,
      excludeBuiltinSkills,
    });
  }

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

  // Set up skill symlinks for temp workspace (native discovery)
  if (!customWorkspace) {
    await setupAssistantWorkspace(workspace, {
      backend: extra.backend,
      enabledSkills: extra.enabledSkills,
      extraSkillPaths: extra.extraSkillPaths,
      excludeBuiltinSkills: extra.excludeBuiltinSkills,
    });
  }

  return {
    type: 'acp',
    extra: {
      workspace: workspace,
      customWorkspace,
      backend: extra.backend as AcpBackend,
      cliPath: extra.cliPath,
      agentName: extra.agentName,
      customAgentId: extra.customAgentId, // Also used to identify preset assistant
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
      // Team ownership — used by sidebar filter to hide team-owned conversations
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

  // Set up skill symlinks for temp workspace
  if (!customWorkspace) {
    await setupAssistantWorkspace(workspace, {
      agentType: 'nanobot',
      enabledSkills: extra.enabledSkills,
      extraSkillPaths: extra.extraSkillPaths,
      excludeBuiltinSkills: extra.excludeBuiltinSkills,
    });
  }

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

  if (!customWorkspace) {
    await setupAssistantWorkspace(workspace, {
      enabledSkills: extra.enabledSkills,
      extraSkillPaths: extra.extraSkillPaths,
      excludeBuiltinSkills: extra.excludeBuiltinSkills,
    });
  }

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
  // so the symlinks land where the engine reads.
  if (!customWorkspace) {
    await setupAssistantWorkspace(workspace, {
      agentType: 'wcore',
      enabledSkills: extra.enabledSkills,
      extraSkillPaths: extra.extraSkillPaths,
      excludeBuiltinSkills: extra.excludeBuiltinSkills,
    });
  }

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

  // Set up skill symlinks for temp workspace
  if (!customWorkspace) {
    await setupAssistantWorkspace(workspace, {
      enabledSkills: extra.enabledSkills,
      extraSkillPaths: extra.extraSkillPaths,
      excludeBuiltinSkills: extra.excludeBuiltinSkills,
    });
  }

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
