/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bot, Plus } from 'lucide-react';
import coworkSvg from '@/renderer/assets/icons/cowork.svg';
import {
  useDetectedAgents,
  useAssistantEditor,
  useAssistantList,
  useAssistantSkills,
} from '@/renderer/hooks/assistant';
import AddCustomPathModal from '@/renderer/pages/settings/AssistantSettings/AddCustomPathModal';
import AddSkillsModal from '@/renderer/pages/settings/AssistantSettings/AddSkillsModal';
import AssistantEditDrawer from '@/renderer/pages/settings/AssistantSettings/AssistantEditDrawer';
import DeleteAssistantModal from '@/renderer/pages/settings/AssistantSettings/DeleteAssistantModal';
import SkillConfirmModals from '@/renderer/pages/settings/AssistantSettings/SkillConfirmModals';
import { resolveAvatarImageSrc } from '@/renderer/pages/settings/AssistantSettings/assistantUtils';
import { CUSTOM_AVATAR_IMAGE_MAP } from '../constants';
import styles from '../index.module.css';
import type { AcpBackendConfig, AvailableAgent, EffectiveAgentInfo } from '../types';
import { Message } from '@arco-design/web-react';
import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import { resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { isImageAvatar } from '@/renderer/utils/avatar';
import { getLucideIcon } from '@/renderer/utils/lucideAvatar';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useKickoffGrid } from '@/renderer/hooks/kickoff/useKickoffGrid';
import KickoffGrid from './kickoffGrid/KickoffGrid';

type AssistantSelectionAreaProps = {
  isPresetAgent: boolean;
  selectedAgentKey?: string;
  selectedAgentInfo: AvailableAgent | undefined;
  customAgents: AcpBackendConfig[];
  localeKey: string;
  currentEffectiveAgentInfo: EffectiveAgentInfo;
  onSelectAssistant: (assistantId: string) => void;
  onSetInput: (text: string) => void;
  onFocusInput: () => void;
  onRegisterOpenDetails?: (openDetails: (() => void) | null) => void;
  /** Kickoff id shown in the single hero card; excluded from the grid so it never repeats. */
  excludeKickoffId?: string;
  /**
   * Render the suggested-prompts grid only on the focused assistant view (the
   * preset hero), NOT the new-chat/home surface where the launchpad + intent
   * pills already cover "what can I do". GuidPage passes `showPresetHero`.
   */
  showKickoffGrid?: boolean;
  /**
   * Phase 2 chat-redesign: when true, the inline pill grid is suppressed so
   * the new layered starter (Greeting + IntentPillBar + SuggestionPanel +
   * Recents) owns the new-chat surface. The modal/drawer tree (edit drawer,
   * skills modals, etc.) still mounts so existing callers can open them via
   * `onRegisterOpenDetails`. Phase 6 deletes this component outright.
   */
  hideInlineGrid?: boolean;
};

const resolveAssistantCandidateIds = (assistantId: string): string[] => {
  const stripped = assistantId.replace(/^builtin-/, '');
  return Array.from(new Set([assistantId, `builtin-${stripped}`, stripped]));
};

