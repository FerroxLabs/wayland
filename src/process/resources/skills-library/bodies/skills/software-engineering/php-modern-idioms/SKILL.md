---
name: php-modern-idioms
description: |
  Guides expert-level php modern idioms implementation: php and best-practices decision frameworks, production-ready patterns, and concrete templates for php modern idioms workflows.
  Use when the user asks about php modern idioms, php modern idioms configuration, or php best practices for php projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "php best-practices clean-code"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# PHP Modern Idioms

## When to Use

**Use this skill when:**
- The user is writing or reviewing PHP 8.0+ code and wants to apply idiomatic patterns -- named arguments, match expressions, nullsafe operators, fibers, enums, readonly properties, intersection types, first-class callables, and constructor property promotion
- The user is migrating a PHP 7.x codebase to PHP 8.x and needs to know which legacy patterns to replace and how to replace them systematically
- The user asks how to eliminate verbose boilerplate in PHP classes (e.g., getters/setters, constructor assignments, array-based pseudo-enums) using modern language features
- The user wants to improve type safety in PHP without overcomplicating the codebase -- covering union types, intersection types, never return types, and strict_types declarations
- The user is building or refactoring a PHP library or application and wants production-grade patterns for error handling, value objects, data transfer objects, and domain modeling
- The user asks about PHP coding standards and which tools (PHPStan, Psalm, PHP-CS-Fixer, Rector) to configure for enforcing modern idioms automatically
- The user wants to write expressive, readable PHP that leverages functional-style patterns -- array functions, immutability, pipelines -- without reaching for external FP libraries unnecessarily

**Do NOT use this skill when:**
- The user needs help with PHP framework internals (Laravel, Symfony, Laminas) -- those have dedicated framework-specific skills
- The user is asking about PHP performance profiling or Swoole/FrankenPHP async architecture -- use the PHP runtime performance skill
- The user wants guidance on PHP database access patterns (Doctrine ORM, PDO, query builders) -- use the PHP persistence skill
- The user is asking about PHP deployment, containerization, or PHP-FPM tuning -- use the PHP infrastructure skill
- The user needs general object-oriented design patterns not specific to PHP -- use the OOP design patterns skill
- The user is working on PHP 5.x or 7.3 and below code that cannot be upgraded -- PHP 8.x features do not apply and recommending them would cause errors
- The user is asking about PHP security hardening (input validation, SQL injection, CSP headers) -- use the PHP security skill

---

## Process

### 1. Establish the PHP Version and Strict Mode Baseline

Before recommending any specific idiom, confirm the PHP version because feature availability is version-gated.

- Check the declared PHP version in `composer.json` under `"require": { "php": "^8.x" }` -- this is the authoritative source
- If the version is below 8.0, use Rector to automate the upgrade path with the `SetList::PHP_80`, `SetList::PHP_81`, `SetList::PHP_82` rulesets before applying idioms manually
- Every PHP file in a modern codebase should begin with `declare(strict_types=1);` -- this converts implicit type coercions into `TypeError` exceptions, surfacing bugs that silent coercion would hide
- In `php.ini` or per-pool FPM config, set `error_reporting = E_ALL` and `display_errors = Off` (log instead) to ensure no warnings are silently swallowed
- Run `php -v` and `php --ini` to confirm the active PHP binary matches the project's requirement -- version mismatches between CLI and FPM are a common source of confusion
- If using Composer, add a platform config: `"config": { "platform": { "php": "8.2.0" } }` to prevent installing packages incompatible with your runtime

---

### 2. Apply Constructor Property Promotion and Readonly Properties

Constructor property promotion and readonly properties are the single highest-ROI modernization for most PHP codebases.

- Replace the classic pattern of declaring properties, assigning them in `__construct`, and providing getters with promoted properties:
  ```php
  // Before (PHP 7.x)
  class UserDto {
      public string $name;
      public string $email;
      public function __construct(string $name, string $email) {
          $this->name = $name;
          $this->email = $email;
      }
  }
  
  // After (PHP 8.0+)
  class UserDto {
      public function __construct(
          public readonly string $name,
          public readonly string $email,
      ) {}
  }
  ```
