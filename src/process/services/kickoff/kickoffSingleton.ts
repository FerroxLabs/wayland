/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { cronService } from '@process/services/cron/cronServiceSingleton';
import { SqliteConversationRepository } from '@process/services/database/SqliteConversationRepository';
import { SqliteTeamRepository } from '@process/team/repository/SqliteTeamRepository';
import { SignalCollector } from './SignalCollector';
import { SuggestionEngine } from './SuggestionEngine';

/**
 * v0.4.7.1 (C-M-1) - lazy getter. The previous module-load instantiation
 * coupled `kickoffBridge` boot to repo constructor readiness, which
 * meant any failure inside `SqliteConversationRepository`/`SqliteTeamRepository`
 * during module evaluation crashed the bridge surface as a side effect.
 * Now we defer construction to first call via `getKickoffEngine()` inside
 * the bridge provider closure.
 */
let cached: SuggestionEngine | undefined;

export function getKickoffEngine(): SuggestionEngine {
  if (cached) return cached;
  const conversationRepo = new SqliteConversationRepository();
  const teamRepo = new SqliteTeamRepository();
  const signalCollector = new SignalCollector(conversationRepo, cronService, teamRepo);
  cached = new SuggestionEngine(signalCollector);
  return cached;
}

/** Test-only: drop the cached engine so the next call constructs fresh. */
export function __resetKickoffEngineForTests(): void {
  cached = undefined;
}
