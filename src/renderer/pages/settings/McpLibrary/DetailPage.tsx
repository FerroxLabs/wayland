import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Message } from '@arco-design/web-react';
import { Check, ExternalLink } from 'lucide-react';
import {
  useMcpServers,
  useMcpAgentStatus,
  useMcpOperations,
  useMcpOAuth,
  useMcpServerCRUD,
} from '@renderer/hooks/mcp';
import type { IMcpServer, IMcpServerTransport } from '@/common/config/storage';
import { useMcpLibrary } from './hooks/useMcpLibrary';
import { SetupGuide } from './components/SetupGuide';
import { TierBadge } from './components/TierBadge';
import { MaintainerBadge } from './components/MaintainerBadge';
import type { CatalogEntry } from './types';

type Tab = 'overview' | 'setup-guide' | 'tools' | 'permissions' | 'changelog';

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

// Catalog uses hyphenated transport types ('streamable-http'); storage uses
// underscored ('streamable_http'). Normalize between them to avoid invalid
// transport.type values reaching the connection layer.
function normalizeRemoteType(t: string): 'sse' | 'http' | 'streamable_http' {
  if (t === 'streamable-http' || t === 'streamable_http') return 'streamable_http';
  if (t === 'sse') return 'sse';
  return 'http';
}

function entryToServerData(
  entry: CatalogEntry,
  envValues: Record<string, string>,
): Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'> {
  const pkg = entry.packages.length > 0 ? entry.packages[0] : undefined;
  const remote = entry.remotes && entry.remotes.length > 0 ? entry.remotes[0] : undefined;

  if (!pkg && !remote) {
    throw new Error(`Catalog entry ${entry.name} has no installable target.`);
  }

  // Prefer remote (hosted MCP) if both are present — no local spawn required.
  const transport: IMcpServerTransport = remote
    ? {
        type: normalizeRemoteType(remote.type),
        url: remote.url,
        ...(remote.headers && remote.headers.length > 0
          ? { headers: Object.fromEntries(remote.headers.map((h) => [h.name, h.value])) }
          : {}),
      }
    : pkg!.runtimeHint === 'native'
      ? {
          // Bundled @wayland MCP: spawn via the local Node runtime against the
          // bare bundle filename. The main-process spawn layer
          // (McpProtocol.testStdioConnection) rewrites args[0] to an absolute
          // path under out/main (dev) or app.asar.unpacked/out/main (prod).
          type: 'stdio',
          command: 'node',
          args: [pkg!.identifier],
          env: envValues,
        }
      : {
          type: 'stdio',
          command: pkg!.runtimeHint,
          args: pkg!.identifier ? [pkg!.identifier] : [],
          env: envValues,
        };

  return {
    name: entry.name,
    description: entry.description,
    enabled: false,
    transport,
    originalJson: JSON.stringify({ source: 'library', entry: entry.name }),
    source: 'library',
    libraryEntryId: entry.name,
  };
}

