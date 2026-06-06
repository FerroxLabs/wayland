/**
 * AssistantAvatar - Renders an assistant's avatar with emoji, image, or fallback icon.
 *
 * Visual policy (per Sean feedback 2026-05-21):
 *  - No background container around the glyph. Icons live on the row
 *    surface, not in a dark grey box.
 *  - Image-avatars (mostly monochrome SVG icons from extension assistant
 *    packs) get a theme-adaptive filter so they render legibly on both
 *    light and dark surfaces. Emoji-avatars are colored glyphs and pass
 *    through without filtering.
 *  - All glyph variants share the same size budget so a row with a
 *    Lucide icon next to a row with an emoji feels consistent.
 */
import { Bot } from 'lucide-react';
import type { AssistantListItem } from './types';
import React from 'react';
import { isEmoji, resolveAvatarImageSrc } from './assistantUtils';
import { getLucideIcon } from '@/renderer/utils/lucideAvatar';

type AssistantAvatarProps = {
  assistant: AssistantListItem;
  size?: number;
  avatarImageMap: Record<string, string>;
};

const AssistantAvatar: React.FC<AssistantAvatarProps> = ({ assistant, size = 32, avatarImageMap }) => {
  const resolvedAvatar = assistant.avatar?.trim();
  const LucideIconComponent = getLucideIcon(resolvedAvatar);
  const hasEmojiAvatar = Boolean(resolvedAvatar && !LucideIconComponent && isEmoji(resolvedAvatar));
  const avatarImage = !LucideIconComponent ? resolveAvatarImageSrc(resolvedAvatar, avatarImageMap) : undefined;
  // Match emoji/image glyph size to ~60% of the slot. Lucide icons render
  // pixel-perfect with explicit `size={px}`, so we pass the same value.
  const glyphSize = Math.floor(size * 0.6);

  return (
    <div
      className='flex shrink-0 items-center justify-center'
      style={{ width: size, height: size }}
    >
      {LucideIconComponent ? (
        // Built-in assistants reference their glyph as 'lucide:IconName' -
        // render the matching component with inherited theme color so it
        // reads on both light and dark surfaces.
        <LucideIconComponent size={glyphSize} className='text-[var(--color-text-2)]' />
      ) : avatarImage ? (
        <img
          src={avatarImage}
          alt=''
          width={glyphSize}
          height={glyphSize}
          // Monochrome SVG icons from extension packs ship as black-on-
          // transparent. The CSS variable --avatar-img-filter is set
          // per-theme (none in light, invert in dark) in
          // default-color-scheme.css so they read on both surfaces.
          style={{ objectFit: 'contain', filter: 'var(--avatar-img-filter, none)' }}
        />
      ) : hasEmojiAvatar ? (
        <span style={{ fontSize: glyphSize, lineHeight: 1 }}>{resolvedAvatar}</span>
      ) : (
        <Bot size={glyphSize} className='text-[var(--color-text-2)]' />
      )}
    </div>
  );
};

export default AssistantAvatar;
