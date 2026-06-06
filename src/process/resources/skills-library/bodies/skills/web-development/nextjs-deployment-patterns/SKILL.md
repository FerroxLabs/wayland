---
name: nextjs-deployment-patterns
description: |
  Guides expert-level next.js deployment patterns implementation: typescript and frameworks decision frameworks, production-ready patterns, and concrete templates for nextjs deployment patterns workflows.
  Use when the user asks about next.js deployment patterns, nextjs deployment patterns configuration, or typescript best practices for next.js projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "typescript frameworks devops cloud"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Next.js Deployment Patterns

## When to Use

**Use this skill when:**
- The user is deciding between Vercel, AWS, Google Cloud, Azure, or self-hosted Kubernetes for deploying a Next.js application and needs a concrete recommendation with trade-offs
- The user is configuring output modes (`standalone`, `export`, `default`) and needs to understand which mode fits their infrastructure constraints
- The user is experiencing cold start latency, function timeout limits, or bundle size issues in a serverless Next.js deployment and needs optimization strategies
- The user needs to set up multi-environment deployments (preview, staging, production) with proper environment variable isolation and branch-based promotion
- The user is migrating from Pages Router to App Router and needs to understand how that change affects deployment configuration, caching headers, and CDN behavior
- The user wants to implement ISR (Incremental Static Regeneration), On-Demand Revalidation, or hybrid rendering strategies and needs to understand the infrastructure requirements for each
- The user is deploying a Next.js app inside a Docker container and needs a production-ready multi-stage Dockerfile with proper standalone output configuration
- The user needs to configure custom cache-control headers, CDN edge caching, or stale-while-revalidate behavior for a Next.js app behind CloudFront, Fastly, or Cloudflare

**Do NOT use this skill when:**
- The user needs help with Next.js routing logic, data fetching patterns, or component architecture -- use the next.js application architecture skill
- The user is asking about general CI/CD pipeline design without a Next.js-specific context -- use the ci-cd pipeline design skill
- The user needs help with database connection pooling or ORM configuration for Next.js API routes -- use the backend database patterns skill
- The user is asking about React Server Components in isolation without deployment implications -- use the react server components skill
- The user needs help debugging a runtime error in their Next.js application code, not the deployment infrastructure
- The user is deploying a different framework (Nuxt, Remix, SvelteKit) -- use the appropriate framework deployment skill
- The user is asking about general Docker or Kubernetes concepts not specific to Next.js output -- use the container orchestration skill

---

## Process

### 1. Determine the Rendering Strategy and Output Mode

Before any infrastructure decision, identify what the application actually needs to serve.

- **Identify page-level rendering requirements:** Catalog each route as SSG (fully static, no per-request data), ISR (static with time-based or on-demand revalidation), SSR (per-request server rendering), or API routes / Route Handlers. A single app can and often should use all four.
- **Map rendering needs to output mode:** If ALL pages are statically exportable with no server-side logic, `output: 'export'` in `next.config.js` produces a pure static site deployable to any CDN or object storage. If the app has SSR, ISR, or API routes, `output: 'standalone'` is the correct choice for containerized deployments. The default output mode is only appropriate for the Vercel platform itself.
- **Check for features incompatible with static export:** `output: 'export'` is incompatible with Image Optimization (requires a server), Internationalized Routing with middleware, API routes, Route Handlers that are not statically generated, and on-demand ISR. Confirm none of these are present before choosing static export.
- **Quantify ISR revalidation windows:** ISR `revalidate` values below 60 seconds create high origin pressure at scale. For data that updates every 30 seconds, prefer SSR with aggressive CDN caching over ISR with a 30-second window. ISR is most cost-effective for revalidation windows of 5 minutes or longer.
- **Document the rendering matrix:** Create a simple table mapping every route pattern to its rendering mode before selecting infrastructure. This prevents surprises where a team deploys to a static host and discovers 20% of routes require a server.

### 2. Select the Deployment Target

Apply this decision tree based on the rendering matrix, team operational capacity, and scale requirements.

