---
name: nodejs-project-setup
description: |
  Guides expert-level Node.js project initialization: ESM vs CJS module system decision, package.json configuration, Node.js version management, engine locking, and production deployment configuration.
  Use when the user asks about Node.js project setup, ESM vs CommonJS, package.json configuration, Node.js version management, engine field, exports field.
  Do NOT use when the user asks about TypeScript setup (use `typescript-project-setup`), JavaScript idioms (use `javascript-idioms`), Node.js async patterns (use `nodejs-async-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "javascript backend template"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Node.js Project Setup

## When to Use

**Use this skill when the user:**
- Is initializing a new Node.js project from scratch and needs guidance on the full configuration stack
- Is deciding between ESM (ES Modules) and CommonJS and needs a concrete recommendation based on their context
- Needs to configure the `package.json` `exports` field, `main`, `module`, or `type` fields correctly
- Wants to lock Node.js versions via `.nvmrc`, `.node-version`, or the `engines` field in `package.json`
- Is setting up a Node.js library for npm publication and needs proper entry point configuration
- Is configuring a Node.js application for production deployment (Docker, serverless, PaaS) and needs engine locking, start scripts, and health check patterns
- Asks about `packageManager` field, Corepack, or enforcing a specific package manager version on a team

**Do NOT use this skill when the user:**
- Needs TypeScript configuration, `tsconfig.json` tuning, or declaration file generation -- use `typescript-project-setup`
- Asks about JavaScript language patterns like closures, prototypes, or async/await -- use `javascript-idioms`
- Needs help with async concurrency patterns, event loop understanding, or Promise chains -- use `nodejs-async-patterns`
- Asks about monorepo workspace tooling in depth (Turborepo, Nx, Lerna) -- use a dedicated monorepo skill
- Needs a full CI/CD pipeline design beyond basic npm scripts -- use a CI/CD configuration skill
- Is asking about Deno or Bun as a runtime -- those have meaningfully different module and config systems

---

## Process

### 1. Gather Project Context Before Generating Any Configuration

Establish these facts before writing a single line of configuration. Wrong decisions here cascade into painful migrations later.

- **Project type:** Is this a library (published to npm), an application (deployed to a server or container), or a CLI tool? Libraries require dual-format output consideration and a precise `exports` map. Applications only need to satisfy their own runtime.
- **Deployment target:** Cloud Run, AWS Lambda, Fly.io, a raw VPS, or a Docker container each have different Node.js version availability, cold-start constraints, and filesystem assumptions. Lambda's managed runtime pins you to specific LTS versions.
- **Team size and experience:** Solo projects can use bleeding-edge tooling. A team of 5+ needs enforced consistency via Corepack, `engines` pinning, and pre-commit hooks.
- **Minimum Node.js version requirement:** If integrating with existing infrastructure, you may be constrained. If greenfield, target the current LTS (Node.js 20 as of 2024, Node.js 22 entering LTS in late 2024).
- **Is there an existing codebase?** If yes, determine its `type` field setting and whether changing it (from CJS to ESM) is feasible without a flag day migration.

---

### 2. Make the ESM vs CommonJS Decision Explicitly

This is the most consequential choice and the one most often made by accident. Apply this decision framework:

- **Choose ESM (`"type": "module"` in `package.json`) when:**
  - Starting a new project with no legacy constraints
  - All key dependencies support ESM (check with `node --input-type=module` or inspect their `exports` map)
  - The project is a library and you want to ship a single ESM-only package (acceptable since Node.js 12.17+)
  - Using top-level `await`, named exports, or dynamic `import()` heavily
  - Targeting modern runtimes only (Node.js 18+)

- **Choose CommonJS (no `"type"` field, or `"type": "commonjs"`) when:**
  - Integrating with a large body of existing CJS code that uses `require()` extensively
  - Key dependencies are CJS-only and do not have an ESM export condition (check their `package.json` `exports` field for the `"import"` condition)
  - Deploying to environments where the Node.js version is below 12.17
  - The project is a library consumed by a mixed CJS/ESM ecosystem and you cannot provide a dual build

- **Choose a dual-format library build (CJS + ESM output) when:**
  - Publishing a library to npm that must support consumers on both module systems
  - Using a build tool like `tsup`, `esbuild`, or `rollup` to emit both `.mjs`/`.cjs` artifacts
  - Setting up separate `exports` conditions for `"import"` and `"require"`
  - NOTE: Do NOT attempt to maintain dual format by hand -- always use a build tool

- **Key interop rules to communicate:**
  - ESM can import CJS via `import` (Node.js will wrap the CJS module), but CJS cannot `require()` an ESM module -- this is a hard error
  - `.mjs` extension forces ESM; `.cjs` extension forces CJS, regardless of the `"type"` field
  - `__dirname` and `__filename` do not exist in ESM -- use `import.meta.url` with `new URL('.', import.meta.url).pathname` or the `fileURLToPath` helper from `node:url`
  - Dynamic `import()` works in both module systems and is the bridge from CJS to ESM modules

---

### 3. Configure `package.json` Fields in Correct Order

Build the `package.json` field by field with precise semantics. Do not omit fields that affect resolution or publication.

- **`name`:** Use scoped names (`@scope/package`) for organizational packages or to avoid naming conflicts. All lowercase, hyphen-separated. Max 214 characters.
- **`version`:** Use semver. Start at `0.1.0` for unreleased packages, `1.0.0` when you commit to a stable API. Use `0.x.y` range while the API is volatile.
- **`type`:** Set explicitly to `"module"` or `"commonjs"`. Never rely on the default (CJS) as a silent assumption.
- **`main`:** The CJS fallback entry point. Required for Node.js versions below 12. If ESM-only, still set it to point to your ESM entry for older tooling that ignores `exports`.
- **`exports`:** The modern entry point map. Takes precedence over `main` in Node.js 12+. This is required for libraries. See the Output Format section for the exact structure.
- **`files`:** Whitelist what ships in the npm tarball. Always include your `dist/` or `src/` directory. Always exclude `node_modules`, test files, and local config. The `.npmignore` approach is error-prone -- prefer `files`.
- **`engines`:** Declare the minimum Node.js and npm/pnpm/yarn versions. This is advisory by default but can be made mandatory with `engine-strict=true` in `.npmrc`.
- **`packageManager`:** Use this field with Corepack to enforce the exact package manager and version. Example: `"packageManager": "pnpm@9.1.0"`. Run `corepack enable` once per machine to activate enforcement.
- **`scripts`:** Keep script names consistent across projects. Use `start` for production server, `dev` for development with watch mode, `build` for compilation, `test` for test runner, `lint` for linter, `format` for formatter.
- **`dependencies` vs `devDependencies`:** Production code dependencies go in `dependencies`. Build tools, test runners, linters, and type checkers go in `devDependencies`. For libraries, be conservative with `dependencies` -- every entry becomes a peer dependency concern for consumers.

---

### 4. Set Up Node.js Version Management

Version drift between local development and production is a common source of subtle bugs. Layer multiple enforcement mechanisms.

- **`.nvmrc` file:** A single line containing the Node.js version string (e.g., `20.14.0` or `lts/iron`). Used by `nvm`, `fnm`, and `mise`. Place at the project root. Commit it to source control.
- **`.node-version` file:** Same format as `.nvmrc`. Recognized by `fnm`, `volta`, and `mise`. Some teams maintain both; others pick one. Prefer `.nvmrc` for broadest tooling compatibility.
- **`engines` field in `package.json`:** Declare `"node": ">=20.0.0"` (or a tighter range like `">=20.14.0 <21.0.0"` for applications). This causes npm/pnpm/yarn to warn (or error with strict mode) when the installed version does not match.
- **`.npmrc` with `engine-strict=true`:** Upgrades the `engines` field from a warning to a hard error during `npm install`. For team projects, add `engine-strict=true` to the project-level `.npmrc` and commit it.
- **Volta (`volta` field in `package.json`):** Volta pins Node.js and package manager versions at the per-project level and auto-switches on directory entry without manual `nvm use`. Add: `"volta": { "node": "20.14.0", "pnpm": "9.1.0" }`.
- **Docker base image pinning:** In production containers, pin the exact image digest or tag: `FROM node:20.14.0-alpine3.20`. Never use `node:latest` or `node:lts` in production Dockerfiles -- these are mutable tags.
- **CI version matrix:** In GitHub Actions or similar, test against the minimum declared engine version AND the current LTS using a matrix strategy. This catches regressions from version-specific behavior.

---

### 5. Configure the `exports` Map for Libraries

The `exports` field is the single most important and most misunderstood field for library authors. Get this right.

- **Condition order matters:** Node.js evaluates conditions in the order they appear in the object. Place `"types"` first (for TypeScript consumers), then `"import"`, then `"require"`, then `"default"`.
- **Subpath exports:** Use `"."` for the main export and named subpaths like `"./utils"` for secondary entry points. This replaces deep require paths like `require('mylib/dist/utils')`.
- **Export blocking:** Any path NOT listed in `exports` is blocked from direct access in Node.js 12+ strict mode. Use this intentionally to prevent consumers from importing internal modules.
- **Wildcard patterns:** Use `"./features/*": "./dist/features/*.js"` to expose an entire directory while still enforcing the `.js` extension.
- **The `package.json` self-referencing export:** Always include `"./package.json": "./package.json"` so consumers can read your package metadata.
- **Dual-package hazard:** When shipping both CJS and ESM, there is a risk of the package being instantiated twice (once as CJS, once as ESM) in the same process, breaking singleton patterns. Mitigate with a wrapper-only CJS build that re-exports the ESM implementation, or use the `exports` map carefully to prevent dual loading.

---

### 6. Configure Development Tooling and Scripts

Set up the minimum viable toolchain for a productive Node.js development experience.

- **Watch mode (applications):** Use `node --watch src/index.js` (available since Node.js 18.11.0) for zero-dependency file watching. For more complex reload logic, `nodemon` remains the practical standard: `nodemon --ext js,json,mjs src/index.js`.
- **Environment variables:** Use `node --env-file=.env` (available since Node.js 20.6.0) to load `.env` files natively without `dotenv`. For Node.js below 20.6, `dotenv` is the standard. Always add `.env` to `.gitignore`. Commit a `.env.example` with all keys but no values.
- **Linting:** ESLint with `@eslint/js` and `eslint-plugin-n` (the Node.js plugin). Configure with the flat config format (`eslint.config.js`) for Node.js 18+ projects. Enable `plugin:n/recommended` to catch Node.js-specific mistakes like using unavailable APIs.
- **Formatting:** Prettier for zero-config opinionated formatting. The key Prettier setting for Node.js projects: `"trailingComma": "all"` (aids git diffs), `"singleQuote": true` (common JS convention), `"printWidth": 100`.
- **Pre-commit hooks:** `simple-git-hooks` (lightweight, 0 dependencies) or `husky` (more features). Run `eslint` and `prettier --check` on staged files via `lint-staged`. This prevents bad code from entering the repository.
- **Testing:** Use the built-in Node.js test runner (`node:test` module, stable since Node.js 20) for new projects to eliminate dependencies. For more features (coverage, snapshot testing, mocking), `vitest` is the modern choice for ESM-native testing.

---

### 7. Configure Production Readiness

Production configuration is distinct from development setup and must be explicit.

- **`NODE_ENV=production`:** Set this environment variable in production to enable production optimizations in Express, Next.js, and many other frameworks. Many packages short-circuit development checks, heap profiling, and detailed error messages when this is set.
- **Process manager:** For bare VPS or container deployments, use `pm2` in cluster mode for multi-core utilization: `pm2 start src/index.js -i max --name app`. For containerized deployments (Docker, Kubernetes), run Node.js directly as PID 1 with a `SIGTERM` handler -- do not wrap in a process manager inside containers.
- **Graceful shutdown:** Register `process.on('SIGTERM', ...)` and `process.on('SIGINT', ...)` handlers. Close HTTP servers with `server.close()`, drain database connection pools, and flush any buffers before calling `process.exit(0)`. Give the process 10-30 seconds maximum.
- **`--max-old-space-size`:** Set heap limits explicitly in production. A Node.js process defaults to ~1.5GB on 64-bit systems. In containers, set this to 75-80% of the container's memory limit: `node --max-old-space-size=3072 src/index.js` for a 4GB container.
- **Structured logging:** Replace `console.log` with a structured logger. `pino` is the standard for high-throughput production Node.js -- it serializes JSON at near-zero overhead. Never use `winston` for new projects (it is slower and more complex without benefit).
- **Health check endpoint:** Every deployed application must expose `GET /health` returning `200 OK` with response body `{"status": "ok", "uptime": process.uptime()}`. Orchestrators (Kubernetes, ECS) use this for liveness probes.

---

## Output Format

When generating a Node.js project setup, produce ALL of the following artifacts in order.

### Project Structure

```
my-app/
├── .nvmrc                    # Node.js version pin (e.g., "20.14.0")
├── .npmrc                    # npm/pnpm configuration (engine-strict=true)
├── .env.example              # Environment variable template
├── .gitignore                # Node.js-specific ignore patterns
├── eslint.config.js          # ESLint flat config
├── package.json              # Full configuration (see below)
├── src/
│   └── index.js              # Application entry point
└── test/
    └── index.test.js         # Initial smoke test
```

### `package.json` -- Application Template

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "description": "Short description of the application",
  "type": "module",
  "engines": {
    "node": ">=20.14.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.1.0",
  "volta": {
    "node": "20.14.0",
    "pnpm": "9.1.0"
  },
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch --env-file=.env src/index.js",
    "test": "node --test test/**/*.test.js",
    "test:coverage": "node --test --experimental-test-coverage test/**/*.test.js",
    "lint": "eslint src test",
    "lint:fix": "eslint src test --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {},
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-n": "^17.0.0",
    "prettier": "^3.0.0",
    "lint-staged": "^15.0.0",
    "simple-git-hooks": "^2.0.0"
  },
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged"
  },
  "lint-staged": {
    "*.{js,mjs,cjs}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yaml,yml}": ["prettier --write"]
  }
}
```

### `package.json` -- Library Template (Dual-Format Build)

```json
{
  "name": "@scope/my-lib",
  "version": "1.0.0",
  "description": "Short description of the library",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./utils": {
      "import": {
        "types": "./dist/utils.d.ts",
        "default": "./dist/utils.js"
      },
      "require": {
        "types": "./dist/utils.d.cts",
        "default": "./dist/utils.cjs"
      }
    },
    "./package.json": "./package.json"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean",
    "prepublishOnly": "pnpm build && pnpm test",
    "test": "node --test test/**/*.test.js",
    "lint": "eslint src test"
  },
  "devDependencies": {
    "tsup": "^8.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### `.npmrc`

```ini
engine-strict=true
save-exact=true
```

### `.nvmrc`

```
20.14.0
```

### `.gitignore`

```gitignore
# Dependencies
node_modules/

# Build output
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage
coverage/
.nyc_output/

# Editor directories
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln

# OS
.DS_Store
Thumbs.db
```

### `eslint.config.js` (Flat Config, ESLint 9+)

```js
import js from '@eslint/js'
import pluginN from 'eslint-plugin-n'

export default [
  js.configs.recommended,
  pluginN.configs['flat/recommended'],
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'n/no-missing-import': 'error',
      'n/no-unpublished-import': 'error',
      'n/prefer-global/buffer': ['error', 'always'],
      'n/prefer-global/process': ['error', 'always'],
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
  },
]
```

### `src/index.js` -- Application Entry Point Shell

```js
import { createServer } from 'node:http'

