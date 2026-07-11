// src/process/acp/errors/setupFailure.ts

// Setup-failure detection for ACP backends that are installed but missing a
// runtime extra they need to run inside Wayland (canonical case: Hermes
// installed, but `hermes acp` lacks the `acp` / agent-client-protocol Python
// extra). Used by the session lifecycle to rewrite the terminal startup error
// into actionable install guidance instead of a bare "Connection error".
// Distinct from an AUTH failure: here a dependency is simply absent.

// Failure-only signatures. These MUST NOT appear in a healthy startup log: the
// normal hermes boot prints "Starting hermes-agent ACP adapter", so matching on
// "acp adapter" would false-positive. Match only phrases that occur exclusively
// on the missing-dependency exit.
const SETUP_FAILURE_SIGNATURES = [
  'acp dependencies not installed',
  "pip install -e '.[acp]'",
  'pip install -e ".[acp]"',
  "no module named 'acp'",
  'no module named "acp"',
] as const;

const BACKEND_LABELS: Record<string, string> = { hermes: 'Hermes' };

// Correct end-user install command per backend. The raw stderr hint
// (`pip install -e '.[acp]'`) is a dev-install form that fails for a normal
// pipx/global install, so supply the command that actually works. Adding a new
// backend = adding its curated install command here.
const SETUP_INSTALL_CMDS: Record<string, string> = {
  hermes: 'pipx inject hermes-agent agent-client-protocol',
};

export function looksLikeSetupFailure(errorMsg: string): boolean {
  const haystack = errorMsg.toLowerCase();
  return SETUP_FAILURE_SIGNATURES.some((s) => haystack.includes(s));
}

export function acpBackendLabel(backend: string): string {
  return BACKEND_LABELS[backend] ?? backend.charAt(0).toUpperCase() + backend.slice(1);
}

function extractStderrInstallCmd(errorMsg: string): string | undefined {
  const match = errorMsg.match(/install (?:them|it) with:\s*(.+)/i);
  return match?.[1]?.trim().replace(/[.\s]+$/, '') || undefined;
}

export function getAcpSetupInstallCmd(backend: string, errorMsg = ''): string | undefined {
  return SETUP_INSTALL_CMDS[backend] ?? extractStderrInstallCmd(errorMsg);
}

export function buildAcpSetupGuidance(backend: string, errorMsg: string): string | null {
  if (!looksLikeSetupFailure(errorMsg)) return null;
  const installCmd = getAcpSetupInstallCmd(backend, errorMsg);
  if (!installCmd) return null;
  const label = acpBackendLabel(backend);
  return (
    `${label} is installed, but it's missing the ACP adapter it needs to run inside Wayland. ` +
    `Install it, then send your message again:\n\n${installCmd}`
  );
}

// Corrupt/partial bunx adapter install (#676). A Node ACP adapter spawned via
// bunx (e.g. @agentclientprotocol/claude-agent-acp) can be left half-installed —
// a dependency's package.json / entry point missing — so module resolution fails
// at startup with a cryptic "Cannot find module 'zod/v4'" the user can't act on.
// The desktop already auto-clears the corrupt bunx cache and retries
// (ProcessAcpClient.clearBunxCacheIfNeeded); this only rewrites the TERMINAL
// message shown after retries are exhausted into actionable guidance. Distinct
// from the missing-python-extra case above (a pip "No module named 'acp'"
// signature), so that case is excluded to avoid a double-match.
const ADAPTER_CORRUPTION_SIGNATURES = ['cannot find module', 'cannot find package', 'err_module_not_found'] as const;

export function looksLikeAdapterCorruption(errorMsg: string): boolean {
  if (looksLikeSetupFailure(errorMsg)) return false;
  const haystack = errorMsg.toLowerCase();
  const isModuleResolutionFailure = ADAPTER_CORRUPTION_SIGNATURES.some((s) => haystack.includes(s));
  if (!isModuleResolutionFailure) return false;
  // Anchor to an adapter-startup failure: the bunx working-dir path, or the
  // "exited before initialize completed" prefix a startup crash carries. Keeps a
  // mid-turn tool error that merely mentions a module name from matching.
  return haystack.includes('bunx-') || haystack.includes('before initialize completed');
}

export function buildAcpAdapterCorruptionGuidance(backend: string, errorMsg: string): string | null {
  if (!looksLikeAdapterCorruption(errorMsg)) return null;
  const label = acpBackendLabel(backend);
  return (
    `${label}'s adapter files look corrupted — a dependency didn't finish installing, so it ` +
    `couldn't start. Wayland cleared the bad install and will reinstall it on the next attempt. ` +
    `If this keeps happening, fully quit and reopen Wayland to force a clean reinstall.`
  );
}
