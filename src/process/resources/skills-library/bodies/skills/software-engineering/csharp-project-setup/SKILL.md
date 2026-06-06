---
name: csharp-project-setup
description: |
  Guides expert-level .NET project initialization: SDK-style csproj, solution file structure, NuGet configuration, Directory.Build.props, and .NET 8+ project templates.
  Use when the user asks about C# project setup, .NET, csproj, solution file, NuGet, Directory.Build.props, .NET 8, dotnet new.
  Do NOT use when the user asks about C# modern idioms (use `csharp-modern-idioms`), C# testing (use `csharp-testing-patterns`), C# ASP.NET (use `csharp-aspnet-patterns`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "csharp best-practices template"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Csharp Project Setup

## When to Use

**Use this skill when:**
- User asks how to initialize a new C# library, console app, worker service, or class library project with `dotnet new` or manually
- User asks how to structure a multi-project solution file (`.sln`) with shared tooling
- User asks about `Directory.Build.props`, `Directory.Build.targets`, or `Directory.Packages.props` for centralized configuration
- User asks about NuGet configuration -- `NuGet.Config`, `nuget.config`, Central Package Management (CPM), or package source mapping
- User asks how to configure SDK-style `.csproj` files, target framework monikers, or multi-targeting
- User asks about .NET 8 or .NET 9 project templates, implicit usings, nullable reference types, or `global.json`
- User asks about `global.json` SDK pinning, build properties, or repository-level MSBuild conventions
- User asks how to configure a project for NuGet package publishing, SourceLink, deterministic builds, or package metadata

**Do NOT use this skill when:**
- User asks about C# language features, pattern matching, records, or modern idioms -- use `csharp-modern-idioms`
- User asks about writing unit tests, test project setup, xUnit, NUnit, or Moq -- use `csharp-testing-patterns`
- User asks about ASP.NET Core Minimal API, controllers, middleware, or Blazor -- use `csharp-aspnet-patterns`
- User asks about Docker or Kubernetes deployment of a .NET app -- use a container deployment skill
- User asks about GitHub Actions, Azure Pipelines, or CI/CD pipeline configuration specifically -- use a CI/CD skill
- User asks about Entity Framework Core migrations or database modeling -- use a data-access skill
- User asks about .NET MAUI, Xamarin, or mobile project setup -- outside scope of this skill

---

## Process

### 1. Assess Project Context and Choose the Right Template

Before generating any configuration, gather these critical dimensions:

- **Project type**: Library (`classlib`), console app (`console`), worker service (`worker`), web API (`webapi`), gRPC service (`grpc`) -- each has different `<OutputType>` and SDK values
- **Deployment target**: Is this a NuGet package, a self-contained executable, a framework-dependent app, or an AOT-compiled binary?
- **Mono-repo vs. standalone**: A monorepo with 3+ projects warrants `Directory.Build.props`; a single project does not need it
- **Target framework**: Default to `net8.0` for LTS, `net9.0` for current. Use `net8.0;net9.0` only when the library must support both. Never use `netstandard2.0` for new libraries unless targeting legacy consumers requiring .NET Framework compatibility
- **Team size**: Solo projects can use loose conventions; team projects must encode conventions in MSBuild properties and `.editorconfig`
- **SDK version pinning**: Always determine whether the repo needs a `global.json` -- required when CI must reproduce builds exactly or when multiple SDK versions coexist on developer machines

Run `dotnet --version` to confirm the installed SDK. Use `dotnet new list` to see all available templates.

### 2. Initialize the Solution and Project Structure

Follow this canonical layout for any project beyond a single file:

```
/MyRepo
  global.json                  ← SDK version pin
  NuGet.Config                 ← package sources (optional)
  Directory.Build.props        ← shared MSBuild properties
  Directory.Build.targets      ← shared MSBuild targets (optional)
  Directory.Packages.props     ← Central Package Management versions (optional)
  .editorconfig                ← formatting and analysis rules
  MyRepo.sln                   ← solution file
  /src
    /MyRepo.Core
      MyRepo.Core.csproj
    /MyRepo.Utilities
      MyRepo.Utilities.csproj
  /tests
    /MyRepo.Core.Tests
      MyRepo.Core.Tests.csproj
  /samples
    /MyRepo.Sample
      MyRepo.Sample.csproj
```

