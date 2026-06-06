---
name: mobile-cicd
description: |
  Expert mobile continuous integration and delivery covering Fastlane automation, code signing management, TestFlight and Google Play deployment pipelines, App Center distribution, automated testing in CI, build versioning strategies, environment configuration, and release management for iOS and Android apps.
  Use when the user asks about mobile cicd, mobile cicd best practices, or needs guidance on mobile cicd implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices ci-cd"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Mobile CI/CD

You are an expert in mobile continuous integration and delivery. You guide teams through building reliable, automated pipelines for iOS and Android applications, covering code signing, build automation with Fastlane, distribution to testers and stores, automated testing, and release management.

## Fastlane for iOS

### Fastfile Structure

```ruby
# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  before_all do
    setup_ci if ENV['CI']
  end

  desc "Run unit and UI tests"
  lane :test do
    scan(
      project: "MyApp.xcodeproj",
      scheme: "MyApp",
      devices: ["iPhone 15"],
      clean: true,
      code_coverage: true,
      output_types: "junit",
      output_directory: "./test_results"
    )
  end

  desc "Build and upload to TestFlight"
  lane :beta do
    increment_build_number(
      build_number: ENV['BUILD_NUMBER'] || latest_testflight_build_number + 1
    )
    sync_code_signing(type: "appstore", readonly: true)
    build_app(
      project: "MyApp.xcodeproj",
      scheme: "MyApp",
      export_method: "app-store",
      output_directory: "./build",
      include_bitcode: false
    )
    upload_to_testflight(
      skip_waiting_for_build_processing: true,
      distribute_external: false,
      changelog: ENV['CHANGELOG'] || "Bug fixes and improvements"
    )
  end

  desc "Deploy to App Store"
  lane :release do
    ensure_git_branch(branch: "main")
    ensure_git_status_clean
    version = get_version_number(target: "MyApp")
    sync_code_signing(type: "appstore", readonly: true)
    build_app(
      project: "MyApp.xcodeproj",
      scheme: "MyApp",
      export_method: "app-store",
      output_directory: "./build"
    )
    upload_to_app_store(
      force: true,
      submit_for_review: true,
      automatic_release: false,
      submission_information: { add_id_info_uses_idfa: false },
      precheck_include_in_app_purchases: false
    )
    add_git_tag(tag: "v#{version}")
    push_git_tags
  end

  error do |lane, exception|
    slack(
      message: "Build failed: #{exception.message}",
      slack_url: ENV['SLACK_WEBHOOK_URL'],
      success: false
    )
  end
end
```

### Matchfile for Code Signing

```ruby
# fastlane/Matchfile
git_url("[reference URL]")
storage_mode("git")
type("appstore")
app_identifier(["com.myorg.myapp", "com.myorg.myapp.widgets"])
username("developer@myorg.com")
readonly(true) if ENV['CI']
```

## Fastlane for Android

```ruby
# fastlane/Fastfile
default_platform(:android)

platform :android do
  desc "Run unit tests"
  lane :test do
    gradle(task: "testDebugUnitTest")
  end

  desc "Build and distribute to internal testers"
  lane :beta do
    gradle(
      task: "bundle",
      build_type: "Release",
      properties: {
        "android.injected.version.code" => ENV['BUILD_NUMBER'] || Time.now.to_i,
        "android.injected.signing.store.file" => ENV['KEYSTORE_PATH'],
        "android.injected.signing.store.password" => ENV['KEYSTORE_PASSWORD'],
        "android.injected.signing.key.alias" => ENV['KEY_ALIAS'],
        "android.injected.signing.key.password" => ENV['KEY_PASSWORD']
      }
    )
    upload_to_play_store(
      track: "internal",
      aab: "app/build/outputs/bundle/release/app-release.aab",
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end

  desc "Promote internal to production"
  lane :release do
    upload_to_play_store(
      track: "internal",
      track_promote_to: "production",
      rollout: "0.1",
      skip_upload_aab: true,
      skip_upload_metadata: false
    )
  end
end
```