- Use `readonly` on promoted properties whenever the value should not change after construction -- this enforces immutability at the language level, not by convention
- PHP 8.2 introduced readonly classes -- annotate the entire class with `readonly` when every property should be immutable, avoiding per-property annotation:
  ```php
  readonly class Money {
      public function __construct(
          public int $amountInCents,
          public string $currency,
      ) {}
  }
  ```
- For value objects that need a modified copy, implement `with()` methods that return a new instance rather than mutating state:
  ```php
  public function withCurrency(string $currency): static {
      return new static($this->amountInCents, $currency);
  }
  ```
- Avoid using `public` visibility on mutable properties -- prefer `private` or `protected` with explicit mutation methods or use readonly to enforce immutability
- Trailing commas in parameter lists (PHP 8.0+) should be used consistently to produce clean diffs when adding parameters later

---

### 3. Replace Array-Based Pseudo-Enums with Backed Enums

PHP 8.1 native enums eliminate the most common PHP anti-pattern: constants arrays used to simulate enumerated types.

- Use a `string`-backed enum when values are stored in a database or serialized to JSON -- the backing type appears in the enum declaration:
  ```php
  enum Status: string {
      case Active   = 'active';
      case Inactive = 'inactive';
      case Pending  = 'pending';
  }
  ```
- Use an `int`-backed enum when the values map to integer codes in a legacy system or API
- Use a pure (unit) enum when no serialization is needed and the identity of the case is sufficient
- Enums can implement interfaces, which is critical for type-safe service dispatch:
  ```php
  interface HasLabel {
      public function label(): string;
  }
  enum Status: string implements HasLabel {
      case Active = 'active';
      public function label(): string {
          return match($this) {
              Status::Active => 'Active User',
              Status::Inactive => 'Deactivated',
              Status::Pending => 'Awaiting Approval',
          };
      }
  }
  ```
- Use `Status::from('active')` for strict parsing (throws `ValueError` on invalid input) and `Status::tryFrom('unknown')` when the input may be untrusted and a null return is acceptable
- Enum cases can serve as default parameter values, array keys, and match expression subjects -- take full advantage of this
- Do NOT add `const` arrays or class constants that duplicate what an enum already expresses -- delete them when migrating

---

### 4. Use Match Expressions and Nullsafe Operators Instead of Verbose Control Flow

The `match` expression and nullsafe operator `?->` eliminate entire categories of defensive boilerplate.

- Replace `switch` statements with `match` expressions -- `match` is an expression (returns a value), uses strict comparison (`===`), and throws `\UnhandledMatchError` for unmatched subjects, forcing exhaustive handling:
  ```php
  // Before
  switch ($status) {
      case 'active': $label = 'Active'; break;
      case 'pending': $label = 'Pending'; break;
      default: $label = 'Unknown';
  }
  
  // After
  $label = match($status) {
      'active'  => 'Active',
      'pending' => 'Pending',
      default   => 'Unknown',
  };
  ```
- Multiple conditions can share an arm: `'active', 'verified' => 'Confirmed'`
- For deeply nested nullable chains, replace nested `isset` + null checks with the nullsafe operator:
  ```php
  // Before
  $city = null;
  if ($user !== null && $user->getAddress() !== null) {
      $city = $user->getAddress()->getCity();
  }
  
  // After
  $city = $user?->getAddress()?->getCity();
  ```
- The nullsafe operator short-circuits the entire chain on the first null -- do NOT chain it through side-effectful methods, only through pure accessors
- Combine nullsafe with the null coalescing operator for defaults: `$city = $user?->getAddress()?->getCity() ?? 'Unknown'`
- Avoid nesting `match` expressions more than two levels deep -- extract to a named method when the logic grows complex

---

### 5. Leverage Union Types, Intersection Types, and the never Return Type

