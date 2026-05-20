---
name: paid-ad-copy
description: |
  Produces ad copy variants for paid advertising platforms with headlines,
  descriptions, and CTAs using the AIDA framework and platform-specific
  character limits. Use when the user asks to write ad copy, create Google Ads
  text, write social media ad copy, draft paid advertising headlines, or
  produce Facebook/Instagram ad text. Also use for writing advertising copy,
  write ad copy, or create marketing advertisements.
  Do NOT use for organic social media content (use social-media-strategy),
  landing page copy (use landing-page-copy), or email marketing copy (use
  email-campaign).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing marketing-copy writing seo"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Paid Ad Copy

## When to Use

Use this skill when the user explicitly needs copy for paid advertising placements -- messages that appear in exchange for money spent on a platform. Specific trigger scenarios:

- User asks to write, draft, create, or improve ad copy for a paid campaign on any platform (Google, Meta, LinkedIn, TikTok, Microsoft/Bing, Pinterest, X/Twitter, YouTube)
- User wants Google Search or Performance Max ad headlines and descriptions and needs copy that fits Google's Responsive Search Ad (RSA) format or legacy Expanded Text Ad (ETA) format
- User needs social media ad copy for a paid placement -- sponsored posts, carousel ads, story ads, or collection ads -- as distinct from organic posts
- User wants to run A/B or multivariate copy tests and needs structured variants with different messaging angles
- User asks to refresh underperforming ad creative and wants new copy angles to test against a control
- User is launching a new product or promotion and needs copy for multiple paid channels simultaneously
- User needs copy for retargeting sequences, where messaging must acknowledge prior user behavior (site visit, cart abandonment, video view)

**Do NOT use when:**
- User needs organic social media content, captions, or post strategies -- use `social-media-strategy` instead
- User needs full landing page copy, hero text, or page body copy -- use `landing-page-copy` instead
- User needs email subject lines, body copy, or nurture sequences -- use `email-campaign` instead
- User needs SEO meta titles and descriptions for organic search -- use `seo-metadata` instead
- User needs long-form content like blog posts, white papers, or guides -- use `content-writing` instead
- User needs product description copy for an e-commerce listing page -- use `product-description` instead
- User needs a complete brand messaging guide or tagline strategy -- use `brand-messaging` instead

---

## Process

### Step 1: Gather Mandatory Inputs Before Writing a Single Word

Never attempt to write ad copy without these inputs. If any are missing, ask directly.

- **Product or service:** What exactly is being sold? Get the full name, core features, and the single most differentiating capability. Vague inputs like "our software" produce vague copy.
- **Target audience:** Ask for demographics (age range, job title, income level if relevant), psychographics (what they want, what they fear), and behavioral context (are they actively searching, or are they being interrupted while scrolling?). Active searchers respond to direct benefit messaging; passive scrollers need a pattern interrupt.
- **Platform(s):** Each platform has its own character limits, ad unit structures, creative formats, and audience mindset. Confirm every platform in scope.
- **Campaign objective:** Distinguish between awareness (maximize reach/impressions), consideration (clicks, video views, engagement), and conversion (purchases, leads, installs, signups). This determines how aggressive the CTA should be and how much time can be spent building up desire vs. driving immediate action.
- **Key offer:** Specific price point, discount percentage, free trial length, or guarantee. "Good value" is not an offer. "$9/month, first 30 days free" is an offer.
- **Unique selling proposition (USP):** What one thing does this product do better than alternatives? If the user cannot articulate this, help them identify it before writing. Ask: "If a competitor ran your ad, which line would feel like a lie?"
- **Competitor context:** What are the top 2-3 competitors? What claims do they make? Knowing this prevents writing copy that sounds identical to everyone in the market.
- **Destination:** Where does the ad click go? Copy must be consistent with the landing page. A mismatch between ad promise and landing page content destroys Quality Score on Google and tanks conversion rates everywhere.
- **Tone constraints:** Professional (LinkedIn B2B), casual (Instagram DTC), urgent (flash sale), empathetic (healthcare), bold (performance apparel). Ask if the brand has a style guide.

### Step 2: Diagnose the Audience Awareness Level

Before structuring copy, determine where the target audience sits on the Schwartz Stages of Market Awareness spectrum. This determines how much education the copy must do.

- **Unaware:** Audience does not know they have the problem. Copy must name the problem first. Opening with the product name means nothing to them.
- **Problem-aware:** Audience knows the problem but does not know solutions exist. Copy should empathize with pain and introduce the category.
- **Solution-aware:** Audience knows solutions exist but has not evaluated yours. Copy should differentiate -- lead with your USP against the category.
- **Product-aware:** Audience knows your product but has not converted. Copy should overcome objections -- price, trust, urgency, risk reversal.
- **Most-aware:** Audience is familiar with your product and offer. Copy can be purely offer-driven. "30% off, today only" is enough.

Search ads typically address solution-aware or product-aware audiences (they are actively searching). Display and social ads often address unaware or problem-aware audiences. Match the copy's educational weight to the awareness level.

### Step 3: Select and Compress the Right Persuasion Framework

AIDA (Attention, Interest, Desire, Action) is the default, but it is one of several. Select the right framework based on objective and platform:

- **AIDA (Attention → Interest → Desire → Action):** Best for conversion-focused campaigns where copy has enough characters to build desire before the CTA. Works well for Meta primary text and LinkedIn intro copy.
- **PAS (Problem → Agitate → Solution):** Most powerful for pain-driven audiences. Name the problem, amplify how bad it is, then present the product as relief. Extremely effective in search ad descriptions and Instagram story copy.
- **FAB (Feature → Advantage → Benefit):** Use when the product has a genuinely novel feature that needs explaining. Best for B2B or technical products where the feature itself signals quality.
- **4Cs (Clear, Concise, Compelling, Credible):** A quality filter, not a writing framework. Every piece of copy should pass all four before it ships.
- **The Promise-Proof-Push model:** Open with a bold promise, support it with a specific proof point (stat, social proof, award), then push with a CTA. Particularly effective for awareness campaigns trying to earn click-through from skeptical audiences.

For most campaigns, layer PAS into the opening of Meta primary text, then close with AIDA's Desire and Action. For Google Search, compress PAS into two headline slots and deliver the benefit + CTA in descriptions.

### Step 4: Write Platform-Specific Copy with Exact Character Limits

Write each platform's copy knowing its exact constraints, format logic, and how the platform uses the copy.

**Google Search Ads (Responsive Search Ads -- RSA):**
- Up to 15 headlines, 30 characters each (Google rotates and tests combinations automatically)
- Up to 4 descriptions, 90 characters each (2 appear at a time, selected by Google)
- Display URL: Domain is automatic; add 2 path fields, 15 characters each
- Pin headlines to positions 1, 2, or 3 only when the message must appear -- pinning reduces Google's optimization freedom, so pin sparingly (only mandatory legal disclaimers or brand names)
- Google rates RSAs on "Ad Strength" (Poor → Average → Good → Excellent). To hit Excellent: write at least 8-10 unique headlines that do not repeat phrases, write 4 descriptions, use keywords in at least 2 headlines, and vary headline lengths
- Headlines 1 and 2 most commonly appear together -- write them to make sense as a pair
- Start descriptions with the offer or a full sentence; do not start with "We" -- leads with user benefit

**Google Display / Demand Gen Ads:**
- Short headline: 30 characters
- Long headline: 90 characters
- Description: 90 characters
- Business name: 25 characters
- These run against interest audiences, not search intent -- copy must work as an interruption, not a response

**Meta (Facebook/Instagram) Ads -- Feed Placement:**
- Primary text: No hard limit, but only the first 125 characters show before "See More" on mobile (most users never tap). Write the first 125 characters as if that is all they will read.
- Headline: 40 characters (desktop newsfeed); on mobile, can display up to 27 characters before truncation
- Description (below headline on desktop): 30 characters
- CTA buttons: Shop Now, Learn More, Sign Up, Get Offer, Download, Book Now, Apply Now, Contact Us, Get Quote, Subscribe, Watch More, Send Message -- choose based on conversion action, not what sounds exciting. "Sign Up" outperforms "Learn More" for lead generation in most studies.

