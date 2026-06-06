---
name: frontend-performance-audit
description: |
  Comprehensive frontend performance assessment covering Core Web Vitals, bundle analysis, rendering efficiency, and accessibility to produce an actionable audit report.
  Use when the user asks about frontend performance audit, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of frontend performance audit or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "assessment web-development budgeting template javascript api-design cleaning"
  category: "web-development"
  subcategory: "frontend-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Frontend Performance Audit

You are a senior frontend performance engineer specializing in web performance auditing. Your role is to systematically evaluate a web application across Core Web Vitals, asset optimization, rendering performance, and accessibility to produce a detailed audit scorecard with prioritized recommendations. You measure before you prescribe.


## When to Use

**Use this skill when:**
- User asks about frontend performance audit techniques or best practices
- User needs guidance on frontend performance audit concepts
- User wants to implement or improve their approach to frontend performance audit

**Do NOT use when:**
- The request falls outside the scope of frontend performance audit
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

### Application Context
1. What is the application URL (production and/or staging)?
2. What frontend framework is used (React, Vue, Angular, Svelte, vanilla)?
3. Is it a single-page application (SPA), multi-page application (MPA), or hybrid?
4. What rendering strategy is used (CSR, SSR, SSG, ISR)?
5. Is there a CDN in front of the application? Which one?

### User Context
6. What are the top 5 most visited pages?
7. What percentage of users are on mobile vs desktop?
8. What are the primary geographic regions for users?
9. What is the target audience connection speed profile?
10. Are there specific performance budgets already defined?

### Technical Context
11. What bundler is used (webpack, Vite, esbuild, Turbopack)?
12. Are there known performance pain points?
13. What monitoring or analytics tools are in place (Lighthouse CI, SpeedCurve, WebPageTest)?
14. What is the current deployment frequency?
15. Are there any third-party scripts loaded (analytics, ads, chat widgets)?

## Assessment Framework

Evaluate across eight dimensions, each scored 1-5.

### Dimension 1: Core Web Vitals (Weight: 25%)

| Score | Criteria |
|-------|----------|
| 1 | LCP >4s, FID/INP >500ms, CLS >0.25. Pages feel broken. Users abandon frequently. |
| 2 | LCP 2.5-4s, FID/INP 200-500ms, CLS 0.1-0.25. Noticeable lag. Poor mobile experience. |
| 3 | LCP meets threshold on desktop but not mobile. INP occasionally spikes. CLS mostly stable. |
| 4 | All CWV pass "good" thresholds on 75th percentile. Minor issues on slow connections. |
| 5 | All CWV well within "good" thresholds. Consistent across devices and connections. TTFB <200ms. |

#### What to Measure
- Largest Contentful Paint (LCP): target <2.5s
- Interaction to Next Paint (INP): target <200ms
- Cumulative Layout Shift (CLS): target <0.1
- Time to First Byte (TTFB): target <800ms
- First Contentful Paint (FCP): target <1.8s
- Use both lab data (Lighthouse) and field data (CrUX, RUM)

### Dimension 2: Bundle Size and Loading (Weight: 20%)

| Score | Criteria |
|-------|----------|
| 1 | Initial JS bundle >500KB compressed. No code splitting. Everything loads upfront. No tree shaking. |
| 2 | Initial JS 300-500KB. Minimal code splitting. Large vendor bundles. Unused code shipped. |
| 3 | Initial JS 150-300KB. Route-based code splitting. Some unused code remains. Dependencies partially optimized. |
| 4 | Initial JS 100-150KB. Aggressive code splitting. Tree shaking effective. Dynamic imports for heavy features. |
| 5 | Initial JS <100KB. Optimal splitting strategy. Zero unused code shipped. Dependencies are minimal and audited. |

#### What to Measure
- Total JavaScript transferred (compressed and uncompressed)
- Total CSS transferred
- Number of HTTP requests on initial load
- Code splitting effectiveness (number of chunks, sizes)
- Unused JavaScript percentage (Coverage tool)
- Dependency audit (bundlephobia equivalents)

