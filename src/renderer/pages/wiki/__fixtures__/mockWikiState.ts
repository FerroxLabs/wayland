/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mock fixtures for wiki pages. Used directly by WikiHomePage + WikiDetailPage
 * until W2 wires real IPC.
 */

import type { WikiConcept, WikiState } from '@/common/types/memory';

const now = Date.now();
const daysAgo = (d: number) => now - d * 24 * 60 * 60 * 1000;

export const MOCK_CONCEPTS: WikiConcept[] = [
  {
    id: 'c-001',
    name: 'Wayland v0.9.0 TUI Architecture',
    slug: 'wayland-v090-tui-architecture',
    topicTag: 'Architecture',
    tldr:
      'The v0.9.0 TUI consolidates the W1–W5 build into Ratatui-based rendering with 11 backend tools, per-tool formatters, and the [[TurnElement enum]] as the single owned render unit. The [[file-per-backend pattern]] eliminated the 13-way merge collision risk.',
    body:
      'The TUI is structured around the [[TurnElement enum]], which is the single owned render type. Every piece of output the LLM produces resolves to a TurnElement variant before it reaches the display layer.\n\nBackends register via the [[file-per-backend pattern]]. Each of the 11 tool backends lives in its own file with an is_available() gate.\n\nSee [[Markdown Rendering Pipeline]] for the full pre-processor spec.',
    aliases: ['TUI Architecture', 'wayland-tui-v090'],
    sourceMemoryIds: ['m-001', 'm-002', 'm-003', 'm-004', 'm-005', 'm-006', 'm-007', 'm-008'],
    linkedFromConcepts: [
      'wayland-engine-roadmap',
      'sub-agent-driven-development',
      'cross-audit-3-voice-pattern',
    ],
    relatedConcepts: [
      'TurnElement enum',
      'File-per-backend pattern',
      'Spotify deferred',
      'wcore Crate System',
      'Markdown Rendering Pipeline',
    ],
    tags: ['#architecture', '#tui', '#wayland-core', '#v0.9.0', '#ratatui'],
    lastSynthesizedAt: daysAgo(2),
    freshness: 'fresh',
  },
  {
    id: 'c-002',
    name: 'File-per-backend Pattern',
    slug: 'file-per-backend-pattern',
    topicTag: 'Architecture',
    tldr:
      'When N>3 sub-agents need to modify the same shared file in parallel, introduce stub-then-assemble. Each agent writes a structured TOML; a sequential assembler consumes all and writes once. Reduces git collision surface ~25×.',
    body:
      'The [[R-B1 Stub-then-Assemble]] pattern was first applied during W1 of v0.9.0. It prevented 12 agents simultaneously touching bootstrap.rs from guaranteeing merge conflicts.\n\nSee also [[Wayland v0.9.0 TUI Architecture]] for the full build context.',
    aliases: ['R-B1 Pattern', 'file-per-backend'],
    sourceMemoryIds: ['m-001', 'm-009', 'm-010'],
    linkedFromConcepts: ['wayland-v090-tui-architecture', 'sub-agent-driven-development'],
    relatedConcepts: ['Wayland v0.9.0 TUI Architecture', 'Sub-agent Driven Development'],
    tags: ['#architecture', '#patterns', '#git', '#parallel-agents'],
    lastSynthesizedAt: daysAgo(3),
    freshness: 'fresh',
  },
  {
    id: 'c-003',
    name: 'Memory Archive Architecture',
    slug: 'memory-archive-architecture',
    topicTag: 'Architecture',
    tldr:
      'Mail-style archive layout: 220px sidebar, topbar with stat chips, filter row, list + 480px push-content drawer. v0.6.4 design replacing the broken tab-based v3.',
    body:
      'The archive uses a two-column grid with [[MemoryRow]] items in a Virtuoso-backed virtual list. The [[RightDrawer]] slides in at 480px and pushes the list column left without an overlay.\n\nSee [[Sutherland Value Visibility]] for the UX principles behind this layout.',
    aliases: ['Memory Archive', 'memory-archive'],
    sourceMemoryIds: ['m-011', 'm-012', 'm-013', 'm-014'],
    linkedFromConcepts: ['wayland-v090-tui-architecture'],
    relatedConcepts: ['Sutherland Value Visibility', 'Sidebar Three-Zone Grid'],
    tags: ['#architecture', '#memory', '#v0.6.4', '#ux'],
    lastSynthesizedAt: daysAgo(1),
    freshness: 'fresh',
  },
  {
    id: 'c-004',
    name: 'Cross-Audit 3-Voice Pattern',
    slug: 'cross-audit-3-voice-pattern',
    topicTag: 'Patterns',
    tldr:
      'Before every major ship, dispatch three independent audit personas (Claude + Codex + Gemini). 8 BLOCKERs + 20 HIGHs caught at plan time during v0.9.0. Single-author review misses them every time.',
    body:
      'The cross-audit pattern emerged from the [[v0.9.0 TUI Architecture]] build. Three independent audit voices - [[Claude persona]], [[Codex persona]], [[Gemini persona]] - each review the plan in parallel and produce structured finding reports.\n\nFindings are triaged in a TRIAGE.md file and classified as BLOCKER/HIGH/MED/LOW.',
    aliases: ['3-Voice Audit', 'cross-audit'],
    sourceMemoryIds: ['m-015', 'm-016', 'm-017'],
    linkedFromConcepts: ['wayland-v090-tui-architecture', 'sub-agent-driven-development'],
    relatedConcepts: ['Sub-agent Driven Development', 'Orchestrator-Rescue Pattern'],
    tags: ['#patterns', '#quality', '#audit', '#parallel'],
    lastSynthesizedAt: daysAgo(3),
    freshness: 'fresh',
  },
  {
    id: 'c-005',
    name: 'Promotion Score Algorithm',
    slug: 'promotion-score-algorithm',
    topicTag: 'Architecture',
    tldr:
      'Memories accumulate a 0–100 score based on reference frequency, recency decay, and manual signals. Auto-promotes at 90. Score visible in the right drawer with a threshold marker.',
    body:
      'The promotion score is computed by [[promotionScore.ts]] and drives the [[promotionSweep]] service. Scores use a weighted formula: refCount × 0.4 + recencyScore × 0.3 + explicitBoost × 0.3.\n\nAt score ≥ 90 the memory becomes a [[WikiConcept]] candidate.',
    aliases: ['Promotion Score', 'promotion-score'],
    sourceMemoryIds: ['m-018', 'm-019'],
    linkedFromConcepts: ['memory-archive-architecture'],
    relatedConcepts: ['Memory Archive Architecture', 'Sutherland Value Visibility'],
    tags: ['#architecture', '#scoring', '#memory'],
    lastSynthesizedAt: daysAgo(5),
    freshness: 'stale',
  },
  {
    id: 'c-006',
    name: 'Sutherland Value Visibility',
    slug: 'sutherland-value-visibility',
    topicTag: 'Design',
    tldr:
      "Make the system's value visible immediately. Zero-count cells must show CTA copy, not '0'. Empty states are first-class product moments.",
    body:
      "From Jeff Sutherland's Scrum principles applied to UI design: every empty state is a missed opportunity. The [[Memory Archive Architecture]] layout enforces this - no column ever shows bare zero without actionable copy.\n\nSee [[Memory Page UX Principles]] for the full set of rules.",
    aliases: ['Value Visibility', 'sutherland-value'],
    sourceMemoryIds: ['m-020', 'm-021'],
    linkedFromConcepts: ['memory-archive-architecture', 'promotion-score-algorithm'],
    relatedConcepts: ['Memory Archive Architecture', 'Sidebar Three-Zone Grid'],
    tags: ['#design', '#ux', '#empty-state'],
    lastSynthesizedAt: daysAgo(4),
    freshness: 'fresh',
  },
  {
    id: 'c-007',
    name: 'Sub-agent Driven Development',
    slug: 'sub-agent-driven-development',
    topicTag: 'Patterns',
    tldr:
      'Dispatch independent parallel agents per workstream rather than running sequentially. Requires: shared type definitions, no cross-agent imports, TOML assembly handoffs for shared files.',
    body:
      'The pattern was formalized during v0.9.0 W1. Each sub-agent receives a briefing describing its domain, exit gate, and file list. Agents must not read files outside their domain.\n\nThe [[file-per-backend pattern]] is the canonical example of how to handle shared-file contention in this model.',
    aliases: ['Parallel Agents', 'sub-agent-dev'],
    sourceMemoryIds: ['m-022', 'm-023', 'm-024'],
    linkedFromConcepts: ['cross-audit-3-voice-pattern', 'wayland-v090-tui-architecture'],
    relatedConcepts: ['Cross-Audit 3-Voice Pattern', 'File-per-backend Pattern'],
    tags: ['#patterns', '#architecture', '#agents', '#parallel'],
    lastSynthesizedAt: daysAgo(2),
    freshness: 'fresh',
  },
  {
    id: 'c-008',
    name: 'Sidebar Three-Zone Grid',
    slug: 'sidebar-three-zone-grid',
    topicTag: 'Design',
    tldr:
      '240px sidebar split into three pinned zones: top (logo + nav), scroll (content), footer (status). Collapsed mode shows icon fallbacks for all sections.',
    body:
      'The sidebar uses CSS Grid with three rows: top pinned (logo + nav), 1fr scrollable (accordion sections), footer pinned (status bar). Width fixed at 240px - trimmed from 280px in v0.6.2.\n\nSee [[Sutherland Value Visibility]] for the icon-fallback requirement on collapsed mode.',
    aliases: ['Sidebar Layout', 'sidebar-grid'],
    sourceMemoryIds: ['m-025', 'm-026'],
    linkedFromConcepts: ['memory-archive-architecture', 'sutherland-value-visibility'],
    relatedConcepts: ['Memory Archive Architecture', 'Sutherland Value Visibility'],
    tags: ['#design', '#sidebar', '#layout', '#v0.6.2'],
    lastSynthesizedAt: daysAgo(6),
    freshness: 'stale',
  },
];