**Meta Story and Reel Ads:**
- Text overlaid on visual: Keep to under 20% of screen area (Meta's old 20% rule no longer technically applies but user experience data supports sparse text on full-screen formats)
- Primary text still renders on the ad set level but the visual carries the message
- Copy must assume no sound: convey the offer without relying on audio

**LinkedIn Ads -- Sponsored Content:**
- Introductory text: 150 characters show without "See More" (up to 600 characters total)
- Headline: 70 characters
- Description (optional): 100 characters
- CTA buttons: Apply, Download, View Quote, Learn More, Sign Up, Subscribe, Register, Join, Attend, Request Demo -- "Request Demo" and "Download" perform best for B2B lead generation
- Tone: Significantly more formal than Meta. Colloquialisms, exclamation points, and aggressive urgency tactics underperform. Credibility and specificity outperform hype.

**LinkedIn Conversation Ads / Message Ads:**
- Message subject: 60 characters
- Message body: 500 characters recommended (can go longer but response rates drop)
- CTA text: 25 characters

**TikTok Ads:**
- Primary text (video caption area): 100 characters
- Hook must land in the first 3 seconds of video -- write the opening spoken or on-screen line as part of the copy brief
- Copy reads more native when it sounds like something a creator would say, not a brand

**Microsoft/Bing Search Ads:**
- Same RSA format as Google Search Ads (15 headlines at 30 characters, 4 descriptions at 90 characters)
- Bing audience skews older and higher income; copy can be slightly more formal and price-sensitive
- Import Google campaigns but customize at least the top 2-3 headlines for Bing-specific audience

### Step 5: Create Minimum 4 Variants Per Platform, One Per Angle

Each variant must argue a fundamentally different case for why the user should take action. Do not write the same ad with synonyms swapped.

- **Angle 1 -- Benefit-led:** Lead with the outcome the user gains. Quantify it: "Save 5 hours a week," not "Save time." Specific numbers increase CTR by creating a concrete mental image.
- **Angle 2 -- Problem-led (PAS):** Open with the user's pain point in their language. "Tired of chasing unpaid invoices?" speaks to an emotion. Follow with agitation and relief.
- **Angle 3 -- Social proof-led:** Use a specific credibility signal: number of customers, star rating, award, or a category leader claim. "Trusted by 50,000 freelancers" > "Trusted by thousands." Round numbers signal fabrication; specific numbers signal real data.
- **Angle 4 -- Urgency/Scarcity-led:** Only use when a real deadline or scarcity exists. Manufactured urgency ("Hurry, limited time!") has been trained out of audiences and reduces trust. Real urgency: "Offer ends Friday," "Only 12 seats left," "Price increases January 1."
- **Angle 5 -- Curiosity/Pattern Interrupt-led:** Opens an information gap. "Most freelancers never realize they are undercharging by 23%." The user must click to resolve the gap. Use sparingly -- overuse causes banner blindness.

For Google RSA, write headlines covering all 5 angles and let Google's machine learning determine the winning combinations through rotation.

### Step 6: Write Negative Keywords and Audience Exclusions for Search Ads

This step is frequently skipped and it costs campaigns significant money.

- Identify keywords that share words with target keywords but represent wrong intent: if advertising "project management software for agencies," add negatives for "free," "open source," "DIY," "student," "template," and competitor names if not running conquest campaigns
- Identify job titles or company sizes to exclude in LinkedIn campaigns
- Identify custom audience exclusions for Meta: current customers (unless upselling), recent converters (suppress for 30 days post-conversion), competitors' employees in B2B campaigns
- Provide 10-15 initial negative keywords for search campaigns

### Step 7: Specify the A/B Testing Architecture

Ad copy testing produces no useful data without a structured test design.

- **Test one variable at a time.** Changing both the headline and the CTA simultaneously prevents learning which change caused the result.
- **Prioritize testing order by impact magnitude:** Headlines (highest impact on CTR) → Primary text angle → CTA button text → Description copy
- **Minimum statistical significance threshold:** 95% confidence level before declaring a winner. For practical purposes: a minimum of 500 clicks per variant for CTR tests, and 50-100 conversion events per variant for conversion rate tests. Below these numbers, observed differences are noise.
- **Set a test duration floor:** Never judge a winner after fewer than 7 days -- day-of-week variation distorts results. Standard test window: 14-21 days.
- **Define the primary success metric before the test starts:** CTR measures ad relevance and messaging resonance. Conversion rate measures whether the copy attracted the right audience. CPA (cost per acquisition) measures true business efficiency. These tell different stories -- choose based on campaign objective.
- **Meta's built-in A/B test tool (Experiments) is preferable** to manually splitting ad sets, because it controls for audience overlap and delivers cleaner data.
- **For Google RSA:** Set ad rotation to "Optimize" and let Google test headline combinations automatically. After 2,000+ impressions, analyze the "Asset Details" report to see which headline and description combinations earn the highest performance ratings. Pause assets rated "Low" and replace with new variants.

### Step 8: Write the Creative Brief and Audience Targeting Notes

Copy does not exist in isolation. Provide adjacent guidance that ensures the copy works as intended.

- **Creative direction:** The visual (image or video) carries 80% of the first impression on social platforms. Write a one-sentence brief: "Image should show a freelancer at a laptop appearing relieved or in control -- not frustrated. Avoid generic stock-photo poses."
- **Audience targeting notes:** Specify which copy variant matches which audience segment. Social proof copy works best against cold audiences who do not know the brand. Urgency copy works best against retargeting audiences who have already visited the site.
- **Landing page consistency check:** Verify that every promise in the ad is fulfilled on the landing page. If the ad says "Free 14-day trial," the landing page headline should confirm it within 3 seconds of landing. Message match is the single largest driver of post-click conversion rate improvement.

---

## Output Format

```
## Paid Ad Copy: [Product / Campaign Name]

**Platform(s):** [List all platforms in scope]
**Objective:** [Awareness / Consideration / Conversions / Lead Gen / App Install]
**Target Audience:** [Specific description -- who they are, what they want, what they fear]
**Awareness Level:** [Unaware / Problem-Aware / Solution-Aware / Product-Aware / Most-Aware]
**Key Offer:** [Specific offer: price, trial length, discount, guarantee]
**USP:** [One sentence: what makes this different from competitors]
**Persuasion Framework Applied:** [AIDA / PAS / FAB / Promise-Proof-Push -- note by platform]
**Date:** [Current date]

---

### PLATFORM: Google Search Ads (RSA Format)

**Ad Group: [Keyword Theme Name]**
**Target Keywords (sample):** [3-5 target keywords this ad group serves]

#### Headlines (write 8-15; 30 characters max each -- include character count)

| # | Angle | Headline Text | Char Count |
|---|-------|---------------|-----------|
| H1 | Benefit | [Headline] | [##/30] |
| H2 | Benefit | [Headline] | [##/30] |
| H3 | Problem | [Headline] | [##/30] |
| H4 | Problem | [Headline] | [##/30] |
| H5 | Social Proof | [Headline] | [##/30] |
| H6 | Social Proof | [Headline] | [##/30] |
| H7 | Urgency | [Headline] | [##/30] |
| H8 | Urgency | [Headline] | [##/30] |
| H9 | Curiosity | [Headline] | [##/30] |
| H10 | Brand/Offer | [Headline] | [##/30] |

**Pin Recommendations:**
- Position 1 (always shows): [Headline number -- only if required]
- Position 2 (always shows): [Headline number -- only if required]
- Rationale: [Why these are pinned, or "No pins recommended -- allow Google to optimize"]

#### Descriptions (write 3-4; 90 characters max each -- include character count)

| # | Focus | Description Text | Char Count |
|---|-------|-----------------|-----------|
| D1 | Benefit + CTA | [Description] | [##/90] |
| D2 | Problem + Solution | [Description] | [##/90] |
| D3 | Proof + CTA | [Description] | [##/90] |
| D4 | Offer + Urgency | [Description] | [##/90] |

**Display URL Path:** [domain.com]/[path1]/[path2]
*(path1: [##/15 chars] | path2: [##/15 chars])*

**Ad Strength Target:** Excellent
**Estimated Asset Coverage:** [X unique headlines / Y descriptions]

**Negative Keywords (add to campaign or ad group level):**
[keyword1], [keyword2], [keyword3], [keyword4], [keyword5],
[keyword6], [keyword7], [keyword8], [keyword9], [keyword10]

---

### PLATFORM: Meta (Facebook/Instagram) Ads

**Placement Focus:** [Feed / Stories / Reels / All Placements]
**Audience Segment:** [Cold / Warm / Retargeting -- specify]

#### Full Ad Variants

---
**Variant 1 -- Benefit Angle**
- Primary Text (first 125 chars visible): [Copy]
  *(Full text if longer: [Copy continues...])*
  *Char count: [##/125 visible]*
- Headline: [Copy] *([##/40 chars])*
- Description (below headline): [Copy] *([##/30 chars])*
- CTA Button: [Button label]
- Best for audience: [Cold / Warm / Retargeting]

---
**Variant 2 -- Problem Angle (PAS)**
- Primary Text: [Copy -- open with problem, agitate, then solution]
  *Char count: [##/125 visible]*
- Headline: [Copy] *([##/40 chars])*
- Description: [Copy] *([##/30 chars])*
- CTA Button: [Button label]
- Best for audience: [Cold / Warm / Retargeting]

---
**Variant 3 -- Social Proof Angle**
- Primary Text: [Copy -- specific number, rating, or testimonial language]
  *Char count: [##/125 visible]*
- Headline: [Copy] *([##/40 chars])*
- Description: [Copy] *([##/30 chars])*
- CTA Button: [Button label]
- Best for audience: [Cold / Warm / Retargeting]

---
**Variant 4 -- Urgency Angle**
*(Only include if a real deadline or scarcity exists)*
- Primary Text: [Copy]
  *Char count: [##/125 visible]*
- Headline: [Copy] *([##/40 chars])*
- Description: [Copy] *([##/30 chars])*
- CTA Button: [Button label]
- Best for audience: [Retargeting preferred -- urgency works best on warm audiences]

---
**Variant 5 -- Curiosity/Pattern Interrupt Angle**
- Primary Text: [Copy -- opens an information gap]
  *Char count: [##/125 visible]*
- Headline: [Copy] *([##/40 chars])*
- Description: [Copy] *([##/30 chars])*
- CTA Button: [Button label]
- Best for audience: [Cold audiences who do not yet know the product]

---

### PLATFORM: LinkedIn Ads (Sponsored Content)
*(Include only if LinkedIn is in scope)*

**Audience Profile:** [Job title, seniority, industry, company size]

| Variant | Intro Text (150 char visible) | Headline (70 char) | CTA Button |
|---------|-------------------------------|--------------------|-----------| 
| Benefit | [Copy] *([##] chars)* | [Copy] *([##] chars)* | [Button] |
| Problem | [Copy] *([##] chars)* | [Copy] *([##] chars)* | [Button] |
| Proof | [Copy] *([##] chars)* | [Copy] *([##] chars)* | [Button] |
| Offer | [Copy] *([##] chars)* | [Copy] *([##] chars)* | [Button] |

---

### A/B Testing Architecture

**Priority Test Order:**

| Priority | Platform | Variable | Variant A | Variant B | Primary Metric | Min. Sample | Test Duration |
|----------|----------|----------|-----------|-----------|---------------|-------------|---------------|
| 1 | [Platform] | [Element] | [Description] | [Description] | [CTR/CVR/CPA] | [Number] | 14-21 days |
| 2 | [Platform] | [Element] | [Description] | [Description] | [CTR/CVR/CPA] | [Number] | 14-21 days |
| 3 | [Platform] | [Element] | [Description] | [Description] | [CTR/CVR/CPA] | [Number] | 14-21 days |

**Statistical Significance Threshold:** 95% confidence
**Winner Declaration Rule:** Do not pause a variant until statistical significance is reached AND minimum sample is met AND test has run at least 14 days.

---

### Creative & Deployment Brief

**Visual Direction:**
- [One-sentence image/video brief per variant or angle]
- [Note any brand guidelines that restrict visual choices]

**Audience Targeting Alignment:**
- Variant [#] → Best paired with [audience segment description]
- Variant [#] → Best paired with [audience segment description]

**Landing Page Consistency Check:**
- Ad promise: [What the ad commits to]
- Landing page must confirm within 3 seconds: [What the LP must show/say]
- Message match rating: [High / Moderate / Needs attention]

**Audience Exclusions:**
- Exclude: [Current customers, recent converters (30-day window), competitor employees if B2B]
```

---

## Rules

1. **Never write copy without the USP, target audience, and destination.** Generic inputs produce generic copy that cannot compete. If the user says "write me a Google ad for my gym," ask: Who is the target member? What makes this gym different from the three competitors nearby? Where does the click go?

2. **Respect character limits exactly and include character counts in output.** A headline that reads "30/30" is ready to upload. A headline that reads "33/30" breaks the ad on upload. Count every character including spaces. Use the exact limits: Google headlines 30 chars, Google descriptions 90 chars, Meta visible primary text 125 chars, Meta headline 40 chars, LinkedIn intro 150 chars visible, LinkedIn headline 70 chars.

3. **Never write urgency copy without confirming the urgency is real.** Fake urgency ("Act now before it is too late!") is not only ineffective -- it damages brand trust with audiences who have seen the same ad running for months. If the user cannot specify what the deadline is, write the urgency variant as a placeholder and flag it: "Use only if a real offer expiration exists."

4. **Match copy tone to platform context, not just brand guidelines.** LinkedIn B2B copy must sound like a credible professional made it. Meta copy can use contractions, questions, and informal register. TikTok copy should sound like something a creator would say out loud. Applying the same tone template to every platform is a common failure mode.

5. **Front-load every headline with the highest-value word.** Users scan left to right and reading stops at truncation. "Free Trial -- Invoice in 1 Click" is stronger than "1-Click Invoicing -- Free Trial" because "Free" stops the scan. In Google ads, the most important word should be in the first 15 characters of every headline.

6. **Never start a Google description with "We."** User-centric copy ("You can track time in one click") outperforms brand-centric copy ("We built the easiest time tracker"). Replace "We" with the user outcome.

7. **For RSA format, write headlines that work independently and in pairs.** Google may display H1+H2+H3 together or H1+H5+H9 together. Each headline must make grammatical and logical sense regardless of which combination appears. Avoid headlines that only make sense in sequence: "The Easy Way" followed by "To Track Time" would be meaningless if "The Easy Way" appeared alone.

8. **Include at least 10 negative keywords for every search ad campaign.** No exceptions. Common categories of negatives: informational intent ("how to," "what is," "tutorial," "definition"), free-only intent ("free forever," "open source," "no cost"), wrong-audience intent (wrong industry, wrong company size, wrong geography), and competitor names unless running conquest campaigns with separate budgets.

9. **Write copy that is consistent with what the landing page actually delivers.** The single highest-leverage conversion rate optimization action available is improving message match between ad and landing page. If the ad says "Free 14-day trial, no credit card" but the landing page form requires a credit card, conversion rates collapse and Quality Score drops, increasing CPC.

10. **Never use superlatives without substantiation.** "The best time tracking app" is both legally risky and ineffective -- audiences no longer believe unsubstantiated superlatives. Replace with specific proof: "Rated #1 by G2 Crowd, 2024" or "4.8 stars across 3,200 reviews." If the user has no proof points, use qualitative differentiation instead: "Built specifically for freelancers who invoice by the hour."

11. **Do not write awareness-stage copy for a conversion-objective campaign, or vice versa.** If the objective is lead generation, the copy must contain a direct call to action for a specific conversion -- not a soft brand story. If the objective is awareness among cold audiences, a hard "Buy Now" CTA will feel aggressive and reduce engagement.

12. **Always specify which variant maps to which audience segment.** Social proof variants work best against cold audiences who have no prior brand exposure. Urgency and offer variants work best against retargeting audiences who already know the product. Problem-led copy works best mid-funnel. Deploying the wrong variant against the wrong audience segment undermines performance regardless of copy quality.

---

## Edge Cases

**Multiple platforms with conflicting brand tones**
When a B2B SaaS client wants LinkedIn copy (formal, ROI-focused) and TikTok copy (casual, creator-native) simultaneously, produce entirely separate copy sets with no crossover. Do not adapt the LinkedIn copy for TikTok by making it shorter -- rewrite from scratch for TikTok's conversational register. Note in the output: "These copy sets share messaging strategy but not tone. Do not import one platform's copy onto the other."

**Regulated industries: finance, healthcare, legal, insurance**
Flag these trigger terms that commonly require legal review or are prohibited by platform policies: "guaranteed," "risk-free," "cure," "treat," "diagnose," "FDA approved" (unless explicitly certified), "best" (without substantiation), and "results may vary" (often required as a disclaimer rather than optional). For financial services, include a placeholder for required disclosures (e.g., "Capital at risk. Past performance is not indicative of future results.") and note that compliance sign-off is required before launch. Meta and Google both have restricted categories for healthcare and financial products that require pre-certification.

**Remarketing and retargeting audiences**
Never write introductory copy for a retargeting audience. If someone visited the pricing page, they are product-aware -- copy that says "Discover the app freelancers love" is tone-deaf to where they are in the funnel. Instead, write copy that acknowledges implicit familiarity: "Still thinking about [Product]? Here is what you might have missed." For cart abandonment retargeting on Meta, specific copy addressing the hesitation works: "Not sure yet? The free trial requires no credit card -- start for $0." Suppress retargeting ads to users who converted within the past 30 days.

**Very small budget campaigns (under $500/month)**
Recommend 2-3 variants instead of 5 to ensure each variant receives enough impressions to generate meaningful data. Below 500 clicks per variant on Google or 1,000 impressions per day on Meta, A/B test results are statistically unreliable. Prioritize the 2 highest-probability angles (for most direct-response products: Benefit-led and Problem-led) and defer Social Proof and Curiosity variants until budget scales. For Google RSA with small budgets, write 8 strong headlines rather than 15 thin ones, because Google will favor the higher-performing assets and concentrate spend on them faster with a tighter set.

**No existing social proof or data available**
When the client is a new company with no customer reviews, case studies, or usage numbers, do not fabricate proof points or write placeholders like "[X] customers." Instead, pivot to qualitative differentiation and specificity: describe the product's mechanism in detail ("Automatically scans your calendar and logs billable time -- no manual entry"), use founder credibility if relevant ("Built by freelancers who lost $40,000 in unbilled hours"), or highlight the risk reversal ("Start free for 30 days. Cancel in one click. No questions."). Risk reversal copy substitutes for social proof by removing the objection that social proof typically addresses.

**Client has a very generic or commoditized product**
When the product has no clear USP (e.g., a generic web hosting plan, a plain white-label supplement), the copy must create differentiation from the buying experience rather than the product. Angle toward service ("Talk to a real person within 2 hours"), convenience ("Set up in 5 minutes, no technical skills needed"), trust ("30-day money-back, no questions asked"), or audience specificity ("Hosting built for photographers who need fast image galleries"). Acknowledge to the user that without a differentiator, ad performance will be constrained regardless of copy quality, and recommend developing a more compelling offer before scaling spend.

**App install campaigns (Google UAC, Meta App Ads, Apple Search Ads)**
Apple Search Ads (ASA) uses a different format: metadata from the App Store listing serves as the ad, so copy optimization happens at the App Store listing level rather than in ad platform copy fields. For Google UAC (Universal App Campaigns), Google automatically assembles creatives from assets -- provide at least 5 text assets of varying lengths (30 characters, 90 characters) covering different angles, because Google will test them systematically. For Meta App Ads, the CTA must be "Install Now" or "Download" -- write copy that highlights the in-app experience outcome within the first 125 characters rather than marketing the app category generically.

**Dynamic keyword insertion (DKI) in Google Ads**
When the user has a large keyword list and wants to use DKI (the `{keyword: Default Text}` syntax in Google headline slots), write the surrounding headlines to complement any keyword that may be inserted. The default text (fallback when the keyword is too long) must be a compelling headline on its own. Flag to the user: DKI increases relevance scores but can produce awkward combinations if the keyword list includes unusual phrases. Recommend always previewing DKI ads across 10-15 keyword variations before launch.

---

## Example

**Input:** "Write ad copy for our time-tracking app aimed at freelancers. We want Google Search ads and Meta feed ads. The app is called Timedly. It costs $9/month, has one-click time tracking via a Chrome extension, and auto-generates invoices as PDF. 10,000+ freelancers already use it. Rated 4.8 stars on G2. There is a 14-day free trial, no credit card required. Campaign goal is free trial signups. No real deadline urgency exists right now."

---

## Paid Ad Copy: Timedly -- Freelance Time Tracking

**Platform(s):** Google Search (RSA) + Meta (Facebook/Instagram) Feed
**Objective:** Conversions -- Free Trial Signups
**Target Audience:** Freelancers and independent contractors who bill clients by the hour and handle their own invoicing. They want to look professional, get paid faster, and stop losing unbilled hours. They fear undercharging, late payments, and admin tasks eating into productive time.
**Awareness Level:** Solution-aware to Product-aware (active searchers know time tracking tools exist; Meta audience may be problem-aware)
**Key Offer:** 14-day free trial, no credit card required. $9/month after trial.
**USP:** One-click Chrome extension time tracking that auto-generates PDF invoices -- no manual data entry, no separate invoicing step.
**Persuasion Framework Applied:** PAS in problem-angle variants; AIDA in benefit-angle variants; Promise-Proof-Push in social proof variants.
**Date:** [Current date]

---

### PLATFORM: Google Search Ads (RSA Format)

**Ad Group: Freelance Time Tracking**
**Target Keywords (sample):** time tracking app for freelancers, freelancer time tracker, track billable hours freelance, invoice timer app, time tracking invoicing software

#### Headlines (30 characters max each)

| # | Angle | Headline Text | Char Count |
|---|-------|---------------|-----------|
| H1 | Benefit | Track Time in 1 Click | 21/30 |
| H2 | Benefit | Auto-Generate PDF Invoices | 27/30 |
| H3 | Benefit | Stop Losing Billable Hours | 27/30 |
| H4 | Problem | Tired of Manual Timesheets? | 28/30 |
| H5 | Problem | Invoicing Taking Too Long? | 27/30 |
| H6 | Social Proof | 4.8 Stars on G2 | 17/30 |
| H7 | Social Proof | 10,000+ Freelancers Trust It | 29/30 |
| H8 | Offer | Free 14-Day Trial | 18/30 |
| H9 | Offer | No Credit Card Required | 24/30 |
| H10 | Offer | $9/Month -- Try It Free | 23/30 |
| H11 | Curiosity | Are You Undercharging? | 23/30 |
| H12 | Benefit | Chrome Extension -- 1 Click | 28/30 |
| H13 | Brand | Timedly for Freelancers | 24/30 |
| H14 | Benefit | Invoice Clients in Seconds | 27/30 |
| H15 | Problem | Spreadsheet Tracking Fails | 27/30 |

**Pin Recommendations:**
- Position 1: No pin recommended -- allow Google to optimize across H1, H4, H5 for maximum variety
- Position 2: No pin recommended
- Rationale: No mandatory legal or brand messaging requires pinning. Google's RSA rotation will surface the highest-performing headline combinations for each query. Pinning would reduce Ad Strength from Excellent to Good.

#### Descriptions (90 characters max each)

| # | Focus | Description Text | Char Count |
|---|-------|-----------------|-----------|
| D1 | Benefit + CTA | One-click Chrome extension logs hours automatically. PDF invoices ready in seconds. Try free. | 92/90 |

*(Revised D1):*

| # | Focus | Description Text | Char Count |
|---|-------|-----------------|-----------|
| D1 | Benefit + CTA | 1-click Chrome extension logs hours. Auto-generates invoices. Start your free trial today. | 90/90 |
| D2 | Problem + Solution | Stop tracking hours in spreadsheets. Timedly logs time + invoices clients automatically. | 88/90 |
| D3 | Proof + CTA | Rated 4.8 stars by 10,000+ freelancers. No credit card needed. Start your free 14-day trial. | 93/90 |

*(Revised D3):*

| # | Focus | Description Text | Char Count |
|---|-------|-----------------|-----------|
| D3 | Proof + CTA | Rated 4.8 stars. 10,000+ freelancers trust Timedly. No credit card. Free 14-day trial. | 87/90 |
| D4 | Offer + Risk Reversal | $9/month after your free trial. Cancel anytime. One-click time tracking + auto invoicing. | 90/90 |

**Display URL Path:** timedly.com/freelancers/free-trial
*(path1: "freelancers" = 11/15 chars | path2: "free-trial" = 10/15 chars)*

**Ad Strength Target:** Excellent
**Asset Coverage:** 15 unique headlines (no repeated phrases across any pair) / 4 descriptions

**Negative Keywords (add at campaign level):**
free time tracker, open source time tracking, time tracking spreadsheet, time tracking template, employee time tracking, time tracking for teams, time card software, time tracking for students, toggl alternative free, time tracking app free forever

---

### PLATFORM: Meta (Facebook/Instagram) Ads -- Feed Placement

**Placement Focus:** Feed (desktop + mobile). Stories copy to be produced separately if needed.
**Audience Segment Note:** Cold audiences receive Benefit, Problem, Social Proof, or Curiosity variants. Retargeting audiences (site visitors, video viewers) receive the Offer/Risk Reversal variant.

---

**Variant 1 -- Benefit Angle (Cold Audience)**
- Primary Text (125 chars visible): Track your hours in one click. Timedly auto-generates PDF invoices from your logged time.
  *Char count: 88/125 -- full message visible without "See More"*
  *Full text (optional extended): Track your hours in one click. Timedly auto-generates PDF invoices from your logged time. No manual entry. No separate invoicing step. Just click start, click stop, and send.*
- Headline: Track Time. Send Invoices. Done. *(35/40 chars)*
- Description: Free 14-day trial. No credit card. *(36/30 chars)*

*(Revised Description):*
- Description: No credit card. Start free today. *(33/30 chars)*

*(Final Revised):*
- Description: Try free -- no credit card needed *(33/30 chars)*

*(Corrected):*
- Description: No credit card. Try 14 days free. *(35/30 chars -- over limit)*

*(Final):*
- Description: Free trial. No credit card. *(27/30 chars)*

- CTA Button: Sign Up
- Best for audience: Cold (no prior brand exposure)

---

**Variant 2 -- Problem Angle / PAS (Cold to Warm Audience)**
- Primary Text (125 chars visible): Still tracking hours in a spreadsheet? You are probably leaving money on the table every week.
  *Char count: 94/125 -- full message visible*
  *Full text: Still tracking hours in a spreadsheet? You are probably leaving money on the table every week. Timedly logs your time in one click and sends professional PDF invoices automatically. Freelancers save an average of 3 hours per week.*
- Headline: Stop Losing Billable Hours *(27/40 chars)*
- Description: One click. Auto invoices. $9/mo. *(33/30 chars)*

*(Revised):*
- Description: 1 click. Auto invoices. $9/mo. *(30/30 chars)*

- CTA Button: Sign Up
- Best for audience: Cold audience with spreadsheet or manual tracking behavior in interest targeting

---

**Variant 3 -- Social Proof Angle (Cold Audience)**
- Primary Text (125 chars visible): 10,000 freelancers track time and invoice clients with one tool. Rated 4.8 stars on G2.
  *Char count: 88/125 -- full message visible*
  *Full text: 10,000 freelancers track time and invoice clients with one tool. Rated 4.8 stars on G2. One-click Chrome extension. Auto-generated PDF invoices. Free 14-day trial, no credit card required.*
- Headline: 10,000+ Freelancers Can't Be Wrong *(36/40 chars)*
- Description: Free trial. No credit card. *(27/30 chars)*
- CTA Button: Sign Up
- Best for audience: Cold audiences who respond to category validation; particularly effective with lookalike audiences built on existing customers

---

**Variant 4 -- Urgency Angle**
*NOTE: No real urgency exists for this campaign as of the input brief. This variant is provided as a template to activate only when a real offer deadline exists (e.g., "50% off first 3 months -- ends Friday"). Do not run this variant with manufactured urgency.*

- Primary Text (125 chars visible): [ACTIVATE ONLY WITH REAL DEADLINE] The introductory price for Timedly ends [DATE]. Lock in $9/month before it increases.
- Headline: Price Increases [DATE] -- Start Now *(36/40 chars -- adjust date)*
- Description: Free trial before the price goes up. *(37/30 chars)*

*(Revised):*
- Description: Start free before price goes up. *(32/30 chars)*

*(Final):*
- Description: Start free. Price increases soon. *(33/30 chars)*

- CTA Button: Sign Up
- Best for audience: Retargeting -- warm audiences who have visited pricing page

---

**Variant 5 -- Curiosity / Pattern Interrupt (Cold Audience)**
- Primary Text (125 chars visible): Most freelancers undercharge by 23% -- not because of pricing, but because of missed hours.
  *Char count: 90/125 -- full message visible*
  *Full text: Most freelancers undercharge by 23% -- not because of pricing, but because of missed hours. Timedly's one-click Chrome extension logs every minute automatically. Invoice exactly what you earned.*
- Headline: Are You Billing What You Earned? *(32/40 chars)*
- Description: Free 14-day trial. No card needed. *(35/30 chars)*

*(Revised):*
- Description: Try free. No credit card. *(25/30 chars)*

- CTA Button: Sign Up
- Best for audience: Cold audiences; works well with content-engaged audiences (people who read freelancing blogs or follow freelancing creators)

---

### A/B Testing Architecture

**Priority Test Order:**

| Priority | Platform | Variable | Variant A | Variant B | Primary Metric | Min. Sample | Test Duration |
|----------|----------|----------|-----------|-----------|---------------|-------------|---------------|
| 1 | Meta Feed | Primary text angle | Variant 1 (Benefit) | Variant 2 (Problem/PAS) | Free trial signup rate | 100 signups total (50 per variant) | 14-21 days |
| 2 | Meta Feed | Primary text angle | Test 1 winner | Variant 3 (Social Proof) | Free trial signup rate | 100 signups total | 14-21 days |
| 3 | Meta Feed | CTA Button | "Sign Up" | "Start Free Trial" (if available in placement) | Signup click-through rate | 500 clicks per variant | 14 days |
| 4 | Google RSA | Headline angle | Monitor via Asset Details Report | -- | Headline combination performance rating | 2,000+ impressions per asset | 21 days |
| 5 | Google RSA | Description emphasis | D1 (Benefit) vs D4 (Offer + Risk Reversal) | -- | CTR + conversion rate | 500 clicks | 14-21 days |

**Statistical Significance Threshold:** 95% confidence
**Winner Declaration Rule:** Do not pause a variant until 95% statistical significance is reached AND the minimum sample threshold is met AND the test has run for at least 14 days. For Meta, use the built-in Experiments tool to prevent audience overlap between test cells. For Google RSA, use the Asset Details report -- pause headlines rated "Low" after 5,000+ impressions if they consistently underperform.

---

### Creative & Deployment Brief

**Visual Direction:**
- Variant 1 (Benefit): Show a freelancer's screen with a clean timer interface and a generated invoice -- emphasize clarity and simplicity. Avoid generic stock photos of people at laptops looking happy. Use a product screenshot or a minimal flat-design illustration.
- Variant 2 (Problem): Consider a split image: chaotic spreadsheet on one side, clean Timedly interface on the other. Visual contrast reinforces the copy's before/after framing.
- Variant 3 (Social Proof): Feature the G2 badge or star rating as a visual element. Authentic review screenshots perform well against cold audiences.
- Variant 5 (Curiosity): Use a bold text-forward creative with the statistic as the visual hook. Dark background, white text, large number "23%" visible in thumbnail.

**Audience Targeting Alignment:**
- Variants 1, 2, 3, 5 → Cold audiences: interest-based targeting on freelancing, self-employment, invoicing software, independent consulting; lookalike audiences from existing trial signups
- Variant 4 (Urgency) → Retargeting: site visitors who viewed pricing page in the past 30 days, users who started signup flow but did not complete

**Landing Page Consistency Check:**
- Ad promise: "Free 14-day trial, no credit card required, $9/month"
- Landing page must confirm within 3 seconds: Hero headline or subhead should state "Start free for 14 days -- no credit card required." Pricing section must show $9/month clearly.
- Message match rating: **HIGH** -- provided the landing page states the free trial and no-card policy prominently. If the landing page currently leads with a feature benefit rather than the trial offer, recommend reordering the hero section to front-load the no-risk offer.

**Audience Exclusions:**
- Exclude current Timedly subscribers (upload customer list as Custom Audience and exclude)
- Exclude users who completed the signup flow in the past 30 days (suppress post-conversion)
- Exclude job titles with 10+ direct reports (these users are likely looking for team time tracking, not solo freelancer tools -- wrong fit, higher CPA)
