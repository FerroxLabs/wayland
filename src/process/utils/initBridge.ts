/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { logger } from '@office-ai/platform';
import { ipcBridge } from '@/common';
import { initAllBridges } from '../bridge';
import { SqliteChannelRepository } from '@process/services/database/SqliteChannelRepository';
import { SqliteConversationRepository } from '@process/services/database/SqliteConversationRepository';
import { ConversationServiceImpl } from '@process/services/ConversationServiceImpl';
import { cronService } from '@process/services/cron/cronServiceSingleton';
import { workerTaskManager } from '@process/task/workerTaskManagerSingleton';
import { TeamSessionService, SqliteTeamRepository } from '@process/team';
import { initTeamGuideService } from '@process/team/mcp/guide/teamGuideSingleton';
import { CronRitualScheduler, makeExtensionRegistryRitualsResolver } from '@process/team/ritualScheduler';
import { prewarmProviderSdks } from '@process/utils/prewarmProviders';
import { getDatabase } from '@process/services/database';
import { FrequentlyUsedAggregator } from '@process/services/usage/FrequentlyUsedAggregator';
import { SqliteUsageEventRepository } from '@process/services/usage/SqliteUsageEventRepository';
import { UsageEventLogger } from '@process/services/usage/UsageEventLogger';
import { ensureUsageProviderRegistered, initUsageBridge } from '@process/bridge/usageBridge';
import { initWorkflowBridge, registerWorkflowBridge } from '@process/bridge/workflowBridge';
import { WorkflowSessionRepository } from '@process/services/workflow/WorkflowSessionRepository';
import { WorkflowSessionService, type DefaultModelProvider } from '@process/services/workflow/WorkflowSessionService';
import {
  sweepStalledAutonomousSteps,
  AUTONOMOUS_WATCHDOG_INTERVAL_MS,
} from '@process/services/workflow/autonomousWatchdog';
import { setWorkflowSessionService } from '@process/services/workflow/workflowSessionServiceSingleton';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { ProcessConfig } from '@process/utils/initStorage';
import { agentRegistry } from '@process/agent/AgentRegistry';
import { resolveDefaultLaunchTarget } from '@process/utils/workflowLaunchTargetResolver';
import type { TProviderWithModel } from '@/common/config/storage';

logger.config({ print: true });

const repo = new SqliteConversationRepository();
const conversationServiceImpl = new ConversationServiceImpl(repo);
const channelRepo = new SqliteChannelRepository();
const teamRepo = new SqliteTeamRepository();
// Standing-Company rituals: installs cron rows on promote / bundle-create so
// the marketed autonomy actually fires. Resolver pulls ritual definitions
// from the live ExtensionRegistry - same source the team-export bridge uses.
const ritualScheduler = new CronRitualScheduler(cronService, makeExtensionRegistryRitualsResolver());
const teamSessionService = new TeamSessionService(
  teamRepo,
  workerTaskManager,
  conversationServiceImpl,
  ritualScheduler
);

// Initialize all IPC bridges
initAllBridges({
  conversationService: conversationServiceImpl,
  conversationRepo: repo,
  workerTaskManager,
  channelRepo,
  teamSessionService,
});

// Initialize cron service (load jobs from database and start timers).
// Once jobs are loaded, pre-warm the AI SDKs referenced by enabled jobs
// so scheduled tasks don't pay the lazy-load latency on first fire.
// Backends with no in-process SDK (ACP CLIs, wcore, remote, etc.) are
// no-ops in the pre-warmer - see prewarmProviders.ts.
//
// v0.4.7.1 (G-M-2) - also publish the cron readiness promise via
// `setCronReadyPromise` so the kickoff bridge can await it before
// running Level-1 ritual detection. Without this, a first-launch
// Standing-Company user could open the first new-chat before any
// ritual cron was loaded and miss the Level-1 card.
const cronReadyPromise = cronService
  .init()
  .then(async () => {
    // Seed the 12 Wayland built-in routines as DISABLED (opt-in) scheduled jobs
    // bound to their bundled workflow. Idempotent; never throws.
    try {
      const { seedBuiltinRoutines } = await import('@process/services/cron/BuiltinRoutinesSeeder');
      await seedBuiltinRoutines(cronService);
    } catch (error) {
      console.warn('[initBridge] Built-in routine seeding skipped:', error);
    }
    try {
      const jobs = await cronService.listJobs();
      const backends = jobs
        .filter((job) => job.enabled)
        .map((job) => job.metadata.agentType as string)
        .filter((b): b is string => !!b);
      if (backends.length > 0) {
        await prewarmProviderSdks(backends);
      }
    } catch (error) {
      console.warn('[initBridge] Provider SDK pre-warm skipped:', error);
    }
  })
  .catch((error) => {
    console.error('[initBridge] Failed to initialize CronService:', error);
  });

