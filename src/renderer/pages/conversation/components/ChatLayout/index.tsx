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
import ConversationTabs from '@/renderer/pages/conversation/components/ConversationTabs';
import ChatTitleEditor from '@/renderer/pages/conversation/components/ChatTitleEditor';
import ConversationTitleMinimap from '@/renderer/pages/conversation/components/ConversationTitleMinimap';
import WorkspacePanelHeader from './WorkspacePanelHeader';
import WorkbenchHost, { type WorkbenchSectionRegistration } from '../WorkbenchHost';
import { useConversationTabs } from '@/renderer/pages/conversation/hooks/ConversationTabsContext';
import { useContainerWidth } from '@/renderer/pages/conversation/hooks/useContainerWidth';
import { useTitleRename } from '@/renderer/pages/conversation/hooks/useTitleRename';
import { useWorkspaceCollapse } from '@/renderer/pages/conversation/hooks/useWorkspaceCollapse';
import { PreviewPanel, usePreviewContext } from '@/renderer/pages/conversation/Preview';
import { dispatchWorkspaceToggleEvent } from '@/renderer/utils/workspace/workspaceEvents';
import { ACP_BACKENDS_ALL } from '@/common/types/acpTypes';
import { NON_ACP_BACKEND_DISPLAY_NAMES, resolveRuntimeName } from './runtimeName';
import classNames from 'classnames';
import { isWindowsEnvironment } from '@/renderer/pages/conversation/utils/detectPlatform';
import { Layout as ArcoLayout } from '@arco-design/web-react';
import React from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import VoiceConversationMode from '@/renderer/pages/conversation/voice/VoiceConversationMode';
import { VoiceSessionProvider } from '@/renderer/pages/conversation/voice/VoiceSessionContext';
import ProjectContextBadge from '../ProjectContext';
import './chat-layout.css';

type WorkbenchNavigationRequest = { id: string; key: string };

function parseWorkbenchRequest(state: unknown): WorkbenchNavigationRequest | undefined {
  const candidate = (state as { workbenchRequest?: unknown } | null)?.workbenchRequest;
  if (!candidate || typeof candidate !== 'object') return undefined;
  const { id, key } = candidate as { id?: unknown; key?: unknown };
  return typeof id === 'string' && typeof key === 'string' && id.length <= 80 && key.length <= 240
    ? { id, key }
    : undefined;
}

/** Keeps ChatLayout usable in standalone/popout/test mounts without a Router. */
/**
 * Narrowest conversation column that still docks the workbench panel beside the
 * messages instead of floating it over them. WorkbenchHost's default panel is
 * 340px and its rail is 36px, so this leaves roughly 360px of conversation -
 * about the point where message text stops being comfortable.
 */
const WORKBENCH_DOCK_MIN_WIDTH = 740;

