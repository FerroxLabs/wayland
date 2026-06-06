# Wayland Feature Development Specification Template

> This template is used to standardize how feature development requirements are described to AI, ensuring the AI accurately understands the task and follows project conventions.

---

## 1. Feature Overview

### 1.1 Basic Information

- **Feature Name**: [concise name]
- **Module**: [ ] Agent layer [ ] Conversation system [ ] Preview system [ ] Settings system [ ] Workspace [ ] Other
- **Processes involved**: [ ] Main process [ ] Renderer process [ ] WebServer [ ] Worker

### 1.2 Feature Description

[Describe the core purpose and value of the feature in 1–3 sentences]

### 1.3 User Scenario

```
Trigger: [how the user triggers this feature]
Flow:    [how the system responds]
Result:  [state after the feature completes]
```

### 1.4 Data Flow

| Direction | Data Type | Notes |
| --------- | --------- | ----- |
| Input     |           |       |
| Output    |           |       |

---

## 2. Development Standards

### 2.1 Technology Stack Constraints

- **Framework**: Electron 37 + React 19 + TypeScript 5.8
- **UI library**: Arco Design (@arco-design/web-react)
- **Icons**: Icon Park (@icon-park/react)
- **CSS**: UnoCSS atomic styles
- **State management**: React Context (AuthContext / ConversationContext / ThemeContext / LayoutContext)
- **IPC communication**: @office-ai/platform bridge system
- **Internationalization**: i18next + react-i18next
- **Database**: better-sqlite3

### 2.2 Naming Conventions

| Type             | Convention                  | Example                                         |
| ---------------- | --------------------------- | ----------------------------------------------- |
| React components | PascalCase                  | `MessageList.tsx`, `FilePreview.tsx`            |
| Hooks            | `use` prefix + PascalCase   | `useAutoScroll.ts`, `useColorScheme.ts`         |
| Bridge files     | FeatureName + Bridge        | `conversationBridge.ts`, `databaseBridge.ts`    |
| Service files    | FeatureName + Service       | `WebuiService.ts`                               |
| Interface types  | `I` prefix                  | `ICreateConversationParams`, `IResponseMessage` |
| Type aliases     | `T` prefix or direct name   | `TChatConversation`, `PresetAgentType`          |
| Constants        | UPPER_SNAKE_CASE            | `MAX_RETRY_COUNT`                               |
| Utility functions| camelCase                   | `formatMessage`, `parseResponse`                |

### 2.3 File Location Conventions

```
New files should be placed in the corresponding directory:

src/
├── agent/                        # AI agent implementations
│   ├── acp/                      # ACP protocol agent
│   ├── codex/                    # Codex agent
│   └── gemini/                   # Gemini agent
│
├── common/                       # Cross-process shared modules
│   ├── adapters/                 # API adapters
│   ├── types/                    # Shared type definitions
│   └── utils/                    # Shared utility functions
│
├── process/                      # Electron main process
│   ├── bridge/                   # IPC bridge definitions (24+)
│   ├── database/                 # SQLite database operations
│   ├── services/                 # Business logic services
│   └── task/                     # Task management
│
├── renderer/                     # React renderer process
│   ├── components/               # Reusable UI components
│   │   └── base/                 # Base components
│   ├── context/                  # React Context state
│   ├── hooks/                    # Custom hooks (31+)
│   ├── pages/                    # Page components
│   │   ├── conversation/         # Conversation page
│   │   │   ├── preview/          # Preview panel
│   │   │   └── workspace/        # Workspace
│   │   ├── settings/             # Settings pages (12+)
│   │   └── login/                # Login page
│   ├── messages/                 # Message rendering components
│   ├── i18n/locales/             # Internationalization text
│   ├── services/                 # Frontend services
│   └── utils/                    # Frontend utility functions
│
├── webserver/                    # Web server (WebUI mode)
│   ├── routes/                   # API routes
│   └── middleware/               # Middleware
│
├── worker/                       # Web Worker
│
└── types/                        # Global type definitions
```

### 2.4 Code Style (Prettier Configuration)

```json
{
  "semi": true,            // use semicolons
  "singleQuote": true,     // use single quotes
  "jsxSingleQuote": true,  // use single quotes in JSX
  "trailingComma": "es5",  // trailing commas where valid in ES5
  "tabWidth": 2,           // 2-space indentation
  "useTabs": false,        // no tabs
  "bracketSpacing": true,  // spaces inside object braces
  "arrowParens": "always", // always wrap arrow function parameters
  "endOfLine": "lf"        // Unix line endings
}
```

### 2.5 Quality Requirements

- [ ] Complete TypeScript types - avoid `any`
- [ ] Use the bridge system for IPC communication
- [ ] Implement error boundary handling
- [ ] Support internationalization (use i18next `t()` function)
- [ ] Compatible with dark and light themes
- [ ] Responsive layout support

### 2.6 Prohibited Practices

- ❌ Direct use of `ipcMain` / `ipcRenderer` - must go through the bridge system
- ❌ Accessing Node.js APIs directly in the renderer process
- ❌ Hardcoding text in any language - use i18n keys
- ❌ Inline styles - use UnoCSS class names
- ❌ Direct DOM manipulation in components - use React ref
- ❌ Suppressing TypeScript errors (`@ts-ignore`)

---

## 3. Implementation Architecture

### 3.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface (UI)                   │
│  React Components / Hooks / Context                     │
└─────────────────────┬───────────────────────────────────┘
                      │ IPC Bridge
┌─────────────────────▼───────────────────────────────────┐
│                   Main Process (Main)                    │
│  Bridge → Service → Database / External API             │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Data Layer (Data)                           │
│  SQLite / LocalStorage / External Services              │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Files to Modify / Add

