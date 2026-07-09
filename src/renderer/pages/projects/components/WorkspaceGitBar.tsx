/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { Button, Dropdown, Message, Popconfirm, Switch } from '@arco-design/web-react';
import { GitBranch, GitMerge, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Worktree = { path: string; branch: string };

type Props = {
  projectId: string;
};

/**
 * Git affordances for a project workspace. Self-hides unless the workspace is a
 * git repo. Shows a "Pull latest" action, the per-agent worktree isolation
 * toggle, and the live agent worktrees - each with a "Merge" action that folds
 * its branch back into the main checkout.
 */
const WorkspaceGitBar: React.FC<Props> = ({ projectId }) => {
  const { t } = useTranslation();
  const [isGitRepo, setIsGitRepo] = useState(false);
  const [worktreePerAgent, setWorktreePerAgent] = useState(true);
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [pulling, setPulling] = useState(false);
  const [mergingBranch, setMergingBranch] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    try {
      const status = await ipcBridge.project.gitStatus.invoke({ id: projectId });
      setIsGitRepo(status.isGitRepo);
      setWorktreePerAgent(status.worktreePerAgent);
      setWorktrees(status.worktrees);
    } catch {
      setIsGitRepo(false);
      setWorktrees([]);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handlePull = async () => {
    setPulling(true);
    try {
      const res = await ipcBridge.project.pull.invoke({ id: projectId });
      if (res.ok) Message.success(t('projects.git.pulled'));
      else Message.error(res.error || t('projects.git.pullFailed'));
      void refresh();
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setPulling(false);
    }
  };

  const handleToggleIsolation = async (enabled: boolean) => {
    setWorktreePerAgent(enabled); // optimistic
    try {
      await ipcBridge.project.setWorktreePref.invoke({ id: projectId, enabled });
    } catch (e) {
      setWorktreePerAgent(!enabled); // roll back
      Message.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleMerge = async (branch: string) => {
    setMergingBranch(branch);
    try {
      const res = await ipcBridge.project.mergeWorktree.invoke({ id: projectId, branch });
      if (res.ok) Message.success(t('projects.git.merged'));
      else Message.error(res.error || t('projects.git.mergeFailed'));
      void refresh();
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setMergingBranch(null);
    }
  };

  if (!isGitRepo) return null;

  const worktreeList = (
    <div className='w-320px max-h-320px overflow-auto p-8px bg-fill-0 rd-8px'>
      <div className='flex items-center justify-between px-4px pb-8px'>
        <span className='text-12px font-600 text-t-secondary'>{t('projects.git.isolateLabel')}</span>
        <Switch size='small' checked={worktreePerAgent} onChange={handleToggleIsolation} />
      </div>
      <div className='text-11px text-t-tertiary px-4px pb-8px leading-4'>{t('projects.git.isolateHint')}</div>
      <div className='text-12px font-600 text-t-secondary px-4px pb-4px'>{t('projects.git.worktreesTitle')}</div>
      {worktrees.length === 0 ? (
        <div className='text-12px text-t-tertiary px-4px py-6px'>{t('projects.git.noWorktrees')}</div>
      ) : (
        worktrees.map((w) => (
          <div key={w.path} className='flex items-center gap-8px px-4px py-6px'>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-12px font-500 text-t-primary truncate' title={w.branch}>
                {w.branch}
              </span>
              <span className='text-11px text-t-tertiary truncate' title={w.path}>
                {w.path}
              </span>
            </div>
            <Popconfirm
              focusLock
              title={t('projects.git.mergeConfirm')}
              okText={t('projects.git.merge')}
              cancelText={t('common.cancel')}
              onOk={() => handleMerge(w.branch)}
            >
              <Button
                type='text'
                size='mini'
                loading={mergingBranch === w.branch}
                icon={<GitMerge size={14} />}
                className='flex-shrink-0'
              >
                {t('projects.git.merge')}
              </Button>
            </Popconfirm>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className='flex items-center gap-8px flex-shrink-0'>
      <Dropdown trigger='click' droplist={worktreeList} position='br'>
        <button
          type='button'
          className='flex items-center gap-6px px-12px py-7px rd-full bg-transparent cursor-pointer text-12.5px font-600 text-t-primary'
          style={{ border: '1px solid var(--color-border-2)' }}
        >
          <GitBranch size={14} />
          {t('projects.git.worktrees', { count: worktrees.length })}
        </button>
      </Dropdown>
      <Button type='text' loading={pulling} onClick={handlePull} icon={<RefreshCw size={14} />}>
        {t('projects.git.pull')}
      </Button>
    </div>
  );
};

export default WorkspaceGitBar;
