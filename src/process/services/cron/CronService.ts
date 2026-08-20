/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { ipcBridge } from '@/common';
import type { TMessage } from '@/common/chat/chatLib';
import type { TChatConversation } from '@/common/config/storage';
import { uuid } from '@/common/utils';
import { addMessage } from '@process/utils/message';
import { getPlatformServices } from '@/common/platform';
import { Cron } from 'croner';
import { isNewConversationFootgun } from '@/common/cron/cronFrequency';
import i18n, { i18nReady } from '@process/services/i18n';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';
import { ProcessConfig } from '@process/utils/initStorage';
import type { CronJob, CronSchedule } from './CronStore';
import { durableWorkspaceMetadataForJob, isBundledRoutineJob } from './durableTaskWorkspace';
import { CronWorkspaceError } from '@process/bridge/cronWorkspaceError';
import type { ICronRepository } from './ICronRepository';
import type { ICronEventEmitter } from './ICronEventEmitter';
import type { ICronJobExecutor } from './ICronJobExecutor';
import {
  archiveCronJob,
  listArchivedCronJobs,
  markCronArchiveAborted,
  markCronArchiveRestored,
  preserveRemovedCronSkill,
  restoreCronSkillFromArchive,
  rollbackRestoredCronSkill,
  type ArchivedCronJob,
} from './cronArchive';

/**
 * Parameters for creating a new cron job
 */
export type CreateCronJobParams = {
  name: string;
  description?: string;
  schedule: CronSchedule;
  /** New UI system uses `prompt`; old skill system uses `message` */
  prompt?: string;
  message?: string;
  conversationId: string;
  conversationTitle?: string;
  agentType: import('@/common/types/acpTypes').AgentBackend;
  createdBy: 'user' | 'agent';
  executionMode?: 'existing' | 'new_conversation';
  agentConfig?: import('./CronStore').CronJob['metadata']['agentConfig'];
  /**
   * Internal escape hatch for system-managed crons that legitimately need
   * multiple jobs on a single conversation (e.g. Standing-Company rituals
   * fanning into the leader's team conversation). Never set from renderer-
   * facing IPC paths - those flow through the normal `cron.addJob` handler
   * where this field is not surfaced.
   */
  bypassUniqueGuard?: boolean;
  /**
   * #163: explicit opt-in to create a minute-cadence job that spawns a new
   * conversation every run (normally rejected as a footgun). Set only after the
   * user is warned and confirms in the renderer.
   */
  allowHighFrequency?: boolean;
};

/**
 * CronService - Core scheduling service for Wayland
 *
 * Manages scheduled tasks that send messages to conversations at specified times.
 * Handles conflicts when conversation is busy.
 */
export class CronService {
  private timers: Map<string, Cron | NodeJS.Timeout> = new Map();
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();
  private retryCounts: Map<string, number> = new Map();
  /** #163: job ids with a run currently executing, for the overlap guard. */
  private readonly runningJobs = new Set<string>();
  /** Serialize archive/restore mutations so a schedule cannot be removed and restored concurrently. */
  private cronMutationTail: Promise<void> = Promise.resolve();
  private initialized = false;
  private powerSaveBlockerId: number | null = null;

  constructor(
    private readonly repo: ICronRepository,
    private readonly emitter: ICronEventEmitter,
    private readonly executor: ICronJobExecutor,
    private readonly conversationRepo: IConversationRepository
  ) {}

  /**
   * Initialize the cron service
   * Load all enabled jobs from database and start their timers
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.cleanupOrphanJobs();
      await this.backfillCronJobIdOnConversations();

      const jobs = await this.repo.listEnabled();

      // Detect jobs whose nextRunAtMs is in the past - i.e. the app was
      // closed across one or more scheduled fires. Notify-only: insert a
      // one-time "missed" tip into each affected conversation and roll
      // nextRunAtMs forward. We do this BEFORE startTimer because
      // startTimer overwrites nextRunAtMs to the next future fire,
      // erasing the cold-start signal.
      await this.detectAndAnnounceMissedJobs(jobs);

      for (const job of jobs) {
        await this.startTimer(job);
      }

      this.initialized = true;
      await this.updatePowerBlocker();
    } catch (error) {
      console.error('[CronService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Remove cron jobs whose associated conversation no longer exists.
   * Called once during init to clean up stale jobs left by abnormal deletion paths.
   */
  private async cleanupOrphanJobs(): Promise<void> {
    try {
      const allJobs = await this.repo.listAll();
      for (const job of allJobs) {
        // new_conversation mode jobs are not bound to a single conversation - skip orphan check.
        // Also skip when conversationId is empty (legacy jobs created before execution_mode existed).
        if (job.target.executionMode === 'new_conversation' || !job.metadata.conversationId) {
          continue;
        }
        const conversation = await this.conversationRepo.getConversation(job.metadata.conversationId);
        if (!conversation) {
          // Double-check: if the job has child conversations (via cronJobId), it's not truly orphaned.
          // This can happen when a job's original conversationId is stale but it has produced executions.
          const childConversations = await this.conversationRepo.getConversationsByCronJob(job.id);
          if (childConversations.length > 0) {
            console.log(
              `[CronService] Skipping orphan cleanup for "${job.name}" (${job.id}): has ${childConversations.length} child conversations`
            );
            continue;
          }
          console.log(
            `[CronService] Archiving orphan job "${job.name}" (${job.id}): conversation ${job.metadata.conversationId} not found`
          );
          await this.archiveAndRemoveJob(job, { detachConversations: false, restartTimerOnFailure: false });
        }
      }
    } catch (error) {
      console.warn('[CronService] Failed to cleanup orphan jobs:', error);
    }
  }

