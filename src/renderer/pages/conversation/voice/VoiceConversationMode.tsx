/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageCircle, Mic, MicOff, Settings2, Square, Volume2, X } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useInRouterContext, useNavigate } from 'react-router-dom';
import type { VoiceSessionSnapshot } from '@/common/voice/VoiceSessionMachine';
import { useVoiceSessionSafe } from './VoiceSessionContext';
import './voice-conversation-mode.css';

/**
 * The full-screen orb.
 *
 * It used to BE the session - 764 lines of state machine with a view attached,
 * which is why the composer could not show voice state and why workflow-mode
 * surfaces had a dead button. Now it is one view of a session that exists
 * independently, and it renders only when that session is expanded.
 *
 * Navigation degrades instead of throwing. The orb now mounts wherever the
 * session does - around the whole layout - and some surfaces render that outside
 * a Router; ChatLayout already guards its own router bridge with
 * `useInRouterContext` for exactly this reason. `useNavigate` throws a hard
 * invariant there rather than returning something inert, so it is reached
 * through a child component that is only rendered when a Router exists, and the
 * no-Router path falls back to the hash route. Hooks cannot be called
 * conditionally, which is why this is two components rather than one branch.
 */

const OPEN_VOICE_SETTINGS_HASH = '#/settings/voice';

const RoutedOrb: React.FC<{ children: (openSettings: () => void) => React.ReactElement }> = ({ children }) => {
  const navigate = useNavigate();
  return children(() => navigate('/settings/voice'));
};

const STATE_COPY: Record<VoiceSessionSnapshot['state'], string> = {
  connecting: 'Connecting',
  listening: 'Tap to speak',
  'user-speaking': 'Listening',
  transcribing: 'Transcribing',
  thinking: 'Thinking',
  acting: 'Working',
  'approval-needed': 'Needs your approval',
  speaking: 'Speaking',
  interrupted: 'Stopping',
  reconnecting: 'Reconnecting',
  error: 'Voice needs attention',
  ended: 'Ended',
};

