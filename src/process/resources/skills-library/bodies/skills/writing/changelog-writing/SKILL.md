---
name: changelog-writing
description: |
  Creates Keep-a-Changelog compliant CHANGELOG.md files with dated, categorized
  entries (Added, Changed, Deprecated, Removed, Fixed, Security) and semantic
  versioning. Use when the user needs to write or update a changelog file, document
  version history, or create a structured change log. Do NOT use for release notes
  (use `release-notes`), commit messages, or status updates (use `status-update`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation writing"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Changelog Writing

## When to Use

Use this skill when the user needs to create or maintain a structured `CHANGELOG.md` file that communicates version history to downstream consumers -- developers, operators, or end users who need to understand what changed between releases.

**Trigger scenarios:**
- User is setting up a new open-source or internal project and needs a changelog file from scratch
- User has accumulated commits or PRs and needs to distill them into a curated changelog entry for an upcoming release
- User needs to add one or more version entries to an existing `CHANGELOG.md` that already follows Keep-a-Changelog format
- User is migrating from a different changelog format (raw git log exports, custom formats, or wikis) to the standardized Keep-a-Changelog structure
- User wants to document a hotfix, patch, or security-only release alongside a preceding minor or major version
- User is maintaining a library with a public API and needs to communicate breaking changes clearly using semantic versioning signals
- User needs to back-fill changelog entries for past releases that were undocumented

**Do NOT use this skill when:**
- The user wants narrative release notes for a product announcement, email, or social post -- use `release-notes` instead, which is audience-facing storytelling rather than a technical record
- The user wants a blog post explaining what changed and why -- use `technical-blog-post`
- The user wants internal sprint status or team-facing progress updates -- use `status-update`
- The user wants to auto-generate changelog text directly from raw git log output -- that is a different process entirely; changelogs are curated by humans who understand user impact
- The user wants help writing individual git commit messages -- that is a commit message skill, not changelog writing
- The user wants a GitHub release body or GitLab release description -- those are rendered differently and are covered by `release-notes`
- The user wants API deprecation documentation in reference docs -- that belongs in API reference documentation, though changelog entries may cross-reference it

---

## Process

### Step 1: Gather the Inputs

Before writing a single line, collect the information needed to produce accurate, complete entries. Missing information at this stage leads to vague entries that fail users.

- **Project name and type:** A CLI tool, a library, a web application, a firmware package, and a microservice each have different audiences and change vocabularies. A library's changelog speaks to developers integrating it; an application's changelog speaks to end users or operators.
- **Version number:** If using semantic versioning, confirm whether the version has been decided or still needs to be determined. Ask for the previous version number to construct the comparison link. If the version is undecided, help the user choose it using semver rules (see Step 3 below).
- **Release date:** Confirm the exact date in YYYY-MM-DD (ISO 8601). If the release has not yet happened, use `[Unreleased]` as the section header instead of a version number.
- **Repository URL pattern:** To construct comparison links at the bottom, you need the base URL (e.g., `https://github.com/org/repo`) and the tag naming convention (e.g., `v2.1.0` vs. `2.1.0` -- some projects omit the `v` prefix).
- **Raw change list:** Ask the user to provide a list of everything that changed -- PR titles, issue descriptions, commit messages, release notes drafts, or informal descriptions. You will curate and categorize this raw input, not the user.
- **Existing changelog file:** If adding to an existing file, ask the user to paste the current contents so you can append correctly without disrupting existing entries or link tables.
- **Whether the project is pre-1.0:** Pre-1.0 projects have different semver semantics -- breaking changes can occur in minor version bumps, which affects how you frame entries.

### Step 2: Categorize Every Change

Assign each change to exactly one of the six canonical Keep-a-Changelog categories. This categorization is the most intellectually demanding step and the place where AI assistance adds the most value.

- **Added** -- New features, new configuration options, new endpoints, new CLI flags, new file format support, new platform support. The defining test: did something that did not exist before now exist? If yes, it is Added.
- **Changed** -- Modifications to existing behavior where the feature continues to exist but works differently. This includes performance improvements, changed defaults, renamed options that still function, updated dependency requirements. The defining test: did something that existed before still exist but behave differently? If yes, it is Changed. Note: if the change breaks backward compatibility, it must be flagged as a breaking change (see Rules below).
- **Deprecated** -- Features that still function but are actively discouraged and have a known removal timeline. Always state the expected removal version (e.g., "scheduled for removal in 4.0.0") and the replacement. Vague deprecations without a migration path fail users.
- **Removed** -- Features, options, endpoints, or files that no longer exist in this version. If this was previously deprecated, reference the deprecation version. If it was not previously deprecated, it is a breaking change and the version bump must be a major version.
- **Fixed** -- Bug fixes. The entry should describe the symptom the user experienced (e.g., "crash," "incorrect output," "hang," "silent failure"), not the internal root cause. Avoid describing internal code changes here.
- **Security** -- Any change addressing a vulnerability, regardless of severity. Always include the CVE identifier if one exists. Include CVSS severity level when known (e.g., "High (CVSS 8.1)"). Never omit security entries to save face -- transparency here is an obligation.

**Categorization judgment calls:**
- A dependency upgrade that patches a vulnerability is Security, not Changed
- A dependency upgrade that adds functionality is Changed (or Added if it enables new user-facing features)
- A performance improvement that changes behavior (e.g., changes output ordering) is Changed, not Fixed
- A performance improvement with no behavior change is Changed (not Fixed -- it was not broken)
- Refactoring with no user-facing impact does not belong in the changelog at all -- omit it

### Step 3: Determine the Correct Semantic Version

If the user has not yet decided on a version number, help them select it using these rules precisely:

- **Patch version (Z in X.Y.Z):** Increment when the release contains only backward-compatible bug fixes (Fixed entries) and/or security patches. Example: 2.3.1 -> 2.3.2
- **Minor version (Y in X.Y.Z):** Increment when the release adds new backward-compatible functionality (Added entries) or marks things Deprecated. Reset patch to 0. Example: 2.3.1 -> 2.4.0
- **Major version (X in X.Y.Z):** Increment when the release contains any backward-incompatible change -- anything in Removed that was not deprecated, any Changed entry that breaks existing integrations, any renamed required configuration without a compatibility shim. Reset minor and patch to 0. Example: 2.3.1 -> 3.0.0
- **Pre-1.0 exception:** For versions 0.Y.Z, minor version bumps (0.Y.Z -> 0.Y+1.0) may contain breaking changes. Make this explicit in the changelog.
- **Multiple category types in one release:** The highest-impact category determines the version. If you have Added, Changed (breaking), and Fixed entries in one release, it is a major bump even if most changes are minor.
- **Build metadata and pre-release identifiers:** Pre-release versions like `1.0.0-alpha.1`, `2.3.0-rc.2`, or `1.0.0-beta.3` follow the same changelog structure. Include them in the changelog with their full identifier in the version header.

### Step 4: Write the Entries

Transform raw change descriptions into clean, user-facing changelog entries. This is a prose writing task, not a code task.

**Structural rules for entries:**
- Each entry is a single bullet point starting with a hyphen and a space (`- `)
- Begin with a noun or verb phrase describing the user-visible impact, not the internal implementation
- Past tense is preferred for released versions; present tense for Unreleased sections is acceptable but not required
- Reference PR or issue numbers in parentheses at the end of the entry: `(#142)` or `(#142, #156)`
- CVE references for security entries: `(CVE-2024-12345)`
- Keep each entry to one line -- if context is so complex it requires multiple sentences, add a second bullet indented under the first using two spaces

**Writing quality standards:**
- **Specific, not vague:** "Fixed crash when parsing JSON files with Unicode null characters (U+0000)" not "Fixed JSON parsing issue"
- **User perspective, not developer perspective:** "Reduced memory usage by 40% during large file exports" not "Replaced ArrayList with LinkedHashMap in ExportService"
- **Impact-led:** Lead with what the user experiences. "Added support for ARM64 architecture on Linux and macOS" not "Added ARM64 build targets to CI pipeline"
- **Breaking changes call-outs:** For any entry in Changed or Removed that breaks backward compatibility, prefix the entry with `**Breaking:**` in bold so users can spot it immediately during scanning
- **Migration hints in entries:** For Deprecated entries, always append the replacement: "Deprecated `--output-format=xml` flag. Use `--format=xml` instead. Will be removed in 5.0.0."

### Step 5: Structure the Full File

Assemble the complete file following exact Keep-a-Changelog structural conventions:

- **Line 1:** `# Changelog` -- exactly this, no project name, no subtitle
- **Lines 2-5:** Standard introductory paragraph (see Output Format for exact wording)
- **Unreleased section:** Always present, even if empty. Lives immediately after the intro paragraph. It is where in-progress changes accumulate before the next release.
- **Version sections:** In strict reverse chronological order. The most recent release appears first. Never reorder this -- tools that parse changelogs depend on this ordering.
- **Category headings:** Level 3 headings (`### Added`, `### Changed`, etc.). Present only when they have entries. An empty `### Fixed` with no bullets must be omitted.
- **Blank lines:** One blank line between the section header and its first bullet. One blank line between the last bullet of one category and the next category header. One blank line between the last bullet of a version and the next version header.
- **Link table:** At the very bottom of the file, after all version sections. One link definition per version plus one for Unreleased. These are Markdown reference-style links.

### Step 6: Construct the Comparison Link Table

The link table at the bottom is what makes version headers clickable and enables diff navigation. Build it precisely:

- **Unreleased link:** Points from the latest release tag to HEAD
  `[Unreleased]: https://github.com/org/repo/compare/v2.1.0...HEAD`
- **Each version link:** Points from the previous release tag to the current one
  `[2.1.0]: https://github.com/org/repo/compare/v2.0.0...v2.1.0`
- **First version ever:** Points from the repository's initial commit or an arbitrary starting tag to the first release
  `[1.0.0]: https://github.com/org/repo/releases/tag/v1.0.0`
  (Use the releases/tag URL for the first version since there is no previous tag to compare from)
- **Tag naming convention:** Ask the user whether their tags use the `v` prefix. Most projects do (`v2.1.0`) but some do not (`2.1.0`). The version header itself (`## [2.1.0]`) never uses the `v`, but the link target uses whatever the actual git tag is.
- **GitLab and Bitbucket:** The URL structure differs. GitLab uses `-/compare/v2.0.0...v2.1.0`. Bitbucket uses `/compare/v2.1.0..v2.0.0` (note reversed order and double-dot). Confirm the hosting platform.

### Step 7: Validate Before Delivering

Run through this checklist mentally before producing the final output:

- [ ] Every change from the raw input has been categorized and written as an entry
- [ ] No category section is empty (no headings with zero bullets beneath them)
- [ ] All dates are in YYYY-MM-DD format
- [ ] Versions are in strict descending order (newest at top)
- [ ] `[Unreleased]` section is present
- [ ] Breaking changes are prefixed with `**Breaking:**`
- [ ] Deprecated entries include the removal target version and replacement
- [ ] Security entries include CVE identifiers where known
- [ ] Link table at the bottom covers every version header plus Unreleased
- [ ] No entries describe internal implementation details that users do not experience
- [ ] No categories outside the six canonical ones
- [ ] First line of the file is exactly `# Changelog`
- [ ] The file does not end with a trailing blank line after the link table

---

## Output Format

The complete file structure is as follows. This is not a loose template -- every structural element must appear in this exact layout.

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Description of feature being developed but not yet released (#PR)

## [X.Y.Z] - YYYY-MM-DD

### Added

- New capability or feature that did not exist before (#PR or #issue)
- Additional new capability (#PR)

### Changed

- **Breaking:** Modification that removes backward compatibility (#PR)
- Non-breaking change to existing behavior or default (#PR)

### Deprecated

- `feature-name` option for doing X. Use `replacement-option` instead. Will be removed in A.B.0. (#PR)

### Removed

- **Breaking:** Previously deprecated `old-feature` removed. See deprecation notice in X.Y-1.0. (#PR)

### Fixed

- Specific symptom that users experienced in specific conditions (#issue)
- Another bug description with precise trigger conditions (#issue)

### Security

- Addressed remote code execution vulnerability in the XML parser. Severity: High (CVSS 8.9). (CVE-2024-XXXXX) (#PR)

## [A.B.C] - YYYY-MM-DD

### Added

- Feature description (#PR)

### Fixed

- Bug symptom and conditions (#issue)

## [0.1.0] - YYYY-MM-DD

### Added

- Initial public release
- Core feature one
- Core feature two

[Unreleased]: https://github.com/org/repo/compare/vX.Y.Z...HEAD
[X.Y.Z]: https://github.com/org/repo/compare/vA.B.C...vX.Y.Z
[A.B.C]: https://github.com/org/repo/compare/v0.1.0...vA.B.C
[0.1.0]: https://github.com/org/repo/releases/tag/v0.1.0
```

**Key formatting details by element:**

| Element | Format | Example |
|---|---|---|
| File title | `# Changelog` (H1, exact text) | `# Changelog` |
| Version header | `## [X.Y.Z] - YYYY-MM-DD` (H2) | `## [2.1.0] - 2024-06-15` |
| Unreleased header | `## [Unreleased]` (H2) | `## [Unreleased]` |
| Category header | `### Added` (H3) | `### Fixed` |
| Entry bullet | `- Description (#ref)` | `- Fixed crash on empty input (#89)` |
| Breaking prefix | `**Breaking:**` in bold before description | `**Breaking:** Removed --legacy flag` |
| Link definition | `[label]: URL` at file bottom | `[2.1.0]: https://...` |
| Yanked release | `## [X.Y.Z] - YYYY-MM-DD [YANKED]` | `## [2.0.1] - 2024-05-01 [YANKED]` |
| Pre-release | Full identifier in brackets | `## [2.0.0-rc.1] - 2024-05-20` |

---

## Rules

1. **Never transcribe git commits directly.** Raw commit messages are developer-facing and describe implementation steps ("Refactor UserService to use repository pattern"). Changelog entries are user-facing and describe impact ("Reduced API response latency by 30% for user profile endpoints"). The same code change produces a different sentence in each context. Always transform, never copy.

2. **Never invent categories.** The six categories (Added, Changed, Deprecated, Removed, Fixed, Security) are the complete set. Do not add "Improved," "Performance," "Internal," "Documentation," "Infrastructure," or any other heading. If a change does not fit a category, either omit it (internal refactoring) or reclassify it: a performance improvement is Changed, a documentation update does not belong in the changelog unless it is itself the product (i.e., the project is a documentation site).

3. **Never leave a category heading without entries.** An empty `### Added` section is invalid. If a category has no entries for a release, omit the heading entirely. Parsers and readers expect headings to introduce content.

4. **Never omit breaking changes or security entries.** Breaking changes that are not clearly flagged cause production incidents for downstream users. Security entries that are suppressed or obscured erode trust and may have legal and compliance implications. Both must always be documented, even when they are embarrassing.

5. **Always mark breaking changes explicitly.** A Changed or Removed entry that breaks backward compatibility must begin with `**Breaking:**` in bold. This visual signal enables developers to use Ctrl+F on "Breaking" to audit what they need to handle before upgrading. Relying on the version number alone (major bump) is insufficient -- not all readers understand semver conventions.

6. **Always include the Unreleased section, even when empty.** The `[Unreleased]` section signals that the project is actively maintained and provides a home for changes that accumulate before the next version. An absent Unreleased section means new entries would need to be inserted into the middle of the file, creating merge conflicts. An empty one costs two lines and prevents structural problems.

7. **Always use ISO 8601 date format (YYYY-MM-DD).** Never use "June 15, 2024," "15/06/2024," "Jun 15," or any locale-specific format. ISO 8601 is unambiguous across all locales and parses correctly by automated tooling. The date must be the actual release date, not the date the changelog entry was written.

8. **Never write entries in the future tense for released versions.** "This release will improve performance" is incorrect for a shipped version. Use past tense for released versions: "Improved memory efficiency by 40% during batch processing." Present tense is acceptable in the Unreleased section when documenting a feature still being developed.

9. **Deprecated entries must specify the removal target and replacement.** "Deprecated the `--xml` flag" is incomplete and unhelpful. Users need to know when it disappears and what to use instead. Correct form: "Deprecated `--xml` flag for specifying output format. Use `--format=xml` instead. Scheduled for removal in 4.0.0."

10. **The link table at the bottom must be complete and must use actual repository URLs.** If the user has not provided a repository URL, ask for it or leave a clearly marked placeholder (`https://github.com/YOUR-ORG/YOUR-REPO`) rather than an invalid or fictional URL. Every version header must have a corresponding link definition, including the Unreleased header. Missing link definitions silently produce non-clickable headers in rendered Markdown.

11. **Entries that affect only internal tooling, CI pipelines, test infrastructure, or build scripts should be omitted.** Changelogs document changes that affect the users of the software, not the maintainers building it. "Updated ESLint to 9.0" does not belong in a user-facing changelog unless the linting rules are a public API of the project (e.g., a sharable ESLint config library).

12. **When a release includes both a feature addition and a bug fix for that same new feature, list both entries independently.** Do not collapse them: "Added CSV export and fixed a bug in it" should be two separate entries -- one under Added and one under Fixed -- each with their own issue/PR reference.

---

## Edge Cases

### First Changelog for a New Project

When there are no previous versions, the first entry is typically either `0.1.0` (if the project is pre-stable and iterating) or `1.0.0` (if this is the first stable public release). Do not start at `0.0.1` for a meaningful release -- save patch versions for actual patches. The comparison link for the first version must point to the release tag URL rather than a compare URL, because there is no earlier tag to diff against:

```
[1.0.0]: https://github.com/org/repo/releases/tag/v1.0.0
```

Include an "Added -- Initial public release" entry followed by bullets for the primary features users should know about. If the project was previously in a closed beta or private alpha, briefly note that this is the first public release.

### Yanked Releases

A yanked release was published and then pulled because it introduced a critical regression, data corruption risk, or security vulnerability so severe that no one should install it. Yanked releases must remain in the changelog for transparency -- do not delete them. Mark the header:

```
## [2.0.1] - 2024-05-01 [YANKED]
```

Add a note as the first bullet under the version explaining why it was yanked and which version users should upgrade to instead:

```
### Changed

- **This release was yanked due to data corruption in the migration script introduced in this version. Upgrade directly to 2.0.2 instead.**
```

Keep all the original entries below that note so users understand what was in the release.

### Monorepo with Multiple Packages

Do not maintain a single root-level `CHANGELOG.md` for a monorepo containing multiple independently versioned packages. Each package (`packages/auth-client`, `packages/data-layer`, etc.) must have its own `CHANGELOG.md` in its own directory. Each package has an independent version number and an independent release cadence. The root-level `README.md` or `CONTRIBUTING.md` can reference each package's changelog.

If the monorepo uses a fixed versioning strategy (all packages always release the same version together), a single changelog is acceptable, but entries should be prefixed with the package name to maintain clarity: "- `auth-client`: Added OAuth2 PKCE flow support (#234)"

### Security-Only Patch Release

When a patch release contains only security fixes -- no new features, no other bug fixes -- the changelog entry is brief but must be unambiguous. Include the CVE identifiers and severity. Do not bury security information:

```
## [3.4.1] - 2024-07-10

### Security

- Patched path traversal vulnerability in the file upload handler that allowed authenticated users to read arbitrary server-side files. Severity: Critical (CVSS 9.1). (CVE-2024-48291) (#301)
- Upgraded `xml2js` dependency from 0.4.23 to 0.6.0 to address prototype pollution vulnerability. Severity: Medium (CVSS 5.6). (CVE-2023-0842) (#302)
```

### Migration from Legacy Changelog Formats

When the user has an existing changelog in a different format (plain text, bullet lists without categories, a CHANGES file, or auto-generated commit logs), do not rewrite history. The correct approach is to preserve pre-existing entries and add a migration marker:

```
## [3.0.0] - 2024-01-15
[First entry following Keep a Changelog format]

---
*Entries below this line were written before this project adopted Keep a Changelog and may not follow the same structure.*

## [2.9.0] - 2023-08-01
[Original format entries preserved as-is]
```

This preserves historical accuracy while making the boundary clear to readers and tooling.

### Pre-Release Versions (Alpha, Beta, RC)

Pre-release versions follow the same structure but use the full semver pre-release identifier in the version header:

```
## [3.0.0-rc.2] - 2024-06-01
## [3.0.0-rc.1] - 2024-05-15
## [3.0.0-beta.3] - 2024-04-30
```

These appear in the changelog above the stable release they precede. When the stable release ships, do not duplicate all the pre-release entries -- add a summary entry under the stable version header:

```
## [3.0.0] - 2024-06-15

### Added

- [Summary of all additions that were in beta and RC phases]
```

Pre-release comparison links follow the same pattern as stable releases.

### Rolling Release / Date-Based Versioning

Projects that ship continuously without version numbers (continuous deployment to production, some Linux distributions, or rolling documentation sites) can use date-based version headers instead of semver:

```
## [2024-07-15]
## [2024-07-01]
## [2024-06-15]
```

The same six categories apply. Comparison links use the date tag or commit SHA:

```
[2024-07-15]: https://github.com/org/repo/compare/2024-07-01...2024-07-15
```

Note: If the project is a public library with downstream dependents, strongly recommend moving to semver. Date-based versioning prevents dependency managers from resolving compatibility constraints.

### Large Releases with Dozens of Entries

When a major version has an exceptionally large number of entries (more than 15-20 per category), group related items into sub-bullets rather than producing an overwhelming flat list. Use the parent bullet as a theme and indent sub-bullets with two additional spaces:

```
### Added

- New plugin system for extending core functionality:
  - Plugin discovery via `plugins/` directory at project root (#201)
  - Official plugin registry integration with `--registry` flag (#203)
  - Plugin sandboxing to prevent resource exhaustion (#207)
```

This structure is valid Markdown and keeps the changelog navigable. Do not create sub-categories or nested headings -- the three-level structure (H1 title, H2 version, H3 category) is the maximum.

---

## Example

**Input from user:**

> "I need a changelog for our Python HTTP client library called `httpex`. We're releasing version 3.2.0 today (2024-09-12). The GitHub repo is `https://github.com/acme/httpex`. Previous version was 3.1.2. Tags use the `v` prefix. Here's what changed:
>
> - Added async support with asyncio -- new AsyncClient class
> - Added automatic retry with exponential backoff, configurable up to 10 attempts
> - Added support for HTTP/3 when the underlying system supports it
> - Changed connection pool default size from 10 to 25
> - Changed the `timeout` parameter to accept a `Timeout` object in addition to a float -- floats still work
> - Deprecated the `verify_ssl=False` shorthand -- use `ssl=SSLContext()` instead, removal in 4.0.0
> - Fixed a bug where response bodies over 10MB were silently truncated
> - Fixed incorrect Content-Length header on chunked responses
> - Fixed a hang when the server closes the connection without sending FIN
> - Security: the certificate validation logic had a flaw that could allow MITM on redirects -- we have a CVE pending (no number yet, high severity)
> - We also refactored the internal connection manager to use a heap but that's not user-facing"

**Output:**

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.2.0] - 2024-09-12

### Added

- `AsyncClient` class providing full async/await support via asyncio for all HTTP methods (#---)
- Automatic retry with configurable exponential backoff, supporting up to 10 retry attempts with jitter (#---)
- HTTP/3 support when the underlying operating system and Python environment support QUIC (#---)

### Changed

- Default connection pool size increased from 10 to 25 connections to reduce pool exhaustion under moderate concurrency (#---)
- `timeout` parameter now accepts a `Timeout` object in addition to a plain float, enabling per-phase timeout control (connect, read, write). Existing float values continue to work unchanged (#---)

### Deprecated

- `verify_ssl=False` shorthand for disabling certificate verification. Use `ssl=ssl.SSLContext()` with appropriate settings instead. Scheduled for removal in 4.0.0. (#---)

### Fixed

- Response bodies larger than 10MB were silently truncated instead of streamed completely (#---)
- `Content-Length` header reported incorrect values on responses using chunked transfer encoding (#---)
- Client now handles server-initiated connection close without a FIN packet correctly, preventing indefinite hangs (#---)

### Security

- Fixed a certificate validation flaw in redirect handling that could allow a man-in-the-middle attacker to intercept HTTPS traffic when following redirects to different hosts. Severity: High. CVE pending assignment. (#---)

## [3.1.2] - 2024-07-30

### Fixed

- Resolved race condition in connection pool cleanup that caused intermittent `ConnectionError` under high concurrency (#187)
- Corrected encoding of non-ASCII characters in URL query parameters on Windows (#191)

## [3.1.1] - 2024-06-18

### Security

- Updated `certifi` dependency to 2024.6.2 to include current CA bundle. Previous bundle included two revoked root certificates. (CVE-2024-39689) (#183)

## [3.1.0] - 2024-05-01

### Added

- `httpex.Session` context manager for connection reuse across multiple requests (#160)
- `proxy` parameter support for HTTP and HTTPS CONNECT proxies (#165)

### Changed

- Minimum Python version raised from 3.8 to 3.10 (#158)

### Fixed

- Authentication headers are now correctly stripped when redirecting from HTTPS to HTTP (#171)

## [3.0.0] - 2024-02-14

### Added

- Native support for streaming request bodies from file-like objects (#130)
- Built-in digest authentication via `DigestAuth` class (#133)

### Changed

- **Breaking:** `Response.text` now returns `str` decoded with the charset from `Content-Type` instead of always using UTF-8. Use `Response.content` for raw bytes. (#121)
- **Breaking:** `Client` constructor no longer accepts positional arguments. All parameters are now keyword-only. (#125)

### Removed

- **Breaking:** `httpex.get()` and `httpex.post()` module-level convenience functions removed. Deprecated since 2.4.0. Use `httpex.Client()` instead. (#127)

## [2.4.0] - 2023-10-10

### Added

- `httpex.get()` and `httpex.post()` module-level functions marked deprecated. These will be removed in 3.0.0. Use `httpex.Client()` instead. (#98)
- `follow_redirects` parameter to control automatic redirect following per request (#102)

### Fixed

- Cookies sent by the server on a redirect are now correctly preserved across the redirect chain (#105)

[Unreleased]: https://github.com/acme/httpex/compare/v3.2.0...HEAD
[3.2.0]: https://github.com/acme/httpex/compare/v3.1.2...v3.2.0
[3.1.2]: https://github.com/acme/httpex/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/acme/httpex/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/acme/httpex/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/acme/httpex/compare/v2.4.0...v3.0.0
[2.4.0]: https://github.com/acme/httpex/releases/tag/v2.4.0
```

**Annotation of key decisions made in this example:**

- The internal connection manager refactor was omitted entirely -- it has no user-facing impact and does not belong in a changelog
- The security entry was included without a CVE number because omitting it would be worse than the pending status; the entry says "CVE pending assignment" to signal transparency
- PR/issue references use `(#---)` as a placeholder since the user did not supply them -- in practice, ask for these or leave the placeholder for the user to fill in
- The version number 3.2.0 was confirmed correct: Added and Changed entries qualify as a minor bump; nothing breaks backward compatibility except the addition of a Deprecated entry, which is a forward signal, not a breaking change
- `verify_ssl=False` deprecation includes the replacement pattern (`ssl.SSLContext()`) and the removal target (4.0.0)
- Earlier version entries were fabricated as plausible history to demonstrate a realistic multi-version changelog -- in practice, you would only add the 3.2.0 section to an existing file containing real prior entries
