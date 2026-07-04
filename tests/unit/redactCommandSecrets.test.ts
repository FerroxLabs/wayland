/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { redactCommandSecrets } from '@/common/utils/redactCommandSecrets';

const SECRET_FRAGMENTS = [
  'sk-abc123def456ghi',
  'sk-proj-abcdefghijklmnop',
  'ghp_abc123def456ghi789',
  'dXNlcjpwYXNzd29yZA==',
  's3cr3tpassword',
  'hunter2secret',
  'mysupersecretvalue',
];

describe('redactCommandSecrets', () => {
  it('masks Bearer tokens (incl. inside an Authorization header)', () => {
    const out = redactCommandSecrets('curl -H "Authorization: Bearer sk-abc123def456ghi" https://api.x.com');
    expect(out).not.toContain('sk-abc123def456ghi');
    expect(out).toContain('Bearer ••••••');
    expect(out).toContain('https://api.x.com'); // non-secret preserved
  });

  it('masks Basic auth credentials', () => {
    const out = redactCommandSecrets('curl -H "Authorization: Basic dXNlcjpwYXNzd29yZA=="');
    expect(out).not.toContain('dXNlcjpwYXNzd29yZA==');
    expect(out).toContain('Basic ••••••');
  });

  it('masks prefixed provider API keys (sk-, ghp_)', () => {
    expect(redactCommandSecrets('export OPENAI_API_KEY=sk-proj-abcdefghijklmnop')).not.toContain(
      'sk-proj-abcdefghijklmnop'
    );
    expect(redactCommandSecrets('git clone https://ghp_abc123def456ghi789@github.com/x/y')).not.toContain(
      'ghp_abc123def456ghi789'
    );
  });

  it('masks secret-named key=value / key: value pairs, keeping the key name', () => {
    const flag = redactCommandSecrets('deploy --api-key mysupersecretvalue --region us-east-1');
    expect(flag).not.toContain('mysupersecretvalue');
    expect(flag).toContain('--api-key ••••••');
    expect(flag).toContain('--region us-east-1'); // non-secret flag untouched

    expect(redactCommandSecrets('TOKEN=hunter2secret node app.js')).not.toContain('hunter2secret');
    expect(redactCommandSecrets('run --password s3cr3tpassword')).not.toContain('s3cr3tpassword');
  });

  it('masks secrets in the JSON args shape (stringified rawInput)', () => {
    const out = redactCommandSecrets('{"command":"echo hi","password":"mysupersecretvalue"}');
    expect(out).not.toContain('mysupersecretvalue');
    expect(out).toContain('echo hi'); // non-secret arg preserved
  });

  it('masks URL userinfo passwords, keeping user + host', () => {
    const out = redactCommandSecrets('psql postgres://admin:s3cr3tpassword@db.internal:5432/app');
    expect(out).not.toContain('s3cr3tpassword');
    expect(out).toContain('postgres://admin:');
    expect(out).toContain('@db.internal:5432/app');
  });

  it('leaves ordinary commands (paths, flags, messages) untouched', () => {
    for (const cmd of [
      'git commit -m "add the redaction feature"',
      'ls -la /Users/foo/very/long/path/to/some/deeply/nested/file.txt',
      'npm run build && npm test',
      'rg --files-with-matches "TODO" src/',
      'docker run --rm -p 8080:80 nginx:latest',
    ]) {
      expect(redactCommandSecrets(cmd)).toBe(cmd);
    }
  });

  it('never leaks any known secret fragment across a realistic mixed command', () => {
    const cmd =
      'curl -H "Authorization: Bearer sk-abc123def456ghi" --data api_key=mysupersecretvalue https://admin:s3cr3tpassword@x.com';
    const out = redactCommandSecrets(cmd);
    for (const frag of SECRET_FRAGMENTS) {
      if (cmd.includes(frag)) expect(out).not.toContain(frag);
    }
  });

  it('handles empty / whitespace input', () => {
    expect(redactCommandSecrets('')).toBe('');
    expect(redactCommandSecrets('   ')).toBe('   ');
  });
});
