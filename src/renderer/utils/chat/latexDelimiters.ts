/**
 * Convert LaTeX-style math delimiters to dollar-sign delimiters
 * that remark-math can process.
 *
 * \[...\] → $$...$$ (block display math)
 * \(...\) → $...$  (inline math)
 *
 * Content inside fenced code blocks (``` or ~~~) and inline code spans (`)
 * is preserved unchanged.
 */
export function convertLatexDelimiters(text: string): string {
  const segments: string[] = [];
  let pos = 0;

  // Match fenced code blocks (``` or ~~~) and inline code spans
  const codeRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`)/g;

  let match;
  while ((match = codeRegex.exec(text)) !== null) {
    // Process text before this code segment
    if (match.index > pos) {
      segments.push(replaceDelimiters(text.slice(pos, match.index)));
    }
    // Keep code segment unchanged
    segments.push(match[0]);
    pos = match.index + match[0].length;
  }

  // Process remaining text after last code segment
  if (pos < text.length) {
    segments.push(replaceDelimiters(text.slice(pos)));
  }

  return segments.join('');
}

function replaceDelimiters(text: string): string {
  // Neutralize currency before remark-math runs. A lone `$` immediately followed by a
  // digit (`$2k`, `$25`, `$10k`, `$50k+`) is a dollar amount, not a math delimiter —
  // without this, remark-math pairs two such `$` into an inline-math span and renders
  // the text between them in italic KaTeX with spaces collapsed (prices garbled in chat).
  // Escaping to `\$` makes it a literal `$`. Skips `$$` display delimiters (a `$` preceded
  // by `$`) and already-escaped `\$` (preceded by `\`). Real inline math (`$x$`,
  // `$\alpha$`) starts with a non-digit and is unaffected.
  text = text.replace(/(?<![\\$])\$(?=\d)/g, () => '\\$');
  // Replace \[...\] with $$...$$ (block display math, supports multiline)
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, content: string) => `$$${content}$$`);
  // Replace \(...\) with $...$ (inline math)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, content: string) => `$${content}$`);
  return text;
}