  private async withCronMutation<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.cronMutationTail;
    let release: () => void = () => undefined;
    this.cronMutationTail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  /**
   * Backfill cronJobId into conversation.extra and agentConfig into job.metadata
   * for existing jobs that predate these fields.
   */
  private async backfillCronJobIdOnConversations(): Promise<void> {
    try {
      const allJobs = await this.repo.listAll();
      for (const job of allJobs) {
        if (job.target.executionMode === 'new_conversation' || !job.metadata.conversationId) {
          continue;
        }
        const conv = await this.conversationRepo.getConversation(job.metadata.conversationId);
        if (!conv) continue;

        // Backfill cronJobId on conversation extra
        const extra = (conv.extra ?? {}) as Record<string, unknown>;
        if (extra.cronJobId !== job.id) {
          extra.cronJobId = job.id;
          await this.conversationRepo.updateConversation(job.metadata.conversationId, {
            extra: extra as TChatConversation['extra'],
          });
        }

        // Backfill agentConfig and conversationTitle from conversation
        const needsAgentConfig = !job.metadata.agentConfig;
        const needsTitle = !job.metadata.conversationTitle && conv.name;
        if (needsAgentConfig || needsTitle) {
          const updates: Partial<CronJob> = {};
          const newMetadata = { ...job.metadata };
          if (needsAgentConfig) {
            const agentConfig = this.buildAgentConfigFromConversation(conv, job);
            if (agentConfig) newMetadata.agentConfig = agentConfig;
          }
          if (needsTitle) {
            newMetadata.conversationTitle = conv.name;
          }
          updates.metadata = newMetadata;
          await this.repo.update(job.id, updates);
        }
      }
    } catch (error) {
      console.warn('[CronService] Failed to backfill cron job data:', error);
    }
  }

  /**
   * Build ICronAgentConfig from conversation extra fields.
   */
  private buildAgentConfigFromConversation(
    conv: TChatConversation,
    job: CronJob
  ): CronJob['metadata']['agentConfig'] | null {
    const extra = (conv.extra ?? {}) as Record<string, unknown>;
    const backend = (extra.backend as string) || job.metadata.agentType;
    if (!backend) return null;

    return {
      backend: backend as import('@/common/types/acpTypes').AcpBackendAll,
      name: (extra.agentName as string) || job.name,
      cliPath: extra.cliPath as string | undefined,
      isPreset: !!extra.presetAssistantId,
      customAgentId: (extra.presetAssistantId as string) || (extra.customAgentId as string) || undefined,
    };
  }

