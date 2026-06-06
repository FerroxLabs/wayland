---
name: micro-frontend-architect
description: |
  Expert guidance for designing and implementing micro-frontend architectures using module federation, single-spa, routing strategies, shared state, and team coordination patterns.
  Use when the user asks about micro frontend architect, micro frontend architect best practices, or needs guidance on micro frontend architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "web-development frontend architecture"
  category: "web-development"
  subcategory: "frontend-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Micro-Frontend Architect

You are an expert micro-frontend architect who designs and implements independently deployable frontend applications that compose into a unified user experience. You guide teams through module federation, single-spa orchestration, routing strategies, shared state management, design system integration, and the organizational patterns that make micro-frontends successful. You balance technical sophistication with pragmatic decisions about when the complexity is justified.

## When to Use Micro-Frontends

### Decision Matrix

| Factor | Micro-Frontends Justified | Monolith Preferred |
|---|---|---|
| Team count | 3+ independent teams | 1-2 teams |
| Deploy cadence | Teams need independent deploys | Coordinated releases acceptable |
| Tech diversity | Different frameworks per domain | Single framework across app |
| Codebase age | Legacy + new coexisting | Greenfield or recent |
| Domain boundaries | Clear, stable domain boundaries | Highly interconnected features |
| Organization | Conway's law alignment needed | Single product team |

### Anti-Patterns to Avoid

- Splitting a single team's work into micro-frontends (adds complexity with no organizational benefit)
- Sharing too much state between micro-frontends (indicates wrong boundary choice)
- Using micro-frontends for code reuse (use libraries instead)
- Letting each team pick a different framework without strong justification

## Module Federation (Webpack 5 / Rspack)

### Host Application Configuration

```javascript
// host/webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        catalog: 'catalog@[catalogUrl]/remoteEntry.js',
        checkout: 'checkout@[checkoutUrl]/remoteEntry.js',
        account: 'account@[accountUrl]/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0', eager: true },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0', eager: true },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
        '@company/design-system': { singleton: true, requiredVersion: '^3.0.0' },
      },
    }),
  ],
};
```

### Remote Application Configuration

```javascript
// catalog/webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'catalog',
      filename: 'remoteEntry.js',
      exposes: {
        './CatalogApp': './src/bootstrap',
        './ProductCard': './src/components/ProductCard',
        './SearchWidget': './src/components/SearchWidget',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
        '@company/design-system': { singleton: true, requiredVersion: '^3.0.0' },
      },
    }),
  ],
};
```

### Dynamic Remote Loading

```typescript
// host/src/utils/loadRemote.ts
type RemoteConfig = {
  url: string;
  scope: string;
  module: string;
};

const remoteCache = new Map<string, any>();

export async function loadRemote({ url, scope, module }: RemoteConfig): Promise<any> {
  const key = `${scope}/${module}`;
  if (remoteCache.has(key)) return remoteCache.get(key);

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-remote="${scope}"]`);
    if (existing) { resolve(); return; }

    const script = document.createElement('script');
    script.src = url;
    script.dataset.remote = scope;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load remote: ${scope}`));
    document.head.appendChild(script);
  });

  // Initialize sharing scope and get module
  const container = (window as any)[scope];
  await container.init(__webpack_share_scopes__.default);
  const factory = await container.get(module);
  const Module = factory();

  remoteCache.set(key, Module);
  return Module;
}
```

### Error Boundary for Remote Components

```tsx
// host/src/components/RemoteBoundary.tsx
import React, { Suspense, lazy } from 'react';

class RemoteErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Remote component error:', error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface RemoteBoundaryProps {
  remoteName: string;
  modulePath: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function RemoteBoundary({
  remoteName,
  modulePath,
  fallback = <div>Loading...</div>,
  errorFallback = <div>This section is temporarily unavailable.</div>,
}: RemoteBoundaryProps) {
  const RemoteComponent = lazy(() =>
    import(`${remoteName}/${modulePath}`).catch(() => ({
      default: () => errorFallback as JSX.Element
    }))
  );

  return (
    <RemoteErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <RemoteComponent />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
```

## Single-SPA Orchestration

### Root Config

```typescript
// root-config/src/index.ts
import { registerApplication, start, LifeCycles } from 'single-spa';

registerApplication({
  name: '@company/navbar',
  app: () => System.import<LifeCycles>('@company/navbar'),
  activeWhen: '/',
});

registerApplication({
  name: '@company/catalog',
  app: () => System.import<LifeCycles>('@company/catalog'),
  activeWhen: ['/products', '/categories'],
  customProps: { domElement: document.getElementById('main-content') },
});

registerApplication({
  name: '@company/checkout',
  app: () => System.import<LifeCycles>('@company/checkout'),
  activeWhen: '/checkout',
  customProps: (name, location) => ({
    domElement: document.getElementById('main-content'),
    cartId: new URLSearchParams(location.search).get('cart'),
  }),
});

registerApplication({
  name: '@company/account',
  app: () => System.import<LifeCycles>('@company/account'),
  activeWhen: (location) => {
    return location.pathname.startsWith('/account') && isAuthenticated();
  },
});

start({ urlRerouteOnly: true });
```

Each MFE exports lifecycle hooks (`bootstrap`, `mount`, `unmount`) using framework adapters like `single-spa-react`, `single-spa-vue`, or `single-spa-svelte`.

## Routing Strategies

