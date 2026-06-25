/// <reference types="vite/client" />
import { useMemo } from 'react';
import yaml from 'js-yaml';
import { z } from 'zod';
import type {
  CatalogIndex,
  CatalogIndexEntry,
  CatalogEntry,
  SetupGuide,
  Tier,
} from '../types';

// Vite-bundled catalog - ships with the app.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import catalog from '@renderer/mcp-catalog/catalog.json';

// import.meta.glob keys are normalized to the relative form Vite uses internally.
// From this file (src/renderer/pages/settings/McpLibrary/hooks/) the catalog lives
// 4 levels up at src/renderer/mcp-catalog/.
const entryModules = import.meta.glob<{ default: CatalogEntry } | CatalogEntry>(
  '@renderer/mcp-catalog/entries/*.json',
  { eager: true },
);
const guideModules = import.meta.glob<string>(
  '@renderer/mcp-catalog/guides/*.md',
  { eager: true, query: '?raw', import: 'default' },
);

// Vite resolves SVG asset URLs at build time. Catalog stores `iconUrl` as a
// literal string like "icons/google.svg" (the path inside the catalog dir),
// so we map filename → Vite-bundled URL once and resolve at hook construction.
const iconModules = import.meta.glob<string>(
  '@renderer/mcp-catalog/icons/*.svg',
  { eager: true, query: '?url', import: 'default' },
);

const iconUrlByFilename: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [key, url] of Object.entries(iconModules)) {
    const slash = key.lastIndexOf('/');
    const filename = slash >= 0 ? key.slice(slash + 1) : key;
    map[filename] = url;
  }
  return map;
})();

function resolveIconUrl(catalogIconUrl: string | undefined): string | undefined {
  if (!catalogIconUrl) return undefined;
  // Already absolute (Vite-resolved on a previous pass, or http(s))
  if (catalogIconUrl.startsWith('/') || /^https?:\/\//i.test(catalogIconUrl)) {
    return catalogIconUrl;
  }
  const filename = catalogIconUrl.replace(/^icons\//, '');
  return iconUrlByFilename[filename];
}

// Strict schema for guide frontmatter - never trust unvalidated YAML.
const SetupStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  estSeconds: z.coerce.number().int().nonnegative().optional(),
  autoCompletedByInstall: z.coerce.boolean().optional(),
  externalAction: z.object({ label: z.string(), url: z.string().url() }).optional(),
  primaryAction: z.object({ label: z.string(), action: z.string() }).optional(),
  inputs: z
    .array(
      z.object({
        name: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
        label: z.string(),
        placeholder: z.string().optional(),
        secret: z.coerce.boolean().optional(),
      }),
    )
    .optional(),
  warning: z.string().optional(),
  body: z.string().optional(),
});

const GuideFrontmatterSchema = z.object({
  guideVersion: z.string(),
  estimatedMinutes: z.coerce.number().int().positive(),
  steps: z.array(SetupStepSchema).min(1).max(10),
});

// Catalog paths in catalog.json look like "entries/foo.json" and "guides/foo.md".
// Resolve to the absolute alias form Vite uses for its glob keys.
function findEntryModule(relPath: string): CatalogEntry | undefined {
  const wanted = `/src/renderer/mcp-catalog/${relPath}`;
  for (const [key, mod] of Object.entries(entryModules)) {
    // Vite normalizes alias keys to start with /src/...
    if (key === wanted || key.endsWith(`/${relPath}`)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = mod as any;
      return (m?.default ?? m) as CatalogEntry;
    }
  }
  return undefined;
}

function findGuideModule(relPath: string): string | undefined {
  const wanted = `/src/renderer/mcp-catalog/${relPath}`;
  for (const [key, mod] of Object.entries(guideModules)) {
    if (key === wanted || key.endsWith(`/${relPath}`)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mod as unknown as string;
    }
  }
  return undefined;
}

function getEntryByPath(path: string): CatalogEntry {
  const mod = findEntryModule(path);
  if (!mod) throw new Error(`Entry not found: ${path}`);
  return mod;
}

