---
name: react-native-project-setup
description: |
  Guides expert-level react native project setup implementation: javascript and frameworks decision frameworks, production-ready patterns, and concrete templates for react native project setup workflows.
  Use when the user asks about react native project setup, react native project setup configuration, or mobile best practices for react projects.
  Do NOT use when the user needs a different mobile development capability -- check sibling skills in the mobile development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile javascript frameworks"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# React Native Project Setup

## When to Use

**Use this skill when:**
- The user is initializing a new React Native project and needs to choose between Expo managed workflow, Expo bare workflow, or React Native CLI (community template)
- The user is setting up a production-grade React Native app from scratch and needs to configure TypeScript, navigation, state management, testing, and CI/CD from the beginning
- The user is migrating an existing Expo managed workflow project to bare workflow or React Native CLI to access native modules
- The user is configuring a monorepo (Turborepo, Nx, or Yarn workspaces) that will share code between a React Native app and a web app
- The user needs to establish a scalable folder structure, import aliases, environment variable strategy, and code quality tooling before writing any product features
- The user is onboarding a new team onto an existing React Native codebase and needs to document the setup decisions and conventions
- The user needs to configure platform-specific build tooling -- Gradle for Android, Xcode project settings and CocoaPods for iOS

**Do NOT use this skill when:**
- The user needs help with a specific React Native feature or component (navigation implementation, animation, camera -- check sibling skills)
- The user is building a purely web-based React project (use a React web project setup skill)
- The user is asking about native iOS development (Swift/Objective-C) or native Android development (Kotlin/Java) without React Native
- The user needs help debugging a crash or runtime error in an already-configured project (use a debugging skill)
- The user is evaluating whether to use React Native vs. Flutter vs. native -- this skill assumes React Native has already been chosen
- The user is asking about React Native Web or React Native for Windows/macOS without also targeting iOS/Android
- The user needs help publishing or distributing the app (App Store submission, EAS Submit -- use a deployment skill)

---

## Process

### 1. Determine the Bootstrap Strategy

Before writing a single line of code, select the correct project initialization path. This decision affects every other configuration choice.

- **Expo Managed Workflow** -- use `npx create-expo-app@latest MyApp --template expo-template-blank-typescript` when the app has no custom native modules, the team has limited native experience, and OTA (over-the-air) updates via EAS Update are required. Expo SDK 50+ supports the New Architecture.
- **Expo Bare Workflow** -- use `npx create-expo-app@latest MyApp --template bare-minimum` when you need custom native modules but still want access to Expo libraries and EAS Build. This is the recommended middle ground for most production apps in 2024+.
- **React Native CLI** -- use `npx @react-native-community/cli@latest init MyApp --template react-native-template-typescript` when the team is comfortable with native tooling, Xcode, and Gradle, and you need maximum control over the native layer. Note that this template no longer uses Flow -- TypeScript is the default.
- **Monorepo (Turborepo)** -- when sharing code with a web app or multiple mobile apps, initialize with `npx create-turbo@latest` and add a `packages/ui` shared component library and `apps/mobile` React Native app. Use `metro.config.js` with `watchFolders` to resolve packages outside the app root.
- Confirm the target React Native version. Prefer the latest stable (0.74+ as of 2024). Pin the exact version in `package.json` -- do not use `^` for `react-native` or `react` in production projects.
- Record the bootstrap choice in an Architecture Decision Record (ADR) in `docs/adr/001-project-bootstrap.md` before the project is 48 hours old.

### 2. Configure TypeScript Strictly

TypeScript is non-negotiable in production React Native projects. Generic, loose TypeScript provides almost no benefit.

- Set `"strict": true` in `tsconfig.json`. This enables `strictNullChecks`, `strictFunctionTypes`, `noImplicitAny`, and `strictPropertyInitialization` together.
- Add these additional flags beyond `strict`: `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`, `"noImplicitReturns": true`, `"forceConsistentCasingInFileNames": true`.
- Configure path aliases in `tsconfig.json` using `compilerOptions.paths`:
  ```json
  {
    "paths": {
      "@components/*": ["./src/components/*"],
      "@screens/*": ["./src/screens/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@store/*": ["./src/store/*"],
      "@utils/*": ["./src/utils/*"],
      "@assets/*": ["./src/assets/*"],
      "@api/*": ["./src/api/*"]
    }
  }
  ```
- Install `babel-plugin-module-resolver` and mirror the same aliases in `babel.config.js`. Without this, Metro will resolve the TypeScript types but Node/Babel will fail at runtime.
- Install `@tsconfig/react-native` as the base: `"extends": "@tsconfig/react-native/tsconfig.json"`. Then override with the strict additions above.
- Run `npx tsc --noEmit` in CI on every PR. A TypeScript check that only runs locally is a TypeScript check that will be skipped under deadline pressure.