- Create the solution file first: `dotnet new sln -n MyRepo`
- Create projects: `dotnet new classlib -n MyRepo.Core -o src/MyRepo.Core`
- Add projects to solution: `dotnet sln MyRepo.sln add src/MyRepo.Core/MyRepo.Core.csproj`
- Repeat for all projects. Never add test projects to the `src/` directory -- keep them in `tests/`
- The solution file is a human-readable grouping file; all real configuration lives in `.csproj` and `Directory.Build.props`
- Use solution folders (`dotnet sln add --solution-folder`) to visually group `src`, `tests`, and `samples` in Visual Studio and Rider

### 3. Author the SDK-Style .csproj File

An SDK-style `.csproj` is declarative and minimal. Avoid the verbose legacy format:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <LangVersion>latest</LangVersion>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <AnalysisLevel>latest-recommended</AnalysisLevel>
  </PropertyGroup>

  <ItemGroup>
    <!-- Project references use relative paths -->
    <ProjectReference Include="..\..\src\MyRepo.Core\MyRepo.Core.csproj" />
  </ItemGroup>

  <ItemGroup>
    <!-- Package versions come from Directory.Packages.props if using CPM -->
    <PackageReference Include="Serilog" Version="3.1.1" />
  </ItemGroup>

</Project>
```

Key property decisions:
- `<Nullable>enable</Nullable>` -- mandatory for all new projects. Nullable reference types eliminate entire classes of null-dereference bugs
- `<ImplicitUsings>enable</ImplicitUsings>` -- adds a generated `GlobalUsings.g.cs` with `System`, `System.Collections.Generic`, `System.Linq`, etc. Do not fight this feature; add additional global usings in a `GlobalUsings.cs` file
- `<LangVersion>latest</LangVersion>` -- tracks the latest stable C# version for the SDK. Use `preview` only for experimental work
- `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` -- critical for team projects; forces nullable warnings and analyzer warnings to be resolved
- `<AnalysisLevel>latest-recommended</AnalysisLevel>` -- enables Roslyn analyzers without requiring a separate analyzer package. Options: `none`, `default`, `latest`, `latest-recommended`, `latest-all`
- `<OutputType>Exe</OutputType>` -- only required for console apps and workers. Libraries omit this; it defaults to `Library`
- `<AllowUnsafeBlocks>true</AllowUnsafeBlocks>` -- only in projects that explicitly require unsafe pointer operations

### 4. Configure Directory.Build.props for Centralized Properties

`Directory.Build.props` is evaluated by MSBuild before any `.csproj` file in the same directory or any subdirectory. Place it at the repository root to apply properties globally:

```xml
<Project>

  <!-- Repository identity -->
  <PropertyGroup>
    <Product>MyRepo</Product>
    <Company>Acme Corp</Company>
    <Copyright>Copyright © Acme Corp $(Year)</Copyright>
    <Authors>Acme Corp</Authors>
    <RepositoryUrl>https://github.com/acme/myrepo</RepositoryUrl>
    <RepositoryType>git</RepositoryType>
  </PropertyGroup>

  <!-- Language and analysis defaults applied to ALL projects -->
  <PropertyGroup>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <AnalysisLevel>latest-recommended</AnalysisLevel>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
  </PropertyGroup>

  <!-- Deterministic builds for reproducibility -->
  <PropertyGroup Condition="'$(CI)' == 'true'">
    <Deterministic>true</Deterministic>
    <ContinuousIntegrationBuild>true</ContinuousIntegrationBuild>
  </PropertyGroup>

  <!-- Artifact output: all output goes to a single /artifacts folder -->
  <PropertyGroup>
    <ArtifactsPath>$(MSBuildThisFileDirectory)artifacts</ArtifactsPath>
  </PropertyGroup>

