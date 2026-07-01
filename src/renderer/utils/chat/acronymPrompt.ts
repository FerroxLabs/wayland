const WL_SENDBOX_ACRONYM_PROMPT_MARKER =
  '__WL_SENDBOX_ACRONYM_PROMPT_PATCH__ __WL_EXPAND_ACRONYM_PROMPT__?window.__WL_EXPAND_ACRONYM_PROMPT__(';

type WindowWithAcronymPrompt = Window & {
  __WL_SENDBOX_ACRONYM_PROMPT_PATCH__?: string;
  __WL_EXPAND_ACRONYM_PROMPT__?: (value: string) => string;
};

export type ComposerAcronym = {
  acronym: string;
  expansion: string;
  description?: string;
  enabled?: boolean;
};

export function installAcronymPromptMarker(): void {
  if (typeof window === 'undefined') {
    return;
  }
  (window as WindowWithAcronymPrompt).__WL_SENDBOX_ACRONYM_PROMPT_PATCH__ = WL_SENDBOX_ACRONYM_PROMPT_MARKER;
}

export function expandHiddenAcronymPrompt(input: string): string {
  if (typeof window === 'undefined') {
    return input;
  }
  const expander = (window as WindowWithAcronymPrompt).__WL_EXPAND_ACRONYM_PROMPT__;
  return typeof expander === 'function' ? expander(input) : input;
}

export function expandExtensionAcronymPrompt(input: string, acronyms: readonly ComposerAcronym[]): string {
  const token = input.trim();
  if (!token || token.includes(' ') || token.includes('\n')) {
    return input;
  }

  const match = acronyms.find((item) => item.enabled !== false && item.acronym.toLowerCase() === token.toLowerCase());
  if (!match) {
    return input;
  }

  const description = match.description?.trim();
  return description ? `${match.expansion.trim()}\n\n${description}` : match.expansion.trim();
}

export function installExtensionAcronymPrompt(acronyms: readonly ComposerAcronym[]): void {
  installAcronymPromptMarker();
  if (typeof window === 'undefined') {
    return;
  }

  const previous = (window as WindowWithAcronymPrompt).__WL_EXPAND_ACRONYM_PROMPT__;
  (window as WindowWithAcronymPrompt).__WL_EXPAND_ACRONYM_PROMPT__ = (value: string) => {
    const expandedByExtension = expandExtensionAcronymPrompt(value, acronyms);
    if (expandedByExtension !== value) {
      return expandedByExtension;
    }
    return typeof previous === 'function' ? previous(value) : value;
  };
}