### 3. Establish Code Quality Tooling

A consistent codebase requires automated enforcement, not conventions in a README.

- **ESLint:** Install `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-react`, `eslint-plugin-react-native`, `eslint-plugin-react-hooks`, `eslint-plugin-import`, and `eslint-plugin-jest`. Use `@react-native/eslint-config` as the base for React Native CLI projects or `eslint-config-expo` for Expo projects.
- Add `eslint-plugin-import` with `import/order` rule configured to enforce: `builtin` -> `external` -> `internal` -> `parent` -> `sibling` -> `index`. Set `"newlines-between": "always"`.
- **Prettier:** Use a single `.prettierrc` with `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`, `bracketSpacing: true`. Integrate with ESLint using `eslint-config-prettier` (not `eslint-plugin-prettier` -- it creates noisy diffs in large files).
- **Husky + lint-staged:** Install `husky` and `lint-staged`. Configure `pre-commit` to run `lint-staged` against staged files only -- running full lint on commit is too slow. Configure `commit-msg` to enforce Conventional Commits format using `commitlint`.
- **lint-staged config:**
  ```json
  {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
  ```
- Run full ESLint (not lint-staged) in CI. The pre-commit hook catches issues during development; CI catches anything that slipped through.
- Set up `@commitlint/config-conventional` -- Conventional Commits enable automated changelog generation and semantic versioning via `semantic-release` or `standard-version`.

### 4. Design the Folder Structure

A feature-based folder structure scales to 50+ screens without becoming unnavigable. Avoid a flat `components/` folder that becomes a dumping ground.

```
src/
├── api/              # API client, endpoint definitions, interceptors
│   ├── client.ts     # Axios or fetch wrapper with auth headers
│   └── endpoints/    # One file per resource: users.ts, orders.ts
├── assets/           # Images, fonts, SVGs -- referenced via @assets alias
├── components/       # Shared, reusable, presentational only
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts  # Re-export for clean imports
│   └── Text/
├── hooks/            # Shared custom hooks
├── navigation/       # React Navigation setup, types, linking config
│   ├── RootNavigator.tsx
│   ├── types.ts      # NavigatorParamList types
│   └── linking.ts    # Deep link configuration
├── screens/          # Feature-based, co-located with screen-specific code
│   └── Auth/
│       ├── LoginScreen.tsx
│       ├── LoginScreen.test.tsx
│       └── useLoginForm.ts  # Screen-specific hook
├── store/            # Global state (Zustand slices or Redux slices)
├── theme/            # Colors, spacing, typography tokens
│   ├── colors.ts
│   ├── spacing.ts
│   └── index.ts
└── utils/            # Pure utility functions with no side effects
```

- Co-locate tests with the code they test. `Button.test.tsx` lives next to `Button.tsx`. Do not create a separate `__tests__/` directory at the root -- it breaks the connection between implementation and test.
- Every folder with multiple files gets an `index.ts` barrel file. The barrel file re-exports publicly accessible members. This keeps imports clean: `import { Button } from '@components/Button'` instead of `import { Button } from '@components/Button/Button'`.
- The `components/` directory is for components used in 3+ screens. Components used in only one screen live in that screen's folder. Enforce this in code review.

### 5. Configure Navigation

React Navigation 6 (or 7 when stable) is the production standard. Configure it once, correctly.

- Install: `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`.
- Enable `react-native-screens`: call `enableScreens()` from `react-native-screens` at the top of `index.js` (or `App.tsx` before any navigator renders). This replaces JavaScript Views with native UIViewController/Fragment containers -- critical for performance.
- Define a single `navigation/types.ts` file with the full type tree:
  ```typescript
  export type RootStackParamList = {
    Home: undefined;
    Profile: { userId: string };
    Settings: undefined;
  };

  export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: { email?: string };
  };
  ```
- Use `useNavigation<NativeStackNavigationProp<RootStackParamList>>()` in every screen. Never call `useNavigation()` without the generic type argument -- you lose all type safety on route params.
- Configure `initialRouteName` explicitly. Do not rely on the default (first defined route) -- it creates invisible coupling between declaration order and behavior.
- Configure deep linking in `linking.ts` and pass it to `NavigationContainer`. Test deep links on physical devices during initial setup, not at the end of the project. Deep link issues in Xcode entitlements and `AndroidManifest.xml` are far easier to fix early.
- For tab navigation, install `@react-navigation/bottom-tabs`. Configure `screenOptions` at the navigator level, not per-screen, to keep the tab bar consistent.

