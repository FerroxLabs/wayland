---
name: csharp-aspnet-patterns
description: |
  Guides expert-level ASP.NET Core development: minimal APIs vs Controllers decision tree, middleware pipeline, filters, configuration binding, health checks, and OpenAPI integration.
  Use when the user asks about ASP.NET Core, minimal APIs, Controllers, middleware, filters, configuration, health checks, .NET 8.
  Do NOT use when the user asks about C# project setup (use `csharp-project-setup`), C# async (use `csharp-async-patterns`), C# testing (use `csharp-testing-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "csharp backend frameworks"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# C# ASP.NET Core Patterns

## When to Use

**Use this skill when the user asks about:**
- Choosing between Minimal APIs and Controller-based APIs in ASP.NET Core (.NET 6, 7, or 8)
- Designing or debugging the ASP.NET Core middleware pipeline (ordering, short-circuiting, branching)
- Implementing action filters, result filters, resource filters, or exception filters
- Binding configuration from `appsettings.json`, environment variables, or secrets to typed options classes
- Adding health check endpoints with custom logic, database probes, or readiness/liveness separation
- Integrating OpenAPI/Swagger documentation using `Swashbuckle.AspNetCore` or the new .NET 9-preview `Microsoft.AspNetCore.OpenApi`
- Implementing response caching, output caching, rate limiting, or request decompression middleware
- Setting up dependency injection scopes, keyed services (introduced in .NET 8), or factory patterns within the ASP.NET Core host
- Implementing `IHostedService` or `BackgroundService` within the same ASP.NET Core host
- Configuring CORS policies, authentication middleware ordering, or authorization policies
- Designing route groups, versioned APIs, or link generation with `IUrlHelper`

**Do NOT use this skill when the user asks about:**
- Initial project creation, SDK targeting, NuGet package management, or `.csproj` structure -- use `csharp-project-setup` instead
- `async`/`await` internals, `ValueTask`, `IAsyncEnumerable`, or `System.Threading.Channels` -- use `csharp-async-patterns` instead
- Unit testing, integration testing with `WebApplicationFactory`, or test doubles -- use `csharp-testing-patterns` instead
- Entity Framework Core schema design, migrations, or query optimization -- use `csharp-efcore-patterns` instead
- SignalR, gRPC, or Blazor server/WASM hosting -- those warrant their own skills
- Pure C# language features unrelated to the hosting model (records, pattern matching, LINQ)
- Docker, Kubernetes deployment, or Helm chart configuration of ASP.NET apps

---

## Process

### 1. Decide: Minimal API vs. Controller-Based Architecture

Before writing any endpoint code, apply this decision framework. The wrong choice creates expensive refactors.

- **Choose Minimal APIs** when the service has fewer than ~20 endpoints, is a microservice or sidecar, needs maximum startup performance (benchmarks show ~15% faster cold start vs. MVC in .NET 8 with no controller overhead), or the team is comfortable with module-based organization
- **Choose Controllers** when the surface area exceeds ~20 endpoints, you need `[ApiController]` automatic model validation behavior (400 responses with `ProblemDetails`), you rely heavily on action filters for cross-cutting concerns, or the codebase is brownfield with existing MVC conventions
- **Hybrid is valid**: Use Minimal APIs for health/probe endpoints and internal admin routes even inside a controller-heavy app
- For Minimal APIs at scale, group related endpoints into `IEndpointRouteBuilder` extension methods or implement the `IEndpointDefinition` pattern (a custom interface mapping a class to a `MapGroup` call in `Program.cs`)
- For Controllers, always add `[Produces("application/json")]` and `[Consumes("application/json")]` at the controller level, not per-action, unless endpoints diverge
- Never mix `[FromBody]` and `[FromForm]` on the same action -- they share the request body stream and the second read returns empty

### 2. Configure the Middleware Pipeline in Correct Order

ASP.NET Core middleware executes in registration order on request and in reverse on response. Order mistakes cause authentication bypass, missing CORS headers, and silent data loss.

The canonical production order for a secured JSON API is:

```
UseExceptionHandler / UseDeveloperExceptionPage
UseHttpsRedirection
UseHsts (production only)
UseRouting
UseCors          ← must be after UseRouting, before UseAuthentication
UseAuthentication
UseAuthorization
UseOutputCaching / UseResponseCaching
UseRateLimiter   ← .NET 7+ built-in, after auth so you can rate-limit per user
MapControllers / MapGroup endpoints
```

