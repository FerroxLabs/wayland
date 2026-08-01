import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The data dir the platform mock hands to production. Production joins it with
// path.join, so the expectation below must be built the same way: hard-coding
// the POSIX spelling asserted '/tmp/.../revision-authority.enc' against the
// '\tmp\...' that path.join produces on Windows.
const STANDALONE_DATA_DIR = '/tmp/wayland-standalone';

const mocks = vi.hoisted(() => ({
  initApplicationBridgeCore: vi.fn(),
  initShellBridgeStandalone: vi.fn(),
  initFileWatchBridge: vi.fn(),
  initFsBridge: vi.fn(),
  initConversationBridge: vi.fn(),
  initGeminiConversationBridge: vi.fn(),
  initGeminiBridge: vi.fn(),
  initBedrockBridge: vi.fn(),
  initAcpConversationBridge: vi.fn(),
  initAuthBridge: vi.fn(),
  initModelBridge: vi.fn(),
  initPreviewHistoryBridge: vi.fn(),
  initDocumentBridge: vi.fn(),
  initPptPreviewBridge: vi.fn(),
  initOfficeWatchBridge: vi.fn(),
  initChannelBridge: vi.fn(),
  initDatabaseBridge: vi.fn(),
  initExtensionsBridge: vi.fn(),
  initSystemSettingsBridge: vi.fn(),
  initCronBridge: vi.fn(),
  initMcpBridge: vi.fn(),
  initNotificationBridge: vi.fn(),
  initTaskBridge: vi.fn(),
  initStarOfficeBridge: vi.fn(),
  initSpeechToTextBridge: vi.fn(),
  initHubBridge: vi.fn(),
  initProjectBridge: vi.fn(),
  initTeamBridge: vi.fn(),
  initSkillsBridge: vi.fn(),
  initWebCloudFluxRoutingEvidenceAdapter: vi.fn(),
  initModelRegistryIpc: vi.fn(async () => {}),
  initializeRegistry: vi.fn(async () => {}),
  loggerConfig: vi.fn(),
  createConstitutionFsProduction: vi.fn(),
  setConstitutionFsService: vi.fn(),
  setConstitutionArchiveRecoveryService: vi.fn(),
  setConstitutionClassicRecoveryServiceReady: vi.fn(),
  constitutionFsService: { kind: 'constitution-fs-service' },
  constitutionRestoreAuthority: { kind: 'constitution-restore-authority' },
  constitutionArchiveRecoveryService: { kind: 'constitution-archive-recovery-service' },
}));

vi.mock('@office-ai/platform', () => ({
  logger: {
    config: (...args: unknown[]) => mocks.loggerConfig(...args),
  },
  // bridgeAllowlist wraps bridge.buildProvider / buildEmitter, so the platform
  // mock must expose them or the import graph throws before the test runs.
  bridge: {
    buildProvider: vi.fn(() => ({
      provider: vi.fn(() => vi.fn()),
      invoke: vi.fn(),
    })),
    buildEmitter: vi.fn(() => ({
      emit: vi.fn(),
      on: vi.fn(),
    })),
  },
  storage: {
    buildStorage: () => ({
      getSync: () => undefined,
      setSync: () => {},
      get: () => Promise.resolve(undefined),
      set: () => Promise.resolve(),
    }),
  },
}));

vi.mock('@process/agent/AgentRegistry', () => ({
  agentRegistry: {
    initialize: (...args: unknown[]) => mocks.initializeRegistry(...args),
  },
}));

vi.mock('@process/services/database/SqliteChannelRepository', () => ({
  SqliteChannelRepository: vi.fn(),
}));

vi.mock('@process/services/database/SqliteConversationRepository', () => ({
  SqliteConversationRepository: vi.fn(),
}));

vi.mock('@process/services/ConversationServiceImpl', () => ({
  ConversationServiceImpl: vi.fn(),
}));

vi.mock('@process/task/workerTaskManagerSingleton', () => ({
  workerTaskManager: {},
}));

