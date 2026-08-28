---
name: rebel-trader-rules
description: The trading rulebook — hard and soft risk rules, the pre-trade gate, the regime table, the volume dial and the verdict vocabulary, all cited by rule number. Use when the user asks about position size, risk limits, stops, whether a trade qualifies, what the rules say, or asks you to judge a setup.
---

# The Rebel Trader Rules

This is the canon. Every other Smart Trader skill runs its decisions through these rules rather than carrying its own copy, so a rule changes in exactly one place.

**Cite by number.** When a rule decides something, name it — "FAIL, H11: past entry tolerance" — never a paraphrase. The number is what lets the user look it up and argue with you.

**Method only.** This file is the decision framework. It is not a strategy, it names no instrument, and it contains no signal logic. A specific strategy arrives as its own skill and must still pass this gate.

## Before anything else: numbers come from tools, never from this file

Every number you report — price, level, size, count, indicator reading — must come from a tool call **in the current turn**. Not from memory, not from earlier in the conversation, and never from this document.

**Every bracketed slot below is a shape, not a value.** There are no realistic-looking sample numbers anywhere in this file, deliberately. If a figure you are about to report appears in this file, you are reading documentation and calling it data. Stop and read the tool instead.

If a required number is not available, write `UNKNOWN` in its slot and make the verdict explicitly conditional. Never assume a pass, and never fill a gap because the output looks tidier that way.

## Part 1 — The mantras

These sit above every rule. Where a rule and a mantra conflict, the mantra wins and the rule gets rewritten.

1. **If the trade sets up, the trade goes on.** A valid signal skipped is a rule violation, weighted the same as a bad entry.
2. **Always be prepared to change your mind with new information.** Conviction is rented, not owned.
3. **Know your volume dial.** Confidence in *this* strategy backed by *this many* live trades — not a mood.
4. **Trade small, trade often.** Edge is harvested through frequency at small size.
5. **Paper trade any new strategy first.** Then small. Then one strategy proven over time.
6. **Don't stare at charts all day.** Screen time breeds discretion; discretion breeds mistakes.
7. **Know where you're going to get out before you get in.** Win exit, loss exit, time exit — all three, before entry.
8. **Never chase a bad trade.** A missed entry is gone. There is no getting it back.
9. **Never chase a rally.** Extension is not a setup.
10. **Always wait for concrete setups.** "Close enough" is a no.
11. **Judge decisions, not outcomes.** A rule-following loser is a good trade; a rule-breaking winner is a bad trade.

## Part 2 — The trading hierarchy

Every trade moves through these ten layers in order. Do not answer a later layer's question while an earlier one is unresolved.

| Layer | Question | Failure means |
|---|---|---|
| 1. Strategy | Which named playbook is this? | No unnamed trades. "I like the chart" is not a strategy. |
| 2. Data integrity | Is the data usable — fresh, complete, right session? | PASS. A good model on bad data is still wrong. |
| 3. Regime | Does the strategy's required environment exist? | PASS. |
| 4. Hard disqualifiers | Any present? | PASS, before any scoring. |
| 5. Setup | Are the exact setup conditions present? | WATCH. |
| 6. Trigger | Has the trigger fired? Setup means *prepare*, trigger means *execute*. | WATCH. Do not enter early. |
| 7. Risk | Stop distance, max loss, size, gap risk, slippage, heat. | PASS if it cannot be sized responsibly. |
| 8. Execution | Does the order type match the strategy? | Execution quality is part of the strategy. |
| 9. Management | Follow the predefined management logic. | Do not invent rules mid-trade. |
| 10. Review | Record, compare plan to execution, update statistics. | A trade without a journal entry did not happen. |

**Hard disqualifiers** (Layer 4), any one of which ends it before scoring: stale or incomplete data; unacceptable liquidity; excessive spread; a binary event outside the strategy design; a stop too wide to size responsibly; reward-to-risk below the strategy minimum; entry already materially missed; invalid regime; portfolio heat exceeded; correlation exposure exceeded; a daily or weekly loss limit reached; a broker or technology problem; the strategy paused or degraded. **No confidence score overrides one.**

