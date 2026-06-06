---
name: php-project-setup
description: |
  Guides expert-level php project setup implementation: php and best-practices decision frameworks, production-ready patterns, and concrete templates for php project setup workflows.
  Use when the user asks about php project setup, php project setup configuration, or php best practices for php projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "php best-practices template"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# PHP Project Setup

## When to Use

**Use this skill when:**
- A user wants to bootstrap a new PHP project from scratch and needs guidance on directory structure, dependency management, autoloading, and toolchain configuration
- A user is migrating a legacy procedural PHP codebase toward a modern, composer-managed architecture with namespacing and PSR compliance
- A user asks which PHP version to target, how to configure php.ini for production, or how to manage PHP extensions across environments
- A user needs to set up a testing infrastructure using PHPUnit, Pest, or Behat alongside code quality tools like PHPStan, Rector, or PHP CS Fixer
- A user is establishing CI/CD pipelines for a PHP project and needs to understand Composer caching strategies, matrix testing across PHP versions, and environment-specific configuration patterns
- A user is setting up a PHP project with a framework (Symfony, Laravel, Slim) and needs to understand which framework conventions to follow versus where to deviate
- A user needs to containerize a PHP application for local development with Docker and configure Nginx or Caddy with PHP-FPM

**Do NOT use this skill when:**
- The user is asking about a specific PHP framework's internal architecture -- use a dedicated Symfony, Laravel, or Slim skill instead
- The user needs help debugging a runtime PHP error or exception -- that is a debugging skill, not a setup skill
- The user is asking about PHP application performance optimization (OPcache tuning, query optimization) -- that belongs in a performance engineering skill
- The user needs database schema design or ORM configuration beyond what belongs in project scaffolding -- defer to a database skill
- The user is asking about deploying PHP to production servers (zero-downtime deploys, server provisioning) -- use a deployment skill
- The user is working in a WordPress or Drupal context exclusively -- those CMS ecosystems have their own toolchain conventions that differ substantially
- The user is asking general PHP syntax or language feature questions -- that is a language reference skill, not a setup skill

---

## Process

### 1. Determine PHP Version, Runtime Target, and Constraints

- Identify the minimum PHP version to support. The rule of thumb: target the oldest version that is still receiving active security support from php.net. As of 2024, that means PHP 8.1 minimum for new projects, with 8.2 or 8.3 preferred.
- Ask whether the project needs to run on shared hosting (limits PHP version and extensions), Docker/container infrastructure, managed PaaS (AWS Elastic Beanstalk, Heroku, Fly.io), or bare metal/VPS.
- Confirm which PHP extensions are required early: `pdo`, `pdo_mysql` or `pdo_pgsql`, `redis`, `intl`, `mbstring`, `xml`, `zip`, `gd` or `imagick`, `opcache`. Missing extension declarations in `composer.json` cause silent failures in CI.
- Decide on FPM or CLI mode. Web applications need PHP-FPM; console tools or queue workers run as CLI. Many projects need both, with different `php.ini` settings for each SAPI.
- Lock the exact PHP patch version in your Docker base image (e.g., `php:8.3.6-fpm-alpine`) rather than using `php:8.3-fpm-alpine` to prevent unexpected upstream changes breaking builds.

### 2. Initialize the Composer Project and Declare Dependencies

- Run `composer init` and fill in all fields: `name` (vendor/package), `description`, `type` (project vs. library), `license`, `minimum-stability` (use `stable` for applications), `prefer-stable: true`.
- Set the PHP platform constraint in `composer.json` under `config.platform.php` to match your production PHP version exactly (e.g., `"8.3.0"`). This prevents Composer from installing packages incompatible with your production environment even if your local machine runs a different version.
- Declare required PHP extensions under `require` using the `ext-*` syntax: `"ext-mbstring": "*"`, `"ext-pdo": "*"`. This documents runtime dependencies and will alert CI if an extension is missing.
- Use `composer require` for production dependencies and `composer require --dev` for development tools. Never put PHPUnit, PHPStan, or Rector in production dependencies.
- Generate and commit `composer.lock`. Never `.gitignore` it for applications. Only omit `composer.lock` for reusable libraries (packages published on Packagist).
- Set `"sort-packages": true` in `composer.json` config section to keep diffs clean.
- For private packages, configure `repositories` with type `vcs` or `composer` and set `COMPOSER_AUTH` as an environment variable rather than committing credentials.

### 3. Establish Directory Structure and PSR-4 Autoloading

