/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { ADAPTER_BRIDGE_EVENT_KEY } from '../common/adapter/constant';

// SECURITY (RT-F4-03): the weixin login channels (qr/scanned/done) carry a
// single, one-shot login flow. The previous implementation registered a fresh
// `ipcRenderer.on` listener per `weixinLoginOn*` call with no dedup or limit,
// so any caller - including an XSS-injected one - could leave a *persistent*
// `weixin:login:done` listener behind. On the next legitimate login the main
// process sends the `accountId` to every registered listener on that channel,
// including the stale malicious one, exfiltrating it.
//
// Mitigation: enforce single-active-listener semantics per channel. Each
// `weixinLoginOn*` registration removes any prior handler for that channel
// before installing its own, so at most one live handler exists per channel.
// `done` is one-shot: when it fires it tears down all three channels (the flow
// is over), and the returned unsubscribe likewise tears down the whole flow,
// so a restart begins from a clean slate. No stale/injected listener survives
// to receive a later login's accountId.
//
// Emit is already window-scoped: WeixinLoginHandler sends via
// `win.webContents.send(...)` to the single window that initiated
// `weixin:login:start`, not a broadcast to all windows.
const WEIXIN_QR_CHANNEL = 'weixin:login:qr';
const WEIXIN_SCANNED_CHANNEL = 'weixin:login:scanned';
const WEIXIN_DONE_CHANNEL = 'weixin:login:done';

type WeixinIpcHandler = (event: unknown, ...args: unknown[]) => void;

// At most one live handler per channel. Replacing one removes the previous.
const weixinHandlers: Record<string, WeixinIpcHandler | null> = {
  [WEIXIN_QR_CHANNEL]: null,
  [WEIXIN_SCANNED_CHANNEL]: null,
  [WEIXIN_DONE_CHANNEL]: null,
};

function setWeixinListener(channel: string, handler: WeixinIpcHandler): void {
  const prev = weixinHandlers[channel];
  if (prev) {
    ipcRenderer.removeListener(channel, prev);
  }
  weixinHandlers[channel] = handler;
  ipcRenderer.on(channel, handler);
}

function clearWeixinListener(channel: string): void {
  const current = weixinHandlers[channel];
  if (current) {
    ipcRenderer.removeListener(channel, current);
    weixinHandlers[channel] = null;
  }
}

function teardownWeixinFlow(): void {
  clearWeixinListener(WEIXIN_QR_CHANNEL);
  clearWeixinListener(WEIXIN_SCANNED_CHANNEL);
  clearWeixinListener(WEIXIN_DONE_CHANNEL);
}

const weixinLogin = {
  weixinLoginOnQR: (callback: (data: { qrcodeUrl: string }) => void) => {
    const h: WeixinIpcHandler = (_event, ...args) => callback(args[0] as { qrcodeUrl: string });
    setWeixinListener(WEIXIN_QR_CHANNEL, h);
    return () => clearWeixinListener(WEIXIN_QR_CHANNEL);
  },
  weixinLoginOnScanned: (callback: () => void) => {
    const h: WeixinIpcHandler = () => callback();
    setWeixinListener(WEIXIN_SCANNED_CHANNEL, h);
    return () => clearWeixinListener(WEIXIN_SCANNED_CHANNEL);
  },
  weixinLoginOnDone: (callback: (data: { accountId: string }) => void) => {
    const h: WeixinIpcHandler = (_event, ...args) => {
      // One-shot: a login flow ends here. Tear down all three channels so no
      // stale (incl. injected) listener survives to receive a later login's
      // accountId. teardown removes this handler too, so it fires at most once.
      teardownWeixinFlow();
      callback(args[0] as { accountId: string });
    };
    setWeixinListener(WEIXIN_DONE_CHANNEL, h);
    // Unsubscribe tears down the whole flow (qr + scanned + done together).
    return () => teardownWeixinFlow();
  },
};

/**
 * @description Injected into the renderer process to enable communication with the main process
 * */
contextBridge.exposeInMainWorld('electronAPI', {
  emit: (name: string, data: any) => {
    return ipcRenderer
      .invoke(
        ADAPTER_BRIDGE_EVENT_KEY,
        JSON.stringify({
          name: name,
          data: data,
        })
      )
      .catch((error) => {
        console.error('IPC invoke error:', error);
        throw error;
      });
  },
  on: (callback: any) => {
    const handler = (event: any, value: any) => {
      callback({ event, value });
    };
    ipcRenderer.on(ADAPTER_BRIDGE_EVENT_KEY, handler);
    return () => {
      ipcRenderer.off(ADAPTER_BRIDGE_EVENT_KEY, handler);
    };
  },
  // Get absolute path for a dragged file/directory
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  // Direct IPC calls (bypass bridge library)
  webuiResetPassword: () => ipcRenderer.invoke('webui-direct-reset-password'),
  webuiGetStatus: () => ipcRenderer.invoke('webui-direct-get-status'),
  // Change password requires current password + main-process confirmation
  webuiChangePassword: (newPassword: string, currentPassword: string) =>
    ipcRenderer.invoke('webui-direct-change-password', { newPassword, currentPassword }),
  // Change username requires current password + main-process confirmation
  webuiChangeUsername: (newUsername: string, currentPassword: string) =>
    ipcRenderer.invoke('webui-direct-change-username', { newUsername, currentPassword }),
  // Feedback: collect and compress recent log files
  collectFeedbackLogs: () => ipcRenderer.invoke('feedback:collect-logs'),
  // Wayland Constitution: agent behavioral spec stored at ~/.wayland/CONSTITUTION.md
  readConstitution: (): Promise<string> => ipcRenderer.invoke('constitution:read'),
  writeConstitution: (content: string): Promise<boolean> => ipcRenderer.invoke('constitution:write', content),
  resetConstitution: (): Promise<string> => ipcRenderer.invoke('constitution:reset'),
  readConstitutionWithOverlay: (assistantId?: string): Promise<{ constitution: string; overlay: string | null }> =>
    ipcRenderer.invoke('constitution:readWithOverlay', assistantId),
  // Per-specialist Constitution overlays at ~/.wayland/specialists/<id>.md
  listConstitutionSpecialists: (): Promise<{ id: string; bytes: number }[]> =>
    ipcRenderer.invoke('constitution:listSpecialists'),
  readConstitutionSpecialist: (id: string): Promise<string> => ipcRenderer.invoke('constitution:readSpecialist', id),
  writeConstitutionSpecialist: (id: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke('constitution:writeSpecialist', id, content),
  deleteConstitutionSpecialist: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('constitution:deleteSpecialist', id),
  // First-run onboarding: environment detection + Flux Desktop routing metrics
  onboardingDetect: () => ipcRenderer.invoke('onboarding:detect'),
  onboardingFluxMetrics: () => ipcRenderer.invoke('onboarding:fluxMetrics'),
  // Generate QR token
  webuiGenerateQRToken: () => ipcRenderer.invoke('webui-direct-generate-qr-token'),
  // WeChat login IPC
  weixinLoginStart: () => ipcRenderer.invoke('weixin:login:start'),
  ...weixinLogin,
});

// Tray event listeners - convert IPC events to DOM events
const trayEvents = [
  'tray:navigate-to-guid',
  'tray:navigate-to-conversation',
  'tray:open-about',
  'tray:pause-all-tasks',
  'tray:check-update',
];

for (const channel of trayEvents) {
  ipcRenderer.on(channel, (_event, ...args) => {
    window.dispatchEvent(new CustomEvent(channel, { detail: args[0] }));
  });
}