function getGuideByPath(path: string): SetupGuide {
  const raw = findGuideModule(path);
  if (!raw) throw new Error(`Guide not found: ${path}`);
  const text = raw;
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`Guide ${path} missing frontmatter`);

  // Parse with FAILSAFE_SCHEMA - strings/sequences/maps only, no custom types.
  // This restricts the parser to plain strings, sequences, and maps (no
  // booleans, dates, or custom tags), then we re-validate via zod below.
  const parsed = yaml.load(match[1], { schema: yaml.FAILSAFE_SCHEMA });

  // Validate shape before trusting. Throws on any unexpected field.
  // Cast through unknown to a strict SetupGuide-compatible shape - zod's
  // inferred type in this version surfaces fields as optional in some
  // module resolutions, even though .parse() guarantees them.
  const frontmatter = GuideFrontmatterSchema.parse(parsed) as unknown as {
    guideVersion: string;
    estimatedMinutes: number;
    steps: SetupGuide['steps'];
  };

  return { ...frontmatter, body: match[2] };
}

export interface UseMcpLibrary {
  entries: CatalogIndexEntry[];
  recommended: CatalogIndexEntry[];
  byTier: Record<Tier, CatalogIndexEntry[]>;
  byCategory: Record<string, CatalogIndexEntry[]>;
  getEntry(id: string): CatalogEntry | undefined;
  getGuide(id: string): SetupGuide;
}

/**
 * Hand-curated "Recommended for you" connectors, in deliberate order. These are
 * the mainstream services most people actually reach for. We pick them by id
 * rather than sorting on `popularityRank` because that float drifted
 * platform-specific niches (Apple - macOS only) into the top slots. Apple and
 * other OS-bound connectors stay fully browsable, just not "recommended".
 */
const RECOMMENDED_IDS = [
  'io.github.taylorwilsdon/google-workspace-mcp', // Google Workspace
  'com.slack/slack-mcp', // Slack
  'com.github/github-mcp-server', // GitHub
  'com.notion/notion-mcp', // Notion
  'com.linear/linear-mcp', // Linear
  'com.softeria/ms-365-mcp-server', // Microsoft 365
];
const RECOMMENDED_COUNT = 6;

export function useMcpLibrary(): UseMcpLibrary {
  return useMemo(() => {
    const idx = catalog as unknown as CatalogIndex;
    const entries = idx.entries
      .toSorted((a, b) => a.popularityRank - b.popularityRank)
      .map((e) => Object.assign({}, e, { iconUrl: resolveIconUrl(e.iconUrl) ?? e.iconUrl }));
    // Build the recommended row from the curated id list, falling back to
    // rank order for any id that isn't found so the row is always full.
    const byId = new Map(entries.map((e) => [e.id, e]));
    const recommended = RECOMMENDED_IDS.map((id) => byId.get(id)).filter(
      (e): e is CatalogIndexEntry => e !== undefined,
    );
    for (const e of entries) {
      if (recommended.length >= RECOMMENDED_COUNT) break;
      if (!recommended.includes(e)) recommended.push(e);
    }
    const byTier: Record<Tier, CatalogIndexEntry[]> = { core: [], worker: [], builder: [] };
    const byCategory: Record<string, CatalogIndexEntry[]> = {};
    for (const e of entries) {
      byTier[e.tier].push(e);
      for (const c of e.categories) (byCategory[c] ??= []).push(e);
    }
    return {
      entries,
      recommended,
      byTier,
      byCategory,
      getEntry: (id) => {
        const idxEntry = entries.find((e) => e.id === id);
        if (!idxEntry) return undefined;
        const raw = getEntryByPath(idxEntry.entryUrl);
        const wayland = raw['x-wayland'];
        return {
          ...raw,
          'x-wayland': {
            ...wayland,
            iconUrl: resolveIconUrl(wayland.iconUrl) ?? wayland.iconUrl,
          },
        };
      },
      getGuide: (id) => {
        const idxEntry = entries.find((e) => e.id === id);
        if (!idxEntry) throw new Error(`Unknown entry: ${id}`);
        return getGuideByPath(idxEntry.guideUrl);
      },
    };
  }, []);
}
