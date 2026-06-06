---
name: convert-webinar-reg-page
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author webinar registration pages: time/date framing, big-promise headline, three-bullet curiosity stack, attendance-driving copy. Emits brief + paste-ready HTML/CSS with form + countdown markup.
  Use when the user has a scheduled live or evergreen webinar and needs a registration page that drives both opt-in and show-up rates.
  Not for the webinar itself (see /funnel conviction-webinar) or generic opt-in pages (see /convert squeeze-page, /convert lead-magnet-page).
triggers:
  - webinar registration page
  - webinar reg page
  - webinar opt-in
  - register for webinar
  - convert webinar-reg
  - masterclass registration
  - free training registration
negative_triggers:
  - squeeze page
  - lead magnet page
  - sales page
  - audit my webinar reg
  - the webinar script itself
tags: [conversion, copy, page, webinar, donahoe-method, html]
priority: 85
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-squeeze-page, convert-lead-magnet-page, convert-thank-you-page, convert-four-questions, convert-temperature, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references long-form webinar-funnel canon, Schwartz awareness levels, Cialdini commitment-and-consistency for show-up rates"
---

# Convert Webinar Registration Page - The Reg Page

> *"A webinar reg page has two jobs, not one. Get the registration. Get the show-up. Most pages optimize for the first and ignore the second - which is why most webinars run 18% live attendance. The Method does both."*

This skill builds the webinar registration page: Method-applied above-fold copy, time/date anchoring, three-bullet curiosity stack, and the show-up cues that lift live attendance.

## When to Use

Trigger phrases: `webinar registration page`, `webinar reg page`, `register for webinar`, `masterclass registration`, `free training registration`, `/convert webinar-reg <event>`.

Use when:
- The user has a scheduled live webinar (or an evergreen / "just-in-time" loop simulating live).
- A registration page needs to convert *and* drive show-up.

## When NOT to Use

- **The webinar script itself** → `/funnel conviction-webinar`.
- **Generic opt-in for a downloadable** → `/convert lead-magnet-page` or `/convert squeeze-page`.
- **Post-registration thank-you / calendar page** → `/convert thank-you-page`.
- **Replay / encore page after the live** → handled by the email pack + a thank-you-style template.

## Inputs

Required:
1. **Webinar title** + **the big promise** (one specific outcome the attendee will have at the end).
2. **Date/time** (or "starts in X minutes" if evergreen).
3. **Presenter name + Drive-By bio.**
4. **One person + Nerve.**
5. **Form destination + post-registration URL** (usually the thank-you page with calendar add + reminder setup).

Optional:
- **Attendance bonus** - something attendees get only if they show up live (drives show-up dramatically).
- **Brand colors / logo / presenter headshot.**
- **`out_path`** - defaults via `build_report_path`.

## Workflow - All Eight Method Phases

### Phase 0 - Four Questions

- **Why You?** - Why this *specific* webinar matters to this reader, this week.
- **Why Me?** - Drive-By presenter credibility.
- **Why This?** - Why this approach / mechanism / framework taught in the webinar.
- **Why Now?** - Real (the live date) + the attendance bonus + the cost of waiting.

### Phase 1 - Temperature

Webinar reg pages run **Cool to Warm**. For Ice Cold traffic, route through a bridge page first. Page length 400–900 words.

### Phase 2 - Four-Layer Open (call `convert-open`)

