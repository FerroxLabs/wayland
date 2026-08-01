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
   * UtilityProcess has no SIGKILL escalation API. A timeout therefore rejects;
   * callers that require replacement must not overlap a successor with a child
   * whose exit was never confirmed.
   */
  kill(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve();
      };
      const timer = setTimeout(
        () => finish(new Error('Electron utility worker did not confirm exit within 2000ms')),
        2000
      );
      // UtilityProcess extends EventEmitter; 'exit' fires with the exit code.
      this.up.once('exit' as Parameters<UtilityProcess['on']>[0], (() => finish()) as never);
      try {
        if (this.up.kill() === false) finish(new Error('Electron utility worker refused termination'));
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
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
          //
          // #706: also propagate IS_PACKAGED. Utility processes fall back to
          // NodePlatformServices, whose isPackaged() reads this env var. Without
          // it, a forked worker in a PACKAGED build reports isPackaged=false and
          // resolveJsRuntime() would pick the app binary as Node — but the
          // RunAsNode fuse is blown for the whole binary, so that crash-loops.
          // (The main/browser process is unaffected: it uses app.isPackaged.)
          env: { DATA_DIR: app.getPath('userData'), IS_PACKAGED: String(app.isPackaged), ...opts.env },
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
    // `icon` was accepted and then dropped on the floor: notificationBridge resolves
    // an app-icon path and passed it in, but it never reached the Notification.
    send: ({ title, body, icon, silent }: { title: string; body: string; icon?: string; silent?: boolean }): void => {
      new Notification({ title, body, icon, silent }).show();
    },
  };

  network = {
    fetch: (input: string | URL | Request, init?: RequestInit): Promise<Response> =>
      net.fetch(input instanceof URL ? input.toString() : input, init),
  };
}
