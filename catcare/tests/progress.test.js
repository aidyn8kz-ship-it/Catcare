import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Progress, ACHIEVEMENTS } from '../js/progress.js';
import { buildSpreads, spreadOfItem } from '../js/book.js';

const book = JSON.parse(readFileSync(new URL('../data/book.json', import.meta.url), 'utf-8'));
const outcome = (o = {}) => ({ conditionId: 'urinary', grade: 'great', stars: 3, severity: 0, hintUsed: true,
  hour: 12, checksUsed: 1, clinicId: 'near', ...o });

test('Test case 1', () => {
  assert.equal(book.items.length, 8);
  for (const i of book.items) {
    assert.ok(i.name_ru && i.why_ru && i.signs_ru && i.tip_ru, i.id);
    assert.ok(i.sources.length >= 2, i.id);
    assert.ok(['high', 'general', 'limited'].includes(i.confidence), i.id);
    assert.ok(i.sources.every(u => u.startsWith('https://')), i.id);
  }
});

test('Test case 2', () => {
  const p = new Progress(book);
  assert.equal(p.record(outcome({ grade: 'unneeded', stars: 1 })).page, null);
  assert.equal(p.pages.length, 0);
  assert.ok(p.record(outcome()).page);
  assert.equal(p.pages.length, 1);
  assert.ok(p.record(outcome({ grade: 'cautious', stars: 2 })).page);
  assert.equal(p.pages.length, 2);
});

test('Test case 3', () => {
  const p = new Progress(book);
  assert.equal(p.record(outcome({ conditionId: 'lily_poisoning' })).page.id, 'lilies');
});

test('Test case 4', () => {
  const p = new Progress(book);
  for (let i = 0; i < 12; i++) p.record(outcome());
  assert.equal(p.pages.length, 8);
  assert.equal(new Set(p.pages).size, 8);
});

test('Test case 5', () => {
  const p = new Progress(book);
  const r = p.record(outcome());
  const ids = r.achievements.map(a => a.id);
  assert.ok(ids.includes('guardian') && ids.includes('sharp_eye'));
});

test('Test case 6', () => {
  const p = new Progress(book);
  p.record(outcome());
  assert.ok(!p.record(outcome()).achievements.some(a => a.id === 'guardian'));
});

test('Test case 7', () => {
  const p = new Progress(book);
  assert.ok(!p.record(outcome({ hour: 12, clinicId: 'near' })).achievements.some(a => a.id === 'night_shift'));
  assert.ok(p.record(outcome({ hour: 23, clinicId: 'night' })).achievements.some(a => a.id === 'night_shift'));
});

test('Test case 8', () => {
  const p = new Progress(book);
  const r = p.record(outcome({ conditionId: 'false_alarm', grade: 'calm', stars: 3, hintUsed: false }));
  const ids = r.achievements.map(a => a.id);
  assert.ok(ids.includes('calm_head') && ids.includes('own_mind'));
  assert.ok(!ids.includes('guardian'));
});

test('Test case 9', () => {
  const p = new Progress(book);
  let veteran = false, librarian = false;
  for (let i = 0; i < 8; i++) {
    const ids = p.record(outcome()).achievements.map(a => a.id);
    if (ids.includes('veteran')) { veteran = true; assert.equal(p.episodes.length, 5); }
    if (ids.includes('librarian')) { librarian = true; assert.equal(p.pages.length, 8); }
  }
  assert.ok(veteran && librarian);
});

test('Test case 10', () => {
  for (const a of ACHIEVEMENTS) assert.ok(a.id && a.icon && a.title && a.desc && typeof a.test === 'function');
  assert.equal(new Set(ACHIEVEMENTS.map(a => a.id)).size, ACHIEVEMENTS.length);
});

test('Test case 11', () => {
  const p = new Progress(book);
  const page = p.record(outcome()).page;
  assert.deepEqual(p.unseenPages, [page.id]);
  assert.equal(p.markSeen(page.id), true);
  assert.equal(p.markSeen(page.id), false);
  assert.deepEqual(p.unseenPages, []);
});

test('Test case 12', () => {
  const a = new Progress(book);
  a.record(outcome()); a.record(outcome({ conditionId: 'lily_poisoning' }));
  a.markSeen(a.pages[0]);
  const b = new Progress(book);
  b.restore(JSON.parse(JSON.stringify(a.toJSON())));
  assert.deepEqual(b.toJSON(), a.toJSON());
  assert.equal(b.stars, a.stars);
});

test('Test case 13', () => {
  const p = new Progress(book);
  p.restore({ pages: ['lilies', 'unknown_page'], seen: ['unknown_page'] });
  assert.deepEqual(p.pages, ['lilies']);
  assert.deepEqual(p.seen, []);
  p.restore(null);
  assert.deepEqual(p.pages, ['lilies']);
});

test('Test case 16', () => {
  const s = buildSpreads(8);
  assert.equal(s.length, 6);
  assert.equal(s[0].left.type, 'cover');
  assert.equal(s.at(-1).left.type, 'emergency');
  const items = s.flatMap(x => [x.left, x.right]).filter(x => x.type === 'item').map(x => x.index);
  assert.deepEqual(items, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(spreadOfItem(0), 1); assert.equal(spreadOfItem(1), 1); assert.equal(spreadOfItem(7), 4);
  assert.equal(buildSpreads(3)[2].right.type, 'blank');       // Odd number of pages
});
