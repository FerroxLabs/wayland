---
name: ruby-project-setup
description: |
  Guides expert-level ruby project setup implementation: ruby and best-practices decision frameworks, production-ready patterns, and concrete templates for ruby project setup workflows.
  Use when the user asks about ruby project setup, ruby project setup configuration, or ruby best practices for ruby projects.
  Do NOT use when the user needs a different languages runtimes capability -- check sibling skills in the languages runtimes subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ruby best-practices template"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Ruby Project Setup

## When to Use

**Use this skill when:**
- User is starting a new Ruby application (gem, Rails app, Sinatra service, CLI tool, background worker) and needs a production-ready project structure from scratch
- User wants to establish Ruby version management, Bundler configuration, and dependency isolation for a team environment
- User needs to configure code quality tooling -- RuboCop, RSpec, SimpleCov, Brakeman, or Bundler Audit -- and integrate them into a CI pipeline
- User is converting an informal Ruby script or prototype into a maintainable project with proper structure, testing, and release conventions
- User asks about `.ruby-version`, `Gemfile` best practices, `bundler/setup`, frozen string literals, or `.rubocop.yml` baseline configuration
- User wants to set up a Ruby gem from scratch including `gemspec`, versioning, changelog, and Rake release tasks
- User needs guidance on local development workflow parity -- ensuring developers run the same Ruby version, same Bundler version, and same environment variable setup as CI

**Do NOT use this skill when:**
- User needs Rails-specific application architecture guidance -- that warrants a dedicated Rails architecture skill covering MVC structure, Active Record patterns, and asset pipeline
- User is asking about Ruby on Rails API design, serializers, or authentication -- those are framework-level concerns beyond project scaffolding
- User needs help with a specific Ruby language feature, metaprogramming technique, or algorithmic problem -- use a general Ruby programming skill
- User is asking about deploying a Ruby application to Heroku, Kubernetes, or AWS -- use infrastructure or deployment skills
- User needs help with a non-Ruby language project setup -- check sibling skills for Python, Node.js, Go, or Rust project setup
- User has an existing, mature Ruby codebase and is asking about refactoring patterns -- this skill covers initial setup and greenfield configuration, not legacy modernization

---

## Process

### Step 1: Determine Project Type and Scope

Before writing a single file, classify the project type -- each has a distinct canonical structure.

- **Ruby Gem:** Needs `gemspec`, `lib/gem_name.rb`, `lib/gem_name/version.rb`, `spec/`, `Rakefile` with `release` task, `CHANGELOG.md`, and `CODE_OF_CONDUCT.md`. Use `bundle gem <name>` as the scaffold, then customize.
- **Standalone CLI application:** Needs `exe/` or `bin/` directory, `lib/` for logic, an entry-point binary file with a shebang (`#!/usr/bin/env ruby`), and typically Thor or OptionParser for argument parsing.
- **Rack/Sinatra service:** Needs `config.ru`, `app/` or `lib/` for route handlers, `Gemfile` with explicit Rack/Sinatra versions, and a `Procfile` for process management.
- **Background worker / script:** Needs `lib/` for domain logic, `bin/` for entry points, and careful separation of configuration loading from business logic to enable testing.
- **Rails application:** Use `rails new` with `--database`, `--skip-*` flags as needed; this skill provides the surrounding project hygiene layer, not Rails-specific architecture.

Confirm these questions before proceeding:
- Will this be released as a gem (public or private registry)?
- Is this a team project or solo? Teams need stricter automation.
- What Ruby version is required or preferred? Check for end-of-life status -- Ruby versions receive security support for roughly 2 years after release. Prefer the latest stable minor version (e.g., 3.3.x as of 2024).
- Does the project need to target multiple Ruby versions (gem compatibility)?

---

### Step 2: Set Up Ruby Version Management

Ruby version management is the foundation everything else depends on.

