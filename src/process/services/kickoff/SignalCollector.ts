/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IConversationRepository } from '@process/services/database/IConversationRepository';
import type { CronService } from '@process/services/cron/CronService';
import type { ITeamCrudRepository } from '@process/team/repository/ITeamRepository';
import { ExtensionRegistry } from '@process/extensions/ExtensionRegistry';
import { getInstallUuid } from './installUuid';
import { timeBucketFor } from './seededShuffle';
import { RITUAL_RECENT_WINDOW_MS, type KickoffSignals } from './types';

/**
 * Pure main-process signal reader for the Kickoff SuggestionEngine.
 *
 * Direct fix from cross-audit dealbreaker #5 (architecture): the engine
 * MUST NOT call any renderer hook. SignalCollector reads conversation
 * repo, cron service, team repo, and ConfigStorage directly and returns
 * a typed snapshot for the engine to walk.
 *
 * Errors are swallowed per-source and substituted with safe defaults so a
 * single failure (e.g. DB busy) degrades the engine to "no Standing
 * signal" rather than blocking the suggest IPC entirely.
 */
export class SignalCollector {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly cronService: CronService,
    private readonly teamRepo: ITeamCrudRepository,
    private readonly userIdProvider: () => string = () => 'default'
  ) {}

  async collect(assistantId: string, now: number = Date.now()): Promise<KickoffSignals> {
    const installUuid = await getInstallUuid();
    const timeBucket = timeBucketFor(now);

    const [recentConvs, ritualFired] = await Promise.all([
      this.collectRecentConversations(assistantId).catch(
        (): KickoffSignals['assistantRecentConversations'] => []
      ),
      this.detectRecentRitualOutput(assistantId, now).catch((): boolean => false),
    ]);

    return {
      now,
      timeBucket,
      installUuid,
      assistantRecentConversations: recentConvs,
      hasStandingRitualFiredRecently: ritualFired,
    };
  }

  private async collectRecentConversations(assistantId: string): Promise<KickoffSignals['assistantRecentConversations']> {
    // v0.4.7.1 (ENGINE-3) - repo-level filter on `presetAssistantId` so the
    // 5-conv slice that follows isn't silently truncated by power users with
    // 50+ recent chats across all assistants. Try both prefix forms because
    // conversations historically store EITHER `helm` (legacy) OR
    // `builtin-helm` / `ext-helm` depending on which surface created them.
    const unprefixed = stripIdPrefix(assistantId);
    const candidateIds = uniqueAssistantIdVariants(assistantId, unprefixed);

    // Pull a small per-id page (limit 20) - covers power users without
    // bringing back the full conversation table. We dedupe by conversation
    // id across variants below in case the same conv accidentally matches.
    const seen = new Set<string>();
    const matches: Array<{
      id: string;
      modifyTime: number;
      name?: string;
    }> = [];
    for (const id of candidateIds) {
      try {
        const page = await this.conversationRepo.getConversationsByAssistant(id, 20);
        for (const conv of page) {
          if (seen.has(conv.id)) continue;
          seen.add(conv.id);
          matches.push({ id: conv.id, modifyTime: conv.modifyTime, name: conv.name });
        }
      } catch (err) {
        console.warn(`[Kickoff] getConversationsByAssistant failed for id "${id}"`, err);
      }
    }
    matches.sort((a, b) => b.modifyTime - a.modifyTime);

    const out: KickoffSignals['assistantRecentConversations'] = [];
    for (const conv of matches.slice(0, 5)) {
      let messageCount = 0;
      let durationMs = 0;
      try {
        const messagesPage = await this.conversationRepo.getMessages(conv.id, 0, 100);
        messageCount = messagesPage.data.length;
        if (messageCount >= 2) {
          const first = messagesPage.data[0];
          const last = messagesPage.data[messageCount - 1];
          const firstMs = numericTimestamp(first);
          const lastMs = numericTimestamp(last);
          if (firstMs !== null && lastMs !== null) {
            durationMs = Math.abs(lastMs - firstMs);
          }
        }
      } catch (err) {
        // v0.4.7.1 (A-M-6) - keep degrading gracefully (failed messages = no
        // quality-gate pass for this conv) but emit a warn so silent
        // empty-quality cascades are diagnosable.
        console.warn(`[Kickoff] failed to load messages for conv ${conv.id}`, err);
      }
      out.push({
        id: conv.id,
        modifyTime: conv.modifyTime,
        messageCount,
        durationMs,
        subject: conv.name ?? '',
        isAutoTitled: isAutoTitled(conv.name ?? ''),
      });
    }
    return out;
  }

  /**
   * "Recent ritual output" = a cron job created by a Standing-Company
   * ritual scheduler for a team whose sourceLauncherId matches this
   * assistant, where the job's last execution succeeded within the window.
   *
   * v0.4.7.1 (ENGINE-2) - filters on the explicit
   * `agentConfig.configOptions.kind === 'ritual'` tag set by
   * `CronRitualScheduler.installRituals`, NOT on `createdBy === 'agent'`.
   * MessageMiddleware also tags user-NL-scheduled crons with
   * `createdBy: 'agent'`, so the prior filter false-positived Level 1 of
   * the kickoff cascade whenever the user had ever asked the leader to
   * "schedule X."
   */
  private async detectRecentRitualOutput(assistantId: string, now: number): Promise<boolean> {
    const userId = this.userIdProvider();
    const teams = await this.teamRepo.findAll(userId);
    const unprefixed = stripIdPrefix(assistantId);
    // Standing-company gate: either user-promoted via TeamSessionService or
    // bundle-marked Standing at creation time. Both install ritual crons via
    // CronRitualScheduler so either is a valid source of "ritual output."
    const standingTeams = teams.filter(
      (t) => t.promotedToStanding === true && (t.sourceLauncherId === assistantId || t.sourceLauncherId === unprefixed)
    );
    if (standingTeams.length === 0) return false;

    for (const team of standingTeams) {
      const leader = team.agents.find((a) => a.role === 'leader');
      if (!leader?.conversationId) continue;
      const jobs = await this.cronService.listJobsByConversation(leader.conversationId);
      const ritualJobs = jobs.filter(
        (j) =>
          j.metadata.createdBy === 'agent' &&
          j.metadata.agentConfig?.configOptions?.kind === 'ritual'
      );
      for (const job of ritualJobs) {
        const lastRun = job.state.lastRunAtMs;
        /**
         * v0.4.7.1 (A-L-1) - the `<=` is intentional: a cron that fired
         * exactly RITUAL_RECENT_WINDOW_MS ago (4h) IS considered "fresh"
         * for Level 1. Anything older than the window is stale. Choosing
         * inclusive avoids a flapping boundary when the cron hour aligns
         * with the user's wake hour.
         */
        if (lastRun !== undefined && job.state.lastStatus === 'ok' && now - lastRun <= RITUAL_RECENT_WINDOW_MS) {
          return true;
        }
      }
    }
    return false;
  }
}

