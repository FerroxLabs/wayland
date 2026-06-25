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
 * Patterns for effectively-irreversible system/account destruction or remote
 * code execution. Each entry is [regex, reason]. Kept conservative on purpose.
 * Regexes run against a whitespace-normalized, lowercased command string.
 */
const CATASTROPHIC_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  // rm whose FIRST argument (right after the flags) is root, root-glob, or home.
  // Anchoring the target to the post-flag position is what distinguishes the
  // catastrophic `rm -rf /` / `rm -rf ~` from the everyday `rm -rf ./build`,
  // `rm -rf dist/`, `rm -rf node_modules` - the latter's target starts with a
  // name or `.`, never with `/`, `~`, or `$HOME`.
  [/\brm\s+(?:-\S+\s+)*(?:\/(?:\s|$|\*)|~\/?(?:\s|$)|\$home\/?(?:\s|$))/, 'recursive delete of root or home'],
  // rm of a whole system top-level directory (rm -rf /etc, /usr, ...). A deeper
  // targeted path under them (/var/log/app) is NOT flagged.
  [/\brm\s+(?:-\S+\s+)*\/(?:usr|etc|bin|sbin|lib|lib64|boot|sys|proc|dev|var|home|root|opt)(?:\/\s|\/$|\s|$)/, 'delete of a system directory'],
  // rm with --no-preserve-root is never legitimate from an agent
  [/\brm\s+.*--no-preserve-root/, 'rm with --no-preserve-root'],
  // Disk/device writes and filesystem creation
  [/\bdd\b[^|&;]*\bof=\/dev\//, 'raw write to a block device'],
  [/\bmkfs(\.[a-z0-9]+)?\b/, 'filesystem format (mkfs)'],
  [/>\s*\/dev\/(sd[a-z]|nvme\d|disk\d|hd[a-z])/, 'overwrite of a raw disk device'],
  // Fork bomb
  [/:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, 'fork bomb'],
  // chmod/chown -R on root or home
  [/\bch(mod|own)\s+(-[a-z]*\s+)*-?[a-z]*r[a-z]*\s+[^|&;]*(\s\/(\s|$)|\s~(\/|\s|$)|\$home)/, 'recursive permission/owner change on root or home'],
  // Network pull piped straight into a shell (curl|sh, wget|bash, ...)
  [/\b(curl|wget|fetch)\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh|dash|ksh)\b/, 'pipe of downloaded content into a shell'],
  // Overwriting core system files
  [/>\s*\/(etc|boot|sys)\//, 'overwrite of a system file'],
  // find / -delete (mass delete from root)
  [/\bfind\s+\/\s+[^|&;]*-delete\b/, 'find / -delete (mass delete)'],
  // Mass-destructive git on the whole tree is NOT included (recoverable / scoped).
];

/**
 * Extract the shell command string from an ACP tool call. Execute-kind tools
 * carry the command on `rawInput` (commonly `.command`, sometimes `.cmd`/`.script`),
 * and the human title often mirrors it. We coalesce the candidates so the
 * classifier sees whatever the agent actually intends to run.
 */
export function extractCommandText(toolCall: {
  kind?: string;
  title?: string;
  rawInput?: unknown;
}): string {
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

/** Normalize for matching: collapse whitespace, lowercase. */
function normalize(command: string): string {
  return command.replace(/\s+/g, ' ').trim().toLowerCase();
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
