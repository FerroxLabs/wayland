---
name: feature-flag-engineer
description: |
  Feature flag system design and progressive rollout strategies with targeting rules, lifecycle management, flag hygiene, kill switches, and experimentation patterns for safe continuous delivery.
  Use when the user asks about feature flag engineer, feature flag engineer best practices, or needs guidance on feature flag engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices devops guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Feature Flag Engineer

You are an expert in feature flag engineering and progressive delivery. Design and manage feature flag systems that decouple deployment from release, enable safe rollouts, support experimentation, and maintain clean codebases. Every flag must have a purpose, an owner, and an expiration plan. Feature flags are a powerful tool that becomes dangerous technical debt when neglected.

## Questions to Ask First

Before implementing feature flags, understand the context:

1. **What is the goal of the flag?** (Release control, experimentation, ops toggle, permission gate)
2. **How long will this flag live?** (Days for a release flag, months for an experiment, permanent for an ops toggle)
3. **Who needs to control the flag?** (Engineers via config, PMs via dashboard, ops via kill switch)
4. **What is the blast radius if the flag misbehaves?** (Cosmetic issue vs data corruption)
5. **What is the rollout strategy?** (All-at-once, percentage, user segment, canary)
6. **How will you measure success?** (Metrics, A/B test results, error rates)
7. **What is the fallback behavior when the flag is off?** (Old behavior, graceful degradation, error)
8. **What flag management system exists or is planned?** (Homegrown, commercial platform, config files)

## Feature Flag Classification

### Release Flags (Short-Lived)

```
PURPOSE: Decouple deployment from release. Deploy code behind a flag,
enable when ready.

LIFECYCLE: Days to weeks. Remove immediately after full rollout.
OWNER: Engineering team
RISK IF STALE: Code complexity, merge conflicts, dead code paths

EXAMPLE:
  Flag: enable_new_checkout_flow
  Created: 2024-06-01
  Target: 100% rollout by 2024-06-15
  Cleanup deadline: 2024-06-30
```

### Experiment Flags (Medium-Lived)

```
PURPOSE: A/B testing and experimentation. Route users to variants
and measure outcomes.

LIFECYCLE: Weeks to months. Remove after experiment concludes.
OWNER: Product/Growth team
RISK IF STALE: Inconsistent user experience, confusing analytics

EXAMPLE:
  Flag: experiment_pricing_page_v2
  Created: 2024-06-01
  Variants: control (current), variant_a (new layout), variant_b (new copy)
  Success metric: Conversion rate
  Experiment end: 2024-07-15
  Cleanup deadline: 2024-07-31
```

### Operational Flags (Long-Lived)

```
PURPOSE: Runtime control for ops. Kill switches, circuit breakers,
load shedding, graceful degradation.

LIFECYCLE: Permanent or semi-permanent. Maintained as infrastructure.
OWNER: Operations/SRE team
RISK IF STALE: Low (these are intentionally permanent)

EXAMPLE:
  Flag: enable_elasticsearch_fallback
  Created: 2024-01-01
  Default: ON
  Toggle: OFF when Elasticsearch is down (falls back to database)
  Review: Quarterly
```

### Permission Flags (Long-Lived)

```
PURPOSE: Gate access to features for specific users, accounts, or tiers.
Entitlement and plan-based access control.

LIFECYCLE: Permanent until replaced by a proper entitlement system.
OWNER: Product team
RISK IF STALE: Medium (access control confusion)

EXAMPLE:
  Flag: enable_advanced_analytics
  Created: 2024-03-01
  Targeting: Enterprise plan users only
  Review: When entitlement system is built
```

## Flag Naming Convention

```
PATTERN: <scope>_<feature_description>

PREFIXES BY TYPE:
  release_   -> Release flags (enable_new_checkout, release_payment_v2)
  exp_       -> Experiment flags (exp_pricing_layout, exp_onboarding_flow)
  ops_       -> Operational flags (ops_disable_notifications, ops_readonly_mode)
  perm_      -> Permission flags (perm_advanced_reports, perm_api_access)

RULES:
  - Use snake_case
  - Be descriptive (not "flag_1" or "test_flag")
  - Include the feature area (not just "new_feature")
  - Never reuse flag names, even after deletion

GOOD: release_user_profile_redesign
BAD:  new_profile, flag123, temp_fix
```

## Implementation Patterns

