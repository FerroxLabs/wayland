/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP config write-only routes for the remote WebUI (remote-secure-config W3.D).
 * Lets a phone push an MCP server into the detected agent CLIs (Claude / Codex /
 * Gemini / ...), pull it back out, and plant BYO OAuth client credentials for
 * vendors without Dynamic Client Registration.
 *
 * Trust model: these are CONFIG-WRITE routes. They mutate agent config / a
 * stored credential and return STATUS ONLY:
 *  - sync   -> the per-agent {agent,success}[] results (no credentials)
 *  - remove -> the per-agent {agent,success}[] results
 *  - byo    -> { ok } (the clientSecret is NEVER echoed in the body OR the audit)
 * They are WRITE-ONLY by construction: nothing here reads a secret back, so the
 * §0 invariant holds end-to-end - a remote session can plant or remove config
 * but can never exfiltrate a key.
 *
 * Gates (the toolKeyRoutes / providerKeyRoutes shape):
 *  - `apiRateLimiter` (per-route rate limit) + `validateApiAccess` (token auth).
 *  - tiny-csrf (global middleware in setup.ts) covers the POST verb.
 *  - `requireSecureConfigWrite` (W0 shared guard): refuses a config write over
 *    plain HTTP from the public internet.
 *
 * Server records and the target agent list are resolved SERVER-SIDE
 * (`ConfigStorage.get('mcp.config')` + `agentRegistry.getDetectedAgents()`): the
 * remote body carries only ids, so a remote caller can never inject an arbitrary
 * `command` / `cliPath` for the agent CLIs to execute. It does NOT route through
 * the WS bridge (R2: the `mcpService.*` IPC channels remain denied to remote
 * callers; this HTTP route is a deliberate, gated sibling).
 */

import { type Express, type Request, type RequestHandler, type Response } from 'express';
import { apiRateLimiter } from '../middleware/security';
import { redactSecrets, requireSecureConfigWrite } from './configWriteGuards';
import { detectNetworkContext } from '../middleware/detectNetworkContext';
import { appendAudit } from '../audit/auditLog';
import { ConfigStorage } from '@/common/config/storage';
import type { IMcpServer } from '@/common/config/storage';
import { mcpService } from '@process/services/mcpServices/McpService';
import { agentRegistry } from '@process/agent/AgentRegistry';
import { persistMcpByoOAuthCredentials } from '@process/bridge/mcpBridge';

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** The detected agent CLIs to (un)install MCP config from - resolved server-side. */
function detectedAgents(): Array<{ backend: string; name: string; cliPath?: string }> {
  return agentRegistry.getDetectedAgents().map((agent) => ({
    backend: agent.backend,
    name: agent.name,
    cliPath: 'cliPath' in agent ? (agent.cliPath as string | undefined) : undefined,
  }));
}

/** Look up a stored MCP server record by id - never trusts a client-supplied spec. */
async function findServerById(serverId: string): Promise<IMcpServer | undefined> {
  const servers: IMcpServer[] = (await ConfigStorage.get('mcp.config').catch(() => [] as IMcpServer[])) ?? [];
  return servers.find((s) => s.id === serverId);
}

/**
 * Register the write-only MCP config routes for the remote WebUI (W3.D).
 */
export function registerMcpConfigRoutes(app: Express, validateApiAccess: RequestHandler): void {
  // POST /api/mcp/sync-to-agents { serverId }
  // Write-only: installs the stored server into every detected agent CLI and
  // returns the per-agent results (no credentials).
  app.post('/api/mcp/sync-to-agents', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    if (!requireSecureConfigWrite(req, res)) return;

    const serverId = bodyString(req.body?.serverId).trim();
    if (!serverId) {
      res.status(400).json({ success: false, msg: 'serverId is required' });
      return;
    }

    const ctx = detectNetworkContext(req);
    // DIRECT socket peer - never req.ip (XFF is spoofable). Audit only.
    const ip = req.socket?.remoteAddress ?? null;

    try {
      const server = await findServerById(serverId);
      if (!server) {
        res.status(400).json({ success: false, msg: `MCP server not found: ${serverId}` });
        return;
      }

      const result = await mcpService.syncMcpToAgents([server], detectedAgents());

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'mcp.sync',
        target: serverId,
        ip,
        reachedVia: ctx.reachedVia,
      });

      // Status only - the per-agent results carry no credentials.
      res.json({ success: true, data: { results: result.results } });
    } catch (error) {
      console.error('[API] MCP sync error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to sync MCP to agents';
      res.status(500).json({ success: false, msg });
    }
  });

  // POST /api/mcp/remove-from-agents { name }
  // Write-only: removes the named server from every detected agent CLI and
  // returns the per-agent results.
  app.post('/api/mcp/remove-from-agents', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    if (!requireSecureConfigWrite(req, res)) return;

    const name = bodyString(req.body?.name).trim();
    if (!name) {
      res.status(400).json({ success: false, msg: 'name is required' });
      return;
    }

    const ctx = detectNetworkContext(req);
    const ip = req.socket?.remoteAddress ?? null;

    try {
      const result = await mcpService.removeMcpFromAgents(name, detectedAgents());

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'mcp.remove',
        target: name,
        ip,
        reachedVia: ctx.reachedVia,
      });

      res.json({ success: true, data: { results: result.results } });
    } catch (error) {
      console.error('[API] MCP remove error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to remove MCP from agents';
      res.status(500).json({ success: false, msg });
    }
  });

  // POST /api/mcp/set-byo-oauth-credentials { serverId, clientId, clientSecret? }
  // Write-only: plants BYO OAuth client credentials onto the stored server and
  // returns { ok } only. The clientSecret is NEVER echoed in the body OR audit.
  app.post(
    '/api/mcp/set-byo-oauth-credentials',
    apiRateLimiter,
    validateApiAccess,
    async (req: Request, res: Response) => {
      if (!requireSecureConfigWrite(req, res)) return;

      const serverId = bodyString(req.body?.serverId).trim();
      const clientId = bodyString(req.body?.clientId).trim();
      const clientSecret = bodyString(req.body?.clientSecret).trim() || undefined;

      if (!serverId) {
        res.status(400).json({ success: false, msg: 'serverId is required' });
        return;
      }
      if (!clientId) {
        res.status(400).json({ success: false, msg: 'clientId is required' });
        return;
      }

      const ctx = detectNetworkContext(req);
      const ip = req.socket?.remoteAddress ?? null;

      try {
        const result = await persistMcpByoOAuthCredentials({ serverId, clientId, clientSecret });

        // Audit carries the serverId only - never the clientId or clientSecret.
        void appendAudit({
          userId: req.user?.id ?? null,
          action: 'mcp.byo-oauth',
          target: serverId,
          ip,
          reachedVia: ctx.reachedVia,
        });

        if (!result.ok) {
          res.status(400).json({ success: false, msg: result.msg ?? 'Could not save BYO OAuth credentials.' });
          return;
        }

        // Status only - never echo the credentials back.
        res.json({ success: true, data: { ok: true } });
      } catch (error) {
        console.error('[API] MCP BYO OAuth error:', error);
        const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to save BYO OAuth credentials';
        res.status(500).json({ success: false, msg });
      }
    }
  );
}
