---
name: technical-documentation
description: |
  Guides expert-level technical documentation implementation: documentation and best-practices decision frameworks, production-ready patterns, and concrete templates for technical documentation workflows.
  Use when the user asks about technical documentation, technical documentation configuration, or documentation best practices for technical projects.
  Do NOT use when the user needs a different developer tools capability -- check sibling skills in the developer tools subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "documentation best-practices clean-code"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Technical Documentation

## When to Use

**Use this skill when:**
- A user is designing or redesigning a documentation system for a software project and needs to choose between documentation approaches (README-only, wiki, docs-as-code, portal, in-code)
- A user is writing or reviewing specific documentation artifacts -- API references, READMEs, architecture decision records, runbooks, onboarding guides, or changelogs
- A user wants to establish documentation standards, templates, or contribution workflows for a team
- A user is evaluating documentation toolchains and needs to select between options like Docusaurus, MkDocs, Sphinx, Vale, or TypeDoc based on their stack and audience
- A user is auditing existing documentation quality and wants a structured improvement plan
- A user needs to implement docs-as-code practices -- versioning docs alongside code, running documentation linting in CI, or publishing docs from a pipeline
- A user is writing inline code documentation (JSDoc, docstrings, XML doc comments) and needs guidance on what to document and at what level of detail
- A user needs to write or update an OpenAPI/Swagger specification and wants to produce human-readable API documentation from it

**Do NOT use this skill when:**
- The user needs help writing API integration code from existing documentation -- this is an API integration skill
- The user is asking how to set up a static site host (Netlify, Vercel, GitHub Pages) generically -- check the deployment skills subcategory
- The user needs help with content marketing or product documentation for non-technical audiences -- this is a content strategy problem, not technical documentation
- The user is asking how to structure a software project's directory layout -- check the project scaffolding skill
- The user wants to write commit messages or pull request descriptions -- check the version control workflow skill
- The user needs help with code review processes specifically -- check the code review skill
- The user is asking about testing strategy or test documentation -- check the testing skills subcategory

---

## Process

### 1. Classify the Documentation Type and Audience

Before writing a single word, establish exactly what kind of documentation is being created and who reads it.

- **Identify the documentation category:** Choose from the Divio four-quadrant model -- Tutorials (learning-oriented), How-to guides (task-oriented), Reference (information-oriented), and Explanations (understanding-oriented). Each has different structural and content requirements. Do not mix categories inside a single document.
- **Define the primary reader:** A junior developer onboarding to the project, a senior engineer debugging production at 2am, an external API consumer, a product manager assessing capabilities, or a QA engineer reproducing a bug all need fundamentally different content even about the same system.
- **Establish prior knowledge baseline:** Document what the reader is assumed to already know. State technology prerequisites explicitly (e.g., "assumes familiarity with async/await in JavaScript and basic HTTP concepts"). This prevents the dual failure mode of over-explaining and under-explaining.
- **Identify where the documentation lives:** Inline (code comments, docstrings), near-code (README, CHANGELOG, docs/ directory), or remote (developer portal, wiki, Confluence). The location determines format constraints, update cadence, and maintenance ownership.
- **Note freshness requirements:** Reference documentation tied to code must update on every interface change. Conceptual explanations may be stable for years. Runbooks must reflect current infrastructure. Assign an explicit review cadence to each document type (weekly for runbooks, per-release for API reference, quarterly for architecture explanations).

---

### 2. Select the Documentation Toolchain

Choosing the wrong tool creates long-term friction. Make a deliberate decision based on the project's language ecosystem, audience, and output needs.

