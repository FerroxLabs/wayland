import { getPlatformServices } from '@/common/platform';
import type { IHubExtension, IHubIndex } from '@/common/types/hub';
import * as fs from 'fs';
import * as path from 'path';
import {
  HUB_REMOTE_URLS,
  HUB_INDEX_FILE,
  HUB_SUPPORTED_SCHEMA_VERSION,
  getHubResourcesDir,
} from '@process/extensions/constants';

/**
 * HubIndexManager
 *
 * Merges local bundled index + remote index, resolves `bundled` flag,
 * and derives runtime status for each extension.
 *
 * Data flow:
 *   1. AcpDetector completes first (external dependency)
 *   2. Load local bundled index
 *   3. Fetch remote index (remote takes priority on name conflict)
 *   4. Resolve `bundled` flag: true only if zip exists in Resources dir
 *   5. Derive status: AcpDetector-detected agents → installed
 */
class HubIndexManagerImpl {
  private mergedIndex: Record<string, IHubExtension> = {};
  /**
   * Names that came from the bundled/trusted local index. The local index ships
   * inside the code-signed app bundle, so its `dist` block (tarball + integrity)
   * is authentic. The remote index - fetched over the network from a mirror an
   * attacker can MITM or compromise - must NOT be allowed to substitute the
   * integrity source for any extension that also exists here. See `loadIndexes`.
   */
  private trustedNames = new Set<string>();
  private localLoaded = false;
  private remoteLoaded = false;

  /**
   * Load and merge indexes.
   * Local index is loaded once. Remote index is retried on every call
   * until it succeeds, so opening the Hub Modal after a network failure
   * will automatically retry.
   */
  public async loadIndexes(): Promise<void> {
    // Step 1: Local index - load once. This is the TRUSTED source: it ships
    // inside the code-signed app bundle, so its `dist.integrity` is authentic.
    if (!this.localLoaded) {
      const localIndex = this.fetchLocalIndex();
      for (const [name, ext] of Object.entries(localIndex)) {
        this.mergedIndex[name] = ext;
        this.trustedNames.add(name);
      }
      this.localLoaded = true;
    }

    // Step 2: Remote index - retry until success.
    //
    // SECURITY (RT-B4-03): the remote index is fetched over the network from a
    // mirror that an attacker can MITM or compromise. The integrity hash used to
    // verify a downloaded archive (`dist.integrity`, consumed by
    // HubInstaller.verifyIntegrity) must therefore NOT be sourced from the remote
    // index for any extension that also exists in the trusted local index - a
    // compromised mirror could otherwise serve a matching {integrity, archive}
    // pair and pass verification. For trusted names we PIN the entire `dist`
    // block (tarball + integrity) to the local value; remote may still refresh
    // non-security display metadata. Remote-only extensions are unaffected and
    // install normally.
    if (!this.remoteLoaded) {
      const remoteIndex = await this.fetchRemoteIndex();

      if (Object.keys(remoteIndex).length > 0) {
        for (const [name, ext] of Object.entries(remoteIndex)) {
          const trusted = this.trustedNames.has(name) ? this.mergedIndex[name] : undefined;
          if (trusted) {
            // Keep the remote metadata but force the integrity-bearing `dist`
            // block back to the trusted, code-signed local value.
            this.mergedIndex[name] = { ...ext, dist: trusted.dist };
          } else {
            this.mergedIndex[name] = ext;
          }
        }
        this.remoteLoaded = true;
      }
    }

    // Step 3: Resolve `bundled` flag - true only if zip actually exists in Resources
    const hubDir = getHubResourcesDir();
    for (const ext of Object.values(this.mergedIndex)) {
      ext.bundled = fs.existsSync(path.join(hubDir, path.basename(ext.dist.tarball)));
    }
  }

  public getExtensionList(): Record<string, IHubExtension> {
    return this.mergedIndex;
  }

  public getExtension(name: string): IHubExtension | undefined {
    return this.mergedIndex[name];
  }

  /**
   * Validate that the index schemaVersion is compatible with this app.
   * Returns true if compatible, false otherwise.
   */
  private isSchemaCompatible(data: IHubIndex, source: string): boolean {
    if (data.schemaVersion > HUB_SUPPORTED_SCHEMA_VERSION) {
      console.warn(
        `[HubIndexManager] ${source} index schemaVersion ${data.schemaVersion} ` +
          `> supported ${HUB_SUPPORTED_SCHEMA_VERSION}, skipping`
      );
      return false;
    }
    return true;
  }

  private fetchLocalIndex(): Record<string, IHubExtension> {
    try {
      const indexPath = path.join(getHubResourcesDir(), 'index.json');

      if (!fs.existsSync(indexPath)) {
        return {};
      }

      const content = fs.readFileSync(indexPath, 'utf-8');
      const data = JSON.parse(content) as IHubIndex;
      if (!this.isSchemaCompatible(data, 'Local')) return {};
      return data.extensions ?? {};
    } catch (error) {
      console.error('[HubIndexManager] Failed to read local bundled index:', error);
      return {};
    }
  }

  private async fetchRemoteIndex(): Promise<Record<string, IHubExtension>> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout')), 5000)
    );

    for (const baseUrl of HUB_REMOTE_URLS) {
      const url = new URL(HUB_INDEX_FILE, baseUrl).toString();
      try {
        console.log(`[HubIndexManager] Attempting to fetch remote index from: ${url}`);

        const response = (await Promise.race([getPlatformServices().network.fetch(url), timeoutPromise])) as Response;
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = (await response.json()) as IHubIndex;

        if (!this.isSchemaCompatible(data, 'Remote')) return {};
        return data.extensions ?? {};
      } catch (error) {
        console.warn(`[HubIndexManager] Fetch failed from ${url} (${error})`);
      }
    }
    console.error('[HubIndexManager] Failed to fetch remote index from all sources');
    return {};
  }
}

export const hubIndexManager = new HubIndexManagerImpl();
