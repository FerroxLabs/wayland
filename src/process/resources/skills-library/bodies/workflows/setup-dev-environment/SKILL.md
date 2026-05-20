---
name: setup-dev-environment
description: |
  Orchestrates the process of setting up a complete local development environment from project initialization through CI pipeline configuration, chaining four software-development skills into a structured onboarding workflow.
  Use when the user needs to set up a development environment for a new project or standardize an existing project's local development setup.
  Do NOT use for production environment configuration, cloud infrastructure provisioning, or IDE-specific customization without a project context.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops beginner-friendly step-by-step guide"
  category: "software-development"
  depends: "python-project-setup git-branching-strategy docker-compose-patterns ci-cd-pipeline-design"
  disclaimer: "none"
  difficulty: "beginner"
---

# Set Up a Development Environment

**Estimated time:** 2-4 hours (depending on download speeds, prior tooling, and project complexity)

This workflow chains four atomic skills into the complete process of setting up a local development environment that is reproducible, containerized, and backed by continuous integration. Each step builds on the prior step's output, moving from a bare project to a fully configured development workflow. The workflow is beginner-friendly -- no prior DevOps experience is assumed.

## When to Use

- User is starting a new software project and needs a reproducible local development setup
- User is joining an existing project and needs to get the development environment running
- User wants to containerize an existing project's local development for consistency across team machines
- User needs to add CI to a project that currently has none
- Do NOT use when: the user only needs to configure a production server, needs IDE-specific setup without a project, or needs to set up a data science notebook environment (use language-specific skills directly)

## Prerequisites

Before starting this workflow, ensure:

1. **Operating system is ready:** You have a development machine running macOS, Linux, or Windows with WSL2 enabled (Docker Desktop requires WSL2 on Windows)
2. **Internet access:** You can download packages, container images, and connect to a Git hosting service (GitHub, GitLab, or Bitbucket)
3. **Admin access on your machine:** You can install software (package managers, Docker, Git) on the development machine
4. **Project type is decided:** You know whether this is a web backend, web frontend, API service, CLI tool, or library -- this determines the language setup in Step 1

## Steps

**Step 1: Initialize the Project** (uses: python-project-setup)

Set up the project directory structure, language runtime, dependency management, and configuration files for local development. This step creates the foundation that all subsequent steps build upon. While this skill is Python-focused, the principles apply to any language -- see Decision Points for alternatives.

- Input: Project type (web app, API, CLI, library), chosen language and framework, target Python version (or equivalent for other languages)
- Output: Project directory with: language runtime configured (pyenv, nvm, or equivalent), virtual environment or package isolation, dependency file (requirements.txt, pyproject.toml, package.json, go.mod), project configuration (linting rules, formatting configuration, editor config), initial directory structure following language conventions
- Key focus: Make the setup reproducible. Every dependency must be pinned to a specific version. The setup process must work on a fresh machine by following documented steps. Include a Makefile, Taskfile, or scripts directory with common commands (install dependencies, run tests, start development server, run linter) so that every developer uses the same commands regardless of their familiarity with the toolchain.
- Verification: The setup is complete when a fresh clone on a new machine can run `make install && make test && make dev` (or equivalent) with zero manual intervention beyond copying the .env file. If any step requires manual configuration, it is not yet reproducible.

**Step 2: Configure Git Branching Strategy** (uses: git-branching-strategy)

Initialize version control and establish the branching, commit, and code review conventions for the project. This step takes the project directory from Step 1 and adds the collaboration layer that enables multiple developers (or future-you) to work on features, fix bugs, and release safely.

- Input: Project directory from Step 1, team size (solo or team), release cadence expectation (continuous deployment, scheduled releases, or ad-hoc)
- Output: Git repository initialized with: initial commit, .gitignore configured for the language and framework, branch protection rules documented, branching strategy document (trunk-based for solo or small teams, gitflow for scheduled releases), commit message conventions, pull request template
- Key focus: For beginners and solo developers, trunk-based development with short-lived feature branches is the recommended strategy. Feature branches should live for hours to days, not weeks. Configure .gitignore thoroughly at this stage -- add patterns for the language, framework, IDE, and OS. A thorough .gitignore prevents accidental commits of secrets, build artifacts, and environment files from day one.

