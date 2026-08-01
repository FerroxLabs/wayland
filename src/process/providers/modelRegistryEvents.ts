import { ipcBridge } from '@/common';

/**
 * Single process-side invalidation seam for renderer-safe model-registry state.
 * Every authoritative mutation must publish through this helper so all mounted
 * consumers reload the same snapshot.
 */
export function emitModelRegistryChanged(): void {
  ipcBridge.modelRegistry.listChanged.emit();
}
