import React, { Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@renderer/components/ErrorBoundary';
import AppLoader from '@renderer/components/layout/AppLoader';
import { useAuth } from '@renderer/hooks/context/AuthContext';
import { TEAM_MODE_ENABLED } from '@/common/config/constants';
import { ToastProvider } from '@renderer/components/settings/shared/feedback/Toast';
const Conversation = React.lazy(() => import('@renderer/pages/conversation'));
const Guid = React.lazy(() => import('@renderer/pages/guid'));
const AgentSettings = React.lazy(() => import('@renderer/pages/settings/AgentSettings'));
const AgentsSettings = React.lazy(() => import('@renderer/pages/settings/AgentsSettings'));
const AssistantSettings = React.lazy(() => import('@renderer/pages/settings/AssistantSettings'));
const CapabilitiesSettings = React.lazy(() => import('@renderer/pages/settings/CapabilitiesSettings'));
const ChannelsIndex = React.lazy(() => import('@renderer/pages/settings/ChannelsIndex'));
const ChannelDetailPage = React.lazy(() => import('@renderer/pages/settings/ChannelsIndex/ChannelDetailPage'));
const DisplaySettings = React.lazy(() => import('@renderer/pages/settings/DisplaySettings'));
const EditorSettings = React.lazy(() => import('@renderer/pages/settings/EditorSettings'));
const GeneralSettings = React.lazy(() => import('@renderer/pages/settings/GeneralSettings'));
const ImageGenSettings = React.lazy(() => import('@renderer/pages/settings/ImageGenSettings'));
const McpSettings = React.lazy(() => import('@renderer/pages/settings/McpSettings'));
const NotificationsSettings = React.lazy(() => import('@renderer/pages/settings/NotificationsSettings'));
const ProvidersSettings = React.lazy(() => import('@renderer/pages/settings/ProvidersSettings'));
const SkillsSettings = React.lazy(() => import('@renderer/pages/settings/SkillsSettings'));
const StorageSettings = React.lazy(() => import('@renderer/pages/settings/StorageSettings'));
const WCoreSettings = React.lazy(() => import('@renderer/pages/settings/WCoreSettings'));
const GeminiSettings = React.lazy(() => import('@renderer/pages/settings/GeminiSettings'));
const ModeSettings = React.lazy(() => import('@renderer/pages/settings/ModeSettings'));
const SystemSettings = React.lazy(() => import('@renderer/pages/settings/SystemSettings'));
const VoiceSettings = React.lazy(() => import('@renderer/pages/settings/VoiceSettings'));
const WebuiSettings = React.lazy(() => import('@renderer/pages/settings/WebuiSettings'));
const ExtensionSettingsPage = React.lazy(() => import('@renderer/pages/settings/ExtensionSettingsPage'));
const LoginPage = React.lazy(() => import('@renderer/pages/login'));
const ComponentsShowcase = React.lazy(() => import('@renderer/pages/TestShowcase'));
const ScheduledTasksPage = React.lazy(() => import('@renderer/pages/cron/ScheduledTasksPage'));
const TaskDetailPage = React.lazy(() => import('@renderer/pages/cron/ScheduledTasksPage/TaskDetailPage'));
const TeamIndex = React.lazy(() => import('@renderer/pages/team'));

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

  return React.cloneElement(layout);
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
          <Route path='/settings/agents' element={withRouteFallback(AgentsSettings)} />
          <Route path='/settings/skills' element={withRouteFallback(SkillsSettings)} />
          {/* AI MODELS */}
          <Route path='/settings/providers' element={withRouteFallback(ProvidersSettings)} />
          <Route path='/settings/images' element={withRouteFallback(ImageGenSettings)} />
          <Route path='/settings/voice' element={withRouteFallback(VoiceSettings)} />
          <Route path='/settings/wcore' element={withRouteFallback(WCoreSettings)} />
          {/* INTEGRATIONS */}
          <Route path='/settings/webui' element={withRouteFallback(WebuiSettings)} />
          <Route path='/settings/channels' element={withRouteFallback(ChannelsIndex)} />
          <Route path='/settings/channels/:id' element={withRouteFallback(ChannelDetailPage)} />
          <Route path='/settings/mcp' element={withRouteFallback(McpSettings)} />
          {/* APPEARANCE */}
          <Route path='/settings/theme' element={withRouteFallback(DisplaySettings)} />
          <Route path='/settings/editor' element={withRouteFallback(EditorSettings)} />
          {/* SYSTEM */}
          <Route path='/settings/general' element={withRouteFallback(GeneralSettings)} />
          <Route path='/settings/notifications' element={withRouteFallback(NotificationsSettings)} />
          <Route path='/settings/storage' element={withRouteFallback(StorageSettings)} />
          {/* ABOUT */}
          <Route path='/settings/about' element={withRouteFallback(SystemSettings)} />
          <Route
            path='/team/:id'
            element={TEAM_MODE_ENABLED ? withRouteFallback(TeamIndex) : <Navigate to='/guid' replace />}
          />
          {/* Legacy routes — redirect to new IA */}
          <Route path='/settings/gemini' element={<Navigate to='/settings/providers' replace />} />
          <Route path='/settings/model' element={<Navigate to='/settings/providers' replace />} />
          <Route path='/settings/agent' element={<Navigate to='/settings/agents' replace />} />
          <Route path='/settings/capabilities' element={withRouteFallback(CapabilitiesSettings)} />
          <Route path='/settings/skills-hub' element={<Navigate to='/settings/skills' replace />} />
          <Route path='/settings/tools' element={<Navigate to='/settings/capabilities?tab=tools' replace />} />
          <Route path='/settings/display' element={<Navigate to='/settings/theme' replace />} />
          <Route path='/settings/system' element={<Navigate to='/settings/general' replace />} />
          <Route path='/settings/ext/:tabId' element={withRouteFallback(ExtensionSettingsPage)} />
          <Route path='/settings' element={<Navigate to='/settings/providers' replace />} />
          <Route path='/test/components' element={withRouteFallback(ComponentsShowcase)} />
          <Route path='/scheduled' element={withRouteFallback(ScheduledTasksPage)} />
          <Route path='/scheduled/:jobId' element={withRouteFallback(TaskDetailPage)} />
        </Route>
        <Route path='*' element={<Navigate to={status === 'authenticated' ? '/guid' : '/login'} replace />} />
      </Routes>
    </HashRouter>
    </ToastProvider>
  );
};

// Reference unused legacy components so dynamic imports stay valid for tooling
void GeminiSettings;
void ModeSettings;
void AgentSettings;

export default PanelRoute;
