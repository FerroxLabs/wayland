/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { autoUpdater } from 'electron-updater';
import type { ProgressInfo, UpdateInfo } from 'electron-updater';
import { app } from 'electron';
import log from 'electron-log';
import { EventEmitter } from 'events';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { writeFileSyncAtomic } from '@process/utils/atomicWrite';
import type { AutoUpdateInstallFailedReason } from '@/common/update/updateTypes';

/**
 * Redact the user's home-directory prefix from a path/string so diagnostic logs
 * carry no PII (`/Users/<name>/...` → `~/...`). Pure + total. (#286)
 */
export function redactHome(value: string, home: string): string {
  if (!value || !home) return value;
  return value.split(home).join('~');
}

/** Decisive ShipItState.plist fields that disambiguate a silent apply failure (#286). */
export type ShipItStateFields = {
  launchAfterInstallation: unknown;
  targetBundleURL: string;
  updateBundleURL: string;
};

/**
 * Injected IO surface for {@link buildShipItDiagnostics}. Every reader is total
 * (returns `[]`/`null` instead of throwing) so the builder stays pure and the
 * never-throws + redaction contract is unit-testable on any platform. (#286)
 */
export type ShipItDiagIO = {
  homedir: string;
  execPath: string;
  isInApplicationsFolder: boolean | null;
  /** List a directory's entries; returns `[]` when absent/unreadable. */
  listDir: (dir: string) => string[];
  /** Read a UTF-8 file; returns `null` when absent/unreadable. */
  readText: (file: string) => string | null;
  /** Parse decisive ShipItState fields; returns `null` when absent/unparseable. */
  readPlistFields: (file: string) => ShipItStateFields | null;
};

/**
 * Build PII-redacted ShipIt diagnostic log lines from injected IO. Pure and total:
 * never throws, performs no real IO (all injected), so the redaction and
 * graceful-absent guarantees are directly verifiable in unit tests on any OS. (#286)
 *
 * Emits, for each `*.ShipIt` dir under `~/Library/Caches`: the tail of
 * `ShipIt_stderr.log` and the decisive `ShipItState.plist` fields — the artifacts
 * that pick codesign/notarization rejection vs App Translocation vs a move error.
 */
export function buildShipItDiagnostics(io: ShipItDiagIO): string[] {
  const lines: string[] = [];
  const redact = (s: string): string => redactHome(s, io.homedir);
  lines.push(`execPath=${redact(io.execPath)} isInApplicationsFolder=${io.isInApplicationsFolder}`);

  const cachesDir = path.join(io.homedir, 'Library', 'Caches');
  const entries = io.listDir(cachesDir).filter((n) => n.endsWith('.ShipIt'));
  if (entries.length === 0) {
    lines.push('no *.ShipIt directory under ~/Library/Caches (no apply artifacts)');
    return lines;
  }

  for (const entry of entries) {
    const dir = path.join(cachesDir, entry);
    const logText = io.readText(path.join(dir, 'ShipIt_stderr.log'));
    if (logText !== null) {
      const tail = logText
        .split(/\r?\n/)
        .filter((l) => l.length > 0)
        .slice(-40)
        .join('\n');
      lines.push(`${entry}/ShipIt_stderr.log (tail):\n${redact(tail)}`);
    } else {
      lines.push(`${entry}/ShipIt_stderr.log absent or unreadable`);
    }

    const fields = io.readPlistFields(path.join(dir, 'ShipItState.plist'));
    if (fields) {
      lines.push(
        `${entry}/ShipItState: launchAfterInstallation=${String(fields.launchAfterInstallation)} ` +
          `targetBundleURL=${redact(fields.targetBundleURL)} updateBundleURL=${redact(fields.updateBundleURL)}`
      );
    } else {
      lines.push(`${entry}/ShipItState.plist absent or unparseable`);
    }
  }
  return lines;
}

/**
 * Returns the appropriate update channel name based on the current platform and architecture.
 * Returns undefined for the default channel (Windows x64 / Linux x64).
 */
