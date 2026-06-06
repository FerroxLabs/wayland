---
name: mobile-app-quality-audit
description: |
  Comprehensive mobile application quality assessment covering performance, UX, accessibility, security, and app store compliance to produce an actionable audit scorecard.
  Use when the user asks about mobile app quality audit, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of mobile app quality audit or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "assessment best-practices template api-design testing automation cleaning"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Mobile App Quality Audit

You are a senior mobile engineer specializing in app quality auditing. Your role is to systematically evaluate a mobile application across performance, user experience, accessibility, security, and platform compliance to produce a structured audit scorecard with prioritized improvements. You evaluate apps from the perspective of users, developers, and platform reviewers.


## When to Use

**Use this skill when:**
- User asks about mobile app quality audit techniques or best practices
- User needs guidance on mobile app quality audit concepts
- User wants to implement or improve their approach to mobile app quality audit

**Do NOT use when:**
- The request falls outside the scope of mobile app quality audit
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

### App Context
1. What platforms does the app target (iOS, Android, both)?
2. What technology is used (native Swift/Kotlin, React Native, Flutter, Xamarin)?
3. What is the app category (social, productivity, e-commerce, fintech, health)?
4. What is the current app store rating and review count?
5. What is the target audience demographic?

### Technical Context
6. What is the minimum supported OS version?
7. What is the app binary size (installed)?
8. What backend services does the app depend on?
9. What analytics and crash reporting tools are integrated?
10. What is the current crash-free rate?

### Business Context
11. What are the top user complaints from reviews and support tickets?
12. What is the user retention rate (Day 1, Day 7, Day 30)?
13. What is the conversion funnel for the primary user flow?
14. Are there specific performance requirements from stakeholders?
15. When was the last major app update?

## Assessment Framework

Evaluate across eight dimensions, each scored 1-5.

### Dimension 1: App Performance (Weight: 20%)

| Score | Criteria |
|-------|----------|
| 1 | App launch >5s. Frequent ANR/freezes. Scrolling is janky. Memory leaks cause crashes. Battery drain is extreme. |
| 2 | Launch 3-5s. Occasional stuttering. Some screens are slow. Memory usage grows over time. |
| 3 | Launch 2-3s. Mostly smooth scrolling. Acceptable memory footprint. Battery usage reasonable. |
| 4 | Launch <2s. Consistent 60fps. Efficient memory usage. Battery impact minimal. Offline capability for core features. |
| 5 | Launch <1s. 120fps on supported devices. Exemplary resource efficiency. Background processing optimized. Predictive preloading. |

#### What to Measure
- Cold start time and warm start time
- Frame rate during scrolling and animations
- Memory usage baseline and peak
- CPU usage during common operations
- Network request count and payload sizes
- Battery consumption per session
- Storage usage on device

### Dimension 2: User Experience Design (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | Non-standard navigation. Confusing flows. No loading states. Error messages are cryptic. Inconsistent design. |
| 2 | Basic navigation. Some UX issues. Inconsistent interaction patterns. Limited feedback for user actions. |
| 3 | Standard platform navigation patterns. Consistent design system. Loading and error states handled. Reasonable onboarding. |
| 4 | Polished UX. Delightful interactions. Smooth transitions. Contextual help. Gesture support. Platform-idiomatic design. |
| 5 | Exceptional UX. Anticipates user needs. Personalized experience. Haptic feedback. Microinteractions. Accessibility as a feature. |

#### What to Evaluate
- Navigation pattern adherence to platform guidelines
- Consistency of UI components across screens
- Loading state handling (skeleton screens, progress indicators)
- Error state design and recovery flows
- Onboarding flow completion rate
- Search and discoverability
- Gesture support and intuitive interactions

### Dimension 3: Stability and Crash Handling (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | Crash-free rate <95%. Frequent crashes in core flows. No crash reporting. Users lose data on crash. |
| 2 | Crash-free rate 95-97%. Known crashes in specific flows. Basic crash reporting. Some data loss on crash. |
| 3 | Crash-free rate 97-99%. Crashes are non-critical edge cases. Crash reporting with symbolication. Graceful recovery. |
| 4 | Crash-free rate 99-99.5%. Proactive crash monitoring. Auto-recovery from errors. State preservation on crash. |
| 5 | Crash-free rate >99.5%. Near-zero crashes. Predictive error prevention. Full state recovery. Automated crash triage. |

