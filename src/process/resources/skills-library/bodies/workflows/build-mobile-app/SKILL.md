---
name: build-mobile-app
description: >-
  End-to-end mobile application development workflow from requirements analysis
  and system design through API development, cross-platform app building with
  Flutter or React Native, mobile-specific testing, and app store optimization
  for publishing on iOS and Android.

  Use when the user wants to build mobile app or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  requirements-analyst system-designer api-designer flutter-architect
  react-native-builder mobile-testing app-store-optimizer
trigger_phrases: >-
  I want to build a mobile app help me create an app build an iOS and Android
  app mobile app development guide launch an app on the app store cross-platform
  mobile development
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: mobile step-by-step planning
  category: software-project
  depends: >-
    requirements-analyst system-designer api-designer flutter-architect
    react-native-builder mobile-testing app-store-optimizer
  disclaimer: none
  difficulty: advanced
---
# Build Mobile App

**Estimated time:** 6-12 weeks

This workflow guides you through building and publishing a cross-platform mobile
application. It covers requirements gathering, system architecture, API design,
mobile development using Flutter or React Native, comprehensive mobile testing,
and app store optimization for successful publishing on both iOS and Android.

A decision gate lets you choose between Flutter and React Native based on your
team's skills and project requirements. The remaining steps adapt to your
chosen framework.

By the end of this workflow you will have: documented requirements, a backend
API, a cross-platform mobile app, a comprehensive test suite, and optimized
app store listings ready for launch.

## When to Use

- User wants to build mobile app
- User needs a structured, step-by-step process for build mobile app
- User wants to build a mobile app
- User wants to create an app
- build an iOS and Android app
- Do NOT use when: the request is outside the scope of build mobile app or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A mobile app idea with defined core features
- Programming experience (Dart for Flutter or JavaScript/TypeScript for React Native)
- Apple Developer Account ($99/year) for iOS publishing
- Google Play Developer Account ($25 one-time) for Android publishing
- A Mac for iOS development and testing

## Steps

**Step 1: Analyze Requirements** (uses: requirements-analyst)

define what the app needs to do. Focus on
mobile-specific concerns:

- Input: app concept and target users, Platform requirements (iOS, Android, or both), Any existing wireframes, mockups, or competitor analysis
- Output: User stories with mobile-specific acceptance criteria, iOS and Android specific considerations, MVP feature set with clear boundaries
- Key focus: Use the Requirements Analyst skill to define what the app needs to do

**Step 2: Design the System** (uses: system-designer)

architect the backend and mobile system.

- Input: `requirements-doc` from Step 1 (features inform architecture), `platform-requirements` from Step 1 (mobile constraints), `device-features` from Step 1 (native integration needs)
- Output: Backend and mobile architecture with component interactions, Backend and mobile technology choices with rationale, Offline data synchronization approach
- Key focus: Backend architecture (API server, database, file storage, push notification service)

**Step 3: Design the API** (uses: api-designer)

create a mobile-optimized API.

- Input: `system-architecture` from Step 2 (component boundaries), `requirements-doc` from Step 1 (features define endpoints), `sync-strategy` from Step 2 (offline sync affects API design)
- Output: OpenAPI 3.x specification optimized for mobile consumption, Mobile-specific conventions (pagination, file upload, sync), Authentication and authorization endpoint specifications
- Key focus: REST resource design optimized for mobile (minimize round trips)

**Step 4: Build the Mobile App** (uses: flutter-architect)

Use the Flutter Architect skill (or React Native Builder if that path was
chosen) to build the mobile application.

- Input: `api-spec` from Step 3 (the app consumes this API), `system-architecture` from Step 2 (mobile architecture decisions), `tech-stack` from Step 2 (framework and tooling choices)
- Output: Working cross-platform mobile application, Architecture documentation (state management, navigation, patterns), Platform-specific code and configuration
- Key focus: Project setup with proper folder structure and architecture pattern

**Step 5: Test the Mobile App** (uses: mobile-testing)

build a comprehensive mobile test suite.