- `UseCors` placed before `UseAuthentication` means CORS preflight responses bypass auth, which is correct -- browsers send OPTIONS without credentials
- `UseRouting` must precede any middleware that calls `HttpContext.GetEndpointAsync()` -- middleware that needs route data (e.g., per-endpoint CORS policy selection) must come after it
- `UseResponseCaching` and `UseOutputCaching` must come before the endpoint -- if placed after, the response is already written
- Custom middleware that reads the request body must call `context.Request.EnableBuffering()` before reading, otherwise downstream middleware sees an empty stream
- Use `app.UseWhen(predicate, branch => { ... })` for conditional pipeline branches (e.g., legacy path handling) rather than `if` blocks inside middleware
- Never use `app.Use(async (ctx, next) => { ... })` for production middleware -- always create a typed class with `IMiddleware` or the constructor-injection pattern (`InvokeAsync(HttpContext context, ILogger<T> logger)`) for testability

### 3. Implement Filters Correctly for Cross-Cutting Concerns

Filters run inside the MVC/Minimal API action pipeline, after middleware but before model binding (resource filters) or after binding (action filters).

- **Exception filters** (`IExceptionFilter`) should only handle MVC-layer exceptions. Use `UseExceptionHandler` middleware for infrastructure exceptions (database timeout, serialization failures) -- exception filters do not catch exceptions thrown inside middleware
- **Action filters** (`IActionFilter`) are the right place for: request logging with action name/route data, model state validation (though `[ApiController]` does this automatically), and timing individual controller actions
- **Result filters** (`IResultFilter`) run after the action result is determined but before it executes -- use them to wrap responses in an envelope (`{ data: ..., meta: ... }`) without modifying every action
- **Resource filters** (`IResourceFilter`) run before model binding and can short-circuit the pipeline entirely -- use them for response caching at the filter level or request validation that avoids binding overhead
- Register filters globally in `builder.Services.AddControllers(options => options.Filters.Add<GlobalExceptionFilter>())`, at controller level via `[ServiceFilter(typeof(MyFilter))]`, or at action level
- `[ServiceFilter]` resolves the filter from DI (supports constructor injection); `[TypeFilter]` instantiates the filter with DI but allows passing constructor arguments; use `[ServiceFilter]` by default
- For Minimal API cross-cutting concerns, use `IEndpointFilter` (introduced .NET 7) rather than trying to backport MVC filters -- it has the same before/after semantics as action filters

```csharp
// IEndpointFilter example for Minimal APIs
app.MapPost("/orders", CreateOrderAsync)
   .AddEndpointFilter<ValidationFilter<CreateOrderRequest>>()
   .AddEndpointFilter<IdempotencyFilter>();
```

### 4. Bind Configuration to Strongly Typed Options

Never inject `IConfiguration` directly into services. It bypasses validation, makes testing harder, and breaks refactoring.

- Use the Options pattern: `builder.Services.AddOptions<DatabaseOptions>().BindConfiguration("Database").ValidateDataAnnotations().ValidateOnStart()`
- `ValidateOnStart()` (introduced .NET 6) throws at application startup if required fields are missing, catching misconfiguration before the first request
- For complex validation, implement `IValidateOptions<T>` rather than `[Required]` attributes -- it supports cross-property rules and returns multiple errors
- Use `IOptionsMonitor<T>` in long-lived singletons (monitors for file changes, reloads); use `IOptionsSnapshot<T>` in scoped services (reloads per request); use `IOptions<T>` only for configuration that never changes at runtime
- Name the JSON section to match the class name minus the "Options" suffix: class `JwtOptions` binds to section `"Jwt"` -- set this convention in your team's ADR
- Environment variable overrides use double-underscore as section separator: `Database__ConnectionString` overrides `appsettings.json` `Database:ConnectionString`. This works on Linux (which prohibits colons in env var names)
- Secrets should come from environment variables or Azure Key Vault, never `appsettings.json` -- use `builder.Configuration.AddAzureKeyVault(...)` in production and `builder.Configuration.AddUserSecrets<Program>()` in development

```csharp
public class DatabaseOptions
{
    [Required, MinLength(10)]
    public string ConnectionString { get; init; } = string.Empty;

    [Range(1, 500)]
    public int MaxPoolSize { get; init; } = 100;

    public TimeSpan CommandTimeout { get; init; } = TimeSpan.FromSeconds(30);
}
```

### 5. Implement Health Checks with Liveness/Readiness Separation

Kubernetes and cloud load balancers expect two distinct probe endpoints. Conflating them causes unnecessary pod restarts.

- **Liveness probe** (`/healthz/live`): answers "is the process alive?" -- should only fail if the app is deadlocked or in an unrecoverable state. Contains zero external dependency checks. Return 200 immediately.
- **Readiness probe** (`/healthz/ready`): answers "can the pod accept traffic?" -- checks database reachability, cache connectivity, downstream service availability. May return 503 during warm-up or graceful shutdown.
- Register checks with tags and map them to separate endpoints:

```csharp
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    .AddNpgsql(connectionString, tags: ["ready", "db"])
    .AddRedis(redisConfig, tags: ["ready", "cache"])
    .AddUrlGroup(new Uri("https://payment-service/health"), "payment-svc", tags: ["ready"]);

app.MapHealthChecks("/healthz/live",  new() { Predicate = r => r.Tags.Contains("live") });
app.MapHealthChecks("/healthz/ready", new() { Predicate = r => r.Tags.Contains("ready") });
```

- Use `AspNetCore.HealthChecks.*` NuGet packages for standard integrations (PostgreSQL, Redis, SQL Server, RabbitMQ, Azure Blob, etc.) rather than writing checks from scratch
- Custom `IHealthCheck` implementations must complete within 5 seconds -- the framework default timeout is 30 seconds but Kubernetes liveness probes typically have a 5-second timeout. Set `HealthCheckServiceOptions.Timeout = TimeSpan.FromSeconds(5)`
- Health check endpoints should be excluded from authentication middleware for internal probes but protected (e.g., require an internal network or API key) if they expose sensitive infrastructure information
- Add `ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse` from `HealthChecks.UI.Client` for rich JSON output including component status, duration, and description -- essential for dashboards

### 6. Integrate OpenAPI Documentation

- In .NET 8 and earlier, use `Swashbuckle.AspNetCore` 6.x. In .NET 9+, the built-in `Microsoft.AspNetCore.OpenApi` package replaces it.
- For Swashbuckle, always enable XML comments: set `<GenerateDocumentationFile>true</GenerateDocumentationFile>` in `.csproj` and register with `c.IncludeXmlComments(xmlPath)`
- Use `[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]` on every controller action -- undocumented response codes leave API consumers guessing
- Use `SwaggerGen` operation filters to document security schemes: add `IOperationFilter` that appends the `Authorization` header requirement to operations decorated with `[Authorize]`
- For Minimal APIs, use `.WithName("CreateOrder").WithTags("Orders").WithSummary("...").WithDescription("...")` fluent methods on `RouteHandlerBuilder` -- these populate the OpenAPI spec
- Generate the OpenAPI spec as a build artifact and commit it to source control -- this enables diff-based API contract review in PRs and powers contract testing
- Version APIs using `Asp.Versioning.Http` package -- it integrates with Swashbuckle to produce separate spec documents per version (e.g., `/swagger/v1/swagger.json`, `/swagger/v2/swagger.json`)
- Expose the Swagger UI only in Development: `if (app.Environment.IsDevelopment()) { app.UseSwaggerUI(); }` -- leaking endpoint metadata in production is a security risk

### 7. Harden and Finalize the Configuration

Before declaring any API production-ready, complete this checklist:

- Enable `ProblemDetails` globally: `builder.Services.AddProblemDetails()` + `app.UseExceptionHandler()` without a path produces RFC 7807-compliant error responses automatically in .NET 7+
- Set `JsonSerializerOptions` globally via `builder.Services.ConfigureHttpJsonOptions(opts => { opts.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; opts.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull; })` -- never set it on individual `JsonSerializer.Serialize` calls in handlers
- Add `builder.Services.AddHttpContextAccessor()` only when needed -- it adds a thread-local allocation per request and should not be injected into singletons (causes scope capture bugs)
- Configure Kestrel limits explicitly: `builder.WebHost.ConfigureKestrel(opts => { opts.Limits.MaxRequestBodySize = 10 * 1024 * 1024; opts.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2); })` -- defaults allow 28.6 MB bodies and 130-second keep-alive
- Register `IHostedService` background workers via `builder.Services.AddHostedService<OutboxProcessor>()` -- they start after all middleware is configured and stop gracefully during `IHostApplicationLifetime.ApplicationStopping`
- Use `builder.Services.AddKeyedSingleton<IMessageBus, KafkaBus>("kafka")` and `builder.Services.AddKeyedSingleton<IMessageBus, RabbitBus>("rabbit")` with .NET 8 keyed services to resolve named implementations without a factory delegate pattern

---

## Output Format

When responding to a user request about ASP.NET Core patterns, structure your answer as follows:

```
## Decision Summary

| Concern | Recommendation | Rationale |
|---------|----------------|-----------|
| API surface style | Minimal API / Controller | [reason based on endpoint count and team context] |
| Auth scheme | JWT Bearer / Cookie / ApiKey | [based on client type: SPA, mobile, server-to-server] |
| Configuration source | appsettings + env vars + secrets | [standard for cloud-native] |
| Health checks | Liveness + Readiness split | [Kubernetes-compatible] |
| Error model | ProblemDetails (RFC 7807) | [interoperable, standard] |

## Program.cs Skeleton

```csharp
// Builder phase
var builder = WebApplication.CreateBuilder(args);

// [Configuration binding section]
builder.Services.AddOptions<[Name]Options>()
    .BindConfiguration("[SectionName]")
    .ValidateDataAnnotations()
    .ValidateOnStart();

// [Service registration section]
builder.Services.AddControllers() // or AddEndpointsApiExplorer for Minimal
    .AddJsonOptions(opts => opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);
builder.Services.AddProblemDetails();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts => { /* bind from options */ });
builder.Services.AddAuthorization();
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    // Add domain-specific checks here
    ;

// Pipeline phase
var app = builder.Build();

app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("[PolicyName]");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment()) app.UseSwaggerUI();

app.MapControllers(); // or MapGroup / individual MapPost/MapGet
app.MapHealthChecks("/healthz/live",  new() { Predicate = r => r.Tags.Contains("live") });
app.MapHealthChecks("/healthz/ready", new() { Predicate = r => r.Tags.Contains("ready") });

app.Run();
```

## Middleware Order Verification

| Position | Middleware | Why Here |
|----------|------------|----------|
| 1 | UseExceptionHandler | Catches all downstream exceptions |
| 2 | UseHttpsRedirection | Redirects before any processing |
| 3 | UseRouting | Enables endpoint-aware middleware |
| 4 | UseCors | After routing, before auth |
| 5 | UseAuthentication | Populates ClaimsPrincipal |
| 6 | UseAuthorization | Evaluates policies after identity set |
| 7 | UseOutputCaching | After auth, results are user-specific |
| 8 | MapControllers/Endpoints | Terminal middleware |

## Key Implementation Notes

- [Specific gotchas for this user's scenario]
- [Trade-offs accepted]
- [Configuration values requiring environment-specific tuning]
```

---

## Rules

1. **Never register `IConfiguration` directly in service constructors.** Always use the Options pattern with `IOptions<T>`, `IOptionsMonitor<T>`, or `IOptionsSnapshot<T>`. Direct `IConfiguration` injection makes configuration keys stringly-typed, untestable, and impossible to validate at startup.

2. **Always place `UseCors` after `UseRouting` and before `UseAuthentication`.** Putting CORS before routing means you cannot select per-endpoint CORS policies. Putting it after authentication means OPTIONS preflight requests (sent without credentials) are rejected with 401 before CORS headers are written.

3. **Never read `HttpRequest.Body` twice without calling `EnableBuffering()` first.** The default body is a forward-only network stream. Middleware that logs the body must buffer it; otherwise the action receives an empty model after binding fails silently or throws a format exception.

4. **Always call `ValidateOnStart()` on every `AddOptions<T>()` registration in production apps.** Without it, misconfigured options throw only when the options object is first accessed -- potentially hours into production traffic after restart. Fail fast at startup.

5. **Never use `[TypeFilter]` or `[ServiceFilter]` when registering filters globally.** Global filter registration via `options.Filters.Add<T>()` already resolves from DI. Using `[TypeFilter]` globally creates double-instantiation and can produce duplicate filter execution in some pipeline paths.

6. **Always tag health checks and map them to separate endpoints.** A single `/health` endpoint that checks all dependencies causes Kubernetes to kill and restart pods when a downstream service is degraded -- even though the pod itself is healthy. The liveness probe should contain zero external checks.

7. **Never expose Swagger UI or the OpenAPI spec JSON in production environments.** The spec reveals all routes, parameter names, response shapes, and security schemes. Gate it behind `app.Environment.IsDevelopment()` or an authenticated internal route at minimum.

8. **Always set `Kestrel` limits explicitly rather than relying on defaults.** The default `MaxRequestBodySize` of 28.6 MB and `MaxConcurrentConnections` of unlimited are wrong for most production APIs. An API accepting JSON payloads should cap at 1--10 MB. An API accepting file uploads needs a higher cap, a dedicated endpoint, and streaming instead of buffering.

9. **Never use `app.UseResponseCaching()` and `app.UseOutputCaching()` simultaneously.** They are different implementations (`OutputCaching` is the .NET 7+ replacement) and they interfere with each other. Use `OutputCaching` for new code -- it supports per-endpoint policies, cache invalidation by tag, and Redis-backed distributed caching.

