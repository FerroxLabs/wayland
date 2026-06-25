/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { closestCenter, DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bot, PictureInPicture2, Plus, X } from 'lucide-react';
import { ipcBridge } from '@/common';
import type { TChatConversation } from '@/common/config/storage';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { CUSTOM_AVATAR_IMAGE_MAP } from '@/renderer/pages/guid/constants';
import { isLucideAvatar, renderLucideAvatar } from '@/renderer/utils/lucideAvatar';
import { getAgentLogo } from '@/renderer/utils/model/agentLogo';
import { emitter } from '@/renderer/utils/emitter';
import { cleanupSiderTooltips } from '@/renderer/utils/ui/siderTooltip';
import { updateWorkspaceTime } from '@/renderer/utils/workspace/workspaceHistory';
import { Dropdown, Menu, Message, Tag } from '@arco-design/web-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useConversationTabs, type ConversationTab } from '../hooks/ConversationTabsContext';
import { useConversationAgents } from '../hooks/useConversationAgents';
import { applyDefaultConversationName } from '../utils/newConversationName';
import { buildCliAgentParams, buildPresetAssistantParams } from '../utils/createConversationParams';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { iconColors } from '@/renderer/styles/colors';

const TAB_OVERFLOW_THRESHOLD = 10;

interface TabFadeState {
  left: boolean;
  right: boolean;
}

interface ConversationTabViewProps {
  tabId: string;
  tabName: string;
  isActive: boolean;
  isMobile: boolean;
  /** This tab's conversation is open in a pop-out window (dimmed, non-navigable). */
  isPoppedOut: boolean;
  /** Pop-out is available (Electron desktop only). */
  canPopout: boolean;
  contextMenu: React.ReactNode;
  onSwitch: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onPopout: (tabId: string) => void;
}

const ConversationTabView: React.FC<ConversationTabViewProps> = ({
  tabId,
  tabName,
  isActive,
  isMobile,
  isPoppedOut,
  canPopout,
  contextMenu,
  onSwitch,
  onClose,
  onPopout,
}) => {
  const { t } = useTranslation();
  const tabClassName = `group/tab flex items-center gap-8px px-12px h-full max-w-240px transition-all duration-200 shrink-0 border-r border-[color:var(--border-base)] ${
    isPoppedOut ? 'opacity-50 cursor-default' : 'cursor-pointer'
  } ${isActive && !isPoppedOut ? 'bg-1 text-[color:var(--color-text-1)] font-medium' : 'bg-2 text-[color:var(--color-text-3)] hover:text-[color:var(--color-text-2)] border-b border-[color:var(--border-base)]'}`;

  return (
    <Dropdown droplist={contextMenu} trigger='contextMenu' position='bl'>
      <div
        className={tabClassName}
        style={{ borderRight: '1px solid var(--border-base)' }}
        // A popped-out tab is a non-navigable placeholder; clicking it focuses
        // the pop-out window instead of switching the main view.
        onClick={() => (isPoppedOut ? onPopout(tabId) : onSwitch(tabId))}
        title={isPoppedOut ? t('conversation.tabs.poppedOut') : isMobile ? undefined : tabName}
      >
        <span className='text-15px whitespace-nowrap overflow-hidden text-ellipsis select-none flex-1'>{tabName}</span>
        {canPopout && !isPoppedOut && (
          <PictureInPicture2
            size={13}
            color={iconColors.secondary}
            className='shrink-0 opacity-0 group-hover/tab:opacity-100 transition-opacity duration-200 hover:text-[var(--brand)]'
            aria-label={t('conversation.tabs.popOut')}
            onClick={(event) => {
              event.stopPropagation();
              onPopout(tabId);
            }}
          />
        )}
        <X
          size={14}
          color={iconColors.secondary}
          className='shrink-0 transition-all duration-200 hover:fill-[rgb(var(--danger-6))]'
          onClick={(event) => {
            event.stopPropagation();
            onClose(tabId);
          }}
        />
      </div>
    </Dropdown>
  );
};

