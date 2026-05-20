---
name: docs-site-builder
description: |
  Expert guidance for building documentation sites with Docusaurus, MkDocs, and VitePress, covering setup, customization, content organization, search, versioning, and deployment.
  Use when the user asks about docs site builder, docs site builder best practices, or needs guidance on docs site builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
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

# Docs Site Builder

You are an expert documentation site builder who creates professional, searchable, and maintainable documentation platforms. You guide teams through selecting the right static site generator for their docs, structuring content for discoverability, customizing themes, configuring search and versioning, and deploying documentation alongside code. You specialize in Docusaurus, MkDocs (Material theme), and VitePress.

## Tool Selection Matrix

| Factor | Docusaurus | MkDocs Material | VitePress |
|---|---|---|---|
| Language ecosystem | JavaScript/React | Python | JavaScript/Vue |
| Best for | Product docs + blog | Technical docs, API refs | Library docs, lightweight |
| Customization | React components | Jinja2 templates, CSS | Vue components |
| Search | Algolia, local plugin | Built-in (lunr), Algolia | Built-in (MiniSearch) |
| Versioning | Built-in | mike plugin | Manual (branches) |
| i18n | Built-in | Plugin-based | Built-in |
| MDX support | Native | No (Markdown extensions) | Native |
| Build speed | Moderate | Fast | Very fast |
| Plugin ecosystem | Growing | Extensive | Growing |
| Learning curve | Medium (React) | Low (YAML + Markdown) | Low-Medium (Vue) |

### Quick Decision Guide

- **Choose Docusaurus** when: You need versioned docs + blog, your team knows React, you want MDX components.
- **Choose MkDocs Material** when: You want the fastest setup, Python ecosystem, excellent search out of the box.
- **Choose VitePress** when: You need the fastest build, Vue ecosystem, lightweight library documentation.

## Docusaurus Setup and Configuration

### Project Setup

```shell
npx create-docusaurus@latest my-docs classic --typescript
```

### Configuration

```typescript
// docusaurus.config.ts
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Product Name',
  tagline: 'Clear tagline explaining the product',
  url: '[reference URL]',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'your-org',
  projectName: 'your-project',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: '[reference URL]',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
          versions: {
            current: { label: 'Next', path: 'next', banner: 'unreleased' },
          },
        },
        blog: {
          showReadingTime: true,
          blogSidebarCount: 10,
          editUrl: '[reference URL]',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    navbar: {
      title: 'Product Name',
      logo: { alt: 'Logo', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Docs' },
        { to: '/blog', label: 'Blog', position: 'left' },
        { type: 'docsVersionDropdown', position: 'right' },
        {
          href: '[reference URL]',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/docs/getting-started' },
            { label: 'API Reference', to: '/docs/api' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'Discord', href: '[reference URL]' },
            { label: 'Discussions', href: '[reference URL]' },
          ],
        },
      ],
    },
    prism: {
      theme: require('prism-react-renderer').themes.github,
      darkTheme: require('prism-react-renderer').themes.dracula,
      additionalLanguages: ['shell', 'json', 'yaml', 'toml'],
    },
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'your_index',
      contextualSearch: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
```

### Sidebar Configuration

```typescript
// sidebars.ts
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'introduction',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/configuration',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/authentication',
        'guides/data-fetching',
        'guides/deployment',
        {
          type: 'category',
          label: 'Advanced',
          items: ['guides/advanced/plugins', 'guides/advanced/performance'],
        },
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      link: { type: 'generated-index', title: 'API Reference' },
      items: [{ type: 'autogenerated', dirName: 'api' }],
    },
  ],
};

export default sidebars;
```

### Custom MDX Components

```tsx
// src/components/Callout.tsx
import React from 'react';

type CalloutType = 'info' | 'warning' | 'danger' | 'tip';

export function Callout({ type = 'info', title, children }: {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`callout callout--${type}`}>
      {title && <div className="callout__title">{title}</div>}
      <div className="callout__body">{children}</div>
    </div>
  );
}

// Usage in MDX:
// import { Callout } from '@site/src/components/Callout';
// <Callout type="warning" title="Breaking Change"> .//   The API signature changed in v3.0.
// </Callout>
```

### Versioning Commands

```shell
# Tag current docs as version 2.0
npm run docusaurus docs:version 2.0

# Result: versioned_docs/version-2.0/ created with snapshot
# Current docs/ folder continues as "next" version
```

## MkDocs Material Setup and Configuration

### Project Setup

```shell
install via pip: mkdocs-material mkdocs-minify-plugin mkdocs-git-revision-date-localized-plugin
mkdocs new my-docs
```

### Key Configuration Areas

In `mkdocs.yml`, configure these essential sections:

- **theme**: Set `name: material` with features like `navigation.tabs`, `search.suggest`, `content.code.copy`, and dark/light palette toggle.
- **plugins**: Enable `search`, `minify`, and `git-revision-date-localized` for timestamps.
- **markdown_extensions**: Essential extensions include `admonition`, `pymdownx.superfences` (with Mermaid fences), `pymdownx.tabbed`, `pymdownx.highlight`, `pymdownx.snippets`, `attr_list`, and `toc`.
- **nav**: Define your navigation tree mapping sections to markdown files.
- **extra.version**: Set `provider: mike` for versioning support.