### 6. Set Up State Management

Choose the right tool for the state complexity. Over-engineering state management is the most common source of unnecessary complexity in React Native projects.

- **Local state (useState, useReducer):** Use for UI state that does not leave the component -- form inputs, modal visibility, tab selection. Do not lift this to global state.
- **React Query (TanStack Query):** Install `@tanstack/react-query` for all server state. This handles loading, error, caching, background refetching, and optimistic updates. Configure a `QueryClient` with `defaultOptions`: `staleTime: 5 * 60 * 1000` (5 minutes), `retry: 2`, `gcTime: 10 * 60 * 1000`. Server state managed with React Query eliminates 60-70% of the use cases people incorrectly solve with global state.
- **Zustand:** Use for global client state -- auth user session, theme preference, offline queue, app-wide UI flags. Install `zustand`. Create separate slices with `create<SliceType>()`. Do not create a single massive store. Typical production app needs 2-4 Zustand slices.
- **Redux Toolkit:** Only introduce when the team already knows Redux, the state logic is highly complex with many interdependencies, or you need Redux DevTools for time-travel debugging. RTK adds meaningful boilerplate overhead for simple apps.
- **MMKV:** Replace `AsyncStorage` with `react-native-mmkv` for persisted key-value storage. MMKV is synchronous and ~10x faster than AsyncStorage for reads. Use it for auth tokens, user preferences, and persisting Zustand state.
- Configure Zustand persistence with `zustand/middleware` `persist` middleware backed by MMKV:
  ```typescript
  import { create } from 'zustand';
  import { persist, createJSONStorage } from 'zustand/middleware';
  import { MMKV } from 'react-native-mmkv';

  const storage = new MMKV();
  const mmkvStorage = {
    getItem: (key: string) => storage.getString(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  };
  ```

### 7. Configure the Testing Stack

Testing must be configured before any features are written. Adding tests to an untestable codebase is 10x harder than building testability in from the start.

- **Jest:** Use the Jest config that ships with React Native CLI or Expo. Set `preset: 'react-native'` or `preset: 'jest-expo'`. Configure `transformIgnorePatterns` to include any native modules that ship ES modules: many React Navigation packages and community libraries require explicit transforms.
- **React Native Testing Library:** Install `@testing-library/react-native` (not Enzyme -- it is deprecated for React Native). This is the standard for component testing. Use `renderHook` for custom hook testing.
- **Coverage thresholds:** Set minimum thresholds in Jest config: `global: { branches: 70, functions: 80, lines: 80, statements: 80 }`. These thresholds are realistic for a production app. 100% coverage is a vanity metric that incentivizes testing implementation details.
- **MSW (Mock Service Worker):** Install `msw` for API mocking in tests. Define handlers in `src/api/__mocks__/handlers.ts`. Share handlers between Jest tests and Storybook. This eliminates the `jest.mock('axios')` antipattern that couples tests to the HTTP library.
- **Detox (E2E):** Install and configure Detox for critical user journey tests. Configure two environments in `.detoxrc.js`: `ios.sim.debug` for development and `ios.sim.release` for CI. E2E tests run on every merge to main, not on every PR (too slow).
- Configure Jest `moduleNameMapper` to resolve path aliases matching `tsconfig.json` paths -- tests will fail with "Cannot find module '@components/Button'" without this.

### 8. Configure Environment Variables and Secrets

Never hardcode API keys, base URLs, or environment-specific configuration. This is a security and operational requirement, not a preference.

- Install `react-native-config` (for React Native CLI) or use `expo-constants` with `app.config.ts` (for Expo). Do not use `process.env` directly in React Native -- it does not work the same as in Node.js without specific Metro configuration.
- Create `.env`, `.env.development`, `.env.staging`, and `.env.production` files. Add all `.env.*` files to `.gitignore` immediately. Commit `.env.example` with placeholder values.
- For Expo: use `app.config.ts` (not `app.json`) to read `process.env` at build time and inject into `extra`:
  ```typescript
  export default ({ config }) => ({
    ...config,
    extra: {
      apiUrl: process.env.API_URL,
      sentryDsn: process.env.SENTRY_DSN,
    },
  });
  ```
- Use `expo-constants` to access `Constants.expoConfig?.extra?.apiUrl` at runtime. Type the extra object with a TypeScript interface.
- Store secrets (API keys for third-party SDKs) in EAS Secrets (for Expo) or GitHub Actions / CI environment variables. Never store secrets in the repository, even in encrypted files.
- For React Native CLI: configure `react-native-config` and reference `Config.API_URL` in code. Configure `build.gradle` to read `.env` file during the build.

