/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Intent map for the new-chat starter surface.
 *
 * Phase 2 of the chat-redesign replaces the flat 43-pill grid with a layered
 * IA tied to user intent. Each of the 5 intents exposes 5 starter prompts,
 * and each prompt routes to a specific built-in preset or extension-bundled
 * assistant via `selectPresetAssistant` (the Rory rule from Phase 1).
 *
 * Every `targetAssistantId` here must resolve against either
 * `ASSISTANT_PRESETS` (21 built-ins) or the extension bundle's
 * `contributes/assistants.json` (44 entries). The unit test in
 * `tests/unit/renderer/guid/intents.test.ts` enforces shape + id integrity.
 */

export type IntentKey = 'sell' | 'write' | 'research' | 'build' | 'run' | 'plan' | 'learn';

export type IntentPrompt = {
  /** Short user-facing title shown as the row heading. */
  title: string;
  /** Full prompt text that populates the chat input on click. */
  promptText: string;
  /** Preset/bundle assistant id used by `selectPresetAssistant`. */
  targetAssistantId: string;
};

export type IntentDef = {
  /** Stable intent key used for routing and keyed renders. */
  key: IntentKey;
  /** Short user-facing label shown on the pill. */
  label: string;
  /** Lucide icon name rendered alongside the label. Pill bar maps this to a component. */
  icon: 'dollar-sign' | 'pen-line' | 'microscope' | 'hammer' | 'play' | 'map' | 'graduation-cap';
  /** Ordered list of starter prompts surfaced when the pill is active. */
  prompts: IntentPrompt[];
};

