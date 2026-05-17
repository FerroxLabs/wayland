import { ipcBridge } from '@/common';
import { ModelCatalog } from '../catalog/ModelCatalog';
import { ModelDeprecationDetector } from './ModelDeprecationDetector';
import { ProviderRepository, decryptKey } from '../storage/ProviderRepository';
import { getDatabase } from '@process/services/database';

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
const STARTUP_DELAY_MS = 5_000;

let _timer: ReturnType<typeof setInterval> | null = null;
let _started = false;

async function runRefreshCycle(): Promise<void> {
  const db = await getDatabase();
  const repo = new ProviderRepository(db.getDriver());
  const catalog = new ModelCatalog();
  const deprecation = new ModelDeprecationDetector(repo);

  const providers = repo.listCatalogs();
  if (providers.length === 0) return;

  console.log(`[ModelRefreshScheduler] Refreshing ${providers.length} provider(s)`);

  // Refresh providers serially to avoid hammering APIs simultaneously
  for (const cp of providers) {
    try {
      repo.updateCatalogStatus(cp.id, 'refreshing');
      const apiKey = decryptKey(cp.apiKeyEncrypted);
      const freshModels = await catalog.refresh(cp.providerId, apiKey);

      deprecation.detectAndMark(cp.id, freshModels);

      // Preserve existing enabled state for known models
      const enabledById = new Map(cp.models.map((m) => [m.id, m.enabled]));
      const preselectTiers = new Set(['flagship', 'everyday', 'fast']);
      const upsert = freshModels.map((m) => ({
        ...m,
        enabled: enabledById.has(m.id) ? (enabledById.get(m.id) ?? false) : preselectTiers.has(m.tier),
      }));

      repo.upsertModels(cp.id, upsert);
      repo.updateCatalogStatus(cp.id, 'connected', Date.now());
      ipcBridge.providers.catalogUpdated.emit({ catalogId: cp.id });
    } catch (err) {
      console.error(`[ModelRefreshScheduler] Failed to refresh ${cp.providerId}:`, err);
      repo.updateCatalogStatus(cp.id, 'error');
    }
  }
}

/**
 * Start the 24h refresh scheduler.
 * Call once from main process bootstrap.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function startModelRefreshScheduler(): void {
  if (_started) return;
  _started = true;

  // Initial refresh after app start delay
  const startupTimer = setTimeout(() => {
    void runRefreshCycle();
  }, STARTUP_DELAY_MS);

  // Recurring 24h refresh
  _timer = setInterval(() => {
    void runRefreshCycle();
  }, REFRESH_INTERVAL_MS);

  // Prevent the startup timer from blocking shutdown
  if (typeof startupTimer === 'object' && startupTimer.unref) {
    startupTimer.unref();
  }
  if (_timer && typeof _timer === 'object' && (_timer as NodeJS.Timeout).unref) {
    (_timer as NodeJS.Timeout).unref();
  }
}

export function stopModelRefreshScheduler(): void {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
  _started = false;
}
