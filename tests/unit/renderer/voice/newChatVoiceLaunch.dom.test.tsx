/**
 * Launching voice from the new-chat page.
 *
 * The welcome page has no conversation, and a voice session sends its turns
 * through a conversation's own send handler - so the button there cannot start
 * a session. It ARMS one, creates the conversation through the ordinary send
 * path, and the session provider that mounts on arrival begins listening.
 *
 * These tests pin the two halves of that handoff and the failure direction:
 * a send that never produced a conversation must not leave voice primed for
 * some unrelated chat the user opens later.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({
    children,
    icon,
    ...props
  }: React.ComponentProps<'button'> & { icon?: React.ReactNode; loading?: boolean }) => (
    <button {...props}>{icon ?? children}</button>
  ),
}));

vi.mock('lucide-react', () => ({ AudioWaveform: () => <span>waveform</span> }));

vi.mock('@/renderer/pages/conversation/voice/VoiceSessionContext', () => ({
  useVoiceSessionSafe: () => null,
}));

import VoiceModeEntryButton from '@/renderer/pages/conversation/voice/VoiceModeEntryButton';
import {
  armVoiceModeOnNextConversation,
  consumeArmedVoiceMode,
  disarmVoiceMode,
} from '@/renderer/pages/conversation/voice/voiceTurnBridge';

describe('arming voice for the conversation that does not exist yet', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('is not armed until something arms it', () => {
    expect(consumeArmedVoiceMode()).toBe(false);
  });

  it('survives the navigation that creates the conversation', () => {
    armVoiceModeOnNextConversation();

    expect(consumeArmedVoiceMode()).toBe(true);
  });

  it('is one-shot: a second conversation never inherits it', () => {
    armVoiceModeOnNextConversation();

    expect(consumeArmedVoiceMode()).toBe(true);
    expect(consumeArmedVoiceMode()).toBe(false);
  });

  it('can be cleared when the conversation was never created', () => {
    armVoiceModeOnNextConversation();
    disarmVoiceMode();

    expect(consumeArmedVoiceMode()).toBe(false);
  });
});

describe('the new-chat voice entry button', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('launches instead of opening a session it has no conversation for', () => {
    const onLaunch = vi.fn();
    render(<VoiceModeEntryButton onLaunch={onLaunch} />);

    fireEvent.click(screen.getByRole('button', { name: 'Talk with Wayland' }));

    expect(onLaunch).toHaveBeenCalledTimes(1);
  });

  it('carries the same name and title the composer uses, so it reads as one feature', () => {
    render(<VoiceModeEntryButton onLaunch={vi.fn()} />);

    const button = screen.getByRole('button', { name: 'Talk with Wayland' });
    expect(button.getAttribute('title')).toBe('Talk with Wayland — it answers out loud');
    expect(button.className).toContain('voice-mode-composer-entry');
  });

  it('is inert while a send is already in flight', () => {
    const onLaunch = vi.fn();
    render(<VoiceModeEntryButton onLaunch={onLaunch} disabled />);

    fireEvent.click(screen.getByRole('button', { name: 'Talk with Wayland' }));

    expect(onLaunch).not.toHaveBeenCalled();
  });
});

/**
 * The GuidPage handler, reproduced exactly. The page itself pulls in the whole
 * new-chat surface (agents, models, workflows, storage), which is not what is
 * under test here - the arm/disarm contract around `handleSend` is.
 */
const launchVoiceMode = (handleSend: () => Promise<boolean>) => {
  armVoiceModeOnNextConversation();
  return handleSend()
    .then((ok) => {
      if (!ok) disarmVoiceMode();
      return ok;
    })
    .catch(() => {
      disarmVoiceMode();
    });
};

describe('the launch handler leaves voice armed only when a conversation exists', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stays armed for the conversation the send created', async () => {
    await launchVoiceMode(async () => true);

    expect(consumeArmedVoiceMode()).toBe(true);
  });

  it('disarms when the send was refused (no model configured)', async () => {
    await launchVoiceMode(async () => false);

    expect(consumeArmedVoiceMode()).toBe(false);
  });

  it('disarms when creating the conversation threw', async () => {
    await launchVoiceMode(async () => {
      throw new Error('create failed');
    });

    expect(consumeArmedVoiceMode()).toBe(false);
  });
});