vi.mock('@process/bridge/applicationBridgeCore', () => ({
  initApplicationBridgeCore: (...args: unknown[]) => mocks.initApplicationBridgeCore(...args),
}));
vi.mock('@process/bridge/shellBridgeStandalone', () => ({
  initShellBridgeStandalone: (...args: unknown[]) => mocks.initShellBridgeStandalone(...args),
}));
vi.mock('@process/bridge/fileWatchBridge', () => ({
  initFileWatchBridge: (...args: unknown[]) => mocks.initFileWatchBridge(...args),
}));
vi.mock('@process/bridge/fsBridge', () => ({
  initFsBridge: (...args: unknown[]) => mocks.initFsBridge(...args),
}));
vi.mock('@process/bridge/conversationBridge', () => ({
  initConversationBridge: (...args: unknown[]) => mocks.initConversationBridge(...args),
}));
vi.mock('@process/bridge/geminiConversationBridge', () => ({
  initGeminiConversationBridge: (...args: unknown[]) => mocks.initGeminiConversationBridge(...args),
}));
vi.mock('@process/bridge/geminiBridge', () => ({
  initGeminiBridge: (...args: unknown[]) => mocks.initGeminiBridge(...args),
}));
vi.mock('@process/bridge/bedrockBridge', () => ({
  initBedrockBridge: (...args: unknown[]) => mocks.initBedrockBridge(...args),
}));
vi.mock('@process/bridge/acpConversationBridge', () => ({
  initAcpConversationBridge: (...args: unknown[]) => mocks.initAcpConversationBridge(...args),
}));
vi.mock('@process/bridge/authBridge', () => ({
  initAuthBridge: (...args: unknown[]) => mocks.initAuthBridge(...args),
}));
vi.mock('@process/bridge/modelBridge', () => ({
  initModelBridge: (...args: unknown[]) => mocks.initModelBridge(...args),
}));
vi.mock('@process/bridge/previewHistoryBridge', () => ({
  initPreviewHistoryBridge: (...args: unknown[]) => mocks.initPreviewHistoryBridge(...args),
}));
vi.mock('@process/bridge/documentBridge', () => ({
  initDocumentBridge: (...args: unknown[]) => mocks.initDocumentBridge(...args),
}));
vi.mock('@process/bridge/pptPreviewBridge', () => ({
  initPptPreviewBridge: (...args: unknown[]) => mocks.initPptPreviewBridge(...args),
}));
vi.mock('@process/bridge/officeWatchBridge', () => ({
  initOfficeWatchBridge: (...args: unknown[]) => mocks.initOfficeWatchBridge(...args),
}));
vi.mock('@process/bridge/channelBridge', () => ({
  initChannelBridge: (...args: unknown[]) => mocks.initChannelBridge(...args),
}));
vi.mock('@process/bridge/databaseBridge', () => ({
  initDatabaseBridge: (...args: unknown[]) => mocks.initDatabaseBridge(...args),
}));
vi.mock('@process/bridge/extensionsBridge', () => ({
  initExtensionsBridge: (...args: unknown[]) => mocks.initExtensionsBridge(...args),
}));
vi.mock('@process/bridge/systemSettingsBridge', () => ({
  initSystemSettingsBridge: (...args: unknown[]) => mocks.initSystemSettingsBridge(...args),
}));
vi.mock('@process/bridge/cronBridge', () => ({
  initCronBridge: (...args: unknown[]) => mocks.initCronBridge(...args),
}));
vi.mock('@process/bridge/mcpBridge', () => ({
  initMcpBridge: (...args: unknown[]) => mocks.initMcpBridge(...args),
}));
vi.mock('@process/bridge/notificationBridge', () => ({
  initNotificationBridge: (...args: unknown[]) => mocks.initNotificationBridge(...args),
}));
vi.mock('@process/bridge/taskBridge', () => ({
  initTaskBridge: (...args: unknown[]) => mocks.initTaskBridge(...args),
}));
vi.mock('@process/bridge/starOfficeBridge', () => ({
  initStarOfficeBridge: (...args: unknown[]) => mocks.initStarOfficeBridge(...args),
}));
vi.mock('@process/bridge/speechToTextBridge', () => ({
  initSpeechToTextBridge: (...args: unknown[]) => mocks.initSpeechToTextBridge(...args),
}));
vi.mock('@process/bridge/hubBridge', () => ({
  initHubBridge: (...args: unknown[]) => mocks.initHubBridge(...args),
}));
vi.mock('@process/bridge/projectBridge', () => ({
  initProjectBridge: (...args: unknown[]) => mocks.initProjectBridge(...args),
}));
vi.mock('@process/bridge/teamBridge', () => ({
  initTeamBridge: (...args: unknown[]) => mocks.initTeamBridge(...args),
}));
vi.mock('@process/bridge/skillsBridge', () => ({
  initSkillsBridge: (...args: unknown[]) => mocks.initSkillsBridge(...args),
}));
vi.mock('@process/providers/ipc/modelRegistryIpc', () => ({
  initModelRegistryIpc: (...args: unknown[]) => mocks.initModelRegistryIpc(...args),
}));
vi.mock('@process/team/repository/SqliteTeamRepository', () => ({
  SqliteTeamRepository: vi.fn(),
}));
vi.mock('@process/team/TeamSessionService', () => ({
  TeamSessionService: vi.fn(),
}));
vi.mock('@process/flux/FluxRoutingEvidenceAdapter', () => ({
  initWebCloudFluxRoutingEvidenceAdapter: (...args: unknown[]) => mocks.initWebCloudFluxRoutingEvidenceAdapter(...args),
}));
vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      getDataDir: () => STANDALONE_DATA_DIR,
      isPackaged: () => false,
      getAppPath: () => '/tmp/wayland-app',
    },
  }),
}));
vi.mock('@process/services/constitution/constitutionFsService', () => ({
  ConstitutionFsService: {
    createProduction: (...args: unknown[]) => {
      mocks.createConstitutionFsProduction(...args);
      return mocks.constitutionFsService;
    },
  },
  setConstitutionFsService: (...args: unknown[]) => mocks.setConstitutionFsService(...args),
}));
vi.mock('@process/services/constitution/constitutionArchiveRestoreAuthority', () => ({
  // oxlint-disable-next-line typescript-eslint/no-extraneous-class -- constructor semantics are the production contract under test.
  ConstitutionArchiveRestoreOperationAuthority: class ConstitutionArchiveRestoreOperationAuthority {
    constructor() {
      return mocks.constitutionRestoreAuthority;
    }
  },
}));
vi.mock('@process/services/constitution/constitutionArchiveRecoveryService', () => ({
  // oxlint-disable-next-line typescript-eslint/no-extraneous-class -- constructor semantics are the production contract under test.
  ConstitutionArchiveRecoveryService: class ConstitutionArchiveRecoveryService {
    constructor() {
      return mocks.constitutionArchiveRecoveryService;
    }
  },
  ConstitutionArchiveRecoveryServiceError: class ConstitutionArchiveRecoveryServiceError extends Error {},
  setConstitutionArchiveRecoveryService: (...args: unknown[]) => mocks.setConstitutionArchiveRecoveryService(...args),
}));
vi.mock('@process/services/constitution/constitutionClassicRecoveryService', () => ({
  setConstitutionClassicRecoveryServiceReady: (...args: unknown[]) =>
    mocks.setConstitutionClassicRecoveryServiceReady(...args),
}));
vi.mock('@process/secrets/safeStorage', () => ({
  encryptString: vi.fn(),
  decryptString: vi.fn(),
}));
vi.mock('@process/bridge/webuiDirectAuth', () => ({
  verifyCurrentPassword: vi.fn(async () => true),
}));

describe('initBridgeStandalone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers the hub bridge and initializes ACP detection', async () => {
    const mod = await import('../../../../src/process/utils/initBridgeStandalone');

    await mod.initBridgeStandalone();

    expect(mocks.initHubBridge).toHaveBeenCalledTimes(1);
    expect(mocks.initWebCloudFluxRoutingEvidenceAdapter).toHaveBeenCalledTimes(1);
    expect(mocks.createConstitutionFsProduction).toHaveBeenCalledWith(expect.stringMatching(/resources$/), {
      revisionAuthorityPath: path.join(STANDALONE_DATA_DIR, 'constitution', 'revision-authority.enc'),
    });
    expect(mocks.setConstitutionFsService).toHaveBeenCalledWith(mocks.constitutionFsService);
    expect(mocks.setConstitutionArchiveRecoveryService).toHaveBeenCalledWith(mocks.constitutionArchiveRecoveryService);
    expect(mocks.setConstitutionClassicRecoveryServiceReady).toHaveBeenCalledTimes(1);
    expect(mocks.initModelRegistryIpc).toHaveBeenCalledTimes(1);
    expect(mocks.initializeRegistry).toHaveBeenCalledTimes(1);
  });
});