PHP 8.0+ type system features eliminate docblock-only type hints and make types machine-verifiable.

- Use union types when a parameter or return value legitimately accepts multiple types -- `int|string` is a real type, not a comment:
  ```php
  function findById(int|string $id): User|null {}
  ```
- Prefer `?Type` (nullable shorthand) over `Type|null` for single-nullable types -- they are equivalent but `?User` is more idiomatic
- PHP 8.1 intersection types (`TypeA&TypeB`) are used when a value must satisfy multiple interfaces simultaneously -- common in service layer contracts:
  ```php
  function process(Countable&Iterator $collection): void {}
  ```
- The `never` return type declares that a function never returns normally (always throws or calls `exit`) -- use it on exception factory methods and abort helpers:
  ```php
  function fail(string $message): never {
      throw new \RuntimeException($message);
  }
  ```
- PHP 8.2 `true`, `false`, and `null` as standalone return types let you express exact return semantics: `function isEnabled(): true` communicates that the function unconditionally returns `true`
- Use PHPStan at level 8 or Psalm at level 1 to enforce that all type annotations are correct and that no `mixed` types are hiding real type errors -- add these as CI gates, not optional checks

---

### 6. Apply Named Arguments and First-Class Callables

Named arguments and first-class callable syntax reduce coupling to parameter order and eliminate verbose closures.

- Named arguments are essential when calling functions with many optional parameters -- they communicate intent at the call site:
  ```php
  // Before
  array_slice($items, 0, 5, true);
  
  // After
  array_slice(array: $items, offset: 0, length: 5, preserve_keys: true);
  ```
- Named arguments make refactoring safer -- if the callee adds a new parameter with a default, existing named-argument call sites remain valid without changes
- First-class callable syntax (`Closure::fromCallable` replacement) allows passing any callable as a closure without wrapping it in an anonymous function:
  ```php
  // Before
  $trimmed = array_map(fn($s) => trim($s), $strings);
  
  // After
  $trimmed = array_map(trim(...), $strings);
  ```
- First-class callables work on static methods, instance methods, and built-in functions: `strlen(...)`, `$obj->method(...)`, `ClassName::staticMethod(...)`
- Do NOT use named arguments when the parameter name is unstable (e.g., a third-party function where the name is not part of the public API) -- parameter name changes are breaking changes

---

### 7. Structure Error Handling with Typed Exceptions and Result Patterns

Modern PHP moves away from returning `false` or `null` on failure and toward typed exceptions and explicit result types.

- Create a hierarchy of domain exceptions rather than throwing generic `\Exception`:
  ```
  App\Exception\DomainException (base)
  App\Exception\User\UserNotFoundException
  App\Exception\User\UserAlreadyExistsException
  App\Exception\Payment\InsufficientFundsException
  ```
- Catch exceptions at the boundary where you can meaningfully handle them -- not deep inside domain logic
- Use `finally` for cleanup operations (closing resources, releasing locks) regardless of whether an exception occurred
- For operations that can fail without being exceptional (e.g., parsing user input), consider a simple Result value object instead of exception-driven flow:
  ```php
  readonly class Result {
      private function __construct(
          private readonly mixed $value,
          private readonly ?string $error,
      ) {}
  
      public static function ok(mixed $value): static {
          return new static($value, null);
      }
  
      public static function fail(string $error): static {
          return new static(null, $error);
      }
  
      public function isOk(): bool { return $this->error === null; }
      public function unwrap(): mixed { return $this->value; }
      public function error(): ?string { return $this->error; }
  }
  ```
- Exceptions should be exceptional -- IO failures, constraint violations, programming errors are exceptions; "no results found" is not
- Always include context in exception messages: `"User with ID {$id} not found in repository"` is actionable; `"Not found"` is not

---

### 8. Enforce Idioms with Automated Tooling (PHPStan, Psalm, Rector, PHP-CS-Fixer)

Idioms that are not automatically enforced degrade over time. Tooling makes modern PHP mandatory, not aspirational.

