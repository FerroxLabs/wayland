/**
 * Catalog provider domain types.
 *
 * The desktop consumes the engine's bundled OpenAI-compatible provider catalog
 * (the vendored engine `providers.toml`). The engine serializes each row in
 * snake_case ({@link RawCatalogEntry}); the desktop works in camelCase
 * ({@link CatalogProviderEntry}). {@link normalizeCatalogEntry} is the single
 * pure mapping between the two. Eligibility/curation lives in
 * `catalogCuration.ts` and operates on the raw engine shape so the same filter
 * can run before normalization.
 */

/**
 * One catalog row exactly as the engine emits it (snake_case, mirrors
 * the engine's `CatalogEntry`). `base_url` has no trailing slash.
 */
export type RawCatalogEntry = {
  /** CLI id for `--provider <id>`. Unique across the catalog. */
  id: string;
  /** Human-readable label. */
  display_name: string;
  /** OpenAI-compatible REST root (no trailing slash). */
  base_url: string;
  /** Env var holding the API key (e.g. `NOVITA_API_KEY`). */
  env_var: string;
  /** Always `true` in the bundled file; `false` marks an anthropic-wire entry. */
  openai_compatible: boolean;
  /**
   * Path appended to `base_url` for chat completions. Absent => engine default
   * (`/v1/chat/completions`). `''` => `base_url` is already the full endpoint.
   */
  api_path?: string;
};

/**
 * The desktop-side normalized catalog entry (camelCase). One-to-one with
 * {@link RawCatalogEntry}; `apiPath` is omitted entirely when the engine row
 * carries no `api_path` (preserving the absent-vs-empty distinction).
 */
export type CatalogProviderEntry = {
  id: string;
  displayName: string;
  baseUrl: string;
  envVar: string;
  apiPath?: string;
};

/**
 * Pure snake_case -> camelCase mapping of a single catalog row. Does not
 * validate or curate (see `isCatalogEligible`); assumes a well-formed entry.
 */
export function normalizeCatalogEntry(raw: RawCatalogEntry): CatalogProviderEntry {
  const entry: CatalogProviderEntry = {
    id: raw.id,
    displayName: raw.display_name,
    baseUrl: raw.base_url,
    envVar: raw.env_var,
  };
  if (raw.api_path !== undefined) entry.apiPath = raw.api_path;
  return entry;
}