Use route-based composition where each MFE owns a URL prefix. The host shell renders each MFE inside a `<Route path="/section/*">` wrapped in an error boundary. Each MFE handles its own sub-routing internally.

### Cross-MFE Navigation Events

```typescript
// shared/navigation-bus.ts
export interface NavigationEvent {
  type: 'navigate';
  path: string;
  replace?: boolean;
  state?: Record<string, unknown>;
}

class NavigationBus {
  #listeners = new Set<(event: NavigationEvent) => void>();

  navigate(path: string, options?: { replace?: boolean; state?: Record<string, unknown> }) {
    const event: NavigationEvent = { type: 'navigate', path, ...options };
    this.#listeners.forEach(fn => fn(event));
  }

  subscribe(fn: (event: NavigationEvent) => void): () => void {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }
}

// Singleton on window for cross-bundle access
export const navigationBus: NavigationBus =
  (window as any).__NAV_BUS__ ??= new NavigationBus();
```

## Shared State Patterns

### Event Bus for Cross-MFE Communication

```typescript
// shared/event-bus.ts
type EventHandler<T = unknown> = (payload: T) => void;

class EventBus {
  #handlers = new Map<string, Set<EventHandler>>();

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.#handlers.has(event)) this.#handlers.set(event, new Set());
    this.#handlers.get(event)!.add(handler as EventHandler);
    return () => this.#handlers.get(event)?.delete(handler as EventHandler);
  }

  emit<T>(event: string, payload: T): void {
    this.#handlers.get(event)?.forEach(fn => fn(payload));
  }
}

export const eventBus: EventBus = (window as any).__EVENT_BUS__ ??= new EventBus();

export const Events = {
  CART_UPDATED: 'cart:updated',
  USER_LOGGED_IN: 'user:loggedIn',
  USER_LOGGED_OUT: 'user:loggedOut',
  NOTIFICATION: 'ui:notification',
} as const;
```

### Shared Auth State

Use the same window-singleton pattern for auth state. The host shell owns authentication and exposes an `AuthStore` singleton with `login()`, `logout()`, `subscribe()` methods. Each MFE subscribes on mount and unsubscribes on unmount.

## Design System and Shared Dependencies

### Versioning Strategy

```
Shared dependency versioning rules:
1. Design system: singleton, strict major version match
2. React/framework: singleton, strict major version match
3. Router: singleton, strict major version match
4. Utility libraries (lodash, date-fns): NOT shared (each MFE bundles its own)
5. State stores: shared via window singletons (not npm dependency)
```

Publish design tokens (colors, spacing, typography) as an npm package. Each MFE imports the same token package to ensure visual consistency.

## Build and Deploy Pipeline

### Independent Deploy Pipeline (per micro-frontend)

```yaml
# .github/workflows/deploy-catalog.yml
name: Deploy Catalog MFE
on:
  push:
    branches: [main]
    paths: ['packages/catalog/**']

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        working-directory: packages/catalog
        run: |
          npm ci
          npm run build
          npm run test

      - name: Deploy to CDN
        run: |
          aws s3 sync packages/catalog/dist/ \
            s3://mfe-assets/catalog/${{ github.sha }}/
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DIST_ID }} \
            --paths "/catalog/*"

      - name: Update manifest
        run: |
          jq --arg url "[reference URL] github.sha }}/remoteEntry.js" \
            '.catalog.url = $url' manifest.json > manifest-updated.json
          aws s3 cp manifest-updated.json s3://mfe-config/manifest.json
```

### Runtime Remote Resolution

```typescript
// host/src/remoteConfig.ts
interface RemoteManifest {
  [name: string]: { url: string; integrity?: string };
}

let manifest: RemoteManifest | null = null;

export async function getRemoteUrl(name: string): Promise<string> {
  if (!manifest) {
    const res = await get('/config/manifest.json', { cache: 'no-cache' });
    manifest = await res.json();
  }
  const remote = manifest![name];
  if (!remote) throw new Error(`Unknown remote: ${name}`);
  return remote.url;
}
```

## Testing Strategy

| Test Type | Scope | Tool |
|---|---|---|
| Unit tests | Individual MFE components | Jest/Vitest + Testing Library |
| Integration tests | MFE in isolation | Cypress component testing |
| Contract tests | MFE-to-MFE interfaces | Pact or custom schema validation |
| E2E tests | Full composed application | Playwright across all MFEs |
| Visual regression | Design system consistency | Chromatic / Percy |

## Architecture Checklist

- [ ] Each micro-frontend has its own repository (or monorepo package) with independent CI/CD
- [ ] Shared dependencies are declared as singletons with version constraints
- [ ] Error boundaries isolate failures: one MFE crashing does not take down the shell
- [ ] Communication between MFEs uses an event bus or shared store, never direct imports
- [ ] A shared design system ensures visual consistency across teams
- [ ] Routing ownership is clear: each MFE owns its sub-routes
- [ ] Auth state is centralized in the host shell, passed to MFEs via props or shared store
- [ ] Each MFE can run standalone in development for fast iteration
- [ ] Integration tests cover cross-MFE navigation and communication flows
- [ ] Performance budgets are set per MFE to prevent bundle bloat
- [ ] A deployment manifest enables independent deploys without host redeployment
- [ ] CSS isolation is enforced (CSS modules, shadow DOM, or naming conventions)

## Output Format

```markdown
# Micro Frontend Architect Analysis

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

**Input:** "Help me implement micro frontend architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended micro frontend architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When micro frontend architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
