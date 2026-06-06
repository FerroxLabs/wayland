/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One-shot Gemini completion for users who connected via "Continue with Google"
 * (OAuth, no API key). The legacy `model.config` mirror deliberately skips
 * google-auth providers, so `oneShotComplete`'s key-based path can't see them -
 * yet Google is the primary onboarding path. This routes a single stateless call
 * through the SAME Code Assist content generator the Gemini agent uses, reusing
 * its OAuth load + token-refresh + project onboarding. Used as the fallback in
 * `oneShotComplete` when the user has no keyed model.
 *
 * `gemini-2.5-flash-lite` is the model: it's in the free OAuth catalog, is the
 * cheapest/fastest, and (unlike `2.5-flash`) does not spend the output budget on
 * thinking tokens - so short tasks like titles return real text, not a stub.
 */

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** The model used for google-auth one-shots (free OAuth catalog, no thinking spend). */
const GOOGLE_AUTH_MODEL = 'gemini-2.5-flash-lite';

/** Minimal shape of the Code Assist content generator we actually call. */
type CodeAssistGenerator = {
  generateContent: (
    req: { model: string; contents: unknown; config?: Record<string, unknown> },
    userPromptId: string
  ) => Promise<{ text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }>;
};

/**
 * Whether the user has signed in with Google (Gemini OAuth credentials exist).
 * Presence-only - the actual token validity/refresh is handled lazily by the
 * Code Assist OAuth client when a call is made. Cheap (one stat), never throws.
 */
export function isGoogleAuthGeminiAvailable(): boolean {
  try {
    return existsSync(join(homedir(), '.gemini', 'oauth_creds.json'));
  } catch {
    return false;
  }
}

// The Code Assist generator's setup does network onboarding (loadCodeAssist /
// onboardUser), so build it once and reuse across calls. On failure the cache is
// cleared so the next call retries cleanly.
let cachedGenerator: Promise<CodeAssistGenerator> | null = null;

function buildGenerator(): Promise<CodeAssistGenerator> {
  return (async () => {
    // Dynamic import: the core lib is heavy and must not enter any boot graph.
    const core = (await import('@office-ai/aioncli-core')) as unknown as {
      createCodeAssistContentGenerator: (
        httpOptions: { headers: Record<string, string> },
        authType: string,
        config: unknown,
        sessionId: string
      ) => Promise<CodeAssistGenerator>;
      AuthType: { LOGIN_WITH_GOOGLE: string };
    };
    // Minimal config stub - getOauthClient/setupUser only read getProxy() and
    // isBrowserLaunchSuppressed(); createCodeAssistContentGenerator reads
    // getValidationHandler(). Suppress browser launch so a background one-shot
    // can never pop an interactive auth window: if the cached token can't be
    // refreshed silently the call fails instead of stealing focus.
    const config = {
      getProxy: (): string | undefined => undefined,
      isBrowserLaunchSuppressed: (): boolean => true,
      getValidationHandler: (): undefined => undefined,
    };
    return core.createCodeAssistContentGenerator(
      { headers: { 'User-Agent': 'Wayland/1.0' } },
      core.AuthType.LOGIN_WITH_GOOGLE,
      config,
      'wayland-oneshot'
    );
  })().catch((err) => {
    cachedGenerator = null;
    throw err;
  });
}

/**
 * Make a single Gemini completion over the user's Google OAuth session. Returns
 * the response text. Throws on auth/network failure or timeout - the caller
 * (`oneShotComplete`) lets that propagate so its own caller can fall back.
 */
export async function googleAuthGeminiComplete(
  prompt: string,
  opts?: { maxTokens?: number; timeoutMs?: number }
): Promise<string> {
  if (!cachedGenerator) cachedGenerator = buildGenerator();
  const generator = await cachedGenerator;

  const controller = new AbortController();
  const timer = opts?.timeoutMs ? setTimeout(() => controller.abort(), opts.timeoutMs) : undefined;
  try {
    const res = await generator.generateContent(
      {
        model: GOOGLE_AUTH_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { maxOutputTokens: opts?.maxTokens ?? 80, abortSignal: controller.signal },
      },
      'wayland-oneshot'
    );
    const text =
      res.text ?? res.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    return text.trim();
  } finally {
    if (timer) clearTimeout(timer);
  }
}
