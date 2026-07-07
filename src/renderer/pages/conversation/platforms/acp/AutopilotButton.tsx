/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Autopilot button — hands the current draft off to a local Tank server to run
 * autonomously, then opens the resulting worktree branch for review when Tank
 * finishes. Renders nothing unless Tank is configured (WAYLAND_TANK_TOKEN), so
 * it's invisible on a stock build.
 *
 * ponytail: English strings inline for this flag-gated spike; move to i18n keys
 * before it becomes a shipped, non-gated feature.
 */

import React, { useEffect, useState } from 'react';
import { Button, Message, Tooltip } from '@arco-design/web-react';
import { Rocket } from '@icon-park/react';
import { useNavigate } from 'react-router-dom';
import { ipcBridge } from '@/common';

type Props = { content: string; workspacePath?: string };

const AutopilotButton = ({ content, workspacePath }: Props) => {
  const [available, setAvailable] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    ipcBridge.autopilot.available
      .invoke()
      .then((r) => setAvailable(r.available))
      .catch(() => {});
  }, []);

  // When Tank finishes the run, open its worktree branch as a project to review.
  useEffect(() => {
    const unsub = ipcBridge.autopilot.finished.on(async (f) => {
      if (!f.worktreePath) return;
      try {
        const project = await ipcBridge.project.create.invoke({
          name: f.branch || 'Autopilot run',
          workspace: f.worktreePath,
        });
        navigate(`/project/${project.id}`);
      } catch {
        Message.info('Autopilot finished — open the Tank worktree to review.');
      }
    });
    return () => unsub();
  }, [navigate]);

  if (!available) return null;

  const onClick = async () => {
    if (!content.trim()) {
      Message.warning('Type a task first, then send it to autopilot.');
      return;
    }
    setSending(true);
    try {
      const res = await ipcBridge.autopilot.run.invoke({ prompt: content, projectPath: workspacePath || '' });
      if (res.ok) Message.success('Sent to autopilot — Tank is running it. You’ll be notified when it finishes.');
      else Message.error(res.error || 'Could not reach Tank.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Tooltip content='Run this task on autopilot (Tank)'>
      <Button
        shape='circle'
        size='small'
        type='text'
        loading={sending}
        icon={<Rocket theme='outline' />}
        onClick={onClick}
        aria-label='Run on autopilot'
      />
    </Tooltip>
  );
};

export default AutopilotButton;
