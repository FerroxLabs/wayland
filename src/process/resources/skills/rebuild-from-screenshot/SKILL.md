---
name: rebuild-from-screenshot
description: Reproduce a chart from a screenshot — read the user's pasted image, diff against the live chart, then set symbol/indicators/drawings to match. Use when the user pastes a chart image and says "recreate this" or "set up my chart like this".
---

# Rebuild From Screenshot

You are recreating a chart layout from a user-provided screenshot using vision + MCP tools.

## Step 1: Receive the Screenshot

The user pastes an image. Visually read it and extract:

- **Symbol** — from the top-left ticker label
- **Timeframe** — from the resolution selector (e.g., "5", "15", "1H", "D")
- **Chart type** — Candles, Heikin Ashi, Line, Bars, etc.
- **Indicators** — every pane + overlay study (names + approximate params like "EMA(200)")
- **Drawings** — trend lines, rectangles, horizontal levels, text
- **Visible date range** — leftmost to rightmost bar dates

## Step 2: Capture Live Chart State

1. `chart_vision_read` — returns combined image + readings (symbol, timeframe, indicator list, key values) in one call. Prefer this over separate `capture_screenshot` + `chart_get_state` for this workflow.

If `chart_vision_read` fails with `CHART_LOADING`, wait and retry once.

## Step 3: Diff

Compare the pasted screenshot against the `chart_vision_read` output. Build a minimal change list:

- Symbol match? If not, queue `chart_set_symbol`
- Timeframe match? If not, queue `chart_set_timeframe`
- Indicator set — which to add, which to remove, which to reconfigure
- Drawings — which to add (source coords from the screenshot), which to clear

## Step 4: Apply Changes

Execute in this order to minimize reflows:

1. `chart_set_symbol` (e.g., `"NASDAQ:TSLA"`)
2. `chart_set_timeframe` (e.g., `"60"`)
3. `chart_set_type` if needed (e.g., `"HeikinAshi"`)
4. For each missing indicator: `chart_manage_indicator` with `action: "add"` and `indicator:` set to the
   **full name** ("Moving Average Exponential", not "EMA"). The key is `indicator`, not `name` —
   an unknown key is silently dropped and the call then fails with "indicator is required for add action"
5. `indicator_set_inputs` to match params. It needs `entity_id` (from `chart_get_state`) and `inputs`
   as a JSON **string**, e.g. `inputs: '{"length": 200}'`
6. For each drawing:
   - Horizontal level → `draw_shape` with `shape: "horizontal_line"` and `point: { time, price }`.
     `time` is required even for a horizontal line — use the last bar time from `chart_get_visible_range`
   - Trend line → `draw_shape` with `shape: "trend_line"` + `point` and `point2`, both `{ time, price }`
   - Text → `draw_shape` with `shape: "text"` and a `text` string
7. If leftover studies/drawings don't belong: `chart_manage_indicator` remove + `draw_remove_one` by id

Concrete example — rebuilding a TSLA 1H chart with EMA(20)/EMA(200) and a horizontal at 250.00:

```
chart_set_symbol("NASDAQ:TSLA")
chart_set_timeframe("60")
chart_manage_indicator({ action: "add", indicator: "Moving Average Exponential" })
chart_manage_indicator({ action: "add", indicator: "Moving Average Exponential" })
chart_get_state()                 // read both entity_ids back
indicator_set_inputs({ entity_id: "<ema1 entity_id>", inputs: '{"length": 20}' })
indicator_set_inputs({ entity_id: "<ema2 entity_id>", inputs: '{"length": 200}' })
chart_get_visible_range()         // bars_range.to is the last bar time
draw_shape({ shape: "horizontal_line", point: { time: 1741964700, price: 250.00 } })
```

## Step 5: Verify

1. `chart_vision_read` again — confirm the new live state
2. Diff once more against the user's screenshot
3. If mismatches remain (e.g., indicator param still off), iterate on step 4

## Step 6: Report

Tell the user what was applied, what couldn't be matched exactly (e.g., proprietary indicators not recognizable by name), and show the final screenshot path.

## Error Notes

- `CHART_LOADING` — chart still rendering; wait 1-2s and retry
- `INDICATOR_NOT_FOUND` — name in screenshot isn't a built-in (likely custom Pine); ask user to load it manually
- If colors/styles matter for the match, mention them but don't chase perfection — focus on structural fidelity
