/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { X } from 'lucide-react';
import type { ModalProps } from '@arco-design/web-react';
import { Modal, Button } from '@arco-design/web-react';
import classNames from 'classnames';
import type { CSSProperties } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/renderer/hooks/context/ThemeContext';

// ==================== Type definition exports ====================

/** Preset size type */
export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge' | 'full';

/** Preset size configuration */
export const MODAL_SIZES: Record<ModalSize, { width: string; height?: string }> = {
  small: { width: '400px', height: '300px' },
  medium: { width: '600px', height: '400px' },
  large: { width: '800px', height: '600px' },
  xlarge: { width: '1000px', height: '700px' },
  full: { width: '90vw', height: '90vh' },
};

/** Header configuration */
export interface ModalHeaderConfig {
  /** Custom full header content */
  render?: () => React.ReactNode;
  /** Title text or node */
  title?: React.ReactNode;
  /** Whether to show close button */
  showClose?: boolean;
  /** Close button icon */
  closeIcon?: React.ReactNode;
  /** Extra Header class name */
  className?: string;
  /** Extra Header style */
  style?: CSSProperties;
}

/** Footer configuration */
export interface ModalFooterConfig {
  /** Custom full footer content */
  render?: () => React.ReactNode;
  /** Extra Footer class name */
  className?: string;
  /** Extra Footer style */
  style?: CSSProperties;
}

/** Modal content area style configuration */
export interface ModalContentStyleConfig {
  /** Background color, defaults to var(--dialog-fill-0) */
  background?: string;
  /** Border radius, defaults to 16px */
  borderRadius?: string | number;
  /** Padding, defaults to 0 */
  padding?: string | number;
  /** Content area scroll behavior, defaults to auto */
  overflow?: 'auto' | 'scroll' | 'hidden' | 'visible';
  /** Content area height (supports number or px string) */
  height?: string | number;
  /** Content area min height */
  minHeight?: string | number;
  /** Content area max height */
  maxHeight?: string | number;
}

/** WaylandModal component Props */
export interface WaylandModalProps extends Omit<ModalProps, 'title' | 'footer'> {
  children?: React.ReactNode;

  /** Preset size, overridden by width/height in style */
  size?: ModalSize;

  /** Header configuration, can be a simple title string or a full config object */
  header?: React.ReactNode | ModalHeaderConfig;

  /** Footer configuration, can be ReactNode or config object */
  footer?: React.ReactNode | ModalFooterConfig | null;

  /** Modal content area style configuration */
  contentStyle?: ModalContentStyleConfig;

  // === Backward-compatible Props ===
  /** @deprecated use header.title */
  title?: React.ReactNode;
  /** @deprecated use header.showClose */
  showCustomClose?: boolean;
}

// ==================== Style Constants ====================

const HEADER_BASE_CLASS = 'flex items-center justify-between pb-20px';
const TITLE_BASE_CLASS = 'text-18px font-500 text-t-primary m-0';
const CLOSE_BUTTON_CLASS =
  'w-32px h-32px flex items-center justify-center rd-8px transition-colors duration-200 cursor-pointer border-0 bg-transparent p-0 hover:bg-2 focus:outline-none';
const FOOTER_BASE_CLASS = 'flex-shrink-0 bg-transparent';

/**
 * Custom modal component
 *
 * Wrapper around Arco Design Modal with unified theme styling, preset sizes, and font scaling support
 *
 * @features
 * - Preset size support (small/medium/large/xlarge/full)
 * - Responsive to font scale changes
 * - Flexible header/footer configuration
 * - Backward compatible with old API
 * - Auto viewport adaptation
 *
 * @example
 * ```tsx
 * // Basic usage
 * <WaylandModal visible={true} onCancel={handleClose} header="Title">
 *   Content
 * </WaylandModal>
 *
 * // Preset size
 * <WaylandModal visible={true} size="large" header="Large Modal">
 *   Content
 * </WaylandModal>
 *
 * // Custom header
 * <WaylandModal
 *   visible={true}
 *   header={{
 *     title: "Custom Title",
 *     showClose: true,
 *     className: "custom-header"
 *   }}
 * >
 *   Content
 * </WaylandModal>
 *
 * // Custom footer
 * <WaylandModal
 *   visible={true}
 *   header="Title"
 *   footer={
 *     <div className="flex gap-2">
 *       <Button onClick={handleCancel}>Cancel</Button>
 *       <Button type="primary" onClick={handleOk}>Confirm</Button>
 *     </div>
 *   }
 * >
 *   Content
 * </WaylandModal>
 * ```
 */