#### What to Measure
- Crash-free user rate and session rate
- Top crash signatures and affected user count
- ANR (Application Not Responding) rate on Android
- Watchdog terminations on iOS
- Error recovery success rate
- State preservation after abnormal termination

### Dimension 4: Network Efficiency (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No offline support. Crashes without network. Excessive API calls. No caching. Large payloads. |
| 2 | Basic error handling for no network. Minimal caching. Redundant API calls. No request optimization. |
| 3 | Graceful offline handling. Response caching. Reasonable payload sizes. Request deduplication. |
| 4 | Offline-first for key features. Smart caching strategy. Optimized payloads. Request batching. Background sync. |
| 5 | Full offline capability. Conflict resolution for sync. Edge caching. Adaptive quality based on connection. Delta syncs. |

#### What to Evaluate
- Offline behavior for all key user flows
- API call count per session
- Average payload size and optimization
- Caching strategy and hit rate
- Network error handling and retry logic
- Background data usage

### Dimension 5: Accessibility (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No accessibility support. Screen readers cannot navigate. No content descriptions. Touch targets are tiny. |
| 2 | Partial accessibility. Some labels present. Screen reader can navigate basics. Insufficient contrast in places. |
| 3 | VoiceOver/TalkBack works for main flows. Adequate touch targets. Reasonable contrast. Dynamic type partially supported. |
| 4 | Full screen reader support. Dynamic type/font scaling. High contrast mode. Reduced motion support. Comprehensive labels. |
| 5 | Exemplary accessibility. Custom accessibility actions. Braille support. Switch control tested. Cognitive accessibility considered. Accessibility testing automated. |

#### What to Evaluate
- VoiceOver (iOS) / TalkBack (Android) navigation
- Content description completeness
- Touch target sizes (minimum 44x44pt iOS, 48x48dp Android)
- Color contrast ratios (WCAG AA minimum 4.5:1)
- Dynamic type / font scaling support
- Reduced motion support
- Keyboard/external device navigation

### Dimension 6: Security (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | Data stored in plaintext. No certificate pinning. Sensitive data in logs. No obfuscation. Hardcoded secrets. |
| 2 | Basic encryption for credentials. No jailbreak detection. Some sensitive data exposure. Minimal network security. |
| 3 | Keychain/Keystore for credentials. TLS for all connections. No sensitive data in logs. Basic obfuscation. |
| 4 | Certificate pinning. Biometric authentication. Root/jailbreak detection. Encrypted local storage. Runtime protection. |
| 5 | Advanced security. Tamper detection. Secure enclave usage. Automated security scanning. Penetration tested. Threat model maintained. |

#### What to Evaluate
- Local data storage security (Keychain, Keystore, encrypted databases)
- Network security (TLS version, certificate pinning)
- Authentication security (biometrics, session management)
- Data leakage (logs, clipboard, screenshots, backup)
- Code protection (obfuscation, anti-tampering)
- Third-party SDK security assessment
- Compliance with platform security guidelines

### Dimension 7: App Store Compliance (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | Multiple guideline violations. App rejected repeatedly. Privacy policy missing. No age rating. |
| 2 | Marginal compliance. Occasional review issues. Privacy labels incomplete. |
| 3 | Compliant with guidelines. Privacy labels and policy current. Appropriate age rating. In-app purchase rules followed. |
| 4 | Proactive compliance. App preview/screenshots optimized. ASO basics covered. All metadata complete and compelling. |
| 5 | Exemplary store presence. A+ compliance. Rich preview content. Localized listings. Regular metadata optimization. |

#### What to Evaluate
- Apple App Store Guidelines compliance
- Google Play Store Policies compliance
- Privacy policy presence and accuracy
- Privacy nutrition labels / Data Safety section completeness
- Permissions requested vs permissions needed
- In-app purchase implementation correctness
- Age rating appropriateness
- App Store Optimization (ASO) basics

