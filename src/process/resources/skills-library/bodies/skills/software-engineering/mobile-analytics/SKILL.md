---
name: mobile-analytics
description: |
  Expert mobile analytics covering attribution tracking, funnel analysis, crash reporting integration, A/B testing frameworks, retention and cohort analysis, event taxonomy design, privacy-compliant data collection, real-time dashboards, and actionable metric strategies for iOS and Android applications.
  Use when the user asks about mobile analytics, mobile analytics best practices, or needs guidance on mobile analytics implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices analysis"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Mobile Analytics

You are an expert in mobile app analytics and data-driven product development. You guide teams through designing event taxonomies, implementing attribution tracking, building conversion funnels, setting up crash reporting, running A/B tests, and analyzing retention to drive growth and improve user experience.

## Event Taxonomy Design

### Naming Convention

```
Event Naming Standard:
  Format: object_action (snake_case)
  Examples: screen_viewed, button_tapped, item_added_to_cart,
            purchase_completed, search_performed, error_displayed

Property Naming:
  Format: snake_case, descriptive, typed
  Examples: screen_name: string, item_price: float,
            currency: string (ISO 4217), result_count: integer

Avoid:
  - Camel case mixing (screenViewed vs screen_viewed)
  - Generic names (click, event, action)
  - PII in event properties (email, phone, full name)
  - Unbounded cardinality (free-text user input as property values)
```

### Event Taxonomy Structure

```
Core Event Categories:
├── Lifecycle
│   ├── app_opened (source, is_first_launch, app_version)
│   ├── app_backgrounded (session_duration_seconds)
│   └── session_started (session_id, referral_source)
│
├── Navigation
│   ├── screen_viewed (screen_name, screen_class, previous_screen)
│   └── tab_selected (tab_name, tab_index)
│
├── Engagement
│   ├── search_performed (query, result_count, filter_applied)
│   ├── content_viewed (content_id, content_type, duration_seconds)
│   └── feature_used (feature_name, context)
│
├── Commerce
│   ├── item_viewed (item_id, item_name, category, price, currency)
│   ├── item_added_to_cart (item_id, quantity, cart_value)
│   ├── checkout_started (cart_value, item_count)
│   └── purchase_completed (transaction_id, revenue, currency, item_count)
│
├── Onboarding
│   ├── onboarding_started ()
│   ├── onboarding_step_completed (step_number, step_name)
│   ├── onboarding_completed (duration_seconds)
│   └── onboarding_skipped (last_step_completed)
│
└── Notifications
    ├── push_permission_requested (status)
    ├── push_received (campaign_id, message_type)
    └── push_opened (campaign_id, time_to_open_seconds)
```

## Analytics Implementation

### iOS Analytics Layer

```swift
protocol AnalyticsProvider {
    func track(event: String, properties: [String: Any])
    func identify(userId: String, traits: [String: Any])
    func screen(name: String, properties: [String: Any])
}

final class AnalyticsManager {
    static let shared = AnalyticsManager()
    private var providers: [AnalyticsProvider] = []

    func register(_ provider: AnalyticsProvider) {
        providers.append(provider)
    }

    func track(_ event: AnalyticsEvent) {
        let properties = event.properties.merging(globalProperties()) { _, new in new }
        for provider in providers {
            provider.track(event: event.name, properties: properties)
        }
    }

    private func globalProperties() -> [String: Any] {
        [
            "app_version": Bundle.main.appVersion,
            "os_version": UIDevice.current.systemVersion,
            "device_model": UIDevice.current.modelName,
            "locale": Locale.current.identifier
        ]
    }
}

// Type-safe event definitions
enum AnalyticsEvent {
    case screenViewed(name: String)
    case purchaseCompleted(transactionId: String, revenue: Double, currency: String)
    case onboardingStepCompleted(step: Int, name: String)
    case searchPerformed(query: String, resultCount: Int)

    var name: String {
        switch self {
        case .screenViewed: return "screen_viewed"
        case .purchaseCompleted: return "purchase_completed"
        case .onboardingStepCompleted: return "onboarding_step_completed"
        case .searchPerformed: return "search_performed"
        }
    }

    var properties: [String: Any] {
        switch self {
        case .screenViewed(let name):
            return ["screen_name": name]
        case .purchaseCompleted(let id, let revenue, let currency):
            return ["transaction_id": id, "revenue": revenue, "currency": currency]
        case .onboardingStepCompleted(let step, let name):
            return ["step_number": step, "step_name": name]
        case .searchPerformed(let query, let count):
            return ["query": query, "result_count": count]
        }
    }
}
```

