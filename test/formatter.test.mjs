import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeObjects, mergeLists } from '../src/utils/merge.js';

test('mergeObjects merges nested values', () => {
  const oldObj = { a: 1, b: { c: 2 } };
  const newObj = { b: { c: 3 }, d: 4 };
  const expected = { a: 1, b: { c: 3 }, d: 4 };
  assert.deepStrictEqual(mergeObjects(oldObj, newObj), expected);
});

test('mergeObjects skips null or undefined', () => {
  const oldObj = { a: 1 };
  const newObj = { a: null, b: undefined, c: 2 };
  const expected = { a: 1, c: 2 };
  assert.deepStrictEqual(mergeObjects(oldObj, newObj), expected);
});

test('mergeLists merges items by id', () => {
  const oldList = [ { id: 1, val: 'a' }, { id: 2, val: 'b' } ];
  const newList = [ { id: 2, val: 'c' }, { id: 3, val: 'd' } ];
  const expected = [ { id: 1, val: 'a' }, { id: 2, val: 'c' }, { id: 3, val: 'd' } ];
  assert.deepStrictEqual(mergeLists(oldList, newList), expected);
});

test('mergeObjects handles arrays via mergeLists', () => {
  const oldObj = { items: [ { id: 1, v: 'a' } ] };
  const newObj = { items: [ { id: 1, v: 'b' }, { id: 2, v: 'c' } ] };
  const expected = { items: [ { id: 1, v: 'b' }, { id: 2, v: 'c' } ] };
  assert.deepStrictEqual(mergeObjects(oldObj, newObj), expected);
});