- Use the following canonical directory layout for framework-agnostic projects:
  ```
  project-root/
  ├── bin/                  # CLI entry points
  ├── config/               # Environment configuration files
  ├── public/               # Web root -- only index.php and assets here
  ├── src/                  # Application source code (PSR-4 root)
  ├── templates/            # Views/templates
  ├── tests/                # Test suites (mirrors src/ structure)
  ├── var/                  # Generated files: cache, logs (gitignored)
  ├── vendor/               # Composer dependencies (gitignored)
  ├── .env.example          # Committed environment variable template
  ├── .env                  # Local environment values (gitignored)
  ├── composer.json
  ├── composer.lock
  └── phpunit.xml.dist
  ```
- Configure PSR-4 autoloading in `composer.json`:
  ```json
  "autoload": {
    "psr-4": {
      "Acme\\MyApp\\": "src/"
    }
  },
  "autoload-dev": {
    "psr-4": {
      "Acme\\MyApp\\Tests\\": "tests/"
    }
  }
  ```
- Run `composer dump-autoload --optimize` in production builds. This generates a classmap instead of filesystem traversal, which is 30--50% faster on cold starts with large codebases.
- Never put business logic in `public/index.php`. The front controller should bootstrap the application in three lines: require autoloader, instantiate the kernel or container, run it.
- Mirror the `src/` namespace hierarchy in `tests/` exactly. A class at `src/Service/PaymentProcessor.php` (namespace `Acme\MyApp\Service\PaymentProcessor`) gets its test at `tests/Service/PaymentProcessorTest.php`.

### 4. Configure Environment Variables and Secrets Management

- Install `vlucas/phpdotenv` for local development environment loading. Never use it in production -- production environments should inject variables through the process environment, not `.env` files.
- Create `.env.example` with every variable name the application needs, with non-sensitive placeholder values and inline comments explaining each variable's purpose. Commit this file.
- Add `.env` and any `.env.local`, `.env.*.local` variants to `.gitignore`.
- Define a strict allowlist of required variables and call `Dotenv::createImmutable()->required(['DATABASE_URL', 'APP_SECRET', 'REDIS_URL'])` at bootstrap so missing variables fail fast with a meaningful error rather than causing cryptic failures later.
- For secrets in CI/CD, use the platform's native secret injection (GitHub Actions Secrets, GitLab CI Variables, AWS Secrets Manager via IAM role) and never echo or log secret values.
- Use a `config/` directory for structured configuration arrays that read from environment variables. Each file represents one concern: `config/database.php`, `config/cache.php`, `config/mail.php`. This separates configuration reading from usage.

### 5. Set Up Code Quality Toolchain

- **PHP CS Fixer** -- Install as a dev dependency, create `.php-cs-fixer.dist.php` at project root. Use the `@PSR12` ruleset as baseline, then add opinionated additions: `'single_quote' => true`, `'trailing_comma_in_multiline' => true`, `'no_unused_imports' => true`. Run `php-cs-fixer fix` to auto-correct; run with `--dry-run` in CI to fail on violations.
- **PHPStan** -- Install `phpstan/phpstan` and configure `phpstan.neon.dist`. Start at level 5 for existing projects or level 8 for greenfield. Include `phpstan/phpstan-phpunit` and framework-specific extensions (`phpstan/phpstan-doctrine`, `phpstan/phpstan-symfony`). Raise the level incrementally -- never lower it once established.
- **Rector** -- Install `rector/rector` for automated code modernization. Create `rector.php` with applicable rule sets: `Php83Set::PHP_83`, `CodeQualitySetList::CODE_QUALITY`, `DeadCodeSetList::DEAD_CODE`. Run Rector in CI in dry-run mode to surface refactoring opportunities without blocking builds.
- **Psalm** -- Use as an alternative or complement to PHPStan, especially valuable for projects with complex generics. Psalm and PHPStan catch different classes of bugs; running both adds value on larger projects.
- Add a `Makefile` or `composer.json` scripts block to unify tool invocation:
  ```json
  "scripts": {
    "cs:fix": "php-cs-fixer fix",
    "cs:check": "php-cs-fixer fix --dry-run",
    "analyse": "phpstan analyse",
    "test": "phpunit",
    "quality": ["@cs:check", "@analyse", "@test"]
  }
  ```

### 6. Configure Testing Infrastructure

