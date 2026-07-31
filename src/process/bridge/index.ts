/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs. Changes are documented in the project history.
 */

import { agentRegistry } from '@process/agent/AgentRegistry';
import type { IChannelRepository } from '@process/services/database/IChannelRepository';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';
import type { IConversationService } from '@process/services/IConversationService';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';
import { initAcpConversationBridge } from './acpConversationBridge';
import {
  initApplicationBridge,
  isApplicationMainWindowSender,
  isApplicationWindowFocused,
  getForegroundConversationId,
} from './applicationBridge';
import { initAuthBridge } from './authBridge';
import { initBedrockBridge } from './bedrockBridge';
import { initChannelBridge } from './channelBridge';
import { initCockpitPreviewBridge } from './cockpitPreviewBridge';
import { initConversationBridge } from './conversationBridge';
import { initCronBridge } from './cronBridge';
import { initConciergeConfigBridge } from './conciergeConfigBridge';
import { initProjectBridge } from './projectBridge';
import { initDatabaseBridge } from './databaseBridge';
import { initDialogBridge } from './dialogBridge';
import { initDocumentBridge } from './documentBridge';
import { initFileWatchBridge } from './fileWatchBridge';
import { initFsBridge } from './fsBridge';
import { initGeminiBridge } from './geminiBridge';
import { initGeminiConversationBridge } from './geminiConversationBridge';
import { initKickoffBridge } from './kickoffBridge';
import { initMcpBridge } from './mcpBridge';
import { initModelBridge } from './modelBridge';
import { initPreviewHistoryBridge } from './previewHistoryBridge';
import { initShellBridge } from './shellBridge';
import { initCuaPermissionBridge } from './cuaPermissionBridge';
import { initMicPermissionBridge } from './micPermissionBridge';
import { initStarOfficeBridge } from './starOfficeBridge';
import { initSpeechToTextBridge } from './speechToTextBridge';
import { initVoiceAssetBridge } from './voiceAssetBridge';
import { initVoiceSynthBridge } from './voiceSynthBridge';
import { initSkillsBridge } from './skillsBridge';
import { initTaskBridge } from './taskBridge';
import { initUpdateBridge } from './updateBridge';
import { initWebuiBridge } from './webuiBridge';
import { initConstitutionBridge } from './constitutionBridge';
import { initOnboardingBridge } from './onboardingBridge';
import { initIjfwBridge } from './ijfwBridge';
import { initIjfwDropBridge } from './ijfwDropBridge';
import { initMemoryArchiveBridge, initPromotionSweep } from './memoryArchiveBridge';
import { initWikiBridge } from './wikiBridge';
import { startWikiAutoSync } from '@process/services/wiki/wikiAutoSync';
import { initImportBridge } from './importBridge';
import { initMigrationBridge } from './migrationBridge';
import { initWorkspaceTrustBridge } from './workspaceTrustBridge';
import { initSystemSettingsBridge } from './systemSettingsBridge';
import { initTerminalBridge } from '@process/terminal/terminalBridge';
import { initFluxConnectorBridge } from './fluxConnectorBridge';
import { initAmbientBridge } from './ambientBridge';
import { initWindowControlsBridge } from './windowControlsBridge';
import { initNotificationBridge } from './notificationBridge';
import { initTaskCompletionNotifier } from '@process/services/notifications/taskCompletionNotifier';
import { getWorkflowSessionService } from '@process/services/workflow/workflowSessionServiceSingleton';
import { initPptPreviewBridge } from './pptPreviewBridge';
import { initOfficeWatchBridge } from './officeWatchBridge';
import { initExtensionsBridge } from './extensionsBridge';
import { initWeixinLoginBridge } from './weixinLoginBridge';
import { initWorkspaceSnapshotBridge } from './workspaceSnapshotBridge';
import { initRemoteAgentBridge } from './remoteAgentBridge';
import { initHubBridge } from './hubBridge';
import { initTeamBridge } from './teamBridge';
import { initMissionControlBridge } from './missionControlBridge';
import { initStorageBridge } from '@process/storage/storageIpc';
import { initNicknamesBridge } from '@process/storage/nicknamesIpc';
import { initSyncIpc } from '@process/sync/syncIpc';
import type { TeamSessionService } from '@process/team/TeamSessionService';
import type { ConstitutionFsService } from '@process/services/constitution/constitutionFsService';
import type { ConstitutionArchiveRecoveryService } from '@process/services/constitution/constitutionArchiveRecoveryService';
import { initModelRegistryIpc } from '@process/providers/ipc/modelRegistryIpc';
import { initWcoreToolKeyIpc } from '@process/agent/wcore/toolKeyIpc';
import { initWcoreConfigBridge } from './wcoreConfigBridge';
import { initWcoreUpdateBridge } from './wcoreUpdateBridge';
import { initPendingSendBridge } from './pendingSendBridge';
import { initDoctorBridge } from './doctorBridge';
import { initDesktopFluxRoutingEvidenceAdapter } from '@process/flux/FluxRoutingEvidenceAdapter';
import { initWorkspaceRetentionBridge } from './workspaceRetentionBridge';
import { loadManagedWorkspaceProvenance } from '@process/services/managedWorkspaceProvenance';
import { getInstallUuid } from '@process/services/kickoff/installUuid';
import { initWaylandTransferBridge } from './waylandTransferBridge';
import { projectServiceSingleton } from '@process/services/projectServiceSingleton';
import { cronService } from '@process/services/cron/cronServiceSingleton';
import { getSystemDir } from '@process/utils/initStorage';
import { getDataPath } from '@process/utils';
import { buildWaylandTransferInventoryPreflight } from '@process/services/transfer/inventory/transferPreflight';
import { nativeConfigDir, profilesRoot } from '@process/agent/wcore/profilePaths';
import { getReleaseTrack } from '@/common/releaseTrack';
import { app } from 'electron';
import path from 'node:path';

