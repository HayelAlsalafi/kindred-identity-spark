// Keep the cursor that fetched each page so Previous uses the API's cursor contract.
export type HistoryPagination = Array<string | undefined>;
export type HistoryPaginationAction =
  | { type: 'next'; cursor: string }
  | { type: 'previous' }
  | { type: 'reset' };

export const initialHistoryPagination: HistoryPagination = [undefined];

export function historyPaginationReducer(state: HistoryPagination, action: HistoryPaginationAction): HistoryPagination {
  switch (action.type) {
    case 'next':
      return action.cursor && !state.includes(action.cursor) ? [...state, action.cursor] : state;
    case 'previous':
      return state.length > 1 ? state.slice(0, -1) : state;
    case 'reset':
      return initialHistoryPagination;
  }
}
