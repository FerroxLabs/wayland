/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pencil, Pin, Plus, Trash2, Users } from 'lucide-react';
import { Input, Message, Modal, Tooltip } from '@arco-design/web-react';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import { iconColors } from '@renderer/styles/colors';
import { cleanupSiderTooltips } from '@renderer/utils/ui/siderTooltip';
import { blurActiveElement } from '@renderer/utils/ui/focus';
import { useTeamList } from '@renderer/pages/team/hooks/useTeamList';
import { useSiderTeamBadges } from '@renderer/pages/team/hooks/useSiderTeamBadges';
import TeamCreateModal from '@renderer/pages/team/components/TeamCreateModal';
import { ipcBridge } from '@/common';
import SiderItem from './SiderItem';
import type { SiderMenuItem } from './SiderItem';
import ActiveTeamGroup from './ActiveTeamGroup';
import DeleteTeamConfirmModal from './DeleteTeamConfirmModal';
import { useTeamGroupPersistence } from './useTeamGroupPersistence';
import type { TeamAgent } from '@/common/types/teamTypes';

const TEAM_PINNED_KEY = 'team-pinned-ids';

type SiderTooltipProps = React.ComponentProps<typeof Tooltip>;

interface TeamSiderSectionProps {
  collapsed: boolean;
  pathname: string;
  siderTooltipProps: Partial<SiderTooltipProps>;
  onSessionClick?: () => void;
}

