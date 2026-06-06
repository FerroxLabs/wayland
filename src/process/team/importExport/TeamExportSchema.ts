/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4 (T4.2) - Zod schema for the v1 team export payload.
 *
 * Strict mode (`z.object().strict()`) rejects any unknown top-level field at
 * parse time. This is the second line of defense against payloads designed to
 * smuggle extra capabilities or metadata past the import pipeline (the first
 * line is the byte-size + depth + prototype-pollution pre-checks in
 * `safeParse.ts`).
 *
 * Skill IDs are constrained to `^[a-z0-9-]+$` so `..`, `/`, and uppercase
 * variants cannot reference paths outside the bundle's specialist directory.
 *
 * Capability defaults are all `false` per D7 #4 - the import pipeline starts
 * sandboxed and only flips fields true after the user accepts the W4b
 * capability-review dialog.
 */

import { z } from 'zod';

const SKILL_ID_REGEX = /^[a-z0-9-]+$/;

const CapabilitiesSchema = z
  .object({
    canReadFiles: z.boolean().default(false),
    canWriteFiles: z.boolean().default(false),
    canSpawnAgents: z.boolean().default(false),
    /**
     * W4 audit HIGH-1 (2026-05-19): NOT user-toggleable in v1. Schema retains
     * the field for forward-compat parsing, but `CapabilityReviewModal` does
     * not render a grant row and `acceptTeamImport` forces it to
     * `by_user: false` regardless of incoming value. Runtime enforcement is
     * v2 work (agent-process network boundary).
     */
    canNetworkRequest: z.boolean().default(false),
    canCrossTeamMessage: z.boolean().default(false),
  })
  .strict();

const LeaderSchema = z
  .object({
    id: z.string().regex(SKILL_ID_REGEX),
    recommendBackend: z.string().optional(),
  })
  .strict();

const TeammateSchema = z
  .object({
    id: z.string().regex(SKILL_ID_REGEX),
    name: z.string().max(100),
    prompt: z.string().max(8192),
    recommendBackend: z.string().optional(),
  })
  .strict();

const RitualSchema = z
  .object({
    name: z.string(),
    cadence: z.string(),
  })
  .strict();

export const TeamExportSchema = z
  .object({
    version: z.literal('v1'),
    id: z.string(),
    name: z.string().max(100),
    leader: LeaderSchema,
    teammates: z.array(TeammateSchema).max(20),
    rituals: z.array(RitualSchema).max(10).optional(),
    capabilities: CapabilitiesSchema,
  })
  .strict();

export type TeamExport = z.infer<typeof TeamExportSchema>;
export type TeamExportCapabilities = z.infer<typeof CapabilitiesSchema>;

export const TEAM_EXPORT_SKILL_ID_REGEX = SKILL_ID_REGEX;