const VoiceConversationOrb: React.FC<{
  conversationTitle?: React.ReactNode;
  openVoiceSettings: () => void;
}> = ({ conversationTitle, openVoiceSettings }) => {
  const session = useVoiceSessionSafe();
  const [captionsVisible, setCaptionsVisible] = useState(true);

  if (!session?.isExpanded) return null;

  const {
    actorLabel,
    state,
    continuousArmed,
    endpointingAvailable,
    isMuted,
    lastTranscript,
    lastResponse,
    greetingText,
    error,
    level,
    ttsConfig,
    sttConfig,
    configReady,
    beginCapture,
    finishCapture,
    collapse,
    end,
    interrupt,
    toggleMute,
  } = session;

  const title = typeof conversationTitle === 'string' ? conversationTitle : 'Current conversation';

  const overlay = (
    <div className='voice-mode' role='dialog' aria-modal='true' aria-label='Wayland voice conversation'>
      <div className='voice-mode__topbar'>
        <div className='voice-mode__identity'>
          <span className='voice-mode__eyebrow'>VOICE · SAME CHAT</span>
          <strong>{title}</strong>
          <span>{actorLabel} · Permission: Ask</span>
        </div>
        <div className='voice-mode__top-actions'>
          <button type='button' onClick={openVoiceSettings} aria-label='Open Voice settings'>
            <Settings2 size={18} />
          </button>
          {/*
            These two did the same thing, because the orb was the whole surface
            and there was nowhere for a session to live once it closed.

            Now they differ, and the split matters: X is the universal "stop
            this" glyph, so leaving two live getUserMedia streams behind it is
            indefensible. X ends. Chat says "Return to Chat", which is exactly
            what collapsing does - the session keeps running and the composer
            carries it.
          */}
          <button type='button' onClick={collapse} aria-label='Return to Chat'>
            <MessageCircle size={18} />
            <span>Chat</span>
          </button>
          <button type='button' onClick={end} aria-label='Close Voice mode'>
            <X size={18} />
          </button>
        </div>
      </div>

      <main className='voice-mode__stage'>
        <div className='voice-mode__ambient voice-mode__ambient--one' />
        <div className='voice-mode__ambient voice-mode__ambient--two' />
        <button
          type='button'
          className={`voice-mode__orb voice-mode__orb--${state}`}
          style={{ '--voice-level': level } as React.CSSProperties}
          onClick={() => {
            if (state === 'listening') void beginCapture();
            else if (state === 'user-speaking') finishCapture();
            else if (['thinking', 'acting', 'speaking'].includes(state)) void interrupt();
          }}
          aria-label={
            state === 'listening'
              ? 'Start speaking'
              : state === 'user-speaking'
                ? 'Stop and send voice turn'
                : ['thinking', 'acting', 'speaking'].includes(state)
                  ? 'Interrupt'
                  : STATE_COPY[state]
          }
        >
          <span className='voice-mode__orb-core' />
          <span className='voice-mode__orb-ring' />
        </button>
        {/*
          The greeting is the state while it is sounding.

          The machine stays in `listening` throughout - the greeting is not a
          turn - so without this branch the orb would caption an assistant that
          is mid-sentence with "Tap to speak", which is the exact lie this
          replaces. The sentence itself is shown because it is the sentence
          being said, and it is already localized: it came out of a key.
        */}
        <div className='voice-mode__state' role='status' aria-live='polite'>
          <strong>
            {greetingText ?? (state === 'listening' && continuousArmed ? 'Listening for you' : STATE_COPY[state])}
          </strong>
          <span>
            {greetingText && 'Start talking whenever you like — you can speak over this.'}
            {!greetingText &&
              state === 'listening' &&
              (continuousArmed
                ? endpointingAvailable
                  ? 'Speak whenever you are ready — the mic reopens itself after every answer'
                  : 'The mic reopens after every answer — tap the orb when you are done speaking'
                : 'One tap starts the conversation; after that it stays open')}
            {state === 'user-speaking' &&
              (endpointingAvailable
                ? 'Pause when you are done, or tap to send now'
                : 'Tap the orb to send — nothing is listening for you to pause')}
            {state === 'thinking' && 'Your turn is running through the same chat and tools'}
            {state === 'acting' && 'Wayland is working; tap the orb to interrupt'}
            {state === 'speaking' && 'Tap the orb or press Escape to interrupt'}
            {state === 'approval-needed' && 'Return to Chat to review the exact action. Voice cannot approve it.'}
          </span>
        </div>

        {!configReady && (
          <div className='voice-mode__notice voice-mode__notice--setup'>
            <strong>Voice setup is incomplete</strong>
            <span>
              {!sttConfig?.enabled ? 'Speech input is off. ' : ''}
              {!ttsConfig?.enabled ? 'Speech output is off. ' : ''}
              Enable both to run a complete turn-based voice conversation.
            </span>
            <button type='button' onClick={openVoiceSettings}>
              Open Voice settings
            </button>
          </div>
        )}

        {error && (
          // Keyed on `seq` so a repeated refusal remounts the alert. Without it
          // an identical second refusal is invisible to a screen reader too:
          // `role="alert"` only announces on a content change.
          <div key={error.seq} className='voice-mode__notice voice-mode__notice--error' role='alert'>
            <strong>Nothing hidden</strong>
            <span>{error.message}</span>
          </div>
        )}

        {captionsVisible && (lastTranscript || lastResponse) && (
          <div className='voice-mode__captions' aria-label='Voice transcript'>
            {lastTranscript && (
              <p>
                <span>You</span>
                {lastTranscript}
              </p>
            )}
            {lastResponse && (
              <p>
                <span>{actorLabel}</span>
                {lastResponse}
              </p>
            )}
          </div>
        )}
      </main>

      <div className='voice-mode__controls'>
        <button type='button' className={isMuted ? 'is-active' : ''} onClick={toggleMute} aria-pressed={isMuted}>
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          <span>{isMuted ? 'Muted' : 'Mic on'}</span>
        </button>
        <button type='button' onClick={() => setCaptionsVisible((value) => !value)} aria-pressed={captionsVisible}>
          <span className='voice-mode__cc'>CC</span>
          <span>Captions</span>
        </button>
        <button
          type='button'
          disabled={!['thinking', 'acting', 'speaking'].includes(state)}
          onClick={() => void interrupt()}
        >
          <Square size={16} />
          <span>Interrupt</span>
        </button>
        <button type='button' onClick={openVoiceSettings}>
          <Volume2 size={18} />
          <span>{ttsConfig?.voice || 'Voice'}</span>
        </button>
        <button type='button' className='voice-mode__end' onClick={end}>
          <X size={18} />
          <span>End</span>
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : null;
};

/**
 * Picks the navigation strategy the surrounding tree can actually support.
 */
const VoiceConversationMode: React.FC<{ conversationTitle?: React.ReactNode }> = ({ conversationTitle }) => {
  const isInRouter = useInRouterContext();
  if (!isInRouter) {
    return (
      <VoiceConversationOrb
        conversationTitle={conversationTitle}
        openVoiceSettings={() => {
          if (typeof window !== 'undefined') window.location.hash = OPEN_VOICE_SETTINGS_HASH;
        }}
      />
    );
  }
  return (
    <RoutedOrb>
      {(openVoiceSettings) => (
        <VoiceConversationOrb conversationTitle={conversationTitle} openVoiceSettings={openVoiceSettings} />
      )}
    </RoutedOrb>
  );
};

export default VoiceConversationMode;
