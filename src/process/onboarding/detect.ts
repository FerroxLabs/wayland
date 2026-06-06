/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * First-run onboarding environment detection (main process).
 *
 * Runs a set of self-contained, never-throwing probes in parallel and reports
 * a renderer-safe `DetectionResult`. Each probe owns its own timeout and
 * degrades to a safe empty/false default on any failure - the orchestrator
 * gates on the slowest probe and never rejects.
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir, userInfo } from 'node:os';
import { join } from 'node:path';

import { agentRegistry } from '@process/agent/AgentRegistry';
import { acpDetector } from '@process/agent/acp/AcpDetector';
import { KeyDiscovery } from '@process/providers/detection/KeyDiscovery';
import { getModelRegistryRepository } from '@process/providers/ipc/modelRegistryIpc';

import type { DetectionResult } from '@/common/types/onboarding';

/** CLI commands the onboarding probe checks for on PATH. */
const ONBOARDING_CLIS = ['codex', 'claude', 'cursor', 'aider'];

/** Per-probe network timeout (ms) for the local daemon probes. */
const PROBE_TIMEOUT_MS = 2000;

/** Timeout (ms) for the macOS `dscl` real-name lookup. */
const REAL_NAME_TIMEOUT_MS = 1000;

/** Flux Desktop daemon base URL (local loopback). */
const FLUX_DAEMON_BASE = 'http://127.0.0.1:7878';

/** Ollama daemon tags endpoint (local loopback). */
const OLLAMA_TAGS_URL = 'http://127.0.0.1:11434/api/tags';

/**
 * Fetch a JSON body with an abort-based timeout. Returns the parsed JSON on a
 * 2xx response, or `null` on any non-ok status, network error, or timeout.
 * Never throws.
 */
async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Probe which onboarding CLIs are available on PATH. Never throws. */
async function probeClis(): Promise<string[]> {
  try {
    const found = await acpDetector.batchCheckCliAvailability(ONBOARDING_CLIS);
    // Preserve a deterministic order matching ONBOARDING_CLIS.
    return ONBOARDING_CLIS.filter((cmd) => found.has(cmd));
  } catch {
    return [];
  }
}

/**
 * Probe the user's installed execution engines via the app's unified
 * `AgentRegistry` - the SAME detection that powers the model picker and finds
 * every backend (Claude Code, Codex, Qwen Code, Kimi CLI, OpenCode, Hermes,
 * OpenClaw Gateway, Gemini CLI, Wayland Core, …). Without this the onboarding
 * reveal silently undersells, showing only a hardcoded handful.
 *
 * The registry is populated at app boot, so this normally just reads its cache.
 * If it has not initialised yet (very early first run) we trigger it - that call
 * is idempotent and self-guarding. Never throws.
 */
async function probeAgents(): Promise<{ id: string; kind: string; name: string }[]> {
  try {
    let agents = agentRegistry.getDetectedAgents();
    if (agents.length === 0) {
      await agentRegistry.initialize();
      agents = agentRegistry.getDetectedAgents();
    }
    return agents.filter((a) => a.available).map((a) => ({ id: a.id, kind: a.kind, name: a.name }));
  } catch {
    return [];
  }
}

/**
 * Probe which provider env keys are present. Returns provider ids only - never
 * key material (KeyDiscovery.scan reports `{ providerId, source }`). Never
 * throws.
 */
async function probeEnvKeys(): Promise<string[]> {
  try {
    const discovered = await new KeyDiscovery().scan();
    return discovered.map((d) => d.providerId);
  } catch {
    return [];
  }
}

/** Local Ollama daemon probe. Never throws. */
async function probeOllama(): Promise<DetectionResult['ollama']> {
  const body = await fetchJsonWithTimeout(OLLAMA_TAGS_URL, PROBE_TIMEOUT_MS);
  if (!body || typeof body !== 'object') return { running: false, models: [] };
  const models = (body as { models?: unknown }).models;
  if (!Array.isArray(models)) return { running: true, models: [] };
  const names = models
    .map((m) => (m && typeof m === 'object' ? (m as { name?: unknown }).name : undefined))
    .filter((n): n is string => typeof n === 'string' && n.length > 0);
  return { running: true, models: names };
}

/**
 * Flux Desktop daemon probe. The daemon is considered running if its
 * `socket-token` file exists OR its version endpoint responds. Never throws.
 */