---

## Output Format

When completing a React Native project setup, produce the following artifacts:

```
## React Native Project Setup Summary

### Project Configuration
| Attribute              | Decision                              | Rationale                              |
|------------------------|---------------------------------------|----------------------------------------|
| Bootstrap strategy     | Expo Bare / RN CLI / Expo Managed     | [Team capability, native module needs] |
| React Native version   | 0.74.x (pinned, no caret)             | Stability, New Architecture support    |
| TypeScript             | strict + noUncheckedIndexedAccess     | Maximum type safety                    |
| Navigation             | React Navigation 6 + native-stack     | Performance-native screens             |
| Server state           | TanStack Query 5                      | Caching, background sync               |
| Client state           | Zustand 4                             | Lightweight, no boilerplate            |
| Persistent storage     | react-native-mmkv                     | Synchronous, 10x faster than AsyncStorage |
| Testing (unit)         | Jest + React Native Testing Library   | Community standard                     |
| Testing (E2E)          | Detox                                 | React Native-native E2E                |
| CI/CD                  | GitHub Actions + EAS Build            | Managed native builds                  |
| Error monitoring       | Sentry (react-native-sentry)          | Crash symbolication, breadcrumbs       |

### Folder Structure
[Full directory tree as defined in Step 4]

### TypeScript Configuration
[Full tsconfig.json contents]

### Path Aliases
[Full babel.config.js and tsconfig.json paths sections]

### Environment Setup
[.env.example file contents]

### Initial Scripts (package.json)
{
  "scripts": {
    "start": "expo start / react-native start",
    "android": "expo run:android / react-native run-android",
    "ios": "expo run:ios / react-native run-ios",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:e2e": "detox test --configuration ios.sim.release",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "validate": "yarn type-check && yarn lint && yarn test"
  }
}

### ADR Index
- ADR-001: Project bootstrap strategy (Expo Bare / RN CLI)
- ADR-002: State management selection (Zustand + TanStack Query)
- ADR-003: Navigation library selection
- ADR-004: Storage strategy (MMKV over AsyncStorage)
- ADR-005: Monorepo vs. standalone (if applicable)

### Setup Checklist
[ ] Project initialized with correct template
[ ] TypeScript strict mode configured
[ ] Path aliases configured in tsconfig and babel
[ ] ESLint + Prettier configured
[ ] Husky + lint-staged + commitlint configured
[ ] React Navigation installed with native-stack and type definitions
[ ] react-native-screens enableScreens() called in index.js
[ ] TanStack Query QueryClient configured
[ ] Zustand slices created for auth + app state
[ ] MMKV installed and Zustand persistence configured
[ ] .env files created, .gitignore updated, .env.example committed
[ ] Jest configured with coverage thresholds and alias mapping
[ ] MSW handlers defined for API mocking
[ ] Sentry initialized (dsn from environment variable)
[ ] CI pipeline with lint, type-check, test, and build jobs
[ ] First ADR documents bootstrap strategy decision
```

---

## Rules

1. **Never use `^` (caret) for `react`, `react-native`, or `react-native-screens` in `package.json`.** These packages have breaking changes between minor versions in practice. Pin exact versions: `"react-native": "0.74.2"`. Use `~` for patch-level flexibility if absolutely required, never `^`.

2. **Never call `useNavigation()` without the generic type parameter.** Untyped navigation calls produce `any` types that cascade through the codebase. Every call must be `useNavigation<NativeStackNavigationProp<RootStackParamList, 'ScreenName'>>()` or use a typed wrapper hook.

3. **Never store auth tokens in AsyncStorage.** AsyncStorage is unencrypted. Use `react-native-keychain` for sensitive credentials (JWT refresh tokens, OAuth tokens). MMKV for non-sensitive persistent state. Keychain/Keystore for anything security-critical.

4. **Never import from `react-native` and a community library that re-exports the same component.** Choose one source of truth. Common mistake: importing `Text` from `react-native` in some files and from a UI library in others creates inconsistent styling.

5. **Always call `enableScreens()` from `react-native-screens` before the first navigator renders.** Missing this call silently falls back to JavaScript views instead of native containers. Performance degrades 30-50% on complex navigators. The call must be in `index.js`, not `App.tsx` -- it must run before React renders anything.

