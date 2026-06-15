/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Channel config writes from a remote WebUI client (remote-secure-config W3.E).
 * Covers enabling / disabling a channel plugin, syncing the channel's agent +
 * model, rotating a webhook connection token, and approving a pending pairing.
 *
 * Trust model: these are CONFIG-WRITE routes - they mutate channel config and
 * return STATUS ONLY. They are WRITE-ONLY by construction (§0): a remote session
 * may RECONFIGURE a channel but can never READ a secret back. Most routes return
 * a bare status ({ enabled } / { ok }); the single exception is rotate-webhook,
 * which MINTS a fresh token and returns it EXACTLY ONCE (shown-once, like an API
 * key) - the new token is never echoed elsewhere and is never written to the
 * audit log. The OLD (revoked) token is never returned.
 *
 * R2 foot-gun: these same actions are DENIED to remote WS callers in
 * `bridgeAllowlist.ts` (channel.enable-plugin / disable-plugin /
 * rotate-webhook-token / sync-channel-settings / approve-pairing). That denial
 * stays denial-only. These HTTP routes are a NEW sibling that bypasses the WS
 * bridge entirely; they must NOT be re-allowed in the WS allowlist.
 *
 * Gates (the providerKeyRoutes / toolKeyRoutes shape):
 *  - `apiRateLimiter` (per-route rate limit) + `validateApiAccess` (token auth),
 *    wired as route middleware here.
 *  - tiny-csrf (global middleware in setup.ts) covers the POST verb.
 *  - `requireSecureConfigWrite` (W0 shared guard): the CONFIG-WRITE floor -
 *    refuses a config write over plain HTTP from the public internet.
 *
 * Persistence goes through the EXISTING in-process singletons
 * (`getChannelManager` / `getPairingService`) - the SAME logic the desktop
 * `channel.*` IPC providers run. It does NOT route through the WS bridge.
 */

import { type Express, type Request, type RequestHandler, type Response } from 'express';
import { apiRateLimiter } from '../middleware/security';
import { redactSecrets, requireDestructive, requireSecureConfigWrite } from './configWriteGuards';
import { detectNetworkContext } from '../middleware/detectNetworkContext';
import { appendAudit } from '../audit/auditLog';
import { getChannelManager } from '@process/channels/core/ChannelManager';
import { getPairingService } from '@process/channels/pairing/PairingService';

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Direct socket peer for the audit row - never req.ip (XFF is spoofable). */
function auditIp(req: Request): string | null {
  return req.socket?.remoteAddress ?? null;
}

type SyncAgent = { backend: string; customAgentId?: string; name?: string };
type SyncModel = { id: string; useModel: string };

function readSyncAgent(value: unknown): SyncAgent | null {
  if (!value || typeof value !== 'object') return null;
  const backend = bodyString((value as { backend?: unknown }).backend).trim();
  if (!backend) return null;
  const agent: SyncAgent = { backend };
  const customAgentId = bodyString((value as { customAgentId?: unknown }).customAgentId).trim();
  const name = bodyString((value as { name?: unknown }).name).trim();
  if (customAgentId) agent.customAgentId = customAgentId;
  if (name) agent.name = name;
  return agent;
}

function readSyncModel(value: unknown): SyncModel | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const id = bodyString((value as { id?: unknown }).id).trim();
  const useModel = bodyString((value as { useModel?: unknown }).useModel).trim();
  if (!id || !useModel) return undefined;
  return { id, useModel };
}

/**
 * Register the write-only channel-config routes for the remote WebUI (W3.E).
 */
