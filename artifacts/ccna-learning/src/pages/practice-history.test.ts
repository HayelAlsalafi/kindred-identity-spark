import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PracticeHistoryPage } from './practice-history';
import { historyPaginationReducer, initialHistoryPagination } from '../lib/history-pagination';

const { auth, historyQuery, refetch } = vi.hoisted(() => ({
  auth: vi.fn(),
  historyQuery: vi.fn(),
  refetch: vi.fn(),
}));
vi.mock('@clerk/react', () => ({ useAuth: auth }));
vi.mock('@workspace/api-client-react', async (importOriginal) => ({
  ...await importOriginal<typeof import('@workspace/api-client-react')>(),
  useGetPracticeHistory: historyQuery,
}));

const attempts = [
  { id: 'attempt-1', questionId: 'question-1', topicId: 'topic-1', selectedOptionKey: 'B', isCorrect: true, submittedAt: '2026-10-08T10:30:00.000Z' },
  { id: 'attempt-2', questionId: 'question-2', topicId: 'topic-2', selectedOptionKey: 'A', isCorrect: false, submittedAt: '2026-10-07T08:00:00.000Z' },
];
const result = (overrides = {}) => ({
  data: { items: attempts, nextCursor: 'older-attempts-cursor' },
  error: null, isLoading: false, isError: false, isFetching: false, refetch,
  ...overrides,
});
const render = () => renderToStaticMarkup(createElement(Router, { ssrPath: '/practice/history' }, createElement(PracticeHistoryPage)));
const button = (html: string, testId: string) => html.match(new RegExp('<button[^>]*data-testid="' + testId + '"[^>]*>'))?.[0] ?? '';

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockReturnValue({ isLoaded: true, isSignedIn: true, sessionId: 'session-one' });
  historyQuery.mockReturnValue(result());
});