- **Vercel (managed platform):** Choose when the team has fewer than 5 engineers, operational overhead must be minimized, the application uses Vercel-specific features (Edge Middleware, Edge Config, Analytics, KV), or time-to-first-deployment matters more than cost optimization. Vercel functions have a 10-second default timeout (extendable to 300 seconds on Pro/Enterprise), 50 MB compressed function payload limit, and cold starts of 50--300ms for Node.js, 0--50ms for Edge Runtime. Monthly cost scales predictably with bandwidth and function invocations.
- **AWS (ECS Fargate + CloudFront, or Lambda + API Gateway):** Choose when the team has DevOps capacity, the application is part of a larger AWS ecosystem, compliance requirements mandate VPC isolation, or cost optimization at scale (>10M requests/month) is a priority. ECS Fargate runs the standalone Next.js server as a long-running container -- no cold starts, predictable latency. Lambda + API Gateway reintroduces cold start complexity but enables true serverless scaling to zero.
- **Google Cloud Run:** Choose when the team is already on GCP, needs automatic scaling to zero, or wants a managed container runtime without Kubernetes complexity. Cloud Run supports the standalone Next.js container directly. Minimum instances can be set to 1 to eliminate cold starts at a predictable base cost.
- **Kubernetes (self-hosted or GKE/EKS/AKS):** Choose when the organization already operates a Kubernetes cluster, multi-tenancy is required, or the application must coexist with internal services. Requires proper Horizontal Pod Autoscaler (HPA) configuration with CPU and memory metrics. Set `minReplicas: 2` for production to ensure zero-downtime deployments.
- **Static CDN (S3 + CloudFront, Cloudflare Pages, Netlify):** Choose only when the rendering matrix confirms `output: 'export'` is viable. Cloudflare Pages supports Cloudflare Workers for API routes via the `@cloudflare/next-on-pages` adapter, but with significant constraints on Node.js API compatibility.
- **Self-hosted Node.js (PM2 or bare):** Acceptable for low-traffic internal tools. Use PM2 with `cluster` mode and `instances: 'max'` to utilize all CPU cores. Not recommended for production internet-facing traffic above 1,000 concurrent users without additional load balancing.

### 3. Configure `next.config.js` for the Target Environment

Every deployment target requires specific Next.js configuration. Misconfiguration here causes silent failures.

- **Enable standalone output for container targets:** Set `output: 'standalone'` in `next.config.js`. This instructs Next.js to trace and copy all required Node.js dependencies into `.next/standalone`, producing a self-contained server in `.next/standalone/server.js` that does not require `node_modules` at runtime.
- **Configure `assetPrefix` and `basePath` for CDN-hosted assets:** When static assets are served from a separate CDN origin (e.g., `https://cdn.example.com`), set `assetPrefix: process.env.NEXT_PUBLIC_CDN_URL`. This rewrites all `/_next/static/` references to the CDN origin. Omitting this is the single most common cause of broken asset loading after a CDN migration.
- **Disable x-powered-by header:** Set `poweredByHeader: false` to avoid leaking Next.js version information. This is a minor security hardening step but costs nothing.
- **Configure `images.domains` or `images.remotePatterns`:** For `next/image` optimization, explicitly allowlist every remote image hostname. Prefer `remotePatterns` over `domains` as it supports wildcard subdomains and path restrictions. Without this, image optimization fails silently and falls back to unoptimized behavior.
- **Set `compress: false` when a reverse proxy handles gzip/brotli:** The Next.js built-in gzip is single-threaded and blocks the event loop. When Nginx, CloudFront, or an ALB handles compression, disable it in Next.js to avoid double compression and CPU waste.
- **Configure `experimental.outputFileTracingRoot`** for monorepo setups: In a monorepo where `next.config.js` is not at the project root, set this to the monorepo root so the file tracer includes shared packages from `packages/` directories in the standalone output.

### 4. Build a Production-Ready Dockerfile

The standalone output format requires a specific Dockerfile structure that most tutorials get wrong.

- **Use a multi-stage build with three stages:** Stage 1 (`deps`) installs production and dev dependencies. Stage 2 (`builder`) runs `next build`. Stage 3 (`runner`) copies only the standalone output, static files, and public assets. This minimizes the final image size from typically 1--2 GB to 150--300 MB.
- **Pin Node.js version:** Use `node:20-alpine` (not `node:latest` or `node:alpine` without a version) to ensure reproducible builds. Alpine-based images reduce the base image size by ~70% compared to Debian-based.
- **Copy files in the correct order for the standalone runner:**
  ```
  COPY --from=builder /app/.next/standalone ./
  COPY --from=builder /app/.next/static ./.next/static
  COPY --from=builder /app/public ./public
  ```
  The `public` directory is not included in standalone output automatically and must be copied separately. Missing this step causes broken favicon, robots.txt, and other public assets.
- **Set `NODE_ENV=production`** in the runner stage. Next.js enables significant optimizations -- including disabling React DevTools, enabling production React builds, and activating internal caches -- only when `NODE_ENV` is exactly the string `production`.
- **Run as a non-root user:** Add `RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs` and `USER nextjs` before the CMD. This is required for SOC 2 compliance and follows container security best practices.
- **Set `PORT` and `HOSTNAME` environment variables:** The standalone server reads `process.env.PORT` (default 3000) and `process.env.HOSTNAME` (default `0.0.0.0`). Explicitly set `ENV HOSTNAME="0.0.0.0"` in the Dockerfile to ensure the server binds to all interfaces inside the container.