- Install `phpunit/phpunit` at the version appropriate for your PHP version (PHPUnit 11 requires PHP 8.2+; use PHPUnit 10 for PHP 8.1).
- Create `phpunit.xml.dist` (committed) and add `phpunit.xml` to `.gitignore` for local developer overrides. Key configuration sections:
  - `<testsuites>` -- separate Unit, Integration, and Functional suites so developers can run fast unit tests during development (`phpunit --testsuite Unit`) and integration tests in CI.
  - `<source>` -- point to `src/` with `<include>` to enable coverage analysis only over application code, not vendor.
  - `<php>` -- set `APP_ENV=test` and other test-specific environment variables here rather than relying on `.env.test`.
  - `<coverage>` -- configure `<report><html outputDirectory="var/coverage"/>` for local use and Cobertura XML for CI parsing.
- Set a coverage threshold. For new projects, start at 80% line coverage and enforce it with `--coverage-min-lines 80` in CI. Never set it below 60% for production applications.
- Use test doubles deliberately: PHPUnit's built-in mocking for simple collaborators, Mockery for complex argument matching, real in-memory SQLite or an in-memory repository pattern for persistence tests rather than mocking the database layer.
- For Pest as an alternative: Pest provides a more expressive syntax for unit tests while remaining compatible with PHPUnit infrastructure. Use `pest/pest` with `pest/plugin-coverage` and `pestphp/pest-plugin-laravel` if on Laravel.

### 7. Configure Docker and Local Development Environment

- Create a `docker-compose.yml` for local development that includes at minimum: PHP-FPM application container, Nginx or Caddy web server, database (MySQL 8 or PostgreSQL 16), Redis for cache/sessions.
- Use a multi-stage `Dockerfile`:
  - **Stage 1 (base):** `php:8.3-fpm-alpine`, install system dependencies and PHP extensions via `docker-php-ext-install` and `pecl`.
  - **Stage 2 (development):** Install Xdebug, configure `xdebug.mode=develop,coverage`, install Composer binary.
  - **Stage 3 (production):** Copy only the application code and run `composer install --no-dev --optimize-autoloader --classmap-authoritative`. Never install Xdebug in production.
- Configure Xdebug for step debugging with VS Code (launch.json `listen` configuration) or PhpStorm (path mappings). Set `xdebug.start_with_request=trigger` so Xdebug is off by default and only activates with the `XDEBUG_SESSION` cookie or header.
- Use named Docker volumes for Composer cache (`~/.composer/cache`) to avoid re-downloading packages on every container rebuild.
- Configure `php.ini` overrides via a mounted `conf.d/` directory. Separate development and production configurations: development enables `display_errors=On`, `xdebug`, and relaxed memory limits; production enforces `display_errors=Off`, `log_errors=On`, `expose_php=Off`, and sets `memory_limit=256M` (adjust per workload).

### 8. Establish CI Pipeline and Git Hooks

- Configure GitHub Actions or GitLab CI with a matrix strategy to test against PHP 8.1, 8.2, and 8.3 if the project is a library, or the single production PHP version if it is an application.
- Recommended CI job order (fail fast principle): lint/format check (30 seconds) → static analysis (1--2 minutes) → unit tests (1--3 minutes) → integration tests (3--10 minutes) → build Docker image → push artifact.
- Cache Composer dependencies in CI using the hash of `composer.lock` as the cache key. This reduces install time from 60--120 seconds to 5--15 seconds on cache hit.
- Install pre-commit hooks with `captainhook/captainhook` or a simple shell script in `.git/hooks/pre-commit` that runs `composer cs:check` and `composer analyse` on staged PHP files. Block commits that introduce CS violations or PHPStan errors.
- Pin GitHub Actions to specific commit SHAs (not floating tags like `@v3`) to prevent supply chain attacks. Use Dependabot to keep action versions updated automatically.
- Generate and publish a `SBOM` (Software Bill of Materials) artifact from the CI pipeline using `composer` with `--format json` output for compliance-sensitive projects.

---

## Output Format

When responding to a PHP project setup request, structure the output as follows:

```
## PHP Project Setup Plan

### Context Summary
- PHP version: [e.g., 8.3.x]
- Runtime target: [Docker/PaaS/bare metal/shared hosting]
- Framework: [None/Symfony/Laravel/Slim/other]
- Project type: [Application/Library/CLI tool/API]
- Team size: [N developers]
- Required extensions: [list]

---

### Directory Structure
[ASCII tree of recommended layout with one-line explanation per directory]

---

### composer.json Configuration
```json
{
  "name": "vendor/project-name",
  "description": "...",
  "type": "project",
  "require": {
    "php": "^8.3",
    "ext-mbstring": "*",
    "ext-pdo": "*",
    "vlucas/phpdotenv": "^5.6"
  },
  "require-dev": {
    "phpunit/phpunit": "^11.0",
    "phpstan/phpstan": "^1.10",
    "friendsofphp/php-cs-fixer": "^3.50",
    "rector/rector": "^1.0"
  },
  "autoload": {
    "psr-4": { "Vendor\\Project\\": "src/" }
  },
  "autoload-dev": {
    "psr-4": { "Vendor\\Project\\Tests\\": "tests/" }
  },
  "config": {
    "sort-packages": true,
    "platform": { "php": "8.3.0" },
    "optimize-autoloader": true
  },
  "minimum-stability": "stable",
  "prefer-stable": true,
  "scripts": {
    "cs:fix": "php-cs-fixer fix",
    "cs:check": "php-cs-fixer fix --dry-run --diff",
    "analyse": "phpstan analyse --memory-limit=512M",
    "test": "phpunit",
    "test:unit": "phpunit --testsuite Unit",
    "test:integration": "phpunit --testsuite Integration",
    "quality": ["@cs:check", "@analyse", "@test"]
  }
}
```

---

### Tool Configuration Files
[phpstan.neon.dist, .php-cs-fixer.dist.php, phpunit.xml.dist, rector.php -- each as a complete, ready-to-use file]

---

### Docker Setup
[Dockerfile (multi-stage) and docker-compose.yml, both complete]

---

### CI Pipeline Configuration
[Complete GitHub Actions or GitLab CI YAML]

---

### Decision Rationale
| Decision | Choice Made | Alternatives Considered | Reason |
|----------|-------------|------------------------|--------|
| PHP version | 8.3 | 8.1, 8.2 | Latest stable, fibers + readonly classes available |
| Test framework | PHPUnit 11 | Pest | Team familiarity, native PHPUnit 11 requires PHP 8.2+ |
| Static analysis | PHPStan level 8 | Psalm, level 5 | Greenfield -- strict from day one |
| Code style | PSR-12 + CS Fixer | PSR-2, per-project | Industry standard, auto-fixable |

---

### Next Steps (Ordered by Priority)
1. [Specific, actionable step]
2. [Specific, actionable step]
3. [Specific, actionable step]
```

---

## Rules

1. **Never omit the `composer.lock` from version control for applications.** Omitting it means two developers running `composer install` on different days can get different dependency versions, breaking the reproducibility guarantee. Only library packages (published to Packagist) should omit `composer.lock`.

2. **Never set `minimum-stability: dev` without explicit justification.** Using dev stability allows unstable pre-release packages to be installed and can pull in breaking changes silently. If a specific package needs `dev-main`, use the `stability-flags` mechanism to target only that package.

3. **Always set `config.platform.php` in `composer.json` to match the production PHP version precisely.** Without this, Composer resolves dependencies based on the local PHP version. If a developer runs PHP 8.3 locally but production is 8.1, they will install packages that require PHP 8.2 features and fail silently at runtime.

4. **Never install Xdebug in production containers.** Xdebug adds 30--50% overhead to PHP execution even when not actively debugging. Use OPcache with `opcache.preload` in production. If coverage is needed in CI, use a dedicated coverage job with Xdebug or use pcov (a lighter-weight coverage driver with negligible overhead).

5. **Always put the web server document root at `public/`.** Never expose `src/`, `config/`, `vendor/`, or `var/` to the web. Configure Nginx or Caddy to serve only `public/` and route all non-file requests to `public/index.php`. Misconfigured document roots are one of the most common PHP security vulnerabilities.

6. **Never commit `.env` files containing real credentials.** Use `.env.example` with placeholder values as documentation of required variables. If a `.env` with credentials is accidentally committed, rotate all exposed secrets immediately -- do not just delete the file, as git history preserves it.

7. **Always declare PHP extension requirements in `composer.json` under `require`.** Extensions like `ext-intl`, `ext-gd`, and `ext-redis` are frequently missing from default PHP installations. Declaring them causes Composer to warn during installation and prevents cryptic "Class not found" errors at runtime.

8. **Never use `@` error suppression operator in new code.** It masks errors instead of handling them, makes debugging nearly impossible, and adds measurable overhead (PHP still generates the error internally). Prefer explicit `file_exists()` checks, try/catch blocks, or `set_error_handler()` for error handling.

