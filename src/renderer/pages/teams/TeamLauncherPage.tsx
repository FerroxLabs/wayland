/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TeamLauncherPage - handles both pre-configured (`/teams/:teamId/launch`)
 * and build-my-own (`/teams/new`) flows from a single component. State shape:
 *
 *   { name, leader, teammates, goalText? }
 *
 * Pre-configured load reads the bundle launcher's `_teammates` array,
 * promotes the first specialist to leader and the remainder to teammates.
 * Build-my-own starts empty; the user picks a leader, adds teammates, and
 * the optional goal text-box is a placeholder for W3c.
 *
 * Launch CTA invokes `ipcBridge.team.create.invoke` with a single
 * `agents: TeamAgent[]` array (leader first, teammates after). The existing
 * IPC contract already accepts the full agents array - no schema change
 * needed for W2b. Runtime spawn / addAgent happens inside TeamSessionService.
 *
 * On success, navigates to `/team/${teamId}` (singular - the active team
 * page registered in Router.tsx).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Message } from '@arco-design/web-react';
import { ArrowLeft, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ipcBridge } from '@/common';
import { CUSTOM_AVATAR_IMAGE_MAP } from '@/renderer/pages/guid/constants';
import { useAssistantList } from '@/renderer/hooks/assistant';
import { useAvailableBackends } from '@/renderer/hooks/assistant/useAvailableBackends';
import { useAuth } from '@/renderer/hooks/context/AuthContext';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import { isSelectableSpecialist } from '@/renderer/pages/settings/AssistantSettings/assistantUtils';
import type { TTeam, TeamAgent } from '@/common/types/teamTypes';
import type {
  SuggestRosterResult,
  SuggestSpecialist,
} from '@process/team/suggestRoster';
import { resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { isImageAvatar } from '@/renderer/utils/avatar';
import AssistantIconTile from '@/renderer/pages/guid/components/AssistantIconTile';
import { resolveConversationType } from '../team/components/agentSelectUtils';
import AddTeammatePicker from './components/AddTeammatePicker';
import LauncherRosterTable, { type RosterEntry } from './components/LauncherRosterTable';
import { resolveTeamPalette } from './components/teamPalette';
import styles from './TeamLauncherPage.module.css';

type LauncherState = {
  name: string;
  leader: RosterEntry | null;
  teammates: RosterEntry[];
  goalText: string;
};

const SPECIALIST_PREFIX = 'ext-';
const BUILTIN_PREFIX = 'builtin-';

/**
 * Candidate stored assistant ids for a raw team/specialist id taken from a URL
 * param or a launcher's `_teammates` list. Native catalog records are stored as
 * `builtin-<slug>`, custom user records as `ext-<slug>`, while the URL/teammate
 * value may carry the full id OR a bare slug. Match the id as-is first, then try
 * each prefix. The previous code assumed a single `ext-` prefix, which
 * double-prefixed `builtin-` teams (`ext-builtin-...`) so EVERY native team
 * failed to load ("Failed to load this team.").
 */
function idCandidates(raw: string): string[] {
  if (raw.startsWith(SPECIALIST_PREFIX) || raw.startsWith(BUILTIN_PREFIX)) return [raw];
  return [raw, `${BUILTIN_PREFIX}${raw}`, `${SPECIALIST_PREFIX}${raw}`];
}

const TeamLauncherPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId?: string }>();
  const { user } = useAuth();
  const { assistants, localeKey } = useAssistantList();
  const { available, recommend } = useAvailableBackends();

  const isBuildMyOwn = !teamId;

  // Lookup tables. Custom user-created Specialists must be selectable too (#115),
  // not only the native/vendored ones tagged `_kind === 'specialist'`.
  const specialists = useMemo(() => assistants.filter(isSelectableSpecialist), [assistants]);

  // Identity-resolution map over the FULL assistant list (not just selectable
  // specialists). Some native team rosters (e.g. Book Publishing House) list
  // teammates that are generic ASSISTANT_PRESETS stored as `builtin-<slug>`
  // with no `kind` - `isSelectableSpecialist` filters those out, so they were
  // absent from this map and the roster + launched team fell back to showing
  // their raw id (#A1). Building the lookup from the full list resolves their
  // friendly name without making the 31 generic presets selectable in the
  // picker (which reads the separate `specialists` array below).
  const specialistsById = useMemo(() => {
    const map = new Map<string, AssistantListItem>();
    for (const a of assistants) map.set(a.id, a);
    return map;
  }, [assistants]);

  const launcher = useMemo<AssistantListItem | null>(() => {
    if (!teamId) return null;
    // TeamsLibraryPage navigates with the assistant's real stored id
    // (`/teams/${team.id}/launch`), which is `builtin-<slug>` for native teams
    // and `ext-<slug>` for custom ones; older call sites may pass a bare slug.
    // Match across all id shapes so the launcher resolves in every flow.
    const candidates = idCandidates(teamId);
    return assistants.find((a) => a._kind === 'team' && candidates.includes(a.id)) ?? null;
  }, [assistants, teamId]);

  // Hydrate initial state from URL params + bundle.
  const initialState = useMemo<LauncherState>(() => {
    if (isBuildMyOwn) {
      return { name: '', leader: null, teammates: [], goalText: '' };
    }
    if (!launcher) {
      return { name: '', leader: null, teammates: [], goalText: '' };
    }
    const launcherName =
      launcher.nameI18n?.[localeKey] || launcher.nameI18n?.['en-US'] || launcher.name || teamId || '';
    const teammateIds = launcher._teammates ?? [];

    let leader: RosterEntry | null = null;
    const teammates: RosterEntry[] = [];
    for (const rawId of teammateIds) {
      // Native team rosters list teammates by bare slug; the stored specialist
      // id is `builtin-<slug>`. Resolve across id shapes (same fix as the
      // launcher lookup) so built-in teammates bind to their real specialist.
      const candidates = idCandidates(rawId);
      const spec = candidates.map((c) => specialistsById.get(c)).find(Boolean);
      const specialistId = spec?.id ?? (rawId.startsWith(SPECIALIST_PREFIX) ? rawId : `${SPECIALIST_PREFIX}${rawId}`);
      const backend = recommend(spec?.presetAgentType);
      const entry: RosterEntry = { specialistId, backend, slotName: '' };
      if (!leader) leader = entry;
      else teammates.push(entry);
    }
    return { name: launcherName, leader, teammates, goalText: '' };
  }, [isBuildMyOwn, launcher, localeKey, recommend, specialistsById, teamId]);

  const [state, setState] = useState<LauncherState>(initialState);
  // Re-hydrate state when the bundle resolves async on cold start. We only
  // overwrite while the user hasn't touched the form yet, so live edits are
  // never clobbered when extension data arrives.
  const userTouchedRef = useRef(false);
  useEffect(() => {
    if (userTouchedRef.current) return;
    setState(initialState);
  }, [initialState]);
  const markTouched = useCallback(() => {
    userTouchedRef.current = true;
  }, []);

  const [launching, setLaunching] = useState(false);
  // Synchronous guard against double-launch - `launching` state lags by a
  // microtask, so triple-clicking the CTA before the first IPC starts
  // (Bug from adversarial e2e: rapid-click → 2 teams). The ref flips
  // immediately, the state flips for the spinner UI.
  const launchingRef = useRef(false);
  const [suggesting, setSuggesting] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'leader' | 'teammate'>('teammate');

  const excludeIds = useMemo(() => {
    const ids: string[] = [];
    if (state.leader) ids.push(state.leader.specialistId);
    for (const tm of state.teammates) ids.push(tm.specialistId);
    return ids;
  }, [state.leader, state.teammates]);

  // Mutators - every edit marks userTouched so the rehydration effect bows out.
  const handleNameChange = (next: string) => {
    markTouched();
    setState((s) => ({ ...s, name: next }));
  };
  const handleGoalChange = (next: string) => {
    markTouched();
    setState((s) => ({ ...s, goalText: next }));
  };

  const handleChangeLeaderBackend = useCallback(
    (backend: string) => {
      markTouched();
      setState((s) => (s.leader ? { ...s, leader: { ...s.leader, backend } } : s));
    },
    [markTouched]
  );

  const handleChangeLeaderSlotName = useCallback(
    (slotName: string) => {
      markTouched();
      setState((s) => (s.leader ? { ...s, leader: { ...s.leader, slotName } } : s));
    },
    [markTouched]
  );

  const handleRemoveLeader = useCallback(() => {
    markTouched();
    setState((s) => ({ ...s, leader: null }));
  }, [markTouched]);

  const handleChangeTeammateBackend = useCallback(
    (index: number, backend: string) => {
      markTouched();
      setState((s) => ({
        ...s,
        teammates: s.teammates.map((tm, i) => (i === index ? { ...tm, backend } : tm)),
      }));
    },
    [markTouched]
  );

  const handleChangeTeammateSlotName = useCallback(
    (index: number, slotName: string) => {
      markTouched();
      setState((s) => ({
        ...s,
        teammates: s.teammates.map((tm, i) => (i === index ? { ...tm, slotName } : tm)),
      }));
    },
    [markTouched]
  );

  const handleRemoveTeammate = useCallback(
    (index: number) => {
      markTouched();
      setState((s) => ({ ...s, teammates: s.teammates.filter((_, i) => i !== index) }));
    },
    [markTouched]
  );

  const handleOpenAddTeammate = useCallback(() => {
    setPickerMode('teammate');
    setPickerVisible(true);
  }, []);

  const handleOpenPickLeader = useCallback(() => {
    setPickerMode('leader');
    setPickerVisible(true);
  }, []);

  const handlePick = useCallback(
    (specialistId: string) => {
      markTouched();
      const spec = specialistsById.get(specialistId);
      const backend = recommend(spec?.presetAgentType);
      const newEntry: RosterEntry = { specialistId, backend, slotName: '' };
      setState((s) => {
        if (pickerMode === 'leader') {
          return { ...s, leader: newEntry };
        }
        return { ...s, teammates: [...s.teammates, newEntry] };
      });
      setPickerVisible(false);
    },
    [markTouched, pickerMode, recommend, specialistsById]
  );

  const handleSuggest = async () => {
    const trimmed = state.goalText.trim();
    if (!trimmed) return;
    markTouched();
    setSuggesting(true);
    try {
      const pool: SuggestSpecialist[] = specialists.map((s) => ({
        id: s.id,
        name: s.nameI18n?.[localeKey] || s.nameI18n?.['en-US'] || s.name || s.id,
        description: s.descriptionI18n?.[localeKey] || s.descriptionI18n?.['en-US'] || s.description || '',
        agentType: s.presetAgentType,
      }));

      const result = (await ipcBridge.team.suggestRoster.invoke({
        goalText: trimmed,
        specialists: pool,
        detectedBackends: available,
        targetSize: 5,
      })) as SuggestRosterResult & { __bridgeError?: boolean; message?: string };

      if (result && result.__bridgeError) {
        Message.error(
          result.message ?? t('teams.launcher.suggestError', { defaultValue: 'Failed to suggest roster' })
        );
        return;
      }

      setState((prev) => ({
        ...prev,
        leader: result.leader
          ? { specialistId: result.leader.specialistId, backend: result.leader.backend, slotName: '' }
          : prev.leader,
        teammates: result.teammates.map((e) => ({
          specialistId: e.specialistId,
          backend: e.backend,
          slotName: '',
        })),
      }));

      Message.success(
        result.fellBackToDefaults
          ? t('teams.launcher.suggestFellBackToDefaults', {
              defaultValue: 'Picked a default roster (no goal keywords matched)',
            })
          : t('teams.launcher.suggestSuccess', { defaultValue: 'Roster suggested' })
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Message.error(msg || t('teams.launcher.suggestError', { defaultValue: 'Failed to suggest roster' }));
    } finally {
      setSuggesting(false);
    }
  };

  const handleBack = () => {
    void Promise.resolve(navigate('/teams')).catch(console.error);
  };

  const handleLaunch = async () => {
    if (launchingRef.current) return;
    const trimmedName = state.name.trim();
    if (!trimmedName) {
      Message.warning(
        t('teams.launcher.nameRequired', { defaultValue: 'Please enter a team name' })
      );
      return;
    }
    if (!state.leader) {
      Message.warning(t('teams.launcher.leaderRequired', { defaultValue: 'Please pick a leader' }));
      return;
    }

    const userId = user?.id ?? 'system_default_user';
    const leaderSpec = specialistsById.get(state.leader.specialistId);
    const buildAgent = (
      entry: RosterEntry,
      spec: AssistantListItem | undefined,
      role: 'leader' | 'teammate'
    ): TeamAgent => {
      const agentName =
        entry.slotName.trim() ||
        spec?.nameI18n?.[localeKey] ||
        spec?.nameI18n?.['en-US'] ||
        spec?.name ||
        entry.specialistId;
      return {
        slotId: '',
        conversationId: '',
        role,
        status: 'pending',
        agentType: entry.backend,
        agentName,
        conversationType: resolveConversationType(entry.backend),
        customAgentId: spec?.id,
      };
    };

    const agents: TeamAgent[] = [
      buildAgent(state.leader, leaderSpec, 'leader'),
      ...state.teammates.map((tm) => buildAgent(tm, specialistsById.get(tm.specialistId), 'teammate')),
    ];

    launchingRef.current = true;
    setLaunching(true);
    // We intentionally do NOT reset launchingRef on success - team.create is
    // fast enough (~50ms) that resetting in `finally` lets queued click
    // events through and creates duplicate teams. On success we navigate
    // away and the component unmounts. Ref/state only reset on the failure
    // paths so the user can retry without reloading.
    const resetForRetry = () => {
      launchingRef.current = false;
      setLaunching(false);
    };
    try {
      const team = (await ipcBridge.team.create.invoke({
        userId,
        name: trimmedName,
        workspace: '',
        workspaceMode: 'shared',
        agents,
        sourceLauncherId: isBuildMyOwn ? undefined : (launcher?.id ?? teamId),
      })) as TTeam & { __bridgeError?: boolean; message?: string };

      if (team && team.__bridgeError) {
        Message.error(
          team.message ?? t('teams.launcher.launchError', { defaultValue: 'Failed to launch the team.' })
        );
        resetForRetry();
        return;
      }

      if (!team || !team.id) {
        Message.error(t('teams.launcher.launchError', { defaultValue: 'Failed to launch the team.' }));
        resetForRetry();
        return;
      }

      // Auto-start the team with the user's brief. Without this the team lands
      // on an empty "Describe your goal" screen and never begins. Post the brief
      // to the leader via the same path the in-team composer uses
      // (getOrStartSession lazily spawns the leader). Fire-and-forget so the
      // user reaches the team page immediately while the leader boots.
      const kickoff = state.goalText.trim();
      if (kickoff) {
        void ipcBridge.team.sendMessage
          .invoke({ teamId: team.id, content: kickoff })
          .catch((error) => console.error('Team kickoff send failed:', error));
      }

      void Promise.resolve(navigate(`/team/${team.id}`)).catch((error) => {
        console.error('Navigation to team page failed:', error);
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Message.error(msg || t('teams.launcher.launchError', { defaultValue: 'Failed to launch the team.' }));
      resetForRetry();
    }
  };

  // Header rendering.
  const title = isBuildMyOwn
    ? t('teams.launcher.buildMyOwnTitle', { defaultValue: 'Build a team' })
    : launcher
      ? launcher.nameI18n?.[localeKey] || launcher.nameI18n?.['en-US'] || launcher.name || teamId || ''
      : teamId || '';
  const subtitle = isBuildMyOwn
    ? t('teams.launcher.buildMyOwnSubtitle', {
        defaultValue:
          'Pick a leader, add teammates, choose backends. Save and reuse as your own template later.',
      })
    : launcher
      ? launcher.descriptionI18n?.[localeKey] ||
        launcher.descriptionI18n?.['en-US'] ||
        launcher.description ||
        ''
      : '';

  const headerAvatarValue = launcher?.avatar?.trim();
  const headerMapped = headerAvatarValue ? CUSTOM_AVATAR_IMAGE_MAP[headerAvatarValue] : undefined;
  const headerResolved = headerAvatarValue
    ? headerMapped || resolveExtensionAssetUrl(headerAvatarValue) || headerAvatarValue
    : undefined;
  const showHeaderImage = headerResolved ? isImageAvatar(headerResolved) : false;
  const headerPalette = resolveTeamPalette(launcher, teamId);

  if (!isBuildMyOwn && !launcher && specialists.length === 0) {
    // Bundles haven't loaded yet - render a neutral skeleton.
    return (
      <div className={styles.page} data-testid='team-launcher-page'>
        <div className={styles.scroll}>
          <div className={styles.container} />
        </div>
      </div>
    );
  }

  if (!isBuildMyOwn && !launcher && specialists.length > 0) {
    // Bundle loaded but the requested launcher is missing - surface error.
    return (
      <div className={styles.page} data-testid='team-launcher-page'>
        <div className={styles.scroll}>
          <div className={styles.container}>
            <Button
              type='text'
              size='small'
              className={styles.backLink}
              icon={<ArrowLeft size={14} />}
              onClick={handleBack}
              data-testid='launcher-back'
            >
              {t('teams.launcher.back', { defaultValue: 'Back to Teams' })}
            </Button>
            <div className={styles.errorBanner} data-testid='launcher-load-error'>
              {t('teams.launcher.loadError', { defaultValue: 'Failed to load this team.' })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} data-testid='team-launcher-page'>
      <div className={styles.scroll}>
        <div className={styles.container}>
          <Button
            type='text'
            size='small'
            className={styles.backLink}
            icon={<ArrowLeft size={14} />}
            onClick={handleBack}
            data-testid='launcher-back'
          >
            {t('teams.launcher.back', { defaultValue: 'Back to Teams' })}
          </Button>

          <div className={styles.header} data-testid='launcher-header'>
            <AssistantIconTile paletteKey={headerPalette} size='lg' className={styles.headerAvatar}>
              {showHeaderImage && headerResolved ? (
                <img src={headerResolved} alt='' />
              ) : headerAvatarValue ? (
                <span style={{ fontSize: 28 }}>{headerAvatarValue}</span>
              ) : (
                <Users size={26} />
              )}
            </AssistantIconTile>
            <div className={styles.headerBody}>
              <div className={styles.titleRow}>
                <h1 className={styles.title} data-testid='launcher-title'>
                  {title}
                </h1>
                {launcher?._standing && (
                  <span className={styles.standingBadge} data-testid='launcher-standing-badge'>
                    <span className={styles.standingBadgeDot} aria-hidden='true' />
                    {t('teams.standingBadge', { defaultValue: 'Standing' })}
                  </span>
                )}
              </div>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </div>

          <div className={styles.nameCard}>
            <label className={styles.nameLabel} htmlFor='launcher-name-input'>
              {t('teams.launcher.nameLabel', { defaultValue: 'Team name' })}
            </label>
            <Input
              id='launcher-name-input'
              value={state.name}
              onChange={handleNameChange}
              placeholder={t('teams.launcher.namePlaceholder', {
                defaultValue: 'e.g. Launch Sprint, Renewal Push, Q1 Brand Refresh',
              })}
              data-testid='launcher-name-input'
            />
          </div>

          <LauncherRosterTable
            leader={state.leader}
            teammates={state.teammates}
            backendOptions={available}
            specialistsById={specialistsById}
            localeKey={localeKey}
            onChangeLeaderBackend={handleChangeLeaderBackend}
            onChangeLeaderSlotName={handleChangeLeaderSlotName}
            onRemoveLeader={handleRemoveLeader}
            onChangeTeammateBackend={handleChangeTeammateBackend}
            onChangeTeammateSlotName={handleChangeTeammateSlotName}
            onRemoveTeammate={handleRemoveTeammate}
            onAddTeammate={handleOpenAddTeammate}
            onPickLeader={handleOpenPickLeader}
          />

          {isBuildMyOwn && (
            <div className={styles.goalCard} data-testid='launcher-goal-card'>
              <label className={styles.goalLabel} htmlFor='launcher-goal-input'>
                {t('teams.launcher.goalLabel', {
                  defaultValue: "Describe what you're doing - I'll suggest a roster",
                })}
              </label>
              <Input.TextArea
                id='launcher-goal-input'
                autoSize={{ minRows: 3, maxRows: 6 }}
                value={state.goalText}
                onChange={handleGoalChange}
                placeholder={t('teams.launcher.goalPlaceholder', {
                  defaultValue:
                    "e.g. We're launching a paid book funnel and need a small team to ship it in two weeks.",
                })}
                data-testid='launcher-goal-input'
              />
              <div className={styles.goalActions}>
                <Button
                  type='outline'
                  size='small'
                  loading={suggesting}
                  disabled={state.goalText.trim().length === 0 || suggesting}
                  onClick={handleSuggest}
                  data-testid='launcher-suggest-btn'
                >
                  {t('teams.launcher.suggestCta', { defaultValue: 'Suggest' })}
                </Button>
              </div>
            </div>
          )}

          <div className={styles.footerActions}>
            <Button
              type='primary'
              loading={launching}
              disabled={launching}
              onClick={handleLaunch}
              data-testid='launcher-launch-cta'
            >
              {launching
                ? t('teams.launcher.launchingCta', { defaultValue: 'Launching…' })
                : isBuildMyOwn
                  ? t('teams.launcher.createTeamCta', { defaultValue: 'Create team' })
                  : t('teams.launcher.launchCta', { defaultValue: 'Launch team' })}
            </Button>
            <Button onClick={handleBack} data-testid='launcher-cancel-cta'>
              {t('teams.launcher.cancelCta', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </div>
      </div>

      {pickerVisible && (
        <AddTeammatePicker
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onPick={handlePick}
          specialists={specialists}
          excludeIds={excludeIds}
          localeKey={localeKey}
          mode={pickerMode}
        />
      )}
    </div>
  );
};

export default TeamLauncherPage;
