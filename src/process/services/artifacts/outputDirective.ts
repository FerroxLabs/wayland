/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE SENTENCE THAT TELLS A TURN WHERE ITS DELIVERABLES GO.
 *
 * Wayland Core carried this on its `--system-prompt` channel at spawn. Fuigo
 * (and every other ACP engine) has no system-prompt channel, so the directive
 * rides the prompt instead - prepended to the OUTGOING content of every user
 * turn by `AcpAgentManager`, never written to the message store. That keeps
 * the property `routineOutputDirectiveIsLiteral.test.ts` pins: a conversation
 * read is allowed to a paired WebUI, and the absolute staging path must not
 * be disclosed through it.
 *
 * ONE PRODUCER. The directory is `resolveOutputDir(workspace, activeRun,
 * conversationId)` - the same call the cron executor checks its staging
 * directory against before it sends - so the directive can only ever name the
 * directory the run collects from.
 */

import path from 'node:path';
import { activeRunOutputDir, resolveOutputDir } from './runOutputDir';

/**
 * Kept verbatim from Core's `envBuilder.buildOutputDirective`, wording proven
 * live on the morning-brief runs.
 *
 * `ephemeral` marks a directory that STOPS EXISTING when the turn ends: a
 * scheduled run's staging tree is renamed onto the dated run directory at
 * publication (or removed when it staged nothing), and publication happens
 * AFTER the turn, so the only path the model could print is the doomed one. A
 * chat's `artifacts/chat/<conversationId>` is permanent and keeps the clause.
 */
export function buildOutputDirective(absoluteOutputDir: string, opts?: { ephemeral?: boolean }): string {
  const reference = opts?.ephemeral
    ? "That directory is this run's staging area and the app deletes it the moment the run publishes, " +
      'so do NOT print it: name the file by name and say it is attached below as a card. ' +
      'The app writes the real, permanent path onto that card after this turn ends; you do not have it and must not guess it.'
    : `When you refer to a saved deliverable in your final message, name its path inside ${absoluteOutputDir}.`;
  return [
    `Deliverables you want the user to keep go in ${absoluteOutputDir}. Create that directory if it does not exist.`,
    'Use the workspace root for intermediate files, scratch analysis, scripts and drafts.',
    `Only files in ${absoluteOutputDir} are shown to the user as deliverables.`,
    reference,
  ].join(' ');
}

/**
 * The directive for this conversation's next turn, or `undefined` when there
 * is no workspace to resolve against.
 */
export function resolveTurnOutputDirective(workspace: string | undefined, conversationId: string): string | undefined {
  if (!workspace) return undefined;
  const openRunOutputDir = activeRunOutputDir(conversationId);
  const outputDir = resolveOutputDir(workspace, openRunOutputDir, conversationId);
  // Ephemeral only when the resolver actually accepted the open run's staging
  // tree; a rejected one falls back to the permanent chat namespace.
  const ephemeral = !!openRunOutputDir && outputDir === path.resolve(openRunOutputDir);
  return buildOutputDirective(outputDir, { ephemeral });
}