### 5. Configure Environment Variables Across Environments

Environment variable mismanagement is the leading cause of production deployment failures.

- **Understand the four categories of Next.js env vars:** (1) Server-only: accessible only in server-side code, set in `.env.local` or platform secrets. (2) `NEXT_PUBLIC_*`: baked into the client bundle at build time -- changing them requires a rebuild. (3) Runtime server vars: passed to the standalone server at container start without requiring a rebuild. (4) Build-time vars used in `next.config.js`: affect the build output itself.
- **Never put secrets in `NEXT_PUBLIC_*` variables.** These values are embedded in the JavaScript bundle and visible to anyone who downloads the page. API keys, database credentials, and signing secrets must never use the `NEXT_PUBLIC_` prefix.
- **For runtime environment variable injection in containers:** When using standalone output, variables passed to the Docker container at runtime (not build time) are available to server-side code. Build the image once and inject environment-specific config at runtime -- do not build separate images per environment.
- **Use `.env.local` for local development, never in version control.** Commit `.env.example` with all required variable names and placeholder descriptions. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler) to populate environment variables in CI/CD pipelines.
- **Validate environment variables at startup:** Use a validation library like `zod` or `envalid` to parse and validate all required environment variables when the server starts. Fail fast with a descriptive error message rather than encountering undefined variables deep in a request handler.

### 6. Configure CDN and Cache Headers

Incorrect cache configuration is the second most common cause of deployment problems.

- **Understand Next.js's built-in cache-control values:** Next.js sets `Cache-Control: public, max-age=31536000, immutable` on `/_next/static/` assets (content-hashed, safe to cache forever). It sets `Cache-Control: no-store, must-revalidate` on pages by default (SSR). ISR pages receive `s-maxage={revalidate}, stale-while-revalidate`.
- **Override cache headers for SSR pages that are safe to cache:** Use `res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')` in Pages Router, or return a `Response` with explicit headers in App Router Route Handlers. Many teams leave SSR pages with `no-store` and wonder why their CDN hit rate is 0%.
- **Configure CloudFront behaviors separately for static assets vs. dynamic routes:** Create a CloudFront behavior for `/_next/static/*` with a long TTL (86400 seconds minimum), a behavior for `/api/*` with TTL=0, and a default behavior for all other routes with a moderate TTL (60 seconds) and forward query strings and cookies as needed for your authentication strategy.
- **Enable Brotli compression at the CDN layer:** Brotli provides 15--25% better compression than gzip on JavaScript bundles. CloudFront, Cloudflare, and most CDNs support Brotli natively. With `compress: false` in `next.config.js`, the CDN handles compression without blocking the Node.js event loop.
- **Implement cache invalidation for on-demand ISR:** The `revalidateTag` and `revalidatePath` functions in App Router (Next.js 13.5+) invalidate the Next.js data cache. When deploying to a self-hosted environment, these functions only invalidate the cache on the specific server instance that receives the request. For multi-instance deployments, use a shared cache store (Redis) configured via the `cacheHandler` option in `next.config.js`, or implement a broadcast invalidation mechanism.

### 7. Implement Health Checks, Graceful Shutdown, and Observability

Production deployments require operational instrumentation that is often skipped until after an incident.

- **Add a health check endpoint:** Create `/api/health` (Pages Router) or `app/api/health/route.ts` (App Router) that returns HTTP 200 with `{ status: 'ok', version: process.env.npm_package_version }`. Configure container orchestrators and load balancers to poll this endpoint every 10--30 seconds with a 5-second timeout and 3 failure threshold before marking unhealthy.
- **Implement graceful shutdown:** The standalone server does not handle `SIGTERM` gracefully by default. Add a `SIGTERM` handler that stops accepting new requests, waits for in-flight requests to complete (with a 30-second maximum), then exits. This prevents dropped requests during rolling deployments.
- **Configure structured logging:** Replace `console.log` with a structured logger like `pino` that outputs JSON. This enables log aggregation platforms (Datadog, Splunk, CloudWatch Logs Insights) to parse and query logs efficiently. Include `requestId`, `route`, `method`, `statusCode`, and `durationMs` in every log entry.
- **Instrument with OpenTelemetry:** Next.js 13.4+ has built-in OpenTelemetry instrumentation via `instrumentation.ts`. Register traces for server components, route handlers, and middleware. Export traces to Honeycomb, Jaeger, or Datadog APM. This is the only way to diagnose slow server components in production without guessing.
- **Set memory and CPU limits for containers:** The Next.js server typically requires 256--512 MB RAM for a small application and 512 MB--2 GB for large applications with many routes. Set container memory limits 20--30% above observed peak usage. Out-of-memory kills are silent by default -- configure alerting on OOMKilled events in Kubernetes or CloudWatch Container Insights.