**Step 3: Containerize the Development Environment** (uses: docker-compose-patterns)

Create a Docker Compose configuration that runs the project and its dependencies (database, cache, message queue, or any other service) in containers. This step takes the project from Step 1 and wraps it in a container environment that is identical on every developer's machine. Team members no longer need to install the database engine, cache server, or other services locally.

- Input: Project from Step 1, list of service dependencies (database type, cache, queue, external services), development workflow requirements (hot reloading, debug port access)
- Output: Docker Compose configuration with: application container (with hot-reload for code changes), database container (with persistent volume for data between restarts), any additional service containers, shared network configuration, environment variable management (.env.example file with required variables documented), health checks for each service
- Key focus: The development container must support hot-reloading -- code changes on the host machine appear instantly in the running container without rebuilding. Mount the source code directory as a volume. Use a multi-stage Dockerfile that separates development dependencies (debugging tools, hot-reload watchers) from production dependencies. Include an .env.example file that documents every environment variable the application needs, with safe default values for local development.

**Step 4: Configure CI Pipeline** (uses: ci-cd-pipeline-design)

Set up a continuous integration pipeline that runs automatically on every push and pull request. This step takes the test commands from Step 1, the branching strategy from Step 2, and the containerized environment from Step 3, and automates the quality checks that protect the main branch from broken code.

- Input: Test commands from Step 1, branching strategy from Step 2, Docker configuration from Step 3, CI provider choice (GitHub Actions, GitLab CI, or equivalent)
- Output: CI pipeline configuration file with: dependency installation step, linting and formatting check step, test execution step, build verification step (if applicable), status badge for the repository README
- Key focus: The CI pipeline must mirror the local development commands exactly. If `make test` runs tests locally, the CI pipeline runs `make test` too. This eliminates the "tests pass locally but fail in CI" problem. The pipeline should complete in under 10 minutes for a new project -- if it takes longer, something is misconfigured (usually missing dependency caching). Add a status badge to the README so that build health is visible at a glance.
- Verification: Push a commit with a deliberately failing test and verify the CI pipeline catches it. Then fix the test and verify the pipeline passes. This confirms the pipeline is actually running the tests, not just reporting success without executing them.
- Optimization: Cache dependency installation (pip cache, npm cache, Docker layer cache) to reduce pipeline execution time. A well-cached pipeline should add under 30 seconds of overhead compared to a local test run.

## Decision Points

- **At Step 1:** Choose the language setup skill based on your project:
  - **Python project:** Use python-project-setup as written
  - **TypeScript or JavaScript project:** Substitute with typescript-project-setup -- the workflow structure remains identical, but Step 1 uses nvm for runtime management, npm or yarn for dependencies, and tsconfig.json for configuration
  - **Other languages:** Apply the principles from Step 1 (runtime version management, dependency pinning, directory structure conventions) using your language's standard tooling

- **At Step 2:** If you are a **solo developer** on a personal project, use trunk-based development: commit directly to main with descriptive commit messages. Skip branch protection rules (they require a second reviewer). If you are on a **team of 2 or more**, configure branch protection on the main branch requiring at least one approval before merge.

- **At Step 3:** If the project has **no service dependencies** (a pure library, CLI tool, or static site generator), skip the Docker Compose portion of Step 3. Use Docker only for the CI pipeline (Step 4) to ensure reproducible test environments. If the project needs **only a database** (no cache, no queue), a single docker-compose.yml with just the database container is sufficient -- do not add complexity for services you do not yet need.

- **At Step 4:** Choose CI provider based on your hosting:
  - **GitHub repository:** Use GitHub Actions (free for public repos, 2,000 minutes per month for private repos on free tier)
  - **GitLab repository:** Use GitLab CI (integrated, 400 minutes per month on free tier)
  - **Bitbucket repository:** Use Bitbucket Pipelines (50 minutes per month on free tier)
  - If your repository host's free CI tier is insufficient, consider a self-hosted runner before paying for premium tiers

## Failure Handling

- **Step 1 dependency installation fails:** The most common cause is a version mismatch between the language runtime and a dependency. Verify the runtime version matches what the project requires (check .python-version, .nvmrc, or equivalent). If a specific dependency fails to install, check if it requires system-level libraries (common for Python packages with C extensions like psycopg2, which needs libpq-dev). Install the system dependency, then retry.

