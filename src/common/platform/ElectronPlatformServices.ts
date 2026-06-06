// This is the only file in src/common/platform/ permitted to import from 'electron'.
import { app, net, Notification, powerSaveBlocker, utilityProcess, type UtilityProcess } from 'electron';
import path from 'path';
import type { IPlatformServices, IWorkerProcess } from './IPlatformServices';

class ElectronWorkerProcess implements IWorkerProcess {
  constructor(private readonly up: UtilityProcess) {}

  postMessage(message: unknown): void {
    this.up.postMessage(message);
  }

  on(event: string, handler: (...args: unknown[]) => void): this {
    this.up.on(event as Parameters<UtilityProcess['on']>[0], handler as never);
    return this;
  }

  /**
   * Send SIGTERM and wait for the UtilityProcess to actually exit.
   * AUDIT-05 F20 / M18: before-quit cleanup must not return before the child dies.
   * UtilityProcess has no SIGKILL escalation API - the 2s timer resolves anyway
   * so quitting Wayland never hangs on a stuck worker.
   */
  kill(): Promise<void> {
    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(finish, 2000);
      // UtilityProcess extends EventEmitter; 'exit' fires with the exit code.
      this.up.once('exit' as Parameters<UtilityProcess['on']>[0], finish as never);
      try {
        this.up.kill();
      } catch {
        // best-effort; rely on timer fallback to resolve
      }
    });
  }
}

export class ElectronPlatformServices implements IPlatformServices {
  paths = {
    getDataDir: () => app.getPath('userData'),
    getTempDir: () => app.getPath('temp'),
    getHomeDir: () => app.getPath('home'),
    getLogsDir: () => {
      try {
        return app.getPath('logs');
      } catch {
        return path.join(app.getPath('userData'), 'logs');
      }
    },
    getAppPath: () => app.getAppPath(),
    isPackaged: () => app.isPackaged,
    getSystemPath: (name: 'desktop' | 'home' | 'downloads') => app.getPath(name),
    getName: () => app.getName(),
    getVersion: () => app.getVersion(),
    needsCliSafeSymlinks: () => process.platform === 'darwin',
  };

  worker = {
    fork: (modulePath: string, args: string[], opts: { cwd?: string; env?: Record<string, string> }): IWorkerProcess =>
      new ElectronWorkerProcess(
        utilityProcess.fork(modulePath, args, {
          cwd: opts.cwd,
          // Propagate DATA_DIR so utility processes can use NodePlatformServices
          // without needing access to app.getPath (unavailable in utility process).
          env: { DATA_DIR: app.getPath('userData'), ...opts.env },
        })
      ),
  };

  power = {
    preventSleep: (): number | null => powerSaveBlocker.start('prevent-app-suspension'),
    allowSleep: (id: number | null): void => {
      if (id !== null) powerSaveBlocker.stop(id);
    },
    preventDisplaySleep: (): number | null => powerSaveBlocker.start('prevent-display-sleep'),
  };

  notification = {
    send: ({ title, body }: { title: string; body: string; icon?: string }): void => {
      new Notification({ title, body }).show();
    },
  };

  network = {
    fetch: (input: string | URL | Request, init?: RequestInit): Promise<Response> =>
      net.fetch(input instanceof URL ? input.toString() : input, init),
  };
}
