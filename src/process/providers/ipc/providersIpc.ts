import crypto from 'node:crypto';
import { ipcBridge } from '@/common';
import { getDatabase } from '@process/services/database';
import { ProviderDetector } from '../detection/ProviderDetector';
import { SkRaceResolver } from '../detection/skRaceResolver';
import { ModelCatalog } from '../catalog/ModelCatalog';
import { ProviderRepository, decryptKey } from '../storage/ProviderRepository';
import type { ConnectedProvider } from '../storage/ProviderRepository';
import type { IConnectedProviderView } from '@/common/adapter/ipcBridge';

function safeProvider<R, P>(tag: string, fn: (params: P) => Promise<R>) {
  return async (params: P): Promise<R> => {
    try {
      return await fn(params);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[providersIpc] ${tag}:`, message);
      return { success: false, msg: message } as unknown as R;
    }
  };
}

function toView(cp: ConnectedProvider): IConnectedProviderView {
  return {
    id: cp.id,
    providerId: cp.providerId,
    displayName: cp.displayName,
    status: cp.status,
    lastRefreshedAt: cp.lastRefreshedAt,
    models: cp.models.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      tier: m.tier,
      capabilities: m.capabilities,
      enabled: m.enabled,
      deprecated: m.deprecated ?? false,
      deprecatedAt: m.deprecatedAt,
      contextWindow: m.contextWindow,
    })),
  };
}

function classifyHttpError(status: number): string {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 429) return 'rate-limit';
  return 'unknown';
}

let _repo: ProviderRepository | null = null;

export async function initProvidersIpc(): Promise<void> {
  const db = await getDatabase();
  _repo = new ProviderRepository(db.getDriver());
  const detector = new ProviderDetector();
  const resolver = new SkRaceResolver();
  const catalog = new ModelCatalog();

  ipcBridge.providers.list.provider(
    safeProvider('list', async () => {
      const providers = _repo!.listCatalogs().map(toView);
      const defaults = _repo!.listDefaults();
      return { success: true, data: { providers, defaults } };
    })
  );

  ipcBridge.providers.connect.provider(
    safeProvider('connect', async ({ key, additionalFields }) => {
      const detection = detector.detect(key);

      if (detection.kind === 'unknown') {
        return { success: false, msg: 'Could not identify provider from key' };
      }

      let providerId: string;

      if (detection.kind === 'ambiguous-sk') {
        const raceResult = await resolver.resolve(key, detection.candidates);
        if (raceResult.kind !== 'matched') {
          return { success: false, msg: 'Could not verify key with any provider' };
        }
        providerId = raceResult.provider;
      } else if (detection.kind === 'multi-field') {
        if (!additionalFields) {
          return {
            success: false,
            msg: `Provider requires additional fields: ${detection.requiredFields.join(', ')}`,
          };
        }
        providerId = detection.provider;
      } else {
        providerId = detection.provider;
      }

      // Verify key works
      let models;
      try {
        models = await catalog.refresh(providerId as import('../types').ProviderId, key);
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        const kind = status ? classifyHttpError(status) : 'network';
        return { success: false, msg: `${kind}: ${err instanceof Error ? err.message : String(err)}` };
      }

      // Pre-select flagship, everyday, fast tiers; leave reasoning off by default unless family has any
      const preselectTiers = new Set(['flagship', 'everyday', 'fast']);
      const selectedModels = models.map((m) => ({
        ...m,
        enabled: preselectTiers.has(m.tier),
      }));

      const id = crypto.randomUUID();
      _repo!.insertCatalog({
        id,
        providerId: providerId as import('../types').ProviderId,
        displayName: null,
        apiKey: key,
        additionalFields: additionalFields ?? {},
      });
      _repo!.upsertModels(id, selectedModels);
      _repo!.updateCatalogStatus(id, 'connected', Date.now());

      const cp = _repo!.getCatalog(id)!;
      ipcBridge.providers.catalogUpdated.emit({ catalogId: id });
      return { success: true, data: { provider: toView(cp) } };
    })
  );

  ipcBridge.providers.refresh.provider(
    safeProvider('refresh', async ({ catalogId }) => {
      const cp = _repo!.getCatalog(catalogId);
      if (!cp) return { success: false, msg: 'Provider not found' };

      _repo!.updateCatalogStatus(catalogId, 'refreshing');

      let models;
      try {
        const apiKey = decryptKey(cp.apiKeyEncrypted);
        models = await catalog.refresh(cp.providerId, apiKey);
      } catch (err) {
        _repo!.updateCatalogStatus(catalogId, 'error');
        return { success: false, msg: err instanceof Error ? err.message : String(err) };
      }

      // Mark removed models as deprecated (non-destructive)
      const existing = new Set(cp.models.map((m) => m.id));
      const fresh = new Set(models.map((m) => m.id));
      for (const oldId of existing) {
        if (!fresh.has(oldId)) {
          _repo!.markDeprecated(catalogId, oldId);
        }
      }

      // Preserve existing enabled state for known models
      const enabledByModelId = new Map(cp.models.map((m) => [m.id, m.enabled]));
      const preselectTiers = new Set(['flagship', 'everyday', 'fast']);
      const upsertModels = models.map((m) => ({
        ...m,
        enabled: enabledByModelId.has(m.id) ? (enabledByModelId.get(m.id) ?? false) : preselectTiers.has(m.tier),
      }));

      _repo!.upsertModels(catalogId, upsertModels);
      _repo!.updateCatalogStatus(catalogId, 'connected', Date.now());

      const updated = _repo!.getCatalog(catalogId)!;
      ipcBridge.providers.catalogUpdated.emit({ catalogId });
      return { success: true, data: { provider: toView(updated) } };
    })
  );

  ipcBridge.providers.disconnect.provider(
    safeProvider('disconnect', async ({ catalogId }) => {
      _repo!.deleteCatalog(catalogId);
      return { success: true };
    })
  );

  ipcBridge.providers.toggleModel.provider(
    safeProvider('toggleModel', async ({ catalogId, modelId, enabled }) => {
      _repo!.toggleModel(catalogId, modelId, enabled);
      return { success: true };
    })
  );

  ipcBridge.providers.setDisplayName.provider(
    safeProvider('setDisplayName', async ({ catalogId, displayName }) => {
      _repo!.updateCatalogDisplayName(catalogId, displayName);
      return { success: true };
    })
  );

  ipcBridge.providers.setDefault.provider(
    safeProvider('setDefault', async ({ scope, catalogId, modelId }) => {
      _repo!.setDefault(scope, catalogId, modelId);
      return { success: true };
    })
  );
}

export function getProviderRepository(): ProviderRepository | null {
  return _repo;
}
