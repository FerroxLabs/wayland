/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Dropdown } from '@arco-design/web-react';
import { LayoutGrid, Plus, Upload, Zap } from 'lucide-react';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { iconColors } from '@/renderer/styles/colors';
import { useMcpServers, useMcpAgentStatus, useMcpOperations, useMcpServerCRUD } from '@renderer/hooks/mcp';
import { Message } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import { resolveModelToolCap } from '@/common/mcp';
import { useComposerSkills, type UseComposerSkills } from './useComposerSkills';
import SkillsFlyout from './SkillsFlyout';
import ConnectorsFlyout from './ConnectorsFlyout';
import styles from './ComposerAddMenu.module.css';

export type ComposerUploadItem = { key: string; label: string; onClick: () => void };

type Pane = 'none' | 'skills' | 'connectors';

export type ComposerAddMenuProps = {
  /** `staged` (home, no conversation yet) or `live` (in-chat, writes through). */
  mode: 'staged' | 'live';
  /** Required in `live` mode so added skills target the conversation. */
  conversationId?: string;
  /** Current composer draft, drives "Suggested for '<draft>'". */
  draftText?: string;
  /** Upload entries (one for desktop; host + device for WebUI). */
  uploadItems: ComposerUploadItem[];
  /** Trigger button shows a loading spinner while an upload is in flight. */
  uploading?: boolean;
  /** Builtin auto-injected skills (always on by default). */
  builtinAutoSkills: Array<{ name: string; description: string }>;
  /** Builtin skill names toggled off for this chat. */
  disabledBuiltinSkills: string[];
  /** Flip a builtin in/out of the disabled set (owned by the host). */
  onToggleBuiltinSkill: (name: string) => void;
  /**
   * Staged-mode only: fired whenever the staged skill picks change so the host
   * can thread them into the new conversation's `extra.sessionSkills` on send.
   */
  onStagedSkillsChange?: (names: string[]) => void;
};

/**
 * The lazily-mounted two-pane panel (left menu + active flyout). Holds the MCP
 * hook stack so connectors only load when the menu is actually opened. The
 * skills state (`composer`) is owned by the parent so staged picks survive the
 * menu closing before send.
 */
const ComposerAddMenuPanel: React.FC<{
  composer: UseComposerSkills;
  mode: 'staged' | 'live';
  conversationId?: string;
  draftText?: string;
  uploadItems: ComposerUploadItem[];
  triggerRef: React.RefObject<HTMLElement>;
  onClose: () => void;
}> = ({ composer, conversationId, draftText, uploadItems, triggerRef, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pane, setPane] = useState<Pane>('skills');

  // The target model drives the connectors count-vs-cap nudge (#348). Live mode
  // only — a staged (home) composer has no conversation/model yet. Read-only:
  // no write, mirrors useModelEffort's conversation.get usage.
  const [targetModel, setTargetModel] = useState<{ cap?: number; label?: string }>({});
  useEffect(() => {
    if (!conversationId) return;
    let alive = true;
    void ipcBridge.conversation.get
      .invoke({ id: conversationId })
      .then((conv) => {
        if (!alive || !conv) return;
        // Not every conversation variant carries a top-level `model` (ACP/codex
        // store it elsewhere); narrow before reading so the cap stays undefined
        // (nudge hidden) for those rather than guessing.
        const model = 'model' in conv ? conv.model : undefined;
        setTargetModel({ cap: resolveModelToolCap(model?.id, model?.useModel), label: model?.useModel });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [conversationId]);

  // Anchor the panes to the "+". Arco may open the popup above OR below the
  // trigger (and its position class is unreliable - it reports "tl" even when
  // flipped down), so detect the resolved direction from geometry: when the
  // panel sits below the trigger, top-align the panes (short left pane tucks
  // under the "+"); when above, bottom-align (panes rise from the "+").
  const wrapRef = useRef<HTMLDivElement>(null);
  const [openedBelow, setOpenedBelow] = useState(false);
  useLayoutEffect(() => {
    const measure = () => {
      const trigger = triggerRef.current;
      const wrap = wrapRef.current;
      if (!trigger || !wrap) return;
      const triggerRect = trigger.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      // Below when the panel's top sits at or beneath the trigger's top.
      setOpenedBelow(wrapRect.top >= triggerRect.top);
    };
    // Arco positions the popup across a few frames after mount, so re-measure
    // until it settles rather than trusting a single (pre-position) read.
    measure();
    const timers = [16, 60, 160].map((ms) => setTimeout(measure, ms));
    return () => timers.forEach(clearTimeout);
  }, [triggerRef]);

  // MCP stack - instantiated only while the panel is mounted (menu open).
  const [message, contextHolder] = Message.useMessage();
  const { mcpServers, saveMcpServers } = useMcpServers();
  const { setAgentInstallStatus, checkSingleServerInstallStatus } = useMcpAgentStatus();
  const { syncMcpToAgents, removeMcpFromAgents } = useMcpOperations(mcpServers, message);
  const crud = useMcpServerCRUD(
    mcpServers,
    saveMcpServers,
    syncMcpToAgents,
    removeMcpFromAgents,
    checkSingleServerInstallStatus,
    setAgentInstallStatus
  );

  const skillsOnCount = composer.onChatList.filter((s) => s.enabled).length;
  const connectorsOnCount = mcpServers.filter((s) => s.enabled !== false).length;

  const goSkills = () => navigate('/settings/skills');
  const goConnectors = () => navigate('/settings/mcp-library/browse');

  return (
    <div ref={wrapRef} className={styles.menuWrap} style={{ alignItems: openedBelow ? 'flex-start' : 'flex-end' }}>
      {contextHolder}
      <div className={styles.menu}>
        {uploadItems.map((item) => (
          <div
            key={item.key}
            className={styles.menuItem}
            role='button'
            tabIndex={0}
            onMouseEnter={() => setPane('none')}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                item.onClick();
                onClose();
              }
            }}
          >
            <span className={styles.menuLead}>
              <Upload size={17} color={iconColors.secondary} strokeWidth={1.8} />
            </span>
            <span className={styles.menuLabel}>{item.label}</span>
          </div>
        ))}

        <div className={styles.menuSep} />

        <div
          className={`${styles.menuItem} ${pane === 'skills' ? styles.menuItemActive : ''}`}
          role='button'
          tabIndex={0}
          onMouseEnter={() => setPane('skills')}
          onClick={() => setPane('skills')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setPane('skills');
          }}
        >
          <span className={styles.menuLead}>
            <Zap size={17} color={iconColors.secondary} strokeWidth={1.8} />
          </span>
          <span className={styles.menuLabel}>{t('conversation.composerMenu.skills', { defaultValue: 'Skills' })}</span>
          <span className={styles.countPill}>
            {t('conversation.composerMenu.countOn', { defaultValue: '{{count}} on', count: skillsOnCount })}
          </span>
        </div>

        <div
          className={`${styles.menuItem} ${pane === 'connectors' ? styles.menuItemActive : ''}`}
          role='button'
          tabIndex={0}
          onMouseEnter={() => setPane('connectors')}
          onClick={() => setPane('connectors')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setPane('connectors');
          }}
        >
          <span className={styles.menuLead}>
            <LayoutGrid size={17} color={iconColors.secondary} strokeWidth={1.8} />
          </span>
          <span className={styles.menuLabel}>
            {t('conversation.composerMenu.connectors', { defaultValue: 'Connectors' })}
          </span>
          <span className={styles.countPill}>
            {t('conversation.composerMenu.countOn', { defaultValue: '{{count}} on', count: connectorsOnCount })}
          </span>
        </div>
      </div>

      {pane === 'skills' && <SkillsFlyout composer={composer} draftText={draftText} onManageAll={goSkills} />}
      {pane === 'connectors' && (
        <ConnectorsFlyout
          servers={mcpServers}
          onToggle={(id, enabled) => void crud.handleToggleMcpServer(id, enabled)}
          onAddConnector={goConnectors}
          onManageConnectors={goConnectors}
          modelCap={targetModel.cap}
          modelLabel={targetModel.label}
        />
      )}
    </div>
  );
};

