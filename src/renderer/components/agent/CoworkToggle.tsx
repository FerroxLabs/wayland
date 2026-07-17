/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CoworkToggle — the composer Chat<->Cowork switch (#671).
 *
 * Drives the per-workspace trust axis: "Chat" gates every tool (prompt on
 * everything); "Cowork" trusts the workspace (auto-approve read/edit, still
 * prompt on exec/network). The level is persisted per workspace (keyed by cwd)
 * in the main process and applies across every local backend.
 *
 * Self-contained: give it a `workspace` path and it loads the current level and
 * write-throughs a flip via the `workspaceTrust` IPC. It is an axis ORTHOGONAL
 * to the AgentModeSelector permission mode — not a new mode value. Hidden when
 * there is no workspace to trust (e.g. before one is picked).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Radio, Tooltip } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { WorkspaceTrustLevel } from '@/common/security/workspaceTrust';

type CoworkToggleProps = {
  /** The workspace cwd whose trust level this toggle reads/writes. */
  workspace: string | undefined;
  /** Compact rendering for tight composer rows. */
  size?: 'mini' | 'small';
  className?: string;
};

const CoworkToggle: React.FC<CoworkToggleProps> = ({ workspace, size = 'small', className }) => {
  const { t } = useTranslation();
  const [level, setLevel] = useState<WorkspaceTrustLevel>('chat');
  const [saving, setSaving] = useState(false);

  // Load the persisted level whenever the workspace changes. A load failure
  // leaves the fail-safe 'chat' in place (the store also defaults to 'chat').
  useEffect(() => {
    if (!workspace) return;
    let active = true;
    ipcBridge.workspaceTrust.get
      .invoke({ workspace })
      .then((persisted) => {
        if (active) setLevel(persisted ?? 'chat');
      })
      .catch(() => {
        /* keep 'chat' on error */
      });
    return () => {
      active = false;
    };
  }, [workspace]);

  const handleChange = useCallback(
    (next: WorkspaceTrustLevel) => {
      if (!workspace || next === level || saving) return;
      const previous = level;
      setLevel(next); // optimistic; the gate reads the persisted value on the next tool call
      setSaving(true);
      ipcBridge.workspaceTrust.set
        .invoke({ workspace, level: next })
        .catch(() => setLevel(previous)) // revert on persist failure
        .finally(() => setSaving(false));
    },
    [workspace, level, saving]
  );

  if (!workspace) return null;

  // The Radio.Group is wrapped in a stable <span> so Arco's Trigger anchors its
  // popup to a plain DOM node that stays mounted across composer re-renders.
  // Anchoring directly to Radio.Group let `findDOMNode` return null mid-render
  // (e.g. when the selected model is cleared and the send-box subtree churns),
  // and Arco's `getPopupStyle` then dereferenced `null.offsetParent` — crashing
  // the whole conversation view with "Cannot read properties of null". The span
  // is always present while this toggle is mounted, so the anchor never vanishes.
  return (
    <Tooltip
      content={
        level === 'cowork'
          ? t(
              'agentMode.coworkTooltip',
              'Cowork: auto-approve reads & edits in this workspace; still asks before running commands.'
            )
          : t(
              'agentMode.chatTooltip',
              'Chat: ask before every tool. Switch to Cowork to auto-approve reads & edits here.'
            )
      }
    >
      <span className='inline-flex'>
        <Radio.Group
          type='button'
          size={size}
          value={level}
          onChange={handleChange}
          className={className}
          disabled={saving}
        >
          <Radio value='chat'>{t('agentMode.chat', 'Chat')}</Radio>
          <Radio value='cowork'>{t('agentMode.cowork', 'Cowork')}</Radio>
        </Radio.Group>
      </span>
    </Tooltip>
  );
};

export default CoworkToggle;