## Code Signing Management

### iOS Signing Strategy

```
Code Signing Approaches:
├── Fastlane Match (recommended for teams)
│   ├── Stores certs/profiles in Git repo or cloud storage
│   ├── Single source of truth for the whole team
│   └── CI fetches read-only copies
│
├── Xcode Automatic Signing
│   ├── Good for solo developers
│   └── Problematic in CI (requires Apple ID auth)
│
└── Manual Signing
    ├── Full control over every profile
    └── Error-prone at scale

Match Type Mapping:
  development  → Local device testing
  adhoc        → Internal testers (device UDID required)
  appstore     → TestFlight and App Store submission
  enterprise   → Internal distribution (Enterprise account only)
```

### Android Signing Strategy

```
Signing Approaches:
├── Google Play App Signing (recommended)
│   ├── Google holds the app signing key
│   ├── You hold an upload key
│   ├── If upload key is compromised, Google can reset it
│   └── Enables key rotation without user impact
│
└── CI Keystore Management
    ├── Store keystore as base64 encoded CI secret
    ├── Decode at build time
    ├── Never commit keystores to source control
    └── Rotate upload keys annually
```

## GitHub Actions Pipelines

### iOS Pipeline

```yaml
# .github/workflows/ios.yml
name: iOS CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
env:
  XCODE_VERSION: "15.4"

jobs:
  test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: ${{ env.XCODE_VERSION }}
      - name: Cache DerivedData
        uses: actions/cache@v4
        with:
          path: ~/Library/Developer/Xcode/DerivedData
          key: ${{ runner.os }}-deriveddata-${{ hashFiles('**/*.xcodeproj/project.pbxproj') }}
      - name: Run tests
        run: bundle run-cmd fastlane ios test

  deploy-testflight:
    needs: test
    runs-on: macos-14
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: ${{ env.XCODE_VERSION }}
      - uses: ruby/setup-ruby@v1
        with:
          bundler-cache: true
      - name: Build and upload
        env:
          BUILD_NUMBER: ${{ github.run_number }}
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          MATCH_GIT_BASIC_AUTHORIZATION: ${{ secrets.MATCH_GIT_TOKEN }}
          APP_STORE_CONNECT_API_KEY_ID: ${{ secrets.ASC_KEY_ID }}
          APP_STORE_CONNECT_API_ISSUER_ID: ${{ secrets.ASC_ISSUER_ID }}
          APP_STORE_CONNECT_API_KEY: ${{ secrets.ASC_API_KEY }}
        run: bundle run-cmd fastlane ios beta
```

### Android Pipeline

```yaml
# .github/workflows/android.yml
name: Android CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Cache Gradle
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
      - name: Run unit tests
        run: ./gradlew testDebugUnitTest
      - name: Run lint
        run: ./gradlew lintDebug

  deploy-internal:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: ruby/setup-ruby@v1
        with:
          bundler-cache: true
      - name: Decode keystore
        run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > app/release.keystore
      - name: Deploy to internal track
        env:
          BUILD_NUMBER: ${{ github.run_number }}
          KEYSTORE_PATH: ${{ github.workspace }}/app/release.keystore
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
          SUPPLY_JSON_KEY_DATA: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
        run: bundle run-cmd fastlane android beta
```

## Build Versioning

```
Semantic Versioning for Mobile:
  MAJOR.MINOR.PATCH (e.g., 2.5.1)

Build Number Strategy:
├── CI build number (recommended)
│   ├── Auto-incrementing, never conflicts
│   ├── GitHub: ${{ github.run_number }}
│   ├── GitLab: $CI_PIPELINE_IID
│   └── Bitrise: $BITRISE_BUILD_NUMBER
│
├── Timestamp-based
│   ├── Format: YYMMDDHHmm (e.g., 2601151430)
│   └── Always increasing
│
└── Git commit count
    ├── git rev-list --count HEAD
    └── Can conflict across branches
```

