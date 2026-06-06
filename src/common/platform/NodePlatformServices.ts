import { fork as cpFork, type ChildProcess } from 'child_process';
import { readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import type { IPlatformServices, IWorkerProcess } from './IPlatformServices';

class NodeWorkerProcess implements IWorkerProcess {
  constructor(private readonly cp: ChildProcess) {}

  postMessage(message: unknown): void {
    this.cp.send(message as Parameters<ChildProcess['send']>[0]);
  }

  on(event: string, handler: (...args: unknown[]) => void): this {
    this.cp.on(event, handler as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Send SIGTERM and wait for the child to actually exit (or 2s, then SIGKILL).
   * AUDIT-05 F20 / M18: prevents `bun` children from leaking past Cmd+Q.
   */
  kill(): Promise<void> {
    return new Promise<void>((resolve) => {
      // Already dead - nothing to wait on.
      if (this.cp.exitCode !== null || this.cp.signalCode !== null) {
        resolve();
        return;
      }
      const onExit = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        this.cp.off('exit', onExit);
        try {
          this.cp.kill('SIGKILL');
        } catch {
          // best-effort
        }
        resolve();
      }, 2000);
      this.cp.once('exit', onExit);
      try {
        this.cp.kill();
      } catch {
        // already dead between exitCode check and kill() - exit may or may not fire,
        // so resolve via timer fallback rather than hang.
      }
    });
  }
}

// Read name + version from package.json once at module load.
const _pkg = (() => {
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
      name?: string;
      version?: string;
    };
  } catch {
    return { name: 'wayland', version: '0.0.0' };
  }
})();

export class NodePlatformServices implements IPlatformServices {
  paths = {
    getDataDir: () => process.env.DATA_DIR ?? path.join(os.homedir(), '.wayland-server'),
    getTempDir: () => os.tmpdir(),
    getHomeDir: () => os.homedir(),
    getLogsDir: () => process.env.LOGS_DIR ?? path.join(os.homedir(), '.wayland-server', 'logs'),
    getAppPath: (): string | null => process.cwd(),
    isPackaged: () => process.env.IS_PACKAGED === 'true',
    getSystemPath: (_name: 'desktop' | 'home' | 'downloads'): string | null => null,
    getName: () => _pkg.name ?? 'wayland',
    getVersion: () => _pkg.version ?? '0.0.0',
    needsCliSafeSymlinks: () => false,
  };

  worker = {
    fork: (modulePath: string, args: string[], opts: { cwd?: string; env?: Record<string, string> }): IWorkerProcess =>
      new NodeWorkerProcess(
        cpFork(modulePath, args, {
          cwd: opts.cwd,
          env: opts.env,
          // Enables V8 structured clone (supports Buffer, Map, Set).
          // ArrayBuffer ownership transfer is not supported - acceptable
          // because current IForkData messages contain no Transferables.
          serialization: 'advanced',
        })
      ),
  };

  power = {
    preventSleep: (): number | null => null,
    allowSleep: (_id: number | null): void => {},
    preventDisplaySleep: (): number | null => null,
  };

  notification = {
    send: (_opts: { title: string; body: string; icon?: string }): void => {},
  };

  network = {
    fetch: (input: string | URL | Request, init?: RequestInit): Promise<Response> => fetch(input, init),
  };
}