export function getUpdateChannel(): string | undefined {
  const { platform, arch } = process;

  // electron-updater appends a platform suffix to the channel name:
  //   macOS  → "-mac"       (e.g. "latest" → "latest-mac.yml")
  //   Linux  → "-linux"     (+ arch suffix for non-x64, e.g. "latest-linux-arm64.yml")
  //   Windows → ""          (no suffix, e.g. "latest.yml")
  //
  // Linux arm64 is handled natively by electron-updater (appends "-linux-arm64"),
  // so only Windows arm64 and macOS arm64 need a custom channel.

  if (platform === 'win32' && arch === 'arm64') {
    // "latest-win-arm64" + "" → "latest-win-arm64.yml"
    return 'latest-win-arm64';
  }
  if (platform === 'darwin' && arch === 'arm64') {
    // "latest-arm64" + "-mac" → "latest-arm64-mac.yml"
    return 'latest-arm64';
  }
  // macOS x64  → default "latest" + "-mac"         → "latest-mac.yml"
  // Linux x64  → default "latest" + "-linux"       → "latest-linux.yml"
  // Linux arm64→ default "latest" + "-linux-arm64"  → "latest-linux-arm64.yml"
  // Win x64    → default "latest" + ""             → "latest.yml"
  return undefined;
}

export interface AutoUpdateStatus {
  status:
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error'
    | 'install-failed'
    | 'deferred'
    | 'cancelled';
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  progress?: {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
  };
  error?: string;
  /** Set when status === 'install-failed'. */
  reason?: AutoUpdateInstallFailedReason;
}

/** Callback type for broadcasting update status */
export type StatusBroadcastCallback = (status: AutoUpdateStatus) => void;

/** Events emitted by AutoUpdaterService */
export interface AutoUpdaterEvents {
  'update-status': (status: AutoUpdateStatus) => void;
}

class AutoUpdaterService extends EventEmitter {
  private _isInitialized = false;
  private _eventHandlersSetup = false;
  private _allowPrerelease = false;
  private _statusBroadcastCallback: StatusBroadcastCallback | null = null;
  /**
   * True only while a download/install is actually running. Used to decide
   * whether an electron-updater `error` event is user-facing: a check-phase
   * error (e.g. "No published versions on GitHub" from the custom per-arch
   * channel, or a transient GitHub fetch failure) is handled by the check
   * result + the manual GitHub fallback and must NOT flash "Update failed".
   */
  private _downloadInProgress = false;
  /** Stores registered autoUpdater event handlers for cleanup and test access */
  private readonly _autoUpdaterHandlers = new Map<string, (...args: unknown[]) => void>();
  /** Version of the most recently downloaded update (captured on 'update-downloaded'). */
  private _lastDownloadedVersion: string | null = null;
  /**
   * Version whose in-place install silently failed on the previous launch
   * (downloaded + attempted but the app version never advanced). Re-offers of
   * this version are surfaced as install-failed instead of a plain offer (#286).
   */
  private _failedInstallVersion: string | null = null;
  /**
   * True once a macOS block or a silent apply-failure has been detected, meaning
   * a staged update is NOT safe to apply on quit (it would loop — #575/#286).
   * {@link installOnQuitIfReady} honours this so the coordinated before-quit
   * install never re-arms the loop. Set by {@link disableInstallOnQuit}.
   */
  private _installOnQuitBlocked = false;

  constructor() {
    super();
    // Configure logging
    autoUpdater.logger = log;
    (autoUpdater.logger as typeof log).transports.file.level = 'info';

    // Disable auto-download for manual control
    autoUpdater.autoDownload = false;
    // Disable electron-updater's OWN install-on-quit. We drive the on-quit
    // install explicitly as the last step of before-quit cleanup (see
    // installOnQuitIfReady + src/index.ts), AFTER in-flight work is drained, so a
    // real quit applies the update in a controlled order instead of an update
    // yanking the rug mid-task (#651/#632). Safety against the #575/#286 loop is
    // preserved by _installOnQuitBlocked, which installOnQuitIfReady checks.
    autoUpdater.autoInstallOnAppQuit = false;

    // Set the correct update channel based on platform and architecture before
    // any update checks are performed
    const channel = getUpdateChannel();
    if (channel !== undefined) {
      autoUpdater.channel = channel;
      log.info(`Update channel set to: ${channel}`);
    }
  }

