/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Which local Ollama models can actually think.
 *
 * Thinking is a property of the MODEL, not of the provider: Ollama decides it
 * per model by scanning the chat template, and a model without it does not
 * merely ignore a reasoning request, it fails the turn. Measured against a live
 * daemon (0.34.1) on `qwen2.5:0.5b`, POST `/v1/chat/completions`:
 *
 *   reasoning_effort "none"                -> 200, normal completion
 *   reasoning_effort low/medium/high/max   -> error, does not support thinking
 *   reasoning_effort minimal/xhigh         -> the same error
 *
 * `POST /api/show` with `{ "model": "<name>" }` answers the question up front:
 * its `capabilities` array lists `completion` always and `thinking` only when
 * the model has it.
 *
 * Every failure resolves to "not capable", never to an error and never to a
 * guess: a daemon that is down, a model that is not pulled, a build old enough
 * to omit `capabilities`, or a body that does not parse all mean the caller
 * offers nothing, which is exactly today's behaviour.
 */

/** Ollama reports this in `capabilities` for a model that can think. */
const THINKING_CAPABILITY = 'thinking';

/**
 * How long a single `/api/show` may take.
 *
 * Matches the daemon liveness probe in `ollamaRuntime.ts`. A daemon that is
 * down refuses the loopback connection at once rather than timing out, so the
 * cap only bites when something is listening and wedged.
 */
const SHOW_TIMEOUT_MS = 2_000;

/** True when `/api/show` lists `thinking` for this model. Never throws. */
async function modelCanThink(rootUrl: string, model: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SHOW_TIMEOUT_MS);
  try {
    const res = await fetch(`${rootUrl}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const body: unknown = await res.json();
    const capabilities = (body as { capabilities?: unknown })?.capabilities;
    return Array.isArray(capabilities) && capabilities.includes(THINKING_CAPABILITY);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The subset of `models` this daemon reports as thinking-capable.
 *
 * `rootUrl` is the daemon root (`http://127.0.0.1:11434`), not the
 * OpenAI-compatible `/v1` base: `/api/show` is a native endpoint. Probes run
 * together, so the whole answer costs one round trip's worth of wall clock.
 */
export async function ollamaThinkingModels(rootUrl: string, models: readonly string[]): Promise<ReadonlySet<string>> {
  const unique = [...new Set(models)];
  const results = await Promise.all(unique.map((model) => modelCanThink(rootUrl, model)));
  return new Set(unique.filter((_, i) => results[i]));
}