const PORT = process.env.PORT ?? 3000
const HOST = process.env.HOST ?? '0.0.0.0'

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
    return
  }

  res.writeHead(404)
  res.end()
})

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`)
})

// Graceful shutdown
const shutdown = (signal) => {
  console.warn(`Received ${signal}, shutting down gracefully`)
  server.close(() => {
    console.warn('HTTP server closed')
    process.exit(0)
  })

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
    process.exit(1)
  }, 30_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
```

### Verification Checklist

| Check | Command | Expected Result |
|---|---|---|
| Node.js version | `node --version` | Matches `.nvmrc` |
| Package manager | `pnpm --version` | Matches `packageManager` field |
| Install succeeds | `pnpm install` | No engine warnings or errors |
| Lint passes | `pnpm lint` | Zero violations |
| Format check | `pnpm format:check` | All files formatted |
| Tests pass | `pnpm test` | All tests green |
| Server starts | `pnpm start` | Prints listen message |
| Health endpoint | `curl localhost:3000/health` | `{"status":"ok","uptime":...}` |

---

## Rules

1. **Never omit the `"type"` field.** Its absence defaults to `"commonjs"`, which is an invisible assumption that breaks when someone later adds an `.mjs` file or a dependency that is ESM-only. Always declare `"type": "module"` or `"type": "commonjs"` explicitly so the intent is documented.

