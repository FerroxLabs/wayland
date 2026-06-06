---
name: wayland-listing-audit-pick
description: >-
  Pick one product listing from an inventory source, run a quick audit on it,
  and produce targeted improvement recommendations. A fast, deterministic
  triage pass over a catalog.

  Use when the user wants to surface a single weak listing from their inventory
  and get an immediate audit plus recommendations.

  Do NOT use when the user already has the specific listing in hand and just
  wants a deep rewrite (use the full listing-optimize workflow instead).
license: Apache-2.0
type: workflow
skills: "commerce-listing commerce-description"
metadata:
  author: wayland
  version: 1.0.0
  tags: commerce ecommerce listing audit triage deterministic
  category: marketing
  depends: "commerce-listing commerce-description"
---
# Listing Audit (Pick One)

**Estimated time:** under 1 minute

A deterministic triage workflow: resolve the inventory source, pick one listing
by a chosen strategy, audit it quickly, and recommend fixes. It is built to run
fast over real catalog data and never to invent listings or numbers that are
not in the source.

## When to Use

- User wants to find one weak listing in their catalog and get fast feedback
- User has an inventory export or a connected commerce data source
- Do NOT use when the listing is already chosen and a full rewrite is wanted

## Data Source

Resolve the listing source in this order, using the first that works:

1. Use the inventory file attached to the conversation or passed as
   `inventory_path` (an exported listings CSV / YAML / JSON from the workspace).
2. If none is provided, pull listings from the connected commerce MCP connector
   (the configured store database / Google Sheets export, or Stripe products).
3. If neither is available, ask the user to attach the inventory export, then
   halt.

Never invent listings or audit numbers that are not present in the source.

## Steps

**Step 1: Pick one listing** (uses: commerce-listing)

Resolve the inventory source per the order above. Then select exactly one
listing using the requested pick strategy: `lowest_conversion` (default),
`random`, or `oldest_unedited`. State which strategy was used and why this
listing was selected (cite the field that drove the pick, e.g. its conversion
rate or last-edited date). If no source can be resolved, halt and ask the user
to attach the inventory export.

- Input: inventory source (file, connector, or Stripe products), pick strategy
- Output: the single picked listing with the reason it was chosen
- Key focus: pick from real data only; halt rather than fabricate

**Step 2: Quick audit the listing** (uses: commerce-listing)

Run a quick audit on the picked listing: title, images, description, price,
and any conversion signals present in the source. Flag the concrete weaknesses
(missing fields, weak title, thin copy, pricing concerns) using only data that
exists in the source. Keep it to a tight, scannable audit, not a full teardown.
Halt on error rather than guessing.

- Input: the picked listing from Step 1
- Output: a quick audit flagging concrete, evidence-backed weaknesses
- Key focus: speed and accuracy; cite source fields, never invent metrics

**Step 3: Recommend improvements** (uses: commerce-description)

Turn the audit into targeted, actionable recommendations only (do not rewrite
the full listing here). Prioritize the fixes most likely to lift conversion,
tying each recommendation to a weakness from the audit. Present the picked
listing, the audit, and the recommendations together as the deliverable.

- Input: the picked listing and the audit from prior steps
- Output: prioritized improvement recommendations tied to audit findings
- Key focus: recommendations only, ranked by likely conversion impact