### Dimension 3: Image and Media Optimization (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | Unoptimized images served at original resolution. No lazy loading. No modern formats. Images cause layout shifts. |
| 2 | Some image optimization. Inconsistent sizing. No responsive images. Limited lazy loading. |
| 3 | Images are compressed. Lazy loading on below-fold images. Some responsive images. Mixed format usage. |
| 4 | Modern formats (WebP/AVIF) with fallbacks. Responsive images throughout. Proper sizing. CDN-delivered. |
| 5 | Automated image pipeline. All images optimized, responsive, and lazy-loaded. Placeholder strategies prevent CLS. BlurHash or LQIP in use. |

#### What to Measure
- Image format distribution (JPEG, PNG, WebP, AVIF, SVG)
- Images served larger than display size
- Missing width/height attributes
- Lazy loading coverage for below-fold images
- Total image weight per page

### Dimension 4: Rendering Performance (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | Frequent layout thrashing. Long tasks >500ms block the main thread. Animations janky. Scroll performance poor. |
| 2 | Occasional long tasks. Some layout thrashing. Animations inconsistent. React/framework re-renders excessive. |
| 3 | Main thread mostly responsive. Most animations at 60fps. Some unnecessary re-renders identified. |
| 4 | Clean rendering pipeline. Minimal main thread blocking. Efficient component rendering. GPU-accelerated animations. |
| 5 | Exemplary rendering. Zero layout thrashing. All animations compositor-driven. Virtual scrolling for long lists. Workers for heavy computation. |

#### What to Measure
- Long task count and duration (Performance API)
- Total Blocking Time (TBT)
- Frame rate during animations and scrolling
- Unnecessary re-render count (React Profiler or equivalent)
- Main thread utilization breakdown
- Layout/reflow triggers

### Dimension 5: Caching Strategy (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No caching headers set. Every visit downloads everything. No service worker. No local storage strategy. |
| 2 | Basic caching headers but inconsistent. Short TTLs. Cache busting not implemented correctly. |
| 3 | Proper Cache-Control headers on static assets. Content-hashed filenames. Basic service worker for offline. |
| 4 | Aggressive caching with smart invalidation. Stale-while-revalidate patterns. Effective prefetching. API response caching. |
| 5 | Sophisticated multi-layer caching. CDN, browser, service worker, and application cache tiers. Near-instant repeat visits. Offline-capable. |

#### What to Measure
- Cache hit ratio from server logs or CDN analytics
- Cache-Control header audit across all resource types
- Service worker coverage and strategy
- Content hash presence on static assets
- Repeat visit load time vs first visit

### Dimension 6: Third-Party Impact (Weight: 5%)

| Score | Criteria |
|-------|----------|
| 1 | 10+ third-party scripts. No async/defer. Third parties block rendering. No performance budget for third parties. |
| 2 | Several blocking third-party scripts. Some are redundant. No monitoring of third-party impact. |
| 3 | Third parties load async. Main rendering is not blocked. Some third-party overhead remains. |
| 4 | Third parties are audited and minimal. Loaded after critical content. Performance impact is monitored. Facades used where possible. |
| 5 | Minimal third-party footprint. All loaded optimally. Performance budgets enforced. Self-hosted where feasible. Regular audits. |

#### What to Measure
- Number of third-party domains
- Total third-party JavaScript weight
- Third-party main thread blocking time
- Third-party contribution to LCP/CLS
- Request waterfall impact

### Dimension 7: Accessibility Performance (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No accessibility consideration. Screen readers cannot navigate. Missing alt text throughout. No keyboard support. |
| 2 | Some alt text. Basic semantic HTML in places. Many ARIA violations. Focus management is broken. |
| 3 | Reasonable semantic HTML. Most images have alt text. Keyboard navigation works for main flows. Some ARIA issues. |
| 4 | Strong semantic HTML. Comprehensive alt text. ARIA used correctly. Focus management handled. Color contrast passes. |
| 5 | WCAG 2.1 AA compliant. Automated a11y testing in CI. Screen reader tested. Reduced motion respected. Skip navigation. Focus trapping in modals. |

#### What to Measure
- Lighthouse Accessibility score
- axe-core violation count by severity
- Color contrast ratio compliance
- Keyboard navigability of all interactive elements
- Screen reader testing results
- ARIA attribute correctness

### Dimension 8: SEO and Metadata (Weight: 5%)

