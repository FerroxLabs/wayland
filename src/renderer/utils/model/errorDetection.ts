/**
 * Pure string-matching functions for detecting specific error types
 * in model API responses.
 */

/**
 * Detect quota/rate-limit error messages by matching common quota-related
 * keywords together with limit/exceeded indicators.
 */
export const isQuotaErrorMessage = (data: unknown): boolean => {
  if (typeof data !== 'string') return false;
  const text = data.toLowerCase();
  const hasQuota =
    text.includes('quota') ||
    text.includes('resource_exhausted') ||
    text.includes('model_capacity_exhausted') ||
    text.includes('no capacity available');
  const hasLimit =
    text.includes('limit') ||
    text.includes('exceed') ||
    text.includes('exhaust') ||
    text.includes('status: 429') ||
    text.includes('code 429') ||
    text.includes('429') ||
    text.includes('ratelimitexceeded');
  return hasQuota && hasLimit;
};

/**
 * Detect API key errors (user configuration issues that should not
 * trigger automatic model switching).
 */
export const isApiKeyError = (data: unknown): boolean => {
  let text = '';
  if (typeof data === 'string') {
    text = data.toLowerCase();
  } else if (data && typeof data === 'object') {
    try {
      text = JSON.stringify(data).toLowerCase();
    } catch {
      return false;
    }
  } else {
    return false;
  }

  // Detect API key related errors - these are user config issues
  const hasInvalidApiKey =
    text.includes('api key not valid') ||
    text.includes('api_key_invalid') ||
    text.includes('invalid api key') ||
    text.includes('google_api_key');
  return hasInvalidApiKey;
};

/**
 * Detect provider errors raised because the selected model has no endpoint
 * that supports tool calling. The engine always attaches its built-in tools,
 * so tool-incapable models (e.g. OpenRouter's Aion-1.0) hard-fail the turn.
 * Matches the OpenRouter 404 signature and the sibling Compound/Groq variant.
 */
export const isToolUnsupportedErrorMessage = (data: unknown): boolean => {
  if (typeof data !== 'string') return false;
  const text = data.toLowerCase();
  return (
    text.includes('no endpoints found that support tool use') ||
    text.includes('tool calling` is not supported') ||
    text.includes('tool calling is not supported')
  );
};

/**
 * Detect the engine's terminal context-window-ceiling error. Wayland Core stops
 * a run when the estimated request size exceeds the model's context window and
 * history compaction can no longer shrink it, emitting e.g. "Run stopped:
 * estimated request size (178458) reached the context-window ceiling (177000)
 * for model 'flux-auto', and compaction could not reduce it further." The fix is
 * to switch to a model with a larger context window, so the desktop surfaces a
 * one-click model-switch remedy. Match the stable phrasing, resilient to the
 * embedded token counts and model id.
 */
export const isContextCeilingErrorMessage = (data: unknown): boolean => {
  if (typeof data !== 'string') return false;
  const text = data.toLowerCase();
  return text.includes('context-window ceiling') || text.includes('compaction could not reduce');
};

/**
 * Detect general API errors (400, 401, 403, 404, 5xx, etc.)
 * excluding API key errors which are user configuration issues.
 */
export const isApiErrorMessage = (data: unknown): boolean => {
  // If it's an API key error, don't treat it as an auto-switch API error
  if (isApiKeyError(data)) {
    return false;
  }

  // Convert data to string for inspection
  let text = '';
  if (typeof data === 'string') {
    text = data.toLowerCase();
  } else if (data && typeof data === 'object') {
    try {
      text = JSON.stringify(data).toLowerCase();
    } catch {
      return false;
    }
  } else {
    return false;
  }

  // Detect common API errors (excluding API key errors)
  const hasStatusError = /(?:status|code|error)[:\s]*(?:400|401|403|404|500|502|503|504)/i.test(text);
  const hasInvalidUrl = text.includes('invalid url');
  const hasNotFound = text.includes('not found') || text.includes('notfound');
  const hasUnauthorized = text.includes('unauthorized') || text.includes('authentication');
  const hasForbidden = text.includes('forbidden') || text.includes('access denied');
  const hasInvalidArgument = text.includes('invalid_argument');
  return hasStatusError || hasInvalidUrl || hasNotFound || hasUnauthorized || hasForbidden || hasInvalidArgument;
};
