/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import type { FluxDesktopState, FluxManagedTool } from '@/process/flux/fluxDesktopTypes';

const DEFAULT_PORT = 7878;
const PROBE_TIMEOUT_MS = 250;

type FluxKeyPredicate = () => boolean;

export type FluxDesktopServiceOptions = {
  fetchImpl?: typeof fetch;
  fluxDir?: string;
  port?: number;
  hasFluxKey?: FluxKeyPredicate;
};

type StatusResponse = {
  api_key_configured?: boolean;
  upstream_base?: string;
};

type VersionResponse = {
  daemon_version?: string;
};

type ToolReceipt = {
  managed_hash?: string;
  config_path?: string;
};

type ToolResponseEntry = {
  id?: string;
  status?: string;
  receipt?: ToolReceipt;
};

type ManifestResponse = {
  default_tier?: string | null;
};

export class FluxDesktopService {
  private readonly fetchImpl: typeof fetch;
  private readonly fluxDir: string;
  private readonly port: number;
  private readonly hasFluxKey: FluxKeyPredicate;

  constructor(options: FluxDesktopServiceOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.fluxDir = options.fluxDir ?? path.join(os.homedir(), '.flux');
    this.port = options.port ?? DEFAULT_PORT;
    this.hasFluxKey = options.hasFluxKey ?? (() => this.defaultHasFluxKey());
  }

  async detect(): Promise<FluxDesktopState> {
    const version = await this.probeVersion();
    if (version !== null) {
      const [status, tools, defaultTier] = await Promise.all([
        this.fetchStatus(),
        this.fetchTools(),
        this.readDefaultTier(),
      ]);
      return {
        kind: 'DAEMON_RUNNING',
        daemonVersion: version.daemon_version ?? '',
        upstreamBase: status?.upstream_base ?? '',
        apiKeyConfigured: status?.api_key_configured ?? false,
        defaultTier,
        tools,
      };
    }

    if (existsSync(path.join(this.fluxDir, 'manifest.json'))) {
      return { kind: 'INSTALLED_NOT_RUNNING' };
    }

    if (this.safeHasFluxKey()) {
      return { kind: 'KEY_ONLY' };
    }

    return { kind: 'NONE' };
  }

  start(onState: (s: FluxDesktopState) => void, intervalMs = 30000): () => void {
    let previous: FluxDesktopState | null = null;

    const tick = async (): Promise<void> => {
      const next = await this.detect();
      if (previous === null || !statesEqual(previous, next)) {
        previous = next;
        onState(next);
      }
    };

    void tick();
    const handle = setInterval(() => void tick(), intervalMs);
    return () => clearInterval(handle);
  }

  private baseUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  private async probeVersion(): Promise<VersionResponse | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await this.fetchImpl(`${this.baseUrl()}/api/version`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        return null;
      }
      return (await res.json()) as VersionResponse;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private async fetchStatus(): Promise<StatusResponse | null> {
    try {
      const res = await this.fetchImpl(`${this.baseUrl()}/api/status`);
      if (!res.ok) {
        return null;
      }
      return (await res.json()) as StatusResponse;
    } catch {
      return null;
    }
  }

  private async fetchTools(): Promise<FluxManagedTool[]> {
    try {
      const token = await this.readSocketToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await this.fetchImpl(`${this.baseUrl()}/api/tools`, { headers });
      if (!res.ok) {
        return [];
      }
      const payload = (await res.json()) as ToolResponseEntry[];
      if (!Array.isArray(payload)) {
        return [];
      }
      return payload.map((entry) => ({
        id: entry.id ?? '',
        status: entry.status ?? '',
        configPath: entry.receipt?.config_path ?? '',
        managedHash: entry.receipt?.managed_hash ?? '',
      }));
    } catch {
      return [];
    }
  }

  private async readDefaultTier(): Promise<string | null> {
    try {
      const raw = await readFile(path.join(this.fluxDir, 'manifest.json'), 'utf8');
      const manifest = JSON.parse(raw) as ManifestResponse;
      return manifest.default_tier ?? null;
    } catch {
      return null;
    }
  }

  private async readSocketToken(): Promise<string | null> {
    try {
      const raw = await readFile(path.join(this.fluxDir, 'socket-token'), 'utf8');
      return raw.trim() || null;
    } catch {
      return null;
    }
  }

  private safeHasFluxKey(): boolean {
    try {
      return this.hasFluxKey();
    } catch {
      return false;
    }
  }

  private defaultHasFluxKey(): boolean {
    if (existsSync(path.join(this.fluxDir, 'socket-token'))) {
      return true;
    }
    const envKey = process.env.FLUX_API_KEY ?? process.env.FLUX_KEY ?? '';
    return envKey.startsWith('sk-flux-');
  }
}

function statesEqual(a: FluxDesktopState, b: FluxDesktopState): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'DAEMON_RUNNING' && b.kind === 'DAEMON_RUNNING') {
    return serializeTools(a.tools) === serializeTools(b.tools);
  }
  return true;
}

function serializeTools(tools: FluxManagedTool[]): string {
  return tools.map((t) => `${t.id}:${t.status}:${t.managedHash}`).join('|');
}