- Use **rbenv** or **mise** (formerly rtx) as the version manager. rbenv is the most widely supported; mise handles multi-language version management and is gaining adoption rapidly.
- Avoid system Ruby for any project work -- system Ruby is often outdated (macOS ships with 2.6.x era), lacks write permissions to gem directories, and creates environment pollution.
- Create `.ruby-version` in the project root containing only the exact version string: `3.3.4`. No `ruby-` prefix, no comments.
- Lock to a **patch version** in `.ruby-version`, not just a minor version. This ensures every developer and CI runner uses identical behavior.
- In the `gemspec` (for gems), specify `required_ruby_version` with a range: `>= 3.1.0` restricts users from installing on unsupported Rubies. Use `~> 3.1` only if you genuinely test against all 3.x versions.
- In CI, test against the exact version in `.ruby-version` first; optionally add a job for the next minor version to catch forward-compatibility issues early.
- Add `.ruby-version` to version control. Never add it to `.gitignore`.

---

### Step 3: Configure Bundler and the Gemfile

Bundler is the dependency contract for the project. Poor Gemfile hygiene is the most common source of environment inconsistency.

- Lock the Bundler version itself. Add a `BUNDLED WITH` section by running `bundle install` locally. Commit `Gemfile.lock` for applications; do NOT commit `Gemfile.lock` for gems (it blocks consumer version resolution).
- Specify gem versions with **pessimistic constraints** (`~>`) rather than open-ended requirements: `gem 'rack', '~> 3.0'` allows patch updates but prevents breaking minor-version changes.
- Group gems correctly:
  ```ruby
  # Gemfile
  source 'https://rubygems.org'
  
  ruby file: '.ruby-version'  # reads from .ruby-version automatically
  
  gem 'dry-validation', '~> 1.10'
  gem 'zeitwerk', '~> 2.6'
  
  group :development do
    gem 'rubocop', '~> 1.65', require: false
    gem 'rubocop-rspec', require: false
    gem 'rubocop-performance', require: false
  end
  
  group :development, :test do
    gem 'rspec', '~> 3.13'
    gem 'factory_bot', '~> 6.4'
    gem 'faker', '~> 3.3'
  end
  
  group :test do
    gem 'simplecov', require: false
    gem 'webmock', '~> 3.23'
    gem 'vcr', '~> 6.2'
  end
  ```
- Set `require: false` on development tools (RuboCop, Brakeman, etc.) -- they should never be auto-required in application code.
- Configure Bundler path via `.bundle/config` or environment variable:
  ```
  BUNDLE_PATH: vendor/bundle   # preferred for Docker-based projects
  ```
  For non-Docker local dev, the default `~/.bundle` global path is acceptable.
- Run `bundle install --frozen` in CI to prevent accidental `Gemfile.lock` mutations during builds.

---

### Step 4: Establish Directory Structure

A consistent directory layout enables new contributors to navigate the project immediately.

**For a gem named `payment_gateway`:**
```
payment_gateway/
├── .bundle/
│   └── config
├── .github/
│   └── workflows/
│       └── ci.yml
├── bin/
│   ├── console        # interactive console with gem loaded
│   └── setup          # bootstraps local dev environment
├── exe/
│   └── payment_gateway  # executable binary (if CLI gem)
├── lib/
│   ├── payment_gateway.rb          # main entry point, requires internals
│   └── payment_gateway/
│       ├── version.rb              # ONLY the VERSION constant
│       ├── client.rb
│       ├── errors.rb
│       └── configuration.rb
├── spec/
│   ├── spec_helper.rb
│   └── payment_gateway/
│       ├── client_spec.rb
│       └── configuration_spec.rb
├── .ruby-version
├── .rubocop.yml
├── CHANGELOG.md
├── Gemfile
├── payment_gateway.gemspec
├── Rakefile
└── README.md
```

Key structural rules:
- `lib/gem_name.rb` loads all internal files via `require_relative` or Zeitwerk autoloader -- it is the public contract of the gem.
- `lib/gem_name/version.rb` contains ONLY `VERSION = '1.0.0'`. The gemspec requires this file to read the version. No other requires here.
- `bin/console` should load `require 'irb'` and `require_relative '../lib/gem_name'` then call `IRB.start`.
- `bin/setup` runs `bundle install`, any database setup commands, and prints a success message. Make it idempotent.
- The `exe/` directory (for executable gems) is separate from `bin/` (for dev scripts) -- this is Bundler convention.