6. **Never add a third-party library without checking its New Architecture (Fabric/TurboModules) compatibility.** As of React Native 0.74, the New Architecture is enabled by default in new projects. Libraries without New Architecture support require setting `newArchEnabled=false` in `gradle.properties` and `RCT_NEW_ARCH_ENABLED=0` in the Podfile, which defeats the performance gains. Check `reactnative.directory` for compatibility status before installing.

7. **Never define navigation params as `any` or `object`.** Every screen that accepts params must have a typed entry in the navigator's `ParamList`. Use `undefined` for screens with no params. Use `zod` to validate deep link params at the navigation boundary -- deep links are untrusted user input.

8. **Always configure Metro's `resolver.unstable_enablePackageExports` for monorepos.** In Turborepo / Yarn workspaces setups, Metro does not resolve `exports` field in `package.json` by default. Without this, imports from shared packages silently resolve to the wrong entry point and produce cryptic "module not found" errors in production builds.

9. **Never use `console.log` for error tracking in production.** Configure Sentry from day one. `console.log` statements are stripped in some build configurations and are invisible in crash reports. Initialize `Sentry.init()` with `dsn` from environment variables, `tracesSampleRate: 0.2` (not 1.0 in production -- it generates excessive load), and `environment: process.env.APP_ENV`.

10. **Always configure `android/gradle.properties` with these performance settings from project initialization:** `org.gradle.jvmargs=-Xmx4096m`, `org.gradle.parallel=true`, `org.gradle.configureondemand=true`, `android.enableR8.fullMode=true`. Cold Gradle builds without these settings take 8-15 minutes on CI. With them, incremental builds are 3-5 minutes. Fix this at project start, not when the team is blocked waiting for CI.

---

## Edge Cases

### Monorepo with Shared Code Between Web and Mobile

When a React Native app lives in a Turborepo or Yarn workspaces monorepo alongside a Next.js web app:

- Metro does not support symlinks or files outside its `projectRoot` by default. Configure `metro.config.js` with `watchFolders: [path.resolve(__dirname, '../../packages')]` to include shared packages.
- Set `resolver.nodeModulesPaths` to include the root `node_modules` so Metro finds packages installed at the workspace root.
- Shared UI components must not import any web-specific or native-specific modules directly. Use platform-specific file extensions (`.native.tsx` and `.web.tsx`) for platform-divergent implementations. Metro and webpack both respect this convention.
- The shared package's `package.json` must not have `"main"` pointing to a built file during development -- point it to the TypeScript source and rely on `babel-plugin-module-resolver` to transpile. This avoids a "stale build" class of bugs where a change in the package is not reflected in the app.
- Configure `babel.config.js` in the React Native app to transform the shared package by adding it to `additionalModuleDirectories` rather than to `transformIgnorePatterns` as an exclusion.

### Upgrading React Native Mid-Project

Major React Native upgrades (e.g., 0.72 to 0.74) cannot be done with `npm update`:

- Use the React Native Upgrade Helper tool (upgrade-helper.dev) to generate a diff between the template versions. Apply the diff manually -- do not regenerate the project from scratch.
- The most error-prone files are: `android/build.gradle`, `android/app/build.gradle`, `ios/Podfile`, and `android/gradle.properties`. These have version-specific dependencies that must all be updated in sync.
- Run `pod install --repo-update` after every iOS-affecting upgrade -- simply running `pod install` does not update the CocoaPods spec repository and may resolve stale versions.
- After upgrade, audit every native dependency with `npx react-native-doctor` and check each library's changelog for breaking changes specific to the new RN version.
- Test on both a fresh simulator/emulator and a physical device after upgrade. Simulators may pass while physical devices fail due to hardware-specific code paths in native modules.

### New Architecture (Fabric + TurboModules) Compatibility

New projects created with React Native 0.74+ have the New Architecture enabled by default:

- Run `npx react-native-doctor` to identify incompatible libraries immediately. Address these before writing any product code -- adding 30 incompatible libraries and then resolving them is far harder than handling them at project start.
- Libraries that use the legacy `NativeModules` API still work under the New Architecture via interoperability layers, but they incur a JSI bridge penalty. Prefer libraries that implement TurboModules natively.
- If a critical library is incompatible and has no alternative, disable the New Architecture selectively: set `newArchEnabled=false` in `android/gradle.properties` and `ENV['RCT_NEW_ARCH_ENABLED'] = '0'` in `ios/Podfile`. Document this decision in an ADR with the library name, issue link, and re-evaluation date.
- `react-native-reanimated` 3+ and `react-native-gesture-handler` 2+ are fully New Architecture compatible. Use these versions -- older versions will fail silently or crash on Fabric.

### Enterprise / MDM-Managed Devices

