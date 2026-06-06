---
name: ruby-testing-patterns
description: |
  Guides expert-level ruby testing patterns implementation: ruby and testing decision frameworks, production-ready patterns, and concrete templates for ruby testing patterns workflows.
  Use when the user asks about ruby testing patterns, ruby testing patterns configuration, or ruby best practices for ruby projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ruby testing tdd"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Ruby Testing Patterns

## When to Use

**Use this skill when:**
- The user asks how to structure tests for a Ruby application using RSpec, Minitest, or Test::Unit
- The user wants to know when to use mocks vs. stubs vs. fakes vs. spies in Ruby tests
- The user needs guidance on test organization -- unit, integration, and system test boundaries in a Rails or plain Ruby project
- The user is experiencing slow test suite performance and wants concrete optimization strategies
- The user wants to apply TDD or BDD workflows in Ruby and needs specific red-green-refactor guidance
- The user asks about factory patterns for test data using FactoryBot or Fabricator and how to avoid factory bloat
- The user needs to test complex Ruby patterns -- service objects, decorators, value objects, or domain events -- and is unsure of the right isolation strategy
- The user wants to configure CI-specific test tooling for a Ruby project (parallel_tests, test-prof, SimpleCov thresholds)

**Do NOT use this skill when:**
- The user is asking about Ruby performance optimization unrelated to tests -- use the ruby-performance-optimization skill instead
- The user needs help with general Rails architecture and has no testing question -- use the rails-application-architecture skill
- The user is testing JavaScript or TypeScript in a Rails frontend context -- use the javascript-testing-patterns skill
- The user is asking about database schema design or migration strategy, not test data management
- The user needs help setting up a Ruby project from scratch with no testing context -- use the ruby-project-setup skill
- The user is asking about deployment, CI pipeline configuration beyond test execution, or infrastructure

---

## Process

### 1. Identify the Testing Layer and Scope

Before writing any test, determine which layer the code under test lives in and what isolation level is appropriate.

- **Unit tests** cover a single class or method with all external dependencies doubled. Aim for < 5ms per test. These should make up 70-80% of your suite (the base of the pyramid).
- **Integration tests** exercise two or more real collaborators together -- e.g., a service object that writes to a real ActiveRecord model backed by a test database. Aim for < 100ms per test. These should be 15-20% of your suite.
- **System tests** (also called end-to-end or feature tests) drive the full stack including browser via Capybara. These are slow (500ms--5s each) and should be 5-10% of your suite.
- Ask the user: is the code they want to test a pure Ruby class, an ActiveRecord model, a controller, a background job, or an external API client? The answer determines isolation strategy immediately.
- In Rails projects, run `rspec --profile 10` to surface the ten slowest examples. Any unit test taking > 50ms is a signal that a real database, network, or filesystem call is happening when it should not be.

### 2. Choose the Right Testing Framework and Configure It

- **RSpec** is the dominant choice for Rails projects and teams practicing BDD. It provides a rich DSL (`describe`, `context`, `it`, `expect`, `let`, `subject`, `shared_examples`).
- **Minitest** is the right choice when the team values simplicity, fast feedback, and Ruby standard library alignment. It ships with Ruby and has no DSL overhead.
- **Test::Unit** should only be used when maintaining a legacy codebase that already uses it. Do not start new projects with Test::Unit.
- Configure RSpec with a minimal `.rspec` file: `--require spec_helper`, `--format progress`, `--color`. Do not use `--format documentation` in CI -- it produces too much output and slows down log parsing.
- In `spec/spec_helper.rb`, enable `config.order = :random` and set `config.seed` from the environment to reproduce failures: `config.seed = ENV.fetch('RSPEC_SEED', rand(100_000)).to_i`.
- In `spec/rails_helper.rb`, configure `DatabaseCleaner` with `strategy: :transaction` for unit and integration tests, and `strategy: :truncation` only for system tests that cannot run in a transaction due to threading.
- Set `config.use_transactional_fixtures = false` when using DatabaseCleaner to avoid double-rollback bugs.

### 3. Design Your Test Data Strategy

Test data is the most common source of slow, brittle, and hard-to-read tests. Apply a deliberate strategy.

