/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * API-key provider catalog source (main process).
 *
 * Fetches a standard `/v1/models`-style endpoint for a single API-key provider
 * and normalizes the response to `RawModel[]`. Handles the three real-world
 * response shapes (OpenAI, Anthropic, Google Gemini) plus their pagination.
 *
 * Cloud providers (Bedrock / Vertex / Azure) do NOT expose a models endpoint
 * and are out of scope here — they have no entry in `PROVIDER_ENDPOINTS`, so a
 * `listModels()` call for one fails with a typed `unknown` error.
 */

import type { CatalogSource } from './CatalogSource';
import type { ConnectError, ProviderId, RawModel } from '../types';
import { PROVIDER_ENDPOINTS } from '../detection/providerEndpoints';
import type { AuthStrategy } from '../detection/providerAuth';
import { ANTHROPIC_VERSION, appendQuery, authStrategyFor } from '../detection/providerAuth';

/** Per-request fetch timeout — a slow provider must not stall the catalog. */
const FETCH_TIMEOUT_MS = 15_000;
/** Hard ceiling on pagination loops — a misbehaving provider cannot hang us. */
const MAX_PAGES = 50;

/**
 * A typed failure from a catalog source. The `code` is a `ConnectError` the
 * caller (later packets) maps to UI state without re-inspecting HTTP details.
 */
export class ProviderSourceError extends Error {
  readonly code: ConnectError;

  constructor(code: ConnectError, message: string) {
    super(message);
    this.name = 'ProviderSourceError';
    this.code = code;
  }
}

/** A single model object as it may appear in a provider response. */
type RawModelObject = {
  id?: unknown;
  name?: unknown;
  display_name?: unknown;
};

/** A normalized page: the models on it plus an optional cursor for the next. */
type ParsedPage = { models: RawModel[]; nextCursor: NextCursor | null };

/** How to ask for the page after the current one. */
type NextCursor = { param: 'after_id' | 'pageToken'; value: string };

export class ApiProviderSource implements CatalogSource {
  readonly kind = 'api' as const;
  readonly providerId: ProviderId;

  private readonly apiKey: string;

  constructor(providerId: ProviderId, apiKey: string) {
    this.providerId = providerId;
    this.apiKey = apiKey;
  }

  /**
   * Fetch and normalize every model the provider exposes, following pagination
   * until exhausted. A 200 with no models yields `[]`; any non-200, network
   * failure, error-shaped 200 body, or runaway pagination throws a
   * `ProviderSourceError`.
   */
  async listModels(): Promise<RawModel[]> {
    const endpoint = PROVIDER_ENDPOINTS[this.providerId];
    if (!endpoint) {
      throw new ProviderSourceError('unknown', `No models endpoint registered for provider "${this.providerId}"`);
    }

    const auth = authStrategyFor(this.providerId);
    // Gemini-style providers authenticate via a query parameter on every
    // request, so it must be baked into the base URL before pagination.
    const baseUrl = auth.kind === 'query' ? appendQuery(endpoint, auth.param, this.apiKey) : endpoint;

    const models: RawModel[] = [];
    let cursor: NextCursor | null = null;

    for (let page = 0; page < MAX_PAGES; page++) {
      const url = cursor ? appendQuery(baseUrl, cursor.param, cursor.value) : baseUrl;
      // Pagination is inherently sequential: each page's cursor comes from the
      // previous response, so the awaits cannot be parallelized.
      // oxlint-disable-next-line no-await-in-loop
      const body = await this.fetchPage(url, auth);
      const parsed = this.parsePage(body);
      models.push(...parsed.models);
      cursor = parsed.nextCursor;
      if (!cursor) return models;
    }

    // The loop exited via the MAX_PAGES cap while a cursor was still pending —
    // a stuck or oversized cursor, which is a provider fault, not a partial list.
    throw new ProviderSourceError(
      'unknown',
      `Provider "${this.providerId}" exceeded the ${MAX_PAGES}-page pagination limit`
    );
  }