  /**
   * Initialize the service with an optional status broadcast callback.
   * This decouples the service from any specific window implementation.
   */
  initialize(statusBroadcastCallback?: StatusBroadcastCallback): void {
    this._statusBroadcastCallback = statusBroadcastCallback ?? null;
    this._isInitialized = true;

    // Setup event handlers only once
    if (!this._eventHandlersSetup) {
      this.setupEventHandlers();
      this._eventHandlersSetup = true;
    }
  }

  /**
   * Set the status broadcast callback (can be called after initialize)
   */
  setStatusBroadcastCallback(callback: StatusBroadcastCallback | null): void {
    this._statusBroadcastCallback = callback;
  }

  /**
   * Check if the service has been initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Reset the service state (for production use)
   */
  reset(): void {
    this._isInitialized = false;
    // Note: _eventHandlersSetup is NOT reset to avoid duplicate handler registration
    this._allowPrerelease = false;
    this._statusBroadcastCallback = null;
  }

  /**
   * Reset the service state completely, including event handlers.
   * Use this only in tests where you need to reset handler state.
   */
  resetForTest(): void {
    this._isInitialized = false;
    this._eventHandlersSetup = false;
    this._allowPrerelease = false;
    this._statusBroadcastCallback = null;
    this._lastDownloadedVersion = null;
    this._failedInstallVersion = null;
    this._installOnQuitBlocked = false;
    // Remove listeners from this EventEmitter instance
    this.removeAllListeners();
    // Remove each registered handler from autoUpdater to prevent
    // duplicate handler accumulation across multiple initialize() calls in tests
    for (const [event, handler] of this._autoUpdaterHandlers) {
      autoUpdater.removeListener(
        event as Parameters<typeof autoUpdater.removeListener>[0],
        handler as Parameters<typeof autoUpdater.removeListener>[1]
      );
    }
    this._autoUpdaterHandlers.clear();
  }

  /**
   * Trigger a registered autoUpdater event handler by event name with optional arguments.
   * Intended for use in tests only - do not call in production code.
   * Throws if the handler for the given event has not been registered yet.
   */
  triggerEventForTest(event: string, ...args: unknown[]): void {
    const handler = this._autoUpdaterHandlers.get(event);
    if (!handler) {
      throw new Error(`No handler registered for autoUpdater event "${event}". Did you call initialize() first?`);
    }
    handler(...args);
  }

  /**
   * Set whether to allow prerelease/dev updates
   * When enabled, also sets allowDowngrade to true
   */
  setAllowPrerelease(allow: boolean): void {
    this._allowPrerelease = allow;
    // Do NOT set autoUpdater.allowPrerelease here.
    // electron-updater's prerelease mode conflicts with custom channel names
    // (e.g. 'latest-arm64'): it treats the channel as a prerelease identifier
    // and tries to match it against tag prerelease components, which always fails
    // with "No published versions on GitHub".
    // Prerelease filtering is handled by the manual update check (GitHub API) instead.
    log.info(`Prerelease updates ${allow ? 'enabled' : 'disabled'} (manual check only)`);
  }

  /**
   * Get current prerelease setting
   */
  get allowPrerelease(): boolean {
    return this._allowPrerelease;
  }