---

### Step 5: Configure RuboCop for Code Quality

RuboCop is the standard static analysis and style enforcement tool for Ruby. Configure it thoughtfully -- a poorly configured RuboCop creates more friction than value.

Create `.rubocop.yml` at the project root:

```yaml
require:
  - rubocop-rspec
  - rubocop-performance

AllCops:
  NewCops: enable
  TargetRubyVersion: 3.3
  Exclude:
    - 'vendor/**/*'
    - 'bin/**/*'
    - 'exe/**/*'
    - '*.gemspec'
    - 'db/schema.rb'    # for Rails projects

# Layout
Layout/LineLength:
  Max: 120
  AllowedPatterns:
    - '^\s*#'           # allow long comment lines

# Style
Style/FrozenStringLiteralComment:
  Enabled: true
  EnforcedStyle: always

Style/StringLiterals:
  EnforcedStyle: single_quotes

Style/Documentation:
  Enabled: false         # disable for internal projects; enable for gems

# Metrics -- start permissive, tighten over time
Metrics/MethodLength:
  Max: 20

Metrics/ClassLength:
  Max: 200

Metrics/AbcSize:
  Max: 20

# RSpec
RSpec/ExampleLength:
  Max: 10

RSpec/MultipleExpectations:
  Max: 3
```

Critical configuration decisions:
- Always set `TargetRubyVersion` -- without it, RuboCop assumes an old default and misses version-specific cops.
- Enable `NewCops: enable` so you catch new offenses as RuboCop versions are updated rather than accumulating tech debt.
- Add `# frozen_string_literal: true` to every Ruby file -- this enables string deduplication and prevents accidental string mutation. RuboCop's `Style/FrozenStringLiteralComment` cop enforces this.
- Run `bundle exec rubocop --auto-gen-config` on legacy codebases to generate a `.rubocop_todo.yml` baseline, then reduce it over time.
- Integrate RuboCop as a git pre-commit hook using `overcommit` or `lefthook` to catch violations before push.

---

### Step 6: Set Up RSpec and Test Infrastructure

RSpec is the dominant testing framework for Ruby. Configure it for speed, clarity, and reliable CI behavior.

`spec/spec_helper.rb`:
```ruby
# frozen_string_literal: true

require 'simplecov'
SimpleCov.start do
  add_filter '/spec/'
  add_filter '/vendor/'
  minimum_coverage 85
  minimum_coverage_by_file 70
end

require 'payment_gateway'
require 'webmock/rspec'
require 'factory_bot'

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true   # prevents typos in stubbed method names
    mocks.verify_doubled_const_names = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
  config.filter_run_when_matching :focus
  config.disable_monkey_patching!
  config.warnings = true
  config.order = :random
  config.seed = rand(0xFFFF)  # print seed so failures are reproducible

  config.include FactoryBot::Syntax::Methods

  config.before(:suite) do
    FactoryBot.find_definitions
    WebMock.disable_net_connect!(allow_localhost: true)
  end
end
```

`.rspec` file (project root):
```
--require spec_helper
--format documentation
--color
--order random
```

Key testing configuration decisions:
- Set `config.warnings = true` -- Ruby warnings surface deprecations and potential bugs early.
- Enable `verify_partial_doubles: true` -- without this, stubbing a method that doesn't exist silently passes, masking misnamed methods.
- Randomize test order to catch order-dependent failures. When a failure is found, reproduce it with `rspec --seed <number>`.
- Set `minimum_coverage 85` in SimpleCov as a starting threshold for new projects. Coverage below 70% on individual files should be a warning signal.
- Use `add_filter '/spec/'` in SimpleCov -- spec files should not be included in their own coverage measurement.

---

### Step 7: Create CI Pipeline Configuration

CI is the enforcement mechanism for all quality standards. A CI pipeline that doesn't run quality checks is a quality check that doesn't exist.

