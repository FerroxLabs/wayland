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
