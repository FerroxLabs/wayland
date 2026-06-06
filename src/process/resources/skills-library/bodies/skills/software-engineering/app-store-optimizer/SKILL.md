---
name: app-store-optimizer
description: |
  Expert app store optimization covering keyword research, screenshot design, A/B testing listings, review management, localization strategy, app preview videos, rating prompts, category selection, competitive analysis, and ASO tools.
  Use when the user asks about app store optimizer, app store optimizer best practices, or needs guidance on app store optimizer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices app-store-optimization"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# App Store Optimizer

## Overview

This skill provides comprehensive expertise in App Store Optimization (ASO) for both Apple App Store and Google Play Store. It covers the full lifecycle of optimizing app discoverability and conversion rates, from keyword research and metadata optimization through visual asset creation, review management, and continuous iteration based on analytics.

## ASO Fundamentals

### Ranking Factor Weights

| Factor | App Store (iOS) | Google Play |
|--------|----------------|-------------|
| App name / title | Very High | Very High |
| Subtitle | High | N/A |
| Keyword field | Very High | N/A |
| Short description | N/A | High |
| Long description | Low (not indexed) | High (indexed) |
| Downloads velocity | High | High |
| Ratings and reviews | High | High |
| Update frequency | Medium | Medium |
| Retention / engagement | Medium | High |
| Crash rate | Medium | High |
| Backlinks | N/A | Medium |

### Metadata Character Limits

| Field | App Store | Google Play |
|-------|-----------|-------------|
| App name / title | 30 chars | 30 chars |
| Subtitle | 30 chars | N/A |
| Short description | N/A | 80 chars |
| Keyword field | 100 chars | N/A |
| Description | 4000 chars | 4000 chars |
| What's New | 4000 chars | 500 chars |
| Promotional text | 170 chars | N/A |

## Keyword Research Methodology

### Step-by-Step Process

```
Keyword Research Workflow:
1. Brainstorm seed keywords
   ├── Core functionality terms
   ├── Problem/solution terms
   ├── Competitor brand terms (careful - avoid trademarked terms)
   └── User language terms (how users describe the problem)

2. Expand keyword list
   ├── App Store Suggest (type in search bar, note autocomplete)
   ├── Google Play autocomplete
   ├── ASO tools (App Radar, Sensor Tower, AppTweak)
   ├── Related searches shown after search results
   └── Competitor keyword spy tools

3. Evaluate keywords
   ├── Search volume (traffic score)
   ├── Difficulty (competition score)
   ├── Relevance (does it match your app?)
   └── Intent (will searchers want your app?)

4. Prioritize keywords
   ├── High volume + low difficulty + high relevance = PRIORITY
   ├── High volume + high difficulty = LONG TERM
   ├── Low volume + low difficulty = QUICK WIN
   └── Low volume + high difficulty = AVOID

5. Place keywords strategically
   ├── Most important → App name
   ├── Second tier → Subtitle (iOS) / Short description (Android)
   ├── Supporting → Keyword field (iOS) / Description (Android)
   └── Do NOT repeat keywords across fields (iOS deduplicates)
```

### Keyword Placement Strategy (iOS)

```
iOS Keyword Optimization Rules:
- Keywords are pulled from: Name + Subtitle + Keyword field
- Do NOT repeat words across these three fields
- Keyword field: Use commas as separators, no spaces after commas
- Apple indexes singular and plural forms separately
- Include common misspellings if space allows
- Localize keywords for each target market

Example:
  Name: "FitTrack - Workout Planner"
  Subtitle: "Exercise & Gym Log"
  Keywords: "fitness,training,health,routine,muscle,cardio,strength,weight,body,yoga"

  Effective indexed terms:
  fittrack, workout, planner, exercise, gym, log, fitness, training,
  health, routine, muscle, cardio, strength, weight, body, yoga
  + combinations like "fitness planner", "gym workout", etc.
```

### Keyword Placement Strategy (Google Play)

```
Google Play Keyword Optimization Rules:
- Google indexes the full description (all 4000 chars)
- Repeat primary keywords 3-5 times naturally in description
- Short description is heavily weighted - use top keywords
- Title has highest weight per character
- Google understands synonyms and related terms
- Backlinks with anchor text influence ranking
- Do NOT keyword-stuff; Google penalizes this

Example Short Description (80 chars):
  "Track workouts, build muscle & reach fitness goals with personalized plans"
```

## Screenshot Design

### Best Practices

| Guideline | Details |
|-----------|---------|
| First 2 screenshots | Most critical; visible without scrolling in search results |
| Orientation | Portrait for phones; landscape acceptable for tablets/games |
| Text overlay | Short, benefit-driven headlines (not feature descriptions) |
| Font size | Large enough to read on search results (not just detail page) |
| Device frames | Optional; Apple no longer requires them |
| Consistency | Uniform style, color scheme, and typography across all screenshots |
| Count | Use all available slots (10 on iOS, 8 on Google Play) |
| Localization | Translate text overlays for each market |

