import { describe, it, expect } from 'vitest';
import { extractGoogleConsentUrl } from '@/renderer/utils/mcp/googleConsentUrl';

describe('extractGoogleConsentUrl', () => {
  const consentUrl =
    'https://accounts.google.com/o/oauth2/auth?client_id=123.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A8765&scope=gmail&response_type=code&access_type=offline';

  it('extracts the consent URL from a start_google_auth tool result (MCP-prefixed name)', () => {
    const name = 'io-github-taylorwilsdon-google-workspace-mcp__start_google_auth';
    const result = `Please open this URL to authorize: ${consentUrl}`;
    expect(extractGoogleConsentUrl(name, result)).toBe(consentUrl);
  });

  it('matches on the bare tool name too', () => {
    expect(extractGoogleConsentUrl('start_google_auth', consentUrl)).toBe(consentUrl);
  });

  it('returns null when the tool is not start_google_auth', () => {
    expect(extractGoogleConsentUrl('search_gmail_messages', `visit ${consentUrl}`)).toBeNull();
  });

  it('returns null when there is no Google consent URL in the result', () => {
    expect(extractGoogleConsentUrl('start_google_auth', 'Already authenticated for user@example.com')).toBeNull();
  });

  it('does not match a non-accounts.google.com URL (avoids opening arbitrary links)', () => {
    expect(extractGoogleConsentUrl('start_google_auth', 'see https://evil.example.com/o/oauth2/auth')).toBeNull();
  });

  it('strips trailing punctuation/markup around the URL', () => {
    expect(extractGoogleConsentUrl('start_google_auth', `Open (${consentUrl}).`)).toBe(consentUrl);
    expect(extractGoogleConsentUrl('start_google_auth', `URL: "${consentUrl}"`)).toBe(consentUrl);
  });

  it('is safe for non-string / empty inputs', () => {
    expect(extractGoogleConsentUrl(undefined, consentUrl)).toBeNull();
    expect(extractGoogleConsentUrl('start_google_auth', undefined)).toBeNull();
    expect(extractGoogleConsentUrl('start_google_auth', { url: consentUrl } as unknown)).toBeNull();
  });
});
