import { describe, expect, it } from 'vitest';
import { findMissingMetaCredential } from '@renderer/components/settings/SettingsModal/contents/channels/messaging/whatsAppCredentials';

describe('findMissingMetaCredential', () => {
  it.each([
    [
      { accessToken: '', phoneNumberId: '123', verifyToken: 'verify', appSecret: 'secret' },
      'accessTokenAndPhoneNumberId',
    ],
    [
      { accessToken: 'token', phoneNumberId: ' ', verifyToken: 'verify', appSecret: 'secret' },
      'accessTokenAndPhoneNumberId',
    ],
    [{ accessToken: 'token', phoneNumberId: '123', verifyToken: ' ', appSecret: 'secret' }, 'verifyToken'],
    [{ accessToken: 'token', phoneNumberId: '123', verifyToken: 'verify', appSecret: '' }, 'appSecret'],
  ] as const)('returns %s for an incomplete credential set', (credentials, expected) => {
    expect(findMissingMetaCredential(credentials)).toBe(expected);
  });

  it('accepts all required values without requiring an optional Business Account ID', () => {
    expect(
      findMissingMetaCredential({
        accessToken: ' token ',
        phoneNumberId: ' 123 ',
        verifyToken: ' verify ',
        appSecret: ' secret ',
      })
    ).toBeNull();
  });
});
