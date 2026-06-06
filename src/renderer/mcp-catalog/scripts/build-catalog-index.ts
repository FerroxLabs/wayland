import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const entriesDir = join(root, "entries");

const entries = readdirSync(entriesDir).filter(f => f.endsWith(".json")).map(file => {
  const full = JSON.parse(readFileSync(join(entriesDir, file), "utf8"));
  return {
    id: full.name,
    name: full.title,
    shortDescription: full.description,
    iconUrl: full["x-wayland"].iconUrl,
    tier: full["x-wayland"].tier,
    categories: full["x-wayland"].categories,
    maintainerType: full["x-wayland"].maintainerType,
    verifiedByWayland: full["x-wayland"].verifiedAt ?? null,
    popularityRank: full["x-wayland"].popularityRank ?? 999,
    installRate: full["x-wayland"].installRate ?? 0,
    entryUrl: `entries/${file}`,
    guideUrl: full["x-wayland"].setupGuide?.path ?? "",
  };
});

entries.sort((a, b) => a.popularityRank - b.popularityRank);

const catalog = {
  $schema: "./schema/catalog.schema.json",
  version: "1.0.0",
  publishedAt: new Date().toISOString(),
  entries,
};
writeFileSync(join(root, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
console.log(`Wrote catalog.json with ${entries.length} entries.`);
