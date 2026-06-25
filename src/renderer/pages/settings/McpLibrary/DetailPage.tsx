/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Message, Switch, Modal } from '@arco-design/web-react';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  ExternalLink,
  Info,
  LogIn,
  Plug,
  Plus,
  RefreshCw,
  Radio,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  Wrench,
} from 'lucide-react';
import {
  useMcpServers,
  useMcpAgentStatus,
  useMcpOperations,
  useMcpOAuth,
  useMcpServerCRUD,
  useMcpConnection,
} from '@renderer/hooks/mcp';
import type { McpOAuthLoginResult } from '@renderer/hooks/mcp/useMcpOAuth';
import { openExternalUrl } from '@renderer/utils/platform';
import { mcpService } from '@/common/adapter/ipcBridge';
import type { IMcpServer } from '@/common/config/storage';
import { useMcpLibrary } from './hooks/useMcpLibrary';
import { SetupGuide } from './components/SetupGuide';
import StatusChip from './components/StatusChip';
import { ByoCredentialsModal, type ByoVendorHint } from './components/ByoCredentialsModal';
import { deriveStatus, type UIStatus } from './status';
import { entryToServerData } from './entryToServerData';
import styles from './DetailPage.module.css';

type Tab = 'overview' | 'tools' | 'setup-guide' | 'permissions';

// Allow only http(s) absolute URLs or relative catalog asset paths to flow into
// <a href> / <img src>. A future catalog entry with a `javascript:` or `data:`
// URL would otherwise execute in the renderer.
function safeUrl(u: string | undefined): string | undefined {
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  // Vite-resolved bundled assets: absolute path or inlined SVG data URL.
  if (u.startsWith('/')) return u;
  if (u.startsWith('data:image/svg+xml')) return u;
  if (u.startsWith('icons/')) return u;
  return undefined;
}

