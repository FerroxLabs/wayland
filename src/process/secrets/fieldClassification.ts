/**
 * Sensitive credential-field classification.
 *
 * Every channel plugin (Slack, Twilio, AgentMail, Lark, DingTalk, etc.) stores
 * its credentials as a flat `IPluginCredentials` record. Fields whose name
 * matches one of {@link SENSITIVE_FIELD_NAMES} MUST be encrypted at rest via
 * the secrets module before being written to the database.
 *
 * New plugin authors: if a plugin's `IPluginCredentials` includes a token-like
 * field not listed here, add it. The tests for this module fail when a new
 * sensitive field name is added without updating the test list - that
 * intentional break forces an explicit opt-in review.
 */

/**
 * Canonical list of credential field names that must be encrypted at rest.
 * Matching is case-insensitive and substring-based (see {@link isSensitiveField}).
 */
export const SENSITIVE_FIELD_NAMES: readonly string[] = [
  'token',
  'authToken',
  'accessToken',
  'refreshToken',
  'appSecret',
  'signingSecret',
  'apiKey',
  'password',
  'channelSecret',
  'channelAccessToken',
  'verifyToken',
  'webhookSecret',
  'botToken',
  'appToken',
  'appPassword',
];

/**
 * Returns `true` if `fieldName` contains any of the canonical sensitive
 * field names. Matching is case-insensitive AND format-insensitive -
 * underscores and hyphens are stripped before comparison so that
 * `slackBotToken`, `MY_API_KEY`, `refresh_token`, `app-secret`, and
 * `whatsapp_access_token` all match.
 */
export function isSensitiveField(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase().replace(/[_-]/g, '');
  for (const sensitive of SENSITIVE_FIELD_NAMES) {
    if (normalized.includes(sensitive.toLowerCase())) {
      return true;
    }
  }
  return false;
}