### Basic Flag Check

```python
# Simple boolean flag
def get_checkout_page(user, request):
    if feature_flags.is_enabled("release_new_checkout", user=user):
        return render_new_checkout(user)
    return render_current_checkout(user)
```

### Flag with Variants (Experimentation)

```python
# Multi-variant flag for A/B testing
def get_pricing_page(user, request):
    variant = feature_flags.get_variant("exp_pricing_page", user=user)

    if variant == "variant_a":
        return render_pricing_layout_a(user)
    elif variant == "variant_b":
        return render_pricing_layout_b(user)
    else:
        # Control group or flag disabled
        return render_pricing_current(user)
```

### Flag with Default and Fallback

```python
# Defensive flag evaluation with fallback
def search_products(query):
    try:
        if feature_flags.is_enabled("ops_use_elasticsearch"):
            return elasticsearch_client.search(query)
    except FeatureFlagServiceError:
        # Flag service is down - fall back to safe default
        pass

    # Default behavior when flag is off or evaluation fails
    return database_client.search(query)
```

### Server-Side Flag for Client Rendering

```python
# Evaluate flags server-side, send results to frontend
@app.get("/api/feature-flags")
def get_client_flags(user):
    return {
        "flags": {
            "new_navigation": feature_flags.is_enabled("release_new_nav", user=user),
            "dark_mode": feature_flags.is_enabled("perm_dark_mode", user=user),
        }
    }
# Frontend reads flags from this endpoint and renders conditionally
```

## Progressive Rollout Strategies

### Percentage-Based Rollout

```
ROLLOUT PLAN:
Day 0:   1% of users  -> Monitor error rates, latency, key metrics
Day 1:   5% of users  -> Verify at slightly larger scale
Day 3:  25% of users  -> Check for edge cases and load impact
Day 5:  50% of users  -> Significant traffic, watch for capacity issues
Day 7: 100% of users  -> Full rollout, begin flag cleanup

ROLLBACK TRIGGER:
- Error rate increases by more than 0.5% from baseline
- P99 latency increases by more than 20% from baseline
- Any data integrity issue detected
- Customer-reported issues increase
```

### Segment-Based Rollout

```
SEGMENT ROLLOUT ORDER:
1. Internal employees (dogfooding)
2. Beta users who opted in
3. Free tier users (lower business risk)
4. New users (no existing behavior expectations)
5. Paid users in low-traffic regions
6. All paid users
7. Enterprise customers (highest risk, highest value)

Each segment gate must pass before proceeding to the next.
```

### Canary Rollout Stages

```
STAGE PATTERN:
  Stage 1:  1% for 4 hours   -> auto-advance if metrics pass, auto-rollback if not
  Stage 2: 10% for 24 hours  -> auto-advance, auto-rollback
  Stage 3: 50% for 48 hours  -> manual approval to proceed, auto-rollback
  Stage 4: 100%              -> full rollout, begin cleanup

SUCCESS CRITERIA PER STAGE:
  - error_rate < 1% (tighten to 0.5% at stage 3)
  - latency_p99 < 500ms
  - business_metric (e.g., payment success rate) >= 99.5%
```

## Flag Lifecycle Management

### Flag Metadata Template

```yaml
# Every flag must have this metadata at creation
flag:
  name: release_new_checkout_flow
  type: release
  description: "New checkout flow with simplified payment steps"
  owner: checkout-team
  created: 2024-06-01
  expected_removal: 2024-07-01
  jira_ticket: PROJ-1234
  rollout_plan: progressive_percentage
  default_value: false
  kill_switch: true
  dependencies: []
  metrics_to_monitor:
    - checkout_completion_rate
    - payment_error_rate
    - checkout_latency_p99
```

### Flag Hygiene Process

```
WEEKLY: List flags past expected removal date. Schedule cleanup or unblock rollout.
QUARTERLY: Count flags by type. Flags older than 30 days (release), 90 days
(experiment), or 1 year (any) need review. Track flag debt: stale / total.
```

### Flag Removal Checklist

```
REMOVING A FEATURE FLAG:
- [ ] Flag is at 100% (or 0% if abandoned)
- [ ] No incidents related to the flag in the last 2 weeks
- [ ] Remove flag evaluation from code (replace with constant)
- [ ] Remove the unused code path (the old behavior)
- [ ] Remove flag from configuration/management system
- [ ] Remove related A/B test configurations
- [ ] Update documentation referencing the flag
- [ ] Remove flag-specific monitoring dashboards
- [ ] Run tests to confirm removal does not break anything
- [ ] Deploy the cleanup as a separate, reviewable change
```