/**
 * Look up the registry record for `assistantId`. Used by SuggestionEngine
 * to pull the per-assistant kickoff array. Co-located here because both
 * the engine and the bridge need it and the registry's public API only
 * exposes `getAssistants()` (raw record array).
 *
 * v0.4.7.1 (A-M-5) - collect ALL matches first. If more than one assistant
 * matches the id (after prefix stripping on both sides), return null and
 * log a warning instead of silently picking the first hit, which masked a
 * latent dup-id condition in the vendored overlay.
 */
export function findAssistantInRegistry(assistantId: string): Record<string, unknown> | null {
  try {
    const registry = ExtensionRegistry.getInstance();
    const all = registry.getAssistants();
    const unprefixed = stripIdPrefix(assistantId);
    const matches: Record<string, unknown>[] = [];
    for (const a of all) {
      const id = (a as { id?: unknown }).id;
      if (typeof id !== 'string') continue;
      if (id === assistantId || id === unprefixed || stripIdPrefix(id) === unprefixed) {
        matches.push(a);
      }
    }
    if (matches.length === 0) return null;
    if (matches.length > 1) {
      console.warn(
        `[Kickoff] findAssistantInRegistry: ambiguous match for "${assistantId}" (${matches.length} hits); returning null`
      );
      return null;
    }
    return matches[0]!;
  } catch {
    return null;
  }
}

/**
 * v0.4.7.1 (ENGINE-1) - strips either `ext-` or `builtin-` from an
 * assistant id. The renderer uses `usePresetAssistantInfo` which stamps
 * `builtin-<id>` onto presetAssistantId for built-in assistants, while
 * extension contributions are stamped `ext-<id>`. The previous
 * `stripExtPrefix` only handled the `ext-` form, so Level 2 of the
 * kickoff cascade silently dropped EVERY built-in assistant's continuation
 * candidates - the highest-value cascade tier was dead in production.
 */
export function stripIdPrefix(id: string): string {
  if (id.startsWith('ext-')) return id.slice(4);
  if (id.startsWith('builtin-')) return id.slice(8);
  return id;
}

/** Backwards-compat alias for callers that historically imported `stripExtPrefix`. */
export const stripExtPrefix = stripIdPrefix;

function uniqueAssistantIdVariants(...candidates: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    if (!c) continue;
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}

const AUTO_TITLE_PATTERNS = [/^new conversation/i, /^untitled/i, /^chat \d+/i, /^new chat/i];
function isAutoTitled(subject: string): boolean {
  const trimmed = subject.trim();
  if (!trimmed) return true;
  return AUTO_TITLE_PATTERNS.some((re) => re.test(trimmed));
}

/**
 * v0.4.7.1 (A-L-3) - string branch now requires an ISO-8601-ish leading
 * pattern (`YYYY-MM-DD...`) before handing off to Date.parse. The prior
 * implementation accepted any string Date.parse could chew on, including
 * regional shortforms that vary by host locale (e.g. "5/23/26") and
 * non-deterministic outputs of `new Date().toString()`.
 */
const ISO_8601_LIKE = /^\d{4}-\d{2}-\d{2}/;

function numericTimestamp(message: { createdAt?: unknown; timestamp?: unknown }): number | null {
  const candidates: unknown[] = [message.createdAt, message.timestamp];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
    if (typeof c === 'string' && ISO_8601_LIKE.test(c)) {
      const parsed = Date.parse(c);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}