### 8. Validate and Test the Deployment Pipeline

- **Run `next build` locally before pushing to CI** to catch configuration errors early. The build output summary shows route types, sizes, and whether ISR is configured correctly.
- **Enforce bundle size budgets in CI:** Use `next-bundle-analyzer` or the built-in `ANALYZE=true next build` output to track First Load JS per route. Set a budget of 200 KB for First Load JS (gzipped) on critical routes. Fail the CI pipeline if this threshold is exceeded.
- **Test ISR revalidation in staging:** Trigger a content update, call `revalidatePath` or wait for the revalidation window, and confirm the new content is served. ISR cache is not shared between local dev and production -- this must be tested in an environment that matches production.
- **Verify environment variable availability:** Run a smoke test script that hits every API route and confirms expected response shapes. Missing `NEXT_PUBLIC_*` variables produce `undefined` in client code without throwing errors at build time.
- **Test cold start latency for serverless targets:** For Lambda or Cloud Run deployments, measure cold start latency with a dedicated synthetic monitor. If p99 cold start exceeds 2 seconds, consider provisioned concurrency (Lambda) or minimum instances (Cloud Run).

---

## Output Format

When responding to a user about Next.js deployment patterns, produce the following structured output:

```
## Next.js Deployment Assessment

### Rendering Matrix
| Route Pattern       | Rendering Mode | Revalidation | Notes                          |
|---------------------|----------------|--------------|--------------------------------|
| /                   | SSG / ISR      | 3600s        | Marketing homepage             |
| /dashboard          | SSR            | --           | Requires auth session          |
| /products/[slug]    | ISR            | 300s         | Product catalog                |
| /api/webhooks/*     | API Route      | --           | No caching, POST only          |

### Deployment Target Recommendation
**Recommended:** [Target] -- [2-3 sentence rationale based on rendering matrix and constraints]
**Alternative:** [Alternative target] -- [When to choose this instead]

### Required `next.config.js` Changes
[Specific configuration changes with inline comments explaining why each setting is needed]

### Dockerfile (if containerized)
[Complete multi-stage Dockerfile]

### Environment Variable Checklist
- [ ] Server-only secrets: [list]
- [ ] `NEXT_PUBLIC_*` build-time vars: [list]
- [ ] Runtime vars (no rebuild needed): [list]
- [ ] Validation library configured: yes/no

### CDN / Cache Configuration
[Specific cache-control values per route category]
[CDN behavior configuration for the selected CDN]

### Health Check & Observability
[Health check endpoint implementation]
[Graceful shutdown handler]
[Logging configuration]

### Deployment Checklist
- [ ] `output: 'standalone'` set (if containerized)
- [ ] `assetPrefix` configured (if CDN-hosted assets)
- [ ] `compress: false` set (if CDN handles compression)
- [ ] Non-root user in Dockerfile
- [ ] `NODE_ENV=production` set in container
- [ ] Health check endpoint created and registered with LB/orchestrator
- [ ] SIGTERM handler implemented
- [ ] Bundle size budget passing in CI
- [ ] ISR revalidation tested in staging
- [ ] Cold start latency measured (if serverless)
```

---

## Rules

1. **NEVER recommend Vercel for applications with strict data residency requirements** without confirming that Vercel's edge network and function execution regions can be constrained to the required geographic boundaries. By default, Vercel Edge Functions execute in 50+ regions globally, which may violate GDPR data residency requirements for certain data categories.

2. **NEVER use `output: 'export'` if the application uses `next/image` without a custom loader.** Static export disables the built-in Image Optimization API. Without a custom loader pointing to Cloudinary, imgix, or a similar service, images will be unoptimized and served without resizing, format conversion, or quality adjustment.

3. **NEVER build environment-specific Docker images.** Build once with `output: 'standalone'`, inject environment variables at container runtime. Building separate images per environment (staging-image, prod-image) violates the build-once principle, makes artifact tracing impossible, and creates the risk of deploying an untested staging image to production.

4. **NEVER set `revalidate: 0` as a workaround for stale data in ISR.** A revalidation window of 0 effectively converts ISR into SSR but without the proper headers. Use `export const dynamic = 'force-dynamic'` (App Router) or `export const getServerSideProps` (Pages Router) to explicitly opt into SSR with correct semantics.