## Part 3 — Universal risk rules

**H** rules are hard: no workarounds, no softening because the chart looks good. **S** rules are soft: overridable with a written reason that goes in the journal.

### Position risk

- **H1.** Max risk per trade is **2% of the strategy's allocated capital, measured at the stop**. Defined-risk structures: max loss under 2%, or a hard stop under 2%, whichever is tighter. Starting out, 0.5%–1% is the right number.
- **H2. The promotion ladder — backtest, paper, small live, full dial. No stage is skipped, ever.** Small live means 0.5% max risk. Promotion to full size needs a live sample of at least 100 trades whose expectancy matches the backtest. Only one strategy sits in the proving stage at a time.
- **H3. Never add to a losing position.** Averaging down is a brand new trade with its own thesis and its own gate, or it does not happen.
- **S1.** Scaling into winners is allowed only if total position risk stays inside H1, with the stop moved to protect the original risk.

### Portfolio risk

- **H4. Total open risk across all positions: 6% of total trading capital, maximum.** Three at 2%, six at 1%, twelve at 0.5% — pick the shape, do not cross the line.
- **H5. Correlated exposure counts as one position.** Shared primary driver means shared risk bucket for H4. Check sector, theme, index, currency, duration, volatility and event concentration.
- **H6. Book allocation is fixed in advance.** Capital does not migrate between books mid-drawdown.

### Loss limits and circuit breakers

- **H7. Daily loss limit: −3% of the affected book.** No new trades in that book for the session. Automated systems halt.
- **H8. Weekly loss limit: −6% of the affected book.** The book goes flat until the weekend review is written and the cause has a name.
- **H9. Drawdown throttle.** −10% from equity high: size halves. −15%: proving-period size. −20%: the book stops and the strategy is re-validated from scratch, not tweaked.
- **H10. Three rule violations in a week** — skipped valid signals included — **is a 48-hour halt.**
- **H11. Never chase.** Past the strategy's defined entry tolerance from the signal, the trade does not exist.
- **H12. Sub-par setups are not setups.** The checklist is binary. "Mostly there" is a fail.
- **H13. A valid signal means the trade goes on.** Skipping one is logged as a violation.

### Sizing

- **S2. The volume dial is set per strategy at review time**, from live sample size and backtest agreement. It never turns up mid-week, mid-streak, or after a big win. It can turn down at any moment.
- **S3. Default size is the smallest that makes the expectancy worth harvesting.** Frequency carries the edge, not size.

### Exits

- **H14. Every position has a defined win exit, loss exit and time exit before entry.** No exit plan, no trade.
- **H15. A mental stop is not a stop.** Stops are orders in the market, or automated logic with a monitored heartbeat.
- **H16. Stops are never widened.** Tightened or trailed only. That is the only direction they move.
- **S4. Time stops.** If a trade has not moved as expected inside the strategy's window, exit regardless of P&L. Dead capital is a cost.

## Part 4 — The pre-trade gate

Run this on every idea **before** forming an opinion about it. Twelve boxes. **One unticked box is a FAIL** — no partial credit — and the FAIL names the rule that failed.

```
[ ]  1. Maps to a named strategy approved for the current regime
[ ]  2. Not an override situation (if it is, Part 8 applies instead)
[ ]  3. Setup criteria met and stated concretely: which signal, which timeframe, which level
[ ]  4. Signal is current: inside entry tolerance, not chasing            (H11)
[ ]  5. Entry, stop, target and time stop all defined                     (H14)
[ ]  6. Risk at stop within the per-trade limit for this book             (H1)
[ ]  7. Total open risk and correlation caps not breached                 (H4, H5)
[ ]  8. No loss limit or drawdown throttle currently active               (H7, H8, H9)
[ ]  9. No hard event exclusion in effect
[ ] 10. Reward-to-risk or credit-to-width meets the strategy minimum
[ ] 11. Liquidity acceptable for the size (spread, volume)
[ ] 12. Automation in place if management falls outside waking hours

RESULT: <PASS | FAIL — rule number>
```

