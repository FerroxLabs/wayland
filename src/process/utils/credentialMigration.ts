/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One-shot startup migration: re-encrypt every channel plugin's credentials
 * from the legacy base64-obfuscation formats (`b64:` / `plain:` / `enc:`) to
 * Electron `safeStorage` ciphertext (`enc:v1:`).
 *
 * Before this migration credentials sat in SQLite as base64 - anyone with
 * read access to `wayland.db` could recover every Slack/Twilio/AgentMail bot
 * token in seconds. The crypto upgrade in `credentialCrypto.ts` switches new
 * writes to OS-level encryption; this module sweeps the existing rows.
 *
 * Gated by `ProcessConfig.get('system.credentialsCryptoMigrated_v1')`. Once
 * the flag is `true` the migration is a no-op on every subsequent launch.
 * If the host OS does not expose safeStorage (Linux without libsecret,
 * headless container without dbus, etc.) the migration short-circuits and
 * deliberately leaves the flag unset so it can retry on the next launch.
 */

import { ProcessConfig } from './initStorage';
import { isEncryptionAvailable } from '@process/secrets';
import { getDatabase } from '@process/services/database/export';

const FLAG_KEY = 'system.credentialsCryptoMigrated_v1' as const;

/**
 * Re-encrypts every channel plugin's credentials to the new `enc:v1:` format.
 *
 * Safe to invoke unconditionally on startup - short-circuits when the flag is
 * already set or when encryption is unavailable. Never throws; logs and
 * returns on failure so app startup is not blocked.
 */
export async function migrateCredentialsToSafeStorage_v1(): Promise<void> {
  try {
    const alreadyMigrated = await ProcessConfig.get(FLAG_KEY);
    if (alreadyMigrated === true) {
      return;
    }

    if (!isEncryptionAvailable()) {
      console.error(
        '[credentialMigration] OS credential encryption is not available. ' +
          'Skipping migration; channel credentials remain in their legacy base64 ' +
          'format. On Linux, install libsecret (e.g. `apt install libsecret-1-0 ' +
          'gnome-keyring`) and restart the app. The migration flag is intentionally ' +
          'left unset so this will retry on the next launch.'
      );
      return;
    }

    const db = await getDatabase();
    const result = db.getChannelPlugins();
    if (!result.success || !result.data) {
      console.warn('[credentialMigration] Could not list channel plugins:', result.error);
      return;
    }

    let migrated = 0;
    let failed = 0;

    for (const plugin of result.data) {
      // getChannelPlugins() routes credentials through decryptCredentials,
      // which transparently handles every legacy prefix (`b64:`, `plain:`,
      // `enc:`, unprefixed) AND already-migrated `enc:v1:` values. The plugin
      // object we just received therefore holds plaintext credentials.
      // upsertChannelPlugin() re-encrypts via the safeStorage path.
      try {
        const upsertResult = db.upsertChannelPlugin(plugin);
        if (upsertResult.success) {
          migrated += 1;
        } else {
          failed += 1;
          console.warn(
            `[credentialMigration] Failed to re-encrypt credentials for plugin ${plugin.id}:`,
            upsertResult.error
          );
        }
      } catch (err) {
        failed += 1;
        console.warn(`[credentialMigration] Unexpected error re-encrypting plugin ${plugin.id}:`, err);
      }
    }

    if (failed > 0) {
      console.warn(
        `[credentialMigration] Re-encrypted ${migrated} plugin(s); ${failed} failed. ` +
          'Leaving migration flag unset so failed rows retry on next launch.'
      );
      return;
    }

    await ProcessConfig.set(FLAG_KEY, true);
    console.log(`[credentialMigration] Re-encrypted ${migrated} plugin credential record(s) to safeStorage.`);
  } catch (err) {
    // Last-resort guard - migration MUST NOT prevent app launch.
    console.error('[credentialMigration] Migration failed unexpectedly:', err);
  }
}
