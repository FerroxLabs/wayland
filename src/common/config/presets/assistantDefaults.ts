/**
 * Preset assistants are personas, not provider bindings. A preset may carry a
 * user-selected execution engine, but a typeless preset starts on the bundled
 * Wayland Core engine so first use does not depend on a third-party CLI.
 */
export const DEFAULT_PRESET_AGENT_TYPE = 'wcore' as const;

export function resolvePresetAgentType(presetAgentType: string | null | undefined): string {
  const normalized = presetAgentType?.trim();
  return normalized || DEFAULT_PRESET_AGENT_TYPE;
}

/** Preserve an explicit saved choice while applying the current default to new or legacy typeless records. */
export function resolvePersistedPresetAgentType(
  persistedAgentType: string | null | undefined,
  builtinAgentType: string | null | undefined
): string {
  return resolvePresetAgentType(persistedAgentType ?? builtinAgentType);
}
