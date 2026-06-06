/** Sync payload - all top-level data fields are optional so partial syncs are valid. */
export type SyncPayload = {
  schemaVersion: 1;
  updatedAt: number;
  data: {
    // TODO(sync-beta): providers, assistants, agents, skills - requires stripping
    // encryptedKey fields before serialization. Deferred to GA.
    theme?: unknown;
    editor?: unknown;
    system?: unknown;
    notifications?: unknown;
  };
};

export type SyncBackendType = 'local-file';

export type SyncState = {
  enabled: boolean;
  saltHex: string;
  backendType: SyncBackendType;
  backendPath: string;
  lastSync?: number;
};

export type SyncStatus = {
  enabled: boolean;
  lastSync?: number;
  itemsCount?: number;
};

export type SyncResult = {
  pulled: number;
  pushed: number;
};
