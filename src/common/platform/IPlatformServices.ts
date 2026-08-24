// src/common/platform/IPlatformServices.ts

/**
 * Path resolution and app metadata.
 * Replaces all app.getPath() / app.getAppPath() / app.getName() / app.getVersion() calls.
 */
export interface IPlatformPaths {
  /** Persistent user data directory. Equivalent to app.getPath('userData'). */
  getDataDir(): string;
  /** OS temp directory. */
  getTempDir(): string;
  /** User home directory. */
  getHomeDir(): string;
  /**
   * Application log directory.
   * In standalone mode respects LOGS_DIR env var, falls back to <tmpdir>/wayland-logs.
   */
  getLogsDir(): string;
  /**
   * Root path of the application bundle.
   * Returns null in standalone mode (no bundle concept).
   */
  getAppPath(): string | null;
  /**
   * True when running from a packaged Electron build.
   * In standalone mode controlled by IS_PACKAGED env var (default false).
   */
  isPackaged(): boolean;
  /**
   * Well-known system paths (desktop, home, downloads).
   * Returns null in standalone mode.
   */
  getSystemPath(name: 'desktop' | 'home' | 'downloads'): string | null;
  /** Application name used for MCP client identification. */
  getName(): string;
  /** Application version string used for MCP client identification. */
  getVersion(): string;
  /**
   * Whether CLI-safe symlinks should be created in the home directory.
   * True only for Electron on macOS, where userData lives under "Application Support" (contains spaces).
   * False for standalone server mode, where data dir has no spaces.
   */
  needsCliSafeSymlinks(): boolean;
}

/**
 * A running worker child process.
 *
 * Covers the subset of Electron.UtilityProcess / Node.js ChildProcess APIs
 * used by ForkTask. When migrating ForkTask, change fcp field type from
 * UtilityProcess to IWorkerProcess.
 */
export interface IWorkerProcess {
  postMessage(message: unknown): void;
  on(event: string, handler: (...args: unknown[]) => void): this;
  /**
   * Terminate the child process. Resolves only when exit is confirmed; rejects
   * when the platform cannot prove termination within its bounded timeout.
   * AUDIT-05 F20 / M18: callers (ForkTask.kill → WorkerTaskManager.clear) await
   * this so replacement cannot overlap an unconfirmed old worker.
   */
  kill(): Promise<void>;
}

/**
 * Worker process factory.
 * Replaces utilityProcess.fork() in Electron and child_process.fork() in Node.js.
 */
export interface IWorkerProcessFactory {
  fork(modulePath: string, args: string[], options: { cwd?: string; env?: Record<string, string> }): IWorkerProcess;
}

/**
 * System sleep/suspension control. Replaces powerSaveBlocker.
 *
 * Callers MUST guard against null before calling allowSleep:
 *   const id = power.preventSleep()
 *   if (id !== null) power.allowSleep(id)
 */
export interface IPowerManager {
  /** Returns a handle ID, or null if not supported (standalone mode). */
  preventSleep(): number | null;
  /** id may be null (returned by standalone preventSleep); safe no-op in that case. */
  allowSleep(id: number | null): void;
  /**
   * Prevent the display (and system) from sleeping.
   * Uses 'prevent-display-sleep' mode - stronger than preventSleep().
   * Returns a handle ID, or null if not supported.
   */
  preventDisplaySleep(): number | null;
}

/**
 * System notification. Replaces Electron Notification class.
 *
 * In standalone mode: silent no-op (intentional degradation).
 * `failed` and `close` remain Electron-only and are NOT modelled here.
 *
 * `onClick` IS modelled, because a banner announcing a finished deliverable
 * that cannot be clicked through to it is the whole notification wasted. It is
 * best-effort by contract: a runtime with no clickable banner simply never
 * calls it, so no caller may treat it as a delivery guarantee.
 */
export interface INotificationService {
  /** `silent: true` suppresses the OS notification sound; the banner still shows. */
  send(options: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
    /** Invoked if the user activates the banner. Never invoked in standalone mode. */
    onClick?: () => void;
  }): void;
}

/**
 * Network primitives that vary by runtime.
 *
 * Electron should use `net.fetch()` to preserve Chromium networking behavior.
 * Standalone server mode should use the runtime's global `fetch()`.
 */
export interface INetworkService {
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
}

/** Top-level aggregate injected at process startup. */
export interface IPlatformServices {
  paths: IPlatformPaths;
  worker: IWorkerProcessFactory;
  power: IPowerManager;
  notification: INotificationService;
  network: INetworkService;
}
