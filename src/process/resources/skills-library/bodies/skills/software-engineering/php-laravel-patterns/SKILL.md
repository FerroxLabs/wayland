---
name: php-laravel-patterns
description: |
  Guides expert-level php laravel patterns implementation: php and frameworks decision frameworks, production-ready patterns, and concrete templates for php laravel patterns workflows.
  Use when the user asks about php laravel patterns, php laravel patterns configuration, or php best practices for php projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "php frameworks backend"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# PHP Laravel Patterns

## When to Use

**Use this skill when:**
- User asks how to structure a Laravel application beyond basic MVC -- service layers, repositories, domain organization
- User wants to implement a specific Laravel pattern such as Repository, Service, Action, DTO, Observer, Policy, or Event-Listener
- User needs guidance on separating business logic from controllers or Eloquent models
- User is building a medium-to-large Laravel application (5+ models, 3+ developers, expected 12+ month lifespan) and needs architectural guidance
- User asks about Eloquent best practices including query scopes, eager loading strategies, model events, or avoiding N+1 problems
- User wants to implement CQRS, Domain-Driven Design, or hexagonal architecture patterns in a Laravel context
- User needs to structure jobs, queues, events, and listeners for a production-grade async workflow
- User asks about testing patterns specific to Laravel -- factories, fakes, mocking Facades, HTTP tests

**Do NOT use this skill when:**
- User needs raw PHP object-oriented design patterns without Laravel context -- use a general PHP OOP skill
- User asks about Laravel installation, environment setup, or basic Artisan commands -- those are onboarding topics
- User is debugging a specific Laravel error unrelated to architecture -- use a debugging skill
- User needs help with a different PHP framework (Symfony, Slim, CodeIgniter) -- check sibling skills
- User is asking about frontend patterns in a Laravel + Livewire or Inertia.js app -- those require their own skill context
- User wants infrastructure configuration (queue workers, Horizon, Octane tuning) -- that is a DevOps/infra concern
- User needs Laravel package development patterns -- that is a distinct topic with its own conventions

---

## Process

### 1. Identify the Layer and Concern Being Addressed

Before recommending any pattern, establish where in the application the problem lives and what type of concern it represents.

- **Controller concern:** Is the controller doing more than receiving input, delegating, and returning a response? If yes, extract to a Service or Action class.
- **Model concern:** Is an Eloquent model accumulating business logic, complex queries, or formatting? Separate query logic into scopes or Repository classes; move business logic to Services.
- **Data transformation concern:** Does the application pass raw Eloquent models across layer boundaries or to external APIs? Introduce DTOs (Data Transfer Objects) or API Resources.
- **Authorization concern:** Is authorization logic scattered across controllers or services? Centralize in Laravel Policies and Gates.
- **Side-effect concern:** Are database writes triggering email sends, cache invalidation, or third-party API calls in the same method? Introduce Events and Listeners or Observers.
- Map the user's problem to one of: Controller, Service, Repository, Model, DTO, Event/Listener, Observer, Policy, Action, Job, or Pipeline.

### 2. Apply the Architecture Selection Decision Tree

The choice of architectural complexity must match the application's actual requirements. Use this decision tree to avoid over-engineering:

- **Simple CRUD app (1-5 developers, <20 models, mostly form-based):** Standard Laravel MVC with fat models is acceptable. Use Eloquent directly in controllers. Add Form Requests for validation.
- **Business logic-heavy app (invoice generation, pricing rules, workflow states):** Introduce a Service Layer. Each Service class handles one business domain. Controllers become thin -- they call one method and return a response.
- **App with multiple data sources or complex query requirements:** Add a Repository layer on top of Eloquent. The Repository interface abstracts the data source; the Eloquent implementation satisfies it.
- **App that will grow over 2+ years with evolving team:** Adopt Action classes (single-responsibility classes, one action per use case). This scales better than Services because it avoids god-service classes.
- **Domain-rich app (finance, healthcare, logistics) needing true isolation:** Consider a DDD-lite approach with bounded contexts organized as Laravel modules or packages within the monorepo.
- Never introduce Repository + Service + DTO + Actions all at once in a greenfield project. Add layers as complexity justifies them.

### 3. Implement the Service Layer Pattern

