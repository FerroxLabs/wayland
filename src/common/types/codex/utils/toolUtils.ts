/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Import values (enums) and types separately
import { CodexAgentEventType } from '../types/eventTypes';
import { ToolCategory, OutputFormat, RendererType } from '../types/toolTypes';
import type {
  EventDataMap,
  McpInvocation,
  McpToolInfo,
  ToolAvailability,
  ToolCapabilities,
  ToolDefinition,
  ToolRenderer,
} from '../types';

/** Translation function type, injected by the consumer (e.g. renderer) to avoid coupling common layer to renderer i18n */
export type TranslateFn = (key: string, params?: Record<string, string>) => string;

// Re-export enums (values) - these can be re-exported
export { ToolCategory, OutputFormat, RendererType };
// Re-export types for backward compatibility
export type {
  EventDataMap,
  McpInvocation,
  McpToolInfo,
  ToolAvailability,
  ToolCapabilities,
  ToolDefinition,
  ToolRenderer,
};

/**
 * Tool registry - responsible for managing registration, discovery, and resolution of all tools.
 */
export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();
  private mcpTools = new Map<string, ToolDefinition>();
  private eventTypeMapping = new Map<CodexAgentEventType, string[]>();

  constructor() {
    this.initializeBuiltinTools();
  }

  /**
   * Initialize built-in tools.
   */
  private initializeBuiltinTools() {
    // Shell execution tool
    this.registerBuiltinTool({
      id: 'shell_exec',
      name: 'Shell',
      displayNameKey: 'tools.shell.displayName',
      category: ToolCategory.EXECUTION,
      priority: 10,
      availability: {
        platforms: ['darwin', 'linux', 'win32'],
      },
      capabilities: {
        supportsStreaming: true,
        supportsImages: false,
        supportsCharts: false,
        supportsMarkdown: true,
        supportsInteraction: true,
        outputFormats: [OutputFormat.TEXT, OutputFormat.MARKDOWN],
      },
      renderer: {
        type: RendererType.STANDARD,
        config: { showTimestamp: true },
      },
      icon: '🔧',
      descriptionKey: 'tools.shell.description',
    });

    // File operations tool
    this.registerBuiltinTool({
      id: 'file_operations',
      name: 'FileOps',
      displayNameKey: 'tools.fileOps.displayName',
      category: ToolCategory.FILE_OPS,
      priority: 20,
      availability: {
        platforms: ['darwin', 'linux', 'win32'],
      },
      capabilities: {
        supportsStreaming: false,
        supportsImages: false,
        supportsCharts: false,
        supportsMarkdown: true,
        supportsInteraction: true,
        outputFormats: [OutputFormat.TEXT, OutputFormat.MARKDOWN],
      },
      renderer: {
        type: RendererType.CODE,
        config: { language: 'diff' },
      },
      icon: '📝',
      descriptionKey: 'tools.fileOps.description',
    });

    // Web search tool
    this.registerBuiltinTool({
      id: 'web_search',
      name: 'WebSearch',
      displayNameKey: 'tools.webSearch.displayName',
      category: ToolCategory.SEARCH,
      priority: 30,
      availability: {
        platforms: ['darwin', 'linux', 'win32'],
      },
      capabilities: {
        supportsStreaming: false,
        supportsImages: true,
        supportsCharts: false,
        supportsMarkdown: true,
        supportsInteraction: false,
        outputFormats: [OutputFormat.TEXT, OutputFormat.MARKDOWN],
      },
      renderer: {
        type: RendererType.MARKDOWN,
        config: { showSources: true },
      },
      icon: '🔍',
      descriptionKey: 'tools.webSearch.description',
    });

    // Set up event-type mappings
    this.eventTypeMapping.set(CodexAgentEventType.EXEC_COMMAND_BEGIN, ['shell_exec']);
    this.eventTypeMapping.set(CodexAgentEventType.EXEC_COMMAND_OUTPUT_DELTA, ['shell_exec']);
    this.eventTypeMapping.set(CodexAgentEventType.EXEC_COMMAND_END, ['shell_exec']);
    this.eventTypeMapping.set(CodexAgentEventType.APPLY_PATCH_APPROVAL_REQUEST, ['file_operations']);
    this.eventTypeMapping.set(CodexAgentEventType.PATCH_APPLY_BEGIN, ['file_operations']);
    this.eventTypeMapping.set(CodexAgentEventType.PATCH_APPLY_END, ['file_operations']);
    this.eventTypeMapping.set(CodexAgentEventType.WEB_SEARCH_BEGIN, ['web_search']);
    this.eventTypeMapping.set(CodexAgentEventType.WEB_SEARCH_END, ['web_search']);
  }

  /**
   * Register a built-in tool.
   */
  registerBuiltinTool(tool: ToolDefinition) {
    this.tools.set(tool.id, tool);
  }

  /**
   * Register an MCP tool.
   */
  registerMcpTool(mcpTool: McpToolInfo) {
    const toolDef = this.adaptMcpTool(mcpTool);
    this.mcpTools.set(toolDef.id, toolDef);
  }

  /**
   * Adapt an MCP tool into a standard ToolDefinition.
   */
  private adaptMcpTool(mcpTool: McpToolInfo): ToolDefinition {
    const fullyQualifiedName = `${mcpTool.serverName}/${mcpTool.name}`;

    return {
      id: fullyQualifiedName,
      name: mcpTool.name,
      displayNameKey: `tools.mcp.${mcpTool.serverName}.${mcpTool.name}.displayName`,
      category: this.inferCategory(mcpTool),
      priority: 100, // MCP tools have lower priority
      availability: {
        platforms: ['darwin', 'linux', 'win32'],
        experimental: true,
      },
      capabilities: this.inferCapabilities(mcpTool.inputSchema),
      renderer: this.selectRenderer(mcpTool),
      icon: this.getIconForCategory(this.inferCategory(mcpTool)),
      descriptionKey: `tools.mcp.${mcpTool.serverName}.${mcpTool.name}.description`,
      schema: mcpTool.inputSchema,
    };
  }

  /**
   * Infer the tool category from the MCP tool metadata.
   */
  private inferCategory(mcpTool: McpToolInfo): ToolCategory {
    const name = mcpTool.name.toLowerCase();
    const description = mcpTool.description?.toLowerCase() || '';

    if (name.includes('search') || name.includes('find') || name.includes('query') || description.includes('search')) {
      return ToolCategory.SEARCH;
    }
    if (name.includes('file') || name.includes('read') || name.includes('write') || name.includes('edit')) {
      return ToolCategory.FILE_OPS;
    }
    if (name.includes('exec') || name.includes('run') || name.includes('command') || name.includes('shell')) {
      return ToolCategory.EXECUTION;
    }
    if (name.includes('chart') || name.includes('plot') || name.includes('analyze') || name.includes('graph')) {
      return ToolCategory.ANALYSIS;
    }
    if (name.includes('http') || name.includes('api') || name.includes('request') || name.includes('fetch')) {
      return ToolCategory.COMMUNICATION;
    }

    return ToolCategory.CUSTOM;
  }

  /**
   * Infer tool capabilities from the input schema.
   */
  private inferCapabilities(inputSchema?: Record<string, unknown>): ToolCapabilities {
    // Infer capabilities from the schema
    const properties = inputSchema?.properties as Record<string, unknown> | undefined;
    const hasStreamParam = properties?.stream !== undefined;
    const hasImageParam = properties?.image !== undefined || properties?.img !== undefined;

    return {
      supportsStreaming: hasStreamParam,
      supportsImages: hasImageParam,
      supportsCharts: false, // charts not supported by default
      supportsMarkdown: true, // markdown supported by default
      supportsInteraction: true, // interaction supported by default
      outputFormats: [OutputFormat.TEXT, OutputFormat.MARKDOWN],
    };
  }

  /**
   * Select an appropriate renderer for the given MCP tool.
   */
  private selectRenderer(mcpTool: McpToolInfo): ToolRenderer {
    const category = this.inferCategory(mcpTool);

    switch (category) {
      case ToolCategory.FILE_OPS:
        return { type: RendererType.CODE, config: {} };
      case ToolCategory.ANALYSIS:
        return { type: RendererType.CHART, config: {} };
      case ToolCategory.SEARCH:
        return { type: RendererType.MARKDOWN, config: {} };
      default:
        return { type: RendererType.STANDARD, config: {} };
    }
  }

  /**
   * Get the icon for a given tool category.
   */
  private getIconForCategory(category: ToolCategory): string {
    switch (category) {
      case ToolCategory.EXECUTION:
        return '🔧';
      case ToolCategory.FILE_OPS:
        return '📝';
      case ToolCategory.SEARCH:
        return '🔍';
      case ToolCategory.ANALYSIS:
        return '📊';
      case ToolCategory.COMMUNICATION:
        return '🌐';
      case ToolCategory.CUSTOM:
        return '🔌';
      default:
        return '❓';
    }
  }

  /**
   * Resolve the corresponding tool for a given event type and event data.
   */
  resolveToolForEvent(
    eventType: CodexAgentEventType,
    eventData?: EventDataMap[keyof EventDataMap]
  ): ToolDefinition | null {
    // 1. Special handling for MCP tool call events
    if (eventType === CodexAgentEventType.MCP_TOOL_CALL_BEGIN || eventType === CodexAgentEventType.MCP_TOOL_CALL_END) {
      const mcpData = eventData as EventDataMap[CodexAgentEventType.MCP_TOOL_CALL_BEGIN];
      if (mcpData?.invocation) {
        const toolId = this.inferMcpToolId(mcpData.invocation);
        const mcpTool = this.mcpTools.get(toolId);
        if (mcpTool) return mcpTool;
      }

      // If no specific MCP tool is found, fall back to a generic MCP tool
      return this.createGenericMcpTool(mcpData?.invocation);
    }

    // 2. Direct mapping based on event type
    const candidateIds = this.eventTypeMapping.get(eventType) || [];

    // 3. Select the best match based on priority
    const availableTools = candidateIds
      .map((id) => this.tools.get(id) || this.mcpTools.get(id))
      .filter(Boolean)
      .filter((tool) => this.isToolAvailable(tool!))
      .toSorted((a, b) => a!.priority - b!.priority);

    return availableTools[0] || this.getDefaultTool(eventType);
  }

  /**
   * Infer the tool ID from an MCP invocation.
   */
  private inferMcpToolId(invocation: McpInvocation): string {
    // Try to extract the method name from the invocation
    const method = this.extractMethodFromInvocation(invocation);
    if (!method) return '';

    // Try to match a registered MCP tool
    for (const [toolId, tool] of this.mcpTools) {
      if (toolId.endsWith(`/${method}`) || tool.name === method) {
        return toolId;
      }
    }

    return '';
  }

  /**
   * Extract the method name from an MCP invocation.
   */
  private extractMethodFromInvocation(invocation: McpInvocation): string {
    // Extract the method name based on the actual McpInvocation type structure.
    // The implementation follows the concrete type definition.
    if ('method' in invocation && typeof invocation.method === 'string') {
      return invocation.method;
    }
    if ('name' in invocation && typeof invocation.name === 'string') {
      return invocation.name;
    }
    return '';
  }

  /**
   * Create a generic MCP tool definition.
   */
  private createGenericMcpTool(invocation?: McpInvocation): ToolDefinition {
    const method = invocation ? this.extractMethodFromInvocation(invocation) || 'McpTool' : 'McpTool';

    return {
      id: `generic_mcp_${method}`,
      name: method,
      displayNameKey: 'tools.mcp.generic.displayName',
      category: ToolCategory.CUSTOM,
      priority: 200,
      availability: {
        platforms: ['darwin', 'linux', 'win32'],
        experimental: true,
      },
      capabilities: {
        supportsStreaming: false,
        supportsImages: true,
        supportsCharts: true,
        supportsMarkdown: true,
        supportsInteraction: false,
        outputFormats: [OutputFormat.TEXT, OutputFormat.MARKDOWN, OutputFormat.JSON],
      },
      renderer: {
        type: RendererType.STANDARD,
        config: {},
      },
      icon: '🔌',
      descriptionKey: 'tools.mcp.generic.description',
    };
  }

  /**
   * Check whether a tool is available on the current platform.
   */
  private isToolAvailable(tool: ToolDefinition): boolean {
    const currentPlatform = process.platform;
    return tool.availability.platforms.includes(currentPlatform);
  }

  /**
   * Get the default fallback tool for an unrecognized event type.
   */
  private getDefaultTool(eventType: CodexAgentEventType): ToolDefinition {
    return {
      id: 'unknown',
      name: 'Unknown',
      displayNameKey: 'tools.unknown.displayName',
      category: ToolCategory.CUSTOM,
      priority: 999,
      availability: {
        platforms: ['darwin', 'linux', 'win32'],
      },
      capabilities: {
        supportsStreaming: false,
        supportsImages: false,
        supportsCharts: false,
        supportsMarkdown: false,
        supportsInteraction: false,
        outputFormats: [OutputFormat.TEXT],
      },
      renderer: {
        type: RendererType.STANDARD,
        config: {},
      },
      icon: '❓',
      descriptionKey: 'tools.unknown.description',
    };
  }

  /**
   * Get all registered tools (built-in and MCP).
   */
  getAllTools(): ToolDefinition[] {
    return [...Array.from(this.tools.values()), ...Array.from(this.mcpTools.values())];
  }

  /**
   * Get all tools belonging to a given category.
   */
  getToolsByCategory(category: ToolCategory): ToolDefinition[] {
    return this.getAllTools().filter((tool) => tool.category === category);
  }

  /**
   * Get a tool definition by ID.
   */
  getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id) || this.mcpTools.get(id);
  }

  /**
   * Get the localized display name of a tool.
   * Pass a `t` function (e.g. from i18next) to enable translation;
   * omit it to fall back to the raw tool name.
   */
  getToolDisplayName(tool: ToolDefinition, fallbackParams?: Record<string, string>, t?: TranslateFn): string {
    if (t) {
      try {
        return t(tool.displayNameKey, fallbackParams || {});
      } catch {
        // fall through to fallback
      }
    }
    return tool.name;
  }

  /**
   * Get the localized description of a tool.
   * Pass a `t` function (e.g. from i18next) to enable translation;
   * omit it to fall back to a generic description.
   */
  getToolDescription(tool: ToolDefinition, fallbackParams?: Record<string, string>, t?: TranslateFn): string {
    if (t) {
      try {
        return t(tool.descriptionKey, fallbackParams || {});
      } catch {
        // fall through to fallback
      }
    }
    return `Tool: ${tool.name}`;
  }

  /**
   * Generate i18n interpolation parameters for an MCP tool.
   */
  getMcpToolI18nParams(tool: ToolDefinition): Record<string, string> {
    if (tool.id.includes('/')) {
      const [serverName, toolName] = tool.id.split('/');
      return { toolName, serverName };
    }
    return { toolName: tool.name };
  }
}