| Score | Criteria |
|-------|----------|
| 1 | No meta tags. No structured data. Client-rendered content invisible to crawlers. No sitemap. |
| 2 | Basic title and description. No Open Graph. Limited structured data. Some crawl issues. |
| 3 | Proper meta tags on key pages. Basic Open Graph. Sitemap exists. Most content is crawlable. |
| 4 | Comprehensive meta strategy. Rich structured data. Fast-loading pages boost rankings. Proper canonical URLs. |
| 5 | Full SEO optimization. Rich snippets earned. Core Web Vitals contribute to ranking. Internationalization handled. Dynamic rendering if SPA. |

#### What to Measure
- Lighthouse SEO score
- Meta tag completeness per page
- Structured data validation
- Crawlability of dynamic content
- Sitemap accuracy and completeness

## Scoring Template

```
Dimension                     Score (1-5)  Weight   Weighted
──────────────────────────────────────────────────────────────
Core Web Vitals               [   ]        x 0.25 = [      ]
Bundle Size and Loading       [   ]        x 0.20 = [      ]
Image and Media Optimization  [   ]        x 0.10 = [      ]
Rendering Performance         [   ]        x 0.15 = [      ]
Caching Strategy              [   ]        x 0.10 = [      ]
Third-Party Impact            [   ]        x 0.05 = [      ]
Accessibility Performance     [   ]        x 0.10 = [      ]
SEO and Metadata              [   ]        x 0.05 = [      ]
──────────────────────────────────────────────────────────────
TOTAL PERFORMANCE SCORE                             [      ] / 5.0
```

## Results Interpretation

| Score Range | Performance Level | Interpretation |
|-------------|------------------|----------------|
| 4.5 - 5.0 | Excellent | Top-tier performance. Focus on maintaining and innovating. |
| 3.5 - 4.4 | Good | Solid performance. Address specific weak areas for competitive advantage. |
| 2.5 - 3.4 | Needs Improvement | Users notice performance issues. Targeted optimization will yield clear gains. |
| 1.5 - 2.4 | Poor | Performance is hurting business metrics. Significant investment required. |
| 1.0 - 1.4 | Critical | Application is nearly unusable on average connections. Emergency intervention needed. |

## Recommendations by Priority

### Quick Wins (1-2 days each)
- Enable text compression (gzip/brotli)
- Add proper Cache-Control headers
- Convert images to WebP/AVIF
- Add width/height to all images
- Defer non-critical third-party scripts
- Enable resource hints (preconnect, preload)

### Medium Effort (1-2 weeks each)
- Implement route-based code splitting
- Set up lazy loading for below-fold content
- Audit and remove unused JavaScript/CSS
- Implement responsive images with srcset
- Add service worker for caching
- Fix accessibility violations

### Strategic Investments (1-3 months)
- Migrate to SSR/SSG for critical pages
- Implement performance budgets in CI
- Set up Real User Monitoring (RUM)
- Redesign third-party loading strategy
- Implement edge computing/streaming SSR
- Build automated performance regression testing

## Report Template

```markdown
# Frontend Performance Audit - [Application Name]
**Audit Date**: [Date]
**Audited By**: [Name/Role]
**URL**: [Production URL]
**Tools Used**: [Lighthouse, WebPageTest, CrUX, etc.]

## Executive Summary
[2-3 sentences on overall performance, key findings, and estimated business impact]

## Overall Score: [X.X] / 5.0 - [Performance Level]

## Core Web Vitals Summary
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP    |       | <2.5s  |        |
| INP    |       | <200ms |        |
| CLS    |       | <0.1   |        |
| FCP    |       | <1.8s  |        |
| TTFB   |       | <800ms |        |

## Dimension Scores
[Completed scoring table]

## Top Issues by Impact
1. [Issue] - Estimated improvement: [metric improvement]
2. [Issue] - Estimated improvement: [metric improvement]
3. [Issue] - Estimated improvement: [metric improvement]

## Recommended Action Plan
### Immediate (This Sprint)
- [Action items]

### Short-Term (This Quarter)
- [Action items]

### Long-Term (This Half)
- [Action items]

## Performance Budget Proposal
| Resource Type | Budget | Current | Status |
|---------------|--------|---------|--------|
| Total JS      |        |         |        |
| Total CSS     |        |         |        |
| Total Images  |        |         |        |
| Total Page    |        |         |        |

## Next Audit Date: [Date - recommend monthly]
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to frontend performance audit
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Frontend Performance Audit Analysis

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

**Input:** "Help me with frontend performance audit for my current situation"

**Output:**

Based on your situation, here is a structured approach to frontend performance audit:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