  /**
   * Add a new cron job
   * @throws Error if conversation already has a cron job (one job per conversation limit)
   */
  async addJob(params: CreateCronJobParams): Promise<CronJob> {
    // Check if conversation already has a cron job (one job per conversation limit)
    // Skip for new_conversation mode since each execution creates a new conversation
    if (params.executionMode !== 'new_conversation' && params.conversationId && !params.bypassUniqueGuard) {
      const existingJobs = await this.repo.listByConversation(params.conversationId);
      if (existingJobs.length > 0) {
        const existingJob = existingJobs[0];
        throw new Error(
          i18n.t('cron.error.alreadyExists', {
            name: existingJob.name,
            id: existingJob.id,
          })
        );
      }
    }

    // #163: reject a minute-cadence job that creates a new conversation each run
    // (floods history + spawns overlapping processes) unless the user explicitly
    // overrode the warning. Reuse ('existing') mode is the safe path.
    if (
      !params.allowHighFrequency &&
      isNewConversationFootgun(
        params.schedule.kind,
        params.schedule.kind === 'cron' ? params.schedule.expr : undefined,
        params.executionMode
      )
    ) {
      throw new Error(i18n.t('cron.error.highFreqNewConversation'));
    }

    const now = Date.now();
    const jobId = `cron_${uuid()}`;

    const job: CronJob = {
      id: jobId,
      name: params.name,
      description: params.description?.trim() || undefined,
      enabled: true,
      schedule: params.schedule,
      target: {
        payload: { kind: 'message', text: params.prompt ?? params.message ?? '' },
        executionMode: params.executionMode ?? 'existing',
      },
      metadata: {
        conversationId: params.conversationId,
        conversationTitle: params.conversationTitle,
        agentType: params.agentType,
        createdBy: params.createdBy,
        createdAt: now,
        updatedAt: now,
        agentConfig: params.agentConfig,
      },
      state: {
        runCount: 0,
        retryCount: 0,
        maxRetries: 3,
      },
    };

    // P2-2: a `new_conversation` job with no workspace mints a throwaway temp dir
    // on every fire, so it can never see its own history. Give it a durable task
    // root before it is ever armed.
    //
    // Bundled routines are exempt HERE and only here: the seeder creates them
    // through this method (which always creates enabled) and disables them a
    // moment later, so allocating now would seed a folder for each of a dozen
    // routines nobody enabled. They allocate on the enable transition instead.
    if (job.enabled && !isBundledRoutineJob(job)) {
      const metadata = await this.allocateDurableWorkspaceMetadata(job);
      if (metadata) job.metadata = metadata;
    }

    // Calculate next run time
    this.updateNextRunTime(job);

    // Save to database
    await this.repo.insert(job);

    // Tag the conversation with cronJobId so it appears under the scheduled tasks tab
    // and update modifyTime so it appears at the top of the list (skip for new_conversation mode)
    if (params.executionMode !== 'new_conversation' && params.conversationId) {
      try {
        const conv = await this.conversationRepo.getConversation(params.conversationId);
        const existingExtra = (conv?.extra ?? {}) as Record<string, unknown>;
        await this.conversationRepo.updateConversation(params.conversationId, {
          modifyTime: now,
          extra: { ...existingExtra, cronJobId: jobId } as TChatConversation['extra'],
        });
      } catch (err) {
        console.warn('[CronService] Failed to update conversation with cronJobId:', err);
      }
    }

    // Start timer
    await this.startTimer(job);
    await this.updatePowerBlocker();

    // Emit event to notify frontend (especially when created by agent)
    this.emitter.emitJobCreated(job);

    return job;
  }

  /**
   * Update an existing cron job
   */
  async updateJob(jobId: string, updates: Partial<CronJob>, allowHighFrequency = false): Promise<CronJob> {
    const existing = await this.repo.getById(jobId);
    if (!existing) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // #163: block an EDIT that turns a job into the every-minute + new_conversation
    // footgun (e.g. an agent CRON_UPDATE that raises the frequency), same guard as
    // addJob. Evaluated against the effective (merged) schedule + execution mode.
    const effectiveSchedule = updates.schedule ?? existing.schedule;
    const effectiveMode = updates.target?.executionMode ?? existing.target.executionMode;
    if (
      !allowHighFrequency &&
      isNewConversationFootgun(
        effectiveSchedule.kind,
        effectiveSchedule.kind === 'cron' ? effectiveSchedule.expr : undefined,
        effectiveMode
      )
    ) {
      throw new Error(i18n.t('cron.error.highFreqNewConversation'));
    }

    // P2-2: first enable is when a recurring task earns a durable workspace.
    // Allocated BEFORE the write and merged INTO it, so the workspace and the
    // enable land together - two writes would let a crash arm a job that still
    // has no workspace, which is the bug this fixes. An allocation failure
    // propagates and the job stays disabled.
    let effectiveUpdates = updates;
    if (updates.enabled === true && !existing.enabled) {
      const merged = { ...existing, ...updates, metadata: updates.metadata ?? existing.metadata } as CronJob;
      const metadata = await this.allocateDurableWorkspaceMetadata(merged);
      if (metadata) effectiveUpdates = { ...updates, metadata };
    }

    // Stop existing timer
    this.stopTimer(jobId);

    // Update in database
    await this.repo.update(jobId, effectiveUpdates);

    // Get updated job
    const updated = (await this.repo.getById(jobId))!;

    // Recalculate next run time if schedule changed or job is being enabled
    if (updates.schedule || (updates.enabled === true && !existing.enabled)) {
      this.updateNextRunTime(updated);
      await this.repo.update(jobId, { state: updated.state });
    }

    // Restart timer if enabled
    if (updated.enabled) {
      await this.startTimer(updated);
    }

    await this.updatePowerBlocker();

    // Emit event to notify frontend
    this.emitter.emitJobUpdated(updated);

    return updated;
  }