**Main process (src/process/)**

| File path | Action              | Notes |
| --------- | ------------------- | ----- |
|           | [ ] Add / [ ] Modify |      |

**Renderer process (src/renderer/)**

| File path | Action              | Notes |
| --------- | ------------------- | ----- |
|           | [ ] Add / [ ] Modify |      |

**Shared modules (src/common/)**

| File path | Action              | Notes |
| --------- | ------------------- | ----- |
|           | [ ] Add / [ ] Modify |      |

**Type definitions (src/types/)**

| File path | Action              | Notes |
| --------- | ------------------- | ----- |
|           | [ ] Add / [ ] Modify |      |

### 3.3 IPC Communication Design

When adding a new IPC channel, follow this pattern:

```typescript
// src/process/bridge/[feature]Bridge.ts
import { bridge } from '@anthropic/platform';

export const [featureName] = {
  // Provider pattern: request-response (similar to HTTP requests)
  [methodName]: bridge.buildProvider<TResponse, TParams>('[channel-name]'),

  // Emitter pattern: event stream (for streaming data)
  [eventName]: bridge.buildEmitter<TData>('[channel-name].stream'),
};

// Usage examples:
// Renderer call:   const result = await [featureName].[methodName].request(params);
// Renderer listen: [featureName].[eventName].on((data) => { ... });
```

### 3.4 State Management Design

- [ ] Use existing Context: **\*\*\*\***\_\_\_\_**\*\*\*\***
- [ ] Need to add new Context: **\*\*\*\***\_\_\_\_**\*\*\*\***
- [ ] Component-local state only (useState/useReducer)
- [ ] Requires persistent storage

### 3.5 i18n Key Design

```json
// Add to src/renderer/i18n/locales/[lang].json
// Key naming convention: [module].[feature].[description]

{
  "conversation.export.title": "Export Conversation",
  "conversation.export.success": "Export successful",
  "conversation.export.error": "Export failed"
}
```

**Supported language files:**

- `zh-CN.json` - Simplified Chinese (required)
- `en-US.json` - English (required)
- `zh-TW.json` - Traditional Chinese
- `ja-JP.json` - Japanese
- `ko-KR.json` - Korean

---

## 4. Acceptance Criteria

### 4.1 Functional Acceptance

- [ ] [specific feature point 1]
- [ ] [specific feature point 2]
- [ ] [specific feature point 3]

### 4.2 Edge Cases

- [ ] [handling of edge case 1]
- [ ] [handling of edge case 2]

### 4.3 Compatibility Acceptance

- [ ] Runs correctly on macOS
- [ ] Runs correctly on Windows
- [ ] Displays correctly in dark mode
- [ ] Displays correctly in light mode
- [ ] Language switching works correctly

### 4.4 Code Quality

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] No TypeScript type errors
- [ ] No leftover `console.log` statements

---

## 5. Reference Material

### 5.1 Similar Feature References

[List similar existing implementations in the project for reference]

| Feature | File path | Notes |
| ------- | --------- | ----- |
|         |           |       |

### 5.2 Existing Modules Used

[List existing interfaces/components/hooks that need to be called]

| Module | Path | Purpose |
| ------ | ---- | ------- |
|        |      |         |

### 5.3 External Dependencies

[If new dependencies are required, list them and explain why]

| Package | Version | Purpose | Justification |
| ------- | ------- | ------- | ------------- |
|         |         |         |               |

### 5.4 Special Notes

[List any items that require special attention during implementation]

---

## Usage Example

Below is a complete feature requirements example:

```markdown
## 1. Feature Overview

### 1.1 Basic Information

- **Feature Name**: Export Conversation to PDF
- **Module**: [x] Conversation system
- **Processes involved**: [x] Main process [x] Renderer process

### 1.2 Feature Description

Allows users to export the current conversation as a PDF file, preserving message formatting, code highlighting, and images.

### 1.3 User Scenario

Trigger: User clicks the "Export" button in the top-right corner of the conversation page and selects "Export as PDF"
Flow:    System collects conversation content, renders it as HTML, and converts it to PDF
Result:  A save dialog appears; after the user selects a location, the PDF file is generated

### 3.2 Files to Modify / Add

**Main process (src/process/)**
| File path | Action | Notes |
|-----------|--------|-------|
| src/process/bridge/exportBridge.ts | [x] Add | PDF export IPC channel definition |
| src/process/services/ExportService.ts | [x] Add | PDF generation logic |

**Renderer process (src/renderer/)**
| File path | Action | Notes |
|-----------|--------|-------|
| src/renderer/pages/conversation/components/ChatHeader.tsx | [x] Modify | Add export dropdown menu |
| src/renderer/hooks/useExportPdf.ts | [x] Add | Export feature hook |

### 4.1 Functional Acceptance

- [ ] Clicking the export button shows the export options menu
- [ ] Selecting PDF opens a save dialog
- [ ] Generated PDF contains the full conversation content
- [ ] Code blocks retain syntax highlighting styles
- [ ] Images are correctly embedded in the PDF

### 5.1 Similar Feature References

| Feature         | File path                                                     | Notes                      |
| --------------- | ------------------------------------------------------------- | -------------------------- |
| Markdown export | src/renderer/hooks/useExportMarkdown.ts                       | Reference for export flow  |
| PDF preview     | src/renderer/pages/conversation/preview/PdfViewer.tsx         | Reference for PDF handling |
```

---

## Template Maintenance

- **Created**: 2025-01-27
- **Applies to**: Wayland v0.x+
- **Maintainer**: [project team]

To update this template, modify this file and notify team members.
