---
name: funnels-evergreen
slash_command: false
pack: business-funnels
family: funnel_sequence
description: |
  Design an evergreen / auto-webinar funnel - registers → simulated-live broadcast → offer page → cart with deadline-driven scarcity. Specifies the registration cadence, replay rotation, scarcity mechanics, deadline-funnel mechanics, and the trust-preserving disclosure rules.
  Use when the user has validated a live webinar (5%+ attendee-to-sale) and wants to scale it without delivering live, OR is launching an evergreen course business.
  Not for designing a live one-time webinar (use /funnel conviction-webinar) or a launch-style event (use /funnel cart-cycle-launch).
triggers:
  - evergreen webinar
  - auto-webinar
  - automated webinar
  - evergreen funnel
  - perpetual webinar
  - scale my webinar
  - simulated live webinar
  - replay funnel
  - on-demand webinar
  - 24-7 webinar
  - deadline funnel
negative_triggers:
  - live webinar pitch
  - one-time webinar
  - audit my live url
  - shopify automation
tags: [funnels, evergreen, webinar, automation, scarcity]
priority: 90
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [funnels, funnels-conviction-webinar, funnels-offer, convert-webinar-reg-page, convert-vsl, convert-sales-page, funnels-daily-pivot]
attribution:
  lineage: "Wayland Business Suite (Original) - evergreen-funnel methodology grounded in Brunson auto-webinar mechanics + Kern stick strategy applied to async + standard deadline-funnel scarcity + trust-disclosure rules to preserve long-term brand integrity"
---

# Funnels Evergreen - The Auto-Webinar Funnel

> *"Evergreen is the live webinar's compound-interest version - but only if the live one already converted."*

This skill designs an **evergreen / auto-webinar funnel** - a webinar that runs 24/7 on autopilot, with simulated-live mechanics, deadline-driven scarcity, and an offer that converts on rotation. Evergreen is leverage: the live webinar that converts at 8% live should convert at 2–4% evergreen, scaling without the operator's calendar constraint.

The hard rule: **never put a webinar evergreen until the live version has been validated** (5%+ attendee-to-sale, 3+ live runs, refund rate <10%). Premature evergreen-ization is the #1 way to burn ad spend on a broken funnel scaled to the moon.

## When to Use

Trigger phrases: "evergreen webinar", "auto-webinar", "automated webinar", "evergreen funnel", "scale my webinar", "simulated live webinar", "deadline funnel", `/funnel evergreen <product>`.

Use when:
- The user has a validated live webinar (5%+ attendee-to-sale, 3+ runs) and wants to scale without delivering live
- The user is launching an evergreen course business and wants the funnel architecture from day one
- The user has an evergreen funnel that's underperforming and needs to fix the simulated-live mechanics or the scarcity layer

Do NOT use for:
- Designing a live one-time webinar (use `funnels-conviction-webinar`)
- Designing a launch-style cart-cycle event (use `funnels-cart-cycle-launch`)
- Authoring the registration page alone (use `convert-webinar-reg-page`)
- Authoring the VSL inside the auto-webinar (use `convert-vsl`)

## Conversion Benchmarks

| Stage | Evergreen baseline (warm) | Evergreen baseline (cold ads) |
|-------|---------------------------|-------------------------------|
| Reg → "live" attendance | 30–55% | 25–40% |
| Attendance → sale | 2–6% | 1–4% |
| Reg-to-buyer (full funnel) | 1–3% | 0.5–2% |

Evergreen typically runs at 20–40% of live performance. Live at 8% → evergreen at 2–3% is normal. Live at 12% → evergreen at 3–5% is normal.

## The 5 Architecture Layers

### Layer 1 - The Registration Cadence

**Job:** convert traffic to registrant with a believable "next session" time.

**Components:**

1. **Registration page** (handoff to `convert-webinar-reg-page`). Includes:
   - Headline with the webinar promise
   - "Next session" prominently displayed (multiple times in the next 48 hours, rotating slots)
   - Presenter credibility
   - 3–5 bullet "what you'll learn"
   - Bonus for live-attendance ("attendees get [X]; replays don't")
   - Disclosure that the broadcast is recorded (see Trust Disclosure below)

2. **Time-slot rotation logic.** Default: offer 4–6 slots in the next 48 hours, with the *closest* slot always 1–4 hours away. The "next session in 90 minutes" mechanic drives 30–50% higher reg-to-attend than "next session tomorrow."

3. **Confirmation + reminder sequence.** Email 1 immediate, Email 2 (12-24 hours before "live"), Email 3 (60 min before), SMS (10 min before - if collected).

### Layer 2 - The Simulated-Live Broadcast

**Job:** deliver the Conviction Webinar content (handoff from `funnels-conviction-webinar`) in a way that feels live without deceiving the viewer.

**Components:**