const AssistantSelectionArea: React.FC<AssistantSelectionAreaProps> = ({
  isPresetAgent,
  selectedAgentKey,
  selectedAgentInfo,
  customAgents,
  localeKey,
  currentEffectiveAgentInfo,
  onSelectAssistant,
  onSetInput,
  onFocusInput,
  onRegisterOpenDetails,
  excludeKickoffId,
  showKickoffGrid = false,
  hideInlineGrid = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [agentMessage, agentMessageContext] = Message.useMessage({ maxCount: 10 });

  const avatarImageMap: Record<string, string> = useMemo(
    () => ({
      'cowork.svg': coworkSvg,
      '\u{1F6E0}\u{FE0F}': coworkSvg,
    }),
    []
  );

  const { assistants, activeAssistantId, setActiveAssistantId, activeAssistant, isExtensionAssistant, loadAssistants } =
    useAssistantList();
  const { availableBackends, refreshAgentDetection } = useDetectedAgents();

  const editor = useAssistantEditor({
    localeKey,
    activeAssistant,
    isExtensionAssistant,
    setActiveAssistantId,
    loadAssistants,
    refreshAgentDetection,
    message: agentMessage,
  });

  const skills = useAssistantSkills({
    skillsModalVisible: editor.skillsModalVisible,
    customSkills: editor.customSkills,
    selectedSkills: editor.selectedSkills,
    pendingSkills: editor.pendingSkills,
    availableSkills: editor.availableSkills,
    setPendingSkills: editor.setPendingSkills,
    setCustomSkills: editor.setCustomSkills,
    setSelectedSkills: editor.setSelectedSkills,
    message: agentMessage,
  });

  const editAvatarImage = resolveAvatarImageSrc(editor.editAvatar, avatarImageMap);

  const modalTree = (
    <>
      {agentMessageContext}
      <AssistantEditDrawer
        editor={editor}
        list={{ activeAssistant, activeAssistantId, isExtensionAssistant }}
        availableBackends={availableBackends}
        editAvatarImage={editAvatarImage}
      />
      <DeleteAssistantModal
        visible={editor.deleteConfirmVisible}
        onCancel={() => editor.setDeleteConfirmVisible(false)}
        onConfirm={editor.handleDeleteConfirm}
        activeAssistant={activeAssistant}
        avatarImageMap={avatarImageMap}
      />
      <AddSkillsModal
        visible={editor.skillsModalVisible}
        onCancel={() => {
          editor.setSkillsModalVisible(false);
          skills.setSearchExternalQuery('');
        }}
        externalSources={skills.externalSources}
        activeSourceTab={skills.activeSourceTab}
        setActiveSourceTab={skills.setActiveSourceTab}
        activeSource={skills.activeSource}
        filteredExternalSkills={skills.filteredExternalSkills}
        externalSkillsLoading={skills.externalSkillsLoading}
        searchExternalQuery={skills.searchExternalQuery}
        setSearchExternalQuery={skills.setSearchExternalQuery}
        refreshing={skills.refreshing}
        handleRefreshExternal={skills.handleRefreshExternal}
        setShowAddPathModal={skills.setShowAddPathModal}
        customSkills={editor.customSkills}
        handleAddFoundSkills={skills.handleAddFoundSkills}
      />
      <SkillConfirmModals
        deletePendingSkillName={editor.deletePendingSkillName}
        setDeletePendingSkillName={editor.setDeletePendingSkillName}
        pendingSkills={editor.pendingSkills}
        setPendingSkills={editor.setPendingSkills}
        deleteCustomSkillName={editor.deleteCustomSkillName}
        setDeleteCustomSkillName={editor.setDeleteCustomSkillName}
        customSkills={editor.customSkills}
        setCustomSkills={editor.setCustomSkills}
        selectedSkills={editor.selectedSkills}
        setSelectedSkills={editor.setSelectedSkills}
        message={agentMessage}
      />
      <AddCustomPathModal
        visible={skills.showAddPathModal}
        onCancel={() => {
          skills.setShowAddPathModal(false);
          skills.setCustomPathName('');
          skills.setCustomPathValue('');
        }}
        onOk={() => void skills.handleAddCustomPath()}
        customPathName={skills.customPathName}
        setCustomPathName={skills.setCustomPathName}
        customPathValue={skills.customPathValue}
        setCustomPathValue={skills.setCustomPathValue}
      />
    </>
  );

  const resolveOpenAssistantId = (): string | null => {
    if (selectedAgentInfo?.customAgentId) return selectedAgentInfo.customAgentId;
    if (selectedAgentKey?.startsWith('custom:')) return selectedAgentKey.slice(7);
    return null;
  };

  const openAssistantDetails = useCallback(() => {
    const assistantId = resolveOpenAssistantId();
    if (!assistantId) {
      agentMessage.warning(
        t('common.failed', { defaultValue: 'Failed' }) +
          `: ${t('settings.editAssistant', { defaultValue: 'Assistant Details' })}`
      );
      return;
    }

    const candidates = resolveAssistantCandidateIds(assistantId);
    const targetAssistant = [...assistants, ...customAgents].find((assistant) => candidates.includes(assistant.id));
    if (!targetAssistant) {
      agentMessage.warning(
        t('common.failed', { defaultValue: 'Failed' }) +
          `: ${t('settings.editAssistant', { defaultValue: 'Assistant Details' })}`
      );
      return;
    }

    void editor.handleEdit(targetAssistant);
  }, [agentMessage, assistants, customAgents, editor, selectedAgentInfo?.customAgentId, selectedAgentKey, t]);

  useLayoutEffect(() => {
    if (!onRegisterOpenDetails) return;
    onRegisterOpenDetails(openAssistantDetails);
  }, [onRegisterOpenDetails, openAssistantDetails]);

  // #375 - per-assistant suggested-prompts grid for the selected-assistant
  // detail view. Same id source as GuidPage's single-card wiring
  // (selectedAgentInfo.customAgentId). Clicking a card prefills the composer
  // (editable, not auto-send) via the onSetInput/onFocusInput props.
  const kickoffGridAssistantId = isPresetAgent ? selectedAgentInfo?.customAgentId : undefined;
  const kickoffGrid = useKickoffGrid(kickoffGridAssistantId, localeKey);
  const handleKickoffSelect = useCallback(
    (prefill: string) => {
      onSetInput(prefill);
      onFocusInput();
    },
    [onSetInput, onFocusInput]
  );

  // Only render if there are preset agents
  if (!customAgents || !customAgents.some((a) => a.isPreset)) return null;

  if (isPresetAgent && selectedAgentInfo) {
    // Selected Assistant View
    return (
      <div className='mt-12px w-full'>
        <div className='flex flex-col w-full animate-fade-in'>
          {/* Main Agent Fallback Notice */}
          {currentEffectiveAgentInfo.isFallback && (
            <div
              className='mb-12px px-12px py-8px rd-8px text-12px flex items-center gap-8px'
              style={{
                background: 'rgb(var(--warning-1))',
                border: '1px solid rgb(var(--warning-3))',
                color: 'rgb(var(--warning-6))',
              }}
            >
              <span>
                {t('guid.agentFallbackNotice', {
                  original:
                    currentEffectiveAgentInfo.originalType.charAt(0).toUpperCase() +
                    currentEffectiveAgentInfo.originalType.slice(1),
                  fallback:
                    currentEffectiveAgentInfo.agentType.charAt(0).toUpperCase() +
                    currentEffectiveAgentInfo.agentType.slice(1),
                  defaultValue: `${currentEffectiveAgentInfo.originalType.charAt(0).toUpperCase() + currentEffectiveAgentInfo.originalType.slice(1)} is unavailable, using ${currentEffectiveAgentInfo.agentType.charAt(0).toUpperCase() + currentEffectiveAgentInfo.agentType.slice(1)} instead.`,
                })}
              </span>
            </div>
          )}
          {/* #375 - per-assistant suggested prompts grid. Shown ONLY on the
              focused assistant view (preset hero); hidden on the new-chat/home
              surface where the launchpad cards + intent pills already cover
              "what can I do". GuidPage passes showKickoffGrid={showPresetHero}. */}
          {showKickoffGrid &&
            (() => {
              // Exclude the kickoff already shown in the single hero card so the
              // grid never repeats it (featured card + distinct grid options).
              const gridItems = excludeKickoffId
                ? kickoffGrid.items.filter((i) => i.kickoffId !== excludeKickoffId)
                : kickoffGrid.items;
              return gridItems.length > 0 ? <KickoffGrid items={gridItems} onSelect={handleKickoffSelect} /> : null;
            })()}
        </div>
        {modalTree}
      </div>
    );
  }

  // Assistant List View - Phase 2 hides the inline pill grid; only the modal
  // tree (edit drawer, skills modals) needs to stay mounted so existing
  // callers like the hero title's edit button keep working.
  if (hideInlineGrid) {
    return <>{modalTree}</>;
  }

  return (
    <div className='mt-12px w-full'>
      <div className='flex flex-wrap gap-8px justify-center'>
        {customAgents
          .filter((a) => a.isPreset && a.enabled !== false)
          .toSorted((a, b) => {
            if (a.id === 'cowork') return -1;
            if (b.id === 'cowork') return 1;
            return 0;
          })
          .map((assistant) => {
            const avatarValue = assistant.avatar?.trim();
            const LucideIconComponent = getLucideIcon(avatarValue);
            const mappedAvatar = !LucideIconComponent && avatarValue ? CUSTOM_AVATAR_IMAGE_MAP[avatarValue] : undefined;
            const resolvedAvatar =
              !LucideIconComponent && avatarValue ? resolveExtensionAssetUrl(avatarValue) : undefined;
            const avatarImage = mappedAvatar || resolvedAvatar;
            const showImage = Boolean(avatarImage && isImageAvatar(avatarImage));
            return (
              <div
                key={assistant.id}
                data-testid={`preset-pill-${assistant.id}`}
                className='h-28px group flex items-center gap-8px px-16px rd-100px cursor-pointer transition-all b-1 b-solid bg-fill-0 hover:bg-fill-1 select-none'
                style={{
                  borderWidth: '1px',
                  borderColor: 'color-mix(in srgb, var(--color-border-2) 70%, transparent)',
                }}
                onClick={() => onSelectAssistant(`custom:${assistant.id}`)}
              >
                {LucideIconComponent ? (
                  <LucideIconComponent size={16} className='text-[var(--color-text-2)]' />
                ) : showImage ? (
                  <img src={avatarImage} alt='' width={16} height={16} style={{ objectFit: 'contain' }} />
                ) : avatarValue ? (
                  <span style={{ fontSize: 16, lineHeight: '18px' }}>{avatarValue}</span>
                ) : (
                  <Bot size={16} />
                )}
                <span className='text-14px text-2 hover:text-1'>
                  {assistant.nameI18n?.[localeKey] || assistant.name}
                </span>
              </div>
            );
          })}
        <div
          data-testid='btn-add-preset'
          className='flex items-center justify-center h-28px w-28px rd-50% bg-fill-0 hover:bg-fill-2 cursor-pointer b-1 b-dashed select-none transition-colors'
          style={{ borderWidth: '1px', borderColor: 'color-mix(in srgb, var(--color-border-2) 70%, transparent)' }}
          onClick={() => navigate('/settings/assistants')}
        >
          <Plus size={14} className='line-height-0 text-[var(--color-text-3)]' />
        </div>
      </div>
      {modalTree}
    </div>
  );
};

export default AssistantSelectionArea;
