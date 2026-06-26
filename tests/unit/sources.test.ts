/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { faviconFor, parseWcoreSearchOutput, codexResultsToSources } from '../../src/common/chat/activity/sources';
import type { SearchResult } from '../../src/common/types/codex/types/eventData';

describe('sources.faviconFor', () => {
  it('returns a google favicon URL for a valid URL', () => {
    const result = faviconFor('https://example.com/page');
    expect(result).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=32');
  });

  it('strips www. from the domain', () => {
    const result = faviconFor('https://www.reuters.com/world');
    expect(result).toBe('https://www.google.com/s2/favicons?domain=reuters.com&sz=32');
  });

  it('returns undefined for an invalid URL', () => {
    expect(faviconFor('not a url')).toBeUndefined();
    expect(faviconFor('')).toBeUndefined();
  });
});

describe('sources.parseWcoreSearchOutput', () => {
  it('parses an array-at-root shape', () => {
    const out = parseWcoreSearchOutput(JSON.stringify([{ title: 'Reuters', url: 'https://reuters.com' }]));
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ title: 'Reuters', url: 'https://reuters.com', domain: 'reuters.com' });
    expect(out[0].favicon).toBe('https://www.google.com/s2/favicons?domain=reuters.com&sz=32');
  });

  it('parses a { results: [...] } shape', () => {
    const payload = { results: [{ title: 'BBC', url: 'https://bbc.com' }, { title: 'CNN', url: 'https://cnn.com' }] };
    const out = parseWcoreSearchOutput(JSON.stringify(payload));
    expect(out).toHaveLength(2);
    expect(out[0].title).toBe('BBC');
    expect(out[1].domain).toBe('cnn.com');
  });

  it('parses a { sources: [...] } shape', () => {
    const payload = { sources: [{ title: 'AP', url: 'https://apnews.com' }] };
    const out = parseWcoreSearchOutput(JSON.stringify(payload));
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('AP');
  });

  it('parses the native wcore web tool { data: { web: [...] } } shape', () => {
    // Real shape captured live from the Flux `web` tool (operation=search).
    const payload = {
      data: {
        web: [
          { title: 'OpenAI: Latest News - WinBuzzer', url: 'https://winbuzzer.com/ai/openai/', snippet: '# **OpenAI**' },
          { title: 'OpenAI News', url: 'https://openai.com/news', snippet: '* Research' },
        ],
      },
      success: true,
    };
    const out = parseWcoreSearchOutput(JSON.stringify(payload));
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ title: 'OpenAI: Latest News - WinBuzzer', domain: 'winbuzzer.com', snippet: '# **OpenAI**' });
    expect(out[1].domain).toBe('openai.com');
  });

  it('returns [] for a plain prose string (not JSON)', () => {
    expect(parseWcoreSearchOutput('Here are the results for your search query.')).toEqual([]);
  });

  it('returns [] for malformed JSON', () => {
    expect(parseWcoreSearchOutput('{bad json')).toEqual([]);
  });

  it('returns [] for an empty string', () => {
    expect(parseWcoreSearchOutput('')).toEqual([]);
  });

  it('returns [] for a JSON object that is not an array or known shape', () => {
    expect(parseWcoreSearchOutput(JSON.stringify({ data: 'something' }))).toEqual([]);
  });

  it('skips items without both title and url', () => {
    const out = parseWcoreSearchOutput(JSON.stringify([{}, { title: 'Only title' }, { url: 'https://example.com' }]));
    // {} is skipped; the other two have at least one of title/url
    expect(out).toHaveLength(2);
    expect(out[0].title).toBe('Only title');
    expect(out[1].url).toBe('https://example.com');
  });
});

describe('sources.codexResultsToSources', () => {
  it('maps SearchResult[] to Source[] with domain and favicon', () => {
    const results: SearchResult[] = [
      { title: 'AP News', url: 'https://apnews.com/article/test', snippet: 'Breaking news' },
      { title: 'BBC', url: 'https://www.bbc.com/news', score: 0.9 },
    ];
    const sources = codexResultsToSources(results);
    expect(sources).toHaveLength(2);
    expect(sources[0]).toMatchObject({ title: 'AP News', url: 'https://apnews.com/article/test', domain: 'apnews.com', snippet: 'Breaking news' });
    expect(sources[0].favicon).toBe('https://www.google.com/s2/favicons?domain=apnews.com&sz=32');
    expect(sources[1].domain).toBe('bbc.com');
  });

  it('skips results without title and url', () => {
    const results: SearchResult[] = [{ score: 0.5 }, { title: 'Something', url: 'https://example.com' }];
    const sources = codexResultsToSources(results);
    expect(sources).toHaveLength(1);
    expect(sources[0].title).toBe('Something');
  });

  it('handles urls with no domain gracefully', () => {
    const results: SearchResult[] = [{ title: 'Local', url: 'not-a-url' }];
    const sources = codexResultsToSources(results);
    expect(sources).toHaveLength(1);
    expect(sources[0].domain).toBeUndefined();
    expect(sources[0].favicon).toBeUndefined();
  });
});