## Attribution Tracking

### Attribution Models

```
Attribution Methods:
├── Deterministic
│   ├── Deep links (most accurate): Universal Links (iOS), App Links (Android)
│   ├── Referrer (Android only): Google Play Install Referrer API
│   └── Click ID matching: Match ad click ID to install event
│
├── Probabilistic
│   ├── Fingerprinting (deprecated on iOS): IP + User Agent + Device model
│   └── Statistical modeling: Aggregated campaign performance inference
│
└── Self-Attributing Networks (SANs)
    ├── Meta, Google, TikTok, Snap
    └── Report their own attributed installs, reconcile with MMP data
```

### SKAdNetwork (iOS) Configuration

```
SKAdNetwork (SKAN) Implementation:
├── Conversion Value Strategy (6 bits = 0-63)
│   ├── Bit 0-2: Revenue bucket (8 tiers)
│   ├── Bit 3-4: Engagement level (4 tiers)
│   ├── Bit 5: Retention (returned day 2+)
│
├── SKAN 4.0 Enhancements
│   ├── Coarse conversion values: low, medium, high
│   ├── Three postback windows: 0-2 days, 3-7 days, 8-35 days
│   └── Hierarchical source identifiers (2-4 digits based on crowd anonymity)
│
└── Implementation
    ├── Use MMP SDK (Adjust, AppsFlyer, Singular) to manage conversion values
    └── Map postback data to campaign performance in MMP dashboard
```

## Funnel Analysis

```
Funnel Design Principles:
1. Define clear start and end events
2. Include every meaningful step (not too granular)
3. Set reasonable time window (session-based or N-day window)
4. Segment by user properties (new vs returning, platform, source)

Common Mobile Funnels:
├── Onboarding: app_opened → step_1 → step_2 → step_3 → first_key_action
├── Purchase: item_viewed → added_to_cart → checkout_started → purchase_completed
└── Subscription: paywall_viewed → plan_selected → trial_started → trial_converted

Drop-off Analysis:
  For each step transition:
  - Calculate conversion rate (users reaching step N / users reaching step N-1)
  - Segment by: device, OS version, source, user properties
  - Set alerts when conversion drops below historical baseline
  - Track median time between steps (long waits = friction)
```

## Crash Reporting

```
Crash Reporting Setup:
├── Capture
│   ├── Crashes, non-fatal errors, ANRs (Android), watchdog terminations (iOS)
│   └── Out-of-memory events
│
├── Enrich
│   ├── Stack trace with symbolication / deobfuscation
│   ├── Device model, OS version, app version, network state
│   ├── User breadcrumbs (last 50 events before crash)
│   └── Custom keys (current screen, user segment, feature flags)
│
├── Prioritize
│   ├── Crash-free users rate (target: > 99.5%)
│   ├── Sort by impacted users, not occurrence count
│   └── Track crash rate per app version (detect regressions)
│
└── Alert
    ├── New crash type → immediate notification
    ├── Crash-free rate drop → page on-call
    └── Velocity alerts: crash count spikes in short window
```

## A/B Testing

### Experiment Framework

```
A/B Test Lifecycle:
1. Hypothesis: "Changing CTA from 'Sign Up' to 'Start Free Trial' will increase
   conversion by 15% because it communicates zero risk."

2. Design:
   ├── Primary metric: Sign-up conversion rate
   ├── Secondary metrics: Trial-to-paid rate, 7-day retention
   ├── Guardrail metrics: App crash rate, session duration
   └── Sample size: Calculate with MDE, alpha, power

3. Implementation:
   ├── Server-side flag assignment (preferred)
   ├── Consistent bucketing (same user always sees same variant)
   └── Track exposure event when user sees the variant

4. Analysis:
   ├── Wait for sufficient sample size (do not peek early)
   ├── Check statistical significance (p < 0.05)
   ├── Verify no impact on guardrail metrics
   └── Segment results (new vs returning, platform, geo)

5. Decision:
   ├── Ship if statistically significant improvement
   └── Kill if negative impact on primary or guardrail metrics
```

### Sample Size Reference

```
Required Sample Size Per Variant:
  n = (Z_alpha/2 + Z_beta)^2 * (p1(1-p1) + p2(1-p2)) / (p1 - p2)^2

  Rules of Thumb:
    - Small effects (< 5% relative change): 10,000+ per variant
    - Medium effects (5-15% relative): 2,000-10,000 per variant
    - Large effects (> 15% relative): < 2,000 per variant
    - Always run for at least 1 full week for day-of-week effects
```

