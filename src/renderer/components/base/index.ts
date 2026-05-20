/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wayland base components unified exports
 *
 * Provides unified export entry for all base components and types
 */

// ==================== Component Exports ====================

export { default as WaylandModal } from './WaylandModal';
export { default as WaylandCollapse } from './WaylandCollapse';
export { default as WaylandSelect } from './WaylandSelect';
export { default as WaylandScrollArea } from './WaylandScrollArea';
export { default as WaylandSteps } from './WaylandSteps';
export { default as Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

// ==================== Type Exports ====================

// WaylandModal types
export type {
  ModalSize,
  ModalHeaderConfig,
  ModalFooterConfig,
  ModalContentStyleConfig,
  WaylandModalProps,
} from './WaylandModal';
export { MODAL_SIZES } from './WaylandModal';

// WaylandCollapse types
export type { WaylandCollapseProps, WaylandCollapseItemProps } from './WaylandCollapse';

// WaylandSelect types
export type { WaylandSelectProps } from './WaylandSelect';

// WaylandSteps types
export type { WaylandStepsProps } from './WaylandSteps';