/**
 * Composer "+" menu: one entry point for Upload, Skills, and Connectors
 * (Krug - no third affordance). Renders the trigger button + dropdown; the heavy
 * two-pane panel mounts only while open. Used by the home composer (staged) and
 * the in-chat composer (live).
 */
const ComposerAddMenu: React.FC<ComposerAddMenuProps> = ({
  mode,
  conversationId,
  draftText,
  uploadItems,
  uploading = false,
  builtinAutoSkills,
  disabledBuiltinSkills,
  onToggleBuiltinSkill,
  onStagedSkillsChange,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Skills state lives here (not in the panel) so staged picks survive the menu
  // closing before the user sends.
  const composer = useComposerSkills({
    mode,
    conversationId,
    builtinAutoSkills,
    disabledBuiltinSkills,
    onToggleBuiltinSkill,
  });

  const stagedSkills = composer.stagedSkills;
  useEffect(() => {
    onStagedSkillsChange?.(stagedSkills);
  }, [stagedSkills, onStagedSkillsChange]);

  const droplist = useMemo(
    () =>
      open ? (
        <ComposerAddMenuPanel
          composer={composer}
          mode={mode}
          conversationId={conversationId}
          draftText={draftText}
          uploadItems={uploadItems}
          triggerRef={triggerRef}
          onClose={() => setOpen(false)}
        />
      ) : (
        <span />
      ),
    [open, composer, mode, conversationId, draftText, uploadItems]
  );

  return (
    <Dropdown
      trigger='click'
      // Prefer opening BELOW the trigger (the home composer has more room there,
      // so it never clips the top bar). Arco auto-flips ABOVE when there is not
      // enough room below (the in-chat composer sits at the viewport bottom).
      position='bl'
      popupVisible={open}
      onVisibleChange={setOpen}
      droplist={droplist}
      // The droplist is our own surface; Arco's default card padding fights the
      // two-pane layout, so render it bare (class targeted by the module CSS reset).
      triggerProps={{ className: 'composer-add-popup' }}
    >
      <span ref={triggerRef} className={open ? styles.plusOpen : styles.plusBtn}>
        <Button
          type='text'
          shape='circle'
          loading={uploading}
          icon={<Plus size={14} strokeWidth={2} color={iconColors.brand} />}
        />
      </span>
    </Dropdown>
  );
};

export default ComposerAddMenu;