## Retention Analysis

### Cohort Retention Table

```
Day-N Retention Analysis:
  Cohort: Users who installed in a given week
  Metric: Percentage who return on Day N

  Industry Benchmarks (varies by category):
  ├── D1: 25-40%   (good > 35%)
  ├── D7: 12-20%   (good > 18%)
  ├── D30: 6-12%   (good > 10%)
  └── D90: 3-8%    (good > 6%)

Retention Curve Shape:
  ├── Flattening curve → healthy: found core users
  ├── Steady decline → problem: no habit formation
  └── Smile curve (uptick) → excellent: reactivation working
```

### Engagement Metrics

```
Key Engagement Metrics:
├── DAU / MAU Ratio (Stickiness)
│   ├── Social apps: 30-50%, Utility: 15-25%, E-commerce: 8-15%
│
├── Session Metrics
│   ├── Sessions per DAU, session duration, time between sessions
│
├── Feature Adoption
│   ├── % of MAU who use feature X
│   ├── Feature correlation with retention
│   └── Power user feature fingerprint
│
└── Activation Rate
    ├── Define activation event (the "aha" moment)
    ├── Track time-to-activation from install
    └── Optimize onboarding to reach activation faster
```

## Privacy-Compliant Analytics

```
Privacy Framework:
├── iOS App Tracking Transparency (ATT)
│   ├── Required for IDFA access (iOS 14.5+)
│   ├── Pre-prompt screen explaining value before system dialog
│   ├── Respect denial: use first-party analytics without IDFA
│   └── Typical opt-in rates: 15-35%
│
├── GDPR / CCPA Compliance
│   ├── Consent before tracking (EU), opt-out mechanism (US/California)
│   ├── Data deletion capability
│   └── Data retention policies (auto-delete after N months)
│
├── Privacy-Safe Alternatives
│   ├── First-party event data (no cross-app tracking)
│   ├── On-device processing where possible
│   ├── Privacy-preserving attribution (SKAN, Privacy Sandbox)
│   └── Server-side analytics (user never sends data to third parties)
│
└── Implementation
    ├── Gate all analytics behind consent check
    ├── Use anonymous IDs, not persistent device IDs
    ├── Strip or hash any quasi-identifiers
    └── Audit event payloads quarterly for PII leakage
```

## Analytics Tools Comparison

| Tool | Strengths | Best For |
|------|-----------|----------|
| Amplitude | Behavioral analytics, cohorts, funnels | Product analytics at scale |
| Mixpanel | Event analytics, A/B testing, flows | Growth-stage product teams |
| Firebase Analytics | Free, deep Android integration, BigQuery export | Early-stage apps, Google ecosystem |
| PostHog | Open source, session replay, feature flags | Privacy-conscious teams |
| Adjust / Singular | Attribution, fraud prevention, cost aggregation | Paid acquisition optimization |

## Dashboard Design

```
Daily Operational Dashboard:
├── Health: Crash-free rate, API error rate, app launch time (p50, p95)
├── Acquisition: New installs (organic vs paid), CPI by channel, activation rate
├── Engagement: DAU/WAU/MAU, sessions per user, feature adoption, push open rate
├── Retention: D1/D7/D30 by cohort, churn rate trend, reactivation rate
└── Revenue: ARPU, ARPPU, LTV by cohort, subscription conversion/renewal rates
```

## Production Checklist

- [ ] Define event taxonomy with consistent naming convention
- [ ] Implement analytics abstraction layer supporting multiple providers
- [ ] Set up attribution tracking with privacy framework compliance
- [ ] Build core conversion funnels with drop-off alerting
- [ ] Configure crash reporting with breadcrumbs and custom keys
- [ ] Design A/B testing framework with proper sample size calculations
- [ ] Build cohort retention reports segmented by acquisition source
- [ ] Gate all tracking behind user consent
- [ ] Create operational dashboard with health, engagement, and revenue metrics
- [ ] Audit event payloads quarterly for PII leakage
- [ ] Document activation metric and track correlation with retention

## When to Use

**Use this skill when:**
- Designing or implementing mobile analytics solutions
- Reviewing or improving existing mobile analytics approaches
- Making architectural or implementation decisions about mobile analytics
- Learning mobile analytics patterns and best practices
- Troubleshooting mobile analytics-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Mobile Analytics Analysis

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

**Input:** "Help me implement mobile analytics for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended mobile analytics approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When mobile analytics must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
