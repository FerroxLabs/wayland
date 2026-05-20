---
name: release-notes
description: |
  Creates version release notes categorized by change type (features, fixes,
  breaking changes) with migration guidance and user impact descriptions. Use
  when the user needs to write release notes for a software version, product
  update, or feature launch. Do NOT use for changelogs (use `changelog-writing`),
  technical specifications (use `technical-specification`), or status updates
  (use `status-update`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation writing"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Release Notes Writing

## When to Use

Use this skill when:

- A user needs to publish release notes for a versioned software artifact -- a library, SDK, CLI tool, API, web application, or platform service
- A user has a completed list of commits, pull requests, or tickets and needs them shaped into user-facing documentation
- A user needs to communicate a breaking change with a migration path to customers or downstream teams
- A user is releasing a security patch and needs to communicate risk severity, affected versions, and remediation steps
- A user is publishing pre-release notes (alpha, beta, release candidate) to gather early adopter feedback with appropriate stability expectations
- A user needs release notes for a mobile app submission to an app store, where format and length constraints apply
- A user needs to adapt internal release notes into a customer-facing format, filtering out implementation details

Do NOT use this skill when:

- The user wants a running, append-only changelog file maintained over time -- use `changelog-writing` instead, which follows Keep a Changelog or similar conventions
- The user wants a blog post or launch announcement with marketing narrative -- use `technical-blog-post`, which covers storytelling, SEO, and promotional tone
- The user wants internal engineering status or sprint summaries -- use `status-update` for audience-appropriate progress communication
- The user wants a technical specification describing how a feature works internally -- use `technical-specification` for architecture-level documentation
- The user wants API reference documentation (endpoint signatures, parameter descriptions, error codes) -- use `api-documentation` for structured reference material
- The user wants a post-mortem or incident report for an outage -- use `incident-report` for root cause analysis and remediation documentation
- The user wants a migration guide as a standalone document -- release notes reference migration guides but do not replace them; create the migration guide separately using `migration-guide`

---

## Process

### 1. Gather Release Context Before Writing Anything

Collect the minimum necessary information before drafting. Do not guess at version numbers, dates, or the completeness of the change list.

- **Version number:** Ask whether the project follows semantic versioning (MAJOR.MINOR.PATCH). A MAJOR bump implies breaking changes exist. A MINOR bump implies backward-compatible additions. A PATCH bump implies backward-compatible fixes only. If the version number and change types conflict (e.g., a breaking change in a patch release), flag this to the user -- it is a versioning error.
- **Release date:** Confirm whether the notes are for a release that has already shipped, is shipping today, or is being prepared in advance. Use YYYY-MM-DD format exclusively.
- **Change inventory:** Ask the user to provide raw materials -- commit log, PR list, Jira tickets, Linear issues, or a bullet list. Prefer raw materials over summaries so you can apply your own categorization rather than inheriting the developer's framing.
- **Target audience:** Distinguish between (a) developers integrating the library, (b) operators configuring or deploying the software, (c) end users interacting with a product UI, or (d) mixed audiences. Each audience cares about different categories first.
- **Breaking changes:** Ask explicitly: "Does anything in this release require users to change their code, configuration, data schema, or workflow?" Do not trust that the user will volunteer this unprompted.
- **Known issues:** Ask whether any bugs are shipping unfixed. Known issues require workarounds in the release notes; omitting them damages trust when users encounter them.
- **Security changes:** Ask whether any change addresses a security vulnerability. If yes, ask for CVE ID (if assigned), CVSS score or severity label (Critical/High/Medium/Low), and affected version range.

### 2. Categorize Every Change Using Precise Definitions

Miscategorization is the most common error in release notes. Apply these definitions strictly:

- **Breaking Change:** Any change where existing code, configuration, or data that worked in the previous version will fail, produce different results, or require modification to continue working. This includes: renamed or removed public API symbols, changed function signatures, altered default behaviors that users relied on, removed CLI flags, changed environment variable names, modified data schema fields, and changed HTTP response shapes. If in doubt, classify as breaking.
- **New Feature:** A capability that users could not accomplish at all before this version. A new endpoint, a new CLI command, a new configuration option that unlocks new behavior.
- **Improvement:** An enhancement to something that already existed -- faster performance (quantify: "40% faster" not "faster"), expanded limits (quantify: "max file size increased from 100MB to 1GB"), better error messages, improved accessibility (reference WCAG level), extended platform support.
- **Bug Fix:** A correction where the software was not behaving as documented or as reasonably expected. Always describe the symptom, not the cause.
- **Deprecation:** A feature that still works but is officially discouraged. Must name the replacement and the removal version. Do not deprecate without a replacement unless it is a harmful feature being removed for safety reasons.
- **Security:** Changes that patch vulnerabilities, regardless of whether they also constitute breaking changes. Security changes get their own section always -- do not bury them in Bug Fixes.
- **Performance:** Optional sub-category when performance improvements are the release theme. Quantify all performance claims with methodology: "Reduced p99 latency from 450ms to 120ms under 1,000 concurrent requests in our internal benchmark."
- **Known Issues:** Problems that exist in this release and are not yet fixed. Include a workaround if one exists.

### 3. Write Each Change Entry From the User's Perspective

This is the skill's most important discipline. Developers write commit messages from their perspective ("Refactor auth module to use singleton pattern"). Release notes must be written from the user's perspective ("Fixed login failures that occurred after 30 minutes of inactivity").

- **Lead with outcome, not implementation:** "Exports now complete 3x faster for datasets over 10,000 rows" is correct. "Replaced O(n²) sort algorithm with merge sort" is wrong for release notes.
- **Bug fix formula:** "Fixed [symptom that users experienced] that occurred when [precise triggering condition]." Example: "Fixed an error that caused dashboard widgets to display blank data when the user's timezone was set to UTC-12 or UTC+13."
- **Feature formula:** "[Feature name] lets you [do specific thing]. [Quantified benefit or use case]. [One line of usage if a code example is appropriate.]"
- **Improvement formula:** "[What improved] [by how much] [under what conditions]. Previously [old behavior or limit]. Now [new behavior or limit]."
- **Breaking change formula:** Requires its own structured block -- see Step 4.
- **Reference external identifiers:** If the project uses a public issue tracker, append the issue or PR number in parentheses: `(#2847)`. If the tracker is private, omit rather than confuse users with inaccessible references.
- **Avoid jargon that users don't share:** If writing for API consumers, SQL query plans are irrelevant. If writing for operators, UI pixel changes are irrelevant. Tailor entries to the specific audience identified in Step 1.

### 4. Write Every Breaking Change as a Structured Migration Block

A breaking change entry without migration instructions is harmful documentation. Users need to know what broke, why, and exactly how to fix it before they can safely upgrade.

- **Before/After sections:** Show the exact API signature, configuration key, CLI flag, or code pattern that changed. Use diff format or side-by-side code blocks when multiple languages are affected.
- **Rationale in one sentence:** Users who understand why a change was made are more likely to accept it. "Renamed to align with the industry-standard OAuth 2.0 parameter naming." is sufficient.
- **Migration steps as an ordered list, not prose:** Users running migrations at 2am need numbered steps they can follow mechanically. Step 1, Step 2, Step 3. Not a paragraph.
- **Scope the blast radius:** Tell users how much work is involved. "Search your codebase for `api_key=` -- there will be exactly one call site per Client instantiation." reduces upgrade anxiety.
- **Provide an automated migration path if one exists:** codemods (jscodeshift, ast-grep), sed scripts, migration scripts, or database migration commands. Always prefer automation over manual steps.
- **State what does NOT break:** If the change is narrow, explicitly say so. "Only the constructor parameter name changed. All methods, response shapes, and other parameters are unchanged." This prevents users from doing unnecessary audit work.
- **Interleave version fencing when both versions must coexist:** If users operate in environments where old and new versions run simultaneously during a migration window, document how to handle that case.

### 5. Handle Security Changes with Elevated Detail

Security entries require more structure than other change types. Underspecifying security information prevents users from assessing their own risk.

- **Severity:** Use CVSS v3.1 severity labels (Critical: 9.0-10.0, High: 7.0-8.9, Medium: 4.0-6.9, Low: 0.1-3.9) or, if CVSS has not been calculated, use a descriptive label with explicit justification.
- **CVE ID:** Include if assigned. If not yet assigned, state "CVE pending." Do not delay publishing release notes because a CVE number has not been assigned.
- **Affected versions:** State the exact range: "Affects versions 2.0.0 through 3.1.4. Not present in 1.x." This allows users to quickly determine if they are affected.
- **Attack vector in plain language:** "An attacker who could send authenticated API requests could access data from other tenants in the same organization" is more useful than the CVSS vector string.
- **Acknowledgment:** Credit the reporter if they have consented to attribution.
- **Do not include exploit details** that could enable attacks against users who have not yet patched.

### 6. Write the Summary Section Last, Not First

The summary is written last because it depends on knowing the full scope of the release.

- **First sentence:** State the headline feature or theme. If the release is primarily a stability release, say so explicitly: "v2.3.1 is a stability release with 7 bug fixes and no new features."
- **Second sentence:** Count by category. "Includes 2 new features, 4 improvements, 7 bug fixes, 1 breaking change, and 1 security patch." This gives readers an immediate triage signal.
- **Third sentence (conditional):** Urgency signal. If there is a breaking change: "Users of the `Client` class must update one constructor parameter before upgrading." If there is a security patch: "All users on 3.x are advised to upgrade immediately." If neither applies, this sentence is optional.
- **Upgrade command:** Include the literal command to upgrade as a code block in the summary or upgrade section. Do not make users scroll to find it.
- **Keep the summary under 100 words.** Developers often skim release notes before reading them. A dense paragraph repels readers.

### 7. Order the Document for Reader Priority

The order of sections communicates urgency. Readers making upgrade decisions read top to bottom and stop when they have enough information.

Canonical section order:
1. Version, date, upgrade command (orienting metadata)
2. Summary (triage signal)
3. Breaking Changes (highest urgency -- must act before upgrading)
4. Security (high urgency -- may require immediate upgrade regardless of breaking changes)
5. New Features (motivation to upgrade)
6. Improvements (quality-of-life motivation)
7. Bug Fixes (problems resolved)
8. Deprecations (future action required, not urgent today)
9. Known Issues (informed-consent transparency)
10. Upgrade Instructions (complete upgrade procedure including post-upgrade steps)
11. Acknowledgments (optional -- credit contributors, security reporters)

If a section is empty, omit it entirely. A "Bug Fixes: None" section adds noise. Exception: Known Issues. If there are no known issues, a brief "No known issues in this release" line is appropriate because its absence may imply the author forgot the section.

### 8. Review Against the Release Notes Quality Checklist

Before delivering the output, verify:

- [ ] Every breaking change has before/after code, rationale, and numbered migration steps
- [ ] Every bug fix describes the symptom, not the internal cause
- [ ] Every performance claim is quantified with a methodology note
- [ ] Every deprecation names the replacement and removal version
- [ ] Every security entry includes severity, affected versions, and CVE if assigned
- [ ] Version number matches the SemVer convention implied by the change types
- [ ] No internal ticket IDs appear without human-readable descriptions
- [ ] The upgrade command is syntactically correct for the package ecosystem
- [ ] No future tense is used for changes that have already shipped ("now supports" not "will support")
- [ ] The summary accurately counts changes by category

---

## Output Format

```markdown
# [Product Name] v[X.Y.Z] Release Notes

**Release date:** YYYY-MM-DD
**Previous version:** vX.Y.Z-1

```[package-manager]
[upgrade command]
```

---

## Summary

[One sentence: headline theme of this release.] [One sentence: count by category -- e.g., "Includes 2 new features, 3 improvements, 6 bug fixes, 1 breaking change, and 1 security patch."] [One sentence: urgency signal if breaking change or security patch exists, otherwise omit.]

---

## ⚠ Breaking Changes

### [Change title -- noun phrase describing what changed]

**Affected users:** [Who is affected -- e.g., "All users calling `Client.connect()`" or "Users using the `--output` CLI flag"]

**Before:**
```[language]
[exact previous API, config, or code pattern]
```

**After:**
```[language]
[exact new API, config, or code pattern]
```

**Why this changed:** [One sentence rationale.]

**Migration steps:**

1. [First concrete action -- be specific about what to find and what to replace]
2. [Second action]
3. [Verification step -- how to confirm the migration succeeded]

**Scope:** [Narrow the blast radius. e.g., "Affects exactly one call site per application -- the initial client construction."]

---

## 🔒 Security

| Severity | CVE | Description | Affected Versions |
|----------|-----|-------------|-------------------|
| [Critical/High/Medium/Low] | [CVE-YYYY-NNNNN or "pending"] | [Plain-language description of the vulnerability and fix] | [vX.Y.Z -- vA.B.C] |

[If High or Critical: "All users on affected versions should upgrade immediately."]

[Reporter credit if applicable.]

---

## New Features

### [Feature Name]

[What it does and why it matters to the user. 2-3 sentences. Lead with the capability and its benefit. Include quantified limits or constraints if relevant: "Supports batches of up to 500 items per request."]

```[language]
// Minimal, complete usage example
[code example]
```

[Link placeholder to full documentation if the feature is complex enough to warrant it.]

---

## Improvements

| Area | Change | Impact |
|------|--------|--------|
| [Component] | [What changed] | [Quantified or described user-facing impact] |
| [Component] | [What changed] | [Quantified or described user-facing impact] |

*Alternatively, use a bullet list for three or fewer improvements:*

- **[Component -- improvement description]:** [Quantified impact or behavioral description.] ([#issue])

---

## Bug Fixes

- **[Component]:** Fixed [symptom users experienced] that occurred when [triggering condition]. ([#issue])
- **[Component]:** Fixed [symptom users experienced] that occurred when [triggering condition]. ([#issue])

---

## Deprecations

| Deprecated | Removed In | Replacement | Notes |
|-----------|------------|-------------|-------|
| `[symbol or feature name]` | v[X.0.0] | `[replacement symbol]` | [One-line migration note] |

---

## Known Issues

- **[Component]:** [Description of the issue and triggering conditions.] **Workaround:** [How to avoid or work around the issue until it is fixed.] Tracked in [#issue].

*If no known issues:* No known issues in this release.

---

## Upgrade Instructions

```[package-manager]
[exact upgrade command]
```

**Post-upgrade steps:**

1. [Any required configuration changes, database migrations, or manual actions]
2. [Verification command to confirm successful upgrade]

**Rollback procedure:**

```[package-manager]
[exact downgrade command]
```

[Note any state changes that make rollback non-trivial, e.g., database migrations that must be reversed.]

---

## Acknowledgments

[Optional. Credit external contributors and security reporters.]
```

---

## Rules

1. **Never describe changes from the implementer's perspective.** "Replaced synchronous file I/O with async streams" is an implementation note. "Eliminated 2-3 second UI freezes that occurred when opening files larger than 500KB" is a release note entry. Every entry must pass the test: "Does a user who does not read source code care about this phrasing?"

2. **Never publish a breaking change without a complete, testable migration path.** "Update your code" is not a migration path. A migration path requires: before code, after code, ordered steps, and a verification method. If the user cannot provide migration details, ask explicitly before writing the section.

3. **Never bury security entries in the Bug Fixes section.** Security changes warrant their own section with severity, CVE reference, and affected version range regardless of how minor the vulnerability was assessed. Users running automated vulnerability scanners will look for a Security section specifically.

4. **Never use vague quantifiers like "significantly," "much faster," or "greatly improved."** Every performance claim must include a number, a baseline, and a test condition. "Reduced cold start time from 1.8s to 0.4s on a t3.medium instance with a 512MB deployment package" is acceptable. "Significantly faster cold starts" is not.

5. **Never list deprecations without naming a specific removal version and a named replacement.** "Deprecated in this release" with no removal timeline creates indefinite ambiguity that prevents users from planning migrations. If no replacement exists yet, state "No direct replacement -- see [migration guide]" rather than leaving the replacement column blank.

6. **Always verify the version number matches the SemVer contract implied by the change types.** If the user says it is a patch release (x.y.Z) but the changes include a new feature, flag the inconsistency: "This change looks like a minor release (x.Y.0) per SemVer because it adds new functionality. Is v[x.y.Z] intentional?" Do not silently proceed with a version that misrepresents the change scope.

7. **Always omit empty sections rather than listing them with "None" or "N/A."** Exception: Known Issues, where explicit "No known issues in this release" is preferred over silence, because users cannot distinguish "no known issues" from "author forgot this section."

8. **Never use relative time references ("last version," "recently," "previously") in breaking change migration paths.** Use exact version numbers: "Before v3.2.0" and "In v3.2.0 and later." Release notes are read months or years after publication when the context of "last version" has been lost.

9. **When a release contains 5 or more breaking changes, recommend a standalone migration guide.** The release notes should contain a summary of each breaking change with a one-paragraph description and a link to the migration guide. The full before/after code examples belong in the migration guide, not duplicated inline.

10. **Never use future tense for changes that have already shipped.** "This version adds" not "This version will add." "The `timeout` parameter is now required" not "The `timeout` parameter will now be required." Future tense creates ambiguity about whether the change is in the current version or an upcoming one.

11. **When writing for mixed audiences (developers and end users), use labeled subsections within categories.** Place a "For Developers" or "For Operators" sub-label before entries that only apply to one audience. Do not force end users to parse API signature changes, and do not force developers to parse UI change descriptions irrelevant to their integration.

12. **Never include internal ticket IDs from a private tracker as the sole reference.** If the tracker is public (GitHub Issues, GitLab MR, JIRA with public access), include the ID with a human-readable description. If the tracker is private, omit the ID entirely -- an inaccessible reference produces reader confusion and support tickets.

---

## Edge Cases

### Major Version Release With More Than 5 Breaking Changes

When a MAJOR version (e.g., v2.0.0, v4.0.0) ships with numerous breaking changes, the inline migration blocks will overwhelm the release notes and prevent readers from assessing the full scope of required changes.

Handle as follows: In the release notes, include a Breaking Changes section that lists each change as a one-paragraph summary with a "Migration impact" label (Low: find/replace; Medium: refactoring required; High: architectural changes required). Then link to a separate Migration Guide document for full before/after code and step-by-step instructions. The release notes become the index; the migration guide carries the detail. State the estimated migration effort at the top: "Most users will need 2-4 hours to migrate from v3.x to v4.0.0. Users with custom authentication providers should budget additional time."

### Hotfix / Patch Release With a Single Critical Fix

A patch release motivated by a single bug or security issue should not be padded with boilerplate sections. Apply this streamlined structure: lead immediately with what was fixed and why it was urgent. Include the severity for security issues. State affected versions explicitly. Provide the upgrade command in the first 10 lines so users on call can act immediately. Omit New Features, Improvements, and Deprecations sections entirely if empty. Known Issues: confirm whether this patch also resolves any previously documented known issues and update that status.

### Pre-Release (Alpha, Beta, Release Candidate)

Pre-release notes require an explicit stability contract at the top, before the summary. Use a clearly formatted callout block: "⚠ This is a pre-release version. APIs marked [experimental] may change before the stable release. Do not use in production." For alpha releases, note which features are complete vs. incomplete. For beta releases, explicitly list what feedback the team is seeking. For release candidates, note what conditions would prevent promotion to stable. Include a one-line revert command so early adopters know how to fall back: `npm install mylib@stable`.

### Release With Only Internal, Non-User-Facing Changes

Infrastructure changes (CI pipeline updates, dependency upgrades with no API surface change, internal refactors) have no user-facing impact but justify a version bump for traceability. Structure: a brief summary ("v2.1.4 contains internal maintenance changes with no user-facing impact"), a "Developer Notes" section listing the internal changes (useful for developers tracking security-relevant dependency upgrades like a bumped OpenSSL version), and explicit confirmation that no migration steps are required. Do not publish an empty release note with only a version number -- even maintenance releases deserve transparency.

### Multi-Platform or Multi-Runtime Release

When a release ships across multiple platforms (Web, iOS, Android, Desktop, CLI) or multiple language runtimes (Node.js, Python, Go, Java), changes often apply to only a subset. Structure: begin with a "Shared Changes" section covering all platforms, then use platform-labeled sub-sections (## iOS, ## Android, ## Web, ## CLI) for platform-specific items. In the summary, list platform coverage explicitly: "This release covers Web v3.2.0, iOS v3.2.0, Android v3.1.8 (patch only), and CLI v3.2.0." When version numbers differ by platform, make this explicit in the header.

### Release That Also Deprecates a Deprecated Feature (Deprecation Enforcement)

When a version carries through on a previously announced deprecation -- removing something that was deprecated in a prior version -- this must be treated as a breaking change, not merely noted under Deprecations. Even if it was announced in advance, users who missed the deprecation notice will experience breakage. Include it in Breaking Changes with a "Previously deprecated in vX.Y.Z" note. Provide the same full migration block as any other breaking change. Cross-reference the original deprecation notice. Add a note that users who acted on the earlier deprecation warning are unaffected.

### App Store / Mobile Release Notes

Mobile app stores (Apple App Store, Google Play) impose character limits: Apple App Store limits release notes to 4,000 characters; Google Play limits to 500 characters. These constraints require radical prioritization. For Apple: lead with the most user-impactful change, use plain language (no code blocks), and exclude developer-facing details. For Google Play: use one to three bullet points maximum, each under 150 characters, covering only the change that directly benefits the end user. Maintain a full internal version of the release notes separately. Never paste developer-focused technical release notes verbatim into a store listing.

### Coordinated Vulnerability Disclosure With Embargo

When a security vulnerability is being disclosed under a coordinated timeline, the release notes must ship exactly on the embargo lift date -- not before (which breaks the embargo) and not after (which leaves users exposed). Prepare two versions: a pre-embargo version for internal review with full CVE details, and a sanitized stub for any pre-release documentation. On the embargo date, publish the full version including CVE, CVSS score, attack vector description, affected versions, and patch. Include instructions for users who cannot upgrade immediately, if a workaround exists. Never include proof-of-concept exploit code in the release notes regardless of disclosure status.

---

## Example

**Input:** "Write release notes for our data pipeline SDK, PipelineKit v4.1.0. Changes: (1) New streaming transform API that processes records one-at-a-time instead of loading entire datasets into memory -- this is the main feature. (2) The `BatchProcessor.run()` method now requires an explicit `timeout` parameter (previously optional, defaulted to 30 seconds) -- breaking change. (3) Reduced memory usage by 60% for pipelines handling more than 1 million records. (4) Fixed a crash that happened when a source emitted zero records. (5) Fixed incorrect row counts in the progress callback when pipelines contained filter steps. (6) Deprecated `LegacyConnector` class -- remove in v5.0, use `Connector` instead. (7) CVE-2024-38291, high severity, SSRF vulnerability in HTTP source when following redirects -- affects 3.x and 4.0.x. Target audience is Python developers."

---

**Output:**

# PipelineKit v4.1.0 Release Notes

**Release date:** 2024-07-22
**Previous version:** v4.0.3

```bash
pip install pipelinekit==4.1.0
```

---

## Summary

v4.1.0 introduces a streaming transform API that eliminates memory-bound limits for large-scale pipelines, alongside a high-severity security patch for all users on 3.x and 4.0.x. Includes 1 new feature, 1 improvement, 2 bug fixes, 1 breaking change, 1 deprecation, and 1 security patch. **Users on 3.x or 4.0.x should upgrade immediately to address CVE-2024-38291. Users of `BatchProcessor` must update their code before upgrading -- see Breaking Changes below.**

---

## ⚠ Breaking Changes

### `BatchProcessor.run()` now requires an explicit `timeout` parameter

**Affected users:** All users calling `BatchProcessor.run()` without a `timeout` argument.

**Before:**
```python
# timeout was optional; default was 30 seconds
processor = BatchProcessor(source=my_source, steps=my_steps)
processor.run()
```

**After:**
```python
# timeout is now required
processor = BatchProcessor(source=my_source, steps=my_steps)
processor.run(timeout=30)
```

**Why this changed:** The silent 30-second default caused hard-to-diagnose failures in long-running pipelines. Requiring an explicit value forces developers to make a conscious decision about timeout behavior for their use case.

**Migration steps:**

1. Search your codebase for all calls to `.run(` on a `BatchProcessor` instance.
2. For each call that omits `timeout`, add `timeout=30` to preserve the previous behavior, or set a value appropriate for your pipeline's expected duration.
3. Run your test suite. No other behavior changes -- all other `BatchProcessor` parameters and return values are unchanged.
4. Verify by running: `python -c "import pipelinekit; print(pipelinekit.__version__)"` and confirming `4.1.0`.

**Scope:** Affects exactly one call site per `BatchProcessor` instance -- the `.run()` invocation. Constructor signature, step configuration, and output format are all unchanged.

---

## 🔒 Security

| Severity | CVE | Description | Affected Versions |
|----------|-----|-------------|-------------------|
| High | CVE-2024-38291 | SSRF vulnerability in `HTTPSource` when following HTTP redirects. An attacker controlling a data source URL could redirect requests to internal network endpoints. Fixed by disabling cross-scheme redirect following by default. | v3.0.0 -- v4.0.3 |

**All users on v3.x or v4.0.x should upgrade to v4.1.0 immediately.**

To disable redirect following explicitly in environments where you cannot upgrade immediately:

```python
source = HTTPSource(url=my_url, follow_redirects=False)
```

Reported by Priya Nair. CVE assigned 2024-07-10.

---

## New Features

### Streaming Transform API

The new `StreamTransform` class processes pipeline records one at a time instead of loading entire datasets into memory before processing begins. Pipelines handling more than 1 million records previously required proportional memory allocation; `StreamTransform` holds only a single record in memory at each processing stage, enabling pipelines of arbitrary size on fixed-memory infrastructure.

Streaming transforms support all existing step types (filter, map, aggregate) and integrate with the existing `BatchProcessor` pipeline runner.

```python
from pipelinekit import StreamTransform, HTTPSource, CSVSink

pipeline = StreamTransform(
    source=HTTPSource(url="https://data.example.com/records.jsonl"),
    steps=[
        FilterStep(lambda r: r["status"] == "active"),
        MapStep(lambda r: {**r, "processed_at": datetime.utcnow().isoformat()}),
    ],
    sink=CSVSink(path="output.csv"),
)

# Processes records one at a time -- memory usage is constant regardless of dataset size
pipeline.run(timeout=300)
```

`StreamTransform` does not support steps that require the full dataset before producing output (e.g., `SortStep`, `DeduplicateStep`). Use `BatchProcessor` for pipelines that require global operations.

---

## Improvements

| Area | Change | Impact |
|------|--------|--------|
| Memory management | Optimized buffer pooling in `BatchProcessor` for datasets exceeding 1 million records | Memory usage reduced by 60% (measured at 1M and 10M record benchmarks on a 16GB host; previously 8.4GB peak now 3.3GB peak) |

---

## Bug Fixes

- **`BatchProcessor`:** Fixed a crash (`IndexError: list index out of range`) that occurred when a source emitted zero records. Pipelines with empty sources now complete successfully and return an empty result set. (#1042)
- **Progress callback:** Fixed incorrect row counts reported by the `on_progress` callback when pipelines contained one or more `FilterStep` instances. Previously reported pre-filter row counts; now reports post-filter counts, matching the actual records processed downstream. (#1089)

---

## Deprecations

| Deprecated | Removed In | Replacement | Notes |
|-----------|------------|-------------|-------|
| `LegacyConnector` | v5.0.0 | `Connector` | `Connector` accepts the same `host`, `port`, and `credentials` arguments. Replace `LegacyConnector(...)` with `Connector(...)` with no other changes required. |

---

## Known Issues

No known issues in this release.

---

## Upgrade Instructions

```bash
pip install pipelinekit==4.1.0
```

**Post-upgrade steps:**

1. Update all `BatchProcessor.run()` calls to include an explicit `timeout` parameter (see Breaking Changes above).
2. If you use `HTTPSource` with `follow_redirects=True`, review whether your sources require cross-scheme redirects. The default is now `False`; pass `follow_redirects=True` explicitly if your use case requires it.
3. Run your pipeline test suite to confirm expected behavior.

**Rollback procedure:**

```bash
pip install pipelinekit==4.0.3
```

Note: Rolling back from v4.1.0 to v4.0.3 reintroduces CVE-2024-38291. Apply the `follow_redirects=False` workaround if you roll back while investigating upgrade issues.

---

## Acknowledgments

Security vulnerability CVE-2024-38291 reported by Priya Nair under responsible disclosure. Thank you for your detailed reproduction case and coordinated disclosure timeline.