10. **Always derive background workers from `BackgroundService`, not `IHostedService` directly.** `BackgroundService` handles `CancellationToken` plumbing correctly, catches unobserved `TaskCanceledException`, and prevents the host from swallowing background thread exceptions silently. Override `ExecuteAsync`, and rethrow after logging any unrecoverable exception to trigger graceful host shutdown.

---

## Edge Cases

### Long-running Request Body Reads in Minimal APIs

When a Minimal API endpoint receives a large file upload via `IFormFile` or raw `Stream`, the default Kestrel request body timeout (the `MinRequestBodyDataRate` limit) can kill the connection mid-upload on slow clients. Solution: apply `[DisableRequestSizeLimit]` only to that endpoint using `.WithMetadata(new DisableRequestSizeLimitAttribute())` on `RouteHandlerBuilder`, and set a per-endpoint rate: `context.Features.Get<IHttpMaxRequestBodySizeFeature>()?.MaxRequestBodySize = 500_000_000`. Do not disable the global limit.

### Filters and Minimal API Incompatibility

`IActionFilter`, `IResultFilter`, `IResourceFilter`, and `IExceptionFilter` are MVC constructs -- they do NOT execute for Minimal API endpoints. Teams migrating from controllers to Minimal APIs lose all global MVC filters silently. Replace them with: `IEndpointFilter` for action/result behavior, middleware for cross-cutting pipeline behavior (exception handling, logging, correlation IDs), and `IHostedService` for background concerns. Audit every global filter before migration.

### Options Reload in Singleton Services

Injecting `IOptionsSnapshot<T>` into a singleton throws at runtime because `IOptionsSnapshot` is scoped. Injecting `IOptions<T>` into a singleton works but never reflects configuration reloads (e.g., Azure App Configuration refresh). For singletons that must react to live config changes, inject `IOptionsMonitor<T>` and subscribe to `monitor.OnChange(updatedConfig => { /* update local copy */ })`. Cache the updated config in a field -- do not call `monitor.CurrentValue` on every operation (it acquires a lock on every access).

### Middleware Exception Handling vs. Action Exception Filters

A common mistake is registering both `UseExceptionHandler` middleware and a global `IExceptionFilter`. They handle different exception types. `IExceptionFilter` catches exceptions thrown during model binding, action execution, and result execution -- but not exceptions thrown in other middleware (database connection pool exhaustion, Redis timeout, etc.). `UseExceptionHandler` catches everything downstream. If both exist, define a clear boundary: use `IExceptionFilter` only for domain-specific MVC exceptions (e.g., `EntityNotFoundException` → 404), and let `UseExceptionHandler` convert all other exceptions to `ProblemDetails` 500s. Never swallow exceptions in a filter -- always rethrow if you do not handle them.

### CORS Preflight Failures Behind a Reverse Proxy

When deployed behind NGINX or an Azure API Gateway, the `Origin` header may differ from the application's configured allowed origins due to host rewriting. Symptoms: 403 on OPTIONS requests despite correct CORS configuration. Solution: configure the reverse proxy to forward the original `Origin` header unchanged, or use `builder.Services.AddCors(opts => opts.AddPolicy("prod", p => p.WithOrigins(...).AllowAnyMethod().AllowAnyHeader()))` with the exact frontend domain (never `AllowAnyOrigin()` with `AllowCredentials()` -- this throws at startup in .NET 6+ because it violates the CORS spec). Also ensure `UseForwardedHeaders` middleware is registered before `UseCors` to correctly populate `Request.Scheme` and `Request.Host`.

### Health Check Authentication Conflicts

If `UseAuthentication` and `UseAuthorization` are registered (as they should be), health check endpoints at `/healthz/*` will be protected by default in apps using a default authorization policy. Kubernetes probe requests carry no credentials and will receive 401/403, causing continuous pod restarts. Fix by explicitly calling `.AllowAnonymous()` on the health check `MapHealthChecks(...)` endpoint: `app.MapHealthChecks("/healthz/live", options).AllowAnonymous()`. Alternatively, add the health check paths to the `UseForwardedHeaders` exclusion list or use network policy at the infrastructure level to restrict who can reach the probe endpoint.

### Keyed Service Resolution in Middleware

.NET 8 keyed services (`[FromKeyedServices("key")]`) work in controller constructor injection and `IEndpointFilter` constructors, but NOT in middleware constructors resolved via `IMiddleware` registration. Middleware is resolved from the root service provider (a singleton scope), while keyed service resolution requires the concrete key at compile time. Workaround: inject `IServiceProvider` or `IKeyedServiceProvider` into the middleware constructor and resolve the keyed service inside `InvokeAsync` -- but be aware this bypasses the DI lifetime system. Prefer resolving keyed services at the endpoint/controller layer, not the middleware layer.

