---
name: ruby-rails-patterns
description: |
  Guides expert-level ruby on rails patterns implementation: ruby and frameworks decision frameworks, production-ready patterns, and concrete templates for ruby rails patterns workflows.
  Use when the user asks about ruby on rails patterns, ruby rails patterns configuration, or ruby best practices for ruby projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ruby frameworks backend"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Ruby Rails Patterns

## When to Use

**Use this skill when:**
- User asks about structuring Rails services, query objects, form objects, presenters, or decorators
- User wants to reduce fat models or fat controllers by extracting business logic into dedicated objects
- User needs to implement background job patterns, event-driven architecture, or pub/sub within a Rails app
- User asks about organizing domain logic across a large Rails monolith or preparing for a modular monolith or service extraction
- User wants guidance on Rails conventions like concerns, callbacks, scopes, and when to break away from them in favor of explicit patterns
- User is asking about testing patterns for Rails -- factories, stubs, integration specs, and avoiding brittle test suites
- User wants to implement multi-tenancy, soft deletes, auditing, or state machine patterns in Rails

**Do NOT use this skill when:**
- User needs help with Rails API design or REST/GraphQL endpoint structure -- check the api-design skill in the backend subcategory
- User is asking about Rails performance tuning or N+1 query elimination -- check the database-query-optimization skill
- User needs frontend architecture patterns (Stimulus, Hotwire, ViewComponent composition) -- check the frontend-rails skill
- User is asking about Ruby language features unrelated to Rails patterns (metaprogramming, Fibers, Ractors) -- check the ruby-language skill
- User needs deployment, containerization, or CI/CD for Rails -- check the rails-devops skill
- User wants authentication/authorization implementation specifics -- check the auth-patterns skill
- User is asking about a non-Rails Ruby framework (Sinatra, Hanami, Grape) -- those have distinct patterns not covered here

---

## Process

### 1. Diagnose the Architectural Problem

Before recommending any pattern, identify the specific pain point:

- **Fat model symptoms:** A model file exceeding 300 lines, more than 10 callbacks, more than 20 methods, or methods that touch external services (mailers, HTTP clients, payment gateways)
- **Fat controller symptoms:** Action methods exceeding 15 lines, controller tests requiring complex setup, or the same logic duplicated across multiple actions or controllers
- **Coupling symptoms:** A test file that requires 5+ `let` blocks and multiple factories just to set up one object, indicating too many responsibilities
- **Leaky abstraction symptoms:** Views directly calling model methods that trigger database queries, or presentational logic living in models
- Ask the user: What is the size of the app (number of models, monthly active users, team size)? This determines which patterns are justified -- a 5-model CRUD app does not need a full service layer.

### 2. Select the Right Pattern for the Problem

Apply this decision framework based on the nature of the logic being extracted:

- **Service Objects (Command pattern):** Use when an action involves multiple models, external calls, or side effects. The canonical rule: if you would name the method `process_`, `create_`, `update_`, or `sync_`, it belongs in a service object. Naming convention: `Users::CreateService`, `Orders::FulfillService`.
- **Query Objects:** Use when a scope or named query grows beyond two chained ActiveRecord methods, requires joins across 3+ tables, or needs to be reused across multiple controllers. Naming: `Users::ActiveInTrialQuery`, `Orders::OverdueQuery`.
- **Form Objects (with ActiveModel):** Use when a form submission touches more than one model, requires custom validations not tied to persistence, or needs to represent a multi-step wizard step. Back each form object with `include ActiveModel::Model` and `include ActiveModel::Attributes`.
- **Presenters / Decorators:** Use when view logic requires conditional formatting, nil-safe chaining, or computed display attributes. Use Draper-style decoration or plain POROs (Plain Old Ruby Objects) -- prefer POROs unless you need collection decoration.
- **Domain Events / Pub-Sub:** Use when an action triggers more than 2 unrelated side effects (e.g., user signs up → send email + create trial + notify Slack). Use `ActiveSupport::Notifications` or a lightweight `EventBus` module rather than adding callback chains.

### 3. Design the Service Object Interface

The service object is the most widely applicable pattern. Follow this interface contract:

- **Class method `.call`:** Every service object exposes a single class-level entry point: `Users::CreateService.call(params:, current_user:)`. This makes it testable without instantiation boilerplate in specs.
- **Return a Result object, not `true/false`:** Define a simple `Result = Struct.new(:success?, :payload, :errors)` or use the `dry-monads` gem's `Result` type for complex flows. Never return raw model instances from services -- callers should not need to inspect the model's `errors` array.
- **Keep the `#call` instance method under 20 lines.** If it exceeds this, extract sub-steps into private methods with descriptive names: `#create_user`, `#send_welcome_email`, `#provision_subscription`.
- **Wrap multi-step operations in a transaction:** Use `ActiveRecord::Base.transaction` with `raise ActiveRecord::Rollback` on failure. Do not rescue `StandardError` inside a transaction block -- it silences legitimate errors.
- **Do not inject the repository (AR model) unless testing demands it.** For most Rails apps, calling `User.create!` directly inside a service is acceptable and less over-engineered than full repository injection.

### 4. Implement Query Objects

Query objects keep controllers thin and scopes from accumulating in models:

- Inherit from a base class or include a module that provides `#call` and returns an ActiveRecord::Relation: the return type must always be a relation, never an array, so callers can chain further.
- Accept optional parameters through the constructor: `Users::ActiveInTrialQuery.new(plan: :growth, days_remaining: 7).call`
- Avoid using `pluck` or `to_a` inside the query object -- leave materialization to the caller.
- Co-locate specs in `spec/queries/` and test with real database records (use `database_cleaner` with truncation strategy for query specs, not transaction strategy, when testing complex joins).
- Compose queries using the merge pattern: `User.where(active: true).merge(Subscription::ExpiringQuery.new.call)` -- this keeps the interface chainable.

### 5. Structure Form Objects and Validations

Form objects decouple your validation logic from persistence:

- Use `include ActiveModel::Model` and `include ActiveModel::Validations` -- do NOT use `ActiveRecord` inheritance for form objects.
- Define attributes explicitly with `attribute :email, :string` using `ActiveModel::Attributes` -- this gives you type coercion and prevents mass-assignment surprises.
- Implement `#save` (not `#persist`) as the public mutation method: it runs `valid?` first and returns `false` on failure, mirroring the AR interface that views and controllers already understand.
- For multi-step wizards, use one form object per step and store intermediate state in the session or a `WizardSession` service backed by a `wizard_sessions` table with a JSON payload column.
- Validate cross-field constraints in form objects, not in model callbacks -- this prevents the infamous "valid? returns false but I only changed one attribute" bug.

### 6. Apply the Pub/Sub Pattern for Side Effects

Replace callback chains with explicit event dispatch:

- Define a central `EventBus` module using `ActiveSupport::Notifications` as the backend:

```ruby
module EventBus
  def self.publish(event_name, payload = {})
    ActiveSupport::Notifications.instrument("app.#{event_name}", payload)
  end

  def self.subscribe(event_name, &block)
    ActiveSupport::Notifications.subscribe("app.#{event_name}") do |*args|
      event = ActiveSupport::Notifications::Event.new(*args)
      block.call(event.payload)
    end
  end
end
```

- Register subscribers in initializers (`config/initializers/event_subscribers.rb`), not in models or controllers.
- Name events in past tense: `user.registered`, `order.fulfilled`, `subscription.cancelled`. This communicates that the event describes something that already happened.
- Each subscriber handles exactly one concern. Never put conditionals inside a subscriber that route to different behaviors -- create separate subscribers.
- For async side effects (sending emails, calling webhooks), have the subscriber enqueue a Sidekiq job rather than performing the work inline. This keeps the request-response cycle fast and makes the side effect retriable.

### 7. Organize Code with Modules and the Modular Monolith Pattern

As apps grow beyond ~20 models, namespace and encapsulate domains:

- Use Rails engines or Ruby modules to create bounded contexts: `Billing::`, `Identity::`, `Inventory::`, `Fulfillment::`. Each namespace owns its models, services, queries, and mailers.
- Enforce boundaries using the `packwerk` gem: define `package.yml` files per domain package and run `packwerk check` in CI to prevent cross-package constant references that violate the dependency graph.
- Place shared infrastructure (ApplicationRecord, ApplicationMailer, ApplicationJob base classes) in an `app/` top-level that all packages can reference.
- Set a rule: packages may depend on shared infrastructure and on sibling packages only through explicitly published APIs (service objects or query objects), never by reaching into another package's models directly.
- Use `zeitwerk` naming conventions strictly -- file paths must match constant paths or autoloading will fail silently in production.