- Use **FactoryBot** as the primary test data tool for Rails projects. Define traits, not separate factories, for variations: `factory :user do; trait :admin do; role { 'admin' }; end; end`.
- Apply the **minimum data principle**: only define attributes in a factory that are required for the model to be valid. Add other attributes in the test itself or in traits. This prevents hidden coupling between tests.
- Prefer `build` over `create` in unit tests -- `build` skips the database write. Only use `create` when the test actually queries the database.
- Use `build_stubbed` for deep object graphs in unit tests. It creates objects that respond like persisted ActiveRecord objects but never touch the database -- associations are stubbed, `id` is a fake integer, `persisted?` returns true.
- In Minitest projects, use plain Ruby fixture files or the `factory_bot` gem -- do not use Rails fixtures (`.yml`) for new test data unless the dataset is truly static reference data (e.g., countries, currencies).
- Avoid **factory abuse**: a factory that chains 5+ associations with `create` causes N+1 writes. Run `FactoryBot.lint` in CI to catch factories that fail validation.
- For read-heavy tests that need large datasets, use database seeding with raw SQL inserts or `activerecord-import` for bulk inserts -- never create 1,000 records one at a time with FactoryBot.

### 4. Apply the Right Test Double Strategy

Ruby's duck typing makes doubles powerful but easy to misuse. Apply these rules precisely.

- **Stub** (method stub via `allow`): Use when the test does not care about whether a method is called, only what it returns. Example: `allow(PaymentGateway).to receive(:charge).and_return(OpenStruct.new(success?: true))`.
- **Mock** (message expectation via `expect`): Use when the test is verifying that a message is sent -- this is the observable behavior. Example: `expect(mailer).to receive(:deliver_now).once`. Do not use mocks for return values you need; combine with `and_return`.
- **Spy** (`have_received` after the fact): Preferred over mocks when using `let` and `subject` because setup runs before expectations. Use `allow(object).to receive(:method)`, run the subject, then `expect(object).to have_received(:method)`.
- **Fake**: A real implementation that is simplified for test use -- e.g., an in-memory job queue, a fake Stripe client that records charges. Fakes are the most powerful double type because they can be tested themselves.
- **Stub external HTTP** with `WebMock` (for low-level net/http stubs) or `VCR` (for recording and replaying real HTTP interactions). Configure `WebMock.disable_net_connect!(allow_localhost: true)` in `spec_helper` to prevent any live HTTP calls in tests.
- Use **verifying doubles** in RSpec (`instance_double`, `class_double`, `object_double`) instead of plain `double`. Verifying doubles check that the methods being stubbed actually exist on the real class, preventing tests from passing against a stale interface.
- Do not stub methods on the object under test. If you find yourself doing `allow(described_class.new).to receive(:internal_method)`, the class has too many responsibilities -- split it.

### 5. Structure Tests for Readability and Maintainability

- Apply the **Arrange-Act-Assert (AAA)** pattern explicitly, with blank lines separating the three sections. In RSpec, use `let` blocks for arrangement, a single-line `subject` or `it` body for the act, and `expect` for assertion.
- Use `described_class` instead of the literal class name inside `describe` blocks. This prevents tests from silently passing after a class rename.
- Use `context` blocks to describe preconditions, not test variations. Good: `context 'when the user has an expired subscription'`. Bad: `context 'test 2'`.
- Keep `it` block descriptions as complete sentences that read naturally: `it 'raises ArgumentError when amount is negative'` not `it 'negative amount'`.
- Apply **shared examples** (`shared_examples_for`, `it_behaves_like`) for behavior that must be consistent across multiple classes -- e.g., all classes that implement a `Serializable` interface. Do not use shared examples to reduce duplication in unrelated tests.
- Limit `before` blocks to setup that is truly universal to every example in the group. Prefer explicit `let` values over mutating state in `before` blocks.
- Use **custom RSpec matchers** for domain concepts that appear in many tests. Writing `expect(result).to be_a_successful_transfer` is more expressive and more stable than comparing a hash of fields.

### 6. Measure and Enforce Coverage

