/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Tool category enum
export enum ToolCategory {
  EXECUTION = 'execution', // shell, bash, python, etc.
  FILE_OPS = 'file_ops', // read, write, edit, search files
  SEARCH = 'search', // various search methods
  ANALYSIS = 'analysis', // code analysis, chart generation
  COMMUNICATION = 'communication', // network requests, API calls
  CUSTOM = 'custom', // custom tools such as MCP tools
}

// Output format enum
export enum OutputFormat {
  TEXT = 'text',
  MARKDOWN = 'markdown',
  JSON = 'json',
  IMAGE = 'image',
  CHART = 'chart',
  DIAGRAM = 'diagram',
  TABLE = 'table',
}

// Renderer type enum
export enum RendererType {
  STANDARD = 'standard', // standard text rendering
  MARKDOWN = 'markdown', // Markdown rendering
  CODE = 'code', // syntax-highlighted code rendering
  CHART = 'chart', // chart rendering
  IMAGE = 'image', // image rendering
  INTERACTIVE = 'interactive', // interactive rendering
  COMPOSITE = 'composite', // composite rendering
}

// Tool availability configuration
export interface ToolAvailability {
  platforms: string[]; // ['darwin', 'linux', 'win32']
  requires?: string[]; // tools or services this depends on
  experimental?: boolean; // whether this is an experimental feature
}

// Tool capabilities configuration
export interface ToolCapabilities {
  supportsStreaming: boolean;
  supportsImages: boolean;
  supportsCharts: boolean;
  supportsMarkdown: boolean;
  supportsInteraction: boolean; // whether user interaction is required
  outputFormats: OutputFormat[];
}

// Renderer configuration
export interface ToolRenderer {
  type: RendererType;
  config: Record<string, unknown>;
}

// Tool definition interface
export interface ToolDefinition {
  id: string;
  name: string;
  displayNameKey: string; // i18n key for display name
  category: ToolCategory;
  priority: number; // priority; lower number means higher priority
  availability: ToolAvailability;
  capabilities: ToolCapabilities;
  renderer: ToolRenderer;
  icon?: string; // tool icon
  descriptionKey: string; // i18n key for description
  schema?: Record<string, unknown>; // tool schema
}

// MCP tool information
export interface McpToolInfo {
  name: string;
  serverName: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}