5. **NEVER ignore the `.next/standalone` directory structure.** The `server.js` entrypoint in `.next/standalone` expects `public/` and `.next/static/` to be present as siblings in the same directory. Copying only `server.js` without the static assets is a build step error that produces a running server with broken asset loading and is difficult to debug.

6. **ALWAYS set `swcMinify: true`** (Next.js 12/13) or confirm it is the default (Next.js 14+). SWC minification is 17x faster than Terser and produces comparable or smaller output. There is no reason to disable this in production builds.

7. **ALWAYS configure ISR with a shared cache handler for deployments with more than one server instance.** Without a shared cache handler (Redis-backed), each server instance maintains its own in-memory ISR cache. When requests are load-balanced across instances, users see inconsistent content -- some instances serve stale content while others have revalidated. This is one of the most confusing production bugs in Next.js deployments.

8. **NEVER expose the `__NEXT_PRIVATE_STANDALONE_CONFIG` or internal Next.js internals** through the health check endpoint or debug routes. These can leak build IDs, dependency versions, and configuration that aids attackers.

9. **ALWAYS configure readiness probes separately from liveness probes in Kubernetes.** The liveness probe (`/api/health`) should check only that the Node.js event loop is responding. The readiness probe should additionally verify that any required downstream connections (database, cache) are available before the pod receives traffic. Conflating these causes the pod to be killed and restarted during downstream outages instead of simply being removed from the load balancer rotation.

10. **NEVER set `maxDuration` on serverless functions above the platform's billing tier limit without confirming the tier.** On Vercel, the default function timeout is 10 seconds on Hobby, 60 seconds on Pro, and 900 seconds on Enterprise. Setting `export const maxDuration = 300` in a route file on a Hobby plan silently falls back to 10 seconds, causing confusing timeout behavior.

---

## Edge Cases

### Monorepo Deployments (Turborepo, Nx, pnpm Workspaces)

The standalone output file tracer does not cross workspace package boundaries by default. Without intervention, `node_modules` from sibling packages are omitted from the trace and the standalone server crashes at runtime with `MODULE_NOT_FOUND` errors.

Fix: Set `experimental.outputFileTracingRoot` to the monorepo root in `next.config.js`. In the Dockerfile, set the build context to the monorepo root (not the app subdirectory) so the tracer can reach shared packages. Copy `pnpm-workspace.yaml` or the root `package.json` workspaces configuration into the builder stage before running `pnpm install`. With Turborepo, use `turbo prune --scope=@org/web --docker` to generate a pruned workspace that includes only the packages needed by the Next.js app, then build from the pruned output.

### Multi-Region Deployments with ISR

ISR cache is not replicated across regions by default. In a multi-region deployment where the same Next.js app runs in us-east-1 and eu-west-1, each region maintains an independent ISR cache. After calling `revalidatePath('/products/featured')`, only the region that received the revalidation request updates its cache. Users in the other region continue seeing stale content until the revalidation window expires.

Fix: Use a globally replicated cache store. AWS ElastiCache Global Datastore (Redis) or Upstash Redis with global replication supports cross-region cache invalidation. Implement a `cacheHandler` in `next.config.js` that reads and writes to Redis instead of the local filesystem. Additionally, fan out revalidation requests to all regions by calling the `revalidatePath` endpoint on each regional deployment after a CMS webhook is received.

### App Router with Middleware Authentication at the Edge

Middleware in Next.js runs on the Edge Runtime, which does not support all Node.js APIs. Common authentication libraries (jsonwebtoken, bcrypt, most database clients) use Node.js crypto APIs that are unavailable in the Edge Runtime.

Symptom: `The edge runtime does not support Node.js 'crypto' module` at deploy time or runtime. Fix: Use Web Crypto API-compatible JWT libraries (`jose` is the standard choice for Edge-compatible JWT verification). Never attempt to query a database in Middleware -- Middleware should only read and validate stateless tokens (JWTs) and set cookies or headers. Redirect or rewrite based on token claims, then perform full authorization checks in Server Components or Route Handlers where the full Node.js runtime is available.

### Docker Image Size Optimization for Large Applications

Next.js applications with many pages and large dependency trees frequently produce standalone output exceeding 500 MB, resulting in slow container startup and high image registry storage costs.