const TeamSiderSection: React.FC<TeamSiderSectionProps> = ({
  collapsed,
  pathname,
  siderTooltipProps,
  onSessionClick,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teams, mutate: refreshTeams, removeTeam } = useTeamList();
  const teamBadgeCounts = useSiderTeamBadges(teams);
  const { mutate: globalMutate } = useSWRConfig();
  const { isExpanded, toggle: toggleGroup } = useTeamGroupPersistence();

  const [createTeamVisible, setCreateTeamVisible] = useState(false);

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(TEAM_PINNED_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  });

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(TEAM_PINNED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const [renameVisible, setRenameVisible] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  // Live-smoke fix #3 (2026-05-19): Arco Modal.confirm is one-shot and
  // cannot gate its OK button on input state, so we drive the
  // destructive delete with a stateful WaylandModal instead. The pending
  // team-id captures which row to delete on confirm.
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteCancel = useCallback(() => {
    setDeleteVisible(false);
    setDeleteTarget(null);
    setDeleteLoading(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const targetId = deleteTarget.id;
    try {
      await removeTeam(targetId);
      Message.success(t('team.sider.deleteSuccess'));
      if (pathname.startsWith(`/team/${targetId}`)) {
        // intentional fire-and-forget; failure is non-actionable
        Promise.resolve(navigate('/')).catch(() => {});
      }
      setDeleteVisible(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete team:', err);
      Message.error(t('team.sider.delete'));
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, navigate, pathname, removeTeam, t]);

  const handleRenameConfirm = useCallback(async () => {
    if (!renameId || !renameName.trim()) return;
    setRenameLoading(true);
    try {
      await ipcBridge.team.renameTeam.invoke({ id: renameId, name: renameName.trim() });
      await refreshTeams();
      await globalMutate(`team/${renameId}`);
      Message.success(t('team.sider.renameSuccess'));
      setRenameVisible(false);
      setRenameId(null);
      setRenameName('');
    } catch (err) {
      console.error('Failed to rename team:', err);
      Message.error(t('team.sider.rename'));
    } finally {
      setRenameLoading(false);
    }
  }, [globalMutate, refreshTeams, renameId, renameName, t]);

  const sortedTeams = useMemo(() => {
    const pinned = teams.filter((team) => pinnedIds.includes(team.id));
    const unpinned = teams.filter((team) => !pinnedIds.includes(team.id));
    return [...pinned, ...unpinned];
  }, [teams, pinnedIds]);

  const handleTeamClick = useCallback(
    (teamId: string) => {
      cleanupSiderTooltips();
      blurActiveElement();
      Promise.resolve(navigate(`/team/${teamId}`)).catch(console.error);
      if (onSessionClick) onSessionClick();
    },
    [navigate, onSessionClick]
  );

  const handleTeammateClick = useCallback(
    (teamId: string, teammate: TeamAgent) => {
      cleanupSiderTooltips();
      blurActiveElement();
      // Persist the chosen slot so TeamTabsContext picks it up as the initial active tab.
      // The storage key mirrors `team-active-slot-${teamId}` from TeamTabsContext.
      try {
        localStorage.setItem(`team-active-slot-${teamId}`, teammate.slotId);
      } catch {
        // localStorage failures (private mode, quota) are non-actionable here;
        // the user lands on the team's last-known tab instead.
      }
      Promise.resolve(navigate(`/team/${teamId}`)).catch(console.error);
      if (onSessionClick) onSessionClick();
    },
    [navigate, onSessionClick]
  );

  return (
    <>
      {collapsed ? (
        sortedTeams.length > 0 && (
          <div className='shrink-0 flex flex-col gap-2px'>
            {sortedTeams.map((team) => {
              const isActive = pathname.startsWith(`/team/${team.id}`);
              return (
                <Tooltip key={team.id} {...siderTooltipProps} content={team.name} position='right'>
                  <div
                    data-testid={`collapsed-team-item-${team.id}`}
                    className={classNames(
                      'relative w-full h-26px flex items-center justify-center cursor-pointer transition-colors rd-8px',
                      isActive ? '!bg-active' : 'hover:bg-fill-3 active:bg-fill-4'
                    )}
                    onClick={() => handleTeamClick(team.id)}
                  >
                    <Users
                      data-testid={`collapsed-team-icon-${team.id}`}
                      data-icon-fill={iconColors.primary} size={16} color={iconColors.primary}
                      style={{ lineHeight: 0 }}
                    />
                    {(teamBadgeCounts.get(team.id) ?? 0) > 0 && (
                      <span
                        className='absolute top-4px right-4px w-18px h-18px rounded-full text-10px font-bold flex items-center justify-center leading-none'
                        style={{ backgroundColor: 'rgb(var(--danger-6))', color: 'var(--text-white)', lineHeight: 1 }}
                      >
                        {(teamBadgeCounts.get(team.id) ?? 0) > 99 ? '99+' : teamBadgeCounts.get(team.id)}
                      </span>
                    )}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        )
      ) : (
        <div className='shrink-0 flex flex-col gap-2px'>
          {/* v0.6.2.1 Fix D1 - removed the redundant "Teams" title row. The
              outer SiderTeamsSection accordion already labels this group
              (eliminates triple-labelling: TopZone Teams + accordion Teams
              + inner Teams). Create-team affordance moved to the bottom of
              the list as an inline "+ Create team" button - mirrors the
              TeamRightRail "Add teammate" pattern. */}
          {sortedTeams.length > 0 &&
            sortedTeams.map((team) => {
              const isPinned = pinnedIds.includes(team.id);
              const menuItems: SiderMenuItem[] = [
                {
                  key: 'pin',
                  icon: <Pin size={14} />,
                  label: isPinned ? t('team.sider.unpin') : t('team.sider.pin'),
                },
                {
                  key: 'rename',
                  icon: <Pencil size={14} />,
                  label: t('team.sider.rename'),
                },
                {
                  key: 'delete',
                  icon: <Trash2 size={14} />,
                  label: t('team.sider.delete'),
                  danger: true,
                },
              ];
              const teamBadge = teamBadgeCounts.get(team.id) ?? 0;
              const header = (
                <div className='relative group flex-1 min-w-0'>
                  <SiderItem
                    icon={<Users size={16} color={iconColors.primary} style={{ lineHeight: 0 }} />}
                    name={team.name}
                    selected={pathname.startsWith(`/team/${team.id}`)}
                    pinned={isPinned}
                    menuItems={menuItems}
                    onMenuAction={(key) => {
                      if (key === 'pin') {
                        togglePin(team.id);
                      } else if (key === 'rename') {
                        setRenameId(team.id);
                        setRenameName(team.name);
                        setRenameVisible(true);
                      } else if (key === 'delete') {
                        setDeleteTarget({ id: team.id, name: team.name });
                        setDeleteVisible(true);
                      }
                    }}
                    onClick={() => handleTeamClick(team.id)}
                  />
                  {teamBadge > 0 && (
                    <span
                      className='absolute right-11px top-1/2 -translate-y-1/2 min-w-18px h-18px px-5px rounded-full text-10px font-bold flex items-center justify-center pointer-events-none z-10 group-hover:hidden'
                      style={{ backgroundColor: 'rgb(var(--danger-6))', color: 'var(--text-white)', lineHeight: 1 }}
                    >
                      {teamBadge > 99 ? '99+' : teamBadge}
                    </span>
                  )}
                </div>
              );
              return (
                <ActiveTeamGroup
                  key={team.id}
                  team={team}
                  expanded={isExpanded(team.id)}
                  onToggle={() => toggleGroup(team.id)}
                  header={header}
                  onTeammateClick={(teammate) => handleTeammateClick(team.id, teammate)}
                />
              );
            })}
          <button
            type='button'
            data-testid='sider-team-create-inline'
            onClick={() => setCreateTeamVisible(true)}
            className='flex items-center gap-6px px-12px py-6px text-11px text-text-3 hover:text-text-1 border-0 bg-transparent cursor-pointer transition-colors'
          >
            <Plus size={12} aria-hidden='true' style={{ lineHeight: 0 }} />
            <span>{t('team.sider.createTeam', { defaultValue: 'Create team' })}</span>
          </button>
        </div>
      )}
      <TeamCreateModal
        visible={createTeamVisible}
        onClose={() => setCreateTeamVisible(false)}
        onCreated={(team) => {
          void refreshTeams();
          Promise.resolve(navigate(`/team/${team.id}`)).catch(console.error);
        }}
      />
      <DeleteTeamConfirmModal
        visible={deleteVisible}
        teamName={deleteTarget?.name ?? ''}
        loading={deleteLoading}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={handleDeleteCancel}
      />
      <Modal
        title={t('team.sider.renameTitle')}
        visible={renameVisible}
        onOk={() => void handleRenameConfirm()}
        onCancel={() => {
          setRenameVisible(false);
          setRenameId(null);
          setRenameName('');
        }}
        okText={t('team.sider.renameOk')}
        cancelText={t('team.sider.renameCancel')}
        confirmLoading={renameLoading}
        okButtonProps={{ disabled: !renameName.trim() }}
        style={{ borderRadius: '12px' }}
        alignCenter
        getPopupContainer={() => document.body}
      >
        <Input
          autoFocus
          value={renameName}
          onChange={setRenameName}
          onPressEnter={() => void handleRenameConfirm()}
          placeholder={t('team.sider.renamePlaceholder')}
          allowClear
        />
      </Modal>
    </>
  );
};

export default TeamSiderSection;