### 8. Validate and Test the Pattern Implementation

Each pattern has a specific testing strategy:

- **Service objects:** Test with unit specs in `spec/services/`. Test the `.call` interface directly. Assert on the returned Result object, not on model state. Test failure paths explicitly -- do not just test the happy path.
- **Query objects:** Test with integration specs against a real database. Use `FactoryBot` to create records matching and not matching the query criteria. Assert on the collection returned, not on SQL strings.
- **Form objects:** Test validations directly: instantiate with invalid params, call `valid?`, and assert on `errors`. Test `#save` with a database transaction that rolls back after each spec.
- **Event/subscriber patterns:** Test that the correct events are published using `expect(EventBus).to receive(:publish).with("user.registered", ...)`. Test subscribers in isolation by calling the handler block directly.
- Target: service object specs should run in under 0.1 seconds each (no Rails boot if using `--require spec_helper` only). Query specs will be slower (DB) -- isolate them so the fast suite stays fast.

---

## Output Format

When advising a user on a Rails pattern, structure output as follows:

```
## Pattern Recommendation: [Pattern Name]

### Problem Diagnosed
[1-3 sentences describing the specific anti-pattern or pain point being addressed]

### Recommended Pattern: [e.g., Service Object + Result Type]

### Interface Contract
[Method signatures and return types]

### Implementation

```ruby
# File: app/services/[namespace]/[name]_service.rb
# [Complete, runnable code -- not pseudocode]
```

### Usage in Controller

```ruby
# File: app/controllers/[controller].rb
# [How the controller delegates to the pattern]
```

### Spec Template

```ruby
# File: spec/services/[namespace]/[name]_service_spec.rb
# [Minimal but complete test coverage showing happy path + failure path]
```

### Trade-offs
| Concern           | This Pattern     | Alternative              |
|-------------------|------------------|--------------------------|
| Testability       | High -- isolated unit | Lower -- requires AR   |
| Complexity        | Moderate         | Low (fat model)          |
| Team familiarity  | Requires ramp-up | Familiar Rails idiom     |
| LOC overhead      | ~30 lines/service| 0 (inline in model)      |

### When to Revisit
[Specific signal that means this pattern is no longer the right fit]
```

---

## Rules

1. **Never use `before_save` or `after_create` callbacks for business logic.** Callbacks are appropriate only for data normalization (e.g., `before_validation :strip_email_whitespace`) or cache invalidation. Business logic in callbacks is invisible to callers, fires in unexpected contexts (seeds, fixtures, console operations), and makes testing nightmarish. Extract to a service object instead.

2. **Never return `nil` from a service object.** Always return a Result object or raise a typed exception. Callers that receive `nil` from a service resort to `nil` checks scattered through the codebase, which is indistinguishable from a missing value vs. a failed operation.

3. **Never define more than 3 named scopes on a model that involve joins.** Scopes with joins leak SQL into model definitions and compose poorly. When you have 3+ join-heavy scopes, extract them all into a Query Object. Simple attribute scopes (`scope :active, -> { where(active: true) }`) are acceptable to keep on the model.

4. **Never put conditional presentation logic in model methods.** Methods like `def display_name; full_name.present? ? full_name : email; end` belong in a presenter or decorator, not the model. Models accumulate these methods and eventually return HTML strings or depend on view helpers -- a serious SRP violation.

5. **Never define a service object that accepts an ActiveRecord model instance and then calls `.save` on it.** This makes the service object responsible for persistence in an opaque way. Either the service creates/updates via the model's class methods (and owns the full lifecycle) or it only contains logic and the controller/caller handles persistence.

6. **Never skip the `valid?` check before calling `.save` in a form object.** Many form object implementations call `#save` and only surface errors after a failed DB write. Always validate first: `return false unless valid?` as the first line of `#save`.

7. **Always namespace service objects by domain, not by action type.** `Services::CreateUser` is worse than `Users::CreateService` -- the former creates a flat `Services/` directory of hundreds of files, the latter groups related operations and scales as the domain grows.

8. **Never use `rescue Exception`** inside a service object or anywhere in application code. This catches `SignalException` (Ctrl-C), `NoMemoryError`, and `SystemExit`, which will cause processes to hang or data to corrupt. Always rescue specific exception classes.