Diagnosis: Run `du -sh .next/standalone/node_modules/*/ | sort -rh | head -20` to identify the largest dependencies included by the file tracer. Common offenders include `sharp` (image processing -- 80--100 MB), `@swc/*` packages inadvertently included in production, and AWS SDK v2 (monolithic, ~70 MB). Fix for `sharp`: Verify it is installed with the correct platform binary for the target architecture. In the Dockerfile, run `npm install --os=linux --cpu=x64 sharp` to ensure the Linux binary is included and the macOS binary is excluded. Fix for `@swc`: Add to `serverExternalPackages` (Next.js 14+) or `experimental.serverComponentsExternalPackages` (Next.js 13) to prevent bundling and rely on the version present in `node_modules`. Fix for AWS SDK: Migrate to AWS SDK v3, which uses a modular architecture -- only the specific clients used are included in the bundle.

### Static Export with Client-Side Dynamic Routes

`output: 'export'` requires all dynamic routes to be statically pre-rendered. Routes using `[...slug]` or `[id]` must implement `generateStaticParams` (App Router) or `getStaticPaths` (Pages Router) that enumerate every valid path at build time. In e-commerce applications with 100,000+ product pages, this produces impractically long build times and oversized static output.

Decision: For catalogs above ~10,000 items, ISR is strongly preferable to static export. If static export is required by the hosting constraint (e.g., deploying to GitHub Pages), implement client-side fetching for the dynamic content portion with a static shell -- render a loading skeleton statically and fetch the product data client-side after hydration. This pattern is called "Static Shell + Client Fetch" and is a recognized workaround for static export limitations. It sacrifices SEO for dynamic content but preserves the static hosting constraint.

### Zero-Downtime Deployments for SSR with In-Flight Requests

Rolling deployments replace old pods with new ones gradually. During a rolling update, traffic may be routed to both old and new versions simultaneously. If the new version includes a breaking change to an API route response shape that the old client JavaScript expects, users on the old client may receive API responses from the new server (or vice versa).

Fix: Implement a deployment version cookie or header. Include the build ID (`process.env.NEXT_PUBLIC_BUILD_ID` set to `process.env.NEXT_BUILD_ID` at build time) in API responses. On the client, if the response build ID does not match the current client build ID, trigger a hard reload (`window.location.reload()`) to upgrade the client. This ensures clients are never stuck in a mixed-version state longer than the duration of a single page interaction. For Kubernetes, configure `maxSurge: 1` and `maxUnavailable: 0` in the rolling update strategy and set a `minReadySeconds: 30` to allow the new pod to warm up before the old pod is terminated.

### Serverless Cold Starts with Large Next.js Bundles

AWS Lambda cold starts for Next.js functions commonly reach 3--8 seconds for large applications when the Lambda package size exceeds 10 MB (unzipped). This is caused by module initialization time, not network latency.

Diagnosis: Measure cold start duration with AWS X-Ray or Lambda Power Tuning. Identify the initialization phase vs. execution phase in the trace. Fix -- Layer-based dependencies: Extract stable, rarely-changing `node_modules` into a Lambda Layer. The Layer is pre-loaded into the execution environment and does not count against cold start initialization time. Fix -- Memory allocation: Increasing Lambda memory from 512 MB to 1024 MB or 1769 MB (1 vCPU threshold) reduces cold start duration by 40--60% due to proportionally increased CPU allocation during initialization. Fix -- Provisioned Concurrency: For routes with SLA requirements (p99 < 500 ms), configure Provisioned Concurrency of 2--5 instances. This eliminates cold starts entirely for those instances at a fixed cost. Fix -- Edge Runtime for eligible routes: Routes that only perform JWT validation, redirects, or simple data transformations can be moved to `export const runtime = 'edge'`, which has near-zero cold start time.

---

## Example

**Input:** "We have a Next.js 14 e-commerce application using the App Router. We have a product catalog (~8,000 products), a user dashboard that requires authentication, a homepage with editorial content that changes daily, and a checkout flow. We're a team of 4 engineers and currently on Vercel but want to move to AWS to reduce costs. We're deploying with Docker. What should our deployment setup look like?"

**Output:**

## Next.js Deployment Assessment

### Rendering Matrix

| Route Pattern           | Rendering Mode | Revalidation | Notes                                               |
|-------------------------|----------------|--------------|-----------------------------------------------------|
| `/`                     | ISR            | 3600s        | Editorial content, daily changes, CDN-safe          |
| `/products`             | ISR            | 1800s        | Catalog listing, changes infrequently               |
| `/products/[slug]`      | ISR            | 900s         | Individual product pages, 8,000 paths               |
| `/dashboard/*`          | SSR            | --           | Auth-gated, session-dependent, never cache          |
| `/checkout/*`           | SSR            | --           | Cart state, payment, never cache                    |
| `/api/webhooks/*`       | Route Handler  | --           | CMS webhooks for on-demand revalidation             |
| `/_next/static/*`       | Static         | Immutable    | Content-hashed, 1-year CDN TTL                      |

### Deployment Target Recommendation

