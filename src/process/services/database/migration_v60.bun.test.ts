// Run with: bun run test:bun

/**
 * Migration v60 - migrated Core conversations kept the Flux Router provider row
 * in `conversations.model`, `apiKey` in plain text. Runs on bun:sqlite, where a
 * missing row reads back as `null` (not `undefined`), against both the real
 * schema and a partial fixture with no conversations table.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, runMigrations, type IMigration } from './migrations';
import { CURRENT_DB_VERSION, initSchema } from './schema';

const migration = ALL_MIGRATIONS.find((candidate) => candidate.version === 60) as IMigration | undefined;
const NOW = 1_760_000_000_000;
const FLUX_KEY = 'sk-flux-0123456789abcdef0123456789abcdef0123456789ab';

const providerSnapshot = (apiKey: string) =>
  JSON.stringify({
    id: 'flux-router-row',
    name: 'Flux Router',
    platform: 'openai-compatible',
    baseUrl: 'https://api.fluxrouter.ai/v1',
    apiKey,
    model: ['flux-auto', 'flux-reasoning'],
    __waylandModelRegistryBridge: 'v2:flux-router',
    useModel: 'flux-reasoning',
  });

function insertConversation(driver: BunSqliteDriver, id: string, type: string, extra: object, model: string | null) {
  driver
    .prepare(
      'INSERT INTO conversations (id, user_id, name, type, extra, model, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, 'default', id, type, JSON.stringify(extra), model, 'finished', NOW, NOW);
}

const modelOf = (driver: BunSqliteDriver, id: string) =>
  (driver.prepare('SELECT model FROM conversations WHERE id = ?').get(id) as { model: string | null }).model;

describe('Migration v60 - plaintext provider credentials on ACP conversation rows', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    expect(migration).toBeDefined();
  });

  afterEach(() => driver.close());

  it('is registered and is the current schema version', () => {
    expect(CURRENT_DB_VERSION).toBeGreaterThanOrEqual(60);
    expect(migration!.name).toMatch(/credentials/i);
  });

  it('clears the key-bearing snapshot from migrated Fuigo rows and leaves Gemini rows and extra alone', () => {
    initSchema(driver);
    runMigrations(driver, 0, 59);
    driver
      .prepare(
        "INSERT OR IGNORE INTO users (id, username, password_hash, created_at, updated_at) VALUES ('default', 'default', '', ?, ?)"
      )
      .run(NOW, NOW);
    const fuigoExtra = { backend: 'fuigo', workspace: '/ws', presetRules: 'You are Smart Trader.' };
    insertConversation(driver, 'core-migrated', 'acp', fuigoExtra, providerSnapshot(FLUX_KEY));
    insertConversation(driver, 'fuigo-native', 'acp', { backend: 'fuigo', workspace: '/ws' }, null);
    insertConversation(driver, 'gemini-chat', 'gemini', { workspace: '/ws' }, providerSnapshot('gemini-key'));

    runMigrations(driver, 59, 60);

    expect(modelOf(driver, 'core-migrated')).toBeNull();
    expect(modelOf(driver, 'fuigo-native')).toBeNull();
    expect(modelOf(driver, 'gemini-chat')).toBe(providerSnapshot('gemini-key'));
    const extra = driver.prepare("SELECT extra FROM conversations WHERE id = 'core-migrated'").get() as {
      extra: string;
    };
    expect(JSON.parse(extra.extra)).toEqual(fuigoExtra);
    const leaked = driver
      .prepare("SELECT COUNT(*) AS count FROM conversations WHERE type = 'acp' AND model LIKE ?")
      .get(`%${FLUX_KEY}%`);
    expect(leaked).toEqual({ count: 0 });
  });

  it('is idempotent', () => {
    initSchema(driver);
    runMigrations(driver, 0, 59);
    driver
      .prepare(
        "INSERT OR IGNORE INTO users (id, username, password_hash, created_at, updated_at) VALUES ('default', 'default', '', ?, ?)"
      )
      .run(NOW, NOW);
    insertConversation(driver, 'core-migrated', 'acp', { backend: 'fuigo' }, providerSnapshot(FLUX_KEY));
    migration!.up(driver);
    expect(() => migration!.up(driver)).not.toThrow();
    expect(modelOf(driver, 'core-migrated')).toBeNull();
  });

  it('skips a partial database with no conversations table', () => {
    driver.exec('CREATE TABLE messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL)');
    expect(() => migration!.up(driver)).not.toThrow();
  });
});
