import {
  getPracticeHistoryWithDetailsQueryKey,
  getPracticeHistoryWithDetailsQueryOptions,
  type PracticeHistoryDetailsParams,
} from '@workspace/api-client-react';
import type { QueryClient } from '@tanstack/react-query';
import { sessionQueryKey, type ProgressIdentity } from './learning-progress-cache';

export function historyQueryOptions(
  params: PracticeHistoryDetailsParams,
  identity: ProgressIdentity,
) {
  return {
    query: {
      queryKey: sessionQueryKey(getPracticeHistoryWithDetailsQueryKey(params), identity),
      enabled: Boolean(identity.userId && identity.sessionId),
      retry: false as const,
      gcTime: 0,
      refetchOnMount: 'always' as const,
      placeholderData: () => undefined,
    },
    request: { credentials: 'same-origin' as const, cache: 'no-store' as const },
  };
}

export function historyQueryClientOptions(
  params: PracticeHistoryDetailsParams,
  identity: ProgressIdentity,
) {
  return getPracticeHistoryWithDetailsQueryOptions(params, historyQueryOptions(params, identity));
}

export function clearHistoryCache(
  client: QueryClient,
  identity: ProgressIdentity,
  otherSessions: boolean,
) {
  const filters = {
    predicate: (query: { queryKey: readonly unknown[] }) => {
      if (query.queryKey[0] !== '/api/practice/history') return false;
      const owner = query.queryKey.at(-1) as ProgressIdentity | undefined;
      const same = owner?.userId === identity.userId && owner?.sessionId === identity.sessionId;
      return otherSessions ? !same : same;
    },
  };
  void client.cancelQueries(filters);
  client.removeQueries(filters);
}
