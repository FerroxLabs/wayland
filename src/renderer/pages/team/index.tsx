import { Button, Spin } from '@arco-design/web-react';
import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import TeamPage from './TeamPage';

const TeamIndex: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: team, isLoading } = useSWR(id ? `team/${id}` : null, () => ipcBridge.team.get.invoke({ id: id! }));

  const handleBackToTeams = useCallback(() => {
    void Promise.resolve(navigate('/teams')).catch((error) => {
      console.error('Navigation back to /teams failed:', error);
    });
  }, [navigate]);

  if (isLoading) return <Spin loading />;

  // Live-smoke fix #2 (2026-05-19): a /team/<id> route that fails to
  // resolve must render an in-place error instead of falling through to
  // null (which previously let React Router show the launcher page's
  // own "Failed to load this team" branch - a UX dead-end since the
  // launcher is for *spawning* a team, not recovering from a broken
  // saved one). The in-place state names the failure mode, suggests
  // the most likely cause, and offers the user a single way out.
  if (!team) {
    return (
      <div
        data-testid='team-page-load-error'
        className='flex flex-col items-center justify-center h-full w-full px-24px gap-12px text-center'
      >
        <h2 className='text-18px font-semibold text-t-primary m-0'>
          {t('team.errors.loadFailed.title', { defaultValue: 'This team could not be loaded' })}
        </h2>
        <p className='text-13px text-t-secondary max-w-400px m-0'>
          {t('team.errors.loadFailed.body', {
            defaultValue:
              'It may have been deleted, or its data is no longer available. Head back to the Teams library to pick another team or start a new one.',
          })}
        </p>
        <Button
          type='primary'
          onClick={handleBackToTeams}
          data-testid='team-page-load-error-back-cta'
          className='mt-4px'
        >
          {t('team.errors.loadFailed.backCta', { defaultValue: 'Back to Teams' })}
        </Button>
      </div>
    );
  }

  return <TeamPage key={team.id} team={team} />;
};

export default TeamIndex;