When building for corporate deployment on MDM-managed devices (Jamf, Intune, MobileIron):

- Code-push / OTA updates may be blocked by MDM policy. Confirm with the enterprise IT team before choosing EAS Update or CodePush as a deployment strategy. If OTA is blocked, every update requires a full store submission or MDM re-deployment.
- App Transport Security (ATS) exceptions in `Info.plist` must be documented and approved by enterprise security. Blanket ATS disabling (`NSAllowsArbitraryLoads: true`) will be rejected in enterprise security reviews.
- Certificate pinning is often required in enterprise apps. Install `react-native-ssl-pinning` and configure it with the server's certificate hash (not the certificate itself -- certificates rotate, hashes of public keys do not). Store the expected hash in `react-native-config` environment variables.
- If deploying via MDM without App Store, configure `CFBundleIdentifier` and provisioning profiles for enterprise distribution (Apple Developer Enterprise Program). This is a separate provisioning workflow from standard App Store distribution.

### Offline-First Architecture

When the app must function without network connectivity:

- `TanStack Query` provides `networkMode: 'offlineFirst'` and `persistQueryClient` via `@tanstack/query-async-storage-persister`. Configure query persistence to MMKV-backed storage. This caches query responses and serves them when offline.
- For write operations (mutations) that must succeed eventually, implement an offline queue. Zustand + MMKV can store a queue of pending mutations. On network reconnect (detected via `@react-native-community/netinfo`), drain the queue and replay mutations.
- Do not rely on `fetch` error handling alone to detect offline state. Network state detection must be proactive: subscribe to `NetInfo.addEventListener` and update a global `isOnline` Zustand store. Components should read this store to show offline indicators.
- SQLite via `expo-sqlite` (or `react-native-sqlite-storage` for bare RN) is appropriate when the offline dataset exceeds what can be reasonably cached in JSON key-value storage -- think product catalogs, contact lists, or anything with 1000+ records. Use SQLite with a typed ORM layer (`drizzle-orm` has an `expo-sqlite` adapter).
- Design the sync strategy before writing any code: "last write wins," "server authoritative," or "conflict resolution UI." This is a product decision, not a technical one. Get it documented in an ADR before implementation.

### Performance-Sensitive App (60fps Animations, Complex Lists)

When the app requires sustained 60fps or 120fps performance:

- Install `react-native-reanimated` 3+ for all animations. Never use the built-in `Animated` API for complex animations -- it runs on the JS thread and drops frames during JavaScript execution. Reanimated worklets run on the UI thread.
- Use `FlashList` from `@shopify/flash-list` instead of `FlatList` for lists with more than ~20 items. FlashList achieves 5-10x better performance by recycling cell components. Configure `estimatedItemSize` as accurately as possible -- the default estimate causes layout jank.
- Enable `react-native-fast-image` for all remote images. The built-in `Image` component does not cache aggressively and re-decodes images on every render. Fast Image uses SDWebImage (iOS) and Glide (Android) for progressive caching.
- Use `useCallback` and `useMemo` selectively, not universally. Memoizing every function and value adds overhead from the comparison itself. Profile with Flipper's React DevTools and the Hermes profiler before optimizing. Premature memoization is a common source of subtle bugs.
- Enable Hermes as the JavaScript engine -- it is enabled by default in React Native 0.70+. Hermes provides bytecode precompilation, which reduces startup time by 30-50% compared to JSC.

---

## Example

**Input:** "I need to set up a new React Native app from scratch. It's a B2B mobile app for field service technicians. The team has 4 engineers -- 2 have React web experience but no React Native experience, and 2 are senior React Native engineers. The app needs to work offline, has complex forms, and needs to display lists of 500-1000 work orders. We're deploying to iOS and Android through the App Store and Google Play. The company uses GitHub and has an AWS backend."

**Output:**

### Project Configuration Decision

Given the team mix (2 web-experienced, 2 senior RN engineers), offline requirement, complex forms, and large lists, the recommended configuration is:

**Bootstrap: Expo Bare Workflow**

The 2 web-experienced engineers can contribute immediately using Expo tooling without Xcode/Gradle deep knowledge. The 2 senior RN engineers retain full native module access via the bare workflow. EAS Build handles the native compilation in CI, removing the local Xcode/Android SDK dependency for web-focused team members.

```bash
npx create-expo-app@latest FieldServiceApp --template bare-minimum
cd FieldServiceApp
npx expo install expo-updates # For OTA updates
```

---

### Full tsconfig.json