9. **Always configure `opcache` with appropriate settings for the deployment model.** For traditional long-running FPM workers: `opcache.validate_timestamps=0` in production (disables file change checking for performance), `opcache.memory_consumption=256`, `opcache.max_accelerated_files=20000`. For deployments using rolling updates or symlink switches, set `opcache.revalidate_freq=0` and call `opcache_reset()` in a post-deploy hook, or use `opcache.file_cache` as a secondary disk cache.

10. **Always run `composer audit` in CI** to check for known security vulnerabilities in installed dependencies. This command checks installed packages against the PHP Security Advisories database and should fail the build on any HIGH or CRITICAL advisories. Run it as the first step after dependency installation so vulnerable builds fail fast without running tests.

---

## Edge Cases

### Legacy Codebase Without Namespaces or Composer

When introducing Composer and PSR-4 to a project that uses `require`/`include` chains and global functions, do not attempt a full rewrite. Add Composer's autoloader to the project entry point first, then introduce a `src/` directory for all new code. Use Composer's `classmap` autoloading feature to cover existing non-PSR-4 classes during the transition:
```json
"autoload": {
  "classmap": ["legacy/"],
  "psr-4": { "Acme\\": "src/" }
}
```
Run `composer dump-autoload --optimize` after adding legacy class paths. Migrate classes to PSR-4 namespaces opportunistically -- when a class is touched for a feature or bug fix, move it to `src/` and add a backwards-compatible class alias with `class_alias()` if external code references it by the old name.

### Shared Hosting Without SSH or Composer Access

Some organizations must deploy to shared hosting environments (cPanel, Plesk) without command-line access. In this case, run `composer install --no-dev --optimize-autoloader` locally or in CI, then upload the `vendor/` directory with the application. Never run `composer install` on the production server in a shared hosting environment -- it exposes `composer.phar` to the web and has no access to proper credentials management. Use a deployment tool like Deployer or a CI artifact upload to automate this reliably. Ensure the `.htaccess` file blocks web access to `vendor/`, `config/`, and all `.env` files.

### Multi-PHP-Version Library Development

When building a library that must support PHP 8.1, 8.2, and 8.3, set `"php": ">=8.1"` in `require` and do not set `config.platform.php` (this would prevent installation on lower versions). Use a CI matrix strategy to test all supported versions. Install `phpunit/phpunit: ^10.5 || ^11.0` to support both. Use Rector with `DowngradePhp82Set::PHP_82` and `DowngradePhp83Set::PHP_83` to verify that no code accidentally uses features unavailable in the minimum version. The `composer/semver` package is useful for programmatic version constraint resolution when the library itself needs to inspect its environment.

### Monorepo with Multiple PHP Packages

For a monorepo containing several related PHP packages (e.g., a core library, an HTTP adapter, and a console tool), use a tool like `symplify/monorepo-builder` to synchronize `composer.json` files and manage cross-package dependencies. Each package lives in `packages/package-name/` with its own `composer.json`. The root `composer.json` uses path repositories to link packages locally:
```json
"repositories": [
  {"type": "path", "url": "packages/*"}
]
```
Run tests for all packages from the root using a shared PHPUnit configuration, or use `monorepo-builder` to propagate test runs. Enforce that no package has circular dependencies by running a dependency graph analysis in CI.

### Projects Requiring FIPS-Compliant Cryptography

In regulated environments (US federal government, some healthcare contexts), the system OpenSSL must operate in FIPS 140-2 mode. PHP's OpenSSL extension respects the system FIPS setting, which disables MD5 and SHA1 -- commonly used in legacy code for non-cryptographic purposes like cache keys. Audit the codebase with PHPStan's `phpstan/phpstan-strict-rules` and a custom rule to detect `md5()` and `sha1()` calls. Replace them with `hash('sha256', ...)` for non-security uses. Ensure `random_bytes()` and `random_int()` are used for all randomness (these call the CSPRNG regardless of FIPS mode). Test FIPS compliance by setting `OPENSSL_FIPS=1` in the test container environment.

### Docker Image Size Optimization for Production

A naive PHP Docker image built from `php:8.3-fpm` can exceed 500MB. Optimize using these techniques: start from `php:8.3-fpm-alpine` (reduces base to ~80MB), use multi-stage builds to exclude Composer binary and build tools from the final image, install only required extensions (do not install a blanket set), and use `--no-cache` on `apk add` calls to avoid storing the package index. Remove temporary build artifacts with `rm -rf /tmp/*` in the same RUN layer that creates them (otherwise they remain in the image layer). Target image sizes: under 150MB for API services, under 250MB for full web applications with many extensions.

