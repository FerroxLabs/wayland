---
name: launch-api-product
description: >-
  Complete workflow for designing, building, documenting, and monetizing an API
  product. Covers API-first design, implementation, developer portal creation,
  SDK generation, pricing strategy, and building a developer ecosystem around
  your API.

  Use when the user wants to launch api product or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  api-designer rest-api-design auth-engineer rate-limiter api-documenter
  developer-portal-builder tutorial-writer pricing-strategist cicd-architect
  monitoring-engineer security-auditor community-led-growth
trigger_phrases: >-
  I want to build an API product I want to launch a developer API How do I
  monetize my API I need to build a developer portal
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: documentation step-by-step planning
  category: software-project
  depends: >-
    api-designer rest-api-design auth-engineer rate-limiter api-documenter
    developer-portal-builder tutorial-writer pricing-strategist cicd-architect
    monitoring-engineer security-auditor community-led-growth
  disclaimer: none
  difficulty: advanced
---
# Launch Api Product

**Estimated time:** 6-12 weeks

An API product is more than an endpoint -- it is a developer experience. The most successful API products (Stripe, Twilio, SendGrid) win not because of superior technology alone, but because they make developers productive in minutes. This workflow takes you from API-first design through a polished developer portal with SDKs, interactive documentation, usage-based pricing, and a growing developer community.

The workflow follows the sequence that matters: design the API contract first (before writing code), build and secure the implementation, create world-class documentation and a developer portal, define your pricing and monetization, and then build the developer ecosystem.

## When to Use

- User wants to launch api product
- User needs a structured, step-by-step process for launch api product
- User wants to build an API product
- User wants to launch a developer API
- How do I monetize my API
- Do NOT use when: the request is outside the scope of launch api product or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A clear value proposition for the API (what problem it solves for developers)
- Backend engineering capability (team or individual)
- Domain expertise in the problem space
- Hosting infrastructure (cloud provider account)
- Budget for developer portal hosting and tooling

## Steps

**Step 1: Design the API Contract** (uses: api-designer)

design your API contract before writing any implementation code. Follow API-first design: define resources, endpoints, request/response schemas, error formats, and pagination patterns in an OpenAPI specification. Use the API Versioning skill to establish your versioning strategy from day one (URL path versioning or header-based). Design for the developer: optimize for common use cases, provide sensible defaults, and follow the principle of least surprise.

- Input: Problem domain and target developer audience, Core operations the API needs to support, Data models and entity relationships
- Output: OpenAPI 3.1 specification (complete), Resource model documentation, Error code catalog with descriptions and resolution steps
- Key focus: Use the API Designer skill to design your API contract before writing any implementation code

**Step 2: Build Authentication and Authorization** (uses: auth-engineer)

implement API key management and OAuth 2.0 flows. Design the key lifecycle: creation, rotation, revocation, and scoping. Use the Rate Limiter skill to implement tiered rate limiting that aligns with your pricing tiers. Return standard rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) so developers can build responsibly.

- Input: API contract from Step 1, Client types (server-to-server, browser, mobile), Usage tiers planned for pricing
- Output: API key generation and management system, OAuth 2.0 implementation (if needed for user-context APIs), Rate limiting implementation with tier configuration
- Key focus: Use the Auth Engineer skill to implement API key management and OAuth 2.0 flows

**Step 3: Implement the API** (uses: api-designer)

Implement the API against the contract defined in Step 1. Use contract-first development: generate server stubs from the OpenAPI spec where possible. Build comprehensive request validation, consistent error handling, and structured logging with request IDs for debugging. set up deployment pipelines with contract testing that verifies the implementation matches the spec.

- Input: OpenAPI specification from Step 1, Authentication system from Step 2, Technology stack decisions
- Output: API implementation matching the OpenAPI contract, Request validation middleware, Structured logging with correlation IDs
- Key focus: Implement the API against the contract defined in Step 1

**Step 4: Secure and Harden** (uses: security-auditor)

audit the API against the OWASP API Security Top 10. Test for broken object-level authorization, broken authentication, excessive data exposure, and injection vulnerabilities. Implement security headers, CORS configuration, input sanitization, and request size limits. Set up audit logging for all authentication events and data access.

- Input: Deployed API from Step 3, OWASP API Security Top 10, Compliance requirements (if any)
- Output: Security audit report with findings and remediations, CORS configuration, Security headers configuration
- Key focus: Use the Security Auditor skill to audit the API against the OWASP API Security Top 10

**Step 5: Build Documentation and Developer Portal** (uses: api-documenter)

create comprehensive reference documentation from the OpenAPI spec, including interactive examples, code snippets in multiple languages, and a getting-started guide that gets developers to their first successful API call in under 5 minutes. Use the Developer Portal Builder skill to build the portal with API key management, usage dashboards, and status pages. Use the Tutorial Writer skill to create step-by-step guides for the top 3-5 use cases.

- Input: OpenAPI specification from Step 1, Common use cases and integration patterns, Target developer skill levels
- Output: API reference documentation (auto-generated from OpenAPI + hand-written guides), Developer portal with key management and usage dashboard, Getting-started guide (first API call in < 5 minutes)
- Key focus: Use the API Documenter skill to create comprehensive reference documentation from the OpenAPI spec, including interactive examples, code snippets in multiple languages, and a getting-started guide that gets developers to their first successful API call in under 5 minutes