### Screenshot Sequence Strategy

```
Recommended Screenshot Order:
1. Hero shot - Primary value proposition + most impressive UI
2. Key feature 1 - The feature that solves the main user problem
3. Key feature 2 - Differentiating feature vs. competitors
4. Social proof - "Trusted by 1M+ users" or press quotes
5. Key feature 3 - Another compelling feature
6. Integration/ecosystem - Works with other tools/platforms
7. Personalization - Show customization options
8. Call to action - "Get started free" or pricing info
```

### A/B Testing Screenshots

```
Screenshot A/B Test Framework:
├── Test one variable at a time
│   ├── Background color
│   ├── Text copy
│   ├── Screenshot order
│   ├── With/without device frames
│   └── Dark vs. light UI shown
├── Run for 7+ days minimum
├── Need 1000+ impressions per variant for significance
├── Use Google Play Store Listing Experiments (built-in)
├── Use third-party tools for iOS (SplitMetrics, StoreMaven)
└── Track conversion rate (impressions → installs)
```

## Review Management

### Review Response Strategy

```
Review Response Decision Tree:
├── 5-star review
│   └── Thank the user briefly, mention a new feature they might like
├── 4-star review
│   ├── Thank them, ask what would make it 5 stars
│   └── If they mention a specific feature, note it for product roadmap
├── 3-star review
│   ├── Acknowledge their feedback
│   ├── Address specific concerns
│   └── Invite them to contact support for resolution
├── 2-star review
│   ├── Apologize for the experience
│   ├── Address the specific issue
│   ├── Provide a workaround if available
│   └── Ask them to update review after fix
├── 1-star review
│   ├── Respond within 24 hours
│   ├── Never be defensive
│   ├── Provide direct support contact
│   ├── If it is a bug, confirm you are fixing it
│   └── If it is a misunderstanding, clarify politely
└── Spam / inappropriate review
    └── Report to Apple/Google for removal
```

### Review Response Templates

```
Bug Report (1-2 stars):
"Hi [Name], we're sorry you experienced this issue. We've identified the
bug you described and our team is working on a fix for the next update.
In the meantime, you can [workaround]. If you need immediate help,
please reach out to support@myapp.com. Thank you for your patience."

Feature Request (3 stars):
"Thank you for the feedback! We hear you on [feature request]. It's on
our roadmap and we're aiming to include it in an upcoming release.
We'd love to hear more about your use case at feedback@myapp.com."

Positive Review (5 stars):
"Thank you so much for the kind words! We're thrilled you're enjoying
[specific feature mentioned]. Have you tried [related feature]? We think
you'll love it too!"
```

## Rating Prompt Strategy

### When to Ask for Ratings

```
Rating Prompt Triggers (Best Practices):
├── After a positive experience
│   ├── Completing a key task successfully
│   ├── Reaching a milestone or achievement
│   ├── After the Nth successful session (e.g., 5th)
│   └── After a positive outcome (workout completed, goal reached)
├── Timing constraints
│   ├── NOT on first launch
│   ├── NOT after a crash or error
│   ├── NOT during a flow (checkout, editing)
│   ├── Maximum 3 prompts per 365-day period (Apple limit)
│   └── Wait at least 14 days between prompts
├── Smart gating approach
│   ├── First: Ask "Are you enjoying [App]?" in custom dialog
│   ├── If YES → Show native rating prompt (SKStoreReviewController)
│   ├── If NO → Show feedback form (capture issues internally)
│   └── This prevents negative reviews from reaching the store
└── Never incentivize reviews (violates store guidelines)
```

```swift
// iOS rating prompt implementation
import StoreKit

class RatingManager {
    private let defaults = UserDefaults.standard
    private let sessionCountKey = "sessionCount"
    private let lastPromptDateKey = "lastPromptDate"

    func trackSession() {
        let count = defaults.integer(forKey: sessionCountKey) + 1
        defaults.set(count, forKey: sessionCountKey)
    }

    func requestReviewIfAppropriate() {
        let sessionCount = defaults.integer(forKey: sessionCountKey)
        let lastPrompt = defaults.object(forKey: lastPromptDateKey) as? Date

        guard sessionCount >= 5 else { return }
        guard lastPrompt == nil || Date().timeIntervalSince(lastPrompt!) > 90 * 86400 else { return }

        if let scene = UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
            SKStoreReviewController.requestReview(in: scene)
            defaults.set(Date(), forKey: lastPromptDateKey)
        }
    }
}
```

## Localization Strategy

### Market Prioritization