- **PHPStan**: Start at level 5, move to level 8 over 2--4 sprints as violations are resolved. Use the `phpstan/phpstan-strict-rules` extension for additional opinionated checks. Configure `treatPhpDocTypesAsCertain: false` to prevent false negatives
- **Psalm**: An alternative to PHPStan with stronger taint analysis. Use `errorLevel="1"` (strictest) for new projects. Psalm's `@psalm-immutable` annotation integrates with the readonly workflow
- **Rector**: Automate PHP 8.x upgrades and idiom migrations. Create a `rector.php` config with `SetList::PHP_82`, `SetList::CODE_QUALITY`, `SetList::DEAD_CODE`, and `SetList::EARLY_RETURN` rule sets. Run Rector on CI in dry-run mode to detect regressions
- **PHP-CS-Fixer**: Use the `@PHP82Migration` and `@PSR12` rulesets. Add `declare_strict_types`, `modernize_types_casting`, `no_unused_imports`, `ordered_imports` fixers
- Configure pre-commit hooks (using `captainhook/captainhook` or `brainmaestro/composer-git-hooks`) to run PHP-CS-Fixer and PHPStan before every commit
- Add a `Makefile` or `composer.json` scripts section with `lint`, `analyse`, `fix`, and `test` targets so every developer runs the same commands
- Track static analysis violations in CI as a quality gate -- a PR that introduces new PHPStan errors at the configured level should fail the pipeline

---

## Output Format

When advising a user on PHP modern idioms, structure the response as follows:

```
## PHP Modern Idioms Audit

### PHP Version & Strict Mode Status
- Detected PHP Version: [version from composer.json]
- strict_types declared: [yes/no, and in how many files if no]
- Recommended target: PHP [recommended version based on context]

### Current Code Pattern Analysis

| Pattern (Legacy)              | Modern Replacement          | PHP Version | Impact   |
|-------------------------------|----------------------------|-------------|----------|
| Constructor assignment boilerplate | Constructor promotion  | 8.0+        | High     |
| switch statements             | match expressions          | 8.0+        | Medium   |
| Nested null checks (isset)    | Nullsafe operator (?->)    | 8.0+        | High     |
| Class constant pseudo-enums   | Backed enums               | 8.1+        | High     |
| Mutable DTO classes           | readonly properties/classes | 8.1/8.2+   | High     |
| Closure wrapping callables    | First-class callables       | 8.1+        | Low      |
| Union types in docblocks only | Native union types         | 8.0+        | Medium   |

### Recommended Migration Priority (Ordered by ROI)

1. [Highest priority modernization with rationale]
2. [Second priority with rationale]
3. ...

### Implementation

#### [Pattern Name]

**Before:**
```php
[concrete legacy code snippet]
```

**After:**
```php
[concrete modern PHP code snippet]
```

**Rationale:** [Why this is better -- type safety, reduced boilerplate, tooling support, etc.]

### Tooling Configuration

**PHPStan (`phpstan.neon`):**
```yaml
[minimal working config]
```

**Rector (`rector.php`):**
```php
[minimal working config]
```

**PHP-CS-Fixer (`.php-cs-fixer.php`):**
```php
[minimal working config]
```

### Trade-offs and Risks

| Decision | Benefit | Risk | Mitigation |
|----------|---------|------|------------|
| [specific decision] | [concrete benefit] | [real risk] | [specific mitigation] |
```

---

## Rules

1. **NEVER recommend PHP 8.x features without confirming the runtime supports them.** PHP 8.1 enums throw a parse error on PHP 8.0. PHP 8.2 readonly classes throw a parse error on PHP 8.1. Always check `composer.json` `"require"` and the actual runtime version first.

2. **ALWAYS add `declare(strict_types=1)` to every new file.** Without it, PHP silently coerces `"123abc"` to `123` in an `int` parameter, hiding data integrity bugs. This is non-negotiable in modern PHP.

