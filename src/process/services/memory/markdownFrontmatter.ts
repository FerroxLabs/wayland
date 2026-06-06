/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure frontmatter parser for IJFW memory markdown files.
 * Handles the `---\nkey: value\n---\nbody` block format.
 * No external deps.
 */

type FrontmatterValue = string | string[];

type ParsedBlock = {
  frontmatter: Record<string, FrontmatterValue>;
  body: string;
};

/**
 * Decode a single frontmatter scalar.
 *
 * The writer (see `serializeFrontmatterValue` in wikiWriter.ts) emits values
 * that contain YAML-significant characters as JSON-style double-quoted strings
 * (e.g. `"a\nb: c"`), which keeps every value on a single line and prevents
 * block break-out. A leading `"` therefore signals a quoted scalar that must
 * be JSON-parsed back to its original text. Plain values pass through as-is so
 * existing unquoted files keep parsing.
 */
function decodeScalar(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const decoded = JSON.parse(trimmed) as unknown;
      if (typeof decoded === 'string') return decoded;
    } catch {
      // Not a valid JSON string - fall through and treat literally.
    }
  }
  return trimmed;
}

/** Parse a YAML-like tags array: `[a, b, c]` → `['a', 'b', 'c']`. */
function parseTagsArray(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return trimmed ? [decodeScalar(trimmed)] : [];
  }
  const inner = trimmed.slice(1, -1);
  return splitTopLevel(inner)
    .map((t) => decodeScalar(t))
    .filter((t) => t.length > 0);
}

/**
 * Split a tags-array body on top-level commas, respecting JSON-quoted elements
 * so a comma inside a quoted tag does not split it. Falls back to naive
 * comma-splitting for any malformed input.
 */
function splitTopLevel(inner: string): string[] {
  const parts: string[] = [];
  let buf = '';
  let inQuote = false;
  let escaped = false;
  for (const ch of inner) {
    if (inQuote) {
      buf += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inQuote = false;
      }
      continue;
    }
    if (ch === '"') {
      inQuote = true;
      buf += ch;
    } else if (ch === ',') {
      parts.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  parts.push(buf);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

/** Parse a single frontmatter block (lines between `---` markers). */
function parseFrontmatterBlock(fmText: string): Record<string, FrontmatterValue> {
  const result: Record<string, FrontmatterValue> = {};
  const lines = fmText.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (!key) continue;
    if (key === 'tags') {
      result[key] = parseTagsArray(value);
    } else {
      result[key] = decodeScalar(value);
    }
  }
  return result;
}

/**
 * Split a full IJFW memory markdown file into its constituent blocks.
 *
 * Format:
 *   <!-- ijfw-schema: v1 --> (optional file header - skipped)
 *   # Heading (optional file header - skipped)
 *   ---
 *   type: decision
 *   summary: ...
 *   stored: 2026-05-15T06:36:52.422Z
 *   tags: [a, b]
 *   ---
 *   body text ...
 *   ---
 *   type: pattern
 *   ...
 *
 * The file alternates between frontmatter sections (between `---` lines) and
 * body sections. A lone `---` line acts as a separator.
 */
export function parseMarkdownBlocks(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];

  // Normalise line endings.
  const text = content.replace(/\r\n/g, '\n');
  const lines = text.split('\n');

  // Strip file-level header lines (comments, H1 headings).
  let startIdx = 0;
  while (startIdx < lines.length) {
    const line = lines[startIdx].trim();
    if (line.startsWith('<!--') || line.startsWith('#')) {
      startIdx++;
    } else {
      break;
    }
  }

  // State machine: collect frontmatter lines then body lines.
  type State = 'between' | 'in_frontmatter' | 'in_body';
  let state: State = 'between';
  let fmLines: string[] = [];
  let bodyLines: string[] = [];
  let currentFm: Record<string, FrontmatterValue> = {};

  const flush = () => {
    if (Object.keys(currentFm).length > 0 || bodyLines.length > 0) {
      blocks.push({
        frontmatter: currentFm,
        body: bodyLines.join('\n').trim(),
      });
    }
    currentFm = {};
    fmLines = [];
    bodyLines = [];
  };

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '---') {
      if (state === 'between') {
        // Start of a new frontmatter block.
        state = 'in_frontmatter';
        fmLines = [];
      } else if (state === 'in_frontmatter') {
        // End of frontmatter - parse it and start collecting body.
        currentFm = parseFrontmatterBlock(fmLines.join('\n'));
        bodyLines = [];
        state = 'in_body';
      } else {
        // `---` while in body = separator between entries.
        flush();
        state = 'in_frontmatter';
        fmLines = [];
      }
    } else if (state === 'in_frontmatter') {
      fmLines.push(line);
    } else if (state === 'in_body') {
      bodyLines.push(line);
    }
    // `between` state and non-`---` line: skip (file header territory).
  }

  // Flush the last block if we ended mid-body.
  if (state === 'in_body') {
    flush();
  }

  return blocks;
}
