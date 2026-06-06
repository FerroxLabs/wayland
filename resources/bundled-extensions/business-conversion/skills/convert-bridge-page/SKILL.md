---
name: convert-bridge-page
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author advertorial / pre-sell / listicle bridge pages: cold-traffic decompression content that warms the reader before they hit the squeeze or sales page. Emits brief + paste-ready HTML/CSS in editorial style.
  Use when the user is sending cold paid traffic that would bounce off a direct sales page and needs a content-style warm-up surface.
  Not for the squeeze or sales page itself (see /convert squeeze-page, /convert sales-page) and not for blog-as-content-marketing (different intent).
triggers:
  - bridge page
  - advertorial
  - pre-sell page
  - listicle page
  - cold traffic bridge
  - convert bridge
  - native-style content page
negative_triggers:
  - squeeze page
  - sales page
  - thank you page
  - audit my advertorial
  - blog post
tags: [conversion, copy, page, bridge-page, donahoe-method, html]
priority: 85
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-squeeze-page, convert-lead-magnet-page, convert-sales-page, convert-four-questions, convert-temperature, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references advertorial / pre-sell content canon (Wall Street Journal-style direct-mail leads), Schwartz awareness levels, Halbert long-form lead pattern"
---

# Convert Bridge Page - Advertorial / Pre-Sell

> *"Cold traffic doesn't bounce because your sales page is bad. It bounces because the reader's nervous system saw 'sales page' and the back button felt like safety. The bridge page is where you decompress them - content first, offer later. Same reader, completely different conversion math."* - Wayland bridge-page extension to The Donahoe Method (the Method handles cold-traffic copy via Layer 2 Side Door; this skill applies that principle at the page-architecture level)

This skill builds the editorial-style cold-traffic decompression page: advertorial, listicle, or pre-sell content that warms the reader before they reach the squeeze, lead-magnet, or sales page downstream.

## When to Use

Trigger phrases: `bridge page`, `advertorial`, `pre-sell page`, `listicle page`, `cold traffic bridge`, `/convert bridge <topic>`.

Use when:
- The user is running paid traffic from cold sources (Meta, TikTok, native, YouTube).
- The downstream sales/opt-in page would bounce the cold visitor.
- A content-style warm-up page can absorb the cold click and pre-sell before transferring intent.

## When NOT to Use

- **Direct opt-in page** → `/convert squeeze-page` or `/convert lead-magnet-page`.
- **Long-form sales page** → `/convert sales-page`.
- **Generic blog post for SEO** → not this skill (different intent - bridges are paid-traffic decompression, not organic content).
- **Auditing existing advertorial** → `/convert audit`.

## Inputs

Required:
1. **The downstream destination** - what page does the bridge feed into? (Squeeze / lead magnet / sales page / VSL.)
2. **The angle** - what content frame absorbs cold traffic best for this offer? (Story article / listicle / case study / "weird trick" / mistake-and-fix / industry callout.)
3. **The traffic source** - Meta / TikTok / native / YouTube. Determines voice register and visual cues.
4. **One person + Nerve** (One Person Rule).
5. **The "soft pivot"** - how does the bridge transition from content into the next-step CTA without setting off sales detectors?

Optional:
- **Existing brand voice notes / publication name (if it sits on a content site).**
- **Real proof assets** (the bridge needs *real* data points - fake stats kill trust faster than no stats).
- **`out_path`** - defaults via `build_report_path`.

## Workflow - All Eight Method Phases (content-disguised)

A bridge page applies the full Method but the *frame* is editorial. The Open layers, the Locks, and the Close are all there - but they read like an article, not a sales letter.

### Phase 0 - Four Questions (call `convert-four-questions`)

Reframed editorially:
- **Why You?** - Why does this story / list / case matter to *this* reader, today?
- **Why Me?** - Why is the writer credible enough to be telling this story?
- **Why This?** - What's the angle that makes this content non-generic?
- **Why Now?** - What's the timely hook? (A market shift, a recent event, an industry trend.)

### Phase 1 - Temperature

Bridge pages live at **Ice Cold to Cool**. Page length 800–2,200 words. Long enough to decompress, short enough to keep momentum to the soft pivot.

### Phase 2 - Four-Layer Open (call `convert-open`)

The Open is the most critical 60 seconds of a bridge:
- Layer 1 = Nerve Strike disguised as a hook headline (story / shocking stat / contrarian claim).
- Layer 2 = Side Door is *built into* the editorial frame - the reader already knows they're reading an article, not a pitch.
- Layer 3 = Skin in the Game shows up as the writer/expert source.
- Layer 4 = Fingerprint = the angle of the article itself.

### Phase 3 - Three Locks

- **Want** = the article paints the desired state without naming the product.
- **Trust** = the article *is* the trust mechanism. Real research, named experts, specific numbers.
- **Excuse** = the soft pivot at the end frames the next step (the actual offer or opt-in) as the logical continuation.

### Phase 4 - Bullets

Embedded as listicle items, "5 things you should know," or article subheads. 3–7 bullet-style points. Every "bullet" is a 100-200 word mini-article inside the bridge.