9. **Always make Query Objects return an `ActiveRecord::Relation`, never an Array.** Returning an array breaks chainability, forces eager loading at the wrong time, and prevents callers from adding pagination (`.page(1).per(25)`), ordering, or additional scopes without rewriting the query.

10. **When adding the pub/sub pattern to an existing app, start with one domain only.** Attempting to refactor all callbacks to events in one pass is a high-risk big-bang migration. Pick the domain with the most callback pain (typically `User` or `Order`), migrate it, run in production for 2 weeks, then expand. This gives you real evidence of failure modes before they spread.

---

## Edge Cases

### Fat Model with Deep Callback Chains

When a model has 8+ callbacks, removing them safely requires a specific sequence to avoid regressions:

- First, audit every callback with `grep -n "after_\|before_\|around_" app/models/user.rb` and document what each one does and when it fires.
- Add integration specs that cover the side effects of each callback BEFORE making any changes -- these become your regression suite.
- Extract callbacks one at a time into service objects. For `after_create` callbacks, wrap the creation call in a service: the service calls `User.create!` and then performs the side effect explicitly after the record is saved.
- For `before_validation` callbacks used for normalization, keep them -- this is their legitimate use case.
- Do NOT remove a callback from the model until the service object is the only code path that creates or updates that model in production. If seeds, console scripts, or other services also touch the model, the side effect will silently stop firing.

### Multi-Tenancy Scoping

When implementing multi-tenancy alongside service objects and query objects:

- Tenant scope should be injected as a parameter, not inferred from `Current.tenant` inside the service. Services that read from `Current.*` thread-local state are untestable in concurrent contexts and fail silently when called from background jobs (where `Current` is not set).
- Pattern: `Orders::FulfillService.call(order_id: id, tenant: current_tenant)`. The service uses `tenant.orders.find(order_id)` to scope its queries, never `Order.find(order_id)`.
- Add a base query object that all tenant-scoped queries inherit from: it accepts `tenant:` in the constructor and always prepends `.where(tenant_id: tenant.id)` to any relation it returns.
- In specs, always test that a service object raises or returns an error when given an order belonging to a different tenant. This is the most common multi-tenancy security regression.

### State Machine Complexity

When a model has more than 3 lifecycle states and transitions:

- Do not implement state transitions as plain string attribute updates. Use the `state_machines-activerecord` or `aasm` gem -- but encapsulate ALL transition calls inside service objects, never call `order.fulfill!` directly from controllers.
- Define guard clauses as separate predicate methods on the model (`def can_fulfill?`) and test them independently. Do not embed complex conditionals inside the state machine's `guard:` lambda.
- When a transition fails (guard not met), the gem raises an exception. Catch the specific exception in the service object and return a failure Result with a user-friendly message. Never let state machine exceptions propagate to the controller unhandled.
- For state history/audit trail, use the `paper_trail` gem with `only:` limited to the state column -- do not track every attribute if your model has 30+ columns; it creates enormous `versions` table bloat (the `object` JSON column stores the full serialized record).

### Background Job Integration with Service Objects

When service logic needs to run asynchronously:

- Never pass an ActiveRecord object to a Sidekiq job as an argument. Pass the ID only: `Users::WelcomeEmailJob.perform_later(user_id: user.id)`. The job re-fetches the record. Passing an AR object serializes it to YAML (legacy) or JSON, which contains stale data and causes subtle bugs.
- The job's `#perform` method should contain one line: instantiate and call the service object. Keep all logic in the service, not in `#perform`. This makes the service testable without an ActiveJob harness.
- For jobs that should run at most once per record per event (idempotency), add a `processed_at` timestamp or use a Redis-based lock with `redis-mutex` or Sidekiq Enterprise's unique jobs. Without idempotency, retry logic will double-send emails or double-charge payments.
- Set queue depths and timeouts explicitly. A service that calls an external API should have a job timeout of 30 seconds maximum -- without it, a slow API will exhaust your worker pool.

### Extracting to a Modular Monolith Mid-Project

When refactoring an existing flat Rails app into bounded contexts:

- Do not move files to new directories on the first pass. First, add the namespace constant only (rename `User` to `Identity::User` with `require` aliases) and verify the app boots and tests pass. Moving files and renaming constants simultaneously doubles the merge conflict surface area.
- Use `packwerk` in "check" mode (non-blocking) for the first 4 weeks to identify violations without breaking CI. Only switch to blocking mode after you have resolved more than 80% of existing violations.
- Create package boundaries based on team ownership, not just conceptual grouping. If the same 2 engineers own billing and subscriptions, putting them in separate packages creates unnecessary API overhead with no organizational benefit.
- Define a "strangler fig" migration: new features are always built inside packages, existing code is only moved when it needs to be modified for other reasons. This avoids the "big refactor sprint" that never gets prioritized.

### Presenter and Decorator Performance

When decorating collections in views:

- Never call `collection.map { |item| ItemPresenter.new(item) }` inside a view -- this allocates N presenter objects and is not lazy. Use a `CollectionPresenter` or decorate lazily with Enumerator.
- If using Draper, be aware that `User.all.decorate` calls `to_a` on the relation, loading all records into memory. Always paginate before decorating: `User.page(1).per(25).decorate`.
- Presenters that call additional database queries (e.g., `def related_orders; user.orders.recent.limit(5); end`) cause N+1 problems when rendered in a list. Either eager-load the association before decoration or use a specific query object that batch-loads for the collection.
- Benchmark decorator overhead: in a response rendering 100 decorated objects with 10 presenter methods each, you are making 1000 method calls per request. Profile with `rack-mini-profiler` before assuming this is acceptable at scale.

---

## Example

**Input:** "Our `Order` model is 450 lines long. It has `after_create` callbacks for sending confirmation emails and creating an audit log entry, `before_save` for recalculating the total, and a `process_payment!` method that calls Stripe. Our controller's `create` action is also 40 lines. How do we clean this up?"

**Output:**

## Pattern Recommendation: Service Object + Query Object + Pub/Sub Event

### Problem Diagnosed

The `Order` model has at least three distinct responsibilities: persistence and domain logic, payment processing (external I/O), and triggering side effects (email, audit). The fat controller is a symptom of the model not providing a clean service interface. The `before_save` recalculation callback will fire during seeds, console operations, and test factories -- likely causing test flakiness already.

---

### Step 1 -- Extract `Orders::FulfillService`

```ruby
# app/services/orders/fulfill_service.rb
module Orders
  class FulfillService
    Result = Struct.new(:success?, :order, :errors, keyword_init: true)

    def self.call(order_params:, user:)
      new(order_params: order_params, user: user).call
    end

    def initialize(order_params:, user:)
      @order_params = order_params
      @user = user
    end

    def call
      ActiveRecord::Base.transaction do
        order = build_order
        return failure(order.errors.full_messages) unless order.save

        charge = process_payment(order)
        return failure([charge.error_message]) unless charge.success?

        order.update!(
          stripe_charge_id: charge.id,
          fulfilled_at: Time.current
        )

        EventBus.publish("order.fulfilled", order_id: order.id, user_id: @user.id)

        Result.new(success?: true, order: order, errors: [])
      end
    rescue Stripe::CardError => e
      Result.new(success?: false, order: nil, errors: [e.message])
    end

    private

    def build_order
      Order.new(@order_params.merge(user: @user, total: calculate_total))
    end

    def calculate_total
      # Moved from before_save -- called explicitly, not via callback
      @order_params[:line_items].sum { |item| item[:quantity] * item[:unit_price] }
    end

    def process_payment(order)
      Stripe::PaymentProcessor.charge(
        amount: (order.total * 100).to_i, # Stripe expects cents
        currency: "usd",
        customer: @user.stripe_customer_id,
        description: "Order ##{order.id}"
      )
    end

    def failure(messages)
      raise ActiveRecord::Rollback
      Result.new(success?: false, order: nil, errors: messages)
    end
  end
end
```

---

### Step 2 -- Replace Callbacks with Event Subscribers

Remove the `after_create` callbacks from `Order` and register subscribers:

```ruby
# config/initializers/event_subscribers.rb
EventBus.subscribe("order.fulfilled") do |payload|
  Orders::SendConfirmationEmailJob.perform_later(order_id: payload[:order_id])
end

EventBus.subscribe("order.fulfilled") do |payload|
  Audit::LogOrderFulfillmentJob.perform_later(
    order_id: payload[:order_id],
    user_id: payload[:user_id]
  )
end
```

Each job delegates to a dedicated service:

```ruby
# app/jobs/orders/send_confirmation_email_job.rb
class Orders::SendConfirmationEmailJob < ApplicationJob
  queue_as :default
  sidekiq_options retry: 3, dead: false

  def perform(order_id:)
    order = Order.find(order_id)
    OrderMailer.confirmation(order).deliver_now
  end
end
```

---

### Step 3 -- Slim the Controller

```ruby
# app/controllers/orders_controller.rb
class OrdersController < ApplicationController
  def create
    result = Orders::FulfillService.call(
      order_params: order_params,
      user: current_user
    )

    if result.success?
      redirect_to order_path(result.order), notice: "Order placed successfully."
    else
      flash.now[:alert] = result.errors.join(", ")
      render :new, status: :unprocessable_entity
    end
  end

  private

  def order_params
    params.require(:order).permit(:shipping_address, line_items: [:product_id, :quantity, :unit_price])
  end
end
```

Controller is now 18 lines. It knows nothing about Stripe, email, or audit logging.

---

### Step 4 -- Remove the `before_save` Callback from the Model

```ruby
# app/models/order.rb
class Order < ApplicationRecord
  belongs_to :user
  has_many :line_items

  # REMOVED: before_save :recalculate_total
  # Total is now calculated explicitly in Orders::FulfillService#calculate_total
  # and in Orders::UpdateService when an order is modified post-creation.

  validates :total, numericality: { greater_than: 0 }
  validates :user, presence: true
end
```

The model drops to a clean ~50 lines: associations, validations, and nothing else.

---

### Spec Template

```ruby
# spec/services/orders/fulfill_service_spec.rb
RSpec.describe Orders::FulfillService do
  let(:user) { create(:user, stripe_customer_id: "cus_test123") }
  let(:product) { create(:product, price: 29.99) }
  let(:order_params) do
    {
      shipping_address: "123 Main St",
      line_items: [{ product_id: product.id, quantity: 2, unit_price: 29.99 }]
    }
  end

  describe ".call" do
    context "when payment succeeds" do
      before do
        allow(Stripe::PaymentProcessor).to receive(:charge).and_return(
          double(success?: true, id: "ch_test456", error_message: nil)
        )
      end

      it "returns a successful result" do
        result = described_class.call(order_params: order_params, user: user)
        expect(result.success?).to be true
        expect(result.order).to be_persisted
      end

      it "sets the total correctly" do
        result = described_class.call(order_params: order_params, user: user)
        expect(result.order.total).to eq(59.98) # 2 * 29.99
      end

      it "publishes the order.fulfilled event" do
        expect(EventBus).to receive(:publish).with("order.fulfilled", hash_including(:order_id))
        described_class.call(order_params: order_params, user: user)
      end
    end

    context "when payment fails" do
      before do
        allow(Stripe::PaymentProcessor).to receive(:charge)
          .and_raise(Stripe::CardError.new("Your card was declined.", nil))
      end

      it "returns a failure result" do
        result = described_class.call(order_params: order_params, user: user)
        expect(result.success?).to be false
        expect(result.errors).to include("Your card was declined.")
      end

      it "does not persist the order" do
        expect {
          described_class.call(order_params: order_params, user: user)
        }.not_to change(Order, :count)
      end

      it "does not publish events" do
        expect(EventBus).not_to receive(:publish)
        described_class.call(order_params: order_params, user: user)
      end
    end
  end
end
```

---

### Trade-offs

| Concern | Service Object + Events | Original Fat Model |
|---|---|---|
| Testability | High -- Stripe is stubbed, no DB needed for unit | Low -- requires real AR, callbacks fire unexpectedly |
| Controller LOC | 18 lines | 40+ lines |
| Side effect visibility | Explicit in initializer | Hidden in callback chain |
| Onboarding clarity | Read service to understand flow | Must trace callbacks across file |
| Complexity overhead | ~80 LOC across 3 new files | 0 new files (accumulates in place) |
| Transaction safety | Explicit rollback on payment failure | Depends on callback order |

---

### When to Revisit

If `Orders::FulfillService` grows beyond 80 lines, extract payment processing into `Payments::ChargeService` and have `FulfillService` call it. If the number of `order.fulfilled` subscribers exceeds 6, consider switching from `ActiveSupport::Notifications` to a proper message queue (Sidekiq's batch callbacks or a dedicated `EventStore`) to get retry guarantees and observability per subscriber independently.
