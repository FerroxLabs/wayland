---
name: typescript-project-setup
description: |
  Guides expert-level TypeScript project configuration: tsconfig.json with strict mode, path aliases, declaration file generation, composite projects for monorepos, and ESM configuration. Covers the decisions that determine type safety and developer experience.
  Use when the user asks about setting up a TypeScript project, configuring tsconfig.json, setting up path aliases, composite projects, or TypeScript build configuration.
  Do NOT use when the user asks about TypeScript type patterns (use `typescript-type-patterns`), runtime validation (use `typescript-runtime-safety`), or Node.js setup (use `nodejs-project-setup`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "typescript best-practices template"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# TypeScript Project Setup

## When to Use

**Use this skill when:**
- The user is initializing a new TypeScript project and needs a tsconfig.json configured from scratch -- including a library, application, CLI tool, or monorepo package
- The user is experiencing module resolution errors such as "Cannot find module" or "File is not a module" and needs to understand how `moduleResolution` settings interact with their runtime or bundler
- The user wants to configure path aliases (`@/components`, `~utils`) and needs both the TypeScript and the runtime/bundler sides of that configuration
- The user is setting up a monorepo (Turborepo, Nx, pnpm workspaces) and needs composite projects, project references, and shared base configs for incremental builds
- The user is building a publishable npm library and needs correct declaration file generation, `declarationMap`, `rootDir`/`outDir` pairing, and proper `package.json` exports field alignment
- The user is migrating an existing JavaScript project to TypeScript and needs a phased `allowJs`/`checkJs` migration strategy
- The user is configuring TypeScript for ESM output with Node.js 18+ and needs to understand `.js` extension requirements in imports, `"type": "module"` in package.json, and `node16`/`nodenext` resolution
- The user asks about `tsc --build` (project references), watch mode performance, or build output caching with TypeScript

**Do NOT use this skill when:**
- The user wants TypeScript type system patterns (generics, conditional types, mapped types, template literal types) -- use `typescript-type-patterns`
- The user wants runtime validation (Zod, Valet, class-validator, io-ts) to complement TypeScript's compile-time types -- use `typescript-runtime-safety`
- The user wants Node.js-specific project setup beyond TypeScript configuration (package.json structure, scripts, ESLint, Prettier, CI) -- use `nodejs-project-setup`
- The user is asking about testing configuration (Jest, Vitest, ts-jest, type testing with `expect-type`) -- use `javascript-testing-patterns`
- The user wants JavaScript patterns that don't involve TypeScript configuration -- use `javascript-idioms`
- The user is asking about TypeScript decorators or metadata reflection -- use `typescript-decorators`
- The user wants framework-specific setup where the framework provides its own tsconfig (Angular CLI, Nuxt) -- check framework-specific skills first

---

## Process

### Step 1: Classify the Project Type and Target Environment

Determine which of four project archetypes applies, because every subsequent decision depends on this:

- **Application (bundler target):** Code is processed by Vite, webpack, esbuild, Parcel, or Rollup. TypeScript is used only for type checking -- the bundler handles compilation. Set `"noEmit": true`. Use `"moduleResolution": "bundler"`. This unlocks the most permissive and ergonomic module resolution, supporting extensionless imports and index file resolution without requiring `.js` extensions.
- **Library (npm publish):** TypeScript emits `.js` and `.d.ts` files that other projects consume. Set `"declaration": true`, `"declarationMap": true`, `"composite": true`. Use `"moduleResolution": "node16"` or `"nodenext"`. This enforces the same constraints your consumers face.
- **Node.js CLI or server (direct execution):** TypeScript compiles to `.js` files run by Node.js directly or via a loader like `tsx` or `ts-node`. Use `"module": "Node16"` or `"NodeNext"` with matching `"moduleResolution"`. If using a bundler (esbuild for Lambda), treat it as the bundler case.
- **Monorepo package:** One or more packages depend on others in the same repo. Every internal package must use `"composite": true`. Use project references (`references` array) so `tsc --build` can incrementally compile in dependency order. Never cross-import source files across package boundaries.

Secondary environment questions to resolve now, not later:
- Is JSX required? (React, Preact, Solid) -- determines `"jsx"` setting and `lib` needs
- What is the minimum runtime target? ES2022 for Node.js 18+, ES2020 for Node.js 14+, never below ES2015 for new projects
- Is this a dual-CJS/ESM library? (requires two separate tsconfig files and two build outputs)

### Step 2: Establish the Strict Type Safety Baseline

Start from the strictest reasonable configuration and relax only with explicit justification. Never start permissive and attempt to tighten later -- the cost is orders of magnitude higher.

The core strict flags and what each one buys you:

- `"strict": true` -- umbrella flag that enables `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitAny`, `noImplicitThis`, `alwaysStrict`, `useUnknownInCatchVariables`. Enable this unconditionally on new projects.
- `"exactOptionalPropertyTypes": true` -- differentiates `{ prop?: string }` (property absent) from `{ prop: string | undefined }` (property present but undefined). Prevents a large class of subtle bugs where explicitly writing `undefined` to an optional key has different semantics than omitting it. This is not included in the `strict` umbrella -- add it explicitly.
- `"noUncheckedIndexedAccess": true` -- adds `| undefined` to all index signature results and array element access. `arr[0]` becomes `string | undefined` instead of `string`. This forces you to handle the case where an index is out of bounds. Not in the `strict` umbrella -- add it explicitly. Note: this affects `for...of` loops benignly (element type is still correct) but will generate errors for `array[i]` patterns used without null checks.
- `"noImplicitReturns": true` -- errors when a function has code paths that return without a value. Catches missing `return` statements in complex conditionals.
- `"noFallthroughCasesInSwitch": true` -- errors on switch cases that fall through without `break` or `return`. Prevents accidental fallthrough.
- `"noImplicitOverride": true` -- requires the `override` keyword when overriding a base class method. Catches typos in method names that silently create new methods instead of overriding.
- `"forceConsistentCasingInFileNames": true` -- prevents import casing mismatches that pass on macOS/Windows (case-insensitive filesystems) but break Linux CI. Always enable.

Flags that are deliberately excluded from the default recommendation and why:
- `"noPropertyAccessFromIndexSignature": true` -- forces bracket notation for index signature access. Useful in some codebases but creates friction with common patterns. Evaluate per project.
- `"allowUnusedLabels": false` and `"allowUnreachableCode": false` -- catch dead code, but conflict with common debugging patterns. Better handled by ESLint.

### Step 3: Configure Module and Module Resolution Settings

This is the single most error-prone area of TypeScript configuration. The `module` and `moduleResolution` settings are separate concerns but must be coherent:

**Decision matrix:**

| Scenario | `module` | `moduleResolution` | Notes |
|---|---|---|---|
| Vite/webpack/esbuild app | `ESNext` | `bundler` | Most ergonomic, extensionless imports |
| Next.js app | `ESNext` | `bundler` | Next.js plugin handles actual compilation |
| Node.js with ESM (`"type": "module"`) | `Node16` or `NodeNext` | `node16` or `nodenext` | Requires `.js` extensions in imports |
| Node.js with CJS (`"type": "commonjs"`) | `CommonJS` | `node16` or `nodenext` | Can use extensionless imports |
| npm library (ESM output) | `Node16` | `node16` | Matches consumer constraints |
| npm library (dual CJS+ESM) | Two tsconfig files | See edge cases | One per output format |

Critical pitfalls in module resolution:

- `"moduleResolution": "node"` (legacy) does not understand package.json `exports` field. Any library that uses `exports` for path mapping will resolve incorrectly. Never use this on new projects.
- `"moduleResolution": "bundler"` cannot be used when TypeScript emits files (i.e., when `noEmit` is false). It assumes a bundler handles actual file resolution. Setting `composite: true` or `declaration: true` with `bundler` resolution will error.
- When using `"module": "Node16"` or `"NodeNext"`, TypeScript enforces that relative imports use explicit file extensions. You must write `import { foo } from './utils.js'` even though the source file is `utils.ts`. TypeScript understands that `.js` in an import refers to the compiled output.
- `"esModuleInterop": true` -- enables helper functions that make CommonJS default imports work without `* as` syntax. Required for importing packages like `path`, `fs`, or any CJS-only package with a default export. Always enable. It also implies `"allowSyntheticDefaultImports": true`.

### Step 4: Configure Path Aliases

Path aliases improve import ergonomics but require configuration in two places: TypeScript (for type checking) and the runtime/bundler (for actual resolution). TypeScript's `paths` do not affect compilation output -- they are hints for the type checker only.

**TypeScript side:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

`baseUrl` must be set for `paths` to work. It is relative to the tsconfig.json file location. Set it to `"."` to anchor paths to the repo root, or to `"src"` if you want shorter aliases.

**Runtime/bundler side -- each tool has its own syntax:**

- **Vite:** `resolve.alias` in `vite.config.ts`. Use `fileURLToPath(new URL('./src', import.meta.url))` for the path value in ESM configs.
- **webpack:** `resolve.alias` in `webpack.config.js`.
- **Jest/Vitest:** `moduleNameMapper` in jest config or `resolve.alias` in vitest config.
- **Node.js (no bundler):** Use `package.json` `imports` field with `"#utils/*": "./src/utils/*"` syntax (note the `#` prefix required by Node.js subpath imports). Then use `"paths": { "#utils/*": ["./src/utils/*"] }` in tsconfig.
- **ts-node / tsx:** These tools read `tsconfig.json` paths directly via `tsconfig-paths` package, or natively in newer versions.

Alias naming conventions that minimize confusion:
- `@/*` for the general source root -- widely understood convention
- `#` prefix only for Node.js subpath imports (different semantic)
- Avoid single-character aliases (`~`, `$`) -- they conflict with shell expansion in some contexts
- Maximum two levels of nesting: `@/components/Button` is fine, `@/ui/components/forms/inputs/TextInput` suggests a structural problem

### Step 5: Configure Output Settings

Output configuration differs fundamentally between applications and libraries:

**For applications (bundler handles compilation):**
```json
{
  "compilerOptions": {
    "noEmit": true,
    "sourceMap": false
  }
}
```
`noEmit: true` tells TypeScript to run only type checking. The bundler produces actual output. Source maps are irrelevant here -- the bundler generates its own.

**For libraries:**
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationDir": "./dist/types",
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "emitDeclarationOnly": false
  }
}
```

Key output decisions for libraries:
- `"declarationDir"` separates `.d.ts` files from `.js` files when you want a flat `dist/` with `types/` subdirectory. Omit it to colocate `.d.ts` with `.js`.
- `"declarationMap": true` generates `.d.ts.map` files that map declaration file positions back to source. This enables "Go to Definition" in consuming projects to jump to your TypeScript source instead of the compiled declaration file. Always include it in libraries -- it has zero runtime cost.
- `"sourceMap": true` generates `.js.map` files for debugger integration. Include in libraries so consumers can debug into your code.
- `"emitDeclarationOnly": true` is useful when a separate tool (esbuild, Rollup) handles `.js` output but you still need TypeScript to generate `.d.ts` files. This is a common pattern: esbuild for fast JS compilation, `tsc --emitDeclarationOnly` for types.

The `rootDir`/`outDir` relationship is critical: `rootDir` must be an ancestor of all source files. If any source file is outside `rootDir`, TypeScript errors. This is why `rootDir: "src"` and `include: ["src/**/*.ts"]` must be consistent.

**Incremental compilation:**
- `"incremental": true` writes a `.tsbuildinfo` file that caches type checking results. Dramatically speeds up repeated `tsc` runs. Safe to enable in both applications and libraries.
- `"tsBuildInfoFile": "./.tsbuildinfo"` controls where the cache file is written. For monorepos, put it inside each package's directory.
- `"composite": true` implies `"incremental": true` automatically.

### Step 6: Configure for Specific Frameworks and Runtimes

**React / Preact (Vite):**
- `"jsx": "react-jsx"` -- uses the automatic JSX transform (no `import React` required). Default for React 17+.
- `"jsx": "react"` -- classic transform, requires `import React from 'react'` in every JSX file. Only for React 16.
- `"jsx": "preserve"` -- emits JSX unchanged for a downstream bundler to transform. Used by Next.js (Next handles JSX compilation via SWC).
- Add `"DOM"` and `"DOM.Iterable"` to `lib` for browser API types.

**Next.js 14/15:**
- Use `"plugins": [{ "name": "next" }]` in compilerOptions for the Next.js TypeScript plugin, which provides route type checking and other Next-specific features in the IDE.
- `"moduleResolution": "bundler"` is correct for Next.js (confirmed in Next.js docs).
- Next.js generates `next-env.d.ts` -- include this file in the `include` array.
- Do not set `"module"` to `"CommonJS"` -- Next.js expects `"ESNext"`.

**Node.js 18+ with native ESM:**
- Set `"type": "module"` in `package.json`.
- Set `"module": "Node16"` and `"moduleResolution": "node16"` in tsconfig.
- All relative imports in TypeScript source must use `.js` extension (not `.ts`).
- `tsc` output will use `.js` extensions as written -- the TypeScript compiler does not rewrite extensions.
- Named exports from `package.json` `exports` field are fully supported.

**Deno:**
- `"moduleResolution": "bundler"` or `"node16"` both work.
- Deno supports URL imports -- add `"allowImportingTsExtensions": true` for first-party `.ts` imports.
- Use Deno's `deno.json` or `deno.jsonc` for import maps rather than tsconfig paths.

### Step 7: Set Up Monorepo Project References

For any monorepo with multiple TypeScript packages, project references are mandatory for correct incremental builds and cross-package "Go to Definition" support.

**Structure requirements:**
- Every package that is referenced by another must have `"composite": true`.
- `composite: true` requires: `"declaration": true`, an explicit `"rootDir"`, and all input files covered by `include`/`files`.
- The consuming package lists references: `"references": [{ "path": "../shared-types" }]`.
- Build with `tsc --build` (or `tsc -b`) from the root, not `tsc` alone.
- `tsc --build --watch` for development mode.

**Base config inheritance:**
- Create a `tsconfig.base.json` at the repo root with shared strict settings.
- Each package's tsconfig extends it: `"extends": "../../tsconfig.base.json"`.
- The base config should NOT include `include`/`exclude`/`references` -- these are package-specific.
- Override only what differs per package (module system, jsx, outDir).

**The `paths` problem in monorepos:**
- TypeScript `paths` do not cross package boundaries via project references -- they are local to each tsconfig.
- Do not use `paths` to reference sibling packages. Use actual npm package names (`@myorg/shared-types`) resolved via `node_modules` symlinks (pnpm workspaces, yarn workspaces, npm workspaces) plus `project references`.
- The `paths` alias and the project reference must agree: if you alias `@myorg/shared-types` to a local path, also add the corresponding reference.

### Step 8: Validate and Iterate

Validation must happen in this order -- each step catches different classes of problems:

1. **`tsc --noEmit`** -- type checking pass only. Zero errors required before any other step. On a library, run `tsc --build` instead to validate project references.
2. **IDE type resolution check** -- open a consuming file, hover over an imported symbol, confirm the type shows correctly (not `any`). If types show as `any`, module resolution or path aliases are broken.
3. **"Go to Definition" check** -- in the IDE, press F12 on an imported symbol. It should jump to the TypeScript source file, not a `.d.ts` file. If it jumps to `.d.ts`, `declarationMap` is missing or not being generated.
4. **Build output check** -- for libraries, inspect `dist/` for: `.js` files, `.d.ts` files, `.d.ts.map` files, `.js.map` files. Missing any of these breaks consumers.
5. **Consumer simulation** -- create a temporary consuming project, install your library from the local `dist/`, and verify imports, types, and source maps work end-to-end. This catches `package.json` exports misalignments.

---

## Output Format

When providing TypeScript project configuration, deliver the following structure:

### Project Assessment Summary

```
Project type:    [Application | Library | Node.js service | Monorepo package]
Bundler/runtime: [Vite | webpack | Node.js native | Next.js | Deno | none]
Output target:   [Browser | Node.js 18+ | Node.js 16+ | Dual CJS+ESM]
JSX required:    [Yes (React 17+) | Yes (React 16) | No]
Path aliases:    [Yes -- list aliases | No]
Monorepo:        [Yes -- list tools | No]
Key constraints: [List any non-standard requirements]
```

### tsconfig.json Files

Provide all tsconfig files needed for the project, labeled clearly:

```
Files to create:
  tsconfig.base.json          (if monorepo)
  tsconfig.json               (always)
  tsconfig.build.json         (if library with separate type-check and build configs)
  packages/*/tsconfig.json    (if monorepo)
```

Each tsconfig with inline comments explaining non-obvious settings:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    // -- Language target --
    "target": "ES2022",           // Minimum: ES2022 for Node 18+, ES2020 for Node 14+
    "lib": ["ES2022"],            // Match target unless polyfilling

    // -- Module system --
    "module": "ESNext",           // Use Node16/NodeNext for native Node ESM
    "moduleResolution": "bundler",// Use node16/nodenext when emitting files

    // -- Strict type checking --
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,

    // -- Emit --
    "noEmit": true,              // Set to false for libraries
    "sourceMap": true,           // For libraries: true; for bundler apps: false
    "incremental": true,

    // -- Interop --
    "esModuleInterop": true,
    "isolatedModules": true,     // Required when using esbuild/SWC for compilation
    "skipLibCheck": true,

    // -- Path aliases --
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Bundler Alias Configuration (when applicable)

Provide the matching alias configuration for the build tool:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

### package.json Exports (for libraries)

```json
{
  "name": "@myorg/my-library",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"]
}
```

### Validation Checklist

```
[ ] tsc --noEmit passes with zero errors
[ ] tsc --build passes (monorepos / libraries with composite)
[ ] IDE shows correct types on imported symbols (not `any`)
[ ] "Go to Definition" jumps to source .ts files (not .d.ts)
[ ] dist/ contains .js, .d.ts, .d.ts.map, .js.map (libraries)
[ ] Path aliases resolve in IDE and in build output
[ ] No circular project references (monorepos)
```

---

## Rules

1. **ALWAYS enable `"strict": true`.** Never ship a tsconfig without it. The time cost of enabling strict on an existing codebase is 10--50x higher than starting strict. If a user asks to disable strict for "simplicity," explain the trade-off and offer the phased migration path instead.

2. **ALWAYS add `"exactOptionalPropertyTypes": true` and `"noUncheckedIndexedAccess": true` explicitly.** These are not included in the `strict` umbrella and address a large proportion of real production bugs. They are the two most impactful non-umbrella flags.

3. **NEVER use `"moduleResolution": "node"` (legacy) on new projects.** It ignores the `exports` field in `package.json`, which means any library using path mapping (like `@tanstack/query/react`) will resolve incorrectly. The correct minimum is `"node16"` for emit scenarios or `"bundler"` for non-emit scenarios.

4. **NEVER use `"moduleResolution": "bundler"` when TypeScript must emit files.** `bundler` resolution is incompatible with TypeScript emission (`composite: true`, `declaration: true`, or any config without `noEmit: true`). This combination produces a TypeScript compiler error: "Option 'moduleResolution: bundler' requires 'noEmit: true' or 'emitDeclarationOnly: true'."

5. **ALWAYS pair `"paths"` configuration with runtime resolution.** TypeScript `paths` are erased at compile time -- they do not affect the compiled output. A path alias that is not also configured in the bundler (Vite, webpack), test runner (Jest `moduleNameMapper`, Vitest `resolve.alias`), or Node.js (`package.json` imports field) will cause runtime "Cannot find module" errors even though TypeScript type-checks correctly.

6. **ALWAYS use `"composite": true` and project references for monorepo packages.** Without project references, `tsc --build` cannot determine build order and will not produce correct incremental output. Without `composite`, the TypeScript server cannot cache type information for referenced packages, causing IDE slowness proportional to monorepo size.

7. **NEVER cross-import source `.ts` files from a sibling package in a monorepo.** Always import through the package's public API (its `main`/`exports` field pointing to `dist/`), or through project references that consume the compiled output. Direct source imports break build caching and create tight coupling that makes packages non-independently deployable.

8. **ALWAYS set `"isolatedModules": true` when using esbuild, SWC, or Babel for compilation.** These tools compile files one-at-a-time without access to the full type graph, which means they cannot handle `const enum`, namespace merging, or re-exported types without explicit `type` imports. `isolatedModules` surfaces these incompatibilities at compile time rather than silently producing incorrect output. Also enforce `"verbatimModuleSyntax": true` as a stricter alternative that enforces `import type` for all type-only imports.

9. **NEVER set `"target"` below `"ES2020"` for new projects without explicit IE11 or legacy environment requirements.** Targeting `ES5` or `ES6` forces TypeScript to emit large polyfill helpers (`__awaiter`, `__generator`, `__assign`) for async/await and object spread. Modern bundlers tree-shake and conditionally polyfill based on target browsers far more efficiently than TypeScript's emit helpers. Minimum target for Node.js 18+ is `ES2022` to use native `Array.at()`, `Error.cause`, `Object.hasOwn()`, and top-level `await`.

10. **ALWAYS include `"skipLibCheck": true` in application tsconfigs.** Library declaration files often contain type errors due to version mismatches between a library's `@types` package and the library itself. `skipLibCheck` skips type-checking of all `.d.ts` files in `node_modules`. The performance gain on medium-to-large projects is 30--60% faster type checking. For libraries you publish, do NOT skip lib checking on your own `.d.ts` output -- run `tsc` on your output to verify your declarations are valid.

11. **ALWAYS regenerate `tsconfig.tsbuildinfo` when changing `compilerOptions` significantly.** Stale incremental build caches cause TypeScript to skip re-checking files it should re-check. Run `tsc --build --clean` to wipe the cache when changing `strict`, `target`, `module`, `moduleResolution`, or `paths`.

12. **NEVER mix `"module": "CommonJS"` with `"type": "module"` in package.json.** If `package.json` has `"type": "module"`, all `.js` files are interpreted as ESM. If TypeScript emits CommonJS into those files, Node.js will throw `SyntaxError: Cannot use import statement in a module`. Use `.cjs` extension for CommonJS output in an ESM package, or change `"type"` to `"commonjs"` and use `.mjs` for ESM files.

---

## Edge Cases

### Migrating from JavaScript to TypeScript Incrementally

Start permissive and tighten. Never attempt a big-bang migration:

1. Add `tsconfig.json` with `"allowJs": true`, `"checkJs": false`, `"noEmit": true`, `"strict": false`.
2. Rename the entry point file from `.js` to `.ts`. Fix only the errors introduced by that one file.
3. Work outward from leaf modules (pure utilities with no imports) toward the entry point. Leaf modules have no dependencies to fight with.
4. After the codebase is fully `.ts`, enable flags one at a time in this order: `noImplicitAny` → `strictNullChecks` → `strictFunctionTypes` → `strict: true` → `exactOptionalPropertyTypes` → `noUncheckedIndexedAccess`.
5. Use `// @ts-ignore` and `// @ts-expect-error` sparingly as temporary suppressions with a `TODO` comment referencing a ticket. Never suppress errors permanently.
6. The `as unknown as TargetType` double cast is acceptable during migration when the type relationship is genuinely established by program logic TypeScript cannot verify -- but document it.

### Dual CJS and ESM Library Output

Publishing a library that works in both CommonJS and ESM environments requires two separate tsconfig files and careful `package.json` exports:

```jsonc
// tsconfig.esm.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "node16",
    "outDir": "./dist/esm",
    "declaration": false   // Emit declarations from ESM build only
  }
}

// tsconfig.cjs.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node16",
    "outDir": "./dist/cjs",
    "declaration": true,
    "declarationDir": "./dist/types"
  }
}
```

Build script: `tsc -p tsconfig.esm.json && tsc -p tsconfig.cjs.json`

`package.json` exports field:
```json
{
  "exports": {
    ".": {
      "import": { "types": "./dist/types/index.d.ts", "default": "./dist/esm/index.js" },
      "require": { "types": "./dist/types/index.d.ts", "default": "./dist/cjs/index.js" }
    }
  }
}
```

The CJS output directory should contain a `package.json` with `{ "type": "commonjs" }` to prevent Node.js from misinterpreting `.js` files as ESM. The ESM output directory gets `{ "type": "module" }`.

### Non-TypeScript File Imports (CSS Modules, SVG, WASM)

TypeScript does not know about non-standard file types. Create declaration files in `src/` to teach it:

```ts
// src/declarations.d.ts

// CSS Modules
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

// SVG as React components (SVGR)
declare module '*.svg' {
  import type { FC, SVGProps } from 'react'
  const ReactComponent: FC<SVGProps<SVGSVGElement>>
  export { ReactComponent }
  export default ReactComponent
}

// WebAssembly -- typed at instantiation level
declare module '*.wasm' {
  const content: WebAssembly.Module
  export default content
}

// JSON -- TypeScript handles this natively with "resolveJsonModule": true
// No declaration needed, but add to tsconfig: "resolveJsonModule": true
```

Keep declaration files in `src/` and include them in `include` array. Never add them to `node_modules` or global scope unless they are genuinely global types.

### TypeScript with Decorators (Legacy and Standard)

TypeScript supports two decorator systems with different tsconfig requirements:

- **Legacy decorators** (TypeScript < 5.0, Angular, NestJS): Require `"experimentalDecorators": true` and `"emitDecoratorMetadata": true`. The latter requires `reflect-metadata` as a runtime dependency. These decorators use a different syntax and are not compatible with the TC39 standard decorators.
- **Standard decorators** (TypeScript 5.0+, TC39 Stage 3): Do NOT set `experimentalDecorators`. Standard decorators are enabled by default in TypeScript 5+. They do not support metadata emission -- if you need metadata, use a separate mechanism.

NestJS currently requires legacy decorators. Angular 15+ supports standard decorators. Do not mix the two systems.

### Path Aliases Breaking in Jest or Vitest

The most common post-setup failure: TypeScript is happy, the build works, but tests fail with "Cannot find module '@/utils/format'". This is because Jest and Vitest resolve modules independently of TypeScript and the application bundler.

For Jest:
```json
// jest.config.json
{
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}
```

For Vitest:
```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  test: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

Alternatively, Vitest can extend the Vite config: `import { defineConfig } from 'vitest/config'` combined with `mergeConfig(viteConfig, vitestConfig)` -- this automatically inherits Vite's `resolve.alias` settings and avoids duplication.

### Circular Project References in Monorepos

`tsc --build` detects circular references between packages and errors immediately. Common causes:

- Package A references Package B, and Package B references Package A.
- A shared utility package that imports from a feature package that it should not know about.
- Incorrectly placed types that should be in a separate base package.

Resolution strategy:
1. Draw the dependency graph explicitly (package names as nodes, references as directed edges).
2. The graph must be a DAG (directed acyclic graph). Any cycle must be broken.
3. Extract the shared type or utility into a third package that neither A nor B imports from each other.
4. Commonly: `@myorg/types` (no dependencies), `@myorg/utils` (depends on types), `@myorg/feature` (depends on both). Never let types or utils depend on feature packages.

### `skipLibCheck` Hiding Real Errors

`skipLibCheck: true` skips ALL `.d.ts` files, including your own generated declarations if you mistakenly include `dist/` in `include`. This can hide malformed declaration output.

Safe practice:
- Add `"dist"` and `"**/*.d.ts"` to `exclude` in your source tsconfig.
- Run a separate type validation step in CI: `tsc --noEmit -p tsconfig.check-declarations.json` where that config has `skipLibCheck: false` and includes only the `dist/` types.
- Use `@arethetypeswrong/cli` (attw) to validate your published package's types resolve correctly from multiple module resolution modes.

