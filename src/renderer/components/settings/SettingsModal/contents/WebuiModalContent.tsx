/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, Copy, Globe, PencilLine, RefreshCw } from 'lucide-react';
import { WEBUI_DEFAULT_PORT } from '@/common/config/constants';
import { shell, webui, type IWebUIStatus } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import WaylandModal from '@/renderer/components/base/WaylandModal';
import WaylandScrollArea from '@/renderer/components/base/WaylandScrollArea';
import ChannelDingTalkLogo from '@/renderer/assets/channel-logos/dingtalk.svg';
import ChannelDiscordLogo from '@/renderer/assets/channel-logos/discord.svg';
import ChannelLarkLogo from '@/renderer/assets/channel-logos/lark.svg';
import ChannelSlackLogo from '@/renderer/assets/channel-logos/slack.svg';
import ChannelTelegramLogo from '@/renderer/assets/channel-logos/telegram.svg';
import ChannelWecomLogo from '@/renderer/assets/channel-logos/wecom.svg';
import ChannelWeixinLogo from '@/renderer/assets/channel-logos/weixin.svg';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { changeUsernameHttp } from '@/renderer/services/UsernameService';
import { withCsrfToken } from '@process/webserver/middleware/csrfClient';
import { Button, Form, Input, Message, Switch, Tooltip } from '@arco-design/web-react';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsViewMode } from '../settingsViewContext';

/**
 * Preference row component
 */
const PreferenceRow: React.FC<{
  label: string;
  description?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, description, extra, children }) => (
  <div className='flex items-center justify-between gap-12px py-12px'>
    <div className='min-w-0 flex-1'>
      <div className='flex items-center gap-8px'>
        <span className='text-14px text-t-primary'>{label}</span>
        {extra}
      </div>
      {description && <div className='text-12px text-t-tertiary mt-2px'>{description}</div>}
    </div>
    <div className='flex items-center shrink-0'>{children}</div>
  </div>
);

const CHANNEL_LOGOS = [
  { src: ChannelTelegramLogo, alt: 'Telegram' },
  { src: ChannelLarkLogo, alt: 'Lark' },
  { src: ChannelDingTalkLogo, alt: 'DingTalk' },
  { src: ChannelWeixinLogo, alt: 'WeChat' },
  { src: ChannelWecomLogo, alt: 'WeCom' },
  { src: ChannelSlackLogo, alt: 'Slack' },
  { src: ChannelDiscordLogo, alt: 'Discord' },
] as const;

const ChannelModalContentLazy = React.lazy(() => import('./channels/ChannelModalContent'));
const QRCodeSVGLazy = React.lazy(async () => {
  const mod = await import('qrcode.react');
  return { default: mod.QRCodeSVG };
});

const DESKTOP_WEBUI_ENABLED_KEY = 'webui.desktop.enabled';
const DESKTOP_WEBUI_ALLOW_REMOTE_KEY = 'webui.desktop.allowRemote';

/**
 * WebUI settings content component
 */