export function registerChannelConfigRoutes(app: Express, validateApiAccess: RequestHandler): void {
  // POST /api/channels/enable-plugin { pluginId, config? }
  // Write-only: enables the plugin and returns { enabled } only.
  app.post('/api/channels/enable-plugin', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    if (!requireSecureConfigWrite(req, res)) return;

    const pluginId = bodyString(req.body?.pluginId).trim();
    if (!pluginId) {
      res.status(400).json({ success: false, msg: 'pluginId is required' });
      return;
    }
    const rawConfig = req.body?.config;
    const config = rawConfig && typeof rawConfig === 'object' ? (rawConfig as Record<string, unknown>) : {};

    const ctx = detectNetworkContext(req);
    try {
      const result = await getChannelManager().enablePlugin(pluginId, config);

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'channel.enable',
        target: pluginId,
        ip: auditIp(req),
        reachedVia: ctx.reachedVia,
      });

      if (!result.success) {
        res.status(400).json({ success: false, msg: result.error ?? 'Could not enable the channel plugin.' });
        return;
      }

      res.json({ success: true, data: { enabled: true } });
    } catch (error) {
      console.error('[API] Channel enable-plugin error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to enable channel plugin';
      res.status(500).json({ success: false, msg });
    }
  });

  // POST /api/channels/disable-plugin { pluginId }
  // Write-only: disables the plugin and returns { enabled: false } only.
  app.post('/api/channels/disable-plugin', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    if (!requireSecureConfigWrite(req, res)) return;

    const pluginId = bodyString(req.body?.pluginId).trim();
    if (!pluginId) {
      res.status(400).json({ success: false, msg: 'pluginId is required' });
      return;
    }

    const ctx = detectNetworkContext(req);
    try {
      const result = await getChannelManager().disablePlugin(pluginId);

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'channel.disable',
        target: pluginId,
        ip: auditIp(req),
        reachedVia: ctx.reachedVia,
      });

      if (!result.success) {
        res.status(400).json({ success: false, msg: result.error ?? 'Could not disable the channel plugin.' });
        return;
      }

      res.json({ success: true, data: { enabled: false } });
    } catch (error) {
      console.error('[API] Channel disable-plugin error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to disable channel plugin';
      res.status(500).json({ success: false, msg });
    }
  });

  // POST /api/channels/sync-settings { platform, agent, model? }
  // Write-only: re-binds the channel's agent + model and returns { ok } only.
  app.post('/api/channels/sync-settings', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    if (!requireSecureConfigWrite(req, res)) return;

    const platform = bodyString(req.body?.platform).trim();
    const agent = readSyncAgent(req.body?.agent);
    const model = readSyncModel(req.body?.model);

    if (!platform) {
      res.status(400).json({ success: false, msg: 'platform is required' });
      return;
    }
    if (!agent) {
      res.status(400).json({ success: false, msg: 'agent.backend is required' });
      return;
    }

    const ctx = detectNetworkContext(req);
    try {
      // The manager validates the platform itself.
      const result = await getChannelManager().syncChannelSettings(
        platform as Parameters<ReturnType<typeof getChannelManager>['syncChannelSettings']>[0],
        agent,
        model
      );

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'channel.sync',
        target: platform,
        ip: auditIp(req),
        reachedVia: ctx.reachedVia,
      });

      if (!result.success) {
        res.status(400).json({ success: false, msg: result.error ?? 'Could not sync channel settings.' });
        return;
      }

      res.json({ success: true, data: { ok: true } });
    } catch (error) {
      console.error('[API] Channel sync-settings error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to sync channel settings';
      res.status(500).json({ success: false, msg });
    }
  });

  // POST /api/channels/rotate-webhook-token { platform, pluginInstanceId, agentId, secret? }
  // MINTS a fresh token. Returns the NEW token/URL EXACTLY ONCE (shown-once).
  // The old (revoked) token is never returned; the new token is NEVER audited.
  app.post(
    '/api/channels/rotate-webhook-token',
    apiRateLimiter,
    validateApiAccess,
    async (req: Request, res: Response) => {
      if (!requireSecureConfigWrite(req, res)) return;

      const platform = bodyString(req.body?.platform).trim();
      const pluginInstanceId = bodyString(req.body?.pluginInstanceId).trim();
      const agentId = bodyString(req.body?.agentId).trim();
      const secret = bodyString(req.body?.secret);

      if (!platform || !pluginInstanceId || !agentId) {
        res.status(400).json({ success: false, msg: 'platform, pluginInstanceId and agentId are required' });
        return;
      }

      const ctx = detectNetworkContext(req);
      try {
        const { getTokenStore } = await import('@process/channels/webhook');
        const { ProcessConfig } = await import('@process/utils/initStorage');
        const store = getTokenStore();

        // Revoke any prior token(s) for this exact tuple so the old URL can no
        // longer be used to deliver messages.
        for (const record of store.serialize()) {
          if (
            record.revokedAt === undefined &&
            record.platform === platform &&
            record.pluginInstanceId === pluginInstanceId &&
            record.agentId === agentId
          ) {
            store.revoke(record.token);
          }
        }

        const minted = store.register(platform, pluginInstanceId, agentId, secret);

        // Persist the mutated store so the new URL survives restart.
        try {
          await ProcessConfig.set('webhook.connectionTokens', store.serialize());
        } catch (persistErr) {
          console.error('[API] Failed to persist rotated webhook token:', persistErr);
        }

        // Audit the rotation WITHOUT the minted token value (§0 / no secret in
        // the audit trail). target is the tuple, not the token.
        void appendAudit({
          userId: req.user?.id ?? null,
          action: 'channel.rotate-webhook',
          target: `${platform}/${pluginInstanceId}`,
          ip: auditIp(req),
          reachedVia: ctx.reachedVia,
        });

        // SHOWN-ONCE: the freshly minted token is returned exactly here, exactly
        // once. redactSecrets is deliberately NOT run over this success body - it
        // is the intentional one-time secret surface, not an upstream error.
        res.json({
          success: true,
          data: { token: minted.token, platform: minted.platform, createdAt: minted.createdAt },
        });
      } catch (error) {
        console.error('[API] Channel rotate-webhook-token error:', error);
        // ERROR bodies only: scrub any secret material that might appear.
        const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to rotate webhook token';
        res.status(500).json({ success: false, msg });
      }
    }
  );

  // POST /api/channels/approve-pairing { code, password }
  // Write-only: approves a pending pairing and returns { ok } only - never the
  // pairing code or any minted session material.
  app.post('/api/channels/approve-pairing', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    // AGENT-AUTHORITY, not plain config-write: approval enrolls a NEW external
    // identity as an authorized channel principal that can then drive the agent
    // (channel messages flow with auto-approve). A stolen remote session must not
    // be able to enrol an attacker's own chat account as a persistent, session-
    // independent command channel. DESTRUCTIVE bar: operator-network + step-up.
    if (!(await requireDestructive(req, res, bodyString(req.body?.password)))) return;

    const code = bodyString(req.body?.code).trim();
    if (!code) {
      res.status(400).json({ success: false, msg: 'code is required' });
      return;
    }

    const ctx = detectNetworkContext(req);
    try {
      const result = await getPairingService().approvePairing(code);

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'channel.pairing-approve',
        target: code,
        ip: auditIp(req),
        reachedVia: ctx.reachedVia,
      });

      if (!result.success) {
        res.status(400).json({ success: false, msg: result.error ?? 'Could not approve the pairing request.' });
        return;
      }

      // Status only - never echo the approved user record or any token.
      res.json({ success: true, data: { ok: true } });
    } catch (error) {
      console.error('[API] Channel approve-pairing error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to approve pairing';
      res.status(500).json({ success: false, msg });
    }
  });
}
