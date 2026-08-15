/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared map + helper for rendering Lucide icons referenced by string in
 * assistant `avatar` fields. Avatars stored as `lucide:IconName` resolve to a
 * component here.
 *
 * ANY Lucide icon name works. You do NOT need to edit this file to use one.
 *
 * The explicit map below is a performance fast path, not an allowlist: those
 * icons are statically imported so the bundler can tree-shake and they paint on
 * the first frame. Anything not in it is loaded lazily by name instead. Add an
 * icon here only if it renders somewhere hot enough that a one-frame delay
 * shows - a sidebar row or a long list - and then add it to BOTH the import
 * list and the map.
 */

import {
  BarChart3,
  BookCopy,
  BookOpen,
  BookOpenCheck,
  Bot,
  Bug,
  Calculator,
  CalendarClock,
  Clapperboard,
  ClipboardList,
  Cloud,
  Code,
  Compass,
  Drama,
  Feather,
  FileText,
  Gamepad2,
  Gauge,
  GitBranch,
  GraduationCap,
  Headset,
  LayoutDashboard,
  Library,
  ListChecks,
  Megaphone,
  MonitorSmartphone,
  Network,
  Package,
  Palette,
  PencilRuler,
  PenTool,
  Presentation,
  Rocket,
  Scale,
  Server,
  Sheet,
  ShieldCheck,
  Siren,
  Sparkles,
  SpellCheck,
  SquareTerminal,
  Star,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';
// Subpath needs the extension: lucide-react 1.14.0 ships no `exports` map, so
// `lucide-react/dynamic` does not resolve.
import { DynamicIcon, iconNames } from 'lucide-react/dynamic.mjs';
import React from 'react';

export const LUCIDE_AVATAR_PREFIX = 'lucide:';

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  BarChart3,
  BookCopy,
  BookOpen,
  BookOpenCheck,
  Bot,
  Bug,
  Calculator,
  CalendarClock,
  Clapperboard,
  ClipboardList,
  Cloud,
  Code,
  Compass,
  Drama,
  Feather,
  FileText,
  Gamepad2,
  Gauge,
  GitBranch,
  GraduationCap,
  Headset,
  LayoutDashboard,
  Library,
  ListChecks,
  Megaphone,
  MonitorSmartphone,
  Network,
  Package,
  Palette,
  PencilRuler,
  PenTool,
  Presentation,
  Rocket,
  Scale,
  Server,
  Sheet,
  ShieldCheck,
  Siren,
  Sparkles,
  SpellCheck,
  SquareTerminal,
  Star,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Workflow,
  Wrench,
};

export const isLucideAvatar = (avatar: string | undefined | null): boolean =>
  typeof avatar === 'string' && avatar.startsWith(LUCIDE_AVATAR_PREFIX);

/**
 * Every icon name the library ships, kebab-case.
 *
 * Membership here is what turns an unknown name into a clean `null` - so a typo
 * falls through to the caller's own emoji/image path instead of handing the
 * loader a name it cannot resolve and leaving an empty hole.
 */
const VALID_ICON_NAMES = new Set<string>(iconNames as readonly string[]);

/**
 * `TrendingUp` -> `trending-up`, `BarChart3` -> `bar-chart-3`.
 *
 * The static map above is keyed by the PascalCase component name, because that
 * is what the named imports are called. The lazy loader is keyed by the
 * kebab-case icon name. Both spellings are the same icon; this bridges them.
 * Checked against every entry in the static map: all 48 convert to a real name.
 */
export const toLucideIconName = (pascalName: string): string =>
  pascalName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
    .toLowerCase();

/**
 * Lazily-loaded icons, cached BY NAME.
 *
 * The cache is not an optimisation, it is a correctness requirement. React
 * identifies a component by reference, so returning a freshly-built wrapper on
 * every call would make the element type change on every render, unmounting and
 * remounting the icon each time - which for an avatar in a list reads as a
 * flicker.
 */
const dynamicIconCache = new Map<string, LucideIcon>();

/** Build (or reuse) the lazy component for one kebab-case icon name. */
const dynamicLucideIcon = (kebabName: string): LucideIcon => {
  const cached = dynamicIconCache.get(kebabName);
  if (cached) return cached;
  const Wrapped = ((props: LucideProps) => {
    // `name` is a ~1950-member string-literal union. The library declares the
    // type as `keyof typeof dynamicIconImports` but never exports it, and
    // TypeScript does not pick up the declaration through this extension-ed
    // subpath, so neither ComponentProps nor typeof iconNames narrows to it.
    // The cast is safe by construction rather than by declaration: getLucideIcon
    // only reaches here for a name it has already checked against the library's
    // own `iconNames` list.
    const dynamicProps = { name: kebabName, ...props } as unknown as React.ComponentProps<typeof DynamicIcon>;
    return <DynamicIcon {...dynamicProps} />;
  }) as unknown as LucideIcon;
  dynamicIconCache.set(kebabName, Wrapped);
  return Wrapped;
};

/**
 * Resolve a `lucide:Name` avatar to something renderable.
 *
 * Two tiers, deliberately. The static map is the fast path: those icons are
 * bundled, paint on the first frame, and cover everything that renders in a hot
 * list. Anything else falls back to the library's lazy loader, so ANY of the
 * ~1950 Lucide icons works without editing this file.
 *
 * The map used to be the whole story, and the consequence was bad: choosing an
 * icon that was not among the 48 returned null and rendered NOTHING, silently.
 * The author of a new assistant had no way to know except by looking.
 *
 * Why not drop the map and load everything lazily? Because a lazily-loaded icon
 * paints a frame or two late. Why not import them all eagerly? Because the
 * lookup would stop being statically analysable and the bundler would keep all
 * 1,952 of them - `sideEffects: false` only helps while the names are literal.
 */
export const getLucideIcon = (avatar: string | undefined | null): LucideIcon | null => {
  if (!isLucideAvatar(avatar)) return null;
  const name = (avatar as string).slice(LUCIDE_AVATAR_PREFIX.length);
  const bundled = LUCIDE_ICONS[name];
  if (bundled) return bundled;
  const kebab = toLucideIconName(name);
  // Validated rather than passed straight through, so a typo renders the
  // caller's own fallback instead of an empty hole where an avatar should be.
  return VALID_ICON_NAMES.has(kebab) ? dynamicLucideIcon(kebab) : null;
};

/**
 * Render helper for sites that already have a glyph slot. Returns null if
 * the avatar string is not a Lucide reference - callers fall through to
 * their existing emoji/image rendering.
 */
export const renderLucideAvatar = (
  avatar: string | undefined | null,
  size: number,
  className?: string
): React.ReactNode | null => {
  const Icon = getLucideIcon(avatar);
  if (!Icon) return null;
  return <Icon size={size} className={className ?? 'text-[var(--color-text-2)]'} />;
};

/** Re-export the Bot fallback so callers can render a consistent default. */
export { Bot as DefaultAvatarIcon };
