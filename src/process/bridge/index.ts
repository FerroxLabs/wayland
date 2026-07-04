/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { agentRegistry } from '@process/agent/AgentRegistry';
import type { IChannelRepository } from '@process/services/database/IChannelRepository';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';
import type { IConversationService } from '@process/services/IConversationService';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';
import { initAcpConversationBridge } from './acpConversationBridge';
import { initApplicationBridge } from './applicationBridge';
import { initAuthBridge } from './authBridge';
import { initBedrockBridge } from './bedrockBridge';
import { initChannelBridge } from './channelBridge';
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
import { initSystemSettingsBridge } from './systemSettingsBridge';
import { initTerminalBridge } from '@process/terminal/terminalBridge';
import { initFluxConnectorBridge } from './fluxConnectorBridge';
import { initAmbientBridge } from './ambientBridge';
import { initWindowControlsBridge } from './windowControlsBridge';
import { initNotificationBridge } from './notificationBridge';
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
import { initModelRegistryIpc } from '@process/providers/ipc/modelRegistryIpc';
import { initWcoreToolKeyIpc } from '@process/agent/wcore/toolKeyIpc';
import { initWcoreConfigBridge } from './wcoreConfigBridge';
import { initWcoreUpdateBridge } from './wcoreUpdateBridge';
import { initPendingSendBridge } from './pendingSendBridge';
import { initDoctorBridge } from './doctorBridge';

export interface BridgeDependencies {
  conversationService: IConversationService;
  conversationRepo: IConversationRepository;
  workerTaskManager: IWorkerTaskManager;
  channelRepo: IChannelRepository;
  teamSessionService: TeamSessionService;
}

/**
 * Initialize all IPC bridge modules
 */
export function initAllBridges(deps: BridgeDependencies): void {
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
  initAmbientBridge();
  initNotificationBridge();
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
  initMissionControlBridge(deps.teamSessionService);
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
  initNicknamesBridge();
  initSyncIpc();
  initConstitutionBridge();
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
  initDoctorBridge,
};
export { initModelRegistryIpc } from '@process/providers/ipc/modelRegistryIpc';
export { disposeAllSnapshots } from './workspaceSnapshotBridge';
export { disposeAllTeamSessions } from './teamBridge';
// Export window-control utility functions
export { registerWindowMaximizeListeners } from './windowControlsBridge';