When business logic extraction is needed, the Service Layer is the most common and maintainable first step.

- Create `app/Services/{Domain}/` directories. Group by business domain, not by technical type. Example: `app/Services/Billing/`, `app/Services/Auth/`, `app/Services/Notifications/`.
- Service class constructors receive dependencies via Laravel's IoC container. Type-hint interfaces, not concrete classes.
- Each public method on a Service should map to exactly one use case. If a method exceeds 30 lines, it is doing too much -- extract helpers or split into sub-methods.
- Services should be stateless across HTTP requests. Never store request data as instance properties; pass it as method arguments.
- Wrap multi-step operations that write to the database in `DB::transaction(function () { ... })`. If any step fails, the entire operation rolls back.
- Return typed values or DTOs from Service methods, never raw Eloquent collections when the caller needs guaranteed structure.
- Register heavy or external-dependency services against an interface in `AppServiceProvider::register()` so they can be swapped in tests.

### 4. Implement the Repository Pattern Where Appropriate

Repositories are justified when: query logic is duplicated across multiple services, you need to swap data sources, or Eloquent queries are complex enough to warrant isolated testing.

- Define an interface in `app/Repositories/Contracts/UserRepositoryInterface.php`. The interface should declare only the methods the application actually needs -- not a full CRUD grid by default.
- Create an Eloquent implementation in `app/Repositories/Eloquent/EloquentUserRepository.php` that implements the interface.
- Bind the interface to the implementation in a `RepositoryServiceProvider` or `AppServiceProvider`: `$this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class)`.
- Repository methods return Eloquent models, Collections, or Paginator objects -- not raw query builder instances. The caller should not need to call `->get()` after receiving a repository result.
- Repositories handle only data retrieval and persistence. They do NOT send emails, fire events, or contain business rules. Those belong in Services.
- For simple applications, avoid the Repository pattern entirely -- it adds two files and an interface for each model. The overhead is only worth it when the complexity benefit is demonstrable.

### 5. Use Action Classes for Single-Use Case Encapsulation

The Action pattern (popularized by Laravel community members and used in tools like Laravel Jetstream) provides a cleaner alternative to large Service classes.

- Create `app/Actions/{Domain}/CreateInvoice.php`. Each class has a single public method, conventionally named `handle()` or `execute()`.
- Actions receive all inputs as method parameters or as constructor-injected dependencies. They are invokable classes (`__invoke`) when you want to dispatch them similarly to Jobs.
- Use Actions when a use case has a clear entry point, a single outcome, and side effects that should be composed rather than embedded (fire an event at the end, let listeners handle the rest).
- Actions pair naturally with Laravel's `Dispatchable` trait when the same action can run synchronously (web request) or asynchronously (queue). Example:

```php
class ProcessPayout
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly Payout $payout) {}

    public function handle(PayoutService $service): void
    {
        $service->process($this->payout);
    }
}
```

- Actions should not call other Actions directly. Compose complex workflows using Events/Listeners or Pipelines, not action chains.

### 6. Structure Eloquent Models Correctly

Eloquent models are the most abused layer in Laravel applications. Apply these rules consistently.

- **Fillable vs Guarded:** Use `$fillable` explicitly on every model in production code. Never use `$guarded = []` in a model that accepts HTTP input without understanding the mass-assignment risk.
- **Scopes for reusable query logic:** Define local scopes (`scopeActive`, `scopeForUser`) instead of repeating `->where()` chains. For cross-model reuse, use global scopes or traits.
- **Accessors and Mutators:** Use the Laravel 9+ `Attribute` return type cast approach (`protected function fullName(): Attribute`) rather than the older `getFullNameAttribute` / `setFullNameAttribute` convention. The new approach is more explicit and IDE-friendly.
- **Relationships:** Always define both sides of a relationship (if `User hasMany Post`, define `Post belongsTo User`). Always eager load relationships that are always needed: `$with = ['status']`. For conditional eager loading, let the calling code use `->with()`.
- **Avoid N+1:** Use `->with('relationship')` religiously. Enable `Model::preventLazyLoading()` in `AppServiceProvider` for local and staging environments -- it throws an exception on lazy loads, forcing developers to fix them immediately.
- **Model events vs Observers:** Use model events (`creating`, `updated`) for simple, always-on side effects. Use Observers (`app/Observers/`) for complex or multiple side effects -- they are easier to test and disable selectively.
- Keep models under 200 lines. If a model is growing large, extract query scopes to a trait, accessors/mutators to a trait, and relationships into a `{Model}Relationships` trait.

