/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TeamsLibraryPage — /teams route. Renders the 24 vendored launchers
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

import { Button, Message } from '@arco-design/web-react';
import { Plus, Upload } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ipcBridge } from '@/common';
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

const TeamsLibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assistants, localeKey } = useAssistantList();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewState | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const { standing, teams } = useMemo(() => {
    const standingList: AssistantListItem[] = [];
    const teamsList: AssistantListItem[] = [];
    for (const assistant of assistants) {
      if (assistant._kind !== 'team') continue;
      if (assistant._standing === true) standingList.push(assistant);
      else teamsList.push(assistant);
    }
    return { standing: standingList, teams: teamsList };
  }, [assistants]);

  const totalTeams = standing.length + teams.length;

  // Synchronous navigation guard — debounces double-clicks on launcher cards
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

  // W4b — Import team flow.
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
        // — check before reading .parsed so the real error surfaces in the
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
      <div className={styles.actionBar} data-testid='teams-action-bar'>
        <div className={styles.actionBarTitleGroup}>
          <h1 className={styles.actionBarTitle}>{t('teams.title', { defaultValue: 'Teams' })}</h1>
          <span className={styles.actionBarSubtitle} data-testid='teams-total-count'>
            {t('teams.totalCount', {
              count: totalTeams,
              defaultValue: '{{count}} teams',
            })}
          </span>
        </div>
        <div className='flex items-center gap-8px'>
          <Button
            type='outline'
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
        </div>
        <input
          ref={fileInputRef}
          type='file'
          accept='.json,application/json'
          onChange={handleFileSelected}
          style={{ display: 'none' }}
          data-testid='teams-import-file-input'
        />
      </div>

      <div className={styles.scroll}>
        {totalTeams === 0 && (
          <div className={styles.emptyState} data-testid='teams-empty-state'>
            {t('teams.emptyState', { defaultValue: 'No teams available yet.' })}
          </div>
        )}

        {standing.length > 0 && (
          <section className={styles.sectionGroup} data-testid='teams-group-standing'>
            <header className={styles.sectionHeader}>
              <span className={`${styles.sectionTitle} ${styles.sectionTitleStanding}`}>
                {t('teams.group.standing', { defaultValue: 'Standing Companies' })}
              </span>
              <span className={styles.sectionHint}>
                {t('teams.group.standingHint', {
                  count: standing.length,
                  defaultValue: '{{count}} — persistent, ritualized orgs that run continuously',
                })}
              </span>
            </header>
            <div className={styles.gridStanding}>
              {standing.map((team) => (
                <TeamCard key={team.id} team={team} localeKey={localeKey} onLaunch={handleLaunchTeam} />
              ))}
            </div>
          </section>
        )}

        {totalTeams > 0 && (
          <section className={styles.sectionGroup} data-testid='teams-group-teams'>
            <header className={styles.sectionHeader}>
              <span className={`${styles.sectionTitle} ${styles.sectionTitleTeams}`}>
                {teams.length > 0
                  ? t('teams.group.teams', { defaultValue: 'Teams' })
                  : t('teams.group.startNew', { defaultValue: 'Start a new team' })}
              </span>
              {teams.length > 0 && (
                <span className={styles.sectionHint}>
                  {t('teams.group.teamsHint', {
                    count: teams.length,
                    defaultValue: '{{count}} — ad-hoc squads for a specific outcome. Spawn, ship, dissolve.',
                  })}
                </span>
              )}
            </header>
            <div className={styles.gridTeams}>
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} localeKey={localeKey} onLaunch={handleLaunchTeam} />
              ))}
              <BuildMyOwnTeamCard onClick={handleBuildMyOwn} />
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