- **Step 2 Git initialization conflicts with existing history:** If the project directory already has a Git history (cloned from a template or forked), do not reinitialize. Instead, verify the existing .gitignore is comprehensive and add the branching strategy documentation to the existing repository. If the existing history contains files that should have been gitignored (node_modules, .env files, compiled binaries), remove them from tracking with git rm --cached before adding the .gitignore rules.

- **Step 3 Docker networking issues:** If containers cannot communicate (application cannot reach database), verify they are on the same Docker network (Docker Compose creates a default network for all services in the same file). The most common error is using localhost in the application's database connection string -- inside Docker, the database hostname is the service name defined in docker-compose.yml (e.g., db, postgres, mysql), not localhost. If port conflicts occur (port 5432 already in use), either stop the local database service or change the host port mapping in docker-compose.yml.

- **Step 4 CI authentication failures:** If the CI pipeline cannot pull Docker images, install private dependencies, or push to the repository, the issue is missing credentials or permissions. For GitHub Actions: verify the GITHUB_TOKEN has sufficient permissions in repository Settings under Actions, General, Workflow permissions. For private npm packages or Docker registries: add the access token as a repository secret and reference it in the CI configuration. Never hardcode credentials in the CI configuration file.

- **User wants to change the technology stack after setup:** If the change is within the same language ecosystem (switching from Flask to FastAPI, or from Express to Fastify), modify Step 1's project configuration and update Step 3's Docker configuration -- Steps 2 and 4 remain unchanged. If the change is a different language entirely, restart the workflow from Step 1. Steps 2, 3, and 4 will need to be updated but the structural approach remains the same.

## Edge Cases

- **Windows without WSL2:** If the developer machine runs Windows without WSL2 enabled, Docker Desktop will not work with Linux containers. Options: (1) Enable WSL2 (recommended -- requires Windows 10 version 2004 or later), (2) Use Podman Desktop as a Docker alternative, (3) Skip Step 3 and install services natively (lose reproducibility). The workflow strongly recommends WSL2 for Windows developers.

- **Monorepo with multiple services:** If the project is a monorepo containing multiple services (frontend, backend API, background worker), each service needs its own entry in docker-compose.yml (Step 3) and its own CI job (Step 4). Step 1 may need to be repeated for each service with its own language and dependency setup. Use a single .gitignore at the repository root with patterns for all languages.

- **Existing project with no tests:** If Step 1 is applied to an existing project that has no test suite, the CI pipeline in Step 4 will have nothing to run in the test step. Add a placeholder test file in Step 1 that verifies the application can import successfully (a smoke test). This ensures the CI pipeline structure is in place when tests are added later.

- **Restricted corporate network:** If the development machine is behind a corporate proxy or firewall that blocks Docker Hub, npm registry, or PyPI, configure proxy settings for each tool in Step 1 (pip, npm, Docker) before attempting dependency installation. Some corporate environments require a private registry mirror -- check with IT before attempting public registry access.

- **Apple Silicon (ARM64) compatibility:** If developers use Apple Silicon Macs while CI runs on x86_64 Linux, some Docker images may not have ARM64 variants. In Step 3, specify platform: linux/amd64 for services that lack ARM64 images, and accept the performance cost of emulation during local development. Test on both architectures if the team is mixed.

- **Project with multiple programming languages:** If the project uses multiple languages (e.g., Python backend and TypeScript frontend), Step 1 must be performed for each language with its own runtime version management and dependency file. Step 3 becomes especially valuable -- Docker Compose unifies all language runtimes into a single `docker compose up` command, eliminating the need for each developer to install every language runtime locally. The CI pipeline in Step 4 should use matrix builds to test each language component independently.

- **Adding development environment to a project with existing contributors:** If team members already have local setups that differ from each other, introduce Docker Compose (Step 3) as optional first. Document both approaches in the README: native setup and containerized setup. Once all team members have validated the containerized setup produces identical behavior, deprecate the native setup instructions. Forcing a switch without a migration period causes friction and lost productivity.

