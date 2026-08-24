---
name: multi-pane-analysis
description: Cross-asset reasoning across a multi-pane layout — set a 2x2 grid, assign correlated symbols to each pane, and identify leader/laggard/divergence. Use when the user asks to "compare indices", "watch the complex", or wants correlated-asset reasoning.
---

# Multi-Pane Cross-Asset Analysis

You are using TradingView's pane layouts to reason across several correlated instruments at once.

> **Power-toolkit shortcuts:** snapshot the current layout with `state_snapshot` before mutating it (so the user can `state_restore` afterwards). Use `chart_vision_read` per active pane to grab everything (image + indicators + Pine graphics) in one call.

## Step 1: Choose the Layout

1. `pane_set_layout` — typical choices:
   - `"2x2"` for four symbols (e.g., the index complex)
   - `"1x2"` / `"2x1"` for two
   - `"1x3"` / `"3x1"` for three

Example — index complex: `pane_set_layout({ layout: "2x2" })`.

## Step 2: Assign Symbols

Use `pane_set_symbol` once per pane. The pane argument is `index` (0-based), not `pane`.
Common correlated baskets:

- **US Index complex**: `ES1!` (SP500), `NQ1!` (Nasdaq), `YM1!` (Dow), `RTY1!` (Russell)
- **Energy**: `CL1!` (WTI), `BZ1!` (Brent), `NG1!` (Nat Gas), `XLE`
- **Metals**: `GC1!` (Gold), `SI1!` (Silver), `HG1!` (Copper), `PL1!` (Platinum)
- **Crypto majors**: `BTCUSD`, `ETHUSD`, `SOLUSD`, `TOTAL`
- **Risk-on/off**: `SPY`, `TLT`, `DXY`, `VIX`

```
pane_set_symbol({ index: 0, symbol: "ES1!" })
pane_set_symbol({ index: 1, symbol: "NQ1!" })
pane_set_symbol({ index: 2, symbol: "YM1!" })
pane_set_symbol({ index: 3, symbol: "RTY1!" })
```

If a pane errors with `CHART_LOADING`, wait ~2s before querying that pane.

## Step 3: Align Timeframes

`pane_set_symbol` takes only `index` and `symbol`, so it cannot set a timeframe. Loop through the panes calling `chart_set_timeframe` after `pane_focus`. All panes should match (e.g., all 15m) for valid comparison.

## Step 4: Stream or Poll

Poll: `pane_list` to enumerate panes, then `quote_batch` with every pane's symbol in one call,
plus per-pane `data_get_ohlcv` with `summary: true`.

Use `quote_batch` here, not a `quote_get` per pane. `quote_get` for a symbol that is not the
active chart symbol **briefly switches the chart and switches it back**, so polling it per pane
visibly thrashes the user's layout on a timer. `quote_batch` reads the scanner API, touches
nothing, and is unaffected by a dropped chart data connection.

There is no push/stream tool on this connector, so re-poll on a timer for live monitoring rather than waiting for updates that will never arrive.

## Step 5: Compute Relative Moves

For each pane, pull:

- `quote_batch` — current price + change% for every pane symbol at once (see Step 4 for why
  this is not a per-pane `quote_get`)
- `data_get_ohlcv` with `summary: true, count: 20` — recent range

Compute normalized % moves since session open (or since any anchor bar). The **leader** is the one with the largest % change in the dominant direction; the **laggard** is the smallest; **divergence** is when one pane goes opposite the rest.

Example output:

```
ES1!  +0.42%  (laggard)
NQ1!  +0.91%  (LEADER — tech leading risk-on)
YM1!  +0.18%
RTY1! -0.35%  (DIVERGENCE — small caps down while indices up)
```

## Step 6: Annotate Divergences

If you spot a divergence:

1. `pane_focus` on the divergent pane
2. `draw_shape` with `text` marking the divergence bar
3. `capture_screenshot` with `region: "full"` so all four panes are in frame

## Step 7: Report

Provide the cross-asset read:

- **Leader / laggard / divergent** with % moves
- **Correlation check** — are the normally-correlated pairs still in sync? (e.g., ES/NQ typically correlated; if they split, note it)
- **Actionable interpretation** — e.g., "RTY1! weakness while ES1!/NQ1! rally = narrow breadth, fade long setups on indices"

## Cleanup

If the user wanted a single-pane view back:
- `pane_set_layout` with `"1x1"`
- Or `state_restore` if a prior snapshot exists