const dimensionKeys = ['width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight'] as const;
type DimensionKey = (typeof dimensionKeys)[number];

const formatDimensionValue = (value?: string | number) => {
  if (value === undefined || value === null) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
};

const WaylandModal: React.FC<WaylandModalProps> = ({
  children,
  size,
  header,
  footer,
  contentStyle,
  // Backward compatibility
  title,
  showCustomClose = true,
  onCancel,
  className = '',
  style,
  ...props
}) => {
  const { fontScale } = useThemeContext();
  const { t } = useTranslation();
  // Process contentStyle config and convert to CSS variables
  const contentBg = contentStyle?.background || 'var(--dialog-fill-0)';
  const contentBorderRadius = contentStyle?.borderRadius || '16px';
  const contentPadding = contentStyle?.padding || '0';
  const contentOverflow = contentStyle?.overflow || 'auto';

  const borderRadiusVal = typeof contentBorderRadius === 'number' ? `${contentBorderRadius}px` : contentBorderRadius;
  const paddingVal = typeof contentPadding === 'number' ? `${contentPadding}px` : contentPadding;

  const safeScale = fontScale > 0 ? fontScale : 1;

  const scaleDimension = (value: CSSProperties['width']): CSSProperties['width'] => {
    if (value === undefined || value === null) return value;
    if (typeof value === 'number') {
      return Number((value / safeScale).toFixed(2));
    }
    const match = /^([0-9]+(?:\.[0-9]+)?)px$/i.exec(value.trim());
    if (match) {
      return `${parseFloat(match[1]) / safeScale}px`;
    }
    return value;
  };

  // Handle size scaling
  const modalSize = size ? MODAL_SIZES[size] : undefined;
  const baseStyle: CSSProperties = {
    ...modalSize,
    ...style,
  };

  // Scale size-related properties (avoid side effects)
  type DimensionStyle = Partial<Pick<CSSProperties, DimensionKey>>;
  const scaledStyle: DimensionStyle = {};
  dimensionKeys.forEach((key) => {
    const raw = baseStyle[key];
    if (raw !== undefined) {
      scaledStyle[key] = scaleDimension(raw as CSSProperties['width']) as CSSProperties[DimensionKey];
    }
  });

  const mergedStyle: CSSProperties = {
    ...baseStyle,
    ...scaledStyle,
  };

  // Auto set max dimensions to fit viewport
  if (typeof window !== 'undefined') {
    const viewportGap = 32;
    if (!mergedStyle.maxWidth) {
      mergedStyle.maxWidth = `calc(100vw - ${viewportGap}px)`;
    }
    if (!mergedStyle.maxHeight) {
      mergedStyle.maxHeight = `calc(100vh - ${viewportGap}px)`;
    }
  }

  const finalStyle: CSSProperties = {
    ...mergedStyle,
    borderRadius: mergedStyle.borderRadius ?? '16px',
  };

  const bodyInlineStyle = React.useMemo<CSSProperties>(() => {
    const style: CSSProperties = {
      background: contentBg,
      overflow: contentOverflow,
    };

    (['height', 'minHeight', 'maxHeight'] as const).forEach((key) => {
      const value = contentStyle?.[key];
      if (value !== undefined) {
        style[key] = formatDimensionValue(value);
      }
    });

    return style;
  }, [contentBg, paddingVal, contentOverflow, contentStyle?.height, contentStyle?.maxHeight, contentStyle?.minHeight]);

  // Handle Header configuration (backward compatible)
  const headerConfig: ModalHeaderConfig = React.useMemo(() => {
    // If using the new header config
    if (header !== undefined) {
      // If it's a string or ReactNode, convert to title config
      if (typeof header === 'string' || React.isValidElement(header)) {
        return {
          title: header,
          showClose: true,
        };
      }
      // If it's a config object
      return header as ModalHeaderConfig;
    }
    // Backward compat for old title and showCustomClose
    return {
      title,
      showClose: showCustomClose,
    };
  }, [header, title, showCustomClose]);

  // Handle Footer configuration
  const footerConfig: ModalFooterConfig | null = React.useMemo(() => {
    if (footer === null) {
      return null;
    }

    // When no footer provided, use the default template
    if (footer === undefined) {
      const cancelLabel = props.cancelText ?? t('common.cancel', { defaultValue: 'Cancel' });
      const okLabel = props.okText ?? t('common.confirm', { defaultValue: 'Confirm' });
      return {
        render: () => (
          <div className='flex justify-end gap-12px'>
            {/* Canonical recipe: secondary rectangular 8px, primary pill h-32px px-16px */}
            <Button onClick={onCancel} className='px-16px min-w-80px' style={{ borderRadius: 8 }}>
              {cancelLabel}
            </Button>
            <Button
              type='primary'
              onClick={props.onOk}
              loading={props.confirmLoading}
              className='min-w-80px'
            >
              {okLabel}
            </Button>
          </div>
        ),
      };
    }

    // If it's a ReactNode, wrap in a config object
    if (React.isValidElement(footer)) {
      return {
        render: () => footer,
      };
    }
    return footer as ModalFooterConfig;
  }, [footer, onCancel, props.cancelText, props.okText, props.onOk, props.confirmLoading, t]);

  // Render Header
  const renderHeader = () => {
    // If a custom render function was provided
    if (headerConfig.render) {
      return (
        <div className={headerConfig.className} style={headerConfig.style}>
          {headerConfig.render()}
        </div>
      );
    }

    // If there is no title and no close button, don't render header
    if (!headerConfig.title && !headerConfig.showClose) {
      return null;
    }

    // Default header layout
    const headerClassName = classNames(HEADER_BASE_CLASS, headerConfig.className);

    const headerStyle: CSSProperties = {
      borderBottom: '1px solid var(--color-border-2)',
      ...headerConfig.style,
    };

    return (
      <div className={headerClassName} style={headerStyle}>
        {headerConfig.title && <h3 className={TITLE_BASE_CLASS}>{headerConfig.title}</h3>}
        {headerConfig.showClose && (
          <button onClick={onCancel} className={CLOSE_BUTTON_CLASS} aria-label='Close'>
            {headerConfig.closeIcon || <X size={20} color='var(--color-text-3)' />}
          </button>
        )}
      </div>
    );
  };

  // Render Footer
  const renderFooter = () => {
    if (!footerConfig) {
      return null;
    }

    if (footerConfig.render) {
      const footerClassName = classNames(FOOTER_BASE_CLASS, footerConfig.className);
      return (
        <div className={footerClassName} style={footerConfig.style}>
          {footerConfig.render()}
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      {...props}
      title={null}
      closable={false}
      footer={null}
      onCancel={onCancel}
      className={`wayland-modal ${className}`}
      style={finalStyle}
      getPopupContainer={() => document.body}
    >
      <div className='wayland-modal-wrapper' style={{ borderRadius: borderRadiusVal }}>
        {renderHeader()}
        <div className='wayland-modal-body-content' style={bodyInlineStyle}>
          {children}
        </div>
        {renderFooter()}
      </div>
    </Modal>
  );
};

WaylandModal.displayName = 'WaylandModal';

export default WaylandModal;