- **Project that requires GPU access for development:** If the project involves machine learning, video processing, or GPU-accelerated computation, the standard Docker Compose setup needs NVIDIA Container Toolkit (Linux) or GPU passthrough (Windows WSL2). Not all developers will have GPUs. Design the development environment with a CPU fallback mode that uses smaller models or test datasets, reserving GPU testing for CI runners with GPU instances or a shared development server.

- **Secrets management in local development:** Never commit real API keys, database passwords, or service credentials to the repository. Step 3's .env.example file documents which secrets are needed with placeholder values. For teams, consider using a secrets manager (1Password CLI, Doppler, or AWS Parameter Store) with a local sync command that populates the .env file from the shared secret store. This prevents developers from sharing secrets through insecure channels like Slack messages.

- **Project with large binary assets (ML models, media files):** If the project includes large files that should not be stored in Git (trained models, video assets, dataset files), configure Git LFS in Step 2 for tracked file types. In Step 3, mount the large file directory as a Docker volume rather than copying into the image to avoid bloating the container image size. The CI pipeline in Step 4 should cache these assets separately from code dependencies.

- **Slow dependency installation blocking development:** If dependency installation takes more than 5 minutes (common in large Python or Node.js projects with native extensions), add a dependency caching layer. In Step 3, use a named Docker volume for the virtual environment or node_modules so that `docker compose down` and `docker compose up` does not reinstall all dependencies. In Step 4, use the CI platform's caching mechanism with a hash of the dependency lock file as the cache key, so cache invalidation only happens when dependencies actually change.

- **Development environment for a microservices architecture:** If the project consists of multiple services that communicate over the network, Step 3's Docker Compose file should define all services with a shared network and service discovery via container names. Use profiles (docker compose --profile backend) to allow developers to run only the services they are actively developing, with the rest running as pre-built images from the container registry. This reduces local resource usage while maintaining realistic inter-service communication.

- **Project with database seed data for development:** If the application requires realistic data to be useful during development (product catalog, user accounts, sample transactions), create a seed script in Step 1 that populates the database with deterministic test data. In Step 3, add a Docker Compose service or startup hook that runs the seed script when the database container starts for the first time. Use a marker (seed_applied table or file) to prevent re-seeding on subsequent container restarts. Include enough data to exercise all application features -- a single user with zero records is not a useful development environment.

- **Onboarding a non-technical team member:** If designers, product managers, or QA testers need to run the application locally, create a simplified onboarding script that wraps Steps 1-3 into a single command (make setup or a dedicated setup script). The script should check prerequisites (Docker installed, Git configured), clone the repository, copy .env.example, and run docker compose up. Print a clear success message with the URL to access the application. Include a troubleshooting section in the README covering the 5 most common setup failures.

- **Development environment with background job processing:** If the application includes background workers (email sending, report generation, queue consumers), Step 3's Docker Compose configuration should include a separate worker service that shares the application code but runs a different entrypoint command (e.g., celery worker, sidekiq, bull worker). Use the same image as the application service with an overridden command. This ensures the worker runs the same code version as the API during development. Add a queue management UI container (Flower for Celery, Bull Board for Bull) to monitor job processing during development without needing CLI access to the queue.

- **Keeping the development environment documentation current:** After completing all four steps, add a "Development Setup" section to the README that documents the exact commands a new developer runs, the expected output at each step, and common troubleshooting steps. Treat this documentation as code: update it whenever the setup process changes. A stale README that describes a setup process from six months ago is worse than no README -- it builds false confidence and wastes debugging time when the documented steps fail.

## Expected Outcome

When this workflow is complete, the user will have:

1. A project directory with language runtime pinned, dependencies locked to specific versions, and a standardized directory structure following language conventions
2. A Makefile or equivalent with common commands (install, test, dev, lint) that every developer uses identically regardless of their familiarity with the toolchain
3. A Git repository with comprehensive .gitignore, branching strategy documented, commit conventions established, and pull request template configured
4. A Docker Compose configuration that runs the application and all service dependencies (database, cache, queue) in containers with hot-reload for code changes, eliminating "works on my machine" discrepancies
5. A CI pipeline that mirrors local development commands exactly, running lint, format check, and tests on every push, with a status badge on the README showing build health at a glance
6. An .env.example file documenting every environment variable the application needs, so new team members can configure their environment without guessing
7. A setup experience where a new developer clones the repository, copies .env.example, runs docker compose up, and has a fully working development environment within 15 minutes
8. Reproducibility across all operating systems (macOS, Linux, Windows with WSL2) through containerization

