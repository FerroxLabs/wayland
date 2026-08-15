/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse as parseToml } from 'smol-toml';

import { kimiStatus, managedHash, removeKimi, setupKimi } from '@process/connectors/kimi';
import { getReceipt } from '@process/connectors/manifest';
import type { ConnectorContext } from '@process/connectors/types';

const BASE_URL = 'https://api.fluxrouter.ai/v1';

/**
 * A realistic hand-written Kimi Code config: comments, a quoted provider table,
 * a NESTED oauth sub-table, and [services.*] blocks. Shaped after a real one on
 * disk, because the whole risk of this connector is destroying a file the user
 * owns and edits.
 */
const USER_CONFIG = `# my kimi setup - do not clobber
default_model = "kimi-code/kimi-for-coding"

[thinking]
enabled = true
effort = "medium"

[providers."managed:kimi-code"]
type = "kimi"
api_key = "user-secret"
base_url = "https://api.kimi.com/coding/v1"

[providers."managed:kimi-code".oauth]
storage = "keyring"
key = "oauth/kimi-code"

[models."kimi-code/k3"]
provider = "managed:kimi-code"
model = "k3"
max_context_size = 1048576

[services.moonshot_search]
base_url = "https://api.kimi.com/coding/v1/search"
api_key = "user-secret"
`;

type TomlRoot = {
  providers?: Record<string, unknown>;
  models?: Record<string, unknown>;
  services?: Record<string, unknown>;
  thinking?: Record<string, unknown>;
  default_model?: string;
} & Record<string, unknown>;