### CI Cache Invalidation and Stale Vendor Directories

When the CI Composer cache key is based only on `composer.lock`, adding a new dev dependency updates `composer.lock` but the old cache entry is not evicted until the platform purges it (GitHub Actions uses an LRU-style eviction with a 10GB cap per repository). To ensure clean installs after dependency changes, use a composite cache key: `${{ runner.os }}-composer-${{ hashFiles('composer.lock') }}`. When debugging cache-related issues, temporarily append a manual version suffix (`-v2`) to bust the cache intentionally. Also run `composer validate --strict` in CI before `composer install` to catch malformed or non-normalized `composer.json` files early.

---

## Example

**Input:** "I need to set up a new PHP REST API project. We're a team of 4 developers. The API will be built without a full framework -- just PHP 8.3, a router, and a DI container. We'll deploy via Docker to a Kubernetes cluster. I want strict code quality from day one."

**Output:**

## PHP Project Setup Plan

### Context Summary
- PHP version: 8.3.x
- Runtime target: Docker on Kubernetes (PHP-FPM + Nginx sidecar)
- Framework: None (micro-stack -- router + DI container)
- Project type: REST API
- Team size: 4 developers
- Required extensions: `pdo`, `pdo_pgsql`, `mbstring`, `intl`, `json`, `opcache`, `redis`

---

### Directory Structure

```
acme-api/
├── bin/
│   └── console                  # CLI entry point (chmod +x)
├── config/
│   ├── container.php            # DI container definitions
│   ├── routes.php               # Route definitions
│   ├── database.php             # DB config reads from env
│   └── middleware.php           # Middleware stack
├── public/
│   └── index.php                # Front controller -- 3 lines max
├── src/
│   ├── Action/                  # HTTP action classes (controllers)
│   ├── Domain/                  # Domain models, value objects
│   ├── Infrastructure/
│   │   ├── Persistence/         # Repository implementations
│   │   └── Http/                # HTTP client adapters
│   ├── Application/
│   │   └── UseCase/             # Application service layer
│   └── Kernel.php               # Boots container + router
├── tests/
│   ├── Unit/                    # Mirrors src/ structure
│   ├── Integration/             # Tests with real DB (SQLite or Postgres)
│   └── Api/                     # HTTP-level tests via test client
├── var/
│   ├── cache/                   # Gitignored
│   └── log/                     # Gitignored
├── docker/
│   ├── php/
│   │   ├── Dockerfile
│   │   ├── php.ini.prod
│   │   ├── php.ini.dev
│   │   └── www.conf             # FPM pool config
│   └── nginx/
│       └── default.conf
├── .env.example
├── .env                         # Gitignored
├── .github/
│   └── workflows/
│       └── ci.yml
├── .php-cs-fixer.dist.php
├── phpstan.neon.dist
├── phpunit.xml.dist
├── rector.php
├── Makefile
├── docker-compose.yml
├── composer.json
└── composer.lock
```

---

### composer.json

```json
{
  "name": "acme/api",
  "description": "Acme REST API",
  "type": "project",
  "license": "proprietary",
  "require": {
    "php": "^8.3",
    "ext-intl": "*",
    "ext-json": "*",
    "ext-mbstring": "*",
    "ext-opcache": "*",
    "ext-pdo": "*",
    "ext-pdo_pgsql": "*",
    "ext-redis": "*",
    "league/route": "^5.1",
    "php-di/php-di": "^7.0",
    "laminas/laminas-diactoros": "^3.3",
    "laminas/laminas-httphandlerrunner": "^2.9",
    "vlucas/phpdotenv": "^5.6",
    "monolog/monolog": "^3.5"
  },
  "require-dev": {
    "phpunit/phpunit": "^11.0",
    "phpstan/phpstan": "^1.10",
    "phpstan/phpstan-strict-rules": "^1.5",
    "friendsofphp/php-cs-fixer": "^3.50",
    "rector/rector": "^1.0",
    "fakerphp/faker": "^1.23",
    "guzzlehttp/guzzle": "^7.8"
  },
  "autoload": {
    "psr-4": {
      "Acme\\Api\\": "src/"
    }
  },
  "autoload-dev": {
    "psr-4": {
      "Acme\\Api\\Tests\\": "tests/"
    }
  },
  "config": {
    "sort-packages": true,
    "optimize-autoloader": true,
    "platform": {
      "php": "8.3.0"
    }
  },
  "minimum-stability": "stable",
  "prefer-stable": true,
  "scripts": {
    "cs:fix": "php-cs-fixer fix",
    "cs:check": "php-cs-fixer fix --dry-run --diff",
    "analyse": "phpstan analyse --memory-limit=512M",
    "refactor": "rector process --dry-run",
    "refactor:fix": "rector process",
    "test": "phpunit",
    "test:unit": "phpunit --testsuite Unit",
    "test:integration": "phpunit --testsuite Integration",
    "test:api": "phpunit --testsuite Api",
    "test:coverage": "phpunit --coverage-html var/coverage",
    "audit": "composer audit",
    "quality": ["@cs:check", "@analyse", "@test"]
  }
}
```