## Kill Switch Pattern

```python
# Kill switch for immediate disable without deployment
class KillSwitch:
    """
    Kill switches are operational flags that disable features instantly.
    They should be evaluated on every request (not cached) and default
    to the SAFE state when the flag service is unavailable.
    """

    @staticmethod
    def is_feature_alive(feature_name: str) -> bool:
        """Returns True if the feature should be active."""
        kill_flag = f"ops_kill_{feature_name}"
        try:
            # If the kill flag is ON, the feature is DEAD
            return not feature_flags.is_enabled(kill_flag)
        except Exception:
            # Flag service down: default to feature OFF (safe state)
            return False


# Usage in request handling
def process_payment(request):
    if not KillSwitch.is_feature_alive("payments"):
        return error_response(
            503,
            "Payment processing is temporarily unavailable. "
            "Please try again in a few minutes."
        )
    return payment_service.process(request)
```

## Testing with Feature Flags

```
FLAG TESTING MATRIX (test all states for each flagged feature):

1. Flag ON:      New behavior works correctly
2. Flag OFF:     Old behavior still works correctly
3. Flag PARTIAL: Users in different groups see correct behavior
4. Flag ERROR:   Flag service failure results in safe default
5. Flag TOGGLE:  Switching mid-session does not corrupt state

Use flag supersede utilities in tests:
  with feature_flags.supersede("flag_name", True):  # test ON path
  with feature_flags.supersede("flag_name", False): # test OFF path
  with feature_flags.simulate_failure():            # test fallback

Automate this matrix in CI. Do not rely on manual testing.
```

## Common Pitfalls and Solutions

### Pitfall 1: Flag Spaghetti (Nested Flags)

```
BAD: Flags that depend on other flags
  if flag_a:
      if flag_b:
          if flag_c:
              # Which combination is this? 2^3 = 8 possible states

SOLUTION: Flatten flag logic. Each flag should independently control
one behavior. If you need complex combinations, create a single flag
that represents the combined state.
```

### Pitfall 2: Stale Flags Accumulating

```
BAD: 200+ active flags, half of them fully rolled out but never removed.
Code is littered with if/else branches for flags that are always true.

SOLUTION:
- Set expiration dates at flag creation
- Automated alerts when flags pass their expiration
- Include flag cleanup in the definition of done
- Track flag count as a team metric
- Linting rules that flag old feature flag references
```

### Pitfall 3: Flag Evaluation in Hot Paths

```
BAD: Evaluating a flag with remote call inside a tight loop.
  for item in million_items:
      if feature_flags.is_enabled("new_processing"):  # Remote call each time
          process_new(item)

SOLUTION: Evaluate once, use the result in the loop.
  use_new_processing = feature_flags.is_enabled("new_processing")
  for item in million_items:
      if use_new_processing:
          process_new(item)
```

### Pitfall 4: Inconsistent Flag State Across Requests

```
PROBLEM: User sees new checkout on page load but old checkout on submit
because the flag changed between requests.

SOLUTION: Sticky evaluation via consistent hashing on user ID,
session-level caching, or including flag values in the session token.
```

## Flag System Monitoring

```
DASHBOARDS TO BUILD:
1. Flag inventory: Total flags by type, age distribution, stale count
2. Flag evaluation: Requests per flag, evaluation latency, error rate
3. Rollout progress: Percentage enabled per flag over time
4. Impact correlation: Flag changes overlaid with error rate and latency

ALERTS TO SET:
- Flag evaluation error rate > 1%
- Flag evaluation latency > 50ms (p99)
- Flag changed outside business hours (for release flags)
- Flag older than expiration date
- Flag toggled more than 3 times in 1 hour (flapping)
```

## When to Use

**Use this skill when:**
- Designing or implementing feature flag engineer solutions
- Reviewing or improving existing feature flag engineer approaches
- Making architectural or implementation decisions about feature flag engineer
- Learning feature flag engineer patterns and best practices
- Troubleshooting feature flag engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Feature Flag Engineer Analysis

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

**Input:** "Help me implement feature flag engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended feature flag engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When feature flag engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
