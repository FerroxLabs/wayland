import { getPlatformServices } from '@/common/platform';
import { getDataPath } from '@process/utils';
import { agentRegistry } from '@process/agent/AgentRegistry';
import { isAgentKind } from '@/common/types/detectedAgent';
import { exec } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import {
  EXTENSION_MANIFEST_FILE,
  getHubResourcesDir,
  getInstallTargetDir,
  HUB_REMOTE_URLS,
} from '@process/extensions/constants';
import { ExtensionRegistry } from '@process/extensions/ExtensionRegistry';
import { markExtensionForReinstall } from '@process/extensions/lifecycle/statePersistence';
import { hubIndexManager } from '@process/extensions/hub/HubIndexManager';
import { hubStateManager } from '@process/extensions/hub/HubStateManager';
import { requireConfirmation } from '@process/bridge/webuiDirectAuth';
import type { IHubExtension, HubContributes } from '@/common/types/hub';

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// Post-install verification
// ---------------------------------------------------------------------------

type VerifyResult = { ok: boolean; reason?: string };

/**
 * Per-contributes-type verification functions.
 * Each verifier checks whether the contributed capabilities are actually
 * available after onInstall has completed.
 *
 * Return { ok: true } to pass, or { ok: false, reason } to fail.
 * Types without a verifier are assumed to pass (installed == extracted + loaded).
 */
const contributeVerifiers: Partial<Record<keyof HubContributes, (ids: string[]) => VerifyResult>> = {
  acpAdapters(ids: string[]): VerifyResult {
    const agents = agentRegistry.getDetectedAgents();

    // Build a set of all identifiers that represent a detected adapter:
    // - backend ID for builtin agents (e.g. 'claude', 'qwen')
    // - adapter ID from customAgentId for extension agents (e.g. 'ext:name:adapterId' → 'adapterId')
    const detectedIds = new Set<string>();
    for (const a of agents) {
      if (a.backend !== 'custom') {
        detectedIds.add(a.backend);
      }
      if (isAgentKind(a, 'acp') && a.isExtension && a.customAgentId) {
        const adapterId = a.customAgentId.split(':').pop();
        if (adapterId) detectedIds.add(adapterId);
      }
    }

    const missing = ids.filter((id) => !detectedIds.has(id));
    if (missing.length > 0) {
      return {
        ok: false,
        reason: `ACP adapters not detected after install: [${missing.join(', ')}]. The onInstall hook may have failed to install the required CLI.`,
      };
    }
    return { ok: true };
  },
};

/**
 * Verify that all contributed capabilities declared by an extension
 * are actually available after installation.
 */
function verifyInstallation(extInfo: IHubExtension): VerifyResult {
  const contributes = extInfo.contributes;
  if (!contributes) return { ok: true };

  for (const [key, ids] of Object.entries(contributes)) {
    if (!ids || ids.length === 0) continue;

    const verifier = contributeVerifiers[key as keyof HubContributes];
    if (!verifier) continue; // No verifier for this type - assume OK

    const result = verifier(ids);
    if (!result.ok) return result;
  }

  return { ok: true };
}

export class HubInstallerImpl {
  private getCacheDir(): string {
    return path.join(getDataPath(), 'cache', 'hub');
  }

  private getTempDir(): string {
    return path.join(getInstallTargetDir(), '.tmp');
  }

