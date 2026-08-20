/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-9, the wiring. Everything that decides anything lives in
 * `artifactActions`; this file supplies the four host effects and nothing else,
 * so the decisions can be tested against a real filesystem with only the OS
 * launcher recorded.
 *
 * The reveal and open effects are the SAME functions the shell providers use -
 * imported, not reimplemented. A second copy would drift, and the details it
 * would drift away from (the Linux portal timeout, the `xdg-open` fallback that
 * exists because reveal silently no-ops without a D-Bus file manager) are
 * exactly the ones nobody re-derives correctly.
 */

import { dialog } from 'electron';
import path from 'path';

import { ipcBridge } from '@/common';
import { getDataPath } from '@process/utils';
import {
  describeArtifactOpenTarget,
  listArtifactSummaries,
  openArtifact,
  revealArtifact,
  saveArtifactCopy,
  type ArtifactHostEffects,
} from '@process/services/artifacts/artifactActions';
import { artifactLedgerPath, readArtifactLedger } from '@process/services/artifacts/artifactLedger';
import { buildArtifactSeriesView } from '@process/services/artifacts/artifactSeriesView';

import { buildSendTargets } from '@process/services/artifacts/artifactSendConnectors';
import {
  describeSendConfirmation,
  listArtifactSendTargets,
  sendArtifactTo,
  type ArtifactSendConfirmation,
  type ArtifactDelivery,
  type ArtifactSendEffects,
} from '@process/services/artifacts/artifactSend';
import { getChannelManager } from '@process/channels/core/ChannelManager';
import type { IChannelRepository } from '@process/services/database/IChannelRepository';

import { confinePath } from './pathConfinement';
import { openPathReporting, revealPathReporting } from './shellBridge';
import { requireConfirmation } from './webuiDirectAuth';

function buildEffects(): ArtifactHostEffects {
  return {
    readLedger: () => readArtifactLedger(artifactLedgerPath(getDataPath())),
    confine: (target) => confinePath(target),
    launch: (target) => openPathReporting(target),
    reveal: (target) => revealPathReporting(target),
    chooseSaveDestination: async (suggestedName) => {
      // `defaultPath` is a SUGGESTION the OS shows in the name field; the user
      // picks the real destination, and the write goes wherever they chose.
      // That is the only reason a save target outside the authorized roots is
      // legitimate here - it is the user's own act, not a renderer-supplied
      // path, and nothing is executed at the far end.
      const result = await dialog.showSaveDialog({
        defaultPath: suggestedName,
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      });
      if (result.canceled || !result.filePath) return null;
      return path.resolve(result.filePath);
    },
  };
}

/**
 * The consent gate for sending a deliverable off this machine.
 *
 * A NATIVE MAIN-PROCESS DIALOG, and deliberately not an `IConfirmation`. A
 * consent card in the conversation stream is answered before a human sees it:
 * `BaseAgentManager.addConfirmation` auto-confirms `options[0]` under yoloMode,
 * and `ConversationChatConfirm` auto-confirms anything whose option VALUE is
 * `proceed_once`/`proceed_always`. This dialog has no options array for either
 * to reach, is raised by main rather than by the conversation, and a
 * compromised renderer cannot fake the answer - the same reason the
 * `webui-direct-*` family uses `requireConfirmation`, which is reused here
 * rather than forked so the two cannot drift.
 *
 * The FIRST LINE names the destination and the file. Not "Confirm action", not
 * "Allow this tool" - the two facts that decide the answer.
 */
async function confirmArtifactSend(request: ArtifactSendConfirmation): Promise<boolean> {
  const { message, detail } = describeSendConfirmation(request);
  return requireConfirmation({ title: 'Send file', message, detail, confirmLabel: 'Send' });
}

/**
 * Hand the verified bytes to the live connector.
 *
 * Throws on every failure, and that is intentional: `sendArtifactTo` owns the
 * classification, so there is exactly one place that decides what the renderer
 * is told. A connector that is configured but not currently connected is a
 * throw here and a `send_failed` there, never a silent success.
 */
async function deliverArtifact(delivery: ArtifactDelivery): Promise<void> {
  const plugin = getChannelManager().getRunningPlugin(delivery.targetId);
  if (!plugin) throw new Error('That connector is not connected right now.');

  await plugin.sendMessage(delivery.destinationId, {
    type: 'file',
    // The declared title is model-authored text. It is fine as a SUBJECT - the
    // recipient reads it - and is never used as a filename.
    subject: delivery.title || delivery.fileName,
    text: `Attached: ${delivery.fileName}`,
    // `hostAttachments`, never `mediaActions`: the latter is what an agent's
    // own [WAYLAND_CHANNEL_SEND] block produces, and no connector may attach it.
    hostAttachments: [{ filename: delivery.fileName, contentBase64: delivery.contents.toString('base64') }],
  });
}

function buildSendEffects(channelRepo: IChannelRepository): ArtifactSendEffects {
  return {
    readLedger: () => readArtifactLedger(artifactLedgerPath(getDataPath())),
    // Rebuilt from the user's own Settings -> Channels registry on EVERY call.
    // Never cached: a recipient revoked in Settings must stop being reachable
    // from a card immediately, not at the next restart.
    listTargets: async () => buildSendTargets(await channelRepo.getChannelPlugins(), await channelRepo.getChannelUsers()),
    confirmSend: confirmArtifactSend,
    deliver: deliverArtifact,
  };
}

export function initArtifactBridge(channelRepo: IChannelRepository): void {
  const effects = buildEffects();
  const sendEffects = buildSendEffects(channelRepo);

  ipcBridge.artifacts.list.provider(() => listArtifactSummaries(effects));
  ipcBridge.artifacts.open.provider(({ artifactId }) => openArtifact(artifactId, effects));
  ipcBridge.artifacts.reveal.provider(({ artifactId }) => revealArtifact(artifactId, effects));
  ipcBridge.artifacts.saveCopy.provider(({ artifactId }) => saveArtifactCopy(artifactId, effects));
  ipcBridge.artifacts.series.provider(({ artifactId }) => buildArtifactSeriesView(artifactId, effects));
  ipcBridge.artifacts.openTarget.provider(({ artifactId }) => describeArtifactOpenTarget(artifactId, effects));
  ipcBridge.artifacts.sendTargets.provider(() => listArtifactSendTargets(sendEffects));
  ipcBridge.artifacts.sendTo.provider((request) => sendArtifactTo(request, sendEffects));
}