### MkDocs Content Features

- **Admonitions**: `!!! note "Title"` for callouts; `??? tip` for collapsible
- **Content tabs**: `=== "npm"` / `=== "yarn"` for package manager alternatives
- **Code annotations**: `# (1)!` inline, with numbered explanations below
- **Mermaid**: Native rendering via `pymdownx.superfences` custom fence

### Versioning with mike

```shell
# Deploy version 1.0 with alias "stable"
mike deploy 1.0 stable --push

# Deploy version 2.0 as latest
mike deploy 2.0 latest --push

# Set default version
mike set-default stable --push

# List deployed versions
mike list
```

## VitePress Setup and Configuration

### Project Setup

```shell
npm add -D vitepress
npx vitepress init
```

### Key Configuration Areas

In `.vitepress/config.ts`, configure with `defineConfig()`:

- **themeConfig.nav**: Top navigation with `text`, `link`, `activeMatch`, version dropdowns via `items` array.
- **themeConfig.sidebar**: Object keyed by path prefix (`'/guide/'`, `'/api/'`), each containing grouped items with `text`, `items`, and optional `collapsed`.
- **themeConfig.search**: Set `provider: 'local'` for built-in MiniSearch or configure Algolia.
- **themeConfig.editLink**: Pattern with `:path` placeholder pointing to your repo.
- **themeConfig.socialLinks**: Array of `{ icon, link }` for GitHub, Discord, etc.
- **markdown**: Configure `lineNumbers`, `theme` (light/dark), and custom containers.

VitePress supports custom Vue components in markdown via `<script setup>` blocks. Create components in `.vitepress/theme/components/` and import them directly in any `.md` file.

## Content Organization Best Practices

### Information Architecture Pattern

```
docs/
  index.md                    # Landing page with quick links
  getting-started/
    index.md                  # Overview of getting started
    installation.md           # Step-by-step installation
    quick-start.md            # 5-minute tutorial
    configuration.md          # Configuration reference
  guides/
    index.md                  # Guide overview / catalog
    authentication.md         # Task-oriented guide
    data-fetching.md
    deployment.md
    troubleshooting.md        # Common issues and solutions
  api/
    index.md                  # API overview
    rest.md                   # REST endpoint reference
    sdk.md                    # SDK method reference
    errors.md                 # Error code reference
  concepts/
    architecture.md           # System architecture explanation
    data-model.md             # Data model documentation
    security.md               # Security model
  migration/
    v2-to-v3.md              # Version migration guides
  contributing.md             # Contribution guidelines
  changelog.md               # Release notes
```

### Content Type Guidelines

| Content Type | Purpose | Structure |
|---|---|---|
| Tutorial | Learning-oriented, step-by-step | Numbered steps, expected output at each step |
| How-To Guide | Task-oriented, solves specific problem | Prerequisites, steps, verification |
| Reference | Information-oriented, complete and accurate | Tables, parameter lists, exhaustive |
| Explanation | Understanding-oriented, background context | Diagrams, comparisons, rationale |

## Deployment Patterns

### GitHub Pages Deployment

```yaml
# .github/workflows/docs.yml
name: Deploy Docs
on:
  push:
    branches: [main]
    paths: ['docs/**', '.github/workflows/docs.yml']

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          get-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run docs:build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

All three tools also deploy to **Netlify** (via `netlify.toml`) and **Vercel** (via `vercel.json`). Configure build command, output directory, redirects, and cache headers for static assets.

### Search

- **Docusaurus/VitePress**: Apply for free Algolia DocSearch at `docsearch.algolia.com/apply`, then add `appId`, `apiKey`, and `indexName` to config.
- **MkDocs Material**: Built-in search works out of the box with lunr.js. Enable `search.suggest` and `search.highlight` features.
- **VitePress local search**: Configure `search.provider: 'local'` with MiniSearch options for fuzzy matching and field boosting.

## Documentation Site Checklist

- [ ] Landing page clearly explains what the product does and who it is for
- [ ] Getting started guide works end-to-end in under 10 minutes
- [ ] Search is configured and returns relevant results
- [ ] Navigation has no more than 5-7 top-level sections
- [ ] Code examples are copy-pasteable and tested
- [ ] Dark mode is supported and tested
- [ ] Edit links point to the correct repository and branch
- [ ] Last-updated timestamps are shown on each page
- [ ] 404 page is configured with helpful navigation
- [ ] Social/Open Graph meta tags are set for link previews
- [ ] Broken link checking runs in CI
- [ ] Docs deploy automatically on merge to main
- [ ] Version dropdown works and links to correct version
- [ ] Mobile responsive layout is tested
- [ ] Accessibility: heading hierarchy, alt text, keyboard navigation

## When to Use

**Use this skill when:**
- Designing or implementing docs site builder solutions
- Reviewing or improving existing docs site builder approaches
- Making architectural or implementation decisions about docs site builder
- Learning docs site builder patterns and best practices
- Troubleshooting docs site builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Docs Site Builder Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement docs site builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended docs site builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When docs site builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
