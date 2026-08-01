/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type VoiceSessionState =
  | 'connecting'
  | 'listening'
  | 'user-speaking'
  | 'transcribing'
  | 'thinking'
  | 'acting'
  | 'approval-needed'
  | 'speaking'
  | 'interrupted'
  | 'reconnecting'
  | 'error'
  | 'ended';

export type VoiceSessionIdentity = {
  sessionId: string;
  conversationId: string;
  projectId?: string;
  actorId: string;
  modelId: string;
  authorityClass: 'ask' | 'trusted-edits';
  voiceId: string;
};

export type VoiceSessionSnapshot = VoiceSessionIdentity & {
  state: VoiceSessionState;
  activeTurnId: string | null;
  activeSegmentId: string | null;
  activeRunId: string | null;
  activeApprovalId: string | null;
  resumeState: VoiceSessionState | null;
  submittedTurnIds: readonly string[];
  synthesizedSegmentIds: readonly string[];
  interruptionPending: boolean;
  terminalErrorCode: string | null;
};

export type VoiceSessionEvent =
  | { type: 'connected' }
  | { type: 'speech_started' }
  | { type: 'speech_ended'; turnId: string }
  | { type: 'capture_cancelled' }
  | { type: 'transcription_ready'; turnId: string }
  | { type: 'action_started'; turnId: string; runId: string }
  | { type: 'action_finished'; turnId: string; runId: string }
  | { type: 'approval_required'; turnId: string; approvalId: string }
  | {
      type: 'approval_resolved';
      approvalId: string;
      decision: 'approved' | 'denied';
      source: 'visual' | 'keyboard' | 'voice';
    }
  | { type: 'response_segment_ready'; turnId: string; segmentId: string }
  | { type: 'playback_started'; turnId: string; segmentId: string }
  | { type: 'playback_completed'; turnId: string; segmentId: string }
  | { type: 'barge_in' }
  | { type: 'interruption_settled' }
  | { type: 'network_lost' }
  | { type: 'reconnected' }
  | { type: 'fail'; errorCode: string }
  | { type: 'change_voice'; voiceId: string }
  | { type: 'end' };

export type VoiceSessionEffect =
  | { type: 'start_capture' }
  | { type: 'stop_capture'; turnId: string }
  | { type: 'cancel_capture' }
  | { type: 'transcribe'; turnId: string }
  | { type: 'submit_turn'; turnId: string }
  | { type: 'synthesize_segment'; turnId: string; segmentId: string; voiceId: string }
  | { type: 'cancel_synthesis'; segmentId: string | null }
  | { type: 'stop_playback'; segmentId: string | null }
  | { type: 'announce_state'; state: VoiceSessionState };

export type VoiceSessionRejection =
  | 'invalid_transition'
  | 'turn_mismatch'
  | 'duplicate_turn'
  | 'duplicate_segment'
  | 'segment_mismatch'
  | 'run_mismatch'
  | 'approval_mismatch'
  | 'spoken_approval_forbidden'
  | 'interruption_already_pending'
  | 'invalid_identifier';

export type VoiceSessionTransition = {
  snapshot: VoiceSessionSnapshot;
  effects: readonly VoiceSessionEffect[];
  rejected?: VoiceSessionRejection;
};

const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

const reject = (snapshot: VoiceSessionSnapshot, rejected: VoiceSessionRejection): VoiceSessionTransition => ({
  snapshot,
  effects: [],
  rejected,
});

const announce = (state: VoiceSessionState): VoiceSessionEffect => ({
  type: 'announce_state',
  state,
});

const withState = (
  snapshot: VoiceSessionSnapshot,
  state: VoiceSessionState,
  patch: Partial<VoiceSessionSnapshot> = {}
): VoiceSessionSnapshot => ({ ...snapshot, ...patch, state });

const validIdentifier = (value: string): boolean => IDENTIFIER_PATTERN.test(value);

export function createVoiceSession(identity: VoiceSessionIdentity): VoiceSessionSnapshot {
  for (const value of [
    identity.sessionId,
    identity.conversationId,
    identity.actorId,
    identity.modelId,
    identity.voiceId,
  ]) {
    if (!validIdentifier(value)) throw new Error('VOICE_SESSION_INVALID_IDENTIFIER');
  }
  if (identity.projectId && !validIdentifier(identity.projectId)) {
    throw new Error('VOICE_SESSION_INVALID_IDENTIFIER');
  }
  return {
    ...identity,
    state: 'connecting',
    activeTurnId: null,
    activeSegmentId: null,
    activeRunId: null,
    activeApprovalId: null,
    resumeState: null,
    submittedTurnIds: [],
    synthesizedSegmentIds: [],
    interruptionPending: false,
    terminalErrorCode: null,
  };
}