3. **NEVER use `mixed` as a return type or parameter type unless interfacing with a genuinely untyped external system.** `mixed` disables static analysis for that code path. Prefer union types, generics via docblocks (`@template T`), or template types recognized by PHPStan/Psalm.

4. **NEVER use `array` as a type hint when the shape of the array is known.** Prefer typed value objects, DTOs with constructor promotion, or at minimum a PHPStan/Psalm array shape annotation `array{name: string, age: int}` for complex arrays that cannot yet be migrated to objects.

5. **ALWAYS use `match` over `switch` for new code.** `match` uses strict comparison, is an expression, and throws `\UnhandledMatchError` for unmatched subjects -- all of which catch bugs that `switch` silently ignores with its fall-through behavior and loose comparison.

6. **NEVER add `readonly` to a property that must be mutated after construction.** This forces workarounds using reflection (which defeats the purpose). Design the immutability boundary before applying `readonly`.

7. **ALWAYS use `Status::from()` instead of casting or comparing raw strings to enum values.** `from()` throws `ValueError` on invalid input immediately, surfacing bad data at the boundary rather than propagating corrupted state.

8. **NEVER make PHPStan or Psalm optional in CI.** Static analysis must be a hard gate. Teams that run it only locally tolerate `mixed` proliferation and nullable bugs. A PHPStan level 6+ failure should block a PR merge.

9. **NEVER chain the nullsafe operator (`?->`) through methods that have side effects.** If any method in the chain writes to a database, sends an email, or modifies state, a silent short-circuit can leave the system in an inconsistent state. Reserve `?->` for pure accessor chains.

10. **ALWAYS use Rector in CI dry-run mode to detect newly introduced legacy patterns.** Rector with the `SetList::CODE_QUALITY` ruleset will catch new instances of legacy patterns (array-based enums, manual constructor assignments, superfluous docblocks) before they accumulate into technical debt.

---

## Edge Cases

### Legacy Codebase with No `strict_types` in Existing Files

Adding `declare(strict_types=1)` to existing files will break any code that relied on silent type coercion -- `$obj->setAge("42")` now throws `TypeError`. Do not add it globally in a single commit. Use Rector's `DeclareStrictTypesRector` with a scope limited to files that have passing tests. Add it file by file as tests verify each file's behavior. Budget 1--2 hours per 1000 lines of code for this migration.

### Enums in Doctrine Entities (Database Layer)

Doctrine ORM supports backed enums as column types natively since Doctrine DBAL 3.2 and ORM 2.13. Use the enum backing type as the Doctrine column type: `#[Column(type: 'string', enumType: Status::class)]`. Be aware that if an invalid value exists in the database (from before the enum was introduced), Doctrine will throw a `ValueError` on hydration -- sanitize the database before enabling this mapping.

### Readonly Properties and Serialization (JSON, Serialize)

`readonly` properties work with `json_encode` transparently. However, `unserialize()` and many ORMs that use reflection-based hydration will fail to set readonly properties after construction because readonly prevents assignment after the constructor has run. Use a named constructor (static factory) or a custom `__set_state()` method. For API platform or Symfony serializer, configure the denormalization to use the constructor (object_to_populate not supported with readonly).

### Named Arguments in Variadic Functions

Named arguments cannot be combined with a preceding variadic argument: `function f(string ...$names)` does not allow `f(first: 'Alice')` -- the variadic consumes positional arguments. Additionally, named arguments break when a library function renames its parameters between versions (e.g., `str_contains` renamed in a patch release is theoretical but real in extensions). Only use named arguments for functions whose parameter names are part of the stable public API.

### Intersection Types and Nullable Combinations

PHP does not support nullable intersection types: `?Countable&Iterator` is a syntax error. Use a DNF (Disjunctive Normal Form) type in PHP 8.2 instead: `(Countable&Iterator)|null`. If the PHP version is below 8.2, extract the intersection into a named interface that both `Countable` and `Iterator` extend -- `interface CountableIterator extends Countable, Iterator {}` -- and use `?CountableIterator`.

