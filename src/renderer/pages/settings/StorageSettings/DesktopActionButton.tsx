import { Button, Tooltip } from '@arco-design/web-react';
import type { ButtonProps } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { isElectronDesktop } from '@renderer/utils/platform';

/**
 * A Storage action that depends on the desktop runtime - OS file dialogs (Open
 * directory, Export/Restore pickers) or direct local-filesystem access (Sync
 * folder). In the hosted browser WebUI those can't run, so the button is
 * rendered disabled with a clear "desktop app required" tooltip instead of
 * looking clickable while silently doing nothing (#83).
 *
 * On desktop it is a plain pass-through `Button`. The browser-side server-route
 * implementations of these actions are tracked separately; until they land this
 * keeps the affordance honest.
 */
const DesktopActionButton: React.FC<ButtonProps & { children: React.ReactNode }> = ({ children, ...buttonProps }) => {
  const { t } = useTranslation();

  if (isElectronDesktop()) {
    return <Button {...buttonProps}>{children}</Button>;
  }

  return (
    <Tooltip content={t('settings.storagePage.desktopOnly', 'Available in the desktop app')}>
      {/* A disabled button swallows pointer events, so wrap it for the tooltip. */}
      <span className='inline-flex'>
        <Button {...buttonProps} disabled onClick={undefined}>
          {children}
        </Button>
      </span>
    </Tooltip>
  );
};

export default DesktopActionButton;