`.github/workflows/ci.yml` (GitHub Actions):
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Ruby ${{ matrix.ruby }} Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        ruby: ['3.3']   # add '3.2', '3.1' for gems targeting multiple versions

    steps:
      - uses: actions/checkout@v4

      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: ${{ matrix.ruby }}
          bundler-cache: true  # runs bundle install and caches automatically

      - name: Run RuboCop
        run: bundle exec rubocop --format github

      - name: Run tests
        run: bundle exec rspec
        env:
          COVERAGE: true

      - name: Run Brakeman (security scan)
        run: bundle exec brakeman --no-pager
        if: hashFiles('config/application.rb') != ''  # only for Rails apps

      - name: Run bundler-audit
        run: |
          bundle exec bundle-audit update
          bundle exec bundle-audit check
```

CI configuration decisions:
- Use `ruby/setup-ruby` with `bundler-cache: true` -- this action handles both rbenv setup and Bundler caching automatically. A cache hit reduces CI time from 60-90 seconds of gem installation to under 5 seconds.
- Run RuboCop with `--format github` on GitHub Actions -- this format creates inline PR annotations rather than plain text output.
- Run `bundle-audit` in every CI job -- it checks `Gemfile.lock` against the Ruby Advisory Database for known CVEs and takes under 2 seconds.
- For gems, add a matrix across `['3.1', '3.2', '3.3']` to confirm compatibility.
- Set a `COVERAGE=true` environment variable to conditionally run SimpleCov -- avoid running coverage locally unless needed, as it adds 10-15% overhead to test execution.

---

### Step 8: Add Developer Ergonomics and Documentation Scaffolding

A project setup is incomplete without the tooling that makes day-to-day development productive.

**`Rakefile`:**
```ruby
# frozen_string_literal: true

require 'rspec/core/rake_task'
require 'rubocop/rake_task'

RSpec::Core::RakeTask.new(:spec)
RuboCop::RakeTask.new

task default: %i[rubocop spec]
```

For gems, add release automation:
```ruby
require 'bundler/gem_tasks'
# Now `rake release` tags, pushes, and publishes the gem
```

**`bin/setup`:**
```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

echo "==> Installing dependencies..."
bundle install

echo "==> Copying environment template..."
[ -f .env ] || cp .env.example .env

echo "==> Setup complete. Run 'bin/console' to start an interactive session."
```

**`.env.example`** (never `.env` -- that stays in `.gitignore`):
```
APP_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgres://localhost:5432/myapp_development
```

**`.gitignore` essentials:**
```
# Bundler
.bundle/
vendor/bundle/
*.gem

# Environment
.env
.env.local
.env.*.local

# Coverage
coverage/
.simplecov

# Editor
.idea/
.vscode/
*.swp

# OS
.DS_Store
```

**`CHANGELOG.md`** -- start with a template following Keep a Changelog format:
```markdown
# Changelog
All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to Semantic Versioning.

## [Unreleased]
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
```

---

## Output Format

When delivering a Ruby project setup recommendation, use this structure:

```
## Ruby Project Setup: [Project Name]

### Project Classification
- Type: [Gem | Rails App | Sinatra Service | CLI Tool | Background Worker]
- Ruby Version: [e.g., 3.3.4]
- Team Size: [number]
- Multi-version Support: [Yes -- 3.1, 3.2, 3.3 | No -- 3.3 only]

### Toolchain Decision Matrix

| Tool              | Selection         | Rationale                                  |
|-------------------|-------------------|--------------------------------------------|
| Version Manager   | rbenv / mise      | [specific reason based on team context]    |
| Bundler Version   | 2.5.x             | Matches .ruby-version Ruby for consistency |
| Testing Framework | RSpec 3.13        | [rationale]                                |
| Linting           | RuboCop 1.65+     | [rationale]                                |
| Coverage          | SimpleCov         | Threshold: 85% overall, 70% per file       |
| Security Scan     | bundler-audit     | [rationale]                                |
| Pre-commit Hooks  | lefthook / overcommit | [rationale]                            |

### Directory Structure
[full tree as described in Step 4]

### Configuration Files
[all files from Steps 2-8 with content]

