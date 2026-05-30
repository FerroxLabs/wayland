/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { ADAPTER_BRIDGE_EVENT_KEY } from '../common/adapter/constant';

/**
 * @description 注入到renderer进程中, 用于与main进程通信
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
  // 获取拖拽文件/目录的绝对路径 / Get absolute path for dragged file/directory
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  // 直接 IPC 调用（绕过 bridge 库）/ Direct IPC calls (bypass bridge library)
  webuiResetPassword: () => ipcRenderer.invoke('webui-direct-reset-password'),
  webuiGetStatus: () => ipcRenderer.invoke('webui-direct-get-status'),
  // 修改密码需要当前密码 + 主进程确认 / Change password requires current password + main-process confirmation
  webuiChangePassword: (newPassword: string, currentPassword: string) =>
    ipcRenderer.invoke('webui-direct-change-password', { newPassword, currentPassword }),
  webuiChangeUsername: (newUsername: string) => ipcRenderer.invoke('webui-direct-change-username', { newUsername }),
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
  readConstitutionSpecialist: (id: string): Promise<string> =>
    ipcRenderer.invoke('constitution:readSpecialist', id),
  writeConstitutionSpecialist: (id: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke('constitution:writeSpecialist', id, content),
  deleteConstitutionSpecialist: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('constitution:deleteSpecialist', id),
  // First-run onboarding: environment detection + Flux Desktop routing metrics
  onboardingDetect: () => ipcRenderer.invoke('onboarding:detect'),
  onboardingFluxMetrics: () => ipcRenderer.invoke('onboarding:fluxMetrics'),
  // 生��二维码 token / Generate QR token
  webuiGenerateQRToken: () => ipcRenderer.invoke('webui-direct-generate-qr-token'),
  // WeChat login IPC
  weixinLoginStart: () => ipcRenderer.invoke('weixin:login:start'),
  weixinLoginOnQR: (callback: (data: { qrcodeUrl: string }) => void) => {
    const h = (_event: unknown, data: { qrcodeUrl: string }) => callback(data);
    ipcRenderer.on('weixin:login:qr', h);
    return () => ipcRenderer.off('weixin:login:qr', h);
  },
  weixinLoginOnScanned: (callback: () => void) => {
    const h = () => callback();
    ipcRenderer.on('weixin:login:scanned', h);
    return () => ipcRenderer.off('weixin:login:scanned', h);
  },
  weixinLoginOnDone: (callback: (data: { accountId: string }) => void) => {
    const h = (_event: unknown, data: { accountId: string }) => callback(data);
    ipcRenderer.on('weixin:login:done', h);
    return () => ipcRenderer.off('weixin:login:done', h);
  },
});

// 托盘事件监听 - 将 IPC 事件转换为 DOM 事件
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