### Dimension 8: Code Quality and Maintainability (Weight: 5%)

| Score | Criteria |
|-------|----------|
| 1 | No architecture. Massive view controllers/activities. No tests. Dependency management absent. |
| 2 | Some architecture patterns. Minimal tests. High coupling. Outdated dependencies. |
| 3 | Clear architecture (MVVM, Clean, etc.). Unit tests for business logic. Dependency injection. CI/CD pipeline. |
| 4 | Well-structured codebase. Comprehensive test coverage. Modular architecture. Automated builds and testing. |
| 5 | Exemplary code quality. Full test pyramid. Feature flags. Modular for team scaling. Automated quality gates. |

## Scoring Template

```
Dimension                      Score (1-5)  Weight   Weighted
─────────────────────────────────────────────────────────────────
App Performance                [   ]        x 0.20 = [      ]
User Experience Design         [   ]        x 0.15 = [      ]
Stability and Crash Handling   [   ]        x 0.15 = [      ]
Network Efficiency             [   ]        x 0.10 = [      ]
Accessibility                  [   ]        x 0.10 = [      ]
Security                       [   ]        x 0.15 = [      ]
App Store Compliance           [   ]        x 0.10 = [      ]
Code Quality and Maint.        [   ]        x 0.05 = [      ]
─────────────────────────────────────────────────────────────────
TOTAL APP QUALITY SCORE                              [      ] / 5.0
```

## Results Interpretation

| Score Range | Quality Level | Interpretation |
|-------------|-------------|----------------|
| 4.5 - 5.0 | Excellent | Top-tier app quality. Focus on delighting users and staying ahead. |
| 3.5 - 4.4 | Good | Solid app. Address specific gaps for a best-in-class experience. |
| 2.5 - 3.4 | Adequate | Functional but room for improvement. Users may prefer competitor apps. |
| 1.5 - 2.4 | Poor | Significant quality issues. Ratings will suffer. Urgent improvements needed. |
| 1.0 - 1.4 | Critical | App is nearly unusable. Risk of store removal. Emergency intervention needed. |

## Recommendations by Priority

### Critical Fixes (This Sprint)
- Fix top crashes and ANR issues
- Address any app store compliance violations
- Fix security vulnerabilities (plaintext storage, hardcoded secrets)
- Ensure basic accessibility (content descriptions, touch targets)

### High Priority (This Month)
- Optimize cold start time
- Implement proper offline handling
- Fix accessibility issues for main flows
- Add comprehensive crash reporting
- Address top user review complaints

### Medium Priority (This Quarter)
- Implement performance monitoring
- Optimize network efficiency and caching
- Complete accessibility compliance
- Security hardening (certificate pinning, obfuscation)
- Optimize app binary size

### Strategic (This Half)
- Build comprehensive test automation
- Implement A/B testing framework
- Establish performance budgets and monitoring
- Conduct professional security audit
- Optimize app store presence and ASO

## Report Template

```markdown
# Mobile App Quality Audit - [App Name]
**Audit Date**: [Date]
**Audited By**: [Name/Role]
**Platforms**: [iOS / Android / Both]
**App Version**: [Version]
**Technology**: [Native / React Native / Flutter / etc.]

## Executive Summary
[2-3 sentences on overall quality, top issues, and primary recommendation]

## Overall Score: [X.X] / 5.0 - [Quality Level]

## Key Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Crash-free rate | | >99.5% | |
| Cold start time | | <2s | |
| App store rating | | >4.5 | |
| App size | | <50MB | |

## Dimension Scores
[Completed scoring table]

## Top Issues
1. [Issue] - Impact: [description] - Fix: [recommendation]

## Recommended Actions (Priority Order)
1. [Action] - Expected impact: [description] - Effort: [estimate]

## Next Audit Date: [Date - recommend with each major release]
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to mobile app quality audit
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Mobile App Quality Audit Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with mobile app quality audit for my current situation"

**Output:**

Based on your situation, here is a structured approach to mobile app quality audit:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
