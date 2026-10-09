import {
  getGetLearningProgressQueryKey,
  getGetLearningProgressQueryOptions,
} from '@workspace/api-client-react';
import type {
  PracticeAnswerResult,
  SubmitPracticeAnswerMutationVariables,
} from '@workspace/api-client-react';
import type { QueryClient, UseMutationOptions } from '@tanstack/react-query';

export type ProgressIdentity = { userId: string; sessionId: string };

export function progressIdentity(auth: {
  isLoaded: boolean;
  isSignedIn?: boolean;
  userId?: string | null;
  sessionId?: string | null;
}): ProgressIdentity | null {
  return auth.isLoaded && auth.isSignedIn && auth.userId && auth.sessionId
    ? { userId: auth.userId, sessionId: auth.sessionId }
    : null;
}

export function sessionQueryKey(base: readonly unknown[], identity: ProgressIdentity | null) {
  return [...base, identity] as const;
}

// Identity is local cache metadata only; the GET request has no user parameters.
export function learningProgressKey(identity: ProgressIdentity) {
  return sessionQueryKey(getGetLearningProgressQueryKey(), identity);
}

export function learningProgressOptions(identity: ProgressIdentity) {
  return {
    query: {
      queryKey: learningProgressKey(identity),
      enabled: Boolean(identity.userId && identity.sessionId),
      retry: false as const,
      gcTime: 0,
      refetchOnMount: 'always' as const,
      placeholderData: () => undefined,
    },
    request: { credentials: 'same-origin' as const, cache: 'no-store' as const },
  };
}

export function learningProgressQueryOptions(identity: ProgressIdentity) {
  return getGetLearningProgressQueryOptions(learningProgressOptions(identity));
}

export function removeOtherProgress(client: QueryClient, identity: ProgressIdentity | null) {
  const filters = {
    predicate: (query: { queryKey: readonly unknown[] }) => {
      if (query.queryKey[0] !== getGetLearningProgressQueryKey()[0]) return false;
      const owner = query.queryKey[1] as ProgressIdentity | undefined;
      return (
        !identity || owner?.userId !== identity.userId || owner?.sessionId !== identity.sessionId
      );
    },
  };
  // Cancellation consumes the generated query's AbortSignal; destruction also
  // prevents a late response from putting removed session data back in cache.
  void client.cancelQueries(filters);
  client.removeQueries(filters);
}

export function removeProgress(client: QueryClient, identity: ProgressIdentity) {
  const filters = { queryKey: learningProgressKey(identity), exact: true };
  void client.cancelQueries(filters);
  client.removeQueries(filters);
}

export function practiceProgressMutationOptions(
  client: QueryClient,
  identity: ProgressIdentity | null,
): Pick<
  UseMutationOptions<
    PracticeAnswerResult,
    unknown,
    SubmitPracticeAnswerMutationVariables,
    ProgressIdentity | null
  >,
  'onMutate' | 'onSuccess'
> {
  return {
    // Capture the submitting session, including if the observer later unmounts
    // or Clerk switches accounts while the submission is still pending.
    onMutate: () => (identity ? { ...identity } : null),
    onSuccess: async (_answer, _variables, submittingIdentity) => {
      if (submittingIdentity) {
        await client.invalidateQueries({
          queryKey: learningProgressKey(submittingIdentity),
          exact: true,
        });
      }
    },
  };
}