2. **Never use bare `node:` builtins without the `node:` prefix in new ESM code.** Always write `import { readFile } from 'node:fs/promises'` instead of `import { readFile } from 'fs/promises'`. The `node:` prefix prevents ambiguity with npm packages of the same name, is the documented modern practice, and is required for certain built-ins in some runtimes (Deno, Bun) for compatibility.

3. **Never use `"exports"` subpath patterns that expose internal implementation paths.** Once you list a path in `exports`, it becomes a public API surface. Unlisted paths are blocked. Use this as a feature -- intentionally exclude `src/internal/**` to prevent consumers from depending on internals.

4. **Always run `npm pack --dry-run` (or `pnpm pack --dry-run`) before publishing a library** to verify that the `files` field is correct and the tarball contains exactly what you intend. Shipping `node_modules`, test fixtures, or `.env` files in a published package is a security and size issue.

5. **Never use `*` (wildcard) version ranges for dependencies in production applications.** Use `save-exact=true` in `.npmrc` or pin versions manually. Floating ranges (`^`, `~`) are acceptable in libraries (to allow consumers flexibility) but not in applications where reproducibility is critical.

6. **Never mix CJS `require()` and ESM `import` syntax in the same file.** In a `"type": "module"` project, `require` is not defined at the top level. In a CJS project, top-level `await` and static `import` are syntax errors. If you need to bridge module systems, use dynamic `import()` (works in CJS) or a conditional build.

