import { describe, expect, it, vi } from 'vitest';
import { practiceResultHandler, practiceSessionKey } from './practice-session';
import { sessionQueryKey } from './learning-progress-cache';

const a = { userId: 'learner-a', sessionId: 'session-a' };
const b = { userId: 'learner-b', sessionId: 'session-b' };
const result = {
  isCorrect: true,
  correctOption: { optionKey: 'B', text: 'Answer' },
  explanation: 'Explanation',
};

describe('Practice session identity and late submission results', () => {
  it('remounts selected answer, grading result and mutation state for a different user', () => {
    expect(practiceSessionKey(a)).not.toBe(practiceSessionKey(b));
    expect(practiceSessionKey(a)).not.toBe(practiceSessionKey({ ...a, userId: b.userId }));
  });
  it('remounts for a new session of the same user and for sign-out', () => {
    expect(practiceSessionKey(a)).not.toBe(practiceSessionKey({ ...a, sessionId: 'new-session' }));
    expect(practiceSessionKey(a)).not.toBe(practiceSessionKey(null));
    expect(practiceSessionKey({ ...a })).toBe(practiceSessionKey(a));
  });
  it('separates cached practice questions by user and session', () => {
    const key = ['/api/practice/topics/routing/question'];
    expect(sessionQueryKey(key, a)).not.toEqual(sessionQueryKey(key, b));
    expect(sessionQueryKey(key, a)).not.toEqual(
      sessionQueryKey(key, { ...a, sessionId: 'new-session' }),
    );
  });
  it('applies a result only to the submitting active mounted session', () => {
    const setResult = vi.fn();
    practiceResultHandler(a, { current: a }, { current: true }, setResult)(result);
    expect(setResult).toHaveBeenCalledExactlyOnceWith(result);
  });
  it.each([b, { ...a, sessionId: 'new-session' }, null])(
    'ignores late results after switching identity to %s',
    (next) => {
      const active = { current: a as typeof a | null };
      const setResult = vi.fn();
      const onSuccess = practiceResultHandler(a, active, { current: true }, setResult);
      active.current = next;
      onSuccess(result);
      expect(setResult).not.toHaveBeenCalled();
    },
  );
  it('ignores results from an unmounted workspace even if the old account becomes active again', () => {
    const setResult = vi.fn();
    practiceResultHandler(a, { current: a }, { current: false }, setResult)(result);
    expect(setResult).not.toHaveBeenCalled();
  });
  it('never accepts an unauthenticated submission result', () => {
    const setResult = vi.fn();
    practiceResultHandler(null, { current: a }, { current: true }, setResult)(result);
    expect(setResult).not.toHaveBeenCalled();
  });
});
