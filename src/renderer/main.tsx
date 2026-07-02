/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Sentry must be initialized first
// Use electron-specific renderer package only inside Electron; fall back to the
// browser SDK when running as a standalone web server (no window.electronAPI).
// Skip entirely when VITE_SENTRY_DSN is unset (dev) - avoids spamming the
// console with `sentry-ipc://` protocol-handler errors that have no effect.
import { createScrubPii } from '@/common/utils/sentryPii';
const __sentryDsn = (import.meta as ImportMeta & { env?: { VITE_SENTRY_DSN?: string } }).env?.VITE_SENTRY_DSN;
if (__sentryDsn && (window as { electronAPI?: unknown }).electronAPI) {
  // Dynamic import avoids bundling sentry-ipc:// protocol code into the web build
  import('@sentry/electron/renderer')
    .then((Sentry) => {
      try {
        // L11 (AUDIT-04 F20): apply the same PII scrubber as main. Renderer has
        // no Node access (sandbox + nodeIntegration:false), so homedir is omitted;
        // the rest of the scrub (sensitive keys, request headers) still applies.
        Sentry.init({ beforeSend: createScrubPii() });
      } catch (err) {
        console.warn('[Sentry] renderer init threw:', (err as Error)?.message ?? err);
      }
    })
    .catch((err) => console.warn('[Sentry] renderer import skipped:', (err as Error)?.message ?? err));
}

// Apply Reduce Motion before first paint so the UI is calm/fast from frame one.
// Defaults ON unless the user has explicitly turned it off (mirrors the Settings
// default in DisplayModalContent). Module scripts run after HTML parse, so
// document.body is available.
try {
  if (typeof document !== 'undefined' && document.body && localStorage.getItem('wayland:reduce-motion') !== 'false') {
    document.body.classList.add('reduce-motion');
  }
} catch {
  /* localStorage unavailable - ignore */
}

// Runtime patches must be imported early
import './utils/ui/runtimePatches';

// Browser adapter setup
import '@/common/adapter/browser';

// React and core dependencies
import type { PropsWithChildren } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';

// Context providers
import { AuthProvider } from './hooks/context/AuthContext';
import { ThemeProvider } from './hooks/context/ThemeContext';
import { PreviewProvider } from './pages/conversation/Preview/context/PreviewContext';
import { ConversationTabsProvider } from './pages/conversation/hooks/ConversationTabsContext';

// Arco Design
import { ConfigProvider } from '@arco-design/web-react';
// Configure Arco Design to use React 18's createRoot, fixing Message component's CopyReactDOM.render error
import '@arco-design/web-react/es/_util/react-19-adapter';
import '@arco-design/web-react/dist/css/arco.css';
import enUS from '@arco-design/web-react/es/locale/en-US';
import jaJP from '@arco-design/web-react/es/locale/ja-JP';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import zhTW from '@arco-design/web-react/es/locale/zh-TW';
import koKR from '@arco-design/web-react/es/locale/ko-KR';
import { useTranslation } from 'react-i18next';

// Styles - Inter font first so it's available before Arco/Uno set their defaults
import '@fontsource-variable/inter';
import 'uno.css';
import './styles/arco-override.css';
import './styles/themes/index.css';

// i18n
import './services/i18n';
import { registerPwa } from './services/registerPwa';

// Components and utilities
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import Router from './components/layout/Router';
import Sider from './components/layout/Sider';
import { useAuth } from './hooks/context/AuthContext';
import { ConversationHistoryProvider } from './hooks/context/ConversationHistoryContext';
import HOC from './utils/ui/HOC';
import { canonicalizeWebUiRoute } from './utils/canonicalizeRoute';
import { installShadowCopyHandler } from './utils/shadowSelection';

// Patch Korean locale with missing properties from English locale
const koKRComplete = {
  ...koKR,
  Calendar: {
    ...koKR.Calendar,
    monthFormat: enUS.Calendar.monthFormat,
    yearFormat: enUS.Calendar.yearFormat,
  },
  DatePicker: {
    ...koKR.DatePicker,
    Calendar: {
      ...koKR.DatePicker.Calendar,
      monthFormat: enUS.Calendar.monthFormat,
      yearFormat: enUS.Calendar.yearFormat,
    },
  },
  Form: enUS.Form,
  ColorPicker: enUS.ColorPicker,
};

const arcoLocales: Record<string, typeof enUS> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'ja-JP': jaJP,
  'ko-KR': koKRComplete,
  'en-US': enUS,
};

const AppProviders: React.FC<PropsWithChildren> = ({ children }) =>
  React.createElement(
    AuthProvider,
    null,
    React.createElement(
      ThemeProvider,
      null,
      React.createElement(PreviewProvider, null, React.createElement(ConversationTabsProvider, null, children))
    )
  );

const Config: React.FC<PropsWithChildren> = ({ children }) => {
  const {
    i18n: { language },
  } = useTranslation();
  const arcoLocale = arcoLocales[language] ?? enUS;

  return React.createElement(ConfigProvider, { theme: { primaryColor: '#4E5969' }, locale: arcoLocale }, children);
};

const Main = () => {
  const { ready } = useAuth();

  if (!ready) {
    return null;
  }

  return (
    <Router
      layout={
        <ConversationHistoryProvider>
          <Layout sider={<Sider />} />
        </ConversationHistoryProvider>
      }
    />
  );
};

const App = HOC.Wrapper(Config)(Main);

void registerPwa();

// Enable Ctrl+C / context-menu Copy of agent messages, which render inside an
// open shadow root where the native copy path reads an empty selection (#523).
installShadowCopyHandler();

// Reconcile a mixed path/hash URL (e.g. `/assistants#/guid`) before the
// HashRouter mounts, so the rendered route matches the visible path (#151).
canonicalizeWebUiRoute();

const root = createRoot(document.getElementById('root')!);
root.render(
  React.createElement(ErrorBoundary, null, React.createElement(AppProviders, null, React.createElement(App)))
);

// Re-arm the web-only blank-root recovery guard (index.html) once the app has
// actually mounted, so a later blank in the same session can recover again.
// Clearing only after a confirmed mount keeps the one-shot loop guard intact.
requestAnimationFrame(() => {
  try {
    sessionStorage.removeItem('__wayland_blankRootRecovered');
  } catch {
    /* sessionStorage unavailable (private mode / SSR) - non-fatal */
  }
});