export function transitionVoiceSession(
  snapshot: VoiceSessionSnapshot,
  event: VoiceSessionEvent
): VoiceSessionTransition {
  if (snapshot.state === 'ended') return reject(snapshot, 'invalid_transition');

  if (event.type === 'end') {
    const ended = withState(snapshot, 'ended', {
      activeTurnId: null,
      activeSegmentId: null,
      activeRunId: null,
      activeApprovalId: null,
      resumeState: null,
      interruptionPending: false,
    });
    return {
      snapshot: ended,
      effects: [
        { type: 'cancel_synthesis', segmentId: snapshot.activeSegmentId },
        { type: 'stop_playback', segmentId: snapshot.activeSegmentId },
        announce('ended'),
      ],
    };
  }

  if (event.type === 'fail') {
    const failed = withState(snapshot, 'error', {
      terminalErrorCode: event.errorCode,
      interruptionPending: false,
    });
    return { snapshot: failed, effects: [announce('error')] };
  }

  if (event.type === 'network_lost') {
    if (snapshot.state === 'reconnecting' || snapshot.state === 'error') {
      return reject(snapshot, 'invalid_transition');
    }
    const reconnecting = withState(snapshot, 'reconnecting', {
      resumeState: snapshot.state,
    });
    return {
      snapshot: reconnecting,
      effects: [
        { type: 'cancel_synthesis', segmentId: snapshot.activeSegmentId },
        { type: 'stop_playback', segmentId: snapshot.activeSegmentId },
        announce('reconnecting'),
      ],
    };
  }

  if (event.type === 'reconnected') {
    if (snapshot.state !== 'reconnecting') return reject(snapshot, 'invalid_transition');
    const resumedState =
      snapshot.resumeState === 'user-speaking' || snapshot.resumeState === 'speaking'
        ? 'listening'
        : (snapshot.resumeState ?? 'listening');
    const resumed = withState(snapshot, resumedState, {
      resumeState: null,
      activeSegmentId: null,
      interruptionPending: false,
    });
    return {
      snapshot: resumed,
      effects: [...(resumedState === 'listening' ? [{ type: 'start_capture' } as const] : []), announce(resumedState)],
    };
  }

  if (event.type === 'change_voice') {
    if (!validIdentifier(event.voiceId)) return reject(snapshot, 'invalid_identifier');
    return {
      snapshot: { ...snapshot, voiceId: event.voiceId },
      effects: [],
    };
  }

  if (event.type === 'connected') {
    if (snapshot.state !== 'connecting') return reject(snapshot, 'invalid_transition');
    const listening = withState(snapshot, 'listening');
    return {
      snapshot: listening,
      effects: [{ type: 'start_capture' }, announce('listening')],
    };
  }

  if (event.type === 'speech_started') {
    if (snapshot.state !== 'listening') return reject(snapshot, 'invalid_transition');
    const speaking = withState(snapshot, 'user-speaking');
    return { snapshot: speaking, effects: [announce('user-speaking')] };
  }

  if (event.type === 'speech_ended') {
    if (snapshot.state !== 'user-speaking') return reject(snapshot, 'invalid_transition');
    if (!validIdentifier(event.turnId)) return reject(snapshot, 'invalid_identifier');
    if (snapshot.submittedTurnIds.includes(event.turnId)) return reject(snapshot, 'duplicate_turn');
    const transcribing = withState(snapshot, 'transcribing', {
      activeTurnId: event.turnId,
      activeSegmentId: null,
      activeRunId: null,
      activeApprovalId: null,
    });
    return {
      snapshot: transcribing,
      effects: [
        { type: 'stop_capture', turnId: event.turnId },
        { type: 'transcribe', turnId: event.turnId },
        announce('transcribing'),
      ],
    };
  }

  if (event.type === 'capture_cancelled') {
    if (snapshot.state !== 'user-speaking') return reject(snapshot, 'invalid_transition');
    const listening = withState(snapshot, 'listening', {
      activeTurnId: null,
      activeSegmentId: null,
    });
    return {
      snapshot: listening,
      effects: [{ type: 'cancel_capture' }, announce('listening')],
    };
  }

  if (event.type === 'transcription_ready') {
    if (snapshot.state !== 'transcribing') return reject(snapshot, 'invalid_transition');
    if (snapshot.activeTurnId !== event.turnId) return reject(snapshot, 'turn_mismatch');
    if (snapshot.submittedTurnIds.includes(event.turnId)) return reject(snapshot, 'duplicate_turn');
    const thinking = withState(snapshot, 'thinking', {
      submittedTurnIds: [...snapshot.submittedTurnIds, event.turnId],
    });
    return {
      snapshot: thinking,
      effects: [{ type: 'submit_turn', turnId: event.turnId }, announce('thinking')],
    };
  }

  if (event.type === 'action_started') {
    if (snapshot.state !== 'thinking' && snapshot.state !== 'speaking') {
      return reject(snapshot, 'invalid_transition');
    }
    if (snapshot.activeTurnId !== event.turnId) return reject(snapshot, 'turn_mismatch');
    if (!validIdentifier(event.runId)) return reject(snapshot, 'invalid_identifier');
    const acting = withState(snapshot, 'acting', { activeRunId: event.runId });
    return { snapshot: acting, effects: [announce('acting')] };
  }

  if (event.type === 'action_finished') {
    if (snapshot.state !== 'acting') return reject(snapshot, 'invalid_transition');
    if (snapshot.activeTurnId !== event.turnId) return reject(snapshot, 'turn_mismatch');
    if (snapshot.activeRunId !== event.runId) return reject(snapshot, 'run_mismatch');
    const thinking = withState(snapshot, 'thinking', { activeRunId: null });
    return { snapshot: thinking, effects: [announce('thinking')] };
  }

  if (event.type === 'approval_required') {
    if (!['thinking', 'acting', 'speaking'].includes(snapshot.state)) {
      return reject(snapshot, 'invalid_transition');
    }
    if (snapshot.activeTurnId !== event.turnId) return reject(snapshot, 'turn_mismatch');
    if (!validIdentifier(event.approvalId)) return reject(snapshot, 'invalid_identifier');
    const approval = withState(snapshot, 'approval-needed', {
      activeApprovalId: event.approvalId,
    });
    return {
      snapshot: approval,
      effects: [
        { type: 'cancel_synthesis', segmentId: snapshot.activeSegmentId },
        { type: 'stop_playback', segmentId: snapshot.activeSegmentId },
        announce('approval-needed'),
      ],
    };
  }

  if (event.type === 'approval_resolved') {
    if (snapshot.state !== 'approval-needed') return reject(snapshot, 'invalid_transition');
    if (event.source === 'voice') return reject(snapshot, 'spoken_approval_forbidden');
    if (snapshot.activeApprovalId !== event.approvalId) {
      return reject(snapshot, 'approval_mismatch');
    }
    const nextState = event.decision === 'approved' ? 'thinking' : 'listening';
    const resolved = withState(snapshot, nextState, { activeApprovalId: null });
    return {
      snapshot: resolved,
      effects: [...(nextState === 'listening' ? [{ type: 'start_capture' } as const] : []), announce(nextState)],
    };
  }

  if (event.type === 'response_segment_ready') {
    if (!['thinking', 'acting', 'speaking'].includes(snapshot.state)) {
      return reject(snapshot, 'invalid_transition');
    }
    if (snapshot.activeTurnId !== event.turnId) return reject(snapshot, 'turn_mismatch');
    if (!validIdentifier(event.segmentId)) return reject(snapshot, 'invalid_identifier');
    if (snapshot.synthesizedSegmentIds.includes(event.segmentId)) {
      return reject(snapshot, 'duplicate_segment');
    }
    const speaking = withState(snapshot, 'speaking', {
      activeSegmentId: event.segmentId,
      synthesizedSegmentIds: [...snapshot.synthesizedSegmentIds, event.segmentId],
    });
    return {
      snapshot: speaking,
      effects: [
        {
          type: 'synthesize_segment',
          turnId: event.turnId,
          segmentId: event.segmentId,
          voiceId: snapshot.voiceId,
        },
        announce('speaking'),
      ],
    };
  }

  if (event.type === 'playback_started') {
    if (snapshot.state !== 'speaking') return reject(snapshot, 'invalid_transition');
    if (snapshot.activeTurnId !== event.turnId) return reject(snapshot, 'turn_mismatch');
    if (snapshot.activeSegmentId !== event.segmentId) return reject(snapshot, 'segment_mismatch');
    return { snapshot, effects: [] };
  }

  if (event.type === 'playback_completed') {
    if (snapshot.state !== 'speaking') return reject(snapshot, 'invalid_transition');
    if (snapshot.activeTurnId !== event.turnId) return reject(snapshot, 'turn_mismatch');
    if (snapshot.activeSegmentId !== event.segmentId) return reject(snapshot, 'segment_mismatch');
    const listening = withState(snapshot, 'listening', {
      activeTurnId: null,
      activeSegmentId: null,
      activeRunId: null,
    });
    return {
      snapshot: listening,
      effects: [{ type: 'start_capture' }, announce('listening')],
    };
  }

  if (event.type === 'barge_in') {
    if (snapshot.state !== 'speaking' && snapshot.state !== 'thinking' && snapshot.state !== 'acting') {
      return reject(snapshot, 'invalid_transition');
    }
    if (snapshot.interruptionPending) return reject(snapshot, 'interruption_already_pending');
    const interrupted = withState(snapshot, 'interrupted', {
      interruptionPending: true,
    });
    return {
      snapshot: interrupted,
      effects: [
        { type: 'cancel_synthesis', segmentId: snapshot.activeSegmentId },
        { type: 'stop_playback', segmentId: snapshot.activeSegmentId },
        announce('interrupted'),
      ],
    };
  }

  if (event.type === 'interruption_settled') {
    if (snapshot.state !== 'interrupted' || !snapshot.interruptionPending) {
      return reject(snapshot, 'invalid_transition');
    }
    const listening = withState(snapshot, 'listening', {
      activeTurnId: null,
      activeSegmentId: null,
      activeRunId: null,
      interruptionPending: false,
    });
    return {
      snapshot: listening,
      effects: [{ type: 'start_capture' }, announce('listening')],
    };
  }

  return reject(snapshot, 'invalid_transition');
}
