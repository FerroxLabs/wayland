/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Catastrophic-command classifier for the Autopilot guardrail.
 *
 * In Autopilot (guarded-auto) sessions Wayland auto-approves the agent's tool
 * permission requests so a workflow runs unattended. This classifier is the one
 * exception: a command that matches a catastrophic, effectively-irreversible
 * pattern must NOT be auto-approved - it surfaces a real confirmation so a human
 * decides. The bar is deliberately high. We only flag commands that destroy the
 * machine/account or pull-and-run remote code; we do NOT flag ordinary
 * workflow operations (building, deleting a local build dir, git, package
 * installs) - false positives would stall every legitimate run, which is worse
 * than useless. When in doubt, this returns false (auto-approve proceeds).
 *
 * This is a backstop, not a sandbox. It pattern-matches a command string; a
 * determined obfuscation can evade it. Real isolation is the job of workspace
 * confinement and the user's own machine permissions. The value here is catching
 * the obvious `rm -rf ~`, `curl | sh`, `mkfs`, fork-bomb class before an
 * unattended agent fires it without anyone watching.
 */

/** A flagged command plus the human-readable reason it was flagged. */
export type DestructiveVerdict = {
  destructive: boolean;
  /** Short reason, shown on the surfaced confirmation. Empty when not destructive. */
  reason: string;
};

const NOT_DESTRUCTIVE: DestructiveVerdict = { destructive: false, reason: '' };

/**
 * Home directory, as it survives `normalize`: a bare `~` or the `$home`
 * variable (normalize collapses `${HOME}` and strips quotes, so `"$HOME"`,
 * `'$HOME'` and `${HOME}` all arrive here as `$home`).
 */
const HOME = String.raw`(?:~|\$home)`;

/**
 * Path fragments that identify credential or secret material. Used to flag a
 * command that hands one of these to a network client - the shape a credential
 * egress takes. Kept to well-known, unambiguous locations; a generic "any file
 * with a secret in it" test is not possible from a command string.
 */
const CREDENTIAL_PATH = String.raw`(?:\.ssh|\.aws|\.gnupg|\.kube|\.netrc|\.npmrc|\.pypirc|\.docker\/config|id_rsa|id_ed25519|id_ecdsa|\.env)\b`;

/**
 * Patterns for effectively-irreversible system/account destruction, remote code
 * execution, or credential egress. Each entry is [regex, reason]. Kept
 * conservative on purpose. Regexes run against the output of `normalize` -
 * whitespace-collapsed, lowercased, unquoted, with `${VAR}` reduced to `$VAR`.
 */