// Title-case a single word/token ('communication' -> 'Communication').
function titleCase(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

// Pretty transport label for the hero tag + Connection panel.
function transportLabel(t: string): string {
  if (t === 'streamable-http' || t === 'streamable_http') return 'Streamable HTTP';
  if (t === 'sse') return 'SSE';
  if (t === 'stdio') return 'Local (stdio)';
  if (t === 'http') return 'HTTP';
  return titleCase(t);
}

// Friendly auth-method label.
function authLabel(method: string): string {
  if (method === 'oauth2-byo') return 'OAuth';
  if (method === 'api-key') return 'API key';
  if (method === 'local-credentials') return 'Local credentials';
  if (method === 'none') return 'None';
  return titleCase(method);
}

// Map a raw agent backend source ('claude' / 'codex' / 'gemini' / 'custom-…')
// to a display name + short avatar initials for the "Available to" badges.
function agentDisplay(source: string): { name: string; initials: string } {
  const base = source.startsWith('custom-') ? source.slice('custom-'.length) : source;
  switch (base) {
    case 'claude':
      return { name: 'Claude Code', initials: 'C' };
    case 'codex':
      return { name: 'Codex', initials: 'Cx' };
    case 'gemini':
      return { name: 'Gemini', initials: 'G' };
    default:
      return { name: titleCase(base), initials: base.slice(0, 2).toUpperCase() };
  }
}

// Coarse "x ago" / absolute fallback for the synced-time line. Keeps it
// dependency-free (no date lib in this surface).
function formatRelativeTime(ts: number | undefined): string | undefined {
  if (typeof ts !== 'number') return undefined;
  const diff = Date.now() - ts;
  if (diff < 0) return undefined;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function DetailPage() {
  const { t } = useTranslation();
  const { entryId } = useParams<{ entryId: string }>();
  const id = decodeURIComponent(entryId ?? '');
  const navigate = useNavigate();
  const library = useMcpLibrary();

  const [message, contextHolder] = Message.useMessage();
  const { mcpServers, saveMcpServers } = useMcpServers();
  const { agentInstallStatus, setAgentInstallStatus, checkSingleServerInstallStatus } = useMcpAgentStatus();
  const { syncMcpToAgents, removeMcpFromAgents } = useMcpOperations(mcpServers, message);
  const { login, cancel: cancelMcpOAuthIpc, loggingIn, oauthStatus, setByoCredentials } = useMcpOAuth();
  const crud = useMcpServerCRUD(
    mcpServers,
    saveMcpServers,
    syncMcpToAgents,
    removeMcpFromAgents,
    checkSingleServerInstallStatus,
    setAgentInstallStatus
  );
  const conn = useMcpConnection(mcpServers, saveMcpServers, message);

  const entry = useMemo(() => library.getEntry(id), [library, id]);
  const guide = useMemo(() => (entry?.['x-wayland'].setupGuide ? library.getGuide(id) : null), [library, id, entry]);
  const installed = mcpServers.some((s) => s.libraryEntryId === id);
  const installedServer = useMemo(() => mcpServers.find((s) => s.libraryEntryId === id), [mcpServers, id]);

  const [tab, setTab] = useState<Tab | null>(null);
  const [env, setEnv] = useState<Record<string, string>>({});
  const [installing, setInstalling] = useState(false);
  const [byoModal, setByoModal] = useState<{
    visible: boolean;
    server: IMcpServer | null;
    redirectUri: string;
  }>({ visible: false, server: null, redirectUri: 'http://localhost:57000/oauth/callback' });

  // Lets the user back out of an in-flight OAuth sign-in (the upstream call
  // can't be aborted, so login() races the IPC against this signal).
  const oauthAbortRef = useRef<AbortController | null>(null);

  // Steps the user has completed (beyond static autoCompletedByInstall):
  // - any step whose primaryAction is 'oauth-flow' when the server has a
  //   valid token and isn't asking for re-login.
  // MUST run before the `!entry` early return below: the catalog library
  // lazy-loads, so `entry` is briefly undefined on a hard navigation to a
  // detail route. A hook after the early return changes the hook count
  // between renders -> "Rendered fewer hooks than expected" crash.
  const completedStepIds = useMemo(() => {
    const done = new Set<string>();
    if (!guide || !installedServer) return done;
    const oauth = oauthStatus[installedServer.id];
    const oauthDone = installedServer.enabled === true && oauth?.needsLogin !== true;
    if (oauthDone) {
      for (const step of guide.steps) {
        if (step.primaryAction?.action === 'oauth-flow') done.add(step.id);
      }
    }
    return done;
  }, [guide, installedServer, oauthStatus]);

  // Probe the open connector's live status on mount (and when the selected
  // connector changes) so the action card reflects reality - Connected vs
  // "needs sign-in" - instead of a stale persisted status. Without this the
  // page only ever shows the last status written by a manual reconnect, so an
  // already-authorized hosted server (Notion/Canva/...) reads "Not connected"
  // even though every agent has it. refreshServerStatuses is passive: it
  // dedupes by STALE_MS and never auto-disables a server.
  useEffect(() => {
    if (installedServer?.enabled) {
      void conn.refreshServerStatuses([installedServer]);
    }
    // Re-probe only when the selected connector identity / enabled flag changes,
    // never on each status write (refreshServerStatuses updates the record).
  }, [installedServer?.id, installedServer?.enabled]);

  if (!entry) return <div className={styles.unknown}>Unknown entry: {id}</div>;

  const w = entry['x-wayland'];

  // Catalog-declared OAuth scope names (e.g. GitHub repo / read:org / workflow)
  // threaded into login() so the authorization request actually asks for them.
  const oauthScopes = w.auth.scopes?.map((s) => s.name).filter((n) => n.length > 0);

  const install = async (): Promise<IMcpServer | null> => {
    setInstalling(true);
    try {
      const serverData = entryToServerData(entry, env);
      const newServer = await crud.handleAddMcpServer(serverData);
      if (!newServer) {
        message.error(
          t('mcpLibrary.install.errorFailed', 'Install failed: {{error}}', {
            error: 'unknown',
          })
        );
        return null;
      }
      message.success(
        t('mcpLibrary.install.successAdded', '{{name}} added to library.', {
          name: entry.title,
        })
      );
      return newServer;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      message.error(t('mcpLibrary.install.errorFailed', 'Install failed: {{error}}', { error: msg }));
      return null;
    } finally {
      setInstalling(false);
    }
  };

  /**
   * Finish the OAuth flow once login() returns success:
   *  - flip the server.enabled bit (the consent IS the affirmative action,
   *    no second click required)
   *  - toast a "Connected to <vendor>" success message
   */
  const finishOAuthSuccess = async (server: IMcpServer) => {
    if (!server.enabled) {
      try {
        await crud.handleToggleMcpServer(server.id, true);
      } catch (err) {
        console.error('[mcp-library] auto-enable after OAuth failed:', err);
      }
    }
    message.success(t('mcpLibrary.install.oauthSuccess', 'Connected to {{name}}.', { name: entry.title }));
  };

  /**
   * Save + connect a credential-bearing server: persist the installed server
   * with the user's env-supplied credentials, run a REAL connection test that
   * reaches the server and lists tools, and only enable the server when that
   * test passes. Replaces the prior decorative token field whose value went
   * nowhere and the false-positive "connected" banner.
   *
   * Shared by two auth models that connect identically — by starting the server
   * with credentials already on it, NOT via the HTTP loopback OAuth path:
   *  - api-key connectors (token embedded as a Bearer header by entryToServerData)
   *  - stdio oauth2-byo connectors (#306): they carry their OAuth client creds on
   *    transport.env (e.g. GOOGLE_OAUTH_CLIENT_ID/SECRET) and run their OWN OAuth
   *    inside the spawned subprocess, so login() (which rejects non-HTTP
   *    transports) must never be called for them.
   */
  const saveAndConnect = async () => {
    const hasToken = Object.values(env).some((v) => typeof v === 'string' && v.trim().length > 0);
    // Some api-key connectors take an OPTIONAL key (Context7's free tier works
    // without one) - their guide has no token input. Only block on a missing
    // token when the guide actually asks for one; otherwise connect keyless.
    const requiresToken = !!guide?.steps?.some((s) => s.inputs && s.inputs.length > 0);
    if (!hasToken && requiresToken) {
      message.warning(t('mcpLibrary.install.tokenRequired', 'Enter your token first.'));
      return;
    }
    setInstalling(true);
    try {
      const server = await crud.handleAddMcpServer(entryToServerData(entry, env));
      if (!server) {
        message.error(t('mcpLibrary.install.errorFailed', 'Install failed: {{error}}', { error: 'unknown' }));
        return;
      }
      const res = await mcpService.testMcpConnection.invoke(server);
      const ok = res.success && res.data?.success === true;
      if (!ok) {
        const err = res.data?.error || res.msg || 'connection failed';
        message.error(t('mcpLibrary.install.connectFailed', 'Could not connect: {{error}}', { error: err }));
        if (server.enabled) await crud.handleToggleMcpServer(server.id, false).catch(() => {});
        return;
      }
      if (!server.enabled) await crud.handleToggleMcpServer(server.id, true);
      message.success(
        t('mcpLibrary.install.connected', 'Connected to {{name}} ({{count}} tools).', {
          name: entry.title,
          count: res.data?.tools?.length ?? 0,
        })
      );
    } catch (err) {
      message.error(
        t('mcpLibrary.install.connectFailed', 'Could not connect: {{error}}', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setInstalling(false);
    }
  };

  const onPrimary = async (action: string) => {
    // api-key hosted MCP: persist token + test + enable on success.
    if (action === 'api-key-save') {
      await saveAndConnect();
      return;
    }
    // Install first (or reuse the existing server if already installed), then
    // trigger OAuth for entries whose setup guide emits an 'oauth-flow' action.
    if (action !== 'oauth-flow') return;

    // #306: An oauth2-byo connector on a STDIO transport (Google Workspace,
    // gcloud, Teams, MS365, Xero) does its OWN OAuth inside the spawned
    // subprocess using env credentials — it is NOT HTTP-family, so the desktop
    // loopback OAuth path (login()) hard-rejects it ("OAuth requires an
    // HTTP-family transport, got 'stdio'"). Route it to the env-install path:
    // persist the creds and start + test the server so it self-authenticates.
    const transport = installedServer?.transport.type ?? entry.packages[0]?.transport.type ?? entry.remotes?.[0]?.type;
    if (transport === 'stdio') {
      await saveAndConnect();
      return;
    }

    let server: IMcpServer | null = installedServer ?? null;
    if (!server) {
      server = await install();
      if (!server) return;
    }

    const controller = new AbortController();
    oauthAbortRef.current = controller;
    const result = await login(server, oauthScopes, { signal: controller.signal });
    oauthAbortRef.current = null;
    if (result.success === true) {
      await finishOAuthSuccess(server);
      return;
    }

    // BYO short-circuit. The service-layer detected (or upstream errored
    // back) that this vendor can't auto-register a client - open the
    // credentials modal instead of surfacing a raw error.
    if (result.success === false && result.code === 'needs_byo') {
      setByoModal({
        visible: true,
        server,
        redirectUri: result.redirectUri ?? 'http://localhost:57000/oauth/callback',
      });
      return;
    }

    if (handleOAuthAbort(result)) return;

    message.error(
      t('mcpLibrary.install.oauthFailed', 'Authorization failed: {{error}}', {
        error: (result.success === false && result.error) || 'unknown',
      })
    );
  };

  /**
   * Surface a cancelled / timed-out OAuth wait. Returns true when the result was
   * handled here (so callers skip their generic oauthFailed toast):
   *  - cancelled: silent back-out, the user chose to stop.
   *  - timeout: actionable toast pointing at the likely BYO mistake.
   */
  const handleOAuthAbort = (result: McpOAuthLoginResult): boolean => {
    if (result.success !== false) return false;
    if (result.code === 'cancelled') return true;
    if (result.code === 'timeout') {
      message.error(
        t(
          'mcpLibrary.install.oauthTimeout',
          'Sign-in timed out. Check the client ID/secret and redirect URI, then try again.'
        )
      );
      return true;
    }
    return false;
  };

  /**
   * Persist user-supplied OAuth client_id/secret onto the installed server,
   * then immediately retry login() using the freshly returned server (so we
   * don't race the useMcpServers refresh).
   */
  const handleByoSubmit = async (clientId: string, clientSecret: string | undefined) => {
    if (!byoModal.server) return;
    const saveResult = await setByoCredentials(byoModal.server.id, clientId, clientSecret);
    if (!saveResult.success || !saveResult.server) {
      message.error(
        t('mcpLibrary.byo.saveFailed', 'Failed to save credentials: {{error}}', {
          error: saveResult.error ?? 'unknown',
        })
      );
      return;
    }
    setByoModal({ visible: false, server: null, redirectUri: byoModal.redirectUri });

    // Persist via the renderer cache too so the next pageload sees byoOAuth
    // without waiting for a useMcpServers re-mount.
    await saveMcpServers((prev) => prev.map((s) => (s.id === saveResult.server!.id ? saveResult.server! : s)));

    const controller = new AbortController();
    oauthAbortRef.current = controller;
    const retryResult = await login(saveResult.server, oauthScopes, { signal: controller.signal });
    oauthAbortRef.current = null;
    if (retryResult.success === true) {
      await finishOAuthSuccess(saveResult.server);
      return;
    }
    if (handleOAuthAbort(retryResult)) return;
    message.error(
      t('mcpLibrary.install.oauthFailed', 'Authorization failed: {{error}}', {
        error: (retryResult.success === false && retryResult.error) || 'unknown',
      })
    );
  };

  // Back out of an in-flight OAuth sign-in (#242). Does BOTH: aborts the local
  // race so login() settles to a `cancelled` result and clears the spinner (no
  // error toast for a user-initiated back-out), AND fires the main-process IPC
  // cancel so the service frees the callback port + stops waiting.
  const cancelOAuth = (server: IMcpServer) => {
    oauthAbortRef.current?.abort();
    void cancelMcpOAuthIpc(server);
  };

  // "Connected and ready" must reflect a real connection, not just an install.
  // OAuth + api-key both require an affirmative, tested enable; only keyless
  // ('none') servers are ready on install alone.
  const isOauth = w.auth.method === 'oauth2-byo';
  const isApiKey = w.auth.method === 'api-key';
  const isReady =
    installed &&
    (isOauth
      ? installedServer?.enabled === true && oauthStatus[installedServer.id]?.needsLogin !== true
      : isApiKey
        ? installedServer?.enabled === true
        : true);

  const oauthInFlight = installedServer ? !!loggingIn[installedServer.id] : false;
  const reconnecting = installedServer ? !!conn.testingServers[installedServer.id] : false;

  // An auth-requiring connector that's installed but has never completed a
  // successful connection (no lastConnected timestamp). Drives the "Sign in"
  // hero + the Setup-first default tab, instead of a dead "Off + Reconnect".
  const requiresAuth = isOauth || isApiKey;
  const neverConnected = !installedServer || typeof installedServer.lastConnected !== 'number';

  // Front-and-center setup: when the connector isn't connected yet, open on the
  // Setup tab so the steps/sign-in are the first thing the user sees - not
  // buried behind Overview. Once connected, default to Overview. A manual tab
  // click (setTab) always wins.
  const activeTab: Tab = tab ?? (!isReady && guide ? 'setup-guide' : 'overview');

  // The connect action(s) the guide already exposes via a step button. Many
  // catalog guides forgot it (21 entries ship a token input with no save
  // action), which would leave a key box with no way to connect.
  const guideActions = guide?.steps.flatMap((s) => (s.primaryAction ? [s.primaryAction.action] : [])) ?? [];

  // Does any guide step collect a token/credential via an input field?
  const hasTokenInputs = guide?.steps.some((s) => s.inputs && s.inputs.length > 0) ?? false;

  // Synthesized save button rendered DIRECTLY UNDER a token input whose guide
  // step forgot its own primaryAction. This is the "if there's a key box, there's
  // a save button" guarantee - it works whether the connector is freshly
  // installed OR already connected (so the key can be updated in place;
  // handleAddMcpServer matches by name and re-tests). OAuth connectors are
  // excluded: their connect button is the sign-in card/bar, not a token field.
  const stepFallbackAction = !isOauth
    ? {
        action: 'api-key-save',
        label: isReady
          ? t('mcpLibrary.detail.updateKey', 'Update key')
          : t('mcpLibrary.detail.saveConnect', 'Save & connect'),
        pending: installing,
        pendingLabel: t('mcpLibrary.detail.connecting', 'Connecting…'),
      }
    : undefined;

  // Bottom connect bar now only covers connectors with NO token input to host an
  // inline button: OAuth sign-in, and keyless api-key (e.g. Context7). The
  // api-key/local-credentials WITH inputs case is handled in-step above.
  const showFallbackConnect =
    !isReady &&
    ((isOauth && !guideActions.includes('oauth-flow')) ||
      (isApiKey && !hasTokenInputs && !guideActions.includes('api-key-save')));

  // Live UI status (running / warn / error / stopped) drives the 3 action-card
  // states. "stopped" splits further: a disabled server reads as "Off".
  const uiStatus: UIStatus | null = installedServer
    ? deriveStatus(installedServer, oauthStatus[installedServer.id])
    : null;
  const disabled = installedServer?.enabled === false;

  // Reconnect re-runs the real connection engine (handleTestMcpConnection),
  // which probes the server, lists tools, and persists the result.
  const reconnect = () => {
    if (installedServer) void conn.handleTestMcpConnection(installedServer);
  };

  // Remove deletes the server entirely (and removes it from every synced agent)
  // after an explicit confirm, then returns to Browse.
  const confirmRemove = () => {
    if (!installedServer) return;
    Modal.confirm({
      title: t('mcpLibrary.detail.removeTitle', 'Remove {{name}}?', { name: entry.title }),
      content: t(
        'mcpLibrary.detail.removeBody',
        'This deletes the connector and its sign-in. You can reinstall it any time.'
      ),
      okText: t('mcpLibrary.detail.removeConfirm', 'Remove'),
      cancelText: t('mcpLibrary.detail.cancel', 'Cancel'),
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        await crud.handleDeleteMcpServer(installedServer.id);
        navigate('/settings/mcp-library/browse');
      },
    });
  };

  const openUrl = (u: string | undefined) => {
    const safe = safeUrl(u);
    if (safe) void openExternalUrl(safe);
  };

  // Hero tag row facts (text chips only - no tier rainbow).
  const maintainerLabel =
    w.maintainerType === 'official' ? 'Official' : w.maintainerType === 'wayland' ? 'Wayland' : 'Community';
  const primaryCategory = w.categories?.[0] ? titleCase(w.categories[0]) : undefined;
  const transportType = entry.packages[0]?.transport.type ?? entry.remotes?.[0]?.type ?? 'hosted';

  const toolCount = installedServer?.tools?.length ?? 0;
  const syncedAt = formatRelativeTime(installedServer?.lastConnected);
  const account = w.auth.providerName ?? '—';
  const syncedAgents = installedServer ? (agentInstallStatus[installedServer.name] ?? []) : [];

  const estMinutes = guide?.estimatedMinutes ?? w.setupGuide?.estimatedMinutes;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: t('mcpLibrary.detail.tabOverview', 'Overview') },
    {
      key: 'tools',
      label: t('mcpLibrary.detail.tabTools', 'Tools'),
      count: toolCount > 0 ? toolCount : undefined,
    },
    { key: 'setup-guide', label: t('mcpLibrary.detail.tabSetup', 'Setup') },
    { key: 'permissions', label: t('mcpLibrary.detail.tabPermissions', 'Permissions') },
  ];

  // ----- state-aware action card -----
  const renderAction = () => {
    // STATE 1: Not installed.
    if (!installed || !installedServer || !uiStatus) {
      return (
        <div className={styles.action}>
          <div className={styles.statusLine}>
            <span className={`${styles.dot} ${styles.dotOff}`} />
            {t('mcpLibrary.detail.notInstalled', 'Not installed')}
          </div>
          <div className={styles.statusMeta}>
            {w.auth.method === 'none'
              ? t('mcpLibrary.detail.notInstalledKeyless', 'No account needed. Install and it works.')
              : t('mcpLibrary.detail.notInstalledAuth', 'Install, then sign in or add a token to connect.')}
          </div>
          <button
            type='button'
            className={styles.btnPrimary}
            onClick={() =>
              w.auth.method === 'none' ? void install() : void onPrimary(isApiKey ? 'api-key-save' : 'oauth-flow')
            }
            disabled={installing || oauthInFlight}
          >
            <Plus size={16} />
            {installing ? t('mcpLibrary.install.installing', 'Installing…') : t('mcpLibrary.install.button', 'Install')}
          </button>
          {w.auth.method !== 'none' && (
            <div className={styles.note}>
              <ShieldCheck size={13} />
              {t('mcpLibrary.detail.installAuthNote', 'Sign-in or a token is required after install.')}
            </div>
          )}
        </div>
      );
    }

    // STATE 3: Needs sign-in (warn) - amber CTA running the existing OAuth path.
    if (uiStatus === 'warn') {
      return (
        <div className={styles.action}>
          <div className={`${styles.statusLine} ${styles.cWarn}`}>
            <span className={`${styles.dot} ${styles.dotWarn}`} />
            {t('mcpLibrary.detail.needsSignIn', 'Needs sign-in')}
          </div>
          <div className={styles.statusMeta}>
            {t('mcpLibrary.detail.needsSignInMeta', 'Installed, but not connected yet.')}
          </div>
          <button
            type='button'
            className={`${styles.btnPrimary} ${styles.btnWarn}`}
            onClick={() => void onPrimary('oauth-flow')}
            disabled={oauthInFlight}
          >
            <LogIn size={16} />
            {oauthInFlight ? t('mcpLibrary.detail.signingIn', 'Signing in…') : t('mcpLibrary.detail.signIn', 'Sign in')}
          </button>
          {oauthInFlight && installedServer && (
            <button type='button' className={styles.btn2} onClick={() => cancelOAuth(installedServer)}>
              {t('mcpLibrary.detail.cancelSignIn', 'Cancel sign-in')}
            </button>
          )}
          <div className={styles.lifecycle}>
            <button type='button' className={`${styles.btn2} ${styles.btn2Danger}`} onClick={confirmRemove}>
              <Trash2 size={14} />
              {t('mcpLibrary.detail.remove', 'Remove connector')}
            </button>
          </div>
        </div>
      );
    }

    // STATE 3b: Error - reconnect CTA (the connection engine, not OAuth).
    if (uiStatus === 'error') {
      return (
        <div className={styles.action}>
          <div className={`${styles.statusLine} ${styles.cErr}`}>
            <span className={`${styles.dot} ${styles.dotErr}`} />
            {t('mcpLibrary.detail.needsAttention', 'Needs attention')}
          </div>
          <div className={styles.statusMeta}>
            {installedServer.lastError ?? t('mcpLibrary.detail.errorMeta', 'The last connection attempt failed.')}
          </div>
          <button type='button' className={styles.btnPrimary} onClick={reconnect} disabled={reconnecting}>
            <RefreshCw size={16} />
            {reconnecting
              ? t('mcpLibrary.detail.reconnecting', 'Reconnecting…')
              : t('mcpLibrary.detail.reconnect', 'Reconnect')}
          </button>
          <div className={styles.lifecycle}>
            <button type='button' className={`${styles.btn2} ${styles.btn2Danger}`} onClick={confirmRemove}>
              <Trash2 size={14} />
              {t('mcpLibrary.detail.remove', 'Remove connector')}
            </button>
          </div>
        </div>
      );
    }

    // STATE 2b: Installed but never connected (OAuth/api-key still needs the
    // first sign-in/token). Lead with the connect action, not a dead "Off +
    // Reconnect" management card - reconnecting something never connected is
    // meaningless, and the user just wants to finish setup.
    if (uiStatus === 'stopped' && requiresAuth && neverConnected) {
      return (
        <div className={styles.action}>
          <div className={styles.statusLine}>
            <span className={`${styles.dot} ${styles.dotOff}`} />
            {t('mcpLibrary.detail.notConnected', 'Not connected')}
          </div>
          <div className={styles.statusMeta}>
            {isOauth
              ? t('mcpLibrary.detail.notConnectedOauth', 'Installed. Sign in to connect it.')
              : t('mcpLibrary.detail.notConnectedKey', 'Installed. Add your token to connect it.')}
          </div>
          <button
            type='button'
            className={`${styles.btnPrimary} ${styles.btnWarn}`}
            onClick={() => (isOauth ? void onPrimary('oauth-flow') : setTab('setup-guide'))}
            disabled={oauthInFlight}
          >
            <LogIn size={16} />
            {isOauth
              ? oauthInFlight
                ? t('mcpLibrary.detail.signingIn', 'Signing in…')
                : t('mcpLibrary.detail.signIn', 'Sign in')
              : t('mcpLibrary.detail.addToken', 'Add token')}
          </button>
          {isOauth && oauthInFlight && installedServer && (
            <button type='button' className={styles.btn2} onClick={() => cancelOAuth(installedServer)}>
              {t('mcpLibrary.detail.cancelSignIn', 'Cancel sign-in')}
            </button>
          )}
          <div className={styles.lifecycle}>
            <button type='button' className={`${styles.btn2} ${styles.btn2Danger}`} onClick={confirmRemove}>
              <Trash2 size={14} />
              {t('mcpLibrary.detail.remove', 'Remove connector')}
            </button>
          </div>
        </div>
      );
    }

    // STATE 2: Connected / healthy (running or disabled-but-installed).
    return (
      <div className={`${styles.action} ${disabled ? '' : styles.actionConnected}`}>
        {disabled ? (
          <div className={styles.statusLine}>
            <span className={`${styles.dot} ${styles.dotOff}`} />
            {t('mcpLibrary.detail.off', 'Off')}
          </div>
        ) : (
          <StatusChip status='running' />
        )}
        <div className={styles.statusMeta} style={{ marginTop: 8 }}>
          {t('mcpLibrary.detail.connectedMeta', '{{count}} tools', { count: toolCount })}
          {syncedAt ? ` · ${t('mcpLibrary.detail.lastSynced', 'synced {{time}}', { time: syncedAt })}` : ''}
        </div>
        <div className={styles.ctrlRow}>
          <span className={styles.ctrlKey}>{t('mcpLibrary.detail.enabled', 'Enabled')}</span>
          <Switch
            checked={installedServer.enabled === true}
            onChange={(v) => void crud.handleToggleMcpServer(installedServer.id, v)}
          />
        </div>
        <div className={styles.lifecycle}>
          <button type='button' className={styles.btn2} onClick={reconnect} disabled={reconnecting}>
            <RefreshCw size={14} />
            {reconnecting
              ? t('mcpLibrary.detail.reconnecting', 'Reconnecting…')
              : t('mcpLibrary.detail.reconnect', 'Reconnect')}
          </button>
        </div>
        <div className={styles.lifecycle}>
          <button type='button' className={`${styles.btn2} ${styles.btn2Danger}`} onClick={confirmRemove}>
            <Trash2 size={14} />
            {t('mcpLibrary.detail.remove', 'Remove connector')}
          </button>
        </div>
        <div className={styles.note}>
          <Info size={13} />
          {t('mcpLibrary.detail.lifecycleNote', 'Disable keeps your sign-in. Remove deletes it.')}
        </div>
      </div>
    );
  };

  // ----- Connection side panel facts -----
  const connRows: { icon: React.ReactNode; key: string; value: React.ReactNode }[] = [
    {
      icon: <Plug size={13} />,
      key: t('mcpLibrary.detail.status', 'Status'),
      value: uiStatus ? <StatusChip status={uiStatus} /> : t('mcpLibrary.detail.notInstalled', 'Not installed'),
    },
    {
      icon: <User size={13} />,
      key: t('mcpLibrary.detail.account', 'Account'),
      value: account,
    },
    {
      icon: <Shield size={13} />,
      key: t('mcpLibrary.detail.auth', 'Auth'),
      value: authLabel(w.auth.method),
    },
    {
      icon: <Radio size={13} />,
      key: t('mcpLibrary.detail.transport', 'Transport'),
      value: transportLabel(transportType),
    },
    {
      icon: <Wrench size={13} />,
      key: t('mcpLibrary.detail.tools', 'Tools'),
      value: String(toolCount),
    },
    {
      icon: <Clock size={13} />,
      key: t('mcpLibrary.detail.lastConnected', 'Last connected'),
      value: syncedAt ?? '—',
    },
  ];

  return (
    <div className={styles.page}>
      {contextHolder}
      <button type='button' className={styles.back} onClick={() => navigate('/settings/mcp-library/browse')}>
        <ArrowLeft size={15} /> {t('mcpLibrary.detail.back', 'MCP Library')}
      </button>

      {/* HERO */}
      <div className={styles.hero}>
        <div className={styles.logo}>
          {safeUrl(w.iconUrl) ? (
            <img
              src={safeUrl(w.iconUrl)}
              alt=''
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector(`.${styles.logoFallback}`)) {
                  const span = document.createElement('span');
                  span.className = styles.logoFallback;
                  span.textContent = entry.title.charAt(0).toUpperCase();
                  parent.appendChild(span);
                }
              }}
            />
          ) : (
            <span className={styles.logoFallback}>{entry.title.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className={styles.heroMeta}>
          <h1 className={styles.heroTitle}>
            {entry.title}
            {w.verifiedAt && <BadgeCheck size={18} className={styles.verifiedTick} />}
          </h1>
          <div className={styles.heroTags}>
            <span className={styles.tag}>{maintainerLabel}</span>
            {primaryCategory && <span className={`${styles.tag} ${styles.tagOutline}`}>{primaryCategory}</span>}
            <span className={styles.tag}>{transportLabel(transportType)}</span>
            <span className={styles.tag}>{authLabel(w.auth.method)}</span>
          </div>
          <p className={styles.heroTagline}>{entry.description}</p>
        </div>
        {renderAction()}
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type='button'
            className={`${styles.tab} ${activeTab === tb.key ? styles.tabActive : ''}`}
            onClick={() => setTab(tb.key)}
          >
            {tb.label}
            {tb.count !== undefined && <span className={styles.tabCount}>{tb.count}</span>}
          </button>
        ))}
      </div>

      <div className={styles.cols}>
        <div className={styles.colMain}>
          {activeTab === 'overview' && (
            <>
              <h2 className={styles.hSec}>{t('mcpLibrary.detail.whatItDoes', 'What it does')}</h2>
              <div className={styles.prose}>
                <p>{entry.description}</p>
                {estMinutes ? (
                  <p>
                    {t('mcpLibrary.detail.setupIntro', 'Setup takes about {{minutes}} minutes.', {
                      minutes: estMinutes,
                    })}
                  </p>
                ) : null}
              </div>
            </>
          )}

          {activeTab === 'tools' && (
            <>
              <h2 className={styles.hSec}>{t('mcpLibrary.detail.toolsHeading', 'Tools')}</h2>
              {installedServer?.tools && installedServer.tools.length > 0 ? (
                installedServer.tools.map((tool) => (
                  <div key={tool.name} className={styles.tool}>
                    <div>
                      <div className={styles.toolName}>{tool.name}</div>
                      {tool.description && <div className={styles.toolDesc}>{tool.description}</div>}
                    </div>
                  </div>
                ))
              ) : w.toolGroups && w.toolGroups.length > 0 ? (
                w.toolGroups.map((g) => (
                  <div key={g.label} className={styles.tool}>
                    <div>
                      <div className={styles.toolName}>{g.label}</div>
                      <div className={styles.toolDesc}>
                        {t('mcpLibrary.detail.toolGroupCount', '{{count}} tools', { count: g.count })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.locked}>{t('mcpLibrary.detail.toolsLocked', 'Install to see its tools.')}</p>
              )}
            </>
          )}

          {activeTab === 'setup-guide' && (
            <>
              <h2 className={styles.hSec}>{t('mcpLibrary.detail.setupHeading', 'Setup guide')}</h2>
              {isReady && (
                <div className={styles.setupSuccess} role='status'>
                  <Check size={16} />
                  <span>
                    {t('mcpLibrary.install.setupComplete', '{{name}} is connected and ready. Ask any chat to use it.', {
                      name: entry.title,
                    })}
                  </span>
                </div>
              )}
              {guide ? (
                <SetupGuide
                  guide={guide}
                  envValues={env}
                  onEnvChange={(name, value) => setEnv((prev) => ({ ...prev, [name]: value }))}
                  onPrimary={(action) => void onPrimary(action)}
                  completedStepIds={completedStepIds}
                  fallbackAction={stepFallbackAction}
                />
              ) : (
                <p className={styles.locked}>
                  {t('mcpLibrary.detail.noGuide', 'This connector installs in one click — no setup steps.')}
                </p>
              )}
              {showFallbackConnect && (
                <div className={styles.connectBar}>
                  <button
                    type='button'
                    className={styles.btnPrimary}
                    onClick={() => void onPrimary(isApiKey ? 'api-key-save' : 'oauth-flow')}
                    disabled={installing || oauthInFlight}
                  >
                    {isApiKey ? <Plug size={16} /> : <LogIn size={16} />}
                    {isApiKey
                      ? installing
                        ? t('mcpLibrary.detail.connecting', 'Connecting…')
                        : t('mcpLibrary.detail.saveConnect', 'Save & connect')
                      : oauthInFlight
                        ? t('mcpLibrary.detail.signingIn', 'Signing in…')
                        : t('mcpLibrary.detail.signInWith', 'Sign in with {{provider}}', {
                            provider: w.auth.providerName ?? entry.title,
                          })}
                  </button>
                  {!isApiKey && oauthInFlight && installedServer && (
                    <button type='button' className={styles.btn2} onClick={() => void cancelOAuth(installedServer)}>
                      {t('mcpLibrary.detail.cancelSignIn', 'Cancel')}
                    </button>
                  )}
                  {isApiKey && (
                    <span className={styles.connectHint}>
                      {t('mcpLibrary.detail.saveConnectHint', 'Paste your key above, then connect.')}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'permissions' && (
            <>
              <h2 className={styles.hSec}>{t('mcpLibrary.detail.permissionsHeading', 'What it can access')}</h2>
              {w.auth.scopes && w.auth.scopes.length > 0 ? (
                w.auth.scopes.map((s) => (
                  <div key={s.name} className={styles.tool}>
                    <div>
                      <div className={styles.toolName}>{s.name}</div>
                      <div className={styles.toolDesc}>{s.plainLanguage}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.locked}>
                  {t('mcpLibrary.detail.noPermissions', 'No special permissions requested.')}
                </p>
              )}
            </>
          )}
        </div>

        <aside className={styles.colSide}>
          {installed && installedServer && (
            <div className={styles.panel}>
              <h3>{t('mcpLibrary.detail.connectionPanel', 'Connection')}</h3>
              {connRows.map((row) => (
                <div key={row.key} className={styles.kv}>
                  <span className={styles.kvKey}>
                    {row.icon}
                    {row.key}
                  </span>
                  <span className={styles.kvVal}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {installed && (
            <div className={styles.panel}>
              <h3>{t('mcpLibrary.detail.availableTo', 'Available to')}</h3>
              {syncedAgents.length > 0 ? (
                <div className={styles.agentBadges}>
                  {syncedAgents.map((source) => {
                    const ag = agentDisplay(source);
                    return (
                      <span key={source} className={styles.agentBadge}>
                        <span className={styles.agentAvatar}>{ag.initials}</span>
                        {ag.name}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.availableEmpty}>
                  {t('mcpLibrary.detail.availableEmpty', 'Not synced to any agent yet.')}
                </p>
              )}
              <p className={styles.availableNote}>
                {t('mcpLibrary.detail.availableNote', 'Connectors are available to all your agents while enabled.')}
              </p>
            </div>
          )}

          {(safeUrl(entry.websiteUrl) || safeUrl(entry.repository?.url) || safeUrl(w.auth.providerSignupUrl)) && (
            <div className={styles.panel}>
              <h3>{t('mcpLibrary.detail.links', 'Links')}</h3>
              {safeUrl(entry.websiteUrl) && (
                <button type='button' className={styles.link} onClick={() => openUrl(entry.websiteUrl)}>
                  <ExternalLink size={14} />
                  {t('mcpLibrary.detail.linkWebsite', 'Website')}
                </button>
              )}
              {safeUrl(entry.repository?.url) && (
                <button type='button' className={styles.link} onClick={() => openUrl(entry.repository?.url)}>
                  <ExternalLink size={14} />
                  {t('mcpLibrary.detail.linkSource', 'Source repository')}
                </button>
              )}
              {safeUrl(w.auth.providerSignupUrl) && (
                <button type='button' className={styles.link} onClick={() => openUrl(w.auth.providerSignupUrl)}>
                  <Shield size={14} />
                  {t('mcpLibrary.detail.linkSignup', 'Create an account')}
                </button>
              )}
            </div>
          )}
        </aside>
      </div>

      <ByoCredentialsModal
        visible={byoModal.visible}
        vendorName={entry.title}
        redirectUri={byoModal.redirectUri}
        vendorHint={
          (w.auth.byoClient
            ? {
                registrationUrl: w.auth.byoClient.registrationUrl,
                guide: w.auth.byoClient.guide,
                requiresSecret: w.auth.byoClient.requiresSecret,
              }
            : undefined) as ByoVendorHint | undefined
        }
        onCancel={() => setByoModal({ ...byoModal, visible: false, server: null })}
        onCancelInFlight={() => {
          // Abort the in-flight retry login() (bug #242) and close the modal so
          // the user is never stuck behind a frozen "Save & sign in".
          if (byoModal.server) void cancelOAuth(byoModal.server);
          setByoModal({ ...byoModal, visible: false, server: null });
        }}
        onSubmit={handleByoSubmit}
      />
    </div>
  );
}
