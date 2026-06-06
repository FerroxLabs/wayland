/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isAllowedBaseUrl } from '@process/channels/plugins/weixin/WeixinLogin';

describe('WeixinLogin / isAllowedBaseUrl', () => {
  it('accepts the production Tencent host', () => {
    expect(isAllowedBaseUrl('https://ilinkai.weixin.qq.com')).toBe(true);
  });

  it('accepts regional Tencent subdomains', () => {
    expect(isAllowedBaseUrl('https://ilinkai-tj.weixin.qq.com')).toBe(true);
    expect(isAllowedBaseUrl('https://ilinkai-sh.weixin.qq.com')).toBe(true);
    expect(isAllowedBaseUrl('https://weixin.qq.com')).toBe(true);
  });

  it('rejects an attacker-supplied host that mimics the legitimate one', () => {
    expect(isAllowedBaseUrl('https://evil.example.com')).toBe(false);
    expect(isAllowedBaseUrl('https://ilinkai.weixin.qq.com.evil.com')).toBe(false);
    expect(isAllowedBaseUrl('https://weixin.qq.com.evil.com')).toBe(false);
  });

  it('rejects http (downgrade attack)', () => {
    expect(isAllowedBaseUrl('http://ilinkai.weixin.qq.com')).toBe(false);
  });

  it('rejects URLs containing userinfo', () => {
    expect(isAllowedBaseUrl('https://attacker@ilinkai.weixin.qq.com')).toBe(false);
    expect(isAllowedBaseUrl('https://user:pass@ilinkai.weixin.qq.com')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isAllowedBaseUrl('not a url')).toBe(false);
    expect(isAllowedBaseUrl('')).toBe(false);
    expect(isAllowedBaseUrl('javascript:alert(1)')).toBe(false);
  });

  it('is case-insensitive for hostname checks', () => {
    expect(isAllowedBaseUrl('https://ILINKAI.WEIXIN.QQ.COM')).toBe(true);
  });
});