- Use **SimpleCov** with a minimum coverage threshold. Set `SimpleCov.minimum_coverage 90` for greenfield projects, `80` for projects with legacy code. Fail the CI build when coverage drops below the threshold.
- Configure branch coverage (not just line coverage): `SimpleCov.enable_coverage :branch`. Line coverage at 95% can still miss entire branches in conditionals.
- Do not chase 100% line coverage mechanically. Focus on covering all code paths that encode business rules. Utility methods with trivial implementation (e.g., `def name; @name; end`) do not need direct tests -- they are covered by higher-level tests.
- Use **test-prof** to profile factory creation time (`TestProf::FactoryProf`), identify let declaration overhead, and find the most expensive examples. `TestProf` integrates with both RSpec and Minitest.
- Track mutation coverage with **mutant** for critical domain code. Mutant modifies your source code (inserting mutations) and checks that your tests catch the change. A mutation score below 80% on a core domain class indicates undertested behavior.

### 7. Organize the Test Suite for Scalability

- Mirror the `app/` directory structure under `spec/`: `app/services/payment_service.rb` → `spec/services/payment_service_spec.rb`. This makes finding tests trivial.
- Use **tags** to partition long test suites: `RSpec.describe MyClass, :unit do` allows running `rspec --tag unit` for fast feedback. Common tags: `:unit`, `:integration`, `:system`, `:slow`, `:external`.
- Configure **parallel_tests** for CI: `bundle exec parallel_rspec spec/` distributes spec files across CPU cores. Set `ParallelTests.first_is_1 = true` to avoid worker 0 naming confusion in logs.
- For parallel test runs, each worker must use its own database: configure `database.yml` to use `test<%= ENV['TEST_ENV_NUMBER'] %>` as the database name suffix.
- Keep the unit test suite under 60 seconds on a developer's local machine. If it exceeds this, the team will stop running tests before committing.
- Archive slow integration and system tests behind a `--tag ~system` filter so developers can run a fast subset locally without disabling them in CI.

### 8. Apply TDD Workflow in Practice

- Follow the **red-green-refactor** cycle precisely: write a failing test first, write the minimum code to make it pass, then refactor with the test suite green.
- In the red phase, verify the test fails for the right reason. A test that says `expected 1, got nil` is different from `expected 1, got 2` -- the latter means logic exists but is wrong, the former means it does not exist yet.
- In the green phase, use the simplest possible implementation -- even hard-coding a return value. The next red test will force generalization. This is the **Fake It Till You Make It** technique from Kent Beck.
- In the refactor phase, extract duplication, rename variables for clarity, and extract private methods. Never add new behavior during refactor -- run the full test suite before committing.
- Use **outside-in TDD** for features: start with a failing system test that describes the user-visible behavior, then drill down to unit tests for each new class needed to make the system test pass. The system test should be the last to turn green.
- Commit after each successful red-green-refactor cycle. This creates a reviewable history where every commit has a green test suite.

---

## Output Format

When helping a user with Ruby testing patterns, structure your response as follows:

```
## Test Analysis

**Code Under Test:** [class/module name and responsibility]
**Test Layer:** [Unit | Integration | System]
**Framework:** [RSpec | Minitest]
**Key Collaborators:** [list of dependencies the class talks to]

---

## Test Double Strategy

| Collaborator         | Double Type    | Rationale                                      |
|----------------------|----------------|------------------------------------------------|
| [collaborator name]  | instance_double | Verifying double; interface may change         |
| [external service]   | WebMock stub   | Prevents live HTTP calls; response controlled  |
| [database model]     | build_stubbed  | No DB required; full ActiveRecord interface    |

---

## Factory / Fixture Design

```ruby
# Minimum valid factory
factory :[model] do
  [attribute]: [value]  # only what's needed for validity
  
  trait :[variant] do
    [attribute]: [value]
  end
end
```

---

## Test Structure

```ruby
# spec/[path]/[class]_spec.rb
RSpec.describe [ClassName], :[tag] do
  subject(:result) { described_class.new([args]).[method]([params]) }

  let(:[dependency]) { instance_double([CollaboratorClass]) }

  context 'when [precondition]' do
    before do
      allow([dependency]).to receive(:[method]).and_return([value])
    end

    it '[expected behavior as full sentence]' do
      expect(result).[matcher]
    end
  end

  context 'when [error condition]' do
    it 'raises [ErrorClass] with [message]' do
      expect { result }.to raise_error([ErrorClass], /[message pattern]/)
    end
  end
end
```

---

## Coverage Configuration

```ruby
# spec/spec_helper.rb (top of file, before requires)
require 'simplecov'
SimpleCov.start 'rails' do
  enable_coverage :branch
  minimum_coverage line: [threshold], branch: [threshold]
  add_filter '/spec/'
  add_filter '/config/'
  add_group 'Services', 'app/services'
  add_group 'Decorators', 'app/decorators'