export function DetailPage() {
  const { t } = useTranslation();
  const { entryId } = useParams<{ entryId: string }>();
  const id = decodeURIComponent(entryId ?? '');
  const navigate = useNavigate();
  const library = useMcpLibrary();

  const [message, contextHolder] = Message.useMessage();
  const { mcpServers, saveMcpServers } = useMcpServers();
  const { setAgentInstallStatus, checkSingleServerInstallStatus } = useMcpAgentStatus();
  const { syncMcpToAgents, removeMcpFromAgents } = useMcpOperations(mcpServers, message);
  const { login, loggingIn } = useMcpOAuth();
  const crud = useMcpServerCRUD(
    mcpServers,
    saveMcpServers,
    syncMcpToAgents,
    removeMcpFromAgents,
    checkSingleServerInstallStatus,
    setAgentInstallStatus,
  );

  const entry = useMemo(() => library.getEntry(id), [library, id]);
  const guide = useMemo(
    () => (entry?.['x-wayland'].setupGuide ? library.getGuide(id) : null),
    [library, id, entry],
  );
  const installed = mcpServers.some((s) => s.libraryEntryId === id);
  const installedServer = useMemo(
    () => mcpServers.find((s) => s.libraryEntryId === id),
    [mcpServers, id],
  );

  const [tab, setTab] = useState<Tab>('setup-guide');
  const [env, setEnv] = useState<Record<string, string>>({});
  const [installing, setInstalling] = useState(false);

  if (!entry) return <div className="mcp-detail-page">Unknown entry: {id}</div>;

  const w = entry['x-wayland'];

  const install = async (): Promise<IMcpServer | null> => {
    setInstalling(true);
    try {
      const serverData = entryToServerData(entry, env);
      const newServer = await crud.handleAddMcpServer(serverData);
      if (!newServer) {
        message.error(
          t('mcpLibrary.install.errorFailed', 'Install failed: {{error}}', {
            error: 'unknown',
          }),
        );
        return null;
      }
      message.success(
        t('mcpLibrary.install.successAdded', '{{name}} added to library.', {
          name: entry.title,
        }),
      );
      return newServer;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      message.error(
        t('mcpLibrary.install.errorFailed', 'Install failed: {{error}}', { error: msg }),
      );
      return null;
    } finally {
      setInstalling(false);
    }
  };

  const onPrimary = async (action: string) => {
    // Install first (or reuse the existing server if already installed), then
    // trigger OAuth for entries whose setup guide emits an 'oauth-flow' action.
    if (action !== 'oauth-flow') return;

    let server: IMcpServer | null = installedServer ?? null;
    if (!server) {
      server = await install();
      if (!server) return;
    }

    const result = await login(server);
    if (!result.success) {
      message.error(
        t('mcpLibrary.install.oauthFailed', 'Authorization failed: {{error}}', {
          error: result.error ?? 'unknown',
        }),
      );
      return;
    }
    message.success(t('mcpLibrary.install.oauthSuccess', 'Authorized.'));
  };

  const installLabel = installed
    ? t('mcpLibrary.install.installed', 'Installed')
    : installing
      ? t('mcpLibrary.install.installing', 'Installing…')
      : t('mcpLibrary.install.button', 'Install');

  const oauthInFlight = installedServer ? !!loggingIn[installedServer.id] : false;

  return (
    <div className="mcp-detail-page">
      {contextHolder}
      <button
        className="mcp-back"
        onClick={() => navigate('/settings/mcp-library/browse')}
      >
        ← MCP Library
      </button>

      <header className="mcp-detail-head">
        {safeUrl(w.iconUrl) && (
          <img className="mcp-detail-logo" src={safeUrl(w.iconUrl)} alt="" />
        )}
        <div>
          <h1>{entry.title}</h1>
          {w.verifiedAt && (
            <span className="mcp-verified-pill">
              <Check size={12} /> Wayland verified
            </span>
          )}
          <div className="mcp-detail-pub">
            {safeUrl(entry.websiteUrl) ? (
              <a href={safeUrl(entry.websiteUrl)} target="_blank" rel="noreferrer">
                {entry.name}
              </a>
            ) : (
              <span>{entry.name}</span>
            )}{' '}
            · v{entry.version} · {w.license ?? '—'}
          </div>
          <p className="mcp-detail-tagline">{entry.description}</p>
        </div>
        <div className="mcp-detail-actions">
          <button
            className="mcp-btn-primary"
            onClick={() => void install()}
            disabled={installed || installing || oauthInFlight}
          >
            {installLabel}
          </button>
          {safeUrl(entry.websiteUrl) && (
            <a
              className="mcp-btn"
              href={safeUrl(entry.websiteUrl)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={12} /> View source
            </a>
          )}
        </div>
      </header>

      <div className="mcp-tabs">
        {(['overview', 'setup-guide', 'tools', 'permissions', 'changelog'] as Tab[]).map(
          (tabKey) => (
            <button
              key={tabKey}
              className={`mcp-tab ${tab === tabKey ? 'is-active' : ''}`}
              onClick={() => setTab(tabKey)}
            >
              {tabKey.replace('-', ' ').replace(/^./, (c) => c.toUpperCase())}
            </button>
          ),
        )}
      </div>

      <div className="mcp-detail-body">
        {tab === 'setup-guide' && guide && (
          <SetupGuide
            guide={guide}
            envValues={env}
            onEnvChange={(name, value) =>
              setEnv((prev) => ({ ...prev, [name]: value }))
            }
            onPrimary={(action) => void onPrimary(action)}
          />
        )}
        {tab === 'tools' && (
          <ul className="mcp-tool-groups">
            {w.toolGroups?.map((g) => (
              <li key={g.label}>
                <b>{g.label}</b> · {g.count} tools
              </li>
            ))}
          </ul>
        )}
        {tab === 'permissions' && w.auth.scopes && (
          <ul className="mcp-scope-list">
            {w.auth.scopes.map((s) => (
              <li key={s.name}>
                <code>{s.name}</code> — {s.plainLanguage}
              </li>
            ))}
          </ul>
        )}
        {tab === 'overview' && (
          <div className="mcp-overview">
            <div>
              <TierBadge tier={w.tier} /> <MaintainerBadge type={w.maintainerType} />
            </div>
            <dl>
              <dt>Transport</dt>
              <dd>
                {entry.packages[0]?.transport.type ??
                  entry.remotes?.[0]?.type ??
                  '—'}
              </dd>
              <dt>Runtime</dt>
              <dd>{entry.packages[0]?.runtimeHint ?? 'hosted'}</dd>
              <dt>Platforms</dt>
              <dd>{(w.platforms ?? ['all']).join(', ')}</dd>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