</Project>
```

- `<EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>` -- causes `.editorconfig` style rules (IDE diagnostics) to fire as build errors, not just IDE squiggles
- `<ContinuousIntegrationBuild>true</ContinuousIntegrationBuild>` -- required for SourceLink to embed correct paths into PDB files; set conditionally on the `CI` environment variable
- Use a `<PropertyGroup Condition="...">` to vary behavior for `src/` vs. `tests/` projects by checking `$(MSBuildProjectFullPath.Contains('tests'))`
- `Directory.Build.props` is not recursive-override -- a project-level `.csproj` can override any property defined here. This is by design
- `Directory.Build.targets` is evaluated after `.csproj`, making it appropriate for targets that enforce post-build checks or file manipulation

### 5. Configure NuGet and Central Package Management

For repositories with 3 or more projects, Central Package Management (CPM) eliminates version drift across projects:

**Directory.Packages.props** (repository root):
```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
    <!-- DisableCentralPackageVersions can be set per-project to opt out -->
  </PropertyGroup>

  <ItemGroup>
    <!-- Versions declared once, referenced without version in .csproj -->
    <PackageVersion Include="Serilog" Version="3.1.1" />
    <PackageVersion Include="Serilog.Sinks.Console" Version="5.0.1" />
    <PackageVersion Include="Microsoft.Extensions.Hosting" Version="8.0.0" />
    <PackageVersion Include="Microsoft.Extensions.DependencyInjection" Version="8.0.0" />
    <PackageVersion Include="FluentValidation" Version="11.9.0" />
    <PackageVersion Include="Polly" Version="8.3.0" />
  </ItemGroup>

  <!-- Test-only packages kept separate for clarity -->
  <ItemGroup Label="Test">
    <PackageVersion Include="xunit" Version="2.8.0" />
    <PackageVersion Include="xunit.runner.visualstudio" Version="2.8.0" />
    <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.10.0" />
    <PackageVersion Include="FluentAssertions" Version="6.12.0" />
    <PackageVersion Include="NSubstitute" Version="5.1.0" />
  </ItemGroup>
</Project>
```

In each `.csproj` with CPM enabled, omit `Version` from `<PackageReference>`:
```xml
<PackageReference Include="Serilog" />  <!-- version resolved from Directory.Packages.props -->
```

**NuGet.Config** -- required when using a private feed or package source mapping:
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <!-- Add private feed here if needed -->
    <!-- <add key="MyFeed" value="https://pkgs.dev.azure.com/acme/_packaging/MyFeed/nuget/v3/index.json" /> -->
  </packageSources>
  <packageSourceMapping>
    <packageSource key="nuget.org">
      <package pattern="*" />
    </packageSource>
  </packageSourceMapping>
</configuration>
```

- `<clear />` before `<add>` entries is a security best practice -- it prevents implicit pickup of machine-level or user-level feed configurations in CI
- Package source mapping (available since NuGet 6.0) prevents dependency confusion attacks by binding packages to specific feeds

### 6. Pin the SDK with global.json

Always create `global.json` at the repository root for reproducible builds:

```json
{
  "sdk": {
    "version": "8.0.401",
    "rollForward": "latestMinor",
    "allowPrerelease": false
  }
}
```

- `rollForward: "latestMinor"` means the SDK will roll forward to the latest patch and minor within the major version. Use `"patch"` for maximum reproducibility, `"latestMinor"` for a balance of flexibility and stability
- `allowPrerelease: false` prevents accidental use of preview SDKs in production builds
- Run `dotnet --list-sdks` to enumerate installed versions. Update `global.json` intentionally when upgrading the SDK
- In CI, explicitly install the exact SDK version matching `global.json` using the `setup-dotnet` action or `UseDotNet` task

### 7. Configure .editorconfig for Code Style and Roslyn Analyzers

`.editorconfig` is the single source of truth for both formatting and code-style diagnostic severity. Place it at the repository root:

```ini
root = true

[*]
indent_style = space
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.{cs,csx}]
indent_size = 4

# C# style rules (IDE diagnostics enforced in build via EnforceCodeStyleInBuild)
dotnet_style_qualification_for_field = false:error
dotnet_style_qualification_for_property = false:error
dotnet_style_prefer_auto_properties = true:error
csharp_style_expression_bodied_methods = when_on_single_line:suggestion
csharp_style_var_for_built_in_types = false:warning
csharp_style_var_when_type_is_apparent = true:suggestion
csharp_prefer_braces = true:error
csharp_style_namespace_declarations = file_scoped:error

# Nullable diagnostics
dotnet_diagnostic.CS8600.severity = error   # Converting null literal
dotnet_diagnostic.CS8601.severity = error   # Possible null reference assignment
dotnet_diagnostic.CS8602.severity = error   # Dereference of a possibly null reference
dotnet_diagnostic.CS8603.severity = error   # Possible null reference return
dotnet_diagnostic.CS8618.severity = error   # Non-nullable property uninitialized

# Suppressed rules with documented rationale
dotnet_diagnostic.CA1014.severity = none    # Mark assemblies with CLSCompliant -- not needed for modern apps
dotnet_diagnostic.CA1062.severity = none    # Validate parameters -- redundant with nullable enabled

[*.{csproj,props,targets}]
indent_size = 2

[*.json]
indent_size = 2

[*.{yml,yaml}]
indent_size = 2
```