7. **Always set `"private": true` in `package.json` for applications that should never be published to npm.** This prevents an accidental `npm publish` from leaking internal application code. Libraries should NOT set this field.

8. **Always declare `"sideEffects": false` in library `package.json` if the library has no side effects** (does not patch globals, register event listeners, or modify module state on import). This enables tree-shaking in bundlers like webpack, esbuild, and Rollup to eliminate dead code.

9. **Never hard-code `process.env.NODE_ENV` checks without a fallback.** Always use `process.env.NODE_ENV ?? 'development'` to avoid crashes in environments where this variable is not set. Many deployment platforms do not set `NODE_ENV` automatically.

10. **Always handle uncaught exceptions and unhandled rejections in production applications.** Register both `process.on('uncaughtException', handler)` and `process.on('unhandledRejection', handler)` to log the error with full stack trace before exiting. The default behavior (print and crash for exceptions, warn and continue for rejections in older Node.js) is not acceptable in production. In Node.js 15+, unhandled rejections crash the process by default -- which is the right behavior, but you should still log before exit.

---

## Edge Cases

### ESM-Only Dependency in a CJS Project

When a key dependency drops CJS support (this happened with `chalk` v5, `node-fetch` v3, `nanoid` v4, and many others), a CJS project cannot `require()` it. Options in order of preference:

1. Pin to the last CJS-compatible version (e.g., `chalk@4`, `node-fetch@2`) if migration is not feasible right now.
2. Migrate the entire project to ESM -- often the cleanest long-term solution.
3. Use a dynamic `import()` to load the ESM module from within CJS code. This forces the call site to be async and propagates `await` up the call chain.
4. Use an alternative package that still ships CJS (`kleur` instead of `chalk`, native `fetch` instead of `node-fetch` on Node.js 18+).

Do NOT advise using `createRequire` to load ESM -- it does not work and will produce a clear error.

---

### Migrating an Existing CJS Codebase to ESM

This is a multi-step process that cannot be done atomically in large codebases. Guide the user through this sequence:

1. Audit all `require()` calls to identify dynamic requires (`require(someVariable)`) -- these have no ESM equivalent and must be replaced with dynamic `import()`.
2. Audit all uses of `__dirname` and `__filename` -- replace with the `fileURLToPath(new URL('.', import.meta.url))` pattern.
3. Add file extensions to all relative imports. ESM requires explicit extensions (`./utils.js`, not `./utils`). This is the most tedious step in large codebases.
4. Change `module.exports = ...` to `export default ...` or named exports.
5. Change all `require()` calls to `import` statements.
6. Set `"type": "module"` in `package.json`.
7. Run tests. Address any remaining interop issues.

Never attempt steps 4-7 before 1-3 are complete. Use a codemod tool like `@es-migrations/named-exports` or a custom AST transform with `jscodeshift` for large codebases -- manual edits across hundreds of files will introduce inconsistencies.