export const INTENTS: Record<IntentKey, IntentDef> = {
  sell: {
    key: 'sell',
    label: 'Sell',
    icon: 'dollar-sign',
    prompts: [
      {
        title: 'Cold outbound that books meetings',
        promptText: 'Draft a 3-step cold outbound sequence for our ICP that books discovery calls.',
        targetAssistantId: 'cold-outbound',
      },
      {
        title: 'Build a pipeline review',
        promptText: 'Review my current pipeline, score every deal, and call out the at-risk ones.',
        targetAssistantId: 'sales-pipeline',
      },
      {
        title: 'Run a fundraise plan',
        promptText: 'Help me plan a 6-week seed fundraise: investor list, target check size, narrative.',
        targetAssistantId: 'fundraise',
      },
      {
        title: 'Generate a pitch deck',
        promptText: 'Create a 12-slide pitch deck for our startup with problem, solution, market, and ask.',
        targetAssistantId: 'pitch-deck-creator',
      },
      {
        title: 'Plan a product launch',
        promptText: 'Plan a 4-week product launch covering positioning, comms, and channel rollout.',
        targetAssistantId: 'product-launch',
      },
    ],
  },
  write: {
    key: 'write',
    label: 'Write',
    icon: 'pen-line',
    prompts: [
      {
        title: 'Write sharp marketing copy',
        promptText: 'Write three variants of homepage hero copy that lead with the outcome, not the feature.',
        targetAssistantId: 'copy',
      },
      {
        title: 'Run an editorial newsroom',
        promptText: 'Spin up a weekly editorial calendar across blog, newsletter, and social.',
        targetAssistantId: 'editorial-newsroom',
      },
      {
        title: 'Build a content studio',
        promptText: 'Plan a 6-week content studio program with pillar pieces and supporting cuts.',
        targetAssistantId: 'content-studio',
      },
      {
        title: 'Power a creator studio',
        promptText: 'Outline a creator studio workflow: idea capture, drafting, editing, publishing.',
        targetAssistantId: 'creator-studio',
      },
      {
        title: 'Publish across job boards',
        promptText: 'Draft a job posting and tailor it for LinkedIn, Indeed, and a careers page.',
        targetAssistantId: 'copy',
      },
    ],
  },
  research: {
    key: 'research',
    label: 'Research',
    icon: 'microscope',
    prompts: [
      {
        title: 'Run a deep research dive',
        promptText: 'Do a deep research dive on a topic of my choosing and summarize with citations.',
        targetAssistantId: 'research',
      },
      {
        title: 'Get a lens on a market',
        promptText: 'Pull a market lens: segments, players, momentum, and the open white space.',
        targetAssistantId: 'lens',
      },
      {
        title: 'Validate before you build',
        promptText: 'Pressure-test my product idea against demand, ICP, and willingness to pay.',
        targetAssistantId: 'validate-before-build',
      },
      {
        title: 'Probe a hard question',
        promptText: 'Probe a hard strategic question, surface assumptions, and stress-test answers.',
        targetAssistantId: 'probe',
      },
      {
        title: 'Read an academic paper',
        promptText: 'Help me read and summarize an academic paper, then extract the actionable insights.',
        targetAssistantId: 'academic-paper',
      },
    ],
  },
  build: {
    key: 'build',
    label: 'Build',
    icon: 'hammer',
    prompts: [
      {
        title: 'Hand off to Smith',
        promptText: 'Smith, take this brief and turn it into a runnable scaffold I can iterate on.',
        targetAssistantId: 'smith',
      },
      {
        title: 'Spark a new idea',
        promptText: 'Spark an idea for a small SaaS I could ship this weekend with a clear wedge.',
        targetAssistantId: 'spark',
      },
      {
        title: 'Spin up a dev shop',
        promptText: 'Operate as a dev shop: scope, estimate, and break work into shippable increments.',
        targetAssistantId: 'dev-shop',
      },
      {
        title: 'Run a SaaS MVP sprint',
        promptText: 'Plan a 2-week SaaS MVP sprint with a vertical slice and a real first user.',
        targetAssistantId: 'saas-mvp-sprint',
      },
      {
        title: 'Design with UI/UX Pro',
        promptText: 'Critique and improve the UX of a flow I describe - pillars, friction, fixes.',
        targetAssistantId: 'ui-ux-pro-max',
      },
    ],
  },
  run: {
    key: 'run',
    label: 'Run',
    icon: 'play',
    prompts: [
      {
        title: 'Patch a broken process',
        promptText: 'Patch a broken internal process: diagnose the root cause and propose a fix.',
        targetAssistantId: 'patch',
      },
      {
        title: 'Steer with Helm',
        promptText: 'Helm me through the week: top 3 priorities, blockers, and a Friday checkpoint.',
        targetAssistantId: 'helm',
      },
      {
        title: 'Run founder setup',
        promptText: 'Set up the founder operating system: cadence, tools, and decision logs.',
        targetAssistantId: 'founder-setup',
      },
      {
        title: 'Plan with files',
        promptText: 'Read the files I attach and produce a written plan grounded in them.',
        targetAssistantId: 'planning-with-files',
      },
      {
        title: 'Operate a service studio',
        promptText: 'Run a service studio: client intake, project framing, and delivery rhythm.',
        targetAssistantId: 'service-studio',
      },
    ],
  },
  plan: {
    key: 'plan',
    label: 'Plan',
    icon: 'map',
    prompts: [
      {
        title: 'Plan grounded in my files',
        promptText: 'Read the files I attach and produce a written plan grounded in them.',
        targetAssistantId: 'planning-with-files',
      },
      {
        title: 'Set up the founder operating system',
        promptText: 'Set up the founder operating system: cadence, tools, and decision logs.',
        targetAssistantId: 'founder-setup',
      },
      {
        title: 'Steer with Helm',
        promptText: 'Helm me through the week: top 3 priorities, blockers, and a Friday checkpoint.',
        targetAssistantId: 'helm',
      },
      {
        title: 'Plan a fundraise',
        promptText: 'Help me plan a 6-week seed fundraise: investor list, target check size, narrative.',
        targetAssistantId: 'fundraise',
      },
      {
        title: 'Plan a product launch',
        promptText: 'Plan a 4-week product launch covering positioning, comms, and channel rollout.',
        targetAssistantId: 'product-launch',
      },
    ],
  },
  learn: {
    key: 'learn',
    label: 'Learn',
    icon: 'graduation-cap',
    prompts: [
      {
        title: 'Read an academic paper',
        promptText: 'Help me read and summarize an academic paper, then extract the actionable insights.',
        targetAssistantId: 'academic-paper',
      },
      {
        title: 'Probe a hard question',
        promptText: 'Probe a hard strategic question, surface assumptions, and stress-test answers.',
        targetAssistantId: 'probe',
      },
      {
        title: 'Pull a market lens',
        promptText: 'Pull a market lens: segments, players, momentum, and the open white space.',
        targetAssistantId: 'lens',
      },
      {
        title: 'Validate before you build',
        promptText: 'Pressure-test my product idea against demand, ICP, and willingness to pay.',
        targetAssistantId: 'validate-before-build',
      },
      {
        title: 'Run a deep research dive',
        promptText: 'Do a deep research dive on a topic of my choosing and summarize with citations.',
        targetAssistantId: 'research',
      },
    ],
  },
};

/** Ordered list used for stable iteration in UI (pill bar, suggestion panel). */
export const INTENT_KEYS: IntentKey[] = ['sell', 'write', 'research', 'plan', 'build', 'run', 'learn'];
