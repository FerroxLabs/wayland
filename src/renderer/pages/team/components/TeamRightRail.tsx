// src/renderer/pages/team/components/TeamRightRail.tsx
//
// W2c - Right-rail surface inside the team page. Mockup §4:
//   - Teammates: avatar + name + role + backend (status dot); failed agents
//     get a Restart icon next to the dot (W3a - user-driven crash recovery).
//   - Workspace: placeholder list (real per-team workspace browser is
//     already in the workspace sider; the rail link is a thin pointer
//     for now - W2d may flesh this out alongside the cost meter)
//   - Rituals: rendered from the source launcher's `_rituals`. The team
//     record itself does not carry rituals, so we look up the launcher
//     by team name (best-effort - see useTeamSourceLauncher). When no
//     launcher resolves, the section renders empty with a hint.
//   - "+ Add teammate" button (W3a) opens AddTeammatePicker; the picked
//     specialist is handed up to TeamPage, which owns the IPC call so it
//     can build the agent payload with the leader's backend as fallback.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Message, Tooltip } from '@arco-design/web-react';
import { ChevronLeft, ChevronRight, Crown, Plus, RotateCw, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import { isSelectableSpecialist } from '@/renderer/pages/settings/AssistantSettings/assistantUtils';
import type { TeamAgent, TeammateStatus } from '@/common/types/teamTypes';
import { useAssistantList } from '@/renderer/hooks/assistant';
import { getAgentLogo } from '@renderer/utils/model/agentLogo';
import { getBackendLabel } from '@renderer/utils/model/backendLabel';
import AddTeammatePicker from '@/renderer/pages/teams/components/AddTeammatePicker';
import AssistantIconTile from '@/renderer/pages/guid/components/AssistantIconTile';
import { resolveSpecialistPalette } from '@/renderer/pages/teams/components/teamPalette';

type Props = {
  agents: TeamAgent[];
  statusMap: Map<string, { status: TeammateStatus }>;
  launcher: AssistantListItem | null;
  workspacePath?: string;
  teamId: string;
  /**
   * Called when the user picks a specialist from the + Add teammate picker.
   * TeamPage owns the IPC call so it can build the agent payload with the
   * leader's backend as fallback. Awaited so the rail can keep the picker
   * open if the parent reports an error.
   */
  onTeammateAdded?: (specialist: AssistantListItem) => void | Promise<void>;
};

const COLLAPSED_STORAGE_KEY = 'wayland.teamRightRail.collapsed';
const COLLAPSED_CHANGE_EVENT = 'wayland:team-right-rail-collapsed-changed';

/**
 * Persisted collapse state for the team page right-rail. Mirrors the pattern
 * used by `ChatLayout`'s workspace right-sider (`rightSiderCollapsed`) - a
 * single global preference, not per-team, so the user only flips it once.
 *
 * Cross-window via the native `storage` event; same-renderer via a custom
 * event so multiple instances of the hook (e.g. nested team views) stay in
 * sync without a roundtrip through localStorage.
 */
function useRightRailCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => {
      try {
        setCollapsed(window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true');
      } catch {
        /* tolerate unavailable storage (private mode, etc.) */
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === COLLAPSED_STORAGE_KEY || e.key === null) sync();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(COLLAPSED_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(COLLAPSED_CHANGE_EVENT, sync);
    };
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
          window.dispatchEvent(new Event(COLLAPSED_CHANGE_EVENT));
        }
      } catch {
        /* persistence is best-effort */
      }
      return next;
    });
  }, []);

  return [collapsed, toggle];
}

const STATUS_DOT_COLOR: Record<TeammateStatus, string> = {
  pending: 'bg-gray-400',
  idle: 'bg-gray-400',
  active: 'bg-green-500',
  completed: 'bg-gray-400',
  failed: 'bg-red-500',
};

const initialsFromName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
};