- **For Python projects:** Use Sphinx with the autodoc extension to generate API reference from docstrings. Use Google-style or NumPy-style docstrings (pick one, enforce it with pydocstyle). For user-facing docs alongside code, MkDocs with the Material theme is faster to set up and easier for non-Python contributors to edit.
- **For JavaScript/TypeScript projects:** Use TypeDoc for API reference generation from JSDoc/TSDoc annotations. Use Docusaurus for documentation portals that need versioning, i18n, and a polished UI. Use JSDoc 3 comment syntax with `@param`, `@returns`, `@throws`, and `@example` tags on every public function.
- **For multi-language or polyglot projects:** Use Docusaurus or MkDocs Material as the documentation portal. Embed language-specific reference docs as tabs or sub-sections. Use OpenAPI 3.1 for REST APIs regardless of backend language.
- **For REST APIs:** Maintain an OpenAPI 3.1 spec as the source of truth. Use Redocly or Swagger UI to render it. Generate server stubs and client SDKs from the spec with tools like openapi-generator. Never write the API reference prose by hand -- the spec is the reference.
- **For documentation quality enforcement:** Use Vale (the open-source prose linter) with a style guide rule set (Microsoft Writing Style Guide rules are available as a Vale package). Run Vale in CI on every PR that touches `.md` or `.rst` files. Enforce a maximum Flesch-Kincaid grade level of 12 for developer documentation.
- **Evaluate the build and publish pipeline:** The docs must build in CI within 60 seconds for most projects (under 120 seconds for large monorepos). Anything slower will be bypassed by contributors under deadline pressure. Test this early.

---

### 3. Structure the Documentation Architecture

A documentation architecture defines what documents exist, how they relate, and how users navigate between them.

- **Create a documentation map before writing:** List every document the project needs, classified by type (tutorial, how-to, reference, explanation). This prevents gaps (no onboarding path) and duplications (three half-accurate descriptions of the same concept).
- **Design for the most common user path first:** For a developer library, this is: README → Installation guide → Quickstart tutorial → API reference. Every other document should link into this spine.
- **Apply the three-click rule:** Any piece of information a user needs should be reachable within three navigation actions from the documentation home page. Flatten navigation hierarchies deeper than three levels.
- **Establish canonical pages for concepts:** If "authentication" is explained in three places, it will be three versions of the truth. Create one authoritative "Authentication" reference page and link to it from every other document that mentions the topic.
- **Design versioning strategy before the first release:** Decide whether docs are versioned per minor release, per major release, or unversioned with a "latest" convention. Docusaurus supports versioned docs with a single CLI command (`npm run docusaurus docs:version 2.0`). Unversioned docs are acceptable only when the API has strong backward compatibility guarantees.
- **Plan the changelog format:** Use Keep a Changelog format with sections: Added, Changed, Deprecated, Removed, Fixed, Security. Every user-visible change must have a changelog entry written for the affected audience -- not "fixed bug" but "Fixed incorrect 401 error returned when API key contained uppercase letters."

---

### 4. Write README and Project-Level Documentation

The README is the most-read document in any software project. It has a specific job: answer "should I use this and how do I start?" in under two minutes.

- **README required sections in order:**
  1. Project name and one-sentence description (what it does, not what it is)
  2. Status badges: build status, test coverage, latest version, license
  3. Problem statement: two to four sentences on what problem this solves and for whom
  4. Quickstart: working code example that runs in under 10 commands from a clean environment
  5. Prerequisites and installation: exact commands, exact version requirements
  6. Links to full documentation, contributing guide, and changelog
  7. License
- **The Quickstart must actually work:** Test the README quickstart steps on a fresh environment (a Docker container or CI job) on every release. A broken quickstart is worse than no quickstart -- it signals an unmaintained project.
- **Keep README under 1,000 words for libraries, under 2,000 for frameworks:** Anything longer belongs in the full documentation. Link out rather than inline extensive content.
- **Write the CONTRIBUTING.md file even for small projects:** It must cover: development environment setup (exact commands), how to run tests, branch naming conventions, PR process, and code style requirements. This document's existence signals project health to outside contributors.
- **Include a SECURITY.md:** Specify how to report vulnerabilities privately (email or security advisory form). GitHub displays this prominently. Its absence is a meaningful negative signal for security-conscious adopters.

---

### 5. Write Inline Code Documentation

Inline documentation is the documentation developers read most often. Write it as a professional obligation, not an afterthought.