### CI Pipeline
[full workflow YAML]

### Setup Commands
```bash
# Initial setup
git clone <repo>
cd <project>
rbenv install   # reads .ruby-version automatically
bin/setup       # installs gems, copies .env.example
```

### Quality Thresholds
- RuboCop: 0 offenses (enforced in CI)
- Test Coverage: >= 85% overall (enforced by SimpleCov)
- Security: 0 known CVEs (enforced by bundler-audit)
- Test Suite Runtime: target < 30 seconds for unit tests

### Next Steps
1. [specific immediate action]
2. [specific immediate action]
3. [specific immediate action]
```

---

## Rules

1. **Never use system Ruby for a project.** System Ruby on macOS is Apple's internal tooling Ruby and is typically 2 or more major versions behind. It has restricted gem installation paths and causes gem permission errors. Always install a project-specific Ruby via rbenv, mise, or asdf and confirm with `which ruby` and `ruby --version` before proceeding.

2. **Commit `Gemfile.lock` for applications, never for gems.** Applications lock dependencies so all developers and CI runners get byte-for-byte identical gem trees. Gems must NOT commit `Gemfile.lock` because doing so prevents consumers from resolving compatible versions with their own dependency trees. This is the single most common Bundler confusion for new Ruby developers.

3. **Every Ruby file must start with `# frozen_string_literal: true`.** This pragma has been the standard since Ruby 2.3 and was planned as the default for Ruby 3.0 (deferred but recommended). It prevents `String#<<` and similar mutating operations from accidentally mutating shared string literals, and enables Ruby to deduplicate identical string literals, reducing heap allocations by 15-30% in string-heavy code.

4. **Set `TargetRubyVersion` explicitly in `.rubocop.yml`.** Without it, RuboCop defaults to a conservative version assumption and disables cops for newer language features. This means real style issues introduced by Ruby 3.x features will silently pass linting.

5. **Use `verify_partial_doubles: true` in RSpec.** Without this setting, `allow(object).to receive(:nonexistent_method)` passes silently. This masks method renames and typos in test doubles, creating tests that pass while the actual code is broken. Enable it from day one.

6. **Never put secrets or credentials in `.env.example` -- put placeholder names and safe example formats only.** The `.env.example` file communicates to developers what variables are required. The actual `.env` file must be in `.gitignore` and must never be committed. Rotate any credential that touches version control immediately.

7. **Pin RuboCop to a minor version range, not open-ended.** RuboCop introduces new cops on every release. An open-ended `gem 'rubocop'` dependency will cause CI failures on Monday morning when a new RuboCop version is released over the weekend. Use `gem 'rubocop', '~> 1.65', require: false` to control upgrade timing.

8. **`lib/gem_name/version.rb` must contain only the VERSION constant.** The `gemspec` requires this file to read the version without loading the entire gem (and its potentially unresolved dependencies). If you add `require` statements to `version.rb`, the gemspec loading will fail in environments where those dependencies are not yet installed.

9. **Run `bundle exec` for every gem-installed command in scripts and CI.** Running `rubocop` instead of `bundle exec rubocop` will use whatever version is globally installed on the machine (or none at all), bypassing Bundler's resolved dependency tree and producing inconsistent results between environments.

10. **Test the `bin/setup` script on a clean environment before merging.** The most common cause of onboarding friction is a `bin/setup` script written by someone who already has the environment configured. Test it in a fresh Docker container or ask a new team member to run it on their machine. Every missing step is a future onboarding failure.

---

## Edge Cases

### Multi-Ruby Version Support for Gems
When a gem must support multiple Ruby versions (e.g., Ruby 3.1, 3.2, and 3.3), configure the CI matrix accordingly and be explicit in the `gemspec`:
```ruby
spec.required_ruby_version = '>= 3.1.0'
```
Test against all supported versions in CI. Use `RUBY_VERSION` constant guards only as a last resort -- prefer conditional `require` and feature detection over version branching. When a feature is available in 3.2+ only, document the minimum version requirement rather than shimming behavior.