const TeammateRow: React.FC<{
  agent: TeamAgent;
  status: TeammateStatus;
  teamId: string;
  specialist?: AssistantListItem;
}> = ({ agent, status, teamId, specialist }) => {
  const { t } = useTranslation();
  // Rail rows use the backend logo when available; otherwise fall back to
  // initials. No per-agent avatar field is read here - the consolidated avatar
  // helper landed for chat surfaces; the rail keeps its own compact look.
  const backendLogo = getAgentLogo(agent.agentType);
  const showLogo = Boolean(backendLogo);
  const isLeader = agent.role === 'leader';
  const roleLabel = isLeader
    ? t('teams.rightRail.roleLeader', { defaultValue: 'leader' })
    : t('teams.rightRail.roleSpecialist', { defaultValue: 'specialist' });
  const backend = getBackendLabel(agent.agentType);
  const dotClass = STATUS_DOT_COLOR[status] ?? STATUS_DOT_COLOR.idle;
  const palette = resolveSpecialistPalette(specialist, agent.customAgentId ?? agent.agentName);

  const handleRestart = async () => {
    try {
      const result = (await ipcBridge.team.restartAgent.invoke({ teamId, slotId: agent.slotId })) as
        | void
        | { __bridgeError: true; message?: string };
      if (result && typeof result === 'object' && '__bridgeError' in result) {
        Message.error(
          result.message ?? t('teams.rightRail.restartAgentError', { defaultValue: 'Failed to restart agent' })
        );
        return;
      }
      Message.success(t('teams.rightRail.restartAgentSuccess', { defaultValue: 'Restart initiated' }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Message.error(msg || t('teams.rightRail.restartAgentError', { defaultValue: 'Failed to restart agent' }));
    }
  };

  return (
    <div
      data-testid='team-right-rail-teammate'
      data-is-leader={isLeader ? 'true' : undefined}
      className={`flex items-center justify-between py-6px pr-8px rd-6px hover:bg-[color:var(--color-fill-2)] cursor-default ${
        isLeader ? 'pl-7px' : 'pl-8px'
      }`}
      style={
        isLeader
          ? {
              background: 'rgba(245,158,11,0.05)',
              borderLeft: '2px solid rgba(245,158,11,0.45)',
            }
          : undefined
      }
    >
      <div className='flex items-center gap-8px min-w-0'>
        <AssistantIconTile paletteKey={palette} size='sm' className='!w-24px !h-24px shrink-0'>
          {showLogo ? (
            <img
              src={backendLogo!}
              alt={agent.agentType}
              style={{ width: '70%', height: '70%', objectFit: 'contain' }}
            />
          ) : (
            <span style={{ fontSize: 10, fontWeight: 600 }}>{initialsFromName(agent.agentName)}</span>
          )}
        </AssistantIconTile>
        <div className='min-w-0'>
          <div className='flex items-center gap-4px min-w-0'>
            <div className='text-12.5px font-medium text-[color:var(--color-text-1)] truncate'>{agent.agentName}</div>
            {isLeader && (
              <Crown
                size={11}
                aria-hidden='true'
                className='shrink-0 text-[rgb(245,158,11)] drop-shadow-sm'
              />
            )}
          </div>
          <div className='text-10px text-[color:var(--color-text-4)] truncate'>
            {roleLabel} · {backend}
          </div>
        </div>
      </div>
      <div className='flex items-center gap-6px shrink-0'>
        {status === 'failed' && (
          <button
            type='button'
            data-testid='team-right-rail-restart'
            onClick={handleRestart}
            aria-label={t('teams.rightRail.restartAgent', { defaultValue: 'Restart' })}
            title={t('teams.rightRail.restartAgent', { defaultValue: 'Restart' })}
            className='flex items-center justify-center w-18px h-18px rd-4px text-[color:var(--color-text-3)] hover:text-[color:var(--color-text-1)] hover:bg-[color:var(--color-fill-3)] border-0 bg-transparent cursor-pointer p-0'
          >
            <RotateCw size={12} />
          </button>
        )}
        <span
          data-testid='team-right-rail-status-dot'
          data-status={status}
          className={`w-1.5 h-1.5 rd-full ${dotClass} ${status === 'active' ? 'animate-pulse' : ''}`}
          aria-label={status}
        />
      </div>
    </div>
  );
};

const TeamRightRail: React.FC<Props> = ({
  agents,
  statusMap,
  launcher,
  workspacePath,
  teamId,
  onTeammateAdded,
}) => {
  const { t } = useTranslation();
  const rituals = launcher?._rituals ?? [];
  const hasWorkspace = Boolean(workspacePath && workspacePath.length > 0);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [collapsed, toggleCollapsed] = useRightRailCollapsed();
  const { assistants, localeKey } = useAssistantList();
  const specialists = useMemo(() => assistants.filter(isSelectableSpecialist), [assistants]);
  const specialistsById = useMemo(() => {
    const map = new Map<string, AssistantListItem>();
    for (const s of specialists) map.set(s.id, s);
    return map;
  }, [specialists]);
  const existingSpecialistIds = useMemo(
    () => agents.map((a) => a.customAgentId).filter((id): id is string => Boolean(id)),
    [agents]
  );

  const activeCount = useMemo(
    () => agents.filter((a) => (statusMap.get(a.slotId)?.status ?? a.status) === 'active').length,
    [agents, statusMap]
  );

  const handlePick = async (specialistId: string) => {
    const specialist = specialistsById.get(specialistId);
    if (!specialist || !onTeammateAdded) {
      setPickerVisible(false);
      return;
    }
    setPickerVisible(false);
    await onTeammateAdded(specialist);
  };

  if (collapsed) {
    // Collapsed icon strip - ~36px wide. Click anywhere on the bar to expand;
    // gives the chat columns back ~224px of horizontal real estate. The expand
    // affordance is a chevron at the top so the click target reads as
    // controllable rather than purely decorative.
    const expandLabel = t('teams.rightRail.expand', { defaultValue: 'Expand teammates panel' });
    return (
      <aside
        data-testid='team-right-rail'
        data-collapsed='true'
        className='w-36px shrink-0 h-full flex flex-col items-center justify-start gap-12px py-12px border-l border-solid border-[color:var(--border-base)] bg-[color:var(--color-bg-2)] cursor-pointer hover:bg-[color:var(--color-fill-2)] transition-colors'
        onClick={toggleCollapsed}
        aria-label={expandLabel}
        title={expandLabel}
      >
        <Tooltip content={expandLabel} position='left' mini>
          <button
            type='button'
            data-testid='team-right-rail-toggle'
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapsed();
            }}
            aria-label={expandLabel}
            className='flex items-center justify-center w-24px h-24px rd-4px text-[color:var(--color-text-3)] hover:text-[color:var(--color-text-1)] hover:bg-[color:var(--color-fill-3)] border-0 bg-transparent cursor-pointer p-0'
          >
            <ChevronLeft size={14} />
          </button>
        </Tooltip>
        <div className='relative flex items-center justify-center w-24px h-24px text-[color:var(--color-text-3)]'>
          <Users size={16} aria-hidden='true' />
          {agents.length > 0 && (
            <span
              data-testid='team-right-rail-collapsed-badge'
              className='absolute -top-2px -right-4px min-w-14px h-14px px-3px rd-full flex items-center justify-center text-9px font-semibold leading-none'
              style={{
                background: activeCount > 0 ? 'rgb(var(--primary-6))' : 'var(--color-fill-3)',
                color: activeCount > 0 ? '#fff' : 'var(--color-text-2)',
              }}
              aria-label={t('teams.rightRail.teammateCount', {
                count: agents.length,
                defaultValue: `${agents.length} teammates`,
              })}
            >
              {agents.length}
            </span>
          )}
        </div>
      </aside>
    );
  }

  const collapseLabel = t('teams.rightRail.collapse', { defaultValue: 'Collapse teammates panel' });

  return (
    <aside
      data-testid='team-right-rail'
      data-collapsed='false'
      className='w-260px shrink-0 h-full flex flex-col overflow-y-auto border-l border-solid border-[color:var(--border-base)] bg-[color:var(--color-bg-2)] p-16px gap-16px'
    >
      <section data-testid='team-right-rail-teammates'>
        <div className='flex items-center justify-between mb-8px'>
          <div className='font-semibold text-11px text-[color:var(--color-text-3)] uppercase tracking-wider'>
            {t('teams.rightRail.teammates', { defaultValue: 'Teammates' })}
          </div>
          <Tooltip content={collapseLabel} position='left' mini>
            <button
              type='button'
              data-testid='team-right-rail-toggle'
              onClick={toggleCollapsed}
              aria-label={collapseLabel}
              className='flex items-center justify-center w-20px h-20px rd-4px text-[color:var(--color-text-3)] hover:text-[color:var(--color-text-1)] hover:bg-[color:var(--color-fill-3)] border-0 bg-transparent cursor-pointer p-0'
            >
              <ChevronRight size={14} />
            </button>
          </Tooltip>
        </div>
        <div className='flex flex-col gap-2px'>
          {agents.map((agent) => (
            <TeammateRow
              key={agent.slotId}
              agent={agent}
              status={statusMap.get(agent.slotId)?.status ?? agent.status}
              teamId={teamId}
              specialist={agent.customAgentId ? specialistsById.get(agent.customAgentId) : undefined}
            />
          ))}
        </div>
        <div className='mt-8px'>
          <Button
            type='outline'
            size='small'
            icon={<Plus size={14} />}
            onClick={() => setPickerVisible(true)}
            data-testid='team-right-rail-add-teammate'
            long
          >
            {t('teams.rightRail.addTeammate', { defaultValue: 'Add teammate' })}
          </Button>
        </div>
      </section>

      <section data-testid='team-right-rail-workspace'>
        <div className='font-semibold text-11px text-[color:var(--color-text-3)] uppercase tracking-wider mb-8px'>
          {t('teams.rightRail.workspace', { defaultValue: 'Workspace' })}
        </div>
        {hasWorkspace ? (
          <div className='text-11.5px text-[color:var(--color-text-3)] truncate' title={workspacePath}>
            {t('teams.rightRail.workspaceLinked', {
              defaultValue: 'Browse files in the workspace panel →',
            })}
          </div>
        ) : (
          <div className='text-11.5px text-[color:var(--color-text-4)] italic'>
            {t('teams.rightRail.workspaceEmpty', { defaultValue: 'No workspace bound to this team yet.' })}
          </div>
        )}
      </section>

      <section data-testid='team-right-rail-rituals'>
        <div className='font-semibold text-11px text-[color:var(--color-text-3)] uppercase tracking-wider mb-8px'>
          {t('teams.rightRail.rituals', { defaultValue: 'Rituals' })}
        </div>
        {rituals.length > 0 ? (
          <ul className='flex flex-col gap-4px text-11.5px text-[color:var(--color-text-3)] list-none m-0 p-0'>
            {rituals.map((ritual, i) => (
              <li key={`${ritual.name}-${i}`} className='flex items-baseline gap-6px'>
                <span className='text-[color:var(--color-text-4)]'>•</span>
                <span className='text-[color:var(--color-text-1)]'>{ritual.name}</span>
                <span className='text-[color:var(--color-text-4)] truncate'>- {ritual.cadence}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className='text-11.5px text-[color:var(--color-text-4)] italic'>
            {t('teams.rightRail.ritualsEmpty', { defaultValue: 'No rituals - not a Standing Company.' })}
          </div>
        )}
      </section>

      {pickerVisible && (
        <AddTeammatePicker
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onPick={handlePick}
          specialists={specialists}
          excludeIds={existingSpecialistIds}
          localeKey={localeKey}
          mode='teammate'
        />
      )}
    </aside>
  );
};

export default TeamRightRail;
