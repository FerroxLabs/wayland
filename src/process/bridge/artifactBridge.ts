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

import { confinePath } from './pathConfinement';
import { openPathReporting, revealPathReporting } from './shellBridge';

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

export function initArtifactBridge(): void {
  const effects = buildEffects();

  ipcBridge.artifacts.list.provider(() => listArtifactSummaries(effects));
  ipcBridge.artifacts.open.provider(({ artifactId }) => openArtifact(artifactId, effects));
  ipcBridge.artifacts.reveal.provider(({ artifactId }) => revealArtifact(artifactId, effects));
  ipcBridge.artifacts.saveCopy.provider(({ artifactId }) => saveArtifactCopy(artifactId, effects));
  ipcBridge.artifacts.series.provider(({ artifactId }) => buildArtifactSeriesView(artifactId, effects));
  ipcBridge.artifacts.openTarget.provider(({ artifactId }) => describeArtifactOpenTarget(artifactId, effects));
}
