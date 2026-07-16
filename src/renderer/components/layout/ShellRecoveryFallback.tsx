/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Button } from '@arco-design/web-react';
import { writeShellExperience } from '@renderer/hooks/ui/useShellExperience';

const ShellRecoveryFallback: React.FC<{ error: Error }> = ({ error }) => {
  const [recovering, setRecovering] = useState(false);

  const returnToClassic = async () => {
    setRecovering(true);
    try {
      await writeShellExperience('classic');
    } finally {
      setRecovering(false);
    }
  };

  return (
    <main className='size-full flex items-center justify-center bg-1 p-24px' data-testid='shell-recovery-fallback'>
      <section className='w-full max-w-520px rd-16px border border-solid border-border bg-2 p-24px shadow-lg'>
        <p className='m-0 text-12px font-semibold uppercase tracking-0.08em text-t-secondary'>Cockpit preview</p>
        <h1 className='mt-8px mb-8px text-22px text-t-primary'>This view could not open safely.</h1>
        <p className='m-0 mb-20px text-14px leading-22px text-t-secondary'>
          Your chats, Projects, settings, and agent state have not moved. Return to Classic to continue with the same
          data and route.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className='mb-16px max-h-120px overflow-auto rd-8px bg-fill-1 p-12px text-12px'>{error.message}</pre>
        )}
        <Button type='primary' loading={recovering} onClick={() => void returnToClassic()}>
          Return to Classic
        </Button>
      </section>
    </main>
  );
};

export default ShellRecoveryFallback;
