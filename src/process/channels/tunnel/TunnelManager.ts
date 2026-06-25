/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TunnelManager - spawn a tunnel CLI and expose a local webhook port at a
 * public URL.
 *
 * Ported from OpenClaw's `tunnel.ts`, with cloudflared as the default provider
 * (quick tunnels do not expire on a timer, which suits an always-on desktop).
 *
 * SECURITY: starting a tunnel spawns a child process AND opens a public ingress
 * forwarding to a loopback port. Callers MUST gate this behind an explicit
 * opt-in flag (default OFF), and the channel behind the port MUST keep
 * verifying its provider signature - the tunnel authenticates nothing.
 *
 * Lifecycle: every started child is tracked so a single `stopAllTunnels()` can
 * tear them all down on app shutdown; `startTunnel().stop()` kills an
 * individual child. The child is spawned detached:false so it dies with us if
 * the process group is signalled, and we additionally SIGTERM/SIGKILL it.
 */

import { type ChildProcess, spawn } from 'node:child_process';
import { killChild } from '@process/agent/acp/utils';
import { ensureCloudflaredBinary } from './cloudflaredBinary';
import { parseCloudflaredUrl, parseNgrokJsonLine } from './parseTunnelUrl';
import { DEFAULT_TUNNEL_PROVIDER, type StartTunnelOptions, type TunnelHandle, type TunnelProvider } from './types';

const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;

/** Children we have spawned, so app shutdown can reap them all. */
const liveChildren = new Set<ChildProcess>();

/**
 * Start a tunnel that forwards public traffic to `127.0.0.1:<port>` and
 * resolve once the public URL is known.
 */
export async function startTunnel(options: StartTunnelOptions): Promise<TunnelHandle> {
  const provider = options.provider ?? DEFAULT_TUNNEL_PROVIDER;
  const timeoutMs = options.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS;
  switch (provider) {
    case 'cloudflared':
      return startCloudflared(options.port, timeoutMs);
    case 'ngrok':
      return startNgrok(options.port, timeoutMs, options.ngrokAuthToken);
    case 'tailscale':
      return startTailscale(options.port, timeoutMs);
    default: {
      const exhaustive: never = provider;
      throw new Error(`[tunnel] unsupported provider: ${String(exhaustive)}`);
    }
  }
}

/** Tear down every tunnel we have started. Call on app shutdown. */
export async function stopAllTunnels(): Promise<void> {
  const children = Array.from(liveChildren);
  await Promise.all(children.map((child) => reapChild(child)));
}

/**
 * Spawn cloudflared as a quick tunnel and parse the trycloudflare.com URL out
 * of its output. No account or token is required.
 */
async function startCloudflared(port: number, timeoutMs: number): Promise<TunnelHandle> {
  const bin = await ensureCloudflaredBinary();
  const args = ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${port}`];
  return spawnAndParse({
    provider: 'cloudflared',
    command: bin,
    args,
    timeoutMs,
    // cloudflared prints the banner (and thus the URL) to stderr.
    parse: parseCloudflaredUrl,
    streams: ['stderr', 'stdout'],
  });
}

/**
 * Spawn ngrok in JSON-log mode and parse the public URL from its log stream.
 * Requires the ngrok CLI on PATH (no auto-download for ngrok).
 */
async function startNgrok(port: number, timeoutMs: number, authToken?: string): Promise<TunnelHandle> {
  if (authToken) {
    await runOnce('ngrok', ['config', 'add-authtoken', authToken]);
  }
  const args = ['http', String(port), '--log', 'stdout', '--log-format', 'json'];
  return spawnAndParse({
    provider: 'ngrok',
    command: 'ngrok',
    args,
    timeoutMs,
    // ngrok JSON logs go to stdout; parse line by line.
    parse: (chunk) => {
      for (const line of chunk.split('\n')) {
        const url = parseNgrokJsonLine(line);
        if (url) return url;
      }
      return null;
    },
    streams: ['stdout', 'stderr'],
  });
}

/**
 * Spawn `tailscale funnel` in the background. tailscale does not stream a URL,
 * so we resolve the funnel hostname from `tailscale status --json` after the
 * funnel command returns success.
 */
async function startTailscale(port: number, timeoutMs: number): Promise<TunnelHandle> {
  await runOnce('tailscale', ['funnel', '--bg', String(port)], timeoutMs);
  const dnsName = await getTailscaleDnsName();
  if (!dnsName) {
    throw new Error('[tunnel] tailscale funnel started but no MagicDNS name is available');
  }
  return {
    publicUrl: `https://${dnsName}`,
    provider: 'tailscale',
    stop: async () => {
      await runOnce('tailscale', ['funnel', '--bg', String(port), 'off']).catch((): void => undefined);
    },
  };
}