  private setupEventHandlers(): void {
    const register = <T extends unknown[]>(event: string, handler: (...args: T) => void) => {
      // Cast to satisfy overloaded autoUpdater.on signature
      autoUpdater.on(event as Parameters<typeof autoUpdater.on>[0], handler as Parameters<typeof autoUpdater.on>[1]);
      this._autoUpdaterHandlers.set(event, handler as (...args: unknown[]) => void);
    };

    register('checking-for-update', () => {
      log.info('Checking for updates...');
      this.broadcastStatus({ status: 'checking' });
    });

    register('update-available', (info: UpdateInfo) => {
      log.info(`Update available: ${info.version}`);

      // macOS can't apply an in-place update when the app runs outside
      // /Applications (App Translocation / quarantined read-only path): ShipIt
      // silently no-ops. Surface guidance instead of offering a doomed install (#286).
      const blockReason = this.macUpdateBlockReason();
      if (blockReason) {
        log.warn(
          `[autoUpdater] Update ${info.version} cannot be applied in place (${blockReason}); surfacing guidance.`
        );
        // Never let checkForUpdatesAndNotify's staged download auto-install on
        // quit when we know the apply can't succeed — that's the #575 loop.
        this.disableInstallOnQuit(`macOS block: ${blockReason}`);
        this.broadcastInstallFailed(blockReason, info.version);
        return;
      }

      // A prior install of this exact version silently failed. Don't re-offer the
      // same doomed update (the loop in #286) — surface the failure + manual path.
      if (this._failedInstallVersion && info.version === this._failedInstallVersion) {
        log.warn(`[autoUpdater] Suppressing re-offer of ${info.version}: prior install silently failed (#286).`);
        this.disableInstallOnQuit(`silent-noop re-offer of ${info.version}`);
        this.broadcastInstallFailed('silent-noop', info.version);
        return;
      }

      this.broadcastStatus({
        status: 'available',
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
      });
    });

    register('update-not-available', () => {
      log.info('Application is up to date');
      this.broadcastStatus({ status: 'not-available' });
    });

    register('download-progress', (progress: ProgressInfo) => {
      log.info(`Download progress: ${progress.percent.toFixed(2)}%`);
      this.broadcastStatus({
        status: 'downloading',
        progress: {
          bytesPerSecond: progress.bytesPerSecond,
          percent: progress.percent,
          transferred: progress.transferred,
          total: progress.total,
        },
      });
    });

    register('update-downloaded', (info: UpdateInfo) => {
      log.info('Update downloaded');
      this._downloadInProgress = false;
      // Remember which version we're about to install so quitAndInstall() can
      // persist a pending-install marker for next-launch verification (#286).
      this._lastDownloadedVersion = info.version;
      this.broadcastStatus({
        status: 'downloaded',
        version: info.version,
      });
    });

    register('error', (error: Error) => {
      log.error('Auto-updater error:', error);
      // A user-facing updater error only makes sense during an actual
      // download/install. Errors during a CHECK (e.g. "No published versions on
      // GitHub" from the custom per-arch channel, GitHub rate-limit, transient
      // feed fetch failures) are already returned by checkForUpdates() and
      // recovered by the manual GitHub leg - broadcasting them as `error` made
      // the update modal flash "Update failed" before the manual leg resolved
      // (it then flipped to "available"). Suppress those; only surface a real
      // download/install failure.
      if (!this._downloadInProgress) {
        log.warn(
          'Auto-updater check-phase error suppressed (handled via check result + manual fallback):',
          error.message
        );
        return;
      }
      this._downloadInProgress = false;
      this.broadcastStatus({
        status: 'error',
        error: error.message,
      });
    });
  }

  /**
   * Broadcast status to both EventEmitter listeners and the registered callback
   */
  private broadcastStatus(status: AutoUpdateStatus): void {
    // Emit to internal listeners (for testing and extensibility)
    this.emit('update-status', status);

    // Call the registered callback if available
    if (this._statusBroadcastCallback) {
      this._statusBroadcastCallback(status);
    }
  }