### match with No default and Partial Enums

When using `match` against an enum without a `default` arm, `\UnhandledMatchError` is thrown if a new enum case is added later and the match is not updated. This is usually desirable -- it surfaces the omission immediately. However, in some contexts (feature flags, plugin systems) you want to handle new cases gracefully. In those cases, add an explicit `default => null` or `default => throw new UnsupportedCaseException(...)` so the failure mode is explicit and descriptive rather than an uncaught `UnhandledMatchError`.

### Fibers (PHP 8.1) and Their Appropriate Use

PHP Fibers are cooperative concurrency primitives, not threads. They do NOT make synchronous I/O concurrent -- a blocking `file_get_contents()` inside a fiber still blocks the entire process. Fibers are appropriate when building async frameworks (ReactPHP, Revolt event loop) where the scheduler drives fiber suspension. In application code, never introduce Fibers directly -- use them only through an async framework's abstraction layer. Recommending Fibers to a user writing standard Laravel or Symfony controllers is incorrect and misleading.

---

## Example

**Input:** "I inherited a PHP 7.4 codebase with a `UserService` class that uses class constants for user status, manual constructor assignment, isset-chained null checks, and switch statements for generating status labels. We're deploying on PHP 8.2. How do I modernize this?"

**Output:**

---

## PHP Modern Idioms Audit

### PHP Version & Strict Mode Status
- Inherited PHP version: 7.4
- Target runtime: PHP 8.2
- `strict_types` declared: Likely absent (typical of PHP 7.4 era code)
- Recommended target: PHP 8.2 with full strict types and PHPStan level 6+

---

### Current Code Pattern Analysis

Here is the legacy code as it typically looks in a PHP 7.4-era `UserService`:

```php
<?php

class User
{
    const STATUS_ACTIVE   = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_PENDING  = 'pending';

    /** @var int */
    private $id;

    /** @var string */
    private $email;

    /** @var string */
    private $status;

    /** @var Address|null */
    private $address;

    public function __construct(int $id, string $email, string $status, ?Address $address)
    {
        $this->id      = $id;
        $this->email   = $email;
        $this->status  = $status;
        $this->address = $address;
    }

    public function getId(): int      { return $this->id; }
    public function getEmail(): string { return $this->email; }
    public function getStatus(): string { return $this->status; }
    public function getAddress(): ?Address { return $this->address; }
}

class UserService
{
    public function getStatusLabel(User $user): string
    {
        switch ($user->getStatus()) {
            case User::STATUS_ACTIVE:
                return 'Active User';
            case User::STATUS_INACTIVE:
                return 'Deactivated';
            case User::STATUS_PENDING:
                return 'Awaiting Approval';
            default:
                return 'Unknown';
        }
    }

    public function getUserCity(User $user): ?string
    {
        if ($user->getAddress() !== null) {
            $address = $user->getAddress();
            if (isset($address)) {
                return $address->getCity();
            }
        }
        return null;
    }

    public function setUserActive(User $user): void
    {
        // Mutation directly on the object
        $user->status = User::STATUS_ACTIVE; // bypasses accessor, common in legacy code
    }
}
```

---

### Modernized PHP 8.2 Code

**Step 1 -- Introduce a backed enum to replace class constants:**

```php
<?php

declare(strict_types=1);

namespace App\Enum;

enum UserStatus: string
{
    case Active   = 'active';
    case Inactive = 'inactive';
    case Pending  = 'pending';

    public function label(): string
    {
        return match($this) {
            UserStatus::Active   => 'Active User',
            UserStatus::Inactive => 'Deactivated',
            UserStatus::Pending  => 'Awaiting Approval',
        };
    }
}
```

**Rationale:** The `match` expression inside `label()` is exhaustive -- if a new case (`Banned`, `Suspended`) is added to the enum without updating `label()`, PHP throws `\UnhandledMatchError` at runtime, immediately surfacing the omission. With the old `switch`/constants pattern, a missing case fell through to `default: return 'Unknown'` -- silently returning wrong data.

