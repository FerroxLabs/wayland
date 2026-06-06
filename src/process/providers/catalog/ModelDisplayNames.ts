import type { ProviderId } from '../types';

/**
 * Humanisation pipeline for raw model IDs.
 *
 * Pipeline order:
 *   1. Strip vendor path prefix (^anthropic\., ^models/, ^meta\.)
 *   2. Strip date suffix (-YYYYMMDD or -YYYY-MM-DD)
 *   3. Strip version suffix (-vN.N or -NNN / Vertex -001)
 *   4. Normalise known version dot patterns (claude-3-5 → claude-3.5, gemini-1-5 → gemini-1.5)
 *   5. Glossary capitalisation
 *   6. Title-case remaining segments
 */
export class ModelDisplayNames {
  humanise(modelId: string, _provider: ProviderId): string {
    let s = modelId;

    // 1. Strip vendor path prefix
    s = s.replace(/^(anthropic\.|meta\.|models\/)/, '');

    // 2. Strip date suffix: -YYYYMMDD or -YYYY-MM-DD
    s = s.replace(/-\d{4}-\d{2}-\d{2}$/, '').replace(/-\d{8}$/, '');

    // 3. Strip Vertex-style version suffix (-001, -002, etc.) and semver-like (-v1.0, -v2)
    s = s.replace(/-v\d+(\.\d+)?$/i, '').replace(/-\d{3}$/, '');

    // 4. Normalise hyphenated version numbers → dotted
    //    e.g. claude-3-5 → claude-3.5, gemini-1-5 → gemini-1.5, gpt-4-5 → gpt-4.5
    s = normaliseVersionDots(s);

    // 5 + 6. Capitalise segments
    s = capitaliseSegments(s);

    return s.trim();
  }
}

/**
 * Convert patterns like `-3-5` or `-1-5` (digit-hyphen-digit at a word boundary)
 * into `-3.5` / `-1.5` so they render as version numbers.
 */
function normaliseVersionDots(s: string): string {
  // Replace sequences of: -<digit(s)>-<digit(s)> that look like version pairs
  // e.g. "claude-3-5-sonnet" → "claude-3.5-sonnet"
  //      "gemini-1-5-pro"    → "gemini-1.5-pro"
  //      "gpt-4-5"           → "gpt-4.5"
  return s.replace(/(?<=-\d+)-(\d+)(?=-|$)/g, '.$1');
}

const GLOSSARY: [RegExp, string][] = [
  [/\bgpt\b/gi, 'GPT'],
  [/\bclaude\b/gi, 'Claude'],
  [/\bgemini\b/gi, 'Gemini'],
  [/\bgrok\b/gi, 'Grok'],
  [/\bdeepseek\b/gi, 'DeepSeek'],
  [/\bmistral\b/gi, 'Mistral'],
  [/\bcohere\b/gi, 'Cohere'],
  [/\bllama\b/gi, 'Llama'],
  [/\bwhisper\b/gi, 'Whisper'],
  [/\bdall-e\b/gi, 'DALL-E'],
  [/\bqwen\b/gi, 'Qwen'],
];

function capitaliseSegments(s: string): string {
  // Split on hyphens to get tokens, title-case each, then apply glossary
  const tokens = s.split('-').map((tok) => {
    if (!tok) return tok;
    // Preserve: purely numeric, version numbers (e.g. "4o", "3.5"), o-series (o1, o3, o4)
    if (/^\d/.test(tok)) return tok;
    if (/^o\d/.test(tok)) return tok; // o1, o3, o4 - spec: keep lowercase-with-number
    return tok.charAt(0).toUpperCase() + tok.slice(1);
  });

  let result = tokens.join(' ');

  // Apply glossary replacements (case-insensitive, word-boundary)
  for (const [pattern, replacement] of GLOSSARY) {
    result = result.replace(pattern, replacement);
  }

  return result;
}
