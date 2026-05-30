/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared map + helper for rendering Lucide icons referenced by string in
 * assistant `avatar` fields. Avatars stored as `lucide:IconName` resolve
 * to the matching component below. The map is intentionally explicit
 * rather than dynamic so the bundler tree-shakes unused icons.
 *
 * Adding a new avatar: pick the icon name from https://lucide.dev/icons
 * and add it to LUCIDE_ICONS + the import list above.
 */

import {
  BarChart3,
  BookOpen,
  Bot,
  Bug,
  Calculator,
  CalendarClock,
  Clapperboard,
  ClipboardList,
  Cloud,
  Code,
  Compass,
  FileText,
  Gamepad2,
  Gauge,
  GitBranch,
  GraduationCap,
  Headset,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MonitorSmartphone,
  Network,
  Package,
  Palette,
  PenTool,
  Presentation,
  Scale,
  Server,
  Sheet,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';

export const LUCIDE_AVATAR_PREFIX = 'lucide:';

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  BarChart3,
  BookOpen,
  Bot,
  Bug,
  Calculator,
  CalendarClock,
  Clapperboard,
  ClipboardList,
  Cloud,
  Code,
  Compass,
  FileText,
  Gamepad2,
  Gauge,
  GitBranch,
  GraduationCap,
  Headset,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MonitorSmartphone,
  Network,
  Package,
  Palette,
  PenTool,
  Presentation,
  Scale,
  Server,
  Sheet,
  ShieldCheck,
  Siren,
  Sparkles,
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

export const getLucideIcon = (avatar: string | undefined | null): LucideIcon | null => {
  if (!isLucideAvatar(avatar)) return null;
  const name = (avatar as string).slice(LUCIDE_AVATAR_PREFIX.length);
  return LUCIDE_ICONS[name] ?? null;
};

/**
 * Render helper for sites that already have a glyph slot. Returns null if
 * the avatar string is not a Lucide reference — callers fall through to
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
