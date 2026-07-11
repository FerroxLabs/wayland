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
import { FolderOpen, FolderPlus, GitBranch, GitPullRequestArrow, Hammer, RefreshCw, RotateCw, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@renderer/components/settings/shared';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';

// ponytail: the maintainer's forks, hardcoded. Move to config if this list keeps growing.
const FORKS = ['ShadowsTT/wayland', 'ShadowsTT/tank', 'ShadowsTT/wayland-core', 'ShadowsTT/ijfw'] as const;
const PLATFORMS = ['windows-x64', 'windows-arm64', 'macos-arm64', 'macos-x64', 'linux-x64', 'linux-arm64', 'all'];
const REPO_PATH_KEY = 'devActions.repoPath';
const REPO_PATHS_KEY = 'devActions.repoPaths';
const BUILD_SCRIPT_KEY = 'devActions.buildScript';

type RepoStatus = {
  path: string;
  name: string;
  branch?: string;
  changed: number;
  untracked: number;
  error?: string;
};

/** Load the tracked working-copy list, seeding once from the legacy single path. */
function loadRepoPaths(): string[] {
  try {
    const raw = localStorage.getItem(REPO_PATHS_KEY);
    if (raw) return JSON.parse(raw) as string[];
    const legacy = localStorage.getItem(REPO_PATH_KEY);
    return legacy ? [legacy] : [];
  } catch {
    return [];
  }
}

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

  // Working copies (local checkouts with live change counts + one-click commit)
  const [repoPaths, setRepoPaths] = useState<string[]>(loadRepoPaths);
  const [statuses, setStatuses] = useState<RepoStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [committingPath, setCommittingPath] = useState<string | null>(null);
  const [buildingPath, setBuildingPath] = useState<string | null>(null);
  const [buildScript, setBuildScript] = useState(() => {
    try {
      return localStorage.getItem(BUILD_SCRIPT_KEY) || 'package';
    } catch {
      return 'package';
    }
  });

  const persistRepoPaths = (paths: string[]) => {
    setRepoPaths(paths);
    try {
      localStorage.setItem(REPO_PATHS_KEY, JSON.stringify(paths));
    } catch {
      /* non-fatal */
    }
  };

  const refreshStatuses = useCallback(async (paths: string[]) => {
    if (paths.length === 0) {
      setStatuses([]);
      return;
    }
    setRefreshing(true);
    try {
      const { results } = await ipcBridge.devActions.repoStatus.invoke({ paths });
      setStatuses(results);
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatuses(repoPaths);
    // Refresh once on mount; explicit refresh/add/commit re-run it after.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addWorkingCopy = async () => {
    const picked = (await ipcBridge.dialog.showOpen.invoke({ properties: ['openDirectory'] }))?.[0];
    if (!picked || repoPaths.includes(picked)) return;
    const next = [...repoPaths, picked];
    persistRepoPaths(next);
    void refreshStatuses(next);
  };

  const removeWorkingCopy = (path: string) => {
    const next = repoPaths.filter((p) => p !== path);
    persistRepoPaths(next);
    setStatuses((prev) => prev.filter((s) => s.path !== path));
  };

  const commitWorkingCopy = async (repo: RepoStatus) => {
    setLog([]);
    setCommittingPath(repo.path);
    try {
      const res = await ipcBridge.devActions.commitAndPr.invoke({
        cwd: repo.path,
        message: `chore(${repo.name}): sync working changes`,
      });
      if (res.ok && res.prUrl) {
        Message.success({
          content: (
            <span>
              {repo.name}: PR opened —{' '}
              <a onClick={() => openExternal(res.prUrl!)} style={{ cursor: 'pointer' }}>
                view on GitHub
              </a>
            </span>
          ),
          duration: 6000,
        });
      } else {
        Message.error(`${repo.name}: ${res.error || 'Commit failed.'}`);
      }
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setCommittingPath(null);
      void refreshStatuses(repoPaths);
    }
  };

  const buildWorkingCopy = async (repo: RepoStatus) => {
    const script = buildScript.trim();
    if (!script) {
      Message.warning('Enter a build script name (e.g. package).');
      return;
    }
    setLog([]);
    setBuildingPath(repo.path);
    try {
      const res = await ipcBridge.devActions.buildLocal.invoke({ cwd: repo.path, script });
      if (res.ok) Message.success(`${repo.name}: local build finished.`);
      else Message.error(`${repo.name}: ${res.error || 'Build failed.'}`);
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBuildingPath(null);
    }
  };

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
        <div className='flex items-center justify-between mb-8px'>
          <div className='flex items-center gap-8px text-14px font-600'>
            <GitBranch size={16} /> Working Copies
          </div>
          <div className='flex items-center gap-8px'>
            <Button
              size='mini'
              icon={<RotateCw size={13} />}
              loading={refreshing}
              disabled={repoPaths.length === 0}
              onClick={() => refreshStatuses(repoPaths)}
            >
              Refresh
            </Button>
            <Button size='mini' type='primary' icon={<FolderPlus size={13} />} onClick={addWorkingCopy}>
              Add folder
            </Button>
          </div>
        </div>
        <div className='text-12px text-t-tertiary mb-12px leading-5'>
          Add your local checkouts once; each row shows its branch and pending change count. <b>Commit + Push</b> stages
          tracked changes only (untracked files are left alone), commits, pushes, and opens a PR into <code>main</code>.
          <b> Build</b> runs the npm script below locally (package manager auto-detected from the lockfile).
        </div>
        {repoPaths.length > 0 && (
          <div className='flex items-center gap-8px mb-12px'>
            <span className='text-12px text-t-tertiary'>Build script:</span>
            <Input
              value={buildScript}
              onChange={(v) => {
                setBuildScript(v);
                try {
                  localStorage.setItem(BUILD_SCRIPT_KEY, v);
                } catch {
                  /* non-fatal */
                }
              }}
              placeholder='package'
              style={{ width: 160 }}
              size='small'
            />
            <span className='text-11px text-t-tertiary'>
              e.g. <code>package</code> (compile) or <code>dist:win</code> (installer)
            </span>
          </div>
        )}
        {repoPaths.length === 0 ? (
          <div className='text-12px text-t-tertiary py-8px'>
            No working copies yet. Click <b>Add folder</b> to track a local git checkout.
          </div>
        ) : (
          <div className='flex flex-col gap-6px'>
            {repoPaths.map((path) => {
              const st = statuses.find((s) => s.path === path);
              const name = st?.name || path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || path;
              const committing = committingPath === path;
              const building = buildingPath === path;
              const rowBusy = committing || building;
              const anyBusy = committingPath !== null || buildingPath !== null;
              const nothing = !!st && !st.error && st.changed === 0;
              return (
                <div key={path} className='flex items-center gap-8px bg-fill-1 rd-8px px-12px py-8px'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-6px text-13px font-600'>
                      <span className='truncate'>{name}</span>
                      {st?.branch && <span className='text-11px text-t-tertiary font-400'>({st.branch})</span>}
                    </div>
                    <div className='text-11px text-t-tertiary truncate' title={path}>
                      {st?.error ? (
                        <span className='text-danger-6'>{st.error}</span>
                      ) : st ? (
                        <>
                          {st.changed} tracked change{st.changed === 1 ? '' : 's'}
                          {st.untracked > 0 && ` · ${st.untracked} untracked (ignored)`}
                        </>
                      ) : (
                        'Checking…'
                      )}
                    </div>
                  </div>
                  <Button
                    size='small'
                    type='primary'
                    loading={committing}
                    disabled={!st || !!st.error || nothing || anyBusy}
                    icon={<GitPullRequestArrow size={13} />}
                    onClick={() => st && commitWorkingCopy(st)}
                  >
                    {nothing ? 'Clean' : 'Commit + Push'}
                  </Button>
                  <Button
                    size='small'
                    loading={building}
                    disabled={!st || !!st.error || anyBusy}
                    icon={<Hammer size={13} />}
                    onClick={() => st && buildWorkingCopy(st)}
                  >
                    Build
                  </Button>
                  <Button
                    size='small'
                    type='text'
                    status='danger'
                    icon={<X size={14} />}
                    disabled={rowBusy}
                    onClick={() => removeWorkingCopy(path)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

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