---

## Example

**Input:** "I'm building a date formatting library called `tempo-date` that I plan to publish to npm. It needs to work in both ESM and CommonJS environments. I'm using TypeScript 5.3 with esbuild for JavaScript compilation and `tsc --emitDeclarationOnly` for types. The library will be used in Node.js 18+ and browser (via bundlers). No React, no path aliases. How should I configure TypeScript?"

---

### Project Assessment

```
Project type:    Library (npm publish)
Bundler/runtime: esbuild (JS compilation), tsc (declaration only)
Output target:   Dual CJS+ESM -- Node.js 18+ and browser bundlers
JSX required:    No
Path aliases:    No
Monorepo:        No
Key constraints: esbuild requires isolatedModules; dual output requires two tsconfig files;
                 declarations must be correct for both module formats
```

---

### File Structure

```
tempo-date/
  src/
    index.ts          # Public API entry point
    format.ts         # Core formatting logic
    parse.ts          # Parsing logic
    locale.ts         # Locale handling
    types.ts          # Shared internal types
    declarations.d.ts # (not needed -- pure TS library)
  dist/
    esm/
      index.js        # ESM output (esbuild)
      package.json    # { "type": "module" }
    cjs/
      index.js        # CJS output (esbuild)
      package.json    # { "type": "commonjs" }
    types/
      index.d.ts      # Declaration files (tsc)
      index.d.ts.map  # Declaration maps (tsc)
  tsconfig.json           # Base config for IDE and type checking
  tsconfig.build.json     # Extends base -- used for tsc --emitDeclarationOnly
  package.json
  build.ts                # esbuild build script
```

