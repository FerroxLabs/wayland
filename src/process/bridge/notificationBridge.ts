/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

/**
 * System Notification Module
 *
 * Provides showNotification() for direct use in main process,
 * and registers an IPC provider so renderer can invoke it cross-process.
 */

import { getPlatformServices } from '@/common/platform';
import { ipcBridge } from '@/common';
import { ProcessConfig } from '@process/utils/initStorage';
import path from 'path';
import fs from 'fs';

/**
 * Get app icon path for notifications
 */
const getNotificationIcon = (): string | undefined => {
  try {
    const resourcesPath = getPlatformServices().paths.isPackaged()
      ? process.resourcesPath
      : path.join(process.cwd(), 'resources');
    const iconPath = path.join(resourcesPath, 'app.png');
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
  } catch {
    // Ignore icon error, notification will still show
  }
  return undefined;
};

/**
 * Show a system notification.
 * Can be called directly from main process or via IPC from renderer.
 * In standalone mode this is a no-op (NodePlatformServices.notification.send is a no-op).
 *
 * `conversationId` was declared here and never destructured, so the one push
 * moment in the product was a banner the user could not act on. It is now
 * carried through to the click handler, alongside `artifactId`: when a run
 * produced a deliverable, activating the banner OPENS it.
 */
export async function showNotification({
  title,
  body,
  silent,
  conversationId,
  artifactId,
}: {
  title: string;
  body: string;
  conversationId?: string;
  /** The deliverable this banner is announcing. Clicking the banner opens it. */
  artifactId?: string;
  /** Show the banner without the OS sound. Callers use this for #579's quiet hours. */
  silent?: boolean;
}): Promise<void> {
  // Check if notification is enabled
  const notificationEnabled = await ProcessConfig.get('system.notificationEnabled');
  if (notificationEnabled === false) {
    return;
  }

  const iconPath = getNotificationIcon();

  try {
    getPlatformServices().notification.send({
      title,
      body,
      icon: iconPath,
      silent,
      // Returns its promise rather than discarding it. Electron ignores the
      // return value, but a caller that wants to observe the open - a test -
      // otherwise has to race the lazy import with a sleep.
      onClick: artifactId ? () => openAnnouncedArtifact(artifactId, conversationId) : undefined,
    });
  } catch (error) {
    console.error('[Notification] Error creating notification:', error);
  }
}

/**
 * Open the deliverable a banner announced.
 *
 * The artifact host effects are imported lazily because they reach for
 * Electron's `dialog`, and this module is also loaded by the standalone web
 * server, where that import would throw at module-evaluation time.
 *
 * Every failure is reported to the console and swallowed: this runs from an OS
 * callback with no caller to return to, and an unhandled rejection here would
 * be a crash triggered by the user clicking a banner.
 */
async function openAnnouncedArtifact(artifactId: string, conversationId?: string): Promise<void> {
  try {
    const [{ openArtifact }, { buildArtifactHostEffects }] = await Promise.all([
      import('@process/services/artifacts/artifactActions'),
      import('@process/bridge/artifactBridge'),
    ]);
    const result = await openArtifact(artifactId, buildArtifactHostEffects());
    // `openArtifact` is RESOLVE-ONLY: a refusal comes back as `{ ok: false }`,
    // never as a rejection, so a bare await would report success on a dead click.
    if (!result.ok) {
      console.warn(
        `[Notification] Could not open artifact ${artifactId} (conversation ${conversationId ?? 'unknown'}): ${result.error}`
      );
    }
  } catch (error) {
    console.error('[Notification] Error opening announced artifact:', error);
  }
}

/**
 * Register IPC provider so renderer can trigger notifications cross-process.
 */
export function initNotificationBridge(): void {
  ipcBridge.notification.show.provider(async (options) => {
    await showNotification(options);
  });
}
