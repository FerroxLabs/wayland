/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CUSTOM_AVATAR_IMAGE_MAP } from '@/renderer/pages/guid/constants';
import { resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { isImageAvatar } from '@/renderer/utils/avatar';
import { getLucideIcon } from '@/renderer/utils/lucideAvatar';

export type AvatarProps = {
  /** Raw avatar value from the source record (image key, URL, or emoji glyph). */
  avatar?: string;
  /** Display name used to derive initials when no avatar is available. */
  name: string;
  /** Optional alt text for image avatars; defaults to ''. */
  alt?: string;
};

const initialsFor = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ avatar, name, alt = '' }) => {
  const avatarValue = avatar?.trim();
  // A `lucide:IconName` reference resolves to a Lucide component. `currentColor`
  // keeps it visible on both themes (the raw string must never render as text).
  const LucideIcon = getLucideIcon(avatarValue);
  if (LucideIcon) return <LucideIcon size={18} className='text-current' />;
  const mapped = avatarValue ? CUSTOM_AVATAR_IMAGE_MAP[avatarValue] : undefined;
  const resolved = avatarValue ? mapped || resolveExtensionAssetUrl(avatarValue) || avatarValue : undefined;
  const showImage = resolved ? isImageAvatar(resolved) : false;
  if (showImage && resolved)
    return <img src={resolved} alt={alt} style={{ filter: 'var(--avatar-img-filter, none)' }} />;
  if (avatarValue && !showImage) return <span>{avatarValue}</span>;
  return <span>{initialsFor(name)}</span>;
};

export default Avatar;