export interface BridgeDependencies {
  conversationService: IConversationService;
  conversationRepo: IConversationRepository;
  workerTaskManager: IWorkerTaskManager;
  channelRepo: IChannelRepository;
  teamSessionService: TeamSessionService;
  constitutionFsService: ConstitutionFsService;
  constitutionArchiveRecoveryService: ConstitutionArchiveRecoveryService;
}

/**
 * Initialize all IPC bridge modules
 */
export function initAllBridges(deps: BridgeDependencies): void {
  // Flux #888 publishes replay semantics but no live transport. Register the
  // Desktop boundary in explicit no_flux state; a future trusted producer feed
  // must negotiate capability + complete correlation before enabling claims.
  initDesktopFluxRoutingEvidenceAdapter();
  initDialogBridge();
  initShellBridge();
  initCuaPermissionBridge();
  initMicPermissionBridge();
  initFsBridge();
  initFileWatchBridge();
  initConversationBridge(deps.conversationService, deps.workerTaskManager, deps.teamSessionService);
  initApplicationBridge(deps.workerTaskManager);
  initGeminiConversationBridge(deps.workerTaskManager);
  // extra Gemini helper bridges (subscription detection, etc.) must be available after the conversation bridge is initialized / extra helpers after core bridges
  initGeminiBridge();
  initBedrockBridge();
  initAcpConversationBridge(deps.workerTaskManager);
  initAuthBridge();
  initModelBridge();
  initMcpBridge();
  initPreviewHistoryBridge();
  initDocumentBridge();
  initPptPreviewBridge();
  initOfficeWatchBridge();
  initWindowControlsBridge();
  initUpdateBridge();
  initWebuiBridge();
  initChannelBridge(deps.channelRepo);
  initCockpitPreviewBridge((event) => isApplicationMainWindowSender(event.sender.id));
  initDatabaseBridge(deps.conversationRepo);
  initExtensionsBridge(deps.conversationRepo, deps.workerTaskManager);
  initCronBridge();
  initConciergeConfigBridge();
  initProjectBridge();
  initKickoffBridge();
  initSystemSettingsBridge();
  initTerminalBridge();
  initFluxConnectorBridge();
  initIjfwBridge();
  initIjfwDropBridge();
  initMemoryArchiveBridge();
  initPromotionSweep();
  initWikiBridge();
  startWikiAutoSync();
  initImportBridge();
  initMigrationBridge();
  initWorkspaceTrustBridge();
  initAmbientBridge();
  initNotificationBridge();
  initTaskCompletionNotifier({
    isAppFocused: isApplicationWindowFocused,
    getForegroundConversationId,
    getConversation: (id) => deps.conversationService.getConversation(id),
    // Resolved lazily, at event time: the workflow singleton is wired later in
    // initBridge than initAllBridges runs, so capturing it here would capture null.
    findWorkflowByConversationId: (id) => getWorkflowSessionService()?.findByConversationId(id) ?? null,
  });
  initTaskBridge(deps.workerTaskManager);
  initStarOfficeBridge();
  initSpeechToTextBridge();
  initVoiceAssetBridge();
  initVoiceSynthBridge();
  initSkillsBridge();
  initWeixinLoginBridge();
  initWorkspaceSnapshotBridge();
  initRemoteAgentBridge();
  initHubBridge();
  initTeamBridge(deps.teamSessionService);
  initMissionControlBridge(deps.teamSessionService, deps.workerTaskManager, deps.conversationService);
  // A DB / migration failure during registration would otherwise become an
  // unhandled rejection and the `modelRegistry` namespace would silently never
  // register - log it so the failure is at least visible.
  void initModelRegistryIpc().catch((error) => {
    console.error('[modelRegistry] Failed to initialize IPC:', error);
  });
  initWcoreToolKeyIpc();
  initWcoreConfigBridge();
  initWcoreUpdateBridge();
  initPendingSendBridge();
  initStorageBridge();
  initWorkspaceRetentionBridge({
    getWorkDir: () => getSystemDir().workDir,
    getInstallationId: () => getInstallUuid(),
    loadProvenance: async () => loadManagedWorkspaceProvenance(getDataPath(), await getInstallUuid()),
    sources: {
      listConversations: () => deps.conversationRepo.listAllConversations(),
      listProjects: () => projectServiceSingleton.listProjects(),
      listSchedules: () => cronService.listJobs(),
      listActiveProcesses: () =>
        deps.workerTaskManager.listWorkspaceAuthorities().map(({ id, workspace }) => ({ id, workspace })),
    },
  });
  initWaylandTransferBridge(async (request) => {
    const namedProfilesRoot = profilesRoot();
    const projects = await projectServiceSingleton.listProjects();
    return buildWaylandTransferInventoryPreflight({
      request,
      inventory: {
        userDataRoot: app.getPath('userData'),
        constitutionRoot: path.dirname(namedProfilesRoot),
        coreDefaultProfileRoot: nativeConfigDir(),
        coreNamedProfilesRoot: namedProfilesRoot,
        externalWorkspaces: projects
          .filter((project) => Boolean(project.workspace))
          .map((project) => ({ projectId: project.id, path: project.workspace! })),
        sourceReleaseTrack: getReleaseTrack(),
      },
      // These are capability facts, not aspirations. Preview remains blocked
      // until live Desktop/Core quiescence and portable sealing are wired.
      recoveryCapabilities: {
        sqliteOnlineBackup: true,
        desktopQuiescence: false,
        coreQuiescence: false,
        mutationEpoch: true,
        sealedSensitiveCopies: false,
      },
    });
  });
  initNicknamesBridge();
  initSyncIpc();
  initConstitutionBridge(
    deps.constitutionFsService,
    deps.constitutionArchiveRecoveryService,
    (event) => event.senderFrame === event.sender.mainFrame && isApplicationMainWindowSender(event.sender.id)
  );
  initOnboardingBridge();
  initDoctorBridge();
}