- **Document the why, not the what:** Code explains what it does. Comments explain why the code does it that way when the reason is not obvious. A comment that says `// increment counter` is noise. A comment that says `// offset by 1 because the vendor API uses 1-based pagination` is essential context.
- **Apply a documentation threshold to functions/methods:** Document every public API function unconditionally. Document private functions when the algorithm is non-obvious, involves a performance tradeoff, or has known gotchas. Do not document trivial getters/setters.
- **Write complete JSDoc/docstring blocks for public interfaces:**
  - `@param` or equivalent for every parameter with type and semantic meaning (not just the type name)
  - `@returns` describing the return value and its shape
  - `@throws` listing every exception the caller must handle
  - `@example` with a working code snippet for any non-trivial function
  - `@since` noting the version when the API was introduced
  - `@deprecated` with migration path for deprecated APIs
- **Use TODO comments with ticket references:** `// TODO(JIRA-1234): Remove this workaround after vendor releases v3.2` is acceptable. Plain `// TODO: fix this` is a debt trap with no owner or timeline.
- **For complex algorithms, write the algorithm description before the code:** A three-to-five sentence description of the algorithm approach (e.g., "Uses a two-pointer technique to find pairs. Left pointer starts at index 0, right at the end. Moves inward based on sum comparison against target.") makes the subsequent code readable to anyone regardless of familiarity with the specific algorithm.
- **Maximum comment density guideline:** Comments should constitute 10-30% of total lines in a complex module. Under 10% in a complex module suggests under-documentation. Over 40% often suggests the code itself needs to be refactored for clarity first.

---

### 6. Write API Reference Documentation

API reference is the documentation developers consult most frequently in day-to-day use. It must be complete, accurate, and fast to scan.

- **Every endpoint or function must have:** Description (one to three sentences), parameters table with name/type/required/default/description columns, return value description, error conditions table, and at minimum one working example in each supported language/format.
- **For REST APIs using OpenAPI 3.1:**
  - Use `summary` for the one-line description that appears in navigation (under 10 words)
  - Use `description` for full prose using Markdown, including caveats and cross-references
  - Use `x-codeSamples` extension to embed request examples in curl, Python, and JavaScript
  - Define every response schema fully -- do not use `{}` for response schemas
  - Use `$ref` to define shared schemas in `#/components/schemas` -- never inline the same object shape more than once
  - Include 400, 401, 403, 404, 422, 429, and 500 responses for every endpoint that can logically return them
- **Error documentation is the most important part of API reference:** Document every error code, what triggers it, and exactly what the caller must do to recover. The error section is read most often by developers at the worst moments.
- **Include rate limit documentation prominently:** If the API has rate limits, document the limit (requests per second/minute/hour), the error code when exceeded (typically 429), the `Retry-After` header format, and the recommended backoff strategy.
- **Version the API reference clearly:** Mark each endpoint with the version it was introduced and, if deprecated, the version it will be removed and the replacement endpoint.

---

### 7. Write Architecture Decision Records (ADRs)

ADRs prevent the single most common source of technical debt: undocumented decisions that cannot be revisited because no one remembers the original constraints.

- **Use the Nygard ADR format:** Title, Status (Proposed/Accepted/Deprecated/Superseded), Context, Decision, Consequences. Some teams add Alternatives Considered and a Metrics section. Do not over-engineer the template.
- **Write an ADR for decisions that:** Are difficult to reverse, involve tradeoffs between competing valid approaches, involve significant cost (in time, money, or complexity), or will be questioned by future team members without context.
- **ADR scope examples that warrant an ADR:** Choosing PostgreSQL over MySQL, selecting a monorepo over polyrepo, adopting event sourcing, choosing REST over GraphQL, selecting a specific authentication library, deciding to vendor a dependency rather than use a package manager.
- **ADR scope examples that do NOT warrant an ADR:** Choosing a formatter configuration, picking a color scheme, naming a variable.
- **Number ADRs sequentially:** `ADR-001`, `ADR-002`, etc. Store them in `docs/decisions/` or `adr/` at the project root, versioned with the code. Never delete an ADR -- mark it Superseded and link to the new ADR.
- **Write ADR context in past tense, decision in present tense:** "We were scaling to 10 million daily active users and the existing session store..." vs. "We use Redis Cluster for session storage."
- **Link ADRs from the code they affect:** In the source file or configuration where a non-obvious decision manifests, add a comment: `// See ADR-014 for why we use optimistic locking here instead of a mutex`.

---

### 8. Establish Documentation CI/CD and Maintenance Culture

