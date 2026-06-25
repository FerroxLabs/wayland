import { PanelRightClose, PanelRightOpen, PictureInPicture2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { ConfigStorage } from '@/common/config/storage';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { useIsPopoutMode } from '@/renderer/hooks/system/useIsPopoutMode';
import AgentBadge from '@/renderer/components/agent/AgentBadge';
import type { PresetAssistantInfo } from '@/renderer/hooks/agent/usePresetAssistantInfo';
import FlexFullContainer from '@/renderer/components/layout/FlexFullContainer';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { useResizableSplit } from '@/renderer/hooks/ui/useResizableSplit';
import ConversationTabs from '@/renderer/pages/conversation/components/ConversationTabs';
import ChatTitleEditor from '@/renderer/pages/conversation/components/ChatTitleEditor';
import ConversationTitleMinimap from '@/renderer/pages/conversation/components/ConversationTitleMinimap';
import MobileWorkspaceOverlay from './MobileWorkspaceOverlay';
import WorkspacePanelHeader, { DesktopWorkspaceToggle } from './WorkspacePanelHeader';
import { useConversationTabs } from '@/renderer/pages/conversation/hooks/ConversationTabsContext';
import { useContainerWidth } from '@/renderer/pages/conversation/hooks/useContainerWidth';
import { useLayoutConstraints } from '@/renderer/pages/conversation/hooks/useLayoutConstraints';
import { usePreviewAutoCollapse } from '@/renderer/pages/conversation/hooks/usePreviewAutoCollapse';
import { useTitleRename } from '@/renderer/pages/conversation/hooks/useTitleRename';
import { useWorkspaceCollapse } from '@/renderer/pages/conversation/hooks/useWorkspaceCollapse';
import { PreviewPanel, usePreviewContext } from '@/renderer/pages/conversation/Preview';
import { dispatchWorkspaceToggleEvent } from '@/renderer/utils/workspace/workspaceEvents';
import { ACP_BACKENDS_ALL } from '@/common/types/acpTypes';
import classNames from 'classnames';
import { isMacEnvironment, isWindowsEnvironment } from '@/renderer/pages/conversation/utils/detectPlatform';
import {
  MIN_WORKSPACE_RATIO,
  WORKSPACE_HEADER_HEIGHT,
  calcLayoutMetrics,
} from '@/renderer/pages/conversation/utils/layoutCalc';
import { Layout as ArcoLayout } from '@arco-design/web-react';
import React from 'react';
import useSWR from 'swr';
import './chat-layout.css';

// headerExtra allows injecting custom actions (e.g., model picker) into the header's right area
const ChatLayout: React.FC<{
  children: React.ReactNode;
  title?: React.ReactNode;
  sider: React.ReactNode;
  siderTitle?: React.ReactNode;
  backend?: string;
  /** Preset assistant info - when provided, badge shows assistant identity instead of backend */
  presetAssistant?: PresetAssistantInfo & { id?: string };
  /** Fallback agent name (used when no presetAssistant, e.g. from conversation.extra.agentName) */
  agentName?: string;
  headerExtra?: React.ReactNode;
  headerLeft?: React.ReactNode;
  workspaceEnabled?: boolean;
  /** Conversation ID for mode switching */
  conversationId?: string;
  /** Custom tabs slot; when provided, replaces the default ConversationTabs */
  tabsSlot?: React.ReactNode;
  /** Workspace path for opening in external tools */
  workspacePath?: string;
  /** Custom rename handler; when provided, replaces the default conversation.update rename flow */
  onRenameTitle?: (newName: string) => Promise<boolean>;
  /**
   * When true, suppresses the built-in header bar so a caller can inject its
   * own header (e.g. WorkflowHeader on workflow conversations). The sider and
   * workspace panel are unaffected.
   */
  hideHeader?: boolean;
}> = (props) => {
  const { conversationId, workspacePath } = props;
  const { backend, presetAssistant, agentName } = props;
  const { t } = useTranslation();
  // #27 phase 2: in a pop-out window, hide the tab bar and surface a Dock-back
  // action. The workspace COMES WITH the chat (the conversation's workspace is
  // its working context), so the panel + its toggle stay enabled in the pop-out;
  // only the tab bar is removed.
  const isPopout = useIsPopoutMode();
  const workspaceEnabled = props.workspaceEnabled ?? true;
  const layout = useLayoutContext();
  const isMacRuntime = isMacEnvironment();
  const isWindowsRuntime = isWindowsEnvironment();
  const isDesktop = !layout?.isMobile;
  const isMobile = Boolean(layout?.isMobile);

  // Preview panel state
  const { isOpen: isPreviewOpen } = usePreviewContext();

  // --- Hook A: workspace collapse ---
  const { rightSiderCollapsed, setRightSiderCollapsed } = useWorkspaceCollapse({
    workspaceEnabled,
    isMobile,
    conversationId,
  });

  // --- Hook B: container width ---
  const { containerRef, containerWidth } = useContainerWidth();

  // --- Hook C: title rename ---
  const { openTabs, updateTabName } = useConversationTabs();
  const hasTabs = openTabs.length > 0;

  const { editingTitle, setEditingTitle, titleDraft, setTitleDraft, renameLoading, canRenameTitle, submitTitleRename } =
    useTitleRename({
      title: props.title,
      conversationId,
      updateTabName,
      onRename: props.onRenameTitle,
    });

  // Fetch custom agents config as fallback when agentName is not provided
  const needCustomFallback = backend === 'custom' && !presetAssistant && !agentName;
  const { data: customAgents } = useSWR(needCustomFallback ? 'acp.customAgents' : null, () =>
    ConfigStorage.get('acp.customAgents')
  );

  // Display names for non-ACP backends (the ACP_BACKENDS_ALL registry only
  // covers ACP-protocol agents; native-spawn backends like wcore need
  // their own friendly-name lookup so the badge doesn't show the raw id).
  const NON_ACP_BACKEND_DISPLAY_NAMES: Record<string, string> = {
    wcore: 'Wayland Core',
  };

  // Compute display name with fallback chain
  const displayName =
    presetAssistant?.name ||
    agentName ||
    (backend === 'custom' && customAgents?.[0]?.name) ||
    ACP_BACKENDS_ALL[backend as keyof typeof ACP_BACKENDS_ALL]?.name ||
    (backend ? NON_ACP_BACKEND_DISPLAY_NAMES[backend] : undefined) ||
    backend;

  const {
    splitRatio: workspaceSplitRatio,
    setSplitRatio: setWorkspaceSplitRatio,
    createDragHandle: createWorkspaceDragHandle,
  } = useResizableSplit({
    defaultWidth: 20,
    minWidth: MIN_WORKSPACE_RATIO,
    maxWidth: 40,
    storageKey: 'chat-workspace-split-ratio',
  });

  // Pre-hook metrics: compute dynamic min/max for the chat-preview split hook
  const { dynamicChatMinRatio, dynamicChatMaxRatio } = calcLayoutMetrics({
    containerWidth,
    workspaceSplitRatio,
    chatSplitRatio: 60, // placeholder; only dynamicChatMinRatio/dynamicChatMaxRatio are used here
    workspaceEnabled,
    isDesktop,
    isPreviewOpen,
    rightSiderCollapsed,
    isMobile,
  });

  const {
    splitRatio: chatSplitRatio,
    setSplitRatio: setChatSplitRatio,
    createDragHandle: createPreviewDragHandle,
  } = useResizableSplit({
    defaultWidth: 60,
    minWidth: dynamicChatMinRatio,
    maxWidth: dynamicChatMaxRatio,
    storageKey: 'chat-preview-split-ratio',
  });

  // Full metrics with real chatSplitRatio
  const { chatFlex, workspaceFlex, workspaceWidthPx, titleAreaMaxWidth, mobileWorkspaceHandleRight } =
    calcLayoutMetrics({
      containerWidth,
      workspaceSplitRatio,
      chatSplitRatio,
      workspaceEnabled,
      isDesktop,
      isPreviewOpen,
      rightSiderCollapsed,
      isMobile,
    });

  // --- Hook D: preview auto-collapse ---
  usePreviewAutoCollapse({
    isPreviewOpen,
    isDesktop,
    workspaceEnabled,
    rightSiderCollapsed,
    setRightSiderCollapsed,
    siderCollapsed: layout?.siderCollapsed,
    setSiderCollapsed: layout?.setSiderCollapsed,
  });

  // --- Hook E: layout constraints ---
  useLayoutConstraints({
    containerWidth,
    workspaceEnabled,
    isDesktop,
    isPreviewOpen,
    rightSiderCollapsed,
    setRightSiderCollapsed,
    workspaceSplitRatio,
    setWorkspaceSplitRatio,
    chatSplitRatio,
    setChatSplitRatio,
    dynamicChatMinRatio,
    dynamicChatMaxRatio,
  });

  const handleDockBack = React.useCallback(() => {
    if (!conversationId) return;
    void ipcBridge.conversation.dockBack.invoke({ conversation_id: conversationId }).catch((error) => {
      console.error('[Popout] Dock-back failed:', error);
    });
  }, [conversationId]);

  // Pop-out chats force the tab bar off; the main window keeps the caller's
  // tabsSlot (or the default ConversationTabs).
  const resolvedTabsSlot = isPopout ? null : props.tabsSlot !== undefined ? props.tabsSlot : <ConversationTabs />;

  const headerBlock = (
    <>
      <ArcoLayout.Header
        className={classNames(
          'min-h-44px flex items-center justify-between px-16px pt-8px pb-10px gap-16px !bg-1 chat-layout-header chat-layout-header--glass overflow-hidden',
          layout?.isMobile && 'chat-layout-header--mobile-unified'
        )}
      >
        <div className='shrink-0'>{props.headerLeft}</div>
        <FlexFullContainer className='h-full min-w-0' containerClassName='flex items-center gap-16px'>
          {!layout?.isMobile && !hasTabs && (
            <ChatTitleEditor
              editingTitle={editingTitle}
              titleDraft={titleDraft}
              setTitleDraft={setTitleDraft}
              setEditingTitle={setEditingTitle}
              renameLoading={renameLoading}
              canRenameTitle={canRenameTitle}
              submitTitleRename={submitTitleRename}
              titleAreaMaxWidth={titleAreaMaxWidth}
              title={props.title}
              conversationId={conversationId}
            />
          )}
          {(hasTabs || layout?.isMobile) && <ConversationTitleMinimap conversationId={conversationId} hideTrigger />}
        </FlexFullContainer>
        <div className='flex items-center gap-12px shrink-0'>
          {isPopout && isElectronDesktop() && (
            <button
              type='button'
              className='workspace-header__toggle'
              aria-label={t('conversation.tabs.dockBack')}
              title={t('conversation.tabs.dockBack')}
              onClick={handleDockBack}
            >
              <PictureInPicture2 size={16} />
            </button>
          )}
          {props.headerExtra}
          {(backend || presetAssistant) && (
            <AgentBadge
              backend={backend}
              agentName={displayName}
              agentLogo={presetAssistant?.logo}
              agentLogoIsEmoji={presetAssistant?.isEmoji}
              assistantId={presetAssistant?.id}
            />
          )}
          {isWindowsRuntime && workspaceEnabled && (
            <button
              type='button'
              className='workspace-header__toggle'
              aria-label='Toggle workspace'
              onClick={() => dispatchWorkspaceToggleEvent()}
            >
              {rightSiderCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
            </button>
          )}
        </div>
      </ArcoLayout.Header>
      {resolvedTabsSlot}
    </>
  );

  return (
    <ArcoLayout
      className='size-full'
      style={{
        // fontFamily: `cursive,"anthropicSans","anthropicSans Fallback",system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif`,
      }}
    >
      <div ref={containerRef} className='flex flex-1 relative w-full overflow-hidden'>
        {isPreviewOpen && isDesktop ? (
          /* Desktop with preview: header spans chat+preview, preview sits below header */
          <>
            <div className='flex flex-col flex-1 min-w-0'>
              {!props.hideHeader && <div className='shrink-0 !bg-1'>{headerBlock}</div>}
              <div className='flex flex-1 min-h-0 relative'>
                <div
                  className='flex flex-col relative'
                  style={{
                    flexGrow: 0,
                    flexShrink: 0,
                    flexBasis: `${chatFlex}%`,
                    minWidth: '240px',
                  }}
                >
                  <ArcoLayout.Content className='flex flex-col flex-1 bg-1 overflow-hidden'>
                    {props.children}
                  </ArcoLayout.Content>
                </div>
                <div
                  className='preview-panel flex flex-col relative overflow-visible rounded-[15px] mb-[12px] mr-[12px] ml-[8px]'
                  style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    flexBasis: 0,
                    border: '1px solid var(--bg-3)',
                    minWidth: '260px',
                    boxSizing: 'border-box',
                  }}
                >
                  {createPreviewDragHandle({
                    className: 'absolute top-0 bottom-0 z-30',
                    style: { width: '20px', left: '-20px' },
                    linePlacement: 'end',
                    lineClassName: 'opacity-30 group-hover:opacity-100 group-active:opacity-100',
                    lineStyle: { width: '2px' },
                  })}
                  <div className='h-full w-full overflow-hidden rounded-[15px]'>
                    <PreviewPanel />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Desktop without preview / Mobile */
          <>
            <div
              className='flex flex-col relative'
              style={{
                flexGrow: chatFlex,
                flexShrink: 0,
                flexBasis: 0,
                display: isPreviewOpen && layout?.isMobile ? 'none' : 'flex',
                minWidth: isDesktop ? '240px' : '100%',
              }}
            >
              <ArcoLayout.Content
                className='flex flex-col h-full'
                onClick={() => {
                  if (window.innerWidth < 768 && !rightSiderCollapsed) setRightSiderCollapsed(true);
                }}
              >
                {!props.hideHeader && headerBlock}
                <ArcoLayout.Content className='flex flex-col flex-1 bg-1 overflow-hidden'>
                  {props.children}
                </ArcoLayout.Content>
              </ArcoLayout.Content>
            </div>
            {isPreviewOpen && (
              <div
                className={classNames(
                  'preview-panel flex flex-col relative overflow-visible rounded-[15px]',
                  'm-[8px]'
                )}
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 0,
                  border: '1px solid var(--bg-3)',
                  width: 'calc(100% - 16px)',
                  maxWidth: 'calc(100% - 16px)',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              >
                <div className='h-full w-full overflow-hidden rounded-[15px]'>
                  <PreviewPanel />
                </div>
              </div>
            )}
          </>
        )}
        {workspaceEnabled && !layout?.isMobile && (
          <div
            className={classNames('!bg-1 relative chat-layout-right-sider layout-sider')}
            style={{
              flexGrow: isPreviewOpen ? 0 : workspaceFlex,
              flexShrink: 0,
              flexBasis: rightSiderCollapsed ? '0px' : isPreviewOpen ? `${Math.round(workspaceWidthPx)}px` : 0,
              width: rightSiderCollapsed ? '0px' : isPreviewOpen ? `${Math.round(workspaceWidthPx)}px` : undefined,
              minWidth: rightSiderCollapsed ? '0px' : '220px',
              overflow: 'hidden',
              borderLeft: rightSiderCollapsed ? 'none' : '1px solid var(--bg-3)',
            }}
          >
            {isDesktop &&
              !rightSiderCollapsed &&
              createWorkspaceDragHandle({ className: 'absolute left-0 top-0 bottom-0', style: {}, reverse: true })}
            <WorkspacePanelHeader
              showToggle={!isMacRuntime && !isWindowsRuntime}
              collapsed={rightSiderCollapsed}
              onToggle={() => dispatchWorkspaceToggleEvent()}
              togglePlacement={layout?.isMobile ? 'left' : 'right'}
              workspacePath={workspacePath}
            >
              {props.siderTitle}
            </WorkspacePanelHeader>
            <ArcoLayout.Content style={{ height: `calc(100% - ${WORKSPACE_HEADER_HEIGHT}px)` }}>
              {props.sider}
            </ArcoLayout.Content>
          </div>
        )}

        {/* Mobile workspace overlay: backdrop + fixed panel + floating collapse handle */}
        {workspaceEnabled && layout?.isMobile && (
          <MobileWorkspaceOverlay
            rightSiderCollapsed={rightSiderCollapsed}
            setRightSiderCollapsed={setRightSiderCollapsed}
            workspaceWidthPx={workspaceWidthPx}
            mobileWorkspaceHandleRight={mobileWorkspaceHandleRight}
            siderTitle={props.siderTitle}
            sider={props.sider}
            workspacePath={workspacePath}
          />
        )}

        {/* Desktop expand button when workspace is collapsed */}
        {!isMacRuntime && !isWindowsRuntime && workspaceEnabled && rightSiderCollapsed && !layout?.isMobile && (
          <DesktopWorkspaceToggle />
        )}
      </div>
    </ArcoLayout>
  );
};

export default ChatLayout;