end
```

---

## Performance Targets

| Suite Segment     | Max Duration (local) | Max Duration (CI) |
|-------------------|----------------------|-------------------|
| Unit tests        | 60s                  | 90s               |
| Integration tests | 3 min                | 5 min             |
| System tests      | 10 min               | 15 min            |
| Full suite        | 15 min               | 20 min            |

---

## Recommended Improvements

1. [Specific change with filename and line reference]
2. [Specific change with filename and line reference]
```

---

## Rules

1. **Never use `allow_any_instance_of` or `expect_any_instance_of`.** These stub/mock all instances of a class, which hides design problems (too many objects of one type interacting), produces false positives, and breaks when implementation details change. Inject the dependency explicitly and stub the injected object instead.

2. **Never use `let!` (bang) when `let` is sufficient.** `let!` eagerly evaluates during the `before` phase even if the example never uses the value, creating unnecessary database records and slowing every test in the group. Reserve `let!` only for data that must exist before a `before` block with side effects (e.g., records that a hook queries by ID).

3. **Never test private methods directly.** If a private method is complex enough to warrant its own test, it belongs in a separate class. Access private methods only through the public interface. Exception: if you are writing a custom matcher or debugging and need to assert on internal state temporarily -- remove before committing.

4. **Always use `instance_double`, `class_double`, or `object_double` -- never plain `double`.** Plain doubles do not verify method signatures against the real class. A renamed method in the real class will cause a plain double to silently keep passing while the real code is broken.

5. **Never share mutable state between examples.** Instance variables set in `before` blocks, class-level variables mutated in tests, or global state (like `Rails.cache`) must be reset between examples. Configure `DatabaseCleaner`, `WebMock.reset!`, and `Rails.cache.clear` as appropriate in `after` hooks or RSpec support modules.

6. **Keep each example (each `it` block) to a single logical assertion.** Multiple unrelated `expect` calls in one example hide which behavior broke when the test fails. When setup is expensive to repeat, use `aggregate_failures` block to run all assertions and report all failures at once rather than stopping at the first.

7. **Never write tests that depend on execution order.** With `config.order = :random`, any order dependency surfaces as a flaky test. Treat every flaky test as a P1 bug -- a flaky test erodes team confidence in the entire suite within weeks.

8. **Always stub time when testing time-dependent behavior.** Never freeze or manipulate `Time.now` directly. Use `ActiveSupport::Testing::TimeHelpers` (travel, freeze_time) in Rails, or the `timecop` gem in non-Rails projects. Tests that use real system time will fail at midnight, around daylight saving transitions, or in different time zones.

