/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4 audit CRIT-1 fix (2026-05-19) - Gate ACP file-protocol ops for
 * imported (sandboxed) teams.
 *
 * The ACP `READ_TEXT_FILE` / `WRITE_TEXT_FILE` handlers in `AcpConnection`
 * historically called `fs.readFile`/`fs.writeFile` directly via the
 * `readTextFile`/`writeTextFile` utils. This skipped `assertCapGranted`,
 * `withOpenInsideWorkspace`, the symlink walk, the NFKC denylist, and
 * `O_NOFOLLOW`. A sandboxed imported team could exfiltrate `/etc/passwd`
 * or plant a fake CLI under `node_modules/.bin/*` from inside the agent.
 *
 * `gateAcpFileOp` is the v1 fix:
 *  - Non-team conversations and non-imported teams: pass through to the
 *    legacy fallback (no behavior change for the trusted-host path).
 *  - Imported teams: assert the relevant capability, then route the FS
 *    op through `withOpenInsideWorkspace` against the team's workspace
 *    dir. Path traversal, absolute paths, symlinks, and the `.env` /
 *    `node_modules/.bin|.cache` denylist all reject via the helper.
 *
 * Caller wires team context via `acpTeamContextRegistry` so this gate
 * stays oblivious to AcpConnection's plumbing.
 */

import {
  getTeamContextForConversation,
  type AcpTeamContext,
} from './acpTeamContextRegistry';
import { assertCapGranted, type TeamCapability } from './capabilityCheck';
import { TeamSandboxedError } from '@process/team/importExport/errors';
import { withOpenInsideWorkspace } from './workspaceFs';

export type AcpFileOpMode = 'read' | 'write';

export type AcpFileOpRequest = {
  /** Path the agent requested (relative or absolute). */
  path: string;
  /** Content for writes; ignored for reads. */
  content?: string;
};

export type AcpFileOpResult =
  | { kind: 'read'; content: string }
  | { kind: 'write'; result: null };

/**
 * Run an ACP file op behind the imported-team sandbox gate.
 *
 * @param conversationId  ACP conversation id (used to look up team context).
 * @param mode            'read' or 'write'.
 * @param params          Request payload (path + optional content).
 * @param fallback        Legacy code path executed for non-team /
 *                        non-imported conversations.
 * @param overrideContext Test injection - bypass the registry lookup.
 */
export async function gateAcpFileOp(
  conversationId: string,
  mode: AcpFileOpMode,
  params: AcpFileOpRequest,
  fallback: () => Promise<AcpFileOpResult>,
  overrideContext?: AcpTeamContext
): Promise<AcpFileOpResult> {
  const ctx = overrideContext ?? getTeamContextForConversation(conversationId);
  if (!ctx || !ctx.isImported) {
    return fallback();
  }

  const team = await ctx.getTeam();
  if (!team) {
    throw new TeamSandboxedError(
      `Team ${ctx.teamId} not found; refusing ACP file op for sandboxed conversation.`
    );
  }

  const cap: TeamCapability = mode === 'read' ? 'canReadFiles' : 'canWriteFiles';
  assertCapGranted(team, cap);

  if (!team.workspace) {
    throw new TeamSandboxedError(
      `Team "${team.name}" has no workspace configured; refusing sandboxed ACP file op.`
    );
  }

  if (mode === 'read') {
    return withOpenInsideWorkspace(team.workspace, params.path, 'read', async (fh) => {
      const content = await fh.readFile({ encoding: 'utf-8' });
      return { kind: 'read' as const, content };
    });
  }

  const content = params.content ?? '';
  return withOpenInsideWorkspace(team.workspace, params.path, 'write', async (fh) => {
    await fh.writeFile(content, { encoding: 'utf-8' });
    const out: AcpFileOpResult = { kind: 'write', result: null };
    return out;
  });
}