---

### phpstan.neon.dist

```neon
parameters:
    level: 8
    paths:
        - src
        - tests
    excludePaths:
        - var
        - vendor
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true
    reportUnmatchedIgnoredErrors: true
    treatPhpDocTypesAsCertain: false

includes:
    - vendor/phpstan/phpstan-strict-rules/rules.neon
```

---

### .php-cs-fixer.dist.php

```php
<?php

declare(strict_types=1);

$finder = PhpCsFixer\Finder::create()
    ->in([__DIR__ . '/src', __DIR__ . '/tests', __DIR__ . '/config'])
    ->name('*.php')
    ->notName('*.blade.php');

return (new PhpCsFixer\Config())
    ->setRules([
        '@PSR12'                         => true,
        'declare_strict_types'           => true,
        'single_quote'                   => true,
        'trailing_comma_in_multiline'    => true,
        'no_unused_imports'              => true,
        'ordered_imports'                => ['sort_algorithm' => 'alpha'],
        'array_syntax'                   => ['syntax' => 'short'],
        'blank_line_after_opening_tag'   => true,
        'cast_spaces'                    => ['space' => 'single'],
        'native_function_casing'         => true,
        'phpdoc_align'                   => ['align' => 'vertical'],
        'return_type_declaration'        => ['space_before' => 'none'],
    ])
    ->setFinder($finder)
    ->setRiskyAllowed(true)
    ->setCacheFile(__DIR__ . '/var/.php-cs-fixer.cache');
```

---

### phpunit.xml.dist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
         failOnWarning="true"
         failOnRisky="true"
         strictCoverage="false">

    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
        <testsuite name="Api">
            <directory>tests/Api</directory>
        </testsuite>
    </testsuites>

    <source>
        <include>
            <directory>src</directory>
        </include>
    </source>

    <coverage>
        <report>
            <html outputDirectory="var/coverage"/>
            <cobertura outputFile="var/coverage.xml"/>
        </report>
    </coverage>

    <php>
        <env name="APP_ENV" value="test"/>
        <env name="DATABASE_URL" value="pgsql://app:secret@localhost:5432/acme_test"/>
        <env name="REDIS_URL" value="redis://localhost:6379"/>
        <ini name="display_errors" value="On"/>
        <ini name="error_reporting" value="-1"/>
    </php>
</phpunit>
```

---

### Dockerfile (multi-stage)

```dockerfile
# syntax=docker/dockerfile:1

# ---- Base ----
FROM php:8.3.6-fpm-alpine AS base

RUN apk add --no-cache \
        libpq-dev \
        libzip-dev \
        icu-dev \
        oniguruma-dev \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        intl \
        mbstring \
        opcache \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /tmp/pear

WORKDIR /var/www/api

# ---- Development ----
FROM base AS development

RUN pecl install xdebug \
    && docker-php-ext-enable xdebug \
    && rm -rf /tmp/pear

COPY docker/php/php.ini.dev /usr/local/etc/php/php.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# ---- Production ----
FROM base AS production

COPY docker/php/php.ini.prod /usr/local/etc/php/php.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

COPY composer.json composer.lock ./
RUN composer install \
        --no-dev \
        --no-interaction \
        --no-progress \
        --optimize-autoloader \
        --classmap-authoritative \
    && composer clear-cache

COPY . .

RUN chown -R www-data:www-data var/

EXPOSE 9000
CMD ["php-fpm"]
```

---

### docker-compose.yml

```yaml
services:
  api:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
      target: development
    volumes:
      - .:/var/www/api:cached
      - composer-cache:/root/.composer/cache
    environment:
      APP_ENV: development
      DATABASE_URL: pgsql://app:secret@db:5432/acme_dev
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started

  web:
    image: nginx:1.26-alpine
    ports:
      - "8080:80"
    volumes:
      - .:/var/www/api:cached
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - api

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: acme_dev
    volumes:
      - pg-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7.2-alpine
    volumes:
      - redis-data:/data

