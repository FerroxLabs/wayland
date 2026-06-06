import type { TooltipProps } from '@arco-design/web-react';

/**
 * Mount container for tooltips inside the sider: attach the popup to the left sider root node,
 * so collapsing/closing the sider hides the tooltip with it and avoids leaving leftover content on screen.
 * See: https://github.com/FerroxLabs/wayland/issues/987
 */
export const getSiderPopupContainer = (_node: HTMLElement): Element =>
  document.querySelector('.layout-sider') || document.body;

const isNoHoverDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches;
};

const SIDER_TOOLTIP_CLASS = 'sider-tooltip-popup';

export const cleanupSiderTooltips = () => {
  if (typeof document === 'undefined') return;
  // Arco Tooltip occasionally leaves detached popup nodes; remove both scoped and global tooltip popups.
  document.querySelectorAll(`.${SIDER_TOOLTIP_CLASS}, .arco-tooltip-popup`).forEach((node) => node.remove());
};

export type SiderTooltipProps = Pick<
  TooltipProps,
  'className' | 'trigger' | 'disabled' | 'unmountOnExit' | 'popupHoverStay' | 'popupVisible' | 'getPopupContainer'
>;

export const getSiderTooltipProps = (enabled = false): SiderTooltipProps => {
  const disabled = !enabled || isNoHoverDevice();
  return {
    className: SIDER_TOOLTIP_CLASS,
    trigger: (disabled ? [] : 'hover') as 'hover' | 'hover'[],
    disabled,
    unmountOnExit: true,
    popupHoverStay: false,
    popupVisible: disabled ? false : undefined,
    getPopupContainer: getSiderPopupContainer,
  };
};
