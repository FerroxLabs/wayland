import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Message, Modal } from '@arco-design/web-react';
import { Blocks } from 'lucide-react';
import PageShell from '@renderer/components/layout/PageShell/PageShell';
import LibrarySectionHeader from '@renderer/components/layout/library/LibrarySectionHeader';
import { useMcpLibrary } from './hooks/useMcpLibrary';
import {
  useMcpServers,
  useMcpAgentStatus,
  useMcpOperations,
  useMcpServerCRUD,
  useMcpOAuth,
} from '@renderer/hooks/mcp';
import { useMcpConnection } from '@renderer/hooks/mcp/useMcpConnection';
import type { IMcpServer } from '@/common/config/storage';
import AddMcpServerModal from '@renderer/pages/settings/components/AddMcpServerModal';
import { McpCard } from './components/McpCard';
import McpLibraryRail, { type McpRailSelection } from './components/McpLibraryRail';
import { McpCardActionsProvider, type McpCardActions } from './components/McpCardActions';
import { deriveStatus, needsAttention, type UIStatus } from './status';
import {
  type CategoryGroupId,
  getCategoryGroup,
  groupsForEntry,
} from './categories';
import type { CatalogIndexEntry } from './types';
import styles from './BrowsePage.module.css';

const PAGE = 24;

