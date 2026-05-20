---
name: readme-writing
description: |
  Creates GitHub-ready README.md files with project overview, installation
  instructions, usage examples, configuration details, and contributing
  guidelines. Use when the user needs a README for a repository, wants to
  improve an existing README, or asks for project documentation. Do NOT use
  for API documentation (use `api-documentation`), user guides (use
  `user-guide`), or changelogs (use `changelog-writing`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation guide"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# README Writing

## When to Use

Use this skill when any of the following conditions are true:

- The user is creating a new GitHub, GitLab, or Bitbucket repository and needs a README.md file from scratch
- The user has an existing README that is incomplete, outdated, or fails to communicate the project's purpose clearly to a first-time visitor
- The user's project just reached a milestone (v1.0 release, open-sourcing, new major feature) and needs documentation to match
- The user is preparing a project for public visibility and needs a README that will convert visitors into users or contributors
- The user has a functional project but no documentation -- someone cloned it and had no idea what to do with it
- The user wants to add badges, a table of contents, or structured sections to an existing plain-text README
- The user is contributing to an open source project and needs to write a README that follows community conventions

**Do NOT use this skill when:**

- The user needs a full API reference with endpoint definitions, request/response schemas, and authentication details -- use `api-documentation` instead
- The user wants a narrative, tutorial-style walkthrough of a product's features for end users -- use `user-guide` instead
- The user needs a versioned history of changes, breaking changes, and release notes -- use `changelog-writing` instead
- The user wants a technical specification or design document describing architecture decisions -- use `technical-specification` instead
- The user wants a CONTRIBUTING.md file (standalone contributor guidelines document) -- use `contributing-guide` instead
- The user needs docs that live in a docs site (MkDocs, Docusaurus, Sphinx) -- READMEs are entry points, not full documentation sites; refer to `docs-site-writing` instead
- The user is documenting a public REST API intended for third-party integration -- that requires OpenAPI/Swagger format, not a README

---

## Process

### Step 1: Gather Project Context Before Writing Anything

Never generate a README from the project name alone. Ask for or infer the following:

- **Project name and tagline:** One sentence that finishes the phrase "This tool lets you..." -- not "This is a tool that..."
- **Project type:** CLI tool, library/SDK, web application, framework, data pipeline, mobile app, hardware project, or template/starter kit -- each type has a different README structure
- **Primary language and ecosystem:** Python/pip, Node.js/npm, Go/go get, Rust/cargo, Ruby/gem -- this determines exact install commands and code block syntax
- **Target audience:** Developers integrating a library, operators running a service, data scientists using a toolkit, students learning a concept -- this controls vocabulary and assumed knowledge
- **Maturity level:** Proof-of-concept, alpha, beta, stable, or maintained long-term -- this determines what warnings or notices to include
- **Accepted contribution model:** Open to external contributors, internal-only, read-only archive -- this determines whether to include Contributing section
- **License:** MIT, Apache 2.0, GPL-3.0, proprietary, unlicensed -- never assume MIT; ask explicitly
- **Existing assets:** Screenshots, demo GIFs, CI pipeline (for badge links), hosted documentation site

If the user cannot provide all of this, make reasonable inferences based on the code or context they share, but state your assumptions explicitly in the README draft so they can correct them.

### Step 2: Design the README Structure Before Writing Prose

Not every README needs every section. Choose the structure based on project type:

**For a library or SDK:**
- Title + description + badges
- Why this library (motivation -- 3-5 bullet points, not paragraphs)
- Installation
- Quick Start (2-3 lines of code that show immediate value)
- Usage (grouped by concept, not alphabetical)
- API reference summary (link to full docs if they exist)
- Configuration
- Contributing
- License

**For a CLI tool:**
- Title + description + badges
- Features list
- Installation (with OS variants if needed)
- Usage with subcommands shown progressively
- Configuration (flags table + config file format)
- Examples section (real-world invocations)
- Contributing
- License

**For a web application or service:**
- Title + description + demo link or screenshot
- Features
- Getting Started (includes local dev setup)
- Environment Variables
- Running Tests
- Deployment
- Contributing
- License

**For a data science or research project:**
- Title + description
- Dataset and dependencies
- Setup (virtual environment + requirements)
- Reproducing results (exact commands in order)
- Project structure (directory tree with descriptions)
- Citation
- License

**For a template or starter kit:**
- Title + what it scaffolds
- What's included (directory tree)
- Quickstart (clone + install + run in 3 commands)
- Customization points
- License

Decide on the section list BEFORE writing. Every section you include must earn its place. A README with 4 excellent sections beats one with 10 mediocre sections.

### Step 3: Write the Opening Block -- Title, Description, Badges

The opening block is the most critical real estate in any README. It is what GitHub renders above the fold before any scrolling.

**Title:**
- Use the project name exactly as it appears in the package registry (case-sensitive)
- Never append "README" or "Documentation" to the H1 -- it wastes the title

**Description (the paragraph immediately under the title):**
- Write exactly 1-3 sentences maximum -- this is not the place for history
- Answer: what does it do, who is it for, what makes it different
- Use active voice: "quicktest runs test files in parallel" not "quicktest is a test runner that can be used to run test files in parallel"
- Include the primary differentiator if one exists ("without any configuration" / "in under 10ms" / "with zero dependencies")

**Badges:**
- Place badges on a single line between the description and the table of contents
- Standard badge order: build/CI status, version/release, license, coverage, downloads
- Use shields.io badge syntax for static badges: `![License](https://img.shields.io/badge/license-MIT-blue)`
- Only include badges that are accurate and maintained -- stale "build passing" badges damage credibility more than no badge
- Do not include more than 6 badges -- they lose meaning past that count

**Screenshot or demo GIF:**
- For visual tools, UIs, or CLI tools with rich output, include a screenshot or GIF immediately after badges
- Use `<p align="center"><img src="docs/screenshot.png" alt="demo" width="600"/></p>` for centered images
- Caption the image so screen readers and text browsers still get context

### Step 4: Write the Installation Section With Zero Assumptions

The installation section fails when the author already knows how to install it and forgets what a new user doesn't know.

- **List every prerequisite with an exact version range.** Not "Node.js" -- "Node.js >= 18.0.0 (LTS recommended)". Not "a database" -- "PostgreSQL >= 14".
- **Show the version check command for each prerequisite:**
  ```
  node --version   # should print v18.x.x or higher
  python --version # should print Python 3.10.x or higher
  ```
- **Show one install method in full, then mention alternatives.** The first method shown should be the recommended one. If npm, pip, and manual install all work, show npm first for a Node project, pip first for a Python project.
- **Include OS-specific variations only when they are meaningfully different.** A macOS vs. Linux variation where only the package manager name changes (`brew` vs. `apt`) does not need its own subsection -- a one-liner note suffices. A Windows variation with a .exe installer or WSL2 requirement DOES need its own subsection.
- **Always end installation with a verification step.** Show a command and its expected output so the user knows installation succeeded before they spend time debugging something that was never installed correctly.
- **For projects with complex setup (databases, environment files, Docker), use numbered subsections:** Prerequisites, Environment Setup, Database Initialization, Start the Application. Never combine these into a single code block.

### Step 5: Write the Usage Section With Real Inputs and Real Outputs

This is the section most authors underinvest in and most readers rely on the most.

- **Open with the simplest possible complete example.** One command or one code snippet that a user can copy, run, and see working output from. No setup required beyond what was covered in Installation.
- **Show expected output alongside every example.** Output blocks use a plain code fence (no language identifier or `text`) to distinguish them from input commands. A user who sees matching output knows they are on track.
- **Progress from simple to complex within the section.** Organize subsections as: Basic Usage → Common Options → Advanced Scenarios. Never start with an advanced scenario.
- **Use realistic data, not placeholders.** `input.csv` is better than `yourfile.csv`. `example.com` is better than `your-domain.com`. `User John` is better than `Your Name Here`.
- **For libraries, show the import + the first real function call together.** Never show just an import without a use. Never show a function call without the import.
- **For CLIs with many subcommands, document each subcommand as its own subsection with at least one example each.**
- **If there is a configuration file format (JSON, YAML, TOML), show a complete minimal working example, not just a schema.** Readers configure by example, not by reading schemas.

### Step 6: Write Configuration With Explicit Types and Defaults

Configuration documentation fails in two ways: missing entries, and entries without defaults. Both failures cost users debugging time.

- **Put all configuration options in a table with four mandatory columns: Name, Type, Default, Description.**
- **For environment variables:** Use `ENV_VAR_NAME` format in the Name column. State whether the variable is required or optional. If required with no default, say "required -- no default".
- **For CLI flags:** Show both short and long form if both exist: `-v, --verbose`.
- **For config file keys:** Show the exact key path in dot notation for nested configs: `database.host`, `logging.level`.
- **State units for numeric values:** Not `timeout: 5000` but `timeout: 5000 (milliseconds)`. Not `maxSize: 100` but `maxSize: 100 (MB)`.
- **Show a complete example config file when the configuration has more than 5 options.** A table is scannable, but a working config file is copyable.
- **Group related configuration options.** Database settings together, logging settings together, feature flags together.

### Step 7: Format for Scanning, Not Linear Reading

Studies of developer documentation reading behavior show that technical readers scan headings, code blocks, and bullet points first -- they do not read paragraphs until they have located the section they need.

- **Table of contents:** Required when the README exceeds 4 sections or will render beyond two screen heights. Use anchor links that match the heading text converted to lowercase with hyphens (`## Getting Started` becomes `#getting-started`).
- **Code blocks:** Every command, every path, every environment variable name, every config key, every file name belongs in backticks or a fenced code block. Inline code for mentions (`run \`npm install\``), fenced blocks for examples.
- **Language identifiers on all fenced code blocks:** `bash` for shell commands, `python`/`javascript`/`go` for language code, `yaml`/`json`/`toml` for config files, `text` for generic output.
- **Paragraph length:** Maximum 4 lines per paragraph in any prose section. If you are writing more than 4 lines of prose, either it is a list or it belongs in a different document.
- **Section length:** If a single section exceeds 30 lines, it may need to be split, linked to an external document, or pruned.
- **Bold text:** Use bold for the first mention of a key term or important constraint. Do not bold for decoration. Do not bold entire sentences.
- **Headers:** Use H2 (`##`) for main sections, H3 (`###`) for subsections within a section, H4 (`####`) sparingly for sub-subsections. Never skip header levels.

---

## Output Format

The complete README template follows. Field annotations in brackets are instructions, not literal text.

```markdown
# [Project Name]

[One to two sentences. What it does. Who it is for. What makes it different from alternatives. Active voice only.]

![CI](https://img.shields.io/github/actions/workflow/status/[owner]/[repo]/ci.yml?branch=main)
![Version](https://img.shields.io/github/v/release/[owner]/[repo])
![License](https://img.shields.io/badge/license-[LICENSE]-blue)
![Coverage](https://img.shields.io/codecov/c/github/[owner]/[repo])

[Optional: centered screenshot or demo GIF for visual projects]

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Features

- **[Feature name]:** [What it does and why it matters, one sentence]
- **[Feature name]:** [What it does and why it matters, one sentence]
- **[Feature name]:** [What it does and why it matters, one sentence]
- **[Feature name]:** [What it does and why it matters, one sentence]

## Installation

### Prerequisites

- [Runtime] >= [version] -- run `[runtime] --version` to check
- [Tool] >= [version] -- install via [link or package manager command]
- [Optional dependency] (required only for [specific feature])

### Install

```bash
[primary package manager install command, e.g., npm install -g projectname]
```

**Alternative install methods:**

```bash
# From source
git clone https://github.com/[owner]/[repo].git
cd [repo]
[build command]
```

### Verify Installation

```bash
[tool] --version
```

Expected output:
```
[tool name] v[version number]
```

## Usage

### Basic Usage

[One sentence describing the simplest case.]

```bash
[simplest complete command or code snippet]
```

Output:
```
[exact expected output]
```

### [Second Most Common Use Case]

```bash
[command or code]
```

Output:
```
[expected output]
```

### [Advanced Use Case]

[One sentence of context for when this is needed.]

```bash
[command or code]
```

## Configuration

[Project Name] can be configured via [environment variables / a config file at `.[projectname]rc` / CLI flags].

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `OPTION_NAME` | string | `"default"` | [What it controls. Units if numeric.] |
| `OPTION_NAME` | integer | `30` | [What it controls. Units: seconds.] |
| `OPTION_NAME` | boolean | `false` | [What enabling this does.] |
| `OPTION_NAME` | string | required | [What it is. No default -- must be set.] |

**Example configuration file (`.projectnamerc`):**

```yaml
option_name: value
other_option: 30
feature_flag: true
```

## Running Tests

```bash
[test command]
```

[Optional: note about test categories, integration vs. unit, required env vars for tests]

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature-name`
3. Make your changes and add tests
4. Run the test suite: `[test command]`
5. Open a pull request against `main`

Branch naming conventions: `feat/`, `fix/`, `docs/`, `chore/`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards, commit message format, and PR checklist.

## License

[License name]. See [LICENSE](LICENSE) for the full text.
```

---

## Rules

1. **Never open with history, motivation, or architecture.** The first sentence a user reads must tell them what the project does in concrete terms. "A fast parallel test runner for Node.js" passes. "I built this because I was frustrated with slow tests" fails. "This project uses a worker-pool architecture" fails.

2. **Every code example must be runnable as written.** If a command requires an environment variable to be set, show that in the example. If it requires a file to exist, show how to create it first. A non-runnable example is worse than no example -- it creates confusion and erodes trust.

3. **Never use the word "simply," "just," "easy," or "straightforward" in any instruction.** These words signal that the author has forgotten how difficult setup can be for a new user and are a proxy for missing steps. Instead of "just run `npm install`," write "`npm install` downloads all dependencies listed in `package.json`."

4. **Installation must always include a verification step with expected output.** "Install X" followed immediately by "Use X" skips the moment where a user can confirm everything worked. Every installation section ends with a run-this-and-you-should-see-this confirmation.

5. **Configuration tables must include a Default column.** A user who does not know the default does not know whether they need to set the value. "required -- no default" is a valid default value. Never leave the column blank.

6. **Fenced code blocks must always carry a language identifier.** `bash` for shell, `python`/`javascript`/`go`/`rust` etc. for language code, `yaml`/`json`/`toml` for config files, `text` for raw output. Unidentified code blocks disable syntax highlighting on GitHub and signal careless documentation.

7. **Version numbers in prerequisites must be exact minimum versions, not vague.** "Node.js >= 18.0.0" is correct. "Node.js (modern)" fails. "Python 3" fails -- Python 3.8 and Python 3.12 are not equivalent for a project using `match` statements or `tomllib`.

8. **Do not duplicate information between the README and other documentation files.** The README is the entry point. If a full contributing guide exists in CONTRIBUTING.md, the README's Contributing section contains the 3-step summary and a link -- not a copy. Duplicate information goes stale at different rates and creates contradictions.

9. **Alpha or pre-1.0 projects must carry a stability notice at the top**, immediately below the badges, before any other content: "This project is under active development. APIs and configuration options may change between releases." Link to the changelog or migration guide if they exist.

10. **Badges must be accurate.** A failing CI badge, a stale "v0.1.0" version badge on a project that is at v3.2, or a "100% coverage" badge on a project with no tests destroys credibility instantly. If a badge cannot be kept accurate automatically (via GitHub Actions or a service like Codecov), do not include it. Static badges (like `license: MIT`) are always acceptable because they do not go stale.

11. **Table of contents anchor links must match GitHub's anchor generation rules exactly.** GitHub lowercases all heading text and replaces spaces with hyphens. `## Getting Started` becomes `#getting-started`. Special characters are stripped. `## API (v2)` becomes `#api-v2`. Test all TOC links manually before finalizing.

12. **For projects with multiple installation methods, never bury the recommended method.** Show the recommended method first, clearly labeled. Alternative methods follow under an "Alternative" heading or note. A user who scrolls to find the "right" install method will often pick the wrong one.

---

## Edge Cases

### Monorepo With Multiple Packages

When the repository contains multiple distinct packages or services (e.g., a `packages/` directory with `api/`, `cli/`, `sdk/`):

- The root README describes the repository as a whole: what the monorepo contains, why the packages are colocated, and the overall architecture in 3-5 bullets
- Include a **Packages** section with a table: Package Name | Description | Version | Docs Link
- Provide a **Quickstart** that covers the most common package only -- "Most users want the CLI; see `packages/cli/README.md`"
- Each individual package has its own full README with its own Installation, Usage, and Configuration sections
- Do not try to document all packages in the root README -- it will be outdated within weeks

### Pre-Release or Experimental Software

For alpha, beta, or proof-of-concept projects:

- Add a warning callout immediately below badges using GitHub's blockquote syntax: `> [!WARNING]` (renders as a colored warning box in GitHub Markdown)
- State the current stability level and what "alpha" means for this specific project (does the API change? does data persist? are breaking changes expected?)
- Include a link to the open issues or milestones tracking progress toward stability
- Do not promise a stable release date in the README -- instead link to the roadmap or milestone tracker
- If using semantic versioning, note that 0.x.y versions follow relaxed semver (minor bumps may be breaking)

### CLI Tool With Many Subcommands (10+)

When a CLI has more subcommands than can fit readably in a single Usage section:

- Show only the 3 most-used subcommands in the README with full examples
- Add a `[tool] --help` usage as the first example so users learn to self-document
- Create a separate `docs/commands.md` file with the full command reference and link to it prominently
- Include a **Command Overview** table: Command | Description | Example -- as a quick-reference before the detailed examples

### Project With No Public Install Method (In-Development or Internal)

When the project is not published to any package registry:

- Installation is always "from source" -- show the full sequence: clone, dependency install, build, and optionally symlink or add to PATH
- If the project requires build tools (make, cargo, cmake), list them as prerequisites with version requirements
- If there is no automated test to verify installation, provide a minimal functional test: "If the following command prints output without errors, installation succeeded"
- For internal projects: replace Contributing and License sections with a **Team** section (owners, on-call contact) and an **Internal Support** section (Slack channel, Jira board, Confluence link)

### Project With Complex Local Setup (Docker, Databases, Multiple Services)

When getting the project running locally requires more than 3 commands:

- Break Installation into named subsections: 1. Prerequisites, 2. Clone and Configure, 3. Database Setup, 4. Start Services
- Provide a `docker-compose.yml` quickstart as the FIRST option, even if not everyone will use it -- it eliminates the most common setup failures
- Show a manual setup path as the second option for users who need to understand each component
- Include a **Troubleshooting** subsection with the 3-5 most common setup failures and their fixes -- this is the highest-ROI content you can add to a complex setup README
- Include a `make` target or setup script if available: `make setup` that runs all of steps 2-4 automatically

### Library With Breaking Changes Between Major Versions

When users may be on v1.x and the README documents v2.x:

- Pin the version in the installation command: `npm install projectname@2` not `npm install projectname`
- Add a **Migration** section or link to `MIGRATION.md` at the top of the README, above the Table of Contents
- If the v1 README must be preserved, tag the Git commit for v1 and note in the README: "For v1.x documentation, see the v1.x tag in Git history"
- In code examples, avoid showing patterns that were valid in v1 but are deprecated in v2 -- this confuses users who find the examples via search

### Data Science or Research Repository

When the project is primarily about reproducing research results or working with datasets:

- Replace Features with a **What This Repo Contains** section: dataset, model weights, training scripts, evaluation scripts
- Installation must cover the virtual environment setup explicitly: `python -m venv .venv && source .venv/bin/activate`
- Add a **Reproducing Results** section with numbered steps that produce the key output (accuracy number, figure, table) from the paper or analysis
- Include a **Citation** section with BibTeX format if the repository accompanies a paper
- List hardware requirements if training or inference requires GPU memory above 8GB: "Training requires a GPU with >= 24GB VRAM (tested on NVIDIA A100)"
- Add a **Dataset** section: where to download, its license, expected directory structure after download

---

## Example

**Input:** "Write a README for a Python library called `datachain` that lets you build type-safe data transformation pipelines by chaining Python functions together. It has zero dependencies, supports async functions, built-in schema validation using Python type hints, and outputs to dict, JSON, or pandas DataFrame. MIT license. Published on PyPI."

---

**Output:**

```markdown
# datachain

Build type-safe data transformation pipelines by chaining Python functions. 
Zero dependencies, async-native, and validated at runtime using standard type hints.

![CI](https://img.shields.io/github/actions/workflow/status/owner/datachain/ci.yml?branch=main)
![PyPI](https://img.shields.io/pypi/v/datachain)
![Python](https://img.shields.io/pypi/pyversions/datachain)
![License](https://img.shields.io/badge/license-MIT-blue)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Type-safe pipelines:** Each step's output type is validated against the next step's input type at runtime using standard Python type hints -- no schemas to define separately
- **Async-native:** Chain sync and async functions in the same pipeline; datachain handles awaiting transparently
- **Zero dependencies:** No NumPy, Pydantic, or other third-party packages required -- works in any Python 3.10+ environment
- **Flexible output:** Export the final pipeline result as a Python dict, a JSON string, or a pandas DataFrame with one method call

## Installation

### Prerequisites

- Python >= 3.10.0 -- run `python --version` to check
- pip >= 22.0 -- run `pip --version` to check
- pandas >= 1.5.0 (optional -- required only for `.to_dataframe()` output)

### Install

```bash
pip install datachain
```

For DataFrame output support:

```bash
pip install datachain[pandas]
```

### Verify Installation

```bash
python -c "import datachain; print(datachain.__version__)"
```

Expected output:
```
1.4.2
```

## Usage

### Basic Pipeline

Build a pipeline by passing functions to `Chain`. Each function receives the output
of the previous step.

```python
from datachain import Chain

def parse(raw: str) -> dict:
    parts = raw.split(",")
    return {"name": parts[0], "score": int(parts[1])}

def normalize(record: dict) -> dict:
    return {**record, "score": record["score"] / 100.0}

def label(record: dict) -> dict:
    return {**record, "grade": "pass" if record["score"] >= 0.6 else "fail"}

result = Chain(parse).then(normalize).then(label).run("Alice,87")
print(result)
```

Output:
```
{"name": "Alice", "score": 0.87, "grade": "pass"}
```

### Async Pipeline

Sync and async steps can be mixed freely in the same chain.

```python
import asyncio
from datachain import Chain

def parse(raw: str) -> dict:
    return {"user_id": int(raw)}

async def fetch_user(record: dict) -> dict:
    # Simulate an async database lookup
    await asyncio.sleep(0)
    return {**record, "username": "alice", "role": "admin"}

def format_response(record: dict) -> dict:
    return {"id": record["user_id"], "name": record["username"]}

result = asyncio.run(Chain(parse).then(fetch_user).then(format_response).run("42"))
print(result)
```

Output:
```
{"id": 42, "name": "alice"}
```

### Running a Pipeline Over Multiple Inputs

Use `run_many()` to process a list of inputs and collect results.

```python
from datachain import Chain

def score(text: str) -> dict:
    return {"text": text, "length": len(text)}

results = Chain(score).run_many(["hello", "world", "datachain"])
print(results)
```

Output:
```
[
  {"text": "hello",     "length": 5},
  {"text": "world",     "length": 5},
  {"text": "datachain", "length": 9}
]
```

### Exporting to JSON or DataFrame

```python
from datachain import Chain

def process(n: int) -> dict:
    return {"value": n, "squared": n ** 2}

chain = Chain(process)

# Export as JSON string
print(chain.run(4).to_json())
# {"value": 4, "squared": 16}

# Export as pandas DataFrame (requires datachain[pandas])
df = chain.run_many([1, 2, 3, 4, 5]).to_dataframe()
print(df.head())
#    value  squared
# 0      1        1
# 1      2        4
# 2      3        9
# 3      4       16
# 4      5       25
```

## Configuration

`Chain` accepts keyword arguments to control runtime behavior.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validate` | boolean | `True` | Validate type annotations between steps at runtime. Set to `False` in production for a ~15% speed improvement after pipeline is confirmed correct. |
| `strict_types` | boolean | `False` | Raise `TypeError` on any type mismatch instead of attempting coercion. |
| `timeout` | float | `None` | Per-step timeout in seconds. Raises `StepTimeoutError` if any step exceeds this limit. |
| `max_concurrency` | integer | `10` | Maximum number of concurrent async steps when using `run_many()`. |
| `on_error` | string | `"raise"` | Error handling mode: `"raise"` (stop immediately), `"skip"` (log and continue), or `"collect"` (return errors alongside results). |

**Example:**

```python
from datachain import Chain

chain = Chain(
    my_step,
    validate=True,
    strict_types=True,
    timeout=5.0,
    max_concurrency=20,
    on_error="collect",
)
```

## Running Tests

```bash
pip install -e ".[dev]"
pytest tests/ -v
```

To run only unit tests (no async I/O, no pandas):

```bash
pytest tests/unit/ -v
```

Test coverage report:

```bash
pytest tests/ --cov=datachain --cov-report=term-missing
```

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository and clone your fork
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Install development dependencies: `pip install -e ".[dev]"`
4. Make your changes and add or update tests in `tests/`
5. Run the test suite: `pytest tests/ -v` -- all tests must pass
6. Open a pull request against `main` with a description of the change and why it is needed

Branch prefixes: `feat/` for new features, `fix/` for bug fixes, `docs/` for documentation, `chore/` for maintenance.

See [CONTRIBUTING.md](CONTRIBUTING.md) for commit message format, code style (Black + isort), and PR review checklist.

## License

MIT. See [LICENSE](LICENSE) for the full text.
```