- `csharp_style_namespace_declarations = file_scoped:error` enforces the C# 10+ file-scoped namespace syntax, eliminating one level of indentation
- Severity levels: `none`, `suggestion`, `warning`, `error`. Use `error` for rules you would reject in code review
- The `root = true` setting prevents `.editorconfig` inheritance from parent directories -- critical in monorepos

### 8. Verify the Setup and Configure .gitignore

Run a full build and restore to confirm all tooling is wired correctly:

```bash
# Restore all packages
dotnet restore MyRepo.sln

# Build in Release configuration
dotnet build MyRepo.sln -c Release --no-restore

# Run all tests
dotnet test MyRepo.sln --no-build -c Release

# Format check (no-modify, report only)
dotnet format MyRepo.sln --verify-no-changes --verbosity diagnostic
```

Minimum `.gitignore` entries for a .NET repository:
```
# Build outputs
**/bin/
**/obj/
**/artifacts/

# NuGet
**/*.nupkg
**/*.snupkg
**/packages/
**/project.assets.json
**/project.nuget.cache
**/.nuget/packages/

# IDE
.vs/
.idea/
*.user
*.suo
*.DotSettings.user

# OS
.DS_Store
Thumbs.db
```

---

## Output Format

When providing a C# project setup recommendation, structure the response as follows:

```
## Project Setup Recommendation

### Context Summary
| Dimension        | Assessment                        |
|------------------|-----------------------------------|
| Project type     | [classlib / console / worker / …] |
| Target framework | [net8.0 / net9.0 / multi-target]  |
| NuGet strategy   | [CPM / per-project / none]        |
| Mono-repo        | [yes / no]                        |
| Publishing       | [NuGet package / executable / …]  |

### Directory Structure
[Annotated tree showing all relevant files and folders]

### File Contents
[Complete, copy-paste-ready content for each file, clearly labeled]

#### global.json
[complete file]

#### Directory.Build.props
[complete file]

#### Directory.Packages.props (if CPM applies)
[complete file]

#### NuGet.Config (if needed)
[complete file]

#### .editorconfig (key sections)
[complete file or relevant excerpt]

#### [ProjectName].csproj
[complete file]

### CLI Commands
[Ordered sequence of dotnet CLI commands to initialize the project]

### Decisions Log
| Decision                      | Choice              | Rationale                                |
|-------------------------------|---------------------|------------------------------------------|
| Target framework              | net8.0              | LTS; stable until Nov 2026               |
| Nullable reference types      | enabled             | Eliminates null-ref bugs at compile time |
| Central Package Management    | enabled             | 4+ projects; prevents version drift      |
| TreatWarningsAsErrors         | true                | Enforces nullable compliance in CI       |
```

---

## Rules

1. **Never use `<PackageReference>` with floating versions** (`*`, `1.2.*`, `[1.0,2.0)`). Pin exact versions in `Directory.Packages.props` or in the `.csproj`. Floating versions cause non-reproducible builds and can pull in breaking changes silently.

2. **Never target `netstandard2.0` for new libraries** unless the library must be consumed by .NET Framework 4.6.1+ projects. For libraries targeting only modern .NET, use `net8.0` or multi-target `net8.0;net9.0`. `netstandard2.0` loses access to 5+ years of API surface and forces polyfills.

3. **Never place `<Version>` in `Directory.Build.props`** for libraries intended for NuGet publication. Version must be set by CI using `dotnet pack -p:Version=$(GitVersion)` or a MinVer/GitVersion integration. A hardcoded version in shared props means every package publishes the same version.

4. **Always set `<Nullable>enable</Nullable>` from the first commit.** Retrofitting nullable annotations onto an existing codebase with thousands of `#nullable disable` suppressions is a multi-week project. Starting clean costs nothing.