### 7. Implement Form Requests, Policies, and API Resources as First-Class Citizens

These three Laravel features are frequently underused but eliminate entire categories of bugs.

- **Form Requests:** Every controller method that receives user input must use a dedicated Form Request class. The `rules()` method handles validation. The `authorize()` method handles authorization for that specific action. This removes both concerns from the controller entirely.
  - Use `prepareForValidation()` to normalize input (trim whitespace, cast types) before rules run.
  - Use `after()` hooks for cross-field validation that cannot be expressed as a single rule.
  - Never call `$request->validate()` directly in a controller when a Form Request is the right level of abstraction.

- **Policies:** Create a Policy for every Eloquent model that has authorization requirements. Register them in `AuthServiceProvider`. Use `can()` and `cannot()` in blade templates and `$this->authorize()` in controllers.
  - Policies receive the authenticated user and the model instance. Use them instead of hardcoding `$user->role === 'admin'` checks in controllers.
  - For actions that are not model-bound (like creating a new resource), use the `before()` hook in the policy or a Gate definition for global admin bypass.

- **API Resources:** Never return raw Eloquent models or collections from API controllers. Always pass through `JsonResource` or `ResourceCollection` classes. This decouples your database schema from your API contract.
  - Use `whenLoaded()` to conditionally include relationship data only when it was eager loaded -- this prevents accidental N+1 in resource classes.
  - Define `$preserveKeys = true` on ResourceCollections when the caller needs associative access.

### 8. Design Event-Driven Workflows and Queue Patterns

Production Laravel applications depend on properly structured async workflows.

- **Events and Listeners:** Dispatch a domain event at the end of every successful Service or Action operation. Example: After `CreateOrder` succeeds, dispatch `OrderCreated`. Listeners handle email, inventory decrement, analytics, and webhook delivery independently.
  - Register events and listeners in `EventServiceProvider::$listen`. Use `php artisan event:list` to audit the event map.
  - Make listeners implement `ShouldQueue` by default unless the action must be synchronous (like sending an OTP code that blocks the response).
  - Set `$queue`, `$delay`, `$tries`, and `$backoff` properties on every queued listener. Do not rely on queue defaults in production.