---

### `tsconfig.json` (base -- used by IDE and `tsc --noEmit`)

```jsonc
{
  "compilerOptions": {
    // Language target -- ES2022 for Node.js 18+ native features
    // Object.hasOwn, Array.at, Error.cause available without polyfill
    "target": "ES2022",

    // lib: no DOM -- this is a pure utility library with no browser-specific APIs
    // ES2022 gives us the same built-in types as target
    "lib": ["ES2022"],

    // Module: Node16 matches the resolution mode consumers will use.
    // This also enforces .js extension discipline in our own imports,
    // which catches a common ESM pitfall before it reaches consumers.
    "module": "Node16",
    "moduleResolution": "node16",

    // Strict type checking -- full suite plus the two non-umbrella flags
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,

    // isolatedModules: required because esbuild compiles file-by-file.
    // This ensures we never use const enum, namespace merging,
    // or implicit type re-exports that esbuild cannot handle.
    "isolatedModules": true,

    // verbatimModuleSyntax: stricter version of isolatedModules.
    // Forces explicit "import type" for all type-only imports.
    // esbuild and SWC can then safely strip type imports without
    // needing to analyze whether an import is type-only.
    "verbatimModuleSyntax": true,

    // esModuleInterop: not strictly needed for a pure ESM library,
    // but enables correct default import behavior if we ever import
    // a CommonJS dependency.
    "esModuleInterop": true,

    // skipLibCheck: true for performance during development type checking.
    // We validate our OWN generated declarations separately in CI.
    "skipLibCheck": true,

    // noEmit: true for this base config -- IDE and tsc --noEmit use only.
    // Actual emission handled by tsconfig.build.json and esbuild.
    "noEmit": true,

    // Incremental: cache type checking state for faster subsequent runs.
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

---

### `tsconfig.build.json` (declaration emission only)

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    // Override noEmit -- this config exists to emit declarations
    "noEmit": false,
    "emitDeclarationOnly": true,

    // Declaration output configuration
    "declaration": true,
    "declarationMap": true,
    "declarationDir": "./dist/types",

    // rootDir must be set so declaration file paths mirror source paths.
    // dist/types/index.d.ts corresponds to src/index.ts.
    "rootDir": "./src",

    // composite: true enables project references if we later add this
    // library as a monorepo package. Required with emitDeclarationOnly
    // when referenced by other composite projects.
    "composite": true,

    // Disable incremental cache for build -- use a clean build in CI
    "incremental": false,
    "tsBuildInfoFile": undefined
  },
  "include": ["src/**/*.ts"],
  // Exclude tests from declaration output
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

---

### `build.ts` (esbuild script for JS compilation)

```ts
import { build } from 'esbuild'

