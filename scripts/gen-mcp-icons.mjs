/**
 * Fetch real vendor logos (Simple Icons, MIT) for the new catalog entries.
 * Falls back to a clean brand-color monogram tile when the vendor isn't in
 * Simple Icons. Run: node scripts/gen-mcp-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/renderer/mcp-catalog');
const ICONS = path.join(ROOT, 'icons');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));

// Only the new (this-expansion) entries: verifiedByWayland today.
const TODAY = '2026-06-13';
const news = catalog.entries.filter((e) => e.verifiedByWayland === TODAY);

// Explicit Simple Icons slug per entry name (null = skip straight to monogram).
const SI = {
  'fal.ai': null, Replicate: 'replicate', Higgsfield: null, 'Black Forest Labs (FLUX)': null,
  ElevenLabs: 'elevenlabs', 'MiniMax (Hailuo)': null, Recraft: null,
  Tavily: null, 'Jina AI': null, Apify: 'apify', Ref: null, 'You.com': null, Linkup: null,
  Perplexity: 'perplexity', AgentQL: null, Wikipedia: 'wikipedia', arXiv: 'arxiv', DuckDuckGo: 'duckduckgo',
  Grafana: 'grafana', Railway: 'railway', Airtable: 'airtable', 'New Relic': 'newrelic',
  DigitalOcean: 'digitalocean', Render: 'render', Heroku: 'heroku', Netlify: 'netlify',
  Prisma: 'prisma', PlanetScale: 'planetscale', ClickHouse: 'clickhouse', Redis: 'redis',
  Convex: 'convex', Pinecone: 'pinecone', Qdrant: 'qdrant', Chroma: null, Browserbase: null,
  Daytona: null, CircleCI: 'circleci', Buildkite: 'buildkite', Axiom: null, Upstash: 'upstash', 'Jam.dev': null,
  PayPal: 'paypal', Square: 'square', Canva: 'canva', Plaid: null, Webflow: 'webflow',
  Resend: 'resend', 'Customer.io': null, Twilio: 'twilio', Dropbox: 'dropbox', Typeform: 'typeform', Coda: null,
};

const fileFor = (e) => path.join(ICONS, e.iconUrl.replace('icons/', ''));

function monogram(brand, name) {
  const letter = (name.replace(/[^A-Za-z0-9]/g, '')[0] || '?').toUpperCase();
  // light brand colors get dark text
  const dark = /^#(f|e|d|c|b|9|a)/i.test(brand);
  const fg = dark ? '#111111' : '#ffffff';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" rx="11" fill="${brand}"/><text x="24" y="31" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="22" font-weight="700" fill="${fg}" text-anchor="middle">${letter}</text></svg>`;
}

async function fetchSI(slug) {
  try {
    const res = await fetch(`https://cdn.simpleicons.org/${slug}`, { redirect: 'follow' });
    if (!res.ok) return null;
    const body = await res.text();
    if (!body.trim().startsWith('<svg')) return null;
    return body;
  } catch {
    return null;
  }
}

let real = 0, mono = 0;
for (const e of news) {
  const dest = fileFor(e);
  const brand = '#888888';
  // brand color lives in the entry file
  let fg = brand;
  try {
    const ef = JSON.parse(fs.readFileSync(path.join(ROOT, e.entryUrl), 'utf8'));
    fg = ef['x-wayland']?.brand?.logoForeground || brand;
  } catch {}
  const slug = SI[e.name];
  let svg = null;
  if (slug) svg = await fetchSI(slug);
  if (svg) { real++; } else { svg = monogram(fg, e.name); mono++; }
  fs.writeFileSync(dest, svg.endsWith('\n') ? svg : svg + '\n');
}
console.log(`icons written: ${real} real (Simple Icons), ${mono} monogram fallback, total ${news.length}`);