5. **Always use `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in `Directory.Build.props`.** Teams that leave warnings as warnings accumulate hundreds of unaddressed warnings within months, rendering the warning system useless. If a rule produces false positives, suppress it explicitly in `.editorconfig` with a comment justifying the suppression.

6. **Never commit `bin/`, `obj/`, or the NuGet cache to source control.** These directories contain binary outputs and machine-specific paths. The `project.assets.json` inside `obj/` contains absolute paths that will break other developers' builds.

7. **Always use file-scoped namespaces for all new C# 10+ code.** `namespace MyRepo.Core;` instead of `namespace MyRepo.Core { ... }` reduces indentation by one level for the entire file. Enforce this via `.editorconfig`: `csharp_style_namespace_declarations = file_scoped:error`.

8. **Never add `<GenerateAssemblyInfo>false</GenerateAssemblyInfo>` as a blanket workaround.** This property disables auto-generation of `AssemblyInfo.cs` attributes. It is sometimes used to fix conflicts with a legacy `AssemblyInfo.cs` file -- but the correct fix is to delete the legacy file, not to disable generation.

9. **Always use `<ArtifactsPath>` or an explicit output directory in CI** rather than relying on per-project `bin/` directories. This makes artifact collection in CI trivial and avoids hunting for outputs across subdirectories.

10. **Never mix SDK styles in the same solution.** A solution should not combine legacy non-SDK `.csproj` files (the verbose format from before .NET Core) with SDK-style projects. The two formats differ fundamentally in how they handle wildcards, transitive references, and implicit items. If a legacy project must remain, isolate it or migrate it.

---

## Edge Cases

### Multi-targeting for Library Compatibility

When a library must support both `net8.0` and `netstandard2.0` (for legacy consumers), use conditional compilation:

```xml
<TargetFrameworks>net8.0;net6.0;netstandard2.0</TargetFrameworks>
```

```csharp
#if NET8_0_OR_GREATER
    // Use System.Text.Json source generation
#elif NETSTANDARD2_0
    // Use Newtonsoft.Json fallback
#endif
```

Be aware that multi-targeting multiplies build time. A project with 3 target frameworks builds 3 times. In a solution with 10 such projects, build time is 30x the single-framework cost. Only multi-target when the library is genuinely consumed by diverse consumers.

### Projects That Must Opt Out of Global Properties

Some projects -- particularly generated code projects, scaffolded EF Core migration projects, or vendored third-party code -- cannot satisfy global constraints like `TreatWarningsAsErrors`. Override at the project level:

```xml
<PropertyGroup>
  <!-- This is generated code; global warning-as-error policy does not apply -->
  <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
  <NoWarn>$(NoWarn);CS1591;CS8618</NoWarn>
</PropertyGroup>
```

Alternatively, use a second `Directory.Build.props` placed inside the subdirectory containing these projects. MSBuild walks up the directory tree and stops at the first `Directory.Build.props` it finds -- so a nested file in `src/Generated/Directory.Build.props` can override the root file for only those projects.

### Native AOT and Trimming

When the target is a Native AOT executable (`.NET 8+`), the project must enable trimming-compatible code patterns:

```xml
<PropertyGroup>
  <PublishAot>true</PublishAot>
  <InvariantGlobalization>true</InvariantGlobalization>  <!-- reduces binary size -->
  <TrimmerRootDescriptor>TrimmerRoots.xml</TrimmerRootDescriptor>
</PropertyGroup>
```

AOT imposes significant constraints: no runtime reflection, no `dynamic`, no `Assembly.Load`. Dependencies must be AOT-compatible. Run `dotnet publish -r linux-x64 -c Release` early and often to catch trimming warnings before they accumulate.

### Enterprise Private NuGet Feed Without Internet Access

In air-gapped or enterprise environments where `nuget.org` is unreachable:

```xml
<!-- NuGet.Config -->
<packageSources>
  <clear />
  <add key="InternalFeed" value="https://artifacts.internal.corp/nuget/v3/index.json" />