## Environment Configuration

### Multi-Environment Setup

```
Environment Matrix:
├── Development
│   ├── API: [reference URL]
│   ├── Bundle ID: com.myorg.myapp.dev
│   └── Logging: verbose
│
├── Staging
│   ├── API: [reference URL]
│   ├── Bundle ID: com.myorg.myapp.staging
│   └── Logging: info
│
└── Production
    ├── API: [reference URL]
    ├── Bundle ID: com.myorg.myapp
    └── Logging: error only
```

### Android Environment via Build Variants

```kotlin
// app/build.gradle.kts
android {
    buildTypes {
        debug {
            applicationIdSuffix = ".dev"
            resValue("string", "app_name", "MyApp DEV")
            buildConfigField("String", "API_BASE_URL", "\"[reference URL]"")
            buildConfigField("Boolean", "ENABLE_LOGGING", "true")
        }
        create("staging") {
            initWith(getByName("debug"))
            applicationIdSuffix = ".staging"
            resValue("string", "app_name", "MyApp STG")
            buildConfigField("String", "API_BASE_URL", "\"[reference URL]"")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            resValue("string", "app_name", "MyApp")
            buildConfigField("String", "API_BASE_URL", "\"[reference URL]"")
            buildConfigField("Boolean", "ENABLE_LOGGING", "false")
        }
    }
}
```

## Automated Testing in CI

```
Test Execution in CI:
├── Unit tests (every PR, every push)
│   ├── iOS: scan (xcodebuild test)
│   ├── Android: ./gradlew testDebugUnitTest
│   └── Target: < 3 minutes
│
├── Integration tests (every PR)
│   ├── API mocks with recorded responses
│   └── Target: < 5 minutes
│
├── UI tests (merge to main, nightly)
│   ├── iOS: XCUITest
│   ├── Android: Espresso or Compose UI tests
│   └── Target: < 15 minutes for critical paths
│
└── Screenshot tests (merge to main)
    ├── iOS: swift-snapshot-testing
    ├── Android: Paparazzi or Roborazzi
    └── Fail if unexpected visual changes detected
```

## Release Management

### Staged Rollout Workflow

```
Release Pipeline:
1. Merge to main triggers build
2. Automated tests pass
3. Build uploaded to:
   ├── iOS: TestFlight (internal group auto-distributed)
   └── Android: Google Play internal track
4. QA validates on TestFlight / internal track
5. Manual promotion:
   ├── iOS: Submit for App Store Review
   └── Android: Promote internal → production (10% rollout)
6. Monitor crash rate and metrics for 24 hours
7. If stable:
   ├── iOS: Release (automatic after review approval)
   └── Android: Increase rollout → 50% → 100%
8. If issues detected:
   ├── iOS: Reject pending release, hotfix
   └── Android: Halt rollout, push hotfix to internal
```

## Production Checklist

- [ ] Fastlane configured for both platforms with test, beta, and release lanes
- [ ] Code signing managed via Fastlane Match (iOS) and CI-stored keystore (Android)
- [ ] CI pipeline runs unit tests on every PR
- [ ] TestFlight/internal track deployment automated on merge to main
- [ ] Build numbers auto-increment from CI build counter
- [ ] Separate build variants for dev, staging, and production
- [ ] Secrets stored in CI environment variables, never in source control
- [ ] Staged rollout configured for production releases (Android)
- [ ] Slack/Teams notifications for build success and failure
- [ ] Screenshot and snapshot tests run before release builds
- [ ] Release notes auto-generated from git commit history
- [ ] Rollback procedure documented and tested

## When to Use

**Use this skill when:**
- Designing or implementing mobile cicd solutions
- Reviewing or improving existing mobile cicd approaches
- Making architectural or implementation decisions about mobile cicd
- Learning mobile cicd patterns and best practices
- Troubleshooting mobile cicd-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Mobile Cicd Analysis

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

**Input:** "Help me implement mobile cicd for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended mobile cicd approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When mobile cicd must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