  /**
   * Install an extension by name.
   *
   * SECURITY: Installing an extension is a code-execution event - the extension
   * entry point and its `onInstall`/`onActivate` lifecycle hooks run with full
   * Node privileges (see lifecycleRunner.ts / sandboxWorker.ts). Because the
   * `hub.install` IPC provider is reachable from a compromised renderer AND from
   * an authenticated remote WebUI/WebSocket client (token-gated only), a remote
   * token alone must NOT be able to drive an install. We therefore gate every
   * install behind {@link requireConfirmation} - a native main-process dialog
   * that the renderer/remote caller cannot spoof. The internal `skipConfirm`
   * flag is used ONLY for the `retryInstall` → `install` re-entry path, which
   * has already shown the dialog; it is never plumbed through from IPC params.
   */
  public async install(name: string, options?: { skipConfirm?: boolean }): Promise<void> {
    try {
      hubStateManager.setTransientState(name, 'installing');

      const extInfo = hubIndexManager.getExtension(name);
      if (!extInfo) {
        throw new Error(`Extension ${name} not found in Hub Index`);
      }

      // Reachability cut: require an explicit local-user confirmation before any
      // extraction / hotReload / onInstall runs. A remote token cannot satisfy
      // this - the user must click "Install" in a native dialog on the host.
      if (!options?.skipConfirm) {
        const confirmed = await requireConfirmation({
          title: 'Install extension',
          message: `Install "${extInfo.displayName || name}"?`,
          detail:
            `Extension "${extInfo.displayName || name}" by ${extInfo.author || 'unknown author'} runs code with full ` +
            `system access during installation and while active. Only install extensions you trust.`,
          confirmLabel: 'Install',
        });
        if (!confirmed) {
          // Surfaced to the caller as a failed install with a clear reason
          // (the catch block sets install_failed); the install does not proceed.
          throw new Error('Extension install cancelled by user');
        }
      }

      const tempDir = path.join(this.getTempDir(), name);
      const targetDir = path.join(getInstallTargetDir(), name);

      // Clean up previous temp dir if exists
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      // Ensure directories exist
      fs.mkdirSync(this.getCacheDir(), { recursive: true });
      fs.mkdirSync(this.getTempDir(), { recursive: true });

      // Step 1: Resolve zip path - try bundled resources first, fallback to remote download
      const remoteCachePath = path.join(this.getCacheDir(), `${name}.zip`);
      const zipPath = await this.resolveZipPath(name, extInfo.dist.tarball, extInfo.bundled);

      // Step 2: Verify Integrity (SHA-512 SRI) against the hash declared in
      // the hub index. For anything resolved from a remote mirror a
      // missing/empty integrity hash is a HARD FAILURE so a tampered mirror
      // cannot ship an unverified payload; bundled archives shipped inside the
      // code-signed app bundle tolerate a missing hash. An archive that did NOT
      // come from the remote cache path was resolved from bundled app
      // resources, regardless of the `bundled` flag (which can fall back to
      // remote on a cache miss).
      const isBundledArchive = zipPath !== remoteCachePath;
      await this.verifyIntegrity(zipPath, extInfo.dist.integrity, isBundledArchive);

      // Step 3: Extract (.zip)
      fs.mkdirSync(tempDir, { recursive: true });
      if (process.platform === 'win32') {
        await execAsync(`tar -xf "${zipPath}" -C "${tempDir}"`);
      } else {
        await execAsync(`unzip -o "${zipPath}" -d "${tempDir}"`);
      }

      // If the archive wraps contents in a "package" directory, move contents up
      const packageDir = path.join(tempDir, 'package');
      let finalExtractDir = tempDir;
      if (fs.existsSync(packageDir)) {
        finalExtractDir = packageDir;
      }

      // Verify aion-extension.json exists
      const manifestPath = path.join(finalExtractDir, EXTENSION_MANIFEST_FILE);
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Invalid extension package: aion-extension.json missing');
      }

      // Step 4: Move to target directory
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }

      if (finalExtractDir === packageDir) {
        fs.renameSync(packageDir, targetDir);
        fs.rmSync(tempDir, { recursive: true, force: true });
      } else {
        fs.renameSync(tempDir, targetDir);
      }

      // Step 5: Reload extension registry and refresh AcpDetector
      // Clear persisted state so hotReload treats this as a fresh install
      // and re-runs onInstall (handles reinstall after CLI was uninstalled).
      await markExtensionForReinstall(name);

      // hotReload re-scans all extension directories, discovers this new extension,
      // and runs the full lifecycle (onInstall for first-time + onActivate) via
      // the extension system's lifecycle runner (forked process, timeout, sandboxing).
      await ExtensionRegistry.hotReload();

      // Re-detect all agents (builtin + extension + custom) since onInstall
      // may have installed new CLIs that weren't on PATH at startup.
      await agentRegistry.refreshAll();

      // Step 6: Verify contributed capabilities are actually available
      const verification = verifyInstallation(extInfo);
      if (!verification.ok) {
        throw new Error(verification.reason);
      }

