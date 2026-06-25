/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ACP backend / CLI Doctor check.
 *
 * Reports which execution backends (Claude Code, Codex, Gemini, …) the registry
 * actually detected on this machine, and surfaces any errors raised while
 * loading sub-detectors. WARN when no backends are detected (the app can still
 * run via the bundled engine, but every CLI-backed chat would fail) or when a
 * sub-detector reported a load error.
 */

import type { DetectedAgent } from '@/common/types/detectedAgent';
import type { DoctorCheckOutcome } from '../types';

/** The agent-registry surface this check reads. */
export type BackendReader = {
  getDetectedAgents: () => DetectedAgent[];
  getLoadErrors: () => string[];
};

/**
 * Backends / CLIs — at least one execution backend is detected and no
 * sub-detector failed to load. WARN when none are detected, or when a load
 * error occurred (a configured remote backend that failed to read, etc.).
 */
export async function checkBackends(reader: BackendReader): Promise<DoctorCheckOutcome> {
  const agents = reader.getDetectedAgents();
  const loadErrors = reader.getLoadErrors();
  const available = agents.filter((agent) => agent.available);

  if (available.length === 0) {
    return {
      status: 'warn',
      detail: 'No execution backends were detected on this machine.',
      remediation: 'Install a CLI (Claude Code, Codex, or Gemini) on your PATH, or rely on the bundled engine.',
    };
  }

  const names = available.map((agent) => agent.name).join(', ');
  if (loadErrors.length > 0) {
    return {
      status: 'warn',
      detail: `${available.length} backend(s) detected (${names}); ${loadErrors.length} loader error(s): ${loadErrors.join('; ')}.`,
      remediation: 'A configured backend failed to load — check its configuration in Settings → Agents.',
    };
  }
  return { status: 'pass', detail: `${available.length} backend(s) detected: ${names}.` };
}