---

### Lambda and Serverless Constraints

AWS Lambda's managed Node.js runtimes lag behind the current LTS. As of 2024, Lambda supports Node.js 18.x and 20.x as managed runtimes. Key constraints:

- Pin `"engines"` to exactly the Lambda runtime version (`"node": "=20.9.0"` for Lambda's 20.x runtime).
- ESM is supported on Lambda with the `"type": "module"` approach, but cold start times are measurably higher for ESM bundles due to module graph resolution. For latency-sensitive functions, benchmark both and consider bundling with `esbuild` into a single CJS file to eliminate this overhead.
- The `--env-file` flag is not useful on Lambda -- use `process.env` directly, populated by Lambda environment variable configuration.
- `SIGTERM` is sent to Lambda functions 300ms before the execution context freezes -- your shutdown handler has 300ms, not 30 seconds. Size your shutdown logic accordingly.

---

### Monorepo with Mixed Module Systems

When a monorepo contains packages that are CJS and packages that are ESM, isolation is critical:

- Each package must have its own `package.json` with an explicit `"type"` field. The root `package.json`'s `"type"` field does NOT apply to subpackages.
- Use workspace-level ESLint configuration with per-package overrides for module system rules.
- In pnpm workspaces, use `pnpm --filter <package-name> <command>` to run scripts in a specific package to avoid cross-package contamination.
- Cross-package imports within the monorepo should always go through the package's published `exports` map, never via relative paths that bypass the `exports` field. This is enforced by setting `"moduleResolution": "bundler"` or `"node16"` in TypeScript, or via `eslint-plugin-n` rules.

---

### Corepack and `packageManager` Field Enforcement

The `packageManager` field works only when Corepack is enabled. The workflow for new contributors:

- Document in `README.md` that contributors must run `corepack enable` once after installing Node.js.
- If a contributor uses the wrong package manager (e.g., runs `npm install` in a `pnpm`-managed workspace), Corepack will block the command with a clear error message.
- Corepack downloads the specified package manager version on demand -- contributors do not need to install pnpm separately.
- For CI, add `- run: corepack enable` as the first setup step before any install commands.
- Pin the `packageManager` field to a full semver string including patch version (`"pnpm@9.1.0"`, not `"pnpm@9"`). Corepack uses this to download the exact binary.

---

### Node.js Version Mismatch Between Team Members

When team members are on different Node.js versions and experiencing inconsistent behavior:

- Confirm `engine-strict=true` is in the project `.npmrc`. If not, add it -- this turns engine mismatch warnings into install-blocking errors.
- Add a `.nvmrc` check to the `preinstall` npm lifecycle script: `"preinstall": "node -e \"const v=process.version; const r='>=20.14.0'; require('semver').satisfies(v,r)||process.exit(1)\""`. This requires `semver` as a devDependency.
- In GitHub Actions, pin the Node.js version with `node-version-file: '.nvmrc'` in the `actions/setup-node` step. This automatically reads the `.nvmrc` file rather than requiring manual updates to the workflow YAML.
- Document the version requirement in `README.md` with exact instructions for both `nvm` and `fnm` users.

---

## Example

**Input:** "I'm building a new REST API with Node.js that will run on Fly.io. The team is 3 developers. I want to use ESM, pnpm, and make sure everyone is on the same Node.js version. What should I set up?"

---

**Analysis:**
- Project type: Application (not a library -- no need for `exports` map or dual format)
- Deployment target: Fly.io -- a container-based platform, so Dockerfile and graceful shutdown matter
- Team size: 3 -- Corepack enforcement and pre-commit hooks are worth the setup cost
- Module system: ESM explicitly requested
- Package manager: pnpm explicitly requested
- Node.js version: Use current LTS (20.14.0) since Fly.io runs whatever you put in the Dockerfile

---

**Output:**

### `.nvmrc`

```
20.14.0
```

### `.npmrc`

```ini
engine-strict=true
save-exact=true
```

### `package.json`

```json
{
  "name": "my-api",
  "version": "0.1.0",
  "description": "REST API deployed to Fly.io",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.14.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.1.0",
  "volta": {
    "node": "20.14.0",
    "pnpm": "9.1.0"
  },
  "scripts": {
    "start": "node --max-old-space-size=512 src/index.js",
    "dev": "node --watch --env-file=.env src/index.js",
    "test": "node --test test/**/*.test.js",
    "test:coverage": "node --test --experimental-test-coverage test/**/*.test.js",
    "lint": "eslint src test",
    "lint:fix": "eslint src test --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "pino": "9.2.0"
  },
  "devDependencies": {
    "@eslint/js": "9.5.0",
    "eslint": "9.5.0",
    "eslint-plugin-n": "17.9.0",
    "lint-staged": "15.2.7",
    "prettier": "3.3.2",
    "simple-git-hooks": "2.11.1"
  },
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged"
  },
  "lint-staged": {
    "*.{js,mjs}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yaml,yml}": ["prettier --write"]
  }
}
```

**Key decisions made:**
- `"private": true` -- this is an application, not an npm package
- `--max-old-space-size=512` -- Fly.io's free tier VMs have 256-512MB RAM; 512MB heap leaves headroom for OS overhead
- `pino` as the logger -- production-grade, JSON output, compatible with Fly.io's log aggregation
- `save-exact=true` -- application should have reproducible installs; no floating ranges

### `src/index.js`

```js
import { createServer } from 'node:http'
import { createLogger } from './logger.js'

const log = createLogger()
const PORT = process.env.PORT ?? 8080
const HOST = '0.0.0.0'  // Required on Fly.io -- must bind to all interfaces

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
    return
  }

  log.info({ method: req.method, url: req.url }, 'Request received')
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, HOST, () => {
  log.info({ port: PORT }, 'Server started')
})

const shutdown = (signal) => {
  log.warn({ signal }, 'Shutdown signal received')
  server.close(() => {
    log.warn('HTTP server closed, exiting')
    process.exit(0)
  })
  setTimeout(() => {
    log.error('Graceful shutdown timed out, forcing exit')
    process.exit(1)
  }, 30_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('unhandledRejection', (reason) => {
  log.error({ reason }, 'Unhandled promise rejection')
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  log.error({ err }, 'Uncaught exception')
  process.exit(1)
})
```

### `src/logger.js`

```js
import pino from 'pino'

export const createLogger = () => pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // In production, output newline-delimited JSON for log aggregation
  // In development, use pino-pretty (install separately as devDependency)
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
})
```

### `eslint.config.js`

```js
import js from '@eslint/js'
import pluginN from 'eslint-plugin-n'

export default [
  js.configs.recommended,
  pluginN.configs['flat/recommended'],
  {
    rules: {
      'no-console': 'error',  // Use pino, not console
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'n/no-missing-import': 'error',
      'n/no-process-env': 'warn',  // Prefer centralized config module
      'n/prefer-global/process': ['error', 'always'],
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
    settings: {
      n: { version: '>=20.14.0' },
    },
  },
]
```

### `.env.example`

```
NODE_ENV=development
PORT=8080
LOG_LEVEL=info
```

### `test/index.test.js`

```js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Smoke test -- verifies the module graph loads without errors
describe('Application smoke test', () => {
  it('creates a logger without throwing', async () => {
    const { createLogger } = await import('../src/logger.js')
    const log = createLogger()
    assert.ok(log, 'Logger should be created')
    assert.equal(typeof log.info, 'function', 'Logger should have info method')
  })
})
```

### `README.md` section -- Team Setup

```markdown
## Development Setup

**Prerequisites:**
- Node.js 20.14.0 (use nvm: `nvm use`, or fnm: `fnm use`)
- Enable Corepack (once per machine): `corepack enable`

**First-time setup:**
\`\`\`bash
corepack enable          # Activates pnpm via Corepack
nvm use                  # Switches to Node.js 20.14.0
pnpm install             # Install dependencies (engine version enforced)
cp .env.example .env     # Create local environment file
pnpm dev                 # Start development server with watch mode
\`\`\`
```

### Verification Run

```bash
# Confirm toolchain
node --version        # v20.14.0
pnpm --version        # 9.1.0

# Install and verify engines
pnpm install          # Should complete without engine warnings

# Verify quality tools
pnpm lint             # 0 problems
pnpm format:check     # All matched files use Prettier formatting

# Verify tests
pnpm test             # 1 test passed

# Verify server
pnpm start &
curl http://localhost:8080/health
# {"status":"ok","uptime":0.123}
```