### Windows Development Environments
Some gems have native extensions that behave differently on Windows. If team members use Windows, specify the `x86_64-mingw32` or `x64-mingw-ucrt` platform in the `Gemfile.lock`. Use `bundle lock --add-platform x86_64-mingw32` to add Windows platform resolution. Some gems (notably `bcrypt`, `nokogiri`) have Windows-specific binary gem variants -- configure Bundler to prefer pre-compiled binaries: `BUNDLE_FORCE_RUBY_PLATFORM: false`.

### Monorepo With Multiple Ruby Services
When multiple Ruby services share a monorepo, each service needs its own `Gemfile`, `Gemfile.lock`, `.ruby-version`, and `.rubocop.yml`. Do NOT share a single top-level `Gemfile` across services -- dependency conflicts are inevitable and the blast radius of `bundle update` becomes enormous. Share common RuboCop configuration by using inheritance: create a `.rubocop-shared.yml` at the monorepo root and include it in each service's `.rubocop.yml` with `inherit_from: ../../.rubocop-shared.yml`.

### Private Gem Registry
When using a private gem registry (GitHub Packages, Gemstash, JFrog Artifactory), configure Bundler to authenticate without embedding credentials in `Gemfile`:
```ruby
# Gemfile
source 'https://gems.example.com' do
  gem 'internal_library', '~> 2.1'
end
```
Store credentials in `.bundle/config` (not committed) or as environment variables: `BUNDLE_GEMS__EXAMPLE__COM: "token:$TOKEN"`. The environment variable naming convention is the source URL with dots and slashes replaced by double underscores and uppercased.

### Legacy Codebase With No Tests Adopting RuboCop
Running `rubocop` on a codebase with zero prior enforcement will produce thousands of offenses. Do not attempt to fix them all at once -- this creates enormous, unreviable PRs with high merge conflict risk. Run `bundle exec rubocop --auto-gen-config` to generate `.rubocop_todo.yml` with all existing violations excluded. Then add a `TODO` count comment to each entry noting the offense count. Reduce the todo list by 10-20 offenses per PR over multiple weeks, prioritizing high-signal cops (security, correctness) over low-signal ones (style).

### Docker-Based Development Environments
When developers use Docker for local development, set `BUNDLE_PATH: /usr/local/bundle` in the container and volume-mount it separately from the application code so gems persist across container rebuilds. The `.ruby-version` file is still useful as documentation, but pin the `FROM ruby:3.3.4` base image in `Dockerfile` to a patch version -- the `ruby:3.3` tag updates to new patch releases and can introduce unexpected behavior.

### Project Requiring Custom `require` Load Order
When a project loads many files and load order matters (circular dependency risks with manual `require`), introduce **Zeitwerk** as the autoloader:
```ruby
# lib/payment_gateway.rb
require 'zeitwerk'
loader = Zeitwerk::Loader.for_gem
loader.setup
```
Zeitwerk uses file-system conventions to autoload constants -- `lib/payment_gateway/client.rb` defines `PaymentGateway::Client`. This eliminates `require_relative` chains entirely and prevents load-order bugs. Zeitwerk also enables hot-reloading in development via `loader.reload`. Verify the autoload map during setup with `loader.eager_load` in tests.

---

## Example

**Input:** "I'm starting a new Ruby gem called `data_validator` that validates data structures against schemas. It needs to support Ruby 3.1 through 3.3, will be published to RubyGems, and I'm working with a team of 4. We want strict quality enforcement from day one."

**Output:**

---

## Ruby Project Setup: data_validator Gem

### Project Classification
- Type: Public Ruby Gem
- Ruby Version: 3.3.4 (development); supports 3.1.0+
- Team Size: 4 engineers
- Multi-version Support: Yes -- 3.1, 3.2, 3.3 (CI matrix)
- Publishing Target: RubyGems.org

### Toolchain Decision Matrix

