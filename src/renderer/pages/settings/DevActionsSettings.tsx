/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Settings > Dev Actions — one-click git & GitHub chores for a fork maintainer:
 * commit+push+PR on a local checkout, dispatch a Manual Build, and sync forks
 * from upstream. All work runs in the main process via local `git` / `gh`
 * (see devActions.ts); this page only collects inputs and streams the log.
 */

import { ipcBridge } from '@/common';
import { Button, Checkbox, Input, Message, Select } from '@arco-design/web-react';
import { FolderOpen, GitBranch, GitPullRequestArrow, Hammer, RefreshCw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@renderer/components/settings/shared';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';

// ponytail: the maintainer's three forks, hardcoded. Move to config if a 4th appears.
const FORKS = ['ShadowsTT/wayland', 'ShadowsTT/tank', 'ShadowsTT/wayland-core'] as const;
const PLATFORMS = ['windows-x64', 'windows-arm64', 'macos-arm64', 'macos-x64', 'linux-x64', 'linux-arm64', 'all'];
const REPO_PATH_KEY = 'devActions.repoPath';

const openExternal = (url: string): void => {
  void ipcBridge.shell.openExternal.invoke(url).catch((): void => {});
};

const DevActionsSettings: React.FC = () => {
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLPreElement>(null);

  // Commit + PR
  const [repoPath, setRepoPath] = useState(() => {
    try {
      return localStorage.getItem(REPO_PATH_KEY) || '';
    } catch {
      return '';
    }
  });
  const [message, setMessage] = useState('');
  const [committing, setCommitting] = useState(false);

  // Build release
  const [releaseRepo, setReleaseRepo] = useState<string>(FORKS[0]);
  const [releaseBranch, setReleaseBranch] = useState('main');
  const [platform, setPlatform] = useState('windows-x64');
  const [building, setBuilding] = useState(false);

  // Sync forks
  const [selectedForks, setSelectedForks] = useState<string[]>([...FORKS]);
  const [syncing, setSyncing] = useState(false);

  // Stream every action's log lines into the shared console.
  useEffect(() => {
    const off = ipcBridge.devActions.log.on((evt) => {
      setLog((prev) => [...prev, `[${evt.action}] ${evt.line}`]);
    });
    return () => off?.();
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  const chooseFolder = async () => {
    const paths = await ipcBridge.dialog.showOpen.invoke({ properties: ['openDirectory'] });
    const picked = paths?.[0];
    if (!picked) return;
    setRepoPath(picked);
    try {
      localStorage.setItem(REPO_PATH_KEY, picked);
    } catch {
      /* non-fatal */
    }
  };

  const runCommit = async () => {
    setLog([]);
    setCommitting(true);
    try {
      const res = await ipcBridge.devActions.commitAndPr.invoke({ cwd: repoPath, message });
      if (res.ok && res.prUrl) {
        Message.success({
          content: (
            <span>
              PR opened —{' '}
              <a onClick={() => openExternal(res.prUrl!)} style={{ cursor: 'pointer' }}>
                view on GitHub
              </a>
            </span>
          ),
          duration: 6000,
        });
      } else {
        Message.error(res.error || 'Commit failed.');
      }
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setCommitting(false);
    }
  };

  const runBuild = async () => {
    setLog([]);
    setBuilding(true);
    try {
      const res = await ipcBridge.devActions.buildRelease.invoke({
        repo: releaseRepo,
        branch: releaseBranch,
        platform,
      });
      if (res.ok && res.runUrl) {
        Message.success({
          content: (
            <span>
              Build dispatched —{' '}
              <a onClick={() => openExternal(res.runUrl!)} style={{ cursor: 'pointer' }}>
                watch on Actions
              </a>
            </span>
          ),
          duration: 6000,
        });
      } else {
        Message.error(res.error || 'Dispatch failed.');
      }
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBuilding(false);
    }
  };

  const runSync = async () => {
    if (selectedForks.length === 0) {
      Message.warning('Select at least one fork.');
      return;
    }
    setLog([]);
    setSyncing(true);
    try {
      const { results } = await ipcBridge.devActions.syncForks.invoke({ repos: selectedForks });
      const failed = results.filter((r) => !r.ok);
      if (failed.length === 0) Message.success(`Sync dispatched for ${results.length} fork(s).`);
      else Message.error(`${failed.length} failed: ${failed.map((f) => f.repo).join(', ')}`);
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SettingsPageShell title='Dev Actions' subtitle='One-click git & release chores for your forks.'>
      <Card>
        <div className='flex items-center gap-8px mb-8px text-14px font-600'>
          <GitPullRequestArrow size={16} /> Commit &amp; PR
        </div>
        <div className='text-12px text-t-tertiary mb-12px leading-5'>
          Stages tracked changes only (untracked files are left alone), commits on a feature branch, pushes, and opens a
          PR into <code>main</code>. CI runs the quality checks on the PR.
        </div>
        <div className='flex items-center gap-8px mb-8px'>
          <Input
            readOnly
            value={repoPath}
            placeholder='Choose a git repository folder…'
            prefix={<GitBranch size={14} />}
            className='flex-1'
          />
          <Button icon={<FolderOpen size={14} />} onClick={chooseFolder}>
            Choose folder
          </Button>
        </div>
        <Input.TextArea
          value={message}
          onChange={setMessage}
          placeholder='Commit message (e.g. fix(models): correct catalog label)'
          autoSize={{ minRows: 2, maxRows: 4 }}
          className='mb-12px'
        />
        <Button
          type='primary'
          loading={committing}
          disabled={!repoPath || !message.trim()}
          icon={<GitPullRequestArrow size={14} />}
          onClick={runCommit}
        >
          Commit + Push + PR
        </Button>
      </Card>

      <Card>
        <div className='flex items-center gap-8px mb-8px text-14px font-600'>
          <Hammer size={16} /> Build Release
        </div>
        <div className='text-12px text-t-tertiary mb-12px leading-5'>
          Dispatches the <code>build-manual.yml</code> workflow on GitHub Actions to build installers. This does not
          publish a release; a published release is still cut by pushing a version tag.
        </div>
        <div className='flex flex-wrap items-center gap-8px mb-12px'>
          <Select value={releaseRepo} onChange={setReleaseRepo} style={{ width: 220 }}>
            {FORKS.map((r) => (
              <Select.Option key={r} value={r}>
                {r}
              </Select.Option>
            ))}
          </Select>
          <Input value={releaseBranch} onChange={setReleaseBranch} placeholder='branch' style={{ width: 140 }} />
          <Select value={platform} onChange={setPlatform} style={{ width: 160 }}>
            {PLATFORMS.map((p) => (
              <Select.Option key={p} value={p}>
                {p}
              </Select.Option>
            ))}
          </Select>
        </div>
        <Button type='primary' loading={building} icon={<Hammer size={14} />} onClick={runBuild}>
          Dispatch build
        </Button>
      </Card>

      <Card>
        <div className='flex items-center gap-8px mb-8px text-14px font-600'>
          <RefreshCw size={16} /> Sync Forks from Upstream
        </div>
        <div className='text-12px text-t-tertiary mb-12px leading-5'>
          Runs each fork&apos;s <code>upstream-sync.yml</code> workflow, which opens a PR bringing it up to date with
          upstream.
        </div>
        <Checkbox.Group value={selectedForks} onChange={setSelectedForks} className='flex flex-col gap-6px mb-12px'>
          {FORKS.map((r) => (
            <Checkbox key={r} value={r}>
              {r}
            </Checkbox>
          ))}
        </Checkbox.Group>
        <Button type='primary' loading={syncing} icon={<RefreshCw size={14} />} onClick={runSync}>
          Sync selected
        </Button>
      </Card>

      {log.length > 0 && (
        <Card>
          <div className='flex items-center justify-between mb-8px'>
            <span className='text-14px font-600'>Log</span>
            <Button type='text' size='mini' onClick={() => setLog([])}>
              Clear
            </Button>
          </div>
          <pre
            ref={logRef}
            className='text-11px leading-4 max-h-280px overflow-auto bg-fill-1 rd-8px p-12px m-0 whitespace-pre-wrap break-all'
          >
            {log.join('\n')}
          </pre>
        </Card>
      )}
    </SettingsPageShell>
  );
};

export default DevActionsSettings;