## Output Format

The workflow produces a project directory with this structure at completion:

```
project-root/
  src/                       # Step 1: Application source code
  tests/                     # Step 1: Test directory with initial smoke test
  .python-version            # Step 1: Runtime version pinning (or .nvmrc)
  pyproject.toml             # Step 1: Dependencies and tool configuration
  Makefile                   # Step 1: Common commands (install, test, dev, lint)
  .gitignore                 # Step 2: Language, framework, IDE, OS patterns
  .github/
    PULL_REQUEST_TEMPLATE.md # Step 2: PR template with checklist
    workflows/
      ci.yml                 # Step 4: CI pipeline configuration
  CONTRIBUTING.md            # Step 2: Branching strategy and commit conventions
  Dockerfile                 # Step 3: Multi-stage build for dev and production
  docker-compose.yml         # Step 3: Application + service dependencies
  .env.example               # Step 3: Required environment variables documented
  README.md                  # Updated at each step with setup instructions
```

## Example

**Scenario:** "Set up a development environment for a Python FastAPI backend with PostgreSQL database for a team of three developers."

**Input:** Project type: REST API backend. Language: Python 3.12 with FastAPI. Database: PostgreSQL 16. Team size: 3 developers (one on macOS, one on Linux, one on Windows with WSL2). CI provider: GitHub Actions. No existing code -- greenfield project.

**Output:** Fully configured development environment with containerized services and automated CI pipeline.

**Step 1 (python-project-setup):**
Initialize the project with pyenv setting Python 3.12, create a virtual environment, install FastAPI, uvicorn, SQLAlchemy, alembic, and pytest as dependencies pinned in pyproject.toml. Set up directory structure: src/app/ for application code, src/app/api/ for route handlers, src/app/models/ for SQLAlchemy models, tests/ for pytest tests. Configure ruff for linting and formatting. Create a Makefile with targets: install (editable package installation via pyproject.toml), dev (uvicorn with reload on port 8000), test (pytest with verbose output), lint (ruff check), format (ruff format). Add a smoke test in tests/test_app.py that verifies the FastAPI app can start and respond to a health check.

**Step 2 (git-branching-strategy):**
Initialize Git repository with an initial commit containing the project skeleton. Configure .gitignore for Python (.venv, __pycache__, .pytest_cache, .env, .coverage, dist, build, *.egg-info) and IDE files (.vscode, .idea, *.swp). Choose trunk-based development with short-lived feature branches. Create a pull request template that requires: description of change, test instructions, and link to related issue. Document the branching strategy and commit conventions in CONTRIBUTING.md. Commit convention: conventional commits (feat:, fix:, chore:, docs:, test:).

**Step 3 (docker-compose-patterns):**
Create docker-compose.yml with two services: app (Python container with source code mounted as volume, uvicorn with hot-reload, exposed on port 8000, depends_on db with health check condition) and db (PostgreSQL 16 with persistent volume named pgdata, exposed on port 5432, health check using pg_isready). Create .env.example with DATABASE_URL=postgresql://user:password@db:5432/appdb, SECRET_KEY=change-me-in-production, DEBUG=true. Create multi-stage Dockerfile: development stage installs all dependencies including dev tools, production stage installs only runtime dependencies. Application connects to the database using the service name "db" as hostname.

**Step 4 (ci-cd-pipeline-design):**
Create .github/workflows/ci.yml with: checkout code, set up Python 3.12, install dependencies from pyproject.toml using pip, run ruff check --output-format=github for linting (annotations on PR), run ruff format --check for formatting verification, start PostgreSQL service container (postgres:16, health check, mapped credentials), run DATABASE_URL=postgresql://... pytest --verbose for integration tests. Cache pip dependencies using actions/cache with hash of pyproject.toml as key. Add build status badge to README.md. Pipeline completes in under 4 minutes.

**Result:** A new team member clones the repository, copies .env.example to .env, runs docker compose up, and has a running FastAPI server connected to PostgreSQL within 10 minutes. Every push triggers CI that catches linting issues, formatting inconsistencies, and test failures before code reaches the main branch. All three developers (macOS, Linux, Windows WSL2) have identical development environments.