export const MOCK_ORPHANS: WikiState['orphanCandidates'] = [
  {
    memoryIds: ['m-101', 'm-102', 'm-103', 'm-104', 'm-105', 'm-106', 'm-107', 'm-108'],
    citationCount: 8,
    suggestedName: 'Cron skill PROPOSE-default',
  },
  {
    memoryIds: [
      'm-111',
      'm-112',
      'm-113',
      'm-114',
      'm-115',
      'm-116',
      'm-117',
      'm-118',
      'm-119',
      'm-120',
      'm-121',
      'm-122',
    ],
    citationCount: 12,
    suggestedName: 'Sub-agent driven development',
  },
  {
    memoryIds: ['m-131', 'm-132', 'm-133', 'm-134', 'm-135', 'm-136'],
    citationCount: 6,
    suggestedName: 'Cross-audit 3-voice pattern',
  },
  {
    memoryIds: ['m-141', 'm-142', 'm-143', 'm-144'],
    citationCount: 4,
    suggestedName: 'normalize_nested_fences pre-processor',
  },
];

export const MOCK_BACKLINK_GRAPH: Record<string, string[]> = {
  'wayland-v090-tui-architecture': [
    'file-per-backend-pattern',
    'memory-archive-architecture',
    'cross-audit-3-voice-pattern',
    'sub-agent-driven-development',
  ],
  'file-per-backend-pattern': ['wayland-v090-tui-architecture', 'sub-agent-driven-development'],
  'cross-audit-3-voice-pattern': ['sub-agent-driven-development', 'wayland-v090-tui-architecture'],
  'memory-archive-architecture': ['sutherland-value-visibility', 'sidebar-three-zone-grid'],
  'sub-agent-driven-development': ['cross-audit-3-voice-pattern', 'file-per-backend-pattern'],
};
