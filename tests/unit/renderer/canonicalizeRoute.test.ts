/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import { canonicalHashTarget } from '@/renderer/utils/canonicalizeRoute';

describe('canonicalHashTarget (#151)', () => {
  it('rewrites a path-style app route when the hash is the default guid', () => {
    expect(canonicalHashTarget('/assistants', '#/guid')).toBe('/#/assistants');
  });

  it('rewrites a path-style app route when the hash is empty', () => {
    expect(canonicalHashTarget('/settings/models', '')).toBe('/#/settings/models');
  });

  it('preserves nested path segments', () => {
    expect(canonicalHashTarget('/conversation/abc123', '#/')).toBe('/#/conversation/abc123');
  });

  it('leaves an explicit, non-default hash untouched (it wins)', () => {
    expect(canonicalHashTarget('/assistants', '#/settings/models')).toBeNull();
  });

  it('ignores the root path', () => {
    expect(canonicalHashTarget('/', '#/guid')).toBeNull();
  });

  it('ignores the login path', () => {
    expect(canonicalHashTarget('/login', '')).toBeNull();
  });

  it('ignores unknown path segments (e.g. a static asset path)', () => {
    expect(canonicalHashTarget('/index.html', '#/guid')).toBeNull();
    expect(canonicalHashTarget('/some-unknown', '')).toBeNull();
  });
});