  /**
   * H1 - allocation failure has to be CLASSIFIED, because it crosses the bridge.
   *
   * `durableWorkspaceMetadataForJob` throws on purpose: an armed routine with no
   * durable workspace is the bug P2-2 exists to fix, so the enable is aborted
   * rather than completed dishonestly. But on macOS the task root lives under a
   * TCC-protected Documents path, so a missing grant makes this the ORDINARY
   * outcome of flipping the toggle - and a bare throw crossing `cron.update-job`
   * is a promise the renderer never sees settle. The toggle spun forever with
   * the job silently left off.
   *
   * The refusal is unchanged; only its shape is. The underlying cause travels in
   * `{{detail}}` so the user is told what actually stopped it.
   */
  private async allocateDurableWorkspaceMetadata(job: CronJob): Promise<CronJob['metadata'] | null> {
    try {
      return await durableWorkspaceMetadataForJob(job);
    } catch (error) {
      throw new CronWorkspaceError(
        'workspace_alloc_failed',
        i18n.t('cron.error.workspaceAllocFailed', {
          name: job.name,
          detail: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  private async detachArchivedJobConversations(job: CronJob): Promise<void> {
    try {
      if (job.target.executionMode === 'new_conversation') {
        // Preserve every completed child run and its workspace. Remove the
        // live grouping key so it returns to ordinary chat history, while
        // retaining immutable provenance for future output/receipt indexing.
        const childConversations = await this.conversationRepo.getConversationsByCronJob(job.id);
        for (const conv of childConversations) {
          const existingExtra = { ...conv.extra } as Record<string, unknown>;
          delete existingExtra.cronJobId;
          existingExtra.archivedCronOrigin = {
            id: job.id,
            name: job.name,
            detachedAt: Date.now(),
          };
          await this.conversationRepo.updateConversation(conv.id, {
            extra: existingExtra as TChatConversation['extra'],
          });
          ipcBridge.conversation.listChanged.emit({
            conversationId: conv.id,
            action: 'updated',
            source: 'schedule-detached',
          });
        }
        if (childConversations.length > 0) {
          console.log(
            `[CronService] Preserved and detached ${childConversations.length} child conversations for job ${job.id}`
          );
        }
      } else if (job.metadata.conversationId) {
        // Remove cronJobId from the associated conversation's extra
        const conv = await this.conversationRepo.getConversation(job.metadata.conversationId);
        if (conv) {
          const existingExtra = (conv.extra ?? {}) as Record<string, unknown>;
          delete existingExtra.cronJobId;
          await this.conversationRepo.updateConversation(job.metadata.conversationId, {
            extra: existingExtra as TChatConversation['extra'],
          });
        }
      }
    } catch (err) {
      console.warn('[CronService] Failed to detach conversations for archived job:', err);
    }
  }

  private async archiveAndRemoveJob(
    job: CronJob,
    options: { detachConversations: boolean; restartTimerOnFailure: boolean }
  ): Promise<ArchivedCronJob> {
    this.stopTimer(job.id);
    let archived: ArchivedCronJob;
    try {
      archived = await archiveCronJob(job);
    } catch (error) {
      if (options.restartTimerOnFailure && job.enabled) await this.startTimer(job);
      throw error;
    }

    try {
      await this.repo.delete(job.id);
    } catch (error) {
      await markCronArchiveAborted(archived.archiveId).catch((archiveError) => {
        console.warn('[CronService] Failed to mark unsuccessful archive attempt:', archiveError);
      });
      if (options.restartTimerOnFailure && job.enabled) await this.startTimer(job);
      throw error;
    }

    // Move the original directory into the published archive. The verified
    // recovery copy already exists, so a move failure cannot lose user bytes;
    // it only leaves an inert duplicate under the active skills root.
    await preserveRemovedCronSkill(archived.archiveId, job.id).catch((error) => {
      console.warn('[CronService] Failed to relocate original cron skill directory:', error);
    });

    if (options.detachConversations) await this.detachArchivedJobConversations(job);

    await this.updatePowerBlocker();
    this.emitter.emitJobRemoved(job.id);
    return archived;
  }

  /**
   * Archive a cron job. Future runs stop, while its definition, complete skill
   * directory, completed chats, reports, and workspaces remain recoverable.
   */
  async removeJob(jobId: string): Promise<ArchivedCronJob> {
    return this.withCronMutation(async () => {
      const job = await this.repo.getById(jobId);
      if (!job) throw new Error(`Job not found: ${jobId}`);
      return this.archiveAndRemoveJob(job, { detachConversations: true, restartTimerOnFailure: true });
    });
  }

  async listArchivedJobs(): Promise<ArchivedCronJob[]> {
    const archives = await listArchivedCronJobs();
    const visible: ArchivedCronJob[] = [];
    for (const archive of archives) {
      // A retained archive from a failed database mutation is not a user-visible
      // deletion while its authoritative live row still exists.
      if (!(await this.repo.getById(archive.job.id))) visible.push(archive);
    }
    return visible;
  }

  async restoreArchivedJob(archiveId: string): Promise<CronJob> {
    return this.withCronMutation(async () => {
      const archiveSummary = (await listArchivedCronJobs()).find((entry) => entry.archiveId === archiveId);
      if (!archiveSummary) throw new Error(`Archived job not found: ${archiveId}`);
      if (await this.repo.getById(archiveSummary.job.id)) {
        throw new Error(`A schedule with id ${archiveSummary.job.id} already exists`);
      }

      const restoredSkill = await restoreCronSkillFromArchive(archiveId);
      const restoredJob: CronJob = {
        ...restoredSkill.archive.job,
        enabled: false,
        metadata: {
          ...restoredSkill.archive.job.metadata,
          updatedAt: Date.now(),
        },
        state: {
          ...restoredSkill.archive.job.state,
          nextRunAtMs: undefined,
        },
      };

      try {
        await this.repo.insert(restoredJob);
      } catch (error) {
        if (restoredSkill.skillRestored) {
          await rollbackRestoredCronSkill(archiveId, restoredJob.id).catch((rollbackError) => {
            console.warn('[CronService] Failed to preserve failed cron skill restore:', rollbackError);
          });
        }
        throw error;
      }

      if (restoredJob.target.executionMode !== 'new_conversation' && restoredJob.metadata.conversationId) {
        try {
          const conversation = await this.conversationRepo.getConversation(restoredJob.metadata.conversationId);
          if (conversation) {
            const extra = { ...conversation.extra, cronJobId: restoredJob.id } as TChatConversation['extra'];
            await this.conversationRepo.updateConversation(restoredJob.metadata.conversationId, { extra });
          }
        } catch (error) {
          console.warn('[CronService] Restored schedule but could not reattach its source conversation:', error);
        }
      }

      await markCronArchiveRestored(archiveId).catch((error) => {
        // The live row and skill are authoritative now. Leaving the verified
        // archive in place is safe; listArchivedJobs hides it by active job id.
        console.warn('[CronService] Restored schedule but could not retire its archive record:', error);
      });
      await this.updatePowerBlocker();
      this.emitter.emitJobCreated(restoredJob);
      return restoredJob;
    });
  }

  /**
   * Trigger a job to execute immediately (blocks until complete).
   * Used by scheduled timer execution.
   */
  async triggerJob(jobId: string): Promise<void> {
    const job = await this.repo.getById(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    await this.executeJob(job);
  }

  /**
   * Run a job now: create the conversation (if needed), then execute in background.
   * Returns the conversationId immediately so the frontend can navigate to it.
   */
  async runNow(jobId: string): Promise<string> {
    const job = await this.repo.getById(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    const conversationId = await this.executor.prepareConversation(job);
    // Fire-and-forget: execute in background, pass the prepared conversationId to skip re-creation
    void this.executeJob(job, conversationId);
    return conversationId;
  }

  /**
   * List all cron jobs
   */
  async listJobs(): Promise<CronJob[]> {
    return this.repo.listAll();
  }

  /**
   * List cron jobs by conversation
   */
  async listJobsByConversation(conversationId: string): Promise<CronJob[]> {
    return this.repo.listByConversation(conversationId);
  }

  /**
   * Get a specific job
   */
  async getJob(jobId: string): Promise<CronJob | null> {
    return this.repo.getById(jobId);
  }

  /**
   * Start timer for a job
   * Supports cron expressions, fixed intervals (every), and one-time tasks (at)
   */
  private async startTimer(job: CronJob): Promise<void> {
    // Stop existing timer if any
    this.stopTimer(job.id);

    const { schedule } = job;

    switch (schedule.kind) {
      case 'cron': {
        // Skip timer creation for manual trigger (empty cron expression)
        if (!schedule.expr) {
          job.state.nextRunAtMs = undefined;
          break;
        }

        try {
          const timer = new Cron(
            schedule.expr,
            {
              timezone: schedule.tz,
              paused: false,
            },
            () => {
              void this.executeJob(job);
            }
          );
          this.timers.set(job.id, timer);

          // Sync nextRunAtMs with actual next run time and notify frontend
          const nextRun = timer.nextRun();
          job.state.nextRunAtMs = nextRun ? nextRun.getTime() : undefined;
        } catch (error) {
          console.error(`[CronService] Invalid cron expression "${schedule.expr}" for job "${job.name}":`, error);
          job.state.nextRunAtMs = undefined;
          job.state.lastStatus = 'error';
          job.state.lastError = `Invalid cron expression: ${schedule.expr}`;
          job.enabled = false;
          await this.repo.update(job.id, { enabled: false, state: job.state });
          this.emitter.emitJobUpdated(job);
          break;
        }
        await this.repo.update(job.id, { state: job.state });
        this.emitter.emitJobUpdated(job);
        break;
      }

      case 'every': {
        const timer = setInterval(() => {
          void this.executeJob(job);
        }, schedule.everyMs);
        this.timers.set(job.id, timer);

        // Sync nextRunAtMs with actual timer start time and notify frontend
        job.state.nextRunAtMs = Date.now() + schedule.everyMs;
        await this.repo.update(job.id, { state: job.state });
        this.emitter.emitJobUpdated(job);
        break;
      }

      case 'at': {
        const delay = schedule.atMs - Date.now();
        if (delay > 0) {
          const timer = setTimeout(() => {
            void this.executeJob(job);
            // One-time job, disable after execution
            void this.updateJob(job.id, { enabled: false });
          }, delay);
          this.timers.set(job.id, timer);

          // Sync nextRunAtMs and notify frontend
          job.state.nextRunAtMs = schedule.atMs;
          await this.repo.update(job.id, { state: job.state });
          this.emitter.emitJobUpdated(job);
        } else {
          // Past one-time job, mark as expired and disable
          job.state.nextRunAtMs = undefined;
          job.state.lastStatus = 'skipped';
          job.state.lastError = i18n.t('cron.error.scheduledTimePassed');
          job.enabled = false;
          await this.repo.update(job.id, { enabled: false, state: job.state });
          this.emitter.emitJobUpdated(job);
        }
        break;
      }
    }
  }

  /**
   * Shutdown the service: stop every active timer and retry timer.
   * Called from before-quit cleanup (AUDIT-05 F18) to prevent cron-triggered
   * work from outliving the app's quit sequence.
   */
  shutdown(): void {
    for (const timer of this.timers.values()) {
      if (timer instanceof Cron) {
        timer.stop();
      } else {
        clearTimeout(timer);
        clearInterval(timer);
      }
    }
    this.timers.clear();

    for (const retryTimer of this.retryTimers.values()) {
      clearTimeout(retryTimer);
    }
    this.retryTimers.clear();
    this.retryCounts.clear();
  }

  /**
   * Stop timer for a job
   * Also clears associated retry timers
   */
  private stopTimer(jobId: string): void {
    const timer = this.timers.get(jobId);
    if (timer) {
      if (timer instanceof Cron) {
        timer.stop();
      } else {
        clearTimeout(timer);
        clearInterval(timer);
      }
      this.timers.delete(jobId);
    }

    // Also clear any retry timers
    const retryTimer = this.retryTimers.get(jobId);
    if (retryTimer) {
      clearTimeout(retryTimer);
      this.retryTimers.delete(jobId);
    }

    // Clear retry count for this job
    this.retryCounts.delete(jobId);
  }

  /**
   * Execute a job - send message to conversation
   * Handles conversation busy state with retries and power management
   */
  private async executeJob(job: CronJob, preparedConversationId?: string): Promise<void> {
    // #163 overlap guard: skip this fire if the same job's previous run is still
    // executing. The conversation-busy check inside keys on conversationId,
    // which is empty for new_conversation mode (a fresh conversation each run),
    // so it cannot detect a job overlapping ITSELF — this per-job guard does.
    if (this.runningJobs.has(job.id)) {
      console.warn(`[CronService] Job ${job.id} is still running; skipping overlapping run (#163).`);
      this.updateNextRunTime(job);
      await this.repo.update(job.id, {
        state: { ...job.state, lastStatus: 'skipped', lastError: i18n.t('cron.error.overlapSkipped') },
      });
      const skippedJob = await this.repo.getById(job.id);
      if (skippedJob) {
        this.emitter.emitJobUpdated(skippedJob);
      }
      return;
    }
    this.runningJobs.add(job.id);
    try {
      await this.executeJobInner(job, preparedConversationId);
    } finally {
      this.runningJobs.delete(job.id);
    }
  }

  private async executeJobInner(job: CronJob, preparedConversationId?: string): Promise<void> {
    const conversationId = preparedConversationId ?? job.metadata.conversationId;

    // Check if conversation is busy
    const isBusy = this.executor.isConversationBusy(conversationId);
    if (isBusy) {
      const currentRetry = (this.retryCounts.get(job.id) ?? 0) + 1;
      this.retryCounts.set(job.id, currentRetry);

      if (currentRetry > (job.state.maxRetries || 3)) {
        // Max retries exceeded, skip this run
        this.retryCounts.delete(job.id);
        this.updateNextRunTime(job);
        await this.repo.update(job.id, {
          state: {
            ...job.state,
            lastStatus: 'skipped',
            lastError: i18n.t('cron.error.conversationBusy', {
              count: job.state.maxRetries || 3,
            }),
          },
        });
        const skippedJob = await this.repo.getById(job.id);
        if (skippedJob) {
          this.emitter.emitJobUpdated(skippedJob);
        }
        return;
      }

      // Schedule retry in 30 seconds
      const retryTimer = setTimeout(() => {
        this.retryTimers.delete(job.id);
        void this.executeJob(job);
      }, 30000);
      this.retryTimers.set(job.id, retryTimer);
      return;
    }

    const lastRunAtMs = Date.now();
    const currentRunCount = (job.state.runCount ?? 0) + 1;
    let lastStatus: CronJob['state']['lastStatus'];
    let lastError: string | undefined;

    try {
      // executeJob marks the conversation busy only after task acquisition succeeds.
      // The onAcquired callback registers the completion notification while the
      // conversation is already busy, preventing premature onceIdle fires.
      const newConversationId = await this.executor.executeJob(
        job,
        () => {
          this.registerCompletionNotification(job);
        },
        preparedConversationId,
        lastRunAtMs
      );

      // For "existing" mode: persist the newly created conversationId so subsequent executions reuse it
      if (newConversationId && job.target.executionMode === 'existing') {
        job.metadata.conversationId = newConversationId;
        await this.repo.update(job.id, {
          metadata: { ...job.metadata, conversationId: newConversationId },
        });
      }

      // Success
      this.retryCounts.delete(job.id);
      lastStatus = 'ok';
      lastError = undefined;

      // Update conversation modifyTime so it appears at the top of the list
      const activeConversationId = newConversationId || conversationId;
      try {
        await this.conversationRepo.updateConversation(activeConversationId, {
          modifyTime: Date.now(),
        });
      } catch (err) {
        console.warn('[CronService] Failed to update conversation modifyTime after execution:', err);
      }
    } catch (error) {
      // Error
      lastStatus = 'error';
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`[CronService] Job ${job.id} failed:`, error);
    }

    // Update next run time
    this.updateNextRunTime(job);

    // Persist state as new object and notify frontend
    await this.repo.update(job.id, {
      state: {
        ...job.state,
        lastRunAtMs,
        runCount: currentRunCount,
        lastStatus,
        lastError,
      },
    });
    const updatedJob = await this.repo.getById(job.id);
    if (updatedJob) {
      this.emitter.emitJobUpdated(updatedJob);
    }
    this.emitter.emitJobExecuted(job.id, lastStatus, lastError);
  }

  /**
   * Register a callback on executor to send notification when the agent finishes.
   * Must be called BEFORE sendMessage to avoid race conditions.
   */
  private registerCompletionNotification(job: CronJob): void {
    const { conversationId } = job.metadata;

    this.executor.onceIdle(conversationId, async () => {
      // Check if cron notification is enabled
      const cronNotificationEnabled = await ProcessConfig.get('system.cronNotificationEnabled');
      if (!cronNotificationEnabled) return;

      await i18nReady;

      const title = i18n.t('cron.notification.scheduledTaskComplete', {
        title: job.metadata.conversationTitle || job.name,
      });
      const body = i18n.t('cron.notification.taskDone');

      this.emitter.showNotification({ title, body, conversationId }).catch((err) => {
        console.warn('[CronService] Failed to show notification:', err);
      });
    });
  }

  /**
   * Update the next run time for a job based on its schedule
   */
  private updateNextRunTime(job: CronJob): void {
    const { schedule } = job;

    switch (schedule.kind) {
      case 'cron': {
        try {
          const cron = new Cron(schedule.expr, { timezone: schedule.tz });
          const next = cron.nextRun();
          job.state.nextRunAtMs = next ? next.getTime() : undefined;
        } catch {
          job.state.nextRunAtMs = undefined;
        }
        break;
      }

      case 'every': {
        job.state.nextRunAtMs = Date.now() + schedule.everyMs;
        break;
      }

      case 'at': {
        job.state.nextRunAtMs = schedule.atMs > Date.now() ? schedule.atMs : undefined;
        break;
      }
    }
  }

  /**
   * Handle system resume from sleep/hibernate.
   * Detects missed jobs, inserts notification messages into their conversations,
   * and restarts all timers with fresh schedules.
   */
  async handleSystemResume(): Promise<void> {
    if (!this.initialized) return;

    console.log('[CronService] System resumed, checking for missed jobs...');
    const jobs = await this.repo.listEnabled();

    // Stop stale timers first (they were paused during sleep and may be in
    // invalid state). The shared missed-job detector then notifies + rolls
    // nextRunAtMs forward; we restart timers after with the fresh schedule.
    for (const job of jobs) {
      this.stopTimer(job.id);
    }

    await this.detectAndAnnounceMissedJobs(jobs);

    for (const job of jobs) {
      const latestJob = await this.repo.getById(job.id);
      if (latestJob && latestJob.enabled) {
        await this.startTimer(latestJob);
      }
    }
  }

  /**
   * For each job whose `nextRunAtMs` has already passed, insert a one-time
   * "missed" tip into the conversation and roll the schedule forward. Used
   * by both `init()` (cold-start catch-up) and `handleSystemResume()`
   * (post-sleep catch-up). Notify-only - does NOT auto-fire the job, so
   * a week-long absence of a daily cron produces one tip, not seven, and
   * the agent never responds out-of-context to a slot the user wasn't
   * present for.
   */
  private async detectAndAnnounceMissedJobs(jobs: CronJob[]): Promise<void> {
    // This runs from `init()`, which can win the race against the main-process
    // i18n instance switching off the en-US bootstrap into the user's chosen
    // language. Without this await a German user's missed-run notice is written
    // to the database in English and stays that way. Same reason as the
    // notification path below.
    await i18nReady;
    const now = Date.now();
    for (const job of jobs) {
      const nextRunAt = job.state.nextRunAtMs;
      if (!nextRunAt || nextRunAt > now) continue;

      console.log(`[CronService] Missed job "${job.name}" (was due at ${new Date(nextRunAt).toISOString()})`);

      job.state.lastStatus = 'missed';
      job.state.lastError = i18n.t('cron.error.missedJob', {
        name: job.name,
        time: new Date(nextRunAt).toLocaleString(),
      });
      this.updateNextRunTime(job);
      await this.repo.update(job.id, { state: job.state });
      this.emitter.emitJobUpdated(job);

      this.insertMissedJobMessage(job, nextRunAt);
    }
  }

  /**
   * Insert a notification message into the conversation to inform the user
   * about a missed scheduled task execution.
   */
  private insertMissedJobMessage(job: CronJob, scheduledAtMs: number): void {
    const { conversationId } = job.metadata;
    const scheduledTime = new Date(scheduledAtMs).toLocaleString();
    const msgId = uuid();
    const content = i18n.t('cron.error.missedJob', {
      name: job.name,
      time: scheduledTime,
    });

    // Persist message to database
    const message: TMessage = {
      id: msgId,
      msg_id: msgId,
      type: 'tips',
      position: 'center',
      conversation_id: conversationId,
      content: { content, type: 'warning' as const },
      createdAt: Date.now(),
      status: 'finish',
    };
    addMessage(conversationId, message);

    // Emit to frontend so it shows immediately if conversation is open
    ipcBridge.conversation.responseStream.emit({
      type: 'tips',
      conversation_id: conversationId,
      msg_id: msgId,
      data: { content, type: 'warning' },
    });
  }

  /**
   * Manage powerSaveBlocker to keep the app alive while cron jobs are active.
   * Uses 'prevent-app-suspension' mode which prevents the app from being suspended
   * but does not prevent the display from sleeping.
   */
  private async updatePowerBlocker(): Promise<void> {
    const enabledJobs = await this.repo.listEnabled();
    const hasEnabledJobs = enabledJobs.length > 0;

    if (hasEnabledJobs && this.powerSaveBlockerId === null) {
      try {
        this.powerSaveBlockerId = getPlatformServices().power.preventSleep();
        console.log('[CronService] PowerSaveBlocker started (prevent-app-suspension)');
      } catch (error) {
        console.warn('[CronService] Failed to start powerSaveBlocker:', error);
      }
    } else if (!hasEnabledJobs && this.powerSaveBlockerId !== null) {
      try {
        getPlatformServices().power.allowSleep(this.powerSaveBlockerId);
        console.log('[CronService] PowerSaveBlocker stopped (no active jobs)');
      } catch (error) {
        console.warn('[CronService] Failed to stop powerSaveBlocker:', error);
      }
      this.powerSaveBlockerId = null;
    }
  }

  /**
   * Cleanup - stop all timers and release power blocker
   * Called on service shutdown
   */
  private cleanup(): void {
    for (const jobId of this.timers.keys()) {
      this.stopTimer(jobId);
    }
    this.timers.clear();
    this.retryTimers.clear();
    this.initialized = false;

    // Release power save blocker
    if (this.powerSaveBlockerId !== null) {
      try {
        getPlatformServices().power.allowSleep(this.powerSaveBlockerId);
      } catch {
        // Ignore errors during cleanup
      }
      this.powerSaveBlockerId = null;
    }
  }
}

// Re-export types
export type { CronJob, CronSchedule } from './CronStore';