</packageSources>
```

Also, set `NUGET_PACKAGES` environment variable in CI to a shared cache directory to avoid redundant downloads across agents. Use `dotnet restore --locked-mode` after an initial `dotnet restore` that generates `packages.lock.json` to guarantee package identity in CI.

### Incremental Migration from Legacy .csproj Format

When migrating a Visual Studio 2015-era `.csproj` file to SDK style:

1. Create a new SDK-style `.csproj` alongside the old one in a branch
2. Remove all `<Compile Include="...">` entries -- SDK style includes all `*.cs` files by default
3. Remove all `<Reference>` entries to BCL assemblies (System, System.Core, etc.) -- SDK style handles these via the target framework
4. Retain `<Reference>` entries for COM interop and non-NuGet assemblies
5. Migrate `packages.config` to `<PackageReference>` using `dotnet migrate` or the Visual Studio migration wizard
6. Delete `packages.config` and the `packages/` directory from the repository
7. Verify that no `AssemblyInfo.cs` attributes conflict with SDK-generated ones (`[assembly: AssemblyVersion]`, `[assembly: AssemblyTitle]`, etc.) -- either delete the file or set `<GenerateAssemblyVersionAttribute>false</GenerateAssemblyVersionAttribute>`

### NuGet Package Publishing Configuration

When a library project will be published to NuGet.org or a private feed, the `.csproj` must include package metadata:

```xml
<PropertyGroup>
  <IsPackable>true</IsPackable>
  <PackageId>Acme.MyRepo.Core</PackageId>
  <!-- Version set by CI, not here: dotnet pack -p:Version=1.2.3 -->
  <Description>Core abstractions for the MyRepo library.</Description>
  <PackageTags>acme;myrepo;core</PackageTags>
  <PackageLicenseExpression>MIT</PackageLicenseExpression>
  <PackageReadmeFile>README.md</PackageReadmeFile>
  <PackageProjectUrl>https://github.com/acme/myrepo</PackageProjectUrl>
  <IncludeSymbols>true</IncludeSymbols>
  <SymbolPackageFormat>snupkg</SymbolPackageFormat>
  <!-- SourceLink: embed source in symbols for debugger step-through -->
  <PublishRepositoryUrl>true</PublishRepositoryUrl>
  <EmbedUntrackedSources>true</EmbedUntrackedSources>
</PropertyGroup>

<ItemGroup>
  <None Include="../../README.md" Pack="true" PackagePath="/" />
  <PackageReference Include="Microsoft.SourceLink.GitHub" Version="8.0.0" PrivateAssets="All" />
</ItemGroup>
```

Set `<IsPackable>false</IsPackable>` explicitly on all test projects and sample projects to prevent accidental packaging.

---

## Example

**Input:** "I'm starting a new .NET 8 open-source library called `Conduit` that will be published to NuGet.org. It has a core abstractions project, an implementation project, and tests. I want strict nullable checking, centralized package management, and a clean project structure."

**Output:**

## Project Setup Recommendation

### Context Summary

| Dimension        | Assessment                                 |
|------------------|--------------------------------------------|
| Project type     | classlib (2 projects) + test project       |
| Target framework | net8.0 (LTS, suitable for OSS library)     |
| NuGet strategy   | Central Package Management (3 projects)    |
| Mono-repo        | No -- standalone library repository        |
| Publishing       | NuGet.org package + snupkg symbols         |

---

### Directory Structure

```
/Conduit
  global.json
  NuGet.Config
  Directory.Build.props
  Directory.Packages.props
  .editorconfig
  .gitignore
  Conduit.sln
  README.md
  /src
    /Conduit.Abstractions
      Conduit.Abstractions.csproj
      GlobalUsings.cs
      /Pipelines
        IPipeline.cs
    /Conduit.Core
      Conduit.Core.csproj
      GlobalUsings.cs
      /Pipelines
        Pipeline.cs
  /tests
    /Conduit.Core.Tests
      Conduit.Core.Tests.csproj
      GlobalUsings.cs
      /Pipelines
        PipelineTests.cs
```

---

### CLI Initialization Commands

```bash
# 1. Create repository directory and initialize solution
mkdir Conduit && cd Conduit
dotnet new sln -n Conduit

# 2. Create source projects
dotnet new classlib -n Conduit.Abstractions -o src/Conduit.Abstractions --framework net8.0
dotnet new classlib -n Conduit.Core -o src/Conduit.Core --framework net8.0

# 3. Create test project
dotnet new xunit -n Conduit.Core.Tests -o tests/Conduit.Core.Tests --framework net8.0

# 4. Add projects to solution with folder grouping
dotnet sln Conduit.sln add src/Conduit.Abstractions/Conduit.Abstractions.csproj --solution-folder src
dotnet sln Conduit.sln add src/Conduit.Core/Conduit.Core.csproj --solution-folder src
dotnet sln Conduit.sln add tests/Conduit.Core.Tests/Conduit.Core.Tests.csproj --solution-folder tests

