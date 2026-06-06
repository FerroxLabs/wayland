/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TeamsLibraryPage - /teams route. Renders the 24 vendored launchers
 * (kind === 'team') split into Standing Companies (5, _standing === true)
 * and ad-hoc Teams (19). Mirrors AssistantsLibraryPage's launch flow:
 * clicking a team card navigates to /teams/<id>/launch (the launcher
 * screen W2b will fill in). Clicking Build my own → /teams/new.
 *
 * Source of truth for the team list: useAssistantList() (same hook
 * /assistants uses). We filter to kind === 'team' here; /assistants
 * filters the opposite direction (see AssistantsLibraryPage T2a.4).
 *
 * Known follow-up: useAssistantList() does not expose a loading flag, so
 * on a cold load there's a brief moment before extension-contributed
 * assistants resolve where totalTeams === 0 and the empty state flashes.
 * Subsequent navigations are cached by useSWR so the flash only happens
 * on cold app start. Fix requires adding `isLoading` to useAssistantList
 * (shared with /assistants); tracked for next bundle-rendering refactor.
 */

import { Button, Input, Message, Select } from '@arco-design/web-react';
import { Plus, Search, Upload } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ipcBridge } from '@/common';
import { LibraryPageHeader, LibrarySectionHeader } from '@/renderer/components/layout/library';
import { useAuth } from '@/renderer/hooks/context/AuthContext';
import { useAssistantList } from '@/renderer/hooks/assistant';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import type { TeamExport } from '@process/team/importExport/TeamExportSchema';
import BuildMyOwnTeamCard from './components/BuildMyOwnTeamCard';
import CapabilityReviewModal, {
  type TeamCapabilities,
} from './components/CapabilityReviewModal';
import TeamCard from './components/TeamCard';
import styles from './TeamsLibraryPage.module.css';

type ImportPreviewState = {
  parsed: TeamExport;
  capabilities: TeamCapabilities;
  missingSpecialists: string[];
  source: string;
};

type TeamSortKey = 'default' | 'name' | 'roles' | 'schedule';

const DAY_ORDER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const resolveTeamName = (team: AssistantListItem, localeKey: string): string =>
  team.nameI18n?.[localeKey] || team.nameI18n?.['en-US'] || team.name || team.id;

// Orders a team by its weekly ritual slot (day-of-week then time). Teams with no
// ritual (most ad-hoc squads) sort to the end. Cadence format: "weekly:friday:17:00".
const scheduleSortKey = (team: AssistantListItem): number => {
  const cadence = team._rituals?.[0]?.cadence;
  if (!cadence) return Number.MAX_SAFE_INTEGER;
  const parts = cadence.toLowerCase().split(':');
  const day = DAY_ORDER[parts[1]] ?? 7;
  const hh = Number.parseInt(parts[2] ?? '0', 10) || 0;
  const mm = Number.parseInt(parts[3] ?? '0', 10) || 0;
  return day * 1440 + hh * 60 + mm;
};

