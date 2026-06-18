/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Discover voice models on HuggingFace beyond the curated in-repo catalog.
 *
 * Queries the public HF model search API and maps hits to
 * {@link VoiceModelEntry}-compatible objects so the settings picker can consume
 * a search result exactly like a built-in catalog entry. Results are filtered to
 * the architecture families our local engines can actually load, and labelled
 * with a `trust` hint so the UI can surface how confident we are that a repo
 * will work:
 *
 * - 'community': the repo id/tags match a family our engine supports. Not
 *   first-party-verified, but a reasonable bet to load.
 * - 'unverified': nothing matched a known family. Still returned (flagged) so
 *   power users can attempt it, rather than silently dropped.
 *
 * Pure renderer-side `fetch`. No throwing: any network / non-200 / parse error
 * resolves to `[]`. Debouncing is the caller's responsibility.
 */

import type { VoiceModelEntry, VoiceModelKind } from '@/common/voice/voiceModelCatalog';

export type HfTrust = 'community' | 'unverified';

export type HfSearchResult = VoiceModelEntry & {
  trust: HfTrust;
  downloads?: number;
};

/** Shape of the fields we read off the HF `/api/models` search response. */
type HfApiModel = {
  id?: string;
  modelId?: string;
  author?: string;
  downloads?: number;
  tags?: string[];
};

const HF_API_BASE = 'https://huggingface.co/api/models';
const DEFAULT_LIMIT = 20;

/**
 * Architecture families each local engine can load. Matched as a
 * case-insensitive substring against the repo id and its tags.
 */
const SUPPORTED_FAMILIES: Record<VoiceModelKind, readonly string[]> = {
  // mlx-audio supported TTS architectures.
  tts: ['kokoro', 'f5', 'csm', 'dia', 'orpheus', 'spark', 'oute', 'bark'],
  // whisper-local + compatible CTranslate/parakeet/moonshine STT families.
  stt: ['whisper', 'parakeet', 'moonshine'],
};

/** Engine that consumes a given kind's search hits. */
const ENGINE_FOR_KIND: Record<VoiceModelKind, string> = {
  tts: 'mlx-audio-local',
  stt: 'whisper-local',
};

const buildSearchUrl = (query: string, limit: number): string => {
  const params = new URLSearchParams({
    search: query,
    limit: String(limit),
    sort: 'downloads',
    direction: '-1',
  });
  return `${HF_API_BASE}?${params.toString()}`;
};

/** Last path segment of a repo id, used as a human label. */
const repoName = (id: string): string => {
  const segs = id.split('/');
  return segs[segs.length - 1] || id;
};

/** Author portion of a repo id, falling back to the API `author` field. */
const repoAuthor = (id: string, author?: string): string => {
  if (author) return author;
  const segs = id.split('/');
  return segs.length > 1 ? segs[0] : 'unknown';
};

const haystackFor = (model: HfApiModel, id: string): string =>
  [id, ...(model.tags ?? [])].join(' ').toLowerCase();

/** Whether a repo matches a supported family for the requested kind. */
const matchesFamily = (haystack: string, kind: VoiceModelKind): boolean =>
  SUPPORTED_FAMILIES[kind].some((fam) => haystack.includes(fam));

/** Whether the repo carries an explicit mlx tag (preferred for TTS). */
const isMlxTagged = (haystack: string): boolean => haystack.includes('mlx');

const formatBlurb = (author: string, downloads?: number): string => {
  const dl = typeof downloads === 'number' ? downloads.toLocaleString() : '0';
  return `${author} · ${dl} downloads`;
};

const toEntry = (model: HfApiModel, kind: VoiceModelKind): HfSearchResult | null => {
  const id = model.id ?? model.modelId;
  if (!id) return null;

  const haystack = haystackFor(model, id);
  const trust: HfTrust = matchesFamily(haystack, kind) ? 'community' : 'unverified';
  const author = repoAuthor(id, model.author);

  return {
    kind,
    engineId: ENGINE_FOR_KIND[kind],
    modelId: id,
    label: repoName(id),
    hfId: id,
    sizeLabel: '',
    blurb: formatBlurb(author, model.downloads),
    ...(kind === 'tts' ? { platform: 'darwin-arm64' as const } : {}),
    local: true,
    trust,
    downloads: model.downloads,
  };
};

/**
 * Order results so the most-loadable rise to the top: 'community' before
 * 'unverified', then mlx-tagged repos (for TTS), then by download count.
 */
const rank = (a: HfSearchResult, b: HfSearchResult): number => {
  if (a.trust !== b.trust) return a.trust === 'community' ? -1 : 1;
  const aMlx = isMlxTagged(`${a.modelId}`.toLowerCase());
  const bMlx = isMlxTagged(`${b.modelId}`.toLowerCase());
  if (aMlx !== bMlx) return aMlx ? -1 : 1;
  return (b.downloads ?? 0) - (a.downloads ?? 0);
};

/**
 * Search HuggingFace for voice models loadable by our local engines.
 *
 * @param query free-text search; an empty/whitespace query short-circuits to [].
 * @param kind  'tts' (mlx-audio families) or 'stt' (whisper families).
 * @param limit max repos to request from HF (default 20).
 * @returns mapped, family-filtered, trust-labelled results. Never throws.
 */
export const searchVoiceModels = async (
  query: string,
  kind: VoiceModelKind,
  limit: number = DEFAULT_LIMIT,
): Promise<HfSearchResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const res = await fetch(buildSearchUrl(trimmed, limit));
    if (!res.ok) return [];

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];

    return (data as HfApiModel[])
      .map((model) => toEntry(model, kind))
      .filter((entry): entry is HfSearchResult => entry !== null)
      .sort(rank);
  } catch {
    return [];
  }
};