/**
 * Initialize the ACP detector
 */
export async function initializeAcpDetector(): Promise<void> {
  try {
    await agentRegistry.initialize();
  } catch (error) {
    console.error('[ACP] Failed to initialize detector:', error);
  }
}

// Export individual init functions for standalone use

export {
  initMemoryArchiveBridge,
  initPromotionSweep,
  initAcpConversationBridge,
  initApplicationBridge,
  initAuthBridge,
  initBedrockBridge,
  initChannelBridge,
  initCockpitPreviewBridge,
  initConversationBridge,
  initCronBridge,
  initConciergeConfigBridge,
  initProjectBridge,
  initDatabaseBridge,
  initDialogBridge,
  initDocumentBridge,
  initExtensionsBridge,
  initFsBridge,
  initGeminiBridge,
  initGeminiConversationBridge,
  initKickoffBridge,
  initMcpBridge,
  initModelBridge,
  initNotificationBridge,
  initOfficeWatchBridge,
  initPptPreviewBridge,
  initPreviewHistoryBridge,
  initShellBridge,
  initSpeechToTextBridge,
  initVoiceAssetBridge,
  initVoiceSynthBridge,
  initSkillsBridge,
  initStarOfficeBridge,
  initSystemSettingsBridge,
  initFluxConnectorBridge,
  initAmbientBridge,
  initTaskBridge,
  initUpdateBridge,
  initWebuiBridge,
  initConstitutionBridge,
  initOnboardingBridge,
  initRemoteAgentBridge,
  initHubBridge,
  initTeamBridge,
  initWindowControlsBridge,
  initWeixinLoginBridge,
  initWorkspaceSnapshotBridge,
  initIjfwBridge,
  initIjfwDropBridge,
  initWikiBridge,
  initImportBridge,
  initMigrationBridge,
  initWorkspaceTrustBridge,
  initDoctorBridge,
};
export { initModelRegistryIpc } from '@process/providers/ipc/modelRegistryIpc';
export { disposeAllSnapshots } from './workspaceSnapshotBridge';
export { disposeAllTeamSessions } from './teamBridge';
// Export window-control utility functions
export { registerWindowMaximizeListeners } from './windowControlsBridge';
