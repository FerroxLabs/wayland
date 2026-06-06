import React, { Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@renderer/components/ErrorBoundary';
import AppLoader from '@renderer/components/layout/AppLoader';
import { useAuth } from '@renderer/hooks/context/AuthContext';
import { TEAM_MODE_ENABLED } from '@/common/config/constants';
import { ToastProvider } from '@renderer/components/settings/shared/feedback/Toast';
import OnboardingOverlay from '@renderer/components/onboarding/OnboardingOverlay';
const Conversation = React.lazy(() => import('@renderer/pages/conversation'));
const Guid = React.lazy(() => import('@renderer/pages/guid'));
const AssistantsLibraryPage = React.lazy(() => import('@renderer/pages/assistants/AssistantsLibraryPage'));
const WorkflowsLibraryPage = React.lazy(() => import('@renderer/pages/workflows/WorkflowsLibraryPage'));
const AgentSettings = React.lazy(() => import('@renderer/pages/settings/AgentSettings'));
const AgentsSettings = React.lazy(() => import('@renderer/pages/settings/AgentsSettings'));
const AssistantSettings = React.lazy(() => import('@renderer/pages/settings/AssistantSettings'));
const ConstitutionSettings = React.lazy(() => import('@renderer/pages/settings/ConstitutionSettings'));
const CapabilitiesSettings = React.lazy(() => import('@renderer/pages/settings/CapabilitiesSettings'));
const ChannelsIndex = React.lazy(() => import('@renderer/pages/settings/ChannelsIndex'));
const ChannelDetailPage = React.lazy(() => import('@renderer/pages/settings/ChannelsIndex/ChannelDetailPage'));
const DisplaySettings = React.lazy(() => import('@renderer/pages/settings/DisplaySettings'));
const EditorSettings = React.lazy(() => import('@renderer/pages/settings/EditorSettings'));
const GeneralSettings = React.lazy(() => import('@renderer/pages/settings/GeneralSettings'));
const ImageGenSettings = React.lazy(() => import('@renderer/pages/settings/ImageGenSettings'));
const McpLibraryBrowsePage = React.lazy(() =>
  import('@renderer/pages/settings/McpLibrary').then((m) => ({ default: m.BrowsePage }))
);
const McpLibraryInstalledPage = React.lazy(() =>
  import('@renderer/pages/settings/McpLibrary').then((m) => ({ default: m.InstalledPage }))
);
const McpLibraryDetailPage = React.lazy(() =>
  import('@renderer/pages/settings/McpLibrary').then((m) => ({ default: m.DetailPage }))
);
const NotificationsSettings = React.lazy(() => import('@renderer/pages/settings/NotificationsSettings'));
const ModelsSettings = React.lazy(() => import('@renderer/pages/settings/ModelsSettings'));
const SkillsSettings = React.lazy(() => import('@renderer/pages/settings/SkillsSettings'));
const StorageSettings = React.lazy(() => import('@renderer/pages/settings/StorageSettings'));
const WCoreSettings = React.lazy(() => import('@renderer/pages/settings/WCoreSettings'));
const GeminiSettings = React.lazy(() => import('@renderer/pages/settings/GeminiSettings'));
const SystemSettings = React.lazy(() => import('@renderer/pages/settings/SystemSettings'));
const VoiceSettings = React.lazy(() => import('@renderer/pages/settings/VoiceSettings'));
const WebuiSettings = React.lazy(() => import('@renderer/pages/settings/WebuiSettings'));
const ExtensionSettingsPage = React.lazy(() => import('@renderer/pages/settings/ExtensionSettingsPage'));
const LoginPage = React.lazy(() => import('@renderer/pages/login'));
const ComponentsShowcase = React.lazy(() => import('@renderer/pages/TestShowcase'));
const ScheduledTasksPage = React.lazy(() => import('@renderer/pages/cron/ScheduledTasksPage'));
const MissionControlPage = React.lazy(() => import('@renderer/pages/mission-control'));
const TaskDetailPage = React.lazy(() => import('@renderer/pages/cron/ScheduledTasksPage/TaskDetailPage'));
const TeamIndex = React.lazy(() => import('@renderer/pages/team'));
const TeamsLibraryPage = React.lazy(() => import('@renderer/pages/teams/TeamsLibraryPage'));
const TeamLauncherPage = React.lazy(() => import('@renderer/pages/teams/TeamLauncherPage'));
const MemoryPage = React.lazy(() => import('@renderer/pages/memory/MemoryPage'));
const ProjectsListPage = React.lazy(() => import('@renderer/pages/projects/ProjectsListPage'));
const ProjectWorkspacePage = React.lazy(() => import('@renderer/pages/projects/ProjectWorkspacePage'));
const ConversationsListPage = React.lazy(() => import('@renderer/pages/conversations/ConversationsListPage'));
const IjfwSettingsPanel = React.lazy(() => import('@renderer/pages/settings/IjfwSettingsPanel'));
const WikiHomePage = React.lazy(() =>
  import('@renderer/pages/wiki/WikiHomePage').then((m) => ({ default: m.WikiHomePage }))
);
const WikiDetailPage = React.lazy(() =>
  import('@renderer/pages/wiki/WikiDetailPage').then((m) => ({ default: m.WikiDetailPageRoute }))
);

const withRouteFallback = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Suspense fallback={<AppLoader />}>
    <Component />
  </Suspense>
);