Documentation without enforcement degrades. Documentation without a build pipeline will drift from reality.

- **Minimum CI checks for every PR touching documentation:**
  - Vale prose linting with an enforced style guide
  - Spell checking (cspell or aspell) with a project-specific word list committed to the repo
  - Link checking with a tool like lychee or markdown-link-check -- broken links fail the build
  - For OpenAPI specs, schema validation with spectral using the default OAS ruleset
  - For docstring-generated reference, verify the build succeeds with no warnings treated as errors
- **Set up documentation coverage metrics:** For TypeDoc and Sphinx projects, configure the build to report undocumented public symbols as warnings. Set a threshold (e.g., 90% of public API surface documented) and fail CI below it. Track this metric per release.
- **Assign documentation ownership:** In a CODEOWNERS file, assign documentation directories to specific teams or individuals. Documentation without an owner is documentation no one maintains.
- **Create a documentation rotation:** On a team of 6+, rotate the "docs owner" role each sprint. This person reviews all documentation PRs, files issues for discovered gaps, and monitors doc site analytics for high-bounce pages.
- **Audit documentation at each major release:** Before cutting a major release, run a full documentation audit: verify all code examples in the docs still run, verify all links resolve, verify the quickstart works end-to-end, and verify the changelog is complete.
- **Use analytics to prioritize documentation work:** Deploy Plausible or a similar lightweight analytics tool on the documentation portal. Pages with high traffic and high exit rates are the highest-priority documentation improvements.

---

## Output Format

When providing documentation guidance, use this structured output format:

```markdown
## Documentation Assessment

**Project type:** [library / service / CLI / framework / platform]
**Primary audience:** [internal developers / external developers / operations / mixed]
**Documentation maturity level:** [none / ad-hoc / partial / systematic / excellent]

---

## Documentation Architecture Map

| Document | Type | Audience | Owner | Review Cadence | Status |
|----------|------|----------|-------|----------------|--------|
| README.md | Reference + Entry point | All | Team lead | Per release | [exists/needed/update] |
| CHANGELOG.md | Reference | Users + devs | Release owner | Per release | [exists/needed/update] |
| docs/getting-started.md | Tutorial | New users | DX team | Quarterly | [exists/needed/update] |
| docs/api-reference/ | Reference | API consumers | API owners | Per release | [exists/needed/update] |
| docs/decisions/ | Explanation (ADRs) | Team | Architect | Per decision | [exists/needed/update] |
| docs/runbooks/ | How-to | Operations | SRE team | Per incident | [exists/needed/update] |
| CONTRIBUTING.md | How-to | Contributors | Team lead | Per process change | [exists/needed/update] |

---

## Toolchain Recommendation

**Documentation generator:** [Docusaurus / MkDocs Material / Sphinx / TypeDoc + Docusaurus]
**Rationale:** [2-3 sentences based on project language and audience]

**API reference tool:** [OpenAPI + Redocly / TypeDoc / Sphinx autodoc]
**Prose linter:** Vale with [Microsoft / Google / custom] style guide
**CI checks:** Vale + cspell + lychee + [spectral / pydocstyle / tsdoc-check]

---

## Priority Improvements (Ordered by Impact)

### 1. [Highest priority gap]
**Problem:** [specific deficiency]
**Solution:** [concrete action]
**Effort:** [small / medium / large]
**Template:**
[Paste actual template or example content here]

### 2. [Second priority gap]
...

---

## Implementation Plan

| Week | Deliverable | Owner | Definition of Done |
|------|-------------|-------|-------------------|
| 1 | [specific document or tooling task] | [role] | [testable completion criterion] |
| 2 | [specific document or tooling task] | [role] | [testable completion criterion] |
| 3 | [specific document or tooling task] | [role] | [testable completion criterion] |

---

## Sample Document

[Complete draft of the highest-priority missing document based on information provided]
```

---

## Rules

1. **Never mix Divio documentation quadrants in a single document.** A tutorial that drifts into reference material confuses beginners and frustrates experienced users looking for quick answers. If a document starts growing into a different quadrant, split it.