9. **Never use `sleep` in tests.** If a test requires `sleep` to pass, the code under test has a timing dependency that is not properly exposed. Use `Timecop.travel`, asynchronous job testing helpers (like Sidekiq's `Sidekiq::Testing.inline!` mode), or event-based synchronization primitives instead.

10. **Always run the full suite in CI with coverage enforcement and a randomized seed.** Local developer runs may skip slow tests, but CI must run everything. Pin the random seed in CI failure notifications so developers can reproduce locally with `RSPEC_SEED=[seed] bundle exec rspec`. Never merge a PR with a failing or flaky test in CI.

---

## Edge Cases

### Legacy Codebase With No Tests

When inheriting a codebase with zero test coverage, resist the urge to write tests for everything at once.

- Start with **characterization tests**: run the code, observe its actual behavior (even if wrong), and write tests that document what it currently does. These tests prevent regressions while refactoring. They are not assertions about correct behavior -- label them with a comment: `# characterization test`.
- Add `simplecov` immediately and commit the current coverage percentage (likely 0-20%) as the floor. Set the CI threshold to that floor plus 1 percentage point. Every PR must maintain or improve coverage.
- Use the **Mikado Method**: write the test you wish existed, observe what breaks, fix the dependency, recurse. This surfaces the hidden coupling graph of the legacy code.
- Avoid adding FactoryBot to a legacy project that uses fixtures until you have a migration plan. Running both simultaneously causes data conflicts.

### Testing Service Objects and Command Objects

Service objects (classes with a single `call` method) are among the most common Ruby patterns and have specific testing considerations.

- Test the service object's **contract**: inputs, return value, and side effects -- not its implementation steps.
- For services that orchestrate multiple collaborators, use `instance_double` for each collaborator and test the coordination logic: that collaborators receive the right messages with the right arguments.
- For services with database writes, use integration tests (real database) only when the query logic itself is the behavior under test. For business logic above the query level, use unit tests with stubbed repositories.
- Test the failure paths explicitly: when `PaymentGateway.charge` raises `NetworkError`, does `OrderService.call` rollback the database transaction? Test this with `expect { service.call }.to raise_error(NetworkError).and change(Order, :count).by(0)`.

### Testing Background Jobs

Background job tests (Sidekiq, GoodJob, Delayed::Job) require a specific configuration to avoid asynchronous timing issues.

- In unit tests, call the job's `perform` method directly: `MyJob.new.perform(user_id: 1)`. Do not use `MyJob.perform_async` in unit tests -- this enqueues the job and tests nothing about its behavior.
- For integration tests that verify a job is enqueued: use `Sidekiq::Testing.fake!` mode and assert `expect(MyJob.jobs.size).to eq(1)` after the triggering action.
- For full end-to-end job tests: use `Sidekiq::Testing.inline!` which runs the job synchronously in the test process.
- Configure `Sidekiq::Testing.fake!` as the default in `spec_helper` and override with `inline!` only in tests that need it, wrapped in `Sidekiq::Testing.inline! do ... end`.
- Always clear the Sidekiq job queue between tests: add `Sidekiq::Worker.clear_all` to an `after` hook or configure DatabaseCleaner to handle it.

### Testing External API Clients

External HTTP calls must never happen in automated tests. Handle this layer carefully.

- Wrap every external API in an adapter class (e.g., `StripeAdapter`, `TwilioClient`). Unit tests double the adapter; integration tests stub at the HTTP level with WebMock; never run live tests in automated CI.
- Use **VCR cassettes** for integration tests that need realistic HTTP responses. Record cassettes against a sandbox API environment once, commit them to the repo, and replay them in CI. Set `VCR.configure { |c| c.record_mode = :none }` in CI to prevent accidental live calls.
- When VCR cassettes become stale (API changes), the test will fail at cassette playback with a `VCR::Errors::CannotSendRequest` error. This is the correct failure mode -- update the cassette against the sandbox.
- For adapters with complex error handling, test each HTTP error code explicitly: 401 unauthorized, 429 rate limit, 503 service unavailable. Use WebMock to stub these: `stub_request(:post, url).to_return(status: 429, headers: {'Retry-After' => '60'})`.

### Testing ActiveRecord Models

Model tests are frequently over-tested (testing Rails itself) or under-tested (missing business logic).

- Do NOT test that ActiveRecord validations work -- they are Rails internals. DO test custom validation logic in your model: `expect(record.errors[:email]).to include('must be a corporate domain')`.
- Do NOT test associations (`belongs_to`, `has_many`) -- these are Rails conventions. DO test custom scopes and their behavior on real data: `expect(User.active.count).to eq(2)` after creating 3 users with one inactive.
- Test model callbacks only when the callback logic is non-trivial. Use integration-level tests that exercise the full lifecycle (`create`, `update`, `destroy`) rather than mocking the callback mechanism.
- For query optimization tests, use `expect { subject }.to make_database_queries(count: 1)` via the `db-query-matchers` gem to assert that a scope does not produce N+1 queries.

### Flaky Tests and Ordering Dependencies

Flaky tests are among the most damaging things in a test suite. They cause developers to re-run failing tests rather than investigate them, eroding all trust in the suite.

- Run `bundle exec rspec --bisect` when you suspect an ordering dependency. RSpec bisect uses binary search to find the minimum set of examples that reproduces the failure.
- Common causes of flakiness in Ruby: shared mutable class state (class variables, `@@` variables), time-dependent code without time stubs, database state leaking between tests (DatabaseCleaner misconfiguration), race conditions in Capybara system tests (missing `have_text` waits that replace `sleep`).
- For Capybara flakiness, always use Capybara's waiting matchers (`have_text`, `have_css`, `find`) instead of immediately-evaluated methods (`text`, `all`). Capybara's default wait time is 2 seconds; increase to 5 seconds for slow CI environments: `Capybara.default_max_wait_time = 5`.
- Add a flaky test quarantine tag: `it 'does thing', :quarantine do`. Quarantined tests run in CI but failures do not block the build. Each quarantined test gets a GitHub issue. If a test is quarantined for more than 2 weeks without a fix, delete it -- it is providing negative value.

---

## Example

**Input:** "I have a Ruby on Rails service object called `TransferFundsService` that transfers money between two user accounts. It calls a `BankAdapter` to make the external transfer, updates both account balances in the database, and sends a confirmation email. How should I test this?"

**Output:**

## Test Analysis

**Code Under Test:** `TransferFundsService` -- orchestrates a funds transfer between two user accounts
**Test Layer:** Unit (business logic) + Integration (database state after transfer)
**Framework:** RSpec
**Key Collaborators:** `BankAdapter` (external HTTP), `Account` (ActiveRecord), `TransferMailer` (ActionMailer)

---

## Test Double Strategy

| Collaborator      | Double Type                 | Rationale                                                       |
|-------------------|-----------------------------|-----------------------------------------------------------------|
| `BankAdapter`     | `instance_double`           | External HTTP -- must not make live calls; verify interface     |
| `TransferMailer`  | `instance_double`           | Mailer delivery -- side effect to verify, not execute          |
| `Account`         | Real object + test database | Balance update is the core behavior; must verify actual SQL     |

---

## Factory Design

```ruby
# spec/factories/accounts.rb
FactoryBot.define do
  factory :account do
    sequence(:account_number) { |n| "ACC#{n.to_s.rjust(8, '0')}" }
    balance { 1_000.00 }
    currency { 'USD' }
    association :user

    trait :insufficient_funds do
      balance { 0.01 }
    end

    trait :frozen do
      status { 'frozen' }
    end
  end
end
```

---

## Unit Test -- Business Logic (no database)

```ruby
# spec/services/transfer_funds_service_spec.rb
require 'rails_helper'

RSpec.describe TransferFundsService, :unit do
  subject(:service) { described_class.new(from_account: source, to_account: destination, amount: amount, adapter: bank_adapter) }

  let(:source)       { build_stubbed(:account, balance: 500.00) }
  let(:destination)  { build_stubbed(:account, balance: 100.00) }
  let(:amount)       { 150.00 }
  let(:bank_adapter) { instance_double(BankAdapter) }
  let(:mailer)       { instance_double(TransferMailer) }
  let(:mail_message) { instance_double(ActionMailer::MessageDelivery) }

  before do
    allow(TransferMailer).to receive(:confirmation).and_return(mail_message)
    allow(mail_message).to receive(:deliver_later)
  end

  describe '#call' do
    context 'when the bank adapter confirms the transfer' do
      before do
        allow(bank_adapter).to receive(:transfer).with(
          from: source.account_number,
          to:   destination.account_number,
          amount: 150.00,
          currency: 'USD'
        ).and_return({ transaction_id: 'TXN-9912', status: 'settled' })

        allow(source).to receive(:decrement!).with(:balance, 150.00)
        allow(destination).to receive(:increment!).with(:balance, 150.00)
      end

      it 'calls the bank adapter with the correct transfer parameters' do
        service.call

        expect(bank_adapter).to have_received(:transfer).with(
          from: source.account_number,
          to:   destination.account_number,
          amount: 150.00,
          currency: 'USD'
        )
      end

      it 'decrements the source account balance' do
        service.call

        expect(source).to have_received(:decrement!).with(:balance, 150.00)
      end

      it 'increments the destination account balance' do
        service.call

        expect(destination).to have_received(:increment!).with(:balance, 150.00)
      end

      it 'sends a confirmation email to the source account owner' do
        service.call

        expect(TransferMailer).to have_received(:confirmation).with(
          account: source,
          transaction_id: 'TXN-9912',
          amount: 150.00
        )
        expect(mail_message).to have_received(:deliver_later)
      end

      it 'returns a result object with the transaction ID and settled status' do
        result = service.call

        expect(result.transaction_id).to eq('TXN-9912')
        expect(result.status).to eq('settled')
      end
    end

    context 'when the source account has insufficient funds' do
      let(:source) { build_stubbed(:account, :insufficient_funds) }

      it 'raises TransferFundsService::InsufficientFundsError' do
        expect { service.call }.to raise_error(TransferFundsService::InsufficientFundsError, /balance/)
      end

      it 'does not call the bank adapter' do
        service.call rescue nil

        expect(bank_adapter).not_to have_received(:transfer)
      end
    end

    context 'when the source account is frozen' do
      let(:source) { build_stubbed(:account, :frozen) }

      it 'raises TransferFundsService::AccountFrozenError' do
        expect { service.call }.to raise_error(TransferFundsService::AccountFrozenError)
      end
    end

    context 'when the bank adapter raises a network error' do
      before do
        allow(bank_adapter).to receive(:transfer).and_raise(BankAdapter::NetworkError, 'timeout after 30s')
        allow(source).to receive(:decrement!)
        allow(destination).to receive(:increment!)
      end

      it 'does not decrement the source account balance' do
        service.call rescue nil

        expect(source).not_to have_received(:decrement!)
      end

      it 're-raises the error as TransferFundsService::ExternalServiceError' do
        expect { service.call }.to raise_error(TransferFundsService::ExternalServiceError, /timeout/)
      end
    end
  end
end
```

---

## Integration Test -- Database State Verification

```ruby
# spec/services/transfer_funds_service_integration_spec.rb
require 'rails_helper'

RSpec.describe TransferFundsService, :integration do
  subject(:service) do
    described_class.new(
      from_account: source,
      to_account:   destination,
      amount:       150.00,
      adapter:      bank_adapter
    )
  end

  let!(:source)       { create(:account, balance: 500.00) }
  let!(:destination)  { create(:account, balance: 100.00) }
  let(:bank_adapter)  { instance_double(BankAdapter) }

  before do
    allow(bank_adapter).to receive(:transfer).and_return({ transaction_id: 'TXN-0042', status: 'settled' })
    allow(TransferMailer).to receive_message_chain(:confirmation, :deliver_later)
  end

  describe '#call' do
    context 'when the transfer succeeds' do
      it 'reduces the source balance by the transfer amount in the database' do
        expect { service.call }.to change { source.reload.balance }.from(500.00).to(350.00)
      end

      it 'increases the destination balance by the transfer amount in the database' do
        expect { service.call }.to change { destination.reload.balance }.from(100.00).to(250.00)
      end

      it 'performs both balance updates atomically within a single transaction' do
        # Verify that both updates happen; bank failure after first update rolls back both
        call_count = 0
        allow(bank_adapter).to receive(:transfer) do
          call_count += 1
          raise BankAdapter::NetworkError if call_count > 0
        end

        expect { service.call rescue nil }
          .to not_change { source.reload.balance }
          .and not_change { destination.reload.balance }
      end
    end
  end
end
```

---

## Coverage Configuration

```ruby
# spec/spec_helper.rb (top of file)
require 'simplecov'
SimpleCov.start 'rails' do
  enable_coverage :branch
  minimum_coverage line: 92, branch: 85
  add_filter '/spec/'
  add_filter '/config/'
  add_filter '/db/'
  add_group 'Services',    'app/services'
  add_group 'Adapters',    'app/adapters'
  add_group 'Mailers',     'app/mailers'
  add_group 'Models',      'app/models'
end
```

---

## Performance Targets

| Suite Segment     | Max Duration (local) | Max Duration (CI) |
|-------------------|----------------------|-------------------|
| Unit tests        | 60s                  | 90s               |
| Integration tests | 3 min                | 5 min             |
| System tests      | 10 min               | 15 min            |
| Full suite        | 15 min               | 20 min            |

---

## Recommended Improvements

1. Add `spec/support/webmock.rb` with `WebMock.disable_net_connect!(allow_localhost: true)` to prevent any live HTTP calls globally -- the `BankAdapter` unit tests currently rely on discipline rather than enforcement.
2. Add `FactoryBot.lint` to `spec/support/factory_bot.rb` using a `before(:suite)` hook to catch invalid factory definitions before any examples run.
3. Configure `config.order = :random` in `.rspec` and capture the seed in CI output so ordering bugs are discoverable and reproducible.
4. Wrap the `TransferFundsService` integration test's atomicity assertion in `aggregate_failures` if you add more rollback scenarios -- this surfaces all failures rather than stopping at the first `change` matcher.
5. Tag unit specs with `:unit` and integration specs with `:integration` so CI can run `rspec --tag unit` in a fast pre-flight check before running the full suite.
