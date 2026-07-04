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

  it('does not over-mask the common word "basic" followed by an ordinary word', () => {
    // BASIC_REGEX must not treat prose as a Basic-auth credential (#610 audit).
    for (const cmd of ['git commit -m "basic refactor"', 'echo basic config here', 'npm run basic-example README.md']) {
      expect(redactCommandSecrets(cmd)).toBe(cmd);
    }
    // ...but a real base64-shaped Basic value is still masked.
    const real = redactCommandSecrets('curl -H "Authorization: Basic YWxhZGRpbjpvcGVuc2VzYW1l"');
    expect(real).toContain('Basic ••••••');
    expect(real).not.toContain('YWxhZGRpbjpvcGVuc2VzYW1l');
  });

  it('does not over-mask a secret-named word followed by a plain word (bare-space form)', () => {
    // The bare-whitespace separator must not clobber prose (#610 audit).
    for (const cmd of [
      'git log --grep secret main',
      'echo "password field required"',
      'token refresh completed',
      'the client secret was rotated',
    ]) {
      expect(redactCommandSecrets(cmd)).toBe(cmd);
    }
    // ...but a credential-shaped value after the same key IS still masked.
    expect(redactCommandSecrets('run --password hunter2pass')).not.toContain('hunter2pass');
    expect(redactCommandSecrets('deploy --api-key sk-live-abc123def')).not.toContain('sk-live-abc123def');
    // ...and the explicit `=`/`:` form always masks, even a plain-word value.
    expect(redactCommandSecrets('password=field')).toContain('password=••••••');
  });

  it('masks UPPER_SNAKE / snake_case key names glued by underscores (#610 audit)', () => {
    // `\b` treats `_` as a word char and MISSED these - the real leak Overwatch caught.
    const env = redactCommandSecrets('export ANTHROPIC_API_KEY=sk-ant-abc123def456');
    expect(env).not.toContain('sk-ant-abc123def456');
    expect(env).toContain('ANTHROPIC_API_KEY=');
    expect(env).toContain('••••••');

    expect(redactCommandSecrets('OPENAI_API_KEY=raw_secret_value_1234')).not.toContain('raw_secret_value_1234');
    expect(redactCommandSecrets('run --config db_password=hunter2pass')).not.toContain('hunter2pass');
    // non-secret snake name still untouched
    expect(redactCommandSecrets('cat /etc/hosts_file=/tmp/x')).toBe('cat /etc/hosts_file=/tmp/x');
  });

  it('masks key names with segments glued AFTER the keyword (#610 Overwatch re-audit)', () => {
    // The trailing `\b` treated `_` as a word char, so the keyword had to be the
    // LAST segment before the delimiter - `AWS_SECRET_ACCESS_KEY=` leaked because
    // `SECRET` is followed by `_ACCESS_KEY`. These are canonical real-world names.
    const aws = redactCommandSecrets('export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
    expect(aws).not.toContain('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
    expect(aws).toContain('••••••');
    // the full key NAME is preserved (not truncated to AWS_SECRET=)
    expect(aws).toContain('AWS_SECRET_ACCESS_KEY=');

    expect(redactCommandSecrets('SECRET_KEY=django-insecure-abc123def456xyz')).not.toContain(
      'django-insecure-abc123def456xyz'
    );
    expect(redactCommandSecrets('CLIENT_SECRET_ID=someRandomValue1234')).not.toContain('someRandomValue1234');
    expect(redactCommandSecrets('API_SECRET_KEY=raw_value_abcdef123')).not.toContain('raw_value_abcdef123');
    // hyphen-segment form too
    expect(redactCommandSecrets('--api-key-id sk-live-abc123def456')).not.toContain('sk-live-abc123def456');
    // a non-secret snake name with extra segments still stays intact
    expect(redactCommandSecrets('cat /etc/hosts_file_path=/tmp/x')).toBe('cat /etc/hosts_file_path=/tmp/x');
  });

  it('masks camelCase key names glued to a lowercase prefix (#610 audit)', () => {
    const json = redactCommandSecrets('{"openaiApiKey":"sk-proj-secretvalue123"}');
    expect(json).not.toContain('sk-proj-secretvalue123');
    expect(json).toContain('••••••');

    expect(redactCommandSecrets('config.clientSecret = topsecretvalue99')).not.toContain('topsecretvalue99');
    expect(redactCommandSecrets('headers accessToken=abc123def456ghi')).not.toContain('abc123def456ghi');
    // camelCase secret-named word with a plain short value stays intact (no over-mask)
    expect(redactCommandSecrets('the userPassword field is blank')).toBe('the userPassword field is blank');
  });

  it('handles empty / whitespace input', () => {
    expect(redactCommandSecrets('')).toBe('');
    expect(redactCommandSecrets('   ')).toBe('   ');
  });
});
