import test from 'node:test';
import assert from 'node:assert/strict';

import { safeArray, timeAgo, parseDate } from '../src/utils/formatter.js';


test('safeArray returns an array or empty array', () => {
  assert.deepStrictEqual(safeArray([1, 2]), [1, 2]);
  assert.deepStrictEqual(safeArray(null), []);
});

test('timeAgo returns correct intervals', () => {
  const originalNow = Date.now;
  Date.now = () => new Date('2024-01-02T00:00:00Z').getTime();

  assert.strictEqual(timeAgo(new Date('2024-01-01T23:59:00Z')), '1m ago');
  assert.strictEqual(timeAgo(new Date('2024-01-01T23:00:00Z')), '1h ago');
  assert.strictEqual(timeAgo(new Date('2024-01-01T00:00:00Z')), '1d ago');

  Date.now = originalNow;
});

test('parseDate supports seconds and strings', () => {
  const ts = 60; // seconds
  assert.deepStrictEqual(parseDate(ts), new Date(ts * 1000));

  const iso = '2020-01-01T00:00:00Z';
  assert.deepStrictEqual(parseDate(iso), new Date(iso));
  assert.strictEqual(parseDate(null), null);
});
