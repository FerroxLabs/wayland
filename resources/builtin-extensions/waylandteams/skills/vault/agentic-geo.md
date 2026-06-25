As of: 2026-05-16

# agentic-geo

**Mode skill.** Default-enabled on the Storefront specialist.

## When to use

Use when the user wants to be found by AI shopping agents and generative answer engines — ChatGPT shopping, Perplexity, Gemini, and agentic-checkout flows that became material traffic sources in late 2025 / early 2026. Use alongside `seo-organic` (Beacon); this is the storefront-side complement.

Trigger phrases:

- "How do we show up in ChatGPT shopping results?"
- "Optimize our products for AI search."
- "We need to be discoverable to AI agents."
- "Buyers ask AI for recommendations — how do we land in those answers?"

## Procedure

**1. Establish the agentic baseline.** Probe the surfaces first. Run 15-30 buyer-language queries through ChatGPT, Perplexity, and Gemini shopping. Per query, log: did the brand appear? Position? Framing? Against which competitors? This is rank-tracking for generative surfaces.

**2. Make the catalog machine-readable.** Agents read structured data more reliably than rendered HTML. Per priority SKU:

- Product schema (JSON-LD): name, description, brand, sku, gtin, offers (price, currency, availability), aggregateRating, review.
- Plain-prose description — declarative, specific, free of marketing fluff. Lead with what the product *is*.
- Explicit "best-for" framing: who it serves, what use case, what it is *not* for. Agents extract these as filters.
- Honest named comparisons ("comparable to X in feature Y; differs in Z"). Agents reason comparatively.

**3. Optimize the product feed.** Agentic checkout flows (Shopify's March 2026 agentic-storefront release; Amazon Rufus; Walmart Sparky) route via feeds — Google Merchant Center, Shopify's agent feed, Meta's shop feed. Audit feed fields: title (front-load brand + product type + key spec), description (200-500 words, plain language), price, availability, GTIN, high-res image URL, category, attribute fields (color, size, material, age group). Missing fields silently exclude you.

**4. Earn citation surface outside your domain.** Generative engines weight third-party signals heavily. Priority sources: published reviews on category authority sites, Reddit and category-forum mentions, comparison articles, YouTube reviews with transcripts, podcast mentions with show notes. A Reddit thread where a buyer asks "what's the best X for Y" and your brand is named with a clear reason often outweighs any on-site move.

**5. Measure visibility, not rank.** Generative surfaces lack stable position. Per query, track appearance rate across N runs, framing quality (positive / neutral / negative), citation source. Re-run monthly. Report trend, not point estimates.

## Decision rules

- **Plain prose beats marketing copy on agentic surfaces.** "Wool mid-layer designed for sub-zero hiking" beats "Conquer the elements with our premium wool mid-layer."
- **Structured data is the first move, always.** No JSON-LD product schema = invisible to most agents. Fix this before any other GEO work.
- **Reddit and category forums are part of your SEO surface now.** Engineering authentic presence in buyer communities is the highest-payoff GEO move for most brands.
- **As of 2026-05-16:** Shopify's agentic-storefront layer (released March 2026) exposes a dedicated agent feed separate from the standard product feed. Brands not opted in are invisible to Shopify-mediated agent traffic. Check opt-in status before any other GEO work on Shopify stores.
- **Do not chase every agent.** Prioritize the surfaces where your buyers actually research. If your category has zero presence on Perplexity but heavy presence on ChatGPT shopping, allocate accordingly.

## Anti-patterns

- Stuffing the product description with keywords the way 2015-era SEO did. Generative engines penalize that pattern and your description reads badly to humans too.
- Treating GEO as a one-time project. Surfaces change monthly; this is operating cadence, not a launch.
- Optimizing for AI surfaces while letting the human-readable PDP rot. The buyer still has to convert after the agent surfaces you.
- Buying "AI SEO" services that promise rank guarantees on generative surfaces. There is no stable rank to guarantee.
- Quoting any tactic from before mid-2025 without dating it as potentially stale. The surfaces did not exist in their current form then.
- Ignoring Reddit and category forums because they "feel off-brand." That is where the agent's training data lives.

## Before / after

**Brief:** "We want to show up when people ask ChatGPT for products like ours."

**Before** (vague):
> *Add AI keywords to descriptions and write a blog post.*

**After** (probe-first, structured, 2026-05-16):
> *Step one: run 20 buyer queries through ChatGPT shopping, Perplexity, and Gemini; log appearance rate as baseline. Step two: audit Product JSON-LD on top 10 SKUs — confirm name, description, gtin, offers, aggregateRating populate. Rewrite descriptions in declarative prose with "best-for" framing. Step three: confirm Shopify agentic-storefront opt-in (released March 2026; many stores default off). Step four: identify three forums and one subreddit where buyers ask comparison questions; build a 90-day authentic-presence plan with Copy. Measure: re-run the probe set at days 30, 60, 90; report appearance-rate and framing-quality deltas per query.*
