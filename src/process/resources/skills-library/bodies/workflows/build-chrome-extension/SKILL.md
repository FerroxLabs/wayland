---
name: build-chrome-extension
description: >-
  Step-by-step workflow for building, publishing, and iterating on a Chrome
  browser extension. Covers Manifest V3 architecture, UI development, Chrome Web
  Store publishing, user feedback loops, and growth strategies for building
  extensions that users love and recommend.

  Use when the user wants to build chrome extension or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  startup-advisor react-architect typescript-guru css-master design-patterns
  unit-test-writer e2e-test-architect security-auditor seo-optimizer
  user-story-writer
trigger_phrases: >-
  I want to build a Chrome extension I want to create a browser extension How do
  I publish to the Chrome Web Store I want to build a browser plugin
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: javascript content-marketing entrepreneurship step-by-step planning
  category: software-project
  depends: >-
    startup-advisor react-architect typescript-guru css-master design-patterns
    unit-test-writer e2e-test-architect security-auditor seo-optimizer
    user-story-writer
  disclaimer: none
  difficulty: intermediate
---
# Build Chrome Extension

**Estimated time:** 3-6 weeks

Chrome extensions are one of the fastest paths from idea to shipped product. With over 3 billion Chrome users, even a niche extension can find a meaningful audience. This workflow takes you from idea validation through Manifest V3 architecture, UI development, Chrome Web Store publishing, and post-launch iteration based on user feedback.

The workflow emphasizes the Manifest V3 architecture (required for all new extensions) and the common patterns that make extensions successful: fast popup UI, efficient background processing with service workers, thoughtful permissions (request only what you need), and a smooth onboarding experience.

## When to Use

- User wants to build chrome extension
- User needs a structured, step-by-step process for build chrome extension
- User wants to build a Chrome extension
- User wants to create a browser extension
- How do I publish to the Chrome Web Store
- Do NOT use when: the request is outside the scope of build chrome extension or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Familiarity with JavaScript/TypeScript and web development
- A Google Developer account ($5 one-time registration fee)
- A clear idea for what the extension does and who it serves
- Chrome browser for development and testing
- Basic understanding of HTML, CSS, and browser APIs

## Steps

**Step 1: Validate the Idea and Define MVP** (uses: startup-advisor)

validate your extension idea. Search the Chrome Web Store for competing extensions: what do they do well, what do their reviews complain about? Define your unique angle. Use the User Story Writer skill to write user stories for the MVP feature set. Keep the MVP ruthlessly small -- one core feature done well beats five half-built features. Define what "done" looks like for your first Chrome Web Store submission.

- Input: Extension idea and the problem it solves, Target user persona, Existing extensions that solve similar problems
- Output: Competitive analysis (top 5 competing extensions with ratings and review themes), Unique value proposition statement, MVP feature set (3-5 user stories maximum)
- Key focus: Use the Startup Advisor skill to validate your extension idea

**Step 2: Set Up the Extension Architecture** (uses: typescript-guru)

set up a TypeScript project for the extension. Use the Design Patterns skill to architect the extension with proper separation of concerns. Set up the Manifest V3 structure: `manifest.json` with minimum required permissions, service worker for background tasks, content scripts (if needed), and popup/options pages. Use a build tool (webpack, Vite, or Plasmo) for TypeScript compilation and hot reload during development.

- Input: MVP feature set from Step 1, Manifest V3 requirements, Extension type (popup, sidebar, content script, background processing)
- Output: Project scaffolding with TypeScript configuration, `manifest.json` with minimum required permissions, Service worker setup (background script)
- Key focus: Use the TypeScript Guru skill to set up a TypeScript project for the extension

**Step 3: Build the Core Feature** (uses: react-architect)

Use the React Architect skill (if using React for popup/options pages) to build the extension UI. Use the CSS Master skill for styling -- extensions have unique CSS constraints (popup size limits, content script style isolation). Implement the core feature end-to-end: user interaction in popup or content script, background processing in the service worker, Chrome storage for persistence, and Chrome messaging for communication between contexts. Focus on performance -- popup should open in under 100ms.

- Input: Extension architecture from Step 2, MVP user stories from Step 1, UI wireframes
- Output: Core feature implementation (popup, content script, service worker), Chrome storage implementation for user data and settings, Chrome messaging between extension contexts
- Key focus: Use the React Architect skill (if using React for popup/options pages) to build the extension UI

**Step 4: Test the Extension** (uses: unit-test-writer)

write unit tests for business logic (anything that does not depend on Chrome APIs). Use the E2E Test Architect skill to set up Playwright or Puppeteer for extension testing. Test the critical paths: installation, first use, core feature, options changes, and error scenarios. Manually test on Chrome stable, beta, and at least one Chromium-based browser (Edge, Brave). Test with other popular extensions to check for conflicts.

- Input: Built extension from Step 3, Chrome extension testing limitations, Target Chrome versions
- Output: Unit test suite for business logic, E2E test suite for critical user flows, Cross-browser compatibility test results
- Key focus: Use the Unit Test Writer skill to write unit tests for business logic (anything that does not depend on Chrome APIs)

**Step 5: Security Review** (uses: security-auditor)