2. **Never auto-generate documentation prose from code alone.** Tools like Sphinx autodoc and TypeDoc generate structure from docstrings -- the prose must still be written by a human. Auto-generated output without authored prose produces documentation that describes the interface but not the intent, behavior under edge conditions, or rationale.

3. **Never document what the code already clearly states.** A function named `calculateMonthlyInterest(principal, rate, months)` with typed parameters needs a docstring explaining the interest formula used (simple vs. compound) and valid input ranges -- not an explanation that principal is "the principal" and rate is "the rate."

4. **Always test code examples in documentation as part of CI.** Untested code examples become wrong within weeks of a library update. Use tools like doctest (Python), @doctest (Haskell), or extract-and-run patterns (copy code blocks and run them in a test suite) for any documentation with runnable examples.

5. **Always write changelogs for users, not for developers.** "Refactored authentication module to use dependency injection" is a commit message, not a changelog entry. "The authentication timeout is now configurable via the `auth.timeout` option (default: 30 seconds)" is a changelog entry. The audience is someone deciding whether to upgrade.

6. **Never use passive voice in task-oriented documentation.** "The button can be clicked" and "Installation can be performed" obscure who does the action. Write "Click the button" and "Run `npm install`." This is not a style preference -- imperative active voice reduces misunderstanding in instructions.

7. **Never embed credentials, real hostnames, or personally identifiable information in documentation examples.** Use `example.com`, `YOUR_API_KEY`, `user@example.com`, and `192.0.2.0/24` (RFC 5737 documentation address range). Include an automated credential-detection check (e.g., detect-secrets, truffleHog) in the CI documentation pipeline.

8. **Always version-gate deprecation notices.** Do not just mark something as deprecated -- state the version it was deprecated in, the version it will be removed in, and the migration path. "Deprecated since 2.3, will be removed in 3.0, use `newMethod()` instead" is complete. "Deprecated" alone is unusable.

9. **Never allow documentation debt to accumulate silently.** Create a `docs/known-issues.md` or use GitHub issues tagged `documentation` to track documentation gaps explicitly. A known and tracked documentation gap is manageable. An unknown gap discovered by a frustrated user at 2am is a trust failure.

10. **Always match documentation detail level to the API's surface area.** A function called twice in the codebase and never externally does not need a five-paragraph explanation. A public API endpoint called by thousands of external clients needs complete error documentation, rate limit documentation, example responses for every status code, and a migration path in the changelog for every change. Calibrate depth to exposure.

---

## Edge Cases

### Legacy codebase with zero existing documentation

Do not attempt to document the entire codebase retroactively in a single sprint. This approach produces low-quality documentation and burns the team. Instead, implement a "boy scout documentation rule": every PR that touches a file must bring the documentation of that file up to current standards. Create a documentation baseline audit first -- use pydocstyle, ESLint with `jsdoc/require-jsdoc`, or equivalent to generate a report of undocumented public symbols. Prioritize the top 20% most-called functions and modules. These typically account for 80% of developer confusion. Track coverage improvement as a metric in sprint reviews.

### Multi-team or platform documentation with many contributors

When more than one team contributes to a shared documentation site, content drift and inconsistency are the primary risks. Establish a style guide as a machine-enforceable artifact, not a PDF that no one reads. Configure Vale with a shared corporate style guide published as a Vale package in a private registry. Use a documentation RFC process (similar to code RFCs) for structural changes to the information architecture. Assign a Documentation Council or guild with veto power over breaking changes to the navigation or documentation standards. Tag documentation owners in CODEOWNERS so no PR to a team's documentation can merge without their approval.

### API documentation that is the public product

For developer-facing products where the API documentation IS the product experience (SDKs, public APIs, developer platforms), documentation quality must meet the same quality bar as production code. Establish an explicit Documentation SLA: every new endpoint ships with full reference documentation, at least three working examples across major languages, and an error reference before the endpoint is marked Generally Available. Create a "documentation review" step in the release pipeline equal in weight to security review. Measure time-to-first-successful-API-call (TTFSAC) as a documentation quality metric -- good documentation should produce a working call within 15 minutes for a developer unfamiliar with the API.

### Rapidly changing or experimental APIs