- Input: `mobile-app` from Step 4 (the app to test), `requirements-doc` from Step 1 (acceptance criteria become test cases), `api-spec` from Step 3 (API contract for integration tests)
- Output: Unit, widget, integration, and accessibility tests, Device and OS version compatibility matrix, Launch time, memory, and battery benchmarks
- Key focus: Unit tests for business logic and state management

**Step 6: Optimize App Store Listings** (uses: app-store-optimizer)

maximize discoverability and conversions
on both app stores.

- Input: `mobile-app` from Step 4 (the app being published), `requirements-doc` from Step 1 (target audience for positioning), `test-matrix` from Step 5 (supported devices for listing)
- Output: Keyword strategy, category selection, and listing optimization plan, Optimized titles, descriptions, and metadata for both stores, Screenshot content, ordering, and design specifications
- Key focus: Keyword research for both App Store and Google Play

## Decision Points

- **After Step 2:** Which cross-platform framework will you use?
  - If **Flutter (Dart)**: Step 4 uses Flutter Architect. Great for custom UI and animation-heavy apps.
  - If **React Native (JavaScript/TypeScript)**: Step 4 uses React Native Builder instead. Great for teams with web/React experience.
  - If **Native (Swift + Kotlin)**: Build separate native apps. Step 4 will need to be executed twice -- once per platform. Most expensive but best performance.
- **After Step 5:** How will you approach the app store launch?
  - If **Soft launch (limited market)**: Launch in a small market first to validate. Full ASO for the broad launch later.
  - If **Full launch (global)**: Optimize ASO for primary markets immediately. Higher stakes but faster growth.
  - If **TestFlight/Beta only**: Private beta before public launch. Step 6 focuses on beta feedback collection and iteration.

## Failure Handling

- **Ignoring platform differences:** iOS and Android have different design languages. Respect both.
- **Skipping offline mode:** Mobile users lose connectivity frequently. Plan for it from the start.
- **Neglecting performance:** Mobile devices have limited resources. Profile and optimize early.
- **Poor app store listings:** Your listing is your storefront. Invest in screenshots and descriptions.
- **Ignoring accessibility:** 15-20% of users have accessibility needs. Test with screen readers.

## Expected Outcome

When this workflow is complete, the user will have:

1. The mobile app runs on both iOS and Android without crashes
2. All MVP features are implemented and tested
3. The app handles offline mode and poor network conditions
4. App store listings are optimized for discoverability
5. The app is published on both the App Store and Google Play
6. Crash reporting and analytics are capturing data
7. Users can complete core flows without confusion

## Output Format

```
BUILD MOBILE APP TRACKER
========================

[ ] Step 1: Analyze Requirements
    Status: [pending/in-progress/complete]
[ ] Step 2: Design the System
    Status: [pending/in-progress/complete]
[ ] Step 3: Design the API
    Status: [pending/in-progress/complete]
[ ] Step 4: Build the Mobile App
    Status: [pending/in-progress/complete]
[ ] Step 5: Test the Mobile App
    Status: [pending/in-progress/complete]
[ ] Step 6: Optimize App Store Listings
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Ignoring platform differences:** iOS and Android have different design languages. Respect both.
- **Skipping offline mode:** Mobile users lose connectivity frequently. Plan for it from the start.
- **Neglecting performance:** Mobile devices have limited resources. Profile and optimize early.
- **Poor app store listings:** Your listing is your storefront. Invest in screenshots and descriptions.

## Example

**Input:** "I want to build mobile app and need a structured plan to follow step by step."

**Output:**

**Step 1 (requirements-analyst):** Analyze Requirements -- produces concrete deliverables for this phase.

**Step 2 (system-designer):** Design the System -- produces concrete deliverables for this phase.

**Step 3 (api-designer):** Design the API -- produces concrete deliverables for this phase.

**Step 4 (flutter-architect):** Build the Mobile App -- produces concrete deliverables for this phase.

**Step 5 (mobile-testing):** Test the Mobile App -- produces concrete deliverables for this phase.

**Step 6 (app-store-optimizer):** Optimize App Store Listings -- produces concrete deliverables for this phase.

**Result:** User has a complete build mobile app plan with all deliverables produced, validated, and ready for implementation.
