/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TProviderWithModel } from '@/common/config/storage';
import { getPlatformServices } from '@/common/platform';
import { uuid } from '@/common/utils';
import type { GeminiClient } from '@office-ai/aioncli-core';
import { AuthType, Config } from '@office-ai/aioncli-core';
import { mkdirSync } from 'fs';
import path from 'path';
import { WebFetchTool } from './web-fetch';
import { WebSearchTool } from './web-search';

interface ConversationToolConfigOptions {
  proxy: string;
  webSearchEngine?: 'google' | 'default';
}

const getGeminiWebSearchRuntimeDir = () => {
  const dataDir = getPlatformServices().paths.getDataDir();
  return path.join(dataDir, 'runtime', 'gemini-websearch');
};

/**
 * Conversation-level tool configuration.
 * Similar to the working-directory mechanism: determined when the conversation
 * is created and unchanged for the lifetime of the conversation.
 */
export class ConversationToolConfig {
  private useGeminiWebSearch = false;
  private useWaylandWebFetch = false;
  private geminiModel: TProviderWithModel | null = null;
  private excludeTools: string[] = [];
  private dedicatedGeminiClient: GeminiClient | null = null; // Cached dedicated Gemini client
  private dedicatedConfig: Config | null = null; // Cached dedicated Config (used for OAuth authentication)
  private webSearchEngine: 'google' | 'default' = 'default';
  private proxy: string = '';
  constructor(options: ConversationToolConfigOptions) {
    this.proxy = options.proxy;
    this.webSearchEngine = options.webSearchEngine ?? 'default';
  }

  /**
   * Decide the tool configuration when the conversation is created
   * (similar to the workspace selection mechanism).
   * @param authType Authentication type (platform type)
   */
  async initializeForConversation(authType: AuthType): Promise<void> {
    // All models use wayland_web_fetch to replace the built-in web_fetch
    this.useWaylandWebFetch = true;
    this.excludeTools.push('web_fetch');

    // Pick the search tool based on the webSearchEngine setting.
    // gemini_web_search can only be used with Google OAuth auth, as it requires creating a Google OAuth client
    if (this.webSearchEngine === 'google') {
      if (authType === AuthType.LOGIN_WITH_GOOGLE || authType === AuthType.USE_VERTEX_AI) {
        // Only enable gemini_web_search for Google OAuth authentication
        this.useGeminiWebSearch = true;
        this.excludeTools.push('google_web_search'); // Exclude the built-in Google search
      } else {
        // For all non-Google OAuth auth types (USE_OPENAI, USE_GEMINI, USE_ANTHROPIC, etc.),
        // don't enable gemini_web_search as it attempts to create a dedicated Google OAuth client
        this.useGeminiWebSearch = false;
      }
    }
    // When webSearchEngine === 'default', don't enable Google search (useGeminiWebSearch stays false)
  }

  /**
   * Find the best available Gemini model
   */
  private async findBestGeminiModel(): Promise<TProviderWithModel | null> {
    try {
      // The frontend has already confirmed the auth status via the webSearchEngine parameter
      const hasGoogleAuth = this.webSearchEngine === 'google';
      if (hasGoogleAuth) {
        return {
          id: uuid(),
          name: 'Gemini Google Auth',
          platform: 'gemini-with-google-auth',
          baseUrl: '',
          apiKey: '',
          useModel: 'gemini-2.5-flash',
        };
      }

      return null;
    } catch (error) {
      console.error('[ConversationTools] Error finding Gemini model:', error);
      return null;
    }
  }

  /**
   * Create the dedicated Gemini config
   */
  private createDedicatedGeminiConfig(geminiModel: TProviderWithModel): Config {
    const runtimeDir = getGeminiWebSearchRuntimeDir();

    mkdirSync(runtimeDir, { recursive: true });

    // Create a minimal config used only for Gemini WebSearch
    return new Config({
      sessionId: 'gemini-websearch-' + Date.now(),
      // Keep Gemini tool sessions out of the repository tree so Bun does not
      // scan source and node_modules. Use the platform data directory so the
      // runtime location is stable across Electron and standalone server modes.
      targetDir: runtimeDir,
      cwd: runtimeDir,
      debugMode: false,
      question: '',
      // The fullContext parameter was removed in aioncli-core v0.18.4
      userMemory: '',
      geminiMdFileCount: 0,
      model: geminiModel.useModel,
    });
  }

  /**
   * Get the tool configuration for the current conversation
   */
  getConfig() {
    return {
      useGeminiWebSearch: this.useGeminiWebSearch,
      useWaylandWebFetch: this.useWaylandWebFetch,
      geminiModel: this.geminiModel,
      excludeTools: this.excludeTools,
    };
  }

  /**
   * Register custom tools for the given Config.
   * Called after the conversation is initialized.
   */
  async registerCustomTools(config: Config, geminiClient: GeminiClient): Promise<void> {
    const toolRegistry = await config.getToolRegistry();

    // Register the wayland_web_fetch tool (all models)
    if (this.useWaylandWebFetch) {
      const customWebFetchTool = new WebFetchTool(geminiClient, config.getMessageBus());
      toolRegistry.registerTool(customWebFetchTool);
    }

    // Register the gemini_web_search tool (OpenAI models only)
    if (this.useGeminiWebSearch) {
      try {
        // Frontend already confirmed auth status via webSearchEngine; create the client directly.
        // Create a dedicated Config (if not present)
        if (!this.dedicatedConfig) {
          const geminiModel = await this.findBestGeminiModel();
          if (geminiModel) {
            this.geminiModel = geminiModel;
            this.dedicatedConfig = this.createDedicatedGeminiConfig(geminiModel);
            const authType = AuthType.LOGIN_WITH_GOOGLE; // Always use Google auth

            await this.dedicatedConfig.initialize();
            await this.dedicatedConfig.refreshAuth(authType);

            // Create a new GeminiClient (used to check auth status)
            this.dedicatedGeminiClient = this.dedicatedConfig.getGeminiClient();
          }
        }

        // Only register the tool when the Config was successfully created
        if (this.dedicatedConfig && this.dedicatedGeminiClient) {
          const customWebSearchTool = new WebSearchTool(this.dedicatedConfig, this.dedicatedConfig.getMessageBus());
          toolRegistry.registerTool(customWebSearchTool);
        }
        // When Google is not logged in, skip silently without affecting other tools
      } catch (error) {
        console.warn('Failed to register gemini_web_search tool:', error);
        // Errors must not affect registration of other tools
      }
    }

    // Sync tools to the model client
    await geminiClient.setTools();
  }
}