const matchesTeamQuery = (team: AssistantListItem, localeKey: string, query: string): boolean => {
  if (!query) return true;
  const haystack = [
    team.nameI18n?.[localeKey],
    team.nameI18n?.['en-US'],
    team.name,
    team.descriptionI18n?.[localeKey],
    team.descriptionI18n?.['en-US'],
    team.description,
    team.id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
};

const sortTeams = (
  list: AssistantListItem[],
  sortKey: TeamSortKey,
  localeKey: string
): AssistantListItem[] => {
  if (sortKey === 'default') return list;
  const sorted = [...list];
  if (sortKey === 'name') {
    sorted.sort((a, b) => resolveTeamName(a, localeKey).localeCompare(resolveTeamName(b, localeKey)));
  } else if (sortKey === 'roles') {
    sorted.sort((a, b) => (b._teammates?.length ?? 0) - (a._teammates?.length ?? 0));
  } else if (sortKey === 'schedule') {
    sorted.sort((a, b) => scheduleSortKey(a) - scheduleSortKey(b));
  }
  return sorted;
};

const TeamsLibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assistants, localeKey } = useAssistantList();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewState | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<TeamSortKey>('default');

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const hasAnyTeams = useMemo(
    () => assistants.some((assistant) => assistant._kind === 'team'),
    [assistants]
  );

  const { standing, teams } = useMemo(() => {
    const standingList: AssistantListItem[] = [];
    const teamsList: AssistantListItem[] = [];
    for (const assistant of assistants) {
      if (assistant._kind !== 'team') continue;
      if (!matchesTeamQuery(assistant, localeKey, normalizedQuery)) continue;
      if (assistant._standing === true) standingList.push(assistant);
      else teamsList.push(assistant);
    }
    return {
      standing: sortTeams(standingList, sortKey, localeKey),
      teams: sortTeams(teamsList, sortKey, localeKey),
    };
  }, [assistants, localeKey, normalizedQuery, sortKey]);

  const totalTeams = standing.length + teams.length;

  // Synchronous navigation guard - debounces double-clicks on launcher cards
  // so we don't push 2 history entries (Bug from adversarial e2e). The ref
  // resets on every render via the effect below, so a normal sequential
  // user click still works after each navigation completes.
  const navigatingRef = useRef(false);
  const handleLaunchTeam = useCallback(
    (team: AssistantListItem) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;
      void Promise.resolve(navigate(`/teams/${team.id}/launch`)).catch((error) => {
        navigatingRef.current = false;
        console.error('Navigation to team launcher failed:', error);
      });
    },
    [navigate]
  );

  const handleBuildMyOwn = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    void Promise.resolve(navigate('/teams/new')).catch((error) => {
      navigatingRef.current = false;
      console.error('Navigation to team builder failed:', error);
    });
  }, [navigate]);

  // W4b - Import team flow.
  const triggerImportPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Reset the input so picking the same file twice still fires onChange.
      event.target.value = '';
      if (!file) return;
      let jsonText: string;
      try {
        jsonText = await file.text();
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        Message.error(
          `${t('teams.import.fileReadError', { defaultValue: 'Could not read file' })}: ${message}`
        );
        return;
      }
      try {
        // safeProvider returns { __bridgeError } sentinels instead of throwing
        // - check before reading .parsed so the real error surfaces in the
        // toast (otherwise we'd hit "Cannot read property 'parsed' of
        // undefined" and mask the real reason: oversize file, prototype
        // pollution, invalid skill id, etc.). W5 LOW-1.
        const previewRaw = (await ipcBridge.team.importPreview.invoke({ jsonText })) as unknown as {
          parsed?: { capabilities: TeamCapabilities };
          missingSpecialists?: string[];
          __bridgeError?: boolean;
          message?: string;
        };
        if (previewRaw.__bridgeError) {
          throw new Error(previewRaw.message ?? 'Import preview failed');
        }
        if (!previewRaw.parsed) {
          throw new Error('Import preview returned no payload');
        }
        setImportPreview({
          parsed: previewRaw.parsed as ImportPreviewState['parsed'],
          capabilities: previewRaw.parsed.capabilities as TeamCapabilities,
          missingSpecialists: previewRaw.missingSpecialists ?? [],
          source: file.name,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        Message.error(
          `${t('teams.import.error', { defaultValue: 'Failed to import team' })}: ${message}`
        );
      }
    },
    [t]
  );

  const closeImportModal = useCallback(() => {
    setImportPreview(null);
    setImportLoading(false);
  }, []);

  const acceptImport = useCallback(
    async (capabilityGrants: Record<keyof TeamCapabilities, boolean>) => {
      if (!importPreview) return;
      const userId = user?.id ?? 'system_default_user';
      setImportLoading(true);
      try {
        const team = (await ipcBridge.team.importAccept.invoke({
          userId,
          parsed: importPreview.parsed,
          capabilityGrants: capabilityGrants as Record<string, boolean>,
          source: importPreview.source,
        })) as { id?: string; __bridgeError?: boolean; message?: string };
        if (team?.__bridgeError) {
          throw new Error(team.message ?? 'Import failed');
        }
        Message.success(t('teams.import.success', { defaultValue: 'Team imported' }));
        closeImportModal();
        if (team?.id) {
          void Promise.resolve(navigate(`/team/${team.id}`)).catch((error) => {
            console.error('Navigation to imported team failed:', error);
          });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        Message.error(
          `${t('teams.import.error', { defaultValue: 'Failed to import team' })}: ${message}`
        );
        setImportLoading(false);
      }
    },
    [importPreview, user?.id, t, closeImportModal, navigate]
  );

  const handleSandboxImport = useCallback(() => {
    void acceptImport({
      canReadFiles: false,
      canWriteFiles: false,
      canSpawnAgents: false,
      canNetworkRequest: false,
      canCrossTeamMessage: false,
    });
  }, [acceptImport]);

  const handleTrustSelected = useCallback(
    (grants: Record<keyof TeamCapabilities, boolean>) => {
      void acceptImport(grants);
    },
    [acceptImport]
  );

  return (
    <div className={styles.page} data-testid='teams-library-page'>
      <LibraryPageHeader
        title={t('teams.title', { defaultValue: 'Teams' })}
        countLabel={t('teams.totalCount', { count: totalTeams, defaultValue: '{{count}} teams' })}
        testId='teams-action-bar'
        countTestId='teams-total-count'
      >
        <Button
          type='secondary'
          icon={<Upload size={14} />}
          onClick={triggerImportPicker}
          data-testid='teams-import-cta'
        >
          {t('teams.import.button', { defaultValue: 'Import team' })}
        </Button>
        <Button
          type='primary'
          icon={<Plus size={14} />}
          onClick={handleBuildMyOwn}
          data-testid='teams-build-my-own-cta'
        >
          {t('teams.buildMyOwn.cta', { defaultValue: 'Build my own team' })}
        </Button>
      </LibraryPageHeader>
      <input
        ref={fileInputRef}
        type='file'
        accept='.json,application/json'
        onChange={handleFileSelected}
        style={{ display: 'none' }}
        data-testid='teams-import-file-input'
      />

      <div className={styles.scroll}>
        {hasAnyTeams && (
          <div className={styles.controls} data-testid='teams-controls'>
            <Input
              className={styles.search}
              allowClear
              prefix={<Search size={15} />}
              placeholder={t('teams.controls.searchPlaceholder', { defaultValue: 'Search teams' })}
              value={query}
              onChange={setQuery}
              data-testid='teams-search-input'
            />
            <div className={styles.sortControl}>
              <span className={styles.sortLabel}>
                {t('teams.controls.sortLabel', { defaultValue: 'Sort' })}
              </span>
              <Select
                className={styles.sortSelect}
                value={sortKey}
                onChange={(value) => setSortKey(value as TeamSortKey)}
                data-testid='teams-sort-select'
              >
                <Select.Option value='default'>
                  {t('teams.sort.default', { defaultValue: 'Default' })}
                </Select.Option>
                <Select.Option value='name'>
                  {t('teams.sort.name', { defaultValue: 'Name (A-Z)' })}
                </Select.Option>
                <Select.Option value='roles'>
                  {t('teams.sort.roles', { defaultValue: 'Most roles' })}
                </Select.Option>
                <Select.Option value='schedule'>
                  {t('teams.sort.schedule', { defaultValue: 'Schedule' })}
                </Select.Option>
              </Select>
            </div>
          </div>
        )}

        {!hasAnyTeams && (
          <div className={styles.emptyState} data-testid='teams-empty-state'>
            {t('teams.emptyState', { defaultValue: 'No teams available yet.' })}
          </div>
        )}

        {hasAnyTeams && totalTeams === 0 && (
          <div className={styles.emptyState} data-testid='teams-no-results'>
            {t('teams.noResults', { defaultValue: 'No teams match your search.' })}
          </div>
        )}

        {standing.length > 0 && (
          <section className={styles.sectionGroup} data-testid='teams-group-standing'>
            <LibrarySectionHeader
              label={t('teams.group.standing', { defaultValue: 'Standing Companies' })}
              variant='tier'
              hint={t('teams.group.standingHint', {
                count: standing.length,
                defaultValue: '{{count}} - persistent, ritualized orgs that run continuously',
              })}
            />
            <div className={styles.gridStanding}>
              {standing.map((team) => (
                <TeamCard key={team.id} team={team} localeKey={localeKey} onLaunch={handleLaunchTeam} />
              ))}
            </div>
          </section>
        )}

        {hasAnyTeams && (teams.length > 0 || !isSearching) && (
          <section className={styles.sectionGroup} data-testid='teams-group-teams'>
            <LibrarySectionHeader
              label={
                teams.length > 0
                  ? t('teams.group.teams', { defaultValue: 'Teams' })
                  : t('teams.group.startNew', { defaultValue: 'Start a new team' })
              }
              hint={
                teams.length > 0
                  ? t('teams.group.teamsHint', {
                      count: teams.length,
                      defaultValue: '{{count}} - ad-hoc squads for a specific outcome. Spawn, ship, dissolve.',
                    })
                  : undefined
              }
            />
            <div className={styles.gridTeams}>
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} localeKey={localeKey} onLaunch={handleLaunchTeam} />
              ))}
              {!isSearching && <BuildMyOwnTeamCard onClick={handleBuildMyOwn} />}
            </div>
          </section>
        )}
      </div>
      {importPreview && (
        <CapabilityReviewModal
          visible={true}
          teamName={importPreview.parsed.name}
          importSource={importPreview.source}
          capabilities={importPreview.capabilities}
          missingSpecialists={importPreview.missingSpecialists}
          loading={importLoading}
          onTrustSelected={handleTrustSelected}
          onSandboxImport={handleSandboxImport}
          onCancel={closeImportModal}
        />
      )}
    </div>
  );
};

export default TeamsLibraryPage;