### Phase 5 - Proof (call `convert-proof`)

Heavy. Bridge pages live or die on proof density:
- Real Receipts (numbers, dates, sources cited).
- Named Anecdotes (real customer or expert names).
- Drive-By credentials (the writer's bio, casually).
- Because (the mechanism, explained).

If a bridge uses fake or unverifiable stats, regulators, platforms, *and* readers all flag it. Don't.

### Phase 6 - Cascade Close (call `convert-close`)

The bridge close is the **soft pivot**. Not a cascade in the sales-page sense - more like:
- Stack = a one-paragraph summary of what the article showed.
- Vision = the reader's next-step state.
- Door = a single, framed CTA - *"Here's where to start"* / *"There's a free guide that walks through the next step here"*.

The CTA reads like editorial recommendation, not a button screaming BUY NOW.

### Phase 7 - Greased Chute (call `convert-chute`)

Bridge pages need editorial chute discipline:
- Subheads every 200–300 words.
- Pullquotes break visual rhythm.
- Open loops at section transitions.
- Read-aloud test: should sound like a magazine writer, not a marketer.

### Phase 8 - Voice + Bullshit Filter

The biggest filter test for a bridge: *"Does this read like content or like marketing-disguised-as-content?"* The reader's gut detects the difference in milliseconds. Real value first, soft pivot later.

## Section Architecture

| # | Section | Purpose |
|---|---------|---------|
| 1 | Editorial-style headline | Open Layer 1 |
| 2 | Subhead / kicker | Frame as article |
| 3 | Author byline + date | Editorial credibility |
| 4 | Hook paragraph (Open Layers 2–4) | Decompression |
| 5 | Body sections (3–7 subheads) | Want + Trust locks |
| 6 | Proof callouts (pullquotes, stats) | Trust reinforcement |
| 7 | The "what now" pivot paragraph | Excuse lock + soft Close |
| 8 | The single soft-pivot CTA | Door |
| 9 | Author bio block (Drive-By formal) | Trust anchor |

## HTML/CSS Reference Implementation

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ARTICLE_TITLE}} - {{PUBLICATION_OR_BRAND}}</title>
  <meta name="description" content="{{META_DESCRIPTION}}">
  <meta property="og:title" content="{{ARTICLE_TITLE}}">
  <meta property="og:description" content="{{META_DESCRIPTION}}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="{{OG_IMAGE_URL}}">
  <style>
    :root{--ink:#15191f;--ink-soft:#4a4f57;--paper:#fffefb;--accent:#0f3c1f;--accent-ink:#fff;--rule:#e6e2d8;--max:680px}
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font:18px/1.7 Georgia,"Times New Roman",serif;color:var(--ink);background:var(--paper)}
    .pub{max-width:var(--max);margin:0 auto;padding:18px 20px 0;font:13px/1.4 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.08em}
    article{max-width:var(--max);margin:0 auto;padding:0 20px 64px}
    h1{font-size:clamp(28px,5.5vw,42px);line-height:1.18;margin:8px 0 14px;font-weight:700}
    p.kicker{font-size:18px;color:var(--ink-soft);font-style:italic;margin:0 0 16px;font-family:Georgia,"Times New Roman",serif}
    p.byline{font-size:13px;color:var(--ink-soft);font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;margin:0 0 24px;border-bottom:1px solid var(--rule);padding-bottom:14px}
    h2{font-size:24px;margin:40px 0 12px;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
    p{margin:0 0 18px}
    blockquote.pull{margin:24px 0;padding:18px 22px;border-left:4px solid var(--accent);background:#fff;font-size:22px;line-height:1.4;font-style:italic;color:var(--ink)}
    .stat{display:inline-block;font-weight:700;color:var(--accent)}
    .pivot{background:#fff;border:1px solid var(--rule);padding:22px;border-radius:8px;margin:36px 0 16px}
    .pivot a.cta{display:inline-block;margin-top:8px;padding:14px 22px;background:var(--accent);color:var(--accent-ink);text-decoration:none;font-weight:700;font-size:16px;border-radius:6px;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
    .pivot a.cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
    .author{margin-top:48px;padding:18px;background:#fff;border:1px solid var(--rule);border-radius:8px;font-size:15px;color:var(--ink-soft);font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
    .author strong{color:var(--ink)}
    @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
  </style>
</head>
<body>
<p class="pub">{{PUBLICATION_OR_SECTION_LABEL}}</p>
<article>
  <h1>{{HEADLINE_HOOK}}</h1>
  <p class="kicker">{{KICKER_SUBHEAD}}</p>
  <p class="byline">By {{AUTHOR_NAME}}, {{AUTHOR_TITLE}} - {{PUBLISH_DATE}}</p>

  <p>{{HOOK_PARAGRAPH_OPEN_LAYERS_2_3_4}}</p>

  <h2>{{SECTION_1_SUBHEAD}}</h2>
  <p>{{BODY_PARAGRAPH_WITH_INLINE_SOURCE}}</p>
  <p>{{BODY_PARAGRAPH_2}}</p>

  <blockquote class="pull">{{PULLQUOTE_FROM_NAMED_SOURCE_OR_DATA_POINT}}</blockquote>

  <h2>{{SECTION_2_SUBHEAD}}</h2>
  <p>{{BODY_PARAGRAPH_WITH_RECEIPT_STAT}}</p>
  <p>{{BODY_PARAGRAPH_2}}</p>

  <h2>{{SECTION_3_SUBHEAD}}</h2>
  <p>{{BODY_PARAGRAPH}}</p>
  <p>{{BODY_PARAGRAPH_WITH_BECAUSE}}</p>

  <div class="pivot">
    <p>{{SOFT_PIVOT_PARAGRAPH_CONNECTING_ARTICLE_TO_NEXT_STEP}}</p>
    <a class="cta" href="{{NEXT_STEP_URL}}" aria-label="{{CTA_ARIA}}">{{CTA_LABEL_EDITORIAL_TONE}}</a>
  </div>

  <aside class="author">
    <p><strong>{{AUTHOR_NAME}}</strong> - {{AUTHOR_BIO_DRIVE_BY}}</p>
  </aside>
</article>
</body>
</html>
```

CSS notes:
- Serif body type + sans-serif headlines = canonical editorial signal. Visitors should think "article," not "landing page."
- The pullquote and section subheads carry the long-form rhythm. Without them, the page reads like a wall of text and chute breaks.
- The pivot CTA uses an editorial-toned label ("Read the full breakdown," "Get the free guide," "See the case study") - never "BUY NOW" or "Click here."
- The publication label at the very top is optional but powerful when the bridge sits on a real content sub-domain (`/insights/`, `/journal/`, etc.).

## Output Template

```markdown
# Bridge Page - {{ANGLE}}

**Downstream destination:** {{NEXT_PAGE}}
**Traffic source:** {{META/TIKTOK/NATIVE/YOUTUBE}}
**One person:** {{NAME}}, {{NERVE}}
**Temperature:** {{ICE_COLD/COOL}}
**Word count target:** {{N}}

## Phase 0–8
- Four Questions (editorial reframe): {{ANSWERS}}
- Open: hook headline + editorial frame Open
- Locks: Want / Trust (article body) / Excuse (soft pivot)
- Bullets: embedded as 3–7 subheads
- Proof: heavy - Receipts, Anecdotes, Drive-By, Because
- Close: soft pivot, single editorial CTA
- Voice Rules applied (no fake stats, no marketing-as-content); Bullshit Filter is a separate downstream pass

## Final copy
- Publication label: "{{LABEL}}"
- Hook headline: "{{H1}}"
- Kicker: "{{KICKER}}"
- Byline: "{{BYLINE}}"
- Hook paragraph: "{{P}}"
- Section 1 subhead + body: ...
- Section 2 subhead + body: ...
- Section 3 subhead + body: ...
- Pullquote: "{{Q}}"
- Soft pivot paragraph: "{{P}}"
- CTA label: "{{LABEL}}"
- Author bio: "{{BIO}}"

## HTML reference
{{HTML_BLOCK}}

## Method coverage report
```
Method coverage report:
  Open:           full - all 4 layers in editorial frame; Fingerprint = the angle (the contrarian editorial take)
  Three Locks:    partial - Want and Trust load through the article body; Excuse compressed to the soft pivot (free CTA, no purchase decision yet)
  Proof:          full - Receipts, Anecdotes, Drive-By, and Because reasoning carry the body (proof-heavy by design)
  Bullets:        partial - embedded as section subheads rather than rendered as a bullet block (editorial format requires it)
  Cascade Close:  partial - soft pivot with Stack + Vision + Door; Math, Safety Net, and P.S./P.P.S. live downstream on the destination page
  Greased Chute:  full - subheads every 200-300 words, pullquotes, open loops at section boundaries
  Voice Rules:    full - first-person writer voice, no marketing-speak; reads like content, not marketing-as-content
  Temperature:    {{ICE COLD / COOL}}

Ethics: every stat and claim must be real and source-able (platforms penalize unverifiable advertorial claims)

Required next step: Run /convert bullshit-filter on this draft before shipping - bridge pages fail platform review when voice slips into marketing-as-content.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- The bridge page exists to convert *cold-paid* traffic. Don't run it organic - organic readers expect content; the soft pivot still reads as marketing if context is wrong.
- All proof in a bridge must be source-able. Platforms (Meta especially) penalize unverifiable advertorial claims.
- Page sub-domain matters. A bridge at `brand.com/article/...` outperforms `brand.com/lp1/...` by a wide margin.
- The bridge feeds into one of: squeeze page (most common), lead-magnet page, or sales page (for warmer cold traffic).

## Lineage

- Advertorial / pre-sell canon - informed by long-running Wall Street Journal-style direct-mail leads (the "Two Young Men" Wall Street Journal subscription letter being the canonical reference).
- Awareness-level fit (typically targets levels 1–2, raising them to 3) - Schwartz (Breakthrough Advertising, 1966).
- Long-form lead pattern - Halbert (Boron Letters, 1984).
- The Method itself - Wayland-owned operating system.