### OpenAPI Spec Generation with Nullable Reference Types

Enabling `<Nullable>enable</Nullable>` in the project (required in .NET 8 templates) changes how Swashbuckle infers property schemas. Non-nullable properties become `required` in the generated schema; nullable properties get `nullable: true`. However, `string?` properties on request DTOs do not automatically get `minLength` or pattern validation in the schema -- those require explicit `[MinLength]`, `[RegularExpression]`, or `[JsonRequired]` attributes. Without them, clients see a schema that implies a property is optional when the server actually rejects empty strings. Audit all request/response DTOs for alignment between C# nullability, `DataAnnotations`, and the emitted OpenAPI schema.

---

## Example

**Input:** "I'm building a new .NET 8 REST API for an e-commerce order management system. It will have about 30 endpoints across orders, products, and customers. We use JWT Bearer tokens, PostgreSQL via EF Core, Redis for caching, and we need to deploy to Kubernetes. What's the right ASP.NET Core architecture?"

---

**Output:**

## Decision Summary

| Concern | Recommendation | Rationale |
|---------|----------------|-----------|
| API surface style | Controllers | 30 endpoints across 3 domains benefits from grouping, auto-validation via `[ApiController]`, and per-controller filter scope |
| Auth scheme | JWT Bearer | Stateless, works for SPA + mobile clients, standard for microservices |
| Configuration binding | `AddOptions<T>` + env vars + secrets | Validation at startup, no stringly-typed access |
| Error model | ProblemDetails (RFC 7807) | Interoperable, built-in .NET 7+ support |
| Health checks | Liveness + Readiness, split endpoints | Kubernetes-compatible, prevents pod cycling on DB hiccups |
| Caching | `UseOutputCaching` + Redis backing | .NET 7+ output cache supports distributed cache and tag invalidation |
| OpenAPI | Swashbuckle 6.x with XML comments | Mature, well-supported in .NET 8 |

---

## Program.cs

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using HealthChecks.UI.Client;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ─── Configuration Binding ───────────────────────────────────────────────────

builder.Services.AddOptions<DatabaseOptions>()
    .BindConfiguration("Database")
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<JwtOptions>()
    .BindConfiguration("Jwt")
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<RedisOptions>()
    .BindConfiguration("Redis")
    .ValidateDataAnnotations()
    .ValidateOnStart();

// ─── Core Services ───────────────────────────────────────────────────────────

builder.Services.AddControllers(options =>
{
    options.Filters.Add<GlobalExceptionFilter>();       // domain exceptions → ProblemDetails
    options.Filters.Add<RequestTimingFilter>();         // logs slow requests > 500ms
})
.AddJsonOptions(opts =>
{
    opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    opts.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddProblemDetails(); // RFC 7807 for unhandled exceptions

// ─── Authentication & Authorization ─────────────────────────────────────────

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        var jwtConfig = builder.Configuration.GetSection("Jwt");
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtConfig["Issuer"],
            ValidAudience            = jwtConfig["Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(
                                           Encoding.UTF8.GetBytes(jwtConfig["SigningKey"]!)),
            ClockSkew                = TimeSpan.FromSeconds(30) // tighten from 5-min default
        };
    });

builder.Services.AddAuthorization(opts =>
{
    opts.AddPolicy("OrderManager", p => p.RequireClaim("role", "order_manager", "admin"));
    opts.AddPolicy("ReadOnly",     p => p.RequireClaim("role", "viewer", "order_manager", "admin"));
});

// ─── Caching ────────────────────────────────────────────────────────────────

var redisConnectionString = builder.Configuration["Redis:ConnectionString"]!;

builder.Services.AddStackExchangeRedisCache(opts =>
    opts.Configuration = redisConnectionString);

builder.Services.AddOutputCache(opts =>
{
    opts.AddBasePolicy(b => b.Cache()); // default: vary by Accept-Encoding
    opts.AddPolicy("ProductCatalog", b => b
        .Tag("products")
        .Expire(TimeSpan.FromMinutes(10))
        .SetVaryByQuery("page", "pageSize", "category"));
});

// ─── Health Checks ───────────────────────────────────────────────────────────

builder.Services.AddHealthChecks()
    .AddCheck("self",        () => HealthCheckResult.Healthy(),     tags: ["live"])
    .AddNpgsql(
        builder.Configuration["Database:ConnectionString"]!,
        name:    "postgres",
        tags:    ["ready", "db"])
    .AddRedis(redisConnectionString,
        name:    "redis",
        tags:    ["ready", "cache"])
    .AddUrlGroup(
        new Uri(builder.Configuration["ExternalServices:PaymentService"]!),
        name:    "payment-svc",
        timeout: TimeSpan.FromSeconds(3),
        tags:    ["ready"]);