const RouterWorkbenchRequestBridge: React.FC<{
  onRequest: (request: WorkbenchNavigationRequest | undefined) => void;
}> = ({ onRequest }) => {
  const location = useLocation();
  React.useEffect(() => onRequest(parseWorkbenchRequest(location.state)), [location.state, onRequest]);
  return null;
};

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
  /** Canonical umbrella project carried by conversation.extra.projectId. */
  projectId?: string;
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
  /**
   * Build #116: the right sider hosts the workflow Steps rail. Makes the sider
   * default to EXPANDED (so a workspace-less workflow shows its Steps on mount)
   * and prevents auto-collapse / global-default pollution. See useWorkspaceCollapse.
   */
  stepsRailSider?: boolean;
}> = (props) => {
  const { conversationId, workspacePath } = props;
  const { backend, presetAssistant, agentName } = props;
  const { t } = useTranslation();
  const isInRouter = useInRouterContext();
  const [workbenchRequest, setWorkbenchRequest] = React.useState<WorkbenchNavigationRequest>();
  // #27 phase 2: in a pop-out window, hide the tab bar and surface a Dock-back
  // action. The workspace COMES WITH the chat (the conversation's workspace is
  // its working context), so the panel + its toggle stay enabled in the pop-out;
  // only the tab bar is removed.
  const isPopout = useIsPopoutMode();
  const workspaceEnabled = props.workspaceEnabled ?? true;
  // The workflow steps rail (WorkflowTabbedSider) labels itself with a
  // "Workspace" tab, so the panel-header title would render "Workspace" twice.
  // Suppress the header title in that mode; the header keeps its toggle/actions.
  const resolvedSiderTitle = props.stepsRailSider ? undefined : props.siderTitle;
  const layout = useLayoutContext();
  const isWindowsRuntime = isWindowsEnvironment();
  const isMobile = Boolean(layout?.isMobile);

  // Preview panel state
  const { isOpen: isPreviewOpen, closePreview } = usePreviewContext();

  // --- Hook A: workspace collapse ---
  const { rightSiderCollapsed, setRightSiderCollapsed } = useWorkspaceCollapse({
    workspaceEnabled,
    isMobile,
    conversationId,
    stepsRailMode: props.stepsRailSider,
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

  // Compute display name with fallback chain
  const displayName =
    presetAssistant?.name ||
    agentName ||
    (backend === 'custom' && customAgents?.[0]?.name) ||
    ACP_BACKENDS_ALL[backend as keyof typeof ACP_BACKENDS_ALL]?.name ||
    (backend ? NON_ACP_BACKEND_DISPLAY_NAMES[backend] : undefined) ||
    backend;

  // Friendly runtime name for the header pill (#909). Resolves to a friendly
  // display name only; an unknown backend yields undefined so the badge shows a
  // single label instead of leaking the raw id (D-06 xaudit finding 2).
  const runtimeName = resolveRuntimeName(backend);

  const titleAreaMaxWidth = containerWidth ? Math.max(160, Math.min(640, containerWidth - 460)) : 480;
  // Overlay puts the workbench panel ON TOP of the conversation, so it must be a
  // last resort for genuinely narrow layouts - not the common case. The old 960
  // threshold made it the common case: a maximised window with the chat list open
  // leaves a ~928px conversation column, which tripped the check and dropped the
  // panel over the messages (the user's own report: a message bubble running
  // underneath the Core panel).
  //
  // Dock whenever the conversation keeps a readable column beside the panel.
  // WorkbenchHost defaults to a 340px panel plus a 36px rail, so anything above
  // roughly 740px docks cleanly and only truly cramped layouts overlay.
  const workbenchOverlay = isMobile || isPopout || (containerWidth > 0 && containerWidth < WORKBENCH_DOCK_MIN_WIDTH);

  const workbenchSections = React.useMemo<WorkbenchSectionRegistration[]>(
    () => [
      {
        id: 'workspace',
        label: props.stepsRailSider
          ? t('conversation.workflow.surface', { defaultValue: 'Workflow' })
          : resolvedSiderTitle || t('conversation.workspace.title', { defaultValue: 'Workspace' }),
        priority: props.stepsRailSider ? 80 : 30,
        available: workspaceEnabled,
        requestedOpen: workspaceEnabled && !rightSiderCollapsed,
        activationKey: `${conversationId || 'global'}:${rightSiderCollapsed ? 'closed' : 'open'}`,
        onActivate: () => setRightSiderCollapsed(false),
        onDismiss: () => setRightSiderCollapsed(true),
        testId: 'workbench-workspace',
        content: (
          <div className='flex flex-1 min-h-0 flex-col'>
            {workspacePath && (
              <WorkspacePanelHeader
                showToggle={false}
                collapsed={false}
                onToggle={() => setRightSiderCollapsed(true)}
                togglePlacement='right'
                workspacePath={workspacePath}
              />
            )}
            <div className='flex flex-1 min-h-0 overflow-hidden'>{props.sider}</div>
          </div>
        ),
      },
      {
        id: 'preview',
        label: t('conversation.preview.title', { defaultValue: 'Preview' }),
        priority: 70,
        available: isPreviewOpen,
        requestedOpen: isPreviewOpen,
        activationKey: isPreviewOpen ? 'open' : 'closed',
        onDismiss: closePreview,
        testId: 'workbench-preview',
        content: <PreviewPanel />,
      },
    ],
    [
      closePreview,
      conversationId,
      isPreviewOpen,
      props.sider,
      props.stepsRailSider,
      resolvedSiderTitle,
      rightSiderCollapsed,
      setRightSiderCollapsed,
      t,
      workspaceEnabled,
      workspacePath,
    ]
  );

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
          <ProjectContextBadge projectId={props.projectId} />
          {/* No voice entry here any more. There were two, 17px apart, with
              accessible names a screen reader could not tell apart ("Start
              Voice conversation" in the header, "Start voice input" for
              dictation in the composer). The composer's soundwave is the single
              door now, and it is also the way out. */}
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
              runtimeName={runtimeName}
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

  const layoutTree = (
    <ArcoLayout
      className='size-full'
      style={
        {
          // fontFamily: `cursive,"anthropicSans","anthropicSans Fallback",system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif`,
        }
      }
    >
      {isInRouter ? <RouterWorkbenchRequestBridge onRequest={setWorkbenchRequest} /> : null}
      {/* Column: header + tabs sit ABOVE the workbench dock. The dock's
          full-height rail/overlay panel are absolutely positioned to its own
          container's top; keeping the header outside that container stops them
          from rendering over the header and conversation tab strip. */}
      <div ref={containerRef} className='flex flex-col flex-1 relative w-full overflow-hidden'>
        {!props.hideHeader && headerBlock}
        <div className='flex flex-1 relative min-w-0 min-h-0'>
          <WorkbenchHost
            conversationId={conversationId}
            sections={workbenchSections}
            overlay={workbenchOverlay}
            requestedSectionId={workbenchRequest?.id}
            requestKey={workbenchRequest?.key}
          >
            <div className='flex flex-col flex-1 min-w-0 min-h-0 relative'>
              <ArcoLayout.Content
                className='flex flex-col flex-1 bg-1 overflow-hidden'
                onClick={() => {
                  if (window.innerWidth < 768 && !rightSiderCollapsed) setRightSiderCollapsed(true);
                }}
              >
                {props.hideHeader && props.projectId && (
                  <div className='shrink-0 px-16px pt-8px'>
                    <ProjectContextBadge projectId={props.projectId} />
                  </div>
                )}
                {props.children}
              </ArcoLayout.Content>
            </div>
          </WorkbenchHost>
        </div>
      </div>
    </ArcoLayout>
  );

  /*
   * The voice session wraps the WHOLE layout, not the header.
   *
   * It used to live inside `headerBlock`, which three call sites skip via
   * `hideHeader`. On those surfaces the component that listens for the composer's
   * open event was never mounted, so the soundwave button dispatched into
   * nothing - a dead control for real users. Wrapping the layout is what makes
   * voice reachable from every conversation surface.
   *
   * The mount keeps the same `conversationId` gate the header block used: with
   * no conversation there is nothing for a session to belong to.
   */
  if (!conversationId) return layoutTree;

  return (
    <VoiceSessionProvider conversationId={conversationId} actorLabel={displayName || 'Wayland'}>
      <VoiceConversationMode conversationTitle={props.title} />
      {layoutTree}
    </VoiceSessionProvider>
  );
};

export default ChatLayout;
