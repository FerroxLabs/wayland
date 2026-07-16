/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  createVoiceSession,
  transitionVoiceSession,
  type VoiceSessionEvent,
  type VoiceSessionSnapshot,
} from '@/common/voice/VoiceSessionMachine';

const create = (): VoiceSessionSnapshot =>
  createVoiceSession({
    sessionId: 'voice-session-1',
    conversationId: 'conversation-1',
    projectId: 'project-1',
    actorId: 'wayland-core',
    modelId: 'gpt-5-6-sol',
    authorityClass: 'ask',
    voiceId: 'ember',
  });

const apply = (initial: VoiceSessionSnapshot, ...events: VoiceSessionEvent[]): VoiceSessionSnapshot =>
  events.reduce((snapshot, event) => {
    const result = transitionVoiceSession(snapshot, event);
    expect(result.rejected).toBeUndefined();
    return result.snapshot;
  }, initial);

const reachThinking = (): VoiceSessionSnapshot =>
  apply(
    create(),
    { type: 'connected' },
    { type: 'speech_started' },
    { type: 'speech_ended', turnId: 'turn-1' },
    { type: 'transcription_ready', turnId: 'turn-1' }
  );

describe('VoiceSessionMachine', () => {
  it('runs one canonical turn and emits exactly one submit effect', () => {
    let snapshot = create();
    snapshot = transitionVoiceSession(snapshot, { type: 'connected' }).snapshot;
    snapshot = transitionVoiceSession(snapshot, { type: 'speech_started' }).snapshot;
    snapshot = transitionVoiceSession(snapshot, {
      type: 'speech_ended',
      turnId: 'turn-1',
    }).snapshot;
    const result = transitionVoiceSession(snapshot, {
      type: 'transcription_ready',
      turnId: 'turn-1',
    });

    expect(result.snapshot.state).toBe('thinking');
    expect(result.effects).toContainEqual({ type: 'submit_turn', turnId: 'turn-1' });
    expect(result.snapshot.submittedTurnIds).toEqual(['turn-1']);
  });

  it('cannot submit the same correlated turn twice', () => {
    const thinking = reachThinking();
    const replay = transitionVoiceSession(
      { ...thinking, state: 'transcribing' },
      { type: 'transcription_ready', turnId: 'turn-1' }
    );
    expect(replay.rejected).toBe('duplicate_turn');
    expect(replay.effects).toEqual([]);
  });

  it('cancels microphone capture without creating or submitting a turn', () => {
    const speaking = apply(create(), { type: 'connected' }, { type: 'speech_started' });
    const cancelled = transitionVoiceSession(speaking, { type: 'capture_cancelled' });
    expect(cancelled.snapshot.state).toBe('listening');
    expect(cancelled.snapshot.activeTurnId).toBeNull();
    expect(cancelled.snapshot.submittedTurnIds).toEqual([]);
    expect(cancelled.effects).toContainEqual({ type: 'cancel_capture' });
    expect(cancelled.effects.some((effect) => effect.type === 'submit_turn')).toBe(false);
  });

  it('synthesizes each response segment at most once', () => {
    const thinking = reachThinking();
    const first = transitionVoiceSession(thinking, {
      type: 'response_segment_ready',
      turnId: 'turn-1',
      segmentId: 'segment-1',
    });
    expect(first.effects).toContainEqual({
      type: 'synthesize_segment',
      turnId: 'turn-1',
      segmentId: 'segment-1',
      voiceId: 'ember',
    });

    const replay = transitionVoiceSession(first.snapshot, {
      type: 'response_segment_ready',
      turnId: 'turn-1',
      segmentId: 'segment-1',
    });
    expect(replay.rejected).toBe('duplicate_segment');
    expect(replay.effects).toEqual([]);
  });

  it('barge-in cancels synthesis and playback before capture resumes', () => {
    const speaking = apply(reachThinking(), {
      type: 'response_segment_ready',
      turnId: 'turn-1',
      segmentId: 'segment-1',
    });
    const interrupt = transitionVoiceSession(speaking, { type: 'barge_in' });
    expect(interrupt.snapshot.state).toBe('interrupted');
    expect(interrupt.effects).toEqual([
      { type: 'cancel_synthesis', segmentId: 'segment-1' },
      { type: 'stop_playback', segmentId: 'segment-1' },
      { type: 'announce_state', state: 'interrupted' },
    ]);
    expect(interrupt.effects).not.toContainEqual({ type: 'start_capture' });

    const settled = transitionVoiceSession(interrupt.snapshot, {
      type: 'interruption_settled',
    });
    expect(settled.snapshot.state).toBe('listening');
    expect(settled.effects).toContainEqual({ type: 'start_capture' });
  });

  it('forbids spoken approval and preserves the canonical checkpoint', () => {
    const approval = apply(reachThinking(), {
      type: 'approval_required',
      turnId: 'turn-1',
      approvalId: 'approval-1',
    });
    const spoken = transitionVoiceSession(approval, {
      type: 'approval_resolved',
      approvalId: 'approval-1',
      decision: 'approved',
      source: 'voice',
    });
    expect(spoken.rejected).toBe('spoken_approval_forbidden');
    expect(spoken.snapshot.state).toBe('approval-needed');
    expect(spoken.snapshot.activeApprovalId).toBe('approval-1');
  });

  it('accepts visual approval and keyboard denial only', () => {
    const approval = apply(reachThinking(), {
      type: 'approval_required',
      turnId: 'turn-1',
      approvalId: 'approval-1',
    });
    const approved = transitionVoiceSession(approval, {
      type: 'approval_resolved',
      approvalId: 'approval-1',
      decision: 'approved',
      source: 'visual',
    });
    expect(approved.snapshot.state).toBe('thinking');

    const secondApproval = apply(reachThinking(), {
      type: 'approval_required',
      turnId: 'turn-1',
      approvalId: 'approval-2',
    });
    const denied = transitionVoiceSession(secondApproval, {
      type: 'approval_resolved',
      approvalId: 'approval-2',
      decision: 'denied',
      source: 'keyboard',
    });
    expect(denied.snapshot.state).toBe('listening');
    expect(denied.effects).toContainEqual({ type: 'start_capture' });
  });

  it('voice selection cannot mutate actor, model, conversation, project, or authority', () => {
    const before = reachThinking();
    const changed = transitionVoiceSession(before, {
      type: 'change_voice',
      voiceId: 'nova',
    });
    expect(changed.snapshot).toMatchObject({
      voiceId: 'nova',
      actorId: before.actorId,
      modelId: before.modelId,
      conversationId: before.conversationId,
      projectId: before.projectId,
      authorityClass: before.authorityClass,
    });
    expect(changed.effects).toEqual([]);
  });

  it('reconnects conservatively to listening when audio was active', () => {
    const speaking = apply(reachThinking(), {
      type: 'response_segment_ready',
      turnId: 'turn-1',
      segmentId: 'segment-1',
    });
    const lost = transitionVoiceSession(speaking, { type: 'network_lost' });
    expect(lost.snapshot.state).toBe('reconnecting');
    expect(lost.effects).toContainEqual({
      type: 'stop_playback',
      segmentId: 'segment-1',
    });

    const reconnected = transitionVoiceSession(lost.snapshot, { type: 'reconnected' });
    expect(reconnected.snapshot.state).toBe('listening');
    expect(reconnected.effects).toContainEqual({ type: 'start_capture' });
  });

  it('ends from any non-terminal state and refuses later events', () => {
    const ended = transitionVoiceSession(reachThinking(), { type: 'end' });
    expect(ended.snapshot.state).toBe('ended');
    expect(ended.effects).toContainEqual({ type: 'stop_playback', segmentId: null });

    const later = transitionVoiceSession(ended.snapshot, { type: 'connected' });
    expect(later.rejected).toBe('invalid_transition');
    expect(later.effects).toEqual([]);
  });

  it('rejects malformed identity and correlation identifiers', () => {
    expect(() =>
      createVoiceSession({
        sessionId: '../escape',
        conversationId: 'conversation-1',
        actorId: 'wayland-core',
        modelId: 'gpt-5',
        authorityClass: 'ask',
        voiceId: 'ember',
      })
    ).toThrow('VOICE_SESSION_INVALID_IDENTIFIER');

    const speaking = apply(create(), { type: 'connected' }, { type: 'speech_started' });
    expect(transitionVoiceSession(speaking, { type: 'speech_ended', turnId: '../turn' }).rejected).toBe(
      'invalid_identifier'
    );
  });
});