| Tool            | Selection             | Rationale                                                          |
|-----------------|-----------------------|--------------------------------------------------------------------|
| Version Manager | rbenv                 | Widest team tooling support; mise acceptable alternative           |
| Bundler Version | 2.5.x                 | Included with Ruby 3.3; do NOT commit Gemfile.lock (gem policy)   |
| Testing         | RSpec 3.13            | Industry standard for gems; rich matcher ecosystem                 |
| Linting         | RuboCop 1.65 + rspec  | rubocop-rspec adds RSpec-specific cops essential for test quality  |
| Coverage        | SimpleCov 0.22        | 90% overall threshold appropriate for new gem with full control    |
| Security        | bundler-audit         | CVE check on Gemfile.lock; fast, zero false positives              |
| Pre-commit      | lefthook              | Fast, parallel hook execution; no Ruby runtime dependency          |

---

### Initial Scaffold

```bash
# Install the target Ruby version
rbenv install 3.3.4

# Scaffold with Bundler's built-in generator
bundle gem data_validator \
  --test=rspec \
  --linter=rubocop \
  --changelog \
  --ci=github

cd data_validator
```

---

### `.ruby-version`
```
3.3.4
```

---

### `data_validator.gemspec`
```ruby
# frozen_string_literal: true

require_relative 'lib/data_validator/version'

Gem::Specification.new do |spec|
  spec.name    = 'data_validator'
  spec.version = DataValidator::VERSION
  spec.authors = ['Your Team']
  spec.email   = ['team@example.com']

  spec.summary     = 'Validates data structures against declarative schemas.'
  spec.description = 'DataValidator provides a DSL for defining schemas and validating ' \
                     'Ruby Hash and Array structures with detailed error reporting.'
  spec.homepage    = 'https://github.com/yourorg/data_validator'
  spec.license     = 'MIT'

  spec.required_ruby_version = '>= 3.1.0'

  spec.metadata['homepage_uri']    = spec.homepage
  spec.metadata['source_code_uri'] = spec.homepage
  spec.metadata['changelog_uri']   = "#{spec.homepage}/blob/main/CHANGELOG.md"
  spec.metadata['rubygems_mfa_required'] = 'true'  # enforce MFA on gem publishing

  spec.files = Dir[
    'lib/**/*.rb',
    'exe/**/*',
    'CHANGELOG.md',
    'LICENSE.txt',
    'README.md'
  ]
  spec.require_paths = ['lib']

  # Runtime dependencies -- keep this minimal
  # spec.add_dependency 'dry-core', '~> 1.0'
end
```

---

### `Gemfile`
```ruby
# frozen_string_literal: true

source 'https://rubygems.org'

# Load gemspec's runtime dependencies
gemspec

ruby file: '.ruby-version'

group :development do
  gem 'rubocop',             '~> 1.65', require: false
  gem 'rubocop-rspec',                  require: false
  gem 'rubocop-performance',            require: false
  gem 'rake',                '~> 13.1'
end

group :development, :test do
  gem 'rspec', '~> 3.13'
end

group :test do
  gem 'simplecov',  '~> 0.22', require: false
  gem 'webmock',    '~> 3.23'
end
```

---

### `lib/data_validator/version.rb`
```ruby
# frozen_string_literal: true

module DataValidator
  VERSION = '0.1.0'
end
```

---

### `lib/data_validator.rb`
```ruby
# frozen_string_literal: true

require 'zeitwerk'

loader = Zeitwerk::Loader.for_gem
loader.setup

module DataValidator
  class Error < StandardError; end
  class SchemaError < Error; end
  class ValidationError < Error
    attr_reader :errors

    def initialize(errors)
      @errors = errors
      super("Validation failed: #{errors.join(', ')}")
    end
  end
end
```

---

### `.rubocop.yml`
```yaml
require:
  - rubocop-rspec
  - rubocop-performance

AllCops:
  NewCops: enable
  TargetRubyVersion: 3.1   # lowest supported version for cop compatibility
  Exclude:
    - 'vendor/**/*'
    - 'bin/**/*'
    - 'exe/**/*'
    - 'data_validator.gemspec'

Layout/LineLength:
  Max: 120

Style/FrozenStringLiteralComment:
  Enabled: true
  EnforcedStyle: always

Style/StringLiterals:
  EnforcedStyle: single_quotes

Style/Documentation:
  Enabled: true   # enforce documentation for public gem API

Metrics/MethodLength:
  Max: 15

Metrics/ClassLength:
  Max: 150

RSpec/ExampleLength:
  Max: 8

RSpec/MultipleExpectations:
  Max: 2
```