const SortableConversationTabView: React.FC<ConversationTabViewProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.tabId,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Hide the source tab while it is being dragged (the DragOverlay renders the moving copy)
    opacity: isDragging ? 0 : undefined,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className='h-full shrink-0' {...attributes} {...listeners}>
      <ConversationTabView {...props} />
    </div>
  );
};

interface CreateConversationTriggerProps {
  disabled: boolean;
  title: string;
  menu: React.ReactNode;
}

const CreateConversationTrigger: React.FC<CreateConversationTriggerProps> = ({ disabled, title, menu }) => (
  <Dropdown droplist={menu} trigger='click' position='bl' disabled={disabled}>
    <div
      className={`flex items-center justify-center w-40px h-40px shrink-0 transition-colors duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[var(--color-fill-2)]'}`}
      style={{ borderLeft: '1px solid var(--border-base)' }}
      title={title}
    >
      <Plus size={16} color={iconColors.primary} strokeWidth={3} />
    </div>
  </Dropdown>
);

/**
 * Conversation tabs bar component
 *
 * Displays all open conversation tabs, supports switching, closing, and creating new conversations
 */
const ConversationTabs: React.FC = () => {
  const layout = useLayoutContext();
  const isMobile = layout?.isMobile ?? false;
  const {
    openTabs,
    activeTabId,
    switchTab,
    closeTab,
    closeAllTabs,
    closeTabsToLeft,
    closeTabsToRight,
    closeOtherTabs,
    reorderTabs,
    openTab,
  } = useConversationTabs();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [tabFadeState, setTabFadeState] = useState<TabFadeState>({ left: false, right: false });
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  // #27 phase 2: tear-off model. Popping a chat out DETACHES it - its tab is
  // removed from this window so the chat lives only in its pop-out window (no
  // confusing duplicate). The detached tab is stashed here so docking back (or
  // closing the window) re-adds it without a re-fetch. `poppedOutIds` is retained
  // for the dimmed-placeholder path but is no longer populated under tear-off.
  const [poppedOutIds, setPoppedOutIds] = useState<Set<string>>(() => new Set());
  const detachedTabsRef = useRef<Map<string, ConversationTab>>(new Map());
  const canPopout = isElectronDesktop();

  // PointerSensor with an 8px activation distance so a plain click still switches/closes a tab
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { cliAgents, presetAssistants, isLoading } = useConversationAgents();
  const defaultConversationName = t('conversation.welcome.newConversation');
  const isCreatingRef = useRef(false);

  // Update tab overflow state
  const updateTabOverflow = useCallback(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const hasOverflow = scrollWidth > clientWidth + 1;

    const nextState: TabFadeState = {
      left: hasOverflow && scrollLeft > TAB_OVERFLOW_THRESHOLD,
      right: hasOverflow && scrollLeft + clientWidth < scrollWidth - TAB_OVERFLOW_THRESHOLD,
    };

    setTabFadeState((prev) => {
      if (prev.left === nextState.left && prev.right === nextState.right) return prev;
      return nextState;
    });
  }, []);

  // Update overflow state when tabs change
  useEffect(() => {
    updateTabOverflow();
  }, [updateTabOverflow, openTabs.length]);

  // Listen to scroll and window resize events
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const handleScroll = () => updateTabOverflow();
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateTabOverflow);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateTabOverflow());
      resizeObserver.observe(container);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateTabOverflow);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [updateTabOverflow]);

  // Switch tab and navigate
  const handleSwitchTab = useCallback(
    (tabId: string) => {
      cleanupSiderTooltips();
      switchTab(tabId);
      void navigate(`/conversation/${tabId}`);
    },
    [switchTab, navigate]
  );

  // Pop a tab out into its own OS window and DETACH it from this window (tear-off
  // model): the chat now lives only in the pop-out, so there is no duplicate
  // tab+window. Stash the tab so docking back restores it. If the window cannot
  // open, nothing is detached.
  const handlePopoutTab = useCallback(
    (tabId: string) => {
      cleanupSiderTooltips();
      const tab = openTabs.find((tt) => tt.id === tabId);
      if (tab) detachedTabsRef.current.set(tabId, tab);
      void ipcBridge.conversation.popout
        .invoke({ conversation_id: tabId })
        .then(() => {
          // Detach: drop the tab from this window. If it was the active one,
          // move this window to the next remaining tab (or home) so it is not
          // still showing the conversation that just left.
          const remaining = openTabs.filter((tt) => tt.id !== tabId);
          closeTab(tabId);
          if (tabId === activeTabId) {
            void navigate(remaining.length > 0 ? `/conversation/${remaining[remaining.length - 1].id}` : '/guid');
          }
        })
        .catch((error) => {
          console.error('[Popout] Failed to open pop-out window:', error);
          detachedTabsRef.current.delete(tabId);
        });
    },
    [openTabs, activeTabId, closeTab, navigate]
  );

  // Dock a popped-out tab back into the main window (close its pop-out). The
  // conversation.popoutClosed emitter clears the placeholder.
  const handleDockBackTab = useCallback((tabId: string) => {
    void ipcBridge.conversation.dockBack.invoke({ conversation_id: tabId }).catch((error) => {
      console.error('[Popout] Failed to dock-back:', error);
    });
  }, []);

  // Restore a placeholder tab when its pop-out closes by any path (dock-back, OS
  // close, app quit). Broadcast to all windows by the main process.
  useEffect(() => {
    if (!canPopout) return;
    return ipcBridge.conversation.popoutClosed.on(({ conversation_id }) => {
      // Tear-off restore: dock-back or window-close re-adds the detached tab to
      // this window and focuses it. Reconstruct the minimal conversation shape
      // openTab needs from the stashed tab (no refetch).
      const tab = detachedTabsRef.current.get(conversation_id);
      if (tab) {
        detachedTabsRef.current.delete(conversation_id);
        openTab({
          id: tab.id,
          name: tab.name,
          type: tab.type,
          extra: { workspace: tab.workspace },
        } as TChatConversation);
        void navigate(`/conversation/${conversation_id}`);
      }
      setPoppedOutIds((prev) => {
        if (!prev.has(conversation_id)) return prev;
        const next = new Set(prev);
        next.delete(conversation_id);
        return next;
      });
    });
  }, [canPopout, openTab, navigate]);

  // Close tab
  const handleCloseTab = useCallback(
    (tabId: string) => {
      cleanupSiderTooltips();
      closeTab(tabId);
      // If closing current tab, context auto-handles navigation (switch to last)
      // If no tabs remain, navigate to welcome page
      if (openTabs.length === 1 && tabId === activeTabId) {
        void navigate('/guid');
      }
    },
    [closeTab, openTabs.length, activeTabId, navigate]
  );

  // Begin dragging a tab
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  // Finish dragging a tab: reorder by computing old/new index from active/over ids
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);

      if (!over || active.id === over.id) return;

      const oldIndex = openTabs.findIndex((tab) => tab.id === active.id);
      const newIndex = openTabs.findIndex((tab) => tab.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      reorderTabs(oldIndex, newIndex);
    },
    [openTabs, reorderTabs]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  // Create a new conversation after selecting an agent/assistant from the dropdown
  const handleCreateConversation = useCallback(
    async (key: string) => {
      if (isCreatingRef.current) return;
      isCreatingRef.current = true;

      const currentTab = openTabs.find((tab) => tab.id === activeTabId);
      if (!currentTab?.workspace) {
        isCreatingRef.current = false;
        void navigate('/guid');
        return;
      }

      const workspace = currentTab.workspace;

      try {
        // [BUG-3] Build params inside try block: getDefaultGeminiModel() may throw if no model configured
        let params;

        if (key.startsWith('cli:')) {
          const backend = key.slice(4);
          // [BUG-6] Null check: find() may return undefined
          const agent = cliAgents.find((a) => a.backend === backend);
          if (!agent) {
            Message.error(t('conversation.createFailed'));
            return;
          }
          params = await buildCliAgentParams(agent, workspace);
        } else if (key.startsWith('preset:')) {
          const assistantId = key.slice(7);
          // [BUG-6] Null check: find() may return undefined
          const agent = presetAssistants.find((a) => a.customAgentId === assistantId);
          if (!agent) {
            Message.error(t('conversation.createFailed'));
            return;
          }
          params = await buildPresetAssistantParams(agent, workspace, i18n.language);
        } else {
          return;
        }

        // Use conversation.create (calls ConversationService) not createWithConversation (direct DB insert)
        const newConversation = await ipcBridge.conversation.create.invoke(
          applyDefaultConversationName(params, defaultConversationName)
        );

        // [BUG-5] Order matters: closeAllTabs() must come before openTab() to prevent append behavior
        closeAllTabs();
        updateWorkspaceTime(workspace);
        openTab(newConversation);
        void navigate(`/conversation/${newConversation.id}`);
        emitter.emit('chat.history.refresh');
      } catch (error) {
        // [BUG-3] Unified catch: handles both param building errors (getDefaultGeminiModel) and IPC errors
        console.error('Failed to create conversation:', error);
        Message.error(t('conversation.createFailed'));
      } finally {
        isCreatingRef.current = false;
      }
    },
    [
      navigate,
      openTabs,
      activeTabId,
      cliAgents,
      presetAssistants,
      closeAllTabs,
      openTab,
      t,
      i18n.language,
      defaultConversationName,
    ]
  );

  // Render agent dropdown menu
  const renderAgentDropdownMenu = useCallback(() => {
    return (
      // Cap the width so the droplist doesn't stretch to the full viewport on
      // large displays (#144); the menu items are short agent names.
      <Menu onClickMenuItem={(key) => void handleCreateConversation(key)} style={{ minWidth: 200, maxWidth: 320 }}>
        {cliAgents.length > 0 && (
          <Menu.ItemGroup title={t('conversation.dropdown.cliAgents')}>
            {cliAgents.map((agent) => {
              const logo = getAgentLogo(agent.backend);
              return (
                <Menu.Item key={`cli:${agent.backend}`}>
                  <div className='flex items-center gap-8px'>
                    {logo ? (
                      <img src={logo} alt={agent.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <Bot size={16} />
                    )}
                    <span>{agent.name}</span>
                    {agent.isExtension && (
                      <Tag size='small' color='arcoblue'>
                        ext
                      </Tag>
                    )}
                  </div>
                </Menu.Item>
              );
            })}
          </Menu.ItemGroup>
        )}
        {presetAssistants.length > 0 && (
          <Menu.ItemGroup title={t('conversation.dropdown.presetAssistants')}>
            {presetAssistants.map((agent) => {
              const avatarImage = agent.avatar ? CUSTOM_AVATAR_IMAGE_MAP[agent.avatar] : undefined;
              const isLucide = !avatarImage && isLucideAvatar(agent.avatar);
              const isEmoji = agent.avatar && !avatarImage && !isLucide && !agent.avatar.endsWith('.svg');
              return (
                <Menu.Item key={`preset:${agent.customAgentId}`}>
                  <div className='flex items-center gap-8px'>
                    {avatarImage ? (
                      <img src={avatarImage} alt={agent.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : isLucide ? (
                      (renderLucideAvatar(agent.avatar, 16) ?? <Bot size={16} />)
                    ) : isEmoji ? (
                      <span style={{ fontSize: 14, lineHeight: '16px' }}>{agent.avatar}</span>
                    ) : (
                      <Bot size={16} />
                    )}
                    <span>{agent.name}</span>
                  </div>
                </Menu.Item>
              );
            })}
          </Menu.ItemGroup>
        )}
      </Menu>
    );
  }, [cliAgents, presetAssistants, handleCreateConversation, t]);

  // Generate context menu content
  const getContextMenu = useCallback(
    (tabId: string) => {
      const tabIndex = openTabs.findIndex((tab) => tab.id === tabId);
      const hasLeftTabs = tabIndex > 0;
      const hasRightTabs = tabIndex < openTabs.length - 1;
      const hasOtherTabs = openTabs.length > 1;
      const isPoppedOut = poppedOutIds.has(tabId);

      return (
        <Menu
          onClickMenuItem={(key) => {
            switch (key) {
              case 'pop-out':
                handlePopoutTab(tabId);
                break;
              case 'dock-back':
                handleDockBackTab(tabId);
                break;
              case 'close-all':
                closeAllTabs();
                void navigate('/guid');
                break;
              case 'close-left':
                closeTabsToLeft(tabId);
                break;
              case 'close-right':
                closeTabsToRight(tabId);
                break;
              case 'close-others':
                closeOtherTabs(tabId);
                void navigate(`/conversation/${tabId}`);
                break;
            }
          }}
        >
          {canPopout &&
            (isPoppedOut ? (
              <Menu.Item key='dock-back'>{t('conversation.tabs.dockBack')}</Menu.Item>
            ) : (
              <Menu.Item key='pop-out'>{t('conversation.tabs.popOut')}</Menu.Item>
            ))}
          <Menu.Item key='close-others' disabled={!hasOtherTabs}>
            {t('conversation.tabs.closeOthers')}
          </Menu.Item>
          <Menu.Item key='close-left' disabled={!hasLeftTabs}>
            {t('conversation.tabs.closeLeft')}
          </Menu.Item>
          <Menu.Item key='close-right' disabled={!hasRightTabs}>
            {t('conversation.tabs.closeRight')}
          </Menu.Item>
          <Menu.Item key='close-all'>{t('conversation.tabs.closeAll')}</Menu.Item>
        </Menu>
      );
    },
    [
      openTabs,
      closeAllTabs,
      closeTabsToLeft,
      closeTabsToRight,
      closeOtherTabs,
      navigate,
      t,
      canPopout,
      poppedOutIds,
      handlePopoutTab,
      handleDockBackTab,
    ]
  );

  const { left: showLeftFade, right: showRightFade } = tabFadeState;
  // Check if current active tab is in openTabs
  const isActiveTabInList = openTabs.some((tab) => tab.id === activeTabId);

  // If no open tabs, or active conversation is not in tabs (switched to non-workspace chat), hide component
  if (openTabs.length === 0 || !isActiveTabInList) {
    return null;
  }

  const isDropdownDisabled = isLoading || (!cliAgents.length && !presetAssistants.length);
  const isDragging = activeDragId !== null;
  const draggingTab = isDragging ? openTabs.find((tab) => tab.id === activeDragId) : undefined;

  return (
    <div className='relative shrink-0 bg-2 min-h-40px'>
      <div className='relative flex items-center h-40px w-full border-t border-x border-solid border-[color:var(--border-base)]'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {/* Tabs scroll area - horizontal scroll is disabled mid-drag so the dragged tab tracks the pointer */}
          <div
            ref={tabsContainerRef}
            className={`flex items-center h-full flex-1 overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isDragging ? 'overflow-x-hidden' : 'overflow-x-auto'}`}
          >
            <SortableContext items={openTabs.map((tab) => tab.id)} strategy={horizontalListSortingStrategy}>
              {openTabs.map((tab) => (
                <SortableConversationTabView
                  key={tab.id}
                  tabId={tab.id}
                  tabName={tab.name}
                  isActive={tab.id === activeTabId}
                  isMobile={isMobile}
                  isPoppedOut={poppedOutIds.has(tab.id)}
                  canPopout={canPopout}
                  contextMenu={getContextMenu(tab.id)}
                  onSwitch={handleSwitchTab}
                  onClose={handleCloseTab}
                  onPopout={handlePopoutTab}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {draggingTab ? (
              <div className='flex items-center gap-8px px-12px h-40px max-w-240px bg-1 text-[color:var(--color-text-1)] font-medium border border-[color:var(--border-base)] shadow-lg'>
                <span className='text-15px whitespace-nowrap overflow-hidden text-ellipsis select-none'>
                  {draggingTab.name}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* New conversation button - click to show agent dropdown */}
        <CreateConversationTrigger
          disabled={isDropdownDisabled}
          title={t('conversation.workspace.createNewConversation')}
          menu={renderAgentDropdownMenu()}
        />

        {/* Left gradient indicator */}
        {showLeftFade && (
          <div className='pointer-events-none absolute left-0 top-0 bottom-0 w-32px [background:linear-gradient(90deg,var(--bg-2)_0%,transparent_100%)]' />
        )}

        {/* Right gradient indicator */}
        {showRightFade && (
          <div className='pointer-events-none absolute right-40px top-0 bottom-0 w-32px [background:linear-gradient(270deg,var(--bg-2)_0%,transparent_100%)]' />
        )}
      </div>
    </div>
  );
};

export default ConversationTabs;
