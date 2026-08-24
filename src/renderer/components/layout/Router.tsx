import React, { Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@renderer/components/ErrorBoundary';
import AppLoader from '@renderer/components/layout/AppLoader';
import { useAuth } from '@renderer/hooks/context/AuthContext';
import { TEAM_MODE_ENABLED } from '@/common/config/constants';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { ToastProvider } from '@renderer/components/settings/shared/feedback/Toast';
import OnboardingOverlay from '@renderer/components/onboarding/OnboardingOverlay';
import ShellChoiceOverlay from '@renderer/components/shell/ShellChoice/ShellChoiceOverlay';
const Conversation = React.lazy(() => import('@renderer/pages/conversation'));
const Guid = React.lazy(() => import('@renderer/pages/guid'));
const AssistantsLibraryPage = React.lazy(() => import('@renderer/pages/assistants/AssistantsLibraryPage'));
const WorkflowsLibraryPage = React.lazy(() => import('@renderer/pages/workflows/WorkflowsLibraryPage'));
const AgentsSettings = React.lazy(() => import('@renderer/pages/settings/AgentsSettings'));
const AssistantSettings = React.lazy(() => import('@renderer/pages/settings/AssistantSettings'));
const ConstitutionSettings = React.lazy(() => import('@renderer/pages/settings/ConstitutionSettings'));
const CapabilitiesSettings = React.lazy(() => import('@renderer/pages/settings/CapabilitiesSettings'));
const ChannelsIndex = React.lazy(() => import('@renderer/pages/settings/ChannelsIndex'));
const ChannelDetailPage = React.lazy(() => import('@renderer/pages/settings/ChannelsIndex/ChannelDetailPage'));
const DisplaySettings = React.lazy(() => import('@renderer/pages/settings/DisplaySettings'));
const EditorSettings = React.lazy(() => import('@renderer/pages/settings/EditorSettings'));
const NavigationSettings = React.lazy(() => import('@renderer/pages/settings/NavigationSettings'));
const GeneralSettings = React.lazy(() => import('@renderer/pages/settings/GeneralSettings'));
const ImageGenSettings = React.lazy(() => import('@renderer/pages/settings/ImageGenSettings'));
const McpLibraryBrowsePage = React.lazy(() =>
  import('@renderer/pages/settings/McpLibrary').then((m) => ({ default: m.BrowsePage }))
);
const McpLibraryDetailPage = React.lazy(() =>
  import('@renderer/pages/settings/McpLibrary').then((m) => ({ default: m.DetailPage }))
);
const McpLibraryConnectedPage = React.lazy(() =>
  import('@renderer/pages/settings/McpLibrary').then((m) => ({ default: m.ConnectedPage }))
);
const NotificationsSettings = React.lazy(() => import('@renderer/pages/settings/NotificationsSettings'));
const ModelsSettings = React.lazy(() => import('@renderer/pages/settings/ModelsSettings'));
const MigrateSettings = React.lazy(() => import('@renderer/pages/settings/MigrateSettings'));
const SkillsSettings = React.lazy(() => import('@renderer/pages/settings/SkillsSettings'));
const SlashCommandsSettings = React.lazy(() => import('@renderer/pages/settings/SlashCommandsSettings'));
const StorageSettings = React.lazy(() => import('@renderer/pages/settings/StorageSettings'));
const DoctorSettings = React.lazy(() => import('@renderer/pages/settings/DoctorSettings'));
const WCoreConfig = React.lazy(() => import('@renderer/pages/settings/WCoreConfig'));
const SystemSettings = React.lazy(() => import('@renderer/pages/settings/SystemSettings'));
const VoiceSettings = React.lazy(() => import('@renderer/pages/settings/VoiceSettings'));
const WebuiSettings = React.lazy(() => import('@renderer/pages/settings/WebuiSettings'));
const ExtensionsSettings = React.lazy(() => import('@renderer/pages/settings/ExtensionsSettings'));
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
const ArtifactsPage = React.lazy(() => import('@renderer/pages/artifacts/ArtifactsPage'));
const PreviewPopoutPage = React.lazy(() => import('@renderer/pages/preview/PreviewPopoutPage'));
/**
 * A preview pop-out window is BORN on `#/preview?mode=popout`, and the handoff
 * that seeds it is emitted from that window's `did-finish-load`. The page above
 * is LAZY, so its chunk resolves strictly after that moment and a listener
 * registered in it would miss the tab outright - the platform emitter has no
 * replay, so an event with no subscriber is dropped, not queued. Observed live:
 * the popped window came up blank.
 *
 * So the listener is imported STATICALLY here, in a module the renderer
 * evaluates at startup. It subscribes and latches; the page reads the latch
 * whenever its chunk finally arrives. Importing it in the main window too is
 * harmless - it latches a value nothing there reads.
 */
import '@renderer/pages/preview/previewHandoffLatch';
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
      {/* Existing installs only — new users get the same choice as a step inside
          the onboarding flow above, and ShellChoiceOverlay gates itself on
          `onboardingCompleted` so the two never both fire in one session. */}
      <ShellChoiceOverlay />
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
          {/* PREVIEW POP-OUT - a whole window holding one deliverable.

              ROUTED BARE, OUTSIDE ProtectedLayout, deliberately. Everything
              ProtectedLayout brings would follow the deliverable into its own
              window: the Sider's route-change `closePreview` (which tore the
              panel down last time and is why ArtifactsPage hosts its own
              provider), OnboardingOverlay and ShellChoiceOverlay, and a second
              auth round-trip that can bounce a preview window to /login while
              the main window is signed in.

              This is NOT a security decision and removes no gate: the page
              reads one tab handed to it over `preview.handoff` and offers one
              control that closes its own window. Every provider it can reach is
              allowlisted and re-checked in the main process exactly as before. */}
          <Route path='/preview' element={withRouteFallback(PreviewPopoutPage)} />
          <Route element={<ProtectedLayout layout={layout} />}>
            <Route index element={<Navigate to='/guid' replace />} />
            <Route path='/guid' element={withRouteFallback(Guid)} />
            <Route
              path='/conversation/:id'
              element={<ErrorBoundary>{withRouteFallback(Conversation)}</ErrorBoundary>}
            />
            {/* ARTIFACTS - the deliverables rail.

              DESKTOP ONLY, gated exactly like `/settings/wcore-config` below.
              The whole `artifacts.` namespace is remote-denied in
              bridgeAllowlist.ts (list enumerates the absolute paths of every
              workspace the user has; open reaches an OS launcher on the LOCAL
              machine; save-copy writes a file there), so on a paired WebUI
              every call this page makes REJECTS and the page can only ever
              render its own failure state. A route that cannot work is worse
              than no route: it puts a dead end in front of a remote user.

              This gate is CLIENT-SIDE and is therefore attack-surface and UX
              reduction, NOT a security boundary - the allowlist is applied
              again server-side in src/process/webserver/adapter.ts, and that
              is what actually refuses. Nothing here widens it. */}
            <Route
              path='/artifacts'
              element={isElectronDesktop() ? withRouteFallback(ArtifactsPage) : <Navigate to='/guid' replace />}
            />
            {/* WORKSPACE */}
            <Route path='/settings/assistants' element={withRouteFallback(AssistantSettings)} />
            <Route path='/settings/agents' element={withRouteFallback(AgentsSettings)} />
            <Route path='/settings/skills' element={withRouteFallback(SkillsSettings)} />
            <Route path='/settings/commands' element={withRouteFallback(SlashCommandsSettings)} />
            {/* Constitution is a Desktop concept (the engine has none of its own),
              so it lives as a standalone Desktop settings page, not a Core pane. */}
            <Route path='/settings/constitution' element={withRouteFallback(ConstitutionSettings)} />
            {/* AI MODELS */}
            <Route path='/settings/models' element={withRouteFallback(ModelsSettings)} />
            {/* Legacy `/settings/providers` redirects to the new Models page -
              the old ProvidersSettings tree was deleted in Packet 3B. */}
            <Route path='/settings/providers' element={<Navigate to='/settings/models' replace />} />
            <Route path='/settings/images' element={withRouteFallback(ImageGenSettings)} />
            <Route path='/settings/voice' element={withRouteFallback(VoiceSettings)} />
            {/* ENGINE - the Wayland Core configuration surface (its own destination).
              It subsumes the former standalone `wcore` engine-status page.

              #997: DESKTOP ONLY. The page drives the local engine's config.toml,
              its profile directories and the in-app engine updater. Every
              wcoreConfig WRITE and every local-identity READ behind it is
              remote-denied in bridgeAllowlist.ts, so a paired WebUI reaching it
              got a mostly-broken surface. Not an inert one: getOutputBudget
              (#990) and the presence-only wcoreToolKeys.list are reachable by
              design, and the latter really did populate the Services and Keys
              pane. See DESKTOP_ONLY_SETTINGS_IDS for the full split.

              This gate is CLIENT-SIDE and is therefore attack-surface and UX
              reduction, NOT a security boundary - a remote browser can define
              window.electronAPI before the bundle loads and render the page. It
              gains nothing: src/process/webserver/adapter.ts applies the same
              allowlist server-side, so a spoofer lands in the pre-#997 state.

              The nav entry is dropped for the same runtime
              (`visibleSettingsNavigationIds`); this guard closes the
              deep-link/legacy-redirect door the rail no longer opens. */}
            <Route
              path='/settings/wcore-config'
              element={
                isElectronDesktop() ? withRouteFallback(WCoreConfig) : <Navigate to='/settings/general' replace />
              }
            />
            {/* Legacy redirect: old standalone route now lands inside Core. */}
            <Route path='/settings/wcore' element={<Navigate to='/settings/wcore-config' replace />} />
            {/* INTEGRATIONS */}
            <Route path='/settings/webui' element={withRouteFallback(WebuiSettings)} />
            <Route path='/settings/channels' element={withRouteFallback(ChannelsIndex)} />
            <Route path='/settings/channels/:id' element={withRouteFallback(ChannelDetailPage)} />
            {/* Legacy `/settings/mcp` route - the old McpSettings page was
              removed in P8; redirect to the new MCP Library Browse view so
              bookmarks still land somewhere useful. */}
            <Route path='/settings/mcp' element={<Navigate to='/settings/mcp-library/browse' replace />} />
            {/* MCP Library - new catalog-driven Browse / Detail surface.
              The standalone Installed page was replaced by the rail's
              Installed filter on Browse; its route now redirects there. */}
            <Route path='/settings/mcp-library' element={<Navigate to='/settings/mcp-library/browse' replace />} />
            <Route path='/settings/mcp-library/browse' element={withRouteFallback(McpLibraryBrowsePage)} />
            <Route path='/settings/mcp-library/connected' element={withRouteFallback(McpLibraryConnectedPage)} />
            <Route path='/settings/migrate' element={withRouteFallback(MigrateSettings)} />
            <Route
              path='/settings/mcp-library/installed'
              element={<Navigate to='/settings/mcp-library/browse' replace />}
            />
            <Route path='/settings/extensions' element={withRouteFallback(ExtensionsSettings)} />
            <Route path='/settings/mcp-library/:entryId' element={withRouteFallback(McpLibraryDetailPage)} />
            {/* Legacy redirect - old `/settings/tools/mcp` route now lands on Browse. */}
            <Route path='/settings/tools/mcp' element={<Navigate to='/settings/mcp-library/browse' replace />} />
            {/* APPEARANCE */}
            <Route path='/settings/theme' element={withRouteFallback(DisplaySettings)} />
            <Route path='/settings/editor' element={withRouteFallback(EditorSettings)} />
            <Route path='/settings/navigation' element={withRouteFallback(NavigationSettings)} />
            {/* SYSTEM */}
            <Route path='/settings/general' element={withRouteFallback(GeneralSettings)} />
            <Route path='/settings/notifications' element={withRouteFallback(NotificationsSettings)} />
            <Route path='/settings/storage' element={withRouteFallback(StorageSettings)} />
            {/* Doctor - diagnostic health checks across all subsystems (#35). */}
            <Route path='/settings/doctor' element={withRouteFallback(DoctorSettings)} />
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
            {/* #792: a render error in the memory subtree must not bubble to the
              app-root boundary and blank the whole app. Mirror /conversation's
              route-level boundary so a memory crash is contained to the page. */}
            <Route path='/memory' element={<ErrorBoundary>{withRouteFallback(MemoryPage)}</ErrorBoundary>} />
            <Route path='/wiki' element={withRouteFallback(WikiHomePage)} />
            <Route path='/wiki/:slug' element={withRouteFallback(WikiDetailPage)} />
          </Route>
          <Route path='*' element={<Navigate to={status === 'authenticated' ? '/guid' : '/login'} replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default PanelRoute;
