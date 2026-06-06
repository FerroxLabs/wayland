---
slash_command: false
name: market-landing
description: Run a section-by-section CRO teardown on a single landing page. Scores hero, value prop, social proof, features, objections, CTA, and footer; audits forms, mobile, and page speed; outputs prioritized fixes (quick wins / strategic / long-term) and A/B test hypotheses to a client-ready markdown report. Activates on phrases like "CRO review", "landing page audit", "improve my conversion rate", "/market landing acme.com/signup".
version: 1.0.0
author: Wayland Business Pack (port of zubair-trabzada/ai-marketing-claude)
license: MIT
metadata:
  wayland:
    tags: [marketing, landing-page, CRO, conversion, business, smb]
    related_skills: [market-audit, market-copy, market-funnel, market-ads]
  attribution:
    lineage: zubair-trabzada/ai-marketing-claude (skills/market-landing)
    license: MIT
prerequisites:
  python_packages: []
---

# Landing Page CRO Analysis

Standalone CRO teardown for a single landing page. Produces a section-by-section score, prioritized fixes, and A/B test hypotheses. Unlike `market-audit`, this skill does not fan out - it runs end-to-end in the parent and writes one report.

## When to Use
- User supplies a landing-page URL and asks for conversion optimization, CRO review, or signup-rate help
- Slash: `/market-landing <url>` or `/market landing <url>` (via `market` orchestrator)
- After `/market-audit` if the funnel dimension flagged the landing page as the bottleneck

## When NOT to Use
- Whole-site audit across many pages - use `market-audit`
- Copy-only rewrite without conversion-mechanic analysis - use `market-copy`
- Full funnel (ad → landing → email → checkout) - use `market-funnel`

*Authoring a fresh sales/squeeze/OTO/landing page from a brief - use `/convert <page-type>` (business-conversion pack). market-landing audits existing pages; convert-pack authors fresh ones.*

## Inputs
- `<url>` - required. Bare domains are normalized to `https://<url>`.
- `out_path` - optional. Default: `build_report_path("business-marketing", f"landing {url}")`.

## Workflow

### Step 1 - Fetch the page

Prefer `web_extract` for the readable text + visible CTAs. If the analysis needs raw HTML for above-the-fold structure, form field counts, button colors, or `<meta>` tags, use `terminal` + curl, then parse with `analyze_page.py` (shared with `market-audit`):

```bash
curl -L --max-filesize 200000 -A "Wayland-CRO-Bot/1.0" \
     -o .wayland/tmp/landing-<slug>.html "<url>"
```

```python
import sys
sys.path.insert(0, "business-marketing/market-audit/scripts")
from analyze_page import analyze
parsed = analyze(url)  # {seo, content, conversion, trust, tracking, technical, scores, ...}
```

Children-blocked tools do not apply here - this skill runs in the parent agent loop only.

### Step 2 - Identify the page type

Page type sets benchmark expectations and scoring weights.

| Page Type | Primary Goal | Good CR | Great CR |
|---|---|---|---|
| Lead Capture | Email/form submission | 5-10% | 15%+ |
| SaaS Signup | Free trial or freemium signup | 3-7% | 10%+ |
| E-commerce Product | Add to cart / Purchase | 2-4% | 5%+ |
| Webinar Registration | Register for event | 20-30% | 40%+ |
| App Download | Install app | 10-15% | 20%+ |
| Waitlist | Join waitlist | 15-25% | 35%+ |
| Consultation Booking | Schedule a call | 5-10% | 15%+ |
| Nonprofit Donation | Make a donation | 2-5% | 8%+ |

### Step 3 - Run the 7-point CRO framework

Score each section 1-10. Weights are fixed; total weighted score is reported out of 100.

#### Section 1 - Hero (weight 25%)

First-screen content. ~80% of conversion decisions begin here.

Checklist:
- [ ] Headline is visible within 2 seconds of page load
- [ ] Headline communicates the primary benefit (not a feature)
- [ ] Headline is under 10 words
- [ ] Subheadline expands on the headline with specificity
- [ ] Primary CTA is above the fold
- [ ] CTA button color contrasts with the background
- [ ] CTA text is action-oriented (not "Submit" or "Click Here")
- [ ] Hero image or video supports the message (not generic stock)
- [ ] Trust badges or social proof visible above the fold
- [ ] Page loads in under 3 seconds
- [ ] No navigation menu competing with the CTA (for dedicated landing pages)

Scoring criteria:
- 9-10: Headline is benefit-driven, specific, and compelling. CTA is clear and contrasting. Visual supports the message. Trust indicators present.
- 7-8: Strong headline and CTA but missing one element (trust badges, supporting visual, or specificity).
- 5-6: Generic headline or weak CTA. Missing multiple above-the-fold elements.
- 3-4: Headline is feature-focused or vague. CTA is below the fold or unclear.
- 1-2: No clear headline or CTA. Visitor cannot understand the offer within 5 seconds.

#### Section 2 - Value Proposition (weight 20%)