      hubStateManager.setTransientState(name, 'installed');
    } catch (error) {
      console.error(`[HubInstaller] Failed to install ${name}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      hubStateManager.setTransientState(name, 'install_failed', errorMessage);
      throw error;
    }
  }

  public async retryInstall(name: string): Promise<void> {
    hubStateManager.setTransientState(name, 'installing');

    try {
      const targetDir = path.join(getInstallTargetDir(), name);

      // If target directory doesn't exist, we must run the full install process again
      if (!fs.existsSync(targetDir)) {
        await this.install(name);
        return;
      }

      // Target directory exists. If the on-disk manifest is gone the install is
      // unrecoverable in place - surface a clear "reinstall from scratch" error.
      const manifestPath = path.join(targetDir, EXTENSION_MANIFEST_FILE);
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Extension manifest missing, please reinstall from scratch.');
      }

      // SECURITY (RT-B4-06): the previous fast path skipped re-download / re-extract
      // / re-verify and re-ran the on-disk `onInstall` lifecycle hook directly. That
      // means tampered-on-disk extension code would execute unverified. `dist.integrity`
      // pins the SHA-512 of the source ARCHIVE (not the extracted dir), and we keep no
      // per-directory hash, so there is no sound way to recompute a matching hash from
      // the already-extracted files. The correct, verified path is to re-resolve the
      // trusted source archive, verify it against `dist.integrity`, re-extract it over
      // the existing target dir, and only then re-run the lifecycle - which is exactly
      // what install() does (it overwrites an existing targetDir before re-extracting).
      // Delegating here guarantees onInstall never runs on unverified on-disk code while
      // keeping the legitimate retry working for an untampered extension. install() also
      // shows the same non-spoofable native confirmation, so the reachability cut holds.
      await this.install(name);
    } catch (error) {
      console.error(`[HubInstaller] Failed to retry install ${name}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      hubStateManager.setTransientState(name, 'install_failed', errorMessage);
      throw error;
    }
  }

  /**
   * Resolve the zip file path for an extension.
   * Bundled extensions try local Resources first, then fall back to remote download.
   * Non-bundled extensions always download from remote.
   */
  private async resolveZipPath(name: string, distTarball: string, bundled?: boolean): Promise<string> {
    if (bundled) {
      const localPath = path.join(getHubResourcesDir(), path.basename(distTarball));
      if (fs.existsSync(localPath)) {
        return localPath;
      }
      console.warn(`[HubInstaller] Bundled zip not found at ${localPath}, falling back to remote download`);
    }

    // Reject absolute URLs to prevent bypassing trusted base URLs
    if (/^https?:\/\//i.test(distTarball)) {
      throw new Error(`Untrusted absolute tarball URL in hub index: ${distTarball}`);
    }

    // Download from remote mirrors (try each in order)
    const cachePath = path.join(this.getCacheDir(), `${name}.zip`);
    for (const baseUrl of HUB_REMOTE_URLS) {
      const url = new URL(distTarball, baseUrl).toString();
      try {
        await this.downloadFile(url, cachePath);
        return cachePath;
      } catch (error) {
        console.warn(`[HubInstaller] Download failed from ${url} (${error})`);
      }
    }

    throw new Error(`Failed to download ${name} from all remote sources`);
  }

  private async downloadFile(url: string, dest: string): Promise<void> {
    const response = await getPlatformServices().network.fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    // Convert array buffer to buffer and write to disk
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(arrayBuffer));
  }

  /**
   * Verify the on-disk archive against the declared SHA-512 SRI hash.
   *
   * SECURITY: a missing/empty integrity value is a HARD FAILURE for archives
   * resolved from a remote mirror - a tampered or compromised mirror must never
   * be able to ship an unverified payload by simply omitting the hash. A missing
   * value is tolerated ONLY for `bundled` archives shipped inside the app
   * bundle, whose authenticity is already guaranteed by code signing.
   */
  private async verifyIntegrity(filePath: string, expectedSri: string, bundled: boolean): Promise<void> {
    if (!expectedSri || expectedSri.length === 0) {
      if (bundled) {
        // Code signing already covers bundled archives; tolerate a missing hash.
        console.warn(
          `[HubInstaller] No integrity hash declared for bundled archive ${filePath}; proceeding (covered by code signing).`
        );
        return;
      }
      // Remote download with no declared integrity - refuse to install.
      throw new Error(
        `No integrity hash declared for remotely-downloaded extension archive ${path.basename(filePath)}; ` +
          `refusing to install an unverified payload.`
      );
    }

    if (!expectedSri.startsWith('sha512-')) {
      throw new Error(
        `Unsupported integrity algorithm "${expectedSri}". Only sha512-<base64> is accepted; refusing to install.`
      );
    }

    const expectedHashBase64 = expectedSri.substring('sha512-'.length).trim();
    if (expectedHashBase64.length === 0) {
      throw new Error(`Malformed integrity hash "${expectedSri}"; refusing to install.`);
    }

    let expectedHashHex: string;
    try {
      expectedHashHex = Buffer.from(expectedHashBase64, 'base64').toString('hex');
    } catch {
      throw new Error(`Malformed integrity hash "${expectedSri}" (invalid base64); refusing to install.`);
    }

    // SHA-512 is 64 bytes -> 128 hex chars. Reject anything else early.
    if (expectedHashHex.length !== 128) {
      throw new Error(`Malformed integrity hash "${expectedSri}" (wrong length); refusing to install.`);
    }

    // Stream the file through the hash so we don't load the whole archive
    // into memory (extensions can be tens of MB).
    const hash = crypto.createHash('sha512');
    await new Promise<void>((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve());
      stream.on('error', (err) => reject(err));
    });
    const actualHashHex = hash.digest('hex');

    if (actualHashHex !== expectedHashHex) {
      throw new Error(
        `Integrity verification failed for ${path.basename(filePath)}: ` +
          `expected sha512 ${expectedHashHex.slice(0, 16)}…, ` +
          `got ${actualHashHex.slice(0, 16)}…. The archive may be corrupted or tampered with.`
      );
    }
  }
}

export const hubInstaller = new HubInstallerImpl();