```
Localization Priority Framework:
1. Analyze current organic traffic by country (App Store Connect / Play Console)
2. Estimate market size (smartphone users * app category penetration)
3. Assess competition level in each market
4. Consider monetization potential (ARPU by country)
5. Evaluate localization cost vs. expected return

Tier 1 (highest ROI): English, Spanish, Portuguese, French, German, Japanese
Tier 2: Korean, Italian, Dutch, Russian, Turkish, Arabic
Tier 3: Thai, Vietnamese, Indonesian, Hindi, Polish, Swedish

Minimum viable localization:
- Translate: Name, subtitle/short description, keywords, screenshot text
- Do NOT auto-translate descriptions (use native speakers)
- Localize screenshots (text overlays + possibly UI screenshots)
- Research local keywords (direct translation often misses search terms)
```

## App Preview Videos

### Video Best Practices

| Aspect | Recommendation |
|--------|---------------|
| Length | 15-30 seconds (attention drops sharply after 15s) |
| First 3 seconds | Hook with the most impressive feature |
| Narration | Optional; use captions for accessibility |
| Music | Upbeat, non-distracting background music |
| Content | Show real app usage, not promotional motion graphics |
| Resolution | Record at device native resolution |
| Orientation | Match primary app orientation |
| Call to action | End with download prompt or key value proposition |
| Autoplay | Videos autoplay on mute in App Store - visual clarity is critical |

## Category Selection

### Category Strategy

```
Category Selection Decision:
├── Primary category
│   ├── Choose the most accurate category for your app
│   ├── Consider competition density (fewer apps = easier ranking)
│   ├── Check top 10 in each candidate category
│   └── Verify your app legitimately fits the category
├── Secondary category (iOS only)
│   ├── Choose a complementary category for additional exposure
│   ├── Can rank in both categories simultaneously
│   └── Example: Meditation app → Primary: Health & Fitness, Secondary: Lifestyle
└── Category changes
    ├── Allowed (both platforms)
    ├── Takes effect with next update
    └── Rankings reset in old category
```

## Competitive Analysis

### Competitor Analysis Framework

```
For each top 5 competitor, analyze:

1. Metadata
   ├── Title / subtitle keywords
   ├── Description structure and keywords
   ├── Number and quality of screenshots
   └── Whether they use app preview videos

2. Ratings & Reviews
   ├── Average rating and total count
   ├── Recent review sentiment trends
   ├── Common complaints (opportunities for you)
   └── Features users praise most

3. Update Frequency
   ├── How often they update
   ├── What they highlight in release notes
   └── Feature velocity

4. Keyword Rankings
   ├── Which keywords they rank for
   ├── Keywords where they are weak (your opportunity)
   └── Keyword overlap percentage with your app

5. Visual Assets
   ├── Screenshot style and messaging
   ├── Icon design approach
   └── What they emphasize first
```

## ASO Tools Comparison

| Tool | Strengths | Best For |
|------|-----------|----------|
| Sensor Tower | Market intelligence, ad intelligence | Enterprise, competitor research |
| App Radar | Keyword tracking, ASO workflow | SMB, hands-on optimization |
| AppTweak | Keyword research, market analysis | Data-driven keyword strategy |
| AppFollow | Review management, competitor monitoring | Review ops, sentiment analysis |
| SplitMetrics | A/B testing store pages | Conversion rate optimization |
| Mobile Action | Keyword intelligence, visibility score | Keyword-focused ASO |
| data.ai (App Annie) | Market estimates, download data | Market sizing, trend analysis |

## Measurement and KPIs

### Key Metrics to Track

| Metric | Target | Source |
|--------|--------|--------|
| Impressions | Growing month-over-month | App Store Connect / Play Console |
| Conversion rate (impression to install) | >30% (varies by category) | App Store Connect / Play Console |
| Keyword rankings | Top 10 for primary keywords | ASO tool |
| Average rating | >4.5 | Store dashboard |
| Review response rate | 100% for 1-3 star reviews | Store dashboard |
| Organic vs. paid split | >60% organic | Attribution tool |
| Day 1 retention | >40% | Analytics tool |

## Production Checklist

- [ ] Research and select 15-25 target keywords
- [ ] Optimize title with primary keyword
- [ ] Write compelling subtitle (iOS) / short description (Android)
- [ ] Fill keyword field with no duplicates (iOS)
- [ ] Write keyword-rich description (Google Play)
- [ ] Design 8-10 screenshots with benefit-driven headlines
- [ ] Create app preview video (15-30 seconds)
- [ ] Set up A/B test for top-of-funnel screenshots
- [ ] Configure smart rating prompt after positive user events
- [ ] Set up review monitoring and response workflow
- [ ] Localize metadata for top 5 target markets
- [ ] Select primary and secondary categories strategically
- [ ] Complete competitor analysis for top 5 rivals
- [ ] Set up weekly keyword ranking tracking
- [ ] Establish monthly ASO review cadence

## When to Use

**Use this skill when:**
- Designing or implementing app store optimizer solutions
- Reviewing or improving existing app store optimizer approaches
- Making architectural or implementation decisions about app store optimizer
- Learning app store optimizer patterns and best practices
- Troubleshooting app store optimizer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# App Store Optimizer Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement app store optimizer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended app store optimizer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When app store optimizer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