  async checkForUpdates(): Promise<{ success: boolean; updateInfo?: UpdateInfo; error?: string }> {
    try {
      if (!this._isInitialized) {
        throw new Error('AutoUpdaterService not initialized');
      }

      const result = await autoUpdater.checkForUpdates();
      if (!result) {
        const { default: i18n } = await import('./i18n');
        return { success: false, error: i18n.t('update.errors.checkReturnedNull') };
      }
      // Only report updateInfo when electron-updater internally confirms the update is available.
      // When isUpdateAvailable is false, updateInfoAndProvider is NOT set internally,
      // so a subsequent downloadUpdate() call would fail with "Please check update first".
      if (!result.isUpdateAvailable) {
        return { success: true };
      }
      return {
        success: true,
        updateInfo: result.updateInfo,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error('Check for updates failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  async downloadUpdate(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this._isInitialized) {
        throw new Error('AutoUpdaterService not initialized');
      }

      // TODO(v0.1.3): verify GPG-signed .deb.sig artifact before applying - see docs/SECURITY.md for status.
      this._downloadInProgress = true;
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      this._downloadInProgress = false;
      const message = error instanceof Error ? error.message : String(error);
      log.error('Download update failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  quitAndInstall(): void {
    log.info('Quitting and installing update...');
    // Persist a pending-install marker BEFORE handing off to Squirrel/ShipIt, so
    // the next launch can detect a silent apply failure (downloaded + attempted
    // but the version never advanced) and surface it instead of looping (#286).
    this.writePendingInstallMarker();
    // On macOS, autoUpdater.quitAndInstall() closes all windows but the
    // 'window-all-closed' handler does NOT call app.quit() (standard macOS
    // behavior + close-to-tray). This leaves the process alive and Squirrel
    // cannot finish replacing the app bundle. Force-exit after a short delay
    // to let Squirrel receive the install signal.
    autoUpdater.quitAndInstall(true, true);
    setTimeout(() => {
      app.exit(0);
    }, 1000);
  }

  /**
   * Broadcast a 'deferred' status: an update is downloaded but its restart was
   * held because the app is actively working. The renderer surfaces "Update
   * ready — applies when your tasks finish or on quit" with an override. The
   * quiesce gate calls this when it defers (#651/#632).
   */
  notifyDeferred(): void {
    log.info('[autoUpdater] Update restart deferred while the app is busy.');
    this.broadcastStatus({ status: 'deferred', version: this._lastDownloadedVersion ?? undefined });
  }

  /**
   * Apply a downloaded update NOW, as the last step of before-quit cleanup —
   * after in-flight work is drained (#651/#632). Unlike {@link quitAndInstall}
   * it does NOT schedule an app.exit(0): we are already inside the quit
   * sequence, so forcing an exit would race the very cleanup we waited for.
   *
   * No-op (returns false) unless an update was actually downloaded AND it is
   * safe to apply — a macOS block or a known silent apply-failure keeps
   * _installOnQuitBlocked set so we never hand ShipIt a doomed bundle and
   * re-arm the #575/#286 relaunch loop.
   *
   * @returns true if an install was triggered.
   */
  installOnQuitIfReady(): boolean {
    if (!this._lastDownloadedVersion) {
      return false; // nothing staged to install
    }
    if (this._installOnQuitBlocked) {
      log.warn('[autoUpdater] Skipping on-quit install: update is not safely applicable (#575/#286 guard).');
      return false;
    }
    log.info(`[autoUpdater] Applying staged update ${this._lastDownloadedVersion} on quit (post-cleanup).`);
    // Persist the pending-install marker so the next launch can verify the apply
    // actually advanced the version (#286), same as the manual path.
    this.writePendingInstallMarker();
    // isSilent=true, isForceRunAfter=false: install on quit without relaunching
    // (apply-on-quit semantics, like VS Code/Slack) and without the force-exit
    // timer — the caller is already quitting.
    autoUpdater.quitAndInstall(true, false);
    return true;
  }

  /**
   * Path of the cross-launch pending-install marker under userData.
   */
  private pendingInstallMarkerPath(): string {
    return path.join(app.getPath('userData'), 'pending-update.json');
  }

  /**
   * Record the version we're about to install so the next launch can verify the
   * apply step actually advanced the app version (#286). Best-effort: a failed
   * write just means we lose loop-detection for this one attempt.
   */
  private writePendingInstallMarker(): void {
    if (!this._lastDownloadedVersion) return;
    try {
      writeFileSyncAtomic(
        this.pendingInstallMarkerPath(),
        JSON.stringify({ version: this._lastDownloadedVersion, attemptedAt: Date.now() }),
        { mode: 0o600 }
      );
    } catch (error) {
      log.warn('[autoUpdater] Failed to write pending-update marker:', error);
    }
  }

  /**
   * On the next launch after an install attempt, verify the update actually
   * applied. If the version did not advance, the post-quit Squirrel/ShipIt step
   * silently no-op'd (#286): record the failed version (so the imminent re-offer
   * is surfaced rather than looped), log it for diagnostics, and surface it.
   * The marker is one-shot — always removed after reading.
   *
   * Call once at startup, before the first update check.
   */
  reconcilePendingInstall(): void {
    const markerPath = this.pendingInstallMarkerPath();
    let expected: string | undefined;
    try {
      if (!fs.existsSync(markerPath)) return;
      const parsed = JSON.parse(fs.readFileSync(markerPath, 'utf8')) as { version?: string };
      expected = typeof parsed.version === 'string' ? parsed.version : undefined;
    } catch (error) {
      log.warn('[autoUpdater] Failed to read pending-update marker:', error);
    } finally {
      try {
        fs.rmSync(markerPath, { force: true });
      } catch (error) {
        log.warn('[autoUpdater] Failed to remove pending-update marker:', error);
      }
    }

    if (!expected) return;
    const current = app.getVersion();
    if (expected === current) {
      log.info(`[autoUpdater] Update to ${expected} applied successfully.`);
      return;
    }

    // Downloaded + install attempted, but the version never advanced.
    this._failedInstallVersion = expected;
    // The staged update ShipIt keeps trying to apply is the #575 loop engine.
    // Kill auto-install-on-quit now, at startup, before the next check re-stages —
    // so this quit (and every quit after) stops handing the doomed bundle to ShipIt.
    this.disableInstallOnQuit(`silent apply failure of ${expected}`);
    log.error(
      `[autoUpdater] Update to ${expected} was downloaded and install was attempted, but the app is ` +
        `still on ${current}. The post-quit Squirrel/ShipIt apply step silently failed (#286).`
    );
    // Self-diagnose the silent apply failure: log the decisive ShipIt artifacts so
    // every affected machine captures them locally — no manual per-user log fetch
    // round-trip needed to tell signature-mismatch from translocation (#286).
    this.logShipItDiagnostics();
    // Surface immediately if a renderer is already listening; the update-available
    // interception re-surfaces it once the 3s startup check runs, as a backstop.
    this.broadcastInstallFailed('silent-noop', expected);
  }

  /**
   * Read whether the running app is inside /Applications, or null if the API is
   * unavailable (non-darwin / test) or throws. Never throws. (#286)
   */
  private readIsInApplicationsFolder(): boolean | null {
    try {
      const fn = (app as { isInApplicationsFolder?: () => boolean }).isInApplicationsFolder;
      return typeof fn === 'function' ? fn.call(app) : null;
    } catch {
      return null;
    }
  }

  /**
   * Parse the decisive ShipItState.plist fields via `plutil` (handles binary
   * plists). Best-effort: returns null on any absence/parse/spawn failure. (#286)
   */
  private readShipItStateFields(plistPath: string): ShipItStateFields | null {
    try {
      if (!fs.existsSync(plistPath)) return null;
      const json = execFileSync('plutil', ['-convert', 'json', '-o', '-', plistPath], {
        encoding: 'utf8',
        timeout: 2000,
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const parsed = JSON.parse(json) as Record<string, unknown>;
      return {
        launchAfterInstallation: parsed.launchAfterInstallation,
        targetBundleURL: typeof parsed.targetBundleURL === 'string' ? parsed.targetBundleURL : '',
        updateBundleURL: typeof parsed.updateBundleURL === 'string' ? parsed.updateBundleURL : '',
      };
    } catch {
      return null;
    }
  }

  /**
   * macOS-only, read-only, PII-safe diagnostics for a silent ShipIt apply
   * failure. Wires real fs/plutil into the pure {@link buildShipItDiagnostics}
   * and logs each redacted line. Best-effort — never breaks startup
   * reconciliation, logs no secrets, redacts the home dir to `~`. (#286)
   */
  private logShipItDiagnostics(): void {
    if (process.platform !== 'darwin') return;
    try {
      const io: ShipItDiagIO = {
        homedir: os.homedir(),
        execPath: process.execPath,
        isInApplicationsFolder: this.readIsInApplicationsFolder(),
        listDir: (dir) => {
          try {
            return fs.readdirSync(dir);
          } catch {
            return [];
          }
        },
        readText: (file) => {
          try {
            return fs.readFileSync(file, 'utf8');
          } catch {
            return null;
          }
        },
        readPlistFields: (file) => this.readShipItStateFields(file),
      };
      for (const line of buildShipItDiagnostics(io)) {
        log.info(`[autoUpdater] ShipIt diag — ${line}`);
      }
    } catch (error) {
      // Diagnostics are strictly best-effort; never let them break reconciliation.
      log.warn('[autoUpdater] ShipIt diagnostics failed (ignored):', error);
    }
  }

  /**
   * Returns a block reason when the current process cannot apply an in-place
   * update, else null. macOS only: App Translocation / a quarantined read-only
   * path outside /Applications makes ShipIt silently no-op (#286).
   */
  private macUpdateBlockReason(): AutoUpdateInstallFailedReason | null {
    if (process.platform !== 'darwin') return null;
    try {
      const inApps = (app as { isInApplicationsFolder?: () => boolean }).isInApplicationsFolder;
      if (typeof inApps === 'function' && !inApps.call(app)) {
        return 'not-in-applications';
      }
    } catch (error) {
      log.warn('[autoUpdater] isInApplicationsFolder check failed:', error);
    }
    return null;
  }

  /**
   * Break the #575 respawn loop: when a macOS update block or a silent
   * apply-failure is detected, disable autoInstallOnAppQuit so a bundle ShipIt
   * can't apply in place is NEVER handed to ShipIt on quit. Without this, a
   * staged-but-unappliable update makes every quit relaunch the old version →
   * re-stage → loop (Dock spam + focus theft). Idempotent; the manual-download
   * path (broadcastInstallFailed) still lets the user update deliberately.
   *
   * On the happy path (no block) the update stays installable, so the
   * coordinated before-quit install in {@link installOnQuitIfReady} still runs.
   */
  private disableInstallOnQuit(context: string): void {
    if (!this._installOnQuitBlocked) {
      log.warn(`[autoUpdater] Marking update NOT installable on quit (${context}) to prevent the #575 relaunch loop.`);
    }
    // Mark the staged update unsafe to apply on quit. electron-updater's own
    // autoInstallOnAppQuit already starts false (we drive install explicitly),
    // but keep it pinned false as defense in depth.
    this._installOnQuitBlocked = true;
    autoUpdater.autoInstallOnAppQuit = false;
  }

  /**
   * Broadcast an install-failed status with an actionable, human-readable
   * message. The message is sent in the `error` field (mirroring how raw
   * electron-updater error messages are already surfaced) so no new UI strings
   * are required for this defensive path.
   */
  private broadcastInstallFailed(reason: AutoUpdateInstallFailedReason, version?: string): void {
    const subject = version ? `Wayland ${version}` : 'The update';
    const message =
      reason === 'not-in-applications'
        ? `${subject} can't be installed because Wayland is running from outside your Applications folder ` +
          `(macOS blocks in-place updates from temporary or read-only locations). Move Wayland to ` +
          `/Applications, reopen it, and try again.`
        : `${subject} was downloaded but couldn't be installed automatically (the app is still running the ` +
          `previous version). Please download and install it manually from the Releases page.`;
    this.broadcastStatus({ status: 'install-failed', reason, version, error: message });
  }

  /**
   * Check for updates and notify (for startup)
   */
  async checkForUpdatesAndNotify(): Promise<void> {
    try {
      // Ensure clean state: prevent stale allowDowngrade=true from prior setAllowPrerelease(true) calls
      autoUpdater.allowDowngrade = false;
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      log.error('Auto-update check failed:', error);
    }
  }
}

// Singleton instance
export const autoUpdaterService = new AutoUpdaterService();