export function BrowsePage() {
  const { t } = useTranslation();
  const library = useMcpLibrary();
  const { mcpServers, saveMcpServers } = useMcpServers();
  const navigate = useNavigate();

  const [message, contextHolder] = Message.useMessage();
  const [showAddModal, setShowAddModal] = useState(false);
  const { setAgentInstallStatus, checkSingleServerInstallStatus } = useMcpAgentStatus();
  const { syncMcpToAgents, removeMcpFromAgents } = useMcpOperations(mcpServers, message);
  const { oauthStatus } = useMcpOAuth();
  const crud = useMcpServerCRUD(
    mcpServers,
    saveMcpServers,
    syncMcpToAgents,
    removeMcpFromAgents,
    checkSingleServerInstallStatus,
    setAgentInstallStatus
  );
  const conn = useMcpConnection(mcpServers, saveMcpServers, message);

  const handleAddSubmit = useCallback(
    (serverData: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>) => {
      void crud.handleAddMcpServer(serverData);
    },
    [crud]
  );

  const handleAddBatch = useCallback(
    (servers: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      void crud.handleBatchImportMcpServers(servers);
    },
    [crud]
  );

  const installedIds = useMemo(
    () => new Set(mcpServers.map((s) => s.libraryEntryId).filter(Boolean) as string[]),
    [mcpServers],
  );

  // Health of each installed catalog entry, keyed by its catalog id, so a broken
  // or sign-in-needed connector is flagged right on its Browse card.
  const statusByLibraryId = useMemo(() => {
    const map: Record<string, UIStatus> = {};
    for (const s of mcpServers) {
      if (s.libraryEntryId) map[s.libraryEntryId] = deriveStatus(s, oauthStatus[s.id]);
    }
    return map;
  }, [mcpServers, oauthStatus]);

  // Installed server per catalog id, so a card can offer its quick on/off
  // toggle + right-click lifecycle menu.
  const serverByLibraryId = useMemo(() => {
    const map = new Map<string, IMcpServer>();
    for (const s of mcpServers) {
      if (s.libraryEntryId) map.set(s.libraryEntryId, s);
    }
    return map;
  }, [mcpServers]);

  const onSelect = useCallback(
    (id: string) => navigate(`/settings/mcp-library/${encodeURIComponent(id)}`),
    [navigate],
  );

  const cardActions = useMemo<McpCardActions>(
    () => ({
      serverFor: (libraryEntryId) => serverByLibraryId.get(libraryEntryId),
      onToggle: (serverId, enabled) => void crud.handleToggleMcpServer(serverId, enabled),
      // Live connection re-probe: re-runs the actual MCP connection test and
      // writes the fresh status/tools back, so a Reconnect actually reconnects.
      onReconnect: (server) => void conn.handleTestMcpConnection(server),
      onConfigure: onSelect,
      onRemove: (serverId) => {
        const target = mcpServers.find((s) => s.id === serverId);
        Modal.confirm({
          title: t('mcpLibrary.card.removeTitle', 'Remove connector?'),
          content: t('mcpLibrary.card.removeBody', 'This removes {{name}} and its config from your agents. You can re-add it any time.', {
            name: target?.name ?? 'this connector',
          }),
          okButtonProps: { status: 'danger' },
          okText: t('mcpLibrary.card.remove', 'Remove'),
          onOk: () => void crud.handleDeleteMcpServer(serverId),
        });
      },
    }),
    // onSelect is a stable navigate wrapper; crud/conn/mcpServers/t cover the rest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverByLibraryId, crud, conn, mcpServers, onSelect, t],
  );

  // ---- View state: rail selection + free-text search + page window ----
  const [active, setActive] = useState<McpRailSelection>({ kind: 'all' });
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE);

  // A new view (rail pick or search edit) always starts from the first page.
  useEffect(() => {
    setShown(PAGE);
  }, [active, search]);

  const handleRailSelect = useCallback((sel: McpRailSelection) => {
    setActive(sel);
    setSearch('');
  }, []);

  // ---- Rail counts (union over a connector's category groups) ----
  const railCounts = useMemo(() => {
    let installed = 0;
    let attention = 0;
    const byGroup: Partial<Record<CategoryGroupId, number>> = {};
    for (const e of library.entries) {
      if (installedIds.has(e.id)) {
        installed++;
        const st = statusByLibraryId[e.id];
        if (st !== undefined && needsAttention(st)) attention++;
      }
      for (const gid of groupsForEntry(e)) {
        byGroup[gid] = (byGroup[gid] ?? 0) + 1;
      }
    }
    return { all: library.entries.length, installed, attention, byGroup };
  }, [library.entries, installedIds, statusByLibraryId]);

  // ---- View selection: compute the popular hero + the paginated list ----
  const RECIDS = useMemo(
    () => new Set(library.recommended.map((e) => e.id)),
    [library.recommended],
  );

  const installedEntries = useMemo(
    () => library.entries.filter((e) => installedIds.has(e.id)),
    [library.entries, installedIds],
  );

  const view = useMemo(() => {
    const q = search.trim();

    if (q !== '') {
      const ql = q.toLowerCase();
      const list = library.entries.filter((e) => {
        const haystack = [
          e.name,
          e.shortDescription,
          groupsForEntry(e).map((id) => getCategoryGroup(id).label).join(' '),
          e.maintainerType,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(ql);
      });
      return {
        popularVisible: false,
        headerLabel: t('mcpLibrary.browse.resultsFor', 'Results for “{{q}}”', { q }),
        list,
      };
    }

    if (active.kind === 'all') {
      return {
        popularVisible: true,
        headerLabel: t('mcpLibrary.browse.all', 'All connectors'),
        // Exclude the Popular six from "All connectors" so they appear once.
        list: library.entries.filter((e) => !RECIDS.has(e.id)),
      };
    }

    if (active.kind === 'status') {
      if (active.value === 'installed') {
        return {
          popularVisible: false,
          headerLabel: t('mcpLibrary.browse.installed', 'Installed'),
          list: installedEntries,
        };
      }
      // active.value === 'attention'
      return {
        popularVisible: false,
        headerLabel: t('mcpLibrary.browse.actionNeeded', 'Action needed'),
        list: installedEntries.filter((e) => {
          const st = statusByLibraryId[e.id];
          return st !== undefined && needsAttention(st);
        }),
      };
    }

    // active.kind === 'category'
    const groupId = active.value;
    return {
      popularVisible: false,
      headerLabel: t('mcpLibrary.category.' + groupId, getCategoryGroup(groupId).label),
      list: library.entries.filter((e) => groupsForEntry(e).includes(groupId)),
    };
  }, [search, active, library.entries, RECIDS, installedEntries, statusByLibraryId, t]);

  const visible = useMemo(() => view.list.slice(0, shown), [view.list, shown]);

  const renderCard = useCallback(
    (e: CatalogIndexEntry, isPopular: boolean) => (
      <McpCard
        key={e.id}
        entry={e}
        installed={installedIds.has(e.id)}
        status={statusByLibraryId[e.id]}
        featured={isPopular}
        onClick={() => onSelect(e.id)}
      />
    ),
    [installedIds, statusByLibraryId, onSelect],
  );

  const actions = (
    <Button type="primary" onClick={() => setShowAddModal(true)}>
      {t('mcpLibrary.browse.addCustom', 'Add custom server')}
    </Button>
  );

  return (
    <>
      {contextHolder}
      <PageShell
        title={t('mcpLibrary.browse.title', 'MCP Library')}
        icon={<Blocks size={20} />}
        countLabel={t('mcpLibrary.browse.count', '{{n}} connectors', { n: library.entries.length })}
        subtitle={t(
          'mcpLibrary.browse.subtitle',
          'Connect Wayland to the tools you already use. One click to install, a switch to turn it on or off.',
        )}
        actions={actions}
        width='full'
        filterRail={
          <McpLibraryRail
            search={search}
            onSearch={setSearch}
            counts={railCounts}
            active={active}
            onSelect={handleRailSelect}
          />
        }
      >
        <McpCardActionsProvider value={cardActions}>
          <div className={styles.content}>
            {view.popularVisible && library.recommended.length > 0 ? (
              <div>
                <LibrarySectionHeader
                  variant='primary'
                  label={t('mcpLibrary.browse.popular', 'Popular')}
                  hint={t('mcpLibrary.browse.popularHint', 'The connectors most people start with')}
                />
                <div className={styles.grid}>
                  {library.recommended.map((e) => renderCard(e, true))}
                </div>
              </div>
            ) : null}

            <div>
              <LibrarySectionHeader label={view.headerLabel} count={view.list.length} />
              {view.list.length === 0 ? (
                <div className={styles.empty}>
                  {t('mcpLibrary.browse.empty', 'No connectors match.')}
                </div>
              ) : (
                <>
                  <div className={styles.grid}>{visible.map((e) => renderCard(e, false))}</div>
                  {view.list.length > shown ? (
                    <div className={styles.showMore}>
                      <Button
                        type='outline'
                        onClick={() => setShown((s) => s + PAGE)}
                      >
                        {t('mcpLibrary.browse.showMore', 'Show more')}
                      </Button>
                      <span className={styles.showMoreCount}>
                        {t('mcpLibrary.browse.showMoreCount', '({{shown}} of {{total}})', {
                          shown,
                          total: view.list.length,
                        })}
                      </span>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </McpCardActionsProvider>
      </PageShell>

      <AddMcpServerModal
        visible={showAddModal}
        onCancel={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        onBatchImport={handleAddBatch}
      />
    </>
  );
}