const ProtectedLayout: React.FC<{ layout: React.ReactElement }> = ({ layout }) => {
  const { status } = useAuth();

  if (status === 'checking') {
    return <AppLoader />;
  }

  if (status !== 'authenticated') {
    return <Navigate to='/login' replace />;
  }

  return (
    <>
      {React.cloneElement(layout)}
      <OnboardingOverlay />
    </>
  );
};

const PanelRoute: React.FC<{ layout: React.ReactElement }> = ({ layout }) => {
  const { status } = useAuth();

  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route
            path='/login'
            element={status === 'authenticated' ? <Navigate to='/guid' replace /> : withRouteFallback(LoginPage)}
          />
          <Route element={<ProtectedLayout layout={layout} />}>
            <Route index element={<Navigate to='/guid' replace />} />
            <Route path='/guid' element={withRouteFallback(Guid)} />
            <Route
              path='/conversation/:id'
              element={<ErrorBoundary>{withRouteFallback(Conversation)}</ErrorBoundary>}
            />
            {/* WORKSPACE */}
            <Route path='/settings/assistants' element={withRouteFallback(AssistantSettings)} />
            <Route path='/settings/constitution' element={withRouteFallback(ConstitutionSettings)} />
            <Route path='/settings/agents' element={withRouteFallback(AgentsSettings)} />
            <Route path='/settings/skills' element={withRouteFallback(SkillsSettings)} />
            {/* AI MODELS */}
            <Route path='/settings/models' element={withRouteFallback(ModelsSettings)} />
            {/* Legacy `/settings/providers` redirects to the new Models page -
              the old ProvidersSettings tree was deleted in Packet 3B. */}
            <Route path='/settings/providers' element={<Navigate to='/settings/models' replace />} />
            <Route path='/settings/images' element={withRouteFallback(ImageGenSettings)} />
            <Route path='/settings/voice' element={withRouteFallback(VoiceSettings)} />
            <Route path='/settings/wcore' element={withRouteFallback(WCoreSettings)} />
            {/* INTEGRATIONS */}
            <Route path='/settings/webui' element={withRouteFallback(WebuiSettings)} />
            <Route path='/settings/channels' element={withRouteFallback(ChannelsIndex)} />
            <Route path='/settings/channels/:id' element={withRouteFallback(ChannelDetailPage)} />
            {/* Legacy `/settings/mcp` route - the old McpSettings page was
              removed in P8; redirect to the new MCP Library Installed view so
              bookmarks still land somewhere useful. */}
            <Route path='/settings/mcp' element={<Navigate to='/settings/mcp-library/installed' replace />} />
            {/* MCP Library - new catalog-driven Browse / Installed / Detail surface. */}
            <Route path='/settings/mcp-library' element={<Navigate to='/settings/mcp-library/browse' replace />} />
            <Route path='/settings/mcp-library/browse' element={withRouteFallback(McpLibraryBrowsePage)} />
            <Route path='/settings/mcp-library/installed' element={withRouteFallback(McpLibraryInstalledPage)} />
            <Route path='/settings/mcp-library/:entryId' element={withRouteFallback(McpLibraryDetailPage)} />
            {/* Legacy redirect - old `/settings/tools/mcp` route now lands on Installed. */}
            <Route path='/settings/tools/mcp' element={<Navigate to='/settings/mcp-library/installed' replace />} />
            {/* APPEARANCE */}
            <Route path='/settings/theme' element={withRouteFallback(DisplaySettings)} />
            <Route path='/settings/editor' element={withRouteFallback(EditorSettings)} />
            {/* SYSTEM */}
            <Route path='/settings/general' element={withRouteFallback(GeneralSettings)} />
            <Route path='/settings/notifications' element={withRouteFallback(NotificationsSettings)} />
            <Route path='/settings/storage' element={withRouteFallback(StorageSettings)} />
            {/* IJFW MEMORY (Decision 3b: the ONLY Skip toggle in the app) */}
            <Route path='/settings/ijfw' element={withRouteFallback(IjfwSettingsPanel)} />
            {/* ABOUT */}
            <Route path='/settings/about' element={withRouteFallback(SystemSettings)} />
            <Route
              path='/team/:id'
              element={TEAM_MODE_ENABLED ? withRouteFallback(TeamIndex) : <Navigate to='/guid' replace />}
            />
            {/* Legacy routes - redirect to new IA */}
            {/* `/settings/gemini` + `/settings/model` map to the new Models page
              (the legacy `gemini`/`model` surfaces have been replaced by it). */}
            <Route path='/settings/gemini' element={<Navigate to='/settings/models' replace />} />
            <Route path='/settings/model' element={<Navigate to='/settings/models' replace />} />
            <Route path='/settings/agent' element={<Navigate to='/settings/agents' replace />} />
            <Route path='/settings/capabilities' element={withRouteFallback(CapabilitiesSettings)} />
            <Route path='/settings/skills-hub' element={<Navigate to='/settings/skills' replace />} />
            <Route path='/settings/tools' element={<Navigate to='/settings/capabilities?tab=tools' replace />} />
            <Route path='/settings/display' element={<Navigate to='/settings/theme' replace />} />
            <Route path='/settings/system' element={<Navigate to='/settings/general' replace />} />
            <Route path='/settings/ext/:tabId' element={withRouteFallback(ExtensionSettingsPage)} />
            <Route path='/settings' element={<Navigate to='/settings/models' replace />} />
            <Route path='/test/components' element={withRouteFallback(ComponentsShowcase)} />
            <Route path='/scheduled' element={withRouteFallback(ScheduledTasksPage)} />
            <Route path='/mission-control' element={withRouteFallback(MissionControlPage)} />
            <Route path='/scheduled/:jobId' element={withRouteFallback(TaskDetailPage)} />
            <Route path='/assistants' element={withRouteFallback(AssistantsLibraryPage)} />
            <Route path='/workflows' element={withRouteFallback(WorkflowsLibraryPage)} />
            {/*
             * Plural /teams* = the team-blitz launcher library (W2a+).
             * Singular /team/:id above (line 103) is the legacy
             * multi-user team-mode surface, gated by TEAM_MODE_ENABLED.
             * These are intentionally distinct routes; do not consolidate.
             */}
            <Route path='/teams' element={withRouteFallback(TeamsLibraryPage)} />
            <Route path='/teams/new' element={withRouteFallback(TeamLauncherPage)} />
            <Route path='/teams/:teamId/launch' element={withRouteFallback(TeamLauncherPage)} />
            <Route path='/projects' element={withRouteFallback(ProjectsListPage)} />
            <Route path='/conversations' element={withRouteFallback(ConversationsListPage)} />
            <Route path='/project/:projectId' element={withRouteFallback(ProjectWorkspacePage)} />
            <Route path='/memory' element={withRouteFallback(MemoryPage)} />
            <Route path='/wiki' element={withRouteFallback(WikiHomePage)} />
            <Route path='/wiki/:slug' element={withRouteFallback(WikiDetailPage)} />
          </Route>
          <Route path='*' element={<Navigate to={status === 'authenticated' ? '/guid' : '/login'} replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

// Reference unused legacy components so dynamic imports stay valid for tooling
void GeminiSettings;
void AgentSettings;

export default PanelRoute;