**Recommended:** AWS ECS Fargate + Application Load Balancer + CloudFront

With 8,000 product pages using ISR, an auth-gated dashboard, and a checkout flow, a persistent containerized server (ECS Fargate) is the correct choice over Lambda. Fargate eliminates cold starts entirely, which matters for checkout conversion rates. The mixed SSR/ISR rendering matrix is better served by a long-running server process than by serverless functions that must initialize per-request.

**Alternative:** AWS Lambda + API Gateway with Provisioned Concurrency -- viable if cost-per-request economics matter more than operational simplicity at your current traffic level. Requires provisioned concurrency on checkout routes (minimum 2 instances) to meet latency SLAs.

### Required `next.config.js`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for Docker/ECS deployment -- produces self-contained server
  output: 'standalone',

  // Disable built-in compression -- CloudFront handles gzip/brotli
  compress: false,

  // CDN URL for static assets -- prevents serving /_next/static/ from ECS
  assetPrefix: process.env.NEXT_PUBLIC_CDN_URL ?? '',

  // Remove version leak from response headers
  poweredByHeader: false,

  images: {
    // Allow CloudFront to cache optimized images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.yourstore.com',
        pathname: '/products/**',
      },
    ],
    // Use your CDN as the image optimization loader
    // If using next/image with standalone, the image optimization server
    // runs inside the container -- no external service needed
  },

  // Prevent @swc and other build-only packages from being bundled
  serverExternalPackages: ['sharp'],

  experimental: {
    // Required for monorepo -- set to repo root if applicable
    // outputFileTracingRoot: path.join(__dirname, '../../'),

    // Enable per-page ISR cache invalidation via revalidateTag
    staleTimes: {
      dynamic: 0,   // SSR pages: never cache in router cache
      static: 300,  // ISR pages: 5-minute client-side router cache
    },
  },
};

export default nextConfig;
```

### Dockerfile

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Install production + dev deps needed for build
RUN npm ci

# Install sharp with Linux binary explicitly
RUN npm install --os=linux --cpu=x64 sharp

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy deps from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables (NEXT_PUBLIC_* are baked in here)
ARG NEXT_PUBLIC_CDN_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CDN_URL=$NEXT_PUBLIC_CDN_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bind to all interfaces inside container
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (includes traced node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy static assets (NOT included in standalone automatically)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy public directory (NOT included in standalone automatically)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Graceful shutdown is handled in server.js wrapper (see below)
CMD ["node", "server.js"]
```

### Graceful Shutdown Wrapper (`server-wrapper.js`)

Replace `CMD ["node", "server.js"]` with `CMD ["node", "server-wrapper.js"]`:

```javascript
// server-wrapper.js -- place in project root, copied via Dockerfile
const { createServer } = require('http');
const { parse } = require('url');
const next = require('./node_modules/next');

const app = next({ dev: false, hostname: '0.0.0.0', port: 3000 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(3000, '0.0.0.0', () => {
    console.log(JSON.stringify({ level: 'info', msg: 'Server ready', port: 3000 }));
  });

  // Graceful shutdown: stop accepting connections, drain in-flight requests
  const shutdown = () => {
    console.log(JSON.stringify({ level: 'info', msg: 'SIGTERM received, shutting down' }));
    server.close((err) => {
      if (err) {
        console.error(JSON.stringify({ level: 'error', msg: 'Error during shutdown', err: err.message }));
        process.exit(1);
      }
      console.log(JSON.stringify({ level: 'info', msg: 'Shutdown complete' }));
      process.exit(0);
    });

    // Force exit after 30 seconds if requests don't drain
    setTimeout(() => {
      console.error(JSON.stringify({ level: 'error', msg: 'Forced shutdown after 30s' }));
      process.exit(1);
    }, 30_000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});
```

### Environment Variable Checklist

**Server-only secrets (inject at ECS task definition runtime -- never in Dockerfile):**
- `DATABASE_URL` -- Postgres connection string with connection pooler (PgBouncer/RDS Proxy)
- `STRIPE_SECRET_KEY` -- Stripe server-side key
- `REVALIDATION_SECRET` -- Random 32-byte hex string for webhook revalidation authentication
- `SESSION_SECRET` -- JWT signing secret, minimum 256-bit entropy
- `REDIS_URL` -- Required for shared ISR cache across ECS tasks (see below)

**`NEXT_PUBLIC_*` build-time variables (set as Docker build args in CI):**
- `NEXT_PUBLIC_CDN_URL` -- e.g., `https://d1234abcd.cloudfront.net`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` -- Stripe public key

**Runtime variables (no rebuild needed, set in ECS task definition):**
- `PORT` -- 3000
- `HOSTNAME` -- 0.0.0.0
- `NODE_ENV` -- production

**Validation (add to `src/env.ts`, imported in `instrumentation.ts`):**
```typescript
import { z } from 'zod';

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  REVALIDATION_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  REDIS_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

