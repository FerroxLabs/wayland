/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LucideIcon } from 'lucide-react';
import {
  CheckSquare,
  Clapperboard,
  CodeXml,
  CreditCard,
  Database,
  Folder,
  Globe,
  GraduationCap,
  MessagesSquare,
  Server,
  Users,
  Workflow,
} from 'lucide-react';
import type { CatalogIndexEntry } from './types';

/**
 * The 12 clean display groups the MCP Library shows in its category rail. The
 * raw catalog ships 32 uneven category strings; each group absorbs one or more
 * of them so an entry can belong to several groups (union of its raw
 * categories). Labels are English placeholders - a later wave swaps the call
 * site to t() while keeping these as the fallback.
 */
export type CategoryGroupId =
  | 'communication'
  | 'productivity'
  | 'developer'
  | 'devops'
  | 'data'
  | 'research'
  | 'files'
  | 'search'
  | 'media'
  | 'sales'
  | 'automation'
  | 'payments';

export type CategoryGroup = {
  id: CategoryGroupId;
  label: string;
  icon: LucideIcon;
  order: number;
  rawCategories: string[];
};

/** The 12 groups in display order (order: 1..12). */
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'communication',
    label: 'Communication',
    icon: MessagesSquare,
    order: 1,
    rawCategories: ['communication', 'collaboration', 'support'],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: CheckSquare,
    order: 2,
    rawCategories: ['productivity', 'tasks', 'calendar', 'personal'],
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: CodeXml,
    order: 3,
    rawCategories: ['developer', 'code', 'api-testing'],
  },
  {
    id: 'devops',
    label: 'DevOps & Infra',
    icon: Server,
    order: 4,
    rawCategories: ['devops', 'infrastructure', 'observability', 'incidents', 'ops', 'security'],
  },
  {
    id: 'data',
    label: 'Data & Databases',
    icon: Database,
    order: 5,
    rawCategories: ['data', 'database'],
  },
  {
    id: 'research',
    label: 'Research & AI',
    icon: GraduationCap,
    order: 6,
    rawCategories: ['research', 'ml', 'knowledge', 'news'],
  },
  {
    id: 'files',
    label: 'Files & Docs',
    icon: Folder,
    order: 7,
    rawCategories: ['files-and-docs'],
  },
  {
    id: 'search',
    label: 'Search & Web',
    icon: Globe,
    order: 8,
    rawCategories: ['search', 'browser', 'maps'],
  },
  {
    id: 'media',
    label: 'Media & Design',
    icon: Clapperboard,
    order: 9,
    rawCategories: ['media', 'design'],
  },
  {
    id: 'sales',
    label: 'Sales & CRM',
    icon: Users,
    order: 10,
    rawCategories: ['sales', 'crm'],
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: Workflow,
    order: 11,
    rawCategories: ['automation'],
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
    order: 12,
    rawCategories: ['payments'],
  },
];

/** raw category string -> group id. Built once from CATEGORY_GROUPS.rawCategories. */
const RAW_TO_GROUP: ReadonlyMap<string, CategoryGroupId> = new Map(
  CATEGORY_GROUPS.flatMap((group) =>
    group.rawCategories.map((raw): [string, CategoryGroupId] => [raw, group.id]),
  ),
);

/** id -> group, for O(1) lookups. */
const GROUP_BY_ID: ReadonlyMap<CategoryGroupId, CategoryGroup> = new Map(
  CATEGORY_GROUPS.map((group): [CategoryGroupId, CategoryGroup] => [group.id, group]),
);

/**
 * Map a raw catalog category string to its display group id. Returns undefined
 * for an unmapped raw category (should never happen for catalog data, but the
 * caller stays defensive).
 */
export function groupForRawCategory(raw: string): CategoryGroupId | undefined {
  return RAW_TO_GROUP.get(raw);
}

/**
 * The display group ids an entry belongs to: the union over its raw categories,
 * de-duped and emitted in CATEGORY_GROUPS order.
 */
export function groupsForEntry(entry: CatalogIndexEntry): CategoryGroupId[] {
  const hits = new Set<CategoryGroupId>();
  for (const raw of entry.categories) {
    const id = RAW_TO_GROUP.get(raw);
    if (id !== undefined) hits.add(id);
  }
  return CATEGORY_GROUPS.filter((group) => hits.has(group.id)).map((group) => group.id);
}

/** Look up a group definition by id. */
export function getCategoryGroup(id: CategoryGroupId): CategoryGroup {
  const group = GROUP_BY_ID.get(id);
  if (group === undefined) {
    throw new Error(`Unknown category group id: ${id}`);
  }
  return group;
}