---

**Step 2 -- Rewrite the `User` class with constructor promotion, readonly, and the enum:**

```php
<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\UserStatus;

readonly class User
{
    public function __construct(
        public int $id,
        public string $email,
        public UserStatus $status,
        public ?Address $address = null,
    ) {}

    public function withStatus(UserStatus $status): static
    {
        return new static($this->id, $this->email, $status, $this->address);
    }
}
```

**Rationale:** The `readonly` class declaration eliminates 8 lines of boilerplate (4 property declarations, 4 constructor assignments). All getters are replaced by public readonly properties -- they can be read anywhere but cannot be mutated outside the constructor. The `withStatus()` method provides a safe mutation path that returns a new immutable instance, making state transitions traceable and testable.

---

**Step 3 -- Rewrite `UserService` with the nullsafe operator and updated method signatures:**

```php
<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Enum\UserStatus;

final class UserService
{
    public function getStatusLabel(User $user): string
    {
        return $user->status->label();
    }

    public function getUserCity(User $user): ?string
    {
        return $user->address?->getCity();
    }

    public function activateUser(User $user): User
    {
        return $user->withStatus(UserStatus::Active);
    }
}
```

**Rationale:** `getStatusLabel()` is now a one-liner that delegates to the enum's own method -- the service no longer needs to know about status string values at all. `getUserCity()` collapses four lines of nested null checking into a single nullsafe chain. `activateUser()` now returns a new `User` instance instead of mutating the original, which makes the service stateless and the transition auditable.

---

### Tooling Configuration

**PHPStan (`phpstan.neon`):**
```yaml
parameters:
    level: 6
    paths:
        - src
    strictRules: true
    checkMissingIterableValueType: true
    treatPhpDocTypesAsCertain: false
```

**Rector (`rector.php`):**
```php
<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\Set\ValueObject\SetList;

return static function (RectorConfig $rectorConfig): void {
    $rectorConfig->paths([__DIR__ . '/src']);

    $rectorConfig->sets([
        SetList::PHP_82,
        SetList::CODE_QUALITY,
        SetList::DEAD_CODE,
        SetList::EARLY_RETURN,
    ]);
};
```

**PHP-CS-Fixer (`.php-cs-fixer.php`):**
```php
<?php

$finder = PhpCsFixer\Finder::create()->in(__DIR__ . '/src');

return (new PhpCsFixer\Config())
    ->setRules([
        '@PHP82Migration'    => true,
        '@PSR12'             => true,
        'declare_strict_types' => true,
        'no_unused_imports'    => true,
        'ordered_imports'      => ['sort_algorithm' => 'alpha'],
        'trailing_comma_in_multiline' => ['elements' => ['arguments', 'arrays', 'parameters']],
    ])
    ->setFinder($finder);
```

---

### Migration Priority and Risk Matrix

| Modernization | ROI | Breaking Risk | Migration Effort |
|---|---|---|---|
| Add `declare(strict_types=1)` | Very High | Medium -- type coercions become TypeErrors | File by file with test coverage |
| Replace constants with enums | High | Low -- Rector handles most cases | 1--2 hours per enum cluster |
| Constructor promotion + readonly | High | Low -- pure refactor, same API surface | Rector automates this fully |
| Replace switch with match | Medium | Low -- behavior identical if default present | Rector `ChangeOrIfContinueToMultiContinueRector` |
| Nullsafe operator chains | Medium | Low -- pure refactor | Manual, ~30 min per class |
| PHPStan at level 6 | Very High | None -- analysis only | 4--8 hours to resolve initial violations |

**Recommended order:** Run Rector with `SetList::PHP_82` first to apply all mechanical transformations automatically. Then add PHPStan at level 5 and fix violations. Then manually refactor to enums and readonly classes where Rector did not fully cover the pattern. The entire migration for a 10,000-line codebase should take 2--4 working days, not weeks.
