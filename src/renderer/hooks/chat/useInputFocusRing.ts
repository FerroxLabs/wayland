import { useThemeContext } from '@/renderer/hooks/context/ThemeContext';

export const useInputFocusRing = () => {
  const { theme } = useThemeContext();
  const isDarkTheme = theme === 'dark';

  return {
    activeBorderColor: isDarkTheme ? 'rgba(255, 107, 53, 0.55)' : 'rgba(255, 107, 53, 0.65)',
    inactiveBorderColor: isDarkTheme ? 'var(--border-mid, #353535)' : 'var(--border-base, #e5e6eb)',
    activeShadow: isDarkTheme
      ? '0 0 0 1px rgba(255, 107, 53, 0.35), 0 0 24px rgba(255, 107, 53, 0.18), 0 8px 32px rgba(0, 0, 0, 0.4)'
      : '0 0 0 1px rgba(255, 107, 53, 0.25), 0 2px 24px rgba(255, 107, 53, 0.18)',
  };
};