For internal APIs, experimental features, or pre-1.0 software, the overhead of comprehensive documentation is disproportionate to the rate of change. Use a tiered documentation approach: document the stable contract thoroughly, mark experimental endpoints explicitly with an `x-stability: experimental` OpenAPI extension or a clear `[EXPERIMENTAL]` header, and maintain a DRAFT_CHANGELOG.md where changes are accumulated before each release. Write documentation for the intended behavior, not the current behavior, and note the discrepancy explicitly. This prevents the common failure of documenting bugs as features.

### Documentation in multiple human languages (i18n)

Never translate documentation manually in the same repository as the source English documentation unless you have dedicated translators with technical expertise. The maintenance burden of keeping translations synchronized will exceed the team's capacity within six months. For internationalized documentation, use a professional translation management system (Crowdin, Transifex) with machine translation + human review workflows, branch source documentation by release so translations are anchored to a stable version, and accept that translated documentation will lag the English source by one release. Docusaurus has first-class i18n support with per-locale content directories.

### Documentation for regulated industries (HIPAA, SOC 2, GDPR, FDA 21 CFR Part 11)

Regulated documentation has requirements beyond technical accuracy. In these contexts: documentation must have version numbers, authorship, and approval records -- use Git commit metadata plus a formal review sign-off process documented in the PR. Change history must be preserved and auditable -- never force-push to documentation branches; use squash merges and preserve the PR history. Certain documentation (data flow diagrams, data dictionaries, risk assessments) may require formal document control numbering outside of the docs-as-code workflow. Work with the compliance officer to identify which documents are "controlled documents" under the relevant framework and apply the appropriate controls. Store compliance-controlled documents in a dedicated path (e.g., `docs/compliance/`) with additional CODEOWNERS restrictions.

### Documentation for open source projects with external contributors

External contributors will not read or follow documentation standards they cannot discover automatically. The entire contribution documentation experience must be automated: PR templates that prompt for documentation updates, CI that blocks merges when public symbols are undocumented, and a bot comment on documentation-affecting PRs that links to the style guide. Good documentation drives a flywheel effect -- clearly documented projects attract higher-quality contributions, which further improve documentation quality. Conversely, poor documentation repels capable contributors who judge project quality by documentation quality before looking at the code.

---

## Example

**Input:** "We're building an internal Python SDK that wraps our company's REST API. Six engineers will maintain it and around 200 internal developers will use it as their primary way to interact with the platform. Right now we have almost no documentation -- just a basic README and some inline comments. How should we approach documentation for this?"

**Output:**

---

## Documentation Assessment

**Project type:** Internal library / SDK wrapper
**Primary audience:** Internal developers (200 users, varying Python experience)
**Documentation maturity level:** Ad-hoc (README exists, no systematic coverage)

---

## Documentation Architecture Map

| Document | Type | Audience | Owner | Review Cadence | Status |
|----------|------|----------|-------|----------------|--------|
| README.md | Reference + Entry point | All internal devs | Tech lead | Per release | Update required |
| CHANGELOG.md | Reference | All internal devs | Release owner | Per release | Create |
| docs/getting-started.md | Tutorial | New SDK users | DX-focused engineer | Quarterly | Create |
| docs/authentication.md | How-to + Reference | All users | Security team | Per auth change | Create |
| docs/api-reference/ | Reference | All users | SDK owners | Per release | Create (generate from docstrings) |
| docs/error-reference.md | Reference | All users | SDK owners | Per release | Create |
| docs/decisions/ | Explanation (ADRs) | SDK team | Architect | Per major decision | Create |
| CONTRIBUTING.md | How-to | SDK team + contributors | Tech lead | Per process change | Create |
| docs/migration/ | How-to | All users | Release owner | Per major version | Create at v2.0 |

---

## Toolchain Recommendation

**Documentation generator:** MkDocs with the Material theme + mkdocstrings plugin for auto-generated API reference from Google-style docstrings.

**Rationale:** The SDK team writes Python and the audience is Python developers. MkDocs Material is faster to configure than Sphinx, produces a polished result, and mkdocstrings integrates seamlessly with Google-style docstrings which are readable in-editor without rendering. The Material theme includes search out of the box -- essential for an API reference used by 200 developers.

