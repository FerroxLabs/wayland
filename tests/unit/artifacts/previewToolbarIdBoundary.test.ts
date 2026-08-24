/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE TOOLBAR MUST NOT HAND A RAW PATH TO THE SHELL FOR AN ARTIFACT.
 *
 * The deliverable bar used to sit directly under the preview toolbar carrying
 * Open with <app>, Show in folder and Save a copy, while the toolbar offered
 * Open in system app and Download. To a reader that was the same row twice, and
 * the obvious tidy-up is to delete one of them.
 *
 * It was NOT the same thing twice. The toolbar's controls took
 * `metadata.filePath` and handed a RAW PATH to `shell.openFile`; the bar's took
 * an artifact id and nothing else - the boundary `artifacts.*` exists to keep,
 * and the reason its own suite is titled "no path crosses the boundary".
 * Deleting the id-based row would have silently downgraded that boundary. So the
 * ACTIONS moved up instead, and the panel routes them through
 * `useArtifactActions` whenever an artifact stands behind the preview.
 *
 * WHAT THIS FILE PROVES, AND WHAT IT DOES NOT. It is a STRUCTURAL guard on the
 * wiring, in the same style as the Cockpit navigation contract, which reads
 * Router.tsx and asserts the routes it names really exist. It does not execute a
 * click - `useArtifactActions`' own suite owns the behavioural claim that every
 * call carries an id and only an id. What this pins is the thing a future edit
 * would most plausibly undo: pointing the toolbar back at the path handlers.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const panelSource = fs.readFileSync(
  path.join(process.cwd(), 'src/renderer/pages/conversation/Preview/components/PreviewPanel/PreviewPanel.tsx'),
  'utf8'
);

describe('preview toolbar id boundary', () => {
  it('points the toolbar at the routed handlers, not straight at the path ones', () => {
    expect(panelSource).toContain('onOpenInSystem={openFromToolbar}');
    expect(panelSource).toContain('onDownload={downloadFromToolbar}');
    // The regression this guards: wiring the toolbar back to the path handlers.
    expect(panelSource).not.toContain('onOpenInSystem={handleOpenInSystem}');
    expect(panelSource).not.toContain('onDownload={handleDownload}');
  });

  it('prefers the id-based artifact calls whenever an artifact stands behind the preview', () => {
    const routed = panelSource.slice(
      panelSource.indexOf('const openFromToolbar'),
      panelSource.indexOf('const revealFromToolbar')
    );
    expect(routed).toContain('artifactActions.open()');
    expect(routed).toContain('artifactActions.saveCopy()');
    // The path calls survive ONLY as the fallback for a preview with no artifact.
    expect(routed).toContain('handleOpenInSystem()');
    expect(routed).toContain('handleDownload()');
    expect(routed).toContain('if (artifact)');
  });

  it('gives the deliverable bar the SAME action state the toolbar drives', () => {
    // `changed` is discovered by ATTEMPTING an action. A second
    // `useArtifactActions` would hand the bar a `changed` the toolbar's refusal
    // never sets, and the changed-file banner would never appear.
    expect(panelSource).toContain('const artifactActions = useArtifactActions(artifact, handleArtifactMessage)');
    expect(panelSource).toContain('actions={artifactActions}');
    // EXACTLY ONE call site. Two instances is the failure mode described above.
    expect(panelSource.match(/useArtifactActions\(/g)?.length).toBe(1);
  });
});