  /** Fetch one page, mapping every failure mode onto a `ProviderSourceError`. */
  private async fetchPage(url: string, auth: AuthStrategy): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: this.requestHeaders(auth),
      });
    } catch (err) {
      // A network/DNS failure or an abort (timeout) — the provider is unreachable.
      throw new ProviderSourceError('offline', describeError(err));
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      throw await this.classifyHttpError(res);
    }

    try {
      return await res.json();
    } catch {
      // 200 but an unparseable body — treat as an unknown provider fault.
      throw new ProviderSourceError('unknown', `Provider returned a non-JSON body (${res.status})`);
    }
  }

  /**
   * Auth + identification headers for a `/v1/models` request. The auth headers
   * vary by provider: OpenAI-compatible providers use `Authorization: Bearer`,
   * Anthropic uses `x-api-key` + `anthropic-version`, and Gemini-style providers
   * carry no auth header at all (their key rides on the URL).
   */
  private requestHeaders(auth: AuthStrategy): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'Wayland/1.0',
    };
    switch (auth.kind) {
      case 'bearer':
        headers.Authorization = `Bearer ${this.apiKey}`;
        break;
      case 'anthropic':
        headers['x-api-key'] = this.apiKey;
        headers['anthropic-version'] = ANTHROPIC_VERSION;
        break;
      case 'query':
        // Key travels as a URL query parameter — no auth header.
        break;
    }
    return headers;
  }

  /** Map a non-200 response onto a typed `ProviderSourceError`. */
  private async classifyHttpError(res: Response): Promise<ProviderSourceError> {
    let body = '';
    try {
      body = await res.text();
    } catch {
      // Body unavailable — fall back to status-only classification.
    }

    const code = classifyStatus(res.status, body);
    return new ProviderSourceError(code, `Provider responded ${res.status}`);
  }

  /** Normalize one response body into models plus an optional next-page cursor. */
  private parsePage(body: unknown): ParsedPage {
    if (!isRecord(body)) return { models: [], nextCursor: null };

    // Google Gemini: { models: [{ name: "models/..." }], nextPageToken? }
    if (Array.isArray(body['models'])) {
      const models = body['models'].map((entry) => this.toGeminiModel(entry)).filter((m): m is RawModel => m !== null);
      const token = body['nextPageToken'];
      const nextCursor =
        typeof token === 'string' && token.length > 0 ? ({ param: 'pageToken', value: token } as const) : null;
      return { models, nextCursor };
    }

    // OpenAI / Anthropic: { data: [{ id, display_name? }], has_more?, last_id? }
    if (Array.isArray(body['data'])) {
      const models = body['data'].map((entry) => this.toDataModel(entry)).filter((m): m is RawModel => m !== null);
      const hasMore = body['has_more'] === true;
      const lastId = body['last_id'];
      const nextCursor =
        hasMore && typeof lastId === 'string' && lastId.length > 0
          ? ({ param: 'after_id', value: lastId } as const)
          : null;
      return { models, nextCursor };
    }

    // A 200 carrying an `error`-shaped body (e.g. an insufficient-quota error)
    // is a failure dressed as success — surface it instead of "no models".
    if (isRecord(body['error']) || typeof body['error'] === 'string') {
      const text = describeErrorBody(body['error']);
      const code = mentionsBilling(text) ? 'no-credit' : 'unknown';
      throw new ProviderSourceError(code, `Provider returned an error body: ${text}`);
    }

    // A 200 with no recognizable model field — honestly empty, not an error.
    return { models: [], nextCursor: null };
  }

  /** Normalize an OpenAI/Anthropic `data[]` entry: id required, display_name optional. */
  private toDataModel(entry: unknown): RawModel | null {
    if (!isRecord(entry)) return null;
    const raw = entry as RawModelObject;
    if (typeof raw.id !== 'string' || raw.id.length === 0) return null;

    const model: RawModel = { id: raw.id, providerId: this.providerId };
    if (typeof raw.display_name === 'string' && raw.display_name.length > 0) {
      model.rawName = raw.display_name;
    }
    return model;
  }

  /** Normalize a Gemini `models[]` entry: id derives from `name`, sans `models/` prefix. */
  private toGeminiModel(entry: unknown): RawModel | null {
    if (!isRecord(entry)) return null;
    const raw = entry as RawModelObject;
    if (typeof raw.name !== 'string' || raw.name.length === 0) return null;

    const id = raw.name.startsWith('models/') ? raw.name.slice('models/'.length) : raw.name;
    if (id.length === 0) return null;
    return { id, providerId: this.providerId, rawName: id };
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Classify an HTTP status (and optional body) into a `ConnectError` code. */
function classifyStatus(status: number, body: string): ConnectError {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 402) return 'no-credit';
  if (mentionsBilling(body)) return 'no-credit';
  return 'unknown';
}

/** True when an error body reads like a quota/billing/credit exhaustion. */
function mentionsBilling(body: string): boolean {
  const text = body.toLowerCase();
  return (
    text.includes('quota') ||
    text.includes('billing') ||
    text.includes('insufficient') ||
    text.includes('payment') ||
    text.includes('credit')
  );
}

/** Flatten an `error` field (string, or `{ message?, type? }`) into searchable text. */
function describeErrorBody(error: unknown): string {
  if (typeof error === 'string') return error;
  if (isRecord(error)) {
    const parts = [error['message'], error['type'], error['code']].filter((p) => typeof p === 'string');
    if (parts.length > 0) return parts.join(' ');
  }
  return 'provider error';
}

/** A human-readable description for a thrown network error. */
function describeError(err: unknown): string {
  if (err instanceof Error) {
    return err.name === 'AbortError' ? 'Request timed out' : err.message;
  }
  return 'Network request failed';
}

/** Narrow an `unknown` to a plain object record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