async function probeFluxDesktop(): Promise<DetectionResult['fluxDesktop']> {
  const tokenExists = (() => {
    try {
      return existsSync(join(homedir(), '.flux', 'socket-token'));
    } catch {
      return false;
    }
  })();

  const body = await fetchJsonWithTimeout(`${FLUX_DAEMON_BASE}/api/version`, PROBE_TIMEOUT_MS);
  const version =
    body && typeof body === 'object' && typeof (body as { version?: unknown }).version === 'string'
      ? (body as { version: string }).version
      : undefined;

  const running = tokenExists || body !== null;
  if (!running) return { running: false };
  return version ? { running, version } : { running };
}

/**
 * Claude Pro probe: `~/.claude` exists AND `claude` is on PATH. Presence-only;
 * no raw key is read. Never throws.
 */
function probeClaudePro(clis: string[]): boolean {
  try {
    return existsSync(join(homedir(), '.claude')) && clis.includes('claude');
  } catch {
    return false;
  }
}

/**
 * Parse a `RealName` value out of `dscl . -read /Users/<user> RealName` output.
 *
 * `dscl` prints either:
 *   `RealName: Jane Doe`
 * or, for multi-word values, a two-line form:
 *   `RealName:`
 *   ` Jane Doe`
 *
 * Returns the trimmed name, or `null` when no usable name is present. Pure.
 */
export function parseRealName(stdout: string): string | null {
  const marker = 'RealName:';
  const idx = stdout.indexOf(marker);
  if (idx === -1) return null;
  const after = stdout.slice(idx + marker.length);
  // First non-empty line after the marker: same-line value, else the
  // continuation line `dscl` prints for multi-word names.
  for (const line of after.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return null;
}

/** Resolve the macOS RealName for a user via `dscl`. Never throws. */
function dsclRealName(username: string): Promise<string | null> {
  return new Promise((resolve) => {
    // `username` is interpolated into the `/Users/<username>` path argument.
    // execFile (no shell) already blocks shell injection; this guard blocks a
    // crafted account name from path-traversing the dscl read (e.g. `../..`).
    if (!/^[A-Za-z0-9._-]+$/.test(username)) {
      resolve(null);
      return;
    }
    try {
      const child = execFile(
        'dscl',
        ['.', '-read', `/Users/${username}`, 'RealName'],
        { timeout: REAL_NAME_TIMEOUT_MS },
        (err, stdout) => {
          if (err || typeof stdout !== 'string') {
            resolve(null);
            return;
          }
          resolve(parseRealName(stdout));
        }
      );
      child.on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

/**
 * Resolve a display name: OS account name, upgraded to the macOS RealName when
 * available. Falls back to the username on any error/timeout. Never throws.
 */
async function probeName(): Promise<string> {
  let username = '';
  try {
    username = userInfo().username.trim();
  } catch {
    username = '';
  }

  if (process.platform !== 'darwin' || username.length === 0) {
    return username;
  }

  const realName = await dsclRealName(username);
  return realName ?? username;
}

/**
 * Whether `flux-router` is already a connected provider in the registry.
 *
 * Reads the model-registry repository directly. The repository is `null` until
 * the registry IPC has initialised, and the whole call is guarded so an
 * uninitialised registry degrades to `false` rather than throwing. Never throws.
 */
function probeFluxConnected(): boolean {
  try {
    const repo = getModelRegistryRepository();
    if (!repo) return false;
    const provider = repo.getRegistryProvider('flux-router');
    return provider?.state === 'connected';
  } catch {
    return false;
  }
}

/**
 * Run the onboarding detection probes in parallel and assemble the result.
 *
 * Every probe is self-contained and never throws, so `Promise.all` here only
 * gates on the slowest probe - the orchestrator itself never rejects.
 */
export async function runOnboardingDetection(): Promise<DetectionResult> {
  const [name, clis, agents, envKeys, ollama, fluxDesktop] = await Promise.all([
    probeName(),
    probeClis(),
    probeAgents(),
    probeEnvKeys(),
    probeOllama(),
    probeFluxDesktop(),
  ]);

  return {
    name,
    clis,
    agents,
    envKeys,
    claudePro: probeClaudePro(clis),
    ollama,
    fluxDesktop,
    fluxConnected: probeFluxConnected(),
  };
}

/**
 * Fetch the Flux Desktop daemon routing metrics. Returns the parsed JSON when
 * the daemon responds 2xx, or `null` on any failure. Never fabricates stats.
 */
export async function fetchFluxMetrics(): Promise<unknown | null> {
  return fetchJsonWithTimeout(`${FLUX_DAEMON_BASE}/api/metrics`, PROBE_TIMEOUT_MS);
}
