/**
 * DOMPurify wrappers for raw-HTML React sinks.
 *
 * Every site in the renderer that writes string content into a DOM node via
 * the React raw-HTML escape hatch (or equivalent) must run that string through
 * one of these helpers first. The string almost always originates from
 * LLM/agent output, so it is untrusted by definition.
 *
 * Pick the helper that matches the payload shape:
 *
 *   - sanitizeHtml - generic HTML fragments (Markdown output, diff HTML, etc.)
 *   - sanitizeSvg  - Mermaid diagrams and other SVG renders
 *   - sanitizeMath - KaTeX output (may contain HTML, SVG, and MathML)
 *
 * `USE_PROFILES` is locked per helper and intentionally excluded from `extra`
 * via `Omit<Config, 'USE_PROFILES'>` - callers cannot widen or swap the base
 * profile through spread. If a specific call site needs an extra tag or
 * attribute that DOMPurify's default profile strips (e.g. Mermaid's
 * `<foreignObject>`), pass per-call ADD_TAGS / ADD_ATTR overrides at the call
 * site rather than loosening the helpers here. Keeping the global profiles
 * tight is the whole point.
 */
import DOMPurify, { type Config } from 'dompurify';

type SanitizeExtra = Omit<Config, 'USE_PROFILES'>;

export function sanitizeHtml(input: string, extra?: SanitizeExtra): string {
  return DOMPurify.sanitize(input, {
    ...extra,
    USE_PROFILES: { html: true },
  }) as unknown as string;
}

export function sanitizeSvg(input: string, extra?: SanitizeExtra): string {
  return DOMPurify.sanitize(input, {
    ...extra,
    USE_PROFILES: { svg: true, svgFilters: true },
  }) as unknown as string;
}

export function sanitizeMath(input: string, extra?: SanitizeExtra): string {
  return DOMPurify.sanitize(input, {
    ...extra,
    USE_PROFILES: { html: true, mathMl: true, svg: true },
  }) as unknown as string;
}