const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'neutral' as const, // Works in both Node.js and browser bundlers
  target: 'es2022',
  // external: list peer dependencies if any -- prevents bundling them
  external: [],
  // No minification in library output -- consumers handle that
  minify: false,
  sourcemap: true,
}

// ESM output
await build({
  ...sharedConfig,
  format: 'esm',
  outfile: 'dist/esm/index.js',
})

// CJS output
await build({
  ...sharedConfig,
  format: 'cjs',
  outfile: 'dist/cjs/index.js',
})

// Generate package.json shims for each output directory
import { writeFile } from 'node:fs/promises'
await writeFile('dist/esm/package.json', JSON.stringify({ type: 'module' }))
await writeFile('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }))

console.log('Build complete')
```

---

### `package.json`

```json
{
  "name": "tempo-date",
  "version": "1.0.0",
  "description": "Fast, type-safe date formatting and parsing",
  "license": "MIT",
  "type": "module",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/types/index.d.ts",
        "default": "./dist/esm/index.js"
      },
      "require": {
        "types": "./dist/types/index.d.ts",
        "default": "./dist/cjs/index.js"
      }
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsx build.ts && tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist .tsbuildinfo"
  },
  "devDependencies": {
    "esbuild": "^0.20.0",
    "tsx": "^4.0.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### Import Style Required Inside `src/` (Node16 resolution)

Because `"module": "Node16"` is set, TypeScript enforces explicit `.js` extensions in relative imports. This is non-negotiable with this configuration:

```ts
// src/index.ts -- CORRECT
export { format } from './format.js'      // .js extension, even though source is .ts
export { parse } from './parse.js'
export { createLocale } from './locale.js'
export type { FormatOptions, ParseResult } from './types.js'

// src/index.ts -- WRONG -- TypeScript will error under node16 resolution
export { format } from './format'         // Missing .js extension
export { format } from './format.ts'      // .ts extension not valid in output
```

TypeScript resolves `'./format.js'` to `./format.ts` in source -- the `.js` refers to the compiled output that will exist at runtime. This is the correct mental model.

---

### CI Validation Script

```bash
#!/bin/sh
set -e

# Step 1: Full type check with zero errors
echo "Running type check..."
npx tsc --noEmit

# Step 2: Build JS (esbuild) + declarations (tsc)
echo "Building..."
npm run build

# Step 3: Verify dist structure
echo "Checking dist structure..."
test -f dist/esm/index.js     || (echo "Missing ESM output" && exit 1)
test -f dist/cjs/index.js     || (echo "Missing CJS output" && exit 1)
test -f dist/types/index.d.ts || (echo "Missing declarations" && exit 1)
test -f dist/types/index.d.ts.map || (echo "Missing declaration maps" && exit 1)

# Step 4: Validate published types resolve correctly from all module modes
# attw (Are The Types Wrong?) checks for common publishing mistakes
echo "Validating type exports..."
npx attw --pack .

echo "All checks passed."
```

---

### Validation Checklist

```
[x] tsc --noEmit passes with zero errors
[x] tsc -p tsconfig.build.json produces dist/types/index.d.ts and .d.ts.map
[x] esbuild produces dist/esm/index.js and dist/cjs/index.js
[x] dist/esm/package.json contains { "type": "module" }
[x] dist/cjs/package.json contains { "type": "commonjs" }
[x] package.json exports field covers both "import" and "require" conditions
[x] Relative imports in src/ use .js extensions (enforced by node16 resolution)
[x] No import type violations (enforced by verbatimModuleSyntax)
[x] attw reports no type resolution errors for any module format
[x] "Go to Definition" in a consuming project resolves to src/ via declarationMap
```

The key insight for this library setup: esbuild handles JavaScript compilation at high speed, while `tsc --emitDeclarationOnly` handles the slower but necessary declaration file generation. These are separate concerns with separate tooling. TypeScript's `verbatimModuleSyntax` ensures the two tools stay in sync by enforcing explicit `import type` on type-only imports -- a requirement both tools share. The `node16` module resolution mode validates that all imports will resolve correctly in Node.js 18+ ESM environments before any code leaves the developer's machine.