export const serverEnv = serverEnvSchema.parse(process.env);
```

### Shared ISR Cache Configuration (Critical for Multi-Instance ECS)

With multiple ECS tasks behind an ALB, ISR cache must be shared via Redis. Without this, revalidation only affects one task.

```typescript
// cache-handler.ts
import { CacheHandler } from 'next/dist/server/lib/incremental-cache';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

export default class RedisCache implements CacheHandler {
  async get(key: string) {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  }

  async set(key: string, data: unknown, options: { revalidate?: number }) {
    const ttl = options.revalidate ?? 3600;
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  }

  async revalidateTag(tag: string) {
    // Scan and delete all keys tagged with this tag
    const keys = await redis.smembers(`tag:${tag}`);
    if (keys.length > 0) {
      await redis.del(...keys);
      await redis.del(`tag:${tag}`);
    }
  }
}
```

```typescript
// next.config.ts addition
const nextConfig = {
  cacheHandler: require.resolve('./cache-handler.ts'),
  cacheMaxMemorySize: 0, // disable in-memory cache, use Redis exclusively
};
```

### CloudFront Distribution Configuration

Create three CloudFront cache behaviors in this priority order:

| Path Pattern         | Origin               | Cache Policy                          | TTL                          |
|----------------------|----------------------|---------------------------------------|------------------------------|
| `/_next/static/*`    | ALB (ECS)            | CachingOptimized (AWS managed)        | min: 86400s, max: 31536000s  |
| `/api/*`             | ALB (ECS)            | CachingDisabled (AWS managed)         | TTL=0, forward all headers   |
| `/_next/image*`      | ALB (ECS)            | Custom: forward Accept, query strings | min: 60s, max: 86400s        |
| `*` (default)        | ALB (ECS)            | Custom (see below)                    | min: 0s, default: 60s        |

Custom default behavior: Enable Brotli + Gzip compression. Forward `Host` header. Forward `CloudFront-Viewer-Country` header for geo-personalization. Do NOT forward `Cookie` or `Authorization` headers to the cache key unless the route requires it -- this is the most common cause of CloudFront serving 0% cache hits.

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { serverEnv } from '@/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Verify critical downstream dependencies are reachable
  const checks = await Promise.allSettled([
    // Lightweight Redis ping -- confirms cache connectivity
    fetch(`${serverEnv.REDIS_URL}/ping`).then(() => ({ service: 'redis', status: 'ok' })),
  ]);

  const results = checks.map((c, i) =>
    c.status === 'fulfilled' ? c.value : { service: i === 0 ? 'redis' : 'unknown', status: 'error' }
  );

  const allHealthy = results.every((r) => r.status === 'ok');

  return NextResponse.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      version: process.env.npm_package_version,
      buildId: process.env.NEXT_BUILD_ID,
      checks: results,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
```

Configure ALB target group health check: Path `/api/health`, interval 30s, timeout 5s, healthy threshold 2, unhealthy threshold 3.

### Deployment Checklist

- [x] `output: 'standalone'` set in `next.config.ts`
- [x] `assetPrefix` set to CloudFront distribution URL
- [x] `compress: false` set -- CloudFront handles compression
- [x] Non-root user (`nextjs:nodejs`) in Dockerfile
- [x] `NODE_ENV=production` and `HOSTNAME=0.0.0.0` set in container
- [x] `public/` and `.next/static/` copied separately in Dockerfile
- [x] Redis cache handler configured for multi-instance ISR consistency
- [x] `NEXT_PUBLIC_*` vars set as CI build args (not runtime injection)
- [x] Server-only secrets injected via ECS task definition environment (Secrets Manager)
- [x] Environment variable validation via zod on server startup
- [x] Graceful SIGTERM handler with 30-second drain window
- [x] Health check endpoint at `/api/health` with readiness and liveness probes configured
- [x] CloudFront behaviors configured for static assets (immutable), API routes (no-cache), and dynamic pages (60s TTL)
- [x] On-demand ISR revalidation webhook secured with `REVALIDATION_SECRET`
- [x] `minReadySeconds: 30` on ECS service rolling update for safe pod replacement
- [ ] Bundle size audit passing (First Load JS < 200 KB gzipped per critical route)
- [ ] Cold start latency baseline recorded (N/A for Fargate -- note for future Lambda migration)
- [ ] Runbook written for manual cache invalidation (Redis flush by key prefix) during incident response