- **Jobs:** Use Jobs for standalone units of async work. Jobs are appropriate when the work is not triggered by a specific domain event -- batch processing, scheduled tasks, data imports.
  - Use `$this->fail($exception)` in the `failed()` method to emit a failure event for monitoring systems.
  - Implement `ShouldBeUnique` on jobs that must not run concurrently (like syncing a user's external account). Define `uniqueId()` to return the model's primary key.
  - Test Jobs using `Queue::fake()` and assert dispatched jobs with `Queue::assertPushed()`.

- **Pipelines:** Use `Illuminate\Pipeline\Pipeline` for multi-step processes where each step is independently replaceable and the steps share a common data structure (like a request payload object). This is cleaner than chaining method calls.

---

## Output Format

When responding to a user about Laravel patterns, structure your response as follows:

```
## Laravel Pattern Recommendation

### Context Assessment
- Application scale: [Small / Medium / Large / Enterprise]
- Team size: [N developers]
- Layer affected: [Controller / Service / Model / Repository / Event / ...]
- Primary problem: [One sentence description]

### Recommended Pattern(s)
[Pattern name(s) with brief justification for why this pattern fits the context]

### Architecture Decision
| Criterion              | Chosen Approach         | Alternative           | Reason for Choice          |
|------------------------|-------------------------|-----------------------|----------------------------|
| Business logic home    | Service Layer           | Fat Controller        | Testability, reuse         |
| Data access            | Eloquent + Scopes       | Repository Pattern    | Insufficient query complexity |
| Authorization          | Laravel Policies        | Inline role checks    | Centralization, auditability |
| Async side effects     | Events + Queued Listeners | Synchronous callbacks | Decoupling, resilience    |

### Implementation

#### File Structure
app/
├── Actions/
│   └── {Domain}/
│       └── {ActionName}.php
├── Services/
│   └── {Domain}/
│       └── {ServiceName}Service.php
├── Repositories/
│   ├── Contracts/
│   │   └── {Model}RepositoryInterface.php
│   └── Eloquent/
│       └── Eloquent{Model}Repository.php
├── DTOs/
│   └── {DomainName}Data.php
├── Events/
│   └── {DomainEvent}.php
├── Listeners/
│   └── {ListenerName}.php
├── Http/
│   ├── Controllers/
│   ├── Requests/
│   │   └── {Action}{Model}Request.php
│   └── Resources/
│       └── {Model}Resource.php
└── Policies/
    └── {Model}Policy.php

#### Core Code

[Fully implemented PHP classes with real logic, not pseudocode]

#### Binding and Registration

[AppServiceProvider / EventServiceProvider entries]

#### Test Structure

[Feature test and unit test examples using Laravel's testing helpers]

### Trade-offs and Warnings
- [Specific trade-off 1 with threshold or condition]
- [Specific trade-off 2]

### What to Add Next (When Complexity Justifies It)
- [Next layer to add when X condition is met]
```

---

## Rules

1. **Never put business logic in controllers.** Controllers in Laravel are HTTP adapters -- they receive a request, delegate to a Service or Action, and return a response. A controller method should rarely exceed 15 lines. If it does, logic needs extraction.

2. **Never use `$guarded = []` on models that accept web input.** Mass assignment protection exists to prevent attackers from injecting fields like `is_admin`. Always define explicit `$fillable` arrays. Accept the verbosity as a security contract.

3. **Never call `->get()` or `->first()` in a Blade template or API Resource.** These calls hit the database from the presentation layer. All data must be retrieved before it reaches the view. Enable `preventLazyLoading()` in non-production environments to catch violations during development.

4. **Always use `DB::transaction()` for multi-step writes.** Any operation that writes to two or more tables -- create order + decrement inventory + create payment -- must be wrapped in a transaction. Partial writes are a class of silent data corruption bug.

5. **Always set `$tries`, `$timeout`, and `$backoff` on every queued Job and Listener.** The defaults (3 tries, no timeout, immediate retry) are wrong for most production scenarios. A job that calls an external payment API should have `$tries = 3`, `$timeout = 30`, and exponential `$backoff = [10, 60, 300]` seconds.

6. **Never return raw Eloquent models from API controllers.** Database schema changes should not break API consumers. API Resources are the contract layer between your storage model and your public interface. This rule applies even when the Resource is temporarily a one-to-one mapping of the model.

7. **Repository interfaces must only declare methods actually called by the application.** Do not create `findAll`, `findById`, `findByEmail`, `save`, `delete`, `update` as a reflex. Each unused interface method is dead code that future developers must maintain and mock in tests.

8. **Never dispatch Events inside database transactions.** If an Event triggers a queued Listener that reads the newly written data before the transaction commits, the Listener will find nothing. Dispatch events after the transaction using the `DB::afterCommit()` callback or the `ShouldDispatchAfterCommit` interface on the Listener.

9. **Form Request `authorize()` must return a real authorization check, never just `true`.** Returning `true` from `authorize()` is a commonly copied anti-pattern. Every Form Request that accepts user data must validate that the authenticated user has permission to perform that action on that resource.

10. **Avoid Eloquent model events for side effects in multi-tenant or batch contexts.** Model events (`creating`, `saved`) fire on every model write including seeders, imports, and test factories. Use Observers with a `withoutObservers()` guard or fire explicit events from Service/Action classes so you control when side effects trigger.

---

## Edge Cases

### Legacy Codebase With Fat Controllers

When introducing patterns to a Laravel app with 200-line controller methods and no service layer:

- Do not refactor existing controllers until you touch them for a feature change. The rule is: "Leave it better than you found it" per Boy Scout Rule -- not "rewrite everything first."
- Start by extracting Form Requests for new endpoints. This requires zero changes to existing controller logic.
- When modifying an existing controller method, extract the business logic into a new Service class and call it from the original location. The controller method signature does not change from the route's perspective.
- Use `php artisan make:test --feature ControllerNameTest` to write a feature test covering the current behavior before refactoring. This test is your regression net.
- Do not introduce a Repository layer during this phase. The complexity cost is too high when you are also extracting service logic. Repository adoption should be a separate, later decision.

### Eloquent Relationship Performance in High-Volume APIs

For APIs serving 1000+ requests/minute with complex Eloquent relationships:

- Profile with Laravel Telescope or Debugbar to find N+1 queries. Any route showing 10+ queries where 2-3 are expected is a candidate for eager loading review.
- Use `->select(['id', 'name', 'email'])` explicitly on relationships being loaded to prevent fetching unused columns. On a table with 40 columns, this can reduce memory usage by 60-70%.
- For read-heavy endpoints, consider caching the entire API Resource response with `Cache::remember("user:{$id}", 300, fn() => new UserResource($user))`. Invalidate the cache in the relevant Observer or Listener.
- Replace `->with('orders')` with `->with(['orders' => fn($q) => $q->latest()->limit(5)])` when you only need a subset of a large relationship. Loading 500 orders to display the latest 5 is a frequent performance mistake.
- When a single API response requires data from 5+ tables, consider a dedicated read model (a database view or a denormalized summary table) and a separate Eloquent model pointing to it.

### Multi-Tenant Applications

When a Laravel app serves multiple tenants sharing the same database:

- Use a Global Scope on every tenant-owned model to automatically append `WHERE tenant_id = ?` to every query. Register the scope in the model's `booted()` method.
- In Service classes, always inject the current tenant context rather than reading it from a static or global. This makes testing individual tenant scenarios straightforward.
- Apply `withoutGlobalScopes()` only in administrative Service classes that explicitly need cross-tenant access. Document every such callsite with a comment explaining why the scope bypass is intentional.
- Queue Jobs that belong to a specific tenant must serialize and restore the tenant context. Use a `TenantAwareJob` base class that sets the tenant in `handle()` before executing the job's logic.
- Never use auto-incrementing IDs in URLs in multi-tenant systems -- use UUIDs or ULIDs to prevent tenant A from guessing tenant B's resource IDs. Set `use HasUlids` on all tenant-owned models.

### Event/Listener Ordering and Dependency

When multiple Listeners respond to the same Event and order matters:

- Use Listener `$priority` property (higher number runs first) only when order is genuinely required. If two Listeners must run in sequence, consider whether they should actually be a single Listener calling a Service that orchestrates both actions.
- For truly sequential workflows (step 1 must complete before step 2 runs), use Laravel's Pipeline instead of chained Events/Listeners. Each Pipeline stage is independently testable.
- When a queued Listener fails after 3 retries, its work is lost unless you configure a `failed_jobs` table and monitor it. Always add `php artisan queue:failed` monitoring to your production alerting.
- Avoid circular Events: Service A fires EventA, Listener fires EventB, another Listener fires EventA again. This is a silent infinite loop in queued contexts and an immediate stack overflow in synchronous contexts. Map your event dependency graph before adding a new Listener.

### Testing Patterns With Mocked Dependencies

When unit-testing Service classes that have external dependencies:

- Bind service interfaces in `AppServiceProvider` so tests can swap them with `$this->app->instance(UserRepositoryInterface::class, new InMemoryUserRepository())`.
- Use Laravel's `Http::fake()` for outbound HTTP calls made inside Services. Never make real HTTP calls in unit or feature tests.
- Use `Storage::fake()` to prevent actual disk writes during tests involving file uploads or exports.
- Use `Mail::fake()`, `Notification::fake()`, `Event::fake()`, and `Queue::fake()` to assert that the correct side effects were triggered without executing them. These fakes are assertions, not just mocks.
- For complex query testing, seed the test database with Factories that define named states: `UserFactory::new()->suspended()->withTeam()->create()`. Named states make test setup readable and explicit.

### DTO and Type Safety Across Layer Boundaries

When introducing Data Transfer Objects to replace passing arrays:

- Use PHP 8.1+ readonly properties for DTOs: `public function __construct(public readonly string $email, public readonly Money $amount) {}`. Readonly DTOs are immutable by definition, eliminating entire classes of mutation bugs.
- Create static factory methods on DTOs to construct from Eloquent models, HTTP requests, or external API responses: `CreateOrderData::fromRequest(CreateOrderRequest $request): self`.
- Do not use DTOs as a replacement for Eloquent models in the persistence layer. DTOs carry data across layer boundaries; Eloquent models are your persistence interface. Pass DTOs into Service methods; let the Service use them to hydrate or query Eloquent models.
- When a DTO must be serializable for queue transport, use `Spatie\LaravelData` or manually implement `JsonSerializable`. Raw PHP objects are not safely serializable across deploys when queues persist between code deployments.

---

## Example

**Input:** "I'm building a billing module for a SaaS app. When a user upgrades their subscription, I need to: charge their payment method, update the subscription record, send a confirmation email, and log the event for analytics. The team is 4 developers, we've been using fat controllers so far, and I want to start introducing proper patterns. What's the right approach?"

**Output:**

## Laravel Pattern Recommendation

### Context Assessment
- Application scale: Medium (SaaS with growing billing complexity)
- Team size: 4 developers
- Layer affected: Controller, Service, Events/Listeners, Model
- Primary problem: Multi-step transactional operation with sync and async side effects mixed inside a controller

### Recommended Patterns
- **Service Layer** for the orchestration of the upgrade operation (transactional boundary)
- **Action Class** for the discrete charge step (wraps external payment API call)
- **Events + Queued Listeners** for email and analytics (decoupled async side effects)
- **Form Request** for input validation and authorization
- **API Resource** for the response contract

**Not recommended yet:** Repository pattern. The subscription queries are not complex enough to justify it. Add it if query logic duplicates across 3+ services.

### Architecture Decision

| Criterion              | Chosen Approach              | Alternative              | Reason for Choice                               |
|------------------------|------------------------------|--------------------------|--------------------------------------------------|
| Orchestration          | UpgradeSubscriptionService   | Fat Controller           | Testability, reuse from CLI/webhook contexts     |
| Payment charge step    | ChargePaymentMethod Action   | Inline in Service        | External API call deserves isolated class        |
| DB transaction         | DB::transaction()            | No transaction           | 3 writes must be atomic                          |
| Email delivery         | Queued Listener              | Mail::send() in Service  | Decoupling, retry capability, non-blocking       |
| Analytics logging      | Queued Listener              | Synchronous DB insert    | Analytics failure must not affect upgrade result |
| Authorization          | Form Request + Policy        | Inline controller check  | Centralized, testable                            |

### File Structure

```
app/
├── Actions/
│   └── Billing/
│       └── ChargePaymentMethod.php
├── Services/
│   └── Billing/
│       └── SubscriptionService.php
├── Events/
│   └── SubscriptionUpgraded.php
├── Listeners/
│   ├── SendUpgradeConfirmationEmail.php
│   └── LogUpgradeAnalyticsEvent.php
├── Http/
│   ├── Controllers/
│   │   └── SubscriptionController.php
│   ├── Requests/
│   │   └── UpgradeSubscriptionRequest.php
│   └── Resources/
│       └── SubscriptionResource.php
└── Policies/
    └── SubscriptionPolicy.php
```

### Core Code

#### Form Request -- Input Validation and Authorization

```php
<?php

namespace App\Http\Requests;

use App\Models\Subscription;
use Illuminate\Foundation\Http\FormRequest;

class UpgradeSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $subscription = $this->route('subscription');
        return $this->user()->can('upgrade', $subscription);
    }

    public function rules(): array
    {
        return [
            'plan_id'           => ['required', 'string', 'exists:plans,id'],
            'payment_method_id' => ['required', 'string', 'max:255'],
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge([
            'plan_id'           => trim($this->plan_id ?? ''),
            'payment_method_id' => trim($this->payment_method_id ?? ''),
        ]);
    }
}
```

#### Policy -- Authorization Logic

```php
<?php

namespace App\Policies;

use App\Models\Subscription;
use App\Models\User;

class SubscriptionPolicy
{
    public function upgrade(User $user, Subscription $subscription): bool
    {
        // Only the subscription owner can upgrade
        // Block if already on the highest plan
        return $subscription->user_id === $user->id
            && ! $subscription->isOnMaxPlan();
    }
}
```

#### Action -- Payment Charge (Isolated External API Call)

```php
<?php

namespace App\Actions\Billing;

use App\DTOs\ChargeResult;
use App\Exceptions\PaymentFailedException;
use App\Models\Subscription;
use App\Services\External\PaymentGateway;

class ChargePaymentMethod
{
    public function __construct(private readonly PaymentGateway $gateway) {}

    public function execute(
        Subscription $subscription,
        string $paymentMethodId,
        int $amountCents
    ): ChargeResult {
        $result = $this->gateway->charge([
            'customer_id'       => $subscription->user->gateway_customer_id,
            'payment_method_id' => $paymentMethodId,
            'amount'            => $amountCents,
            'currency'          => 'usd',
            'idempotency_key'   => 'upgrade-' . $subscription->id . '-' . now()->timestamp,
        ]);

        if (! $result->succeeded()) {
            throw new PaymentFailedException(
                "Payment declined: {$result->declineCode()}",
                $result->declineCode()
            );
        }

        return ChargeResult::fromGatewayResponse($result);
    }
}
```

#### Service -- Orchestration with Transaction

```php
<?php

namespace App\Services\Billing;

use App\Actions\Billing\ChargePaymentMethod;
use App\Events\SubscriptionUpgraded;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;

class SubscriptionService
{
    public function __construct(
        private readonly ChargePaymentMethod $chargeAction
    ) {}

    public function upgrade(
        Subscription $subscription,
        string $planId,
        string $paymentMethodId
    ): Subscription {
        $plan = Plan::findOrFail($planId);
        $proratedAmount = $this->calculateProratedAmount($subscription, $plan);

        // Charge BEFORE the transaction -- if payment fails, nothing is written
        $chargeResult = $this->chargeAction->execute(
            $subscription,
            $paymentMethodId,
            $proratedAmount
        );

        $upgraded = DB::transaction(function () use ($subscription, $plan, $chargeResult) {
            $subscription->update([
                'plan_id'          => $plan->id,
                'upgraded_at'      => now(),
                'next_billing_date' => now()->addMonth(),
            ]);

            $subscription->payments()->create([
                'amount_cents'      => $chargeResult->amountCents,
                'gateway_charge_id' => $chargeResult->chargeId,
                'status'            => 'succeeded',
            ]);

            return $subscription->fresh(['plan', 'payments']);
        });

        // Dispatch AFTER the transaction commits
        SubscriptionUpgraded::dispatch($upgraded, $chargeResult);

        return $upgraded;
    }

    private function calculateProratedAmount(Subscription $subscription, Plan $plan): int
    {
        $daysRemaining = now()->diffInDays($subscription->next_billing_date);
        $dailyRate = intdiv($plan->price_cents, 30);

        return max(0, $daysRemaining * $dailyRate);
    }
}
```

#### Event

```php
<?php

namespace App\Events;

use App\DTOs\ChargeResult;
use App\Models\Subscription;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubscriptionUpgraded
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Subscription $subscription,
        public readonly ChargeResult $chargeResult
    ) {}
}
```

#### Queued Listener -- Email

```php
<?php

namespace App\Listeners;

use App\Events\SubscriptionUpgraded;
use App\Mail\SubscriptionUpgradedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendUpgradeConfirmationEmail implements ShouldQueue
{
    public string $queue = 'notifications';
    public int $tries = 3;
    public int $timeout = 30;
    public array $backoff = [10, 60, 180];

    public function handle(SubscriptionUpgraded $event): void
    {
        Mail::to($event->subscription->user->email)
            ->send(new SubscriptionUpgradedMail(
                $event->subscription,
                $event->chargeResult
            ));
    }

    public function failed(SubscriptionUpgraded $event, \Throwable $exception): void
    {
        // Alert monitoring -- email failure is non-critical but must be tracked
        logger()->error('Upgrade confirmation email failed', [
            'subscription_id' => $event->subscription->id,
            'error'           => $exception->getMessage(),
        ]);
    }
}
```

#### Controller -- Thin HTTP Adapter

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpgradeSubscriptionRequest;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use App\Services\Billing\SubscriptionService;
use App\Exceptions\PaymentFailedException;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends Controller
{
    public function __construct(private readonly SubscriptionService $service) {}

    public function upgrade(
        UpgradeSubscriptionRequest $request,
        Subscription $subscription
    ): JsonResponse {
        try {
            $upgraded = $this->service->upgrade(
                $subscription,
                $request->validated('plan_id'),
                $request->validated('payment_method_id')
            );

            return SubscriptionResource::make($upgraded)
                ->response()
                ->setStatusCode(200);

        } catch (PaymentFailedException $e) {
            return response()->json([
                'message'      => 'Payment could not be processed.',
                'decline_code' => $e->getDeclineCode(),
            ], 422);
        }
    }
}
```

#### EventServiceProvider Registration

```php
protected $listen = [
    SubscriptionUpgraded::class => [
        SendUpgradeConfirmationEmail::class,
        LogUpgradeAnalyticsEvent::class,
    ],
];
```

#### Feature Test

```php
<?php

namespace Tests\Feature\Billing;

use App\Events\SubscriptionUpgraded;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\External\PaymentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class UpgradeSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_upgrade_subscription(): void
    {
        Event::fake([SubscriptionUpgraded::class]);

        $this->mock(PaymentGateway::class)
            ->shouldReceive('charge')
            ->once()
            ->andReturn(FakeChargeResult::successful('ch_test_123', 2900));

        $user = User::factory()->withGatewayCustomer()->create();
        $plan = Plan::factory()->create(['price_cents' => 2900]);
        $subscription = Subscription::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->putJson("/api/subscriptions/{$subscription->id}/upgrade", [
                'plan_id'           => $plan->id,
                'payment_method_id' => 'pm_test_visa',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('subscriptions', [
            'id'      => $subscription->id,
            'plan_id' => $plan->id,
        ]);

        $this->assertDatabaseHas('payments', [
            'gateway_charge_id' => 'ch_test_123',
            'status'            => 'succeeded',
        ]);

        Event::assertDispatched(SubscriptionUpgraded::class, function ($event) use ($subscription) {
            return $event->subscription->id === $subscription->id;
        });
    }

    public function test_upgrade_fails_cleanly_when_payment_is_declined(): void
    {
        $this->mock(PaymentGateway::class)
            ->shouldReceive('charge')
            ->once()
            ->andReturn(FakeChargeResult::declined('insufficient_funds'));

        $user = User::factory()->withGatewayCustomer()->create();
        $plan = Plan::factory()->create();
        $subscription = Subscription::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->putJson("/api/subscriptions/{$subscription->id}/upgrade", [
                'plan_id'           => $plan->id,
                'payment_method_id' => 'pm_test_declined',
            ]);

        $response->assertUnprocessable()
            ->assertJsonFragment(['decline_code' => 'insufficient_funds']);

        // Confirm no partial writes occurred
        $this->assertDatabaseMissing('payments', [
            'subscription_id' => $subscription->id,
        ]);
    }
}
```

### Trade-offs and Warnings

- The `ChargePaymentMethod` Action runs outside the DB transaction intentionally. Payment gateway calls must not be inside transactions because the transaction lock duration increases connection pool pressure. If the database write fails after a successful charge, implement an idempotency-key-based reconciliation job that runs nightly to detect and credit mismatched charges.
- The Service class currently has no Repository dependency. If subscription queries begin appearing in 3+ places across the codebase, extract a `SubscriptionRepository` at that point -- not before.
- Queued Listeners will not fire in tests when `Event::fake()` is active. Test Listener behavior in separate, dedicated Listener unit tests, not in the upgrade feature test.

### What to Add Next (When Complexity Justifies It)

- **SubscriptionRepository** -- when subscription queries exceed 3 distinct call sites across multiple Services
- **SubscriptionData DTO** -- when the upgrade method signature grows beyond 4 parameters, bundle them into a readonly DTO
- **Saga / Process Manager** -- if the upgrade workflow grows to 6+ steps with compensating transactions needed on failure (e.g., refund charge if downstream microservice fails)
- **CQRS Read Model** -- if the billing dashboard query becomes slow due to join complexity, create a `SubscriptionSummary` read model populated by the `SubscriptionUpgraded` Listener
