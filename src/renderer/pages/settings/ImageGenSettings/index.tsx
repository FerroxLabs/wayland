import React from 'react';
import { Button } from '@arco-design/web-react';
import { ImageIcon, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';

const ImageGenSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <SettingsPageShell
      title={t('settings.imageGenPage.title', 'Image Generation')}
      subtitle={t(
        'settings.imageGenPage.subtitle',
        'Pick which configured image-capable model the in-chat image generation tool should use by default.'
      )}
    >
      <div className='flex flex-col items-center gap-12px px-32px py-40px text-center rounded-12px border border-[var(--bg-3)] bg-[var(--bg-2)]'>
        <ImageIcon size={32} className='text-[var(--text-muted)]' />
        <h3 className='text-15px font-medium text-[var(--text-primary)] m-0'>
          {t('settings.imageGenPage.dedicatedPageTitle', 'Dedicated page coming next release')}
        </h3>
        <p className='text-13px text-[var(--text-muted)] m-0 max-w-[480px]'>
          {t(
            'settings.imageGenPage.dedicatedPageBody',
            'For now, configure the image generation default model in Skills & Tools → MCP & Voice. We are moving this to its own first-class page.'
          )}
        </p>
        <Button
          type='primary'
          icon={<ExternalLink size={14} />}
          onClick={() => navigate('/settings/skills')}
        >
          {t('settings.imageGenPage.openInSkills', 'Open in Skills & Tools')}
        </Button>
      </div>
    </SettingsPageShell>
  );
};

export default ImageGenSettings;
