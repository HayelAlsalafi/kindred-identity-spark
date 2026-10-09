import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import {
  clearHistoryCache,
  historyQueryClientOptions,
  historyQueryOptions,
} from './practice-history-cache';

const a = { userId: 'learner-a', sessionId: 'session-a' };
const b = { userId: 'learner-b', sessionId: 'session-b' };
const params = { limit: 20, includeDetails: true };
const response = {
  items: [{ id: 'a', questionCode: 'CCNA-Q-000001', topicName: 'Routing' }],
  nextCursor: 'next_cursor',
};
const json = (value: unknown) =>
  new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });
let client: QueryClient;
let unsubscribers: (() => void)[] = [];
const fetchMock = vi.fn();
beforeEach(() => {
  client = new QueryClient();
  unsubscribers = [];
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  client.clear();
  vi.unstubAllGlobals();
});

describe('Practice history identity and request cache', () => {
  it('requests includeDetails without sending the identity to the API', async () => {
    fetchMock.mockResolvedValue(json(response));
    await client.fetchQuery(historyQueryClientOptions(params, a));
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      '/api/practice/history?limit=20&includeDetails=true',
      expect.objectContaining({
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      }),
    );
    expect(fetchMock.mock.calls[0][0]).not.toMatch(/learner-a|session-a|userId/);
  });

  it('keeps cursor and details in the cache key separately from user identity', () => {
    const next = { ...params, cursor: 'next_cursor' };
    const key = historyQueryOptions(next, a).query.queryKey;
    expect(key).toEqual(['/api/practice/history', next, a]);
    expect(key).not.toEqual(historyQueryOptions(params, a).query.queryKey);
    expect(key).not.toEqual(historyQueryOptions(next, b).query.queryKey);
  });

  it('removes all previous-user pages while retaining current history and public topics', () => {
    const first = historyQueryOptions(params, a).query.queryKey;
    const second = historyQueryOptions({ ...params, cursor: 'next_cursor' }, a).query.queryKey;
    const current = historyQueryOptions(params, b).query.queryKey;
    client.setQueryData(first, response);
    client.setQueryData(second, response);
    client.setQueryData(current, { items: [], nextCursor: null });
    client.setQueryData(['/api/topics'], ['Public']);
    clearHistoryCache(client, b, true);
    expect(client.getQueryData(first)).toBeUndefined();
    expect(client.getQueryData(second)).toBeUndefined();
    expect(client.getQueryData(current)).toEqual({ items: [], nextCursor: null });
    expect(client.getQueryData(['/api/topics'])).toEqual(['Public']);
  });

  it('cleans up a signed-out session without deleting another session of the same user', () => {
    const current = { ...a, sessionId: 'new-session' };
    const oldKey = historyQueryOptions(params, a).query.queryKey;
    const newKey = historyQueryOptions(params, current).query.queryKey;
    client.setQueryData(oldKey, response);
    client.setQueryData(newKey, response);
    clearHistoryCache(client, a, false);
    expect(client.getQueryData(oldKey)).toBeUndefined();
    expect(client.getQueryData(newKey)).toEqual(response);
  });

  it('does not reuse prior rows while the switched account is loading', async () => {
    fetchMock.mockResolvedValueOnce(json(response));
    const observer = new QueryObserver(client, historyQueryClientOptions(params, a));
    unsubscribers.push(observer.subscribe(() => {}));
    await vi.waitFor(() => expect(observer.getCurrentResult().isSuccess).toBe(true));
    fetchMock.mockImplementationOnce(() => new Promise(() => {}));
    observer.setOptions(historyQueryClientOptions(params, b));
    clearHistoryCache(client, b, true);
    expect(observer.getCurrentResult().data).toBeUndefined();
    expect(observer.getCurrentResult().isPending).toBe(true);
  });

  it('cancels the old request and prevents its late result from repopulating cache', async () => {
    let resolveRequest!: (value: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const observer = new QueryObserver(client, historyQueryClientOptions(params, a));
    unsubscribers.push(observer.subscribe(() => {}));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    clearHistoryCache(client, a, false);
    expect(signal.aborted).toBe(true);
    resolveRequest(json(response));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(client.getQueryData(historyQueryOptions(params, a).query.queryKey)).toBeUndefined();
  });
});