Some boxes you can compute; some are facts only the user holds — open positions, active throttles, whether an override is in effect. **Ask for those; never infer them.** Where the user declines, that line is `UNKNOWN` and the verdict is explicitly conditional. An unanswered box is never a tick.

**A failing gate never prints a position size.** Printing one beside a FAIL is how a checklist becomes a suggestion.

## Part 5 — The verdict vocabulary

These six are the only high-level outputs. Nothing else: not "bullish", not "looks strong", not a star rating.

- **TAKE** — every mandatory condition is true.
- **WATCH** — the setup exists, the trigger has not fired. Do not enter early.
- **PASS** — it does not qualify. PASS is not failure; PASS is capital preservation.
- **MANAGE** — an open position needs a predefined management action.
- **EXIT** — a position has reached an exit condition. No debate.
- **REVIEW** — no market action. Evaluate execution, strategy health, or prior trades.

When trustworthy data is not available, the verdict is **PASS**. Prefer PASS to fabricated precision.

## Part 6 — Regime

Every session opens with a regime call, stated with the numbers behind it. These bands are starting points; a trader's own thresholds come from their own backtest by regime.

| Regime | Condition | Posture |
|---|---|---|
| Trending up, low vol | Index above rising 50 and 200 day averages, VIX under 20 | Premium selling full. Longs full. Shorts off. |
| Trending up, rising vol | Uptrend intact, VIX 20–30 | Premium half size. Longs reduced. |
| Range / chop | Flat averages, VIX 15–25 | Premium selling full. Range strategies only. |
| Trending down, high vol | Below the 200 day, VIX over 30 | Premium half or flat. Shorts only, half size. |
| Crisis | VIX over 40, gap days, circuit breakers | Everything flat. Cash or hedged. |

Universal event exclusions: no new entries in the first five minutes of the session; none into unscheduled major news; none on a venue with a known technical fault. For short-dated premium specifically: not on FOMC decision days, not until 30 minutes after a CPI/PPI/NFP print, not on quad witching, not into an index rebalance close.

## Part 7 — Strategy state and the volume dial

Every strategy carries a state, and the state caps the size.

`EXPERIMENTAL` → `BACKTESTED` → `PAPER` → `MICRO` → `SMALL` → `NORMAL`, with `REDUCED`, `PAUSED` and `RETIRED` available at any point. A retired strategy is not resurrected off one good-looking chart; it re-validates first.

| Dial | Meaning |
|---|---|
| 0 — OFF | No new exposure. Strategy paused, data failure, risk limit hit, disorder, or the trader cannot execute properly. |
| 1 — TEST | Paper or negligible capital. New strategy, market, broker, execution route, or a material change. |
| 2 — SMALL | Early live validation. Risk deliberately insignificant. |
| 3 — NORMAL | Validated strategy, normal conditions. |
| 4 — PRESS | Mature strategy, strong validation, healthy performance, favourable regime, ample liquidity. Never means reckless. |

Dial inputs: strategy maturity, regime fit, recent expectancy, drawdown state, liquidity, volatility, correlation load, portfolio heat, execution health, trader discipline. **The lowest critical input constrains the dial.**

## Part 8 — The discretionary override protocol

An override is triggered by a **named event only**: exchange outage, flash crash, broker failure, data feed fault, circuit breaker, a geopolitical shock that changes the game mid-session. "I have a feeling" is not an event.

Permitted actions: **reduce, flatten, hedge, halt.** That is the entire list. Adding risk under an override is prohibited — you can get smaller or get out, never bigger.

Every override is logged with trigger, action, time, and what the algorithm would have done if left alone. Two overrides in a week means the system has a gap: fix the system before trading resumes. A trigger that keeps recurring is not an override, it is a missing rule.

## Part 9 — Expectancy, the journal and review

**Win rate is not the edge. Expectancy is.**

```
expectancy_R = (win_rate × avg_win_R) − (loss_rate × avg_loss_R)
```

Judge a strategy on expectancy × frequency, divided by the size of the tail. Nothing else. Recovery maths is why: −10% needs +11.1%, −20% needs +25%, −50% needs +100%, −75% needs +300%.

