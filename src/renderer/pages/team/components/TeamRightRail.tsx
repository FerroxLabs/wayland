// src/renderer/pages/team/components/TeamRightRail.tsx
//
// W2c — Right-rail surface inside the team page. Mockup §4:
//   - Teammates: avatar + name + role + backend (status dot); failed agents
//     get a Restart icon next to the dot (W3a — user-driven crash recovery).
//   - Workspace: placeholder list (real per-team workspace browser is
//     already in the workspace sider; the rail link is a thin pointer
//     for now — W2d may flesh this out alongside the cost meter)
//   - Rituals: rendered from the source launcher's `_rituals`. The team
//     record itself does not carry rituals, so we look up the launcher
//     by team name (best-effort — see useTeamSourceLauncher). When no
//     launcher resolves, the section renders empty with a hint.
//   - "+ Add teammate" button (W3a) opens AddTeammatePicker; the picked
//     specialist is handed up to TeamPage, which owns the IPC call so it
//     can build the agent payload with the leader's backend as fallback.

import React, { useMemo, useState } from 'react';
import { Button, Message } from '@arco-design/web-react';
import { Plus, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import type { TeamAgent, TeammateStatus } from '@/common/types/teamTypes';
import { useAssistantList } from '@/renderer/hooks/assistant';
import { getAgentLogo } from '@renderer/utils/model/agentLogo';
import { getBackendLabel } from '@renderer/utils/model/backendLabel';
import AddTeammatePicker from '@/renderer/pages/teams/components/AddTeammatePicker';

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
}> = ({ agent, status, teamId }) => {
  const { t } = useTranslation();
  // Rail rows use the backend logo when available; otherwise fall back to
  // initials. No per-agent avatar field is read here — the consolidated avatar
  // helper landed for chat surfaces; the rail keeps its own compact look.
  const backendLogo = getAgentLogo(agent.agentType);
  const showLogo = Boolean(backendLogo);
  const roleLabel =
    agent.role === 'leader'
      ? t('teams.rightRail.roleLeader', { defaultValue: 'leader' })
      : t('teams.rightRail.roleSpecialist', { defaultValue: 'specialist' });
  const backend = getBackendLabel(agent.agentType);
  const dotClass = STATUS_DOT_COLOR[status] ?? STATUS_DOT_COLOR.idle;

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
      className='flex items-center justify-between py-6px px-8px rd-6px hover:bg-[color:var(--fill-2)] cursor-default'
    >
      <div className='flex items-center gap-8px min-w-0'>
        {showLogo ? (
          <img
            src={backendLogo!}
            alt={agent.agentType}
            className='w-24px h-24px rd-full object-contain bg-[color:var(--fill-2)] p-2px shrink-0'
          />
        ) : (
          <span
            className='w-24px h-24px rd-full flex items-center justify-center text-10px font-semibold bg-[color:var(--fill-2)] shrink-0'
            aria-hidden='true'
          >
            {initialsFromName(agent.agentName)}
          </span>
        )}
        <div className='min-w-0'>
          <div className='text-12.5px font-medium text-[color:var(--color-text-1)] truncate'>{agent.agentName}</div>
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
            className='flex items-center justify-center w-18px h-18px rd-4px text-[color:var(--color-text-3)] hover:text-[color:var(--color-text-1)] hover:bg-[color:var(--fill-3)] border-0 bg-transparent cursor-pointer p-0'
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
  const { assistants, localeKey } = useAssistantList();
  const specialists = useMemo(() => assistants.filter((a) => a._kind === 'specialist'), [assistants]);
  const specialistsById = useMemo(() => {
    const map = new Map<string, AssistantListItem>();
    for (const s of specialists) map.set(s.id, s);
    return map;
  }, [specialists]);
  const existingSpecialistIds = useMemo(
    () => agents.map((a) => a.customAgentId).filter((id): id is string => Boolean(id)),
    [agents]
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

  return (
    <aside
      data-testid='team-right-rail'
      className='w-260px shrink-0 h-full flex flex-col overflow-y-auto border-l border-solid border-[color:var(--border-base)] bg-[color:var(--color-bg-2)] p-16px gap-16px'
    >
      <section data-testid='team-right-rail-teammates'>
        <div className='font-semibold text-11px text-[color:var(--color-text-3)] uppercase tracking-wider mb-8px'>
          {t('teams.rightRail.teammates', { defaultValue: 'Teammates' })}
        </div>
        <div className='flex flex-col gap-2px'>
          {agents.map((agent) => (
            <TeammateRow
              key={agent.slotId}
              agent={agent}
              status={statusMap.get(agent.slotId)?.status ?? agent.status}
              teamId={teamId}
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
                <span className='text-[color:var(--color-text-4)] truncate'>— {ritual.cadence}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className='text-11.5px text-[color:var(--color-text-4)] italic'>
            {t('teams.rightRail.ritualsEmpty', { defaultValue: 'No rituals — not a Standing Company.' })}
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