const WebuiModalContent: React.FC = () => {
  const { t } = useTranslation();
  const viewMode = useSettingsViewMode();
  const isPageMode = viewMode === 'page';
  // Channels lifted to /settings/channels - webui-only panel here

  // Check if running in Electron desktop environment
  const isDesktop = isElectronDesktop();

  const [status, setStatus] = useState<IWebUIStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const port = WEBUI_DEFAULT_PORT;
  const [webuiEnabled, setWebuiEnabled] = useState(false);
  const [allowRemotePreference, setAllowRemotePreference] = useState(false);
  const [cachedIP, setCachedIP] = useState<string | null>(null);
  const [cachedPassword, setCachedPassword] = useState<string | null>(null);
  // Flag for plaintext password display (first startup and not copied)
  const [canShowPlainPassword, setCanShowPlainPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  // Set new password modal
  const [setPasswordModalVisible, setSetPasswordModalVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [setUsernameModalVisible, setSetUsernameModalVisible] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [form] = Form.useForm();
  const [usernameForm] = Form.useForm();

  // QR code login related state
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<number | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const qrRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load status
  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [savedEnabled, savedAllowRemote] = await Promise.all([
        ConfigStorage.get(DESKTOP_WEBUI_ENABLED_KEY).catch(() => false),
        ConfigStorage.get(DESKTOP_WEBUI_ALLOW_REMOTE_KEY).catch(() => false),
      ]);
      setWebuiEnabled(savedEnabled === true);
      setAllowRemotePreference(savedAllowRemote === true);

      let result: { success: boolean; data?: IWebUIStatus } | null = null;

      // Prefer direct IPC (Electron environment)
      if (window.electronAPI?.webuiGetStatus) {
        result = await window.electronAPI.webuiGetStatus();
      } else {
        // Fallback: use bridge (reduced timeout)
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
        result = await Promise.race([webui.getStatus.invoke(), timeoutPromise]);
      }

      if (result && result.success && result.data) {
        setStatus(result.data);
        if (result.data.lanIP) {
          setCachedIP(result.data.lanIP);
        } else if (result.data.networkUrl) {
          const match = result.data.networkUrl.match(/http:\/\/([^:]+):/);
          if (match) {
            setCachedIP(match[1]);
          }
        }
        if (result.data.initialPassword) {
          setCachedPassword(result.data.initialPassword);
          // Having initial password means can show plaintext
          setCanShowPlainPassword(true);
        }
        // Note: If running but no password, auto-reset will be triggered in the useEffect below
      } else {
        setStatus(
          (prev) =>
            prev || {
              running: false,
              port: WEBUI_DEFAULT_PORT,
              allowRemote: false,
              localUrl: `http://localhost:${WEBUI_DEFAULT_PORT}`,
              adminUsername: 'admin',
            }
        );
      }
    } catch (error) {
      console.error('[WebuiModal] Failed to load WebUI status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  // Listen to status change events
  useEffect(() => {
    const unsubscribe = webui.statusChanged.on((data) => {
      if (data.running) {
        setStatus((prev) => ({
          ...(prev || { adminUsername: 'admin' }),
          running: true,
          port: data.port ?? prev?.port ?? WEBUI_DEFAULT_PORT,
          allowRemote: prev?.allowRemote ?? false,
          localUrl: data.localUrl ?? `http://localhost:${data.port ?? WEBUI_DEFAULT_PORT}`,
          networkUrl: data.networkUrl,
          lanIP: prev?.lanIP,
          initialPassword: prev?.initialPassword,
        }));
        if (data.networkUrl) {
          const match = data.networkUrl.match(/http:\/\/([^:]+):/);
          if (match) setCachedIP(match[1]);
        }
      } else {
        setStatus((prev) => (prev ? { ...prev, running: false } : null));
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to password reset result events (Web environment fallback)
  useEffect(() => {
    const unsubscribe = webui.resetPasswordResult.on((data) => {
      if (data.success && data.newPassword) {
        setCachedPassword(data.newPassword);
        setStatus((prev) => (prev ? { ...prev, initialPassword: data.newPassword } : null));
        setCanShowPlainPassword(true);
      }
      setResetLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Note: No longer auto-reset password, user already has password stored in database
  // If user forgets password, they can manually click reset button
  useEffect(() => {
    // Only when component first loads and password hasn't been shown, mark as hidden
    if (status?.running && !status?.initialPassword && !cachedPassword && !loading) {
      // Don't auto-reset, just ensure password shows as ******
      setCanShowPlainPassword(false);
    }
  }, [status?.running, status?.initialPassword, cachedPassword, loading]);

  // Get current IP
  const getLocalIP = useCallback(() => {
    if (status?.lanIP) return status.lanIP;
    if (cachedIP) return cachedIP;
    if (status?.networkUrl) {
      const match = status.networkUrl.match(/http:\/\/([^:]+):/);
      if (match) return match[1];
    }
    return null;
  }, [status?.lanIP, cachedIP, status?.networkUrl]);

  // Get display URL
  const getDisplayUrl = useCallback(() => {
    const currentIP = getLocalIP();
    const currentPort = status?.port || port;
    const useRemote = status?.running ? status.allowRemote : allowRemotePreference;
    if (useRemote && currentIP) {
      return `http://${currentIP}:${currentPort}`;
    }
    return `http://localhost:${currentPort}`;
  }, [allowRemotePreference, getLocalIP, status?.allowRemote, status?.port, status?.running, port]);

  // Start/Stop WebUI
  const handleToggle = async (enabled: boolean) => {
    // Use cached IP, no longer block to fetch
    const currentIP = getLocalIP();

    // Save original value for rollback
    const previousEnabled = webuiEnabled;

    // Immediately show loading
    setStartLoading(true);
    setWebuiEnabled(enabled);

    try {
      if (enabled) {
        const localUrl = `http://localhost:${port}`;

        // Reduce start timeout to 3s (server starts quickly)
        const startResult = await Promise.race([
          webui.start.invoke({ port, allowRemote: allowRemotePreference }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);

        if (startResult && startResult.success && startResult.data) {
          const responseIP = startResult.data.lanIP || currentIP;
          const responsePassword = startResult.data.initialPassword;

          if (responseIP) setCachedIP(responseIP);
          if (responsePassword) {
            setCachedPassword(responsePassword);
            setCanShowPlainPassword(true);
          }

          setStatus((prev) => ({
            ...(prev || { adminUsername: 'admin' }),
            running: true,
            port,
            allowRemote: allowRemotePreference,
            localUrl,
            networkUrl: allowRemotePreference && responseIP ? `http://${responseIP}:${port}` : undefined,
            lanIP: responseIP,
            initialPassword: responsePassword || cachedPassword || prev?.initialPassword,
          }));
        } else {
          // Start timed out or returned null: do NOT assume success.
          // Re-check actual server status before claiming the server is up.
          let statusResult: { success: boolean; data?: IWebUIStatus } | null = null;
          if (window.electronAPI?.webuiGetStatus) {
            statusResult = await window.electronAPI.webuiGetStatus();
          } else {
            statusResult = await Promise.race([
              webui.getStatus.invoke(),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
            ]);
          }

          if (!statusResult?.success || !statusResult?.data?.running) {
            // Server is not actually running: surface an honest error,
            // roll back UI, and do NOT persist enabled=true.
            setWebuiEnabled(previousEnabled);
            setStatus((prev) => (prev ? { ...prev, running: false } : null));
            Message.error(t('settings.webui.operationFailed'));
            return;
          }

          // Server actually started.
          const responseIP = statusResult.data.lanIP || currentIP;
          if (responseIP) setCachedIP(responseIP);
          setStatus(statusResult.data);
        }

        // Persist only after successful start
        await ConfigStorage.set(DESKTOP_WEBUI_ENABLED_KEY, true);
        Message.success(t('settings.webui.startSuccess'));
      } else {
        // Update UI immediately, stop server async
        setStatus((prev) => (prev ? { ...prev, running: false } : null));
        await ConfigStorage.set(DESKTOP_WEBUI_ENABLED_KEY, false);
        Message.success(t('settings.webui.stopSuccess'));
        webui.stop.invoke().catch((err) => console.error('WebUI stop error:', err));
      }
    } catch (error) {
      // Rollback UI state
      setWebuiEnabled(previousEnabled);
      console.error('Toggle WebUI error:', error);
      Message.error(t('settings.webui.operationFailed'));
    } finally {
      setStartLoading(false);
    }
  };

  // Handle allow remote toggle
  // Need to restart server to change binding address
  const handleAllowRemoteChange = async (checked: boolean) => {
    // Save original value for rollback
    const previousAllowRemote = allowRemotePreference;
    setAllowRemotePreference(checked);

    const wasRunning = status?.running;

    // If server is running, need to restart to apply new binding settings
    if (wasRunning) {
      setStartLoading(true);
      try {
        // 1. First stop the server
        try {
          await Promise.race([webui.stop.invoke(), new Promise((resolve) => setTimeout(resolve, 1500))]);
        } catch (err) {
          console.error('WebUI stop error:', err);
        }

        // 2. Restart immediately (server stops quickly)
        const startResult = await Promise.race([
          webui.start.invoke({ port, allowRemote: checked }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);

        if (startResult && startResult.success && startResult.data) {
          const responseIP = startResult.data.lanIP;
          const responsePassword = startResult.data.initialPassword;

          if (responseIP) setCachedIP(responseIP);
          if (responsePassword) setCachedPassword(responsePassword);

          setStatus((prev) => ({
            ...(prev || { adminUsername: 'admin' }),
            running: true,
            port,
            allowRemote: checked,
            localUrl: `http://localhost:${port}`,
            networkUrl: checked && responseIP ? `http://${responseIP}:${port}` : undefined,
            lanIP: responseIP,
            initialPassword: responsePassword || cachedPassword || prev?.initialPassword,
          }));

          // Persist only after success
          await ConfigStorage.set(DESKTOP_WEBUI_ALLOW_REMOTE_KEY, checked);
          Message.success(t('settings.webui.restartSuccess'));
        } else {
          // Response is null or failed, but server might have started, check status
          let statusResult: { success: boolean; data?: IWebUIStatus } | null = null;
          if (window.electronAPI?.webuiGetStatus) {
            statusResult = await window.electronAPI.webuiGetStatus();
          } else {
            statusResult = await Promise.race([
              webui.getStatus.invoke(),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
            ]);
          }

          if (statusResult?.success && statusResult?.data?.running) {
            // Server actually started
            const responseIP = statusResult.data.lanIP;
            if (responseIP) setCachedIP(responseIP);

            setStatus(statusResult.data);
            // Persist only after success
            await ConfigStorage.set(DESKTOP_WEBUI_ALLOW_REMOTE_KEY, checked);
            Message.success(t('settings.webui.restartSuccess'));
          } else {
            // Really failed to start, rollback
            setAllowRemotePreference(previousAllowRemote);
            Message.error(t('settings.webui.operationFailed'));
            setStatus((prev) => (prev ? { ...prev, running: false } : null));
          }
        }
      } catch (error) {
        // Rollback UI state
        setAllowRemotePreference(previousAllowRemote);
        console.error('[WebuiModal] Restart error:', error);
        Message.error(t('settings.webui.operationFailed'));
      } finally {
        setStartLoading(false);
      }
    } else {
      // Server not running, persist directly
      try {
        await ConfigStorage.set(DESKTOP_WEBUI_ALLOW_REMOTE_KEY, checked);

        // Get IP for display
        let newIP: string | undefined;
        try {
          if (window.electronAPI?.webuiGetStatus) {
            const result = await window.electronAPI.webuiGetStatus();
            if (result?.success && result?.data?.lanIP) {
              newIP = result.data.lanIP;
              setCachedIP(newIP);
            }
          }
        } catch {
          // ignore
        }

        const existingIP = newIP || cachedIP || status?.lanIP;
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                allowRemote: checked,
                lanIP: existingIP || prev.lanIP,
                networkUrl: checked && existingIP ? `http://${existingIP}:${port}` : undefined,
              }
            : null
        );
      } catch (error) {
        // Rollback UI state
        setAllowRemotePreference(previousAllowRemote);
        console.error('[WebuiModal] Failed to persist allowRemote:', error);
        Message.error(t('settings.webui.operationFailed'));
      }
    }
  };

  // Copy content
  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    Message.success(t('common.copySuccess'));
  };

  // Open set new password modal
  const handleResetPassword = () => {
    form.resetFields();
    setSetPasswordModalVisible(true);
  };

  // Forgot-password recovery: generate a brand-new password WITHOUT the old one.
  // The desktop owner is the authority (the main process shows a native
  // confirmation dialog), so a forgotten password never locks them out. All web
  // sessions are invalidated and the new password is shown above.
  const handleForgotPasswordReset = async () => {
    if (!window.electronAPI?.webuiResetPassword) {
      Message.error(
        t('settings.webui.resetUnavailable', { defaultValue: 'Password reset is only available in the desktop app.' })
      );
      return;
    }
    setResetLoading(true);
    try {
      const result = await window.electronAPI.webuiResetPassword();
      if (result.success && result.newPassword) {
        setSetPasswordModalVisible(false);
        form.resetFields();
        setCachedPassword(result.newPassword);
        setCanShowPlainPassword(true);
        setStatus((prev) => (prev ? { ...prev, initialPassword: result.newPassword } : null));
        Message.success(
          t('settings.webui.passwordReset', { defaultValue: 'Password reset - your new password is shown above.' })
        );
      } else if (result.msg && result.msg !== 'CONFIRMATION_DECLINED') {
        Message.error(result.msg);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetUsername = () => {
    // Clear any stale current-password entry before re-opening the modal.
    usernameForm.resetFields();
    usernameForm.setFieldsValue({
      newUsername: status?.adminUsername || 'admin',
    });
    setSetUsernameModalVisible(true);
  };

  // Submit new password
  const handleSetNewPassword = async () => {
    try {
      const values = await form.validate();
      setPasswordLoading(true);

      let result: { success: boolean; msg?: string };

      // Prefer direct IPC (Electron environment). The direct IPC handler
      // requires the current password and shows a native main-process
      // confirmation dialog before applying the change.
      if (window.electronAPI?.webuiChangePassword) {
        result = await window.electronAPI.webuiChangePassword(values.newPassword, values.currentPassword);
      } else {
        // Browser (headless / WebUI) fallback: call the safe HTTP route. It
        // enforces JWT auth (from the cookie via credentials:'include'),
        // verifies the current password, is rate-limited, and revokes all
        // sessions on success. The webui.changePassword bridge is in the remote
        // denylist (and lacks the current-password check), so it cannot be used
        // here. CSRF token + JWT cookie travel exactly like the login request.
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(
            withCsrfToken({
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            })
          ),
        });
        const data = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
          details?: string[];
        };
        result = {
          success: Boolean(data.success),
          msg: data.details?.join('; ') || data.error,
        };
      }

      if (result.success) {
        Message.success(t('settings.webui.passwordChanged'));
        setSetPasswordModalVisible(false);
        form.resetFields();
        // Update cached password, no longer show plaintext
        setCachedPassword(values.newPassword);
        setCanShowPlainPassword(false);
        setStatus((prev) => (prev ? { ...prev, initialPassword: undefined } : null));
      } else {
        // Translate backend error codes to localized messages
        // Backend may join multiple codes with '; ' (e.g. "PASSWORD_TOO_SHORT; PASSWORD_TOO_COMMON")
        const errorCodeMap: Record<string, string> = {
          PASSWORD_TOO_SHORT: t('settings.webui.passwordTooShort'),
          PASSWORD_TOO_LONG: t('settings.webui.passwordTooLong'),
          PASSWORD_TOO_COMMON: t('settings.webui.passwordTooCommon'),
        };
        const rawMsg = result.msg || '';
        const codes = rawMsg.split('; ');
        const translated = codes.map((code) => errorCodeMap[code]).filter(Boolean);
        Message.error(
          translated.length > 0 ? translated.join('; ') : rawMsg || t('settings.webui.passwordChangeFailed')
        );
      }
    } catch (error) {
      console.error('Set new password error:', error);
      Message.error(t('settings.webui.passwordChangeFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSetNewUsername = async () => {
    try {
      const values = await usernameForm.validate();
      setUsernameLoading(true);

      let result: { success: boolean; msg?: string; username?: string };

      if (window.electronAPI?.webuiChangeUsername) {
        // Direct IPC requires the current password and shows a native
        // main-process confirmation dialog before applying the change.
        const ipcResult = await window.electronAPI.webuiChangeUsername(values.newUsername, values.currentPassword);
        result = { success: ipcResult.success, msg: ipcResult.msg, username: ipcResult.data?.username };
      } else {
        // Browser (headless / WebUI) fallback: call the safe HTTP route. It
        // enforces JWT auth (cookie via credentials:'include'), verifies the
        // current password, is rate-limited, and is write-only. The
        // webui.changeUsername bridge is in the remote denylist (and lacks the
        // current-password check), so it cannot be used here.
        result = await changeUsernameHttp(values.newUsername, values.currentPassword);
      }

      const nextUsername = result.username ?? values.newUsername.trim();
      if (result.success) {
        Message.success(t('settings.webui.usernameChanged'));
        setSetUsernameModalVisible(false);
        usernameForm.resetFields();
        setStatus((prev) => (prev ? { ...prev, adminUsername: nextUsername } : null));
      } else {
        Message.error(result.msg || t('settings.webui.usernameChangeFailed'));
      }
    } catch (error) {
      console.error('Set new username error:', error);
      Message.error(t('settings.webui.usernameChangeFailed'));
    } finally {
      setUsernameLoading(false);
    }
  };

  // Generate QR code
  const generateQRCode = useCallback(async () => {
    if (!status?.running) return;

    setQrLoading(true);
    try {
      // Prefer direct IPC (Electron environment)
      let result: {
        success: boolean;
        data?: { token: string; expiresAt: number; qrUrl: string };
        msg?: string;
      } | null = null;

      if (window.electronAPI?.webuiGenerateQRToken) {
        result = await window.electronAPI.webuiGenerateQRToken();
      } else {
        // Fallback: use bridge
        result = await webui.generateQRToken.invoke();
      }

      if (result && result.success && result.data) {
        setQrUrl(result.data.qrUrl);
        setQrExpiresAt(result.data.expiresAt);

        // Set auto-refresh timer (refresh after 4 minutes, as token expires in 5 minutes)
        if (qrRefreshTimerRef.current) {
          clearTimeout(qrRefreshTimerRef.current);
        }
        qrRefreshTimerRef.current = setTimeout(
          () => {
            void generateQRCode();
          },
          4 * 60 * 1000
        );
      } else {
        console.error('Generate QR code failed:', result?.msg);
        Message.error(t('settings.webui.qrGenerateFailed'));
      }
    } catch (error) {
      console.error('Generate QR code error:', error);
      Message.error(t('settings.webui.qrGenerateFailed'));
    } finally {
      setQrLoading(false);
    }
  }, [status?.running, t]);

  // Auto-generate QR code when server starts and remote access is allowed
  useEffect(() => {
    if (status?.running && status.allowRemote && !qrUrl) {
      void generateQRCode();
    }
    // Cleanup timer
    return () => {
      if (qrRefreshTimerRef.current) {
        clearTimeout(qrRefreshTimerRef.current);
      }
    };
  }, [status?.allowRemote, status?.running, generateQRCode, qrUrl]);

  // Clear QR code when server stops or remote access is disabled
  useEffect(() => {
    if (!status?.running || !status.allowRemote) {
      setQrUrl(null);
      setQrExpiresAt(null);
      if (qrRefreshTimerRef.current) {
        clearTimeout(qrRefreshTimerRef.current);
        qrRefreshTimerRef.current = null;
      }
    }
  }, [status?.allowRemote, status?.running]);

  // Format expiration time
  const formatExpiresAt = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // Get actual password
  const actualPassword = status?.initialPassword || cachedPassword;
  // Get display password
  // Password shows *** by default, only show plaintext on first startup
  // Show loading state when resetting
  const getDisplayPassword = () => {
    if (resetLoading) return t('common.loading');
    // Show plaintext when allowed and has password
    if (canShowPlainPassword && actualPassword) return actualPassword;
    // Otherwise show ******
    return t('settings.webui.passwordHidden');
  };
  const displayPassword = getDisplayPassword();
  const displayUsername = status?.adminUsername || 'admin';

  // The change-password modal is rendered in both the headless (browser) and
  // desktop layouts, so it is defined once here. handleSetNewPassword already
  // has a browser path that POSTs the authenticated /api/auth/change-password.
  const passwordModal = (
    <WaylandModal
      visible={setPasswordModalVisible}
      onCancel={() => setSetPasswordModalVisible(false)}
      onOk={handleSetNewPassword}
      confirmLoading={passwordLoading}
      title={t('settings.webui.setNewPassword')}
      size='small'
    >
      <Form form={form} layout='vertical' className='pt-16px'>
        <Form.Item
          label={t('settings.webui.currentPassword')}
          field='currentPassword'
          rules={[{ required: true, message: t('settings.webui.currentPasswordRequired') }]}
        >
          <Input.Password placeholder={t('settings.webui.currentPasswordPlaceholder')} />
        </Form.Item>
        <div className='flex justify-end -mt-12px mb-4px'>
          <Button type='text' size='mini' status='warning' loading={resetLoading} onClick={handleForgotPasswordReset}>
            {t('settings.webui.forgotPassword', { defaultValue: 'Forgot your password? Reset it' })}
          </Button>
        </div>
        <Form.Item
          label={t('settings.webui.newPassword')}
          field='newPassword'
          rules={[
            { required: true, message: t('settings.webui.newPasswordRequired') },
            { minLength: 8, message: t('settings.webui.passwordMinLength') },
          ]}
        >
          <Input.Password placeholder={t('settings.webui.newPasswordPlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('settings.webui.confirmPassword')}
          field='confirmPassword'
          rules={[
            { required: true, message: t('settings.webui.confirmPasswordRequired') },
            {
              validator: (value, callback) => {
                if (value !== form.getFieldValue('newPassword')) {
                  callback(t('settings.webui.passwordMismatch'));
                } else {
                  callback();
                }
              },
            },
          ]}
        >
          <Input.Password placeholder={t('settings.webui.confirmPasswordPlaceholder')} />
        </Form.Item>
      </Form>
    </WaylandModal>
  );

  // The change-username modal is rendered in both the headless (browser) and
  // desktop layouts, so it is defined once here. handleSetNewUsername has a
  // browser path that POSTs the authenticated /api/auth/change-username (the
  // bridge channel is remote-denied).
  const usernameModal = (
    <WaylandModal
      visible={setUsernameModalVisible}
      onCancel={() => setSetUsernameModalVisible(false)}
      onOk={handleSetNewUsername}
      confirmLoading={usernameLoading}
      title={t('settings.webui.setNewUsername')}
      size='small'
    >
      <Form form={usernameForm} layout='vertical' className='pt-16px'>
        <Form.Item
          label={t('settings.webui.currentPassword')}
          field='currentPassword'
          rules={[{ required: true, message: t('settings.webui.currentPasswordRequired') }]}
        >
          <Input.Password placeholder={t('settings.webui.currentPasswordPlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('settings.webui.newUsername')}
          field='newUsername'
          rules={[
            { required: true, message: t('settings.webui.newUsernameRequired') },
            {
              validator: (value, callback) => {
                if (typeof value !== 'string') {
                  callback();
                  return;
                }

                const trimmed = value.trim();
                if (trimmed.length < 3) {
                  callback(t('settings.webui.usernameMinLength'));
                  return;
                }

                if (trimmed.length > 32) {
                  callback(t('settings.webui.usernameMaxLength'));
                  return;
                }

                if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
                  callback(t('settings.webui.usernameFormatError'));
                  return;
                }

                if (/^[_-]|[_-]$/.test(trimmed)) {
                  callback(t('settings.webui.usernameEdgeError'));
                  return;
                }

                callback();
              },
            },
          ]}
        >
          <Input placeholder={t('settings.webui.newUsernamePlaceholder')} />
        </Form.Item>
      </Form>
    </WaylandModal>
  );

  // In browser mode, only show Channels config, not WebUI service config. The
  // admin account still needs a way to change its password (#26): the desktop
  // password panel is gated out here, so surface a compact change-password card
  // wired to the same handler + modal.
  if (!isDesktop) {
    return (
      <div className='flex flex-col h-full w-full'>
        <WaylandScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow={isPageMode}>
          <div className='space-y-16px'>
            <h2 className='text-20px font-500 text-t-primary m-0'>Channels</h2>
            <Suspense fallback={<div className='text-13px text-t-secondary'>{t('common.loading')}</div>}>
              <ChannelModalContentLazy />
            </Suspense>

            <div className='px-14px py-12px bg-[var(--color-bg-2)] border-2 border-solid border-[var(--color-border-2)] rd-12px flex items-center justify-between gap-12px'>
              <div className='min-w-0'>
                <div className='text-13px text-t-primary font-500'>
                  {t('settings.webui.changeUsername', { defaultValue: 'Change username' })}
                </div>
                <div className='text-12px text-t-secondary'>
                  {t('settings.webui.changeUsernameDesc', {
                    defaultValue: 'Update the admin login name for this server.',
                  })}
                </div>
              </div>
              <Button type='primary' size='small' className='rd-100px shrink-0' onClick={handleResetUsername}>
                {t('settings.webui.changeUsername', { defaultValue: 'Change username' })}
              </Button>
            </div>

            <div className='px-14px py-12px bg-[var(--color-bg-2)] border-2 border-solid border-[var(--color-border-2)] rd-12px flex items-center justify-between gap-12px'>
              <div className='min-w-0'>
                <div className='text-13px text-t-primary font-500'>
                  {t('settings.webui.changePassword', { defaultValue: 'Change password' })}
                </div>
                <div className='text-12px text-t-secondary'>
                  {t('settings.webui.changePasswordDesc', {
                    defaultValue: 'Update the admin password for this server.',
                  })}
                </div>
              </div>
              <Button
                type='primary'
                size='small'
                className='rd-100px shrink-0'
                onClick={() => {
                  form.resetFields();
                  setSetPasswordModalVisible(true);
                }}
              >
                {t('settings.webui.changePassword', { defaultValue: 'Change password' })}
              </Button>
            </div>
          </div>
        </WaylandScrollArea>
        {usernameModal}
        {passwordModal}
      </div>
    );
  }

  const webuiPanel = (
    <WaylandScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow={isPageMode}>
      <div className='space-y-12px px-[12px] md:px-[28px]'>
        {/* Title */}
        <h2 className='text-20px font-500 text-t-primary m-0'>WebUI</h2>

        {/* Description */}
        <div className='space-y-6px'>
          <p className='m-0 text-13px text-t-secondary leading-relaxed'>{t('settings.webui.description')}</p>
          <div className='flex flex-wrap gap-x-12px gap-y-6px'>
            {[
              t('settings.webui.enable', { defaultValue: 'Enable WebUI' }),
              t('settings.webui.accessUrl', { defaultValue: 'Access URL' }),
              t('settings.webui.allowRemote', { defaultValue: 'Allow Remote Access' }),
            ].map((stepLabel, idx) => (
              <div key={stepLabel} className='inline-flex items-center gap-6px'>
                <span className='inline-flex items-center justify-center w-16px h-16px rd-50% text-10px font-600 bg-[rgba(var(--primary-6),0.12)] text-[rgb(var(--primary-6))]'>
                  {idx + 1}
                </span>
                <CheckCircle2 size={12} className='text-[rgb(var(--primary-6))]' />
                <span className='text-12px text-t-secondary'>{stepLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Messaging primary entry - disabled, kept for future use
        <div className='rd-12px border border-line bg-2 px-12px py-10px flex items-center justify-between gap-10px'>
            <div className='min-w-0 flex items-center gap-8px'>
              <Communication theme='outline' size='18' className='text-[rgb(var(--primary-6))] shrink-0' />
              <div className='min-w-0'>
                <div className='text-13px text-t-primary font-500'>{t('settings.webui.featureChannelsTitle')}</div>
                <div className='text-12px text-t-secondary truncate'>{t('settings.webui.featureChannelsDesc')}</div>
              </div>
            </div>
            <Button type='primary' size='small' className='rd-100px' onClick={() => setActiveTab('channels')}>
              {t('settings.webui.goToChannels')}
            </Button>
          </div>
        */}

        {/* WebUI Service Card */}
        <div className='px-[12px] md:px-[28px] py-14px bg-[var(--color-bg-2)] border-2 border-solid border-[var(--color-border-2)] rd-12px'>
          {/* WebUI hint */}
          <div className='mb-8px rd-10px border border-line bg-fill-1 px-10px py-8px flex items-start gap-6px'>
            <Globe size={16} className='mt-1px text-[rgb(var(--primary-6))]' />
            <div className='text-12px text-t-secondary leading-relaxed'>{t('settings.webui.featureRemoteDesc')}</div>
          </div>

          {/* Enable WebUI */}
          <PreferenceRow
            label={t('settings.webui.enable')}
            extra={
              startLoading ? (
                <span className='text-12px text-warning'>{t('settings.webui.starting')}</span>
              ) : status?.running ? (
                <span className='text-12px text-success'>✓ {t('settings.webui.running')}</span>
              ) : null
            }
          >
            <Switch checked={webuiEnabled} loading={startLoading} onChange={handleToggle} />
          </PreferenceRow>

          {/* Access URL (only when running) */}
          {status?.running && (
            <PreferenceRow label={t('settings.webui.accessUrl')}>
              <div className='flex items-center gap-8px min-w-0'>
                <button
                  className='text-14px text-primary font-mono hover:underline cursor-pointer bg-transparent border-none p-0 truncate'
                  onClick={() => shell.openExternal.invoke(getDisplayUrl()).catch(console.error)}
                >
                  {getDisplayUrl()}
                </button>
                <Tooltip content={t('common.copy')}>
                  <button
                    className='p-4px text-t-tertiary hover:text-t-primary cursor-pointer bg-transparent border-none'
                    onClick={() => handleCopy(getDisplayUrl())}
                  >
                    <Copy size={16} />
                  </button>
                </Tooltip>
              </div>
            </PreferenceRow>
          )}

          {/* Allow LAN Access */}
          <PreferenceRow
            label={t('settings.webui.allowRemote')}
            description={
              <span className='text-t-secondary'>
                {t('settings.webui.allowRemoteDesc')}
                {'  '}
                <button
                  className='text-primary hover:underline cursor-pointer bg-transparent border-none p-0 text-12px'
                  onClick={() =>
                    shell.openExternal
                      .invoke('https://github.com/FerroxLabs/wayland/wiki/Remote-Internet-Access-Guide')
                      .catch(console.error)
                  }
                >
                  {t('settings.webui.viewGuide')}
                </button>
              </span>
            }
          >
            <Switch checked={allowRemotePreference} onChange={handleAllowRemoteChange} />
          </PreferenceRow>
        </div>

        {/* Login Info Card */}
        <div className='px-[12px] md:px-[28px] py-14px bg-[var(--color-bg-2)] border-2 border-solid border-[var(--color-border-2)] rd-12px'>
          <div className='text-14px font-500 mb-8px text-t-primary'>{t('settings.webui.loginInfo')}</div>

          {/* Account */}
          <div className='flex items-center justify-between gap-12px py-12px'>
            <span className='text-14px text-t-secondary shrink-0'>{t('settings.webui.username')}:</span>
            <div className='inline-flex items-center gap-8px rd-100px border border-line bg-fill-1 px-10px py-4px min-w-0'>
              <span className='text-14px text-t-primary truncate'>{displayUsername}</span>
              <Tooltip content={t('common.copy')}>
                <Button
                  type='text'
                  size='mini'
                  className='rd-100px !px-6px inline-flex items-center !h-24px'
                  onClick={() => handleCopy(displayUsername)}
                >
                  <Copy size={14} />
                </Button>
              </Tooltip>
              <Tooltip content={t('settings.webui.editUsernameTooltip')}>
                <Button
                  type='text'
                  size='mini'
                  className='rd-100px !px-6px inline-flex items-center !h-24px'
                  onClick={handleResetUsername}
                >
                  <PencilLine size={14} />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Password */}
          <div className='flex items-center justify-between gap-12px py-12px'>
            <span className='text-14px text-t-secondary shrink-0'>{t('settings.webui.initialPassword')}:</span>
            <div className='inline-flex items-center gap-8px rd-100px border border-line bg-fill-1 px-10px py-4px min-w-0'>
              <span className='text-14px text-t-primary truncate'>{displayPassword}</span>
              <Tooltip content={t('settings.webui.resetPasswordTooltip')}>
                <Button
                  type='text'
                  size='mini'
                  className='rd-100px !px-6px inline-flex items-center !h-24px'
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                >
                  <PencilLine size={14} />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* QR Code Login (only when server running and remote access allowed) */}
          {status?.running && status.allowRemote && (
            <>
              <div className='border-t border-line my-12px' />
              <div className='text-14px font-500 mb-4px text-t-primary'>{t('settings.webui.qrLogin')}</div>
              <div className='text-12px text-t-tertiary mb-12px'>{t('settings.webui.qrLoginHint')}</div>

              <div className='flex flex-col items-center gap-12px'>
                {/* QR Code display area */}
                <div className='p-12px bg-fill-1 border border-line rd-10px'>
                  {qrLoading ? (
                    <div className='w-140px h-140px flex items-center justify-center'>
                      <span className='text-14px text-t-tertiary'>{t('common.loading')}</span>
                    </div>
                  ) : qrUrl ? (
                    <div className='p-8px bg-white rd-8px'>
                      <Suspense
                        fallback={
                          <div className='w-140px h-140px flex items-center justify-center'>
                            <span className='text-14px text-t-tertiary'>{t('common.loading')}</span>
                          </div>
                        }
                      >
                        <QRCodeSVGLazy value={qrUrl} size={140} level='M' />
                      </Suspense>
                    </div>
                  ) : (
                    <div className='w-140px h-140px flex items-center justify-center'>
                      <span className='text-14px text-t-tertiary'>{t('settings.webui.qrGenerateFailed')}</span>
                    </div>
                  )}
                </div>

                {/* Expiration time, copy link and refresh button */}
                <div className='flex items-center gap-8px'>
                  {qrExpiresAt && (
                    <span className='text-12px text-t-tertiary'>
                      {t('settings.webui.qrExpires', { time: formatExpiresAt(qrExpiresAt) })}
                    </span>
                  )}
                  {qrUrl && (
                    <Tooltip content={t('settings.webui.copyQrLink')}>
                      <button
                        className='p-4px bg-transparent border-none text-t-tertiary hover:text-t-primary cursor-pointer'
                        onClick={() => handleCopy(qrUrl)}
                      >
                        <Copy size={16} />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip content={t('settings.webui.refreshQr')}>
                    <button
                      className='p-4px bg-transparent border-none text-t-tertiary hover:text-t-primary cursor-pointer'
                      onClick={() => void generateQRCode()}
                      disabled={qrLoading}
                    >
                      <RefreshCw size={16} className={qrLoading ? 'animate-spin' : ''} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </WaylandScrollArea>
  );

  return (
    <div className='flex flex-col h-full w-full'>
      {webuiPanel}

      {/* Set New Username Modal (shared with the headless layout above) */}
      {usernameModal}

      {/* Set New Password Modal (shared with the headless layout above) */}
      {passwordModal}
    </div>
  );
};

export default WebuiModalContent;