describe('Practice history page', () => {
  it('waits for Clerk without requesting private history', () => {
    auth.mockReturnValue({ isLoaded: false, isSignedIn: undefined, sessionId: undefined });
    expect(render()).toContain('loading-history-auth');
    expect(historyQuery).not.toHaveBeenCalled();
  });

  it('requires sign-in without requesting or showing cached history', () => {
    auth.mockReturnValue({ isLoaded: true, isSignedIn: false, sessionId: null });
    const html = render();
    expect(html).toContain('history-sign-in-required');
    expect(html).toContain('href="/sign-in"');
    expect(html).not.toContain('question-1');
    expect(historyQuery).not.toHaveBeenCalled();
  });

  it('does not load history without a session identifier', () => {
    auth.mockReturnValue({ isLoaded: true, isSignedIn: true, sessionId: null });
    expect(render()).toContain('history-sign-in-required');
    expect(historyQuery).not.toHaveBeenCalled();
  });

  it('uses the existing hook with a session-scoped query key and no retained cache', () => {
    render();
    expect(historyQuery).toHaveBeenCalledWith({ limit: 20 }, {
      query: {
        queryKey: ['/api/practice/history', { limit: 20 }, { sessionId: 'session-one' }],
        retry: false, gcTime: 0, refetchOnMount: 'always',
      },
    });
    auth.mockReturnValue({ isLoaded: true, isSignedIn: true, sessionId: 'session-two' });
    render();
    expect(historyQuery.mock.lastCall?.[1].query.queryKey.at(-1)).toEqual({ sessionId: 'session-two' });
  });

  it('shows loading status and disables pagination during a request', () => {
    historyQuery.mockReturnValue(result({ data: undefined, isLoading: true, isFetching: true }));
    const html = render();
    expect(html).toContain('loading-practice-history');
    expect(html).toContain('aria-busy="true"');
    expect(button(html, 'button-history-next')).toContain('disabled');
    expect(button(html, 'button-history-previous')).toContain('disabled');
  });

  it('displays all required fields, repeated questions, correctness and machine-readable dates', () => {
    historyQuery.mockReturnValue(result({ data: { items: [attempts[0], { ...attempts[1], questionId: 'question-1' }], nextCursor: null } }));
    const html = render();
    expect(html.match(/data-testid="row-practice-history"/g)).toHaveLength(2);
    expect(html.split('<code>question-1</code>').length - 1).toBe(2);
    expect(html).toContain('<code>topic-1</code>');
    expect(html).toContain('<code>topic-2</code>');
    expect(html).toContain('history-answer">B</span>');
    expect(html).toContain('history-answer">A</span>');
    expect(html).toContain('Correct</span>');
    expect(html).toContain('Incorrect</span>');
    expect(html).toContain('dateTime="2026-10-08T10:30:00.000Z"');
    expect(html).toContain('scope="col"');
    expect(html).toContain('data-label="Question ID"');
  });

  it('handles an empty history and links to Practice', () => {
    historyQuery.mockReturnValue(result({ data: { items: [], nextCursor: null } }));
    const html = render();
    expect(html).toContain('No practice attempts yet.');
    expect(html).toContain('Start practicing');
    expect(html).not.toContain('table-practice-history');
    expect(button(html, 'button-history-next')).toContain('disabled');
  });

  it('enables Next only when the API returns nextCursor', () => {
    expect(button(render(), 'button-history-next')).not.toContain('disabled');
    expect(button(render(), 'button-history-previous')).toContain('disabled');
    historyQuery.mockReturnValue(result({ data: { items: attempts, nextCursor: null } }));
    expect(button(render(), 'button-history-next')).toContain('disabled');
  });

  it('blocks Next during background fetching', () => {
    historyQuery.mockReturnValue(result({ isFetching: true }));
    expect(button(render(), 'button-history-next')).toContain('disabled');
  });

  it('shows API errors with retry and hides stale results', () => {
    historyQuery.mockReturnValue(result({ isError: true, error: { status: 500 } }));
    const html = render();
    expect(html).toContain('error-practice-history');
    expect(html).toContain('button-retry-history');
    expect(html).not.toContain('question-1');
    expect(button(html, 'button-history-next')).toContain('disabled');
  });

  it('handles an expired session without exposing cached results', () => {
    historyQuery.mockReturnValue(result({ isError: true, error: { status: 401 } }));
    const html = render();
    expect(html).toContain('Your session could not be verified.');
    expect(html).toContain('Return to sign in');
    expect(html).not.toContain('question-1');
    expect(html).not.toContain('history-pagination');
  });

  it('distinguishes forbidden accounts from expired sessions', () => {
    historyQuery.mockReturnValue(result({ isError: true, error: { status: 403 } }));
    const html = render();
    expect(html).toContain('Access to practice history was denied.');
    expect(html).toContain('Ask an administrator');
    expect(html).not.toContain('Return to sign in');
    expect(html).not.toContain('question-1');
  });

  it('keeps malformed dates from crashing the page', () => {
    historyQuery.mockReturnValue(result({ data: { items: [{ ...attempts[0], submittedAt: 'invalid' }], nextCursor: null } }));
    expect(render()).toContain('Date unavailable');
  });
});

describe('History cursor pagination', () => {
  it('uses returned cursors and restores the exact previous cursor', () => {
    const second = historyPaginationReducer(initialHistoryPagination, { type: 'next', cursor: 'cursor-2' });
    const third = historyPaginationReducer(second, { type: 'next', cursor: 'cursor-3' });
    expect(second).toEqual([undefined, 'cursor-2']);
    expect(third).toEqual([undefined, 'cursor-2', 'cursor-3']);
    expect(historyPaginationReducer(third, { type: 'previous' })).toEqual(second);
    expect(historyPaginationReducer(second, { type: 'previous' })).toEqual(initialHistoryPagination);
  });

  it('stops at the first page and ignores empty or repeated cursors', () => {
    expect(historyPaginationReducer(initialHistoryPagination, { type: 'previous' })).toBe(initialHistoryPagination);
    expect(historyPaginationReducer(initialHistoryPagination, { type: 'next', cursor: '' })).toBe(initialHistoryPagination);
    const second = historyPaginationReducer(initialHistoryPagination, { type: 'next', cursor: 'cursor-2' });
    expect(historyPaginationReducer(second, { type: 'next', cursor: 'cursor-2' })).toBe(second);
  });

  it('resets an invalid cursor to the newest page', () => {
    expect(historyPaginationReducer([undefined, 'invalid-cursor'], { type: 'reset' })).toEqual([undefined]);
  });
});
