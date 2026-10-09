import type { PracticeAnswerResult } from '@workspace/api-client-react';
import type { ProgressIdentity } from './learning-progress-cache';

export function practiceSessionKey(identity: ProgressIdentity | null) {
  return identity ? JSON.stringify([identity.userId, identity.sessionId]) : 'anonymous';
}

// This ref belongs to the outer workspace and survives keyed session remounts.
export function practiceResultHandler(
  submittingIdentity: ProgressIdentity | null,
  activeIdentity: { current: ProgressIdentity | null },
  mounted: { current: boolean },
  setResult: (result: PracticeAnswerResult) => void,
) {
  return (result: PracticeAnswerResult) => {
    const current = activeIdentity.current;
    if (
      mounted.current &&
      submittingIdentity &&
      current &&
      submittingIdentity.userId === current.userId &&
      submittingIdentity.sessionId === current.sessionId
    ) {
      setResult(result);
    }
  };
}