type SpawnAndParseArgs = {
  provider: TunnelProvider;
  command: string;
  args: string[];
  timeoutMs: number;
  parse: (chunk: string) => string | null;
  /** Which child streams to scan for the URL, in priority order. */
  streams: Array<'stdout' | 'stderr'>;
};

/**
 * Shared spawn + URL-parse loop for stream-based providers (cloudflared, ngrok).
 * Resolves on first parsed URL; rejects on timeout, spawn error, or early exit.
 */
function spawnAndParse(opts: SpawnAndParseArgs): Promise<TunnelHandle> {
  return new Promise<TunnelHandle>((resolve, reject) => {
    let child: ChildProcess;
    try {
      child = spawn(opts.command, opts.args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      reject(new Error(`[tunnel] failed to spawn ${opts.provider}: ${errMsg(err)}`));
      return;
    }
    liveChildren.add(child);

    let settled = false;
    const buffers: Record<'stdout' | 'stderr', string> = { stdout: '', stderr: '' };

    const finishOk = (url: string): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        provider: opts.provider,
        publicUrl: url,
        stop: async () => {
          await reapChild(child);
        },
      });
    };

    const finishErr = (message: string): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void reapChild(child);
      reject(new Error(message));
    };

    const timer = setTimeout(() => {
      finishErr(`[tunnel] ${opts.provider} did not produce a public URL within ${opts.timeoutMs}ms`);
    }, opts.timeoutMs);
    // Do not keep the event loop alive solely for this timer.
    if (typeof timer.unref === 'function') timer.unref();

    const onChunk = (which: 'stdout' | 'stderr') => (data: Buffer) => {
      buffers[which] += data.toString();
      for (const stream of opts.streams) {
        const url = opts.parse(buffers[stream]);
        if (url) {
          finishOk(url);
          return;
        }
      }
    };

    child.stdout?.on('data', onChunk('stdout'));
    child.stderr?.on('data', onChunk('stderr'));
    child.on('error', (err) => finishErr(`[tunnel] ${opts.provider} spawn error: ${errMsg(err)}`));
    child.on('close', (code) => {
      liveChildren.delete(child);
      finishErr(`[tunnel] ${opts.provider} exited before producing a URL (code ${String(code)})`);
    });
  });
}

/**
 * Kill a tracked tunnel child cross-platform and untrack it.
 *
 * Delegates to the shared {@link killChild} helper so Windows gets a `taskkill
 * /T /F` tree kill and POSIX gets a descendant sweep (SIGTERM → SIGKILL) - a
 * bare `child.kill()` orphans cloudflared/ngrok grandchildren. Children are
 * spawned non-detached, so `isDetached` is false. The shared helper does not
 * manage our `liveChildren` set, so we untrack here.
 */
async function reapChild(child: ChildProcess): Promise<void> {
  try {
    await killChild(child, false);
  } finally {
    liveChildren.delete(child);
  }
}

/** Run a short-lived command to completion; reject on non-zero exit. */
function runOnce(command: string, args: string[], timeoutMs = 10_000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let child: ChildProcess;
    try {
      child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      reject(new Error(`[tunnel] failed to spawn ${command}: ${errMsg(err)}`));
      return;
    }
    let stderr = '';
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString();
    });
    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        /* noop */
      }
      reject(new Error(`[tunnel] ${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    if (typeof timer.unref === 'function') timer.unref();
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`[tunnel] ${command} error: ${errMsg(err)}`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`[tunnel] ${command} exited ${String(code)}: ${stderr.trim()}`));
    });
  });
}

/** Resolve the tailnet MagicDNS name from `tailscale status --json`. */
async function getTailscaleDnsName(): Promise<string | null> {
  const json = await captureStdout('tailscale', ['status', '--json']).catch((): null => null);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as { Self?: { DNSName?: unknown } };
    const dns = parsed.Self?.DNSName;
    if (typeof dns === 'string' && dns.length > 0) {
      return dns.replace(/\.$/, '');
    }
  } catch {
    return null;
  }
  return null;
}

/** Run a command and capture its stdout. */
function captureStdout(command: string, args: string[], timeoutMs = 10_000): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let child: ChildProcess;
    try {
      child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      reject(new Error(errMsg(err)));
      return;
    }
    let stdout = '';
    child.stdout?.on('data', (d: Buffer) => {
      stdout += d.toString();
    });
    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        /* noop */
      }
      reject(new Error(`${command} timed out`));
    }, timeoutMs);
    if (typeof timer.unref === 'function') timer.unref();
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(errMsg(err)));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command} exited ${String(code)}`));
    });
  });
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