---

### `spec/spec_helper.rb`
```ruby
# frozen_string_literal: true

if ENV['COVERAGE']
  require 'simplecov'
  SimpleCov.start do
    add_filter '/spec/'
    add_filter '/vendor/'
    minimum_coverage 90
    minimum_coverage_by_file 75
  end
end

require 'data_validator'
require 'webmock/rspec'

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
    mocks.verify_doubled_const_names = true
  end

  config.disable_monkey_patching!
  config.warnings = true
  config.order = :random

  config.before(:suite) do
    WebMock.disable_net_connect!
  end
end
```

---

### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Ruby ${{ matrix.ruby }} on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        ruby: ['3.1', '3.2', '3.3']
        os: [ubuntu-latest]
        include:
          - ruby: '3.3'
            os: ubuntu-latest
            coverage: true

    steps:
      - uses: actions/checkout@v4

      - name: Set up Ruby ${{ matrix.ruby }}
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: ${{ matrix.ruby }}
          bundler-cache: true

      - name: Lint with RuboCop
        run: bundle exec rubocop --format github
        if: matrix.ruby == '3.3'  # lint once on latest Ruby

      - name: Run tests
        run: bundle exec rspec
        env:
          COVERAGE: ${{ matrix.coverage || 'false' }}

      - name: Check for security vulnerabilities
        run: |
          bundle exec bundle-audit update
          bundle exec bundle-audit check
        if: matrix.ruby == '3.3'
```

---

### `Rakefile`
```ruby
# frozen_string_literal: true

require 'bundler/gem_tasks'
require 'rspec/core/rake_task'
require 'rubocop/rake_task'

RSpec::Core::RakeTask.new(:spec)
RuboCop::RakeTask.new

task default: %i[rubocop spec]
```

---

### `bin/setup`
```bash
#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing Ruby gems..."
bundle install

echo ""
echo "==> Setup complete!"
echo "    Run 'bundle exec rake' to execute linting and tests."
echo "    Run 'bin/console' to start an interactive session."
```

```bash
chmod +x bin/setup bin/console
```

---

### `bin/console`
```ruby
#!/usr/bin/env ruby
# frozen_string_literal: true

require 'bundler/setup'
require 'data_validator'
require 'irb'

IRB.start(__FILE__)
```

---

### Initial Setup Commands
```bash
rbenv install 3.3.4          # install Ruby (reads .ruby-version)
bundle install               # install development gems
bundle exec rake             # run rubocop + rspec -- should pass clean
git add -A
git commit -m "chore: initial project scaffold with full quality toolchain"
```

---

### Quality Thresholds Enforced in CI
| Check           | Threshold                   | Enforcement                      |
|-----------------|-----------------------------|----------------------------------|
| RuboCop         | 0 offenses                  | CI fails on any offense          |
| Test Coverage   | 90% overall, 75% per file   | SimpleCov raises on merge to main|
| Security CVEs   | 0 known vulnerabilities     | bundler-audit blocks the build   |
| Ruby Compat     | Ruby 3.1, 3.2, 3.3          | All 3 matrix jobs must pass      |

---

### Next Steps
1. Replace the placeholder summary and description in `data_validator.gemspec` with the real description before the first release.
2. Create `lib/data_validator/schema.rb` and `lib/data_validator/validator.rb` as the first domain files -- Zeitwerk will autoload them as `DataValidator::Schema` and `DataValidator::Validator`.
3. Write the first failing RSpec example before writing implementation code -- the test infrastructure is ready immediately.
4. Add `CHANGELOG.md` entries under `[Unreleased]` for every user-visible change during development.
5. When ready to publish: confirm MFA is enabled on your RubyGems.org account (required by `rubygems_mfa_required` in gemspec), then run `bundle exec rake release`.