```json
{
  "extends": "@tsconfig/react-native/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@components/*": ["./src/components/*"],
      "@screens/*": ["./src/screens/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@store/*": ["./src/store/*"],
      "@utils/*": ["./src/utils/*"],
      "@assets/*": ["./src/assets/*"],
      "@api/*": ["./src/api/*"],
      "@navigation/*": ["./src/navigation/*"],
      "@theme/*": ["./src/theme/*"]
    }
  },
  "include": ["src", "index.js", "app.config.ts"]
}
```

---

### babel.config.js

```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@hooks': './src/hooks',
          '@store': './src/store',
          '@utils': './src/utils',
          '@assets': './src/assets',
          '@api': './src/api',
          '@navigation': './src/navigation',
          '@theme': './src/theme',
        },
      },
    ],
    'react-native-reanimated/plugin', // Must be last
  ],
};
```

---

### Key Dependencies to Install

```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack \
  @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# State and server state
npx expo install @tanstack/react-query zustand react-native-mmkv

# Offline and network
npx expo install @react-native-community/netinfo expo-sqlite

# Forms (complex forms requirement)
yarn add react-hook-form @hookform/resolvers zod

# Lists (500-1000 work orders requirement)
npx expo install @shopify/flash-list

# Animations
npx expo install react-native-reanimated react-native-gesture-handler

# Images
npx expo install expo-image  # Expo's fast-image equivalent for bare workflow

# Error monitoring
npx expo install @sentry/react-native

# Storage
npx expo install react-native-mmkv react-native-keychain
```

---

### Folder Structure for Field Service App

```
src/
├── api/
│   ├── client.ts           # Axios with auth interceptor + retry logic
│   ├── queryClient.ts      # TanStack QueryClient singleton
│   └── endpoints/
│       ├── workOrders.ts   # GET /work-orders, GET /work-orders/:id, PATCH
│       ├── technicians.ts  # GET /technicians/me
│       └── attachments.ts  # POST /attachments (photo uploads)
├── assets/
│   ├── fonts/
│   └── images/
├── components/
│   ├── Button/
│   ├── Card/
│   ├── FormField/          # react-hook-form Controller wrapper
│   ├── OfflineBanner/      # Shows when isOnline === false
│   ├── StatusBadge/        # Work order status indicator
│   └── WorkOrderCard/      # Used in list and detail views
├── hooks/
│   ├── useNetworkStatus.ts # Wraps NetInfo, updates Zustand
│   ├── useOfflineQueue.ts  # Drain queue on reconnect
│   └── useCurrentUser.ts  # Auth session hook
├── navigation/
│   ├── RootNavigator.tsx
│   ├── AppNavigator.tsx    # Bottom tabs: Work Orders, Profile
│   ├── AuthNavigator.tsx   # Login stack
│   └── types.ts
├── screens/
│   ├── Auth/
│   │   └── LoginScreen.tsx
│   ├── WorkOrders/
│   │   ├── WorkOrderListScreen.tsx
│   │   ├── WorkOrderDetailScreen.tsx
│   │   ├── WorkOrderDetailScreen.test.tsx
│   │   └── useWorkOrderForm.ts
│   └── Profile/
│       └── ProfileScreen.tsx
├── store/
│   ├── authStore.ts        # User session, tokens (MMKV persisted)
│   ├── networkStore.ts     # isOnline: boolean
│   └── offlineQueueStore.ts # Pending mutations queue (MMKV persisted)
├── theme/
│   ├── colors.ts           # Primary blue, status colors (red/yellow/green)
│   ├── spacing.ts          # 4px base unit: xs=4, sm=8, md=16, lg=24, xl=32
│   └── typography.ts       # Font sizes, weights, line heights
└── utils/
    ├── dateUtils.ts        # Format work order timestamps
    ├── validationSchemas.ts # Zod schemas for forms
    └── offlineStorage.ts   # SQLite queries for cached work orders
```

---

### Offline Strategy for Work Orders

```typescript
// src/store/offlineQueueStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'offline-queue' });

interface PendingMutation {
  id: string;
  type: 'UPDATE_WORK_ORDER' | 'ADD_NOTE' | 'UPLOAD_ATTACHMENT';
  payload: unknown;
  createdAt: number;
  retryCount: number;
}

interface OfflineQueueStore {
  queue: PendingMutation[];
  enqueue: (mutation: Omit<PendingMutation, 'id' | 'createdAt' | 'retryCount'>) => void;
  dequeue: (id: string) => void;
  incrementRetry: (id: string) => void;
}

export const useOfflineQueueStore = create<OfflineQueueStore>()(
  persist(
    (set) => ({
      queue: [],
      enqueue: (mutation) =>
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...mutation,
              id: `${Date.now()}-${Math.random()}`,
              createdAt: Date.now(),
              retryCount: 0,
            },
          ],
        })),
      dequeue: (id) =>
        set((state) => ({ queue: state.queue.filter((m) => m.id !== id) })),
      incrementRetry: (id) =>
        set((state) => ({
          queue: state.queue.map((m) =>
            m.id === id ? { ...m, retryCount: m.retryCount + 1 } : m,
          ),
        })),
    }),
    {
      name: 'offline-queue',
      storage: createJSONStorage(() => ({
        getItem: (key) => storage.getString(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      })),
    },
  ),
);
```