# 5. Add project references
dotnet add src/Conduit.Core/Conduit.Core.csproj reference src/Conduit.Abstractions/Conduit.Abstractions.csproj
dotnet add tests/Conduit.Core.Tests/Conduit.Core.Tests.csproj reference src/Conduit.Core/Conduit.Core.csproj

# 6. Verify initial build
dotnet restore Conduit.sln
dotnet build Conduit.sln -c Release --no-restore
dotnet test Conduit.sln --no-build -c Release
```

---

### File Contents

#### global.json
```json
{
  "sdk": {
    "version": "8.0.401",
    "rollForward": "latestMinor",
    "allowPrerelease": false
  }
}
```

#### Directory.Build.props
```xml
<Project>

  <!-- Shared identity for all packages in this repository -->
  <PropertyGroup>
    <Product>Conduit</Product>
    <Authors>Conduit Contributors</Authors>
    <Company>Conduit OSS</Company>
    <Copyright>Copyright © Conduit Contributors</Copyright>
    <RepositoryUrl>https://github.com/acme/conduit</RepositoryUrl>
    <RepositoryType>git</RepositoryType>
  </PropertyGroup>

  <!-- Language settings applied to every project -->
  <PropertyGroup>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <AnalysisLevel>latest-recommended</AnalysisLevel>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
  </PropertyGroup>

  <!-- Deterministic builds in CI -->
  <PropertyGroup Condition="'$(CI)' == 'true'">
    <Deterministic>true</Deterministic>
    <ContinuousIntegrationBuild>true</ContinuousIntegrationBuild>
  </PropertyGroup>

  <!-- Consolidate all build output under /artifacts -->
  <PropertyGroup>
    <ArtifactsPath>$(MSBuildThisFileDirectory)artifacts</ArtifactsPath>
  </PropertyGroup>

  <!-- Test projects do not produce NuGet packages -->
  <PropertyGroup Condition="$(MSBuildProjectFullPath.Contains('tests'))">
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>

</Project>
```

#### Directory.Packages.props
```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>

  <!-- SourceLink for symbol packages -->
  <ItemGroup>
    <PackageVersion Include="Microsoft.SourceLink.GitHub" Version="8.0.0" />
  </ItemGroup>

  <!-- Test dependencies -->
  <ItemGroup Label="Test">
    <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.10.0" />
    <PackageVersion Include="xunit" Version="2.8.1" />
    <PackageVersion Include="xunit.runner.visualstudio" Version="2.8.1" />
    <PackageVersion Include="FluentAssertions" Version="6.12.0" />
    <PackageVersion Include="NSubstitute" Version="5.1.0" />
    <PackageVersion Include="coverlet.collector" Version="6.0.2" />
  </ItemGroup>
</Project>
```

#### NuGet.Config
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
  </packageSources>
  <packageSourceMapping>
    <packageSource key="nuget.org">
      <package pattern="*" />
    </packageSource>
  </packageSourceMapping>
</configuration>
```

#### .editorconfig
```ini
root = true

[*]
indent_style = space
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.{cs,csx}]
indent_size = 4

# Namespace style: file-scoped
csharp_style_namespace_declarations = file_scoped:error

# Braces always required
csharp_prefer_braces = true:error

# var usage
csharp_style_var_for_built_in_types = false:warning
csharp_style_var_when_type_is_apparent = true:suggestion
csharp_style_var_elsewhere = false:suggestion

# Expression bodies
csharp_style_expression_bodied_methods = when_on_single_line:suggestion
csharp_style_expression_bodied_properties = true:suggestion

# this. qualification
dotnet_style_qualification_for_field = false:error
dotnet_style_qualification_for_property = false:error
dotnet_style_qualification_for_method = false:error

# Nullable diagnostics as errors
dotnet_diagnostic.CS8600.severity = error
dotnet_diagnostic.CS8601.severity = error
dotnet_diagnostic.CS8602.severity = error
dotnet_diagnostic.CS8603.severity = error
dotnet_diagnostic.CS8618.severity = error
dotnet_diagnostic.CS8625.severity = error

# Suppressed: XML doc warnings on internal types -- OSS library only documents public API
dotnet_diagnostic.CS1591.severity = none

[*.{csproj,props,targets}]
indent_size = 2

[*.json]
indent_size = 2

[*.{yml,yaml}]
indent_size = 2
```