**API reference tool:** mkdocstrings (generates from docstrings) + a hand-authored error reference page
**Prose linter:** Vale with the Microsoft style guide rule set
**CI checks:** Vale + cspell (with internal product names in `.cspell.json`) + mkdocstrings build with `--strict` flag

---

## Priority Improvements (Ordered by Impact)

### 1. API Reference from Docstrings (Highest priority -- unblocks 200 developers immediately)

**Problem:** Developers must read the source code to understand method signatures, parameters, and return types. This creates a high learning curve and slows adoption.

**Solution:** Adopt Google-style docstrings consistently across all public methods and configure mkdocstrings to generate the API reference automatically.

**Effort:** Medium (2-3 days of docstring writing + 1 day toolchain setup)

**Docstring template for public SDK methods:**

```python
def create_user(
    self,
    email: str,
    role: str = "member",
    metadata: dict | None = None,
) -> User:
    """Create a new user in the platform.

    Creates a user account with the specified email address and assigns
    the given role. If the email already exists, raises DuplicateUserError
    rather than silently returning the existing user.

    Args:
        email: The user's email address. Must be unique within the
            organization. Maximum 254 characters per RFC 5321.
        role: The user's permission role. One of "member", "admin",
            or "viewer". Defaults to "member".
        metadata: Optional dictionary of custom key-value pairs to
            attach to the user record. Keys must be strings; values
            must be JSON-serializable. Maximum 20 keys, 256 characters
            per value.

    Returns:
        User: The newly created user object with all fields populated,
            including the system-assigned `id` and `created_at` timestamp.

    Raises:
        DuplicateUserError: If a user with the given email already exists
            in the organization.
        ValidationError: If the email format is invalid or the role is
            not one of the accepted values.
        RateLimitError: If the organization has exceeded 100 user creation
            requests per minute.
        AuthenticationError: If the SDK client has not been authenticated
            or the API token has expired.

    Example:
        >>> client = PlatformClient(api_key="YOUR_API_KEY")
        >>> user = client.users.create_user(
        ...     email="alice@example.com",
        ...     role="admin",
        ...     metadata={"department": "engineering", "team": "backend"},
        ... )
        >>> print(user.id)
        usr_01H8XYZABC123

    Note:
        This method makes a synchronous HTTP POST to /v2/users. For
        creating multiple users efficiently, use create_users_batch()
        instead, which is 5-10x faster for batches of 10 or more.

    .. versionadded:: 1.0
    """
```

---

### 2. Getting Started Tutorial (Second priority -- reduces time-to-first-call for new users)

**Problem:** New developers spend 30+ minutes reading source code before making their first successful API call. There is no guided path from "installed the SDK" to "calling the API."

**Solution:** Write a 10-15 minute linear tutorial that produces observable output at each step.

**Effort:** Small (1 day to write, 0.5 day to test on a fresh environment)

**Tutorial template:**

```markdown
# Getting Started with the Platform SDK

This tutorial walks you through installing the SDK, authenticating, 
and making your first API calls. By the end, you will have created 
a user, listed resources, and handled your first error.

**Prerequisites:**
- Python 3.10 or later
- Access to the internal PyPI registry (VPN required)
- A Platform API key from the Developer Portal (Settings → API Keys)

**Time to complete:** 10-15 minutes

---

## Step 1: Install the SDK

```bash
pip install platform-sdk
```

Verify the installation:

```python
import platform_sdk
print(platform_sdk.__version__)  # Should print 1.4.2 or later
```

---

## Step 2: Authenticate

Create a client using your API key:

```python
from platform_sdk import PlatformClient

client = PlatformClient(api_key="YOUR_API_KEY")

# Verify your credentials work before making other calls
identity = client.auth.whoami()
print(f"Authenticated as: {identity.email}")
```

**Important:** Never hard-code your API key. Use an environment variable:

```python
import os
from platform_sdk import PlatformClient

client = PlatformClient(api_key=os.environ["PLATFORM_API_KEY"])
```

---

## Step 3: Create Your First Resource

[... continue for each step with working code and expected output ...]

## What's Next

- Read the [full API reference](../api-reference/) for all available methods
- Learn how to [handle errors and retries](../error-handling/)
- See [batch operations](../advanced/batching/) for high-throughput use cases
```