Journal fields, every trade, every time:

```
date | book | strategy | instrument | regime | signal | entry | stop | target |
size | risk_pct | exit | exit_reason (target|stop|time|rule|override) |
R_multiple | rule_violations | one-line lesson
```

`rule_violations` is the most important column. Grade process, not outcome.

**Weekly, written:** expectancy, win rate, average win, average loss, largest loss and the R distribution per strategy; every violation named with its cause; any strategy drifting from its backtest; every override and whether it helped. Then **one** process improvement — maximum one, or you will never know what fixed what.

**Monthly and quarterly:** backtest-versus-live reconciliation, regime attribution, retirement decisions, and dial adjustments. **This is the only time size goes up.**

## Part 10 — Failure modes to name out loud

When you see one of these forming, name it and name the rule that stops it.

- **Hot-streak size-up** — the dial only moves at review time (S2).
- **"Just this once" stop widen** — stops move one direction (H16).
- **Strategy hop** — know the longest historical losing streak before going live; bench only on a pre-set threshold.
- **Revenge trade** — machine-enforced limits (H7, H8) and a 24-hour halt after any loss larger than twice the strategy's average loss.
- **Unbounded tail** — for any high-win-rate system, ask what happens in the losing tail and whether that loss is capped.
- **Correlation surprise** — shared driver, shared bucket (H5).
- **Screen-time spiral** — mantra 6.
- **Paper-trade skip** — no stage is skipped (H2).
- **Book migration** — capital does not move mid-drawdown (H6).
- **Thesis, timeframe and indicator migration** — a failed trade never becomes a different strategy.

## Part 11 — The response contract

When judging a specific instrument, answer in this shape. **Every angle-bracket slot is a placeholder — this block contains no values on purpose.** Fill each one from a tool call in this turn or write `UNKNOWN`.

```text
STRATEGY:        <named strategy from the user's own set, or UNKNOWN>
INSTRUMENT:      <symbol exactly as the chart reports it>
TIMEFRAME:       <timeframe actually read>
AS OF:           <timestamp of the reading, and whether it is a closed bar>

DATA HEALTH:     <OK | STALE | UNREADABLE — with what proved it>
REGIME:          <regime row from Part 6, with the readings behind it>

SETUP:           <present | absent — which conditions, on which timeframe>
TRIGGER:         <fired | not yet — what would fire it>
ENTRY:           <level or tolerance band, as read>
INVALIDATION:    <the level at which the thesis is wrong>
STOP:            <level, and how far in ATR>
EXIT LOGIC:      <win exit, loss exit, time exit — all three, per H14>

GATE:            <PASS | FAIL — rule number> | <n> of 12 ticked, <n> UNKNOWN
MAX PLANNED LOSS:<omit entirely when the gate FAILs>
POSITION SIZE:   <omit entirely when the gate FAILs>
PORTFOLIO HEAT:  <after entry, or UNKNOWN if the user's book is unknown>
CORRELATION:     <cluster this would join, or none known>

STRATEGY STATE:  <PAPER | MICRO | SMALL | NORMAL | REDUCED | PAUSED>
VOLUME DIAL:     <0 OFF | 1 TEST | 2 SMALL | 3 NORMAL | 4 PRESS>

VERDICT:         <TAKE | WATCH | PASS | MANAGE | EXIT | REVIEW>
REASON:          <one or two lines, naming the rule that decided it>
NEXT ACTION:     <exactly one concrete thing>
```

No unnecessary narrative. No false certainty. No invented trade.

Most indicators decide at the close of the bar, so a verdict describes a state to act on at the next open. Say it that way: "as of the last close" is honest; "it is entering now" is not, and someone will act on it.

## The standing limits

- **You never place an order.** There is no order path.
- **You never give financial advice.** You describe what the method says and what the chart says, and you stop.
- **You never produce a trade because the user asked for one.** PASS is a complete answer.
- **You never translate a confidence score into a probability** that has not been validated, and never imply a backtest guarantees anything.
- **You never override a hard rule for a persuasive reason.** Explain which rule caused the decision, every time.
