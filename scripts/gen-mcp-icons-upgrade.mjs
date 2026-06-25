/**
 * Upgrade monogram-fallback catalog icons to real brand logos, trying multiple
 * SVG sources per vendor: Simple Icons, LobeHub (@lobehub/icons-static-svg),
 * then the vendor's own /favicon.svg. Keeps the monogram if none yield an SVG.
 * Run: node scripts/gen-mcp-icons-upgrade.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/renderer/mcp-catalog');

// file slug -> { si, lobe, domain } candidate sources (any may be null).
const MAP = {
  'ai.fal-fal-mcp': { lobe: 'fal', domain: 'fal.ai' },
  'ai.higgsfield-higgsfield-mcp': { domain: 'higgsfield.ai' },
  'ai.bfl-flux-mcp': { lobe: 'flux', domain: 'bfl.ai' },
  'ai.minimax-minimax-mcp': { lobe: 'minimax', domain: 'minimax.io' },
  'ai.recraft-recraft-mcp': { lobe: 'recraft', domain: 'recraft.ai' },
  'com.tavily-tavily-mcp': { lobe: 'tavily', domain: 'tavily.com' },
  'ai.jina-jina-mcp': { lobe: 'jina', domain: 'jina.ai' },
  'com.apify-apify-mcp': { si: 'apify', domain: 'apify.com' },
  'com.ref-ref-tools-mcp': { domain: 'ref.tools' },
  'com.you-you-mcp': { lobe: 'you', domain: 'you.com' },
  'so.linkup-linkup-mcp': { domain: 'linkup.so' },
  'io.tinyfish-agentql-mcp': { domain: 'agentql.com' },
  'com.heroku-heroku-mcp': { si: 'heroku', domain: 'heroku.com' },
  'io.pinecone-pinecone-mcp': { si: 'pinecone', lobe: 'pinecone', domain: 'pinecone.io' },
  'ai.trychroma-chroma-mcp': { lobe: 'chroma', domain: 'trychroma.com' },
  'com.browserbase-browserbase-mcp': { domain: 'browserbase.com' },
  'co.axiom-axiom-mcp': { si: 'axiom', lobe: 'axiom', domain: 'axiom.co' },
  'dev.jam-jam-mcp': { domain: 'jam.dev' },
  'com.canva-canva-mcp': { si: 'canva', domain: 'canva.com' },
  'com.plaid-plaid-mcp': { si: 'plaid', domain: 'plaid.com' },
  'com.customerio-customerio-mcp': { si: 'customerdotio', domain: 'customer.io' },
  'io.coda-coda-mcp': { si: 'coda', domain: 'coda.io' },
  'com.twilio-twilio-mcp': { si: 'twilio', domain: 'twilio.com' },
};

// Only re-attempt icons that are still monograms (don't clobber good logos).
function isMonogram(file) {
  try {
    const s = fs.readFileSync(path.join(ROOT, 'icons', `${file}.svg`), 'utf8');
    return s.includes('<text') && s.includes('rx="11"');
  } catch {
    return true;
  }
}

async function tryFetch(url) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    const body = await r.text();
    // Must be a real SVG (some 404 pages return 200 HTML).
    if (!/<svg[\s>]/i.test(body)) return null;
    if (body.length > 200000) return null; // sanity cap
    return body.trim();
  } catch {
    return null;
  }
}

async function bestIcon(c) {
  const candidates = [];
  if (c.si) {
    candidates.push(`https://cdn.simpleicons.org/${c.si}`);
    candidates.push(`https://cdn.jsdelivr.net/npm/simple-icons/icons/${c.si}.svg`);
  }
  if (c.lobe) {
    candidates.push(`https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${c.lobe}.svg`);
    candidates.push(`https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${c.lobe}-color.svg`);
    candidates.push(`https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/${c.lobe}.svg`);
  }
  if (c.domain) {
    candidates.push(`https://${c.domain}/favicon.svg`);
    candidates.push(`https://${c.domain}/icon.svg`);
  }
  for (const u of candidates) {
    const svg = await tryFetch(u);
    if (svg) return { svg, src: u };
  }
  return null;
}

let upgraded = 0, kept = 0;
const lines = [];
for (const [file, c] of Object.entries(MAP)) {
  const dest = path.join(ROOT, 'icons', `${file}.svg`);
  if (!isMonogram(file)) { continue; } // already a real logo
  const got = await bestIcon(c);
  if (got) {
    fs.writeFileSync(dest, got.svg.endsWith('\n') ? got.svg : got.svg + '\n');
    upgraded++;
    lines.push(`  UPGRADED ${file}  <- ${got.src.replace(/^https:\/\//, '')}`);
  } else {
    kept++;
    lines.push(`  kept monogram ${file}`);
  }
}
console.log(lines.join('\n'));
console.log(`\nupgraded ${upgraded}, kept-monogram ${kept}, total ${upgraded + kept}`);
