import type {
  ConstitutionAuthorityEnvelope,
  ConstitutionMutationResult,
  ConstitutionOverlayReadResult,
  ConstitutionReadResult,
  ConstitutionSpecialistSummary,
} from './constitution';
import type {
  ConstitutionArchiveInventoryResult,
  ConstitutionArchiveRestoreRequest,
  ConstitutionArchiveRestoreResult,
  ConstitutionClassicRecoveryDecisionRequest,
  ConstitutionClassicRecoveryMetadataResult,
  ConstitutionClassicRecoveryMutationResult,
  ConstitutionClassicRecoveryResumeRequest,
} from './constitutionRecovery';

// WebUI status interface
export interface WebUIStatus {
  running: boolean;
  port: number;
  allowRemote: boolean;
  localUrl: string;
  networkUrl?: string;
  lanIP?: string;
  adminUsername: string;
  initialPassword?: string;
}

// WebUI reset password result
export interface WebUIResetPasswordResult {
  success: boolean;
  newPassword?: string;
  msg?: string;
}

// WebUI get status result
export interface WebUIGetStatusResult {
  success: boolean;
  data?: WebUIStatus;
  msg?: string;
}

// WebUI change password result
export interface WebUIChangePasswordResult {
  success: boolean;
  msg?: string;
}

export interface WebUIChangeUsernameResult {
  success: boolean;
  data?: { username: string };
  msg?: string;
}

// WebUI generate QR token result
export interface WebUIGenerateQRTokenResult {
  success: boolean;
  data?: {
    token: string;
    expiresAt: number;
    qrUrl: string;
  };
  msg?: string;
}

export interface ElectronBridgeAPI {
  emit: (name: string, data: unknown) => Promise<unknown> | void;
  on: (callback: (event: { value: string }) => void) => void;
  // Get absolute path for dragged file/directory
  getPathForFile?: (file: File) => string;
  // Direct IPC calls (bypass bridge library)
  webuiResetPassword?: () => Promise<WebUIResetPasswordResult>;
  webuiGetStatus?: () => Promise<WebUIGetStatusResult>;
  // Change password (requires current password + main-process confirmation)
  webuiChangePassword?: (newPassword: string, currentPassword: string) => Promise<WebUIChangePasswordResult>;
  // Change username requires current password + main-process confirmation
  webuiChangeUsername?: (newUsername: string, currentPassword: string) => Promise<WebUIChangeUsernameResult>;
  // Generate QR token
  webuiGenerateQRToken?: () => Promise<WebUIGenerateQRTokenResult>;
  // WeChat QR-code login
  weixinLoginStart?: () => Promise<{ accountId: string; botToken: string }>;
  weixinLoginOnQR?: (callback: (data: { qrcodeUrl: string }) => void) => () => void;
  weixinLoginOnScanned?: (callback: () => void) => () => void;
  weixinLoginOnDone?: (callback: (data: { accountId: string }) => void) => () => void;
  // Feedback log collection
  collectFeedbackLogs?: () => Promise<{ filename: string; data: number[] } | null>;
  // Wayland Constitution: agent behavioral spec at ~/.wayland/CONSTITUTION.md
  readConstitution?: () => Promise<ConstitutionAuthorityEnvelope<ConstitutionReadResult>>;
  writeConstitution?: (
    content: string,
    expectedRevision: string,
    requestId: string
  ) => Promise<ConstitutionAuthorityEnvelope<ConstitutionMutationResult>>;
  resetConstitution?: (
    expectedRevision: string,
    requestId: string
  ) => Promise<ConstitutionAuthorityEnvelope<ConstitutionMutationResult>>;
  readConstitutionWithOverlay?: (
    assistantId?: string
  ) => Promise<ConstitutionAuthorityEnvelope<ConstitutionOverlayReadResult>>;
  // Per-specialist Constitution overlays at ~/.wayland/specialists/<id>.md
  listConstitutionSpecialists?: () => Promise<ConstitutionAuthorityEnvelope<ConstitutionSpecialistSummary[]>>;
  readConstitutionSpecialist?: (id: string) => Promise<ConstitutionAuthorityEnvelope<ConstitutionReadResult>>;
  writeConstitutionSpecialist?: (
    id: string,
    content: string,
    expectedRevision: string,
    requestId: string
  ) => Promise<ConstitutionAuthorityEnvelope<ConstitutionMutationResult>>;
  deleteConstitutionSpecialist?: (
    id: string,
    expectedRevision: string,
    requestId: string
  ) => Promise<ConstitutionAuthorityEnvelope<ConstitutionMutationResult>>;
  listConstitutionArchives?: () => Promise<ConstitutionArchiveInventoryResult>;
  restoreConstitutionArchive?: (
    request: ConstitutionArchiveRestoreRequest
  ) => Promise<ConstitutionArchiveRestoreResult>;
  getConstitutionClassicRecovery?: () => Promise<ConstitutionClassicRecoveryMetadataResult>;
  decideConstitutionClassicRecovery?: (
    request: ConstitutionClassicRecoveryDecisionRequest
  ) => Promise<ConstitutionClassicRecoveryMutationResult>;
  resumeConstitutionClassicRecovery?: (
    request: ConstitutionClassicRecoveryResumeRequest
  ) => Promise<ConstitutionClassicRecoveryMutationResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronBridgeAPI;
  }
}
