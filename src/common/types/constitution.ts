/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type ConstitutionArchiveTargetKind = 'constitution' | 'specialist';

export type ConstitutionReadResult =
  | { state: 'absent'; revision: string }
  | { state: 'present'; content: string; revision: string };

export type ConstitutionMutationResult = {
  ok: true;
  revision: string;
  receiptId: string;
  requestId: string;
  requestFingerprint: `sha256:${string}`;
};

/** Every Constitution IPC call declares whether a native authority exists. */
export type ConstitutionAuthorityEnvelope<T> =
  | { availability: 'available'; value: T }
  | {
      availability: 'unavailable';
      code: 'CONSTITUTION_FS_UNSAFE_PLATFORM';
      reason: string;
    }
  | {
      availability: 'failed';
      code: 'CONSTITUTION_FS_CONFLICT' | 'CONSTITUTION_FS_AUTHORITY_FAILURE';
      reason: string;
    };

export type ConstitutionSpecialistSummary = {
  id: string;
  bytes: number;
  revision: string;
};

export type ConstitutionOverlayReadResult = {
  constitution: ConstitutionReadResult;
  overlay: ConstitutionReadResult | null;
};

/** Metadata-only recovery inventory. Archived prose never crosses this API. */
export interface ConstitutionArchiveSummary {
  archiveId: string;
  archivedAt: number;
  targetKind: ConstitutionArchiveTargetKind;
  specialistId?: string;
  sourceName: string;
  bytes: number;
}