// ─── API Versioning + OpenAPI ─────────────────────────────────────────────

builder.Services.AddApiVersioning(opts =>
{
    opts.DefaultApiVersion       = new ApiVersion(1, 0);
    opts.AssumeDefaultVersionWhenUnspecified = true;
    opts.ReportApiVersions       = true;
}).AddApiExplorer(opts =>
{
    opts.GroupNameFormat         = "'v'VVV";
    opts.SubstituteApiVersionInUrl = true;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Order Management API", Version = "v1" });
    c.SwaggerDoc("v2", new() { Title = "Order Management API", Version = "v2" });

    var xmlPath = Path.Combine(AppContext.BaseDirectory,
        $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
    c.IncludeXmlComments(xmlPath);

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header
    });
    c.OperationFilter<BearerAuthOperationFilter>(); // adds lock icon to [Authorize] routes
});

// ─── CORS ────────────────────────────────────────────────────────────────────

builder.Services.AddCors(opts => opts.AddPolicy("spa-clients", p => p
    .WithOrigins("https://admin.mystore.com", "https://app.mystore.com")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials()));

// ─── Kestrel Limits ──────────────────────────────────────────────────────────

builder.WebHost.ConfigureKestrel(opts =>
{
    opts.Limits.MaxRequestBodySize         = 5 * 1024 * 1024; // 5 MB
    opts.Limits.KeepAliveTimeout           = TimeSpan.FromMinutes(2);
    opts.Limits.MaxConcurrentConnections   = 1000;
    opts.Limits.Http2.MaxStreamsPerConnection = 100;
});

// ─── Background Services ─────────────────────────────────────────────────────

builder.Services.AddHostedService<OutboxEventProcessor>();

// ─── Build & Pipeline ────────────────────────────────────────────────────────

var app = builder.Build();

app.UseExceptionHandler();          // RFC 7807 ProblemDetails for all unhandled exceptions
app.UseHttpsRedirection();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseRouting();
app.UseCors("spa-clients");
app.UseAuthentication();
app.UseAuthorization();
app.UseOutputCache();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
        c.SwaggerEndpoint("/swagger/v2/swagger.json", "v2");
    });
}

app.MapControllers();