review the extension for security vulnerabilities. Chrome Web Store review is strict about security -- extensions with vulnerabilities or excessive permissions are rejected. Audit: permission scope (remove any unused permissions), content security policy, XSS in popup/options pages, data handling (especially if storing sensitive data), external API calls (HTTPS only), and dynamic code execution (prohibited in Manifest V3). Ensure compliance with Chrome Web Store program policies.

- Input: Built and tested extension from Step 4, Permissions requested in manifest.json, Data handling practices
- Output: Security audit report, Permission justification document (required for Chrome Web Store review), Content Security Policy configuration
- Key focus: Use the Security Auditor skill to review the extension for security vulnerabilities

**Step 6: Publish to Chrome Web Store** (uses: seo-optimizer)

optimize your Chrome Web Store listing. The listing is your storefront: craft a compelling title (keyword-rich but not spammy), detailed description with feature highlights and use cases, high-quality screenshots showing the extension in action, and a promotional tile. Write a clear privacy policy. Submit for review (typically 1-3 business days). Prepare for potential rejection feedback and iterate.

- Input: Production-ready extension from Steps 1-5, Google Developer account, Marketing assets (screenshots, description)
- Output: Chrome Web Store listing (title, description, category), Screenshots (at least 3, showing key features in action), Promotional tile images (440x280, 920x680)
- Key focus: Use the SEO Optimizer skill to optimize your Chrome Web Store listing

**Step 7: Iterate Based on User Feedback** (uses: user-story-writer)

translate user feedback into actionable improvements. Monitor Chrome Web Store reviews, set up a feedback channel (email, Discord, or GitHub Issues), and add lightweight analytics to understand feature usage. Prioritize bugs and UX issues that cause 1-star reviews. Plan feature additions based on user requests and competitive analysis. Release updates every 2-4 weeks to maintain momentum and show users the extension is actively maintained.

- Input: Published extension with initial users, Chrome Web Store reviews and ratings, Usage analytics
- Output: User feedback collection system, Prioritized improvement backlog, Analytics dashboard (installs, DAU, feature usage)
- Key focus: Use the User Story Writer skill to translate user feedback into actionable improvements

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Pivot the concept to address unmet needs
  - If **After Step 4**: Fix stability issues before security review
  - If **After Step 5**: Reduce permissions and fix security issues
  - If **After Step 6**: Address review feedback and resubmit

## Failure Handling

- **Requesting too many permissions:** -- Chrome Web Store reviewers and users are suspicious of broad permissions. Request the minimum and justify each one.
- **Ignoring Manifest V3:** -- Manifest V2 extensions will stop working. Build on V3 from the start, even though some APIs are more limited.
- **Slow popup:** -- Extensions that take more than 200ms to show the popup feel broken. Optimize aggressively.
- **No onboarding:** -- Users who install and do not understand what to do next uninstall immediately. Add a post-install welcome page or guided tour.
- **Content script conflicts:** -- Your content scripts can break websites or conflict with other extensions. Use Shadow DOM for isolation and test widely.

## Expected Outcome

When this workflow is complete, the user will have:

1. Extension passes Chrome Web Store review on first or second submission
2. Star rating is 4.0 or above within the first month
3. Daily active users show consistent growth
4. Core feature usage rate exceeds 60% of installs (users who install actually use it)
5. Support requests decrease over time as UX improves
6. Extension loads and responds in under 100ms for popup interactions

## Output Format

```
BUILD CHROME EXTENSION TRACKER
==============================

[ ] Step 1: Validate the Idea and Define MVP
    Status: [pending/in-progress/complete]
[ ] Step 2: Set Up the Extension Architecture
    Status: [pending/in-progress/complete]
[ ] Step 3: Build the Core Feature
    Status: [pending/in-progress/complete]
[ ] Step 4: Test the Extension
    Status: [pending/in-progress/complete]
[ ] Step 5: Security Review
    Status: [pending/in-progress/complete]
[ ] Step 6: Publish to Chrome Web Store
    Status: [pending/in-progress/complete]
[ ] Step 7: Iterate Based on User Feedback
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Requesting too many permissions:** -- Chrome Web Store reviewers and users are suspicious of broad permissions. Request the minimum and justify each one.
- **Ignoring Manifest V3:** -- Manifest V2 extensions will stop working. Build on V3 from the start, even though some APIs are more limited.
- **Slow popup:** -- Extensions that take more than 200ms to show the popup feel broken. Optimize aggressively.
- **No onboarding:** -- Users who install and do not understand what to do next uninstall immediately. Add a post-install welcome page or guided tour.

## Example

**Input:** "I want to build chrome extension and need a structured plan to follow step by step."

**Output:**

**Step 1 (startup-advisor-user-story-writer):** Validate the Idea and Define MVP -- produces concrete deliverables for this phase.

**Step 2 (typescript-guru-design-patterns):** Set Up the Extension Architecture -- produces concrete deliverables for this phase.

**Step 3 (react-architect-css-master):** Build the Core Feature -- produces concrete deliverables for this phase.

**Step 4 (unit-test-writer-e2e-test-architect):** Test the Extension -- produces concrete deliverables for this phase.

**Step 5 (security-auditor):** Security Review -- produces concrete deliverables for this phase.

**Step 6 (seo-optimizer):** Publish to Chrome Web Store -- produces concrete deliverables for this phase.

**Step 7 (user-story-writer):** Iterate Based on User Feedback -- produces concrete deliverables for this phase.

**Result:** User has a complete build chrome extension plan with all deliverables produced, validated, and ready for implementation.