Checklist:
- [ ] Clear statement of what the product/service does
- [ ] Specific outcomes or results promised
- [ ] Differentiation from alternatives (why THIS solution)
- [ ] Target audience is clear (visitor knows if this is for them)
- [ ] Benefits are quantified where possible (save X hours, increase Y%)
- [ ] Value proposition is scannable (not buried in paragraphs)

Evaluate using the 4U framework:
1. **Useful** - Does it solve a real problem the visitor has?
2. **Urgent** - Is there a reason to act now?
3. **Unique** - Is it different from competitors?
4. **Ultra-specific** - Are claims concrete, not vague?

#### Section 3 - Social Proof (weight 15%)

Types of social proof, ranked by persuasion power:
1. Revenue/results metrics ("$2.4B processed", "500K users")
2. Named customer testimonials with photos, titles, and companies
3. Recognizable client logos
4. Case studies with specific results
5. Star ratings and review counts
6. Media mentions ("As seen in...")
7. Certifications and awards
8. User-generated content
9. Social media follower counts

Checklist:
- [ ] At least 2 types of social proof present
- [ ] Testimonials include real names and photos
- [ ] Testimonials mention specific results or outcomes
- [ ] Social proof is placed near decision points (close to CTAs)
- [ ] Numbers are specific (not rounded - "11,847" beats "10,000+")
- [ ] Logos are recognizable to the target audience
- [ ] Social proof is recent and relevant

#### Section 4 - Features and Benefits (weight 15%)

Checklist:
- [ ] Features are translated into benefits (what the feature DOES for the user)
- [ ] Content is scannable (icons, bullet points, short paragraphs)
- [ ] Visual hierarchy guides the eye through features
- [ ] Most important features/benefits are listed first
- [ ] Each feature section has a clear mini-headline
- [ ] Screenshots, demos, or visuals accompany feature descriptions
- [ ] Feature list is comprehensive but not overwhelming (3-7 key features)

Feature-to-benefit translation check:
- Bad: "AI-powered analytics dashboard"
- Good: "See exactly which campaigns drive revenue - AI analyzes your data so you don't have to"

#### Section 5 - Objection Handling (weight 10%)

Common objections by page type:

| Objection | How to Address |
|---|---|
| "Too expensive" | ROI calculator, price comparison, money-back guarantee |
| "Not sure it works" | Case studies, free trial, demo video |
| "Too complicated" | Setup wizard, onboarding support, "get started in 5 minutes" |
| "Not sure I need it" | Problem agitation, cost of inaction |
| "What if I don't like it?" | Free trial, money-back guarantee, cancel anytime |
| "Is my data safe?" | Security badges, compliance logos, privacy policy link |
| "I need to ask my team" | Shareable comparison page, team trial, ROI one-pager |

Checklist:
- [ ] FAQ section addresses top 3-5 objections
- [ ] Risk reversals present (guarantee, free trial, cancel anytime)
- [ ] Pricing transparency (no hidden fees or surprise costs)
- [ ] Security and privacy indicators where relevant
- [ ] Comparison with alternatives (if applicable)

#### Section 6 - Call-to-Action (weight 10%)

CTA button checklist:
- [ ] CTA text describes the VALUE, not the action ("Get My Free Report" vs "Submit")
- [ ] CTA button is visually dominant (size, color, whitespace)
- [ ] CTA appears multiple times on long pages
- [ ] Secondary CTA exists for visitors not ready to commit
- [ ] CTA has supporting microcopy (e.g., "No credit card required")
- [ ] Button text uses first person ("Start MY trial" vs "Start YOUR trial")
- [ ] CTA is specific to the offer (not generic)

CTA copy scoring:
- Weak: "Submit", "Click Here", "Learn More"
- Medium: "Sign Up", "Get Started", "Download Now"
- Strong: "Start My Free Trial", "Get My Custom Report", "Claim Your Discount"

#### Section 7 - Footer and Secondary Elements (weight 5%)

Checklist:
- [ ] Final CTA present at bottom of page
- [ ] Contact information or support options visible
- [ ] Privacy policy and terms of service linked
- [ ] Trust badges repeated near final CTA
- [ ] No competing links that lead away from conversion
- [ ] Copyright and legal information present
- [ ] Social media links (only if they support conversion, not distract)

### Step 4 - Copy scoring

Score the overall page copy on 5 dimensions (1-10 each):

1. **Clarity** - Can a visitor understand the offer in 5 seconds?
2. **Urgency** - Is there a reason to act NOW vs later?
3. **Specificity** - Are claims concrete with numbers, timeframes, outcomes?
4. **Proof** - Are claims backed by evidence, data, or testimonials?
5. **Action Orientation** - Does the copy drive toward a specific next step?

Copy Score = average of the 5 dimensions × 10 (out of 100).

### Step 5 - Form optimization audit

If the page has a form:

| Element | Best Practice |
|---|---|
| Field count | Every additional field reduces conversion ~7%. Lead capture: 3-5 fields max. |
| Labels | Use inline labels or floating labels. Avoid placeholder-only labels. |
| Button text | Match the value proposition. "Get My Free Guide" > "Submit". |
| Error handling | Inline validation. Specific error messages. Don't clear the entire form on error. |
| Multi-step | Break long forms into steps with progress indicator. |
| Required vs optional | Mark optional fields, not required ones. |
| Auto-fill | Enable browser auto-fill for standard fields. |
| Field types | Use appropriate input types (email, tel, url) for mobile keyboards. |

### Step 6 - Mobile responsiveness audit

Mobile is 60%+ of web traffic. Check:
- [ ] CTA is thumb-reachable (bottom half of screen)
- [ ] Text is readable without zooming (16px minimum body text)
- [ ] Forms are usable on mobile (large tap targets, appropriate keyboards)
- [ ] Images resize properly and don't break layout
- [ ] No horizontal scrolling required
- [ ] Page loads under 3 seconds on 4G
- [ ] Click-to-call for phone numbers
- [ ] Sticky CTA bar on scroll (if applicable)

### Step 7 - Page speed impact

Conversion impact benchmarks:

| Load Time | Conversion Impact |
|---|---|
| 0-2 seconds | Baseline (optimal) |
| 2-3 seconds | -7% conversion rate |
| 3-5 seconds | -20% conversion rate |
| 5-8 seconds | -35% conversion rate |
| 8+ seconds | -50%+ conversion rate |

Common speed issues to flag: unoptimized images (use WebP, lazy loading), render-blocking JavaScript, missing browser caching, no CDN, excessive third-party scripts, unminified CSS/JS.

### Step 8 - A/B test hypotheses

Format each test as: *"If we [CHANGE], then [METRIC] will [IMPROVE/INCREASE] because [REASON]."*

Candidate tests: headline variations (benefit vs outcome), CTA color and text, social-proof placement (above vs below fold), form field count (-1/-2 fields), hero image vs hero video, long-form vs short-form, urgency elements (countdown, limited spots), price anchoring, testimonial format (text vs video), chatbot/live chat.

### Step 9 - Heat-map interpretation guidance (no real data required)

- Expected attention zones based on page layout
- F-pattern vs Z-pattern reading based on content density
- Scroll-depth predictions based on page length and content breaks
- Click-probability zones based on visual hierarchy
- Rage-click indicators (elements that look clickable but aren't)
- Dead zones where content may be ignored

## Output

Write to `out_path` (default `.wayland/business-marketing/<ts>-landing-<slug>.md`). Required sections, in order:

1. Header - URL, date, page type, **Overall CRO Score: X/100**, estimated current CR range, realistic target CR range
2. Executive summary (3-5 sentences: score, biggest strength, biggest gap, top 3 fixes by impact-to-effort)
3. Section-by-section analysis - one block per Step-3 section with `[Score: X/10, Weight: N%]`, **Findings**, and **Fixes (HIGH/MEDIUM/LOW)**
4. Copy Score table (5 dimensions × score × notes; total /100)
5. Form audit (or "no form on page")
6. Mobile audit
7. Page speed (observed indicators + bucket from Step-7 table)
8. A/B test recommendations (3+ hypotheses in the "If…then…because" template)
9. Prioritized fix list - **Quick Wins (this week)**, **Medium-Term (this month)**, **Strategic (this quarter)**, each with expected impact
10. Before/after wireframe notes (text wireframe of current vs recommended above-the-fold layout)
11. Footer: `*Generated by Wayland market-landing. Source: zubair-trabzada/ai-marketing-claude (MIT).*`

## Key Principles

- **Tie recommendations to revenue impact.** Don't just say "change the button color" - say "changing the CTA to a contrasting color typically increases clicks 15-30%, which at your current traffic could mean X more conversions per month." Only attach dollar figures the user supplies; never fabricate.
- **Prioritize by effort-to-impact ratio.** Quick wins first.
- **Be specific.** "Improve your headline" is useless. "Change 'Welcome to Our Platform' to 'Cut Your Reporting Time by 75% - Automated Analytics for Growth Teams' because it adds specificity, a quantified benefit, and targets a specific audience" is actionable.
- **Reference industry benchmarks** so the client knows where they stand against the page-type table above.
- **If `/market-audit` already ran** for this domain, read its `MARKETING-AUDIT.md` and incorporate the funnel-dimension findings - don't duplicate work.

## Pitfalls

- **`web_extract` summarizes pages > 5000 chars.** For above-the-fold checks, button colors, form field counts, or meta-tag analysis, use `terminal` + curl + `analyze_page.py` instead.
- **Don't invent CR numbers.** The page-type table is for benchmarking; estimate the user's current CR only as a range, and only when the page signals (form length, friction, social proof depth) clearly bracket it.
- **Don't fabricate revenue lift.** Express impact qualitatively (high/medium/low) unless the user supplies traffic + AOV.
- **Auth-gated pages:** if signin is required, note the gap and audit only the public hero/CTA.
- **Single-page scope:** do not crawl beyond the supplied URL. Multi-page audits belong to `market-audit`.