volumes:
  pg-data:
  redis-data:
  composer-cache:
```

---

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@a5ac7e51b41094c92402da3b24376905380afc29 # v4.1.6

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: pdo, pdo_pgsql, intl, mbstring, redis, pcov
          coverage: pcov

      - name: Cache Composer dependencies
        uses: actions/cache@v4
        with:
          path: ~/.composer/cache
          key: ${{ runner.os }}-composer-${{ hashFiles('composer.lock') }}
          restore-keys: ${{ runner.os }}-composer-

      - name: Validate composer.json
        run: composer validate --strict

      - name: Install dependencies
        run: composer install --no-interaction --prefer-dist

      - name: Security audit
        run: composer audit

      - name: Check code style
        run: composer cs:check

      - name: Static analysis
        run: composer analyse

      - name: Run unit tests with coverage
        run: phpunit --testsuite Unit --coverage-cobertura var/coverage.xml

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        with:
          files: var/coverage.xml

  integration:
    name: Integration Tests
    runs-on: ubuntu-24.04
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: secret
          POSTGRES_DB: acme_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7.2-alpine
    steps:
      - uses: actions/checkout@a5ac7e51b41094c92402da3b24376905380afc29 # v4.1.6

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: pdo, pdo_pgsql, intl, mbstring, redis

      - name: Cache Composer dependencies
        uses: actions/cache@v4
        with:
          path: ~/.composer/cache
          key: ${{ runner.os }}-composer-${{ hashFiles('composer.lock') }}

      - name: Install dependencies
        run: composer install --no-interaction --prefer-dist

      - name: Run integration + API tests
        env:
          DATABASE_URL: pgsql://app:secret@localhost:5432/acme_test
          REDIS_URL: redis://localhost:6379
          APP_ENV: test
        run: phpunit --testsuite Integration --testsuite Api
```

---

### Makefile

```makefile
.PHONY: up down shell test quality cs fix analyse

up:
	docker compose up -d

down:
	docker compose down

shell:
	docker compose exec api sh

install:
	docker compose exec api composer install

test:
	docker compose exec api composer test

test-unit:
	docker compose exec api composer test:unit

quality:
	docker compose exec api composer quality

cs:
	docker compose exec api composer cs:check

fix:
	docker compose exec api composer cs:fix

analyse:
	docker compose exec api composer analyse
```

---

### Decision Rationale

| Decision | Choice Made | Alternatives Considered | Reason |
|---|---|---|---|
| PHP version | 8.3 | 8.1, 8.2 | Latest stable; typed class constants, `json_validate()`, `readonly` classes |
| Router | league/route | nikic/fast-route, Symfony Routing | PSR-15 middleware support, DI-friendly, minimal overhead |
| DI container | PHP-DI 7 | Symfony DIC, Pimple | Autowiring by type hint, PHP config (not XML/YAML), well-maintained |
| HTTP layer | Laminas Diactoros | nyholm/psr7, Guzzle PSR-7 | Full PSR-7/PSR-17 implementation, actively maintained |
| Static analysis | PHPStan level 8 | Psalm, PHPStan level 5 | Greenfield project -- maximum strictness from day one |
| Test framework | PHPUnit 11 | Pest | Team familiarity; PHPUnit 11 is required for PHP 8.2+ support |
| Coverage driver | pcov | Xdebug | pcov has <5% overhead vs 30--50% for Xdebug; faster CI |
| Docker base | php:8.3.6-fpm-alpine | Debian-based image | 80MB vs 450MB base; faster pulls in Kubernetes |

---

### Next Steps (Ordered by Priority)

1. Run `composer install` inside the development container and verify autoloading works with `composer dump-autoload --optimize`
2. Create `src/Kernel.php` as the application bootstrap: wire the DI container, register routes from `config/routes.php`, and return a PSR-15 request handler
3. Write `public/index.php` as a 5-line front controller: require autoloader, load `.env`, build Kernel, emit response
4. Establish the first passing PHPUnit test (even a trivial smoke test) to verify the test infrastructure before writing production code
5. Configure PhpStorm or VS Code path mappings for Xdebug step debugging against the Docker container
6. Create `config/container.php` with PHP-DI definitions and bind interfaces to concrete implementations
7. Implement the first API endpoint end-to-end (health check at `GET /health`) to validate the full request-response cycle works in the container environment
8. Add the pre-commit hook via `captainhook/captainhook` to block commits failing CS or PHPStan checks before CI catches them