---

### 3. Error Reference Page (Third priority -- reduces time-to-resolution for the most common developer pain point)

**Problem:** Developers encounter SDK exceptions but have no single reference for what they mean and how to recover. They open Slack and ask the SDK team, consuming engineering time.

**Solution:** Create a dedicated error reference page that documents every exception class, its causes, and the recovery action.

**Effort:** Small (1 day)

**Error reference template:**

```markdown
# Error Reference

All Platform SDK errors inherit from `PlatformError`. You can catch
this base class to handle any SDK error, or catch specific subclasses
for targeted handling.

## Error Hierarchy

```
PlatformError
├── AuthenticationError
├── AuthorizationError  
├── RateLimitError
├── ValidationError
│   ├── MissingParameterError
│   └── InvalidParameterError
├── NotFoundError
├── ConflictError
│   └── DuplicateUserError
└── ServerError
```

---

## AuthenticationError

**When raised:** The API key is missing, malformed, or has been revoked.

**HTTP status equivalent:** 401

**Attributes:**
- `message` (str): Human-readable description
- `request_id` (str): Use this in support tickets

**Recovery:**
1. Check that `PLATFORM_API_KEY` is set in your environment
2. Verify the key has not expired in the Developer Portal
3. Regenerate the key if necessary

```python
try:
    client.users.list()
except AuthenticationError as e:
    print(f"Authentication failed: {e.message}")
    print(f"Request ID for support: {e.request_id}")
    # Attempt to refresh credentials if using dynamic key rotation
    client = PlatformClient(api_key=refresh_api_key())
```

---

## RateLimitError

**When raised:** Your requests exceeded the rate limit for the endpoint.

**HTTP status equivalent:** 429

**Attributes:**
- `retry_after` (int): Seconds to wait before retrying
- `limit` (int): The rate limit that was exceeded (requests per minute)
- `endpoint` (str): The endpoint that was rate limited

**Recovery:** Wait `retry_after` seconds. For production workloads,
implement exponential backoff starting at 1 second, doubling up to
a maximum of 60 seconds, with ±10% jitter.

```python
import time
import random

def create_user_with_backoff(client, email, max_retries=5):
    for attempt in range(max_retries):
        try:
            return client.users.create_user(email=email)
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            wait = e.retry_after * (1 + random.uniform(-0.1, 0.1))
            time.sleep(wait)
```

[... continue for all error types ...]
```

---

## Implementation Plan

| Week | Deliverable | Owner | Definition of Done |
|------|-------------|-------|-------------------|
| 1 | mkdocstrings + MkDocs Material toolchain configured, CI pipeline with Vale + strict build | Platform infrastructure engineer | `mkdocs build --strict` passes in CI on main branch |
| 1 | Docstrings written for all 40 public SDK methods | All 6 engineers (7 methods each) | pydocstyle passes with Google convention, zero undocumented public symbols |
| 2 | Getting Started tutorial written and tested on fresh environment | DX-focused engineer | A developer unfamiliar with the SDK follows the tutorial and makes a successful API call in under 15 minutes; tested in a Docker container |
| 2 | Error reference page complete | SDK team lead | All 12 exception classes documented with cause, recovery action, and working code example |
| 3 | README overhauled -- problem statement, working quickstart, links to docs | Tech lead | Quickstart steps verified in a clean virtualenv; all links valid per lychee check |
| 3 | CHANGELOG.md created for all releases back to 1.0 | Release owner | Entries follow Keep a Changelog format; every breaking change has a migration note |
| 4 | First three ADRs written: SDK architecture choice, error hierarchy design, versioning policy | Architect | Stored in docs/decisions/, linked from relevant source files |
| 4 | Documentation site deployed to internal developer portal | Platform infrastructure engineer | Site accessible on corporate intranet, basic Plausible analytics active |

---

**Expected outcome at end of week 4:** The 200 internal developers have a complete, searchable API reference, a working Getting Started tutorial, and a canonical error reference. Based on similar SDK documentation rollouts, expect a 60-70% reduction in "how do I use X?" questions in Slack channels and a measurable decrease in incorrect SDK usage (wrong error handling, missing retry logic) caught in code review.