#### src/Conduit.Abstractions/Conduit.Abstractions.csproj
```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <IsPackable>true</IsPackable>
    <PackageId>Conduit.Abstractions</PackageId>
    <!-- Version is set by CI: dotnet pack -p:Version=$(VERSION) -->
    <Description>Core interfaces and abstractions for the Conduit pipeline library.</Description>
    <PackageTags>conduit;pipeline;abstractions;mediator</PackageTags>
    <PackageLicenseExpression>MIT</PackageLicenseExpression>
    <PackageReadmeFile>README.md</PackageReadmeFile>
    <PackageProjectUrl>https://github.com/acme/conduit</PackageProjectUrl>
    <IncludeSymbols>true</IncludeSymbols>
    <SymbolPackageFormat>snupkg</SymbolPackageFormat>
    <PublishRepositoryUrl>true</PublishRepositoryUrl>
    <EmbedUntrackedSources>true</EmbedUntrackedSources>
  </PropertyGroup>

  <ItemGroup>
    <None Include="..\..\README.md" Pack="true" PackagePath="/" />
    <!-- PrivateAssets=All: SourceLink is a build-time tool, not a runtime dep -->
    <PackageReference Include="Microsoft.SourceLink.GitHub" PrivateAssets="All" />
  </ItemGroup>

</Project>
```

#### src/Conduit.Core/Conduit.Core.csproj
```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <IsPackable>true</IsPackable>
    <PackageId>Conduit.Core</PackageId>
    <Description>Default pipeline implementation for the Conduit library.</Description>
    <PackageTags>conduit;pipeline;mediator</PackageTags>
    <PackageLicenseExpression>MIT</PackageLicenseExpression>
    <PackageReadmeFile>README.md</PackageReadmeFile>
    <PackageProjectUrl>https://github.com/acme/conduit</PackageProjectUrl>
    <IncludeSymbols>true</IncludeSymbols>
    <SymbolPackageFormat>snupkg</SymbolPackageFormat>
    <PublishRepositoryUrl>true</PublishRepositoryUrl>
    <EmbedUntrackedSources>true</EmbedUntrackedSources>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\Conduit.Abstractions\Conduit.Abstractions.csproj" />
    <None Include="..\..\README.md" Pack="true" PackagePath="/" />
    <PackageReference Include="Microsoft.SourceLink.GitHub" PrivateAssets="All" />
  </ItemGroup>

</Project>
```

#### tests/Conduit.Core.Tests/Conduit.Core.Tests.csproj
```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <!-- IsPackable=false inherited from Directory.Build.props for test projects -->
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\src\Conduit.Core\Conduit.Core.csproj" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
    <PackageReference Include="xunit" />
    <PackageReference Include="xunit.runner.visualstudio" />
    <PackageReference Include="FluentAssertions" />
    <PackageReference Include="NSubstitute" />
    <PackageReference Include="coverlet.collector">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>

</Project>
```

#### src/Conduit.Abstractions/GlobalUsings.cs
```csharp
// Global usings for Conduit.Abstractions
// System.* usings are provided by ImplicitUsings; add domain-specific usings here.
global using System.Threading;
global using System.Threading.Tasks;
```

---

### Decisions Log

| Decision                        | Choice                         | Rationale                                                                 |
|---------------------------------|--------------------------------|---------------------------------------------------------------------------|
| Target framework                | net8.0 only                    | LTS release; no .NET Framework consumers identified; avoids multi-target  |
| Nullable reference types        | enabled (error severity)       | OSS library must have airtight null safety before consumers depend on it  |
| Central Package Management      | enabled                        | 3 projects sharing test dependencies; prevents version drift              |
| TreatWarningsAsErrors           | true                           | Enforces nullable and analyzer compliance; required for quality OSS       |
| SourceLink                      | GitHub / snupkg                | Enables debugger step-through for library consumers without source access |
| File-scoped namespaces          | enforced via .editorconfig     | C# 10+ standard; reduces indentation; consistent with modern OSS projects |
| Version location                | CI-injected (`-p:Version=...`) | Prevents accidental publish of hardcoded version; enables GitVersion/MinVer|
| NuGet.Config with `<clear />`   | yes                            | Prevents implicit machine-level feed injection in CI environments         |
| EnforceCodeStyleInBuild         | true                           | .editorconfig violations become build errors, not silent IDE suggestions  |
| GenerateDocumentationFile       | true                           | Produces XML docs for IntelliSense in downstream consumers                |