void cronReadyPromise.then(() => {
  // No-op: published via setCronReadyPromise below; this `then` only keeps
  // the chain alive so rejection surfaces in the .catch above.
});

// Publish the cron-ready promise so the kickoff bridge can await it
// before reading the cron store. Imported indirectly to avoid a
// circular module dep at initBridge load time.
void import('@process/services/cron/cronReadiness').then(({ setCronReadyPromise }) => {
  setCronReadyPromise(cronReadyPromise);
});

// Start in-process Wayland Core MCP server for team-guide tools (aion_create_team)
void initTeamGuideService(teamSessionService).catch((error) => {
  console.error('[initBridge] Failed to initialize TeamGuideMcpServer:', error);
});

// Usage telemetry bridge. Register the IPC provider EAGERLY so the first
// renderer-side telemetry call (e.g. `guid.foreground`, fired in a `useEffect`
// on mount) is never dropped during the cold-start window where `getDatabase()`
// is still resolving. Events that arrive before the logger lands are buffered
// in arrival order inside `usageBridge.ts` and flushed once `initUsageBridge`
// wires the SQLite-backed logger (writes to the usage_events table from
// migration v40). This closes the cross-audit Gemini-HIGH race.
ensureUsageProviderRegistered();

// Workflow launch surface bridge (v0.6.0). Registers all 6 provider handlers
// eagerly so the renderer-side adapter routing resolves on cold start. Each
// handler currently throws "not yet implemented" - real implementations land
// in W2 (state endpoints) and W5 (autonomous dispatch). See SPEC §6.
registerWorkflowBridge();
// Cross-audit MED-4: usage_events is append-only, so prune rows older than
// the aggregator's lookback window on startup to keep the table bounded on
// long-lived installs. Aggregator only queries the last 7 days; 90 days is
// the retention floor.
const USAGE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
void getDatabase()
  .then((db) => {
    const usageRepo = new SqliteUsageEventRepository(db.getDriver());
    const usageLogger = new UsageEventLogger(usageRepo);
    const frequentlyUsedAggregator = new FrequentlyUsedAggregator(usageRepo);
    initUsageBridge(usageLogger, frequentlyUsedAggregator);
    const cutoff = Date.now() - USAGE_RETENTION_MS;
    usageRepo
      .prune(cutoff)
      .then((pruned) => {
        if (pruned > 0) console.log(`[usage] pruned ${pruned} events older than 90d`);
      })
      .catch((err) => console.warn('[usage] prune failed:', err));

    // Workflow Launch Surface (v0.6.0 / v0.6.1) - wire the live WorkflowSessionService
    // into the bridge handlers registered eagerly above. Shares the SQLite
    // driver + UsageEventLogger that landed in this `.then`, plus the
    // SkillLibrary singleton + ConversationServiceImpl from the module scope.
    //
    // `defaultModelProvider.getDefaultLaunchTarget` reads guid.lastSelectedAgent
    // + AgentRegistry to resolve a real backend + cliPath so the spawner can
    // find the CLI binary. This replaces the v0.6.0 stub that hardcoded
    // backend:'claude' and left cliPath undefined, causing
    // "No CLI path for backend 'claude'" on every workflow launch.
    const defaultModelProvider: DefaultModelProvider = {
      getDefaultLaunchTarget: async () => resolveDefaultLaunchTarget(ProcessConfig, agentRegistry),
      getDefaultModel: async (): Promise<TProviderWithModel> => {
        const target = await resolveDefaultLaunchTarget(ProcessConfig, agentRegistry);
        return target.model;
      },
    };

    const workflowRepo = new WorkflowSessionRepository(db.getDriver());
    const workflowService = new WorkflowSessionService(
      workflowRepo,
      SkillLibrary.getInstance(),
      usageLogger,
      conversationServiceImpl,
      defaultModelProvider
    );
    initWorkflowBridge(workflowService, {
      conversationService: conversationServiceImpl,
      workerTaskManager,
      telemetry: usageLogger,
      getDefaultModel: () => defaultModelProvider.getDefaultModel(),
    });
    // Publish the same instance to the module-level singleton accessor so
    // `agentUtils.buildSystemInstructions*` can compose WORKFLOW_PROTOCOL
    // for any conversation that carries a `workflowSessionId` (SPEC §7.3).
    setWorkflowSessionService(workflowService);

    // W5 completion listener - when a child conversation spawned by
    // `dispatchAutonomousStep` finishes its turn, read the back-pointer
    // stored on the child's `extra.autonomousDispatch` field and flip the
    // parent workflow step from `now` to `done` via a `source='worker'`
    // monotonic transition (SPEC §11.1). Best-effort: any error is logged
    // and swallowed so a malformed event can never break the parent chat.
    ipcBridge.conversation?.turnCompleted?.on?.((event) => {
      const childId = event.sessionId;
      if (!childId) return;
      void (async () => {
        try {
          const child = await conversationServiceImpl.getConversation(childId);
          if (child === undefined) return;
          const extra = (child.extra ?? {}) as Record<string, unknown>;
          const dispatchRaw = extra.autonomousDispatch;
          if (dispatchRaw === null || typeof dispatchRaw !== 'object' || Array.isArray(dispatchRaw)) {
            return;
          }
          const dispatch = dispatchRaw as {
            parentWorkflowSessionId?: unknown;
            stepN?: unknown;
            dispatchId?: unknown;
          };
          const parentId =
            typeof dispatch.parentWorkflowSessionId === 'string' ? dispatch.parentWorkflowSessionId : null;
          const stepN = typeof dispatch.stepN === 'number' ? dispatch.stepN : null;
          const dispatchId = typeof dispatch.dispatchId === 'string' ? dispatch.dispatchId : null;
          if (parentId === null || stepN === null || dispatchId === null) return;

          // Only act on terminal turn states. `ai_waiting_input` is the
          // canonical "the worker finished and is idle" event from the
          // ConversationTurnCompletionService dedupe path.
          const isTerminal = event.state === 'ai_waiting_input' || event.state === 'stopped' || event.state === 'error';
          if (!isTerminal) return;
          const success = event.state !== 'error';

          await workflowService.recordAutonomousCompletion(parentId, stepN, success);
          await workflowService.applyStepTransition(parentId, {
            step_n: stepN,
            status: success ? 'done' : 'errored',
            source: 'worker',
            dispatch_id: dispatchId,
            timestamp: Date.now(),
          });
          await usageLogger.record({
            eventType: 'workflow.autonomous_step_completed',
            metadata: {
              session_id: parentId,
              step_n: stepN,
              dispatch_id: dispatchId,
              child_conversation_id: childId,
              success,
            },
          });
        } catch (err) {
          console.warn('[initBridge] workflow autonomous-completion listener failed:', err);
        }
      })();
    });

    // BUG-6 GAP-A watchdog. The completion listener above is purely event-driven:
    // a child agent that hangs without ever emitting a terminal turn would leave
    // its step `running` forever (the 194-hour ghost). Sweep periodically and
    // force-error any step stalled past the threshold via the same worker-sourced
    // transition the listener uses. `unref` so it never holds the process open.
    const autonomousWatchdog = setInterval(() => {
      void (async () => {
        try {
          const swept = await sweepStalledAutonomousSteps(workflowService);
          for (const s of swept) {
            console.warn(`[initBridge] watchdog force-errored stalled workflow step ${s.sessionId}/${s.stepN}`);
            await usageLogger.record({
              eventType: 'workflow.autonomous_step_timeout',
              metadata: { session_id: s.sessionId, step_n: s.stepN, dispatch_id: s.dispatchId },
            });
          }
        } catch (err) {
          console.warn('[initBridge] autonomous watchdog sweep failed:', err);
        }
      })();
    }, AUTONOMOUS_WATCHDOG_INTERVAL_MS);
    autonomousWatchdog.unref?.();
  })
  .catch((error) => {
    console.error('[initBridge] Failed to initialize usage telemetry bridge:', error);
  });