Compressed:
- Layer 1 = Nerve Strike headline that names the outcome.
- Layer 2 = Side Door subhead - the casual "I'm going to walk you through..." frame.
- Layer 3 = Skin in the Game in one paragraph (presenter's qualification to teach this).
- Layer 4 = Fingerprint as a one-line aside.

### Phase 3 - Three Locks

- **Want** = the post-webinar state.
- **Trust** = presenter Drive-By + one Anecdote.
- **Excuse** = "free, 60 minutes, you can leave anytime - and there's an attendance bonus for staying live."

### Phase 4 - Bullets (call `convert-bullets`)

The classic webinar reg-page bullet stack: **3 bullets**. One Keyhole, one Snapshot, one Flip. Each one is a curiosity gap that only the webinar resolves.

- *"Why everything you've been told about [X] is actually backwards - and the simple framework that fixes it in 20 minutes."* (Flip)
- *"How [name] used the [thing] to [result] - without [common requirement]."* (Snapshot)
- *"The [unexpected thing] that quietly determines whether [outcome] is even possible. (Slide 14.)"* (Keyhole)

Three. Not five. Not ten. Three is the canonical webinar bullet count for a reason - more dilutes curiosity.

### Phase 5 - Proof (call `convert-proof`)

One Anecdote or Receipt + one Drive-By for the presenter. Heavy proof distracts from the date/time anchor.

### Phase 6 - Cascade Close (call `convert-close`)

Compact:
- Stack - date, time, duration, attendance bonus.
- Vision - what they'll have at the end of the 60 minutes.
- Math - "free + your time."
- Safety Net - "you can leave anytime, no replay pressure."
- Door - the registration form button.

### Phase 7 - Greased Chute

The eye must move: headline → date/time → 3 bullets → form → presenter bio. Five movements, no detours.

### Phase 8 - Voice + Bullshit Filter

The biggest filter test: *"Is the big promise something I can actually deliver in 60 minutes, or is it bait?"* Over-promising on the reg page tanks both show-up *and* the post-webinar offer's conversion. Promise what you can deliver.

## Section Architecture

| # | Section | Purpose |
|---|---------|---------|
| 1 | Pre-headline (date/time + "live" anchor) | Time framing |
| 2 | Headline (big promise) | Open Layer 1 |
| 3 | Subhead (Layers 2–3) | Side Door + Skin |
| 4 | Date/time/duration block | Anchor + countdown |
| 5 | Three bullets | Curiosity stack |
| 6 | Registration form | Door |
| 7 | Presenter bio block | Trust anchor |
| 8 | Attendance bonus reminder | Show-up driver |

## HTML/CSS Reference Implementation

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{WEBINAR_TITLE}} - {{BRAND}}</title>
  <meta name="description" content="{{META_DESCRIPTION}}">
  <meta property="og:title" content="{{WEBINAR_TITLE}}">
  <meta property="og:description" content="{{META_DESCRIPTION}}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="{{OG_IMAGE_URL}}">
  <style>
    :root{--ink:#0e1116;--ink-soft:#3a3f47;--paper:#fbfaf6;--accent:#c0392b;--accent-ink:#fff;--rule:#e6e2d8;--max:680px}
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font:18px/1.55 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--paper)}
    main{max-width:var(--max);margin:0 auto;padding:24px 20px 64px}
    .pre-h{font-size:13px;color:var(--accent);text-transform:uppercase;letter-spacing:.1em;font-weight:700;margin:0 0 8px}
    h1{font-size:clamp(28px,5.5vw,42px);line-height:1.16;margin:0 0 14px}
    h2{font-size:22px;margin:32px 0 12px}
    p{margin:0 0 16px}
    p.subhead{font-size:20px;color:var(--ink-soft);margin:0 0 24px}
    .when{background:#fff;border:1px solid var(--rule);padding:14px 18px;border-radius:8px;margin:0 0 20px;display:grid;grid-template-columns:1fr;gap:6px}
    .when strong{font-size:18px}
    .when small{color:var(--ink-soft);font-size:14px}
    .countdown{font-variant-numeric:tabular-nums;font-weight:700;color:var(--accent)}
    ul.bullets{list-style:none;padding:0;margin:0 0 24px}
    ul.bullets li{padding:10px 0 10px 28px;position:relative;border-bottom:1px solid var(--rule)}
    ul.bullets li::before{content:"";position:absolute;left:6px;top:18px;width:10px;height:10px;background:var(--accent);border-radius:2px}
    .form-card{background:#fff;border:1px solid var(--rule);padding:18px;border-radius:8px;margin:0 0 28px}
    form{display:grid;grid-template-columns:1fr;gap:10px}
    @media(min-width:480px){form{grid-template-columns:1fr auto}}
    label.sr{position:absolute;left:-9999px}
    input[type=email],input[type=text]{padding:14px;font-size:17px;border:1px solid var(--rule);border-radius:6px;background:#fff}
    input:focus-visible{outline:3px solid var(--accent);outline-offset:1px}
    button.cta{padding:14px 22px;background:var(--accent);color:var(--accent-ink);border:0;border-radius:6px;font-size:17px;font-weight:700;cursor:pointer}
    button.cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
    .presenter{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;background:#fff;border:1px solid var(--rule);padding:14px;border-radius:8px;margin:0 0 18px}
    .presenter img{width:64px;height:64px;border-radius:50%;object-fit:cover}
    .presenter p{margin:0;font-size:15px;color:var(--ink-soft)}
    .bonus{background:#fff8d8;border:1px dashed #e2c34a;padding:14px 18px;border-radius:8px;font-size:15px;margin-top:20px}
    @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
  </style>
</head>
<body>
<main>
  <p class="pre-h">FREE LIVE TRAINING - {{DATE}}</p>
  <h1>{{HEADLINE_BIG_PROMISE}}</h1>
  <p class="subhead">{{SUBHEAD_SIDE_DOOR_SKIN}}</p>

  <div class="when" aria-label="Webinar date and time">
    <strong>{{DAY}}, {{DATE}} at {{TIME_WITH_TZ}}</strong>
    <small>{{DURATION}} · Live, with Q&amp;A · <span class="countdown" id="cd" aria-live="polite">{{COUNTDOWN_PLACEHOLDER}}</span></small>
  </div>

  <h2>What you'll walk away with</h2>
  <ul class="bullets">
    <li>{{BULLET_FLIP}}</li>
    <li>{{BULLET_SNAPSHOT}}</li>
    <li>{{BULLET_KEYHOLE}}</li>
  </ul>

  <div class="form-card">
    <form action="{{FORM_ACTION_URL}}" method="post" novalidate>
      <label class="sr" for="firstname">First name</label>
      <input id="firstname" type="text" name="first_name" placeholder="First name" autocomplete="given-name" required>
      <label class="sr" for="email">Email address</label>
      <input id="email" type="email" name="email" placeholder="you@example.com" autocomplete="email" required aria-required="true">
      <button class="cta" type="submit" aria-label="{{CTA_ARIA}}">{{CTA_REGISTER_VISION}}</button>
    </form>
  </div>

  <div class="presenter">
    <img src="{{PRESENTER_HEADSHOT_URL}}" alt="{{PRESENTER_NAME}}">
    <p><strong>{{PRESENTER_NAME}}</strong> - {{PRESENTER_DRIVE_BY_BIO}}</p>
  </div>

  <aside class="bonus" role="note">
    <strong>Show up live, get this:</strong> {{ATTENDANCE_BONUS_DESCRIPTION}}
  </aside>
</main>

<script>
  // Live-session countdown. Replace {{WEBINAR_ISO_DATETIME}} with the ISO datetime string.
  (function(){
    var target = new Date("{{WEBINAR_ISO_DATETIME}}").getTime();
    var el = document.getElementById('cd');
    if (!el || isNaN(target)) return;
    function tick(){
      var now = Date.now();
      var d = Math.max(0, target - now);
      var h = Math.floor(d/3600000);
      var m = Math.floor((d%3600000)/60000);
      var s = Math.floor((d%60000)/1000);
      el.textContent = "Starts in " + h + "h " + m + "m " + s + "s";
      if (d <= 0) el.textContent = "Starting now";
    }
    tick();
    setInterval(tick, 1000);
  })();
</script>
</body>
</html>
```

CSS notes:
- The pre-headline ("FREE LIVE TRAINING - {DATE}") in red caps does heavy work: it's the *first* thing the eye sees and immediately establishes "live, scheduled, free."
- The date/time card is its own visual block - registrants who don't notice the time don't show up.
- The attendance-bonus aside uses the bump-style yellow box. Borrowed pattern, deliberately - same visual signal: "this is *additional* and *easy*."
- The presenter block sits *below* the form, not above. Keep the eye moving toward the registration before the bio reads.

## Output Template

```markdown
# Webinar Reg Page - {{WEBINAR_TITLE}}

**Date/time:** {{ISO_DATETIME}} ({{TZ}}) - duration {{N}} min
**Big promise:** {{ONE_LINE}}
**Presenter:** {{NAME}}, {{DRIVE_BY_BIO}}
**Attendance bonus:** {{DESCRIPTION_OR_NONE}}
**Form posts to:** {{ENDPOINT}}
**Post-registration URL:** {{URL}}

## Phase 0–8
- Four Questions: answers
- Open: compressed 4 layers
- Locks: Want / Trust (Drive-By + 1 Anecdote) / Excuse (free + leave anytime)
- Bullets: 3 (Flip + Snapshot + Keyhole)
- Cascade Close: Stack/Vision/Math/Safety/Door
- Voice Rules applied; Bullshit Filter is a separate downstream pass

## Final copy
- Pre-headline: "{{LINE}}"
- Headline: "{{H1}}"
- Subhead: "{{SUBHEAD}}"
- Date/time card: "{{LINE}}"
- 3 bullets: {{LIST}}
- Register button: "{{CTA}}"
- Presenter bio: "{{LINE}}"
- Attendance bonus aside: "{{LINE}}"

## HTML reference
{{HTML_BLOCK}}

## Method coverage report
```
Method coverage report:
  Open:           full - all 4 layers compressed; Fingerprint lives in voice and presenter framing
  Three Locks:    full - Want (post-webinar state), Trust (presenter Drive-By + 1 Anecdote), Excuse (free + leave anytime)
  Proof:          partial - presenter Drive-By + 1 Anecdote; full proof is the webinar itself
  Bullets:        partial - exactly 3 (Flip + Snapshot + Keyhole); fixed at 3 because more dilutes curiosity at this surface
  Cascade Close:  partial - Stack / Vision / Math / Safety Net / Door (the registration form); P.S./P.P.S. omitted (low-friction free reg)
  Greased Chute:  full - headline → date → bullets → form → bio → bonus; date/time anchored in first 200px
  Voice Rules:    full - first person, contractions, no marketing-speak
  Temperature:    {{COOL / WARM}}

Show-up: attendance bonus framed; date/time anchored top + form

Required next step: Run /convert bullshit-filter on this draft before shipping.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- The post-registration URL should be the thank-you page (`/convert thank-you-page`) which delivers calendar add + reminder setup + a 90-second prep video. Without that prep step, show-up drops 20-30%.
- For the webinar script itself (the 60-90 minute presentation), use `/funnel conviction-webinar`.
- Three bullets, not five. Not ten. The Method's bullet system applies, but the constraint is fixed at three for webinar reg pages - more dilutes curiosity.
- Do not bury the date/time. Pages where time is below the bullets convert worse than pages where time is in the first 200px of the screen.
- Attendance bonuses lift live show-up by 30-60% measurably. Don't skip this if live attendance matters.

## Lineage

- Webinar funnel canon - long-running info-marketing playbook (registration → reminder sequence → live → replay → close).
- Curiosity-bullet construction - Schwartz market sophistication (Breakthrough Advertising, 1966).
- Commitment-and-consistency for registration → show-up - Cialdini (Influence, 1984).
- The Method itself - Wayland-owned operating system.
