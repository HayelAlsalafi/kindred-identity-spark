import { describe, expect, it, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/pg-proxy';
vi.mock('@workspace/db', async () => ({ ...(await import('@workspace/db/schema')), db: {} }));
const { getPracticeHistory } = await import('./practice');
const user = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const other = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const question = '11111111-1111-4111-8111-111111111111';
const topic = '22222222-2222-4222-8222-222222222222';
const ids = [
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
];
const micros = (stamp: string) => {
  const base = Date.parse(stamp.replace(/\.\d+Z$/, '.000Z'));
  const fraction = stamp.match(/\.(\d+)Z$/)?.[1] ?? '';
  return BigInt(base) * 1000n + BigInt(fraction.padEnd(6, '0'));
};
function fakeDriver(times = ['123456', '123456', '123100', '123000', '122999']) {
  const data = times.map((fraction, index) => ({
    id: ids[index],
    owner: user,
    time: '2026-10-08T10:00:00.' + fraction + 'Z',
  }));
  data.push({
    id: '99999999-9999-4999-8999-999999999999',
    owner: other,
    time: '2026-10-08T10:00:00.123456Z',
  });
  const execute = vi.fn(async (statement: string, params: unknown[]) => {
    const boundary = params.length > 2 ? micros(String(params[1])) : null;
    const boundaryId = params.length > 2 ? String(params[3]) : '';
    const rows = data
      .filter(
        (row) =>
          row.owner === params[0] &&
          (boundary === null ||
            micros(row.time) < boundary ||
            (micros(row.time) === boundary && row.id < boundaryId)),
      )
      .sort((a, b) =>
        micros(a.time) === micros(b.time)
          ? b.id.localeCompare(a.id)
          : micros(a.time) > micros(b.time)
            ? -1
            : 1,
      )
      .slice(0, Number(params.at(-1)));
    return {
      rows: rows.map((row) => [
        row.id,
        question,
        topic,
        'B',
        true,
        row.time,
        ...(statement.includes('to_char') ? [row.time] : []),
        ...(statement.includes('question_code') ? ['CCNA-Q-000001', 'Routing'] : []),
      ]),
    };
  });
  return { db: drizzle(execute) as unknown as Parameters<typeof getPracticeHistory>[3], execute };
}
const encode = (submittedAt: string, id: string) =>
  Buffer.from(JSON.stringify({ submittedAt, id })).toString('base64url');

describe('history cursor timestamp precision regression', () => {
  it('paginates all rows within the same millisecond using exact timestamps and UUID ties', async () => {
    const { db, execute } = fakeDriver();
    let cursor: string | undefined;
    const returned: string[] = [];
    for (let index = 0; index < ids.length; index++) {
      const page = await getPracticeHistory(user, 1, cursor, db);
      returned.push(...page.items.map((row) => row.id));
      cursor = page.nextCursor ?? undefined;
      if (!cursor) break;
    }
    expect(returned).toEqual(ids);
    expect(new Set(returned).size).toBe(ids.length);
    expect(cursor).toBeUndefined();
    expect(execute.mock.calls[1][1][1]).toBe('2026-10-08T10:00:00.123456Z');
  });
  it('keeps old millisecond cursors accepted with their original boundary', async () => {
    const { db } = fakeDriver(['123000', '123000', '123000', '123000', '123000']);
    const page = await getPracticeHistory(user, 10, encode('2026-10-08T10:00:00.123Z', ids[1]), db);
    expect(page.items.map((x) => x.id)).toEqual(ids.slice(2));
  });
  it('preserves public submittedAt formatting and excludes the internal exact timestamp', async () => {
    const { db } = fakeDriver();
    const page = await getPracticeHistory(user, 1, undefined, db, true);
    expect(page.items[0].submittedAt).toBe('2026-10-08T10:00:00.123Z');
    expect(page.items[0]).not.toHaveProperty('submittedAtExact');
    expect(page.items[0]).toMatchObject({ questionCode: 'CCNA-Q-000001', topicName: 'Routing' });
  });
  it.each([
    '2026-02-30T10:00:00.123456Z',
    '2026-10-08T10:00:00.12345Z',
    '2026-10-08T10:00:00.1234567Z',
    '2026-10-08T10:00:00.123456+00:00',
  ])('rejects noncanonical or invalid cursor timestamp %s', async (timestamp) => {
    const { db, execute } = fakeDriver();
    await expect(getPracticeHistory(user, 1, encode(timestamp, ids[0]), db)).rejects.toThrow(
      'Invalid practice history cursor',
    );
    expect(execute).not.toHaveBeenCalled();
  });
});