1. **Pre-recorded video** running on a fixed schedule. Same content as the live Conviction Webinar - pre-frame → 3 belief shifts → pitch → close.
2. **Chat simulation** (optional / contested) - fake chat messages that simulate live engagement. **Wayland default: OFF.** Fake chat is the line where evergreen tips from "scaled live" into deceptive. Trust loss > short-term conversion lift.
3. **Live-feel UI** - countdown to broadcast start, "live" indicator, "X attendees watching" counter. Use ONLY if you also include the trust-disclosure (below).
4. **Buy button reveal at minute 60–67** - same timing as live; not earlier (kills the belief-shift work).

### Layer 3 - The Trust Disclosure (NON-NEGOTIABLE)

The disclosure is what separates evergreen from deceptive. **The viewer must, somewhere, know the broadcast is recorded.**

**Acceptable disclosure modes (pick one or both):**

1. **On the registration page** - small but visible: *"This is a recorded broadcast scheduled for your time zone. Click here to read more."* + a footer FAQ entry explaining the simulated-live format.
2. **In the broadcast intro** - *"This is the recording of [date]'s session, replayed for you in full. Everything you'll see is exactly as I delivered it live."*

**The Wayland rule:** evergreen funnels that hide the recorded nature **suppress refund rate short-term but produce a chargeback / reputation crater within 6–18 months.** Do not skip the disclosure. The Bullshit Filter applies to the funnel architecture, not just the copy.

### Layer 4 - The Deadline / Cart-Window Scarcity

**Job:** create a real, individual deadline that drives the buy decision.