describe('kimi connector', () => {
  let tmpDir: string;
  let configPath: string;
  let ctx: ConnectorContext;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'flux-kimi-'));
    configPath = path.join(tmpDir, 'kimi-code', 'config.toml');
    ctx = {
      fluxKey: 'sk-flux-test',
      baseURL: BASE_URL,
      manifestPath: path.join(tmpDir, 'flux-connectors.json'),
      backupDir: path.join(tmpDir, 'backups'),
      configPathOverride: configPath,
    };
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  const writeUserConfig = async () => {
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(configPath, USER_CONFIG, 'utf-8');
  };

  const read = () => fs.promises.readFile(configPath, 'utf-8');

  it('reports absent before the config exists, and unconfigured once it does', async () => {
    expect(await kimiStatus(ctx)).toBe('absent');
    await writeUserConfig();
    expect(await kimiStatus(ctx)).toBe('unconfigured');
  });

  it('registers a usable openai-compatible provider', async () => {
    await writeUserConfig();
    const report = await setupKimi(ctx);

    const parsed = parseToml(await read()) as TomlRoot;
    const flux = parsed.providers?.['flux-router'] as Record<string, unknown>;

    // `type = "openai"` is the generic kind the real binary accepts; anything
    // else and kimi will not treat Flux as a provider at all.
    expect(flux.type).toBe('openai');
    expect(flux.base_url).toBe(BASE_URL);
    expect(flux.api_key).toBe('sk-flux-test');
    expect(report.action).toBe('installed');
    expect(report.status).toBe('routed');
  });

  /**
   * The reason this connector splices text instead of round-tripping TOML. A
   * structured rewrite drops comments and reorders tables, and this is a file
   * the user hand-edits.
   */
  it('leaves every byte it does not own untouched', async () => {
    await writeUserConfig();
    await setupKimi(ctx);
    const after = await read();

    expect(after).toContain('# my kimi setup - do not clobber');
    expect(after).toContain('[providers."managed:kimi-code".oauth]');
    expect(after).toContain('storage = "keyring"');
    expect(after).toContain('[services.moonshot_search]');
    expect(after).toContain('default_model = "kimi-code/kimi-for-coding"');
    expect(after).toContain('effort = "medium"');
  });

  it("never repoints the user's default model", async () => {
    // Registering a provider is setup. Changing which model runs is a hijack.
    await writeUserConfig();
    await setupKimi(ctx);

    expect((parseToml(await read()) as TomlRoot).default_model).toBe('kimi-code/kimi-for-coding');
  });

  it('does not disturb a same-prefixed sibling provider', async () => {
    // `flux-router-2` starts with our id. A sloppy anchor would eat it.
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(
      configPath,
      `${USER_CONFIG}\n[providers."flux-router-2"]\ntype = "openai"\nbase_url = "https://example.invalid/v1"\n`,
      'utf-8'
    );
    await setupKimi(ctx);

    const parsed = parseToml(await read()) as TomlRoot;
    const fluxProvider = parsed.providers?.['flux-router-2'] as Record<string, unknown> | undefined;
    expect(fluxProvider).toBeDefined();
    expect(fluxProvider?.base_url).toBe('https://example.invalid/v1');
  });

  it('is idempotent - a second setup does not duplicate the tables', async () => {
    await writeUserConfig();
    await setupKimi(ctx);
    const first = await read();
    const second = await setupKimi(ctx);
    const after = await read();

    expect(second.action).toBe('already-routed');
    expect(after.match(/\[providers\."flux-router"\]/g)).toHaveLength(1);
    expect(after.match(/\[models\."flux-router\/flux-auto"\]/g)).toHaveLength(1);
    expect(after).toBe(first);
  });

  it('reports routed after setup and drifted when the base url is edited away', async () => {
    await writeUserConfig();
    await setupKimi(ctx);
    expect(await kimiStatus(ctx)).toBe('routed');

    const edited = (await read()).replace(BASE_URL, 'https://somewhere.else/v1');
    await fs.promises.writeFile(configPath, edited, 'utf-8');
    expect(await kimiStatus(ctx)).toBe('drifted');
  });

  it('reports drifted rather than throwing when the config stops parsing', async () => {
    // A status read is a health check; it runs on a settings panel and must
    // never take the panel down with it.
    await writeUserConfig();
    await setupKimi(ctx);
    await fs.promises.writeFile(configPath, 'this is [ not valid toml', 'utf-8');

    await expect(kimiStatus(ctx)).resolves.toBe('drifted');
  });

  it('snapshots the pre-install config exactly once', async () => {
    await writeUserConfig();
    const first = await setupKimi(ctx);
    expect(first.backupPath).not.toBeNull();
    expect(await fs.promises.readFile(first.backupPath as string, 'utf-8')).toBe(USER_CONFIG);

    // A later install must keep pointing at the ORIGINAL snapshot, or "restore"
    // would mean "restore to the last time we wrote", which is not a rollback.
    const second = await setupKimi(ctx);
    expect(second.backupPath).toBe(first.backupPath);
  });

  it('takes no snapshot when it created the config itself', async () => {
    const report = await setupKimi(ctx);
    expect(report.backupPath).toBeNull();
    expect(report.configExistedBefore).toBe(false);
  });

  it('removes only its own tables and leaves the rest byte-identical', async () => {
    await writeUserConfig();
    await setupKimi(ctx);
    await removeKimi(ctx);

    const after = await read();
    expect(after).not.toContain('flux-router');
    // The user's file comes back exactly as it was, whitespace included.
    expect(after.trimEnd()).toBe(USER_CONFIG.trimEnd());
    expect(await getReceipt(ctx.manifestPath, 'kimi')).toBeUndefined();
  });

  it('survives a remove when there is nothing of ours to remove', async () => {
    await writeUserConfig();
    const report = await removeKimi(ctx);

    expect(report.action).toBe('removed');
    expect(await read()).toBe(USER_CONFIG);
  });

  it('keys the managed hash on the base url alone, never the api key', async () => {
    // The receipt is drift detection, not an integrity hash. Mixing the key in
    // would put a live credential into the manifest.
    expect(managedHash(BASE_URL)).toBe(managedHash(BASE_URL));
    expect(managedHash(BASE_URL)).not.toContain('sk-flux-test');

    await writeUserConfig();
    await setupKimi(ctx);
    const receipt = await getReceipt(ctx.manifestPath, 'kimi');
    expect(receipt?.managedHash).toBe(managedHash(BASE_URL));
    expect(JSON.stringify(receipt)).not.toContain('sk-flux-test');
  });

  it('writes a config the TOML parser accepts, with no user config to start from', async () => {
    await setupKimi(ctx);
    expect(() => parseToml(fs.readFileSync(configPath, 'utf-8'))).not.toThrow();
  });
});