**Step 6: Implement Monitoring and Observability** (uses: monitoring-engineer)

implement comprehensive API monitoring. Track the four golden signals per endpoint: latency (p50, p95, p99), traffic (requests/second), errors (4xx, 5xx rates), and saturation (CPU, memory, connections). Build a public status page. Set up alerts that fire before customers notice problems. Implement request tracing for debugging customer-reported issues.

- Input: Deployed API from Step 3, SLAs you plan to offer customers, Expected traffic patterns
- Output: Per-endpoint latency, throughput, and error rate dashboards, Public status page, Alert definitions for SLA violations
- Key focus: Use the Monitoring Engineer skill to implement comprehensive API monitoring

**Step 7: Define Pricing and Monetization** (uses: pricing-strategist)

design your pricing model. API products typically use usage-based pricing (per-request, per-resource, or per-feature). Design 3-4 tiers: free (developer sandbox), starter, growth, and enterprise. Ensure the free tier is generous enough to evaluate the API but limited enough to drive conversion. Implement usage metering that feeds into billing.

- Input: API usage patterns from monitoring, Competitor pricing analysis, Cost of serving requests
- Output: Pricing page with tier comparison, Usage metering implementation, Billing system integration
- Key focus: Use the Pricing Strategist skill to design your pricing model

**Step 8: Build the Developer Ecosystem** (uses: community-led-growth)

build a developer ecosystem around your API. Create a developer blog with integration tutorials, a Discord or Slack community for support, and a changelog that developers actually want to read. Build partnerships with complementary tools. Consider an integration marketplace. The goal is making your API the obvious choice through community strength, not just feature comparison.

- Input: Launched API product from Steps 1-7, Target developer communities, Content marketing capabilities
- Output: Developer community platform (Discord/Slack), Developer blog with technical content calendar, Integration partner program
- Key focus: Use the Community-Led Growth skill to build a developer ecosystem around your API

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Iterate on design based on feedback
  - If **After Step 4**: Remediate security issues before exposing to developers
  - If **After Step 5**: Simplify onboarding until the 5-minute goal is met
  - If **After Step 7**: Adjust pricing based on willingness-to-pay research

## Failure Handling

- **Building before designing:** -- Writing code before the API contract leads to APIs shaped by implementation details rather than developer needs. Design first.
- **Authentication complexity:** -- If getting an API key takes more than 2 minutes, you have already lost developers. Make onboarding frictionless.
- **Inconsistent error formats:** -- Every endpoint returning errors differently forces developers to write special-case handling. Standardize error responses.
- **Documentation afterthought:** -- Great documentation is a competitive moat. Invest as much in docs as in code.
- **No sandbox environment:** -- Developers need to experiment safely. Provide a sandbox with test data and no billing.

## Expected Outcome

When this workflow is complete, the user will have:

1. Time to first API call is under 5 minutes for new developers
2. API uptime meets published SLA (target 99.9%+)
3. Documentation satisfaction score exceeds 4/5
4. Developer community shows organic growth month over month
5. Revenue from API usage grows quarter over quarter
6. API error rate stays below 0.1% for non-client errors

## Output Format

```
LAUNCH API PRODUCT TRACKER
==========================

[ ] Step 1: Design the API Contract
    Status: [pending/in-progress/complete]
[ ] Step 2: Build Authentication and Authorization
    Status: [pending/in-progress/complete]
[ ] Step 3: Implement the API
    Status: [pending/in-progress/complete]
[ ] Step 4: Secure and Harden
    Status: [pending/in-progress/complete]
[ ] Step 5: Build Documentation and Developer Portal
    Status: [pending/in-progress/complete]
[ ] Step 6: Implement Monitoring and Observability
    Status: [pending/in-progress/complete]
[ ] Step 7: Define Pricing and Monetization
    Status: [pending/in-progress/complete]
[ ] Step 8: Build the Developer Ecosystem
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Building before designing:** -- Writing code before the API contract leads to APIs shaped by implementation details rather than developer needs. Design first.
- **Authentication complexity:** -- If getting an API key takes more than 2 minutes, you have already lost developers. Make onboarding frictionless.
- **Inconsistent error formats:** -- Every endpoint returning errors differently forces developers to write special-case handling. Standardize error responses.
- **Documentation afterthought:** -- Great documentation is a competitive moat. Invest as much in docs as in code.

## Example

**Input:** "I want to launch api product and need a structured plan to follow step by step."

**Output:**

**Step 1 (api-designer-rest-api-design):** Design the API Contract -- produces concrete deliverables for this phase.

**Step 2 (auth-engineer-rate-limiter):** Build Authentication and Authorization -- produces concrete deliverables for this phase.

**Step 3 (api-designer-cicd-architect):** Implement the API -- produces concrete deliverables for this phase.

**Step 4 (security-auditor):** Secure and Harden -- produces concrete deliverables for this phase.

**Step 5 (api-documenter-developer-portal-builder-tutorial-writer):** Build Documentation and Developer Portal -- produces concrete deliverables for this phase.

**Step 6 (monitoring-engineer):** Implement Monitoring and Observability -- produces concrete deliverables for this phase.

**Step 7 (pricing-strategist):** Define Pricing and Monetization -- produces concrete deliverables for this phase.

**Step 8 (community-led-growth):** Build the Developer Ecosystem -- produces concrete deliverables for this phase.

**Result:** User has a complete launch api product plan with all deliverables produced, validated, and ready for implementation.