*The deadline-funnel principle (popularized in evergreen circles by Mark Thompson + Drew Mannings; lineage to Halbert's "limited-time offer" cadence + Cialdini scarcity).* Evergreen scarcity differs from launch scarcity: launch has one global deadline; evergreen has *per-buyer* deadlines that expire individually.

**Components:**

1. **Cart-window starts at broadcast minute 60** (when the buy button reveals).
2. **Cart-window ends 72 hours later** (per individual viewer). Default 72h; some operators use 24h or 7 days.
3. **Tools:** Deadline Funnel, Thrivecart per-buyer deadlines, or custom tracking. Each buyer's countdown is tied to their email + IP, not a global clock.
4. **Reason-why for the deadline.** *"Bonuses come off the table after Wednesday at midnight YOUR time"* - must include the *why*. Cialdini's because-effect.

**Trust rule for evergreen scarcity:** if the buyer revisits after the deadline, the price/bonus structure MUST actually change. Fake-resetting deadlines are the second-biggest evergreen trust killer (after fake live chat). Once the deadline is gone, it stays gone.

### Layer 5 - The Email Sequence (cart-window)

**Job:** drive the buyer back to the offer page during the 72-hour window.

Standard 5-email cart-window sequence (handoff to `funnels-daily-pivot` for authoring):

| Email | Send time | Subject pattern | Job |
|-------|-----------|----------------|-----|
| 1 | 1 hr post-attend | "Replay link inside" | Deliver the replay + buy link |
| 2 | 24 hr post-attend | "Story - [outcome]" | Story + soft pitch |
| 3 | 48 hr post-attend | "Question I keep getting" | Objection handling + pitch |
| 4 | 60 hr post-attend | "12 hours left" | Urgency + final case study |
| 5 | 71 hr post-attend | "Last call - closes at midnight" | Final CTA + cart-close |

## Workflow

### Phase 0 - Validate prerequisites

**Hard prerequisite:** the live version of this webinar (`funnels-conviction-webinar`) must have run 3+ times with 5%+ attendee-to-sale and refund rate <10%. If not validated, exit this skill and route user to `funnels-conviction-webinar` first.

### Phase 1 - Set the registration cadence

Configure:
- 4–6 time slots in the next 48 hours
- Closest slot always 1–4 hours away
- Time-zone auto-detection
- Confirmation email + reminder cadence (3 emails + 1 SMS)

### Phase 2 - Lock the simulated-live broadcast

- Use the validated live recording as the source
- Configure broadcast platform (EverWebinar, WebinarJam, Demio evergreen mode, custom)
- Decide chat mode (Wayland default: OFF)
- Decide live-feel UI scope (countdown / "live" badge / attendee counter)

### Phase 3 - Author the trust disclosure

Pick one or both disclosure modes. Author the exact copy. Place it on the registration page footer + in the broadcast intro.

### Phase 4 - Configure the deadline / cart-window

- Cart-window length (default 72 hours)
- Per-buyer deadline tool (Deadline Funnel / Thrivecart / custom)
- Reason-why copy ("bonuses come off because…")
- Post-deadline price / bonus structure

### Phase 5 - Author the cart-window email sequence

Handoff to `funnels-daily-pivot` with the 5-email cadence above. Each email tied to an individual deadline.

### Phase 6 - Set up tracking + iteration

- Reg → attend rate (target 30%+)
- Attend → sale rate (target 2–4% on cold, 4–6% on warm)
- Cart-window completion rate (% who buy within 72h)
- Refund rate (target <12%)
- Iterate the broadcast/email if any rate falls below target for 2 weeks

## Output template

```markdown
# Evergreen Webinar Funnel: <Product Name>

**Source live webinar:** <validated 3+ runs, X% attend-to-sale>
**Date:** <YYYY-MM-DD>
**Audience:** <One Person>

## Layer 1 - Registration Cadence

- **Slots offered:** <N> slots in next 48 hours
- **Closest slot:** 1–4 hours from registration
- **Confirmation email:** immediate
- **Reminder cadence:** <12-24h before> + <60 min before> + <SMS 10 min before>
- **Skill handoff:** `convert-webinar-reg-page` for the registration page

## Layer 2 - Simulated-Live Broadcast

- **Source recording:** <validated live broadcast date>
- **Platform:** <EverWebinar / WebinarJam / Demio / custom>
- **Live-feel UI:** <countdown ON / "live" badge ON or OFF / attendee counter ON or OFF>
- **Chat simulation:** OFF (Wayland default)
- **Buy button reveal:** minute 60–67

## Layer 3 - Trust Disclosure (NON-NEGOTIABLE)

**Disclosure mode:** <reg-page footer / broadcast intro / both>
**Reg-page disclosure copy:** "<exact copy>"
**Broadcast intro disclosure copy:** "<exact copy>"
**FAQ entry:** "<2-3 sentence explanation of the simulated-live format>"
**Bullshit Filter:** run separately via `convert-bullshit-filter` (coaching pass - no inline pass/fail stamp)

## Layer 4 - Deadline / Cart-Window Scarcity

- **Cart-window length:** 72 hours (per individual viewer)
- **Tool:** <Deadline Funnel / Thrivecart / custom>
- **Reason-why copy:** "<bonuses come off because [reason]>"
- **Post-deadline price/bonus structure:** <what changes after expiry>
- **Trust rule:** post-deadline state PERSISTS - no fake-resetting

## Layer 5 - Cart-Window Email Sequence

| # | Send time | Subject | Job |
|---|-----------|---------|-----|
| 1 | +1 hr | "Replay link inside" | deliver replay + buy link |
| 2 | +24 hr | "[Story-pivot subject]" | story + soft pitch |
| 3 | +48 hr | "Question I keep getting" | objection handling |
| 4 | +60 hr | "12 hours left" | urgency + case study |
| 5 | +71 hr | "Last call - closes at midnight" | cart-close |

**Skill handoff:** `funnels-daily-pivot` for email authoring

## Tracking + Iteration

- **Reg → attend target:** 30–55%
- **Attend → sale target:** 2–4% (cold) / 4–6% (warm)
- **Refund rate ceiling:** 12%
- **Iteration trigger:** any metric below target for 2 weeks → audit

## Compositional notes

- Hand off the registration page to `convert-webinar-reg-page`
- Hand off the broadcast script (already validated from `funnels-conviction-webinar`)
- Hand off the cart-window emails to `funnels-daily-pivot`
- Hand off the buy-button page to `convert-sales-page` (replay version)
- After 30 days of evergreen traffic, run `funnels-architecture-audit` to verify simulated-live + scarcity layers aren't leaking trust

## Lineage

The evergreen-funnel methodology synthesizes:
- *Brunson auto-webinar mechanics* - the simulated-live + per-buyer-deadline structure
- *Frank Kern's stick strategy applied to async* - the broadcast pacing
- *The deadline-funnel mechanic (popularized by Mark Thompson + Drew Mannings)* - per-buyer scarcity
- *Cialdini scarcity* (Cialdini, Influence, 1984) - the believable cap + reason-why
- *The Donahoe Bullshit Filter* - applied to disclosure rules

The trust-disclosure rule is the Wayland-specific addition. The canon (Brunson, Kern, Walker) tend to underweight long-term trust impact of hidden recorded broadcasts. The Wayland rule treats trust as a long-term asset that compounds; the disclosure is non-negotiable.
```

## Notes

- **Single most common evergreen mistake:** evergreen-izing a live webinar that hasn't validated. Live at 3% → evergreen at 0.8% → ad spend lights on fire. Validate live FIRST.
- **Second most common mistake:** fake-live chat. Tempting (~10–20% lift in some splits) but produces a chargeback wave 6–18 months out as buyers realize. The trust loss compounds. Wayland default: OFF.
- **Third most common mistake:** fake-resetting deadlines. If a buyer revisits after the deadline, the post-deadline state must PERSIST. Anything else is deceptive and produces refund + chargeback risk.
- **The trust disclosure is what makes evergreen sustainable.** Operators who skip it get short-term lift and a 12-18 month brand crater. Disclose, accept a 5–15% hit, build the long-term machine.
- **TM hygiene:** Brunson, Kern, Cialdini, Halbert, Thompson appear in body for educational lineage. The output uses generic "evergreen / auto-webinar" terminology - no branded methodology phrases.
