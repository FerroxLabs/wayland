/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { logger } from '@office-ai/platform';
import { initAllBridges } from '../bridge';
import { SqliteChannelRepository } from '@process/services/database/SqliteChannelRepository';
import { SqliteConversationRepository } from '@process/services/database/SqliteConversationRepository';
import { ConversationServiceImpl } from '@process/services/ConversationServiceImpl';
import { cronService } from '@process/services/cron/cronServiceSingleton';
import { workerTaskManager } from '@process/task/workerTaskManagerSingleton';
import { TeamSessionService, SqliteTeamRepository } from '@process/team';
import { initTeamGuideService } from '@process/team/mcp/guide/teamGuideSingleton';
import { prewarmProviderSdks } from '@process/utils/prewarmProviders';
import { startModelRefreshScheduler } from '@process/providers/refresh/ModelRefreshScheduler';

logger.config({ print: true });

const repo = new SqliteConversationRepository();
const conversationServiceImpl = new ConversationServiceImpl(repo);
const channelRepo = new SqliteChannelRepository();
const teamRepo = new SqliteTeamRepository();
const teamSessionService = new TeamSessionService(teamRepo, workerTaskManager, conversationServiceImpl);

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
// no-ops in the pre-warmer — see prewarmProviders.ts.
void cronService
  .init()
  .then(async () => {
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

// Start provider catalog refresh scheduler (5s delay, then every 24h)
startModelRefreshScheduler();

// Start in-process Wayland Core MCP server for team-guide tools (aion_create_team)
void initTeamGuideService(teamSessionService).catch((error) => {
  console.error('[initBridge] Failed to initialize TeamGuideMcpServer:', error);
});