app.MapHealthChecks("/healthz/live",  new HealthCheckOptions
{
    Predicate      = r => r.Tags.Contains("live"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
}).AllowAnonymous();

app.MapHealthChecks("/healthz/ready", new HealthCheckOptions
{
    Predicate      = r => r.Tags.Contains("ready"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
}).AllowAnonymous();

app.Run();
```

---

## Controller Example: Orders (with filters, caching, versioning)

```csharp
[ApiController]
[Route("api/v{version:apiVersion}/orders")]
[ApiVersion("1.0")]
[Authorize(Policy = "ReadOnly")]
[Produces("application/json")]
[Consumes("application/json")]
public sealed class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IOrderService orders, ILogger<OrdersController> logger)
    {
        _orders = orders;
        _logger = logger;
    }

    /// <summary>Returns a paginated list of orders for the authenticated customer.</summary>
    /// <param name="page">1-based page number.</param>
    /// <param name="pageSize">Items per page (1-100).</param>
    [HttpGet]
    [OutputCache(PolicyName = "ProductCatalog")] // tags allow cache invalidation on write
    [ProducesResponseType(typeof(PagedResult<OrderSummary>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails),            StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetOrdersAsync(
        [FromQuery] int page = 1,
        [FromQuery, Range(1, 100)] int pageSize = 25,
        CancellationToken ct = default)
    {
        var customerId = User.FindFirstValue("sub")
            ?? throw new InvalidOperationException("sub claim missing from JWT");

        var result = await _orders.GetPagedAsync(customerId, page, pageSize, ct);
        return Ok(result);
    }

    /// <summary>Creates a new order. Idempotent when the same Idempotency-Key is provided.</summary>
    [HttpPost]
    [Authorize(Policy = "OrderManager")]
    [ProducesResponseType(typeof(OrderCreatedResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails),        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails),        StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateOrderAsync(
        [FromBody] CreateOrderRequest request,
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        CancellationToken ct = default)
    {
        // [ApiController] has already validated ModelState -- no manual check needed
        var order = await _orders.CreateAsync(request, idempotencyKey, ct);
        return CreatedAtAction(nameof(GetOrdersAsync), new { id = order.Id }, order);
    }
}
```

---

## Options Classes

```csharp
public sealed class DatabaseOptions
{
    [Required, MinLength(10)]
    public string ConnectionString { get; init; } = string.Empty;

    [Range(1, 500)]
    public int MaxPoolSize { get; init; } = 100;

    public TimeSpan CommandTimeout { get; init; } = TimeSpan.FromSeconds(30);
}

public sealed class JwtOptions
{
    [Required] public string Issuer     { get; init; } = string.Empty;
    [Required] public string Audience   { get; init; } = string.Empty;
    [Required, MinLength(32)] public string SigningKey { get; init; } = string.Empty;
    public TimeSpan TokenLifetime { get; init; } = TimeSpan.FromHours(1);
}

public sealed class RedisOptions
{
    [Required] public string ConnectionString { get; init; } = string.Empty;
    public int Database  { get; init; } = 0;
    public TimeSpan ConnectTimeout { get; init; } = TimeSpan.FromSeconds(5);
}
```

---

## Global Exception Filter (Domain Exceptions → ProblemDetails)

```csharp
public sealed class GlobalExceptionFilter : IExceptionFilter
{
    private readonly ILogger<GlobalExceptionFilter> _logger;
    private readonly IProblemDetailsService _problemDetails;

    public GlobalExceptionFilter(
        ILogger<GlobalExceptionFilter> logger,
        IProblemDetailsService problemDetails)
    {
        _logger         = logger;
        _problemDetails = problemDetails;
    }

    public void OnException(ExceptionContext context)
    {
        var (status, title) = context.Exception switch
        {
            EntityNotFoundException e  => (StatusCodes.Status404NotFound,       "Resource not found"),
            ValidationException e      => (StatusCodes.Status400BadRequest,      "Validation failed"),
            ConflictException e        => (StatusCodes.Status409Conflict,        "Conflict"),
            UnauthorizedException e    => (StatusCodes.Status403Forbidden,       "Access denied"),
            _                          => (0, null) // let UseExceptionHandler handle the rest
        };

        if (status == 0) return; // do NOT set context.ExceptionHandled -- rethrow to middleware

        _logger.LogWarning(context.Exception, "Domain exception: {Title}", title);

        context.Result = new ObjectResult(new ProblemDetails
        {
            Status   = status,
            Title    = title,
            Detail   = context.Exception.Message,
            Instance = context.HttpContext.Request.Path
        })
        { StatusCode = status };

        context.ExceptionHandled = true;
    }
}
```

---

## Middleware Pipeline Order Verification

| Position | Middleware | Why Here |
|----------|-----------|----------|
| 1 | `UseExceptionHandler()` | Wraps entire pipeline; catches infrastructure exceptions as ProblemDetails 500 |
| 2 | `UseHttpsRedirection()` | Redirect before any work is done |
| 3 | `UseForwardedHeaders()` | Fixes `Request.Scheme`/`Host` behind reverse proxy before CORS evaluates origin |
| 4 | `UseRouting()` | Endpoint metadata available for CORS policy selection |
| 5 | `UseCors("spa-clients")` | OPTIONS preflight handled before auth rejects it |
| 6 | `UseAuthentication()` | Populates `ClaimsPrincipal` from JWT |
| 7 | `UseAuthorization()` | Evaluates policies after identity is populated |
| 8 | `UseOutputCache()` | Caches authenticated responses per user where appropriate |
| 9 | `MapControllers()` / `MapHealthChecks()` | Terminal middleware -- writes response |

---

## Key Implementation Notes for This Scenario

- The `OutboxEventProcessor` background service should read domain events written to a `outbox_events` PostgreSQL table by EF Core in the same transaction as the business operation. This guarantees at-least-once delivery to the message broker without distributed transactions.
- Output cache policies should use `.Tag("products")` so that `IOutputCacheStore.EvictByTagAsync("products", ct)` can be called from the product write handlers to invalidate catalog caches without a TTL wait.
- The `ClockSkew = TimeSpan.FromSeconds(30)` tightening on JWT validation prevents tokens from being used 5 minutes after expiry (the default). Pair this with a refresh token flow.
- `AllowAnonymous()` on health check endpoints combined with `UseForwardedHeaders()` means the probe endpoints are reachable without credentials but `HttpContext.Request.Scheme` is still populated correctly for logging and HSTS enforcement.
- For Kubernetes deployment: set liveness probe `initialDelaySeconds: 15`, `periodSeconds: 10`, `failureThreshold: 3`. Set readiness probe `initialDelaySeconds: 5`, `periodSeconds: 5`, `failureThreshold: 6`. These values allow PostgreSQL connection pool warm-up (~5s) before traffic is routed to the pod.