const CATASTROPHIC_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  // rm whose FIRST argument (right after the flags) is root, root-glob, or home.
  // Anchoring the target to the post-flag position is what distinguishes the
  // catastrophic `rm -rf /` / `rm -rf ~` from the everyday `rm -rf ./build`,
  // `rm -rf dist/`, `rm -rf node_modules` - the latter's target starts with a
  // name or `.`, never with `/`, `~`, or `$HOME`.
  [new RegExp(String.raw`\brm\s+(?:-\S+\s+)*(?:\/(?:\s|$|\*)|${HOME}\/?(?:\s|$))`), 'recursive delete of root or home'],
  // rm of a dotfile or dot-directory sitting directly in home (~/.ssh, $HOME/.aws,
  // ~/.config). Nothing a build run legitimately deletes lives there - those are
  // credentials and machine config - so this costs no false positives while
  // `rm -rf ~/dev/app/node_modules` (a real workflow delete, target not a dotfile)
  // stays unflagged.
  [new RegExp(String.raw`\brm\s+(?:-\S+\s+)*${HOME}\/\.[^\s/]`), 'delete of a home config or credential directory'],
  // rm of a whole top-level personal-data directory under home.
  [
    new RegExp(
      String.raw`\brm\s+(?:-\S+\s+)*${HOME}\/(?:library|documents|desktop|downloads|pictures|movies|music|applications)(?:\/\s|\/$|\s|$)`
    ),
    'delete of a personal data directory',
  ],
  // rm of a whole system top-level directory (rm -rf /etc, /usr, /Applications, ...).
  // A deeper targeted path under them (/var/log/app) is NOT flagged.
  [
    /\brm\s+(?:-\S+\s+)*\/(?:usr|etc|bin|sbin|lib|lib64|boot|sys|proc|dev|var|home|root|opt|applications|library|system|users|volumes|private)(?:\/\s|\/$|\s|$)/,
    'delete of a system directory',
  ],
  // An rm whose blast radius comes from where the shell is standing rather than
  // from its argument: `cd ~ && rm -rf *`, `cd / ; rm -rf *`. The target `*` is
  // far too common to flag on its own, but chained onto a cd to root or home it
  // is unambiguous.
  [new RegExp(String.raw`\bcd\s+(?:\/|${HOME})\s*(?:&&|;|\|\|)\s*(?:sudo\s+)?rm\b`), 'delete run from root or home'],
  // rm with --no-preserve-root is never legitimate from an agent
  [/\brm\s+.*--no-preserve-root/, 'rm with --no-preserve-root'],
  // Disk/device writes and filesystem creation
  [/\bdd\b[^|&;]*\bof=\/dev\//, 'raw write to a block device'],
  [/\bmkfs(\.[a-z0-9]+)?\b/, 'filesystem format (mkfs)'],
  [/>\s*\/dev\/(sd[a-z]|nvme\d|disk\d|hd[a-z])/, 'overwrite of a raw disk device'],
  // Fork bomb
  [/:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, 'fork bomb'],
  // chmod/chown -R on root or home
  [
    /\bch(mod|own)\s+(-[a-z]*\s+)*-?[a-z]*r[a-z]*\s+[^|&;]*(\s\/(\s|$)|\s~(\/|\s|$)|\$home)/,
    'recursive permission/owner change on root or home',
  ],
  // Network pull piped straight into a shell (curl|sh, wget|bash, ...)
  [/\b(curl|wget|fetch)\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh|dash|ksh)\b/, 'pipe of downloaded content into a shell'],
  // Network pull run through command or process substitution - the same
  // fetch-and-run with no pipe in sight: `bash -c "$(curl ...)"`,
  // `eval "$(wget -qO- ...)"`, `bash <(curl ...)`.
  [
    /\b(?:eval|source)\b[^|&;]*(?:\$\(|<\()\s*(?:sudo\s+)?(?:curl|wget|fetch)\b/,
    'shell execution of downloaded content',
  ],
  [
    /\b(?:sh|bash|zsh|dash|ksh)\b[^|&;]*(?:\$\(|<\()\s*(?:sudo\s+)?(?:curl|wget|fetch)\b/,
    'shell execution of downloaded content',
  ],
  // Overwriting core system files
  [/>\s*\/(etc|boot|sys)\//, 'overwrite of a system file'],
  // find rooted at / or home with -delete (mass delete). A scoped
  // `find ./src ... -delete` is NOT flagged.
  [new RegExp(String.raw`\bfind\s+(?:\/|${HOME})\s+[^|&;]*-delete\b`), 'find -delete rooted at root or home'],
  // Credential material handed to a network client, in either direction:
  // the client names the path, or the path is piped into the client.
  [
    new RegExp(String.raw`\b(?:curl|wget|nc|ncat|netcat)\b[^|&;]*${CREDENTIAL_PATH}`),
    'network command referencing a credential path',
  ],
  [
    new RegExp(String.raw`${CREDENTIAL_PATH}[^|]*\|\s*(?:sudo\s+)?(?:curl|wget|nc|ncat|netcat|base64|openssl|ssh)\b`),
    'credential material piped to a network command',
  ],
  // Mass-destructive git on the whole tree is NOT included (recoverable / scoped).
];

/**
 * Extract the shell command string from an ACP tool call. Execute-kind tools
 * carry the command on `rawInput` (commonly `.command`, sometimes `.cmd`/`.script`),
 * and the human title often mirrors it. We coalesce the candidates so the
 * classifier sees whatever the agent actually intends to run.
 */
export function extractCommandText(toolCall: { kind?: string; title?: string; rawInput?: unknown }): string {
  const parts: string[] = [];
  if (typeof toolCall.title === 'string') parts.push(toolCall.title);
  const raw = toolCall.rawInput;
  if (raw !== null && typeof raw === 'object') {
    for (const key of ['command', 'cmd', 'script', 'commandLine', 'input']) {
      const v = (raw as Record<string, unknown>)[key];
      if (typeof v === 'string') parts.push(v);
    }
  } else if (typeof raw === 'string') {
    parts.push(raw);
  }
  return parts.join('\n');
}

/**
 * Normalize for matching: collapse whitespace, lowercase, then remove the two
 * cheapest ways to hide a target from a literal pattern - surrounding quotes
 * and `${VAR}` braces. `rm -rf "$HOME"`, `rm -rf '$HOME'`, `rm -rf ${HOME}`
 * and `rm -rf $HOME` all normalize to the same string.
 *
 * Dropping quotes is safe for matching because no pattern below depends on
 * quoting to identify a target (a quoted `"*.ts"` is still `*.ts`), and it is
 * what a shell does anyway before the command runs.
 */
function normalize(command: string): string {
  return command
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/\$\{([a-z_][a-z0-9_]*)\}/g, '$$$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classify a raw command string. Exposed for direct/unit use.
 */
export function classifyCommand(command: string): DestructiveVerdict {
  if (!command) return NOT_DESTRUCTIVE;
  const normalized = normalize(command);
  if (!normalized) return NOT_DESTRUCTIVE;
  for (const [pattern, reason] of CATASTROPHIC_PATTERNS) {
    if (pattern.test(normalized)) {
      return { destructive: true, reason };
    }
  }
  return NOT_DESTRUCTIVE;
}

/**
 * The guardrail entry point: given an ACP tool call, decide whether it is a
 * catastrophic command that must NOT be silently auto-approved. Only `execute`
 * kind tools carry shell commands; edits/reads/etc. are never flagged here (the
 * edit gate and the auto-approve policy own those).
 */
export function classifyDestructiveToolCall(toolCall: {
  kind?: string;
  title?: string;
  rawInput?: unknown;
}): DestructiveVerdict {
  if (toolCall.kind !== 'execute') return NOT_DESTRUCTIVE;
  return classifyCommand(extractCommandText(toolCall));
}

/**
 * Raw ACP `toolCall.kind` values Autopilot may auto-approve with nobody
 * watching. Matched against the RAW 10-value ACP kind (read/search/edit/
 * delete/move/execute/think/fetch/switch_mode/other), the same vocabulary
 * `trustedWorkspaceAutoApprovesAcpKind` uses in `workspaceTrust.ts`.
 *
 * The set is an ALLOWLIST, not a denylist: a kind Wayland does not recognize
 * (a new ACP kind, a backend-specific value, a missing `kind`) is held for a
 * human rather than waved through. The failure direction is always "prompt
 * more", never "auto-approve".
 *
 * Included, because an unattended run is useless without them:
 * - read / search   -> read-only.
 * - edit            -> in-place file edit; this is the work Autopilot exists
 *                      to do, it is workspace-scoped and version control
 *                      recovers it.
 * - think           -> the agent's own reasoning step, no side effect at all.
 *
 * Excluded, and therefore always surfaced:
 * - delete / move   -> irreversible file operations that carry no command
 *                      string, so the classifier below is structurally blind
 *                      to them. `workspaceTrust.ts` excludes both for the same
 *                      reason.
 * - fetch           -> network egress, the channel data leaves the machine on.
 * - switch_mode     -> a change to the permission regime itself. Auto-approving
 *                      it would let a session widen its own authority and
 *                      defeat every gate downstream of this one.
 * - other           -> unclassified catch-all; unknown by definition.
 * - execute         -> NOT auto-approved on kind. It is the one kind that
 *                      carries a command string, so it goes through
 *                      `classifyCommand` and is approved only when that comes
 *                      back clean.
 */
const AUTOPILOT_AUTO_APPROVE_KINDS: ReadonlySet<string> = new Set(['read', 'search', 'edit', 'think']);

/** Whether Autopilot may auto-approve a tool call, plus why it was held. */
export type AutopilotApproval = {
  autoApprove: boolean;
  /** Short reason, shown on the surfaced confirmation. Empty when auto-approved. */
  reason: string;
};

/**
 * The Autopilot guardrail entry point: decide whether an escalated ACP
 * permission request may be auto-approved in guarded-auto mode.
 *
 * Two gates, in order:
 * 1. The tool kind must be on `AUTOPILOT_AUTO_APPROVE_KINDS`, or be `execute`.
 * 2. An `execute` call must additionally survive `classifyCommand`.
 *
 * Anything else returns `autoApprove: false` and the caller surfaces a real
 * confirmation. Gate 1 is the structural half - it does not depend on parsing
 * an attacker-influenced string - and gate 2 is defence in depth on the one
 * kind that has to be let through to be useful.
 */
export function classifyAutopilotToolCall(toolCall: {
  kind?: string;
  title?: string;
  rawInput?: unknown;
}): AutopilotApproval {
  const kind = typeof toolCall.kind === 'string' ? toolCall.kind : '';
  if (AUTOPILOT_AUTO_APPROVE_KINDS.has(kind)) {
    return { autoApprove: true, reason: '' };
  }
  if (kind !== 'execute') {
    return {
      autoApprove: false,
      reason: kind ? `tool kind '${kind}' is not auto-approved unattended` : 'tool call declared no kind',
    };
  }
  const verdict = classifyCommand(extractCommandText(toolCall));
  return verdict.destructive ? { autoApprove: false, reason: verdict.reason } : { autoApprove: true, reason: '' };
}
