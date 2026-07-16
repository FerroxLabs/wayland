/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type ConstitutionArchiveTargetKind = 'constitution' | 'specialist';

/** Metadata-only recovery inventory. Archived prose never crosses this API. */
export interface ConstitutionArchiveSummary {
  archiveId: string;
  archivedAt: number;
  targetKind: ConstitutionArchiveTargetKind;
  specialistId?: string;
  sourceName: string;
  bytes: number;
}
