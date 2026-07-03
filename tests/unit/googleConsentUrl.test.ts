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

  // Real, verbatim output captured from the taylorwilsdon workspace-mcp start_google_auth
  // tool: a multi-line block where the (very long, many-scope, PKCE) URL sits on its own
  // indented line and is followed by more prose. Locks in that the extraction survives the
  // real shape — the '+'-joined scope list, %-encoding, code_challenge and trailing login_hint.
  it('extracts the full URL from the real multi-line start_google_auth output', () => {
    const realOutput =
      "**ACTION REQUIRED: Google Authentication Needed for gmail for 'user@example.com'**\n\n" +
      '1. The authorization page has been **automatically opened in your browser**.\n' +
      '   If it did not appear, open this URL manually:\n' +
      '   Authorization URL: https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=1012723604691-0kcleek3i1o276jb6g2rk4vvqimoqgjf.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Foauth2callback&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.compose+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly+openid&state=049aa570355022ca3fa1b5c655b19b8c&code_challenge=AvEE7Z-RtYtGzF_R7S3i9ajAaKmNHxcqV2szHRZ2Llk&code_challenge_method=S256&access_type=offline&prompt=consent&login_hint=user%40example.com\n' +
      '2. After successful authorization, **retry their original command**.';
    const url = extractGoogleConsentUrl('io-github-taylorwilsdon-google-workspace-mcp__start_google_auth', realOutput);
    expect(url).toContain('https://accounts.google.com/o/oauth2/auth?response_type=code');
    expect(url).toContain('login_hint=user%40example.com');
    // Must NOT swallow the following prose line.
    expect(url).not.toContain('After successful authorization');
    expect(url).not.toContain('\n');
  });
});