---

### FlashList Configuration for Work Orders

```typescript
// src/screens/WorkOrders/WorkOrderListScreen.tsx
import { FlashList } from '@shopify/flash-list';
import { WorkOrderCard } from '@components/WorkOrderCard';
import type { WorkOrder } from '@api/endpoints/workOrders';

// estimatedItemSize: measure a few rendered cards in Flipper layout inspector
// A typical work order card with 3 lines of text + status badge is ~88px
const ESTIMATED_ITEM_SIZE = 88;

export function WorkOrderListScreen() {
  const { data: workOrders, isLoading } = useWorkOrders();

  return (
    <FlashList
      data={workOrders ?? []}
      renderItem={({ item }) => <WorkOrderCard workOrder={item} />}
      estimatedItemSize={ESTIMATED_ITEM_SIZE}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={isLoading ? <LoadingSkeleton /> : <EmptyState />}
    />
  );
}
```

---

### CI/CD Pipeline (.github/workflows/validate.yml)

```yaml
name: Validate

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn type-check
      - run: yarn lint
      - run: yarn test --coverage --ci
      - uses: codecov/codecov-action@v4

  build-android:
    needs: quality
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: yarn install --frozen-lockfile
      - run: eas build --platform android --profile staging --non-interactive
```

---

### ADR-001: Bootstrap Strategy

```markdown
# ADR-001: Expo Bare Workflow for FieldServiceApp

Date: 2024-01-15
Status: Accepted

## Context
Team has 2 web engineers and 2 senior RN engineers. App requires offline SQLite,
camera for photo attachments, and keychain for token storage.

## Decision
Use Expo Bare Workflow initialized with `bare-minimum` template.

## Rationale
- Web engineers use EAS Build; no local Xcode/Gradle setup required
- Senior engineers retain full native module access
- expo-sqlite, expo-image, and react-native-keychain all support bare workflow
- EAS Build provides managed signing and CI/CD for both platforms

## Consequences
- Cannot use Expo Go for development; must use Development Builds (`eas build --profile development`)
- Must run `pod install` after adding native dependencies
- Native code changes require new EAS build (no OTA for native layer)

## Rejected Alternatives
- Managed workflow: blocked by react-native-mmkv and react-native-keychain
- RN CLI: increases onboarding time for web engineers by 2-3 days (Xcode setup)
```

---

### Setup Checklist

```
[x] Project initialized: npx create-expo-app@latest FieldServiceApp --template bare-minimum
[x] React Native version pinned (no caret) in package.json
[x] TypeScript strict mode + noUncheckedIndexedAccess configured
[x] Path aliases in tsconfig.json and babel.config.js (module-resolver)
[x] ESLint + eslint-config-expo + @typescript-eslint configured
[x] Prettier configured (.prettierrc)
[x] Husky + lint-staged + commitlint installed
[x] React Navigation installed: native-stack + bottom-tabs + type definitions
[x] enableScreens() called in index.js before any render
[x] TanStack Query QueryClient configured (staleTime: 5min, retry: 2)
[x] Zustand: authStore, networkStore, offlineQueueStore created
[x] MMKV installed and Zustand persistence configured for auth + offline queue
[x] react-native-keychain installed for token storage
[x] .env, .env.development, .env.staging, .env.production created
[x] All .env.* in .gitignore; .env.example committed
[x] app.config.ts reads process.env and injects into extra
[x] Jest configured with coverage thresholds (70/80/80/80)
[x] transformIgnorePatterns configured for community modules
[x] MSW installed with base handlers for work-orders endpoint
[x] Sentry initialized with DSN from environment variable
[x] FlashList installed (estimatedItemSize measured: 88px)
[x] react-native-reanimated + react-native-gesture-handler installed
[x] SQLite (expo-sqlite) configured for offline work order cache
[x] @react-native-community/netinfo installed
[x] EAS project configured (eas.json with development/staging/production profiles)
[x] GitHub Actions validate.yml pipeline created
[x] ADR-001 committed to docs/adr/
```
