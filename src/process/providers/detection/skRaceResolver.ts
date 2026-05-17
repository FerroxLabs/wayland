import type { ProviderId } from '../types';
import { PROVIDER_ENDPOINTS } from './providerEndpoints';

export type SkRaceResult =
  | { kind: 'matched'; provider: ProviderId }
  | { kind: 'multiple'; providers: ProviderId[] }
  | { kind: 'none'; tried: ProviderId[] };

type FetchFn = typeof fetch;

const RACE_TIMEOUT_MS = 800;
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Resolves ambiguous bare `sk-` keys by racing parallel /v1/models calls.
 * Inject `fetchFn` in tests to avoid real network calls.
 */
export class SkRaceResolver {
  private readonly fetchFn: FetchFn;

  constructor(fetchFn: FetchFn = fetch) {
    this.fetchFn = fetchFn;
  }

  async resolve(key: string, candidates: ProviderId[]): Promise<SkRaceResult> {
    const matched: ProviderId[] = [];

    const raceController = new AbortController();
    const raceTimer = setTimeout(() => raceController.abort(), RACE_TIMEOUT_MS);

    try {
      const probes = candidates.map((provider) => this.probe(key, provider, raceController.signal));
      const results = await Promise.allSettled(probes);

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === 'fulfilled' && r.value === true) {
          matched.push(candidates[i]);
        }
      }
    } finally {
      clearTimeout(raceTimer);
    }

    if (matched.length === 1) return { kind: 'matched', provider: matched[0] };
    if (matched.length > 1) return { kind: 'multiple', providers: matched };
    return { kind: 'none', tried: candidates };
  }

  private async probe(key: string, provider: ProviderId, raceSignal: AbortSignal): Promise<boolean> {
    const url = PROVIDER_ENDPOINTS[provider];
    if (!url) return false;

    const reqController = new AbortController();
    const reqTimer = setTimeout(() => reqController.abort(), REQUEST_TIMEOUT_MS);

    // Abort the per-request controller when the race is over
    const onRaceAbort = () => reqController.abort();
    raceSignal.addEventListener('abort', onRaceAbort, { once: true });

    try {
      const res = await this.fetchFn(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
          'User-Agent': 'Wayland/1.0',
        },
        signal: reqController.signal,
      });
      // 200 = accepted; 401/403 = explicit reject; anything else = inconclusive
      return res.status === 200;
    } catch {
      return false;
    } finally {
      clearTimeout(reqTimer);
      raceSignal.removeEventListener('abort', onRaceAbort);
    }
  }
}
