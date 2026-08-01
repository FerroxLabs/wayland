#!/usr/bin/env node

/*
 * Runtime proof for BetterSqlite3Driver.backup(). The native dependency is
 * rebuilt for Electron, so Node Vitest cannot load it in this checkout.
 *
 * Run: ./node_modules/.bin/electron scripts/verify-recovery-sqlite-backup.cjs
 */

require('tsx/cjs');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { app } = require('electron');

async function verify() {
  const { BetterSqlite3Driver } = require('../src/process/services/database/drivers/BetterSqlite3Driver.ts');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-sqlite-proof-'));
  const sourcePath = path.join(directory, 'source.db');
  const backupPath = path.join(directory, 'backup.db');
  const occupiedPath = path.join(directory, 'occupied.db');
  const source = new BetterSqlite3Driver(sourcePath);

  try {
    source.pragma('journal_mode = WAL');
    source.pragma('wal_autocheckpoint = 0');
    source.exec('CREATE TABLE recovery_probe (value TEXT NOT NULL)');
    source.prepare('INSERT INTO recovery_probe (value) VALUES (?)').run('committed-in-wal');
    assert.equal(fs.existsSync(`${sourcePath}-wal`), true, 'source WAL must exist');

    await source.backup(backupPath);
    const backup = new BetterSqlite3Driver(backupPath, { fileMustExist: true });
    try {
      assert.deepEqual(backup.prepare('SELECT value FROM recovery_probe').get(), { value: 'committed-in-wal' });
    } finally {
      backup.close();
    }

    if (process.platform !== 'win32') {
      assert.equal(fs.statSync(backupPath).mode & 0o777, 0o600, 'backup mode must be owner-only');
    }

    fs.writeFileSync(occupiedPath, 'prior-evidence');
    await assert.rejects(source.backup(occupiedPath), { code: 'EEXIST' });
    assert.equal(fs.readFileSync(occupiedPath, 'utf8'), 'prior-evidence');
    await assert.rejects(source.backup(sourcePath), /must differ from the source/);

    console.log('Recovery SQLite backup proof passed: WAL capture, exclusive publication, source refusal, mode 0600.');
  } finally {
    source.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

app.whenReady().then(
  async () => {
    try {
      await verify();
      app.exit(0);
    } catch (error) {
      console.error(error);
      app.exit(1);
    }
  },
  (error) => {
    console.error(error);
    app.exit(1);
  }
);
